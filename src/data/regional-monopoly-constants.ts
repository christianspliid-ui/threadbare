/**
 * Regional monopolies and embargo (THR-1955, war aims slice S2).
 *
 * Plan: `Docs/plans/2026-10-15-thr-1933-war-aims.md` § Engine 6–10 and § Constants.
 * The control share itself stays `MONOPOLY_CONTROL_FRACTION` in `economic-power-config.ts`
 * (0.6, now measured per region rather than world-wide).
 *
 * | Constant                          | Purpose                                                        |
 * |-----------------------------------|----------------------------------------------------------------|
 * | REGIONAL_MONOPOLY_ENABLED         | master switch; off = the old world-wide rule, no rent/embargo  |
 * | MONOPOLY_REGION_RADIUS_HEXES      | a regional market's radius around its anchor place             |
 * | MONOPOLY_REGION_MIN_PLACES        | bearing places a region needs before it can be held            |
 * | MONOPOLY_SCARCITY_RENT            | yield multiplier on a monopolised resource in the holder's purse |
 * | MONOPOLY_MIN_HOLD_DAYS            | de-duplicates a flapping share in the chronicle                |
 * | WAR_AIM_BONUS_BREAKS_MONOPOLY     | war-aim bonus: taking the town breaks an enemy's monopoly      |
 * | WAR_AIM_BONUS_COMPLETES_MONOPOLY  | war-aim bonus: taking the town completes the attacker's own    |
 * | EMBARGO_DAYS                      | how long an embargo lasts                                      |
 * | EMBARGO_BALANCE_CUT               | stock balance an embargoed town loses on the embargoed good    |
 * | EMBARGO_COOLDOWN_TICKS            | one embargo per holder per five days                           |
 * | EMBARGO_WEIGHT                    | selection weight among faction actions                         |
 */

/** Off = the THR-617 world-wide monopoly rule; no rent, no embargo, no monopoly war-aim bonus. */
export const REGIONAL_MONOPOLY_ENABLED = true;

/** A regional market reaches this many hexes from its anchor place. */
export const MONOPOLY_REGION_RADIUS_HEXES = 8;

/** Bearing places a region needs (within the radius of its anchor) before it can be held. */
export const MONOPOLY_REGION_MIN_PLACES = 3;

/** A monopolised resource's place yield counts this many times in its holder's purse. */
export const MONOPOLY_SCARCITY_RENT = 1.5;

/**
 * A monopoly must stand this many days before its loss is chronicled, and a re-formed one
 * is announced again only this long after its last loss (a flapping share says nothing).
 */
export const MONOPOLY_MIN_HOLD_DAYS = 3;

/** War-aim score bonus: taking the town drops an enemy below the control share in a region. */
export const WAR_AIM_BONUS_BREAKS_MONOPOLY = 0.5;

/** War-aim score bonus: taking the town lifts the attacker to the control share in a region. */
export const WAR_AIM_BONUS_COMPLETES_MONOPOLY = 1.0;

/** Days an embargo stands once laid. */
export const EMBARGO_DAYS = 6;

/**
 * Stock balance an embargoed town loses on the embargoed resource — enough to move
 * Adequate past `STOCK_SCARCE_THRESHOLD` (−0.3). Replaced by "the embargoed lanes carry
 * none of the good" once lanes move goods into stocks (THR-1923, plan § 9).
 */
export const EMBARGO_BALANCE_CUT = 0.4;

/** Ticks between two embargoes by the same holder (60 = five days). */
export const EMBARGO_COOLDOWN_TICKS = 60;

/** Base selection weight of `embargo` among the faction actions. */
export const EMBARGO_WEIGHT = 2;
