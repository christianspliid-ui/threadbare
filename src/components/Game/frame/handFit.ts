/**
 * handFit — the god rail hand's fit rule (THR-1894, frame plan § F6; UI Law 57).
 *
 * 1. **Whole** while every card row fits the hand's free height: nothing cut, nothing scrolls.
 * 2. **Grouped** at the limit: the cards group by paying sphere, one group open at a time.
 * 3. An open group taller than the free height scrolls inside the hand region (the rail's
 *    own limit); the page never scrolls (Law 33).
 *
 * A hysteresis stops the mode flipping on a one-pixel change: the hand groups as soon as
 * the rows overflow, and returns to whole only once they fit with `HAND_FIT_HYSTERESIS_PX`
 * to spare. Pure, so the rule is tested in Node.
 *
 * ─── Constants ───────────────────────────────────────────────────
 * | HAND_FIT_HYSTERESIS_PX | 24 | Room needed beyond the exact fit before grouped returns to whole |
 * | HAND_REST_OPACITY | 0.45 | The hand's rows while a moment is open |
 * | HAND_ROW_EST_PX | 52 | A two-line row at the 16 px floor (1.25 line height), before a row has been measured |
 * | HAND_ROW_GAP_PX | 6 | The gap between rows |
 */
export const HAND_FIT_HYSTERESIS_PX = 24;
export const HAND_REST_OPACITY = 0.45;
export const HAND_ROW_EST_PX = 52;
export const HAND_ROW_GAP_PX = 6;

export type HandFitMode = 'whole' | 'grouped';

/** The height the whole hand needs: every row, and the gaps between them. */
export function handWholeHeight(cards: number, rowPx: number = HAND_ROW_EST_PX, gapPx: number = HAND_ROW_GAP_PX): number {
  if (cards <= 0) return 0;
  return cards * rowPx + (cards - 1) * gapPx;
}

/**
 * The next fit mode. `freePx` null (no `ResizeObserver`, jsdom) keeps the hand whole:
 * the region scrolls inside itself, the page does not (fail-soft table).
 */
export function nextHandFitMode(
  prev: HandFitMode,
  neededPx: number,
  freePx: number | null,
  hysteresisPx: number = HAND_FIT_HYSTERESIS_PX,
): HandFitMode {
  if (freePx === null || !Number.isFinite(freePx) || freePx <= 0) return 'whole';
  if (neededPx > freePx) return 'grouped';
  if (prev === 'grouped' && neededPx > freePx - hysteresisPx) return 'grouped';
  return 'whole';
}

/**
 * Which group is open in grouped mode: the armed card's group, else the group the
 * player last opened (if it still exists), else the first.
 */
export function openHandGroup(
  groups: readonly string[],
  armedGroup: string | null,
  remembered: string | null,
): string | null {
  if (groups.length === 0) return null;
  if (armedGroup && groups.includes(armedGroup)) return armedGroup;
  if (remembered && groups.includes(remembered)) return remembered;
  return groups[0];
}
