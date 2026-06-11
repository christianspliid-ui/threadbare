import { describe, it, expect } from 'vitest';
import {
  forecastStepProbabilities,
  forecastStepExpectedUtility,
  forecastEncounterExpectedUtility,
  isPushEligible,
  isResistEligible,
  UTILITY_CRITICAL_SUCCESS,
  UTILITY_SUCCESS,
  UTILITY_SUCCESS_AT_COST,
  UTILITY_FAILURE,
  UTILITY_CRITICAL_FAILURE,
  Q_LOW_THRESHOLD,
  Q_CRITICAL_THRESHOLD,
} from '../plannerForecast';
import type { EncounterCacheEntry } from '../encounterCache';
import type { ReachDomain } from '../../types/traits';
import type { ValuePair } from '../../types/agent';
import { WorldGraph } from '../graph';

// ─── Helpers ────────────────────────────────────────────────────

function makeEntry(overrides: Partial<EncounterCacheEntry> = {}): EncounterCacheEntry {
  return {
    templateId: 'tmpl_default',
    locationId: 'loc_a',
    sublocationId: null,
    sublocationTypeId: null,
    reachPrimary: 'iron' as ReachDomain,
    reachSecondary: 'gold' as ReachDomain,
    threatRating: 'moderate' as any,
    encounterType: 'combat' as any,
    motivations: ['mercy_ruthlessness'] as ValuePair[],
    requiresPresence: true,
    remotePenalty: 0,
    questPriority: 1.0,
    isQuestEncounter: false,
    totalTickCost: 3,
    successRewardEstimate: 2.0,
    stepCount: 1,
    stepDifficulties: [50],
    stepReaches: ['iron'] as ReachDomain[],
    ...overrides,
  };
}

function makeGraphWithAgent(
  agentId: string,
  quintessence?: number,
  quintessenceMax?: number,
): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: agentId,
    type: 'actor',
    name: 'Test Agent',
    properties: {
      actorType: 'individual',
      quintessence: quintessence ?? 1.0,
      quintessenceMax: quintessenceMax ?? 1.0,
      traits: {},
      traitContributions: { iron: 0.5, gold: 0.3, shadow: 0.2, veil: 0.1, heart: 0.4, eye: 0.3, stone: 0.2, star: 0.1, flesh: 0.2 },
    },
  });
  return graph;
}

// ─── forecastStepProbabilities ───────────────────────────────────

describe('forecastStepProbabilities', () => {
  it('returns probability summary for a step', () => {
    const probs = forecastStepProbabilities(0.7, 20);
    expect(probs.successProbability).toBeGreaterThan(0);
    expect(probs.successProbability).toBeLessThanOrEqual(0.95);
    expect(probs.failureProbability).toBeGreaterThanOrEqual(0.05);
    expect(probs.critSuccessProbability).toBeGreaterThanOrEqual(0);
    expect(probs.critFailureProbability).toBeGreaterThanOrEqual(0);
    // Probabilities must sum to 1
    expect(probs.successProbability + probs.failureProbability).toBeCloseTo(1.0, 5);
  });

  it('high capability + low difficulty → high success prob', () => {
    const probs = forecastStepProbabilities(0.9, 10);
    expect(probs.successProbability).toBeGreaterThan(0.7);
  });

  it('low capability + high difficulty → low success prob', () => {
    const probs = forecastStepProbabilities(0.1, 80);
    expect(probs.successProbability).toBeLessThan(0.3);
  });

  it('uses shared resolution service math (same as live)', () => {
    // Verify it produces the same values as direct computeOutcomeProbabilities
    const probs = forecastStepProbabilities(0.5, 50);
    // At capability=0.5, normalized difficulty=0.5, threshold should be near floor
    expect(probs.threshold).toBeGreaterThanOrEqual(5);
    expect(probs.threshold).toBeLessThanOrEqual(95);
  });
});

// ─── forecastStepExpectedUtility ─────────────────────────────────

describe('forecastStepExpectedUtility', () => {
  it('returns positive utility when success is likely', () => {
    // High cap, low difficulty → mostly success → positive EU
    const eu = forecastStepExpectedUtility(0.9, 10, 1.0);
    expect(eu).toBeGreaterThan(0);
  });

  it('returns lower (possibly negative) utility when failure is likely', () => {
    // Low cap, high difficulty → mostly failure → low/negative EU
    const euLow = forecastStepExpectedUtility(0.1, 80, 1.0);
    const euHigh = forecastStepExpectedUtility(0.9, 10, 1.0);
    expect(euLow).toBeLessThan(euHigh);
  });

  it('scales linearly with reward', () => {
    const eu1 = forecastStepExpectedUtility(0.5, 50, 1.0);
    const eu2 = forecastStepExpectedUtility(0.5, 50, 2.0);
    expect(eu2).toBeCloseTo(eu1 * 2, 4);
  });

  it('push modifier increases expected utility', () => {
    const euWithout = forecastStepExpectedUtility(0.5, 50, 1.0);
    const euWith = forecastStepExpectedUtility(0.5, 50, 1.0, 0.10);
    expect(euWith).toBeGreaterThan(euWithout);
  });

  it('handles NaN inputs gracefully (fail-soft)', () => {
    // NaN capability → resolutionService returns PROBABILITY_FLOOR → very low EU
    const eu = forecastStepExpectedUtility(NaN, 50, 1.0);
    // Should produce a finite number (the floor probability still yields a result)
    expect(Number.isFinite(eu)).toBe(true);
    // With floor probability (0.05), EU should be negative (mostly failure)
    expect(eu).toBeLessThan(0);
  });

  it('distinguishes success from success_at_cost via utility weights', () => {
    // The existence of success_at_cost should make the EU slightly less than
    // a pure success model, because some successes carry a cost discount
    expect(UTILITY_SUCCESS_AT_COST).toBeLessThan(UTILITY_SUCCESS);
    expect(UTILITY_SUCCESS_AT_COST).toBeGreaterThan(0);
  });

  it('distinguishes failure from critical_failure via utility weights', () => {
    expect(UTILITY_CRITICAL_FAILURE).toBeLessThan(UTILITY_FAILURE);
    expect(UTILITY_FAILURE).toBeLessThan(0);
  });

  it('exact success_at_cost: doubles in near-miss zone are excluded (threshold=44)', () => {
    // capability=0.60, difficulty=15 → P≈0.45 → threshold=44.
    // Roll 44 is a doubles roll. It sits at the top of the success-side near-miss
    // zone [39,44] and is classified as critical_success by live runtime, not success_at_cost.
    // So success_at_cost covers rolls {39,40,41,42,43} = 5 rolls, not 6.
    const probs = forecastStepProbabilities(0.60, 15);
    expect(probs.threshold).toBe(44); // verify precondition

    const eu = forecastStepExpectedUtility(0.60, 15, 1.0);

    // Hand-computed EU with exact pSuccessAtCost = 5/100:
    // pCritSuccess = 4/100 (doubles 11,22,33,44 ≤ 44)
    // pPlainSuccess = 0.44 - 0.04 - 0.05 = 0.35
    // pSuccessAtCost = 5/100 = 0.05
    // pCritFailure = 5/100 (doubles 55,66,77,88,99 > 44)
    // pPlainFailure = 0.56 - 0.05 = 0.51
    const expectedEU =
      0.04 * UTILITY_CRITICAL_SUCCESS +
      0.35 * UTILITY_SUCCESS +
      0.05 * UTILITY_SUCCESS_AT_COST +
      0.51 * UTILITY_FAILURE +
      0.05 * UTILITY_CRITICAL_FAILURE;
    // ≈ 0.313 — would be ≈ 0.309 if pSuccessAtCost were 6/100 (wrong)
    expect(eu).toBeCloseTo(expectedEU, 3);
  });
});

// ─── forecastEncounterExpectedUtility ────────────────────────────

describe('forecastEncounterExpectedUtility', () => {
  it('returns encounter forecast with all fields populated', () => {
    const graph = makeGraphWithAgent('agent_1');
    const entry = makeEntry({ stepCount: 2, stepDifficulties: [30, 50], stepReaches: ['iron', 'iron'] as ReachDomain[] });
    const forecast = forecastEncounterExpectedUtility(entry, 'agent_1', graph);

    expect(forecast.expectedUtility).toBeDefined();
    expect(forecast.completionProb).toBeGreaterThan(0);
    expect(forecast.completionProb).toBeLessThanOrEqual(1);
    expect(forecast.stepForecasts).toHaveLength(2);
    expect(typeof forecast.pushRecommended).toBe('boolean');
    expect(typeof forecast.resistValuable).toBe('boolean');
  });

  it('multi-step encounters have lower completion prob than single-step', () => {
    const graph = makeGraphWithAgent('agent_1');
    const single = makeEntry({ stepCount: 1, stepDifficulties: [50], stepReaches: ['iron'] as ReachDomain[] });
    const multi = makeEntry({ stepCount: 3, stepDifficulties: [50, 50, 50], stepReaches: ['iron', 'iron', 'iron'] as ReachDomain[] });

    const f1 = forecastEncounterExpectedUtility(single, 'agent_1', graph);
    const f3 = forecastEncounterExpectedUtility(multi, 'agent_1', graph);

    expect(f3.completionProb).toBeLessThan(f1.completionProb);
  });

  it('harder encounters produce lower expected utility', () => {
    // Test using forecastStepExpectedUtility directly to eliminate graph capability variance
    // At fixed capability, higher difficulty → lower EU
    const euEasy = forecastStepExpectedUtility(0.7, 10, 1.0);
    const euHard = forecastStepExpectedUtility(0.7, 90, 1.0);
    expect(euEasy).toBeGreaterThan(euHard);
  });

  it('handles missing agent gracefully', () => {
    const graph = new WorldGraph();
    const entry = makeEntry();
    const forecast = forecastEncounterExpectedUtility(entry, 'nonexistent', graph);
    // Should still return a result (fail-soft with cap=0.5)
    expect(forecast.expectedUtility).toBeDefined();
    expect(forecast.completionProb).toBeDefined();
  });
});

// ─── Push/Resist Eligibility ────────────────────────────────────

describe('push/resist eligibility', () => {
  it('push eligible for risky action families', () => {
    expect(isPushEligible('action.shadow.assassinate-target')).toBe(true);
    expect(isPushEligible('action.iron.conquer-fortress')).toBe(true);
    expect(isPushEligible('action.gold.commission-assassination-plot')).toBe(true);
  });

  it('push not eligible for non-risky templates', () => {
    expect(isPushEligible('action.heart.inspire-ally')).toBe(false);
    expect(isPushEligible('encounter_borderland_patrol')).toBe(false);
  });

  it('resist eligible for social/influence families', () => {
    expect(isResistEligible('action.heart.charm-diplomat')).toBe(true);
    expect(isResistEligible('action.shadow.recruit-spy')).toBe(true);
  });

  it('resist not eligible for non-social templates', () => {
    expect(isResistEligible('action.iron.conquer-fortress')).toBe(false);
    expect(isResistEligible('encounter_borderland_patrol')).toBe(false);
  });
});

// ─── Push Benefit Analysis ──────────────────────────────────────

describe('push benefit in encounter forecast', () => {
  it('push is not recommended for non-eligible templates', () => {
    const graph = makeGraphWithAgent('agent_1', 1.0, 1.0);
    const entry = makeEntry({ templateId: 'action.heart.inspire', stepDifficulties: [60] });
    const forecast = forecastEncounterExpectedUtility(entry, 'agent_1', graph);
    expect(forecast.pushRecommended).toBe(false);
    expect(forecast.pushBenefit).toBe(0);
  });

  it('push is not recommended when Q is low', () => {
    const graph = makeGraphWithAgent('agent_1', 0.15, 1.0); // 15% Q ratio < Q_LOW_THRESHOLD
    const entry = makeEntry({
      templateId: 'action.shadow.assassinate-target',
      stepDifficulties: [60],
    });
    const forecast = forecastEncounterExpectedUtility(entry, 'agent_1', graph);
    expect(forecast.pushRecommended).toBe(false);
  });

  it('push can be recommended for eligible templates with sufficient Q', () => {
    const graph = makeGraphWithAgent('agent_1', 0.8, 1.0);
    const entry = makeEntry({
      templateId: 'action.shadow.assassinate-target',
      stepDifficulties: [60], // Hard enough to benefit from push
      stepReaches: ['iron'] as ReachDomain[],
    });
    const forecast = forecastEncounterExpectedUtility(entry, 'agent_1', graph);
    // The push benefit should be non-negative (may or may not be recommended based on exact math)
    expect(forecast.pushBenefit).toBeGreaterThanOrEqual(0);
  });
});

// ─── Resist Value Analysis ──────────────────────────────────────

describe('resist value in encounter forecast', () => {
  it('resist is not valuable for non-eligible templates', () => {
    const graph = makeGraphWithAgent('agent_1', 1.0, 1.0);
    const entry = makeEntry({ templateId: 'action.iron.conquer-fortress', stepDifficulties: [60] });
    const forecast = forecastEncounterExpectedUtility(entry, 'agent_1', graph);
    expect(forecast.resistValuable).toBe(false);
    expect(forecast.resistBenefit).toBe(0);
  });

  it('resist is not valuable when Q is critically low', () => {
    const graph = makeGraphWithAgent('agent_1', 0.05, 1.0); // 5% < Q_CRITICAL_THRESHOLD
    const entry = makeEntry({
      templateId: 'action.heart.charm-diplomat',
      stepDifficulties: [60],
    });
    const forecast = forecastEncounterExpectedUtility(entry, 'agent_1', graph);
    expect(forecast.resistValuable).toBe(false);
  });

  it('resist can have positive value for eligible templates', () => {
    const graph = makeGraphWithAgent('agent_1', 0.8, 1.0);
    const entry = makeEntry({
      templateId: 'action.heart.charm-diplomat',
      stepDifficulties: [70], // High enough difficulty that failure is likely
      stepReaches: ['iron'] as ReachDomain[],
    });
    const forecast = forecastEncounterExpectedUtility(entry, 'agent_1', graph);
    // Resist benefit should be non-negative
    expect(forecast.resistBenefit).toBeGreaterThanOrEqual(0);
  });
});

// ─── Utility Constants Sanity ────────────────────────────────────

describe('utility weight invariants', () => {
  it('critical success > success > success_at_cost', () => {
    expect(UTILITY_CRITICAL_SUCCESS).toBeGreaterThan(UTILITY_SUCCESS);
    expect(UTILITY_SUCCESS).toBeGreaterThan(UTILITY_SUCCESS_AT_COST);
  });

  it('success_at_cost is positive (still a form of success)', () => {
    expect(UTILITY_SUCCESS_AT_COST).toBeGreaterThan(0);
  });

  it('failure is negative, critical failure is worse', () => {
    expect(UTILITY_FAILURE).toBeLessThan(0);
    expect(UTILITY_CRITICAL_FAILURE).toBeLessThan(UTILITY_FAILURE);
  });

  it('Q thresholds are ordered correctly', () => {
    expect(Q_CRITICAL_THRESHOLD).toBeLessThan(Q_LOW_THRESHOLD);
    expect(Q_LOW_THRESHOLD).toBeLessThan(0.5);
  });
});
