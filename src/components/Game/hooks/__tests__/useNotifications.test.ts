import { describe, it, expect } from 'vitest';
import { useNotificationsTestHelpers } from '../useNotifications';
import type { NotificationState } from '../../../../types/notification';

describe('useNotifications helpers', () => {
  it('expireToasts removes toasts past their expiresAt', () => {
    const state: NotificationState = {
      toasts: [
        { id: 't1', message: 'A', count: 1, createdTick: 1, expiresAt: 500 },
        { id: 't2', message: 'B', count: 1, createdTick: 2, expiresAt: 2000 },
      ],
      alerts: [],
      popupQueue: [],
    };
    const result = useNotificationsTestHelpers.expireToasts(state, 1000);
    expect(result.toasts).toHaveLength(1);
    expect(result.toasts[0].id).toBe('t2');
  });

  it('dismissAlert removes alert by id', () => {
    const state: NotificationState = {
      toasts: [],
      alerts: [
        { id: 'a1', icon: 'doom', message: 'Bad', sourceEventId: 'e1', tick: 1 },
        { id: 'a2', icon: 'mandate', message: 'Good', sourceEventId: 'e2', tick: 2 },
      ],
      popupQueue: [],
    };
    const result = useNotificationsTestHelpers.dismissAlert(state, 'a1');
    expect(result.alerts).toHaveLength(1);
    expect(result.alerts[0].id).toBe('a2');
  });

  it('dismissToast removes toast by id', () => {
    const state: NotificationState = {
      toasts: [
        { id: 't1', message: 'A', count: 1, createdTick: 1, expiresAt: 9999 },
      ],
      alerts: [],
      popupQueue: [],
    };
    const result = useNotificationsTestHelpers.dismissToast(state, 't1');
    expect(result.toasts).toHaveLength(0);
  });

  it('advancePopupQueue removes the first popup', () => {
    const state: NotificationState = {
      toasts: [],
      alerts: [],
      popupQueue: [
        { id: 'p1', title: 'First', body: 'A', sourceEventId: 'e1', tick: 1 },
        { id: 'p2', title: 'Second', body: 'B', sourceEventId: 'e2', tick: 2 },
      ],
    };
    const result = useNotificationsTestHelpers.advancePopupQueue(state);
    expect(result.popupQueue).toHaveLength(1);
    expect(result.popupQueue[0].id).toBe('p2');
  });
});
