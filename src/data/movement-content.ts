/**
 * Movement System Content Data
 *
 * Tunable constants for terrain traversal taxes, location entry taxes,
 * and distance decay. All values are design-tuneable and enable systematic
 * rebalancing of movement costs across the world.
 */

import type { TerrainType, LocationSubtype } from '../types';

/**
 * Terrain movement taxes (added to BASE_EDGE_TRAVERSAL_COST per edge)
 *
 * Categorized by difficulty:
 * - Easy (0): Flat, open terrain with good footing
 * - Light (+0.5): Slightly difficult; forests, gentle elevation, shallow water
 * - Moderate (+1): Clearly difficult; dense vegetation, extreme elevation, badlands
 * - Heavy (+1.5): Very difficult; major mountains, glaciers, volcanoes
 * - Passable (+0.5): Special case; mountain passes offer shortcuts through difficult terrain
 * - Impassable (Infinity): Deep water, unreachable without special ability
 */
export const TERRAIN_TAXES: Record<TerrainType, number> = {
  // Easy (0) — flat, open, good footing
  grassland: 0,
  farmland: 0,
  savanna: 0,
  steppe: 0,
  floodplain: 0,
  coast: 0,
  oasis: 0,

  // Light (+0.5) — slightly difficult
  temperate_forest: 0.5,
  light_forest: 0.5,
  tropical_forest: 0.5,
  evergreen_forest: 0.5,
  hills: 0.5,
  moor_bog: 0.5,
  tundra: 0.5,
  boreal_forest: 0.5,
  forested_hills: 0.5,
  plateau: 0.5,
  coastal_shallows: 0.5,

  // Moderate (+1) — clearly difficult
  swamp: 1,
  marsh: 1,
  desert: 1,
  rocky_desert: 1,
  sand_dunes: 1,
  dead_forest: 1,
  arctic: 1,
  snow_fields: 1,
  jungle: 1,
  badlands: 1,
  broken_lands: 1,
  great_home_trees: 1,
  dense_forest: 1,

  // Heavy (+1.5) — very difficult
  mountains: 1.5,
  high_mountains: 1.5,
  volcano: 1.5,
  glacier: 1.5,

  // Passable (+0.5) — special case; shortcut through difficult terrain
  mountain_pass: 0.5,

  // Impassable (Infinity) — deep water, unreachable without special ability
  ocean: Infinity,
  deep_ocean: Infinity,
  tropical_ocean: Infinity,
  reef: Infinity,
  lake: Infinity,
  river: 1,
};

/**
 * Location entry taxes (added when entering a location's hex)
 *
 * Categorized by settlement size and defensibility:
 * - Free (0): Wilderness, small settlements, undefended places
 * - Light (0.5): Towns, isolated structures, some ruins
 * - Moderate (1): Cities, castles, major ruined settlements
 * - Heavy (1.5): Capitals, heavily fortified locations, temples
 */
export const LOCATION_ENTRY_TAXES: Record<LocationSubtype, number> = {
  // Free (0) — no meaningful entry cost
  wilderness: 0,
  hamlet: 0,
  camp: 0,
  farmland: 0,
  battleground: 0,
  oasis: 0,
  unexplored_poi: 0,

  // Light (0.5) — some entry resistance
  town: 0.5,
  shrine: 0.5,
  ruins: 0.5,
  ruined_tower: 0.5,
  ruined_village: 0.5,
  mining: 0.5,
  tower: 0.5,

  // Moderate (1) — significant entry cost
  city: 1,
  castle: 1,
  ruined_city: 1,

  // Heavy (1.5) — major entry cost
  capital: 1.5,
  fort: 1.5,
  temple: 1.5,
};

/**
 * Base tick cost per graph edge traversal.
 * Every edge costs at least this before terrain/location taxes.
 */
export const BASE_EDGE_TRAVERSAL_COST = 1;

/**
 * Ticks between agent destination re-evaluation (~1 in-game day).
 * Idle agents reconsider their destination every N ticks.
 */
export const DECISION_REEVALUATION_TICKS = 4;

/**
 * Number of recent movement entries kept for trail rendering.
 */
export const TRAIL_HISTORY_TICKS = 6;

/**
 * Distance decay factor for range-based effects
 *
 * Applied to scale values based on distance from origin.
 * Example: effect_at_distance = base_effect * (1 - DISTANCE_DECAY_FACTOR * distance)
 */
export const DISTANCE_DECAY_FACTOR = 0.15;

/**
 * Default location entry tax for unknown/unmapped locations
 *
 * Used as fallback when location subtype is not found in LOCATION_ENTRY_TAXES.
 */
export const DEFAULT_LOCATION_ENTRY_TAX = 0;

/**
 * Minimum edge cost for traversal
 *
 * Ensures even the cheapest traversals have a base cost to avoid zero-cost paths.
 */
export const MIN_EDGE_COST = 0.5;

// --- Road Cost Constants ---

/**
 * Discount applied to major road A* cost at pathfinding time.
 * Lower = faster travel. Road totalCost × this multiplier = effective cost.
 */
export const ROAD_MAJOR_COST_MULTIPLIER = 0.4;

/**
 * Discount applied to trail A* cost at pathfinding time.
 * Trails are slower than major roads but still faster than off-road.
 */
export const ROAD_TRAIL_COST_MULTIPLIER = 0.7;

/**
 * Floor for per-hex road cost (prevents instant traversal of short roads).
 */
export const MIN_ROAD_HEX_COST = 0.25;

/**
 * New destination must score this much better than current to trigger mid-movement reroute.
 */
export const REROUTE_SCORE_MULTIPLIER = 1.5;

/**
 * Maximum tick distance to consider for movement candidates.
 * Locations further than this are not evaluated as destinations.
 */
export const MAX_CANDIDATE_DISTANCE = 40;

/**
 * P0 base motivation pull for reachable hex_center locations.
 * Floor value before ambition bonus is applied.
 * P1 replaces this with full axiological scoring.
 */
export const P0_BASE_MOTIVATION_PULL = 0.3;

/**
 * P0 weight applied to agent ambition for movement motivation.
 * motivationPull = P0_BASE_MOTIVATION_PULL + max(0, ambition) × P0_AMBITION_WEIGHT
 */
export const P0_AMBITION_WEIGHT = 0.4;

/**
 * Default quest priority for encounters without explicit questPriority.
 * Used as the multiplier when an encounter doesn't specify a priority value.
 */
export const DEFAULT_QUEST_PRIORITY = 1.0;

/**
 * Minimum score threshold for movement candidates to be selected.
 * Candidates scoring below this are ignored.
 */
export const MOVEMENT_SCORE_THRESHOLD = 0.1;

/**
 * Event significance for agent movement transitions.
 */
export const MOVEMENT_EVENT_SIGNIFICANCE = 0.3;

/**
 * Minimum threat modifier (floor — even max coward keeps some motivation).
 * Prevents threat from reducing movement score to zero, ensuring agents
 * will still consider destinations even in dangerous areas.
 */
export const THREAT_MODIFIER_FLOOR = 0.1;

/**
 * Get terrain tax for a specific terrain type
 *
 * Returns the tunable cost modifier for traversing that terrain.
 * Infinity indicates impassable terrain (deep water, unreachable).
 */
export function getTerrainTax(terrain: TerrainType): number {
  return TERRAIN_TAXES[terrain] ?? 0;
}

/**
 * Get location entry tax for a specific location subtype
 *
 * Returns the tunable cost for entering that location's hex.
 * Falls back to DEFAULT_LOCATION_ENTRY_TAX if location is unknown.
 */
export function getLocationEntryTax(location: LocationSubtype): number {
  return LOCATION_ENTRY_TAXES[location] ?? DEFAULT_LOCATION_ENTRY_TAX;
}
