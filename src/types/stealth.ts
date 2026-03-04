import type { InterventionType } from './dream';

// ─── Mortal Detection ────────────────────────────────────────────

/** Mortal awareness escalation levels */
export type MortalAwarenessLevel =
  | 'unaware'       // no suspicion
  | 'suspicion'     // notices unusual coincidences — narrative flavor only
  | 'realization'   // recognizes a pattern — may resist future interventions
  | 'revelation';   // knows a god is acting — dramatic narrative beats

/** Per-actor mortal detection state */
export interface MortalDetectionState {
  actorId: string;
  suspicionScore: number;       // accumulated detection score (0.0+)
  awarenessLevel: MortalAwarenessLevel;
  detectionEvents: DetectionEvent[];
}

// ─── Rival God Detection ─────────────────────────────────────────

/** Rival god awareness escalation levels */
export type RivalAwarenessLevel =
  | 'unaware'       // rival hasn't noticed activity
  | 'noticed'       // rival detects activity in their sphere of interest
  | 'identified'    // rival identifies the player as the source
  | 'targeted';     // rival actively opposes the player

/** Per-rival-per-region detection state */
export interface RivalDetectionState {
  rivalId: string;
  regionId: string;
  scrutinyScore: number;        // accumulated rival scrutiny (0.0+)
  awarenessLevel: RivalAwarenessLevel;
  detectionEvents: DetectionEvent[];
}

// ─── Shared ──────────────────────────────────────────────────────

/** Record of a single detection event */
export interface DetectionEvent {
  tick: number;
  interventionType: InterventionType;
  scoreAdded: number;
  resultingLevel: MortalAwarenessLevel | RivalAwarenessLevel;
}

// ─── Constants ───────────────────────────────────────────────────

/** Suspicion score thresholds for mortal awareness transitions */
export const MORTAL_AWARENESS_THRESHOLDS = {
  suspicion: 3.0,    // score >= 3 → suspicion
  realization: 8.0,  // score >= 8 → realization
  revelation: 15.0,  // score >= 15 → revelation
} as const;

/** Scrutiny score thresholds for rival awareness transitions */
export const RIVAL_AWARENESS_THRESHOLDS = {
  noticed: 5.0,      // score >= 5 → noticed
  identified: 12.0,  // score >= 12 → identified
  targeted: 20.0,    // score >= 20 → targeted
} as const;

/** How much suspicion score each intervention type adds when detected */
export const DETECTION_SCORE_BY_TYPE: Record<InterventionType, number> = {
  dream: 0.5,
  persuade: 1.0,
  deceive: 1.5,
  intimidate: 1.5,
  inspire_intervention: 0.5,
  coincidence: 3.0,
  omen: 1.0,
  afflict_bless: 2.5,
};
