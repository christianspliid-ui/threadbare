/**
 * Battle Types — TB-073 Phase 3.
 *
 * Battles are actor nodes with a `battleState` property bag.
 * They are located at hexes and connected to participating armies
 * via `participates_in` edges.
 *
 * Design doc: Docs/plans/2026-03-29-conflict-and-destruction-design.md — Phase 3
 */

// ─── Battle State ───────────────────────────────────────────────────────

export interface BattleState {
  /** Battle type — determines pacing and spotlight pool */
  battleType: 'field_battle' | 'siege';
  /** Momentum — positive = attacker winning, negative = defender winning */
  momentum: number;
  /** Composited prose updated each tick */
  backgroundProse: string;
  /** IDs of spotlight child encounters spawned so far */
  spotlightHistory: string[];
  /** Ticks since last spotlight (for pacing) */
  ticksSinceLastSpotlight: number;
  /** Tick the battle started */
  startedTick: number;
  /** Settlement under siege (if applicable) */
  settlementId?: string;
  /** Initial momentum offset from size/modifier calculation */
  initialMomentumOffset: number;
  /** Attacker army ID (first army to enter battle) */
  attackerArmyId: string;
  /** Defender army ID */
  defenderArmyId: string;
  /** Spotlight threshold IDs that have already fired (prevents double-spawn) */
  thresholdsFired: string[];
}

export type BattleResolutionType =
  | 'attacker_victory'
  | 'defender_victory'
  | 'stalemate'
  | 'mutual_destruction';

// ─── Constants ──────────────────────────────────────────────────────────

/** Momentum magnitude that ends the battle */
export const BATTLE_RESOLUTION_THRESHOLD = 8;

/** Base momentum shift per spotlight outcome */
export const BATTLE_MOMENTUM_PER_SPOTLIGHT_BASE = 2;

/** Ticks between spotlights in field battles */
export const FIELD_BATTLE_SPOTLIGHT_INTERVAL = 1;

/** Maximum ticks before forced resolution */
export const FIELD_BATTLE_MAX_DURATION = 5;

/** Quintessence loss per tick during active combat */
export const BATTLE_COMBAT_ATTRITION = 2.0;

/** How much size ratio translates to initial momentum */
export const SIZE_MOMENTUM_SCALE = 1.5;

/** Battle spotlights cost more essence than normal encounters */
export const SPOTLIGHT_INTERVENTION_COST_MULTIPLIER = 1.5;

/** Effective size multiplier for basic walls */
export const FORTIFICATION_BASIC = 10;

/** Effective size multiplier for grand fortress */
export const FORTIFICATION_GRAND = 30;

/** Multiplier for prepared defensive position */
export const PREPARED_DEFENSE_MULTIPLIER = 3;

/** Maximum tactical advantage multiplier */
export const TACTICAL_MAX_MULTIPLIER = 20;

/** Fortification multiplier after breach (30% of original) */
export const BREACH_FORTIFICATION_REDUCTION = 0.3;

// ─── Siege Constants ────────────────────────────────────────────────────

/** Ticks between spotlights at siege start */
export const SIEGE_INITIAL_INTERVAL = 5;

/** How many ticks before spotlight interval decreases by 1 */
export const SIEGE_ACCELERATION_RATE = 6;

/** Maximum siege length before forced resolution */
export const SIEGE_MAX_DURATION = 40;

/** Higher than field battle — sieges are harder to decide */
export const SIEGE_RESOLUTION_THRESHOLD = 12;

/** Defenders start with positive momentum (walls help) */
export const SIEGE_DEFENDER_MOMENTUM_BONUS = 2;

/** Tick at which starvation encounter fires (if not resupplied) */
export const SIEGE_STARVATION_TICK = 15;

/** How far the siege broadcasts regional encounters (hex distance) */
export const SIEGE_REGIONAL_ENCOUNTER_RANGE = 5;

/** Attacker Quintessence loss per tick during siege (lower than field — waiting) */
export const SIEGE_COMBAT_ATTRITION_ATTACKER = 1.0;

/** Defender Quintessence loss per tick during siege (even lower — behind walls) */
export const SIEGE_COMBAT_ATTRITION_DEFENDER = 0.5;
