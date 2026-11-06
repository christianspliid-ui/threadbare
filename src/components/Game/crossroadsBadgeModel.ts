/**
 * crossroadsBadgeModel — the thread row's torn badge (THR-1928; plan
 * `Docs/plans/2026-10-14-thr-1926-the-crossroads.md` § UI pillar). Sibling of
 * `threadTugBadgeModel`.
 *
 * A threaded mortal whose reading says *torn* — the second road within
 * `CROSSROADS_TORN_RATIO` of the first — carries the badge, from the same snapshot field
 * and the same `settledness` function the Crossroads row words, so the badge and the row
 * say "torn" together (PC-6). It shows only while the reading is open to the god (the
 * row's own gate, `crossroadsReadable`) and no lean is held. It is a badge, never an
 * interrupt (Law 15): it is not in `interruptRegistry`; clicking opens the person's page.
 *
 * Pure and deterministic: same state in, same badge map out.
 */
import type { GameState } from '../../types/gameState';
import type { IconName } from '../../data/icons/iconRegistry';
import { ICON_FOR_THREAD_ROW_MARK } from '../../data/icons/conceptIcons';
import { readCrossroadsLean, readCrossroadsSnapshot, settledness } from '../../engine/crossroads';
import { crossroadsReadable } from '../../engine/views/subjects/crossroadsRow';
import { CROSSROADS_TORN_BADGE, fillCrossroadsLine } from '../../data/crossroads-content';
import { UI_TOOLTIPS } from '../../data/ui-content';

/** The torn badge's glyph: a road (THR-1928). */
export const CROSSROADS_BADGE_ICON: IconName = ICON_FOR_THREAD_ROW_MARK['badge-torn'];
/** The badge's accent — the near-miss amber the tug badge rests on (a pull, not a threat). */
export const CROSSROADS_BADGE_ACCENT = 'var(--accent-near-miss)';
/** The tooltip registry entry the badge explains itself with (Law 17). */
export const CROSSROADS_BADGE_TOOLTIP_ID = 'ui.crossroads.torn_badge';

export interface CrossroadsBadgeModel {
  agentId: string;
  icon: IconName;
  accentColor: string;
  /** The word: "Torn". */
  label: string;
  /** The tooltip body. */
  meta: string;
  ariaLabel: string;
}

/** The badge for one mortal, or null when they are not torn (or the reading is closed). */
export function crossroadsBadgeFor(state: GameState, agentId: string): CrossroadsBadgeModel | null {
  try {
    if (!crossroadsReadable(state, agentId)) return null;
    const node = state.graph.getNode(agentId);
    if (!node) return null;
    if (readCrossroadsLean(node.properties.crossroadsLean)) return null;
    if (settledness(readCrossroadsSnapshot(node.properties.crossroads)) !== 'torn') return null;
    return {
      agentId,
      icon: CROSSROADS_BADGE_ICON,
      accentColor: CROSSROADS_BADGE_ACCENT,
      label: CROSSROADS_TORN_BADGE.label,
      meta: UI_TOOLTIPS[CROSSROADS_BADGE_TOOLTIP_ID]?.desc ?? '',
      ariaLabel: fillCrossroadsLine(CROSSROADS_TORN_BADGE.ariaLabel, { name: node.name }),
    };
  } catch {
    return null; // NFP #4: a malformed reading draws no badge.
  }
}

/** Badges for the threaded agents, keyed by agent id. At most one per row. */
export function selectCrossroadsBadges(state: GameState, agentIds: readonly string[]): Map<string, CrossroadsBadgeModel> {
  const out = new Map<string, CrossroadsBadgeModel>();
  for (const id of agentIds) {
    const badge = crossroadsBadgeFor(state, id);
    if (badge) out.set(id, badge);
  }
  return out;
}
