import { useState, useEffect, useRef, useCallback } from 'react';
import type { TickEvent } from '../../../types/gameState';
import type { NotificationState, PopupItem } from '../../../types/notification';
import { routeNotifications } from '../../../engine/notificationRouter';

// ─── Pure Helpers (exported for testing) ────────────────────────

function expireToasts(state: NotificationState, now: number): NotificationState {
  return { ...state, toasts: state.toasts.filter(t => t.expiresAt > now) };
}

function dismissAlert(state: NotificationState, id: string): NotificationState {
  return { ...state, alerts: state.alerts.filter(a => a.id !== id) };
}

function dismissToast(state: NotificationState, id: string): NotificationState {
  return { ...state, toasts: state.toasts.filter(t => t.id !== id) };
}

function advancePopupQueue(state: NotificationState): NotificationState {
  return { ...state, popupQueue: state.popupQueue.slice(1) };
}

export const useNotificationsTestHelpers = {
  expireToasts,
  dismissAlert,
  dismissToast,
  advancePopupQueue,
};

// ─── Hook ───────────────────────────────────────────────────────

interface UseNotificationsParams {
  tickEvents: TickEvent[];
  running: boolean;
  setRunning: (running: boolean) => void;
}

export interface UseNotificationsReturn {
  notificationState: NotificationState;
  currentPopup: PopupItem | null;
  handleDismissToast: (id: string) => void;
  handleDismissAlert: (id: string) => void;
  handleDismissPopup: () => void;
  handlePopupChoice: (effect: string) => void;
}

export function useNotifications({
  tickEvents,
  running,
  setRunning,
}: UseNotificationsParams): UseNotificationsReturn {
  const [state, setState] = useState<NotificationState>({
    toasts: [],
    alerts: [],
    popupQueue: [],
  });

  const prevTickEventsRef = useRef<TickEvent[]>([]);
  const wasRunningRef = useRef(running);
  const runningRef = useRef(running);
  runningRef.current = running;

  // Route new tick events into notification state
  useEffect(() => {
    if (tickEvents === prevTickEventsRef.current) return;
    if (tickEvents.length === 0) {
      prevTickEventsRef.current = tickEvents;
      return;
    }
    prevTickEventsRef.current = tickEvents;
    const now = Date.now();
    setState(prev => routeNotifications(tickEvents, prev, now));
  }, [tickEvents]);

  // Toast expiry timer — pauses when sim is paused
  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setState(prev => expireToasts(prev, Date.now()));
    }, 500);
    return () => clearInterval(interval);
  }, [running]);

  // Auto-pause for popups with choices
  useEffect(() => {
    const currentPopup = state.popupQueue[0] ?? null;
    if (currentPopup?.choices && currentPopup.choices.length > 0 && runningRef.current) {
      wasRunningRef.current = true;
      setRunning(false);
    }
  }, [state.popupQueue, setRunning]);

  const handleDismissToast = useCallback((id: string) => {
    setState(prev => dismissToast(prev, id));
  }, []);

  const handleDismissAlert = useCallback((id: string) => {
    setState(prev => dismissAlert(prev, id));
  }, []);

  const handleDismissPopup = useCallback(() => {
    setState(prev => {
      const next = advancePopupQueue(prev);
      const nextPopup = next.popupQueue[0];
      if (!nextPopup || !nextPopup.choices?.length) {
        if (wasRunningRef.current) {
          wasRunningRef.current = false;
          setRunning(true);
        }
      }
      return next;
    });
  }, [setRunning]);

  const handlePopupChoice = useCallback((_effect: string) => {
    // TODO: dispatch effect to engine when choice resolution is implemented
    handleDismissPopup();
  }, [handleDismissPopup]);

  return {
    notificationState: state,
    currentPopup: state.popupQueue[0] ?? null,
    handleDismissToast,
    handleDismissAlert,
    handleDismissPopup,
    handlePopupChoice,
  };
}
