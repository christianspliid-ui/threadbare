/**
 * useEncounterNotifications — TB-040 / TB-055
 *
 * Converts gameState.encounterNotifications into ToastItems for the ToastStack.
 * Marks notifications as viewed after processing, and clears resolved ones.
 * Toast clicks open the TieredEncounterModal via the onOpenEncounter callback.
 */

import { useRef, useMemo, useCallback } from 'react';
import type { ToastItem } from '../../../types/notification';
import type { EncounterNotification } from '../../../types/encounterVisibility';
import type { GameState } from '../../../types/gameState';
import { TOAST_DURATION_MS } from '../../../types/notification';

interface UseEncounterNotificationsParams {
  encounterNotifications: EncounterNotification[] | undefined;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  /** Called when a toast is clicked — opens the encounter modal for this notification */
  onOpenEncounter?: (notification: EncounterNotification) => void;
}

/**
 * Returns ToastItem[] derived from encounter notifications.
 * Each notification becomes a toast exactly once (tracked by ID).
 */
export function useEncounterNotifications({
  encounterNotifications,
  setGameState,
  onOpenEncounter,
}: UseEncounterNotificationsParams): ToastItem[] {
  const seenIdsRef = useRef<Set<string>>(new Set());
  const toastMapRef = useRef<Map<string, ToastItem>>(new Map());

  // Stable callback that captures the notification by ID
  const makeOnClick = useCallback((notif: EncounterNotification) => {
    return () => onOpenEncounter?.(notif);
  }, [onOpenEncounter]);

  return useMemo(() => {
    const notifications = encounterNotifications ?? [];

    // Clean up stale toasts for notifications no longer present
    const activeIds = new Set(notifications.map(n => n.id));
    for (const id of toastMapRef.current.keys()) {
      if (!activeIds.has(id)) {
        toastMapRef.current.delete(id);
        seenIdsRef.current.delete(id);
      }
    }

    // Create toasts for new notifications
    const now = Date.now();
    let hadNew = false;

    for (const notif of notifications) {
      if (seenIdsRef.current.has(notif.id)) continue;
      seenIdsRef.current.add(notif.id);
      hadNew = true;

      toastMapRef.current.set(notif.id, {
        id: `enc-notif-${notif.id}`,
        message: notif.prose,
        count: 1,
        createdTick: notif.createdTick,
        expiresAt: now + TOAST_DURATION_MS * 2, // Encounter toasts last longer
        actorId: notif.agentId,
        onClick: onOpenEncounter ? makeOnClick(notif) : undefined,
      });
    }

    // Mark new notifications as viewed
    if (hadNew) {
      setGameState(prev => ({
        ...prev,
        encounterNotifications: (prev.encounterNotifications ?? []).map(n =>
          seenIdsRef.current.has(n.id) ? { ...n, viewed: true } : n,
        ),
      }));
    }

    return Array.from(toastMapRef.current.values());
  }, [encounterNotifications, setGameState, onOpenEncounter, makeOnClick]);
}
