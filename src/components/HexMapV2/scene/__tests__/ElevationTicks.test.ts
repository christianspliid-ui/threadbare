import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { createElevationTicks } from '../ElevationTicks';
import { RENDER_ORDER } from '../RenderLayers';
import type { HexTile } from '../../../../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeTile(col: number, row: number, elevation: number): HexTile {
  return {
    coord: { col, row },
    geoParams: { elevation, temperature: 0.5, moisture: 0.5 },
    terrain: 'grassland',
  };
}

/**
 * Minimal two-tile grid: col=0 and col=1, row=0.
 * These are adjacent in odd-q offset (col 0 row 0 neighbors col 1 row 0 for even column).
 */
function twoAdjacentTiles(elevA: number, elevB: number): HexTile[] {
  return [makeTile(0, 0, elevA), makeTile(1, 0, elevB)];
}

function allSameElevationGrid(): HexTile[] {
  const tiles: HexTile[] = [];
  for (let col = 0; col < 5; col++) {
    for (let row = 0; row < 5; row++) {
      tiles.push(makeTile(col, row, 0.5));
    }
  }
  return tiles;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('createElevationTicks', () => {
  it('Test 1: returns THREE.LineSegments with correct renderOrder', () => {
    const ticks = createElevationTicks([makeTile(0, 0, 0.5)]);
    expect(ticks).toBeInstanceOf(THREE.LineSegments);
    expect(ticks.renderOrder).toBe(RENDER_ORDER.ELEVATION_TICKS);
  });

  it('Test 2: produces non-zero vertex count for adjacent hexes with elevation diff > TICK_THRESHOLD', () => {
    // elevDiff = 0.5 (>> 0.08 threshold) → should emit tick marks
    const tiles = twoAdjacentTiles(0.2, 0.7);
    const ticks = createElevationTicks(tiles);
    const positions = ticks.geometry.getAttribute('position') as THREE.BufferAttribute;
    expect(positions.count).toBeGreaterThan(0);
  });

  it('Test 3: produces zero vertices for adjacent hexes with elevation diff < TICK_THRESHOLD', () => {
    // elevDiff = 0.02 (< 0.08 threshold) → should emit no ticks
    const tiles = twoAdjacentTiles(0.5, 0.52);
    const ticks = createElevationTicks(tiles);
    const positions = ticks.geometry.getAttribute('position') as THREE.BufferAttribute;
    expect(positions.count).toBe(0);
  });

  it('Test 4: minimum qualifying edge produces 3 ticks (TICK_MIN clamp)', () => {
    // TICK_THRESHOLD = 0.08, TICK_DENSITY_STEP = 0.03
    // elevDiff just above threshold: 0.09 → floor(0.09 / 0.03) = 3 → clamped to max(3, 3) = 3
    // Each tick = 2 vertices (line segment), so 3 ticks = 6 vertices
    const tiles = twoAdjacentTiles(0.50, 0.59); // diff = 0.09, > 0.08
    const ticks = createElevationTicks(tiles);
    const positions = ticks.geometry.getAttribute('position') as THREE.BufferAttribute;
    // 3 ticks × 2 points per tick = 6 vertices
    expect(positions.count).toBe(6);
  });

  it('Test 5: very large elevation difference produces 8 ticks (TICK_MAX clamp)', () => {
    // elevDiff = 0.9 → floor(0.9 / 0.03) = 30 → clamped to min(8, 30) = 8
    // Each tick = 2 vertices, so 8 ticks = 16 vertices
    const tiles = twoAdjacentTiles(0.0, 0.9);
    const ticks = createElevationTicks(tiles);
    const positions = ticks.geometry.getAttribute('position') as THREE.BufferAttribute;
    // 8 ticks × 2 points per tick = 16 vertices
    expect(positions.count).toBe(16);
  });

  it('Test 6: shared edges are not double-counted', () => {
    // 3-tile row: A-B-C. B is adjacent to both A and C.
    // If A-B qualifies for ticks, it should be counted once, not twice.
    const tiles = [
      makeTile(0, 0, 0.2),  // low
      makeTile(1, 0, 0.7),  // high — diff with tile[0] = 0.5 > threshold
      makeTile(2, 0, 0.7),  // same as tile[1] — diff = 0, no ticks for B-C edge
    ];
    const ticks = createElevationTicks(tiles);
    const positions = ticks.geometry.getAttribute('position') as THREE.BufferAttribute;

    // Only edge A-B qualifies. Expected ticks = min(8, max(3, floor(0.5 / 0.03))) = min(8, 16) = 8
    // 8 ticks × 2 vertices = 16 vertices
    expect(positions.count).toBe(16);
  });

  it('Test 7: all-flat terrain (same elevation) produces zero vertices', () => {
    const tiles = allSameElevationGrid();
    const ticks = createElevationTicks(tiles);
    const positions = ticks.geometry.getAttribute('position') as THREE.BufferAttribute;
    expect(positions.count).toBe(0);
  });
});
