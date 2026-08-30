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
    const tiles = generateWorld(cosmology, DEFAULT_COLS, DEFAULT_ROWS, 42).tiles;
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

  /**
   * The budget is unchanged at 500 ms; what changed is that it is measured
   * against the MEDIAN of several runs rather than one sample (THR-1328).
   *
   * ## Why one sample could not hold it
   *
   * Measured 2026-08-30, this machine, standalone, idle, 15 samples per run,
   * three independent runs:
   *
   * | run | min | median | max |
   * |-----|-----|--------|-----|
   * | 1   | 81.99 | 101.54 | **528.02** |
   * | 2   | 82.83 | 100.64 | **525.60** |
   * | 3   | 84.82 | 108.69 | **618.24** |
   *
   * The distribution is not noisy around 500 — it is tight at ~100 ms with a
   * long tail that clears 500 in roughly 2 of every 15 samples (GC/JIT, not
   * work done). So the single-sample form failed ~13% of the time on an idle
   * developer machine before any CI contention was applied at all. Impediment
   * #871 recorded it as a 3.4% overshoot on a shared runner (516.77 ms, 41
   * minutes of a blocked armed PR on PR #1676) and left the threshold
   * unwidened pending a second occurrence; the measurement above shows the
   * shared runner was not the cause and a wider threshold was never the fix.
   *
   * ## Why not simply raise the number
   *
   * `src/testing/testTimeouts.ts` names this case explicitly as the thing its
   * hang-detector constants must NOT be used to silence: it is a real
   * performance contract, and raising it would hide what it exists to measure.
   * That objection is respected here. The median of N is what the assertion
   * always meant by "computes in < 500ms", and it keeps the contract sharp —
   * a genuine regression moves the median, while no single excursion, however
   * large, can move it at all. Against a ~101 ms median the budget still holds
   * a ~5× margin, matching the runner-spread doctrine in that same file.
   *
   * Done-when (THR-1328): a <10% wall-clock excursion cannot fail this — it
   * moves the median to ~112 ms, four-fifths of the budget below the gate.
   */
  it('performance: median of runs computes in < 500ms for 20×15 grid', () => {
    const tiles = generateWorld(cosmology, DEFAULT_COLS, DEFAULT_ROWS, 42).tiles;

    /** Odd, so the median is a real sample rather than an average of two. */
    const PERF_SAMPLE_COUNT = 7;
    /** Unchanged since the assertion was written; see the measurement above. */
    const PERF_BUDGET_MS = 500;

    const samples: number[] = [];
    for (let i = 0; i < PERF_SAMPLE_COUNT; i++) {
      const start = performance.now();
      computeCoastline(tiles, 30, DEFAULT_COLS, DEFAULT_ROWS, 42);
      samples.push(performance.now() - start);
    }

    samples.sort((a, b) => a - b);
    const median = samples[(PERF_SAMPLE_COUNT - 1) / 2];

    expect(median).toBeLessThan(PERF_BUDGET_MS);
  });

  it('deterministic across multiple calls', () => {
    const tiles = generateWorld(cosmology, DEFAULT_COLS, DEFAULT_ROWS, 42).tiles;
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
    const tiles = generateWorld(cosmology, DEFAULT_COLS, DEFAULT_ROWS, 42).tiles;
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
    const largeTiles = generateWorld(cosmology, 30, 20, 100).tiles;
    const data = computeCoastline(largeTiles, 30, 30, 20, 42);
    expect(data.loops).toBeDefined();
    expect(Array.isArray(data.loops)).toBe(true);
    // Verify loop points are finite (no NaN/Infinity from large grid math)
    for (const loop of data.loops) {
      expect(loop.length).toBeGreaterThanOrEqual(0);
      for (const pt of loop) {
        expect(isFinite(pt.x)).toBe(true);
        expect(isFinite(pt.y)).toBe(true);
      }
    }
    // SVG path generation shouldn't fail on large grids
    if (data.loops.length > 0) {
      const path = combineLoopPaths(data.loops);
      expect(path.length).toBeGreaterThan(0);
    }
  });

  it('shallow loops are valid when present', () => {
    const tiles = generateWorld(cosmology, DEFAULT_COLS, DEFAULT_ROWS, 42).tiles;
    const data = computeCoastline(tiles, 30, DEFAULT_COLS, DEFAULT_ROWS, 42);
    // Shallow loops may be empty for some seeds, but if present must be valid
    for (const loop of data.shallowLoops) {
      expect(loop.length).toBeGreaterThanOrEqual(COASTLINE_DEFAULTS.minLoopPoints);
      for (const pt of loop) {
        expect(isFinite(pt.x)).toBe(true);
        expect(isFinite(pt.y)).toBe(true);
      }
    }
    if (data.shallowLoops.length > 0) {
      const path = combineLoopPaths(data.shallowLoops);
      expect(path).toMatch(/^M/);
    }
  });
});
