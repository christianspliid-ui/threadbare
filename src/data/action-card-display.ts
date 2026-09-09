/**
 * Action card display vocabulary — THR-1002.
 *
 * The sibling of `nudge-card-display.ts`: every player-facing glyph and word the
 * action card draws that is not prose. Two cards, one grammar — so the two files
 * have the same shape, and neither card invents a vocabulary the other lacks.
 *
 * **Law 13 is the reason this file exists.** The action card used to print raw
 * numerals and raw keys on its face — a `{X}% risk`, an `{n} hex` range, a
 * `0.5 force/tick` badge, and a type line built by splitting the slot id into
 * `IRON · CREATE`. Every one of those is replaced by a word from a table here, so
 * the card's whole surface is words the player can read and the numbers live
 * behind the designer-view toggle.
 *
 * Spec: `Docs/plans/2026-09-09-thr-1002-card-grammar.md` § Content pillar.
 */

import type { ActionScale, UnifiedActionTemplate } from '../types/unifiedAction';

/** The CRUD axis a template declares. Mirrors `UnifiedActionTemplate.crudType`. */
export type ActionCrudType = UnifiedActionTemplate['crudType'];

/**
 * The verb word a card prints for each CRUD type — the card's *kind*, in the
 * player's language rather than the schema's.
 *
 * `read` prints **Find** and `update` prints **Change** deliberately: the schema
 * words are a developer's axis, and Law 14 forbids a raw key reaching the face.
 * A god does not "read" a thing, it finds it out.
 *
 * Keyed on the live union, so a CRUD type added to the template schema without a
 * word here is a type error rather than a blank chip (Law 9).
 */
export const ACTION_VERB_WORDS: Readonly<Record<ActionCrudType, string>> = {
  create: 'Create',
  read: 'Find',
  update: 'Change',
  delete: 'Destroy',
};

/**
 * The verb word a **sustained** template prints, whatever its CRUD type.
 *
 * A sustained action is not an act but an arrangement — it holds something open
 * and charges upkeep for as long as it does. That is a different kind of card to
 * the player (it is the one with the upkeep channel), so it earns its own word
 * rather than being filed under the change it happens to make.
 */
export const ACTION_CONTROL_VERB_WORD = 'Control';

/**
 * Keyword icon per verb. One glyph, chosen to read at chip size and to carry the
 * verb's *feel* rather than to illustrate it literally — the
 * `NUDGE_CARD_TYPE_ICONS` shape.
 *
 * Build-enforced on the live union (Law 9): a new CRUD type without a glyph fails
 * the typecheck rather than shipping a card with an empty chip.
 */
export const ACTION_CARD_KEYWORD_ICONS: Readonly<Record<ActionCrudType, string>> = {
  create: '✸',
  read: '◉',
  update: '⟳',
  delete: '✖',
};

/** Glyph for the sustained/Control verb, paired with {@link ACTION_CONTROL_VERB_WORD}. */
export const ACTION_CONTROL_VERB_ICON = '∞';

/**
 * Scale → the word on the card's muted second chip.
 *
 * This is what replaced the `{n} hex` numeral. A range in hexes is a measurement
 * of the board; a scale is a statement about the *kind* of working, which is what
 * the player is choosing between. Out-of-range is no longer a number on the face
 * at all — it becomes a blocked reason in words.
 */
export const ACTION_SCALE_WORDS: Readonly<Record<ActionScale, string>> = {
  personal: 'Personal',
  local: 'Local',
  regional: 'Regional',
  cosmic: 'Cosmic',
};

/**
 * Per-tick cost cut-points for the upkeep band, ascending.
 *
 * A cost at or below the first entry is *light*; at or below the second,
 * *steady*; above it, *heavy*. Tunable (NFP #1): making upkeep feel dearer is a
 * change to these two numbers, not to the card.
 */
export const UPKEEP_WORD_THRESHOLDS: readonly [number, number] = [0.25, 1.0];

/** The upkeep bands, ordered to match {@link UPKEEP_WORD_THRESHOLDS}. */
export const UPKEEP_WORDS = ['light', 'steady', 'heavy'] as const;

export type UpkeepWord = (typeof UPKEEP_WORDS)[number];

/** The glyph on the upkeep channel row — a thing that keeps coming back round. */
export const UPKEEP_CHANNEL_ICON = '↻';

/**
 * Band a per-tick essence cost into its upkeep word.
 *
 * Fail-soft: a non-finite or non-positive cost has no band — a template with no
 * upkeep renders no channel, rather than a channel claiming it is *light*.
 */
export function upkeepWord(perTickCost: number | undefined): UpkeepWord | undefined {
  if (typeof perTickCost !== 'number' || !Number.isFinite(perTickCost) || perTickCost <= 0) {
    return undefined;
  }
  const [light, steady] = UPKEEP_WORD_THRESHOLDS;
  if (perTickCost <= light) return 'light';
  if (perTickCost <= steady) return 'steady';
  return 'heavy';
}

/** Label for an upkeep channel, in words — never the numeral it was banded from. */
export function upkeepChannelLabel(word: UpkeepWord): string {
  return `${word} upkeep`;
}

/**
 * Authoring guardrail for an effect line, in words.
 *
 * Warn-level in the content-eval sweep rather than a build failure: a line one
 * word over is a nudge to the author, not a broken card. The cap exists because
 * the card's body is a fixed width and a long line pushes the footer out of
 * alignment across the row.
 */
export const ACTION_EFFECT_LINE_MAX_WORDS = 14;

/**
 * First-contact legend for the action hand (Law 12).
 *
 * Every glyph vocabulary on the face, named once, so a player meeting the drawer
 * for the first time is told what they are looking at rather than left to infer
 * it. The nudge hand's `NUDGE_GLYPH_LEGEND` is the same idea for the other card.
 */
export const ACTION_CARD_GLYPH_LEGEND: readonly { readonly glyph: string; readonly meaning: string }[] = [
  { glyph: '✸', meaning: 'what the working does' },
  { glyph: '✦', meaning: 'essence it costs' },
  { glyph: UPKEEP_CHANNEL_ICON, meaning: 'upkeep while it holds' },
] as const;

/** Blocked reason for a target outside the action's reach — words, not a hex count. */
export const ACTION_BLOCKED_OUT_OF_RANGE = 'Too far from here.';
