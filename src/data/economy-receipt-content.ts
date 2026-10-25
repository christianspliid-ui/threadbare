/**
 * The economy receipt's lines (THR-1968, god's stake S2).
 *
 * What an economic card changed on the place or mortal it targeted, in the visibility
 * decision's words (`Docs/audits/2026-10-15-thr-1870-economy-visibility-decision.md`
 * § 5; plan `Docs/plans/2026-10-17-thr-1935-the-gods-stake-in-the-economy.md` § Content,
 * S2 receipt lines). One entry per quantity × direction × crossed (Law 58); a `null`
 * line is a declared "no row", and the completeness test holds the table to that.
 *
 * - A **crossed** band names the new word and opens the receipt dialog.
 * - A move **inside** a band names only the direction and rides the toast.
 *
 * Words only, never a number (Law 13). `{town}`, `{from}`, `{to}` and `{good}` are filled
 * by `fillEconomyReceiptLine`; a line whose slot cannot be filled is dropped (Law 14).
 *
 * Means (a mortal) is not here: its words are mortal wealth's `meansChangeSentence`,
 * which owns the `economy` kind's shape (THR-1936), so the two cannot drift apart.
 */

import type { ProsperityTier } from '../engine/phaseProsperity';
import type { StockTier } from '../types/resource';

/** Master switch (plan § Rollback): off, a cast's snapshot carries no economy part. */
export const ECONOMY_RECEIPTS_ENABLED = true;

/** The place-side quantities a cast snapshot reads. `means` is the mortal's. */
export type EconomyReceiptQuantity = 'prosperity' | 'unrest' | 'staple' | 'lane' | 'means' | 'land';

/** Which way the quantity moved: `up` is more of it (more unrest is `up`). */
export type EconomyReceiptDirection = 'up' | 'down';

/** The unrest bands a town wears as chips (location traits), mildest first. */
export type EconomyUnrestBand = 'restless' | 'lawless' | 'on_the_edge';

export const ECONOMY_UNREST_BAND_ORDER: readonly EconomyUnrestBand[] = ['restless', 'lawless', 'on_the_edge'];

export interface EconomyReceiptLine {
  /** The chip's short title. */
  readonly title: string;
  /** The sentence. `null` declares no row for this case. */
  readonly detail: string | null;
}

export interface EconomyReceiptRows {
  readonly crossed: EconomyReceiptLine;
  readonly inside: EconomyReceiptLine;
}

type PlaceQuantity = Exclude<EconomyReceiptQuantity, 'means' | 'land'>;

/**
 * The place rows. `up` / `down` are the quantity's direction, not good or bad: rising
 * unrest is `up` and reads as a loss (`ECONOMY_RECEIPT_UP_IS_GAIN`).
 */
export const ECONOMY_RECEIPT_LINES: Record<PlaceQuantity, Record<EconomyReceiptDirection, EconomyReceiptRows>> = {
  prosperity: {
    up: {
      crossed: { title: 'Fortunes lift', detail: '{town} is no longer {from}: it is {to} again.' },
      inside: { title: 'Fortunes lift', detail: "{town}'s fortunes lift." },
    },
    down: {
      crossed: { title: 'Fortunes sink', detail: '{town} has fallen to {to}.' },
      inside: { title: 'Fortunes sink', detail: "{town}'s fortunes sink." },
    },
  },
  unrest: {
    up: {
      crossed: { title: 'Anger rises', detail: '{town} has gone {to}.' },
      inside: { title: 'Anger rises', detail: "Its people's anger rises." },
    },
    down: {
      // `{to}` empty (calm) uses the "no longer" line; a milder band still names it.
      crossed: { title: 'Anger cools', detail: '{town} is no longer {from}.' },
      inside: { title: 'Anger cools', detail: "Its people's anger cools." },
    },
  },
  staple: {
    up: {
      crossed: { title: 'Stores fill', detail: '{town} is no longer short of {good}.' },
      // Stock moves inside a band are carried by the settlement economy's land line.
      inside: { title: 'Stores fill', detail: null },
    },
    down: {
      crossed: { title: 'Stores run short', detail: '{town} is short of {good}.' },
      inside: { title: 'Stores run short', detail: null },
    },
  },
  lane: {
    up: {
      // A lane "up" is a lane freed of threat (crossed) or carrying more (inside).
      crossed: { title: 'Roads clear', detail: 'The road from {town} is no longer threatened.' },
      inside: { title: 'Trade picks up', detail: 'Trade on the roads from {town} picks up.' },
    },
    down: {
      crossed: { title: 'Roads threatened', detail: 'The road from {town} is threatened.' },
      inside: { title: 'Trade falters', detail: 'Trade on the roads from {town} falters.' },
    },
  },
};

/**
 * A staple's crossing between adequate and surplus names plenty, not shortage. These
 * two lines replace the `staple` crossed rows when neither tier is scarce.
 */
export const ECONOMY_STAPLE_PLENTY_LINES: Record<EconomyReceiptDirection, EconomyReceiptLine> = {
  up: { title: 'Stores fill', detail: '{town} has {good} to spare.' },
  down: { title: 'Stores run short', detail: '{town} no longer has {good} to spare.' },
};

/** Whether moving `up` is good for the place (sets polarity, category and direction). */
export const ECONOMY_RECEIPT_UP_IS_GAIN: Record<EconomyReceiptQuantity, boolean> = {
  prosperity: true,
  unrest: false,
  staple: true,
  lane: true,
  means: true,
  // The land line's polarity is its verb's (`LAND_SHOCK_RECEIPT_LINES`), not a direction.
  land: true,
};

/** The chip's state noun and its tooltip (Law 1). */
export const ECONOMY_RECEIPT_NOUNS: Record<EconomyReceiptQuantity, { text: string; tooltipId: string }> = {
  prosperity: { text: 'Prosperity', tooltipId: 'ui.econ.prosperity' },
  unrest: { text: 'Unrest', tooltipId: 'ui.econ.unrest' },
  staple: { text: 'Stores', tooltipId: 'ui.econ.stores' },
  lane: { text: 'Roads', tooltipId: 'ui.econ.roads' },
  means: { text: 'Means', tooltipId: 'ui.econ.means.change' },
  land: { text: 'Fields', tooltipId: 'ui.econ.fields' },
};

/**
 * THR-1923 — the settlement economy's land line: which of a town's fields a god's hand
 * fell on, and that it lasts and fades (plan § Player-facing text, verbatim). `{where}`
 * is the hex's place from the town ("east of", "by the river at"), with a declared
 * fallback per verb when the direction is unknown; `{town}` the settlement.
 */
export interface LandShockReceiptLine extends EconomyReceiptLine {
  readonly detail: string;
  /** Whether the verb helps the town (sets polarity). */
  readonly gain: boolean;
  /** `{where}` when the hex's direction is unknown or is the town's own hex. */
  readonly whereFallback: string;
}

export const LAND_SHOCK_RECEIPT_LINES: Readonly<Record<'blight' | 'bless_harvest' | 'sour_mine' | 'reveal_vein', LandShockReceiptLine>> = {
  blight: { title: 'Fields wither', detail: 'The fields {where} {town} wither. They will take a season to recover.', gain: false, whereFallback: 'around' },
  bless_harvest: { title: 'Fields swell', detail: 'The fields {where} {town} swell with grain. The plenty will ease over the coming season.', gain: true, whereFallback: 'around' },
  sour_mine: { title: 'The quarry fails', detail: 'The quarry {where} {town} runs to rubble. It will take a season to open again.', gain: false, whereFallback: 'near' },
  reveal_vein: { title: 'A seam opens', detail: 'A rich seam opens in the hills {where} {town}. It will run thin over the coming season.', gain: true, whereFallback: 'near' },
};

/** A hex's place from its town, as `{where}` says it. `centre` and unknown use the line's fallback. */
export const LAND_SHOCK_WHERE_WORDS: Readonly<Record<string, string>> = {
  north: 'north of',
  'north-east': 'north-east of',
  east: 'east of',
  'south-east': 'south-east of',
  south: 'south of',
  'south-west': 'south-west of',
  west: 'west of',
  'north-west': 'north-west of',
  river: 'by the river at',
};

/** The prosperity word as the Fortunes row prints it (lower case, `fortunesSentence`). */
export function prosperityReceiptWord(tier: ProsperityTier): string {
  return tier.toLowerCase();
}

/** The unrest band in the two slots: "has gone {to}" / "is no longer {from}". */
export const ECONOMY_UNREST_BAND_WORDS: Record<EconomyUnrestBand, { from: string; to: string }> = {
  restless: { from: 'restless', to: 'restless' },
  lawless: { from: 'lawless', to: 'lawless' },
  on_the_edge: { from: 'on the edge', to: 'to the edge of turning' },
};

/** A staple stock tier, as the receipt orders it. */
export const ECONOMY_STOCK_ORDER: readonly StockTier[] = ['scarce', 'adequate', 'surplus'];

/**
 * Fill a line's slots. Returns null when the line is null or any slot it names has no
 * value, so the row is dropped rather than printed with a hole (Law 14).
 */
export function fillEconomyReceiptLine(
  line: string | null,
  slots: Readonly<Record<string, string | undefined>>,
): string | null {
  if (line === null) return null;
  let missing = false;
  const out = line.replace(/\{(\w+)\}/g, (_m, key: string) => {
    const v = slots[key];
    if (v === undefined || v.trim().length === 0) {
      missing = true;
      return '';
    }
    return v;
  });
  return missing ? null : out;
}
