import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { RENDER_ORDER } from '../RenderLayers';
import {
  REACH_SIGNATURE_STATIC_OPACITY,
  RIFT_PULSE_MIN_OPACITY,
  RIFT_PULSE_MAX_OPACITY,
} from '../reachSignatureVisualConstants';
import type { ReachSignatureMarker } from '../../../../engine/reachSignatureMarkers';

// Full 2D-context stub — the glyph drawers use path + fill primitives.
vi.stubGlobal('document', {
  createElement: (tag: string) => {
    if (tag === 'canvas') {
      return {
        width: 0,
        height: 0,
        getContext: () => ({
          globalAlpha: 1,
          strokeStyle: '',
          fillStyle: '',
          lineWidth: 0,
          lineCap: '',
          beginPath: vi.fn(),
          arc: vi.fn(),
          moveTo: vi.fn(),
          lineTo: vi.fn(),
          quadraticCurveTo: vi.fn(),
          closePath: vi.fn(),
          stroke: vi.fn(),
          fill: vi.fn(),
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
  return { ...actual, CanvasTexture: CanvasTextureMock };
});

const warhost = (id = 'army-1'): ReachSignatureMarker => ({ kind: 'warhost', id, hexCol: 3, hexRow: 4 });
const rift = (id = 'rift-1'): ReachSignatureMarker => ({ kind: 'rift', id, hexCol: 5, hexRow: 6, sphere: 'mind' });
const wonder = (id = 'gw-1'): ReachSignatureMarker => ({ kind: 'wonder', id, hexCol: 8, hexRow: 2 });

describe('ReachSignatureSignifierMesh', () => {
  let createReachSignatureSignifierLayer: typeof import('../ReachSignatureSignifierMesh').createReachSignatureSignifierLayer;
  let tickReachSignatureSignifiers: typeof import('../ReachSignatureSignifierMesh').tickReachSignatureSignifiers;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('../ReachSignatureSignifierMesh');
    createReachSignatureSignifierLayer = mod.createReachSignatureSignifierLayer;
    tickReachSignatureSignifiers = mod.tickReachSignatureSignifiers;
  });

  it('empty input returns a render-ordered empty group', () => {
    const layer = createReachSignatureSignifierLayer([]);
    expect(layer.signifierGroup).toBeInstanceOf(THREE.Group);
    expect(layer.signifierGroup.renderOrder).toBe(RENDER_ORDER.REACH_SIGNATURE_SIGNIFIER);
    expect(layer.signifierGroup.children).toHaveLength(0);
    expect(layer.materials).toHaveLength(0);
    expect(layer.pulsingMaterials).toHaveLength(0);
  });

  it('builds one sprite per marker across all three kinds', () => {
    const layer = createReachSignatureSignifierLayer([warhost(), rift(), wonder()]);
    expect(layer.signifierGroup.children).toHaveLength(3);
    expect(layer.materials).toHaveLength(3);
  });

  it('warhost + wonder are static; only the rift pulses', () => {
    const layer = createReachSignatureSignifierLayer([warhost(), wonder(), rift()]);
    expect(layer.pulsingMaterials).toHaveLength(1);
    const statics = layer.materials.filter((m) => !layer.pulsingMaterials.includes(m));
    expect(statics).toHaveLength(2);
    for (const m of statics) expect(m.opacity).toBe(REACH_SIGNATURE_STATIC_OPACITY);
    expect(layer.pulsingMaterials[0].opacity).toBe(RIFT_PULSE_MIN_OPACITY);
  });

  it('positions a sprite at the marker hex (world-space, non-origin)', () => {
    const layer = createReachSignatureSignifierLayer([wonder()]);
    const sprite = layer.signifierGroup.children[0] as THREE.Sprite;
    // hex (8,2) is not the origin → world x/y are non-zero.
    expect(sprite.position.x).not.toBe(0);
    expect(sprite.position.z).toBeCloseTo(0.078, 3);
  });

  it('tick moves the rift opacity within its pulse band; no-op without rifts', () => {
    const rifted = createReachSignatureSignifierLayer([rift()]);
    tickReachSignatureSignifiers(rifted, 0.65); // quarter period → near peak
    const op = rifted.pulsingMaterials[0].opacity;
    expect(op).toBeGreaterThanOrEqual(RIFT_PULSE_MIN_OPACITY);
    expect(op).toBeLessThanOrEqual(RIFT_PULSE_MAX_OPACITY);

    const staticOnly = createReachSignatureSignifierLayer([warhost()]);
    expect(() => tickReachSignatureSignifiers(staticOnly, 1.0)).not.toThrow();
    expect(staticOnly.materials[0].opacity).toBe(REACH_SIGNATURE_STATIC_OPACITY);
  });

  it('is deterministic: same markers → same sprite count and positions', () => {
    const a = createReachSignatureSignifierLayer([warhost(), rift(), wonder()]);
    const b = createReachSignatureSignifierLayer([warhost(), rift(), wonder()]);
    expect(a.signifierGroup.children.length).toBe(b.signifierGroup.children.length);
    for (let i = 0; i < a.signifierGroup.children.length; i++) {
      expect(a.signifierGroup.children[i].position.x).toBe(b.signifierGroup.children[i].position.x);
      expect(a.signifierGroup.children[i].position.y).toBe(b.signifierGroup.children[i].position.y);
    }
  });

  it('dispose clears the group and disposes materials', () => {
    const layer = createReachSignatureSignifierLayer([warhost(), rift()]);
    const spies = layer.materials.map((m) => vi.spyOn(m, 'dispose'));
    layer.dispose();
    expect(layer.signifierGroup.children).toHaveLength(0);
    for (const s of spies) expect(s).toHaveBeenCalled();
  });
});
