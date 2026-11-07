/**
 * The Crossroads — words (THR-1926).
 *
 * Every line names the mortal by `{name}` (never a guessed pronoun) and every road by
 * a resolved display name (`{road}`), never a template id. Rendered through
 * `fillCrossroadsLine`, which uses function replacers so a `$` in a name is literal.
 *
 * @see Docs/plans/2026-10-14-thr-1926-the-crossroads.md § Content pillar
 */

import type { BondReception } from './meeting-nudge-constants';

export type CrossroadsSettlednessKey = 'set' | 'leaning' | 'torn';
export type CrossroadsForecastKey = 'likely' | 'may' | 'not_enough';
export type CrossroadsDirectionKey = 'toward' | 'away';

/** The reading's heading. */
export const CROSSROADS_HEADING = 'Next, {name} weighs';

/** How far ahead the first road is. */
export const SETTLEDNESS_LINE: Record<CrossroadsSettlednessKey, string> = {
  torn: '{name} is torn.',
  leaning: '{name} leans one way, but not by much.',
  set: "{name}'s mind is set.",
};

/** The forecast word before paying (Law 17), from the decision's own arithmetic (Law 18). */
export const LEAN_FORECAST: Record<CrossroadsDirectionKey, Record<CrossroadsForecastKey, string>> = {
  toward: {
    likely: '{name} will likely turn to it.',
    may: 'It may tip {name}.',
    not_enough: 'Not enough to turn {name}.',
  },
  away: {
    likely: '{name} will likely set it aside.',
    may: '{name} may set it aside.',
    not_enough: '{name} will hold to it anyway.',
  },
};

/** The confirm sentence: names the pool, says there is no refund. No price numeral (pips carry it). */
export const LEAN_CONFIRM: Record<CrossroadsDirectionKey, string> = {
  toward: 'Lean {name} toward {road}, paid now in {sphere} essence, whatever {name} chooses.',
  away: 'Lean {name} away from {road}, paid now in {sphere} essence, whatever {name} chooses.',
};

/** While a lean is held. */
export const LEAN_HELD: Record<CrossroadsDirectionKey, string> = {
  toward: 'Your hand rests on {name}, toward {road}. It holds until {name} next chooses.',
  away: 'Your hand rests on {name}, away from {road}. It holds until {name} next chooses.',
};

/** The placement acknowledgement the action returns (the row's held state carries it on screen). */
export const LEAN_PLACED_MESSAGE = LEAN_HELD;

/** One toast per resolved lean. `{chosen}` is what the mortal took instead. */
export const OUTCOME_TOAST = {
  followed: {
    toward: '{name} turns to {road}, as you leaned.',
    away: '{name} sets {road} aside, as you leaned.',
  },
  resisted: {
    toward: '{name} feels your hand and chooses {chosen} anyway.',
    away: '{name} feels your hand and holds to {road} anyway.',
  },
  /** Resisted toward, onto an idle board: there is no road to name. */
  resisted_idle: '{name} feels your hand and chooses to rest instead.',
  lapsed_expired: 'Your lean fades: {name} never came free to choose.',
  lapsed_unavailable: "Your lean finds nothing to hold: {road} is gone from {name}'s road.",
} as const;

/** Lifting a held lean (no refund). */
export const LIFT_TOAST = 'You lift your hand from {name}.';

/** Refusal reasons `placeCrossroadsLean` returns, in plain words. */
export const LEAN_REFUSAL: Record<string, string> = {
  disabled: 'The Crossroads is closed.',
  no_agent: 'There is no one there to lean on.',
  unthreaded: 'You hold no thread to {name}.',
  unreadable: "You cannot read {name}'s mind yet.",
  no_reading: '{name} has not weighed their roads yet.',
  stale_option: '{name} no longer weighs that road.',
  held: 'Your hand already rests on {name}.',
  away_not_leader: '{name} is not set on that road; there is nothing to lean away from.',
  unaffordable: 'Not enough {sphere} essence.',
  nothing_held: 'Your hand does not rest on {name}.',
};

/**
 * The mortal's answer (Law 12), keyed by the thread's bond reception × followed /
 * resisted. Words only: it writes no devotion delta (no system reads one; Law 45).
 * Lapses carry no answer — the mortal never felt the hand.
 */
export const CROSSROADS_ANSWER: Record<BondReception, { followed: string; resisted: string }> = {
  awe: {
    followed: '{name} goes, hushed, as if called by name.',
    resisted: '{name} trembles at your touch, and still turns away.',
  },
  devotion: {
    followed: '{name} calls it faith.',
    resisted: '{name} asks your pardon, and goes their own way.',
  },
  bargain: {
    followed: '{name} takes your lean as a debt to be repaid.',
    resisted: '{name} weighs your price and finds it short.',
  },
  doubt: {
    followed: '{name} goes, and wonders whose wish it was.',
    resisted: '{name} shrugs off the hand, unsure it was ever there.',
  },
  defiance: {
    followed: '{name} goes, and tells no one why.',
    resisted: '{name} pushes the hand away and does not look back.',
  },
};

/** The answer for a thread with no reception (THR-1643's no-position threads). */
export const CROSSROADS_ANSWER_DEFAULT = {
  followed: '{name} goes, without a word.',
  resisted: '{name} keeps to their own road.',
} as const;

/** The row's controls (THR-1928). Arm-then-fire: a lean button arms, "Lean" fires (Law 48). */
export const CROSSROADS_CONTROLS = {
  toward: 'Lean toward',
  away: 'Lean away',
  fire: 'Lean',
  cancel: 'Not now',
  lift: 'Lift your hand',
} as const;

/** The kind word on each road's tile (THR-1928). */
export const CROSSROADS_KIND_WORD: Record<'encounter' | 'strategic_action', string> = {
  encounter: 'A chance',
  strategic_action: 'A work',
};

/** The word before a road's place or target link: "at Greyford". */
export const CROSSROADS_TARGET_LEAD = 'at';

/** The thread row's torn badge (THR-1928): its word and its screen-reader label. */
export const CROSSROADS_TORN_BADGE = {
  label: 'Torn',
  ariaLabel: '{name} is torn between roads. Open their page to lean.',
} as const;

/** The road noun when an undertaking's template cannot be named. */
export const CROSSROADS_UNNAMED_WORK_NOUN = 'a work nearby';

/** Fill `{name}` / `{road}` / `{chosen}` / `{sphere}` slots. A missing value leaves no brace behind. */
export function fillCrossroadsLine(
  line: string,
  slots: { name?: string; road?: string; chosen?: string; sphere?: string },
): string {
  return line.replace(/\{(name|road|chosen|sphere)\}/g, (_m, key: keyof typeof slots) => slots[key] ?? '');
}
