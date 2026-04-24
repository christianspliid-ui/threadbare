import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { RENDER_ORDER } from '../RenderLayers';
import {
  RARITY_SIGNIFIER_STATIC_OPACITY,
  RARITY_SIGNIFIER_PULSE_MIN_OPACITY,
  RARITY_SIGNIFIER_PULSE_MAX_OPACITY,
} from '../rarityVisualConstants';
import type { LocationNode } from '../LocationIconMesh';

vi.stubGlobal('document', {
  createElement: (tag: string) => {
    if (tag === 'canvas') {
      return {
        width: 0,
        height: 0,
        getContext: () => ({
          globalAlpha: 1,
          strokeStyle: '',
          lineWidth: 0,
          beginPath: vi.fn(),
          arc: vi.fn(),
          stroke: vi.fn(),
        }),
      };
    }
    return null;
  },
});

vi.mock('three', async () => {
  const actual = await vi.importActual<typeof THREE>('three');
  class CanvasTextureMock {
    needsUpdate = false;
    isTexture = true;
    constructor(_canvas: unknown) {}
    dispose() {}
  }
  return {
    ...actual,
    CanvasTexture: CanvasTextureMock,
  };
});

function makeLocation(
  overrides: Partial<LocationNode> = {},
): LocationNode {
  return {
    locationType: 'city',
    hexCol: 3,
    hexRow: 4,
    name: 'Test Location',
    ...overrides,
  };
}

describe('LocationRaritySignifierMesh', () => {
  let createLocationRaritySignifierLayer: typeof import('../LocationRaritySignifierMesh').createLocationRaritySignifierLayer;
  let tickLocationRaritySignifiers: typeof import('../LocationRaritySignifierMesh').tickLocationRaritySignifiers;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('../LocationRaritySignifierMesh');
    createLocationRaritySignifierLayer = mod.createLocationRaritySignifierLayer;
    tickLocationRaritySignifiers = mod.tickLocationRaritySignifiers;
  });

  it('createLocationRaritySignifierLayer([]) returns render-ordered empty group', () => {
    const layer = createLocationRaritySignifierLayer([]);
    expect(layer.signifierGroup).toBeInstanceOf(THREE.Group);
    expect(layer.signifierGroup.renderOrder).toBe(RENDER_ORDER.LOCATION_RARITY_SIGNIFIER);
    expect(layer.signifierGroup.children).toHaveLength(0);
  });

  it('locations with rarityTier undefined produce zero sprites', () => {
    const layer = createLocationRaritySignifierLayer([
      makeLocation({ rarityTier: undefined }),
    ]);
    expect(layer.signifierGroup.children).toHaveLength(0);
  });

  it('locations with rarityTier 1 or 2 produce zero sprites', () => {
    const layer = createLocationRaritySignifierLayer([
      makeLocation({ name: 'Tier One', rarityTier: 1 }),
      makeLocation({ name: 'Tier Two', rarityTier: 2 }),
    ]);
    expect(layer.signifierGroup.children).toHaveLength(0);
  });

  it('rarityTier 3 produces one sprite with static opacity', () => {
    const layer = createLocationRaritySignifierLayer([
      makeLocation({ rarityTier: 3 }),
    ]);
    expect(layer.signifierGroup.children).toHaveLength(1);
    expect(layer.materials).toHaveLength(1);
    expect(layer.pulsingMaterials).toHaveLength(0);
    expect(layer.materials[0].opacity).toBe(RARITY_SIGNIFIER_STATIC_OPACITY);
  });

  it('rarityTier 4 produces one pulsing sprite material', () => {
    const layer = createLocationRaritySignifierLayer([
      makeLocation({ rarityTier: 4 }),
    ]);
    expect(layer.signifierGroup.children).toHaveLength(1);
    expect(layer.materials).toHaveLength(1);
    expect(layer.pulsingMaterials).toHaveLength(1);
  });

  it('tick keeps pulsing material opacity within configured bounds', () => {
    const layer = createLocationRaritySignifierLayer([
      makeLocation({ rarityTier: 4 }),
      makeLocation({ name: 'Legendary 2', hexCol: 8, rarityTier: 4 }),
    ]);

    tickLocationRaritySignifiers(layer, 0);
    for (const material of layer.pulsingMaterials) {
      expect(material.opacity).toBeGreaterThanOrEqual(RARITY_SIGNIFIER_PULSE_MIN_OPACITY);
      expect(material.opacity).toBeLessThanOrEqual(RARITY_SIGNIFIER_PULSE_MAX_OPACITY);
    }
  });

  it('invalid rarity tiers produce zero sprites and do not throw', () => {
    expect(() => createLocationRaritySignifierLayer([
      makeLocation({ name: 'NaN', rarityTier: Number.NaN }),
      makeLocation({ name: 'Too High', rarityTier: 99 }),
      makeLocation({ name: 'Zero', rarityTier: 0 }),
    ])).not.toThrow();

    const layer = createLocationRaritySignifierLayer([
      makeLocation({ name: 'NaN', rarityTier: Number.NaN }),
      makeLocation({ name: 'Too High', rarityTier: 99 }),
      makeLocation({ name: 'Zero', rarityTier: 0 }),
    ]);
    expect(layer.signifierGroup.children).toHaveLength(0);
  });

  it('dispose clears children and is safe when called twice', () => {
    const layer = createLocationRaritySignifierLayer([
      makeLocation({ rarityTier: 3 }),
    ]);
    expect(layer.signifierGroup.children).toHaveLength(1);

    expect(() => layer.dispose()).not.toThrow();
    expect(layer.signifierGroup.children).toHaveLength(0);
    expect(() => layer.dispose()).not.toThrow();
  });
});
