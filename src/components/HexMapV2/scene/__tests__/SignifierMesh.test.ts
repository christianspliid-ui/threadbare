/**
 * SignifierMesh.test.ts — Unit tests for the signifier sprite scene module.
 *
 * Mocks document.createElement (canvas) and THREE.CanvasTexture so tests run
 * in jsdom without requiring a full WebGL context.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import type { HexTile } from '../../../../types';
import { RENDER_ORDER } from '../RenderLayers';

// ── Mocks ──────────────────────────────────────────────────────────────────

// Mock document.createElement to return a minimal canvas stub
vi.stubGlobal('document', {
  createElement: (tag: string) => {
    if (tag === 'canvas') {
      return {
        width: 0,
        height: 0,
        getContext: () => ({
          save: vi.fn(),
          restore: vi.fn(),
          scale: vi.fn(),
          translate: vi.fn(),
          clip: vi.fn(),
          fill: vi.fn(),
          beginPath: vi.fn(),
          closePath: vi.fn(),
          fillRect: vi.fn(),
          fillStyle: '',
          globalAlpha: 1,
        }),
      };
    }
    return null;
  },
});

// Mock Path2D (not available in jsdom)
vi.stubGlobal('Path2D', class {
  constructor(_d?: string) {}
});

// Mock THREE.CanvasTexture to avoid GPU operations
vi.mock('three', async () => {
  const actual = await vi.importActual<typeof THREE>('three');
  class CanvasTextureMock {
    needsUpdate = false;
    constructor(_canvas: unknown) {}
  }
  return {
    ...actual,
    CanvasTexture: CanvasTextureMock,
  };
});

// ── Helpers ────────────────────────────────────────────────────────────────

function makeTile(
  col: number,
  row: number,
  terrain: string = 'grassland',
): HexTile {
  return {
    coord: { col, row },
    geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 },
    terrain: terrain as HexTile['terrain'],
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('SignifierMesh', () => {
  // Import after mocks are set up
  let createSignifierMesh: (tiles: HexTile[], seed: number, centeredLocationHexes?: Set<string>) => THREE.Group;
  let SIGNIFIER_SPRITE_SCALE: number;
  let SIGNIFIER_Z: number;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('../SignifierMesh');
    createSignifierMesh = mod.createSignifierMesh;
    SIGNIFIER_SPRITE_SCALE = mod.SIGNIFIER_SPRITE_SCALE;
    SIGNIFIER_Z = mod.SIGNIFIER_Z;
  });

  it('exports SIGNIFIER_SPRITE_SCALE = 1.3', () => {
    expect(SIGNIFIER_SPRITE_SCALE).toBe(1.3);
  });

  it('exports SIGNIFIER_Z = 0.07', () => {
    expect(SIGNIFIER_Z).toBe(0.07);
  });

  it('returns a THREE.Group', () => {
    const group = createSignifierMesh([], 42);
    expect(group).toBeInstanceOf(THREE.Group);
  });

  it('group.renderOrder equals RENDER_ORDER.SIGNIFIERS (7)', () => {
    const group = createSignifierMesh([], 42);
    expect(group.renderOrder).toBe(RENDER_ORDER.SIGNIFIERS);
    expect(group.renderOrder).toBe(7);
  });

  it('empty tiles array returns empty group', () => {
    const group = createSignifierMesh([], 42);
    expect(group.children.length).toBe(0);
  });

  it('water-type tiles produce no sprites', () => {
    const waterTiles: HexTile[] = [
      makeTile(0, 0, 'ocean'),
      makeTile(1, 0, 'deep_ocean'),
      makeTile(2, 0, 'tropical_ocean'),
      makeTile(3, 0, 'coastal_shallows'),
      makeTile(4, 0, 'coast'),
      makeTile(5, 0, 'lake'),
      makeTile(6, 0, 'river'),
      makeTile(7, 0, 'reef'),
    ];
    const group = createSignifierMesh(waterTiles, 42);
    expect(group.children.length).toBe(0);
  });

  it('land-type tiles produce at least one sprite', () => {
    const landTiles: HexTile[] = [
      makeTile(0, 0, 'grassland'),
      makeTile(1, 0, 'grassland'),
      makeTile(2, 0, 'grassland'),
    ];
    const group = createSignifierMesh(landTiles, 42);
    expect(group.children.length).toBeGreaterThan(0);
  });

  it('mixed water and land tiles — only land tiles get sprites', () => {
    const tiles: HexTile[] = [
      makeTile(0, 0, 'ocean'),
      makeTile(1, 0, 'grassland'),
      makeTile(2, 0, 'ocean'),
      makeTile(3, 0, 'grassland'),
    ];
    const group = createSignifierMesh(tiles, 42);
    // 2 land tiles should produce 2 sprites
    expect(group.children.length).toBe(2);
  });

  it('unknown terrain type is silently skipped (fail-soft)', () => {
    const tiles: HexTile[] = [
      makeTile(0, 0, 'unknown_terrain_xyz' as HexTile['terrain']),
    ];
    // Should not throw
    expect(() => createSignifierMesh(tiles, 42)).not.toThrow();
    const group = createSignifierMesh(tiles, 42);
    expect(group.children.length).toBe(0);
  });

  it('hexes with centered locations are skipped when centeredLocationHexes is provided', () => {
    const tiles: HexTile[] = [
      makeTile(0, 0, 'grassland'),
      makeTile(1, 0, 'grassland'),
      makeTile(2, 0, 'grassland'),
    ];
    // Without exclusion: all 3 land tiles get sprites
    const groupAll = createSignifierMesh(tiles, 42);
    expect(groupAll.children.length).toBe(3);

    // With hex (1,0) excluded: only 2 sprites
    const excluded = new Set(['1,0']);
    const groupFiltered = createSignifierMesh(tiles, 42, excluded);
    expect(groupFiltered.children.length).toBe(2);
  });

  it('centeredLocationHexes does not affect hexes without locations', () => {
    const tiles: HexTile[] = [
      makeTile(5, 5, 'grassland'),
    ];
    // Exclude a hex that doesn't exist in tiles — no effect
    const excluded = new Set(['99,99']);
    const group = createSignifierMesh(tiles, 42, excluded);
    expect(group.children.length).toBe(1);
  });
});
