/**
 * Army Movement — TB-073 Phase 2.
 *
 * Armies move toward their objective using simplified location-to-location
 * pathfinding. They are slower than agents and terrain penalties are amplified.
 *
 * Design doc: Docs/plans/2026-03-29-conflict-and-destruction-design.md — Phase 2
 * NFP: Tunability (all multipliers named constants), Determinism (no PRNG),
 *       Fail-soft (unknown terrain → plains, no path → stay).
 */

import type { ArmySizeCategory } from '../types/army';

// ─── Constants ───────────────────────────────────────────────────────────

/** Movement cost multipliers for armies (vs. base terrain cost of 1.0) */
export const ARMY_MOVEMENT_COST_MULTIPLIERS: Record<string, number> = {
  plains: 1.5,
  grassland: 1.5,
  forest: 2.5,
  hills: 2.0,
  mountains: 4.0,
  desert: 3.0,
  swamp: 3.5,
  coast: 1.5,
  water: Infinity,
  tundra: 2.5,
  volcanic: 3.0,
  steppe: 1.5,
  savanna: 1.5,
  jungle: 3.0,
  taiga: 2.5,
  glacier: 4.0,
  bog: 3.5,
  badlands: 3.0,
  plateau: 2.0,
  lake: Infinity,
  ocean: Infinity,
  river: 2.0,
};

/** Fallback cost for unknown terrain types */
export const ARMY_UNKNOWN_TERRAIN_COST = 1.5;

/** Road discount for armies (stronger than for agents — roads matter more) */
export const ARMY_ROAD_DISCOUNT = 0.4;

/** Base movement speed by army size (hexes worth of movement budget per tick) */
export const ARMY_SPEED: Record<ArmySizeCategory, number> = {
  warband: 2,
  regiment: 1.5,
  host: 1,
};

// ─── Cost Calculation ───────────────────────────────────────────────────

/**
 * Get the movement cost for an army to traverse a terrain type.
 * Returns Infinity for impassable terrain.
 */
export function getArmyTerrainCost(terrainType: string): number {
  return ARMY_MOVEMENT_COST_MULTIPLIERS[terrainType] ?? ARMY_UNKNOWN_TERRAIN_COST;
}

/**
 * Get the effective movement cost for an army at a hex, accounting for roads.
 */
export function getArmyMovementCost(terrainType: string, isOnRoad: boolean): number {
  const baseCost = getArmyTerrainCost(terrainType);
  if (baseCost === Infinity) return Infinity;
  return isOnRoad ? baseCost * (1 - ARMY_ROAD_DISCOUNT) : baseCost;
}
