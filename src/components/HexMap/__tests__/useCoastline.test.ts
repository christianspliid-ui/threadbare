// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCoastline } from '../useCoastline';
import type { HexTile } from '../../../types';

function makeTile(col: number, row: number, terrain: string = 'grassland'): HexTile {
  return {
    coord: { col, row },
    geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 },
    terrain: terrain as HexTile['terrain'],
  };
}

function makeIslandGrid(): HexTile[] {
  const tiles: HexTile[] = [];
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      const isWater = c < 2 || c > 4 || r < 2 || r > 4;
      tiles.push(makeTile(c, r, isWater ? 'ocean' : 'grassland'));
    }
  }
  return tiles;
}

describe('useCoastline', () => {
  it('computes coastline data from tiles', () => {
    const tiles = makeIslandGrid();
    const { result } = renderHook(() => useCoastline(tiles, 30, 7, 7, 42));
    expect(result.current.loops.length).toBeGreaterThan(0);
    expect(result.current.shallowLoops.length).toBeGreaterThan(0);
  });

  it('returns empty data for all-water tiles', () => {
    const tiles = Array.from({ length: 9 }, (_, i) => makeTile(i % 3, Math.floor(i / 3), 'ocean'));
    const { result } = renderHook(() => useCoastline(tiles, 30, 3, 3, 42));
    expect(result.current.loops).toHaveLength(0);
  });

  it('memoizes — same inputs return same reference', () => {
    const tiles = makeIslandGrid();
    const { result, rerender } = renderHook(() => useCoastline(tiles, 30, 7, 7, 42));
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
