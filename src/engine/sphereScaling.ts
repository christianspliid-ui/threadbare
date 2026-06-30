/**
 * Sphere-power scaling helper.
 *
 * Maps an entity's per-sphere score (`sphereAffinity.scores[sphere]` ∈ [0, MAX_SPHERE_SCORE])
 * to an effect/cost multiplier. This is the general "most actions scale effect + cost with
 * sphere power" helper — reusable across reach signatures and any other sphere-gated effect,
 * not signature-specific (Christian, 2026-06-30).
 *
 * Plan: Docs/plans/2026-06-30-ascendant-reach-signatures.md §3.2
 */

import { MAX_SPHERE_SCORE } from '../types/sphereAffinity';
import { SIGNATURE_SCALE_FLOOR, SIGNATURE_SCALE_CEIL } from '../data/reach-signature-content';

/**
 * Linear interpolation from `SIGNATURE_SCALE_FLOOR` (at score 0) to `SIGNATURE_SCALE_CEIL`
 * (at MAX_SPHERE_SCORE). Monotonic non-decreasing in `sphereScore`.
 *
 * Fail-soft (NFP #4): the score is clamped to [0, MAX_SPHERE_SCORE] before interpolation, so
 * an out-of-range or garbage score never yields a multiplier outside the floor/ceil band.
 *
 * @param sphereScore integer sphere score, typically `sphereAffinity.scores[sphere]`
 * @returns multiplier in [SIGNATURE_SCALE_FLOOR, SIGNATURE_SCALE_CEIL]
 */
export function spherePowerMultiplier(sphereScore: number): number {
  const clamped = Math.max(0, Math.min(MAX_SPHERE_SCORE, sphereScore));
  const t = clamped / MAX_SPHERE_SCORE;
  return SIGNATURE_SCALE_FLOOR + t * (SIGNATURE_SCALE_CEIL - SIGNATURE_SCALE_FLOOR);
}

/**
 * Scales a base effect magnitude by a sphere-power multiplier.
 * Effect scales directly: higher sphere power → larger effect, lower sphere power → smaller.
 */
export function scaledEffect(base: number, mult: number): number {
  return base * mult;
}

/**
 * Scales a base essence cost by a sphere-power multiplier, with the multiplier floored at 1×.
 * Cost never drops below `base`: sphere mastery makes an action more potent, never cheaper.
 * A high-power action costs more (mult > 1); a low-power one still costs at least base.
 */
export function scaledCost(base: number, mult: number): number {
  return base * Math.max(1, mult);
}
