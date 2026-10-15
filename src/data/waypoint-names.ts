/**
 * Waypoint names (THR-1857).
 *
 * A movement Waypoint (`loc.transient.<col>.<row>`, `hexMovementPath.ts`) used to be
 * named "Wilderness (14, 14)", and the thread view showed that coordinate to the player
 * ("Offer a Small Prayer at Wilderness (14, 14)"). A waypoint is now named for its
 * ground and the nearest settlement: "the forest near Hawkgate". Lower-case on purpose —
 * the name sits mid-sentence ("at the forest near Hawkgate").
 */

import type { TerrainType } from '../types';

/** How far (hexes) a settlement may be and still lend a waypoint its name. */
export const WAYPOINT_NAME_SETTLEMENT_RADIUS_HEXES = 8;

/** The ground word when the terrain is missing or not listed below. */
export const WAYPOINT_DEFAULT_GROUND = 'the wilds';

/** The ground word for a waypoint's terrain. */
export const WAYPOINT_GROUND_BY_TERRAIN: Partial<Record<TerrainType, string>> = {
  // Water — a waypoint on water is a ford, a shore or a crossing
  coast: 'the shore',
  coastal_shallows: 'the shallows',
  lake: 'the lakeshore',
  river: 'the river crossing',
  reef: 'the shore',
  // Lowlands
  grassland: 'the open country',
  farmland: 'the fields',
  savanna: 'the open country',
  steppe: 'the steppe',
  floodplain: 'the floodplain',
  // Forest
  temperate_forest: 'the forest',
  dense_forest: 'the deep forest',
  boreal_forest: 'the pinewoods',
  jungle: 'the jungle',
  tropical_forest: 'the jungle',
  evergreen_forest: 'the pinewoods',
  light_forest: 'the woods',
  dead_forest: 'the dead woods',
  forested_hills: 'the wooded hills',
  great_home_trees: 'the great trees',
  // Wet
  swamp: 'the swamp',
  marsh: 'the marsh',
  moor_bog: 'the moor',
  // Elevated
  hills: 'the hills',
  mountains: 'the mountains',
  high_mountains: 'the high peaks',
  plateau: 'the high plateau',
  badlands: 'the badlands',
  mountain_pass: 'the pass',
  // Special
  broken_lands: 'the broken lands',
  oasis: 'the oasis',
  // Extreme
  desert: 'the desert',
  rocky_desert: 'the stony desert',
  sand_dunes: 'the dunes',
  tundra: 'the tundra',
  glacier: 'the ice',
  volcano: 'the ash slopes',
  arctic: 'the ice',
  snow_fields: 'the snowfields',
};

/** "the forest near Hawkgate", or the ground alone when no settlement is near. */
export function composeWaypointName(terrain: TerrainType | undefined, nearSettlementName: string | undefined): string {
  const ground = (terrain && WAYPOINT_GROUND_BY_TERRAIN[terrain]) || WAYPOINT_DEFAULT_GROUND;
  return nearSettlementName ? `${ground} near ${nearSettlementName}` : ground;
}
