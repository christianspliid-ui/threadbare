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
  | { kind: 'journey';    journeyId: string; agentId: string };

// ─── Notification Preferences ──────────────────────────────────

export type NotificationMode = 'permanent' | 'temporary';

export type NotificationCategoryKey =
  | 'encounters' | 'movement' | 'actions' | 'social'
  | 'lifecycle' | 'economy' | 'doom' | 'journeys'
  | 'ambitions' | 'divine';

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
};

/** All category keys in display order */
export const NOTIFICATION_CATEGORY_ORDER: NotificationCategoryKey[] = [
  'encounters', 'movement', 'actions', 'social', 'lifecycle',
  'economy', 'doom', 'journeys', 'ambitions', 'divine',
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

export interface NotificationState {
  toasts: ToastItem[];
  alerts: AlertItem[];
  popupQueue: PopupItem[];
}

export const TOAST_MAX_VISIBLE = 4;
export const TOAST_DURATION_MS = 4000;
export const ALERT_MAX_VISIBLE = 12;
