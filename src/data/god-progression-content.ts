/**
 * God-card progression and the world's offering — constants and words (THR-1811).
 *
 * Plan: `Docs/plans/2026-10-13-thr-1811-god-card-progression-and-offerings.md`.
 * Decided: THR-1794 (the ladder, prices, keys), THR-1770 (Christian's option B: the
 * world offers three cards, the god takes up one for essence it has earned).
 *
 * Every tuning number for the ladder lives here (NFP #1). The ladder itself is data on
 * each card (`UnifiedActionTemplate.progression`), never a side table.
 */

import type { SpineBeatPresentation } from './ascendant-beat-content';

// ─── The ladder ──────────────────────────────────────────────────────

/** Marks, summed over the god's bought spheres, at which rungs 1–4 open (THR-1794). Rung 1 also waits for the spine. */
export const PROGRESSION_RUNG_MARKS: readonly number[] = [0, 3, 6, 8];
/** Highest rung. */
export const PROGRESSION_MAX_RUNG = 4;
/** Ticks between a rung's key gifts (THR-1794). */
export const RUNG_GIFT_SPACING = 36;
/** Rung whose first gift is the secondary reach signature (THR-1794). */
export const SECONDARY_SIGNATURE_RUNG = 2;
/** The beat-id token that stands for "the god's secondary reach signature" in a rung-gift id. */
export const SECONDARY_SIGNATURE_GIFT_TOKEN = 'signature.secondary';

// ─── Prices ──────────────────────────────────────────────────────────

/** Base price in earned essence per tier (THR-1794). */
export const PRICE_BY_TIER: Readonly<Record<1 | 2 | 3 | 4, number>> = { 1: 20, 2: 40, 3: 80, 4: 120 };
/** Each card already taken up at a tier raises that tier's price by this share (counted per tier). */
export const OFFERING_PRICE_ESCALATION = 0.1;
/** Paying from the primary sphere instead of the card's own sphere (THR-1794). */
export const OFF_SPHERE_PRICE_MULT = 2;

// ─── The offering ────────────────────────────────────────────────────

/** Cards per offering (Christian's B). */
export const OFFERING_SIZE = 3;
/** Cards that may be taken up per offering (Christian's B). */
export const OFFERING_TAKE_LIMIT = 1;
/** The offering's kind weight in the cadence draw (plan § Decided 2). */
export const OFFERING_BEAT_WEIGHT = 8;
/** Fewest offerable cards for an offering to be eligible. */
export const OFFERING_MIN_CANDIDATES = 1;
/** An offering stands at least this long; it passes at the first day boundary after. */
export const OFFERING_MIN_TTL_TICKS = 6;
/** When on, the offering draws only sphereless cards and cards in the god's primary or secondary. Default off (THR-1794 decided the open offer). */
export const OFFERING_IN_SPHERE_ONLY = false;
/** The newest open rung's cards are offered a little more often (THR-1794). */
export const FRESH_RUNG_WEIGHT = 1.5;

/** The offering beat's id (one synthetic beat; its cards ride on the pending beat). */
export const OFFERING_BEAT_ID = 'beat.offering';
/** Rung-gift beat-id prefix: `beat.rung.<n>.<cardId>`. */
export const RUNG_GIFT_BEAT_PREFIX = 'beat.rung.';

// ─── Words ───────────────────────────────────────────────────────────
//
// The screen never says buy, tier, price or omen (plan § Decided 8–9). Rung words
// (touch / hand / will / wonder) live in prose only; no number reaches the player.

/** Price word kinds, as the trace and the modal name them. */
export type OfferingPriceWord = 'paid_from' | 'at_double' | 'beyond';

export const OFFERING_COPY = {
  eyebrow: 'Three powers stir',
  /** The modal's small kicker above the title (the title already says "Three powers stir"). */
  modalEyebrow: 'The World Offers',
  title: 'Three powers stir',
  prose: 'Three powers stir. Take up one, or let them pass.',
  footer: 'They pass when the day turns.',
  takeUp: 'Take it up',
  notYet: 'Not yet',
  letPass: 'Let them pass',
  /** `{sphere}` → the card's paying sphere name. */
  paidFrom: 'Paid from {sphere}',
  /** `{sphere}` → the god's primary sphere name. */
  atDouble: 'From {sphere}, at double',
  beyond: 'Beyond you yet',
  /** The chronicle line on take-up. `{card}` → the card's name. */
  chronicleTaken: 'You took up {card}.',
  chronicleTitle: 'A Power Taken Up',
} as const;

/** Tooltip registry ids the offering surface uses (Law 1 / 17). Entries live in the tooltip registry. */
export const OFFERING_TOOLTIP_IDS = {
  offering: 'ui.offering',
  paidFrom: 'ui.offering.paid_from',
  atDouble: 'ui.offering.at_double',
  beyond: 'ui.offering.beyond',
} as const;

/**
 * Rung-opening and later-key beat words. Keyed by rung. Rung 1 opens silently (it has
 * no gift); the first offering is what shows it.
 */
export const RUNG_BEAT_PRESENTATION: Readonly<Record<number, SpineBeatPresentation>> = {
  2: {
    eyebrow: 'Your Hand Is Felt',
    title: 'Your hand is felt',
    prose: 'What you have drawn through your spheres has changed you. The world answers a hand now, not a touch: it will offer you deeper works, and it gives you this one freely.',
    cta: 'Receive',
  },
  3: {
    eyebrow: 'Your Will Is Known',
    title: 'Your will is known',
    prose: 'Peoples and banners turn toward you. The world will offer works that move regions and orders, and it gives you this.',
    cta: 'Receive',
  },
  4: {
    eyebrow: 'The World Braces',
    title: 'The world braces',
    prose: 'You have grown into something the world must reckon with. Its greatest works will be offered to you now, and it gives you this.',
    cta: 'Receive',
  },
};

/** A later key of an already-open rung. `{card}` → the card's name. */
export const RUNG_LATER_KEY_PRESENTATION: SpineBeatPresentation = {
  eyebrow: 'A Further Gift',
  title: 'A further gift',
  prose: 'Your growth opens another way to work: {card}.',
  cta: 'Receive',
};
