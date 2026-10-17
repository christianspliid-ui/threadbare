/**
 * planFolds — Law 57 inside one Inspector size: fit, then fold (THR-1876 § D6).
 *
 * Wide and Full show every group whole. Docked shows every group whole **unless** the page
 * would overflow the docked column's height; then it folds the groups longer than
 * `foldAfter` to that many rows plus "Show all N" — **largest group first, one at a time,
 * until the page fits** or every long group is folded. Only then does the column scroll
 * inside itself (Law 33). Pure, so it is Node-tested; the host measures.
 */

export interface FoldableGroup {
  id: string;
  /** Rows in the group. */
  total: number;
  /** Its height with every row shown. */
  fullHeight: number;
  /** Its height folded to `foldAfter` rows plus the "Show all" control. */
  foldedHeight: number;
}

export interface FoldPlan {
  /** Groups to fold, in the order they were folded. */
  folded: string[];
  /** True when folding every long group still did not fit — the column scrolls. */
  scrolls: boolean;
}

/**
 * @param fixedHeight  everything on the page that does not fold (header, body, labels)
 * @param available    the column's height
 * @param pinnedOpen   groups the player opened with "Show all" — never folded again
 */
export function planFolds(
  groups: readonly FoldableGroup[],
  fixedHeight: number,
  available: number,
  foldAfter: number,
  pinnedOpen: ReadonlySet<string> = new Set(),
): FoldPlan {
  let height = fixedHeight + groups.reduce((sum, g) => sum + g.fullHeight, 0);
  const folded: string[] = [];
  if (!Number.isFinite(available) || height <= available) return { folded, scrolls: false };
  const candidates = groups
    .filter(g => g.total > foldAfter && !pinnedOpen.has(g.id) && g.foldedHeight < g.fullHeight)
    .sort((a, b) => b.fullHeight - a.fullHeight || b.total - a.total || a.id.localeCompare(b.id));
  for (const g of candidates) {
    if (height <= available) break;
    folded.push(g.id);
    height -= g.fullHeight - g.foldedHeight;
  }
  return { folded, scrolls: height > available };
}
