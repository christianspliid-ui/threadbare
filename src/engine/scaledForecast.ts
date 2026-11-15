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
 * The fight block wires it for fight steps (FB7); THR-1535 wires it for every
 * other unified-road step (`buildNudgePhaseModel` always carries the step's scale).
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

/**
 * THR-1579 — the continuous probability `resolveStepCore` rolls `input` against at
 * `scale`: the scale-adjusted threshold, raised to the scale's floor when it sits
 * under it. The same two steps as `forecastActionAtScale`, without the d100
 * quantisation of the summary — the planner's `estimateStepProbability` reads it.
 */
export function scaledStepProbability(input: ResolutionInput, scale: ActionScale | undefined): number {
  const { adjustedDifficulty } = applyScaleDifficultyAdjust(
    input.difficulty,
    input.capability,
    input.sphereFactor ?? 0,
    input.actionModifiers ?? 0,
    scale,
  );
  const p = computeResolutionThreshold({ ...input, difficulty: adjustedDifficulty });
  return Math.max(p, MIN_PROBABILITY_BY_SCALE[scale ?? 'regional']);
}

// ─── THR-2226: fit a climax's difficulty to a target forecast ─────────────

/** What `fitDifficultyToForecast` found. */
export interface DifficultyFit {
  /** The difficulty to roll against (the fallback when `fitted` is false). */
  readonly difficulty: number;
  /** The bare chance at that difficulty — the same continuous number the roll uses. */
  readonly bareChance: number;
  /** False when the target could not be bracketed in [0, 1]; the fallback was used. */
  readonly fitted: boolean;
}

export interface DifficultyFitOptions {
  readonly scale?: ActionScale;
  /** Standing modifiers that ride on every roll of this step (not the god's lean). */
  readonly actionModifiers?: number;
  /** Difficulty to return when the target cannot be bracketed. */
  readonly fallbackDifficulty: number;
  /** Bisection steps (`FIT_ITERATIONS`). */
  readonly iterations: number;
}

/**
 * THR-2226 (plan THR-2204 § Decisions 2) — the difficulty at which an actor of
 * `capability` rolls a bare chance of `target`, found by bisection over [0, 1]
 * against `scaledStepProbability`, the probability `resolveStepCore` itself rolls
 * against (Law 18: never a copy of the curve). Pure and rng-free.
 *
 * Fail-soft (NFP #4): when even difficulty 0 sits under the target, or difficulty
 * 1 over it, the fit returns `fallbackDifficulty` with `fitted: false`.
 */
export function fitDifficultyToForecast(
  capability: number,
  target: number,
  options: DifficultyFitOptions,
): DifficultyFit {
  const chanceAt = (difficulty: number): number => scaledStepProbability({
    actorId: '',
    domain: 'star',
    capability,
    difficulty,
    sphereFactor: 0,
    actionModifiers: options.actionModifiers ?? 0,
    testShapers: [],
  }, options.scale);
  const fallback = (): DifficultyFit => ({
    difficulty: options.fallbackDifficulty,
    bareChance: chanceAt(options.fallbackDifficulty),
    fitted: false,
  });
  if (!Number.isFinite(capability) || !Number.isFinite(target)) return fallback();
  // Chance falls as difficulty rises; the target must sit between the two ends.
  if (chanceAt(0) < target || chanceAt(1) > target) return fallback();
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < Math.max(1, options.iterations); i++) {
    const mid = (lo + hi) / 2;
    if (chanceAt(mid) > target) lo = mid;
    else hi = mid;
  }
  const difficulty = (lo + hi) / 2;
  return { difficulty, bareChance: chanceAt(difficulty), fitted: true };
}
