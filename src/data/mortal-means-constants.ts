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

// ─── Encounter debts (THR-2023) ─────────────────────────────────────

/** Kill switch for the `debt_settle` aftermath effect. Off, it no-ops with `debt_settle_noop reason:'disabled'`. */
export const ENCOUNTER_DEBT_SETTLE_ENABLED = true;
/** Means a debtor pays when a debt is settled `paid` (scaled down below Getting by, like every loss). */
export const DEBT_REPAY_MEANS = MEANS_STEP;
/**
 * Means the lender lays out and the borrower receives in The Loan. Kept equal to
 * `DEBT_REPAY_MEANS` so a collected loan nets the lender zero. A named step, so the
 * outcome-table content test holds; retuning it off-step means adding the value to
 * `MEANS_NAMED_STEPS` in the same edit.
 */
export const LOAN_PRINCIPAL_MEANS = MEANS_STEP;
/** The borrower's sentiment toward the lender on The Loan's failure. */
export const LOAN_RESENTMENT_SENTIMENT = -0.1;
/** The same on critical failure. */
export const LOAN_RESENTMENT_SENTIMENT_CRIT = -0.2;

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
 * May switch on only when **both** measured predicates hold (THR-2006 / THR-2008):
 *   1. comfort pace — `npm run measure:means`: the median ticks for a Getting-by decider
 *      to reach Comfortable is at most `MEANS_COMFORT_PACE_TARGET_TICKS`;
 *   2. the founding-starvation floor — `npm run measure:founding-starvation`, patron arm:
 *      on every gate seed (`FOUNDING_GATE_SEEDS`), foundings with costs and the patron on
 *      are at least `FOUNDING_STARVATION_FLOOR` × foundings with costs off.
 * Stays off: comfort pace measured 514 ticks against 120 (THR-1952). The floor passes
 * with the patron (THR-2008, 2026-10-24, 600 ticks: seeds 7/42/99 founded 2/4/4 with
 * costs and the patron on against 2/5/3 with costs off; 1/2/0 with costs alone).
 */
export const MEANS_CELL_COST_ENABLED = false;

/**
 * THR-2008 — the founding patron. While founding costs are on, a mortal who cannot pay
 * a costed cell can still take it when their highest-ranked purse faction's treasury
 * covers the cost; that faction pays the whole cost (`foundingPatron.ts`). Read only
 * while `MEANS_CELL_COST_ENABLED`.
 */
export const FOUNDING_PATRON_ENABLED = true;

/** The seeds the founding-starvation floor is measured on before the cost switch may flip. */
export const FOUNDING_GATE_SEEDS: readonly number[] = [42, 7, 99];

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
