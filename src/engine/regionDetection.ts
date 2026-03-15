import type { TerrainType } from '../types';

/** Geographic feature categories for region clustering */
export type RegionFeatureType =
  | 'mountain_range' | 'hill_country' | 'forest' | 'plains'
  | 'desert' | 'wetland' | 'tundra' | 'river' | 'lake' | 'sea';

/** Maps terrain types to their primary geographic feature category. */
export const TERRAIN_TO_FEATURE: Partial<Record<TerrainType, RegionFeatureType>> = {
  mountains: 'mountain_range', high_mountains: 'mountain_range',
  glacier: 'mountain_range', volcano: 'mountain_range', mountain_pass: 'mountain_range',
  hills: 'hill_country', forested_hills: 'hill_country', moor_bog: 'hill_country',
  temperate_forest: 'forest', dense_forest: 'forest', boreal_forest: 'forest',
  jungle: 'forest', tropical_forest: 'forest', evergreen_forest: 'forest',
  light_forest: 'forest', dead_forest: 'forest', great_home_trees: 'forest',
  grassland: 'plains', savanna: 'plains', steppe: 'plains', farmland: 'plains',
  desert: 'desert', rocky_desert: 'desert', sand_dunes: 'desert',
  badlands: 'desert', broken_lands: 'desert',
  swamp: 'wetland', marsh: 'wetland', floodplain: 'wetland',
  tundra: 'tundra', arctic: 'tundra', snow_fields: 'tundra',
  lake: 'lake',
  ocean: 'sea', deep_ocean: 'sea', tropical_ocean: 'sea',
} as const;

/** Feature priority for overlap resolution (lower = higher priority) */
export const FEATURE_PRIORITY: Record<RegionFeatureType, number> = {
  mountain_range: 0, hill_country: 1, forest: 2, plains: 3,
  desert: 4, wetland: 5, tundra: 6, river: 7, lake: 8, sea: 9,
};

/** Minimum cluster size to qualify as a named region (NFP #1: Tunability) */
export const FEATURE_MIN_SIZE: Record<RegionFeatureType, number> = {
  mountain_range: 3, hill_country: 4, forest: 5, plains: 6,
  desert: 4, wetland: 3, tundra: 4, river: 5, lake: 1, sea: 999,
};
