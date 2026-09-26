// THR-1582 (forecast window S4) — the fit a mortal's forecast earns a candidate.
import { describe, it, expect } from 'vitest';
import {
  computeEngagementFit,
  computeSetbackShift,
  countConsecutiveFailures,
  isFailedOutcome,
} from '../engagementWindow';
import {
  ENGAGE_WINDOW_LOW,
  ENGAGE_WINDOW_HIGH,
  ENGAGE_PERSONALITY_SHIFT,
  ENGAGE_REFUSE_BELOW,
  ENGAGE_BELOW_FIT_MIN,
  ENGAGE_TOO_EASY_AT,
  ENGAGE_TOO_EASY_FIT,
  SETBACK_WINDOW_SHIFT,
  SETBACK_WINDOW_SHIFT_MAX,
} from '../../data/agent-behavior-constants';
import type { UnifiedAction } from '../../types/unifiedAction';

describe('computeEngagementFit — zones', () => {
  it('is 1 inside the window, at both edges', () => {
    for (const f of [ENGAGE_WINDOW_LOW, (ENGAGE_WINDOW_LOW + ENGAGE_WINDOW_HIGH) / 2, ENGAGE_WINDOW_HIGH]) {
      const r = computeEngagementFit(f, 0, 0);
      expect(r.zone).toBe('in');
      expect(r.fit).toBe(1);
    }
  });

  it('refuses below ENGAGE_REFUSE_BELOW', () => {
    const r = computeEngagementFit(ENGAGE_REFUSE_BELOW - 0.01, 0, 0);
    expect(r.zone).toBe('refused');
    expect(r.fit).toBe(0);
  });

  it('ramps from ENGAGE_BELOW_FIT_MIN at the refuse edge up to 1 at the window', () => {
    expect(computeEngagementFit(ENGAGE_REFUSE_BELOW, 0, 0).fit).toBeCloseTo(ENGAGE_BELOW_FIT_MIN, 10);
    const mid = computeEngagementFit((ENGAGE_REFUSE_BELOW + ENGAGE_WINDOW_LOW) / 2, 0, 0);
    expect(mid.zone).toBe('below');
    expect(mid.fit).toBeCloseTo((1 + ENGAGE_BELOW_FIT_MIN) / 2, 10);
  });

  it('discounts challenges beneath the mortal down to ENGAGE_TOO_EASY_FIT, flat after', () => {
    const mid = computeEngagementFit((ENGAGE_WINDOW_HIGH + ENGAGE_TOO_EASY_AT) / 2, 0, 0);
    expect(mid.zone).toBe('above');
    expect(mid.fit).toBeCloseTo((1 + ENGAGE_TOO_EASY_FIT) / 2, 10);
    expect(computeEngagementFit(ENGAGE_TOO_EASY_AT, 0, 0).fit).toBeCloseTo(ENGAGE_TOO_EASY_FIT, 10);
    expect(computeEngagementFit(0.99, 0, 0).fit).toBeCloseTo(ENGAGE_TOO_EASY_FIT, 10);
  });

  it('exemptTooEasy keeps a trivial branching quest at fit 1 — but it is still refused below the edge', () => {
    expect(computeEngagementFit(0.95, 0, 0, { exemptTooEasy: true }).fit).toBe(1);
    expect(computeEngagementFit(0.1, 0, 0, { exemptTooEasy: true }).fit).toBe(0);
  });

  it('fails soft on a NaN forecast (fit 1, in) and clamps out-of-range forecasts', () => {
    expect(computeEngagementFit(NaN, 0, 0)).toMatchObject({ fit: 1, zone: 'in' });
    expect(computeEngagementFit(1.7, 0, 0).fit).toBeCloseTo(ENGAGE_TOO_EASY_FIT, 10);
    expect(computeEngagementFit(-0.3, 0, 0).zone).toBe('refused');
  });
});

describe('computeEngagementFit — the window moves', () => {
  it('a bold mortal accepts longer odds, a cautious one wants better (personality shift, both ways)', () => {
    const bold = computeEngagementFit(0.5, 1, 0);
    const cautious = computeEngagementFit(0.5, -1, 0);
    expect(bold.windowLow).toBeCloseTo(ENGAGE_WINDOW_LOW - ENGAGE_PERSONALITY_SHIFT, 10);
    expect(cautious.windowLow).toBeCloseTo(ENGAGE_WINDOW_LOW + ENGAGE_PERSONALITY_SHIFT, 10);
    // 0.47 is in the bold mortal's window and below the cautious one's.
    expect(computeEngagementFit(0.47, 1, 0).zone).toBe('in');
    expect(computeEngagementFit(0.47, -1, 0).zone).toBe('below');
    // 0.68 is too easy for the bold mortal and just right for the cautious one.
    expect(computeEngagementFit(0.68, 1, 0).zone).toBe('above');
    expect(computeEngagementFit(0.68, -1, 0).zone).toBe('in');
  });

  it('a NaN lean reads 0 — no shift', () => {
    expect(computeEngagementFit(0.5, NaN, 0).windowLow).toBeCloseTo(ENGAGE_WINDOW_LOW, 10);
  });

  it('the setback shift grows per consecutive failure and caps', () => {
    expect(computeSetbackShift(0)).toBe(0);
    expect(computeSetbackShift(1)).toBeCloseTo(SETBACK_WINDOW_SHIFT, 10);
    expect(computeSetbackShift(2)).toBeCloseTo(2 * SETBACK_WINDOW_SHIFT, 10);
    expect(computeSetbackShift(50)).toBeCloseTo(SETBACK_WINDOW_SHIFT_MAX, 10);
    expect(computeSetbackShift(-3)).toBe(0);
    expect(computeSetbackShift(NaN)).toBe(0);
    // After a run of failures a mortal looks for something it can win: an even
    // challenge that was in its window now reads below it.
    expect(computeEngagementFit(0.52, 0, 0).zone).toBe('in');
    expect(computeEngagementFit(0.52, 0, 3).zone).toBe('below');
    expect(computeEngagementFit(0.75, 0, 3).zone).toBe('in');
  });
});

function action(partial: Partial<UnifiedAction> & { actionId: string }): UnifiedAction {
  return {
    actorId: 'a1',
    templateId: 'enc.x',
    startTick: 0,
    resolved: true,
    ...partial,
  } as unknown as UnifiedAction;
}

describe('countConsecutiveFailures', () => {
  const always = () => true;

  it('counts failures back to the last success-family outcome, most recent first', () => {
    const actions = [
      action({ actionId: '1', outcome: 'success', completedAtTick: 1 }),
      action({ actionId: '2', outcome: 'failure', completedAtTick: 2 }),
      action({ actionId: '3', outcome: 'critical_failure', completedAtTick: 3 }),
      action({ actionId: '4', outcome: 'failure', completedAtTick: 4 }),
    ];
    expect(countConsecutiveFailures(actions, 'a1', always)).toBe(3);
  });

  it('resets on success_at_cost, ignores other mortals, unresolved and filtered actions', () => {
    const actions = [
      action({ actionId: '1', outcome: 'failure', completedAtTick: 1 }),
      action({ actionId: '2', outcome: 'success_at_cost', completedAtTick: 2 }),
      action({ actionId: '3', outcome: 'failure', completedAtTick: 3 }),
      action({ actionId: '4', outcome: 'failure', completedAtTick: 4, actorId: 'other' }),
      action({ actionId: '5', outcome: 'failure', completedAtTick: 5, resolved: false }),
      action({ actionId: '6', outcome: 'failure', completedAtTick: 6, templateId: 'divine.y' }),
    ];
    expect(countConsecutiveFailures(actions, 'a1', id => id.startsWith('enc.'))).toBe(1);
  });

  it('reads 0 with no history (fail-soft)', () => {
    expect(countConsecutiveFailures([], 'a1', always)).toBe(0);
  });

  it('classifies failure outcomes for the failure cooldown', () => {
    expect(isFailedOutcome('failure')).toBe(true);
    expect(isFailedOutcome('critical_failure')).toBe(true);
    expect(isFailedOutcome('contested_lost')).toBe(true);
    expect(isFailedOutcome('success_at_cost')).toBe(false);
    expect(isFailedOutcome(undefined)).toBe(false);
  });
});
