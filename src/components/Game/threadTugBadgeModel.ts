/**
 * threadTugBadgeModel — THR-665
 *
 * Maps `gameState.activeThreadTugs` onto the thread rows they belong to.
 *
 * A tug is the shaping-tier "something is about to happen" signal. It used to
 * render only as a vibration on the map's thread lines — a presentation no
 * player ever perceived — and attending it was a hidden cost on plain agent
 * selection. Both are gone: the tug now surfaces as an explicit badge on the
 * agent's row, and attending is a deliberate click that states its price.
 *
 * Sibling of `encounterBadgeModel` and deliberately shaped like it, so both
 * badges are the same primitive in two states: the encounter badge says
 * "something happened", the tug badge says "something is about to".
 *
 * Pure and deterministic: same tugs + pool in, same badge map out.
 */

import type { ThreadTug } from '../../types/attention';
import type { CourtPosition } from '../../types/influence';
import { computeAttendCost } from '../../engine/attentionPool';

// ─── Constants ─────────────────────────────────────────────────────

/** Badge count above which the label collapses to "N+" rather than an exact count. */
export const TUG_BADGE_COUNT_DISPLAY_MAX = 9;

/** Glyph for an unattended tug — a wave travelling the thread. */
export const TUG_BADGE_GLYPH = '∿';

/**
 * Threat level → accent token. An escalating ramp across existing semantic
 * tokens, so urgency reads without any hardcoded colour.
 * NFP #1: retune the urgency ramp here without touching logic.
 */
export const TUG_THREAT_ACCENT: Record<string, string> = {
  moderate: 'var(--accent-near-miss)',
  hard:     'var(--warning)',
  deadly:   'var(--negative)',
};

/** Accent used when a tug's threat level is unrecognised. */
export const TUG_DEFAULT_ACCENT = 'var(--accent-near-miss)';

/**
 * Court position used when a tug somehow carries `dormant`.
 * Dormant agents should not generate tugs; `computeAttendCost` rejects the type.
 */
const TUG_FALLBACK_COURT_POSITION: Exclude<CourtPosition, 'dormant'> = 'retinue';

// ─── Model ─────────────────────────────────────────────────────────

export interface ThreadTugBadgeModel {
  /** Thread row this badge renders on. */
  agentId: string;
  /** The tug a click attends — the most urgent one. */
  primary: ThreadTug;
  /** How many unattended tugs sit on this row. */
  count: number;
  /** Attention pool cost of attending `primary`. */
  attendCost: number;
  /** False when the pool cannot cover `attendCost` — the badge renders disabled. */
  affordable: boolean;
  /** Threat-level tint. */
  accentColor: string;
  /** Glyph rendered inside the badge. */
  glyph: string;
  /** Count rendered in the badge corner, or undefined for a single tug. */
  countLabel?: string;
  /** Tooltip heading. */
  label: string;
  /** Tooltip body — threat and the attention price. */
  meta: string;
  /** Screen-reader label; includes the cost, since the badge glyph is aria-hidden. */
  ariaLabel: string;
}

// ─── Helpers ───────────────────────────────────────────────────────

/** Attention cost of attending one tug, fail-soft on a dormant court position. */
export function tugAttendCost(tug: ThreadTug): number {
  const safePosition = tug.courtPosition !== 'dormant'
    ? tug.courtPosition
    : TUG_FALLBACK_COURT_POSITION;
  return computeAttendCost(tug.threatLevel, safePosition);
}

/**
 * Cost as the player reads it.
 *
 * Costs are a base times a court multiplier, so they land on fractions and can
 * carry float noise (0.75, or 1.2000000000000002). Round for display only — the
 * affordability check uses the exact value.
 */
export function formatAttendCost(cost: number): string {
  return String(Math.round(cost * 100) / 100);
}

/**
 * Is this tug still asking for the player's attention?
 *
 * Attended tugs have been paid for. Expiry is the engine's job
 * (`phaseAttention` drops them) — the badge only reads what is live.
 */
export function isTugBadgeWorthy(tug: ThreadTug): boolean {
  return !tug.attended;
}

// ─── Selector ──────────────────────────────────────────────────────

/**
 * Group unattended thread tugs by the row they belong to.
 *
 * The most urgent tug per row becomes `primary` — that is what a click attends.
 * Urgency is the curator's own score, so the badge agrees with the engine about
 * which tug matters; newest wins ties for a deterministic pick.
 *
 * @param tugs          `gameState.activeThreadTugs`.
 * @param attentionPool Current pool, used to mark unaffordable tugs.
 */
export function selectThreadTugBadges(
  tugs: readonly ThreadTug[] | undefined,
  attentionPool: number,
): Map<string, ThreadTugBadgeModel> {
  const byAgent = new Map<string, ThreadTug[]>();

  for (const tug of tugs ?? []) {
    if (!isTugBadgeWorthy(tug)) continue;
    const bucket = byAgent.get(tug.agentId);
    if (bucket) bucket.push(tug);
    else byAgent.set(tug.agentId, [tug]);
  }

  const badges = new Map<string, ThreadTugBadgeModel>();
  for (const [agentId, bucket] of byAgent) {
    let primary = bucket[0];
    for (const tug of bucket) {
      if (
        tug.curationScore > primary.curationScore ||
        (tug.curationScore === primary.curationScore && tug.createdTick > primary.createdTick)
      ) {
        primary = tug;
      }
    }

    const count = bucket.length;
    const attendCost = tugAttendCost(primary);
    const affordable = attentionPool >= attendCost;
    const countLabel = count > 1
      ? (count > TUG_BADGE_COUNT_DISPLAY_MAX ? `${TUG_BADGE_COUNT_DISPLAY_MAX}+` : String(count))
      : undefined;
    const others = count > 1 ? ` and ${count - 1} more` : '';
    const costPhrase = `attend for ${formatAttendCost(attendCost)} attention`;
    const meta = affordable
      ? `${primary.threatLevel} · ${costPhrase}`
      : `${primary.threatLevel} · ${costPhrase} · not enough attention`;

    badges.set(agentId, {
      agentId,
      primary,
      count,
      attendCost,
      affordable,
      accentColor: TUG_THREAT_ACCENT[primary.threatLevel] ?? TUG_DEFAULT_ACCENT,
      glyph: TUG_BADGE_GLYPH,
      countLabel,
      label: 'The thread pulls',
      meta,
      ariaLabel: affordable
        ? `The thread pulls, ${primary.threatLevel}${others} — ${costPhrase}`
        : `The thread pulls, ${primary.threatLevel}${others} — ${costPhrase}, not enough attention`,
    });
  }

  return badges;
}
