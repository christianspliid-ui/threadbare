/**
 * entityNoticeBadgeModel — THR-666
 *
 * Maps the threading gate's `entityNotices` onto the thread rows they belong to.
 *
 * A becoming, a complication, an ambition milestone — these are about one person,
 * and they now wait on that person's row instead of scrolling past in the global
 * toast queue. Unthreaded agents never reach this model at all: the gate drops
 * their notifications upstream, in `notificationThreadingGate`.
 *
 * Third sibling of `encounterBadgeModel` and `threadTugBadgeModel`, deliberately
 * shaped like both, so the row reads as one vocabulary in three tenses: the tug
 * says "something is about to happen", the encounter badge says "something is
 * happening", this one says "something happened to them".
 *
 * Pure and deterministic: same notices in, same badge map out.
 */

import type { EntityNotice, NotificationCategoryKey } from '../../types/notification';

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

// ─── Model ─────────────────────────────────────────────────────────

export interface EntityNoticeBadgeModel {
  /** Thread row this badge renders on. */
  agentId: string;
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

// ─── Selector ──────────────────────────────────────────────────────

/**
 * Group per-agent notices by the row they belong to.
 *
 * The most recent notice per row becomes `primary` — that is what the tooltip
 * leads with. Stable input order breaks ties, so the pick is deterministic.
 */
export function selectEntityNoticeBadges(
  notices: readonly EntityNotice[] | undefined,
): Map<string, EntityNoticeBadgeModel> {
  const byAgent = new Map<string, EntityNotice[]>();

  for (const notice of notices ?? []) {
    const bucket = byAgent.get(notice.agentId);
    if (bucket) bucket.push(notice);
    else byAgent.set(notice.agentId, [notice]);
  }

  const badges = new Map<string, EntityNoticeBadgeModel>();
  for (const [agentId, bucket] of byAgent) {
    let primary = bucket[0];
    for (const notice of bucket) {
      if (notice.tick > primary.tick) primary = notice;
    }

    const count = bucket.length;
    const countLabel = count > 1
      ? (count > NOTICE_BADGE_COUNT_DISPLAY_MAX ? `${NOTICE_BADGE_COUNT_DISPLAY_MAX}+` : String(count))
      : undefined;
    const others = count > 1 ? ` and ${count - 1} more` : '';
    const label = NOTICE_CATEGORY_LABEL[primary.category] ?? NOTICE_DEFAULT_LABEL;

    badges.set(agentId, {
      agentId,
      primary,
      count,
      notices: bucket,
      accentColor: NOTICE_CATEGORY_ACCENT[primary.category] ?? NOTICE_DEFAULT_ACCENT,
      glyph: NOTICE_BADGE_GLYPH,
      countLabel,
      label,
      meta: count > 1 ? `${primary.message} (and ${count - 1} more)` : primary.message,
      ariaLabel: `${label}: ${primary.message}${others} — open their thread`,
    });
  }

  return badges;
}
