import { describe, it, expect } from 'vitest';
import { generateLakeOutflows } from '../lakeOutflow';
import { createWorldGenData } from '../worldGenData';
import { generateLakes } from '../lakeGeneration';
import { fillDepressions } from '../depressionFilling';
import { generateRivers } from '../riverGeneration';

describe('generateLakeOutflows', () => {
  it('does not crash on a default world', () => {
    const data = createWorldGenData(20, 15, 42);
    generateLakes(data);
    fillDepressions(data);
    generateRivers(data);
    const pathsBefore = data.riverPaths.length;

    generateLakeOutflows(data);

    // Should not throw, may or may not add outflows depending on lake configuration
    expect(data.riverPaths.length).toBeGreaterThanOrEqual(pathsBefore);
  });

  it('spawns outflow from a lake with an inflow river', () => {
    const data = createWorldGenData(10, 10, 42);

    // Create a lake cluster manually
    const lakeHexes = [4 * 10 + 4, 4 * 10 + 5]; // (4,4) and (5,4)
    for (const idx of lakeHexes) {
      data.terrain[idx] = 'lake';
      data.lakeIds[idx] = 0;
      data.elevation[idx] = 0.2;
    }

    // Mark one lake hex as having a river (inflow)
    data.hasRiver[lakeHexes[0]] = 1;

    // Set up elevation gradient so outflow can route downhill
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        const idx = r * 10 + c;
        if (data.terrain[idx] !== 'lake') {
          data.elevation[idx] = 0.5 - r * 0.04; // slope downward
          data.drainageElevation[idx] = data.elevation[idx];
        } else {
          data.drainageElevation[idx] = data.elevation[idx];
        }
      }
    }

    const pathsBefore = data.riverPaths.length;
    generateLakeOutflows(data);

    expect(data.riverPaths.length).toBeGreaterThan(pathsBefore);
    const outflowPaths = data.riverPaths.filter(p => p.id.includes('outflow'));
    expect(outflowPaths.length).toBeGreaterThan(0);
  });

  it('does not spawn outflow from a lake with no inflow', () => {
    const data = createWorldGenData(10, 10, 42);

    // Create an isolated lake
    const lakeHexes = [4 * 10 + 4, 4 * 10 + 5];
    for (const idx of lakeHexes) {
      data.terrain[idx] = 'lake';
      data.lakeIds[idx] = 0;
      data.elevation[idx] = 0.2;
      data.drainageElevation[idx] = 0.2;
    }

    // No hasRiver set — no inflow
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        const idx = r * 10 + c;
        if (data.terrain[idx] !== 'lake') {
          data.drainageElevation[idx] = data.elevation[idx];
        }
      }
    }

    generateLakeOutflows(data);

    const outflowPaths = data.riverPaths.filter(p => p.id.includes('outflow'));
    expect(outflowPaths.length).toBe(0);
  });
});
