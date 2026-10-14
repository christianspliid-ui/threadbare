/**
 * Luck protection traces (`engine/luck.ts`, Game Design Laws § I).
 *
 * Registered in the THR-928 trio (`TraceCategory`, `TRACE_CATEGORIES`, `TraceEntry`).
 * Every protected roll and every Legendary cycle is traced, so a surprising streak
 * or a forced Legendary is diagnosable from the trace alone (Law 8, NFP #2).
 */

import type { TraceBase } from '../trace';

/** A protected mortal's d100 was dealt from its luck bag. */
export interface LuckBagRollTrace extends TraceBase {
  category: 'luck.bag_roll';
  /** The mortal's bag count before this roll — with the world seed, it reproduces the roll. */
  drawIndex: number;
  /** Which bag the roll came from. */
  bag: number;
  /** The d100 dealt, 1–100. */
  roll: number;
}

/** A protected mortal received a Legendary, closing a Legendary cycle. */
export interface LuckLegendaryCycleTrace extends TraceBase {
  category: 'luck.legendary_cycle';
  /** Wins it took, counting this one. */
  wins: number;
  /** The cycle's hidden deadline. */
  deadline: number;
  /** True when the deadline forced the Legendary rather than the roll. */
  forced: boolean;
  cycle: number;
}
