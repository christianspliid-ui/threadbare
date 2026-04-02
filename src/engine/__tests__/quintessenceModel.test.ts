/**
 * Quintessence Model Tests (Phase 2).
 *
 * Covers:
 * - current/max ratio computation
 * - threshold state classification
 * - clamp behavior
 * - spend/resist hooks
 * - encounter failure erosion event creation
 */

import { describe, test, expect } from 'vitest';
import {
  getQuintessenceRatio,
  clampQuintessence,
  getQuintessenceThresholdState,
  QUINTESSENCE_DEFAULT,
  QUINTESSENCE_MAX_DEFAULT,
  QUINTESSENCE_THRESHOLDS,
  QUINTESSENCE_ENCOUNTER_FAILURE_EROSION,
} from '../../types/quintessence';
import {
  canSpendQuintessence,
  spendQuintessence,
  getPushModifier,
  canResistOutcome,
  applyResistOutcome,
  createEncounterFailureErosion,
  PUSH_COST_BASE,
  RESIST_COST_BASE,
  PUSH_MODIFIER,
  MIN_QUINTESSENCE_FOR_SPEND,
} from '../quintessenceActions';

// ─── Helpers ────────────────────────────────────────────────────────

function makeNode(q: number, qMax?: number) {
  return {
    id: 'test-node',
    properties: {
      quintessence: q,
      ...(qMax !== undefined ? { quintessenceMax: qMax } : {}),
    },
  };
}

// ─── getQuintessenceRatio ───────────────────────────────────────────

describe('getQuintessenceRatio', () => {
  test('full quintessence = ratio 1.0', () => {
    expect(getQuintessenceRatio(makeNode(1.0, 1.0))).toBe(1.0);
  });

  test('half quintessence = ratio 0.5', () => {
    expect(getQuintessenceRatio(makeNode(0.5, 1.0))).toBe(0.5);
  });

  test('empty quintessence = ratio 0', () => {
    expect(getQuintessenceRatio(makeNode(0, 1.0))).toBe(0);
  });

  test('custom max: 0.3 / 0.6 = 0.5', () => {
    expect(getQuintessenceRatio(makeNode(0.3, 0.6))).toBeCloseTo(0.5);
  });

  test('missing max defaults to QUINTESSENCE_MAX_DEFAULT', () => {
    const ratio = getQuintessenceRatio(makeNode(0.5));
    expect(ratio).toBe(0.5); // 0.5 / 1.0
  });

  test('missing quintessence defaults to QUINTESSENCE_DEFAULT', () => {
    const node = { id: 'x', properties: {} };
    expect(getQuintessenceRatio(node)).toBe(1.0); // 1.0 / 1.0
  });

  test('zero max returns 0 (fail-soft)', () => {
    expect(getQuintessenceRatio(makeNode(0.5, 0))).toBe(0);
  });
});

// ─── clampQuintessence ──────────────────────────────────────────────

describe('clampQuintessence', () => {
  test('clamps to max', () => {
    expect(clampQuintessence(makeNode(1.5, 1.0))).toBe(1.0);
  });

  test('clamps to 0', () => {
    expect(clampQuintessence(makeNode(-0.5, 1.0))).toBe(0);
  });

  test('passes through valid value', () => {
    expect(clampQuintessence(makeNode(0.5, 1.0))).toBe(0.5);
  });

  test('respects custom max', () => {
    expect(clampQuintessence(makeNode(0.8, 0.6))).toBe(0.6);
  });
});

// ─── getQuintessenceThresholdState ──────────────────────────────────

describe('getQuintessenceThresholdState', () => {
  test('full = healthy', () => {
    expect(getQuintessenceThresholdState(makeNode(1.0, 1.0))).toBe('healthy');
  });

  test('above strained threshold = healthy', () => {
    expect(getQuintessenceThresholdState(makeNode(0.6, 1.0))).toBe('healthy');
  });

  test('at strained boundary = strained', () => {
    // ratio 0.49 < STRAINED (0.50)
    expect(getQuintessenceThresholdState(makeNode(0.49, 1.0))).toBe('strained');
  });

  test('at weakened boundary = weakened', () => {
    // ratio 0.24 < WEAKENED (0.25)
    expect(getQuintessenceThresholdState(makeNode(0.24, 1.0))).toBe('weakened');
  });

  test('at critical boundary = critical', () => {
    // ratio 0.09 < CRITICAL (0.10)
    expect(getQuintessenceThresholdState(makeNode(0.09, 1.0))).toBe('critical');
  });

  test('zero = broken', () => {
    expect(getQuintessenceThresholdState(makeNode(0, 1.0))).toBe('broken');
  });

  test('works with custom max', () => {
    // 0.3 / 0.6 = 0.5 → at strained boundary exactly
    expect(getQuintessenceThresholdState(makeNode(0.3, 0.6))).toBe('healthy');
    // 0.29 / 0.6 = 0.483 < 0.50 → strained
    expect(getQuintessenceThresholdState(makeNode(0.29, 0.6))).toBe('strained');
  });
});

// ─── canSpendQuintessence ───────────────────────────────────────────

describe('canSpendQuintessence', () => {
  test('can push when healthy', () => {
    expect(canSpendQuintessence(makeNode(0.5, 1.0), 'push')).toBe(true);
  });

  test('cannot push when below minimum', () => {
    expect(canSpendQuintessence(makeNode(0.01, 1.0), 'push')).toBe(false);
  });

  test('cannot push when exactly at minimum (at or below)', () => {
    expect(canSpendQuintessence(makeNode(MIN_QUINTESSENCE_FOR_SPEND, 1.0), 'push')).toBe(false);
  });

  test('can resist when has enough', () => {
    expect(canSpendQuintessence(makeNode(0.1, 1.0), 'resist')).toBe(true);
  });

  test('cannot spend when current < cost even if ratio is ok', () => {
    // ratio ok but current less than push cost
    expect(canSpendQuintessence(makeNode(0.03, 0.5), 'push')).toBe(false);
  });
});

// ─── spendQuintessence ──────────────────────────────────────────────

describe('spendQuintessence', () => {
  test('creates negative delta event for push', () => {
    const event = spendQuintessence(makeNode(0.5, 1.0), 'push', 'test', 10);
    expect(event).not.toBeNull();
    expect(event!.delta).toBe(-PUSH_COST_BASE);
    expect(event!.source).toContain('push');
    expect(event!.tick).toBe(10);
  });

  test('returns null when cannot afford', () => {
    const event = spendQuintessence(makeNode(0.01, 1.0), 'push', 'test', 10);
    expect(event).toBeNull();
  });

  test('resist creates smaller cost than push', () => {
    const pushEvent = spendQuintessence(makeNode(0.5, 1.0), 'push', 'test', 10);
    const resistEvent = spendQuintessence(makeNode(0.5, 1.0), 'resist', 'test', 10);
    expect(Math.abs(resistEvent!.delta)).toBeLessThan(Math.abs(pushEvent!.delta));
  });
});

// ─── getPushModifier ────────────────────────────────────────────────

describe('getPushModifier', () => {
  test('returns PUSH_MODIFIER when can afford', () => {
    expect(getPushModifier(makeNode(0.5, 1.0))).toBe(PUSH_MODIFIER);
  });

  test('returns 0 when cannot afford', () => {
    expect(getPushModifier(makeNode(0.01, 1.0))).toBe(0);
  });
});

// ─── Resist ─────────────────────────────────────────────────────────

describe('resist', () => {
  test('canResistOutcome matches canSpendQuintessence for resist', () => {
    expect(canResistOutcome(makeNode(0.5, 1.0))).toBe(true);
    expect(canResistOutcome(makeNode(0.01, 1.0))).toBe(false);
  });

  test('applyResistOutcome creates event', () => {
    const event = applyResistOutcome(makeNode(0.5, 1.0), 'test_encounter', 5);
    expect(event).not.toBeNull();
    expect(event!.delta).toBe(-RESIST_COST_BASE);
  });
});

// ─── Encounter Failure Erosion ──────────────────────────────────────

describe('createEncounterFailureErosion', () => {
  test('creates erosion event with correct values', () => {
    const event = createEncounterFailureErosion('agent-1', 0.03, 42);
    expect(event.targetNodeId).toBe('agent-1');
    expect(event.delta).toBe(-0.03);
    expect(event.source).toBe('encounter_failure');
    expect(event.tick).toBe(42);
  });

  test('always produces negative delta', () => {
    const event = createEncounterFailureErosion('agent-1', 0.03, 1);
    expect(event.delta).toBeLessThan(0);
  });

  test('uses configured erosion amount', () => {
    const event = createEncounterFailureErosion('agent-1', QUINTESSENCE_ENCOUNTER_FAILURE_EROSION, 1);
    expect(event.delta).toBe(-QUINTESSENCE_ENCOUNTER_FAILURE_EROSION);
  });
});
