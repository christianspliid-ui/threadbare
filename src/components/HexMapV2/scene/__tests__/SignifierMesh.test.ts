/**
 * SignifierMesh.test.ts — Unit tests for the instanced signifier scene module.
 *
 * Verifies: InstancedMesh per terrain type, texture atlas creation,
 * per-instance UV rect + fog alpha attributes, SignifierGroupMeta for fog culling,
 * and fail-soft behavior for unknown/water terrain types.
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
          drawImage: vi.fn(),
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
    isTexture = true;
    minFilter = 0;
    magFilter = 0;
    constructor(_canvas: unknown) {}
    dispose() {}
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

// ── Types ──────────────────────────────────────────────────────────────────

type SignifierGroupMeta = import('../SignifierMesh').SignifierGroupMeta;
type SignifierGroup = THREE.Group & { meta?: SignifierGroupMeta };

// ── Tests ──────────────────────────────────────────────────────────────────

describe('SignifierMesh', () => {
  let createSignifierMesh: (tiles: HexTile[], seed: number, centeredLocationHexes?: Set<string>) => SignifierGroup;
  let SIGNIFIER_SPRITE_SCALE: number;
  let SIGNIFIER_Z: number;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('../SignifierMesh');
    createSignifierMesh = mod.createSignifierMesh;
    SIGNIFIER_SPRITE_SCALE = mod.SIGNIFIER_SPRITE_SCALE;
    SIGNIFIER_Z = mod.SIGNIFIER_Z;
  });

  // ── Constants ──────────────────────────────────────────────────────────

  it('exports SIGNIFIER_SPRITE_SCALE = 1.3', () => {
    expect(SIGNIFIER_SPRITE_SCALE).toBe(1.3);
  });

  it('exports SIGNIFIER_Z = 0.07', () => {
    expect(SIGNIFIER_Z).toBe(0.07);
  });

  // ── Group structure ────────────────────────────────────────────────────

  it('returns a THREE.Group', () => {
    const group = createSignifierMesh([], 42);
    expect(group).toBeInstanceOf(THREE.Group);
  });

  it('group.renderOrder equals RENDER_ORDER.SIGNIFIERS (8)', () => {
    const group = createSignifierMesh([], 42);
    expect(group.renderOrder).toBe(RENDER_ORDER.SIGNIFIERS);
    expect(group.renderOrder).toBe(8);
  });

  it('empty tiles array returns empty group with no meta', () => {
    const group = createSignifierMesh([], 42);
    expect(group.children.length).toBe(0);
    expect(group.meta).toBeUndefined();
  });

  // ── Terrain type grouping ──────────────────────────────────────────────

  it('water-type tiles produce no InstancedMeshes', () => {
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

  it('same-terrain land tiles produce exactly one InstancedMesh', () => {
    const landTiles: HexTile[] = [
      makeTile(0, 0, 'grassland'),
      makeTile(1, 0, 'grassland'),
      makeTile(2, 0, 'grassland'),
    ];
    const group = createSignifierMesh(landTiles, 42);
    // One InstancedMesh for 'grassland'
    expect(group.children.length).toBe(1);
    expect(group.children[0]).toBeInstanceOf(THREE.InstancedMesh);
  });

  it('different terrain types produce one InstancedMesh each', () => {
    const tiles: HexTile[] = [
      makeTile(0, 0, 'grassland'),
      makeTile(1, 0, 'desert'),
      makeTile(2, 0, 'forest'),
    ];
    const group = createSignifierMesh(tiles, 42);
    // Each terrain type with registry entries gets its own InstancedMesh
    expect(group.children.length).toBeGreaterThanOrEqual(1);
    for (const child of group.children) {
      expect(child).toBeInstanceOf(THREE.InstancedMesh);
    }
  });

  it('InstancedMesh count matches number of tiles of that terrain type', () => {
    const tiles: HexTile[] = [
      makeTile(0, 0, 'grassland'),
      makeTile(1, 0, 'grassland'),
      makeTile(2, 0, 'grassland'),
    ];
    const group = createSignifierMesh(tiles, 42);
    const mesh = group.children[0] as THREE.InstancedMesh;
    expect(mesh.count).toBe(3);
  });

  // ── Per-instance attributes ────────────────────────────────────────────

  it('InstancedMesh has aUvRect attribute (vec4)', () => {
    const tiles: HexTile[] = [makeTile(0, 0, 'grassland')];
    const group = createSignifierMesh(tiles, 42);
    const mesh = group.children[0] as THREE.InstancedMesh;
    const attr = mesh.geometry.getAttribute('aUvRect') as THREE.InstancedBufferAttribute;
    expect(attr).toBeDefined();
    expect(attr.itemSize).toBe(4);
    expect(attr).toBeInstanceOf(THREE.InstancedBufferAttribute);
  });

  it('InstancedMesh has aFogAlpha attribute (float)', () => {
    const tiles: HexTile[] = [makeTile(0, 0, 'grassland')];
    const group = createSignifierMesh(tiles, 42);
    const mesh = group.children[0] as THREE.InstancedMesh;
    const attr = mesh.geometry.getAttribute('aFogAlpha') as THREE.InstancedBufferAttribute;
    expect(attr).toBeDefined();
    expect(attr.itemSize).toBe(1);
    expect(attr).toBeInstanceOf(THREE.InstancedBufferAttribute);
  });

  it('aFogAlpha defaults to 1.0 for all instances', () => {
    const tiles: HexTile[] = [
      makeTile(0, 0, 'grassland'),
      makeTile(1, 0, 'grassland'),
    ];
    const group = createSignifierMesh(tiles, 42);
    const mesh = group.children[0] as THREE.InstancedMesh;
    const attr = mesh.geometry.getAttribute('aFogAlpha') as THREE.InstancedBufferAttribute;
    for (let i = 0; i < attr.count; i++) {
      expect(attr.getX(i)).toBe(1.0);
    }
  });

  // ── SignifierGroupMeta ─────────────────────────────────────────────────

  it('exposes meta on group when tiles are present', () => {
    const tiles: HexTile[] = [makeTile(0, 0, 'grassland')];
    const group = createSignifierMesh(tiles, 42);
    expect(group.meta).toBeDefined();
    expect(group.meta!.hexInstanceMap).toBeInstanceOf(Map);
    expect(group.meta!.meshMap).toBeInstanceOf(Map);
    expect(typeof group.meta!.setFogAlpha).toBe('function');
    expect(typeof group.meta!.flushFogAlpha).toBe('function');
  });

  it('hexInstanceMap tracks each hex tile to its terrain and instance index', () => {
    const tiles: HexTile[] = [
      makeTile(0, 0, 'grassland'),
      makeTile(1, 0, 'grassland'),
    ];
    const group = createSignifierMesh(tiles, 42);
    const { hexInstanceMap } = group.meta!;
    expect(hexInstanceMap.size).toBe(2);
    expect(hexInstanceMap.has('0,0')).toBe(true);
    expect(hexInstanceMap.has('1,0')).toBe(true);
    const entry = hexInstanceMap.get('0,0')!;
    expect(entry.terrainKey).toBeDefined();
    expect(typeof entry.instanceIndex).toBe('number');
  });

  it('meshMap maps terrain keys to InstancedMesh instances', () => {
    const tiles: HexTile[] = [makeTile(0, 0, 'grassland')];
    const group = createSignifierMesh(tiles, 42);
    const { meshMap } = group.meta!;
    expect(meshMap.size).toBeGreaterThan(0);
    for (const mesh of meshMap.values()) {
      expect(mesh).toBeInstanceOf(THREE.InstancedMesh);
    }
  });

  it('setFogAlpha updates buffer for a tracked hex', () => {
    const tiles: HexTile[] = [makeTile(0, 0, 'grassland')];
    const group = createSignifierMesh(tiles, 42);
    const { setFogAlpha, hexInstanceMap, meshMap } = group.meta!;
    const entry = hexInstanceMap.get('0,0')!;
    const mesh = meshMap.get(entry.terrainKey)!;

    // Initially 1.0
    const attr = mesh.geometry.getAttribute('aFogAlpha') as THREE.InstancedBufferAttribute;
    expect(attr.getX(entry.instanceIndex)).toBe(1.0);

    // Set to 0.0 (fogged)
    setFogAlpha('0,0', 0.0);
    expect(attr.getX(entry.instanceIndex)).toBe(0.0);
  });

  it('setFogAlpha silently ignores unknown hex keys', () => {
    const tiles: HexTile[] = [makeTile(0, 0, 'grassland')];
    const group = createSignifierMesh(tiles, 42);
    expect(() => group.meta!.setFogAlpha('99,99', 0.0)).not.toThrow();
  });

  it('flushFogAlpha can be called without error', () => {
    const tiles: HexTile[] = [makeTile(0, 0, 'grassland')];
    const group = createSignifierMesh(tiles, 42);
    expect(() => group.meta!.flushFogAlpha()).not.toThrow();
  });

  // ── Fail-soft ──────────────────────────────────────────────────────────

  it('unknown terrain type is silently skipped (fail-soft)', () => {
    const tiles: HexTile[] = [
      makeTile(0, 0, 'unknown_terrain_xyz' as HexTile['terrain']),
    ];
    expect(() => createSignifierMesh(tiles, 42)).not.toThrow();
    const group = createSignifierMesh(tiles, 42);
    expect(group.children.length).toBe(0);
  });

  it('mixed water and land tiles — only land tiles get instances', () => {
    const tiles: HexTile[] = [
      makeTile(0, 0, 'ocean'),
      makeTile(1, 0, 'grassland'),
      makeTile(2, 0, 'ocean'),
      makeTile(3, 0, 'grassland'),
    ];
    const group = createSignifierMesh(tiles, 42);
    // 2 grassland tiles → 1 InstancedMesh with count=2
    expect(group.children.length).toBe(1);
    expect((group.children[0] as THREE.InstancedMesh).count).toBe(2);
  });

  // ── Centered location exclusion ────────────────────────────────────────

  it('hexes with centered locations are skipped when centeredLocationHexes is provided', () => {
    const tiles: HexTile[] = [
      makeTile(0, 0, 'grassland'),
      makeTile(1, 0, 'grassland'),
      makeTile(2, 0, 'grassland'),
    ];
    // Without exclusion: all 3 land tiles
    const groupAll = createSignifierMesh(tiles, 42);
    expect((groupAll.children[0] as THREE.InstancedMesh).count).toBe(3);

    // With hex (1,0) excluded: only 2 instances
    const excluded = new Set(['1,0']);
    const groupFiltered = createSignifierMesh(tiles, 42, excluded);
    expect((groupFiltered.children[0] as THREE.InstancedMesh).count).toBe(2);
  });

  it('centeredLocationHexes does not affect hexes without locations', () => {
    const tiles: HexTile[] = [
      makeTile(5, 5, 'grassland'),
    ];
    const excluded = new Set(['99,99']);
    const group = createSignifierMesh(tiles, 42, excluded);
    expect((group.children[0] as THREE.InstancedMesh).count).toBe(1);
  });

  // ── Render properties ──────────────────────────────────────────────────

  it('InstancedMesh uses ShaderMaterial with transparent + no depthWrite', () => {
    const tiles: HexTile[] = [makeTile(0, 0, 'grassland')];
    const group = createSignifierMesh(tiles, 42);
    const mesh = group.children[0] as THREE.InstancedMesh;
    const material = mesh.material as THREE.ShaderMaterial;
    expect(material).toBeInstanceOf(THREE.ShaderMaterial);
    expect(material.transparent).toBe(true);
    expect(material.depthWrite).toBe(false);
  });

  it('InstancedMesh.renderOrder matches RENDER_ORDER.SIGNIFIERS', () => {
    const tiles: HexTile[] = [makeTile(0, 0, 'grassland')];
    const group = createSignifierMesh(tiles, 42);
    const mesh = group.children[0] as THREE.InstancedMesh;
    expect(mesh.renderOrder).toBe(RENDER_ORDER.SIGNIFIERS);
  });

  // ── Determinism (NFP #3) ───────────────────────────────────────────────

  it('same seed produces same instance count and hex mapping', () => {
    const tiles: HexTile[] = [
      makeTile(0, 0, 'grassland'),
      makeTile(1, 0, 'grassland'),
      makeTile(2, 0, 'desert'),
    ];
    const group1 = createSignifierMesh(tiles, 42);
    const group2 = createSignifierMesh(tiles, 42);
    expect(group1.meta!.hexInstanceMap.size).toBe(group2.meta!.hexInstanceMap.size);
    expect(group1.children.length).toBe(group2.children.length);
  });
});
