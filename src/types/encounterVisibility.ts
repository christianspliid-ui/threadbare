/**
 * Universal Encounter Visibility types — TB-035 Phase 4.
 *
 * All threaded agents have visible encounters. Visibility depth
 * varies by court position and thread thickness.
 */

import type { CourtPosition } from './influence';

// ─── Constants ─────────────────────────────────────────────────────

/** Ticks before retinue vignette auto-resolves */
export const RETINUE_VIGNETTE_TIMEOUT = 8;

/** Essence cost to peek at a Watched agent's encounter */
export const ENCOUNTER_PEEK_COST = 1;

/** Minimum essence to boost encounter odds */
export const ENCOUNTER_BOOST_MIN = 1;

/** Maximum essence per encounter boost */
export const ENCOUNTER_BOOST_MAX = 5;

/** Probability increase per essence spent on boost */
export const BOOST_TO_PROBABILITY_RATIO = 0.03;

/** Minimum thread tier required to set attention mode to 'pause' */
export const PAUSE_MODE_MIN_TIER = 2;

/**
 * Essence cost to toggle a thread's attention mode.
 *
 * THR-1715: 2 → 0. Law 51 files attention modes as player-set preferences, and
 * the charge had never fired since TB-040 (the handler wrote a field `GameState`
 * does not have). Kept as a named constant so pricing attention later is one
 * number, not a rewrite.
 */
export const ATTENTION_MODE_CHANGE_COST = 0;

/**
 * The story breath (THR-1715): turns after a pause-mode mortal's story chapter
 * ends before she may start another: just under two in-game days. During the breath she
 * lives her daily life (routine chores, travel, social life), all of it silent.
 *
 * The cadence knob. The plan's verification band is 5–8 halting chapters per
 * 150 turns for The First on seeds 42 / 99 / 7; retune within 12–36 to land in
 * it. Measured value is recorded in Docs/status/2026-10-04-thr-1715.md.
 */
export const PAUSED_STORY_BREATH_TICKS = 22;

/**
 * The authored threat rating that marks a raw encounter as daily life
 * (THR-1715). A chore never asks the god, never raises an encounter
 * notification, and never appears in the Chapter Ledger's default view or badge.
 */
export const ROUTINE_THREAT_RATING = 'trivial';

// ─── Encounter Notification ────────────────────────────────────────

/** Visibility depth for encounter notifications. */
export type EncounterVisibilityDepth = 'full' | 'medium' | 'peek' | 'none';

/**
 * An encounter notification for a threaded agent.
 * Queued when the agent enters an encounter.
 */
export interface EncounterNotification {
  /** Unique ID */
  id: string;
  /** Agent in the encounter */
  agentId: string;
  /** Agent name */
  agentName: string;
  /** Court position determines visibility depth */
  courtPosition: CourtPosition | null;
  /** Encounter ID */
  encounterId: string;
  /** Encounter template name */
  encounterName: string;
  /** Encounter beat vs. finished aftermath summary. */
  kind?: 'encounter' | 'aftermath';
  /** Runtime source for the encounter notification. */
  sourceSystem?: 'legacy_encounter' | 'unified_action';
  /** Current step index when the notification was emitted. */
  stepIndex?: number;
  /** Unified action id when sourced from a unified action. */
  actionId?: string;
  /** Concrete step id when known. */
  stepId?: string;
  /** Prose description (depth varies by court position) */
  prose: string;
  /** Choices available (empty for watched/none) */
  choices: EncounterInterventionChoice[];
  /** Tick when the notification was created */
  createdTick: number;
  /** Tick when auto-resolve fires (null for pause mode) */
  autoResolveTick: number | null;
  /** Whether player has viewed this notification */
  viewed: boolean;
  /** Whether this notification has been resolved */
  resolved: boolean;
  /** Outcome band tag (e.g. 'fortunate') — populated by engine when propagation is wired (THR-461 follow-up). */
  narrativeTag?: string;
  // ─── Structured-card context (THR-636) — additive, all optional ───
  /** Total steps in the encounter, for the card's "step N of M" meta line. */
  totalSteps?: number;
  /** The just-resolved step's outcome band (distinct from the whole-notification narrativeTag). */
  outcomeBand?: string;
  /** Hex column of the encounter, resolved via the three-tier position model at emission. */
  hexCol?: number;
  /** Hex row of the encounter. */
  hexRow?: number;
  /** Human-readable location label for the card + veil context strip. */
  locationLabel?: string;
  /**
   * All agents the encounter is about (THR-664) — the actor plus any agent target.
   * Anchors the notification to every threaded participant's thread row without
   * duplicating the notification. Always includes `agentId` when populated;
   * absent on older records, where `agentId` is the only participant.
   */
  participantIds?: string[];
}

/**
 * A choice available during an encounter intervention.
 */
export interface EncounterInterventionChoice {
  /** Choice ID */
  id: string;
  /** Display text */
  text: string;
  /** Essence cost (0 for free choices like "let it play out") */
  essenceCost: number;
  /** Probability boost applied to the encounter */
  probabilityBoost: number;
  /** Intervention type for tracking */
  interventionType: 'supportive' | 'coercive' | 'withdrawn';
  /** God voice for this choice */
  godVoice?: string;
}

// ─── Visibility Matrix ─────────────────────────────────────────────

/**
 * What each court position can see/do during encounters.
 */
export interface VisibilityConfig {
  /** Prose depth: full (3-5 sentences), medium (2-3), peek (1-2), none */
  proseDepth: EncounterVisibilityDepth;
  /** Number of choices available (0 = observation only) */
  maxChoices: number;
  /** Whether encounters auto-interrupt the game */
  autoInterrupt: boolean;
  /** Default attention mode */
  defaultAttentionMode: 'pause' | 'auto_resolve';
}

/** Visibility configs by court position */
export const VISIBILITY_BY_POSITION: Record<CourtPosition, VisibilityConfig> = {
  the_first: {
    proseDepth: 'full',
    maxChoices: 3,
    autoInterrupt: true,
    // THR-1715: The First is born asking — her story chapters stop the world.
    defaultAttentionMode: 'pause',
  },
  retinue: {
    proseDepth: 'medium',
    maxChoices: 2,
    autoInterrupt: true,
    defaultAttentionMode: 'auto_resolve',
  },
  watched: {
    proseDepth: 'peek',
    maxChoices: 0,
    autoInterrupt: false,
    defaultAttentionMode: 'auto_resolve',
  },
  dormant: {
    // Dormant agents are temporarily suspended — no visibility, no notifications.
    proseDepth: 'none',
    maxChoices: 0,
    autoInterrupt: false,
    defaultAttentionMode: 'auto_resolve',
  },
};

// ─── Trace Types ───────────────────────────────────────────────────

/** Trace for encounter intervention. */
export interface EncounterInterventionTrace {
  type: 'encounter_intervention';
  tick: number;
  agentId: string;
  encounterId: string;
  courtPosition: CourtPosition | null;
  choiceId: string;
  essenceSpent: number;
  probabilityBoost: number;
  interventionType: string;
}

/** Trace for attention mode change. */
export interface AttentionModeChangeTrace {
  type: 'attention_mode_change';
  tick: number;
  ascendantId: string;
  agentId: string;
  previousMode: 'pause' | 'auto_resolve';
  newMode: 'pause' | 'auto_resolve';
  essenceCost: number;
}

/** Max agent ids carried on one `RoutineSuppressedTrace` (types/trace.ts). */
export const ROUTINE_SUPPRESSED_TRACE_AGENT_CAP = 10;
