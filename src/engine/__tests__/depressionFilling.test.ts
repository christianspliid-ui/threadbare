import { describe, it, expect } from 'vitest';
import { fillDepressions } from '../depressionFilling';
import { createWorldGenData } from '../worldGenData';
import { generateLakes } from '../lakeGeneration';

describe('fillDepressions', () => {
  it('fills a known depression so drainageElevation >= neighbors', () => {
    // Create a small grid and manually set a depression
    const data = createWorldGenData(5, 5, 42);
    // Create a valley: center hex low, surrounded by higher terrain
    const centerIdx = 2 * 5 + 2; // (2,2)
    data.elevation[centerIdx] = 0.1;
    // Surround with higher terrain
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const idx = r * 5 + c;
        if (idx !== centerIdx) {
          data.elevation[idx] = Math.max(data.elevation[idx], 0.4);
        }
      }
    }

    fillDepressions(data);

    // After filling, drainageElevation at center should be raised above its original
    expect(data.drainageElevation[centerIdx]).toBeGreaterThan(0.1);
    expect(data.filledDepth[centerIdx]).toBeGreaterThan(0);
  });

  it('does not modify hexes that drain naturally (no depression)', () => {
    const data = createWorldGenData(5, 5, 42);
    // Create a simple slope: elevation decreases from top-left to bottom-right
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const idx = r * 5 + c;
        data.elevation[idx] = 1.0 - (r + c) / 8;
      }
    }

    fillDepressions(data);

    // No hex should have filledDepth > 0 on a monotonic slope
    for (let i = 0; i < 25; i++) {
      expect(data.filledDepth[i]).toBeCloseTo(0, 3);
    }
  });

  it('preserves original elevation array', () => {
    const data = createWorldGenData(20, 15, 42);
    const originalElev = new Float32Array(data.elevation);

    generateLakes(data);
    fillDepressions(data);

    expect(data.elevation).toEqual(originalElev);
  });

  it('is deterministic: same input produces same output', () => {
    const a = createWorldGenData(20, 15, 42);
    generateLakes(a);
    fillDepressions(a);

    const b = createWorldGenData(20, 15, 42);
    generateLakes(b);
    fillDepressions(b);

    expect(a.drainageElevation).toEqual(b.drainageElevation);
    expect(a.filledDepth).toEqual(b.filledDepth);
  });

  it('resolves all hexes (no unresolved gaps)', () => {
    const data = createWorldGenData(20, 15, 42);
    generateLakes(data);
    fillDepressions(data);

    // Every hex should have drainageElevation >= its original elevation
    for (let i = 0; i < data.cols * data.rows; i++) {
      expect(data.drainageElevation[i]).toBeGreaterThanOrEqual(data.elevation[i] - 0.001);
    }
  });
});
