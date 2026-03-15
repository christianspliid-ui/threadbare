import { describe, it, expect } from 'vitest';
import { filterEventsByVisibility } from '../notificationVisibilityFilter';
import { routeNotifications } from '../notificationRouter';
import type { TickEvent } from '../../types/gameState';
import type { VisibilityMap } from '../../types/visibility';

describe('notification visibility integration', () => {
  it('spatial events in visible hexes produce notifications', () => {
    const events: TickEvent[] = [{
      id: 'evt_1', tick: 1, type: 'agent_action_resolved',
      message: 'Agent acts', significance: 0.5,
      hexCoords: { col: 3, row: 5 },
      notification: { channel: 'toast' },
    }];
    const visMap: VisibilityMap = new Map([['3,5', { state: 'visible' }]]);
    const filtered = filterEventsByVisibility(events, visMap);
    const result = routeNotifications(filtered, { toasts: [], alerts: [], popupQueue: [] }, Date.now());
    expect(result.toasts).toHaveLength(1);
  });

  it('spatial events in non-visible hexes produce no notifications', () => {
    const events: TickEvent[] = [{
      id: 'evt_1', tick: 1, type: 'agent_action_resolved',
      message: 'Agent acts', significance: 0.5,
      hexCoords: { col: 3, row: 5 },
      notification: { channel: 'toast' },
    }];
    const visMap: VisibilityMap = new Map([['3,5', { state: 'remembered' }]]);
    const filtered = filterEventsByVisibility(events, visMap);
    const result = routeNotifications(filtered, { toasts: [], alerts: [], popupQueue: [] }, Date.now());
    expect(result.toasts).toHaveLength(0);
  });

  it('global events (no hexCoords) always produce notifications', () => {
    const events: TickEvent[] = [{
      id: 'evt_1', tick: 1, type: 'doom_escalation',
      message: 'Doom approaches', significance: 0.9,
      notification: { channel: 'popup', popup: { title: 'Doom', body: 'It comes' } },
    }];
    const visMap: VisibilityMap = new Map();
    const filtered = filterEventsByVisibility(events, visMap);
    const result = routeNotifications(filtered, { toasts: [], alerts: [], popupQueue: [] }, Date.now());
    expect(result.popupQueue).toHaveLength(1);
  });

  it('mixed events are correctly partitioned', () => {
    const events: TickEvent[] = [
      { id: 'global', tick: 1, type: 'doom_escalation', message: 'Doom', significance: 0.9,
        notification: { channel: 'popup', popup: { title: 'Doom', body: 'Doom' } } },
      { id: 'visible', tick: 1, type: 'agent_movement', message: 'Moves', significance: 0.3,
        hexCoords: { col: 1, row: 1 }, notification: { channel: 'toast' } },
      { id: 'hidden', tick: 1, type: 'agent_movement', message: 'Moves too', significance: 0.3,
        hexCoords: { col: 9, row: 9 }, notification: { channel: 'toast' } },
    ];
    const visMap: VisibilityMap = new Map([['1,1', { state: 'visible' }]]);
    const filtered = filterEventsByVisibility(events, visMap);
    expect(filtered).toHaveLength(2);
    const result = routeNotifications(filtered, { toasts: [], alerts: [], popupQueue: [] }, Date.now());
    expect(result.popupQueue).toHaveLength(1);
    expect(result.toasts).toHaveLength(1);
  });
});
