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

// ─── Supply (THR-626) ───────────────────────────────────────────────────

/**
 * Public vocabulary for an army's provisioning state (THR-626).
 *
 * The larder scalar behind this is private and never rendered — every surface
 * (prose, DebugPanel, `__DEBUG.getArmies()`) reads the tier, per the Flow Web
 * commitment that tiers are the only read surface. Derivation lives in
 * `engine/armySupply.ts`; thresholds in `data/army-supply-config.ts`.
 */
export type ArmySupplyTier = 'supplied' | 'strained' | 'starving';

// ─── Army State ─────────────────────────────────────────────────────────

export interface ArmyState {
  /** Army size category — affects battle strength, movement speed, supply cost */
  size: ArmySizeCategory;
  /** Approximate headcount */
  headcount: number;
  /** Current objective — what the army is trying to do */
  objective: ArmyObjective | null;
  /** Cohesion score — army cohesion/quality/health. Silently degrades */
  cohesion: number;
  /** Maximum cohesion at full strength */
  cohesionMax: number;
  /** Tick the army was raised */
  raisedTick: number;
  /** Gold cost per tick to maintain */
  maintenanceCost: number;
  /** Attrition thresholds already fired (prevents re-firing) */
  thresholdsFired: string[];
  /**
   * THR-626 — provisions on hand, in abstract units. Optional: an army raised
   * before this system reads as full rather than starving (see `readArmySupply`).
   * Never rendered; `supplyTier` is what surfaces.
   */
  supply?: number;
  /** THR-626 — larder ceiling. Optional, defaults to `ARMY_SUPPLY_MAX`. */
  supplyMax?: number;
  /**
   * THR-626 — derived provisioning state, refreshed by `phaseArmySupply`. Stored
   * rather than derived on read so UI/debug surfaces and the attrition phase all
   * see one value per tick, and so a save carries the army's felt condition.
   */
  supplyTier?: ArmySupplyTier;
  /** THR-626 — location id currently provisioning this army; null when cut off. */
  supplyHostId?: string | null;
  /** THR-626 — conduit hops to that host; null when cut off. */
  supplyHops?: number | null;
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

/**
 * Location subtypes a raised army may march against as a conquest objective.
 * A settlement controlled by a hostile faction becomes a siege target on arrival
 * (see `phaseBattleDetection`). Kept here so the target set is tunable in one place.
 */
export const SETTLEMENT_TARGET_SUBTYPES: readonly string[] = [
  'hamlet', 'town', 'city', 'capital', 'castle', 'fort',
];

/** Starting cohesion by army size */
export const ARMY_COHESION_BASE: Record<ArmySizeCategory, number> = {
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
