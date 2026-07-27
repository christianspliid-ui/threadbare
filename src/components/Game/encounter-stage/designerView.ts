/**
 * Designer view toggle — THR-775 (WS2 interface).
 *
 * The nudge stage shows the player words. The designer view reveals the numbers
 * behind those words, plus the cards the stage withholds (`sphere_locked` /
 * `unlock_missing` / `trait_missing`) with their `NudgeBlockedCode` reasons.
 *
 * It lives in the DebugPanel, not in the stage: the plan is explicit that the
 * player surface must never grow a numbers toggle. This module is the shared
 * bit of state between the panel's checkbox and the stage that reads it — a
 * three-line store rather than a context, because exactly one boolean crosses
 * between two unrelated trees.
 *
 * Reachable headlessly as `window.__DEBUG.setNudgeDesignerView(true)`.
 */

let designerViewEnabled = false;

const listeners = new Set<() => void>();

/** Current state — the `getSnapshot` half of `useSyncExternalStore`. */
export function isNudgeDesignerViewEnabled(): boolean {
  return designerViewEnabled;
}

/** Flip the view. A no-op write does not notify, so it cannot loop. */
export function setNudgeDesignerView(enabled: boolean): void {
  if (designerViewEnabled === enabled) return;
  designerViewEnabled = enabled;
  for (const listener of listeners) listener();
}

/** Subscribe — the `subscribe` half of `useSyncExternalStore`. */
export function subscribeNudgeDesignerView(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Test seam — restores the module to its initial state. */
export function resetNudgeDesignerView(): void {
  designerViewEnabled = false;
  listeners.clear();
}
