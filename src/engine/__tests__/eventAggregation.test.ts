import { describe, it, expect, vi } from 'vitest';
import { aggregateColocationEvents, EVENT_AGGREGATE_MIN_GROUP_SIZE } from '../eventAggregation';
import type { TickEvent } from '../../types/gameState';

function makeEvent(id: string, col: number, row: number, tick = 1): TickEvent {
  return {
    id,
    tick,
    type: 'agent_encounter',
    message: `encounter ${id}`,
    significance: 0.5,
    actorId: `actor_${id}`,
    hexCoords: { col, row },
  } as unknown as TickEvent;
}

function seededRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('aggregateColocationEvents', () => {
  it('returns early (same reference) when there are no encounter events', () => {
    const events = [
      { id: 'ne1', tick: 1, type: 'faction_change', message: 'x', significance: 0.1 } as unknown as TickEvent,
      { id: 'ne2', tick: 1, type: 'faction_change', message: 'y', significance: 0.2 } as unknown as TickEvent,
    ];
    const result = aggregateColocationEvents(events, seededRng(42), 1, () => null);
    expect(result).toBe(events); // same reference — fast path
  });

  it('returns equivalent content when groups are below minimum size', () => {
    const events = [
      makeEvent('a', 1, 1),
      makeEvent('b', 2, 2),
    ];
    const result = aggregateColocationEvents(events, seededRng(42), 1, () => null);
    expect(result).toStrictEqual(events);
  });

  it('collapses a group of minimum size into one synthesised event', () => {
    const group = Array.from({ length: EVENT_AGGREGATE_MIN_GROUP_SIZE }, (_, i) =>
      makeEvent(`e${i}`, 3, 3),
    );
    const result = aggregateColocationEvents(group, seededRng(42), 1, () => 'Crossroads');
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('agent_encounter');
    expect(result[0].aggregatedFromIds).toHaveLength(EVENT_AGGREGATE_MIN_GROUP_SIZE);
  });

  it('groups with fewer than MIN_GROUP_SIZE pass through unchanged', () => {
    const small = [makeEvent('x', 5, 5), makeEvent('y', 5, 5)]; // 2 < 3
    const big = Array.from({ length: EVENT_AGGREGATE_MIN_GROUP_SIZE }, (_, i) =>
      makeEvent(`g${i}`, 6, 6),
    );
    const result = aggregateColocationEvents([...small, ...big], seededRng(7), 1, () => null);
    // small group should pass through (2 events), big group collapses to 1
    expect(result).toHaveLength(3);
  });

  it('non-encounter events always pass through', () => {
    const nonEncounter: TickEvent = {
      id: 'ne1', tick: 1, type: 'faction_change', message: 'change', significance: 0.3,
    } as unknown as TickEvent;
    const group = Array.from({ length: EVENT_AGGREGATE_MIN_GROUP_SIZE }, (_, i) =>
      makeEvent(`e${i}`, 1, 1),
    );
    const result = aggregateColocationEvents([nonEncounter, ...group], seededRng(42), 1, () => null);
    expect(result.some(e => e.id === 'ne1')).toBe(true);
  });

  it('is deterministic — same seed produces same phrase', () => {
    const group = Array.from({ length: 5 }, (_, i) => makeEvent(`e${i}`, 2, 2));
    const r1 = aggregateColocationEvents(group, seededRng(99), 5, () => 'Ford');
    const r2 = aggregateColocationEvents(group, seededRng(99), 5, () => 'Ford');
    expect(r1[0].message).toBe(r2[0].message);
  });

  it('returns input unchanged and does not throw on error', () => {
    const events = Array.from({ length: 4 }, (_, i) => makeEvent(`e${i}`, 0, 0));
    const badRng = () => { throw new Error('rng boom'); };
    const result = aggregateColocationEvents(events, badRng, 1, () => 'X');
    expect(result).toBe(events); // fail-soft: original returned on error
  });

  it('synthesised event has significance at least as high as the max member', () => {
    const events = [
      { ...makeEvent('a', 7, 7), significance: 0.2 },
      { ...makeEvent('b', 7, 7), significance: 0.9 },
      { ...makeEvent('c', 7, 7), significance: 0.4 },
    ] as unknown as TickEvent[];
    const result = aggregateColocationEvents(events, seededRng(1), 1, () => 'Peak');
    expect(result[0].significance).toBeGreaterThanOrEqual(0.9);
  });
});
