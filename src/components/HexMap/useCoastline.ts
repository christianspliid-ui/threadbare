import { useMemo } from 'react';
import type { HexTile } from '../../types';
import type { CoastlineData, CoastlineConfig } from '../../types/coastline';
import { COASTLINE_DEFAULTS } from '../../types/coastline';
import { computeCoastline } from '../../engine/coastline';

export function useCoastline(
  tiles: HexTile[],
  hexSize: number,
  cols: number,
  rows: number,
  seed: number,
  config: CoastlineConfig = COASTLINE_DEFAULTS,
): CoastlineData {
  return useMemo(
    () => computeCoastline(tiles, hexSize, cols, rows, seed, config),
    [tiles, hexSize, cols, rows, seed, config],
  );
}
