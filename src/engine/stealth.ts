/**
 * Stealth / Detection System — two-audience detection model.
 *
 * Mortal detection: per-actor suspicion tracking with escalation levels.
 * Rival detection: per-rival-per-region scrutiny tracking with escalation.
 */
import type { InterventionType } from '../types/dream';
import type {
  MortalAwarenessLevel,
  RivalAwarenessLevel,
  MortalDetectionState,
  RivalDetectionState,
  DetectionEvent,
} from '../types/stealth';
import {
  MORTAL_AWARENESS_THRESHOLDS,
  RIVAL_AWARENESS_THRESHOLDS,
  DETECTION_SCORE_BY_TYPE,
} from '../types/stealth';

// ─── Mortal Detection ────────────────────────────────────────────

export function createMortalDetectionState(actorId: string): MortalDetectionState {
  return {
    actorId,
    suspicionScore: 0,
    awarenessLevel: 'unaware',
    detectionEvents: [],
  };
}

/**
 * Compute the mortal awareness level from a suspicion score.
 */
export function getMortalAwarenessLevel(score: number): MortalAwarenessLevel {
  if (score >= MORTAL_AWARENESS_THRESHOLDS.revelation) return 'revelation';
  if (score >= MORTAL_AWARENESS_THRESHOLDS.realization) return 'realization';
  if (score >= MORTAL_AWARENESS_THRESHOLDS.suspicion) return 'suspicion';
  return 'unaware';
}

/**
 * Process a detected intervention for mortal awareness.
 * Adds the intervention's detection score and checks for escalation.
 */
export function processMortalDetection(
  state: MortalDetectionState,
  interventionType: InterventionType,
  tick: number,
): MortalDetectionState {
  const scoreAdded = DETECTION_SCORE_BY_TYPE[interventionType] ?? 1.0;
  const newScore = state.suspicionScore + scoreAdded;
  const newLevel = getMortalAwarenessLevel(newScore);

  const event: DetectionEvent = {
    tick,
    interventionType,
    scoreAdded,
    resultingLevel: newLevel,
  };

  return {
    ...state,
    suspicionScore: newScore,
    awarenessLevel: newLevel,
    detectionEvents: [...state.detectionEvents, event],
  };
}

/**
 * Decay mortal suspicion by a given amount (per-tick natural decay).
 * Score cannot go below 0. Awareness level recalculates.
 */
export function decayMortalSuspicion(
  state: MortalDetectionState,
  amount: number,
): MortalDetectionState {
  const newScore = Math.max(0, state.suspicionScore - amount);
  return {
    ...state,
    suspicionScore: newScore,
    awarenessLevel: getMortalAwarenessLevel(newScore),
  };
}

// ─── Rival Detection ─────────────────────────────────────────────

export function createRivalDetectionState(
  rivalId: string,
  regionId: string,
): RivalDetectionState {
  return {
    rivalId,
    regionId,
    scrutinyScore: 0,
    awarenessLevel: 'unaware',
    detectionEvents: [],
  };
}

/**
 * Compute the rival awareness level from a scrutiny score.
 */
export function getRivalAwarenessLevel(score: number): RivalAwarenessLevel {
  if (score >= RIVAL_AWARENESS_THRESHOLDS.targeted) return 'targeted';
  if (score >= RIVAL_AWARENESS_THRESHOLDS.identified) return 'identified';
  if (score >= RIVAL_AWARENESS_THRESHOLDS.noticed) return 'noticed';
  return 'unaware';
}

/**
 * Process a detected intervention for rival awareness.
 * Uses the same per-type scores as mortal detection.
 */
export function processRivalDetection(
  state: RivalDetectionState,
  interventionType: InterventionType,
  tick: number,
): RivalDetectionState {
  const scoreAdded = DETECTION_SCORE_BY_TYPE[interventionType] ?? 1.0;
  const newScore = state.scrutinyScore + scoreAdded;
  const newLevel = getRivalAwarenessLevel(newScore);

  const event: DetectionEvent = {
    tick,
    interventionType,
    scoreAdded,
    resultingLevel: newLevel,
  };

  return {
    ...state,
    scrutinyScore: newScore,
    awarenessLevel: newLevel,
    detectionEvents: [...state.detectionEvents, event],
  };
}

/**
 * Decay rival scrutiny by a given amount (per-tick natural decay).
 */
export function decayRivalScrutiny(
  state: RivalDetectionState,
  amount: number,
): RivalDetectionState {
  const newScore = Math.max(0, state.scrutinyScore - amount);
  return {
    ...state,
    scrutinyScore: newScore,
    awarenessLevel: getRivalAwarenessLevel(newScore),
  };
}
