import { describe, it, expect } from 'vitest';
import { filterEventsByVisibility } from '../notificationVisibilityFilter';
import type { TickEvent } from '../../types/gameState';
import type { VisibilityMap } from '../../types/visibility';

function makeEvent(overrides: Partial<TickEvent> = {}): TickEvent {
  return {
    id: 'evt_1',
    tick: 1,
    type: 'agent_action_resolved',
    message: 'Test event',
    significance: 0.5,
    ...overrides,
  };
}

function makeVisMap(entries: [string, 'visible' | 'remembered' | 'unexplored'][]): VisibilityMap {
  const map: VisibilityMap = new Map();
  for (const [key, state] of entries) {
    map.set(key, { state });
  }
  return map;
}

describe('filterEventsByVisibility', () => {
  it('passes through events without hexCoords (global events)', () => {
    const events = [makeEvent({ type: 'doom_escalation' })];
    const result = filterEventsByVisibility(events, new Map());
    expect(result).toHaveLength(1);
  });

  it('passes through events in visible hexes', () => {
    const events = [makeEvent({ hexCoords: { col: 3, row: 5 } })];
    const visMap = makeVisMap([['3,5', 'visible']]);
    const result = filterEventsByVisibility(events, visMap);
    expect(result).toHaveLength(1);
  });

  it('filters out events in remembered hexes', () => {
    const events = [makeEvent({ hexCoords: { col: 3, row: 5 } })];
    const visMap = makeVisMap([['3,5', 'remembered']]);
    const result = filterEventsByVisibility(events, visMap);
    expect(result).toHaveLength(0);
  });

  it('filters out events in unexplored hexes', () => {
    const events = [makeEvent({ hexCoords: { col: 3, row: 5 } })];
    const visMap = makeVisMap([['3,5', 'unexplored']]);
    const result = filterEventsByVisibility(events, visMap);
    expect(result).toHaveLength(0);
  });

  it('filters out events in hexes not in the visibility map at all', () => {
    const events = [makeEvent({ hexCoords: { col: 99, row: 99 } })];
    const result = filterEventsByVisibility(events, new Map());
    expect(result).toHaveLength(0);
  });

  it('handles mixed global and spatial events', () => {
    const events = [
      makeEvent({ id: 'global', type: 'doom_escalation' }),
      makeEvent({ id: 'visible', hexCoords: { col: 1, row: 1 } }),
      makeEvent({ id: 'hidden', hexCoords: { col: 2, row: 2 } }),
    ];
    const visMap = makeVisMap([['1,1', 'visible'], ['2,2', 'remembered']]);
    const result = filterEventsByVisibility(events, visMap);
    expect(result.map(e => e.id)).toEqual(['global', 'visible']);
  });
});
