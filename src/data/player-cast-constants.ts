/**
 * Player-cast outcome variance — tunables (THR-728).
 *
 * A player cast used to auto-succeed: `resolveUncontestedStep` returned
 * `{ outcome: 'success', probability: 1 }` for `source === 'player'` before any
 * capability, difficulty or shaper was consulted — so the 82 ascendant-castable
 * templates carrying authored step difficulties had that price silently thrown
 * away, and the Divine Receipt (THR-727) could only ever report two of its six
 * bands. Casts now roll the same ladder mortals do, with one asymmetry: a paid
 * cast can never outright fail. The worst it can land is success-at-cost — the
 * miracle lands crooked, but it lands.
 *
 * User verdict (chat, 2026-07-24): "Yes, with a safety floor."
 */
import type { OutcomeType } from '../types/resolution';

/**
 * Master switch (NFP #1). `false` restores the pre-THR-728 auto-success
 * early-return verbatim — the one-flag revert for this whole feature.
 */
export const PLAYER_CAST_VARIANCE_ENABLED: boolean = true;

/**
 * The worst outcome a paid player cast can produce. `isStepSuccess('success_at_cost')`
 * is true, so the step's `onSuccess` ops still run — the effect lands, it just
 * costs. This is the compensation that stands in for a refund (there are none).
 */
export const PLAYER_CAST_OUTCOME_FLOOR: OutcomeType = 'success_at_cost';

/**
 * Player casts never push or resist. Push spends actor quintessence pre-roll and
 * resist buys a post-roll downgrade — both belong to the mortal economy, and with
 * an unconditional floor resist is redundant anyway. Opening either to the
 * ascendant is a separate design, not a side effect of this one.
 */
export const PLAYER_CAST_PUSH_ENABLED: boolean = false;

/**
 * The ascendant's innate divine aptitude, on the raw score the capability sigmoid
 * consumes (midpoint 10, k 0.4).
 *
 * Measured during THR-728 implementation: the ascendant node carries no term the
 * raw score walks. Mortals carry `domainCapabilities` of 10–40 (`generateDomainCapabilities`);
 * the ascendant carries `domainAffinities` of 2–5, which `rankedAffinityReaches`
 * uses to *rank* its two permanent reaches — a different unit entirely. Read
 * literally, a fresh god rolls at raw 0 → capability 0.02, and every
 * positive-difficulty cast floors: 94% success-at-cost, 6% near-miss, measured
 * over 400 seeds. That is one band, which would make the Divine Receipt flatter
 * than the auto-success it replaces.
 *
 * At raw ≈ 8 (capability ≈ 0.31) the ladder opens the way the design wants:
 * ~68% strained, ~23% clean, ~7% fortunate, ~2% surge at local scale — with
 * success-at-cost dominant, matching the rulebook's stated texture. These two
 * numbers place a fresh god there and let the primary reach outrank the secondary.
 * `reachPractice` (THR-613) then accrues on top across a run, walking the god
 * toward capability 0.5–0.7 — the deepening is legible in the outcomes.
 *
 * This bonus applies to player-sourced resolution ONLY. It deliberately does not
 * touch `computeRawScore`, so the ascendant's displayed tier and THR-613's
 * Deepening tier-crossing thresholds keep reading the score they were tuned on.
 *
 * **THR-766 balance verdict (2026-08-06): keep 6 / 0.5.** Re-measured over 400
 * seeded streams per cell. A fresh god reads capability 0.168 off-domain, 0.231 on
 * a secondary reach (affinity 2), 0.354 on a primary (affinity 5); at `local` scale
 * — 79% of the actor-target slot list — a primary-reach cast lands 64.8%
 * success-at-cost / 28.0% success / 4.3% near-miss / 3.0% critical-success, and
 * never fails. That is the rulebook's texture, so the number stays.
 *
 * The argument for keeping it is stronger than "it measures fine", and worth
 * stating because the obvious move is to raise it: at `local` and `personal` scale
 * the scale floor clamps authored difficulty to zero (THR-998), so this base raw is
 * the *only* term that moves the outcome distribution there. It is therefore not
 * just a starting point — it is the entire range `reachPractice` has to walk across
 * a run. Raising it to 10 puts a fresh god at 50% success-at-cost / 41% clean,
 * spending most of the Deepening arc before the first cast. Pinned by
 * `playerCastBalance.test.ts`, which goes red on any change to either constant.
 */
export const ASCENDANT_CAST_BASE_RAW = 6;

/** Weight converting a reach affinity (2–5) into raw-score points for a cast. */
export const ASCENDANT_CAST_AFFINITY_WEIGHT = 0.5;

/**
 * Raw-score bonus for a player cast in a given reach. Fail-soft: an ascendant with
 * no persisted affinity for the reach (off-domain, or a node predating THR-503)
 * still gets the base — never a NaN, never a zero-capability cast.
 */
export function ascendantCastRawBonus(affinity: number | undefined): number {
  const weighted = typeof affinity === 'number' && Number.isFinite(affinity)
    ? affinity * ASCENDANT_CAST_AFFINITY_WEIGHT
    : 0;
  return ASCENDANT_CAST_BASE_RAW + weighted;
}

/**
 * Difficulty cut-points for the focused card's qualitative risk line.
 * `[steady-below, uncertain-below]` — at or above the second value reads perilous.
 *
 * **THR-766 balance verdict (2026-08-06): keep [0.25, 0.45].** Re-read against the
 * live actor-target slot list as the drawer actually builds it — `targetCategories`
 * including `actor`, positive difficulty, 519 templates — the shipped cut-points
 * spread 19% steady / 50% uncertain / 30% perilous. THR-766 was filed on a sample
 * reading 7-of-10 perilous; that does not reproduce, because the sample was drawn
 * when the pool held ~84 such templates, before the WS5 migration grew it to 519.
 * Every widening candidate tested makes the spread worse: [0.35, 0.55] → 49/38/13,
 * [0.40, 0.60] → 61/29/10, both dominated by `steady`.
 *
 * Read the pool through `actorAffinities: ['ascendant']` and you get 8 templates
 * instead of 519 — `getTargetActionSlots` gates on `targetCategories` and never on
 * `actorAffinities`, so that reading makes any spread measurement vacuous. The
 * spread assertion in `playerCastBalance.test.ts` guards its own population size
 * for exactly this reason.
 *
 * Known limit — see THR-998: this word is computed from authored difficulty, which
 * the per-scale probability floor clamps away at `local` and `personal` (85% of the
 * slot list). The line is therefore truthful about the template and silent about
 * the player's odds. Re-pricing templates or moving these cut-points changes only
 * which word prints, never the roll, which is why THR-766 changed neither.
 */
export const RISK_HINT_THRESHOLDS: readonly [number, number] = [0.25, 0.45];

/** The three risk words, ordered least to most dangerous. Prose, never a number. */
export const RISK_HINT_WORDS: readonly [string, string, string] = ['steady', 'uncertain', 'perilous'];

/**
 * The focused card's risk line for a template whose hardest step is `maxDifficulty`.
 *
 * Returns null for a zero-difficulty (guaranteed) template — those cards keep an
 * unchanged face, because certainty on the soul-verbs is a design statement, not
 * an omission. Fail-soft: a non-finite or negative difficulty also reads as no hint.
 */
export function riskHintLine(maxDifficulty: number | undefined): string | null {
  if (typeof maxDifficulty !== 'number' || !Number.isFinite(maxDifficulty) || maxDifficulty <= 0) {
    return null;
  }
  const word = maxDifficulty < RISK_HINT_THRESHOLDS[0]
    ? RISK_HINT_WORDS[0]
    : maxDifficulty < RISK_HINT_THRESHOLDS[1]
      ? RISK_HINT_WORDS[1]
      : RISK_HINT_WORDS[2];
  const article = /^[aeiou]/i.test(word) ? 'An' : 'A';
  return `${article} ${word} working.`;
}
