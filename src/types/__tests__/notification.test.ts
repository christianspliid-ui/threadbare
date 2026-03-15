import { describe, it, expect } from 'vitest';
import {
  TOAST_MAX_VISIBLE,
  TOAST_DURATION_MS,
  ALERT_MAX_VISIBLE,
} from '../notification';
import type {
  NotificationChannel,
  AlertIcon,
  PopupChoice,
  NotificationDirective,
  ToastItem,
  AlertItem,
  PopupItem,
  NotificationState,
} from '../notification';

describe('Notification constants', () => {
  it('TOAST_MAX_VISIBLE is a positive integer', () => {
    expect(TOAST_MAX_VISIBLE).toBeGreaterThan(0);
    expect(Number.isInteger(TOAST_MAX_VISIBLE)).toBe(true);
  });

  it('TOAST_DURATION_MS is at least 1 second', () => {
    expect(TOAST_DURATION_MS).toBeGreaterThanOrEqual(1000);
  });

  it('ALERT_MAX_VISIBLE is a positive integer', () => {
    expect(ALERT_MAX_VISIBLE).toBeGreaterThan(0);
    expect(Number.isInteger(ALERT_MAX_VISIBLE)).toBe(true);
  });
});

describe('Notification types', () => {
  it('can construct a ToastItem', () => {
    const toast: ToastItem = {
      id: 'toast-1',
      message: 'A village was founded',
      sphere: 'life',
      count: 1,
      createdTick: 10,
      expiresAt: Date.now() + TOAST_DURATION_MS,
    };
    expect(toast.id).toBe('toast-1');
    expect(toast.count).toBe(1);
    expect(toast.sphere).toBe('life');
  });

  it('ToastItem sphere is optional', () => {
    const toast: ToastItem = {
      id: 'toast-2',
      message: 'Something happened',
      count: 1,
      createdTick: 5,
      expiresAt: Date.now() + TOAST_DURATION_MS,
    };
    expect(toast.sphere).toBeUndefined();
  });

  it('can construct an AlertItem', () => {
    const alert: AlertItem = {
      id: 'alert-1',
      icon: 'doom',
      message: 'The doom clock advances',
      sourceEventId: 'evt-42',
      tick: 15,
    };
    expect(alert.icon).toBe('doom');
    expect(alert.sourceEventId).toBe('evt-42');
  });

  it('can construct a PopupItem with choices', () => {
    const popup: PopupItem = {
      id: 'popup-1',
      title: 'A Dilemma',
      body: 'Choose wisely',
      art: 'dilemma.png',
      sphere: 'mind',
      choices: [
        { label: 'Accept', effect: 'gain_essence', tooltip: 'Gain 10 essence' },
        { label: 'Reject', effect: 'lose_essence' },
      ],
      sourceEventId: 'evt-99',
      tick: 20,
    };
    expect(popup.choices).toHaveLength(2);
    expect(popup.choices![0].tooltip).toBe('Gain 10 essence');
    expect(popup.choices![1].tooltip).toBeUndefined();
  });

  it('can construct a NotificationDirective for each channel', () => {
    const toast: NotificationDirective = { channel: 'toast' };
    const alert: NotificationDirective = { channel: 'alert', icon: 'death' };
    const popup: NotificationDirective = {
      channel: 'popup',
      popup: { title: 'Test', body: 'Body text' },
    };
    expect(toast.channel).toBe('toast');
    expect(alert.icon).toBe('death');
    expect(popup.popup?.title).toBe('Test');
  });

  it('can construct a NotificationState', () => {
    const state: NotificationState = {
      toasts: [],
      alerts: [],
      popupQueue: [],
    };
    expect(state.toasts).toHaveLength(0);
    expect(state.alerts).toHaveLength(0);
    expect(state.popupQueue).toHaveLength(0);
  });
});
