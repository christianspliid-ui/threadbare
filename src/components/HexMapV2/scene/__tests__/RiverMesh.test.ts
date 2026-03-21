import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import type { HexTile } from '../../../../types';
import type { RiverPath } from '../../../../engine/worldGenData';
import { RENDER_ORDER } from '../RenderLayers';
import { createRiverMesh } from '../RiverMesh';

// Helper to build a minimal HexTile
function makeTile(col: number, row: number, terrain: 'grassland' | 'ocean' = 'grassland'): HexTile {
  return {
    coord: { col, row },
    geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 },
    terrain,
  };
}

// Helper to build a simple river path
function makeRiverPath(id: string, coords: Array<{ col: number; row: number }>): RiverPath {
  return { id, hexes: coords.map(c => ({ col: c.col, row: c.row })) };
}

describe('createRiverMesh', () => {
  it('returns a THREE.Group with renderOrder = RENDER_ORDER.RIVERS', () => {
    const tiles = [makeTile(0, 0), makeTile(1, 0), makeTile(2, 0)];
    const riverPaths = [makeRiverPath('r1', [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }])];

    const group = createRiverMesh(riverPaths, tiles, 42);

    expect(group).toBeInstanceOf(THREE.Group);
    expect(group.renderOrder).toBe(RENDER_ORDER.RIVERS);
  });

  it('given a single RiverPath with 3 hexes, output mesh has non-zero vertex count', () => {
    const tiles = [makeTile(0, 0), makeTile(1, 0), makeTile(2, 0)];
    const riverPaths = [makeRiverPath('r1', [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }])];

    const group = createRiverMesh(riverPaths, tiles, 42);

    // Should have at least one child mesh with vertices
    let totalVertices = 0;
    for (const child of group.children) {
      if (child instanceof THREE.Mesh) {
        const pos = child.geometry.getAttribute('position');
        if (pos) totalVertices += pos.count;
      }
    }
    expect(totalVertices).toBeGreaterThan(0);
  });

  it('given empty riverPaths array, output group has no children (fail-soft)', () => {
    const tiles = [makeTile(0, 0), makeTile(1, 0)];

    const group = createRiverMesh([], tiles, 42);

    expect(group.children.length).toBe(0);
  });

  it('river width at mouth is wider than at source — verified via vertex spread', () => {
    // Use a long river path (10 hexes in a line)
    const tiles: HexTile[] = [];
    const hexes: Array<{ col: number; row: number }> = [];
    for (let col = 0; col < 10; col++) {
      tiles.push(makeTile(col, 0));
      hexes.push({ col, row: 0 });
    }
    const riverPaths = [makeRiverPath('r1', hexes)];

    const group = createRiverMesh(riverPaths, tiles, 42);

    expect(group.children.length).toBeGreaterThan(0);
    const mesh = group.children[0] as THREE.Mesh;
    const pos = mesh.geometry.getAttribute('position');
    expect(pos).toBeTruthy();

    // Measure cross-section spread near source (first 2 verts) vs mouth (last 2 verts)
    // Quad strip: pairs of vertices at each cross-section
    // First pair: verts 0 and 1; last pair: verts (n-2) and (n-1)
    const n = pos.count;
    expect(n).toBeGreaterThanOrEqual(4);

    const x0 = pos.getX(0), y0 = pos.getY(0);
    const x1 = pos.getX(1), y1 = pos.getY(1);
    const xN2 = pos.getX(n - 2), yN2 = pos.getY(n - 2);
    const xN1 = pos.getX(n - 1), yN1 = pos.getY(n - 1);

    const sourceWidth = Math.sqrt((x1 - x0) ** 2 + (y1 - y0) ** 2);
    const mouthWidth  = Math.sqrt((xN1 - xN2) ** 2 + (yN1 - yN2) ** 2);

    expect(mouthWidth).toBeGreaterThan(sourceWidth);
  });

  it('all Y coordinates are negated vs hexToPixel output (Y-flip)', () => {
    // hexToPixel for col=0,row=5 returns positive y in SVG space
    // After Y-flip, Three.js y should be negative
    const tiles = [makeTile(0, 5), makeTile(1, 5), makeTile(2, 5)];
    const riverPaths = [makeRiverPath('r1', [{ col: 0, row: 5 }, { col: 1, row: 5 }, { col: 2, row: 5 }])];

    const group = createRiverMesh(riverPaths, tiles, 42);
    expect(group.children.length).toBeGreaterThan(0);

    // hexToPixel for row=5 gives y = 5 * sqrt(3) * 10 ≈ 86.6 (positive in SVG space)
    // After Y-flip all vertices should have negative y values
    const mesh = group.children[0] as THREE.Mesh;
    const pos = mesh.geometry.getAttribute('position');
    expect(pos).toBeTruthy();

    let hasNegativeY = false;
    let hasPositiveY = false;
    for (let i = 0; i < pos.count; i++) {
      if (pos.getY(i) < -1) hasNegativeY = true;  // clearly negative
      if (pos.getY(i) > 1)  hasPositiveY = true;  // clearly positive
    }

    expect(hasNegativeY).toBe(true);
    expect(hasPositiveY).toBe(false);
  });

  it('given a 2-hex river path, quad strip produces at least 4 vertices', () => {
    const tiles = [makeTile(0, 0), makeTile(1, 0)];
    const riverPaths = [makeRiverPath('r1', [{ col: 0, row: 0 }, { col: 1, row: 0 }])];

    const group = createRiverMesh(riverPaths, tiles, 42);
    expect(group.children.length).toBeGreaterThan(0);

    const mesh = group.children[0] as THREE.Mesh;
    const pos = mesh.geometry.getAttribute('position');
    expect(pos).toBeTruthy();
    expect(pos.count).toBeGreaterThanOrEqual(4);
  });
});
