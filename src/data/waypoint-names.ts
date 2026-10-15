/**
 * Waypoint names (THR-1857).
 *
 * A movement Waypoint (`loc.transient.<col>.<row>`, `hexMovementPath.ts`) used to be
 * named "Wilderness (14, 14)", and the thread view showed that coordinate to the player
 * ("Offer a Small Prayer at Wilderness (14, 14)"). A waypoint is now named like a place
 * on a map, for the nearest settlement and its ground: "Hawkgate Woods". A proper noun
 * with no article reads right both mid-sentence ("at Hawkgate Woods") and where a
 * template opens a sentence with `{location}` ("Hawkgate Woods absorbed the consequence").
 */

import type { TerrainType } from '../types';

/** How far (hexes) a settlement may be and still lend a waypoint its name. */
export const WAYPOINT_NAME_SETTLEMENT_RADIUS_HEXES = 8;

/** The ground word when the terrain is missing or not listed below. */
export const WAYPOINT_DEFAULT_GROUND = 'Wilds';

/** Leads the ground word when no settlement is in reach: "Nameless Hills". */
export const WAYPOINT_UNNAMED_PREFIX = 'Nameless';

/** The ground word for a waypoint's terrain. */
export const WAYPOINT_GROUND_BY_TERRAIN: Partial<Record<TerrainType, string>> = {
  // Water — a waypoint on water is a ford, a shore or a crossing
  coast: 'Shore',
  coastal_shallows: 'Shallows',
  lake: 'Lakeshore',
  river: 'Crossing',
  reef: 'Shore',
  // Lowlands
  grassland: 'Downs',
  farmland: 'Fields',
  savanna: 'Plains',
  steppe: 'Steppe',
  floodplain: 'Flats',
  // Forest
  temperate_forest: 'Forest',
  dense_forest: 'Deepwood',
  boreal_forest: 'Pinewood',
  jungle: 'Jungle',
  tropical_forest: 'Jungle',
  evergreen_forest: 'Pinewood',
  light_forest: 'Woods',
  dead_forest: 'Deadwood',
  forested_hills: 'Wooded Hills',
  great_home_trees: 'Great Trees',
  // Wet
  swamp: 'Swamp',
  marsh: 'Marsh',
  moor_bog: 'Moor',
  // Elevated
  hills: 'Hills',
  mountains: 'Mountains',
  high_mountains: 'Peaks',
  plateau: 'Highlands',
  badlands: 'Badlands',
  mountain_pass: 'Pass',
  // Special
  broken_lands: 'Broken Lands',
  oasis: 'Oasis',
  // Extreme
  desert: 'Desert',
  rocky_desert: 'Stonelands',
  sand_dunes: 'Dunes',
  tundra: 'Tundra',
  glacier: 'Ice',
  volcano: 'Ashlands',
  arctic: 'Ice',
  snow_fields: 'Snowfields',
};

/** "Hawkgate Woods", or "Nameless Woods" when no settlement is near. */
export function composeWaypointName(terrain: TerrainType | undefined, nearSettlementName: string | undefined): string {
  const ground = (terrain && WAYPOINT_GROUND_BY_TERRAIN[terrain]) || WAYPOINT_DEFAULT_GROUND;
  return `${nearSettlementName ?? WAYPOINT_UNNAMED_PREFIX} ${ground}`;
}
