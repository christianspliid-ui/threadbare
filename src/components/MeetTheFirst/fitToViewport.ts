/**
 * THR-1804 item 3 — the bonding hand fits the viewport (UI Law 33).
 *
 * Cold playtest round 3: the formative test beat dealt a seven-card hand into an
 * `overflow-y-auto` column, and the best-odds card sat below the fold. A meeting
 * hand runs 4–8 cards, which wrap to two rows at CARDS_PER_ROW, and two full-size
 * rows plus the setup prose and the reading panel are taller than 1080px. So the
 * beat lays its column out at natural size and, when that is taller than the
 * panel, shrinks the whole column by one zoom factor until it fits. No scroll
 * container: the player sees every card at once.
 */
import { useLayoutEffect, type DependencyList, type RefObject } from 'react';

/**
 * The smallest zoom the fit will apply. Below it, text on the cards stops being
 * comfortably readable at 1080p; a hand that would need less keeps this zoom.
 * @range 0.6–0.9
 */
export const FORMATIVE_FIT_MIN_SCALE = 0.7;

/**
 * Space ComicPanel keeps above the bonding beat's column. The panel's default
 * 30% spacer is sized for the shorter testing beat; the hand needs the height,
 * and the scene still shows through behind the column.
 */
export const FORMATIVE_TOP_SPACER = '3vh';

/** The zoom that fits `natural` px of content into `available` px, floored at `min`. */
export function fitScale(natural: number, available: number, min = FORMATIVE_FIT_MIN_SCALE): number {
  if (!(natural > 0) || !(available > 0) || natural <= available) return 1;
  return Math.max(min, Math.floor((available / natural) * 1000) / 1000);
}

/**
 * Zoom `ref`'s element so it fits its parent's height. Measures at zoom 1, then
 * writes the zoom straight to the element's style (not through React state, which
 * would take a second render to measure). Re-fits when the parent resizes or a
 * dependency changes. Fail-soft: no element, no parent, or no ResizeObserver
 * (jsdom) leaves the column at natural size.
 */
export function useFitToParentHeight(ref: RefObject<HTMLElement | null>, deps: DependencyList): void {
  useLayoutEffect(() => {
    const el = ref.current;
    const host = el?.parentElement;
    if (!el || !host) return;
    const fit = () => {
      el.style.zoom = '1';
      const scale = fitScale(el.getBoundingClientRect().height, host.clientHeight);
      el.style.zoom = String(scale);
      el.dataset.fitScale = String(scale);
    };
    fit();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => fit());
    observer.observe(host);
    return () => observer.disconnect();
    // The caller's deps decide when the content changed shape.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
