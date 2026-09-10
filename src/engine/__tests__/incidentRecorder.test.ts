import { describe, it, expect } from 'vitest';

import {
  createIncidentRecorder,
  recordTick,
  getRecordedEvents,
  getRecordedMetrics,
  getIncidentRecorderStats,
} from '../incidentRecorder';
import {
  INCIDENT_EVENT_RING_SIZE,
  INCIDENT_METRICS_RING_SIZE,
} from '../../data/incident-snapshot-constants';
import type { GameState, TickEvent } from '../../types/gameState';

function evt(tick: number, id: string): TickEvent {
  // No cast: `TickEvent`'s required text field is `message`, and a fixture that
  // invented `description` and cast over the gap would compile while describing
  // an event shape the engine never produces.
  return { id, tick, type: 'narrative', message: `event ${id}` };
}

/**
 * The thinnest state the recorder actually reads. Deliberately not a full
 * `GameState`: the recorder's contract is that it touches only these fields, and
 * a fixture that supplied more would hide a widening of that contract.
 */
function stateAt(tick: number, events: TickEvent[]): GameState {
  return {
    tick,
    tickEvents: events,
    recentEvents: events,
    graph: { getStats: () => ({ nodeCount: 10 + tick, edgeCount: 20 + tick }) },
    unifiedActions: [],
    encounterNotifications: [],
    controlEffects: [],
    chronicleEntries: [],
  } as unknown as GameState;
}

describe('incidentRecorder', () => {
  it('keeps events in append order and one census row per tick', () => {
    const rec = createIncidentRecorder();
    recordTick(rec, stateAt(1, [evt(1, 'a'), evt(1, 'b')]));
    recordTick(rec, stateAt(2, [evt(2, 'c')]));

    expect(getRecordedEvents(rec).map(e => e.id)).toEqual(['a', 'b', 'c']);
    const metrics = getRecordedMetrics(rec);
    expect(metrics.map(m => m.tick)).toEqual([1, 2]);
    expect(metrics[1]).toMatchObject({ tick: 2, nodeCount: 12, edgeCount: 22 });
  });

  it('drops the oldest entries once the event ring wraps, keeping the newest', () => {
    const rec = createIncidentRecorder();
    const over = INCIDENT_EVENT_RING_SIZE + 25;
    for (let i = 0; i < over; i++) recordTick(rec, stateAt(i, [evt(i, `e${i}`)]));

    const events = getRecordedEvents(rec);
    expect(events).toHaveLength(INCIDENT_EVENT_RING_SIZE);
    // Oldest-first order survives the wrap, and the tail is the newest event.
    expect(events[0].id).toBe(`e${over - INCIDENT_EVENT_RING_SIZE}`);
    expect(events[events.length - 1].id).toBe(`e${over - 1}`);

    const metrics = getRecordedMetrics(rec);
    expect(metrics).toHaveLength(INCIDENT_METRICS_RING_SIZE);
    expect(metrics[metrics.length - 1].tick).toBe(over - 1);
  });

  /**
   * The fail-soft arm. A census getter that throws must not escape — the tick
   * loop's fourth Non-Functional Priority is that it never crashes — and the miss
   * must be *counted* rather than leaving a gapped ring that reads as complete.
   */
  it('swallows a throwing census, counts the miss, and keeps recording after it', () => {
    const rec = createIncidentRecorder();
    const exploding = {
      tick: 5,
      tickEvents: [evt(5, 'boom')],
      get graph(): never {
        throw new Error('half-built state');
      },
    } as unknown as GameState;

    expect(() => recordTick(rec, exploding)).not.toThrow();
    expect(getIncidentRecorderStats(rec).misses).toBe(1);
    expect(getRecordedMetrics(rec)).toHaveLength(0);

    // Falsifies the guard rather than confirming it: a recorder that had been
    // left in a broken state by the throw would fail here, not above.
    recordTick(rec, stateAt(6, [evt(6, 'after')]));
    expect(getRecordedMetrics(rec).map(m => m.tick)).toEqual([6]);
    expect(getIncidentRecorderStats(rec).misses).toBe(1);
  });

  it('reports written totals past the ring size, so eviction is visible', () => {
    const rec = createIncidentRecorder();
    const over = INCIDENT_METRICS_RING_SIZE + 10;
    for (let i = 0; i < over; i++) recordTick(rec, stateAt(i, []));

    const stats = getIncidentRecorderStats(rec);
    expect(stats.metrics).toBe(INCIDENT_METRICS_RING_SIZE);
    expect(stats.metricsWritten).toBe(over);
  });
});
