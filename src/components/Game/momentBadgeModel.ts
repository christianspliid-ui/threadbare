/**
 * momentBadgeModel — THR-1299 slice 4
 *
 * Maps `state.pendingUndertakingMoments` onto the thread rows they belong to.
 *
 * Fourth member of the badge family — `encounterBadgeModel`, `threadTugBadgeModel`,
 * `entityNoticeBadgeModel` — and deliberately shaped like the other three, so the
 * row reads as one vocabulary in four tenses: the tug says "something is about
 * to happen", the encounter badge "something is happening", the notice "something
 * happened to them", and this one "their long work turned".
 *
 * The badge is the **recovery** route (Law 39/40), never the primary one: an
 * interrupt-tier moment already stopped the world once; a badge-tier moment
 * (a founding, a muted mortal's news, a second at-cost step) only ever badges.
 * Either way the record it counts is unacknowledged and within
 * `MOMENT_BADGE_RETENTION_TICKS`; clicking opens the same `MomentCard` the
 * interrupt opened, and nothing is cleared until that card is acknowledged —
 * a badge never destroys what it counts.
 *
 * Pure and deterministic: same queue + tick in, same badge map out.
 */

import type { UndertakingMomentClass, UndertakingMomentRecord } from '../../types/strategicAction';
import { MOMENT_BADGE_RETENTION_TICKS } from '../../data/strategic-action-constants';
import { MOMENT_CARD_CONTENT } from '../../data/moment-card-content';

// ─── Constants ─────────────────────────────────────────────────────

/** Badge count above which the label collapses to "N+" rather than an exact count. */
export const MOMENT_BADGE_COUNT_DISPLAY_MAX = 9;

/** Glyph for a turn in a long work — a checkpoint passed or failed. */
export const MOMENT_BADGE_GLYPH = '◆';

/**
 * Moment class → accent token. Setbacks carry the negative tone, finishes the
 * positive one, everything else sits on dim gold.
 * NFP #1: retune the emphasis here without touching logic.
 */
export const MOMENT_CLASS_ACCENT: Record<UndertakingMomentClass, string> = {
  started: 'var(--accent-gold-dim)',
  at_cost: 'var(--warning)',
  complication: 'var(--negative)',
  fork: 'var(--accent-gold)',
  abandoned: 'var(--negative)',
  completion: 'var(--positive)',
};

/** Tail of the screen-reader label — what the click will open. */
export const MOMENT_ARIA_OPEN_SUFFIX = 'open the moment';

// ─── Model ─────────────────────────────────────────────────────────

export interface MomentBadgeModel {
  /** Thread row this badge renders on — the actor's node id. */
  agentId: string;
  /** The record a click opens — the newest unacknowledged one. */
  primary: UndertakingMomentRecord;
  /** How many unacknowledged, unexpired records sit on this row. */
  count: number;
  /** Every counted record, oldest first. */
  records: UndertakingMomentRecord[];
  accentColor: string;
  glyph: string;
  /** Count rendered in the badge corner, or undefined for a single record. */
  countLabel?: string;
  /** Tooltip heading — the newest record's class word. */
  label: string;
  /** Tooltip body — the newest record's line, plus a count of what came before. */
  meta: string;
  /** Screen-reader label; includes the count, since the glyph is aria-hidden. */
  ariaLabel: string;
}

/** Whether a record still counts on the badge at this tick. */
export function isMomentBadgeable(record: UndertakingMomentRecord, tick: number): boolean {
  return !record.acknowledged && tick - record.tick <= MOMENT_BADGE_RETENTION_TICKS;
}

/**
 * Group unacknowledged, unexpired records by the agent they belong to.
 *
 * The newest record per row becomes `primary` — that is what the tooltip leads
 * with and what a click opens. Stable input order breaks ties, so the pick is
 * deterministic. Presentation is not a filter: an interrupt-tier record the
 * player dismissed by closing the world's veil, and a badge-tier founding, both
 * belong here — the badge counts everything the player has not yet acknowledged.
 */
export function selectMomentBadges(
  queue: readonly UndertakingMomentRecord[] | undefined,
  tick: number,
): Map<string, MomentBadgeModel> {
  const byAgent = new Map<string, UndertakingMomentRecord[]>();

  for (const record of queue ?? []) {
    if (!isMomentBadgeable(record, tick)) continue;
    const bucket = byAgent.get(record.actorId);
    if (bucket) bucket.push(record);
    else byAgent.set(record.actorId, [record]);
  }

  const badges = new Map<string, MomentBadgeModel>();
  for (const [agentId, bucket] of byAgent) {
    let primary = bucket[0];
    for (const record of bucket) {
      if (record.tick > primary.tick) primary = record;
    }

    const count = bucket.length;
    const countLabel = count > 1
      ? (count > MOMENT_BADGE_COUNT_DISPLAY_MAX ? `${MOMENT_BADGE_COUNT_DISPLAY_MAX}+` : String(count))
      : undefined;
    const others = count > 1 ? ` and ${count - 1} more` : '';
    const label = MOMENT_CARD_CONTENT[primary.momentClass].title;

    badges.set(agentId, {
      agentId,
      primary,
      count,
      records: bucket,
      accentColor: MOMENT_CLASS_ACCENT[primary.momentClass],
      glyph: MOMENT_BADGE_GLYPH,
      countLabel,
      label,
      meta: count > 1 ? `${primary.label} (and ${count - 1} more)` : primary.label,
      ariaLabel: `${label}: ${primary.label}${others} — ${MOMENT_ARIA_OPEN_SUFFIX}`,
    });
  }

  return badges;
}
