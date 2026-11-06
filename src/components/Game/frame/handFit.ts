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
 * | HAND_ROW_EST_PX | 33 | A one-line row at the 16 px floor (1.25 line height), before a row has been measured (THR-2177; was 52 for the two-line row) |
 * | HAND_ROW_GAP_PX | 6 | The gap between rows |
 * | HAND_ROW_PRICE_GAP_PX | 6 | The gap between a card's name and its price on the one-line row (THR-2177) |
 * | HAND_ROW_PADDING | '4px 6px 4px 8px' | A card row's padding; the 4 px it frees lets the longest name and price share one line (THR-2177) |
 * | GOD_RAIL_HAND_MIN_ROWS | 3 | Card rows the hand always keeps, whatever the folded rows do (THR-2177) |
 * | HAND_CHROME_EST_PX | 70 | The hand's header, core-verb row and gaps, before they have been measured (THR-2177) |
 */
export const HAND_FIT_HYSTERESIS_PX = 24;
export const HAND_REST_OPACITY = 0.45;
export const HAND_ROW_EST_PX = 33;
export const HAND_ROW_GAP_PX = 6;
export const HAND_ROW_PRICE_GAP_PX = 6;
export const HAND_ROW_PADDING = '4px 6px 4px 8px';
export const GOD_RAIL_HAND_MIN_ROWS = 3;
export const HAND_CHROME_EST_PX = 70;

export type HandFitMode = 'whole' | 'grouped';

/** The height the whole hand needs: every row, and the gaps between them. */
export function handWholeHeight(cards: number, rowPx: number = HAND_ROW_EST_PX, gapPx: number = HAND_ROW_GAP_PX): number {
  if (cards <= 0) return 0;
  return cards * rowPx + (cards - 1) * gapPx;
}

/**
 * THR-2177 — the hand's floor: its chrome (header, rest line when shown, core verbs and
 * the gaps between them) plus `minRows` whole card rows. The folded rows give way before
 * the hand drops below it (Law 57). Non-finite or negative inputs fall back to the
 * estimates, so the floor is never NaN (fail-soft).
 */
export function handFloorPx(
  rowPx: number = HAND_ROW_EST_PX,
  gapPx: number = HAND_ROW_GAP_PX,
  chromePx: number = HAND_CHROME_EST_PX,
  minRows: number = GOD_RAIL_HAND_MIN_ROWS,
): number {
  const row = Number.isFinite(rowPx) && rowPx > 0 ? rowPx : HAND_ROW_EST_PX;
  const gap = Number.isFinite(gapPx) && gapPx >= 0 ? gapPx : HAND_ROW_GAP_PX;
  const chrome = Number.isFinite(chromePx) && chromePx >= 0 ? chromePx : HAND_CHROME_EST_PX;
  return Math.ceil(chrome + handWholeHeight(Math.max(0, minRows), row, gap));
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
