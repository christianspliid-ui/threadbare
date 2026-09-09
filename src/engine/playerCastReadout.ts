/**
 * What the focused action card may truthfully say about a cast (THR-998).
 *
 * The focused card used to read its risk word straight off the template's hardest
 * authored step difficulty. That number is not the one the roll subtracts:
 * `applyScaleDifficultyAdjust` first shifts it by the per-scale offset and then
 * **caps it from above** so the per-scale probability floor holds, and for a fresh
 * god that cap is 0 at `local` and `personal` — 85% of the actor-target slot list.
 * So two cards priced 0.20 and 0.50 read *"A steady working."* and *"A perilous
 * working."* while resolving to the identical probability. The line was true about
 * the template and false about the player's odds, which is the exact failure a risk
 * hint exists to prevent.
 *
 * This module owns the one number a card is allowed to differentiate on:
 * `effectiveCastDifficulty` — the difficulty that survives the offset and the floor
 * and actually reaches `P = capability + sphereFactor - difficulty + mods`.
 *
 * **The invariant, and why it is truthful by construction.** The card's line is a
 * function of `effectiveCastDifficulty` alone. Two casts with equal odds therefore
 * have equal effective difficulty and so read the same line — there is no path by
 * which the card can differentiate on a price the roll ignored. The old shape could
 * only be kept honest by re-measuring the corpus; this one cannot go wrong.
 *
 * It is also self-maintaining. The cap is `capability - MIN_PROBABILITY_BY_SCALE[scale]`,
 * so as `reachPractice` (THR-613) walks a god's capability across a run, more of the
 * authored price survives, more cards differentiate, and the harder words become
 * reachable — the card starts reporting risk exactly when risk becomes real. No
 * threshold re-tune and no content re-pricing is involved in that (THR-766 measured
 * both and kept both; re-pricing would also burn authored intent for no mechanical
 * gain — the THR-736 anti-pattern).
 *
 * Direction picked from the three the ticket offered: **direction 2** (stop claiming
 * risk where the odds are flat, say the honest thing instead). Direction 1 — bucket
 * the same three words on the resolved probability — was implemented far enough to
 * measure and rejected: a fresh god reads P = 0.70 at `personal` and 0.65 at `local`,
 * so 85% of the slot list collapses onto a single word. That is truthful and
 * degenerate, and swallowing the card face is the very failure the risk line was
 * introduced to avoid (`playerCastBalance.test.ts` bounds any one word at 60%).
 * Direction 3 (lowering the scale floors) stays ruled out — `MIN_PROBABILITY_BY_SCALE`
 * governs mortal resolution too, so it is not a player-cast-local change.
 */

import { applyScaleDifficultyAdjust, MIN_PROBABILITY_BY_SCALE } from './resolutionScaleAdjust';
import { PROBABILITY_FLOOR, PROBABILITY_CEILING } from './resolutionService';
import { computeCapabilityWithRawBonus } from './domainCapability';
import { getAscendantDomainAffinities } from './ascendant';
import { ascendantCastRawBonus } from '../data/player-cast-constants';
import { REACH_DOMAINS } from '../types/traits';
import type { ReachDomain } from '../types/traits';
import type { ActionScale } from '../types/unifiedAction';
import type { WorldGraph } from './graph';

/**
 * Sphere factor for a player cast, pre-roll.
 *
 * `resolveUncontestedStep` hardcodes `const sphereFactor = 0` for every source, so
 * the card reads the same zero rather than guessing at a term the resolver does not
 * yet compute. Named rather than inlined (NFP #1) so that if the resolver ever grows
 * a real sphere factor, the two places that must move are greppable from each other.
 */
export const CARD_READOUT_SPHERE_FACTOR = 0;

/**
 * Modifier total for a player cast, pre-roll.
 *
 * The resolver's `mods` is push + intervention boost. Push is mortal-only
 * (`PLAYER_CAST_PUSH_ENABLED` is `false`), and an intervention boost comes from a
 * remembered choice that does not exist before the cast is made — so zero is the
 * correct pre-roll read, not an approximation.
 */
export const CARD_READOUT_MODS = 0;

/**
 * The difficulty that actually reaches the roll for this cast.
 *
 * Runs the resolver's own `applyScaleDifficultyAdjust` rather than re-deriving the
 * arithmetic, so the card and the roll cannot drift apart — that drift is the whole
 * of THR-998. Negatives collapse to 0 because the resolver zeroes them (a template
 * cheaper than its scale offset is simply free, not a bonus).
 *
 * Returns 0 when the authored difficulty contributes nothing beyond a guaranteed
 * casting's — either because the floor capped it away or because the scale offset
 * already covered it. A caller reading 0 must not print a risk word: at 0 the odds
 * are the scale floor speaking and the authored price is silent.
 *
 * Fail-soft: a non-finite difficulty or capability reads as 0 (no claim) rather
 * than propagating NaN into the card face.
 */
export function effectiveCastDifficulty(
  maxDifficulty: number | undefined,
  capability: number | undefined,
  scale: ActionScale | undefined,
): number {
  if (typeof maxDifficulty !== 'number' || !Number.isFinite(maxDifficulty) || maxDifficulty <= 0) {
    return 0;
  }
  if (typeof capability !== 'number' || !Number.isFinite(capability)) return 0;

  const { adjustedDifficulty } = applyScaleDifficultyAdjust(
    maxDifficulty,
    capability,
    CARD_READOUT_SPHERE_FACTOR,
    CARD_READOUT_MODS,
    scale,
  );
  return Number.isFinite(adjustedDifficulty) ? Math.max(0, adjustedDifficulty) : 0;
}

/**
 * The ascendant's cast capability in every reach, as the card readout needs it.
 *
 * Mirrors the player branch of `resolveUncontestedStep` exactly — the same
 * `computeCapabilityWithRawBonus` over the same `ascendantCastRawBonus` of the same
 * persisted affinity. Reading the graph rather than the affinities alone is what
 * keeps the readout honest as a run progresses: `reachPractice` accrues onto the
 * raw score, so an affinities-only shortcut would understate a deepened god and
 * keep showing scale lines long after difficulty had started to bite.
 *
 * Computed for all eight reaches at once because the caller filters templates by
 * reach after the fact and the whole map is eight sigmoids — cheaper than threading
 * a lazy resolver through the slot builder.
 *
 * Fail-soft: an unresolvable ascendant still yields a full map (every reach at the
 * base bonus), never a partial one, so no caller has to handle a missing key.
 */
export function castCapabilityByReach(
  graph: WorldGraph,
  ascendantId: string,
): Record<ReachDomain, number> {
  const affinities = getAscendantDomainAffinities(graph, ascendantId);
  const out = {} as Record<ReachDomain, number>;
  for (const reach of REACH_DOMAINS) {
    out[reach] = computeCapabilityWithRawBonus(
      graph,
      ascendantId,
      reach,
      ascendantCastRawBonus(affinities?.[reach]),
    );
  }
  return out;
}

/**
 * The probability the roll will use for this cast, pre-roll (THR-1002).
 *
 * The card's odds zone reads a **forecast tier word** — the same vocabulary the
 * encounter stage's test panel uses — and this is the quantity that word
 * classifies. It runs the resolver's arithmetic in the resolver's own order:
 * `applyScaleDifficultyAdjust` first (offset, then the per-scale cap that
 * enforces the floor), then `P = capability + sphereFactor - difficulty + mods`,
 * then the floor itself. Nothing here re-derives a formula the resolver owns, so
 * the word on the card and the number in the roll cannot drift — THR-998's
 * invariant, restated for a tier word instead of a risk sentence: *the card's
 * odds reading is a function of the probability the roll uses.*
 *
 * **Why the floor is applied here and not left to the caller.** A fresh god's
 * `local` working has its authored difficulty capped away entirely, so its raw
 * `capability - difficulty` can sit below `MIN_PROBABILITY_BY_SCALE.local`; the
 * resolver lifts it to the floor post-hoc. A card that classified the *unfloored*
 * number would read `perilous` on a cast that resolves `favorable` — the precise
 * lie this module exists to prevent.
 *
 * A zero-difficulty step reads `fated` for a capable god at `personal` or `local`,
 * where the scale offset is negative and nothing is left to subtract. It does **not**
 * at `cosmic`, whose +0.10 offset the resolver applies to an unpriced step like any
 * other — see the comment in the body. The word follows the roll, including where
 * that is less flattering than the template suggests.
 *
 * Fail-soft: a non-finite capability or difficulty returns the scale floor rather
 * than propagating NaN onto the card face — the floor is the weakest true claim
 * available, and the tier word it produces is never a guess about the template.
 */
export function castForecastProbability(
  maxDifficulty: number | undefined,
  capability: number | undefined,
  scale: ActionScale | undefined,
): number {
  const resolvedScale: ActionScale = scale ?? 'regional';
  const floor = MIN_PROBABILITY_BY_SCALE[resolvedScale] ?? PROBABILITY_FLOOR;

  if (typeof capability !== 'number' || !Number.isFinite(capability)) return floor;

  // NOT `effectiveCastDifficulty`, deliberately — and this is the one subtle thing
  // in the module.
  //
  // That function early-returns 0 for an unpriced step, because its job is to answer
  // *"may the card claim a risk?"*, and at 0 the answer is no. But the resolver does
  // not skip the scale offset for an unpriced step: it runs
  // `applyScaleDifficultyAdjust(0, …)`, which at `cosmic` **adds** +0.10. So a
  // zero-difficulty cosmic working really does roll harder than the god's bare
  // capability, and a readout built on the presentation helper would have quoted
  // capability flat — overstating the odds on exactly the scale where the stakes are
  // highest. Measured, not reasoned: the cross-check against
  // `computeResolutionThreshold` caught it at cap 0.2 / diff 0 / cosmic (0.2 vs 0.1).
  const { adjustedDifficulty } = applyScaleDifficultyAdjust(
    typeof maxDifficulty === 'number' && Number.isFinite(maxDifficulty) ? Math.max(0, maxDifficulty) : 0,
    capability,
    CARD_READOUT_SPHERE_FACTOR,
    CARD_READOUT_MODS,
    scale,
  );
  const difficulty = Math.max(0, Math.min(1, adjustedDifficulty));
  const raw = capability + CARD_READOUT_SPHERE_FACTOR - difficulty + CARD_READOUT_MODS;
  if (!Number.isFinite(raw)) return floor;

  // Which floor applies depends on the actor, and the two are not the same number.
  //
  // `applyScaleDifficultyAdjust` has *already* enforced the scale floor for an
  // actor capable enough to clear it — it caps difficulty from above precisely so
  // `raw >= MIN_PROBABILITY_BY_SCALE[scale]` holds — so for that actor there is
  // nothing left to lift here. An actor *below* the scale floor gets
  // `maxDifficultyForFloor = 0` instead, leaving `raw === capability`, and the
  // resolver lifts that one to the global `PROBABILITY_FLOOR` in its own
  // post-process. Reading the scale floor for them would overstate their odds —
  // which is the same class of lie as understating them.
  // The resolver's own clamp, not a [0, 1] bound: `computeResolutionThreshold`
  // returns inside [PROBABILITY_FLOOR, PROBABILITY_CEILING], so a readout clamped
  // any wider would disagree with the roll at the extremes — which is the whole
  // class of defect this module exists to close.
  return Math.min(PROBABILITY_CEILING, Math.max(PROBABILITY_FLOOR, raw));
}
