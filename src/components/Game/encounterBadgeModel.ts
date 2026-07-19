/**
 * encounterBadgeModel — THR-664
 *
 * Maps `gameState.encounterNotifications` onto the thread rows they belong to.
 *
 * Encounter activity is anchored to the entity it is about: every pending
 * notification surfaces as a badge on that agent's persistent row in the Threads
 * panel, never as a transient toast in a global queue. A single notification can
 * anchor to several rows (actor + agent target) via `participantIds` — it is
 * never duplicated per participant.
 *
 * Pure and deterministic: same notifications in, same badge map out.
 */

import type { EncounterNotification } from '../../types/encounterVisibility';
import { outcomeBandWord } from '../../data/outcome-band-content';
import { bandAccentColor } from './outcomeBandAccent';

// ─── Constants ─────────────────────────────────────────────────────

/** Badge count above which the label collapses to "N+" rather than an exact count. */
export const BADGE_COUNT_DISPLAY_MAX = 9;

/** Accent used when a notification carries no outcome band. */
export const BADGE_DEFAULT_ACCENT = 'var(--accent-gold)';

/** Glyph for a live encounter beat awaiting the player. */
export const BADGE_GLYPH_ACTIVE = '!';

/** Glyph for a concluded encounter whose aftermath has not been read. */
export const BADGE_GLYPH_AFTERMATH = '✦';

// ─── Model ─────────────────────────────────────────────────────────

export interface EncounterBadgeModel {
  /** Thread row this badge renders on. */
  agentId: string;
  /** How many pending notifications anchor to this row. */
  count: number;
  /** The notification a click opens — the most recent one. */
  primary: EncounterNotification;
  /** Live beat vs. concluded aftermath — drives glyph and wording. */
  kind: 'encounter' | 'aftermath';
  /** Outcome-band tint, or the gold default. */
  accentColor: string;
  /** Glyph rendered inside the badge. */
  glyph: string;
  /** Count rendered in the badge corner, or undefined for a single notification. */
  countLabel?: string;
  /** Encounter name — tooltip heading. */
  label: string;
  /** "step 2 of 4 · faltered" / "concluded · held" — tooltip body. */
  meta: string;
  /** Screen-reader label; includes the count, since the badge itself is aria-hidden. */
  ariaLabel: string;
}

// ─── Helpers ───────────────────────────────────────────────────────

/**
 * Step/conclusion meta line for a notification.
 *
 * Same strings the retired encounter toast card used, so the badge tooltip reads
 * exactly as the toast did.
 */
export function buildEncounterNotificationMeta(notif: EncounterNotification): string {
  const bandWord = notif.outcomeBand ? outcomeBandWord(notif.outcomeBand) : undefined;
  if (notif.kind === 'aftermath') {
    return bandWord ? `concluded · ${bandWord}` : 'concluded';
  }
  const stepNum = (notif.stepIndex ?? 0) + 1;
  const stepPart = notif.totalSteps ? `step ${stepNum} of ${notif.totalSteps}` : `step ${stepNum}`;
  return bandWord ? `${stepPart} · ${bandWord}` : stepPart;
}

/**
 * Does this notification still want the player's attention?
 *
 * Resolved notifications are done. Viewed ones have been opened at least once —
 * including aftermath, which stays badged until it is read.
 */
export function isBadgeWorthy(notif: EncounterNotification): boolean {
  return !notif.resolved && !notif.viewed;
}

/** Rows a notification anchors to. Pre-THR-664 records carry only `agentId`. */
export function notificationAnchorIds(notif: EncounterNotification): string[] {
  const ids = notif.participantIds?.length ? notif.participantIds : [notif.agentId];
  return Array.from(new Set(ids));
}

// ─── Selector ──────────────────────────────────────────────────────

/**
 * Group pending encounter notifications by the thread row they belong to.
 *
 * A notification anchored to two participants appears in both rows' badges as the
 * same object. The most recent notification per row becomes `primary` — that is
 * what a click opens.
 */
export function selectEncounterBadges(
  notifications: readonly EncounterNotification[] | undefined,
): Map<string, EncounterBadgeModel> {
  const byAgent = new Map<string, EncounterNotification[]>();

  for (const notif of notifications ?? []) {
    if (!isBadgeWorthy(notif)) continue;
    for (const anchorId of notificationAnchorIds(notif)) {
      const bucket = byAgent.get(anchorId);
      if (bucket) bucket.push(notif);
      else byAgent.set(anchorId, [notif]);
    }
  }

  const badges = new Map<string, EncounterBadgeModel>();
  for (const [agentId, bucket] of byAgent) {
    // Most recent wins; stable index order breaks ties so the pick is deterministic.
    let primary = bucket[0];
    for (const notif of bucket) {
      if (notif.createdTick > primary.createdTick) primary = notif;
    }

    const kind = primary.kind === 'aftermath' ? 'aftermath' : 'encounter';
    const meta = buildEncounterNotificationMeta(primary);
    const count = bucket.length;
    const countLabel = count > 1
      ? (count > BADGE_COUNT_DISPLAY_MAX ? `${BADGE_COUNT_DISPLAY_MAX}+` : String(count))
      : undefined;
    const others = count > 1 ? ` and ${count - 1} more` : '';

    badges.set(agentId, {
      agentId,
      count,
      primary,
      kind,
      accentColor: bandAccentColor(primary.outcomeBand, BADGE_DEFAULT_ACCENT),
      glyph: kind === 'aftermath' ? BADGE_GLYPH_AFTERMATH : BADGE_GLYPH_ACTIVE,
      countLabel,
      label: primary.encounterName,
      meta,
      ariaLabel: kind === 'aftermath'
        ? `${primary.encounterName} concluded${others} — open aftermath`
        : `${primary.encounterName}, ${meta}${others} — open encounter`,
    });
  }

  return badges;
}
