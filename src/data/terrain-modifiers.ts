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
  // Elevation grants vision
  mountains:                  { los_range: 2 },
  hills:                      { los_range: 1 },
  plateau:                    { los_range: 1 },
  // Note: forested_hills intentionally omitted —
  // elevation (+1) and forest cover (-1) cancel to net zero.

  // Fog/mist blocks vision
  swamp:                      { los_range: -1 },
  marsh:                        { los_range: -1 },

  // Extreme conditions
  glacier:                    { los_range: 1 },  // flat + reflective
  volcano:                   { los_range: -1 }, // smoke/haze
};

/** Get modifiers for a terrain type. Returns empty object if none. */
export function getTerrainModifiers(terrain: TerrainType): Record<string, number> {
  return TERRAIN_MODIFIERS[terrain] ?? {};
}
