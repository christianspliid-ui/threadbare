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
 * The card's risk vocabulary was retired by THR-1002.
 *
 * `RISK_HINT_THRESHOLDS`, `RISK_HINT_WORDS`, `riskHintLine`, `SCALE_HINT_LINES`,
 * `DEFAULT_SCALE_HINT_LINE` and `castHintLine` lived here and produced one
 * sentence — *"An uncertain working."* — which the focused ActionCard printed
 * under its Effect block. All six are gone, and nothing replaced them one-for-one.
 *
 * **What replaced them, and why it is not the same thing.** The card now prints a
 * **forecast tier word**, classified by `classifyForecastTier` from the probability
 * `castForecastProbability` computes (`src/engine/playerCastReadout.ts`) — the same
 * ladder, the same classifier and the same five words the encounter forecast uses.
 * The retired vocabulary was a *second* lexicon for the same question: three words
 * against the forecast's five, bucketed by its own cut-points. Two vocabularies for
 * one concept is what Law 9 forbids, and in practice it meant a nudge card and an
 * action card could describe identical odds in different words on adjacent surfaces.
 *
 * THR-766's balance verdict on the cut-points is **superseded, not lost**. The tier
 * boundaries are now `FORECAST_TIER_*_MAX`, which the encounter forecast had already
 * calibrated, and `playerCastBalance.test.ts` re-points its measurement at the new
 * invariant — *the card's word equals the roll's tier* — which is a stronger claim
 * than the spread it used to assert. A spread can be healthy while every individual
 * card lies; an equality cannot.
 *
 * The constants above (`PLAYER_CAST_*`, `ASCENDANT_CAST_*`) are untouched: they
 * govern the roll, not the sentence about it.
 */
