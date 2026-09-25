/**
 * The fight on screen — words, phrases and sizes (THR-1551, plan doc
 * `Docs/plans/2026-09-23-fight-on-screen.md` § Content pillar, slice F2).
 *
 * Every word the opponent header shows lives here as a named constant (NFP #1):
 * the clock-state words and their thresholds, the Dread and Might phrases the
 * card sentence is built from (Law 16 — a sentence, never a `dread: fair`
 * strip), the temper clauses, the fight step titles, and the `fight.*`
 * concept-tooltip copy the one registry routes to (Law 17).
 *
 * GAME register, words only — no digit, fraction or percentage is ever built
 * from these (Law 13/14).
 */

import type { FightRatingWord, FightTemper } from '../types/fight';

// ─── Sizes ────────────────────────────────────────────────────────

/**
 * Clock pip size in px — Law 11's ~14px floor for meaning-bearing glyphs.
 * `StepDots` defaults to 5px; the square-versus-round distinction from the step
 * navigator (Law 10) needs the larger size to read.
 */
export const FIGHT_CLOCK_PIP_SIZE = 14;

/** The header portrait size: the veil's smallest canonical tile (Law 5). */
export const OPPONENT_HEADER_ART_SIZE = 'chip' as const;

// ─── Step titles ──────────────────────────────────────────────────

/**
 * Step titles for fight steps, in block order: the nerve step, then each
 * exchange. A block longer than this list reuses the last "exchange" word with
 * its ordinal carried by the list, never a digit.
 */
export const FIGHT_STEP_LABELS: readonly string[] = [
  'Facing it',
  'First exchange',
  'Second exchange',
  'Third exchange',
  'Fourth exchange',
  'Fifth exchange',
];

/** The title for a fight step beyond the list (a hand-authored long block). */
export const FIGHT_STEP_LABEL_OVERFLOW = 'Another exchange';

// ─── Clock-state words ────────────────────────────────────────────

export type ClockStateWord = 'untouched' | 'bloodied' | 'half-broken' | 'failing' | 'slain';

/**
 * Fill ratio at or above which a clock reads `half-broken` (below it and above
 * zero: `bloodied`). `failing` begins one segment short of full.
 */
export const CLOCK_HALF_BROKEN_RATIO = 0.5;

/** Every clock-state word, in fill order. */
export const CLOCK_STATE_WORDS: readonly ClockStateWord[] = [
  'untouched', 'bloodied', 'half-broken', 'failing', 'slain',
];

/**
 * The clock-state word for a fill (plan § Prose tables):
 *
 * | Filled / size | Word |
 * |---|---|
 * | 0 | untouched |
 * | > 0 and < ½ | bloodied |
 * | ≥ ½ and < size − 1 | half-broken |
 * | size − 1, or size while the opponent lives | failing |
 * | size, and the opponent is deceased | slain |
 *
 * Fail-soft: a non-finite or non-positive size reads as one segment; the fill is
 * clamped to `[0, size]`.
 */
export function clockStateWord(filled: number, size: number, deceased = false): ClockStateWord {
  const total = Number.isFinite(size) && size >= 1 ? Math.floor(size) : 1;
  const fill = Number.isFinite(filled) ? Math.max(0, Math.min(total, filled)) : 0;
  if (fill <= 0) return 'untouched';
  if (fill >= total && deceased) return 'slain';
  if (fill >= total - 1) return 'failing';
  if (fill / total >= CLOCK_HALF_BROKEN_RATIO) return 'half-broken';
  return 'bloodied';
}

// ─── The card sentence ────────────────────────────────────────────

/** Dread → the nerve half of the card sentence. */
export const DREAD_PHRASES: Readonly<Record<FightRatingWord, string>> = {
  gentle: 'easy to face',
  fair: 'unnerving to face',
  steep: 'fearsome to face',
  severe: 'terrifying to face',
};

/** Might → the fighting half of the card sentence. */
export const MIGHT_PHRASES: Readonly<Record<FightRatingWord, string>> = {
  gentle: 'weak in a fight',
  fair: 'a fair match',
  steep: 'dangerous to fight',
  severe: 'deadly to fight',
};

/** Temper → the clause that follows the card once the temper has shown. */
export const TEMPER_CLAUSES: Readonly<Record<FightTemper, string>> = {
  berserk: 'It fights on berserk.',
  stubborn: 'It is stubborn.',
  skittish: 'It startles easily.',
  bargainer: 'It bargains.',
};

/** A mortal opponent's line, in place of a monster family's card line. */
export const MORTAL_OPPONENT_LINE = 'A mortal, flesh and nerve';

/** The fail-soft name for a fight step whose opponent cannot be resolved. */
export const UNKNOWN_FOE_NAME = 'an unknown foe';

/** The watched view's opponent line: `Facing {name} — {clockWord}`. */
export const WATCHED_OPPONENT_LINE_PREFIX = 'Facing';

// ─── Concept tooltips (Law 17, the `fight.*` prefix) ──────────────

/**
 * Every `fight.*` tooltip id, declared as a literal so the concept-id corpus
 * sweep (`conceptTooltipIds.test.ts`) sees each one. F3 adds the chip kinds.
 */
export const FIGHT_TOOLTIP_IDS = {
  dread: { tooltipId: 'fight.dread' },
  might: { tooltipId: 'fight.might' },
  temper: { tooltipId: 'fight.temper' },
  clock: { tooltipId: 'fight.clock' },
  untouched: { tooltipId: 'fight.clock.untouched' },
  bloodied: { tooltipId: 'fight.clock.bloodied' },
  'half-broken': { tooltipId: 'fight.clock.half-broken' },
  failing: { tooltipId: 'fight.clock.failing' },
  slain: { tooltipId: 'fight.clock.slain' },
} as const;

/** The clock-state word's tooltip id. */
export function clockWordTooltipId(word: ClockStateWord): string {
  return FIGHT_TOOLTIP_IDS[word].tooltipId;
}

/**
 * The clock's tooltip body — cause-neutral, so spells and items that advance a
 * clock (fight block FB6) read true under it.
 */
export const FIGHT_CLOCK_TOOLTIP_BODY =
  'Everything that lands against it wears it down (a blow, a spell, a trick), and it heals slowly between fights.';

/** The copy behind each `fight.*` id. Suffix (the id minus `fight.`) → content. */
export const FIGHT_TOOLTIP_COPY: Readonly<Record<string, { label: string; desc: string }>> = {
  dread: {
    label: 'Dread',
    desc: 'How hard it is to stand and face. Dread is tested once, before the first blow, against the fighter\'s nerve.',
  },
  might: {
    label: 'Might',
    desc: 'How dangerous it is once the blows begin. Might rates every exchange of the fight.',
  },
  temper: {
    label: 'Temper',
    desc: 'How it behaves once it is half broken: it may fight on, rage, flee or bargain. A temper shows only after it has fought.',
  },
  clock: {
    label: 'Its clock',
    desc: FIGHT_CLOCK_TOOLTIP_BODY,
  },
  'clock.untouched': {
    label: 'Untouched',
    desc: `Nothing has worn it down yet. ${FIGHT_CLOCK_TOOLTIP_BODY}`,
  },
  'clock.bloodied': {
    label: 'Bloodied',
    desc: `It has been hurt, but it has most of its strength. ${FIGHT_CLOCK_TOOLTIP_BODY}`,
  },
  'clock.half-broken': {
    label: 'Half-broken',
    desc: `It has lost half its strength or more. ${FIGHT_CLOCK_TOOLTIP_BODY}`,
  },
  'clock.failing': {
    label: 'Failing',
    desc: `One more telling blow could finish it. ${FIGHT_CLOCK_TOOLTIP_BODY}`,
  },
  'clock.slain': {
    label: 'Slain',
    desc: 'It is dead. A fight ended it.',
  },
};
