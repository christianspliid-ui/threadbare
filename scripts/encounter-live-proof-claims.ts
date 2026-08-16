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

// ─── Declaration scope (THR-1132) ────────────────────────────────────

/**
 * What a run is entitled to assert about one declared system connection.
 *
 * `check:encounter-live` used to ask a single question of every connection the
 * template declares: *did it arrive?* But a run reaches one outcome band and
 * picks at most one reaction, while the declaration is a union over every band
 * and every reaction — so the question was unanswerable for anything authored
 * outside the path the run took, and the honest "no" was reported as ✗.
 *
 * Measured on unmodified `main` (THR-1132): the six vertical-slice templates
 * scored **0 proved / 6 failed**, every ✗ of this shape. A gate that fails
 * gate-clean content carries no information on exactly the templates the
 * Encounter Factory ships, which is worse than one that says nothing.
 *
 * So a claim now resolves to one of four scopes, and only `reachable` is
 * pass-or-fail. The other three are `not_declared` **with the reason on the
 * row** — a skip that says why is inspectable (NFP #2); a skip that vanishes is
 * how a sweep goes quiet.
 */
export type DeclarationScope =
  /** Authored on the path this run took — arrival is assertable. */
  | 'reachable'
  /** Authored only under a reaction nobody picked this run. */
  | 'reaction_scoped'
  /** Authored only on an outcome band fate did not roll. */
  | 'band_scoped'
  /** Not authored anywhere. */
  | 'absent';

/** The shape {@link classifyDeclaration} needs — `SystemSurface` from the contract. */
export interface DeclarationSurface {
  readonly unconditional: boolean;
  readonly reactionIds: readonly string[];
  readonly otherBand: boolean;
}

/**
 * Decide what this run may assert about one connection.
 *
 * `appliedReactionId` is the load-bearing input, and it is an **id**, not a
 * flag. A run applies exactly one reaction, so "some reaction fired" is not
 * enough to make a reaction-borne effect reachable — the one that fired has to
 * be the one carrying it. An earlier revision of this function took a boolean
 * and reported `swindled_family`'s seed as a *failure* on a run where the
 * engine had autonomously picked a different reaction: the seed was never going
 * to arrive, and saying so as ✗ is the same false-fail this rule exists to end.
 *
 * Order matters. `unconditional` wins outright; a connection authored both on
 * the rolled band and on another band is reachable, not band-scoped. Only when
 * nothing on this run's path could deliver it do the excuses apply, and
 * `reaction_scoped` is checked before `band_scoped` because it is the more
 * specific fact about why this run did not see it.
 */
export function classifyDeclaration(
  surface: DeclarationSurface,
  appliedReactionId: string | undefined,
): DeclarationScope {
  if (surface.unconditional) return 'reachable';
  if (surface.reactionIds.length > 0) {
    const fired = appliedReactionId !== undefined && surface.reactionIds.includes(appliedReactionId);
    return fired ? 'reachable' : 'reaction_scoped';
  }
  if (surface.otherBand) return 'band_scoped';
  return 'absent';
}

// ─── Reaction selection ──────────────────────────────────────────────

/** The shape {@link selectReaction} needs — an aftermath reaction's id. */
export interface ReactionChoice {
  readonly id: string;
}

/**
 * Pick the aftermath reaction one run applies, deterministically.
 *
 * Ties break by **id**, for the same reason {@link selectHand} does: re-ordering
 * a variant's `reactions` array must not change which effects a proof observes,
 * or a cosmetic edit would silently change a verdict (NFP #3).
 *
 * Picking the *first by id* rather than sampling is deliberate and does under-
 * assert: a template whose seed rides only its last-sorting reaction reports
 * `reaction_scoped` rather than proving the seed. That is the honest reading —
 * this stage proves one run, and one run picks one reaction. Proving every
 * branch is `--play all`'s axis, not this one's.
 */
export function selectReaction(
  reactions: readonly ReactionChoice[],
): string | undefined {
  if (reactions.length === 0) return undefined;
  return [...reactions].sort((a, b) => a.id.localeCompare(b.id))[0]?.id;
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
