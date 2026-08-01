/**
 * entityNoticeBadgeModel — THR-666, THR-667
 *
 * Maps the threading gate's `entityNotices` onto the thread rows they belong to.
 *
 * A becoming, a complication, an ambition milestone — these are about one person,
 * and they now wait on that person's row instead of scrolling past in the global
 * toast queue. Unthreaded agents never reach this model at all: the gate drops
 * their notifications upstream, in `notificationThreadingGate`.
 *
 * THR-667 widened the anchor from an agent to any thread row, so a shift in a
 * faction's ranks lands on the faction's row in the same panel. The grouping key
 * is the row's node id either way; only the tooltip's wording changes, because
 * "a life turns" is the wrong sentence for an institution.
 *
 * Third sibling of `encounterBadgeModel` and `threadTugBadgeModel`, deliberately
 * shaped like both, so the row reads as one vocabulary in three tenses: the tug
 * says "something is about to happen", the encounter badge says "something is
 * happening", this one says "something happened to them".
 *
 * Pure and deterministic: same notices in, same badge map out.
 */

import type {
  EntityNotice, EntityNoticeAnchorKind, NotificationCategoryKey,
} from '../../types/notification';

// ─── Constants ─────────────────────────────────────────────────────

/** Badge count above which the label collapses to "N+" rather than an exact count. */
export const NOTICE_BADGE_COUNT_DISPLAY_MAX = 9;

/** Glyph for a per-agent beat waiting to be read. */
export const NOTICE_BADGE_GLYPH = '·';

/**
 * Category → accent token. Lifecycle beats carry the weight of a life changing;
 * everything else sits on the dim gold of ordinary news.
 * NFP #1: retune the emphasis here without touching logic.
 */
export const NOTICE_CATEGORY_ACCENT: Partial<Record<NotificationCategoryKey, string>> = {
  lifecycle: 'var(--accent-gold)',
  encounters: 'var(--accent-near-miss)',
  ambitions: 'var(--accent-gold-dim)',
};

/** Accent used when a notice's category has no explicit tint. */
export const NOTICE_DEFAULT_ACCENT = 'var(--accent-gold-dim)';

/** Tooltip heading per category — what kind of news this is. */
export const NOTICE_CATEGORY_LABEL: Partial<Record<NotificationCategoryKey, string>> = {
  lifecycle: 'A life turns',
  encounters: 'Something befell them',
  ambitions: 'Their ambition moves',
  actions: 'Word of their doings',
  social: 'Their standing shifts',
};

/** Heading used when a notice's category has no explicit label. */
export const NOTICE_DEFAULT_LABEL = 'Word of them';

/**
 * Faction-row overrides for the tooltip heading (THR-667).
 *
 * The agent labels are written about a person — "a life turns", "their ambition
 * moves" — and read wrong on an institution. Consulted first for faction rows;
 * anything absent here falls back to the agent map above, so adding a category
 * needs no faction entry until the agent wording actually grates.
 * NFP #1: retune faction voice here without touching logic.
 */
export const NOTICE_FACTION_CATEGORY_LABEL: Partial<Record<NotificationCategoryKey, string>> = {
  social: 'Their ranks shift',
  actions: 'Word from the order',
  lifecycle: 'The order turns',
};

/** Heading used when a faction notice's category has no explicit label. */
export const NOTICE_FACTION_DEFAULT_LABEL = 'Word from the order';

/**
 * Tail of the screen-reader label, per anchor kind — what the click will open.
 * The badge glyph is aria-hidden, so this sentence is the whole affordance for a
 * screen reader.
 */
export const NOTICE_ARIA_OPEN_SUFFIX: Record<EntityNoticeAnchorKind, string> = {
  agent: 'open their thread',
  faction: 'open the faction’s thread',
};

/** Resolve the tooltip heading for one notice, honouring its anchor kind. */
export function resolveNoticeLabel(
  category: NotificationCategoryKey,
  anchorKind: EntityNoticeAnchorKind,
): string {
  if (anchorKind === 'faction') {
    return NOTICE_FACTION_CATEGORY_LABEL[category]
      ?? NOTICE_CATEGORY_LABEL[category]
      ?? NOTICE_FACTION_DEFAULT_LABEL;
  }
  return NOTICE_CATEGORY_LABEL[category] ?? NOTICE_DEFAULT_LABEL;
}

// ─── Model ─────────────────────────────────────────────────────────

export interface EntityNoticeBadgeModel {
  /** Thread row this badge renders on — an agent or a faction node id. */
  anchorId: string;
  /** Which Threads-panel section that row sits in (THR-667). */
  anchorKind: EntityNoticeAnchorKind;
  /** The notice a click reveals — the most recent one. */
  primary: EntityNotice;
  /** How many unread notices sit on this row. */
  count: number;
  /** Every notice on this row, newest last — the tooltip lists them. */
  notices: EntityNotice[];
  /** Category tint. */
  accentColor: string;
  /** Glyph rendered inside the badge. */
  glyph: string;
  /** Count rendered in the badge corner, or undefined for a single notice. */
  countLabel?: string;
  /** Tooltip heading. */
  label: string;
  /** Tooltip body — the most recent message, plus a count of what came before. */
  meta: string;
  /** Screen-reader label; includes the count, since the badge glyph is aria-hidden. */
  ariaLabel: string;
}

// ─── Revealed notices (THR-935) ────────────────────────────────────

/**
 * Heading for the revealed list on a person's detail surface.
 *
 * The badge promised "word of them"; the surface it opens keeps that promise by
 * carrying the same words. NFP #1: retune the wording here without touching logic.
 */
export const REVEALED_NOTICES_TITLE = 'Word of them';

/** The same heading, written for an institution rather than a person (THR-667). */
export const REVEALED_NOTICES_FACTION_TITLE = 'Word from the order';

/** One notice as the detail surface renders it. */
export interface RevealedNoticeLine {
  /** Source notice id — the React key, and what a test asserts on. */
  id: string;
  /** The news itself. */
  message: string;
  /** Tick the beat happened on. Ordering key; not rendered as a field. */
  tick: number;
  /** What kind of news this is — the same heading the tooltip led with. */
  kindLabel: string;
  /** Category tint, shared with the badge that revealed it. */
  accentColor: string;
}

/**
 * The notices a badge click reveals, snapshotted at click time.
 *
 * Snapshotted rather than read live because clicking clears the underlying
 * notices — the whole point of THR-935 is that the reader sees what was cleared.
 * Holding a copy is what lets the clear stay immediate while the news stays
 * readable on the surface the click opened.
 */
export interface RevealedNoticeGroup {
  anchorId: string;
  anchorKind: EntityNoticeAnchorKind;
  /** Section heading, fit to the anchor kind. */
  title: string;
  /** Every revealed notice, newest first — most recent news reads first. */
  lines: RevealedNoticeLine[];
}

/**
 * Snapshot a badge's notices into the list its detail surface renders (THR-935).
 *
 * Newest first, which inverts the badge model's newest-last bucket: the tooltip
 * leads with the most recent notice, so the list it expands into must too.
 * Ties keep input order, so the same notices always produce the same list.
 *
 * Pure and deterministic: same badge in, same group out.
 */
export function buildRevealedNotices(badge: EntityNoticeBadgeModel): RevealedNoticeGroup {
  const lines = badge.notices
    .map((notice, index) => ({ notice, index }))
    // Sort on a copy with the original index carried, so equal ticks keep input
    // order regardless of the engine's sort stability.
    .sort((a, b) => (b.notice.tick - a.notice.tick) || (a.index - b.index))
    .map(({ notice }) => ({
      id: notice.id,
      message: notice.message,
      tick: notice.tick,
      kindLabel: resolveNoticeLabel(notice.category, badge.anchorKind),
      accentColor: NOTICE_CATEGORY_ACCENT[notice.category] ?? NOTICE_DEFAULT_ACCENT,
    }));

  return {
    anchorId: badge.anchorId,
    anchorKind: badge.anchorKind,
    title: badge.anchorKind === 'faction' ? REVEALED_NOTICES_FACTION_TITLE : REVEALED_NOTICES_TITLE,
    lines,
  };
}

// ─── Selector ──────────────────────────────────────────────────────

/**
 * Group per-entity notices by the row they belong to.
 *
 * Keyed by `anchorId`, which is a thread row's node id — an agent's or a
 * faction's. Agent and faction ids share one namespace in the graph, so one map
 * serves both sections of the panel and the row lookup stays a single `get`.
 *
 * The most recent notice per row becomes `primary` — that is what the tooltip
 * leads with. Stable input order breaks ties, so the pick is deterministic.
 */
export function selectEntityNoticeBadges(
  notices: readonly EntityNotice[] | undefined,
): Map<string, EntityNoticeBadgeModel> {
  const byAnchor = new Map<string, EntityNotice[]>();

  for (const notice of notices ?? []) {
    const bucket = byAnchor.get(notice.anchorId);
    if (bucket) bucket.push(notice);
    else byAnchor.set(notice.anchorId, [notice]);
  }

  const badges = new Map<string, EntityNoticeBadgeModel>();
  for (const [anchorId, bucket] of byAnchor) {
    let primary = bucket[0];
    for (const notice of bucket) {
      if (notice.tick > primary.tick) primary = notice;
    }

    const count = bucket.length;
    const countLabel = count > 1
      ? (count > NOTICE_BADGE_COUNT_DISPLAY_MAX ? `${NOTICE_BADGE_COUNT_DISPLAY_MAX}+` : String(count))
      : undefined;
    const others = count > 1 ? ` and ${count - 1} more` : '';
    // The primary notice's kind speaks for the row: every notice in a bucket
    // shares an anchor, and the gate stamps one kind per anchor.
    const anchorKind = primary.anchorKind;
    const label = resolveNoticeLabel(primary.category, anchorKind);

    badges.set(anchorId, {
      anchorId,
      anchorKind,
      primary,
      count,
      notices: bucket,
      accentColor: NOTICE_CATEGORY_ACCENT[primary.category] ?? NOTICE_DEFAULT_ACCENT,
      glyph: NOTICE_BADGE_GLYPH,
      countLabel,
      label,
      meta: count > 1 ? `${primary.message} (and ${count - 1} more)` : primary.message,
      ariaLabel: `${label}: ${primary.message}${others} — ${NOTICE_ARIA_OPEN_SUFFIX[anchorKind]}`,
    });
  }

  return badges;
}
