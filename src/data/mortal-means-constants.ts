// src/data/mortal-means-constants.ts
//
// THR-1936 S1 — a mortal's Means: the birth pass, the outcome-table money steps and the
// poor-loss guard. Plan: Docs/plans/2026-10-15-thr-1936-mortal-wealth.md § Constants table.
// The want (S2) and the founding costs (S2) add their constants here when they ship.

import type { ProsperityTier } from '../engine/phaseProsperity';
import { WEALTH_TIER_GETTING_BY } from '../engine/wealth';

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
