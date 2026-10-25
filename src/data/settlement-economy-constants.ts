/**
 * The settlement economy — every number the phase reads (THR-1923).
 *
 * Each settlement works the land around it (à la Civ, never shipped along roads to even
 * out the map). Food surplus grows its people; wood and stone surplus raises buildings in
 * a few slots; a surplus with nowhere to go starts a trade route to sell it. Only a faction
 * seat that pulls resources in becomes a city. Tuning the feel of the economy is editing
 * this file (NFP #1) — never the phase.
 *
 * Defaults are the prototype's (`proto/thr-1923-settlement-economy` @ f35f6b2a), which held
 * the four diversity measures from day 50 to day 150 on seed 42. If the engine run fails a
 * measure, tune in this order: `PATH_BONUS`, `BUILDING_SLOTS`, the seat-pull rule
 * (`SEAT_MIN_INCOMING`), `LAND_PER_HOME` (plan § Grey zones).
 *
 * Plan: Docs/plans/2026-10-14-thr-1923-settlement-economy.md § Constants table.
 */

// ─── Switches ───────────────────────────────────────────────────────────────

/**
 * Master switch. `false` skips the phase and the worldgen settling run entirely, so the
 * game behaves as before the settlement economy. The rollback lever.
 */
export const SETTLEMENT_ECONOMY_ENABLED = true;

/**
 * Tier from population + seat. `false` restores the prosperity promotion trigger while the
 * rest of the economy runs.
 */
export const SETTLEMENT_ECONOMY_DRIVES_TIER = true;

/** Which tick of the day the phase runs (`tick % TICKS_PER_DAY`). */
export const SETTLEMENT_ECONOMY_TICK_OFFSET = 0;

/** Days of the worldgen settling run before tick 0, so day-0 sizes fit the land. */
export const SETTLEMENT_SETTLING_DAYS = 100;

// ─── Land ───────────────────────────────────────────────────────────────────

/** Hexes a settlement can work (the Civ city radius). */
export const WORK_RADIUS = 3;

/** The settlement's own hex always yields at least this: [food, wood, stone]. */
export const CENTRE_YIELD: readonly [number, number, number] = [2, 1, 1];

/** A deposit's quantity ÷ this = extra daily yield on its hex, in its channel. */
export const DEPOSIT_YIELD_DIVISOR = 50;

/** Food weight when choosing which hexes to work: normal, and while the store is short. */
export const WORK_FOOD_WEIGHT = 2;
export const WORK_FOOD_WEIGHT_SHORT = 3;

// ─── People ─────────────────────────────────────────────────────────────────

/** Daily food one person eats. */
export const FOOD_PER_PERSON = 1.5;

/** Daily wood/stone upkeep per person (firewood, repairs). */
export const WOOD_PER_PERSON = 0.25;

/** Food store size, in days of need. Christian's ruling: no stockpiles. */
export const STORE_DAYS = 3;

/** Growth meter size to gain one person: `GROWTH_BASE + GROWTH_PER_PERSON × population`. */
export const GROWTH_BASE = 12;
export const GROWTH_PER_PERSON = 4;

/** An empty store and meter for this many days loses one person (never below 1). */
export const STARVE_DAYS = 6;

/** Food per home in the land housing base. */
export const LAND_PER_HOME = 2.5;

/** Least homes any settlement has. */
export const LAND_HOUSING_MIN = 2;

/** Homes a housing quarter adds. */
export const HOUSING_PER_BUILDING = 3;

/** Genome start population per tier, before the land cap (the settling run's start). */
export const START_POPULATION: Readonly<Record<SettlementTier, number>> = {
  hamlet: 2, town: 5, city: 10, capital: 14,
};

// ─── Tiers and seats ────────────────────────────────────────────────────────

export type SettlementTier = 'hamlet' | 'town' | 'city' | 'capital';

/** The tier ladder, smallest first. */
export const SETTLEMENT_TIERS: readonly SettlementTier[] = ['hamlet', 'town', 'city', 'capital'];

/** Population thresholds for the tiers. */
export const TOWN_POP = 4;
export const CITY_POP = 10;
export const CAPITAL_POP = 14;

/** People under a tier's threshold before a settlement drops by size alone (hysteresis). */
export const TIER_DEMOTE_MARGIN = 1;

/**
 * Ceiling without a pulling seat: *"a town can be the outcome of a strong local economy
 * without the power structure to develop trade to the level a city needs."*
 */
export const TOWN_MAX_POP = 9;

/** Incoming surplus routes that make a seat with no holdings pull. */
export const SEAT_MIN_INCOMING = 2;

/** Homes per pull source, and the cap on pull sources. */
export const PULL_HOMES = 2;
export const PULL_MAX = 6;

/** Share of a held settlement's exportable surplus sent to its holder's seat each day. */
export const SEAT_DRAW = 0.5;

// ─── Buildings ──────────────────────────────────────────────────────────────

/** Room for buildings per tier. */
export const BUILDING_SLOTS: Readonly<Record<SettlementTier, number>> = {
  hamlet: 2, town: 3, city: 5, capital: 6,
};

/** Base score of every candidate building. */
export const BUILD_SCORE_BASE = 1;
/** Pull toward a building whose tag matches the settlement's largest surplus channel. */
export const SURPLUS_TAG_BONUS = 1.0;
/** Pull toward food buildings on rich land. */
export const FOOD_RICH_BONUS = 0.8;
/** Food yield ÷ need that counts as rich land. */
export const FOOD_RICH_RATIO = 1.3;
/** Pull toward a building that a special good in reach unlocks (one with a trait). */
export const SPECIAL_GOOD_BONUS = 1.2;
/** Pull toward housing when the population is within one of its cap. */
export const HOUSING_PRESSURE_BONUS = 1.5;
/** Per owned building sharing the candidate's tag — path dependence, a town's character. */
export const PATH_BONUS = 1.0;
/** Pull toward the holder faction's natural building. */
export const LEAN_BONUS = 0.5;
/** Seeded tie-break, one draw per candidate in building-table order. */
export const BUILD_CHOICE_JITTER = 0.25;

/** Idle days before a building is lost. */
export const IDLE_DAYS_TO_LOSE = 20;

// ─── Surplus routes ─────────────────────────────────────────────────────────

/** Hexes a seller looks for a buyer. */
export const SURPLUS_ROUTE_RANGE = 8;
/** Surplus days before a route is born. */
export const ROUTE_PERSIST_DAYS = 3;
/** Dry days before a route ends. */
export const ROUTE_DIE_DAYS = 6;
/** Below this, a day's exportable amount counts as no surplus (the sketch's 0.5). */
export const SURPLUS_MIN_PER_DAY = 0.5;
/** Share of carried goods that reaches the buyer's build meter (food arrives in full). */
export const GOODS_IMPORT_FACTOR = 0.5;
/** `volume` per unit carried per day, capped at `TRADE_ROUTE_MAX_VOLUME`. */
export const SURPLUS_ROUTE_VOLUME_PER_UNIT = 1;
/** The `establishedBy` stamp a surplus route carries (`trades_with`). */
export const SURPLUS_ROUTE_ESTABLISHED_BY = 'surplus';

// ─── Land shocks ────────────────────────────────────────────────────────────

/** Blight / Sour Mine: the best food / stone hex yields this share. */
export const SHOCK_BLIGHT_FACTOR = 0.3;
/** Bless the Harvest / Reveal Vein: the best hex yields this multiple. */
export const SHOCK_BOON_FACTOR = 1.5;
/** While a siege names the settlement, every owned hex but the centre yields this share. */
export const SHOCK_SIEGE_FACTOR = 0.2;
/** God-verb shocks fade linearly back to 1 over this many days. */
export const SHOCK_DAYS = 20;

// ─── Special goods and traits ───────────────────────────────────────────────

/** An ore deposit at or above this quantity counts as the special good `ore`. */
export const ORE_SPECIAL_MIN = 60;

/** *Breadbasket*: land food per worked hex to enter, and to release. */
export const BREADBASKET_ENTER = 3.0;
export const BREADBASKET_RELEASE = 2.6;

/**
 * *Market Town*: routes touching a settlement with a market, to enter and to release.
 * The plan's 3 / 2 put the trait on 53% of seed 42's settlements in the engine run
 * (measure 3 caps any trait at half); 4 / 3 reads 47% there and 31% on seed 99
 * (measured 2026-10-25, the phase alone, 150 days after the settling run).
 */
export const MARKET_TOWN_ENTER = 4;
export const MARKET_TOWN_RELEASE = 3;

// ─── Happiness → unrest ─────────────────────────────────────────────────────

/** A starving settlement's chronicle line is told at most once in this many days (one famine, one line). */
export const STARVING_CHRONICLE_COOLDOWN_DAYS = 30;

/** Happiness a settlement with any surplus route gets. */
export const ROUTE_HAPPY = 1;
/**
 * Happiness a starving settlement loses. Kept for the trace and the debug view only: the
 * unrest target has its own hunger input (THR-1934), so the contentment term leaves this
 * out and a hungry town is never counted twice.
 */
export const HUNGER_UNHAPPY = -2;
/** One point of unhappiness per this many people (crowding). */
export const CROWDING_PER_UNHAPPY = 5;
/** Unrest per point of happiness in the contentment input. */
export const UNREST_FROM_HAPPINESS = 4;
/** Bound on the contentment input either way. */
export const UNREST_HAPPINESS_MAX = 20;

// ─── The diversity measures (THR-1866) ──────────────────────────────────────

/** Measures 1 and 4: the size CV may drop by at most this. */
export const DIVERSITY_SIZE_CV_TOLERANCE = 0.02;
/** Measure 2: share of same-tier pairs that must share less than half their buildings. */
export const DIVERSITY_DISTINCT_PAIR_MIN = 0.5;
/** Measure 3: no trait on more than this share of settlements. */
export const DIVERSITY_TOP_TRAIT_MAX = 0.5;
/** Measure 3: distinct trait sets ÷ settlements must reach this. */
export const DIVERSITY_COMBOS_MIN_SHARE = 0.33;
/** Measure 4: the distinct-pair share may drop by at most this from day 50 to day 150. */
export const DIVERSITY_DISTINCT_DRIFT_TOLERANCE = 0.05;
/** Measure 4: the trait-combination count may drop by at most this. */
export const DIVERSITY_COMBOS_DRIFT_TOLERANCE = 1;
