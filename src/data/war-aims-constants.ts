/**
 * War aims (THR-1933, slice S1) — tuning for how an army chooses what to march on.
 *
 * Plan: `Docs/plans/2026-10-15-thr-1933-war-aims.md` § Constants. Decisions: THR-1868
 * (enemies only; defence first within 8 hexes; else the richest enemy town in reach,
 * score = value × (1 + bonuses) ÷ (1 + hexes / 6)).
 *
 * | Constant                         | Purpose                                                        |
 * |----------------------------------|----------------------------------------------------------------|
 * | WAR_AIMS_ENABLED                 | master switch; off = THR-1922 nearest-enemy targeting          |
 * | WAR_AIM_DEFENCE_RADIUS_HEXES     | a threatened holding this near is defended first               |
 * | WAR_AIM_HALF_VALUE_HEXES         | a town this far away is worth half                             |
 * | WAR_AIM_MAX_REACH_HEXES          | backstop on top of the supply walk                             |
 * | WAR_AIM_FIELD_RADIUS_HEXES       | unheld resource places this near count in a town's value      |
 * | WAR_AIM_BONUS_FEEDS_STAPLE       | the town grows a staple the attacker's towns are short of     |
 * | WAR_AIM_REVENGE_FOCUS            | revenge prefers the faction it holds the grievance against    |
 * | WAR_AIM_REAIM_INTERVAL_TICKS     | armies re-aim once a day                                      |
 * | WAR_AIM_TOP_CANDIDATES           | how many scored candidates the debug view keeps              |
 * | WAR_AIM_FALLBACK_VALUE_DIVISOR   | purse-absent fallback: prosperity ÷ this                      |
 *
 * S2 (regional monopolies) adds its own constants on its own ticket.
 */

/** Off = the THR-1922 nearest-enemy targeting and enemy rule, unchanged (rollback). */
export const WAR_AIMS_ENABLED = true;

/** A protected holding under threat within this many hexes of the army is defended first. */
export const WAR_AIM_DEFENCE_RADIUS_HEXES = 8;

/** Distance discount: a town this many hexes away scores half its value. */
export const WAR_AIM_HALF_VALUE_HEXES = 6;

/** Hard reach backstop on top of the supply walk, in hexes from the army. */
export const WAR_AIM_MAX_REACH_HEXES = 16;

/** Unheld resource places within this many hexes of a town count toward its value. */
export const WAR_AIM_FIELD_RADIUS_HEXES = 3;

/** Bonus when the town (or its fields) bears a staple scarce in one of the attacker's towns. */
export const WAR_AIM_BONUS_FEEDS_STAPLE = 0.5;

/** Score multiplier on towns of the faction a revenge ambition holds its grievance against. */
export const WAR_AIM_REVENGE_FOCUS = 1.5;

/** Armies re-aim on ticks divisible by this (12 ticks = one day). */
export const WAR_AIM_REAIM_INTERVAL_TICKS = 12;

/** Scored candidates kept on the army for the debug Armies tab and `__DEBUG.getWarAims`. */
export const WAR_AIM_TOP_CANDIDATES = 3;

/** Purse-absent fallback town value: prosperity ÷ this (the sketch's tax proxy). */
export const WAR_AIM_FALLBACK_VALUE_DIVISOR = 100;

/**
 * Whether "in reach" also needs a supply line from the target town (`resolveSupplyLine`).
 * **Off — the plan's kill criterion fired** (THR-1933 § Kill criteria): on seed 42 medium at
 * tick 160 the one fielded army had 7 enemy towns within 16 hexes and 0 in supply reach,
 * so no army ever marched. Reach is a march path plus `WAR_AIM_MAX_REACH_HEXES`.
 */
export const WAR_AIM_REQUIRE_SUPPLY_REACH = false;
