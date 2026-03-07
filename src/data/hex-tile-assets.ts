import type { TerrainType } from '../types';

export const TERRAIN_TILE_MAP: Record<TerrainType, string> = {
  ocean: 'ocean.png',
  coastal_shallows: 'coastal-shallows.png',
  lake: 'lake.png',
  river: 'river.png',
  grassland: 'open-grassland.png',
  farmland: 'farmland.png',
  savanna: 'savanna.png',
  steppe: 'steppe.png',
  deciduous_forest: 'deciduous-forest.png',
  dense_forest: 'dense-forest.png',
  taiga: 'taiga.png',
  jungle: 'jungle.png',
  swamp: 'swamp.png',
  bog: 'bog.png',
  hills: 'hills.png',
  mountains: 'mountain.png',
  plateau: 'plateau.png',
  badlands: 'badlands.png',
  desert: 'desert.png',
  tundra: 'tundra.png',
  glacier: 'glacier.png',
  volcanic: 'volcanic.png',
};

export function getHexTileUrl(terrain: TerrainType): string {
  return `/hex-tiles/${TERRAIN_TILE_MAP[terrain]}`;
}
