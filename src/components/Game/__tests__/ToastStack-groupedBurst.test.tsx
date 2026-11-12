// @vitest-environment jsdom
/**
 * THR-2194 (Law 49) — a burst of same-kind toasts reads as one toast with a count that
 * opens to the list. End to end: the agenda-crack producer's directive → the router →
 * the stack.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ToastStack } from '../ToastStack';
import { routeNotifications } from '../../../engine/notificationRouter';
import { NOTABLE_AGENDA_CRACK_TOAST_GROUP } from '../../../data/notable-agenda-config';
import { useNotificationsTestHelpers } from '../hooks/useNotifications';
import { TOAST_DURATION_MS } from '../../../types/notification';
import type { TickEvent } from '../../../types/gameState';
import type { NotificationState } from '../../../types/notification';

const EMPTY: NotificationState = { toasts: [], alerts: [], popupQueue: [], entityNotices: [] };

function crack(id: string, line: string, placeId?: string): TickEvent {
  return {
    id,
    tick: 40,
    type: 'rival_action',
    message: line,
    significance: 0.8,
    notification: { channel: 'toast', group: NOTABLE_AGENDA_CRACK_TOAST_GROUP },
    ...(placeId ? { refs: [{ kind: 'location', id: placeId }] } : {}),
  } as TickEvent;
}

const LINES = [
  "Muusha's open feud comes due over Whaiwia.",
  "Asha's pressed claim comes due over The Disaster Site.",
  "Huama's pressed claim comes due over Armory.",
];

describe('ToastStack — grouped burst (THR-2194)', () => {
  it('three agenda-crack toasts render as one toast with a count of 3, and opening it lists all three', () => {
    const now = Date.now();
    const state = routeNotifications(
      [crack('c1', LINES[0]), crack('c2', LINES[1], 'loc_disaster'), crack('c3', LINES[2])],
      EMPTY,
      now,
    );
    const onHold = vi.fn();
    const onDismiss = vi.fn();
    const onNavigate = vi.fn();
    render(<ToastStack toasts={state.toasts} onDismiss={onDismiss} onHold={onHold} onNavigate={onNavigate} />);

    const toasts = screen.getAllByTestId('toast');
    expect(toasts).toHaveLength(1);
    const toast = toasts[0];
    expect(toast.getAttribute('data-toast-count')).toBe('3');
    expect(toast.textContent).toContain("Three rulers' agendas come due");
    expect(toast.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByTestId('toast-group-list')).toBeNull();

    // Opening lists every ruler's own line, holds the toast, and dismisses nothing.
    fireEvent.click(toast);
    expect(onHold).toHaveBeenCalledWith('c1');
    expect(onDismiss).not.toHaveBeenCalled();
    expect(toast.getAttribute('aria-expanded')).toBe('true');
    const members = within(screen.getByTestId('toast-group-list')).getAllByTestId('toast-group-member');
    expect(members.map(m => m.textContent)).toEqual(LINES);

    // A listed line with a place opens it; one without stays inert.
    expect((members[0] as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(members[1]);
    expect(onNavigate).toHaveBeenCalledWith({ kind: 'location', locationNodeId: 'loc_disaster' });
    expect(onDismiss).toHaveBeenCalledWith('c1');
  });

  it('folding the open list releases the hold', () => {
    const state = routeNotifications([crack('c1', LINES[0]), crack('c2', LINES[1])], EMPTY, Date.now());
    const onHold = vi.fn();
    const onRelease = vi.fn();
    render(<ToastStack toasts={state.toasts} onDismiss={vi.fn()} onHold={onHold} onRelease={onRelease} />);
    const toast = screen.getByTestId('toast');
    fireEvent.click(toast);
    fireEvent.click(toast);
    expect(onHold).toHaveBeenCalledTimes(1);
    expect(onRelease).toHaveBeenCalledWith('c1');
    expect(toast.getAttribute('aria-expanded')).toBe('false');
  });

  it('a held group lapses again once released, so a later burst starts a fresh toast', () => {
    const { holdToast, releaseToast, expireToasts } = useNotificationsTestHelpers;
    const t0 = 1_000;
    let state = routeNotifications([crack('c1', LINES[0]), crack('c2', LINES[1])], EMPTY, t0);
    state = holdToast(state, 'c1');
    expect(state.toasts[0].expiresAt).toBe(Infinity);
    const later = t0 + 60_000;
    state = releaseToast(state, 'c1', later);
    expect(state.toasts[0].expiresAt).toBe(later + TOAST_DURATION_MS);
    expect(state.toasts[0].heldFrom).toBeUndefined();
    state = expireToasts(state, later + TOAST_DURATION_MS + 1);
    const next = routeNotifications([crack('c3', LINES[2])], state, later + TOAST_DURATION_MS + 2);
    expect(next.toasts).toHaveLength(1);
    expect(next.toasts[0]).toMatchObject({ id: 'c3', count: 1, message: LINES[2] });
  });

  it('a lone toast of a burst kind keeps its own line and click-through', () => {
    const state = routeNotifications([crack('c1', LINES[1], 'loc_disaster')], EMPTY, Date.now());
    const onNavigate = vi.fn();
    const onDismiss = vi.fn();
    render(<ToastStack toasts={state.toasts} onDismiss={onDismiss} onNavigate={onNavigate} />);
    const toast = screen.getByTestId('toast');
    expect(toast.textContent).toContain(LINES[1]);
    expect(toast.getAttribute('aria-expanded')).toBeNull();
    fireEvent.click(toast);
    expect(onNavigate).toHaveBeenCalledWith({ kind: 'location', locationNodeId: 'loc_disaster' });
    expect(onDismiss).toHaveBeenCalledWith('c1');
  });
});
