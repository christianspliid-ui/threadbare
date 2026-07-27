/**
 * Nudge commit — essence spend and pre-roll rejection. THR-775 (WS2).
 *
 * WS0 declared `activeNudges` with readers and no writer (the known
 * optional-field-no-writer failure mode). This module is half of the writer:
 * the pure part, which decides what a committed hand costs and which pools pay
 * for it. `GameView` owns the other half — the state write and the trace emit.
 *
 * **Pre-roll only.** A hand that cannot be paid for is rejected *before* the
 * step resolves, so the player sees the cards snap back rather than discovering
 * post-roll that a nudge they watched move the forecast never applied.
 */

import type { SphereName } from '../../../types/index';

export interface NudgeSpendRequest {
  /** Sphere that must pay, or `undefined` for a common (sphere-less) card. */
  readonly sphere: SphereName | undefined;
  readonly cost: number;
}

export type EssencePool = Record<SphereName, number>;

export interface NudgeSpendResult {
  /** True when every card was paid in full. */
  readonly ok: boolean;
  /** The pool after spending. Identical to the input when `ok` is false. */
  readonly pool: EssencePool;
  /** Total actually charged. Zero on rejection. */
  readonly spent: number;
  /** Set on rejection — which sphere came up short, or `undefined` for the common pool. */
  readonly shortfallSphere?: SphereName;
}

/** Floating-point slack, matching `buildNudgeHand`'s affordability check. */
const EPSILON = 1e-9;

/**
 * Charge a committed hand against the essence pool.
 *
 * Sphere-gated cards draw on their own sphere. A common card draws on
 * `primarySphere` first and then spills across the remaining spheres — the
 * ungated affordability check in `buildNudgeHand` reads the *pooled* total, so
 * the spend has to be able to reach the whole pool or a card the hand called
 * playable could fail to charge.
 *
 * All-or-nothing: on any shortfall the original pool is returned untouched and
 * `ok` is false. Never mutates its input.
 */
export function spendNudgeEssence(
  pool: EssencePool,
  requests: readonly NudgeSpendRequest[],
  primarySphere: SphereName,
): NudgeSpendResult {
  const next: EssencePool = { ...pool };
  let spent = 0;

  // Sphere-gated first: they have exactly one funding source, so letting the
  // common cards spill through their sphere first could strand them.
  const gated = requests.filter((r) => r.sphere !== undefined);
  const common = requests.filter((r) => r.sphere === undefined);

  for (const request of gated) {
    const sphere = request.sphere as SphereName;
    const cost = Math.max(0, request.cost);
    if ((next[sphere] ?? 0) + EPSILON < cost) {
      return { ok: false, pool, spent: 0, shortfallSphere: sphere };
    }
    next[sphere] = (next[sphere] ?? 0) - cost;
    spent += cost;
  }

  for (const request of common) {
    let remaining = Math.max(0, request.cost);
    if (remaining <= 0) continue;

    const order: SphereName[] = [
      primarySphere,
      ...(Object.keys(next) as SphereName[]).filter((s) => s !== primarySphere),
    ];
    for (const sphere of order) {
      if (remaining <= EPSILON) break;
      const take = Math.min(next[sphere] ?? 0, remaining);
      if (take <= 0) continue;
      next[sphere] = (next[sphere] ?? 0) - take;
      remaining -= take;
      spent += take;
    }

    if (remaining > EPSILON) {
      return { ok: false, pool, spent: 0, shortfallSphere: undefined };
    }
  }

  return { ok: true, pool: next, spent };
}
