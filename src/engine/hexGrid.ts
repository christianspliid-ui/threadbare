import type { CosmologyProfile, HexTile } from '../types';
import { generateHexGrid } from '../lib/hexMath';
import { generateForceField } from './forceField';
import { classifyTerrain, deriveTileProperties } from './terrain';

export function generateWorld(
  cosmology: CosmologyProfile,
  cols: number,
  rows: number,
  seed: number,
): HexTile[] {
  const coords = generateHexGrid(cols, rows);
  const forceField = generateForceField(coords, cosmology, seed);

  return coords.map((coord, i) => {
    const forces = forceField[i];
    const terrain = classifyTerrain(forces);
    const { elevation, moisture, magicDensity } = deriveTileProperties(forces);
    return { coord, forces, terrain, elevation, moisture, magicDensity };
  });
}
