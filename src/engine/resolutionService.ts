/**
 * Shared Resolution Service (Phase 2).
 *
 * One authoritative place for resolution math used by:
 * - unified action runtime
 * - legacy encounter resolution
 * - planner/forecast consumers
 * - candidate scoring / expected utility
 *
 * Canonical difficulty normalization rule:
 * All callers must provide `difficulty` in the range 0..1.
 * Legacy encounter callers normalize at their boundary via normalizeLegacyDifficulty().
 * Unified actions already operate in normalized form and pass through directly.
 *
 * Crit model (Phase 2 — replaces flat roll >= 96 tail):
 * - Doubles (11, 22, 33, ..., 99) determine crits
 * - Doubles at or under threshold = critical_success
 * - Doubles over threshold = critical_failure
 * - This makes crit frequency scale with competence instead of being flat
 *
 * ─── Constants (NFP #1: Tunability) ─────────────────────────────────
 * | Name                           | Default | Purpose                              |
 * |--------------------------------|---------|--------------------------------------|
 * | PROBABILITY_FLOOR              | 0.05    | Minimum success probability          |
 * | PROBABILITY_CEILING            | 0.95    | Maximum success probability          |
 * | NEAR_MISS_MARGIN               | 5       | |margin| <= this = near miss         |
 * | LEGACY_DIFFICULTY_DIVISOR      | 100     | Divides legacy integer difficulty     |
 *
 * ─── Tracing ────────────────────────────────────────────────────────
 * The service itself is pure math — callers emit traces with the results.
 *
 * ─── Fail-soft ──────────────────────────────────────────────────────
 * | Failure case                    | Fallback                           |
 * |---------------------------------|------------------------------------|
 * | difficulty outside 0..1         | Clamped to 0..1                    |
 * | capability negative             | Treated as 0                       |
 * | NaN inputs                      | Returns failure with probability 0 |
 *
 * ─── PRNG ───────────────────────────────────────────────────────────
 * resolveAction() requires a seeded RNG. forecastAction() is pure math.
 */

import type {
  OutcomeType,
  ResolutionInput,
  ResolutionResult,
  ResolutionRollBreakdown,
  ResolutionProbabilitySummary,
  FateForecast,
  ForecastTier,
  ResolutionMode,
  ResolutionTestShaper,
  AppliedResolutionShaper,
} from '../types/resolution';

// ─── Constants (NFP #1: Tunability) ────────────────────────────────

/** Minimum success probability — nobody is completely hopeless */
export const PROBABILITY_FLOOR = 0.05;

/** Maximum success probability — nothing is ever guaranteed */
export const PROBABILITY_CEILING = 0.95;

/** Margin within which an outcome is classified as a near miss */
export const NEAR_MISS_MARGIN = 5;

/**
 * Divisor for normalizing legacy encounter integer difficulty to 0..1.
 * Legacy encounters use difficulty values like 12, 25, 30 which must be
 * divided by this constant to produce the canonical 0..1 range.
 */
export const LEGACY_DIFFICULTY_DIVISOR = 100;

// ─── Difficulty Normalization ──────────────────────────────────────

/**
 * Normalize a legacy integer-like difficulty value to the canonical 0..1 range.
 * This adapter belongs at the caller boundary, not inside the resolver.
 *
 * @param rawDifficulty - Legacy difficulty value (e.g., 12, 25, 30)
 * @returns Normalized difficulty in 0..1
 */
export function normalizeLegacyDifficulty(rawDifficulty: number): number {
  return Math.max(0, Math.min(1, rawDifficulty / LEGACY_DIFFICULTY_DIVISOR));
}

// ─── Core Threshold Computation ────────────────────────────────────

/**
 * Compute the resolution threshold from inputs.
 * This is the single source of truth for probability math.
 *
 * P = capability + sphereFactor - difficulty + modifiers + influenceNudge
 * Clamped to [PROBABILITY_FLOOR, PROBABILITY_CEILING]
 *
 * @returns Probability in [0.05, 0.95]
 */
export function computeResolutionThreshold(inputs: ResolutionInput): number {
  const cap = Math.max(0, inputs.capability ?? 0);
  const diff = Math.max(0, Math.min(1, inputs.difficulty));
  const sphere = inputs.sphereFactor ?? 0;
  const mods = inputs.actionModifiers ?? 0;
  const nudge = inputs.influenceNudge ?? 0;

  const raw = cap + sphere - diff + mods + nudge;

  // Fail-soft: NaN check
  if (Number.isNaN(raw)) return PROBABILITY_FLOOR;

  return Math.min(PROBABILITY_CEILING, Math.max(PROBABILITY_FLOOR, raw));
}

// ─── Roll Classification ───────────────────────────────────────────

/**
 * Check if a d100 roll is "doubles" (11, 22, 33, ..., 99).
 * Roll value 100 is not doubles.
 */
function isDoubles(roll: number): boolean {
  if (roll < 11 || roll > 99) return false;
  const tens = Math.floor(roll / 10);
  const ones = roll % 10;
  return tens === ones;
}

/**
 * Classify a roll against a threshold using the Phase 2 crit model.
 *
 * - Success: roll <= threshold
 * - Failure: roll > threshold
 * - Critical success: doubles AND roll <= threshold
 * - Critical failure: doubles AND roll > threshold
 *
 * This means crit frequency scales with competence:
 * - High threshold (skilled actor) → more doubles fall under threshold → more crit successes, fewer crit failures
 * - Low threshold (unskilled actor) → fewer doubles under threshold → fewer crit successes, more crit failures
 */
export function classifyResolutionRoll(
  probability: number,
  roll: number,
): ResolutionRollBreakdown {
  const threshold = Math.floor(probability * 100);
  const doubles = isDoubles(roll);
  const margin = roll - threshold;
  const success = roll <= threshold;

  let critClassification: ResolutionRollBreakdown['critClassification'] = 'none';
  if (doubles) {
    critClassification = success ? 'critical_success' : 'critical_failure';
  }

  return {
    threshold,
    roll,
    isDoubles: doubles,
    margin,
    critClassification,
    nearMiss: Math.abs(margin) <= NEAR_MISS_MARGIN,
  };
}

/**
 * Derive the OutcomeType from a roll breakdown.
 */
function breakdownToOutcome(breakdown: ResolutionRollBreakdown): OutcomeType {
  const success = breakdown.roll <= breakdown.threshold;

  if (breakdown.critClassification === 'critical_success') return 'critical_success';
  if (breakdown.critClassification === 'critical_failure') return 'critical_failure';
  if (success) return 'success';
  return 'failure';
}

const OUTCOME_LADDER: OutcomeType[] = [
  'critical_failure',
  'failure',
  'success_at_cost',
  'success',
  'critical_success',
];

function shiftOutcome(outcome: OutcomeType, steps: number): OutcomeType {
  const index = OUTCOME_LADDER.indexOf(outcome);
  if (index === -1) return outcome;
  const shifted = Math.max(0, Math.min(OUTCOME_LADDER.length - 1, index + steps));
  return OUTCOME_LADDER[shifted];
}

function matchesShaperTrigger(
  shaper: ResolutionTestShaper,
  outcome: OutcomeType,
  breakdown: ResolutionRollBreakdown,
): boolean {
  switch (shaper.trigger) {
    case 'near_miss':
      return breakdown.nearMiss;
    case 'failure':
      return outcome === 'failure' || outcome === 'critical_failure';
    case 'success':
      return outcome === 'success' || outcome === 'success_at_cost' || outcome === 'critical_success';
    case 'any':
      return true;
  }
}

function applyTestShapers(
  outcome: OutcomeType,
  breakdown: ResolutionRollBreakdown,
  testShapers: readonly ResolutionTestShaper[] | undefined,
): { outcome: OutcomeType; appliedShaper?: AppliedResolutionShaper } {
  if (!testShapers || testShapers.length === 0) {
    return { outcome };
  }

  for (const shaper of testShapers) {
    if (!matchesShaperTrigger(shaper, outcome, breakdown)) continue;
    if (shaper.maxMargin !== undefined && Math.abs(breakdown.margin) > shaper.maxMargin) continue;
    if (shaper.steps === 0) continue;

    const shiftedOutcome = shiftOutcome(outcome, shaper.steps);
    if (shiftedOutcome === outcome) continue;

    return {
      outcome: shiftedOutcome,
      appliedShaper: {
        sourceAttachmentId: shaper.sourceAttachmentId,
        sourceAttachmentName: shaper.sourceAttachmentName,
        trigger: shaper.trigger,
        steps: shaper.steps,
        maxMargin: shaper.maxMargin,
        outcomeBefore: outcome,
        outcomeAfter: shiftedOutcome,
      },
    };
  }

  return { outcome };
}

// ─── Forecast (Pure Math) ──────────────────────────────────────────

/**
 * Classify a probability into a Fate Forecast tier.
 * Same logic as resolution.ts classifyForecast — kept in sync.
 */
function classifyForecast(p: number): ForecastTier {
  if (p < 0.20) return 'doomed';
  if (p < 0.40) return 'perilous';
  if (p < 0.60) return 'uncertain';
  if (p < 0.80) return 'favorable';
  return 'fated';
}

/**
 * Compute outcome probabilities for planners and previews.
 * Uses the same threshold and crit rules as live resolution.
 *
 * Doubles probability: 9 doubles exist (11,22,...,99) in 100 outcomes = 0.09.
 * P(crit_success) = doubles_count_under_threshold / 100
 * P(crit_failure) = doubles_count_over_threshold / 100
 */
export function computeOutcomeProbabilities(inputs: ResolutionInput): ResolutionProbabilitySummary {
  const probability = computeResolutionThreshold(inputs);
  const threshold = Math.floor(probability * 100);

  // Count doubles at or under threshold
  let doublesUnder = 0;
  let doublesOver = 0;
  for (let d = 1; d <= 9; d++) {
    const doublesRoll = d * 10 + d; // 11, 22, ..., 99
    if (doublesRoll <= threshold) {
      doublesUnder++;
    } else {
      doublesOver++;
    }
  }

  const critSuccessProb = doublesUnder / 100;
  const critFailureProb = doublesOver / 100;
  const successProb = threshold / 100; // includes crits
  const failureProb = 1 - successProb;  // includes crits

  return {
    successProbability: successProb,
    critSuccessProbability: critSuccessProb,
    critFailureProbability: critFailureProb,
    failureProbability: failureProb,
    threshold,
    forecastTier: classifyForecast(probability),
  };
}

/**
 * Forecast an action's outcome probabilities without rolling.
 * Uses the same math as live resolution — no planner-only offsets.
 */
export function forecastAction(inputs: ResolutionInput): ResolutionProbabilitySummary {
  return computeOutcomeProbabilities(inputs);
}

// ─── Live Resolution ───────────────────────────────────────────────

/**
 * Resolve an action by rolling a d100 against the computed threshold.
 *
 * This is the single authoritative live resolution function.
 * Both unified actions and legacy encounters should call this.
 *
 * @param inputs - Resolution inputs with normalized difficulty (0..1)
 * @param rng - Seeded PRNG function (NFP #3: Determinism)
 * @param deterministicRoll - Optional fixed roll for testing
 * @param sourceSystem - Which system is calling (for telemetry attribution)
 */
export function resolveAction(
  inputs: ResolutionInput,
  rng: () => number,
  deterministicRoll?: number,
  sourceSystem?: ResolutionResult['sourceSystem'],
): ResolutionResult {
  const probability = computeResolutionThreshold(inputs);
  const roll = deterministicRoll ?? (Math.floor(rng() * 100) + 1);

  const breakdown = classifyResolutionRoll(probability, roll);
  const baseOutcome = breakdownToOutcome(breakdown);
  const shaped = applyTestShapers(baseOutcome, breakdown, inputs.testShapers);

  const forecast: FateForecast = {
    probability,
    forecastTier: classifyForecast(probability),
    topContributors: [], // populated by caller with graph context
  };

  return {
    outcome: shaped.outcome,
    roll,
    probability,
    margin: breakdown.margin,
    marginalFactor: breakdown.nearMiss ? 'close_call' : undefined,
    forecast,
    rollBreakdown: breakdown,
    appliedShaper: shaped.appliedShaper,
    sourceSystem,
  };
}

// ─── Convenience: Success Check ────────────────────────────────────

/** Check if an outcome is any form of success (including success_at_cost). */
export function isSuccessOutcome(outcome: OutcomeType): boolean {
  return outcome === 'critical_success' || outcome === 'success' || outcome === 'success_at_cost';
}

/** Check if an outcome is any form of failure. */
export function isFailureOutcome(outcome: OutcomeType): boolean {
  return outcome === 'failure' || outcome === 'critical_failure';
}
