import type { TerrainType } from '../types';

const TERRAIN_TO_SOUND_KEY: Record<TerrainType, string> = {
  ocean: 'water', deep_ocean: 'water', tropical_ocean: 'water',
  coastal_shallows: 'water', coast: 'water', lake: 'water', river: 'water', reef: 'water',
  grassland: 'grassland', farmland: 'grassland', savanna: 'grassland',
  steppe: 'grassland', floodplain: 'grassland', oasis: 'grassland',
  light_forest: 'forest', temperate_forest: 'forest', dense_forest: 'forest',
  boreal_forest: 'forest', tropical_forest: 'forest', jungle: 'forest',
  evergreen_forest: 'forest', great_home_trees: 'forest', dead_forest: 'wasteland',
  marsh: 'swamp', swamp: 'swamp', moor_bog: 'swamp',
  hills: 'mountains', forested_hills: 'mountains', mountains: 'mountains',
  high_mountains: 'mountains', plateau: 'plateau', mountain_pass: 'mountains',
  desert: 'desert', rocky_desert: 'desert', sand_dunes: 'desert', badlands: 'desert',
  tundra: 'tundra', snow_fields: 'tundra', glacier: 'tundra', arctic: 'tundra',
  volcano: 'volcanic',
  broken_lands: 'wasteland',
};

export function terrainToSoundKey(terrain: TerrainType): string {
  const key = TERRAIN_TO_SOUND_KEY[terrain];
  if (!key) {
    console.warn(`[audio] No sound key for terrain type: ${terrain}. Falling back to grassland.`);
    return 'grassland';
  }
  return key;
}
