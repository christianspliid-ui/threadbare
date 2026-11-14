import type { TickEvent } from '../types/gameState';
import type {
  NotificationState, ToastItem, ToastGroupMember, AlertItem, PopupItem, EntityNotice,
  NavigationTarget, NotificationCategoryKey, NotificationPreferences,
} from '../types/notification';
import {
  TOAST_MAX_VISIBLE, TOAST_DURATION_MS, ALERT_SAFETY_CAP,
  ENTITY_NOTICE_MAX_RETAINED,
  DEFAULT_NOTIFICATION_PREFS,
} from '../types/notification';
import type { ThreadingGate } from './notificationThreadingGate';
import { ENTITY_DIVERTED_CHANNELS, ROUTE_GLOBAL } from './notificationThreadingGate';
import { NEEDS_YOU_NEWS_KEEP_DAYS } from './views/viewConstants';
import { TICKS_PER_DAY } from '../data/attention-constants';

/**
 * THR-1875 — how long an alert stays in the channel, in ticks. Needs you's News group
 * lapses a row by the same rule (`views/needsYou.ts`), so the two never disagree.
 */
export const ALERT_KEEP_TICKS = NEEDS_YOU_NEWS_KEEP_DAYS * TICKS_PER_DAY;

/** Dev warning for the safety cap, once per session (Law 49: never a silent drop). */
let warnedAlertCap = false;

/**
 * THR-1875 (frame plan § F5) — keep the alert channel by age, then by the safety cap.
 * Alerts older than `ALERT_KEEP_TICKS` before `currentTick` lapse; past
 * `ALERT_SAFETY_CAP` the oldest drop and are counted. Pure; exported for tests.
 */
export function trimAlerts(
  alerts: readonly AlertItem[],
  currentTick: number,
): { alerts: AlertItem[]; trimmedAtCap: number } {
  const fresh = alerts.filter(a => currentTick - a.tick < ALERT_KEEP_TICKS);
  const over = Math.max(0, fresh.length - ALERT_SAFETY_CAP);
  if (over > 0 && !warnedAlertCap && import.meta.env?.DEV) {
    warnedAlertCap = true;
    console.warn(`[notificationRouter] the alert channel passed ALERT_SAFETY_CAP (${ALERT_SAFETY_CAP}); ${over} oldest trimmed and counted`);
  }
  return { alerts: over > 0 ? fresh.slice(over) : fresh, trimmedAtCap: over };
}

// ─── Navigation Target Derivation ──────────────────────────────

/** Derive a navigation target from a TickEvent's entity references */
export function deriveNavigationTarget(event: TickEvent): NavigationTarget | undefined {
  // Divine Receipt toast → open the receipt dialogue (THR-727). The receipt id equals
  // the event id by construction (see processPlayerReceipts).
  if (event.type === 'player_action_receipt') {
    // THR-1606: a cast that changed its target names them as the event's world
    // reference (the producer declares, Law 2) — the toast opens the mortal it
    // touched, where the chip and the story line are (Law 1).
    const target = event.refs?.find((r) => r.kind === 'agent');
    if (target) return { kind: 'agent', agentId: target.id };
    return { kind: 'receipt', receiptId: event.id };
  }
  // THR-1606: a spine gift's placement line opens the place it raised a seat in.
  // (The artifact line carries the bearer as `actorId`, which the default below opens.)
  // THR-2185: a rival's toast opens the place its hand landed on (or its scheme targets),
  // where the god's cards for that place are.
  if (event.type === 'narrative' || event.type === 'rival_action') {
    const place = event.refs?.find((r) => r.kind === 'location');
    if (place) return { kind: 'location', locationNodeId: place.id };
  }
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
  if (type === 'player_action_receipt') return 'divine'; // THR-727 — sits with divine intervention feedback
  if (type === 'divine_premonition') return 'divine'; // THR-1781 — a paid steer's outcome
  if (type === 'complication') return 'encounters'; // THR-20: complications route with encounters
  if (type === 'settlement_tier_change' || type === 'economic_chronicle') return 'economy';
  if (type === 'tier_promotion') return 'actions';
  if (type === 'return_resolved' || type === 'ripple_consequence') return 'journeys';
  if (type === 'hidden_site_discovered' || type === 'elder_site_discovered'
    || type === 'survey_completed') return 'discovery';
  if (type === 'personality_trait_emerged') return 'lifecycle'; // THR-562 — a character-defining "becoming"
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

// ─── Toast bursts (THR-2194, Law 49) ───────────────────────────

/** Count words for a grouped toast's headline; above the table the numeral stands. */
const COUNT_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'] as const;

/** The count in words, capitalised when it leads the line ("Three"). Pure. */
export function countInWords(n: number, capitalise = true): string {
  const word = COUNT_WORDS[n] ?? String(n);
  return capitalise ? word.charAt(0).toUpperCase() + word.slice(1) : word;
}

/** A grouped toast's line: the headline template with `{count}` filled. Pure. */
export function formatGroupHeadline(template: string, count: number): string {
  return template.replace(/\{count\}/g, (_m, offset: number) => countInWords(count, offset === 0));
}

/**
 * The newest `TOAST_MAX_VISIBLE` toasts, never dropping one the player holds open
 * (`heldFrom` set, THR-2194): a held toast keeps its slot and the cap trims the rest,
 * oldest first. Order is kept. Pure; exported for tests.
 */
export function capToasts(toasts: readonly ToastItem[]): ToastItem[] {
  const held = toasts.filter(t => t.heldFrom !== undefined).length;
  let room = Math.max(0, TOAST_MAX_VISIBLE - held);
  const keep = new Array<boolean>(toasts.length).fill(false);
  for (let i = toasts.length - 1; i >= 0; i--) {
    if (toasts[i].heldFrom !== undefined) keep[i] = true;
    else if (room > 0) { keep[i] = true; room -= 1; }
  }
  return toasts.filter((_t, i) => keep[i]);
}

/** Index of the newest still-showing toast collecting burst kind `key`, or -1. */
function findLiveGroupToast(toasts: readonly ToastItem[], key: string, now: number): number {
  for (let i = toasts.length - 1; i >= 0; i--) {
    if (toasts[i].groupKey === key && toasts[i].expiresAt > now) return i;
  }
  return -1;
}

/** A pre-existing toast's own line, as the first member of the group it now hosts. */
function toastAsGroupMember(toast: ToastItem): ToastGroupMember {
  return {
    id: toast.id,
    message: toast.message,
    ...(toast.navigationTarget ? { navigationTarget: toast.navigationTarget } : {}),
    ...(toast.actorId ? { actorId: toast.actorId } : {}),
  };
}

/**
 * The host toast with `members` folded in: a new object (the previous state's toast is
 * never mutated). A grouped toast has no single target — its click opens the list, and
 * each listed line opens its own place or person.
 */
function foldGroupToast(host: ToastItem, members: ToastGroupMember[], fallbackHeadline: string, expiresAt: number): ToastItem {
  const headline = host.groupHeadline ?? fallbackHeadline;
  const rest: ToastItem = { ...host };
  delete rest.navigationTarget;
  delete rest.actorId;
  return {
    ...rest,
    message: formatGroupHeadline(headline, members.length),
    count: members.length,
    expiresAt: Math.max(host.expiresAt, expiresAt),
    groupHeadline: headline,
    groupMembers: members,
  };
}

// ─── Router ────────────────────────────────────────────────────

/**
 * THR-2013 — the events in `next` that a routing pass over `previous` has not seen.
 *
 * `tickEvents` is reset each tick, but a write between ticks (a gift resolving, a mark
 * revealing) appends to the current array, so the new array still carries every event
 * already routed. Routing all of it again toasted the gift's card line twice under one
 * id — a doubled toast and a React duplicate-key error. Compared by object identity:
 * the spread keeps the same event objects, and a fresh tick's events are new objects
 * even when an id repeats. Pure; exported for tests.
 */
export function selectUnroutedEvents(
  previous: readonly TickEvent[],
  next: readonly TickEvent[],
): TickEvent[] {
  if (previous.length === 0) return [...next];
  const routed = new Set(previous);
  return next.filter(event => !routed.has(event));
}

/**
 * @param gate THR-666 threading gate. When omitted, every event routes globally —
 *   the pre-gate behaviour, kept so callers without a world graph (tests, the
 *   headless CLI) work unchanged.
 */
export function routeNotifications(
  tickEvents: TickEvent[],
  currentState: NotificationState,
  now: number,
  preferences?: NotificationPreferences,
  gate?: ThreadingGate,
): NotificationState {
  const prefs = preferences ?? DEFAULT_NOTIFICATION_PREFS;

  // Copy existing state
  const newToasts: ToastItem[] = [...currentState.toasts];
  const newAlerts: AlertItem[] = [...currentState.alerts];
  const newPopupQueue: PopupItem[] = [...currentState.popupQueue];
  const newEntityNotices: EntityNotice[] = [...(currentState.entityNotices ?? [])];

  // Track collapsing within this batch
  const toastByMessage = new Map<string, ToastItem>();
  // THR-1875: an alert is dropped only as an exact repeat of the same event. Same-kind,
  // same-tick alerts are all kept (they used to overwrite each other — a silent drop);
  // Needs you's view model coalesces such a burst into one row.
  const alertSourceIds = new Set(newAlerts.map(a => a.sourceEventId));

  for (const event of tickEvents) {
    if (!event.notification) continue;

    // Check if this event's category is disabled by preferences
    const category = eventTypeToCategory(event.type);
    const categoryPrefs = prefs[category];
    if (!categoryPrefs.enabled) continue;

    const { channel, icon, popup } = event.notification;
    const navTarget = deriveNavigationTarget(event);

    // THR-666/THR-667 threading gate. An unthreaded mortal's beat is dropped
    // outright; a threaded entity's toast is diverted to its row. The gate names
    // the row it belongs to — a mortal's or a faction's — so this site never has
    // to guess from the event's ids. The event itself is untouched either way:
    // it still reaches the tick log and the chronicle.
    const routing = gate?.resolveEventRouting(event) ?? ROUTE_GLOBAL;
    if (routing.kind === 'suppress') continue;
    if (routing.kind === 'entity' && ENTITY_DIVERTED_CHANNELS.has(channel)) {
      newEntityNotices.push({
        id: event.id,
        anchorId: routing.anchorId,
        anchorKind: routing.anchorKind,
        message: event.message,
        sphere: event.sphere,
        tick: event.tick,
        category,
        navigationTarget: navTarget,
      });
      continue;
    }

    // Determine expiry based on preference mode
    const isPermanent = categoryPrefs.mode === 'permanent';

    switch (channel) {
      case 'toast': {
        // THR-2194 (Law 49): a declared burst kind folds into the one toast of its kind
        // still on screen, so N rulers' agendas coming due read as one toast with a count.
        const group = event.notification.group;
        if (group) {
          const member: ToastGroupMember = {
            id: event.id,
            message: event.message,
            ...(navTarget ? { navigationTarget: navTarget } : {}),
            ...(event.actorId ? { actorId: event.actorId } : {}),
          };
          const at = findLiveGroupToast(newToasts, group.key, now);
          if (at >= 0) {
            const host = newToasts[at];
            const members = [...(host.groupMembers ?? [toastAsGroupMember(host)]), member];
            newToasts.splice(at, 1);
            newToasts.push(foldGroupToast(host, members, group.headline, isPermanent ? PERMANENT_TOAST_EXPIRY : now + TOAST_DURATION_MS));
          } else {
            newToasts.push({
              id: event.id,
              message: event.message,
              sphere: event.sphere,
              count: 1,
              createdTick: event.tick,
              expiresAt: isPermanent ? PERMANENT_TOAST_EXPIRY : now + TOAST_DURATION_MS,
              actorId: event.actorId,
              navigationTarget: navTarget,
              ...(event.band ? { band: event.band } : {}),
              groupKey: group.key,
              groupHeadline: group.headline,
              groupMembers: [member],
            });
          }
          break;
        }
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
            // THR-727: band-keyed accent passthrough (e.g. divine receipt toasts).
            ...(event.band ? { band: event.band } : {}),
          };
          newToasts.push(toast);
          toastByMessage.set(event.message, toast);
        }
        break;
      }
      case 'alert': {
        if (alertSourceIds.has(event.id)) break;
        alertSourceIds.add(event.id);
        newAlerts.push({
          id: event.id,
          icon: icon ?? 'discovery',
          message: event.message,
          sphere: event.sphere,
          sourceEventId: event.id,
          tick: event.tick,
          actorId: event.actorId,
          navigationTarget: navTarget,
        });
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
          eventType: event.type,
        };
        newPopupQueue.push(popupItem);
        break;
      }
    }
  }

  // THR-1875: the channel lapses by age, measured from the newest tick in this batch.
  const latestTick = tickEvents.reduce((m, e) => Math.max(m, e.tick), -Infinity);
  const trimmed = trimAlerts(newAlerts, Number.isFinite(latestTick) ? latestTick : (newAlerts.at(-1)?.tick ?? 0));
  const trimmedAtCap = (currentState.alertsTrimmedAtCap ?? 0) + trimmed.trimmedAtCap;

  return {
    toasts: capToasts(newToasts),
    alerts: trimmed.alerts,
    ...(trimmedAtCap > 0 ? { alertsTrimmedAtCap: trimmedAtCap } : {}),
    popupQueue: newPopupQueue,
    entityNotices: newEntityNotices.slice(-ENTITY_NOTICE_MAX_RETAINED),
  };
}
