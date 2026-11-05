/**
 * useActionToasts — the imperative toast channel (action feedback, steer results, receipts'
 * toasts), with its own expiry clock (THR-2169).
 *
 * Before THR-2169 these toasts were pruned only when the *next* one was pushed, so the last
 * one of a session ("compelled toward The Gallows Pardon") stayed on screen indefinitely.
 * Now they expire on the same interval and pause rule as notification toasts
 * (`useNotifications`), and dismiss removes them here too.
 *
 * ─── Constants ───────────────────────────────────────────────────
 * | ACTION_TOAST_PRUNE_MS | 500 | How often expired action toasts are dropped (matches notifications) |
 */
import { useState, useEffect, useCallback } from 'react';
import type { ToastItem } from '../../../types/notification';

/** How often expired action toasts are dropped — the notification toasts' interval. */
export const ACTION_TOAST_PRUNE_MS = 500;

/** Drop toasts whose `expiresAt` has passed. Returns the same array when nothing expired. */
export function pruneExpiredToasts(toasts: ToastItem[], now: number): ToastItem[] {
  const live = toasts.filter(t => t.expiresAt > now);
  return live.length === toasts.length ? toasts : live;
}

export interface ActionToasts {
  actionToasts: ToastItem[];
  pushActionToast: (toast: ToastItem) => void;
  dismissActionToast: (id: string) => void;
}

/** `running`: the clock pauses expiry while the sim is paused, as notification toasts do. */
export function useActionToasts(running: boolean): ActionToasts {
  const [actionToasts, setActionToasts] = useState<ToastItem[]>([]);

  const pushActionToast = useCallback((toast: ToastItem) => {
    setActionToasts(prev => [...pruneExpiredToasts(prev, Date.now()), toast]);
  }, []);

  const dismissActionToast = useCallback((id: string) => {
    setActionToasts(prev => (prev.some(t => t.id === id) ? prev.filter(t => t.id !== id) : prev));
  }, []);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setActionToasts(prev => pruneExpiredToasts(prev, Date.now()));
    }, ACTION_TOAST_PRUNE_MS);
    return () => clearInterval(interval);
  }, [running]);

  return { actionToasts, pushActionToast, dismissActionToast };
}
