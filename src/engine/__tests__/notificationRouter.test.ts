import { describe, it, expect } from 'vitest';
import type { TickEvent } from '../../types/gameState';
import type { NotificationState } from '../../types/notification';
import { TOAST_MAX_VISIBLE, ALERT_SAFETY_CAP } from '../../types/notification';
import { routeNotifications, eventTypeToCategory, ALERT_KEEP_TICKS, trimAlerts } from '../notificationRouter';

function makeEvent(overrides: Partial<TickEvent> & { id: string; tick: number }): TickEvent {
  return {
    type: 'agent_action_resolved',
    message: 'Something happened.',
    significance: 0.5,
    ...overrides,
  };
}

const EMPTY_STATE: NotificationState = {
  toasts: [],
  alerts: [],
  popupQueue: [],
  // THR-666 — the router always returns this slice, so the "unchanged state"
  // comparison needs it present on the way in too.
  entityNotices: [],
};

const NOW = 1000;

describe('routeNotifications', () => {
  it('returns unchanged state when no events have notifications', () => {
    const events: TickEvent[] = [
      makeEvent({ id: 'e1', tick: 1 }),
      makeEvent({ id: 'e2', tick: 1 }),
    ];
    const result = routeNotifications(events, EMPTY_STATE, NOW);
    expect(result).toEqual(EMPTY_STATE);
  });

  it('routes toast events to toasts array', () => {
    const events: TickEvent[] = [
      makeEvent({
        id: 'e1',
        tick: 1,
        message: 'A village was founded.',
        sphere: 'Hearth',
        notification: { channel: 'toast' },
      }),
    ];
    const result = routeNotifications(events, EMPTY_STATE, NOW);
    expect(result.toasts).toHaveLength(1);
    expect(result.toasts[0]).toMatchObject({
      message: 'A village was founded.',
      sphere: 'Hearth',
      count: 1,
    });
  });

  it('collapses duplicate toast messages within same tick', () => {
    const events: TickEvent[] = [
      makeEvent({
        id: 'e1',
        tick: 1,
        message: 'Gained essence.',
        notification: { channel: 'toast' },
      }),
      makeEvent({
        id: 'e2',
        tick: 1,
        message: 'Gained essence.',
        notification: { channel: 'toast' },
      }),
      makeEvent({
        id: 'e3',
        tick: 1,
        message: 'Gained essence.',
        notification: { channel: 'toast' },
      }),
    ];
    const result = routeNotifications(events, EMPTY_STATE, NOW);
    expect(result.toasts).toHaveLength(1);
    expect(result.toasts[0].count).toBe(3);
  });

  it('caps toasts at TOAST_MAX_VISIBLE, dropping oldest', () => {
    const events: TickEvent[] = Array.from({ length: TOAST_MAX_VISIBLE + 2 }, (_, i) =>
      makeEvent({
        id: `e${i}`,
        tick: 1,
        message: `Toast ${i}`,
        notification: { channel: 'toast' },
      }),
    );
    const result = routeNotifications(events, EMPTY_STATE, NOW);
    expect(result.toasts).toHaveLength(TOAST_MAX_VISIBLE);
    // Should keep the latest ones (dropped oldest)
    expect(result.toasts[result.toasts.length - 1].message).toBe(
      `Toast ${TOAST_MAX_VISIBLE + 1}`,
    );
  });

  it('routes alert events to alerts array', () => {
    const events: TickEvent[] = [
      makeEvent({
        id: 'e1',
        tick: 1,
        message: 'A doom clock advances.',
        notification: { channel: 'alert', icon: 'doom' },
      }),
    ];
    const result = routeNotifications(events, EMPTY_STATE, NOW);
    expect(result.alerts).toHaveLength(1);
    expect(result.alerts[0]).toMatchObject({
      icon: 'doom',
      sourceEventId: 'e1',
    });
  });

  // THR-1875 (frame plan § F5): same-kind, same-tick alerts are all kept — the old
  // overwrite was a silent drop. Only an exact repeat of one event is dropped.
  it('keeps every same-icon alert in one tick, dropping only a repeated sourceEventId', () => {
    const events: TickEvent[] = [
      makeEvent({
        id: 'e1',
        tick: 5,
        message: 'First doom warning.',
        notification: { channel: 'alert', icon: 'doom' },
      }),
      makeEvent({
        id: 'e2',
        tick: 5,
        message: 'Second doom warning.',
        notification: { channel: 'alert', icon: 'doom' },
      }),
    ];
    events.push(makeEvent({ id: 'e3', tick: 5, message: 'Third doom warning.', notification: { channel: 'alert', icon: 'doom' } }));
    const first = routeNotifications(events, EMPTY_STATE, NOW);
    expect(first.alerts.map(a => a.message)).toEqual(['First doom warning.', 'Second doom warning.', 'Third doom warning.']);
    // The same event routed again is kept once.
    const again = routeNotifications([events[1]], first, NOW);
    expect(again.alerts).toHaveLength(3);
  });

  it('routes popup events to popupQueue', () => {
    const events: TickEvent[] = [
      makeEvent({
        id: 'e1',
        tick: 1,
        sphere: 'Lore',
        notification: {
          channel: 'popup',
          popup: {
            title: 'A Discovery!',
            body: 'You found something interesting.',
          },
        },
      }),
    ];
    const result = routeNotifications(events, EMPTY_STATE, NOW);
    expect(result.popupQueue).toHaveLength(1);
    expect(result.popupQueue[0]).toMatchObject({
      title: 'A Discovery!',
      body: 'You found something interesting.',
      sourceEventId: 'e1',
    });
  });

  it('appends popups FIFO to existing queue', () => {
    const existingState: NotificationState = {
      ...EMPTY_STATE,
      popupQueue: [
        {
          id: 'old1',
          title: 'Old popup',
          body: 'Still waiting.',
          sourceEventId: 'old1',
          tick: 0,
        },
      ],
    };
    const events: TickEvent[] = [
      makeEvent({
        id: 'e1',
        tick: 1,
        notification: {
          channel: 'popup',
          popup: { title: 'New popup', body: 'Fresh.' },
        },
      }),
    ];
    const result = routeNotifications(events, existingState, NOW);
    expect(result.popupQueue).toHaveLength(2);
    expect(result.popupQueue[0].title).toBe('Old popup');
    expect(result.popupQueue[1].title).toBe('New popup');
  });

  it('preserves existing alerts from prior state', () => {
    const existingState: NotificationState = {
      ...EMPTY_STATE,
      alerts: [
        {
          id: 'old-alert',
          icon: 'mandate',
          message: 'Prior alert.',
          sourceEventId: 'old-alert',
          tick: 0,
        },
      ],
    };
    const events: TickEvent[] = [
      makeEvent({
        id: 'e1',
        tick: 1,
        message: 'New alert.',
        notification: { channel: 'alert', icon: 'discovery' },
      }),
    ];
    const result = routeNotifications(events, existingState, NOW);
    expect(result.alerts).toHaveLength(2);
    expect(result.alerts[0].message).toBe('Prior alert.');
    expect(result.alerts[1].message).toBe('New alert.');
  });

  // THR-1875: the channel trims by age, and a safety cap counts what it drops.
  it('lapses alerts older than ALERT_KEEP_TICKS', () => {
    const old = makeEvent({ id: 'old', tick: 10, message: 'Old news.', notification: { channel: 'alert', icon: 'discovery' } });
    const kept = routeNotifications([old], EMPTY_STATE, NOW);
    expect(kept.alerts).toHaveLength(1);
    const late = makeEvent({ id: 'late', tick: 10 + ALERT_KEEP_TICKS, message: 'New news.', notification: { channel: 'alert', icon: 'discovery' } });
    const after = routeNotifications([late], kept, NOW);
    expect(after.alerts.map(a => a.id)).toEqual(['late']);
  });

  it('counts alerts trimmed at ALERT_SAFETY_CAP (101 inside the window → 1)', () => {
    const events: TickEvent[] = Array.from({ length: ALERT_SAFETY_CAP + 1 }, (_, i) =>
      makeEvent({ id: `e${i}`, tick: 1, message: `Alert ${i}`, notification: { channel: 'alert', icon: 'discovery' } }),
    );
    const result = routeNotifications(events, EMPTY_STATE, NOW);
    expect(result.alerts).toHaveLength(ALERT_SAFETY_CAP);
    expect(result.alertsTrimmedAtCap).toBe(1);
    expect(result.alerts[result.alerts.length - 1].message).toBe(`Alert ${ALERT_SAFETY_CAP}`);
    expect(trimAlerts(result.alerts, 1).trimmedAtCap).toBe(0);
  });

  // THR-562 — the "becoming" personality beat surfaces as a lifecycle toast.
  it('routes a personality_trait_emerged toast into the toasts array under the lifecycle category', () => {
    expect(eventTypeToCategory('personality_trait_emerged')).toBe('lifecycle');

    const events: TickEvent[] = [
      makeEvent({
        id: 'p1',
        tick: 3,
        type: 'personality_trait_emerged',
        message: 'Kael has become Greedy.',
        actorId: 'kael',
        notification: { channel: 'toast' },
      }),
    ];
    const result = routeNotifications(events, EMPTY_STATE, NOW);
    expect(result.toasts).toHaveLength(1);
    expect(result.toasts[0]).toMatchObject({
      message: 'Kael has become Greedy.',
      actorId: 'kael',
      navigationTarget: { kind: 'agent', agentId: 'kael' },
    });
  });
});

describe('routeNotifications — toast bursts (THR-2194, Law 49)', () => {
  const GROUP = { key: 'notable_agenda_crack', headline: "{count} rulers' agendas come due" };
  const crack = (id: string, tick: number, message: string) =>
    makeEvent({ id, tick, type: 'rival_action', message, notification: { channel: 'toast', group: GROUP } });

  it('folds same-kind toasts in one batch into one toast with a count and the member list', () => {
    const result = routeNotifications(
      [crack('c1', 5, 'A comes due.'), crack('c2', 5, 'B comes due.'), crack('c3', 5, 'C comes due.')],
      EMPTY_STATE, NOW,
    );
    expect(result.toasts).toHaveLength(1);
    expect(result.toasts[0]).toMatchObject({ id: 'c1', count: 3, message: "Three rulers' agendas come due", groupKey: GROUP.key });
    expect(result.toasts[0].groupMembers?.map(m => m.message)).toEqual(['A comes due.', 'B comes due.', 'C comes due.']);
  });

  it('folds into a still-showing toast of the kind from an earlier batch, without mutating it', () => {
    const first = routeNotifications([crack('c1', 5, 'A comes due.')], EMPTY_STATE, NOW);
    const before = first.toasts[0];
    const second = routeNotifications([crack('c2', 6, 'B comes due.')], first, NOW + 1000);
    expect(second.toasts).toHaveLength(1);
    expect(second.toasts[0]).toMatchObject({ id: 'c1', count: 2, message: "Two rulers' agendas come due" });
    expect(second.toasts[0].expiresAt).toBeGreaterThan(before.expiresAt);
    expect(before).toMatchObject({ count: 1, message: 'A comes due.' });
    expect(before.groupMembers).toHaveLength(1);
  });

  it('starts a fresh toast once the earlier one of the kind has expired', () => {
    const first = routeNotifications([crack('c1', 5, 'A comes due.')], EMPTY_STATE, NOW);
    const later = first.toasts[0].expiresAt + 1;
    const second = routeNotifications([crack('c2', 9, 'B comes due.')], first, later);
    const live = second.toasts.filter(t => t.expiresAt > later);
    expect(live).toHaveLength(1);
    expect(live[0]).toMatchObject({ id: 'c2', count: 1, message: 'B comes due.' });
  });

  it('keeps different kinds and ungrouped toasts separate', () => {
    const result = routeNotifications([
      crack('c1', 5, 'A comes due.'),
      makeEvent({ id: 'r1', tick: 5, type: 'rival_action', message: 'A god schemes.', notification: { channel: 'toast' } }),
      crack('c2', 5, 'B comes due.'),
    ], EMPTY_STATE, NOW);
    expect(result.toasts.map(t => t.message)).toEqual(['A god schemes.', "Two rulers' agendas come due"]);
  });
});

describe('capToasts — a held toast keeps its slot (THR-2194)', () => {
  it('keeps a held group when a burst of ungrouped toasts passes the cap', () => {
    const held = { id: 'g', message: 'Two rulers', count: 2, createdTick: 1, expiresAt: Infinity, heldFrom: 5000 };
    let state: NotificationState = { ...EMPTY_STATE, toasts: [held] };
    const events = Array.from({ length: TOAST_MAX_VISIBLE + 2 }, (_, i) =>
      makeEvent({ id: `u${i}`, tick: 2, message: `Line ${i}.`, notification: { channel: 'toast' } }));
    state = routeNotifications(events, state, NOW);
    expect(state.toasts).toHaveLength(TOAST_MAX_VISIBLE);
    expect(state.toasts[0].id).toBe('g');
    expect(state.toasts.slice(1).map(t => t.id)).toEqual(
      events.slice(-(TOAST_MAX_VISIBLE - 1)).map(e => e.id));
  });
});
