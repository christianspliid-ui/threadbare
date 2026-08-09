/**
 * The two pure decisions inside `check:encounter-live`. THR-1047.
 *
 * Extracted from `encounter-live-proof.ts` for the reason the `*-predicate.ts`
 * modules exist: the script itself boots a whole world at import time, so
 * nothing in it is reachable from a test. These two functions carry the
 * judgment — which cards a run commits, and what verdict a claim set earns —
 * and both have a failure mode that is silent in the direction that matters.
 *
 * `selectHand` decides *deterministically*: a proof whose hand varied run to run
 * would produce a verdict that varied run to run, which trains the line to
 * re-run until green (NFP #3).
 *
 * `computeVerdict` decides whether a run that broke nothing actually *proved*
 * anything. A template declaring no cast, reward, seed, condition or reachable
 * variant satisfies every baseline claim by spawning and not crashing — and
 * would read as a pass. `vacuous` is the verdict that keeps that from being
 * mistaken for delivery.
 */

// ─── Verdict ─────────────────────────────────────────────────────────

export type ClaimStatus = 'pass' | 'fail' | 'not_declared';

export type ProofVerdict = 'proved' | 'failed' | 'vacuous';

export interface VerdictClaim {
  readonly name: string;
  readonly status: ClaimStatus;
}

/**
 * Claims every run makes regardless of what the template declares.
 *
 * They are excluded from the vacuity test on purpose: counting them would make
 * every run that spawned and did not crash look like it proved something, which
 * is precisely the reading `vacuous` exists to refuse.
 */
export const BASELINE_CLAIMS: readonly string[] = [
  'registered',
  'spawn',
  'no_tick_crash',
  'steps_resolved',
];

/**
 * `failed` beats `vacuous` beats `proved`.
 *
 * A single failed claim is a failure however much else passed — the run found a
 * declared block that did not arrive, and that is the whole output. Absent a
 * failure, a run earns `proved` only if it both *declared* and *passed* at least
 * one non-baseline claim; anything else is `vacuous`.
 */
export function computeVerdict(claims: readonly VerdictClaim[]): ProofVerdict {
  if (claims.some(claim => claim.status === 'fail')) return 'failed';

  const delivery = claims.filter(claim => !BASELINE_CLAIMS.includes(claim.name));
  const declared = delivery.some(claim => claim.status !== 'not_declared');
  const proved = delivery.some(claim => claim.status === 'pass');

  return declared && proved ? 'proved' : 'vacuous';
}

// ─── Hand selection ──────────────────────────────────────────────────

export type PlayMode = 'none' | 'cheapest' | 'all';

/** The shape `selectHand` needs — a nudge card's id and price. */
export interface HandCard {
  readonly id: string;
  readonly essenceCost: number;
}

/**
 * Pick the cards one run commits, per step, deterministically.
 *
 * `cheapest` takes the single lowest-cost card on each nudge-bearing step, ties
 * broken by **id** rather than by authoring order — re-ordering a step's
 * `nudges` array must not change which card a proof plays, or a cosmetic edit to
 * a template would silently change its verdict.
 */
export function selectHand(
  stepHands: readonly (readonly HandCard[])[],
  mode: PlayMode,
): readonly string[] {
  if (mode === 'none') return [];
  const committed: string[] = [];
  for (const hand of stepHands) {
    if (hand.length === 0) continue;
    if (mode === 'all') {
      committed.push(...hand.map(card => card.id));
      continue;
    }
    const cheapest = [...hand].sort((a, b) => {
      const costDelta = (a.essenceCost ?? 0) - (b.essenceCost ?? 0);
      return costDelta !== 0 ? costDelta : a.id.localeCompare(b.id);
    })[0];
    if (cheapest) committed.push(cheapest.id);
  }
  return committed;
}
