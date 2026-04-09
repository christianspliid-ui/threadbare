// src/engine/strategicActionScoring.ts
//
// Score and normalize strategic action candidates for comparison with encounter candidates.
//
// NFP #1 (Tunability): All weights come from strategic-action-constants.ts.
// NFP #3 (Determinism): Tie-breaks use seeded PRNG.

import type { StrategicActionCandidate, StrategicRuntimeState } from '../types/strategicAction';
import {
  STRATEGIC_WORLD_IMPACT_WEIGHT,
  STRATEGIC_BLOCKER_RELIEF_WEIGHT,
  STRATEGIC_CATALYST_VALUE_WEIGHT,
  STRATEGIC_ROLE_FIT_WEIGHT,
  STRATEGIC_TRAVEL_PENALTY_WEIGHT,
  STRATEGIC_VARIETY_PENALTY_WEIGHT,
  STRATEGIC_CONTROL_PRESSURE_WEIGHT,
  STRATEGIC_SCORE_FLOOR,
  STRATEGIC_ENCOUNTER_SCORE_BRIDGE,
  STRATEGIC_HISTORY_WINDOW_TICKS,
} from '../data/strategic-action-constants';

export interface ScoredStrategicCandidate extends StrategicActionCandidate {
  /** Fully computed final score in encounter-comparable range */
  readonly finalScore: number;
}

/**
 * Score an array of strategic candidates, apply variety penalties,
 * filter below score floor, and sort descending.
 *
 * @param candidates - Raw candidates from generateStrategicCandidates
 * @param strategicState - Runtime state for history/variety context
 * @param tick - Current tick for recency checks
 * @param rng - Seeded PRNG for deterministic tie-breaking
 */
export function scoreStrategicCandidates(
  candidates: StrategicActionCandidate[],
  strategicState: StrategicRuntimeState | undefined,
  tick: number,
  rng: () => number,
): ScoredStrategicCandidate[] {
  if (candidates.length === 0) return [];

  // Count template frequency on the board for variety penalty
  const boardTemplateCounts = new Map<string, number>();
  for (const c of candidates) {
    boardTemplateCounts.set(c.templateId, (boardTemplateCounts.get(c.templateId) ?? 0) + 1);
  }

  // Count recent history uses for variety penalty
  const historyTemplateCounts = new Map<string, number>();
  if (strategicState?.history) {
    const windowStart = tick - STRATEGIC_HISTORY_WINDOW_TICKS;
    for (const h of strategicState.history) {
      if (h.actorId === candidates[0]?.actorId && h.tick >= windowStart) {
        historyTemplateCounts.set(h.templateId, (historyTemplateCounts.get(h.templateId) ?? 0) + 1);
      }
    }
  }

  const scored: ScoredStrategicCandidate[] = [];

  for (const candidate of candidates) {
    const c = candidate.scoreComponents;

    // Compute variety penalty based on board and history frequency
    const boardCount = boardTemplateCounts.get(candidate.templateId) ?? 0;
    const historyCount = historyTemplateCounts.get(candidate.templateId) ?? 0;
    const varietyPenalty = Math.min(1, (boardCount - 1) * 0.2 + historyCount * 0.15);

    // Weighted score
    const rawScore =
      c.ambitionAlignment * STRATEGIC_BLOCKER_RELIEF_WEIGHT +
      c.worldImpact * STRATEGIC_WORLD_IMPACT_WEIGHT +
      c.catalystValue * STRATEGIC_CATALYST_VALUE_WEIGHT +
      c.roleFit * STRATEGIC_ROLE_FIT_WEIGHT +
      c.controlPressure * STRATEGIC_CONTROL_PRESSURE_WEIGHT -
      c.travelPenalty * STRATEGIC_TRAVEL_PENALTY_WEIGHT -
      varietyPenalty * STRATEGIC_VARIETY_PENALTY_WEIGHT;

    // Normalize to 0-1 range and bridge to encounter score range
    const normalizedScore = Math.max(0, Math.min(1, rawScore)) * STRATEGIC_ENCOUNTER_SCORE_BRIDGE;

    // Add tiny deterministic jitter for stable tie-breaking
    const jitter = rng() * 0.001;

    const finalScore = normalizedScore + jitter;

    if (finalScore < STRATEGIC_SCORE_FLOOR) continue;

    scored.push({
      ...candidate,
      scoreComponents: { ...c, varietyPenalty },
      finalScore,
    });
  }

  // Sort descending by final score
  scored.sort((a, b) => b.finalScore - a.finalScore);

  return scored;
}
