import { useMemo } from 'react';
import type { RiverPath } from '../../engine/worldGenData';
import { createWorldGenData } from '../../engine/worldGenData';
import { generateLakes } from '../../engine/lakeGeneration';
import { fillDepressions } from '../../engine/depressionFilling';
import { generateRivers } from '../../engine/riverGeneration';
import { promoteDepressionLakes } from '../../engine/depressionLakes';
import { generateLakeOutflows } from '../../engine/lakeOutflow';

export function useRivers(
  cols: number,
  rows: number,
  seed: number,
): RiverPath[] {
  return useMemo(() => {
    const data = createWorldGenData(cols, rows, seed);
    generateLakes(data);              // Find basins, flood-fill lakes
    fillDepressions(data);            // Compute drainageElevation + filledDepth
    generateRivers(data);             // Route on drainageElevation, with coastal continuation + forking
    promoteDepressionLakes(data);     // Convert 2+ hex river-fed depressions to lakes
    generateLakeOutflows(data);       // Spawn outflow rivers from lakes with inflows
    return data.riverPaths;
  }, [cols, rows, seed]);
}
