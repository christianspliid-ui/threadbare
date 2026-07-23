import type { SphereName } from './index';
import type { EncounterNotification } from './encounterVisibility';

export type NotificationChannel = 'toast' | 'popup' | 'alert';

export type AlertIcon =
  | 'death' | 'birth' | 'doom' | 'mandate'
  | 'discovery' | 'rival' | 'dilemma' | 'harvest' | 'revelation'
  | 'social' | 'faction' | 'trust';

// ─── Navigation Targets ────────────────────────────────────────

/** Where clicking a notification should navigate the player */
export type NavigationTarget =
  | { kind: 'agent';      agentId: string }
  | { kind: 'encounter';  encounterId: string; encounterNotification?: EncounterNotification }
  | { kind: 'hex';        col: number; row: number }
  | { kind: 'location';   locationNodeId: string }
  | { kind: 'faction';    factionId: string }
  | { kind: 'journey';    journeyId: string; agentId: string }
  | { kind: 'receipt';    receiptId: string };

// ─── Notification Preferences ──────────────────────────────────

export type NotificationMode = 'permanent' | 'temporary';

export type NotificationCategoryKey =
  | 'encounters' | 'movement' | 'actions' | 'social'
  | 'lifecycle' | 'economy' | 'doom' | 'journeys'
  | 'ambitions' | 'divine' | 'discovery';

export interface NotificationCategoryPrefs {
  enabled: boolean;
  mode: NotificationMode;
}

export type NotificationPreferences = Record<NotificationCategoryKey, NotificationCategoryPrefs>;

/** Display names for notification categories */
export const NOTIFICATION_CATEGORY_LABELS: Record<NotificationCategoryKey, string> = {
  encounters: 'Encounters',
  movement:   'Agent Movement',
  actions:    'Agent Actions',
  social:     'Social & Factions',
  lifecycle:  'Births & Deaths',
  economy:    'Economy',
  doom:       'Doom & Threats',
  journeys:   'Journeys',
  ambitions:  'Ambitions',
  divine:     'Divine Interventions',
  discovery:  'Discoveries',
};

/** All category keys in display order */
export const NOTIFICATION_CATEGORY_ORDER: NotificationCategoryKey[] = [
  'encounters', 'movement', 'actions', 'social', 'lifecycle',
  'economy', 'doom', 'journeys', 'ambitions', 'divine', 'discovery',
];

/** Shipped defaults for a fresh game */
export const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  encounters: { enabled: true, mode: 'temporary' },
  movement:   { enabled: true, mode: 'temporary' },
  actions:    { enabled: true, mode: 'temporary' },
  social:     { enabled: true, mode: 'permanent' },
  lifecycle:  { enabled: true, mode: 'permanent' },
  economy:    { enabled: true, mode: 'temporary' },
  doom:       { enabled: true, mode: 'permanent' },
  journeys:   { enabled: true, mode: 'temporary' },
  ambitions:  { enabled: true, mode: 'temporary' },
  divine:     { enabled: true, mode: 'temporary' },
  discovery:  { enabled: true, mode: 'permanent' },
};

/** localStorage key for cross-session notification preference persistence */
export const NOTIFICATION_PREFS_STORAGE_KEY = 'tfws-notification-prefs';

// ─── Notification Items ────────────────────────────────────────

export interface PopupChoice {
  label: string;
  effect: string;
  tooltip?: string;
}

export interface NotificationDirective {
  channel: NotificationChannel;
  icon?: AlertIcon;
  popup?: {
    title: string;
    body: string;
    art?: string;
    choices?: PopupChoice[];
  };
}

/**
 * Structured encounter-notification card (THR-636). When present on a ToastItem,
 * ToastStack renders this three-line card instead of the raw `message` string,
 * so the player sees "whose encounter, how far, how it's going" at a glance.
 */
export interface EncounterToastCard {
  /** Agent whose encounter this is — rendered plain and prominent. */
  agentName: string;
  /** Encounter template name. */
  encounterName: string;
  /** Meta line, e.g. "step 2 of 4 · faltered" (beat) or "concluded · held" (aftermath). */
  meta: string;
  /** First-sentence tease of the prose, clamped to NOTIF_TEASER_MAX_CHARS. */
  tease: string;
}

export interface ToastItem {
  id: string;
  message: string;
  sphere?: SphereName;
  count: number;
  createdTick: number;
  expiresAt: number;
  /** Agent ID — if set, clicking the toast selects this agent on the map (legacy — prefer navigationTarget) */
  actorId?: string;
  /** Custom click handler — if set, overrides default agent-select behavior (legacy — prefer navigationTarget) */
  onClick?: () => void;
  /** Where clicking should navigate — preferred over actorId/onClick when present */
  navigationTarget?: NavigationTarget;
  /** Outcome band for band-keyed accent styling (e.g. 'fortunate', 'setback'). Absent → default gold accent. */
  band?: string;
  /** THR-636 structured encounter card — when set, ToastStack renders it instead of `message`. */
  encounterCard?: EncounterToastCard;
}

export interface AlertItem {
  id: string;
  icon: AlertIcon;
  message: string;
  sphere?: SphereName;
  sourceEventId: string;
  tick: number;
  /** Agent ID — if set, clicking the alert selects this agent on the map (legacy — prefer navigationTarget) */
  actorId?: string;
  /** Where clicking should navigate — preferred over actorId when present */
  navigationTarget?: NavigationTarget;
}

export interface PopupItem {
  id: string;
  title: string;
  body: string;
  art?: string;
  sphere?: SphereName;
  choices?: PopupChoice[];
  sourceEventId: string;
  tick: number;
}

/**
 * A threaded agent's own beat, waiting on that agent's row (THR-666).
 *
 * Personality becomings, complications, ambition milestones, lifecycle beats and
 * rarity graduations used to toast globally. They are about one person, so they
 * now collect on that person's card in the Threads panel — the same place their
 * encounters and tugs surface — instead of scrolling past in a shared queue.
 */
export interface EntityNotice {
  /** Source TickEvent id. */
  id: string;
  /** Thread row this notice belongs to. */
  agentId: string;
  message: string;
  sphere?: SphereName;
  tick: number;
  /** Category the event routed under — drives the notice's glyph. */
  category: NotificationCategoryKey;
  /** Where clicking should navigate — normally the agent themselves. */
  navigationTarget?: NavigationTarget;
}

export interface NotificationState {
  toasts: ToastItem[];
  alerts: AlertItem[];
  popupQueue: PopupItem[];
  /**
   * Per-agent beats diverted to thread rows by the threading gate (THR-666).
   * Optional so every pre-THR-666 construction site stays valid; the router
   * always returns it populated.
   */
  entityNotices?: EntityNotice[];
}

/**
 * Cap on retained per-agent notices (THR-666). A row badge is a "look here"
 * signal, not an archive — the chronicle keeps the full history.
 */
export const ENTITY_NOTICE_MAX_RETAINED = 60;

export const TOAST_MAX_VISIBLE = 4;
export const TOAST_DURATION_MS = 4000;
export const ALERT_MAX_VISIBLE = 12;
/** Multiplier applied to TOAST_DURATION_MS for encounter toasts (they last longer). THR-636 names the former magic `* 2`. */
export const ENCOUNTER_TOAST_DURATION_MULT = 2;
/** Max characters for the encounter card's one-line prose tease before ellipsis. THR-636. */
export const NOTIF_TEASER_MAX_CHARS = 90;
