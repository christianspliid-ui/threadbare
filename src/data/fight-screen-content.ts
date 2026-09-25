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

// ─── Fight chips (THR-1553, slice F3) ─────────────────────────────

/**
 * Every fight consequence-chip kind (plan § UI pillar, item 2). Each is drawn
 * only from a field on the resolved action's `fightState` (Law 56).
 */
export type FightChipKind =
  | 'clock'
  | 'slain_opponent'
  | 'lair_cleared'
  | 'scarred'
  | 'slain_fighter'
  | 'condition'
  | 'storied'
  | 'trophy'
  | 'standing'
  | 'grudge';

/**
 * Chip kind → one of the four existing story categories. No fifth category:
 * a beast worn down, slain or a den cleared change the world (PATH); a scar or
 * a death is what the fight cost the fighter (SCAR); a trophy or a storied
 * weapon is what they took (BOON); standing and a grudge are who now stands
 * with or against them (BOND). A condition's category follows its polarity —
 * see `FIGHT_CONDITION_CHIP_COPY`.
 */
export const FIGHT_CHIP_CATEGORY: Readonly<Record<Exclude<FightChipKind, 'condition'>, 'scar' | 'bond' | 'boon' | 'path'>> = {
  clock: 'path',
  slain_opponent: 'path',
  lair_cleared: 'path',
  scarred: 'scar',
  slain_fighter: 'scar',
  storied: 'boon',
  trophy: 'boon',
  standing: 'bond',
  grudge: 'bond',
};

/**
 * The chip kinds' tooltip ids, declared as literals so the concept-id corpus
 * sweep sees each one (Law 17; plan § Tooltip copy). A condition chip's noun
 * carries the condition's own `attachment.*` id instead — the condition is the
 * concept a player wants explained there, and it is explained once.
 */
export const FIGHT_CHIP_TOOLTIP_IDS: Readonly<Record<Exclude<FightChipKind, 'condition'>, { readonly tooltipId: string }>> = {
  clock: { tooltipId: 'fight.chip.clock' },
  slain_opponent: { tooltipId: 'fight.chip.slain_opponent' },
  lair_cleared: { tooltipId: 'fight.chip.lair_cleared' },
  scarred: { tooltipId: 'fight.chip.scarred' },
  slain_fighter: { tooltipId: 'fight.chip.slain_fighter' },
  storied: { tooltipId: 'fight.chip.storied' },
  trophy: { tooltipId: 'fight.chip.trophy' },
  standing: { tooltipId: 'fight.chip.standing' },
  grudge: { tooltipId: 'fight.chip.grudge' },
};

/**
 * The chip copy: the noun (the sheet word for the state the engine wrote) and
 * the sentence (≤15 words). `{fighter}`, `{opponent}`, `{victor}`, `{clockWord}`,
 * `{lair}`, `{item}`, `{artifact}` and `{settlement}` are the chip builder's own
 * slots, filled from names it already holds — never enrichment tokens, and a
 * test asserts no `{` survives (Law 43).
 */
export const FIGHT_CHIP_COPY: Readonly<Record<Exclude<FightChipKind, 'condition'>, {
  readonly noun: string;
  readonly sentence: string;
  /** PATH only — the word drawn beside the ◆ marker in place of "a way opens". */
  readonly deltaLabel?: string;
}>> = {
  clock: { noun: "{opponent}'s clock", sentence: '{fighter} wore {opponent} down to {clockWord}.', deltaLabel: '{clockWord}' },
  slain_opponent: { noun: '{opponent}', sentence: '{opponent} was slain.', deltaLabel: 'slain' },
  lair_cleared: { noun: '{lair}', sentence: '{lair} is cleared.', deltaLabel: 'cleared' },
  scarred: { noun: 'Scarred', sentence: 'Scarred by {victor}.' },
  slain_fighter: { noun: '{fighter}', sentence: '{fighter} was slain by {victor}.' },
  storied: { noun: "{artifact}'s Storied", sentence: '{artifact} grows more storied.' },
  trophy: { noun: '{item}', sentence: '{fighter} took {item} from the den.' },
  standing: { noun: '{settlement}', sentence: '{settlement} will remember this.' },
  grudge: { noun: '{victor}', sentence: '{fighter} holds a grudge against {victor}.' },
};

/** The standing chip's loss sentence (humiliation): the place hears of the yield. */
export const FIGHT_STANDING_LOSS_SENTENCE = '{settlement} will hear of it.';

/**
 * The condition chip, per band condition a fight applies (`FIGHT_NERVE_CONDITIONS`
 * / `FIGHT_CLASH_CONDITIONS`, fight-constants.ts). Category follows the
 * condition's polarity — a loss is SCAR, a gain BOON — and the chip's direction
 * with it, so a SCAR never draws a rise.
 */
export const FIGHT_CONDITION_CHIP_COPY: Readonly<Record<string, {
  readonly sentence: string;
  readonly polarity: 'gain' | 'loss';
}>> = {
  'trait.condition.inspired': { sentence: '{fighter} came away inspired.', polarity: 'gain' },
  'trait.condition.shaken': { sentence: '{fighter} came away shaken.', polarity: 'loss' },
  'trait.condition.terrified': { sentence: '{fighter} came away terrified.', polarity: 'loss' },
  'trait.condition.wounded': { sentence: '{fighter} came away wounded.', polarity: 'loss' },
};

/**
 * A condition outside the table (a complication's own condition, content added
 * later): the generic sentence, with the polarity read from the condition's
 * `#positive` tag and a loss otherwise — a condition a fight lands is a cost
 * unless it says it is not.
 */
export const FIGHT_CONDITION_CHIP_FALLBACK_SENTENCE = '{fighter} came away {condition}.';

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
  // THR-1553 (F3) — the fight chips.
  'chip.clock': {
    label: 'Worn down',
    desc: `The fight wore the beast's clock down, and the wear stays on it. ${FIGHT_CLOCK_TOOLTIP_BODY}`,
  },
  'chip.slain_opponent': {
    label: 'Slain',
    desc: 'The opponent died in this fight. Its body stays where it fell.',
  },
  'chip.lair_cleared': {
    label: 'Lair cleared',
    desc: 'The den has no beast left in it. The land around it is safer to cross.',
  },
  'chip.scarred': {
    label: 'Scarred',
    desc: 'The fight left a lasting mark on the fighter, and the sheet remembers who left it.',
  },
  'chip.slain_fighter': {
    label: 'Slain',
    desc: 'The fighter died in this fight.',
  },
  'chip.storied': {
    label: 'Storied',
    desc: 'The weapon was there when it mattered. A storied thing grows in legend each time.',
  },
  'chip.trophy': {
    label: 'Trophy',
    desc: 'Something taken from the fallen beast\'s den, now carried by the fighter.',
  },
  'chip.standing': {
    label: 'Standing',
    desc: 'How the nearby place now regards the fighter: grateful for a beast felled, or scornful of a yield.',
  },
  'chip.grudge': {
    label: 'Grudge',
    desc: 'The fighter will not forget who beat them. The grudge sits in their blood, and it sharpens their next fight against the same foe.',
  },
};
