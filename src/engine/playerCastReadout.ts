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

import { applyScaleDifficultyAdjust } from './resolutionScaleAdjust';
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
