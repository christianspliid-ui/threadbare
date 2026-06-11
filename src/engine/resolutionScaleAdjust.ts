/**
 * Scale-based resolution adjustments — caller boundary layer for THR-451.
 *
 * These constants and helpers are applied in unifiedActionResolution.ts
 * BEFORE building ResolutionInput. The pure-math resolver in resolutionService.ts
 * stays scale-agnostic; all scale adjustments live here.
 *
 * ─── Constants (NFP #1: Tunability) ─────────────────────────────────
 * | Name                              | Default                                        | Purpose                                 |
 * |-----------------------------------|------------------------------------------------|-----------------------------------------|
 * | SCALE_DIFFICULTY_OFFSETS          | {personal:−0.20, local:−0.10, regional:0, cosmic:+0.10} | Per-scale additive difficulty bias |
 * | MIN_PROBABILITY_BY_SCALE          | {personal:0.45, local:0.35, regional:0.20, cosmic:0.05}  | Per-scale soft probability floor   |
 * | CRIT_FAILURE_PERMITTED_BY_SCALE   | {personal:false, local:false, regional:true, cosmic:true}| Crit-fail gating by scale          |
 *
 * ─── Fail-soft ──────────────────────────────────────────────────────
 * | scale undefined on template        | Treated as 'regional' (neutral, no adjustment)           |
 * | missing key in SCALE_DIFFICULTY_OFFSETS | offset = 0, log warning once per process          |
 * | missing key in MIN_PROBABILITY_BY_SCALE | fall through to PROBABILITY_FLOOR                 |
 * | missing key in CRIT_FAILURE_PERMITTED   | default true (back-compat, crit-fail allowed)     |
 */

import { PROBABILITY_FLOOR } from './resolutionService';
import type { ActionScale } from '../types/unifiedAction';
import type { OutcomeType } from '../types/resolution';

// ─── Scale Constants ─────────────────────────────────────────────────

/**
 * Additive offset applied to difficulty at the caller boundary.
 * Negative = easier (lowers difficulty), positive = harder.
 *
 * Rationale: personal/local-scale content should feel achievable for
 * capable actors (~50% success on personal, ~35% on local). Regional
 * is the neutral baseline. Cosmic-scale should feel earned.
 */
export const SCALE_DIFFICULTY_OFFSETS: Record<ActionScale, number> = {
  personal: -0.20,
  local:    -0.10,
  regional:  0.00,
  cosmic:   +0.10,
};

/**
 * Per-scale soft probability floor.
 *
 * Applied by capping difficulty from above so that
 * P = capability + sphere - difficulty + mods ≥ floor
 * for actors with sufficient capability (cap ≥ floor + diff_adjusted).
 *
 * Falls back to PROBABILITY_FLOOR for actors with very low capability —
 * the floor is a "capable actor should succeed at this rate" guarantee,
 * not a global minimum for all actors.
 */
export const MIN_PROBABILITY_BY_SCALE: Record<ActionScale, number> = {
  personal: 0.70,
  local:    0.65,
  regional: 0.20,
  cosmic:   PROBABILITY_FLOOR,
};

/**
 * Whether doubles-over-threshold escalate to critical_failure.
 *
 * Narrative rationale: critical failures must "read as drama".
 * A personal-scale social fumble or local-stakes errand gone wrong
 * is unfortunate, not catastrophic. Regional and cosmic actions
 * carry genuine stakes where disaster is meaningful.
 */
export const CRIT_FAILURE_PERMITTED_BY_SCALE: Record<ActionScale, boolean> = {
  personal: false,
  local:    false,
  regional: true,
  cosmic:   true,
};

// ─── Helpers ─────────────────────────────────────────────────────────

/**
 * Apply scale offset and per-scale probability floor to difficulty.
 *
 * Call this at the caller boundary after computing capability/sphereFactor/mods
 * and before building ResolutionInput. Returns the adjusted difficulty and
 * telemetry flags for the resolution.input trace.
 *
 * @param difficulty   Effective difficulty pre-adjustment (0..1)
 * @param capability   Actor's domain capability (0..1)
 * @param sphereFactor Sphere alignment bonus
 * @param mods         actionModifiers + influenceNudge combined
 * @param scale        Template scale; undefined treated as 'regional'
 */
export function applyScaleDifficultyAdjust(
  difficulty: number,
  capability: number,
  sphereFactor: number,
  mods: number,
  scale: ActionScale | undefined,
): {
  adjustedDifficulty: number;
  scaleOffsetApplied: number;
  scaleFloorApplied: boolean;
} {
  const resolvedScale: ActionScale = scale ?? 'regional';

  const scaleOffset = SCALE_DIFFICULTY_OFFSETS[resolvedScale] ?? 0;
  const minFloor = MIN_PROBABILITY_BY_SCALE[resolvedScale] ?? PROBABILITY_FLOOR;

  // Apply scale offset
  let adjustedDifficulty = difficulty + scaleOffset;

  // Apply per-scale probability floor by limiting difficulty from above.
  // P = capability + sphereFactor - difficulty + mods >= minFloor
  // => difficulty <= capability + sphereFactor + mods - minFloor
  // Clamped to 0: when cap < minFloor, the max useful diff is 0 (resolver zeroes negatives).
  // Incapable actors (cap < minFloor) are handled by the probability floor post-process
  // in unifiedActionResolution.ts; this step is a no-op for them.
  const maxDifficultyForFloor = Math.max(0, capability + sphereFactor + mods - minFloor);
  const scaleFloorApplied = adjustedDifficulty > maxDifficultyForFloor;
  if (scaleFloorApplied) {
    adjustedDifficulty = maxDifficultyForFloor;
  }

  return { adjustedDifficulty, scaleOffsetApplied: scaleOffset, scaleFloorApplied };
}

/**
 * Downgrade critical_failure to failure for scales that don't permit crit-fails.
 *
 * Applied after resolution, at the caller boundary — analogous to the resist
 * mechanism. No changes to the pure-math resolver required.
 *
 * @param outcome Raw outcome from the resolver
 * @param scale   Template scale; undefined treated as 'regional'
 * @returns       Downgraded outcome (if applicable) or original outcome
 */
export function applyScaleCritFailureGate(
  outcome: OutcomeType,
  scale: ActionScale | undefined,
): OutcomeType {
  if (outcome !== 'critical_failure') return outcome;
  const resolvedScale: ActionScale = scale ?? 'regional';
  const permit = CRIT_FAILURE_PERMITTED_BY_SCALE[resolvedScale] ?? true;
  return permit ? outcome : 'failure';
}
