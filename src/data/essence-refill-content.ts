/**
 * Essence refill words (THR-1985, plan `2026-10-18-thr-1980-words-teach-themselves.md`
 * § Content, slice S1).
 *
 * Every essence row and every sphere on the pour screen says how fast its pool
 * refills — as a word with a rung, never a number (Law 13: numerals are allowed
 * for pool *balances* only). The band is a **share** of the god's total gross
 * income, so the Seat and new threads never re-word a row except the deepest
 * sphere, which pays the upkeep and says so.
 */

export type EssenceRefillBand = 'fast' | 'steady' | 'slow' | 'drains';

/** A sphere whose net income is at least this share of total gross income reads "Refills fast". */
export const ESSENCE_REFILL_FAST_SHARE = 0.2;

/** At least this share (below fast) reads "Refills steadily"; above zero reads "slowly". */
export const ESSENCE_REFILL_STEADY_SHARE = 0.08;

/** The band ladder, best first — the order the rung fills. */
export const ESSENCE_REFILL_BANDS: readonly EssenceRefillBand[] = ['fast', 'steady', 'slow', 'drains'];

export interface EssenceRefillWords {
  /** The essence row's word, e.g. "Refills fast". */
  readonly row: string;
  /** Filled dots out of {@link ESSENCE_REFILL_RUNG_STEPS}. */
  readonly rung: number;
  /** The pour screen's word under a sphere, e.g. "refills fast". Empty when the band cannot occur there. */
  readonly pour: string;
}

export const ESSENCE_REFILL_RUNG_STEPS = 3;

export const ESSENCE_REFILL_WORDS: Readonly<Record<EssenceRefillBand, EssenceRefillWords>> = {
  fast: { row: 'Refills fast', rung: 3, pour: 'refills fast' },
  steady: { row: 'Refills steadily', rung: 2, pour: 'refills steadily' },
  slow: { row: 'Refills slowly', rung: 1, pour: 'refills slowly' },
  // Cannot occur before the bond: nothing charges upkeep on the pour screen.
  drains: { row: 'Drains', rung: 0, pour: '' },
};

/** Tag beside the deepest sphere's refill word, on the pour screen and on its row. */
export const ESSENCE_UPKEEP_TAG = 'pays your upkeep';

/** Joins a refill word and the upkeep tag ("Refills steadily · pays your upkeep"). */
export const ESSENCE_REFILL_TAG_SEPARATOR = ' · ';

/**
 * The first sentence of the deepest sphere's row hover — the reason its row can
 * read one band slower than the pour screen said. `{word}` is the row word.
 */
export const ESSENCE_REFILL_UPKEEP_HOVER = '{word}: your threads’ upkeep is paid from this pool.';

/**
 * The key under the essence rows (Law 12): the rail's rows are too narrow for the
 * word at 1920 and 2560, so one line names what the dots beside each bar mean.
 */
export const ESSENCE_REFILL_KEY = 'how fast each pool refills';

/** The rung's accessible name, e.g. "Refills fast, 3 of 3". */
export function essenceRefillAriaLabel(band: EssenceRefillBand): string {
  const words = ESSENCE_REFILL_WORDS[band];
  return `${words.row}, ${words.rung} of ${ESSENCE_REFILL_RUNG_STEPS}`;
}
