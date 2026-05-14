import type { TickEvent } from '../types/gameState';
import type {
  NotificationState, ToastItem, AlertItem, PopupItem,
  NavigationTarget, NotificationCategoryKey, NotificationPreferences,
} from '../types/notification';
import {
  TOAST_MAX_VISIBLE, TOAST_DURATION_MS, ALERT_MAX_VISIBLE,
  DEFAULT_NOTIFICATION_PREFS,
} from '../types/notification';

// ─── Navigation Target Derivation ──────────────────────────────

/** Derive a navigation target from a TickEvent's entity references */
export function deriveNavigationTarget(event: TickEvent): NavigationTarget | undefined {
  // Encounter events → encounter navigation
  if (event.type.startsWith('encounter_') || event.type === 'agent_encounter') {
    return event.encounterId
      ? { kind: 'encounter', encounterId: event.encounterId }
      : event.actorId ? { kind: 'agent', agentId: event.actorId } : undefined;
  }
  // Faction events → faction navigation
  if (event.type.startsWith('faction_') || event.type === 'trust_shattered'
    || event.type === 'trust_deepened' || event.type === 'bond_formed'
    || event.type === 'social_encounter' || event.type === 'dilemma_resolved_social') {
    return event.factionId ? { kind: 'faction', factionId: event.factionId } : undefined;
  }
  // Journey events → journey navigation
  if (event.type.startsWith('journey_')) {
    return event.journeyId && event.actorId
      ? { kind: 'journey', journeyId: event.journeyId, agentId: event.actorId }
      : undefined;
  }
  // Settlement/hex/discovery events → hex navigation
  if ((event.type === 'settlement_tier_change' || event.type === 'economic_chronicle'
    || event.type === 'hidden_site_discovered' || event.type === 'elder_site_discovered'
    || event.type === 'survey_completed') && event.hexCoords) {
    return { kind: 'hex', col: event.hexCoords.col, row: event.hexCoords.row };
  }
  // Default: agent selection if actorId present
  if (event.actorId) {
    return { kind: 'agent', agentId: event.actorId };
  }
  return undefined;
}

// ─── Event Category Mapping ────────────────────────────────────

/** Map a TickEvent type to its notification category */
export function eventTypeToCategory(type: TickEvent['type']): NotificationCategoryKey {
  if (type.startsWith('encounter_') || type === 'agent_encounter') return 'encounters';
  if (type === 'agent_movement') return 'movement';
  if (type === 'agent_action' || type === 'agent_action_resolved') return 'actions';
  if (type.startsWith('faction_') || type.startsWith('trust_') || type === 'bond_formed'
    || type === 'social_encounter' || type === 'dilemma_resolved_social'
    || type === 'faction_rank_changed') return 'social';
  if (type === 'doom_escalation') return 'doom';
  if (type.startsWith('journey_')) return 'journeys';
  if (type.startsWith('ambition_')) return 'ambitions';
  if (type === 'intervention_effect' || type.startsWith('control_effect_')) return 'divine';
  if (type === 'complication') return 'encounters'; // THR-20: complications route with encounters
  if (type === 'settlement_tier_change' || type === 'economic_chronicle') return 'economy';
  if (type === 'tier_promotion') return 'actions';
  if (type === 'return_resolved' || type === 'ripple_consequence') return 'journeys';
  if (type === 'hidden_site_discovered' || type === 'elder_site_discovered'
    || type === 'survey_completed') return 'discovery';
  // Default fallback
  return 'actions';
}

// ─── Preference Resolution ─────────────────────────────────────

/** Resolve notification preferences from GameState override + localStorage + defaults */
export function resolvePreferences(
  gameStatePrefs: Partial<NotificationPreferences> | undefined,
  storedPrefs: Partial<NotificationPreferences> | undefined,
): NotificationPreferences {
  return {
    ...DEFAULT_NOTIFICATION_PREFS,
    ...storedPrefs,
    ...gameStatePrefs,
  };
}

/** ExpiresAt value for permanent-mode notifications */
const PERMANENT_TOAST_EXPIRY = Infinity;

// ─── Router ────────────────────────────────────────────────────

export function routeNotifications(
  tickEvents: TickEvent[],
  currentState: NotificationState,
  now: number,
  preferences?: NotificationPreferences,
): NotificationState {
  const prefs = preferences ?? DEFAULT_NOTIFICATION_PREFS;

  // Copy existing state
  const newToasts: ToastItem[] = [...currentState.toasts];
  const newAlerts: AlertItem[] = [...currentState.alerts];
  const newPopupQueue: PopupItem[] = [...currentState.popupQueue];

  // Track collapsing within this batch
  const toastByMessage = new Map<string, ToastItem>();
  const alertByIconTick = new Map<string, number>(); // key -> index in newAlerts

  for (const event of tickEvents) {
    if (!event.notification) continue;

    // Check if this event's category is disabled by preferences
    const category = eventTypeToCategory(event.type);
    const categoryPrefs = prefs[category];
    if (!categoryPrefs.enabled) continue;

    const { channel, icon, popup } = event.notification;
    const navTarget = deriveNavigationTarget(event);

    // Determine expiry based on preference mode
    const isPermanent = categoryPrefs.mode === 'permanent';

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
            expiresAt: isPermanent ? PERMANENT_TOAST_EXPIRY : now + TOAST_DURATION_MS,
            actorId: event.actorId,
            navigationTarget: navTarget,
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
            actorId: event.actorId,
            navigationTarget: navTarget,
          };
        } else {
          const alert: AlertItem = {
            id: event.id,
            icon: icon ?? 'discovery',
            message: event.message,
            sphere: event.sphere,
            sourceEventId: event.id,
            tick: event.tick,
            actorId: event.actorId,
            navigationTarget: navTarget,
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
