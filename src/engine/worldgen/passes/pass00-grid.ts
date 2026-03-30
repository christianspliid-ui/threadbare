/**
 * Pass 00: Grid Scaffold
 *
 * Allocates all typed arrays and returns an empty WorldGenContext ready for
 * subsequent passes to populate.
 *
 * NFP #1 Tunability: All sizes derived from params — no magic numbers.
 * NFP #3 Determinism: No PRNG used in this pass; pure allocation.
 * NFP #4 Fail-soft: Returns valid empty context on any invalid params.
 */
import type { WorldGenContext, WorldGenParams } from '../types';

export function runGridPass(params: WorldGenParams): WorldGenContext {
  const { cols, rows, seed } = params;
  const total = cols * rows;

  const elevation = new Float32Array(total);
  const temperature = new Float32Array(total);
  const moisture = new Float32Array(total);
  const isOcean = new Uint8Array(total).fill(1); // all ocean until elevation pass
  const terrain = new Array<import('../../../types').TerrainType>(total).fill('ocean');
  const hasRiver = new Uint8Array(total);
  const lakeIds = new Int16Array(total).fill(-1);
  const drainageElevation = new Float32Array(total);
  const filledDepth = new Float32Array(total);

  // Province arrays
  const provinceIds = new Int16Array(total).fill(-1);
  const provinceRoles = new Uint8Array(total); // 0=capital by default

  // Identity stub sampling functions — replaced by elevation pass
  const identityFn = (col: number, row: number): number => {
    const c = Math.max(0, Math.min(cols - 1, Math.round(col)));
    const r = Math.max(0, Math.min(rows - 1, Math.round(row)));
    return elevation[r * cols + c];
  };

  return {
    cols,
    rows,
    seed,

    // WorldGenData fields
    elevation,
    temperature,
    moisture,
    isOcean,
    terrain,
    hasRiver,
    riverPaths: [],
    lakeIds,
    drainageElevation,
    filledDepth,

    // Province fields
    provinceIds,
    provinceRoles,
    provinces: [],
    provinceCapitalHexes: [],

    // Elevation features
    ridges: [],
    canyons: [],

    // Sampling stubs (elevation pass will replace sampleElevation)
    sampleElevation: identityFn,
    sampleTemperature: (col, row) => {
      const c = Math.max(0, Math.min(cols - 1, Math.round(col)));
      const r = Math.max(0, Math.min(rows - 1, Math.round(row)));
      return temperature[r * cols + c];
    },
    sampleMoisture: (col, row) => {
      const c = Math.max(0, Math.min(cols - 1, Math.round(col)));
      const r = Math.max(0, Math.min(rows - 1, Math.round(row)));
      return moisture[r * cols + c];
    },
  };
}
