/**
 * The forecast at a scale — the odds shown equal to the odds rolled (THR-1543,
 * fight block §3b).
 *
 * `forecastAction` only clamps to [0.05, 0.95]; the roll does more. Inside
 * `resolveStepCore` it first applies `applyScaleDifficultyAdjust` (the scale's
 * difficulty offset, and a difficulty cap that holds the probability at the
 * scale's floor), and **then**, after the roll, raises any probability still under
 * `MIN_PROBABILITY_BY_SCALE[scale]` to that floor. The cap reproduces the floor
 * only when capability plus modifiers already sits at or above it
 * (`resolutionScaleAdjust.ts:131`); a sub-floor fighter (low capability and
 * `terrified`) is raised by the post-roll floor alone. So this applies both, in
 * the core's order, and a forecast drawn from it quotes the threshold the d100 is
 * rolled against.
 *
 * Pure and rng-free: the attended forecast calls it from the UI on every toggle.
 * The fight block wires it for fight steps (FB7); the same gap on every other
 * unified-road step is THR-1535's.
 */

import type { ActionScale } from '../types/unifiedAction';
import type { ResolutionInput } from '../types/resolution';
import {
  computeOutcomeProbabilities,
  computeResolutionThreshold,
} from './resolutionService';
import { MIN_PROBABILITY_BY_SCALE, applyScaleDifficultyAdjust } from './resolutionScaleAdjust';

export type ScaledForecast = ReturnType<typeof computeOutcomeProbabilities> & {
  /** The difficulty after the scale adjustment — what the core rolls against. */
  readonly adjustedDifficulty: number;
  /** True when the post-roll scale floor raised the probability. */
  readonly scaleFloorRaised: boolean;
};

/** Forecast `input` exactly as `resolveStepCore` would roll it at `scale`. */
export function forecastActionAtScale(input: ResolutionInput, scale: ActionScale | undefined): ScaledForecast {
  const { adjustedDifficulty } = applyScaleDifficultyAdjust(
    input.difficulty,
    input.capability,
    input.sphereFactor ?? 0,
    input.actionModifiers ?? 0,
    scale,
  );
  const adjusted: ResolutionInput = { ...input, difficulty: adjustedDifficulty };
  const minP = MIN_PROBABILITY_BY_SCALE[scale ?? 'regional'];
  if (computeResolutionThreshold(adjusted) >= minP) {
    return { ...computeOutcomeProbabilities(adjusted), adjustedDifficulty, scaleFloorRaised: false };
  }
  // The core's post-roll floor: the probability is raised to the scale's minimum.
  // Summarised through the same function at exactly that probability, so the
  // threshold, crit counts and forecast tier are the core's own.
  const floored = computeOutcomeProbabilities({
    ...input,
    capability: minP,
    difficulty: 0,
    sphereFactor: 0,
    actionModifiers: 0,
    influenceNudge: 0,
  });
  return { ...floored, adjustedDifficulty, scaleFloorRaised: true };
}
