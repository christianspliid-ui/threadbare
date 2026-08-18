/**
 * Essence *earned*, per sphere, for the lifetime of a run. THR-1180.
 *
 * A second, monotonic reading of the divine economy sitting beside
 * `GameState.essencePool`: the pool says what the god has left, this says how
 * much has ever come through. Spending never decrements it, which is the whole
 * point — attunement measures practice in a sphere, not a balance in it.
 *
 * ## Why a phase-boundary diff rather than instrumented grant sites
 *
 * The plan named "the three divine-economy GraphOp paths". The tree has more
 * than three and gains them steadily: `phaseEssence`'s capped cosmic income,
 * `phaseControlEffects`' `perTickIncome`, the effect-driven delta in
 * `unifiedActionResolution`, the place-of-power streams, the elder-site reward
 * in `ruinTransformation`, the delve refund. Hand-instrumenting that set means
 * the counter is correct exactly until somebody adds the seventh site, and a
 * counter that silently stops counting is worse than no counter — the unlock it
 * gates simply stops arriving, with nothing red anywhere.
 *
 * So the accrual sits at the seam every one of those sites must pass through:
 * the phase merge. {@link applyEssenceEarned} runs once per phase, diffs the
 * pool the phase returned against the one it was given, and banks the positive
 * movement. A grant site added tomorrow is counted without being told to.
 *
 * The cost of that choice, stated plainly: accrual is **net movement within one
 * phase**, so a phase that both grants and spends banks only the difference.
 * One shipped phase does both (`phaseControlEffects` debits an effect's upkeep
 * and credits its income), and there netting is arguably the honest number —
 * an effect that costs more than it yields has earned the god nothing. Across
 * phases nothing nets: the maintenance and cast-cost debits live in their own
 * phases and cannot eat `phaseEssence`'s income.
 *
 * Plan: `Docs/plans/2026-08-18-thr-1178-nudge-library-completion.md` (workstream D)
 */

import type { SphereName } from '../types/index';
import type { EssenceEarnedBySphere, EssencePool } from '../types/influence';
import type { GameState } from '../types/gameState';
import { SPHERE_ATTUNEMENT_THRESHOLDS } from '../data/nudge-constants';
import { attunementMemberIdsAt } from './nudgeCardRepertoire';
import { emitTrace } from './traceBuffer';

// Re-exported so the counter's own module is a legitimate import site for its
// type; the declaration lives in `types/influence.ts` beside `EssencePool`.
export type { EssenceEarnedBySphere };

/** Lifetime essence earned in one sphere. Absent counter ⇒ `0`, never a throw. */
export function essenceEarnedIn(
  counter: EssenceEarnedBySphere | undefined,
  sphere: SphereName,
): number {
  return counter?.[sphere] ?? 0;
}

/**
 * Bank the positive per-sphere movement between two pools.
 *
 * Pure. Returns the *same* counter reference when nothing rose, so a caller can
 * skip the state churn on the overwhelming majority of phases that never touch
 * essence at all.
 *
 * Negative movement is dropped rather than clamped per-sphere-total: a sphere
 * that goes 10 → 4 has not un-earned six, it has spent six.
 */
export function accrueEssenceEarned(
  counter: EssenceEarnedBySphere | undefined,
  before: EssencePool | undefined,
  after: EssencePool | undefined,
): EssenceEarnedBySphere | undefined {
  if (!before || !after) return counter;

  let next: EssenceEarnedBySphere | undefined;
  for (const key of Object.keys(after) as SphereName[]) {
    const gained = (after[key] ?? 0) - (before[key] ?? 0);
    // `> 0` also rejects NaN, which is the shape `tickHealthMonitor` watches the
    // pool for — a poisoned pool must not poison the counter on the way past.
    if (!(gained > 0)) continue;
    next ??= { ...counter };
    next[key] = (next[key] ?? 0) + gained;
  }

  return next ?? counter;
}

/** One attunement mark a sphere crossed this phase. */
export interface AttunementCrossing {
  readonly sphere: SphereName;
  readonly threshold: number;
}

/**
 * Marks crossed moving from `before` to `after` earned-totals.
 *
 * Strictly `before < t <= after`, so a mark is reported on the phase that
 * reaches it and never again — that half-open window is what makes "one trace
 * per crossing" true rather than approximately true. A single phase that vaults
 * two marks at once reports both, in ascending order.
 */
export function attunementThresholdsCrossed(
  before: EssenceEarnedBySphere | undefined,
  after: EssenceEarnedBySphere | undefined,
  thresholds: readonly number[] = SPHERE_ATTUNEMENT_THRESHOLDS,
): readonly AttunementCrossing[] {
  if (!after || thresholds.length === 0) return [];

  const crossings: AttunementCrossing[] = [];
  for (const key of Object.keys(after) as SphereName[]) {
    const from = essenceEarnedIn(before, key);
    const to = essenceEarnedIn(after, key);
    if (to <= from) continue;
    for (const threshold of thresholds) {
      if (from < threshold && to >= threshold) crossings.push({ sphere: key, threshold });
    }
  }
  return crossings;
}

/**
 * The engine seam: accrue across one phase merge and trace any mark crossed.
 *
 * Impure only in that it emits — the arithmetic is the pure helpers above, which
 * is where the tests live. Returns `next` untouched when the phase did not move
 * the pool, so this is a reference compare on nearly every phase of every tick.
 *
 * Fail-soft (NFP #4): nothing here can throw into the tick loop. An absent pool,
 * an absent counter and an empty threshold table are all ordinary inputs, and
 * the trace is emitted after the state is already correct.
 */
export function applyEssenceEarned(prev: GameState, next: GameState): GameState {
  if (prev.essencePool === next.essencePool) return next;

  const accrued = accrueEssenceEarned(
    next.essenceEarnedBySphere,
    prev.essencePool,
    next.essencePool,
  );
  if (accrued === next.essenceEarnedBySphere) return next;

  const crossings = attunementThresholdsCrossed(next.essenceEarnedBySphere, accrued);
  for (const { sphere, threshold } of crossings) {
    emitTrace({
      tick: next.tick,
      category: 'nudge_attunement_unlock',
      summary: `${sphere} reached attunement ${threshold} (${essenceEarnedIn(accrued, sphere).toFixed(1)} earned)`,
      sphere,
      threshold,
      unlockedCardIds: [...attunementMemberIdsAt(sphere, threshold)],
      earnedTotal: essenceEarnedIn(accrued, sphere),
    });
  }

  return { ...next, essenceEarnedBySphere: accrued };
}
