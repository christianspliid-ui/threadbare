import type { ArchetypeDrift } from '../../types/gameState';
import type { DriftThresholdCrossedTrace, ArchetypePole, DriftThresholdBand } from '../../types/traces/encounter-traces';
import {
  DRIFT_THRESHOLD_SOFT,
  DRIFT_THRESHOLD_BANNER,
  DRIFT_THRESHOLD_BECOMING,
} from '../../data/encounter-experience-constants';

const DRIFT_MIN = -1.0;
const DRIFT_MAX = 1.0;

/** Thresholds ordered from innermost to outermost (absolute value). */
const THRESHOLD_LEVELS: Array<{ band: DriftThresholdBand; value: number }> = [
  { band: 'soft', value: DRIFT_THRESHOLD_SOFT },
  { band: 'banner', value: DRIFT_THRESHOLD_BANNER },
  { band: 'becoming', value: DRIFT_THRESHOLD_BECOMING },
];

function clampDrift(v: number): number {
  return Math.max(DRIFT_MIN, Math.min(DRIFT_MAX, v));
}

function poleFromPosition(position: number): ArchetypePole {
  return position >= 0 ? 'virtue' : 'flaw';
}

/**
 * Detect which threshold bands were crossed by moving from `before` to `after`.
 * Only fires when crossing outward (magnitude increasing), not on decay crossing back.
 */
function detectCrossings(
  before: number,
  after: number,
): DriftThresholdBand[] {
  const absBefore = Math.abs(before);
  const absAfter = Math.abs(after);
  // Only detect outward crossings (absolute value increasing).
  if (absAfter <= absBefore) return [];

  return THRESHOLD_LEVELS
    .filter(({ value }) => absBefore < value && absAfter >= value)
    .map(({ band }) => band);
}

export interface DriftApplicationResult {
  drift: ArchetypeDrift[];
  traces: Omit<DriftThresholdCrossedTrace, never>[];
}

/**
 * Applies a signed drift magnitude to an agent's archetype axis.
 * Returns an updated drift array and any threshold-crossed trace entries.
 *
 * Pure except for no mutation of the input array.
 * The `moralAxisPole` from the choice determines the sign of magnitude: virtue = positive, flaw = negative.
 */
export function applyDriftMagnitude(
  drift: ArchetypeDrift[],
  agentId: string,
  axisId: string,
  signedMagnitude: number,
  tick: number,
): DriftApplicationResult {
  const existing = drift.find((d) => d.agentId === agentId && d.axisId === axisId);
  const fromPosition = existing?.toPosition ?? 0;
  const toPosition = clampDrift(fromPosition + signedMagnitude);

  const crossings = detectCrossings(fromPosition, toPosition);
  const traces: DriftThresholdCrossedTrace[] = crossings.map((band) => ({
    category: 'drift_threshold_crossed' as const,
    tick,
    agentId,
    axisId,
    fromPosition,
    toPosition,
    thresholdCrossed: band,
    pole: poleFromPosition(toPosition),
  }));

  const updatedEntry: ArchetypeDrift = {
    agentId,
    axisId,
    fromPosition,
    toPosition,
    lastUpdatedTick: tick,
  };

  const updatedDrift = existing
    ? drift.map((d) => (d.agentId === agentId && d.axisId === axisId ? updatedEntry : d))
    : [...drift, updatedEntry];

  return { drift: updatedDrift, traces };
}

/**
 * The **live axis position** is the clamped sum of an agent's *baseline* (their
 * standing `AxiologicalProfile` value — set at birth, moved only by permanent
 * marks) and their current *temporary drift delta* (this accumulator). Because
 * the drift delta decays toward zero (see `decayAllDrift`), the live position
 * relaxes back to the baseline when choices stop reinforcing a direction — it
 * rests at the baseline, never at neutral. This is the "live position = clamp(
 * baseline + drift)" model from the personality plan. (THR-528)
 *
 * Operates on the signed ±1 axis scale (virtue +1, vice −1) shared by the profile
 * and the drift accumulator — the canonical *internal* storage scale (THR-559).
 * The canonical *author/UI* 0–1 view is obtained via `signedToCanonical01` in the
 * axis registry; storage stays signed by design (personality-plan grey-zone).
 */
export function liveAxisPosition(baseline: number, driftDelta: number): number {
  return clampDrift(baseline + driftDelta);
}

/** Current temporary drift delta for an agent×axis, or 0 if none is recorded. */
export function driftDeltaFor(
  drift: ArchetypeDrift[],
  agentId: string,
  axisId: string,
): number {
  return drift.find((d) => d.agentId === agentId && d.axisId === axisId)?.toPosition ?? 0;
}

/**
 * Decays all drift entries by `decayRate` per tick toward zero — which, composed
 * with the baseline via `liveAxisPosition`, pulls each agent's live position back
 * toward their baseline (NOT toward neutral). Entries that reach exactly zero are
 * kept (zeroed out) — they record axis history.
 */
export function decayAllDrift(
  drift: ArchetypeDrift[],
  decayRate: number,
  tick: number,
): ArchetypeDrift[] {
  return drift.map((entry) => {
    const { toPosition } = entry;
    if (toPosition === 0) return entry;

    const step = decayRate * Math.sign(toPosition);
    const decayed = Math.abs(toPosition) <= decayRate ? 0 : toPosition - step;

    return {
      ...entry,
      fromPosition: toPosition,
      toPosition: decayed,
      lastUpdatedTick: tick,
    };
  });
}
