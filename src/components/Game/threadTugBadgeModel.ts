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

import type { AttentionVisualState, ThreadTug } from '../../types/attention';
import { getAttentionVisualState, spendAttention, tugAttendCost } from '../../engine/attentionPool';
import { resourceWord } from '../../engine/phases/regionalMonopolies';
import { ATTENTION_BASE_CAPACITY } from '../../data/attention-constants';
import type { IconName } from '../../data/icons/iconRegistry';
import { ICON_FOR_THREAD_ROW_MARK } from '../../data/icons/conceptIcons';

// ─── Constants ─────────────────────────────────────────────────────

/** Badge count above which the label collapses to "N+" rather than an exact count. */
export const TUG_BADGE_COUNT_DISPLAY_MAX = 9;

/** Icon for an unattended tug on the thread (THR-1906). */
export const TUG_BADGE_ICON: IconName = ICON_FOR_THREAD_ROW_MARK['badge-tug'];

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
 * THR-2062 C2: the gauge's own word for the pool after paying (one ladder, Law 43).
 * Focused has no word, so a look-in that leaves the god Focused says only "look in".
 */
export const TUG_AFTER_STATE_WORD: Record<AttentionVisualState, string> = {
  focused:     '',
  busy:        'Busy',
  strained:    'Strained',
  overwhelmed: 'Overwhelmed',
};

/** THR-2062 C2: the badge's reason when the pool cannot pay, before the click. */
export const TUG_UNAFFORDABLE_PHRASE = 'you cannot spare the attention';

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
  icon: IconName;
  /** Count rendered in the badge corner, or undefined for a single tug. */
  countLabel?: string;
  /** Tooltip heading. */
  label: string;
  /** Tooltip body — threat and what looking in leaves you (words, no numerals). */
  meta: string;
  /** Screen-reader label; carries the same words, since the badge glyph is aria-hidden. */
  ariaLabel: string;
}

// ─── Helpers ───────────────────────────────────────────────────────

/**
 * Attention cost of attending one tug. THR-2062: the engine owns the price
 * (`attentionPool.tugAttendCost`) so the badge and the spend never disagree.
 */
export { tugAttendCost };

/**
 * THR-2062 C2: what a livelihood tug says — the home's news, in the good's own word
 * (the famine and glut chronicle lines use the same `resourceWord`).
 */
export function livelihoodTugPhrase(tug: ThreadTug): string {
  const good = resourceWord(tug.livelihoodResourceId ?? 'goods');
  return tug.livelihoodTier === 'surplus'
    ? `their home has ${good} to spare`
    : `their home is short of ${good}`;
}

/**
 * THR-2062 C2: what looking in on a chapter leaves the god, in the gauge's words.
 * "look in, leaves you Strained", or "look in" when the pool stays Focused.
 */
export function lookInPhrase(attentionPool: number, attentionCapacity: number, cost: number): string {
  const after = spendAttention(
    { attentionPool, attentionCapacity, attentionRegen: 0 },
    cost,
  );
  const word = TUG_AFTER_STATE_WORD[getAttentionVisualState(after)];
  return word ? `look in, leaves you ${word}` : 'look in';
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
 * @param tugs              `gameState.activeThreadTugs`.
 * @param attentionPool     Current pool, used to mark unaffordable tugs.
 * @param attentionCapacity Pool cap, for the gauge word the pool is left at.
 */
export function selectThreadTugBadges(
  tugs: readonly ThreadTug[] | undefined,
  attentionPool: number,
  attentionCapacity: number = ATTENTION_BASE_CAPACITY,
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
    // THR-2062 C2: words, never the cost figure (Law 13). A livelihood tug is news
    // of the home and free; a chapter tug says what looking in leaves the god.
    const isLivelihood = primary.kind === 'livelihood';
    const phrase = isLivelihood
      ? livelihoodTugPhrase(primary)
      : affordable
        ? lookInPhrase(attentionPool, attentionCapacity, attendCost)
        : TUG_UNAFFORDABLE_PHRASE;
    const meta = isLivelihood ? phrase : `${primary.threatLevel} · ${phrase}`;
    const ariaLabel = isLivelihood
      ? `The thread pulls${others} — ${phrase}`
      : `The thread pulls, ${primary.threatLevel}${others} — ${phrase}`;

    badges.set(agentId, {
      agentId,
      primary,
      count,
      attendCost,
      affordable,
      accentColor: TUG_THREAT_ACCENT[primary.threatLevel] ?? TUG_DEFAULT_ACCENT,
      icon: TUG_BADGE_ICON,
      countLabel,
      label: 'The thread pulls',
      meta,
      ariaLabel,
    });
  }

  return badges;
}
