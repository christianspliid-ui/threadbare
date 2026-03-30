import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { createElevationTicks } from '../ElevationTicks';
import { RENDER_ORDER } from '../RenderLayers';
import type { HexTile } from '../../../../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeTile(col: number, row: number, elevation: number, terrain: string = 'plateau'): HexTile {
  return {
    coord: { col, row },
    geoParams: { elevation, temperature: 0.5, moisture: 0.5 },
    terrain: terrain as HexTile['terrain'],
  };
}

/**
 * Minimal two-tile grid: col=0 (plateau) and col=1 (grassland), row=0.
 * These are adjacent in odd-q offset (col 0 row 0 neighbors col 1 row 0 for even column).
 * Only the plateau tile emits ticks toward the lower grassland neighbor.
 */
function twoAdjacentTiles(elevA: number, elevB: number): HexTile[] {
  return [makeTile(0, 0, elevA, 'plateau'), makeTile(1, 0, elevB, 'grassland')];
}

function allSameElevationGrid(): HexTile[] {
  const tiles: HexTile[] = [];
  for (let col = 0; col < 5; col++) {
    for (let row = 0; row < 5; row++) {
      tiles.push(makeTile(col, row, 0.5, 'plateau'));
    }
  }
  return tiles;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('createElevationTicks', () => {
  it('Test 1: returns THREE.Mesh with correct renderOrder', () => {
    const ticks = createElevationTicks([makeTile(0, 0, 0.5, 'plateau')]);
    expect(ticks).toBeInstanceOf(THREE.Mesh);
    expect(ticks.renderOrder).toBe(RENDER_ORDER.ELEVATION_TICKS);
  });

  it('Test 2: produces non-zero vertex count for plateau adjacent to lower grassland with elevation diff > TICK_THRESHOLD', () => {
    // elevDiff = 0.5 (>> 0.01 threshold) → should emit tick marks
    // plateau at 0.7, grassland at 0.2 — diff 0.5 > 0.01
    const tiles = twoAdjacentTiles(0.7, 0.2);
    const ticks = createElevationTicks(tiles);
    const positions = ticks.geometry.getAttribute('position') as THREE.BufferAttribute;
    expect(positions.count).toBeGreaterThan(0);
  });

  it('Test 3: produces zero vertices when elevation diff < TICK_THRESHOLD (0.01)', () => {
    // elevDiff = 0.005 (< 0.01 threshold) → should emit no ticks
    // plateau at 0.505, grassland at 0.5 — diff 0.005 < 0.01
    const tiles = twoAdjacentTiles(0.505, 0.5);
    const ticks = createElevationTicks(tiles);
    const positions = ticks.geometry.getAttribute('position') as THREE.BufferAttribute;
    expect(positions.count).toBe(0);
  });

  it('Test 4: qualifying edge produces exactly 16 vertices (TICKS_PER_EDGE=4, each tick is a quad)', () => {
    // TICKS_PER_EDGE=4, each tick is a quad (4 vertices), so 4 ticks × 4 vertices = 16 vertices
    // plateau at 0.76, grassland at 0.50 — diff 0.26 > 0.01
    const tiles = twoAdjacentTiles(0.76, 0.50);
    const ticks = createElevationTicks(tiles);
    const positions = ticks.geometry.getAttribute('position') as THREE.BufferAttribute;
    // 4 ticks × 4 vertices per quad = 16 vertices
    expect(positions.count).toBe(16);
  });

  it('Test 5: very large elevation difference still produces exactly 16 vertices (fixed TICKS_PER_EDGE=4)', () => {
    // TICKS_PER_EDGE is fixed at 4 regardless of elevation magnitude
    // plateau at 0.9, grassland at 0.0 — diff 0.9, still 4 ticks = 16 vertices
    const tiles = twoAdjacentTiles(0.9, 0.0);
    const ticks = createElevationTicks(tiles);
    const positions = ticks.geometry.getAttribute('position') as THREE.BufferAttribute;
    // 4 ticks × 4 vertices per quad = 16 vertices
    expect(positions.count).toBe(16);
  });

  it('Test 6: shared edges are not double-counted (3-tile row, only plateau→grassland edge qualifies)', () => {
    // plateau(0.7) + grassland(0.2) + grassland(0.2)
    // plateau at (0,0) has grassland neighbor at (1,0) — qualifies (diff 0.5 > 0.01)
    // tile (2,0) is grassland, not adjacent to (0,0) in hex grid
    // So only 1 qualifying edge = 16 vertices
    const tiles = [
      makeTile(0, 0, 0.7, 'plateau'),
      makeTile(1, 0, 0.2, 'grassland'),
      makeTile(2, 0, 0.2, 'grassland'),
    ];
    const ticks = createElevationTicks(tiles);
    const positions = ticks.geometry.getAttribute('position') as THREE.BufferAttribute;
    // 1 qualifying edge × 4 ticks × 4 vertices = 16 vertices
    expect(positions.count).toBe(16);
  });

  it('Test 7: all-plateau terrain (same elevation) produces zero vertices', () => {
    // All plateau neighbors are skipped (terrain === 'plateau' → continue)
    // No non-plateau neighbors → no ticks produced
    const tiles = allSameElevationGrid();
    const ticks = createElevationTicks(tiles);
    const positions = ticks.geometry.getAttribute('position') as THREE.BufferAttribute;
    expect(positions.count).toBe(0);
  });
});
