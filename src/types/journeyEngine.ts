/**
 * Journey Engine types — doom-clock-scheduled hero's journey arc for The First.
 *
 * System 4 from the Meet The First design doc (TB-035 Phase 2).
 * The doom clock determines WHEN beats fire, world state determines WHICH variant,
 * and the player's vignette choice determines WHAT happens.
 */

import type { CampbellianPhase } from './influence';
import type { ReachDomain } from './traits';
import type { SphereName } from './index';
import type { ValuePair } from './agent';
import type { ActionScale, StepOutcome } from './unifiedAction';
import type { ForecastTier } from './traces/encounter-traces';
import {
  JOURNEY_CALL_PHASE_END,
  JOURNEY_TRIALS_PHASE_END,
  JOURNEY_CRISIS_PHASE_END,
  JOURNEY_ORDEAL_PHASE_END,
} from '../data/game-config';

// ─── Constants ──────────────────────────────────────────────────────

/** Doom clock fraction where Call phase ends → Road of Trials begins */
export const CALL_PHASE_END = JOURNEY_CALL_PHASE_END;
/** Doom clock fraction where Road of Trials ends → Crisis begins */
export const TRIALS_PHASE_END = JOURNEY_TRIALS_PHASE_END;
/** Doom clock fraction where Crisis ends → Ordeal begins */
export const CRISIS_PHASE_END = JOURNEY_CRISIS_PHASE_END;
/** Doom clock fraction where Ordeal ends → Return begins / Climax begins */
export const ORDEAL_PHASE_END = JOURNEY_ORDEAL_PHASE_END;

/** Target number of beats during Road of Trials */
export const TRIALS_BEAT_COUNT = 4;
/** Beats during Crisis phase */
export const CRISIS_BEAT_COUNT = 1;

/** Capability threshold for "scraped_through" on middle Ordeal choice */
export const ORDEAL_CAPABILITY_THRESHOLD = 0.5;

// ─── THR-2226: the Ordeal is rolled; the god leans on it ───────────

/** Price of the largest lean ("pour everything in"), in the paying pool. Today's price, named. */
export const ORDEAL_COST_POUR = 5;
/** Price of the middle lean ("steady the thread"). Today's price, named. */
export const ORDEAL_COST_STEADY = 2;
/** Price of sharing the sacrifice's burden — the sacrifice Ordeal's middle lean, as authored. */
export const ORDEAL_COST_SHARE = 3;
/** @deprecated THR-2226 — the price no longer buys a triumph; read `ORDEAL_COST_POUR`. */
export const ORDEAL_DIRECT_COST = ORDEAL_COST_POUR;
/** @deprecated THR-2226 — read `ORDEAL_COST_STEADY`. */
export const ORDEAL_SUBTLE_COST = ORDEAL_COST_STEADY;

/** Odds bonus of "pour everything in" — added to the roll like a card's modifier. */
export const ORDEAL_LEAN_POUR = 0.30;
/** Odds bonus of "steady the thread" (and the sacrifice's shared burden). */
export const ORDEAL_LEAN_STEADY = 0.12;
/** Stepping back adds nothing: the bare roll. */
export const ORDEAL_LEAN_WITHDRAW = 0;

/** The reach the Ordeal tests (plan THR-2204 slice 1). */
export const ORDEAL_REACH: ReachDomain = 'star';
/**
 * The scale the Ordeal is rolled at. `regional` carries no difficulty offset: at
 * `personal` (−0.20) the fit could not reach "Uncertain" for a mortal above ~0.76
 * capability, so a great First would walk through the climax.
 */
export const ORDEAL_SCALE: ActionScale = 'regional';
/** Fallback difficulty when the fit cannot bracket the target (fail-soft). */
export const ORDEAL_FALLBACK_DIFFICULTY = 0.5;

/**
 * The band the Ordeal's roll lands → the outcome the Return reads. Success or better
 * is triumph, success at cost or near miss is scraped through, failure or worse broken.
 */
export const ORDEAL_BAND_TO_OUTCOME: Readonly<Record<StepOutcome, OrdealOutcome>> = {
  critical_success: 'triumph',
  success: 'triumph',
  success_at_cost: 'scraped_through',
  near_miss: 'scraped_through',
  failure: 'broken',
  critical_failure: 'broken',
};

/** Score a vision variant gains when its `scenes` include the First's activity. */
export const VISION_SCENE_FIT_BONUS = 0.3;
/** Score a tagged vision variant loses when its `scenes` do not include the activity. */
export const VISION_SCENE_MISMATCH_PENALTY = 0.6;

/** Ticks before a force-fired Ordeal if doom clock ends before it fires normally */
export const ORDEAL_FORCE_FIRE_THRESHOLD = 0.90;

/** Maximum number of pending vignettes in queue */
export const MAX_PENDING_VIGNETTES = 5;

/**
 * THR-2226 — days an unrolled Ordeal waits after Escape sets it aside before it takes
 * the screen again. Escape never rolls the climax (UI Law 48); the vision returns.
 */
export const ORDEAL_SET_ASIDE_TICKS = 3;

/**
 * THR-2226 — how many times one Ordeal may be set aside. A set-aside vision stays
 * queued, and a queued vision holds the First's journey (no Return, no force-fire), so
 * the deferral is bounded: past the cap, Escape takes the step-back and shows its roll.
 */
export const ORDEAL_SET_ASIDE_MAX = 2;

/**
 * THR-1854: a beat choice declares `reachChanges` on the 0–1 scale the meeting's
 * dilemmas use; the First's `domainCapabilities` are raw (10–40). The meeting converts
 * with the same ×100 when it mints the First (`createAgentFromMeeting`), so a journey
 * choice's +0.05 is +5 raw — one scale for both moments that shape her.
 */
export const JOURNEY_REACH_CHANGE_RAW_SCALE = 100;

// ─── Ordeal Outcome ─────────────────────────────────────────────────

/** The three possible Ordeal outcomes — drives the Return (System 6). */
export type OrdealOutcome = 'triumph' | 'scraped_through' | 'broken';

/** THR-2226 — an Ordeal already paid and rolled: the lean the god picked and what it rolled. */
export interface CommittedOrdeal {
  choiceId: string;
  outcome: OrdealOutcome;
}

// ─── Vision Scene (THR-2226) ────────────────────────────────────────

/** What the First is doing when a vision arrives. */
export type SceneActivity = 'travel' | 'labour' | 'worship' | 'conflict' | 'court' | 'rest';

export const SCENE_ACTIVITIES: readonly SceneActivity[] = ['travel', 'labour', 'worship', 'conflict', 'court', 'rest'];

/** Where the First is and what they are doing, read once when a vision is built. */
export interface VisionScene {
  placeId?: string;
  placeName?: string;
  placeKind?: string;
  activity: SceneActivity;
}

/**
 * THR-2226 — the Ordeal's roll, fitted once when the vision is built and stored, so the
 * forecast each choice shows and the roll read one value (Law 18).
 */
export interface OrdealRollSpec {
  reach: ReachDomain;
  scale: ActionScale;
  /** The First's capability in `reach` (post-sigmoid) when the vision was built. */
  capability: number;
  /** Difficulty fitted so the bare (stepped-back) chance is `CLIMAX_BARE_FORECAST`. */
  difficulty: number;
  /** The bare chance at that difficulty, no lean. */
  bareChance: number;
  /** False when the fit could not bracket the target and fell back. */
  fitted: boolean;
}

// ─── State Snapshot ─────────────────────────────────────────────────

/**
 * Four-axis world state snapshot taken at each beat.
 * Used for template variant selection and beat history tracking.
 */
export interface StateSnapshot {
  /** Power: capability in primary reach, total traits, tier level */
  power: {
    primaryReachLevel: number;
    totalTraits: number;
    tierLevel: number;
  };
  /** Influence: factions led, locations controlled, agreements, enemies */
  influence: {
    factionsLed: number;
    locationsControlled: number;
    agreementsForged: number;
    enemiesMade: number;
  };
  /** Relationship: thread tier, intervention ratio, attention mode */
  relationship: {
    threadTier: number;
    interventionRatio: number;
    attentionMode: 'pause' | 'auto_resolve';
  };
  /** Ambition: active ambitions, completed milestones, failed attempts */
  ambition: {
    activeAmbitions: number;
    completedMilestones: number;
    failedAttempts: number;
    ambitionCategory?: string;
  };
}

// ─── Beat Outcome ───────────────────────────────────────────────────

/**
 * Record of a single journey beat outcome, stored in beatHistory on the thread edge.
 */
export interface BeatOutcome {
  /** Which Campbellian phase this beat belongs to */
  phase: CampbellianPhase;
  /** Tick when this beat fired */
  tick: number;
  /** Which structural template was used */
  templateId: string;
  /** Which state-driven variant fired */
  variantKey: string;
  /** What the player chose */
  playerChoiceId: string;
  /** The four-axis state snapshot at time of beat */
  stateSnapshot: StateSnapshot;
}

// ─── Beat Variant ───────────────────────────────────────────────────

/** A state-driven variant within a structural template. */
export interface BeatVariant {
  /** Unique key for this variant (e.g. 'rising_star', 'underdog') */
  key: string;
  /** Display label */
  label: string;
  /** Condition function: returns a score 0-1 for how well this variant fits the state */
  score: (snapshot: StateSnapshot) => number;
  /** Prose for the beat setup (structural, enrichable) */
  setupProse: string;
  /** Prose for the tension point */
  tensionProse: string;
  /** Available choices for the player */
  choices: BeatChoice[];
  /**
   * THR-2226 — the activities this moment fits. Untagged fits anywhere, with no
   * penalty; a tagged variant gains when the First's scene matches and loses when not.
   */
  scenes?: SceneActivity[];
}

/** A choice the player can make during a journey beat. */
export interface BeatChoice {
  /** Unique ID for this choice */
  id: string;
  /** Display text */
  text: string;
  /** What the god voice says about this choice */
  godVoice?: string;
  /** Effects applied when chosen */
  effects: BeatChoiceEffects;
}

/** Effects of a beat choice — applied to the First and/or the world. */
export interface BeatChoiceEffects {
  /**
   * Axiological profile shifts, keyed by a canonical `ValuePair` (THR-1854: the content
   * named five pairs the engine never had, so a typo now fails the build).
   */
  axiologicalShifts?: Partial<Record<ValuePair, number>>;
  /** Reach capability changes */
  reachChanges?: Partial<Record<ReachDomain, number>>;
  /** Intervention type: did the god step in or step back? */
  interventionType: 'supportive' | 'coercive' | 'withdrawn';
  /**
   * @deprecated THR-2226 — an Ordeal choice no longer sets the outcome (Law 10); the
   * roll does. Ignored on Ordeal beats (an old save may still carry it).
   */
  ordealOutcome?: OrdealOutcome;
  /** THR-2226 — the odds bonus this Ordeal choice adds to the roll (a lean, never a result). */
  ordealLean?: number;
  /** THR-2226 — the reply line per rolled outcome; `consequenceProse` is the fallback. */
  consequenceByOutcome?: Partial<Record<OrdealOutcome, string>>;
  /** Essence cost to the ascendant (0 for free choices) */
  essenceCost?: number;
  /** Founding gate tags accumulated */
  foundingGateTags?: string[];
  /** Narrative consequence prose */
  consequenceProse?: string;
}

// ─── Journey Beat Template ──────────────────────────────────────────

/**
 * A structural template for a journey beat.
 * Layer 1 of the 4-layer beat architecture.
 */
export interface JourneyBeatTemplate {
  /** Unique template ID */
  id: string;
  /** Which Campbellian phase(s) this template is valid for */
  validPhases: CampbellianPhase[];
  /** Human-readable description of the dramatic shape */
  description: string;
  /** State-driven variants — the axis selector picks the best-scoring one */
  variants: BeatVariant[];
  /** Optional: specific reach focus (template is about this reach domain) */
  reachFocus?: ReachDomain;
  /** Optional: specific sphere focus */
  sphereFocus?: SphereName;
  /** Whether this template is the generic fallback for its phase */
  isFallback?: boolean;
}

// ─── Journey Vignette Data ──────────────────────────────────────────

/**
 * Data needed to render a journey vignette modal.
 * Produced by the beat scheduler, consumed by JourneyVignetteModal.
 */
export interface JourneyVignetteData {
  /** The First's agent ID */
  agentId: string;
  /** The First's name */
  agentName: string;
  /** Current Campbellian phase */
  phase: CampbellianPhase;
  /** Doom clock progress (0-1) when this beat fired */
  doomClockPercent: number;
  /** Which beat index this is within the phase (0-based) */
  beatIndex: number;
  /** The template that was selected */
  templateId: string;
  /** The variant that was selected */
  variantKey: string;
  /** Setup prose for the scene */
  setupProse: string;
  /** Tension prose for the scene */
  tensionProse: string;
  /** Available choices */
  choices: BeatChoice[];
  /** State snapshot at time of beat */
  stateSnapshot: StateSnapshot;
  /** Whether this is the Ordeal beat (special UI treatment) */
  isOrdeal: boolean;
  /** Tick when this vignette was created */
  tick: number;
  /** THR-2226 — where the First was and what they were doing when the vision came. */
  scene?: VisionScene;
  /** THR-2226 — the Ordeal's fitted roll (Ordeal only). */
  ordealRoll?: OrdealRollSpec;
  /** THR-2226 — the forecast each Ordeal choice leaves, from the same call the roll uses. */
  forecastByChoice?: Record<string, ForecastTier>;
  /** THR-2226 — the Ordeal's difficulty word (`DIFFICULTY_WORD_BANDS`) for the stakes line. */
  difficultyWord?: string;
  /** THR-2226 — the First's pronoun set key (`gender` property), for the Ordeal lines. */
  agentGender?: string;
  /** THR-2226 — the Ordeal's lines above its choices, filled for this mortal (Law 17). */
  ordealLines?: { weight: string; stakes: string };
}

// ─── Phase Boundaries ───────────────────────────────────────────────

/** Phase boundary definition — maps doom clock ranges to Campbellian phases. */
export interface PhaseBoundary {
  phase: CampbellianPhase;
  start: number;
  end: number;
  /** Number of beats expected in this phase */
  beatCount: number;
}

/** The five Campbellian phase boundaries keyed to doom clock progress. */
export const PHASE_BOUNDARIES: PhaseBoundary[] = [
  { phase: 'call', start: 0, end: CALL_PHASE_END, beatCount: 1 },
  { phase: 'road_of_trials', start: CALL_PHASE_END, end: TRIALS_PHASE_END, beatCount: TRIALS_BEAT_COUNT },
  { phase: 'crisis', start: TRIALS_PHASE_END, end: CRISIS_PHASE_END, beatCount: CRISIS_BEAT_COUNT },
  { phase: 'ordeal', start: CRISIS_PHASE_END, end: ORDEAL_PHASE_END, beatCount: 1 },
  { phase: 'return', start: ORDEAL_PHASE_END, end: 1.0, beatCount: 1 },
];

// ─── Trace Types ────────────────────────────────────────────────────

/** Trace emitted when a journey beat fires. */
export interface JourneyBeatTrace {
  type: 'journey_beat';
  tick: number;
  agentId: string;
  phase: CampbellianPhase;
  doomClockPercent: number;
  stateSnapshot: StateSnapshot;
  templateId: string;
  variantKey: string;
  playerChoiceId: string;
  isOrdeal: boolean;
  ordealOutcome?: OrdealOutcome;
}

// ─── Pending Vignette on GameState ──────────────────────────────────

/**
 * A pending vignette queued for display.
 * Added to GameState by the journey phase, consumed by the UI.
 */
export interface PendingVignette {
  /** Unique ID for deduplication */
  id: string;
  /** The vignette data */
  data: JourneyVignetteData;
  /** Priority (higher = show first). The First always gets max priority. */
  priority: number;
  /** Tick when queued — auto-expires after timeout */
  queuedTick: number;
}
