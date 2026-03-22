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

  it('returns a THREE.Group with renderOrder = RENDER_ORDER.COASTLINE', () => {
    const tiles = [makeTile(0, 0, 'ocean'), makeTile(1, 0, 'grassland')];
    vi.mocked(computeCoastline).mockReturnValue({ loops: [SQUARE_LOOP], shallowLoops: [], midLoops: [], lakeLoops: [] });

    const group = createCoastlineMesh(tiles, 10, 10, 42);

    expect(group).toBeInstanceOf(THREE.Group);
    expect(group.renderOrder).toBe(RENDER_ORDER.COASTLINE);
  });

  it('given a small tile set with mixed land/ocean, coastline mesh has non-zero vertex count', () => {
    const tiles = [
      makeTile(0, 0, 'ocean'),
      makeTile(1, 0, 'grassland'),
      makeTile(0, 1, 'grassland'),
    ];
    vi.mocked(computeCoastline).mockReturnValue({ loops: [SQUARE_LOOP], shallowLoops: [], midLoops: [], lakeLoops: [] });

    const group = createCoastlineMesh(tiles, 10, 10, 42);

    // Group should have children (stencil write meshes from the land contour loops)
    expect(group.children.length).toBeGreaterThan(0);

    // At least one child should have geometry with vertices
    let totalVertices = 0;
    for (const child of group.children) {
      if (child instanceof THREE.Mesh) {
        const pos = child.geometry.getAttribute('position');
        if (pos) totalVertices += pos.count;
      }
    }
    expect(totalVertices).toBeGreaterThan(0);
  });

  it('given an all-ocean tile set, coastline mesh is empty (no land boundary to draw)', () => {
    const tiles = [makeTile(0, 0, 'ocean'), makeTile(1, 0, 'ocean')];
    vi.mocked(computeCoastline).mockReturnValue({ loops: [], shallowLoops: [], midLoops: [], lakeLoops: [] });

    const group = createCoastlineMesh(tiles, 2, 1, 42);

    // Empty loops → no mesh children (or only empty group)
    let totalVertices = 0;
    for (const child of group.children) {
      if (child instanceof THREE.Mesh) {
        const pos = child.geometry.getAttribute('position');
        if (pos) totalVertices += pos.count;
      }
    }
    expect(totalVertices).toBe(0);
  });

  it('coastline mesh Y coordinates are negated vs SVG space (Y-flip)', () => {
    const tiles = [makeTile(0, 0, 'grassland'), makeTile(1, 0, 'ocean')];
    // Loop with positive SVG Y (y-down convention)
    const positiveSvgLoop = [
      { x: 0, y: 50 },
      { x: 100, y: 50 },
      { x: 100, y: 150 },
      { x: 0, y: 150 },
    ];
    vi.mocked(computeCoastline).mockReturnValue({ loops: [positiveSvgLoop], shallowLoops: [], midLoops: [], lakeLoops: [] });

    const group = createCoastlineMesh(tiles, 2, 1, 42);

    // Find any mesh (stencil write meshes have geometry too)
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
    // With positive SVG Y values (50-150), Three.js Y should be negative (-50 to -150)
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

  it('shallow band mesh uses WATER_PALETTE.shallows color', () => {
    const tiles = [makeTile(0, 0, 'grassland'), makeTile(1, 0, 'ocean')];
    vi.mocked(computeCoastline).mockReturnValue({
      loops: [SQUARE_LOOP],
      shallowLoops: [SQUARE_LOOP],
      midLoops: [],
      lakeLoops: [],
    });

    const group = createCoastlineMesh(tiles, 2, 1, 42);

    // Find the shallow mesh (should have shallows color and colorWrite: true)
    let foundShallowMesh = false;
    const shallowsHex = WATER_PALETTE['shallows'].toLowerCase();

    for (const child of group.children) {
      if (child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshBasicMaterial;
        // Skip stencil write meshes (colorWrite: false)
        if (!mat || mat.colorWrite === false) continue;
        if (mat.color) {
          const r = Math.round(mat.color.r * 255).toString(16).padStart(2, '0');
          const g = Math.round(mat.color.g * 255).toString(16).padStart(2, '0');
          const b = Math.round(mat.color.b * 255).toString(16).padStart(2, '0');
          const colorHex = `#${r}${g}${b}`;
          if (colorHex.toLowerCase() === shallowsHex) {
            foundShallowMesh = true;
          }
        }
      }
    }

    expect(foundShallowMesh).toBe(true);
  });

  it('accepts optional lakeIds parameter without error', () => {
    const tiles = [makeTile(0, 0, 'ocean'), makeTile(1, 0, 'grassland')];
    vi.mocked(computeCoastline).mockReturnValue({ loops: [], shallowLoops: [], midLoops: [], lakeLoops: [] });

    const lakeIds = new Int16Array([0, -1]);
    expect(() => createCoastlineMesh(tiles, 2, 1, 42, lakeIds)).not.toThrow();
  });
});
