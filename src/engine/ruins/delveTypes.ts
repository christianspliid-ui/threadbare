/**
 * Types for the Delve encounter variant (THR-152 — PR 4 of the Ruins Layer).
 *
 * A Delve is a 5-tick arc (2 beats for minor, 5 for major/saga) that resolves
 * when an agent with a located clue enters an elder_ruin hex. The arc uses
 * `phaseDelveAdmission` → `phaseDelveProgression` → `phaseDelveEmergence`.
 */

export type DelveScale = 'minor' | 'major' | 'saga';

/** Outcome of a single beat within the arc */
export type DelveBeatOutcome = 'advanced' | 'partial' | 'stalled';

/** Consequence roll at the end of the arc */
export type DelveConsequenceRoll =
  | 'catastrophic'
  | 'scarred'
  | 'marked'
  | 'triumphant'
  | 'transformed';

/** Ruin archetype — drives chamber prose flavor and capability reach */
export type RuinArchetype = 'vault' | 'temple' | 'battlefield';

/** Named beats (major/saga arc) */
export const DELVE_BEAT_NAMES = [
  'Approach', 'Threshold', 'Descent', 'Revelation', 'Egress',
] as const;
export type DelveBeatName = typeof DELVE_BEAT_NAMES[number];

/** Minor arc uses only Approach + Egress */
export const MINOR_BEAT_NAMES: DelveBeatName[] = ['Approach', 'Egress'];

// ── History and state ─────────────────────────────────────────────────────────

export interface DelveBeatRecord {
  beatIndex: number; // 1-based
  beatName: DelveBeatName;
  outcome: DelveBeatOutcome;
  poetProse: string;
  witnessFacts: string[];
  /** Raw capability roll (0-1) for inspectability */
  capabilityRoll: number;
  /** Difficulty threshold this beat used (0-1) */
  threshold: number;
  tick: number;
}

export interface ActiveDelve {
  delveId: string;
  agentId: string;
  ruinId: string;
  ruinMagnitude: number;
  sphereAlignment: string;
  archetype: RuinArchetype;
  delveScale: DelveScale;
  /** Current beat (1-based). 0 means just admitted, first beat fires next tick. */
  beatIndex: number;
  totalBeats: number; // 2 for minor, 5 for major/saga
  startedTick: number;
  /** Tick on which the next beat resolves */
  nextBeatTick: number;
  beatHistory: DelveBeatRecord[];
  /** Accumulated partial outcomes (each partial adds 1; shapes consequence weight) */
  partialCount: number;
  aborted: boolean;
  abortedTick?: number;
}

export interface DelveQueueEntry {
  agentId: string;
  ruinId: string;
  ruinMagnitude: number;
  delveScale: DelveScale;
  queuedTick: number;
  admissionExpiresTick: number;
  admissionBlockedReason: 'saga_active' | 'major_cap' | 'minor_cap';
}

/**
 * Set on GameState when beat 5 (or beat 2 for minor) resolves.
 * The player gets EMERGENCE_DECISION_TIMEOUT_TICKS ticks to choose;
 * after that the arc auto-resolves with 'let'.
 *
 * PR 5 (ruin transformation) reads this and fires the EmergenceDilemmaModal.
 * PR 4 only produces the decision; PR 5 consumes it.
 */
export interface PendingEmergenceDecision {
  delveId: string;
  agentId: string;
  ruinId: string;
  ruinMagnitude: number;
  sphereAlignment: string;
  /** Consequence roll already resolved — stored here for display in the modal */
  consequenceRoll: DelveConsequenceRoll;
  /** Tick at which 'let' auto-fires if the player hasn't chosen */
  autoFiresTick: number;
}
