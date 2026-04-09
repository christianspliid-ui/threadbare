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

/** Essence cost to toggle a thread's attention mode */
export const ATTENTION_MODE_CHANGE_COST = 2;

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
    defaultAttentionMode: 'auto_resolve',
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
