// @vitest-environment jsdom
/**
 * THR-2169 — action toasts expire on their own clock: one pushed toast is gone
 * `expiresAt` + one interval later with no further toast pushed.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useActionToasts, pruneExpiredToasts, ACTION_TOAST_PRUNE_MS } from '../useActionToasts';
import type { ToastItem } from '../../../../types/notification';

function toast(id: string, expiresAt: number): ToastItem {
  return { id, message: `You compelled ${id} toward The Gallows Pardon.`, count: 1, createdTick: 1, expiresAt };
}

describe('THR-2169 — action toasts expire', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-05T09:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('a lone toast is gone expiresAt + one interval later, with nothing else pushed', () => {
    const { result } = renderHook(() => useActionToasts(true));
    act(() => result.current.pushActionToast(toast('steer', Date.now() + 5000)));
    expect(result.current.actionToasts).toHaveLength(1);
    act(() => { vi.advanceTimersByTime(4000); });
    expect(result.current.actionToasts).toHaveLength(1);
    act(() => { vi.advanceTimersByTime(1000 + ACTION_TOAST_PRUNE_MS); });
    expect(result.current.actionToasts).toHaveLength(0);
  });

  it('a paused clock holds the toast; it goes once the clock runs again', () => {
    const { result, rerender } = renderHook(({ running }) => useActionToasts(running), { initialProps: { running: false } });
    act(() => result.current.pushActionToast(toast('steer', Date.now() + 1000)));
    act(() => { vi.advanceTimersByTime(3000); });
    expect(result.current.actionToasts).toHaveLength(1);
    rerender({ running: true });
    act(() => { vi.advanceTimersByTime(ACTION_TOAST_PRUNE_MS); });
    expect(result.current.actionToasts).toHaveLength(0);
  });

  it('dismiss removes an action toast', () => {
    const { result } = renderHook(() => useActionToasts(true));
    act(() => result.current.pushActionToast(toast('a', Date.now() + 5000)));
    act(() => result.current.dismissActionToast('a'));
    expect(result.current.actionToasts).toHaveLength(0);
  });

  it('pruneExpiredToasts keeps identity when nothing expired', () => {
    const list = [toast('a', 2000)];
    expect(pruneExpiredToasts(list, 1000)).toBe(list);
    expect(pruneExpiredToasts(list, 3000)).toEqual([]);
  });
});
