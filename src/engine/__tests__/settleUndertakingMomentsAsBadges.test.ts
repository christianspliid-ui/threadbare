/**
 * THR-1744 — the warm start's end-of-warm-up settle.
 *
 * The properties the warm start relies on: only interrupt-tier, unacknowledged
 * records raised at or after the start tick are re-tiered; they stay
 * unacknowledged, so the thread-row badge and "The Arc So Far" still count them;
 * and nothing they re-tier pops as a moment card afterwards.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import type { UndertakingMomentRecord } from '../../types/strategicAction';
import { nextInterruptMoment, settleUndertakingMomentsAsBadges } from '../undertakingMoments';
import { isMomentBadgeable } from '../../components/Game/momentBadgeModel';
import { getAgentArc } from '../agentArc';

function record(n: number, overrides: Partial<UndertakingMomentRecord> = {}): UndertakingMomentRecord {
  return {
    id: `m_${n}`,
    projectId: `proj_${n}`,
    actorId: 'kael',
    templateId: 'strategic_build_warehouse',
    momentClass: 'at_cost',
    presentation: 'interrupt',
    tick: n,
    label: `moment ${n}`,
    undertakingName: 'Build Warehouse',
    acknowledged: false,
    ...overrides,
  };
}

describe('settleUndertakingMomentsAsBadges', () => {
  it('re-tiers unacknowledged interrupt records at or after sinceTick, leaving them unacknowledged', () => {
    const queue = [record(10), record(20), record(30)];
    const settled = settleUndertakingMomentsAsBadges(queue, 20);
    expect(settled.map(r => r.presentation)).toEqual(['interrupt', 'badge', 'badge']);
    expect(settled.every(r => !r.acknowledged)).toBe(true);
    // Earlier record untouched — same object.
    expect(settled[0]).toBe(queue[0]);
  });

  it('leaves acknowledged and badge-tier records unchanged', () => {
    const acked = record(25, { acknowledged: true });
    const badge = record(26, { presentation: 'badge' });
    const queue = [acked, badge];
    const settled = settleUndertakingMomentsAsBadges(queue, 0);
    expect(settled).toBe(queue);
  });

  it('returns the same array when nothing changes, and [] for undefined', () => {
    const queue = [record(5)];
    expect(settleUndertakingMomentsAsBadges(queue, 10)).toBe(queue);
    expect(settleUndertakingMomentsAsBadges(undefined, 0)).toEqual([]);
  });

  it('settled records no longer pop, but still badge and appear in the arc', () => {
    const queue = settleUndertakingMomentsAsBadges([record(100), record(110)], 0);
    expect(nextInterruptMoment(queue)).toBeNull();
    expect(queue.every(r => isMomentBadgeable(r, 120))).toBe(true);
    const arc = getAgentArc(
      { strategicState: undefined, pendingUndertakingMoments: queue, tick: 120 } as never,
      new WorldGraph(),
      'kael',
    );
    expect(arc.filter(e => e.kind === 'moment').map(e => e.id)).toEqual(['moment_m_100', 'moment_m_110']);
  });
});
