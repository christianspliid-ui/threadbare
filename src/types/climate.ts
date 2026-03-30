export type ClimateGroup = 'cold' | 'temperate' | 'warm_dry' | 'warm_wet';

export const BIOME_CLIMATE_MAP: Record<string, ClimateGroup> = {
  // Cold
  tundra: 'cold',
  ice_field: 'cold',
  glacier: 'cold',
  mountain: 'cold',
  // Temperate
  forest: 'temperate',
  grassland: 'temperate',
  hills: 'temperate',
  wetland: 'temperate',
  river: 'temperate',
  lake: 'temperate',
  temperate_forest: 'temperate',
  // Warm & Dry
  desert: 'warm_dry',
  savanna: 'warm_dry',
  volcano: 'warm_dry',
  badlands: 'warm_dry',
  mesa: 'warm_dry',
  scrubland: 'warm_dry',
  // Warm & Wet
  swamp: 'warm_wet',
  jungle: 'warm_wet',
  tropical_coast: 'warm_wet',
  coral_reef: 'warm_wet',
  mangrove: 'warm_wet',
  rainforest: 'warm_wet',
};

export const DEFAULT_CLIMATE: ClimateGroup = 'temperate';

/** Get climate group for a terrain type. Falls back to temperate for unknown biomes. */
export function getClimateGroup(terrain: string): ClimateGroup {
  return BIOME_CLIMATE_MAP[terrain] ?? DEFAULT_CLIMATE;
}
