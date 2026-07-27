/**
 * Resolution Service Tests (Phase 2).
 *
 * Covers:
 * - threshold computation from inputs
 * - doubles-based crit classification (replaces flat roll >= 96)
 * - forecast/live agreement
 * - edge cases (very low/high capability, NaN, extremes)
 * - crit frequency scaling with competence
 * - outcome helpers
 */

import { describe, test, expect } from 'vitest';
import {
  computeResolutionThreshold,
  classifyResolutionRoll,
  forecastAction,
  resolveAction,
  computeOutcomeProbabilities,
  isSuccessOutcome,
  isFailureOutcome,
  PROBABILITY_FLOOR,
  PROBABILITY_CEILING,
} from '../resolutionService';
import type { ResolutionInput } from '../../types/resolution';

// ─── Helpers ────────────────────────────────────────────────────────

function makeInput(overrides: Partial<ResolutionInput> = {}): ResolutionInput {
  return {
    actorId: 'test-actor',
    domain: 'iron',
    capability: 0.5,
    difficulty: 0.5,
    sphereFactor: 0,
    actionModifiers: 0,
    ...overrides,
  };
}

// ─── Threshold Computation ──────────────────────────────────────────

describe('computeResolutionThreshold', () => {
  test('capability == difficulty → P near floor (no other bonuses)', () => {
    // 0.5 + 0 - 0.5 + 0 + 0 = 0.0 → clamped to floor
    const p = computeResolutionThreshold(makeInput({ capability: 0.5, difficulty: 0.5 }));
    expect(p).toBeCloseTo(PROBABILITY_FLOOR, 2);
  });

  test('high capability, low difficulty → high probability', () => {
    const p = computeResolutionThreshold(makeInput({ capability: 0.8, difficulty: 0.1 }));
    // 0.8 - 0.1 = 0.7
    expect(p).toBeCloseTo(0.7, 2);
  });

  test('low capability, high difficulty → floor', () => {
    const p = computeResolutionThreshold(makeInput({ capability: 0.1, difficulty: 0.9 }));
    // 0.1 - 0.9 = -0.8 → clamped to floor
    expect(p).toBe(PROBABILITY_FLOOR);
  });

  test('sphere factor and modifiers contribute', () => {
    const p = computeResolutionThreshold(makeInput({
      capability: 0.5,
      difficulty: 0.3,
      sphereFactor: 0.1,
      actionModifiers: 0.1,
    }));
    // 0.5 + 0.1 - 0.3 + 0.1 = 0.4
    expect(p).toBeCloseTo(0.4, 2);
  });

  test('influence nudge contributes', () => {
    const p = computeResolutionThreshold(makeInput({
      capability: 0.6,
      difficulty: 0.3,
      influenceNudge: 0.1,
    }));
    // 0.6 - 0.3 + 0.1 = 0.4
    expect(p).toBeCloseTo(0.4, 2);
  });

  test('ceiling clamp at 0.95', () => {
    const p = computeResolutionThreshold(makeInput({ capability: 1.0, difficulty: 0.0 }));
    expect(p).toBe(PROBABILITY_CEILING);
  });

  test('floor clamp at 0.05', () => {
    const p = computeResolutionThreshold(makeInput({ capability: 0.0, difficulty: 1.0 }));
    expect(p).toBe(PROBABILITY_FLOOR);
  });

  test('NaN input → floor (fail-soft)', () => {
    const p = computeResolutionThreshold(makeInput({ capability: NaN }));
    expect(p).toBe(PROBABILITY_FLOOR);
  });
});

// ─── Roll Classification (Doubles-Based Crits) ─────────────────────

describe('classifyResolutionRoll', () => {
  test('non-doubles success', () => {
    const b = classifyResolutionRoll(0.7, 50);
    expect(b.threshold).toBe(70);
    expect(b.isDoubles).toBe(false);
    expect(b.critClassification).toBe('none');
    expect(b.roll).toBe(50);
    expect(b.margin).toBe(-20); // 50 - 70
  });

  test('non-doubles failure', () => {
    const b = classifyResolutionRoll(0.3, 50);
    expect(b.threshold).toBe(30);
    expect(b.isDoubles).toBe(false);
    expect(b.critClassification).toBe('none');
    expect(b.margin).toBe(20); // 50 - 30
  });

  test('doubles under threshold = critical success', () => {
    const b = classifyResolutionRoll(0.5, 33);
    expect(b.isDoubles).toBe(true);
    expect(b.critClassification).toBe('critical_success');
  });

  test('doubles over threshold = critical failure', () => {
    const b = classifyResolutionRoll(0.3, 44);
    expect(b.isDoubles).toBe(true);
    expect(b.critClassification).toBe('critical_failure');
  });

  test('doubles exactly at threshold = critical success (at or under)', () => {
    // threshold = 55, roll = 55
    const b = classifyResolutionRoll(0.55, 55);
    expect(b.isDoubles).toBe(true);
    expect(b.critClassification).toBe('critical_success');
  });

  test('roll 100 is never doubles', () => {
    const b = classifyResolutionRoll(0.5, 100);
    expect(b.isDoubles).toBe(false);
    expect(b.critClassification).toBe('none');
  });

  test('roll 1 is not doubles', () => {
    const b = classifyResolutionRoll(0.5, 1);
    expect(b.isDoubles).toBe(false);
  });

  test('roll 11 is doubles', () => {
    const b = classifyResolutionRoll(0.5, 11);
    expect(b.isDoubles).toBe(true);
    expect(b.critClassification).toBe('critical_success'); // 11 <= 50
  });

  test('near miss detection', () => {
    const b = classifyResolutionRoll(0.5, 53);
    expect(b.nearMiss).toBe(true);
    expect(b.margin).toBe(3);
  });

  test('not near miss when far from threshold', () => {
    const b = classifyResolutionRoll(0.5, 80);
    expect(b.nearMiss).toBe(false);
  });
});

// ─── Crit Frequency Scales With Competence ──────────────────────────

describe('crit frequency scaling', () => {
  test('high competence actor has more crit successes than crit failures', () => {
    const probs = computeOutcomeProbabilities(makeInput({ capability: 0.9, difficulty: 0.1 }));
    // threshold ~80 → doubles 11,22,33,44,55,66,77 under → 7 crit successes
    // doubles 88,99 over → 2 crit failures
    expect(probs.critSuccessProbability).toBeGreaterThan(probs.critFailureProbability);
  });

  test('low competence actor has more crit failures than crit successes', () => {
    const probs = computeOutcomeProbabilities(makeInput({ capability: 0.2, difficulty: 0.8 }));
    // threshold ~5 → no doubles under threshold → 0 crit successes
    // all 9 doubles over → 9 crit failures
    expect(probs.critFailureProbability).toBeGreaterThan(probs.critSuccessProbability);
  });

  test('no fixed 5% catastrophic-failure tail for skilled actors', () => {
    const probs = computeOutcomeProbabilities(makeInput({ capability: 0.95, difficulty: 0.05 }));
    // Old system: flat 5% crit fail (roll >= 96)
    // New system: only doubles over threshold are crit fails
    // threshold ~85 → doubles 88,99 over → 2% crit fail
    expect(probs.critFailureProbability).toBeLessThan(0.05);
  });

  test('total probability sums to ~1.0', () => {
    const probs = computeOutcomeProbabilities(makeInput({ capability: 0.6, difficulty: 0.2 }));
    const total = probs.successProbability + probs.failureProbability;
    expect(total).toBeCloseTo(1.0, 2);
  });
});

// ─── Forecast/Live Parity ───────────────────────────────────────────

describe('forecast/live parity', () => {
  test('forecast probability matches live threshold', () => {
    const input = makeInput({ capability: 0.7, difficulty: 0.3 });
    const forecast = forecastAction(input);
    const threshold = computeResolutionThreshold(input);
    expect(forecast.threshold).toBe(Math.floor(threshold * 100));
  });

  test('forecast success probability matches threshold/100', () => {
    const input = makeInput({ capability: 0.65, difficulty: 0.2 });
    const forecast = forecastAction(input);
    expect(forecast.successProbability).toBeCloseTo(forecast.threshold / 100, 2);
  });

  test('deterministic roll produces expected outcome', () => {
    const input = makeInput({ capability: 0.8, difficulty: 0.2 });
    const rng = () => 0; // will produce roll = 1
    const result = resolveAction(input, rng);
    // Roll 1 is always under threshold → success (not doubles, so plain success)
    expect(result.outcome).toBe('success');
    expect(result.roll).toBe(1);
  });

  test('deterministic high roll produces failure', () => {
    const input = makeInput({ capability: 0.3, difficulty: 0.7 });
    const result = resolveAction(input, () => 0.5, 80);
    // Roll 80, threshold ~5 → failure
    expect(isFailureOutcome(result.outcome)).toBe(true);
  });

  test('forecast tier matches live result forecast tier', () => {
    const input = makeInput({ capability: 0.7, difficulty: 0.2 });
    const forecast = forecastAction(input);
    const result = resolveAction(input, () => 0.1);
    expect(result.forecast.forecastTier).toBe(forecast.forecastTier);
  });
});

describe('test shapers', () => {
  test('upgrade a near-miss failure by one outcome step', () => {
    const input = makeInput({
      capability: 0.5,
      difficulty: 0.0,
      testShapers: [
        {
          sourceAttachmentId: 'artifact.duelist_token',
          sourceAttachmentName: "Duelist's Luck Token",
          trigger: 'near_miss',
          steps: 1,
          maxMargin: 8,
        },
      ],
    });

    const result = resolveAction(input, () => 0, 53);
    expect(result.outcome).toBe('success_at_cost');
    expect(result.appliedShaper).toMatchObject({
      sourceAttachmentId: 'artifact.duelist_token',
      outcomeBefore: 'failure',
      outcomeAfter: 'success_at_cost',
      steps: 1,
    });
  });

  test('do not apply a shaper when the miss exceeds its max margin', () => {
    const input = makeInput({
      capability: 0.5,
      difficulty: 0.0,
      testShapers: [
        {
          sourceAttachmentId: 'artifact.duelist_token',
          sourceAttachmentName: "Duelist's Luck Token",
          trigger: 'near_miss',
          steps: 1,
          maxMargin: 2,
        },
      ],
    });

    const result = resolveAction(input, () => 0, 53);
    expect(result.outcome).toBe('failure');
    expect(result.appliedShaper).toBeUndefined();
  });
});

// ─── Outcome Helpers ────────────────────────────────────────────────

describe('outcome helpers', () => {
  test('isSuccessOutcome', () => {
    expect(isSuccessOutcome('critical_success')).toBe(true);
    expect(isSuccessOutcome('success')).toBe(true);
    expect(isSuccessOutcome('success_at_cost')).toBe(true);
    expect(isSuccessOutcome('failure')).toBe(false);
    expect(isSuccessOutcome('critical_failure')).toBe(false);
  });

  test('isFailureOutcome', () => {
    expect(isFailureOutcome('failure')).toBe(true);
    expect(isFailureOutcome('critical_failure')).toBe(true);
    expect(isFailureOutcome('success')).toBe(false);
    expect(isFailureOutcome('success_at_cost')).toBe(false);
  });
});

// ─── resolveAction ──────────────────────────────────────────────────

describe('resolveAction', () => {
  test('returns rollBreakdown with structured data', () => {
    const input = makeInput({ capability: 0.7, difficulty: 0.2 });
    const result = resolveAction(input, () => 0.3, undefined, 'unified_action');
    expect(result.rollBreakdown).toBeDefined();
    expect(result.rollBreakdown!.threshold).toBeGreaterThan(0);
    expect(result.sourceSystem).toBe('unified_action');
  });

  test('deterministic roll override works', () => {
    const input = makeInput({ capability: 0.7, difficulty: 0.2 });
    const result = resolveAction(input, () => 0.99, 33);
    expect(result.roll).toBe(33);
    expect(result.rollBreakdown!.isDoubles).toBe(true);
  });

  test('doubles roll under threshold = critical_success', () => {
    const input = makeInput({ capability: 0.8, difficulty: 0.1 });
    // threshold = 70, roll 22 → doubles under → crit success
    const result = resolveAction(input, () => 0, 22);
    expect(result.outcome).toBe('critical_success');
  });

  test('doubles roll over threshold = critical_failure', () => {
    const input = makeInput({ capability: 0.2, difficulty: 0.7 });
    // threshold = 5, roll 66 → doubles over → crit failure
    const result = resolveAction(input, () => 0, 66);
    expect(result.outcome).toBe('critical_failure');
  });

  test('non-doubles over threshold = plain failure', () => {
    const input = makeInput({ capability: 0.3, difficulty: 0.6 });
    // threshold = 5, roll 70 → not doubles, over → failure
    const result = resolveAction(input, () => 0, 70);
    expect(result.outcome).toBe('failure');
  });
});

// ─── Edge Cases ─────────────────────────────────────────────────────

describe('edge cases', () => {
  test('very low capability still produces valid result', () => {
    const input = makeInput({ capability: 0.01, difficulty: 0.99 });
    const result = resolveAction(input, () => 0.5);
    expect(result.probability).toBe(PROBABILITY_FLOOR);
    expect(result.roll).toBeGreaterThanOrEqual(1);
    expect(result.roll).toBeLessThanOrEqual(100);
  });

  test('very high capability still produces valid result', () => {
    const input = makeInput({ capability: 1.0, difficulty: 0.0 });
    const result = resolveAction(input, () => 0.5);
    expect(result.probability).toBe(PROBABILITY_CEILING);
  });

  test('extreme modifiers are handled', () => {
    const input = makeInput({
      capability: 0.5,
      difficulty: 0.5,
      actionModifiers: 0.5,
      sphereFactor: 0.3,
    });
    const p = computeResolutionThreshold(input);
    expect(p).toBeLessThanOrEqual(PROBABILITY_CEILING);
    expect(p).toBeGreaterThanOrEqual(PROBABILITY_FLOOR);
  });

  // THR-827 — `actionModifiers` carried a "capped at ±0.20" note that no caller
  // ever enforced. The verdict was that the note was stale, so these pin the
  // contract that actually holds: the term passes through untouched at any
  // magnitude and in both signs, and only the *sum* meets the clamp. Written as
  // exact equalities so a future clamp cannot be added silently — it would have
  // to come here and change the number, which is the point.
  describe('actionModifiers is not clamped (THR-827)', () => {
    test('a modifier far above the retired ±0.20 passes through in full', () => {
      const base = { capability: 0.5, difficulty: 0.5, sphereFactor: 0 };
      // 0.5 + 0 - 0.5 + 0.30 = 0.30. A ±0.20 clamp would have yielded 0.20.
      expect(computeResolutionThreshold(makeInput({ ...base, actionModifiers: 0.30 }))).toBeCloseTo(0.30, 10);
      // 0.5 + 0 - 0.5 + 0.80 = 0.80, still inside the ceiling — so the ceiling
      // is not what is doing the work here.
      expect(computeResolutionThreshold(makeInput({ ...base, actionModifiers: 0.80 }))).toBeCloseTo(0.80, 10);
    });

    test('the negative sign is equally unclamped', () => {
      // 0.9 + 0 - 0.1 - 0.50 = 0.30. A ±0.20 clamp would have yielded 0.60.
      const p = computeResolutionThreshold(
        makeInput({ capability: 0.9, difficulty: 0.1, sphereFactor: 0, actionModifiers: -0.50 }),
      );
      expect(p).toBeCloseTo(0.30, 10);
    });

    test('only the summed result meets the clamp', () => {
      const ceiling = computeResolutionThreshold(
        makeInput({ capability: 0.5, difficulty: 0.5, sphereFactor: 0, actionModifiers: 5 }),
      );
      expect(ceiling).toBe(PROBABILITY_CEILING);

      const floor = computeResolutionThreshold(
        makeInput({ capability: 0.5, difficulty: 0.5, sphereFactor: 0, actionModifiers: -5 }),
      );
      expect(floor).toBe(PROBABILITY_FLOOR);
    });
  });
});
