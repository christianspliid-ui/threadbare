/**
 * The moment queue — THR-1299 slice 2.
 *
 * The properties a later slice could break silently: the cap (a queue that grows
 * without bound in a headless run), the eviction preference (dropping an unseen
 * moment while an acknowledged one lingers), idempotency on id (two phases merge
 * into one field in the same tick), and the trace per transition — which is what
 * the interface map's eventual LIVE claim rests on.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { enableTracing, disableTracing, getTraces, clearTraces } from '../traceBuffer';
import type { UndertakingMomentRecord } from '../../types/strategicAction';
import { MOMENT_QUEUE_MAX } from '../../data/strategic-action-constants';
import {
  acknowledgeUndertakingMoment,
  enqueueUndertakingMoments,
  getPendingUndertakingMoments,
  markUndertakingMomentOpened,
  nextInterruptMoment,
} from '../undertakingMoments';

function record(n: number, overrides: Partial<UndertakingMomentRecord> = {}): UndertakingMomentRecord {
  return {
    id: `m_${n}`,
    projectId: `proj_${n}`,
    actorId: 'actor_1',
    templateId: 'strategic_build_warehouse',
    momentClass: 'at_cost',
    presentation: 'badge',
    tick: n,
    label: `moment ${n}`,
    undertakingName: 'Build Warehouse',
    acknowledged: false,
    ...overrides,
  };
}

function surfaceTraces(): Array<Record<string, unknown>> {
  return getTraces().filter(t => t.category === 'moment_surface') as unknown as Array<Record<string, unknown>>;
}

describe('enqueueUndertakingMoments', () => {
  beforeEach(() => { clearTraces(); enableTracing(); });
  afterEach(() => { disableTracing(); clearTraces(); });

  it('appends in emission order and traces one queued row per record', () => {
    const queue = enqueueUndertakingMoments(undefined, [record(1), record(2)], 5);
    expect(queue.map(r => r.id)).toEqual(['m_1', 'm_2']);
    expect(surfaceTraces().map(t => t.event)).toEqual(['queued', 'queued']);
  });

  it('returns the same array when there is nothing to add — no state churn', () => {
    const existing = enqueueUndertakingMoments(undefined, [record(1)], 5);
    expect(enqueueUndertakingMoments(existing, [], 6)).toBe(existing);
  });

  it('is idempotent on id — a record re-delivered by a second phase does not double-queue', () => {
    const first = enqueueUndertakingMoments(undefined, [record(1)], 5);
    const second = enqueueUndertakingMoments(first, [record(1)], 5);
    expect(second.length).toBe(1);
    expect(surfaceTraces().filter(t => t.event === 'queued').length).toBe(1);
  });

  it('holds the cap by dropping the oldest, and traces the drop', () => {
    const many = Array.from({ length: MOMENT_QUEUE_MAX + 2 }, (_, i) => record(i + 1));
    const queue = enqueueUndertakingMoments(undefined, many, 5);

    expect(queue.length).toBe(MOMENT_QUEUE_MAX);
    expect(queue[0].id).toBe('m_3');
    expect(queue[queue.length - 1].id).toBe(`m_${MOMENT_QUEUE_MAX + 2}`);
    const dropped = surfaceTraces().filter(t => t.event === 'dropped');
    expect(dropped.map(t => t.projectId)).toEqual(['proj_1', 'proj_2']);
  });

  it('evicts an acknowledged record before an unseen one, and does not trace that as a drop', () => {
    // The falsifier for plain FIFO: with `m_1` unseen and `m_3` acknowledged, plain
    // oldest-first would drop `m_1` — the one the player never saw.
    const base = Array.from({ length: MOMENT_QUEUE_MAX }, (_, i) => record(i + 1));
    let queue = enqueueUndertakingMoments(undefined, base, 5);
    queue = acknowledgeUndertakingMoment(queue, 'm_3', 6);
    clearTraces();

    queue = enqueueUndertakingMoments(queue, [record(99)], 7);

    expect(queue.length).toBe(MOMENT_QUEUE_MAX);
    expect(queue.some(r => r.id === 'm_1')).toBe(true);
    expect(queue.some(r => r.id === 'm_3')).toBe(false);
    expect(surfaceTraces().filter(t => t.event === 'dropped')).toEqual([]);
  });
});

describe('acknowledgeUndertakingMoment', () => {
  beforeEach(() => { clearTraces(); enableTracing(); });
  afterEach(() => { disableTracing(); clearTraces(); });

  it('flags the record, keeps it in the queue, and traces once', () => {
    const queue = enqueueUndertakingMoments(undefined, [record(1), record(2)], 5);
    const acked = acknowledgeUndertakingMoment(queue, 'm_1', 6);

    expect(acked.length).toBe(2);
    expect(acked[0].acknowledged).toBe(true);
    expect(acked[1].acknowledged).toBe(false);
    // Input untouched — phases return patches.
    expect(queue[0].acknowledged).toBe(false);
    expect(surfaceTraces().filter(t => t.event === 'acknowledged').length).toBe(1);
  });

  it('is a no-op on an unknown id or a second dismiss', () => {
    const queue = enqueueUndertakingMoments(undefined, [record(1)], 5);
    expect(acknowledgeUndertakingMoment(queue, 'nope', 6)).toBe(queue);
    const once = acknowledgeUndertakingMoment(queue, 'm_1', 6);
    expect(acknowledgeUndertakingMoment(once, 'm_1', 7)).toBe(once);
    expect(surfaceTraces().filter(t => t.event === 'acknowledged').length).toBe(1);
  });

  it('opened is telemetry only', () => {
    const r = record(1);
    markUndertakingMomentOpened(r, 5);
    expect(r.acknowledged).toBe(false);
    expect(surfaceTraces().map(t => t.event)).toEqual(['opened']);
  });
});

describe('reads', () => {
  it('nextInterruptMoment returns the OLDEST unacknowledged interrupt, or null', () => {
    const queue = [
      record(1, { presentation: 'badge' }),
      record(2, { presentation: 'interrupt', acknowledged: true }),
      record(3, { presentation: 'interrupt' }),
      record(4, { presentation: 'interrupt' }),
    ];
    expect(nextInterruptMoment(queue)?.id).toBe('m_3');
    expect(nextInterruptMoment([record(1)])).toBeNull();
    expect(nextInterruptMoment(undefined)).toBeNull();
  });

  it('getPendingUndertakingMoments narrows to one actor and tolerates an absent field', () => {
    const queue = [record(1), record(2, { actorId: 'actor_2' })];
    expect(getPendingUndertakingMoments({ pendingUndertakingMoments: queue }).length).toBe(2);
    expect(getPendingUndertakingMoments({ pendingUndertakingMoments: queue }, 'actor_2').map(r => r.id)).toEqual(['m_2']);
    expect(getPendingUndertakingMoments({})).toEqual([]);
  });
});
