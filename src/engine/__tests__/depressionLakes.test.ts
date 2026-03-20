import { describe, it, expect } from 'vitest';
import { promoteDepressionLakes } from '../depressionLakes';
import { createWorldGenData } from '../worldGenData';
import { DEPRESSION_LAKE_MIN_SIZE } from '../worldGenData';

describe('promoteDepressionLakes', () => {
  it('promotes a multi-hex river-fed depression to lake terrain', () => {
    const data = createWorldGenData(5, 5, 42);
    // Set up a 3-hex depression cluster with river and filledDepth
    const hexes = [2 * 5 + 1, 2 * 5 + 2, 2 * 5 + 3]; // row 2, cols 1-3
    for (const idx of hexes) {
      data.filledDepth[idx] = 0.05;
      data.terrain[idx] = 'grassland';
    }
    data.hasRiver[hexes[0]] = 1;

    promoteDepressionLakes(data);

    for (const idx of hexes) {
      expect(data.terrain[idx]).toBe('lake');
      expect(data.lakeIds[idx]).toBeGreaterThanOrEqual(0);
    }
  });

  it('skips single-hex depressions (below min size)', () => {
    const data = createWorldGenData(5, 5, 42);
    const idx = 2 * 5 + 2;
    data.filledDepth[idx] = 0.05;
    data.terrain[idx] = 'grassland';
    data.hasRiver[idx] = 1;

    promoteDepressionLakes(data);

    if (DEPRESSION_LAKE_MIN_SIZE > 1) {
      expect(data.terrain[idx]).toBe('grassland');
    }
  });

  it('skips depressions without rivers flowing through them', () => {
    const data = createWorldGenData(5, 5, 42);
    const hexes = [2 * 5 + 1, 2 * 5 + 2, 2 * 5 + 3];
    for (const idx of hexes) {
      data.filledDepth[idx] = 0.05;
      data.terrain[idx] = 'grassland';
      // No hasRiver set
    }

    promoteDepressionLakes(data);

    for (const idx of hexes) {
      expect(data.terrain[idx]).toBe('grassland');
    }
  });

  it('is a no-op if fillDepressions has not run (filledDepth all zeros)', () => {
    const data = createWorldGenData(5, 5, 42);
    const terrainBefore = [...data.terrain];

    promoteDepressionLakes(data);

    expect(data.terrain).toEqual(terrainBefore);
  });

  it('does not modify existing lakes from generateLakes', () => {
    const data = createWorldGenData(5, 5, 42);
    const idx = 2 * 5 + 2;
    data.terrain[idx] = 'lake';
    data.lakeIds[idx] = 0;
    // Even if filledDepth is somehow set, existing lakes are skipped
    data.filledDepth[idx] = 0.05;
    data.hasRiver[idx] = 1;

    promoteDepressionLakes(data);

    expect(data.lakeIds[idx]).toBe(0); // unchanged
  });
});
