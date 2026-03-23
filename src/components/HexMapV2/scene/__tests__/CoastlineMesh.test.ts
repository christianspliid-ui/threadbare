import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import type { HexTile } from '../../../../types';
import { RENDER_ORDER } from '../RenderLayers';
import { WATER_PALETTE } from '../../palette/waterPalette';

// Mock computeCoastline to control output in tests
vi.mock('../../../../engine/coastline', () => ({
  computeCoastline: vi.fn(),
  isWaterTerrain: vi.fn((terrain: string) =>
    ['ocean', 'deep_ocean', 'tropical_ocean', 'coastal_shallows', 'coast', 'lake', 'river', 'reef'].includes(terrain)
  ),
}));

import { computeCoastline } from '../../../../engine/coastline';
import { createCoastlineMesh } from '../CoastlineMesh';

// Helper to build a minimal HexTile
function makeTile(col: number, row: number, terrain: 'ocean' | 'grassland' = 'ocean'): HexTile {
  return {
    coord: { col, row },
    geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 },
    terrain,
  };
}

// A simple square contour loop for testing
const SQUARE_LOOP = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 100 },
  { x: 0, y: 100 },
];

describe('createCoastlineMesh', () => {
  beforeEach(() => {
    vi.mocked(computeCoastline).mockReturnValue({
      loops: [],
      shallowLoops: [],
      midLoops: [],
      lakeLoops: [],
    });
  });

  it('returns a THREE.Group', () => {
    const tiles = [makeTile(0, 0, 'ocean'), makeTile(1, 0, 'grassland')];
    vi.mocked(computeCoastline).mockReturnValue({ loops: [SQUARE_LOOP], shallowLoops: [], midLoops: [], lakeLoops: [] });

    const group = createCoastlineMesh(tiles, 10, 10, 42);

    expect(group).toBeInstanceOf(THREE.Group);
  });

  it('given a small tile set with mixed land/ocean, coastline mesh has non-zero vertex count', () => {
    const tiles = [
      makeTile(0, 0, 'ocean'),
      makeTile(1, 0, 'grassland'),
      makeTile(0, 1, 'grassland'),
    ];
    vi.mocked(computeCoastline).mockReturnValue({ loops: [SQUARE_LOOP], shallowLoops: [], midLoops: [], lakeLoops: [] });

    const group = createCoastlineMesh(tiles, 10, 10, 42);

    expect(group.children.length).toBeGreaterThan(0);

    let totalVertices = 0;
    for (const child of group.children) {
      if (child instanceof THREE.Mesh) {
        const pos = child.geometry.getAttribute('position');
        if (pos) totalVertices += pos.count;
      }
    }
    expect(totalVertices).toBeGreaterThan(0);
  });

  it('given an all-ocean tile set, coastline mesh has only the water overlay (no stencil write meshes)', () => {
    const tiles = [makeTile(0, 0, 'ocean'), makeTile(1, 0, 'ocean')];
    vi.mocked(computeCoastline).mockReturnValue({ loops: [], shallowLoops: [], midLoops: [], lakeLoops: [] });

    const group = createCoastlineMesh(tiles, 2, 1, 42);

    // No stencil write meshes (colorWrite: false) when loops are empty
    const stencilMeshes = group.children.filter(c =>
      c instanceof THREE.Mesh && (c.material as THREE.MeshBasicMaterial).colorWrite === false
    );
    expect(stencilMeshes.length).toBe(0);

    // No coastal band meshes either — empty loops produce empty group
    expect(group.children.length).toBe(0);
  });

  it('coastline mesh Y coordinates are negated vs SVG space (Y-flip)', () => {
    const tiles = [makeTile(0, 0, 'grassland'), makeTile(1, 0, 'ocean')];
    const positiveSvgLoop = [
      { x: 0, y: 50 },
      { x: 100, y: 50 },
      { x: 100, y: 150 },
      { x: 0, y: 150 },
    ];
    vi.mocked(computeCoastline).mockReturnValue({ loops: [positiveSvgLoop], shallowLoops: [], midLoops: [], lakeLoops: [] });

    const group = createCoastlineMesh(tiles, 2, 1, 42);

    let foundNegativeY = false;
    for (const child of group.children) {
      if (child instanceof THREE.Mesh) {
        const pos = child.geometry.getAttribute('position');
        if (pos) {
          for (let i = 0; i < pos.count; i++) {
            const y = pos.getY(i);
            if (y < 0) foundNegativeY = true;
          }
        }
      }
    }
    expect(foundNegativeY).toBe(true);
  });

  it('stencil write meshes have colorWrite false and stencilWrite true', () => {
    const tiles = [makeTile(0, 0, 'ocean'), makeTile(1, 0, 'grassland')];
    vi.mocked(computeCoastline).mockReturnValue({ loops: [SQUARE_LOOP], shallowLoops: [], midLoops: [], lakeLoops: [] });

    const group = createCoastlineMesh(tiles, 10, 10, 42);

    const stencilMeshes = group.children.filter(c =>
      c instanceof THREE.Mesh && (c.material as THREE.MeshBasicMaterial).colorWrite === false
    );
    expect(stencilMeshes.length).toBeGreaterThan(0);

    const mat = (stencilMeshes[0] as THREE.Mesh).material as THREE.MeshBasicMaterial;
    expect(mat.stencilWrite).toBe(true);
    expect(mat.stencilRef).toBe(1);
    expect(mat.stencilFunc).toBe(THREE.AlwaysStencilFunc);
  });

  it('stencil write meshes have renderOrder = RENDER_ORDER.STENCIL_WRITE (-1)', () => {
    const tiles = [makeTile(0, 0, 'ocean'), makeTile(1, 0, 'grassland')];
    vi.mocked(computeCoastline).mockReturnValue({ loops: [SQUARE_LOOP], shallowLoops: [], midLoops: [], lakeLoops: [] });

    const group = createCoastlineMesh(tiles, 10, 10, 42);

    const stencilMeshes = group.children.filter(c =>
      c instanceof THREE.Mesh && (c.material as THREE.MeshBasicMaterial).colorWrite === false
    );
    expect(stencilMeshes.length).toBeGreaterThan(0);

    for (const mesh of stencilMeshes) {
      expect(mesh.renderOrder).toBe(RENDER_ORDER.STENCIL_WRITE);
      expect(mesh.renderOrder).toBe(-1);
    }
  });

  it('water overlay uses inverse stencil test (NotEqualStencilFunc, ref=1)', () => {
    const tiles = [makeTile(0, 0, 'grassland'), makeTile(1, 0, 'ocean')];
    vi.mocked(computeCoastline).mockReturnValue({
      loops: [SQUARE_LOOP],
      shallowLoops: [SQUARE_LOOP],
      midLoops: [],
      lakeLoops: [],
    });

    const group = createCoastlineMesh(tiles, 2, 1, 42);

    // Find the water overlay (visible mesh with NotEqualStencilFunc)
    const overlayMeshes = group.children.filter(c =>
      c instanceof THREE.Mesh &&
      (c.material as THREE.MeshBasicMaterial).stencilFunc === THREE.NotEqualStencilFunc
    );
    expect(overlayMeshes.length).toBe(1);

    const mat = (overlayMeshes[0] as THREE.Mesh).material as THREE.MeshBasicMaterial;
    expect(mat.stencilRef).toBe(1);
    expect(mat.stencilWrite).toBe(true);
  });

  it('accepts optional lakeIds parameter without error', () => {
    const tiles = [makeTile(0, 0, 'ocean'), makeTile(1, 0, 'grassland')];
    vi.mocked(computeCoastline).mockReturnValue({ loops: [], shallowLoops: [], midLoops: [], lakeLoops: [] });

    const lakeIds = new Int16Array([0, -1]);
    expect(() => createCoastlineMesh(tiles, 2, 1, 42, lakeIds)).not.toThrow();
  });
});
