/**
 * THR-2170 — the faction sheet's loyalty trend word reads a smoothed trend with a dead
 * band, so a loyalty seesawing around flat does not flip "falling" ↔ "holds steady"
 * from one day to the next (warm playtest round 3, the veteran).
 */
import { describe, it, expect } from 'vitest';
import { nextLoyaltyTrend } from '../loyaltyTrend';
import { trendClause } from '../fealtySentences';
import type { LoyaltyDelta, SwornToEdgeProperties } from '../types';

function oathAfter(days: LoyaltyDelta[][]): SwornToEdgeProperties {
  let trend: number | undefined;
  for (const day of days) trend = nextLoyaltyTrend(trend, day.reduce((s, d) => s + d.amount, 0));
  return {
    kind: 'persuaded', taxShare: 0.1, loyalty: 0.6, swornTick: 0, giftPaid: 0,
    lastLoyaltyDay: { tick: days.length * 12, deltas: days[days.length - 1] ?? [] },
    loyaltyTrend: trend,
    recentLosses: [], taxPaidTotal: 0, taxPaidToday: 0, lastPassTick: days.length * 12,
  };
}

// The liege's means wobbling across a band edge: rich one day, cannot pay the next.
const up: LoyaltyDelta = { reason: 'liege_wealthy', amount: 0.01 };
const down: LoyaltyDelta = { reason: 'liege_destitute', amount: -0.01 };

describe('loyalty trend (THR-2170)', () => {
  it('a series oscillating around flat reads "holds steady" every day', () => {
    const days: LoyaltyDelta[][] = [];
    for (let d = 0; d < 40; d++) {
      days.push([d % 2 === 0 ? up : down]);
      expect(trendClause(oathAfter(days))).toBe('and its loyalty holds steady');
    }
  });

  it('a small noisy jitter around flat also holds steady', () => {
    const jitter = [0.004, -0.006, 0.005, -0.003, 0.006, -0.005, 0.002, -0.004];
    const days: LoyaltyDelta[][] = [];
    for (let d = 0; d < 32; d++) {
      const amount = jitter[d % jitter.length];
      days.push([{ reason: amount > 0 ? 'liege_wealthy' : 'liege_strained', amount }]);
      expect(trendClause(oathAfter(days))).toBe('and its loyalty holds steady');
    }
  });

  it('a sustained fall still reads "falling", with today\'s reason', () => {
    const days = Array.from({ length: 6 }, () => [{ reason: 'liege_destitute', amount: -0.01 } as LoyaltyDelta]);
    expect(trendClause(oathAfter(days))).toBe('and its loyalty is falling because its liege cannot pay its soldiers');
  });

  it('a lost holding reads "falling" the same day', () => {
    const days: LoyaltyDelta[][] = [[], [], [{ reason: 'holding_lost', amount: -0.15 }]];
    expect(trendClause(oathAfter(days))).toMatch(/^and its loyalty is falling because it lost a town/);
  });

  it('an oath with no trend yet falls back to today\'s sum', () => {
    const props = oathAfter([[{ reason: 'liege_wealthy', amount: 0.01 }]]);
    delete props.loyaltyTrend;
    expect(trendClause(props)).toBe('and its loyalty is rising because its liege is rich');
  });
});
