/**
 * Planner Forecast — Phase 4 adapter over shared resolution service.
 *
 * Provides expected-utility scoring for the agent decision pipeline.
 * Uses the same math as live resolution (resolutionService.ts) but
 * translates outcome probabilities into weighted utility values that
 * account for the full 5-tier outcome ladder and quintessence economics.
 *
 * This replaces the binary "completionProb * reward" model in encounter
 * scoring with a richer model that distinguishes:
 * - critical_success → bonus value
 * - success → full value
 * - success_at_cost → reduced value minus Q cost
 * - failure → setback cost
 * - critical_failure → severe cost
 *
 * ─── Constants (NFP #1: Tunability) ─────────────────────────────────
 * | Name                                | Default | Purpose                                       |
 * |-------------------------------------|---------|-----------------------------------------------|
 * | UTILITY_CRITICAL_SUCCESS            | 1.5     | Multiplier on reward for crit success         |
 * | UTILITY_SUCCESS                     | 1.0     | Multiplier on reward for normal success       |
 * | UTILITY_SUCCESS_AT_COST             | 0.6     | Multiplier on reward for costly success       |
 * | UTILITY_FAILURE                     | -0.2    | Penalty for ordinary failure                  |
 * | UTILITY_CRITICAL_FAILURE            | -0.5    | Penalty for catastrophic failure              |
 * | PUSH_UTILITY_THRESHOLD              | 0.02    | Min expected gain from push to consider it    |
 * | RESIST_UTILITY_THRESHOLD            | 0.01    | Min expected gain from resist to consider it  |
 * | Q_LOW_THRESHOLD                     | 0.25    | Below this Q ratio, avoid spending            |
 * | Q_CRITICAL_THRESHOLD                | 0.10    | Below this Q ratio, never spend               |
 *
 * ─── Fail-soft ──────────────────────────────────────────────────────
 * | Failure case                         | Fallback                          |
 * |--------------------------------------|-----------------------------------|
 * | computeCapability throws             | capability = 0.5 (uncertain)      |
 * | Missing Q properties on node         | Treats as full (no push benefit)  |
 * | NaN from probability computation     | Returns 0 utility                 |
 *
 * ─── PRNG ───────────────────────────────────────────────────────────
 * None — all forecast functions are pure math.
 */

import { NEAR_MISS_MARGIN } from './resolutionService';
import { forecastActionAtScale } from './scaledForecast';
import type { ActionScale, StepFailBehavior } from '../types/unifiedAction';
import type { ResolutionProbabilitySummary } from '../types/resolution';
import { computeCapability } from './domainCapability';
import type { WorldGraph } from './graph';
import type { EncounterCacheEntry } from './encounterCache';
import {
  PUSH_COST_BASE,
  PUSH_MODIFIER,
  RESIST_COST_BASE,
  RESIST_DOWNGRADE_CHANCE,
  canSpendQuintessence,
} from './quintessenceActions';
import {
  QUINTESSENCE_DEFAULT,
  QUINTESSENCE_MAX_DEFAULT,
  getQuintessenceRatio,
} from '../types/quintessence';
import { isProvingSliceTemplate } from './outcomeConsequences';
import {
  CRITICAL_SUCCESS_QUINTESSENCE_REWARD,
  SUCCESS_AT_COST_QUINTESSENCE_PENALTY,
  CRITICAL_FAILURE_QUINTESSENCE_PENALTY,
} from './outcomeConsequences';

// ─── Constants (NFP #1: Tunability) ────────────────────────────────

/** Utility multiplier for critical success (bonus above normal success) */
export const UTILITY_CRITICAL_SUCCESS = 1.5;

/** Utility multiplier for normal success (baseline) */
export const UTILITY_SUCCESS = 1.0;

/** Utility multiplier for success at cost (succeeds but carries Q/growth penalty) */
export const UTILITY_SUCCESS_AT_COST = 0.6;

/** Utility cost for ordinary failure (mild setback) */
export const UTILITY_FAILURE = -0.2;

/** Utility cost for critical failure (severe setback, Q erosion) */
export const UTILITY_CRITICAL_FAILURE = -0.5;

/** Minimum expected utility gain from push to justify spending Q */
export const PUSH_UTILITY_THRESHOLD = 0.02;

/** Minimum expected utility gain from resist to justify spending Q */
export const RESIST_UTILITY_THRESHOLD = 0.01;

/** Q ratio below which the planner avoids spending (strained/weakened) */
export const Q_LOW_THRESHOLD = 0.25;

/** Q ratio below which the planner never spends (critical/broken) */
export const Q_CRITICAL_THRESHOLD = 0.10;

/** Minimum step difficulty (0..1) for the planner to consider a push modifier worthwhile */
export const HARD_STEP_DIFFICULTY_THRESHOLD = 0.3;

// ─── Push/Resist Eligibility (mirrors unifiedActionResolution.ts) ──

const PUSH_ELIGIBLE_PREFIXES = [
  // `action.shadow.assassinate` retired by THR-1430; the bought killing below stays.
  'action.iron.conquer',
  'action.gold.commission-assassination',
];

const RESIST_ELIGIBLE_PREFIXES = [
  'action.heart.',
  'action.shadow.recruit',
];

/** Check if a template is eligible for push in the runtime. */
export function isPushEligible(templateId: string): boolean {
  return PUSH_ELIGIBLE_PREFIXES.some(p => templateId.startsWith(p));
}

/** Check if a template is eligible for resist in the runtime. */
export function isResistEligible(templateId: string): boolean {
  return RESIST_ELIGIBLE_PREFIXES.some(p => templateId.startsWith(p));
}

// ─── Step-Level Forecast ───────────────────────────────────────────

/**
 * Forecast a single step's outcome probability distribution — the number the
 * dice use. Returns the full probability summary.
 *
 * THR-1579 (forecast window S2): forecasts through `forecastActionAtScale`, so the
 * step's scale offset, the difficulty cap and the post-roll scale floor apply
 * exactly as `resolveStepCore` applies them. Before this a `local` step at
 * difficulty 0.45 forecast 0.55 and rolled 0.65. `scale` undefined reads as
 * `'regional'`, the core's own default.
 *
 * @param capability - Agent's domain capability (0-1)
 * @param difficulty - Normalized difficulty (0-1) per EncounterCacheEntry contract
 * @param modifiers - Optional action modifiers
 * @param scale - The template's scale (undefined → 'regional')
 */
export function forecastStepProbabilities(
  capability: number,
  difficulty: number,
  modifiers?: number,
  scale?: ActionScale,
): ResolutionProbabilitySummary {
  return forecastActionAtScale({
    actorId: '',
    domain: 'iron', // Not used for threshold computation
    capability,
    difficulty,
    sphereFactor: 0,
    actionModifiers: modifiers ?? 0,
  }, scale);
}

/**
 * THR-1579 — the probability one step does **not** end the action, mirroring the
 * runtime rule (`advanceUnifiedAction`, `unifiedActionLifecycle.ts`): a critical
 * failure ends it at any step; a plain failure ends it only on a `fail_action`
 * step. A `continue_weakened` failure pushes on to `success_at_cost`.
 *
 * Fail-soft: an unknown or missing fail behaviour reads as `continue_weakened`,
 * so only the critical failure counts.
 */
export function stepEngagementSurvival(
  probs: ResolutionProbabilitySummary,
  failBehavior: StepFailBehavior | undefined,
): number {
  const pCritFailure = probs.critFailureProbability;
  const pPlainFailure = Math.max(0, probs.failureProbability - pCritFailure);
  const survival = 1 - pCritFailure - (failBehavior === 'fail_action' ? pPlainFailure : 0);
  return Math.max(0, Math.min(1, survival));
}

/**
 * Compute expected utility for a single step using the 5-tier outcome ladder.
 *
 * EU = P(crit_success) × UTILITY_CRITICAL_SUCCESS × reward
 *    + P(success - crit_success) × UTILITY_SUCCESS × reward
 *    + P(near_miss_success) × UTILITY_SUCCESS_AT_COST × reward
 *    + P(failure - crit_failure) × UTILITY_FAILURE × reward
 *    + P(crit_failure) × UTILITY_CRITICAL_FAILURE × reward
 *
 * Note: success_at_cost probability exactly matches the live runtime near-miss contract.
 * Live runtime: nearMiss = |roll - threshold| <= NEAR_MISS_MARGIN (5).
 * Success-side zone: [threshold-5, threshold] = NEAR_MISS_MARGIN+1 = 6 candidate rolls.
 * Doubles within that zone become critical_success (not success_at_cost) in live runtime,
 * so they are subtracted. Formula: (min(6, threshold) - doublesInZone) / 100.
 *
 * @param capability - Agent's domain capability (0-1)
 * @param difficulty - Normalized difficulty (0-1) per EncounterCacheEntry contract
 * @param rewardScale - Base reward value to scale utility against (default 1.0)
 * @param modifiers - Optional action modifiers (e.g., push bonus)
 */
export function forecastStepExpectedUtility(
  capability: number,
  difficulty: number,
  rewardScale: number = 1.0,
  modifiers?: number,
  scale?: ActionScale,
): number {
  const probs = forecastStepProbabilities(capability, difficulty, modifiers, scale);

  // Fail-soft: NaN check
  if (Number.isNaN(probs.successProbability)) return 0;

  // Decompose probabilities into the 5 tiers.
  // The shared resolver gives us:
  // - successProbability = P(roll <= threshold) = threshold / 100 [includes crits]
  // - critSuccessProbability = P(doubles AND roll <= threshold)
  // - failureProbability = P(roll > threshold) [includes crits]
  // - critFailureProbability = P(doubles AND roll > threshold)
  //
  // success_at_cost: non-crit rolls in [threshold-NEAR_MISS_MARGIN, threshold] (inclusive).
  // Live runtime: nearMiss = |roll - threshold| <= NEAR_MISS_MARGIN (5), success-side zone
  // is [threshold-5, threshold] = NEAR_MISS_MARGIN+1 (6) candidate rolls.
  // Doubles within the zone are classified as critical_success by live runtime, not
  // success_at_cost. Subtract them for exact parity with the live outcome classifier.
  const nearMissStart = Math.max(1, probs.threshold - NEAR_MISS_MARGIN);
  let doublesInZone = 0;
  for (let d = 1; d <= 9; d++) {
    const doublesRoll = d * 10 + d; // 11, 22, ..., 99 (mirrors computeOutcomeProbabilities)
    if (doublesRoll >= nearMissStart && doublesRoll <= probs.threshold) doublesInZone++;
  }
  const pSuccessAtCost = (Math.min(NEAR_MISS_MARGIN + 1, probs.threshold) - doublesInZone) / 100;

  const pCritSuccess = probs.critSuccessProbability;
  const pPlainSuccess = Math.max(0, probs.successProbability - pCritSuccess - pSuccessAtCost);
  const pCritFailure = probs.critFailureProbability;
  const pPlainFailure = Math.max(0, probs.failureProbability - pCritFailure);

  const eu =
    pCritSuccess * UTILITY_CRITICAL_SUCCESS * rewardScale +
    pPlainSuccess * UTILITY_SUCCESS * rewardScale +
    pSuccessAtCost * UTILITY_SUCCESS_AT_COST * rewardScale +
    pPlainFailure * UTILITY_FAILURE * rewardScale +
    pCritFailure * UTILITY_CRITICAL_FAILURE * rewardScale;

  return eu;
}

// ─── Encounter-Level Forecast ──────────────────────────────────────

export interface EncounterForecast {
  /** Expected utility across all steps (accounts for outcome ladder) */
  expectedUtility: number;
  /** Binary completion probability (product of per-step success probs) — kept for backward compat */
  completionProb: number;
  /**
   * THR-1579 — the engagement forecast `F`: the probability the action ends in
   * the success family (critical_success · success · success_at_cost). Mirrors
   * `computeFinalActionOutcome`: only a critical failure, or a plain failure on
   * a `fail_action` step, ends the action. Unlike `completionProb`, a
   * continue-weakened failure is not a loss here — the action ends at cost.
   * `completionProb` stays for expected utility; `F` is what the forecast
   * window (S4) reads.
   */
  engagementForecast: number;
  /** Per-step probability summaries for debug/trace */
  stepForecasts: ResolutionProbabilitySummary[];
  /** Whether push would be rational (net positive expected utility) */
  pushRecommended: boolean;
  /** Expected utility gain from pushing (0 if not recommended or not eligible) */
  pushBenefit: number;
  /** Whether resist has positive expected value for this encounter */
  resistValuable: boolean;
  /** Expected utility gain from resist option */
  resistBenefit: number;
}

/**
 * Forecast an entire encounter's expected utility for the planner.
 *
 * Multi-step encounters: the expected utility is the sum of per-step
 * utilities, weighted by the probability of reaching each step.
 * (Step N is only reached if all prior steps weren't critical failures
 * that ended the encounter — approximated by prior step success rate.)
 *
 * @param entry - Encounter cache entry with step data
 * @param agentId - Agent node ID for capability lookup
 * @param graph - World graph for capability computation
 * @param rewardScale - Override reward scaling (default: entry.successRewardEstimate)
 */
export function forecastEncounterExpectedUtility(
  entry: EncounterCacheEntry,
  agentId: string,
  graph: WorldGraph,
  rewardScale?: number,
): EncounterForecast {
  const reward = rewardScale ?? entry.successRewardEstimate;
  const stepForecasts: ResolutionProbabilitySummary[] = [];
  let totalExpectedUtility = 0;
  let completionProb = 1.0;
  let engagementForecast = 1.0;
  let reachProbability = 1.0; // P(reaching this step)

  for (let i = 0; i < entry.stepCount; i++) {
    let cap: number;
    try {
      cap = computeCapability(graph, agentId, entry.stepReaches[i]);
    } catch {
      cap = 0.5; // Fail-soft: uncertain capability
    }

    const probs = forecastStepProbabilities(cap, entry.stepDifficulties[i], undefined, entry.scale);
    stepForecasts.push(probs);

    // Per-step expected utility, weighted by probability of reaching this step
    const stepReward = reward / entry.stepCount; // Distribute reward across steps
    const stepEU = forecastStepExpectedUtility(
      cap, entry.stepDifficulties[i], stepReward, undefined, entry.scale,
    );
    totalExpectedUtility += reachProbability * stepEU;

    // Update reach probability for next step (approximation: only plain success/crit success continue)
    completionProb *= probs.successProbability;
    reachProbability *= probs.successProbability;
    engagementForecast *= stepEngagementSurvival(probs, entry.stepFailBehaviors?.[i]);
  }

  // Push/resist analysis
  const pushResult = estimatePushBenefit(entry, agentId, graph, reward);
  const resistResult = estimateResistValue(entry, agentId, graph, reward);

  return {
    expectedUtility: totalExpectedUtility,
    completionProb,
    engagementForecast: Number.isFinite(engagementForecast) ? engagementForecast : 0,
    stepForecasts,
    pushRecommended: pushResult.recommended,
    pushBenefit: pushResult.benefit,
    resistValuable: resistResult.valuable,
    resistBenefit: resistResult.benefit,
  };
}

// ─── Push Utility ──────────────────────────────────────────────────

interface PushAnalysis {
  recommended: boolean;
  benefit: number;
}

/**
 * Estimate whether pushing (spending Q for +probability) is rational.
 *
 * Push adds PUSH_MODIFIER to the probability. The benefit is the
 * difference in expected utility with and without the push, minus
 * the Q cost translated to utility.
 *
 * Only considers push-eligible templates and only when the agent
 * can afford it given their current Q state.
 */
function estimatePushBenefit(
  entry: EncounterCacheEntry,
  agentId: string,
  graph: WorldGraph,
  rewardScale: number,
): PushAnalysis {
  const noResult: PushAnalysis = { recommended: false, benefit: 0 };

  // Only push-eligible templates
  if (!isPushEligible(entry.templateId)) return noResult;

  // Check actor Q state
  const actorNode = graph.getNode(agentId);
  if (!actorNode) return noResult;
  if (!canSpendQuintessence(actorNode, 'push')) return noResult;

  const qRatio = getQuintessenceRatio(actorNode);
  // Don't push when Q is low — survival is more important
  if (qRatio < Q_LOW_THRESHOLD) return noResult;

  // Compute EU without push (baseline)
  let euWithout = 0;
  let euWith = 0;

  for (let i = 0; i < entry.stepCount; i++) {
    let cap: number;
    try {
      cap = computeCapability(graph, agentId, entry.stepReaches[i]);
    } catch {
      cap = 0.5;
    }
    const stepReward = rewardScale / entry.stepCount;

    if (entry.stepDifficulties[i] >= HARD_STEP_DIFFICULTY_THRESHOLD) {
      euWithout += forecastStepExpectedUtility(cap, entry.stepDifficulties[i], stepReward, undefined, entry.scale);
      euWith += forecastStepExpectedUtility(cap, entry.stepDifficulties[i], stepReward, PUSH_MODIFIER, entry.scale);
    } else {
      const eu = forecastStepExpectedUtility(cap, entry.stepDifficulties[i], stepReward, undefined, entry.scale);
      euWithout += eu;
      euWith += eu;
    }
  }

  // Q cost as utility: losing PUSH_COST_BASE of quintessence
  // Translate to utility scale based on how critical Q is
  const qCostUtility = PUSH_COST_BASE * (1.0 + (1.0 - qRatio));
  const rawBenefit = euWith - euWithout - qCostUtility;

  return {
    recommended: rawBenefit > PUSH_UTILITY_THRESHOLD,
    benefit: Math.max(0, rawBenefit),
  };
}

// ─── Resist Utility ────────────────────────────────────────────────

interface ResistAnalysis {
  valuable: boolean;
  benefit: number;
}

/**
 * Estimate the expected value of having the resist option available.
 *
 * Resist costs RESIST_COST_BASE Q and has RESIST_DOWNGRADE_CHANCE of
 * downgrading critical_failure → failure or failure → success_at_cost.
 *
 * The expected value is:
 * P(failure) × RESIST_DOWNGRADE_CHANCE × (utility_of_downgraded - utility_of_original)
 * minus the Q cost.
 */
function estimateResistValue(
  entry: EncounterCacheEntry,
  agentId: string,
  graph: WorldGraph,
  rewardScale: number,
): ResistAnalysis {
  const noResult: ResistAnalysis = { valuable: false, benefit: 0 };

  // Only resist-eligible templates
  if (!isResistEligible(entry.templateId)) return noResult;

  // Check actor Q state
  const actorNode = graph.getNode(agentId);
  if (!actorNode) return noResult;
  if (!canSpendQuintessence(actorNode, 'resist')) return noResult;

  const qRatio = getQuintessenceRatio(actorNode);
  if (qRatio < Q_CRITICAL_THRESHOLD) return noResult;

  // Compute expected resist benefit across all steps
  let totalBenefit = 0;

  for (let i = 0; i < entry.stepCount; i++) {
    let cap: number;
    try {
      cap = computeCapability(graph, agentId, entry.stepReaches[i]);
    } catch {
      cap = 0.5;
    }

    const probs = forecastStepProbabilities(cap, entry.stepDifficulties[i], undefined, entry.scale);
    const stepReward = rewardScale / entry.stepCount;

    // Resist downgrades: crit_failure → failure, failure → success_at_cost
    // Value of downgrade:
    const critFailDowngradeValue =
      (UTILITY_FAILURE - UTILITY_CRITICAL_FAILURE) * stepReward;
    const failDowngradeValue =
      (UTILITY_SUCCESS_AT_COST - UTILITY_FAILURE) * stepReward;

    const expectedResistValue =
      probs.critFailureProbability * RESIST_DOWNGRADE_CHANCE * critFailDowngradeValue +
      (probs.failureProbability - probs.critFailureProbability) * RESIST_DOWNGRADE_CHANCE * failDowngradeValue;

    totalBenefit += expectedResistValue;
  }

  // Q cost of resist
  const qCostUtility = RESIST_COST_BASE * (1.0 + (1.0 - qRatio));
  const netBenefit = totalBenefit - qCostUtility;

  return {
    valuable: netBenefit > RESIST_UTILITY_THRESHOLD,
    benefit: Math.max(0, netBenefit),
  };
}
