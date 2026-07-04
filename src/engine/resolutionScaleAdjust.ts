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
 * | MIN_PROBABILITY_BY_SCALE          | {personal:0.70, local:0.65, regional:0.20, cosmic:0.05}  | Per-scale soft probability floor   |
 * | CRIT_FAILURE_SEVERITY_BY_SCALE    | {personal:'minor', local:'minor', regional:'standard', cosmic:'severe'} | Crit-fail consequence tier by scale (THR-571 E2) |
 *
 * ─── Fail-soft ──────────────────────────────────────────────────────
 * | scale undefined on template        | Treated as 'regional' (neutral, no adjustment)           |
 * | missing key in SCALE_DIFFICULTY_OFFSETS | offset = 0, log warning once per process          |
 * | missing key in MIN_PROBABILITY_BY_SCALE | fall through to PROBABILITY_FLOOR                 |
 * | missing key in CRIT_FAILURE_SEVERITY   | default 'standard' (back-compat, moderate stakes) |
 */

import { PROBABILITY_FLOOR } from './resolutionService';
import type { ActionScale } from '../types/unifiedAction';
import type { ComplicationSeverity } from '../types/complication';

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
 *
 * THR-571 note (2026-07-03): a floor *retune* (lowering personal/local) was
 * investigated to lift clean_success back into its KPI band, but the evidence
 * refuted it — lowering the floor converts floored successes-at-cost into
 * honest *failures*, it does not create clean successes. Clean success is
 * limited by how many acting agents have raw P above the floor (a capability
 * distribution question), not by the floor value. Values left unchanged; the
 * clean_success / at_cost band calibration is a design decision (see THR-571).
 */
export const MIN_PROBABILITY_BY_SCALE: Record<ActionScale, number> = {
  personal: 0.70,
  local:    0.65,
  regional: 0.20,
  cosmic:   PROBABILITY_FLOOR,
};

/**
 * Consequence tier for a doubles-over-threshold critical_failure, by scale.
 *
 * THR-571 E2 — replaces the old boolean `CRIT_FAILURE_PERMITTED_BY_SCALE` gate
 * that mapped `critical_failure → failure` at personal/local scale. That gate
 * suppressed the critical-failure *classification* entirely — it never reached
 * prose, aftermath, KPI, or chronicle, so the whole tail read as dead air.
 *
 * The new model keeps the classification alive at every scale (the dice can
 * still astonish) and scales only the *mechanical consequence*: a personal
 * social fumble is a humiliation (`minor` complication tier), a cosmic-scale
 * catastrophe is `severe`. Severity keys into the existing complication system
 * (`complicationSelection.ts` — the crit-failure branch consumes this via the
 * `critFailureSeverity` field on `ComplicationContext`).
 */
export const CRIT_FAILURE_SEVERITY_BY_SCALE: Record<ActionScale, ComplicationSeverity> = {
  personal: 'minor',
  local:    'minor',
  regional: 'standard',
  cosmic:   'severe',
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

/** Fail-soft default when a scale is missing from the severity map. */
export const DEFAULT_CRIT_FAILURE_SEVERITY: ComplicationSeverity = 'standard';

/**
 * Resolve the complication-severity tier for a critical_failure at a given scale.
 *
 * THR-571 E2 — replaces `applyScaleCritFailureGate`. The critical_failure
 * outcome is no longer rewritten; instead this returns the severity tier that
 * the complication selector uses to pick a scale-appropriate consequence. The
 * outcome classification always survives (crit-failure tail is now reachable).
 *
 * @param scale Template scale; undefined treated as 'regional'
 * @returns     The complication severity tier for this scale's crit-failures
 */
export function resolveCritFailureSeverity(
  scale: ActionScale | undefined,
): ComplicationSeverity {
  const resolvedScale: ActionScale = scale ?? 'regional';
  return CRIT_FAILURE_SEVERITY_BY_SCALE[resolvedScale] ?? DEFAULT_CRIT_FAILURE_SEVERITY;
}
