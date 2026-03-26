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

// ─── Constants ──────────────────────────────────────────────────────

/** Doom clock fraction where Call phase ends → Road of Trials begins */
export const CALL_PHASE_END = 0.15;
/** Doom clock fraction where Road of Trials ends → Crisis begins */
export const TRIALS_PHASE_END = 0.55;
/** Doom clock fraction where Crisis ends → Ordeal begins */
export const CRISIS_PHASE_END = 0.70;
/** Doom clock fraction where Ordeal ends → Return begins */
export const ORDEAL_PHASE_END = 0.85;

/** Target number of beats during Road of Trials */
export const TRIALS_BEAT_COUNT = 4;
/** Beats during Crisis phase */
export const CRISIS_BEAT_COUNT = 1;

/** Capability threshold for "scraped_through" on middle Ordeal choice */
export const ORDEAL_CAPABILITY_THRESHOLD = 0.5;
/** Essence cost for guaranteed triumph (direct divine intervention) */
export const ORDEAL_DIRECT_COST = 5;
/** Essence cost for guided attempt (subtle divine nudge) */
export const ORDEAL_SUBTLE_COST = 2;

/** Ticks before a force-fired Ordeal if doom clock ends before it fires normally */
export const ORDEAL_FORCE_FIRE_THRESHOLD = 0.90;

/** Maximum number of pending vignettes in queue */
export const MAX_PENDING_VIGNETTES = 5;

// ─── Ordeal Outcome ─────────────────────────────────────────────────

/** The three possible Ordeal outcomes — drives the Return (System 6). */
export type OrdealOutcome = 'triumph' | 'scraped_through' | 'broken';

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
  /** Axiological profile shifts */
  axiologicalShifts?: Partial<Record<string, number>>;
  /** Reach capability changes */
  reachChanges?: Partial<Record<ReachDomain, number>>;
  /** Intervention type: did the god step in or step back? */
  interventionType: 'supportive' | 'coercive' | 'withdrawn';
  /** Ordeal outcome (only for Ordeal phase beats) */
  ordealOutcome?: OrdealOutcome;
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
