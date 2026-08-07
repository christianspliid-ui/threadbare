/**
 * usePrefersReducedMotion — Law 44 (THR-1010).
 *
 * Reports the viewer's `prefers-reduced-motion` setting so a surface built on
 * *inline* styles can honour it. A CSS `@media (prefers-reduced-motion: reduce)`
 * block cannot reach an inline `style={{ transition: ... }}` — inline wins on
 * specificity — and the encounter veil's ceremonial motion is entirely inline,
 * so the query has to be read in JS and folded into the style objects.
 *
 * Implemented with `useSyncExternalStore` (the `subscribeNudgeDesignerView`
 * pattern) so a mid-session preference change re-renders rather than waiting
 * for the next unrelated state update.
 *
 * Fail-soft (NFP #4): an environment without `matchMedia` — jsdom under vitest,
 * or SSR — reports `false`, i.e. full motion, which is the pre-existing
 * behaviour. A missing API must never throw inside a render path.
 */

import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function getQueryList(): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return null;
  }
  try {
    return window.matchMedia(QUERY);
  } catch {
    return null;
  }
}

function subscribe(onChange: () => void): () => void {
  const mql = getQueryList();
  if (!mql) return () => {};
  // Safari < 14 exposes only the deprecated addListener/removeListener pair.
  if (typeof mql.addEventListener === 'function') {
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }
  mql.addListener(onChange);
  return () => mql.removeListener(onChange);
}

function getSnapshot(): boolean {
  return getQueryList()?.matches ?? false;
}

/** Server snapshot — motion is never reduced before hydration. */
function getServerSnapshot(): boolean {
  return false;
}

/**
 * `true` when the viewer has asked the OS for reduced motion.
 *
 * Callers collapse entrance staggers, slow zooms and pulse loops to a plain
 * fade at `--anim-fast`; they never *remove* the state change, because Law 44
 * also forbids carrying information by motion alone — a beat that only
 * appeared via a stagger must still appear.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Exported for tests that need to assert the fail-soft path directly. */
export const __testables = { getQueryList, subscribe, getSnapshot, getServerSnapshot };
