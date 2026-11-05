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
 * The deepest sphere's refill sentence — the reason its row can read one band
 * slower than the pour screen said, and why a full pool sits one short of its
 * limit (upkeep is taken after the clamp). `{word}` is the row word.
 *
 * THR-2148 (plan `2026-11-02-thr-2143-the-sheet-says-what-grew.md` § Content):
 * says *when* and *why*, never an amount — the THR-1426 per-tick-rates ruling
 * keeps rates off player surfaces. The payers are counted in words. `one` takes
 * a single payer ("thread" / "place of power"), `many` a counted phrase.
 */
export const ESSENCE_REFILL_UPKEEP_HOVER = {
  one: '{word}. Your {payer} draws its upkeep from this pool, a little all day. So when it is full, it sits just under its limit.',
  many: '{word}. Your {payers} draw their upkeep from this pool, a little all day. So when it is full, it sits just under its limit.',
  /** Fail-soft: the payer walk could not be read. */
  unknown: '{word}. Your upkeep is drawn from this pool, a little all day. So when it is full, it sits just under its limit.',
} as const;

/** The payer nouns, singular and plural, for {@link ESSENCE_REFILL_UPKEEP_HOVER}. */
export const ESSENCE_UPKEEP_PAYER_NOUNS = {
  thread: { one: 'thread', many: 'threads' },
  source: { one: 'place of power', many: 'places of power' },
} as const;

/**
 * THR-2148 — the essence row hover's first sentence: the pool's limit and what it
 * is made of. Figures are whole numbers from `BASE_MAX_ESSENCE` and
 * `MAX_ESSENCE_PER_THREAD` (never literals), so retuning the economy retunes the
 * words. The `many` form is Christian's (chat, 2026-11-02, options (b) + (c));
 * the `none` and `one` forms are the design lane's.
 */
export const ESSENCE_CAP_HOVER = {
  none: 'Holds up to {cap}. Each mortal you thread lets every pool hold {perThread} more.',
  one: 'Holds up to {cap}: {base}, and {perThread} more for the mortal you have threaded.',
  many: 'Holds up to {cap}: {base}, and {perThread} more for each mortal you have threaded.',
} as const;

/**
 * THR-2148 — the row's balance with its limit ("53 / 55"). The Law 13 amendment
 * of 2026-11-02 widens the pool-balance exception to the pool's limit.
 */
export const ESSENCE_ROW_BALANCE = '{balance} / {cap}';

/** The balance's accessible name, e.g. "53 of 55". */
export const ESSENCE_ROW_BALANCE_ARIA = '{balance} of {cap}';

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
