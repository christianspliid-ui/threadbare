/**
 * Army Types — TB-073 Phase 1.
 *
 * Armies are `actor` graph nodes with an `armyState` property bag.
 * All relationships (commander, faction, location, objective) are graph edges.
 *
 * Design doc: Docs/plans/2026-03-29-conflict-and-destruction-design.md — Phase 1
 */

// ─── Size Categories ────────────────────────────────────────────────────

export type ArmySizeCategory = 'warband' | 'regiment' | 'host';

export const ARMY_SIZE_HEADCOUNT: Record<ArmySizeCategory, number> = {
  warband: 100,
  regiment: 1000,
  host: 10000,
};

// ─── Army State ─────────────────────────────────────────────────────────

export interface ArmyState {
  /** Army size category — affects battle strength, movement speed, supply cost */
  size: ArmySizeCategory;
  /** Approximate headcount */
  headcount: number;
  /** Current objective — what the army is trying to do */
  objective: ArmyObjective | null;
  /** Quintessence score — army cohesion/quality/health. Silently degrades */
  quintessence: number;
  /** Maximum quintessence at full strength */
  quintessenceMax: number;
  /** Tick the army was raised */
  raisedTick: number;
  /** Gold cost per tick to maintain */
  maintenanceCost: number;
  /** Attrition thresholds already fired (prevents re-firing) */
  thresholdsFired: string[];
}

export interface ArmyObjective {
  type: 'raid' | 'conquer' | 'defend' | 'intercept' | 'reinforce_siege';
  targetNodeId: string;
  estimatedAttrition: number;
}

// ─── Constants ──────────────────────────────────────────────────────────

/** Minimum commander Iron capability tier to spawn army */
export const ARMY_SPAWN_IRON_TIER_MIN = 4;

/** Minimum faction Gold capability tier to spawn army */
export const ARMY_SPAWN_GOLD_TIER_MIN = 3;

/** One-time Gold deduction at army creation */
export const ARMY_CREATION_GOLD_COST = 50;

/** Simultaneous active armies per faction (tune upward later) */
export const MAX_ARMIES_PER_FACTION = 1;

/** Starting quintessence by army size */
export const ARMY_QUINTESSENCE_BASE: Record<ArmySizeCategory, number> = {
  warband: 30,
  regiment: 60,
  host: 100,
};

/** Per-tick Gold maintenance cost by army size */
export const ARMY_MAINTENANCE_COST: Record<ArmySizeCategory, number> = {
  warband: 2,
  regiment: 5,
  host: 10,
};

// ─── Size Determination ─────────────────────────────────────────────────

/**
 * Determine army size from faction's Gold capability tier.
 * Deterministic — no PRNG.
 */
export function determineSizeCategory(goldTier: number): ArmySizeCategory {
  if (goldTier >= 7) return 'host';
  if (goldTier >= 5) return 'regiment';
  return 'warband';
}
