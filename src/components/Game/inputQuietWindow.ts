/**
 * THR-2197 — what counts as the player's hand being busy, for the quiet window that
 * holds arrivals (`INTERRUPT_QUIET_AFTER_INPUT_MS`), the world-opened chapter hold
 * (THR-2053) and the gift-delivery hold (THR-1809).
 *
 * THR-1809 stamped only `pointerdown` and `keydown`, so a player who hovered, read or
 * scrolled toward a button for the window's length got no hold, and a popup mounted
 * under the next click or took the scroll (cold playtest round 7). A wheel or a pointer
 * move now stamps too. `scroll` is deliberately absent: panels scroll themselves as the
 * world writes to them (the chronicle), and that is not the player's hand.
 *
 * Capture phase + passive: the listeners only stamp, never stop or delay the event.
 */

/** Events that stamp on every firing. */
export const QUIET_WINDOW_STAMP_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchmove'] as const;

/** Events that fire continuously; they stamp at most once per `QUIET_WINDOW_MOVE_THROTTLE_MS`. */
export const QUIET_WINDOW_THROTTLED_EVENTS = ['pointermove'] as const;

/**
 * Minimum wall-clock gap between two stamps from a throttled event. Far below the
 * 2.5 s quiet window, so the window still ends within ~250 ms of the hand stopping.
 */
export const QUIET_WINDOW_MOVE_THROTTLE_MS = 250;

/**
 * Listen on `target` and call `onStamp(now)` for each counted input. Returns the
 * detach function. `now` is injectable for tests.
 */
export function installQuietWindowStamp(
  target: Pick<EventTarget, 'addEventListener' | 'removeEventListener'>,
  onStamp: (at: number) => void,
  now: () => number = Date.now,
): () => void {
  const opts: AddEventListenerOptions = { capture: true, passive: true };
  let lastThrottledAt = -Infinity;
  const stamp = () => { onStamp(now()); };
  const stampThrottled = () => {
    const at = now();
    if (at - lastThrottledAt < QUIET_WINDOW_MOVE_THROTTLE_MS) return;
    lastThrottledAt = at;
    onStamp(at);
  };
  for (const type of QUIET_WINDOW_STAMP_EVENTS) target.addEventListener(type, stamp, opts);
  for (const type of QUIET_WINDOW_THROTTLED_EVENTS) target.addEventListener(type, stampThrottled, opts);
  return () => {
    for (const type of QUIET_WINDOW_STAMP_EVENTS) target.removeEventListener(type, stamp, opts);
    for (const type of QUIET_WINDOW_THROTTLED_EVENTS) target.removeEventListener(type, stampThrottled, opts);
  };
}
