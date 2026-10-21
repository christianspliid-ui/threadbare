// src/data/mortal-means-constants.ts
//
// THR-1936 S1 — a mortal's Means: the birth pass, the outcome-table money steps and the
// poor-loss guard. THR-1952 S2 — the want on the board and the (switched-off) founding
// costs. Plan: Docs/plans/2026-10-15-thr-1936-mortal-wealth.md § Constants table.

import type { ProsperityTier } from '../engine/phaseProsperity';
import { WEALTH_TIER_COMFORTABLE, WEALTH_TIER_GETTING_BY, WEALTH_TIER_WEALTHY } from '../engine/wealth';
import { MEANS_CELL_COST_GUILD } from './undertaking-economy-constants';

/**
 * Master switch and rollback lever. Off: the birth pass does nothing, outcome tables are
 * not applied, and `economy_shift` writes nothing and returns no change — the game
 * behaves as it did before THR-1936.
 */
export const MORTAL_MEANS_ENABLED = true;

/** How a decider's home town's fortune shifts the Means they are born with. */
export const MEANS_BIRTH_HOME_SHIFT: Readonly<Record<ProsperityTier, number>> = {
  Flourishing: 10,
  Prosperous: 5,
  Modest: 0,
  Struggling: -5,
  Destitute: -10,
};

/** The outcome research table's "small" step (THR-1872). A band is 20 points wide. */
export const MEANS_STEP_SMALL = 3;
/** The research table's `+` / `−`: a third of a band. */
export const MEANS_STEP = 6;
/** The research table's `++` / `−−`. */
export const MEANS_STEP_BIG = 12;

/** The named steps an outcome table's `means` amount may use (content test). */
export const MEANS_NAMED_STEPS: readonly number[] = [MEANS_STEP_SMALL, MEANS_STEP, MEANS_STEP_BIG];

/** Getting by's floor. Below it a mortal is poor and a loss is scaled down. */
export const MEANS_POOR_LINE = WEALTH_TIER_GETTING_BY;

/** A loss on a mortal below `MEANS_POOR_LINE` is multiplied by this, so poverty never spirals. */
export const MEANS_POOR_LOSS_SCALE = 0.5;

// ─── S2 — the want (THR-1952; THR-1865's decided rule and prototype values) ────

/** Below this a mortal feels poverty: Comfortable's floor. */
export const MEANS_COMFORT_LINE = WEALTH_TIER_COMFORTABLE;

/** Poverty reaches 1 this many points below the comfort line (at 0 Means). */
export const MEANS_POVERTY_SPAN = 40;

/** A Generous lean softens poverty's pull: poverty × (1 − this × generosity). */
export const MEANS_GENEROSITY_DAMP = 0.5;

/** A Greedy lean adds this × greed to the want, at any Means. */
export const MEANS_GREED_WEIGHT = 0.5;

/** Wealthy's floor. At or above it a mortal who is not greedy turns away from coin work. */
export const MEANS_RICH_LINE = WEALTH_TIER_WEALTHY;

/** A rich mortal greedier than this keeps their want (is not damped). */
export const MEANS_RICH_GREED_CEILING = 0.3;

/** The want of a rich mortal who is not greedy (applied negative). */
export const MEANS_RICH_DAMPEN = 0.3;

/** Board multiplier on paying work: `1 + MEANS_WANT_WEIGHT × want` (range 0.82 … 1.9). */
export const MEANS_WANT_WEIGHT = 0.6;

/**
 * Undertaking cells that count as paying work, keyed `<cellVariant>×<objectTypeId>`:
 * draw yield, claim or seize a freehold or a toll, conduct trade, and claim a town.
 */
export const MEANS_EARNING_CELLS: ReadonlySet<string> = new Set([
  'use×location',
  'control:claim×place',
  'control:seize×place',
  'control:claim×route',
  'control:seize×route',
  'use×route',
  'control:claim×location',
]);

// ─── S2 — founding costs (switched off until the pace predicate holds) ──────

/**
 * Founding costs switch. On: a costed cell a mortal cannot afford leaves their board,
 * the cost is banked (`reason: 'founding'`) when the work starts, and an unaffordable
 * most-wanted cell adds `MEANS_UNAFFORDED_WANT`. Off: none of that runs.
 *
 * Stays off (THR-1952): `scripts/means-comfort-pace.ts` measured the median ticks for a
 * Getting-by decider to reach Comfortable above `MEANS_COMFORT_PACE_TARGET_TICKS`.
 */
export const MEANS_CELL_COST_ENABLED = false;

/** What founding costs, keyed like `MEANS_EARNING_CELLS`, on the 0–100 Means scale. */
export const MEANS_CELL_COST: Readonly<Record<string, number>> = {
  'create×location': 40,
  'create×place': 25,
  'create×route': 20,
  'change:raise×route': 10,
  // THR-1967 (undertakings S3): founding a guild; the guild's purse opens with it.
  'create×faction': MEANS_CELL_COST_GUILD,
};

/** Extra want while the mortal's most-wanted cell is one they cannot afford (costs on only). */
export const MEANS_UNAFFORDED_WANT = 0.3;

/** The cost switch's predicate: a Getting-by decider reaches Comfortable within this many ticks (median). */
export const MEANS_COMFORT_PACE_TARGET_TICKS = 120;
