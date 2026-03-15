import type { TickEvent } from '../types/gameState';
import type { NotificationState, ToastItem, AlertItem, PopupItem } from '../types/notification';
import { TOAST_MAX_VISIBLE, TOAST_DURATION_MS, ALERT_MAX_VISIBLE } from '../types/notification';

export function routeNotifications(
  tickEvents: TickEvent[],
  currentState: NotificationState,
  now: number,
): NotificationState {
  // Copy existing state
  const newToasts: ToastItem[] = [...currentState.toasts];
  const newAlerts: AlertItem[] = [...currentState.alerts];
  const newPopupQueue: PopupItem[] = [...currentState.popupQueue];

  // Track collapsing within this batch
  const toastByMessage = new Map<string, ToastItem>();
  const alertByIconTick = new Map<string, number>(); // key -> index in newAlerts

  for (const event of tickEvents) {
    if (!event.notification) continue;
    const { channel, icon, popup } = event.notification;

    switch (channel) {
      case 'toast': {
        const existing = toastByMessage.get(event.message);
        if (existing) {
          existing.count += 1;
        } else {
          const toast: ToastItem = {
            id: event.id,
            message: event.message,
            sphere: event.sphere,
            count: 1,
            createdTick: event.tick,
            expiresAt: now + TOAST_DURATION_MS,
          };
          newToasts.push(toast);
          toastByMessage.set(event.message, toast);
        }
        break;
      }
      case 'alert': {
        const dedupKey = `${icon ?? 'unknown'}_${event.tick}`;
        const existingIdx = alertByIconTick.get(dedupKey);
        if (existingIdx !== undefined) {
          newAlerts[existingIdx] = {
            ...newAlerts[existingIdx],
            message: event.message,
            sourceEventId: event.id,
          };
        } else {
          const alert: AlertItem = {
            id: event.id,
            icon: icon ?? 'discovery',
            message: event.message,
            sphere: event.sphere,
            sourceEventId: event.id,
            tick: event.tick,
          };
          alertByIconTick.set(dedupKey, newAlerts.length);
          newAlerts.push(alert);
        }
        break;
      }
      case 'popup': {
        if (!popup) break;
        const popupItem: PopupItem = {
          id: event.id,
          title: popup.title,
          body: popup.body,
          art: popup.art,
          sphere: event.sphere,
          choices: popup.choices,
          sourceEventId: event.id,
          tick: event.tick,
        };
        newPopupQueue.push(popupItem);
        break;
      }
    }
  }

  return {
    toasts: newToasts.slice(-TOAST_MAX_VISIBLE),
    alerts: newAlerts.slice(-ALERT_MAX_VISIBLE),
    popupQueue: newPopupQueue,
  };
}
