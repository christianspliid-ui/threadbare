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
  /**
   * THR-1931 — the last pay day the faction purse paid this army. Optional: an army
   * raised before the purse reads as paid through `raisedTick`. `checkUnderfunded`
   * reads it; an army unpaid past one pay day loses cohesion and, at 0, deserts.
   */
  paidThroughTick?: number;
  /**
   * THR-1974 — the last pay day this army's faction's liege paid its upkeep (the `crown`
   * phase wage step). A tick, never an id: the liege is read from the live `sworn_to`
   * edge. Fresh for `LIEGE_COMMAND_WINDOW_TICKS`, the army fights for and eats from the liege.
   */
  liegePaidTick?: number;
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
  /** THR-1933 — set while the army holds for want of a target; null otherwise. */
  holdReason?: ArmyHoldReason | null;
  /** THR-1933 — the top scored towns from the last pick (debug Armies tab, `__DEBUG.getWarAims`). */
  warAimCandidates?: WarAimCandidate[];
}

export interface ArmyObjective {
  type: 'raid' | 'conquer' | 'defend' | 'intercept' | 'reinforce_siege';
  targetNodeId: string;
  estimatedAttrition: number;
  /** THR-1933 — why this target: the largest contributor to its war-aim score, or defence. */
  reason?: WarAimReason;
  /** THR-1933 — the staple behind a `feeds_staple` reason (the sheet names the good). */
  reasonResourceId?: string;
  /** THR-1955 — the enemy whose regional monopoly a `breaks_monopoly` march breaks. */
  reasonFactionId?: string;
  /** THR-1933 — the enemy army a `defend` objective holds against. */
  againstArmyId?: string;
  /** THR-1933 — who set it. `agenda` (a notable's campaign) is never re-aimed. Missing reads as `war_aim`. */
  source?: 'war_aim' | 'agenda';
}

/** THR-1933 — why an army marches where it does (S2 adds the two monopoly reasons' writers). */
export type WarAimReason = 'richest' | 'feeds_staple' | 'breaks_monopoly' | 'completes_monopoly' | 'defence';

/** THR-1933 — why an army with no objective holds. */
export type ArmyHoldReason = 'no_enemy_in_reach';

/** THR-1933 — one scored town from the army's last war-aim pick (debug only, never rendered). */
export interface WarAimCandidate {
  townId: string;
  value: number;
  bonuses: number;
  hexes: number;
  score: number;
  inReach: boolean;
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
 * THR-1973 — factions that keep a standing army whatever their ambition: a realm's host
 * and a free company's company. Others raise only under a military ambition. A faction
 * ambition never ends on its own, so without this a realm that drew a trade ambition
 * never raised again once its first army was gone.
 */
export const STANDING_ARMY_FACTION_CLASSES: readonly string[] = ['realm'];
export const STANDING_ARMY_FACTION_DEF_IDS: readonly string[] = ['mercenary_company'];

/**
 * THR-1973 — cohesion an army regains per tick while garrisoned: at rest in a settlement
 * its own faction holds, paid and supplied. A garrisoned army pays no attrition; it heals
 * back to `cohesionMax` (from 0, a host in ~17 days, a warband in 5). The march, an
 * empty purse or an empty larder still wear it down as before.
 */
export const ARMY_GARRISON_RECOVERY = 0.5;

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
