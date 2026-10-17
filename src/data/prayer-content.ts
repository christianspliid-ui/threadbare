/**
 * Prayers and the faithful — the player's words (THR-1935 S1, plan § Prose tables).
 *
 * Game register, present tense, no numerals. Slots: `{town}`, `{god}`, `{rival}`.
 * A line whose slot cannot be filled is dropped, never printed with a hole (Law 14);
 * the resolver in `engine/prayers.ts` owns the fallbacks ("your god", "another power").
 *
 * Variant choice is deterministic (by town id and tick), never a seeded draw.
 *
 * The On-the-edge variant ("…prays for bread, and is on the edge of turning from
 * {holder}") waits for hunger and unrest S2's `on_the_edge` trait; until it exists,
 * every prayer surface uses the plain line.
 */

export type PrayerLineKey =
  | 'prays'
  | 'answered'
  | 'unbidden'
  | 'unrecovered'
  | 'faith_formed'
  | 'thanks_only'
  | 'unanswered'
  | 'lapsed'
  | 'starved';

/** Three variants a line, except where the decision fixed one wording on every surface. */
export const PRAYER_LINES: Readonly<Record<PrayerLineKey, readonly string[]>> = {
  // One wording: the place page, the chronicle, Needs you and the lens hover say the
  // same words (the visibility decision § 7), so this line has a single variant.
  prays: ['{town} prays to {god} for bread.'],
  answered: [
    '{god} hears {town}.',
    '{god} hears {town}, and answers.',
    '{town} asked, and {god} hears it.',
  ],
  unbidden: [
    '{town} did not pray to {god}, but it will remember who fed it.',
    '{town} asked no god for help, but it will remember who fed it.',
    'No one in {town} prayed to {god}. They will remember who fed them all the same.',
  ],
  unrecovered: [
    "{god}'s help reached {town}, but its hunger did not break. It gives no thanks.",
    "{god} answered {town}, but the hunger stayed. It gives no thanks.",
    "{town} was answered, but it is hungry still. It gives {god} no thanks.",
  ],
  faith_formed: [
    '{town} gives thanks to {god}, and keeps faith with you.',
    '{town} eats again, gives thanks to {god}, and keeps faith with you.',
    'The bread came back to {town}. It gives thanks to {god}, and keeps faith with you.',
  ],
  thanks_only: [
    '{town} gives thanks to {god}.',
    '{town} eats again, and gives thanks to {god}.',
    'The bread came back to {town}, and it gives thanks to {god}.',
  ],
  unanswered: [
    'No answer came to {town}. {rival} has heard its prayer instead.',
    '{town} prayed, and no answer came. {rival} has heard it instead.',
    'No answer came to {town}, so {rival} answered in your place.',
  ],
  lapsed: [
    "{town}'s faithful have turned away from {god}.",
    "{town} has stopped keeping faith with {god}.",
    "Hunger won in {town}. Its faithful have turned away from {god}.",
  ],
  starved: [
    "{rival}'s agents empty {town}'s granaries, and its faith in you thins.",
    "{rival} empties {town}'s granaries, and its faith in you thins.",
    "{town}'s granaries are emptied by {rival}'s agents, and its faith in you thins.",
  ],
};

/** The faith line, one wording on the place page and the Covenants list (Law 56). */
export const FAITH_KEPT_LINE = '{town} keeps faith with you.';
export const FAITH_WAVERING_LINE = "{town}'s faith wavers: its bread is short.";

/** The place page's open-prayer clause after the prayer line (Law 16: what answers it). */
export const PRAYER_ANSWER_HINT = 'Answer it with a card that feeds it or calms it.';

/** Days left in words — the place page and Needs you never print a numeral (Law 13). */
export const PRAYER_DAYS_LEFT_WORDS: readonly string[] = [
  'Less than a day left.',
  'One day left.',
  'Two days left.',
  'Three days left.',
  'Four days left.',
  'Five days left.',
  'Six days left.',
];

/** Slot fallbacks (plan § Player-facing text, Empty slots). */
export const PRAYER_GOD_FALLBACK = 'your god';
export const PRAYER_RIVAL_FALLBACK = 'another power';

/** The receipt change titles (the answer and the unbidden aid ride the cast's receipt). */
export const PRAYER_RECEIPT_TITLES = {
  answered: 'A prayer answered',
  unbidden: 'Remembered',
} as const;
