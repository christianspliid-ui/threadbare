import type { PendingChoiceCommit } from '../../types/gameState';
import type { EncounterOutcomeBand } from '../../types/traces/encounter-traces';
import {
  OUTCOME_CRITICAL_SUCCESS_ZONE_FRACTION,
  OUTCOME_FAIL_FORWARD_ZONE_FRACTION,
  OUTCOME_CRITICAL_FAIL_ZONE_FRACTION,
} from '../../data/encounter-experience-constants';

export interface ChoiceOutcome {
  agentId: string;
  encounterId: string;
  beatIndex: number;
  outcomeBand: EncounterOutcomeBand;
  rolledD100: number;
  effectiveProbability: number;
}

/**
 * Resolves an encounter choice to an outcome band.
 *
 * Pure function — same seed + same inputs → same output (NFP #3).
 * All randomness flows through the supplied prng.
 *
 * Band logic:
 * - success zone (roll <= p): bottom CRITICAL_SUCCESS_ZONE_FRACTION → critical_success
 * - failure zone (roll > p): bottom FAIL_FORWARD_ZONE_FRACTION → fail_forward,
 *   top CRITICAL_FAIL_ZONE_FRACTION → critical_fail, remainder → fail
 */
export function resolveEncounterChoice(
  commit: PendingChoiceCommit,
  prng: () => number,
): ChoiceOutcome {
  const p = Math.max(0, Math.min(1, commit.effectiveProbability));

  // Roll 1–100 via prng (deterministic).
  const rolledD100 = Math.floor(prng() * 100) + 1;
  const normalizedRoll = rolledD100 / 100;

  const outcomeBand = determineBand(normalizedRoll, p);

  return {
    agentId: commit.agentId,
    encounterId: commit.encounterId,
    beatIndex: commit.beatIndex,
    outcomeBand,
    rolledD100,
    effectiveProbability: p,
  };
}

function determineBand(normalizedRoll: number, p: number): EncounterOutcomeBand {
  if (normalizedRoll <= p) {
    // Success zone
    if (p > 0) {
      const successRatio = normalizedRoll / p;
      if (successRatio <= OUTCOME_CRITICAL_SUCCESS_ZONE_FRACTION) return 'critical_success';
    }
    return 'success';
  }

  // Failure zone
  const failSpan = 1 - p;
  if (failSpan <= 0) {
    // p == 1.0: any roll is a success, but roll > 1 can't happen; guard anyway
    return 'fail_forward';
  }
  const failRatio = (normalizedRoll - p) / failSpan;

  if (failRatio <= OUTCOME_FAIL_FORWARD_ZONE_FRACTION) return 'fail_forward';
  if (failRatio >= 1 - OUTCOME_CRITICAL_FAIL_ZONE_FRACTION) return 'critical_fail';
  return 'fail';
}
