import { describe, it, expect } from 'vitest';
import type { TickEvent } from '../../types/gameState';
import type { NotificationState } from '../../types/notification';
import { TOAST_MAX_VISIBLE, ALERT_MAX_VISIBLE } from '../../types/notification';
import { routeNotifications } from '../notificationRouter';

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

  it('deduplicates alerts with same icon in same tick, keeping latest message', () => {
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
    const result = routeNotifications(events, EMPTY_STATE, NOW);
    expect(result.alerts).toHaveLength(1);
    expect(result.alerts[0].message).toBe('Second doom warning.');
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

  it('caps alerts at ALERT_MAX_VISIBLE', () => {
    const events: TickEvent[] = Array.from({ length: ALERT_MAX_VISIBLE + 3 }, (_, i) =>
      makeEvent({
        id: `e${i}`,
        tick: i, // different ticks to avoid dedup
        message: `Alert ${i}`,
        notification: { channel: 'alert', icon: 'discovery' },
      }),
    );
    const result = routeNotifications(events, EMPTY_STATE, NOW);
    expect(result.alerts).toHaveLength(ALERT_MAX_VISIBLE);
    // Should keep the latest ones
    expect(result.alerts[result.alerts.length - 1].message).toBe(
      `Alert ${ALERT_MAX_VISIBLE + 2}`,
    );
  });
});
