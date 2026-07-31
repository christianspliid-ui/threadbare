/**
 * Pole lean — the shared arithmetic behind "which way did the god argue?" (THR-894).
 *
 * One definition, two callers:
 *
 * - The **meeting** (`meetingEncounter.ts`), where a `FormativeTest` declares the
 *   axis for the whole beat and its cards carry the `'a' | 'b'` shorthand.
 * - **Agent-decided branches** (`branchDecision.ts`), where an `ActionStepBranch`
 *   declares the axis and ordinary `StepNudge` cards carry the axis-explicit
 *   `{ axis, toward, weight? }` form.
 *
 * These lived only in the meeting until this module existed, and generalizing by
 * *copying* the summing loop is exactly the failure THR-885 recorded with
 * `assignAmbitionToActor` — two implementations of one rule that drift apart the
 * first time either is tuned. The meeting now delegates here; there is no fork.
 *
 * ## Sign convention
 *
 * Positive weight = pole `'a'` = `toward: 'positive'` = the **first-named pole**
 * of the `ValuePair`, which is the `+1` direction in `AxiologicalProfile`. One
 * convention shared by the profile, the drift accumulator, and this module, so a
 * sign never has to be re-derived at a boundary.
 */

import type { ValuePair } from '../../types/agent';
import type { StepNudge, StepNudgePoleLean } from '../../types/unifiedAction';
import { POLE_LEAN_DEFAULT_WEIGHT } from '../../data/nudge-constants';

/** Which pole a hand argued for; `'none'` means it argued for neither. */
export type NetPoleLean = 'a' | 'b' | 'none';

/**
 * The signed weight one card contributes, on the ±1 axis scale.
 *
 * `axis` is the axis the *reader* is deciding on. An axis-explicit card counts
 * only when it names that same axis — a card arguing about mercy has nothing to
 * say about a fork between courage and prudence, and silently counting it would
 * be the worst kind of wrong: plausible, invisible, and load-bearing.
 *
 * The `'a' | 'b'` shorthand names no axis, so it counts only where the caller
 * passes no axis at all (the meeting, whose host declares one axis for the whole
 * beat). Fail-soft (NFP #4): a non-finite authored `weight` abstains rather than
 * poisoning the sum with `NaN`.
 */
export function signedLeanWeight(
  lean: StepNudgePoleLean | undefined,
  axis?: ValuePair,
): number {
  if (lean === undefined) return 0;

  if (lean === 'a' || lean === 'b') {
    // Axis-implicit shorthand: meaningful only when the host owns the axis.
    if (axis !== undefined) return 0;
    return lean === 'a' ? POLE_LEAN_DEFAULT_WEIGHT : -POLE_LEAN_DEFAULT_WEIGHT;
  }

  if (axis !== undefined && lean.axis !== axis) return 0;

  const weight = lean.weight ?? POLE_LEAN_DEFAULT_WEIGHT;
  if (!Number.isFinite(weight)) return 0;

  return lean.toward === 'positive' ? Math.abs(weight) : -Math.abs(weight);
}

/**
 * Net signed lean of a played hand, on the ±1 axis scale.
 *
 * Fail-soft: a played id with no matching authored card is skipped, matching
 * every other `activeNudges` reader in `nudges.ts`.
 */
export function sumHandLean(
  nudges: readonly StepNudge[] | undefined,
  playedNudgeIds: readonly string[] | undefined,
  axis?: ValuePair,
): number {
  if (!nudges || !playedNudgeIds || playedNudgeIds.length === 0) return 0;

  const byId = new Map(nudges.map((n) => [n.id, n]));
  let total = 0;
  for (const id of playedNudgeIds) {
    total += signedLeanWeight(byId.get(id)?.poleLean, axis);
  }
  return total;
}

/**
 * Collapse a signed lean to a pole, or `'none'` inside the neutral band.
 *
 * `epsilon` is the caller's undecided half-width. The meeting passes 0 — its
 * cards are unweighted, so any imbalance is a whole card and an exact tie is the
 * only neutral case. A branch decision passes
 * `BRANCH_DECISION_NEUTRAL_EPSILON`, because it sums a continuous profile
 * position where "almost exactly neutral" is a real and meaningful state.
 */
export function classifyNetLean(signedLean: number, epsilon = 0): NetPoleLean {
  if (!Number.isFinite(signedLean)) return 'none';
  if (signedLean > epsilon) return 'a';
  if (signedLean < -epsilon) return 'b';
  return 'none';
}

/** Whether a card argues on a given axis at all — the validator's warn predicate. */
export function leansOnAxis(lean: StepNudgePoleLean | undefined, axis: ValuePair): boolean {
  return signedLeanWeight(lean, axis) !== 0;
}
