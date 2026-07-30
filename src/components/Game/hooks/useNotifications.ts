import { useState, useEffect, useRef, useCallback } from 'react';
import type { TickEvent } from '../../../types/gameState';
import type { NotificationState, PopupItem, NotificationPreferences, ToastItem } from '../../../types/notification';
import type { VisibilityMap } from '../../../types/visibility';
import type { WorldGraph } from '../../../engine/graph';
import { routeNotifications } from '../../../engine/notificationRouter';
import { filterEventsByVisibility } from '../../../engine/notificationVisibilityFilter';
import { buildThreadingGate } from '../../../engine/notificationThreadingGate';

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

/**
 * THR-666/THR-667: reading a row clears the notices that were waiting on it.
 * `anchorId` is the row's node id — an agent's or a faction's.
 */
function clearEntityNotices(state: NotificationState, anchorId: string): NotificationState {
  return { ...state, entityNotices: (state.entityNotices ?? []).filter(n => n.anchorId !== anchorId) };
}

export const useNotificationsTestHelpers = {
  expireToasts,
  dismissAlert,
  dismissToast,
  advancePopupQueue,
  clearEntityNotices,
};

// ─── Hook ───────────────────────────────────────────────────────

interface UseNotificationsParams {
  tickEvents: TickEvent[];
  running: boolean;
  setRunning: (running: boolean) => void;
  visibilityMap: VisibilityMap;
  /** Notification preferences — controls which categories are shown and duration mode */
  preferences?: NotificationPreferences;
  /**
   * THR-666: world graph + ascendant, used to build the threading gate. When
   * omitted the gate is off and every event routes globally (pre-gate behaviour).
   */
  graph?: WorldGraph;
  ascendantId?: string;
}

export interface UseNotificationsReturn {
  notificationState: NotificationState;
  currentPopup: PopupItem | null;
  handleDismissToast: (id: string) => void;
  handleDismissAlert: (id: string) => void;
  handleDismissPopup: () => void;
  handlePopupChoice: (effect: string) => void;
  /** Push a toast directly (bypasses tick event routing — for immediate player feedback). */
  pushToast: (toast: ToastItem) => void;
  /** THR-666/THR-667: clear the notices waiting on one thread row (agent or faction). */
  handleClearEntityNotices: (anchorId: string) => void;
}

export function useNotifications({
  tickEvents,
  running,
  setRunning,
  visibilityMap,
  preferences,
  graph,
  ascendantId,
}: UseNotificationsParams): UseNotificationsReturn {
  const [state, setState] = useState<NotificationState>({
    toasts: [],
    alerts: [],
    popupQueue: [],
    entityNotices: [],
  });

  const prevTickEventsRef = useRef<TickEvent[]>([]);
  const wasRunningRef = useRef(running);
  const runningRef = useRef(running);
  runningRef.current = running;

  // The graph is mutated in place, so it is read through a ref rather than
  // tracked as an effect dependency — the gate is rebuilt per routing pass
  // instead, which is a thread scan and cheap at thread-count scale.
  const graphRef = useRef(graph);
  graphRef.current = graph;
  const ascendantIdRef = useRef(ascendantId);
  ascendantIdRef.current = ascendantId;

  // Route new tick events into notification state
  useEffect(() => {
    if (tickEvents === prevTickEventsRef.current) return;
    if (tickEvents.length === 0) {
      prevTickEventsRef.current = tickEvents;
      return;
    }
    prevTickEventsRef.current = tickEvents;
    const now = Date.now();
    const filtered = filterEventsByVisibility(tickEvents, visibilityMap);
    const currentGraph = graphRef.current;
    const currentAscendantId = ascendantIdRef.current;
    const gate = currentGraph && currentAscendantId
      ? buildThreadingGate(currentGraph, currentAscendantId)
      : undefined;
    setState(prev => routeNotifications(filtered, prev, now, preferences, gate));
  }, [tickEvents, preferences]);

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

  const pushToast = useCallback((toast: ToastItem) => {
    setState(prev => ({ ...prev, toasts: [...prev.toasts, toast] }));
  }, []);

  const handleDismissAlert = useCallback((id: string) => {
    setState(prev => dismissAlert(prev, id));
  }, []);

  const handleClearEntityNotices = useCallback((anchorId: string) => {
    setState(prev => clearEntityNotices(prev, anchorId));
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
    // TODO(THR-14): dispatch effect to engine when choice resolution is implemented
    handleDismissPopup();
  }, [handleDismissPopup]);

  return {
    notificationState: state,
    currentPopup: state.popupQueue[0] ?? null,
    handleDismissToast,
    handleDismissAlert,
    handleDismissPopup,
    handlePopupChoice,
    pushToast,
    handleClearEntityNotices,
  };
}
