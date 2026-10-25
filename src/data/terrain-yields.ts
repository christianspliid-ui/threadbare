/**
 * What one worked hex yields each day, by terrain — the settlement economy's land (THR-1923).
 *
 * `[food, wood, stone]` per day for one person working one hex. One entry per terrain
 * (UI Law 58): a new `TerrainType` is one row here, and `terrainYields.test.ts` fails a
 * terrain with no row. The seventeen the world generator places today carry the
 * prototype's values; the rest are set by the nearest of those seventeen.
 *
 * Plan: Docs/plans/2026-10-14-thr-1923-settlement-economy.md § Data tables.
 */
import type { TerrainType } from '../types';

export type YieldTriple = readonly [food: number, wood: number, stone: number];

/** The three yield channels, by index into a {@link YieldTriple}. */
export const YIELD_CHANNELS = ['food', 'wood', 'stone'] as const;
export type YieldChannel = typeof YIELD_CHANNELS[number];

export const TERRAIN_YIELDS: Readonly<Record<TerrainType, YieldTriple>> = {
  // Water — fish from the shallows; nothing from the deep.
  ocean: [1, 0, 0],
  deep_ocean: [0, 0, 0],
  tropical_ocean: [1, 0, 0],
  coastal_shallows: [2, 0, 0],
  coast: [2, 0, 0],
  lake: [2, 0, 0],
  river: [2.5, 0, 0],
  reef: [1.5, 0, 0],
  // Lowlands — the fields.
  grassland: [3, 0, 0],
  farmland: [3.5, 0, 0],
  savanna: [2, 0, 0],
  steppe: [2.5, 0, 0],
  floodplain: [4, 0, 0],
  // Forest — timber, a little forage.
  temperate_forest: [1, 3, 0],
  dense_forest: [0, 3, 0],
  boreal_forest: [1, 2, 0],
  jungle: [1, 2, 0],
  tropical_forest: [1, 3, 0],
  evergreen_forest: [1, 2.5, 0],
  light_forest: [1.5, 2, 0],
  dead_forest: [0, 1, 0],
  // Wet — peat and reeds.
  swamp: [0.5, 1, 0],
  marsh: [1, 0.5, 0],
  moor_bog: [0.5, 1, 0],
  // Elevated — stone.
  hills: [1, 1, 2],
  mountains: [0, 0, 3],
  high_mountains: [0, 0, 1],
  plateau: [2, 0, 1],
  badlands: [0, 0, 1.5],
  mountain_pass: [0, 0, 1],
  forested_hills: [1, 2, 1],
  // Special.
  great_home_trees: [1, 2, 0],
  broken_lands: [0, 0, 1],
  oasis: [2, 0.5, 0],
  // Extreme — little of anything.
  desert: [0, 0, 0.5],
  rocky_desert: [0, 0, 1],
  sand_dunes: [0, 0, 0],
  tundra: [1, 0, 0],
  glacier: [0, 0, 0],
  volcano: [0, 0, 2],
  arctic: [0, 0, 0],
  snow_fields: [0, 0, 0],
};

/** Terrain counted as fields by the mill's `needs`. */
export const FIELD_TERRAINS: ReadonlySet<TerrainType> = new Set<TerrainType>(['grassland', 'floodplain', 'farmland']);
/** Terrain counted as fishing water by the wharf's `needs`. */
export const FISHING_TERRAINS: ReadonlySet<TerrainType> = new Set<TerrainType>(['coastal_shallows', 'coast', 'ocean', 'lake', 'reef', 'tropical_ocean']);
/** Terrain counted as grazing by the beast pens' `needs`. */
export const GRAZING_TERRAINS: ReadonlySet<TerrainType> = new Set<TerrainType>(['steppe', 'savanna']);
/**
 * Terrain a settlement never works: open sea a person cannot farm. The deep yields
 * nothing anyway; listing it keeps it out of the worked-hex count a trait reads.
 */
export const UNWORKABLE_TERRAINS: ReadonlySet<TerrainType> = new Set<TerrainType>(['deep_ocean']);

/**
 * Resource deposits on a place add to its hex's yield (quantity ÷ `DEPOSIT_YIELD_DIVISOR`)
 * in this channel. A resource with no row adds nothing to the land (ore is a special good,
 * not a build material).
 */
export const DEPOSIT_YIELD_CHANNEL: Readonly<Record<string, YieldChannel>> = {
  grain: 'food',
  grazing: 'food',
  fish: 'food',
  water: 'food',
  timber: 'wood',
  peat: 'wood',
  stone: 'stone',
};
