import { describe, it, expect } from 'vitest';
import { computeCoastline, isWaterTerrain, combineLoopPaths } from '../coastline';
import { COASTLINE_DEFAULTS } from '../../types/coastline';
import { generateWorld } from '../hexGrid';
import { DEFAULT_COLS, DEFAULT_ROWS } from '../gameInit';

describe('coastline integration', () => {
  const cosmology: Record<string, number> = {
    force: 0.1,
    matter: 0.1,
    energy: 0.15,
    life: 0.15,
    mind: 0.1,
    spirit: 0.1,
    time: 0.15,
    entropy: 0.15,
  };

  it('produces coastline from game-generated world', () => {
    const tiles = generateWorld(cosmology, DEFAULT_COLS, DEFAULT_ROWS, 42);
    const landCount = tiles.filter(t => !isWaterTerrain(t.terrain)).length;
    const waterCount = tiles.filter(t => isWaterTerrain(t.terrain)).length;
    expect(landCount).toBeGreaterThan(0);
    expect(waterCount).toBeGreaterThan(0);

    const data = computeCoastline(tiles, 30, DEFAULT_COLS, DEFAULT_ROWS, 42);
    expect(data.loops.length).toBeGreaterThan(0);

    for (const loop of data.loops) {
      expect(loop.length).toBeGreaterThanOrEqual(COASTLINE_DEFAULTS.minLoopPoints);
      for (const pt of loop) {
        expect(typeof pt.x).toBe('number');
        expect(typeof pt.y).toBe('number');
        expect(isFinite(pt.x)).toBe(true);
        expect(isFinite(pt.y)).toBe(true);
      }
    }

    const landPath = combineLoopPaths(data.loops);
    expect(landPath.length).toBeGreaterThan(0);
    expect(landPath).toMatch(/^M/);

    if (data.shallowLoops.length > 0) {
      const shallowPath = combineLoopPaths(data.shallowLoops);
      expect(shallowPath.length).toBeGreaterThan(0);
    }
  });

  it('performance: computes in < 500ms for 20×15 grid', () => {
    const tiles = generateWorld(cosmology, DEFAULT_COLS, DEFAULT_ROWS, 42);
    const start = performance.now();
    computeCoastline(tiles, 30, DEFAULT_COLS, DEFAULT_ROWS, 42);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(500);
  });

  it('deterministic across multiple calls', () => {
    const tiles = generateWorld(cosmology, DEFAULT_COLS, DEFAULT_ROWS, 42);
    const a = computeCoastline(tiles, 30, DEFAULT_COLS, DEFAULT_ROWS, 42);
    const b = computeCoastline(tiles, 30, DEFAULT_COLS, DEFAULT_ROWS, 42);
    expect(combineLoopPaths(a.loops)).toBe(combineLoopPaths(b.loops));
    expect(combineLoopPaths(a.shallowLoops)).toBe(combineLoopPaths(b.shallowLoops));
  });

  it('handles all-ocean world gracefully', () => {
    const tiles = Array.from({ length: 25 }, (_, i) => ({
      coord: { col: i % 5, row: Math.floor(i / 5) },
      geoParams: { elevation: 0.1, temperature: 0.5, moisture: 0.9 },
      terrain: 'ocean' as const,
    }));
    const data = computeCoastline(tiles, 30, 5, 5, 42);
    expect(data.loops).toHaveLength(0);
    expect(data.shallowLoops).toHaveLength(0);
  });

  it('handles all-land world gracefully', () => {
    const tiles = Array.from({ length: 25 }, (_, i) => ({
      coord: { col: i % 5, row: Math.floor(i / 5) },
      geoParams: { elevation: 0.7, temperature: 0.5, moisture: 0.5 },
      terrain: 'grassland' as const,
    }));
    const data = computeCoastline(tiles, 30, 5, 5, 42);
    expect(data.loops.length).toBeGreaterThanOrEqual(0);
  });

  it('produces different coastlines for different seeds', () => {
    const tiles = generateWorld(cosmology, DEFAULT_COLS, DEFAULT_ROWS, 42);
    const a = computeCoastline(tiles, 30, DEFAULT_COLS, DEFAULT_ROWS, 42);
    const b = computeCoastline(tiles, 30, DEFAULT_COLS, DEFAULT_ROWS, 99);
    // Different seeds should produce different contours (though number of loops may coincidentally match)
    expect(combineLoopPaths(a.loops)).not.toBe(combineLoopPaths(b.loops));
  });

  it('water terrain classification is consistent', () => {
    const waterTerrains = ['ocean', 'coastal_shallows', 'lake', 'river'];
    const landTerrains = ['grassland', 'dense_forest', 'mountains', 'desert'];

    for (const terrain of waterTerrains) {
      expect(isWaterTerrain(terrain as any)).toBe(true);
    }

    for (const terrain of landTerrains) {
      expect(isWaterTerrain(terrain as any)).toBe(false);
    }
  });

  it('scalar field handles large grids without overflow', () => {
    const largeTiles = generateWorld(cosmology, 30, 20, 100);
    const data = computeCoastline(largeTiles, 30, 30, 20, 42);
    // Just verify no errors and reasonable structure
    expect(data.loops).toBeDefined();
    expect(Array.isArray(data.loops)).toBe(true);
  });
});
