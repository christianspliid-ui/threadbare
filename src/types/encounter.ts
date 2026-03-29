/**
 * Encounter Type System — defines the shape of narrative encounters
 * that agents undergo at sublocations for growth and evolution.
 *
 * Encounters are linear sequences (2-4 steps) using
 * sigmoid → d100 resolution. Cultural vocabulary overlays
 * vary the flavor without changing structure.
 */
import type { SphereName, LocationSubtype } from './index';
import type { ReachDomain } from './traits';
import type { ValuePair } from './agent';
import type { RewardPoolRecipe } from './attachments';

// ─── Encounter Types & Threat Ratings ───────────────────────────

export type EncounterType =
  | 'explore' | 'acquire' | 'create' | 'hire' | 'duel'
  | 'steal' | 'trade' | 'assist' | 'build' | 'lead';

export type ThreatRating = 'trivial' | 'easy' | 'moderate' | 'hard' | 'deadly';

export const THREAT_CAPABILITY_BANDS: Record<ThreatRating, [number, number]> = {
  trivial:  [0, 20],
  easy:     [15, 40],
  moderate: [30, 60],
  hard:     [50, 80],
  deadly:   [70, 100],
};

export const THREAT_RATING_COLORS: Record<ThreatRating, string> = {
  trivial:  '#4ade80',  // green
  easy:     '#60a5fa',  // blue
  moderate: '#fbbf24',  // amber
  hard:     '#f87171',  // red
  deadly:   '#d946ef',  // magenta
};

export const THREAT_COURAGE_THRESHOLD = 0.3;
export const THREAT_PRUDENCE_THRESHOLD = -0.3;

// ─── Type → Value Pair Mapping ──────────────────────────────────

/** Maps encounter type to value pairs that drive agent preference */
export const ENCOUNTER_TYPE_MOTIVATIONS: Record<EncounterType, ValuePair[]> = {
  explore:  ['courage_prudence', 'loyalty_ambition'],
  acquire:  ['asceticism_extravagance', 'loyalty_ambition'],
  create:   ['tradition_novelty', 'sacrifice_survival'],
  hire:     ['humility_pride', 'loyalty_ambition'],
  duel:     ['mercy_ruthlessness', 'courage_prudence'],
  steal:    ['honesty_cunning', 'asceticism_extravagance'],
  trade:    ['asceticism_extravagance', 'honesty_cunning'],
  assist:   ['mercy_ruthlessness', 'loyalty_ambition'],
  build:    ['tradition_novelty', 'sacrifice_survival'],
  lead:     ['humility_pride', 'loyalty_ambition'],
};

// ─── Tunable Constants ──────────────────────────────────────────

/** Maximum steps per encounter template */
export const ENCOUNTER_MAX_STEPS = 4;

/** Base difficulty for encounter resolution (0-100 scale) */
export const ENCOUNTER_BASE_DIFFICULTY = 40;

/** Difficulty increase per subsequent encounter in an encounter sequence */
export const ENCOUNTER_DIFFICULTY_ESCALATION = 10;

/** Base ticks before an agent can reattempt an abandoned encounter.
 * Effective cooldown may be lower via dynamic scaling (see COOLDOWN_FULL_POOL_SIZE). */
export const ENCOUNTER_ABANDON_COOLDOWN = 6;

/** Base ticks before an agent can reattempt a completed encounter.
 * Effective cooldown may be lower via dynamic scaling (see COOLDOWN_FULL_POOL_SIZE). */
export const ENCOUNTER_COMPLETION_COOLDOWN = 6;

/** Minimum Maslow tier required to pursue encounters (self-actualization = 5) */
export const ENCOUNTER_MASLOW_TIER = 5;

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
  /** Trait changes for logging (optional) */
  traitChanges?: string[];
  /** Reward pool recipe for attachment generation on this outcome */
  rewardPool?: RewardPoolRecipe;
}

// ─── Step Definition ────────────────────────────────────────────

export interface EncounterStep {
  /** Unique encounter ID within the sequence */
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
  /**
   * Duration in ticks. Quick actions = 1, multi-day = 3-5, sieges/rituals = 5-10.
   * Defaults to 1 if omitted (backward compatible).
   */
  duration?: number;
  /** What happens on success */
  onSuccess: EncounterOutcome;
  /** What happens on failure */
  onFailure: EncounterOutcome;
}

// ─── Encounter Template ─────────────────────────────────────────

export interface EncounterTemplate {
  /** Unique encounter template ID */
  id: string;
  /** Display name */
  name: string;
  /** Location types where this encounter can spawn */
  locationTypes: LocationSubtype[];
  /** Sublocation types where this encounter can occur (optional refinement on location level) */
  sublocationTypes?: string[];
  /** Linear sequence of steps */
  steps: EncounterStep[];
  /** Primary reach tested */
  reachPrimary: ReachDomain;
  /** Secondary reach tested */
  reachSecondary: ReachDomain;
  /** Encounter type classification */
  encounterType: EncounterType;
  /** Threat rating */
  threatRating: ThreatRating;
  /** Value pairs relevant to this encounter */
  motivations: ValuePair[];
  /** Optional sphere affinity for filtering */
  sphereAffinity?: SphereName;
  /** Optional cultural affinity for filtering */
  culturalAffinity?: string;
  /**
   * Whether this encounter can be attempted remotely (without being at the location).
   * Used for faction-scale or divine encounters. Defaults to false if omitted.
   */
  remoteAttempt?: boolean;
  /**
   * Visibility filter — which agents/factions can see this encounter.
   * Format: 'faction:<id>', 'agent:<id>', 'archetype:<id>', 'culture:<id>', or 'all'.
   * Undefined = visible to all (backward compatible).
   */
  visibleTo?: string[];
  /**
   * Score multiplier for quest encounters (1.0 = normal, 2.0–10.0 = quest).
   * Applied to motivationPull in movement candidate scoring.
   * Undefined = treated as 1.0 (no boost).
   */
  questPriority?: number;
}

// ─── Encounter Progress (Runtime State) ─────────────────────────

export interface EncounterProgress {
  /** Which encounter template this tracks */
  encounterId: string;
  /** Which agent is undergoing this encounter */
  actorId: string;
  /** Target agent for social encounters (agent-to-agent interactions) */
  targetAgentId?: string;
  /** Current step index (0-based) */
  currentEncounterIndex: number;
  /** History of step outcomes */
  history: Array<{
    encounterId: string;
    success: boolean;
    tick: number;
  }>;
  /** Current status. 'awaiting_choice' = paused at a choice-point step waiting for player input. */
  status: 'active' | 'abandoned' | 'completed' | 'awaiting_choice';
  /** Tick when the encounter started */
  startedTick: number;
  /**
   * Tick at which the current step finishes and can be resolved.
   * Agent is occupied (skipped in decision phase) until this tick.
   * Undefined = not currently occupied (step resolves immediately).
   */
  occupiedUntilTick?: number;
}
