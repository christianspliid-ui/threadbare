/**
 * The first-use caption store (THR-1986) — which captions are dismissed (Law 51,
 * localStorage, one key per caption), which are mounted, and which of those show.
 *
 * A UI preference, not world state: module-level like the nudge designer-view
 * store. Fail-soft: when localStorage throws, dismissal lives in memory for the
 * session (the odds legend behaves the same way).
 */

import {
  FIRST_USE_CAPTIONS,
  FIRST_USE_CAPTIONS_MAX_VISIBLE,
  FIRST_USE_CAPTION_STORE_PREFIX,
} from '../../data/first-use-captions';

export interface FirstUseCaptionSnapshot {
  readonly visible: readonly string[];
  readonly dismissed: readonly string[];
  readonly queued: readonly string[];
}

const ORDER = FIRST_USE_CAPTIONS.map(c => c.id as string);
const KNOWN = new Set(ORDER);

const dismissedInMemory = new Set<string>();
const mounted = new Map<string, number>();
const listeners = new Set<() => void>();
let warned = false;
let snapshot: FirstUseCaptionSnapshot | null = null;

function readDismissed(id: string): boolean {
  if (dismissedInMemory.has(id)) return true;
  try {
    return globalThis.localStorage?.getItem(FIRST_USE_CAPTION_STORE_PREFIX + id) === '1';
  } catch {
    return false;
  }
}

function notify(): void {
  snapshot = null;
  for (const l of listeners) l();
}

export function subscribeFirstUseCaptions(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** Visible = mounted, not dismissed, first N in table order; the rest queue. */
export function getFirstUseCaptionSnapshot(): FirstUseCaptionSnapshot {
  if (snapshot) return snapshot;
  const dismissed = ORDER.filter(readDismissed);
  const waiting = ORDER.filter(id => (mounted.get(id) ?? 0) > 0 && !dismissed.includes(id));
  snapshot = {
    visible: waiting.slice(0, FIRST_USE_CAPTIONS_MAX_VISIBLE),
    dismissed,
    queued: waiting.slice(FIRST_USE_CAPTIONS_MAX_VISIBLE),
  };
  return snapshot;
}

/** A panel that carries a caption registers it while on screen. */
export function mountFirstUseCaption(id: string): () => void {
  if (!KNOWN.has(id)) {
    if (!warned && typeof console !== 'undefined') {
      warned = true;
      console.warn(`[FirstUseCaption] no caption for surface '${id}'`);
    }
    return () => undefined;
  }
  mounted.set(id, (mounted.get(id) ?? 0) + 1);
  notify();
  return () => {
    mounted.set(id, Math.max(0, (mounted.get(id) ?? 1) - 1));
    notify();
  };
}

/** Hide a caption for good. A no-op once dismissed. */
export function dismissFirstUseCaption(id: string): void {
  if (!KNOWN.has(id) || readDismissed(id)) return;
  dismissedInMemory.add(id);
  try {
    globalThis.localStorage?.setItem(FIRST_USE_CAPTION_STORE_PREFIX + id, '1');
  } catch {
    // In memory only — the session still remembers.
  }
  notify();
}

/** Forget every dismissal (debug: repeat captures). */
export function resetFirstUseCaptions(): void {
  dismissedInMemory.clear();
  for (const id of ORDER) {
    try {
      globalThis.localStorage?.removeItem(FIRST_USE_CAPTION_STORE_PREFIX + id);
    } catch {
      // nothing stored
    }
  }
  notify();
}
