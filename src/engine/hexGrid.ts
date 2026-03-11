import type { CosmologyProfile, HexTile } from '../types';
import { generateHexGrid } from '../lib/hexMath';
import { generateGeoField } from './forceField';
import { classifyBiome } from './terrain';

export function generateWorld(
  cosmology: CosmologyProfile,
  cols: number,
  rows: number,
  seed: number,
): HexTile[] {
  // Note: generateWorld uses cosmology-biased geoField directly.
  // The WorldGenData pipeline (createWorldGenData) runs without cosmology
  // for rivers/lakes. Full unification deferred until forceField supports
  // cosmology in the pipeline path.
  const coords = generateHexGrid(cols, rows);
  const geoField = generateGeoField(cols, rows, seed, cosmology);

  return coords.map(coord => {
    const geoParams = geoField.get(`${coord.col},${coord.row}`);
    if (!geoParams) {
      throw new Error(`Missing geo params for coord ${coord.col},${coord.row}`);
    }

    const terrain = classifyBiome(
      geoParams.elevation,
      geoParams.temperature,
      geoParams.moisture
    );

    return { coord, geoParams, terrain };
  });
}

/**
 * Pipeline-based world generation (for rivers/lakes passes).
 * Returns WorldGenData that can be enriched by passes, then converted to HexTile[].
 */
export { createWorldGenData, toHexTiles } from './worldGenData';
export type { WorldGenData, RiverPath } from './worldGenData';
