/**
 * The crown — constants (THR-1932, from the THR-1917 decision and its prototype
 * `proto/thr-1917-crown` @ 0af26299).
 *
 * Plan: `Docs/plans/2026-10-15-thr-1932-crown.md` § Constants table.
 *
 * Realms win other factions' fealty by protection, coin or force, take a share of what
 * they earn, and lose them when they cannot pay, cannot defend, or are outbid. A realm
 * that holds CROWN_MIN_OATHS or more is a Crown (derived, never stored). The engine is
 * `src/engine/crown.ts`; every number it reads lives here. The never-swear lists are
 * data: a new faction type that should never swear is one array entry (Law 58).
 *
 * | Name                            | Purpose                                                        |
 * |---------------------------------|----------------------------------------------------------------|
 * | CROWN_ENABLED                   | master switch and rollback lever                               |
 * | CROWN_MIN_OATHS                 | oaths a realm holds to be a Crown                              |
 * | FEALTY_TAX_SHARE                | share of a vassal's day income the liege takes                 |
 * | OATH_*_W                        | offer score weights (protection, gift, standing, pride)        |
 * | OATH_PRIDE_CAP                  | cap on the pride ratio                                         |
 * | OATH_ACCEPT_THRESHOLD           | score at which a candidate swears                              |
 * | OATH_GIFT_DAYS                  | a full gift = this many days of the candidate's income         |
 * | OATH_GIFT_RESERVE               | coin a liege keeps back before offering a gift                 |
 * | OATH_THREAT_RADIUS_HEXES        | armies this near a candidate's holdings are threats            |
 * | OATH_NO_THREAT_PROTECTION       | protection value when nothing threatens                        |
 * | OATH_COERCE_MIN_SIEGE_TICKS     | siege length that forces an oath                               |
 * | OATH_COERCE_WINDOW_DAYS         | a town taken this recently still forces an oath                |
 * | OATH_RESWEAR_COOLDOWN_DAYS      | a broken pair waits this long                                  |
 * | OATH_RIVAL_MARGIN               | how much a rival offer must beat the live one                  |
 * | LOYALTY_START                   | starting loyalty by kind                                       |
 * | LOYALTY_RISE_* / LOYALTY_FALL_* | the daily loyalty table                                        |
 * | LOYALTY_FAIL_DEFENCE            | fall per holding lost while sworn                              |
 * | LOYALTY_ROUND_DECIMALS          | daily loyalty rounding (the break test reads tuning, not drift) |
 * | OATH_BREAK_THRESHOLD            | below this the oath breaks (= the Distrusted band)             |
 * | REBELLION_INCOME_RATIO          | a breaking realm earning this share of its liege's income rebels |
 * | NEVER_SWEAR_*                   | factions that never swear                                      |
 * | SEEK_FEALTY_WEIGHT              | selection weight of the courting action                        |
 * | SEEK_FEALTY_WINDOW_TICKS        | at most one courtship per realm per calendar day               |
 * | OATH_BREAK_SENTIMENT_DELTA      | a break's grudge on `relates_to`                               |
 * | OATH_REFUSAL_SENTIMENT_DELTA    | a refusal's cooling                                            |
 * | OATH_REFUSAL_SENTIMENT_FLOOR    | refusals alone never cross the rivalry threshold (−0.3)        |
 * | OATH_BREAK_REASON_WINDOW_DAYS   | days of loyalty losses kept on the edge to name a break        |
 * | FEALTY_LIST_FOLD                | vassals listed on the sheet before "and N more"                |
 */

import type { OathKind } from '../engine/crown/types';

/** Master switch. `false` restores the purse-only world everywhere the crown touches. */
export const CROWN_ENABLED = true;

export const CROWN_MIN_OATHS = 2;
export const FEALTY_TAX_SHARE = 0.3;

// ── Offer score ──
export const OATH_PROTECTION_W = 1.0;
export const OATH_GIFT_W = 0.8;
export const OATH_STANDING_W = 0.3;
export const OATH_PRIDE_W = 0.3;
export const OATH_PRIDE_CAP = 2;
export const OATH_ACCEPT_THRESHOLD = 0.85;
export const OATH_GIFT_DAYS = 30;
export const OATH_GIFT_RESERVE = 150;
export const OATH_THREAT_RADIUS_HEXES = 6;
export const OATH_NO_THREAT_PROTECTION = 0.5;

// ── Coercion and cooldowns ──
/**
 * Two days. A siege resolves by SIEGE_MAX_DURATION (40) and faction actions run every
 * FACTION_ACTION_INTERVAL (8) ticks, so the forcing window (this .. 39) must span at least
 * two action ticks or most sieges end before a realm can act on them. At 36 the window
 * held at most one action tick, and often none. Pinned by crown.test.ts.
 */
export const OATH_COERCE_MIN_SIEGE_TICKS = 24;
export const OATH_COERCE_WINDOW_DAYS = 5;
export const OATH_RESWEAR_COOLDOWN_DAYS = 20;
export const OATH_RIVAL_MARGIN = 0.1;

// ── Loyalty ──
export const LOYALTY_START: Readonly<Record<OathKind, number>> = {
  persuaded: 0.7,
  bought: 0.6,
  coerced: 0.35,
};
export const LOYALTY_RISE_WEALTHY = 0.01;
export const LOYALTY_FALL_STRAINED = 0.005;
export const LOYALTY_FALL_DESTITUTE = 0.01;
export const LOYALTY_FAIL_DEFENCE = 0.15;
/** Loyalty is rounded to this many decimals each day so the break test is not decided by float drift. */
export const LOYALTY_ROUND_DECIMALS = 6;
export const LOYALTY_FALL_OUTGROWN = 0.02;
export const LOYALTY_FALL_RIVAL_OFFER = 0.02;
export const OATH_BREAK_THRESHOLD = 0.2;
export const REBELLION_INCOME_RATIO = 0.5;

// ── Who never swears ──
export const NEVER_SWEAR_FACTION_TYPES: readonly string[] = ['criminal', 'monster'];
export const NEVER_SWEAR_DEF_IDS: readonly string[] = ['thieves_guild', 'underking_court'];
export const NEVER_SWEAR_GUILD_TYPES: readonly string[] = ['thieves'];

// ── The courting action ──
export const SEEK_FEALTY_WEIGHT = 6;
/**
 * At most one courtship per realm per calendar window of this many ticks (one day:
 * window = floor(tick / SEEK_FEALTY_WINDOW_TICKS)), checked in the `can_court`
 * prerequisite. Faction actions run every FACTION_ACTION_INTERVAL (8) ticks, so every
 * day holds one or two sweeps and a realm may court on every day.
 *
 * History (THR-1961): THR-1932 shipped a rolling 12-tick cooldown, which forces 16-tick
 * gaps (at most 75% of days; measured 68–73%). A calendar window was tried then and
 * measured ~50% — but that was the measure, not the rule: `measure:crown` counted a
 * rolling window ending at each day's first tick, which straddles two calendar days.
 * A courtship at a day's first sweep (tick 24k) closes that day's second sweep (24k+8),
 * and the straddling window saw only that blocked sweep. Counted by calendar day, the
 * window rule measured 84–97% of days on seeds 42/99/7 (2026-10-24).
 */
export const SEEK_FEALTY_WINDOW_TICKS = 12;

// ── Grudges ──
export const OATH_BREAK_SENTIMENT_DELTA = -0.3;
export const OATH_REFUSAL_SENTIMENT_DELTA = -0.02;
export const OATH_REFUSAL_SENTIMENT_FLOOR = -0.25;
export const OATH_BREAK_REASON_WINDOW_DAYS = 10;

// ── UI ──
export const FEALTY_LIST_FOLD = 8;

// ── Wages: a liege pays, feeds and commands its vassal's soldiers (THR-1974) ──
/**
 * Master switch for the four hire rules (plan `Docs/plans/2026-10-19-thr-1974-hiring-a-free-company.md`):
 * the price reads upkeep, the liege pays the soldiers its vassal cannot, an army it paid
 * eats from its towns and fights its enemies. Read through `crownWagesActive()`, which is
 * false whenever the crown is off.
 */
export const CROWN_WAGES_ENABLED = true;
/** Days of its own armies' upkeep a liege keeps back before it pays any vassal's wages. */
export const LIEGE_WAGE_RESERVE_DAYS = 2;
/** How long a wage stamp makes an army fight for, and eat from, its liege (one pay day = PURSE_CYCLE_TICKS). */
export const LIEGE_COMMAND_WINDOW_TICKS = 12;
/** Rule 1's upkeep half. Off → a gift is priced on the candidate's income alone (the pre-THR-1974 rule). */
export const OATH_PRICE_READS_UPKEEP = true;
/** Days between two wage chronicle lines for one vassal–liege pair. */
export const WAGES_CHRONICLE_MIN_GAP_DAYS = 5;
