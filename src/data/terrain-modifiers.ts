/**
 * Terrain-based attribute modifiers.
 *
 * Applied when an agent is located_at a location with a matching terrain type.
 * Only terrains that actually modify attributes are listed — absence means no modifier.
 */
import type { TerrainType } from '../types';

/** Terrain → attribute → delta. Only non-zero entries present. */
export const TERRAIN_MODIFIERS: Partial<Record<TerrainType, Record<string, number>>> = {
  // Dense vegetation blocks line of sight
  dense_forest:               { los_range: -1 },
  jungle:                     { los_range: -1 },
  great_home_trees:           { los_range: -1 },
  forested_hills_jungle:      { los_range: -1 },

  // Elevation grants vision
  mountains:                  { los_range: 2 },
  hills:                      { los_range: 1 },
  plateau:                    { los_range: 1 },
  forested_hills_evergreen:   { los_range: 0 }, // elevation + forest cancel out
  forested_hills_deciduous:   { los_range: 0 }, // elevation + forest cancel out

  // Fog/mist blocks vision
  swamp:                      { los_range: -1 },
  bog:                        { los_range: -1 },

  // Extreme conditions
  glacier:                    { los_range: 1 },  // flat + reflective
  volcanic:                   { los_range: -1 }, // smoke/haze
};

/** Get modifiers for a terrain type. Returns empty object if none. */
export function getTerrainModifiers(terrain: TerrainType): Record<string, number> {
  return TERRAIN_MODIFIERS[terrain] ?? {};
}
