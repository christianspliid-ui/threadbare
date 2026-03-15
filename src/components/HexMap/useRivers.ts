import { useMemo } from 'react';
import type { RiverPath } from '../../engine/worldGenData';
import { createWorldGenData } from '../../engine/worldGenData';
import { generateLakes } from '../../engine/lakeGeneration';
import { generateRivers } from '../../engine/riverGeneration';

export function useRivers(
  cols: number,
  rows: number,
  seed: number,
): RiverPath[] {
  return useMemo(() => {
    const data = createWorldGenData(cols, rows, seed);
    // Lakes first — rivers can terminate at lake hexes
    generateLakes(data);
    generateRivers(data);
    return data.riverPaths;
  }, [cols, rows, seed]);
}
