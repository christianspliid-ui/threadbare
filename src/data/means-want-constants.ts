/**
 * THR-1865 PROTOTYPE — Means as a want and a cost. THROWAWAY: lives only on the
 * never-merged branch `proto/thr-1865-means-want`. Every number of the sketched rule
 * set is here, in one file (NFP #1).
 */

/** Master toggle for the whole rule set (birth wealth, want, cost). */
export const MEANS_WANT_ENABLED = true;

/**
 * Runtime override of `MEANS_WANT_ENABLED`, so the sketch can run an unmodified
 * baseline in a child process without editing source. Prototype-only seam.
 */
export const meansWantRuntime: { enabled: boolean } = { enabled: MEANS_WANT_ENABLED };

/** Fallback birth wealth for a spotlight mortal whose role the ROLE_WEALTH table does not name. */
export const MEANS_BIRTH_DEFAULT_WEALTH = 20;

/** Below this wealth a mortal feels poverty; the Comfortable band's floor. */
export const MEANS_COMFORT_LINE = 40;

/** Poverty spans this many wealth points below the comfort line (0 wealth = full poverty). */
export const MEANS_POVERTY_SPAN = 40;

/** How much a Generous lean damps poverty's pull: want × (1 − this × generosity). */
export const MEANS_GENEROSITY_DAMP = 0.5;

/** How much a Greedy lean adds to the want regardless of wealth. */
export const MEANS_GREED_WEIGHT = 0.5;

/** At or above this wealth a non-greedy mortal is "rich" and earning work is damped. */
export const MEANS_RICH_LINE = 60;

/** A rich mortal counts as greedy (and is not damped) at or above this greed. */
export const MEANS_RICH_GREED_CEILING = 0.3;

/** The (negative) want a rich, non-greedy mortal carries toward earning work. */
export const MEANS_RICH_DAMPEN = 0.3;

/** Board multiplier on earning work: 1 + this × want. */
export const MEANS_WANT_WEIGHT = 0.6;

/** Extra want while the mortal's top-desired cell is unaffordable. */
export const MEANS_UNAFFORDED_WANT = 0.3;

/**
 * Wealth cost of a cell, keyed `<cellVariant>×<objectTypeId>`. Charged when the
 * work starts; an actor below it never sees the candidate.
 */
export const MEANS_CELL_COST: Readonly<Record<string, number>> = {
  'create×location': 40,
  'create×place': 25,
  'create×route': 20,
  'change:raise×route': 10,
};

/**
 * Earning cells, keyed the same way: draw yield, freehold claim/seize, toll
 * claim/seize, conduct trade.
 */
export const MEANS_EARNING_CELLS: ReadonlySet<string> = new Set([
  'use×location',
  'control:claim×place',
  'control:seize×place',
  'control:claim×route',
  'control:seize×route',
  'use×route',
]);

/** Encounter types that count as earning work. */
export const MEANS_EARNING_ENCOUNTER_TYPES: ReadonlySet<string> = new Set([
  'trade', 'acquire', 'steal', 'hire',
]);
