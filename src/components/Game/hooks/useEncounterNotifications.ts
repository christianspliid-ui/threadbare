/**
 * useEncounterNotifications — TB-040 / TB-055
 *
 * Converts gameState.encounterNotifications into ToastItems for the ToastStack.
 * Marks notifications as viewed after processing, and clears resolved ones.
 * Toast clicks open the TieredEncounterModal via the onOpenEncounter callback.
 */

import { useRef, useMemo, useCallback } from 'react';
import type { ToastItem, EncounterToastCard } from '../../../types/notification';
import type { EncounterNotification } from '../../../types/encounterVisibility';
import type { GameState } from '../../../types/gameState';
import {
  TOAST_DURATION_MS,
  ENCOUNTER_TOAST_DURATION_MULT,
  NOTIF_TEASER_MAX_CHARS,
} from '../../../types/notification';
import { outcomeBandWord } from '../../../data/outcome-band-content';

/** First sentence of the prose, clamped to NOTIF_TEASER_MAX_CHARS with an ellipsis. */
function buildTease(prose: string): string {
  const firstSentence = prose.split(/(?<=[.!?])\s/)[0] ?? prose;
  const trimmed = firstSentence.trim();
  if (trimmed.length <= NOTIF_TEASER_MAX_CHARS) return trimmed;
  return trimmed.slice(0, NOTIF_TEASER_MAX_CHARS).trimEnd() + '…';
}

/** Build the structured card model for an encounter notification (THR-636). */
function buildEncounterCard(notif: EncounterNotification): EncounterToastCard {
  const bandWord = notif.outcomeBand ? outcomeBandWord(notif.outcomeBand) : undefined;
  let meta: string;
  if (notif.kind === 'aftermath') {
    meta = bandWord ? `concluded · ${bandWord}` : 'concluded';
  } else {
    const stepNum = (notif.stepIndex ?? 0) + 1;
    const stepPart = notif.totalSteps ? `step ${stepNum} of ${notif.totalSteps}` : `step ${stepNum}`;
    meta = bandWord ? `${stepPart} · ${bandWord}` : stepPart;
  }
  return {
    agentName: notif.agentName,
    encounterName: notif.encounterName,
    meta,
    tease: buildTease(notif.prose),
  };
}

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
        expiresAt: now + TOAST_DURATION_MS * ENCOUNTER_TOAST_DURATION_MULT, // Encounter toasts last longer
        actorId: notif.agentId,
        onClick: onOpenEncounter ? makeOnClick(notif) : undefined,
        band: notif.outcomeBand ?? notif.narrativeTag,
        encounterCard: buildEncounterCard(notif),
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
