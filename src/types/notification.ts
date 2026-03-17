import type { SphereName } from './index';

export type NotificationChannel = 'toast' | 'popup' | 'alert';

export type AlertIcon =
  | 'death' | 'birth' | 'doom' | 'mandate'
  | 'discovery' | 'rival' | 'dilemma' | 'harvest';

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
  /** Agent ID — if set, clicking the toast selects this agent on the map */
  actorId?: string;
}

export interface AlertItem {
  id: string;
  icon: AlertIcon;
  message: string;
  sphere?: SphereName;
  sourceEventId: string;
  tick: number;
  /** Agent ID — if set, clicking the alert selects this agent on the map */
  actorId?: string;
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
