/**
 * Ordeal Type System — defines the shape of narrative ordeals
 * that agents undergo at sublocations for growth and evolution.
 *
 * Ordeals are linear encounter sequences (2-4 steps) using
 * sigmoid → d100 resolution. Cultural vocabulary overlays
 * vary the flavor without changing structure.
 */
import type { SphereName } from './index';
import type { ReachDomain } from './traits';

// ─── Tunable Constants ──────────────────────────────────────────

/** Maximum encounters per ordeal template */
export const ORDEAL_MAX_ENCOUNTERS = 4;

/** Base difficulty for encounter resolution (0-100 scale) */
export const ORDEAL_BASE_DIFFICULTY = 40;

/** Difficulty increase per subsequent encounter in an ordeal */
export const ORDEAL_DIFFICULTY_ESCALATION = 10;

/** Ticks before an agent can reattempt an abandoned ordeal */
export const ORDEAL_ABANDON_COOLDOWN = 20;

/** Minimum Maslow tier required to pursue ordeals (self-actualization = 5) */
export const ORDEAL_MASLOW_TIER = 5;

// ─── Encounter Outcome ─────────────────────────────────────────

export interface EncounterOutcome {
  /** Prose template for this outcome */
  narrative: string;
  /** Optional trait modifiers: trait ID → delta (+acquire, -lose) */
  traitModifiers?: Record<string, number>;
  /** Reputation change (-1 to 1 scale) */
  reputationDelta?: number;
  /** Whether success here makes tier promotion eligible */
  tierPromotionEligible?: boolean;
}

// ─── Encounter Definition ───────────────────────────────────────

export interface EncounterDefinition {
  /** Unique encounter ID within the ordeal */
  id: string;
  /** Display name */
  name: string;
  /** Sublocation type where this encounter takes place */
  sublocationId?: string;
  /** Prose description of the encounter setup */
  narrative: string;
  /** Primary reach used for resolution */
  reach: ReachDomain;
  /** Difficulty (0-100 scale, feeds into sigmoid) */
  difficulty: number;
  /** What happens on success */
  onSuccess: EncounterOutcome;
  /** What happens on failure */
  onFailure: EncounterOutcome;
}

// ─── Ordeal Definition ──────────────────────────────────────────

export interface OrdealDefinition {
  /** Unique ordeal template ID */
  id: string;
  /** Display name */
  name: string;
  /** Location types where this ordeal can spawn */
  locationTypes: string[];
  /** Linear sequence of encounters */
  encounters: EncounterDefinition[];
  /** Primary reach tested */
  reachPrimary: ReachDomain;
  /** Secondary reach tested */
  reachSecondary: ReachDomain;
  /** Optional sphere affinity for filtering */
  sphereAffinity?: SphereName;
  /** Optional cultural affinity for filtering */
  culturalAffinity?: string;
}

// ─── Ordeal Progress (Runtime State) ────────────────────────────

export interface OrdealProgress {
  /** Which ordeal template this tracks */
  ordealId: string;
  /** Which agent is undergoing this ordeal */
  actorId: string;
  /** Current encounter index (0-based) */
  currentEncounterIndex: number;
  /** History of encounter outcomes */
  history: Array<{
    encounterId: string;
    success: boolean;
    tick: number;
  }>;
  /** Current status */
  status: 'active' | 'abandoned' | 'completed';
  /** Tick when the ordeal started */
  startedTick: number;
}
