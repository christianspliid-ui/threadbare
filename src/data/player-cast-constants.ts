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
