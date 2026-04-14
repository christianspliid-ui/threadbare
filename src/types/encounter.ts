/**
 * Encounter Type System — defines the shape of narrative encounters
 * that agents undergo at sublocations for growth and evolution.
 *
 * Encounters are linear sequences (1-5 steps) using
 * sigmoid → d100 resolution. Cultural vocabulary overlays
 * vary the flavor without changing structure.
 */
import type { SphereName, LocationSubtype } from './index';
import type { ReachDomain } from './traits';
import type { ValuePair } from './agent';
import type { RewardPoolRecipe } from './attachments';
import type { ClearanceGateConfig } from './contentShells';
import type { AttentionTier } from './attention';
import type { OutcomeType, ResolutionRollBreakdown } from './resolution';

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
  hire:     ['preservation_transformation', 'loyalty_ambition'],
  duel:     ['mercy_ruthlessness', 'courage_prudence'],
  steal:    ['honesty_cunning', 'asceticism_extravagance'],
  trade:    ['asceticism_extravagance', 'honesty_cunning'],
  assist:   ['mercy_ruthlessness', 'loyalty_ambition'],
  build:    ['tradition_novelty', 'sacrifice_survival'],
  lead:     ['preservation_transformation', 'loyalty_ambition'],
};

// ─── Tunable Constants ──────────────────────────────────────────

/** Maximum steps per encounter template */
export const ENCOUNTER_MAX_STEPS = 5;

/** Base difficulty for encounter resolution (0-100 scale) */
export const ENCOUNTER_BASE_DIFFICULTY = 40;

/** Difficulty increase per subsequent encounter in an encounter sequence */
export const ENCOUNTER_DIFFICULTY_ESCALATION = 10;

/** Base ticks before an agent can reattempt an abandoned encounter.
 * Effective cooldown may be lower via dynamic scaling (see COOLDOWN_FULL_POOL_SIZE). */
export const ENCOUNTER_ABANDON_COOLDOWN = 6;

/** Base ticks before an agent can reattempt a completed encounter.
 * Effective cooldown may be lower via dynamic scaling (see COOLDOWN_FULL_POOL_SIZE). */
export const ENCOUNTER_COMPLETION_COOLDOWN = 20;

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
  /**
   * Explicit flag indicating this outcome applies a wound condition.
   * When true, mid-encounter promotion fires the `wound` tier-1 trigger.
   * Prefer this over inferring from `rewardPool.categoryWeights.condition`
   * — only failure outcomes that specifically give wounds should set this.
   */
  appliesWound?: boolean;
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
  /** Attention tier classification — controls how this encounter surfaces to the player.
   *  Effective tier computed at runtime via resolveEffectiveTier(). */
  intrinsicTier: AttentionTier;
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
  /**
   * Trait prerequisites — agent must have these traits to see this encounter.
   * Checked in filterByPrerequisites (Stage 3). Undefined = no trait gate.
   */
  requiredTraits?: Array<{ traitId: string; minLevel?: number }>;
  /**
   * Traits that BLOCK this encounter — agent must NOT have any of these.
   * Checked in filterByPrerequisites (Stage 3). Undefined = no blocking.
   */
  blockedByTraits?: string[];
  /**
   * Reputation polarity for tally accumulation on completion.
   * 'positive' = virtue pole, 'negative' = flaw pole for the encounter's reachPrimary.
   * When absent, derived from encounterType heuristic or agent axiological profile.
   */
  reputationPolarity?: 'positive' | 'negative';
  /** Optional encounter-network support that should be resolved at action start. */
  supportBundle?: EncounterSupportBundle;
  /** Optional scrutiny/proof shell configs used by richer checkpoint encounters. */
  clearanceGates?: readonly ClearanceGateConfig[];
  /**
   * Optional background ambient sound key to push while this encounter is active.
   * Must match a key in AMBIENT_TRACKS (e.g. 'dungeon', 'danger', 'sacred').
   * Targets the Background channel. Falls back to terrain/location if absent.
   */
  backgroundTrack?: string;
  /**
   * Optional music track src path to swap in while this encounter is active.
   * e.g. '/audio/music/boss-theme.mp3'. Targets the Music channel.
   * Falls back to default theme drone if absent.
   */
  musicTrack?: string;
  /** Concept art image URL. Relative to public/ root. Example: '/concept-art/encounters/gate-duty.jpg' */
  readonly illustrationUrl?: string;
  /** Alt text for the concept art image (accessibility). */
  readonly illustrationAlt?: string;
}

// ─── Encounter Support Bundle Types ────────────────────────────

/** Persistence contract for encounter support objects. */
export type EncounterSupportPersistence = 'must-persist' | 'scene-only';

/** Delivery mode for encounter support objects. */
export type EncounterSupportDelivery =
  | 'pre-seeded'
  | 'lazy-materialize-on-trigger'
  | 'blocked-primitive';

/** Actor support spec — defines an NPC to bind or materialize for an encounter. */
export interface EncounterSupportActorSpec {
  readonly kind: 'actor';
  readonly key: string;
  readonly delivery: EncounterSupportDelivery;
  readonly persistence: EncounterSupportPersistence;
  /** NPC roles to check for reuse before materializing. */
  readonly reuseNpcRoles?: readonly string[];
  /** Role label for the support cast member. */
  readonly supportRole: string;
  /** NPC role to assign if materializing a new actor. */
  readonly spawnNpcRole: string;
  /** Display name if materializing a new actor. */
  readonly spawnName?: string;
  /** Key of a location spec in the same bundle to place this actor at. */
  readonly preferredLocationKey?: string;
  /** Faction definition ID for faction membership on spawn. */
  readonly factionDefId?: string;
}

/** Location support spec — defines a sublocation to bind or materialize for an encounter. */
export interface EncounterSupportLocationSpec {
  readonly kind: 'location';
  readonly key: string;
  readonly delivery: EncounterSupportDelivery;
  readonly persistence: EncounterSupportPersistence;
  /** Sublocation type ID to search for or create. */
  readonly sublocationTypeId: string;
  /** Fallback display name if materializing. */
  readonly fallbackName?: string;
}

/** Union of all support spec types. */
export type EncounterSupportSpec = EncounterSupportActorSpec | EncounterSupportLocationSpec;

/** A support bundle is an ordered array of support specs. */
export type EncounterSupportBundle = readonly EncounterSupportSpec[];

/** Runtime binding from a support spec key to a resolved graph node. */
export interface EncounterSupportBinding {
  readonly key: string;
  readonly nodeId: string;
  readonly kind: 'actor' | 'location';
  readonly delivery: EncounterSupportDelivery;
  readonly persistence: EncounterSupportPersistence;
  readonly reused: boolean;
}

// ─── Encounter Choice Memory ────────────────────────────────────

/** Records a player's encounter intervention choice for a specific step. */
export interface EncounterChoiceMemory {
  readonly stepIndex: number;
  readonly stepId: string;
  readonly choiceId: string;
  readonly choiceText: string;
  readonly interventionType: string;
  readonly essenceSpent: number;
  readonly probabilityBoost: number;
  readonly tick: number;
}

/** Stored legacy encounter resolution snapshot for inspectable UI/debug rendering. */
export interface EncounterResolutionSnapshot {
  readonly stepIndex: number;
  readonly stepId: string;
  readonly stepName: string;
  readonly reach: ReachDomain;
  readonly difficulty: number;
  readonly normalizedDifficulty: number;
  readonly capability: number;
  readonly modifierTotal: number;
  readonly probability: number;
  readonly threshold: number;
  readonly roll: number;
  readonly success: boolean;
  readonly outcomeType: OutcomeType;
  readonly rollBreakdown?: ResolutionRollBreakdown;
  readonly tick: number;
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
  /** Stored resolution math for completed legacy steps. Optional for backward compatibility. */
  resolutionHistory?: EncounterResolutionSnapshot[];
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
  /** Effective attention tier — computed at initiation, may be promoted mid-encounter. */
  effectiveTier?: AttentionTier | 'invisible';
}
