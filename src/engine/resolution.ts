/**
 * Resolution System.
 *
 * Unified resolution engine: compute probability from domain capability +
 * sphere factor - difficulty + modifiers, clamp to [0.05, 0.95], roll d100,
 * determine outcome, and produce structured results with narrative attribution.
 */
import type { ForecastTier, OutcomeType, ResolutionResult, ContestedResolutionResult, FateForecast } from '../types/resolution';

/**
 * Compute final probability from components.
 * P = capability + sphereFactor - difficulty + modifiers, clamped to [0.05, 0.95]
 */
export function computeProbability(
  capability: number,
  sphereFactor: number,
  difficulty: number,
  modifiers: number,
): number {
  const raw = capability + sphereFactor - difficulty + modifiers;
  return Math.min(0.95, Math.max(0.05, raw));
}

/**
 * Classify a probability into a Fate Forecast tier.
 */
export function classifyForecast(p: number): ForecastTier {
  if (p < 0.20) return 'doomed';
  if (p < 0.40) return 'perilous';
  if (p < 0.60) return 'uncertain';
  if (p < 0.80) return 'favorable';
  return 'fated';
}

/**
 * Roll a d100 (1-100) using the provided seeded RNG.
 * NFP #3: Determinism — RNG must be seeded; never call Math.random() directly.
 */
function rollD100(rng: () => number): number {
  return Math.floor(rng() * 100) + 1;
}

/**
 * Classify the outcome from a probability and roll.
 * - Critical success: roll <= P * 10 (bottom ~10% of success range)
 * - Success: roll <= P * 100
 * - Critical failure: roll >= 96
 * - Failure: everything else
 */
function classifyOutcome(probability: number, roll: number): OutcomeType {
  const critSuccessThreshold = Math.floor(probability * 10);
  const successThreshold = Math.floor(probability * 100);

  if (roll >= 96) return 'critical_failure';
  if (roll <= critSuccessThreshold) return 'critical_success';
  if (roll <= successThreshold) return 'success';
  return 'failure';
}

/**
 * Resolve a single action.
 * @param probability - Final probability (0.05-0.95)
 * @param deterministicRoll - Optional fixed roll for testing/UI override (skips RNG entirely)
 * @param rng - Seeded RNG function; falls back to Math.random if omitted (only for legacy test callers)
 */
export function resolveAction(
  probability: number,
  deterministicRoll?: number,
  rng?: () => number,
): ResolutionResult {
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  const roll = deterministicRoll ?? rollD100(rng ?? Math.random);
  const outcome = classifyOutcome(probability, roll);
  const threshold = Math.floor(probability * 100);
  const margin = roll - threshold;

  const forecast: FateForecast = {
    probability,
    forecastTier: classifyForecast(probability),
    topContributors: [], // populated by caller with graph context
  };

  return {
    outcome,
    roll,
    probability,
    margin,
    marginalFactor: Math.abs(margin) <= 5 ? 'close_call' : undefined,
    forecast,
  };
}

/**
 * Resolve a contested action (attacker vs defender).
 * Two independent rolls; outcome from the 2×2 matrix.
 */
export function resolveContestedAction(
  attackerProbability: number,
  attackerRoll: number,
  defenderProbability: number,
  defenderRoll: number,
): ContestedResolutionResult {
  const attacker = resolveAction(attackerProbability, attackerRoll);
  const defender = resolveAction(defenderProbability, defenderRoll);

  const aSuccess = attacker.outcome === 'success' || attacker.outcome === 'critical_success';
  const dSuccess = defender.outcome === 'success' || defender.outcome === 'critical_success';

  let contestOutcome: ContestedResolutionResult['contestOutcome'];
  if (aSuccess && dSuccess) {
    contestOutcome = 'stalemate';
  } else if (aSuccess && !dSuccess) {
    contestOutcome = 'attacker_wins';
  } else if (!aSuccess && dSuccess) {
    contestOutcome = 'defender_wins';
  } else {
    contestOutcome = 'mutual_failure';
  }

  return { attacker, defender, contestOutcome };
}
