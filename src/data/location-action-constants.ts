/**
 * Location action expansion constants (THR-401).
 *
 * Every tunable number from the six new location-targeting verbs and the
 * settlement-property economy that supports them. NFP #1 (Tunability):
 * changing game feel = changing a number, not rewriting logic.
 *
 * Design doc: Docs/plans/2026-05-12-location-action-expansion.md §5.6
 */

// ─── Bless the Harvest ─────────────────────────────────────────────────────

/** Prosperity gain when Bless the Harvest succeeds. */
export const LOC_BLESS_HARVEST_PROSPERITY_DELTA = 12;

/** Population-health gain when Bless the Harvest succeeds. */
export const LOC_BLESS_HARVEST_HEALTH_DELTA = 15;

/** Ticks the migration-pull hook stays active after Bless the Harvest. */
export const LOC_BLESS_HARVEST_DURATION_TICKS = 8;

// ─── Bless the Harvest / Blight — resource stock-tier deltas (THR-616 P2) ───
//
// The economic dimension of the two first divine economic verbs: they now move
// the P1 resource stock substrate (`resourceEconomy.ts`), not just prosperity.
// Each verb bumps the `quantity` of every *staple* resource at the target by a
// named delta; the coarse tier (`scarce | adequate | surplus`) re-derives next
// tick in `phaseResourceStockTiers`. Bless swells the granaries toward Glut;
// Blight draws them toward Famine.

/** Quantity (0-100 scale) added to each staple resource when Bless the Harvest succeeds. */
export const LOC_BLESS_HARVEST_STOCK_DELTA = 25;

/** Quantity (0-100 scale) removed from each staple resource when Blight succeeds. */
export const LOC_BLIGHT_STOCK_DELTA = 25;

/** Prosperity loss when Blight succeeds (negative — the inverse pole of Bless). */
export const LOC_BLIGHT_PROSPERITY_DELTA = -10;

/** Population-health loss when Blight succeeds (negative). */
export const LOC_BLIGHT_HEALTH_DELTA = -12;

// ─── Open the Markets ──────────────────────────────────────────────────────

/** Prosperity gain on a successful Open the Markets. */
export const LOC_OPEN_MARKETS_PROSPERITY_DELTA = 6;

/** Unrest delta on a successful Open the Markets (negative = cooling). */
export const LOC_OPEN_MARKETS_UNREST_DELTA = -10;

/**
 * Settlement prosperity at or above which, after Open the Markets, a Shadow-led
 * resident is drawn to found a guild — a thieves' guild (THR-1969; read by
 * `thievesGuildOfferWant`, `godsStake.ts`).
 */
export const LOC_OPEN_MARKETS_THIEVES_GUILD_THRESHOLD = 75;

/** Ticks after Open the Markets before the thieves' guild boost opens (THR-1969). */
export const LOC_OPEN_MARKETS_THIEVES_DELAY_TICKS = 8;

// LOC_OPEN_MARKETS_TRADE_RANGE_HEXES (4) was deleted by THR-1969: no reader ever
// searched for a trade partner, and the god's-stake plan gives it none.

// ─── Stoke the Forges (THR-2086) ───────────────────────────────────────────

/**
 * Prosperity gain on a successful Stoke the Forges. Matches Open the Markets; at or
 * above `ECON_SHOCK_DELTA` (5) the swing reads as a boom shock and plants scenes on
 * the town's mortals.
 */
export const LOC_STOKE_FORGES_PROSPERITY_DELTA = 6;

/** Unrest gain on a successful Stoke the Forges — energy drives and frays; a quarter of Incite Unrest's. */
export const LOC_STOKE_FORGES_UNREST_DELTA = 5;

// ─── Lay the Footings / Keep the Stores (THR-2089) ─────────────────────────

/**
 * Build progress a successful Lay the Footings adds to a settlement's `buildProgress`
 * — a third of the cheapest building's cost (15, `settlement-buildings.ts`).
 */
export const LOC_LAY_FOOTINGS_BUILD_DELTA = 5;

/**
 * Food a successful Keep the Stores adds to a settlement's `foodStore` before the next
 * economy tick clamps it to STORE_DAYS of need — about one day's need for a town of 8
 * (`FOOD_PER_PERSON` 1.5).
 */
export const LOC_KEEP_STORES_FOOD_DELTA = 12;

// ─── THR-2090: cheap life / entropy / spirit place cards ───────────────────

/**
 * Health a successful Tend the Sick adds to `populationHealth`. A sick town (under 40)
 * needs a few casts, or one cast and a few ticks' recovery; above the 80 baseline the
 * gain eases back 1 a tick.
 */
export const LOC_TEND_SICK_HEALTH_DELTA = 10;

/**
 * Health a successful Let the Damp In removes from `populationHealth`. From the 80
 * baseline, five casts against +1 a tick of recovery bring a town under 40. Sicken the
 * Wells (tier 2, 6 essence) is the fast, loud form.
 */
export const LOC_LET_DAMP_IN_HEALTH_DELTA = 8;

/**
 * Unrest a successful Keep the Vigil removes; a quarter of Incite Unrest's, and under
 * Open the Markets' 10 (a 3-essence gift).
 */
export const LOC_KEEP_VIGIL_UNREST_DELTA = 4;

// ─── Sanctify the Square ───────────────────────────────────────────────────

/** Magical saturation gain on a successful Sanctify the Square. */
export const LOC_SANCTIFY_MAGSAT_DELTA = 0.15;

/** Divine-presence gain on a successful Sanctify the Square. */
export const LOC_SANCTIFY_DIVINE_PRESENCE_DELTA = 0.20;

/** Thread devotion bonus applied to threaded agents at this location. */
export const LOC_SANCTIFY_THREAD_DEVOTION_DELTA = 2;

// ─── Awaken the Spirit of the Place ────────────────────────────────────────

/** Divine-presence gain when the spirit awakens. */
export const LOC_AWAKEN_SPIRIT_PRESENCE_DELTA = 0.25;

/** Tick delay before the founders-return encounter fires. */
export const LOC_AWAKEN_SPIRIT_DELAY_TICKS = 6;

// ─── Sicken the Wells ──────────────────────────────────────────────────────

/** Population-health loss on a successful Sicken the Wells (negative). */
export const LOC_SICKEN_WELLS_HEALTH_DELTA = -25;

/** Unrest delta on a successful Sicken the Wells. */
export const LOC_SICKEN_WELLS_UNREST_DELTA = 15;

/** Magical saturation delta on a successful Sicken the Wells (negative). */
export const LOC_SICKEN_WELLS_MAGSAT_DELTA = -0.10;

/** Ticks the `wellsSickenedUntilTick` flag stays set after Sicken the Wells. */
export const LOC_SICKEN_WELLS_DURATION_TICKS = 10;

/** Tick delay before the plague-investigation encounter fires. */
export const LOC_SICKEN_WELLS_INVESTIGATION_DELAY_TICKS = 4;

// ─── Curse the Roads ───────────────────────────────────────────────────────

/** Ticks the `routesCursedUntilTick` flag stays set after Curse the Roads. */
export const LOC_CURSE_ROADS_DURATION_TICKS = 12;

/** Unrest delta when Curse the Roads succeeds (isolation breeds discontent). */
export const LOC_CURSE_ROADS_UNREST_DELTA = 10;

/** Tick delay before the bandit-emergence encounter fires. */
export const LOC_CURSE_ROADS_BANDIT_DELAY_TICKS = 6;

// ─── Population Health Economy ─────────────────────────────────────────────

/** Default `populationHealth` value for a settlement when the property is absent. */
export const LOC_HEALTH_DEFAULT_BASELINE = 80;

/** Natural per-tick recovery of populationHealth toward LOC_HEALTH_DEFAULT_BASELINE. */
export const LOC_HEALTH_RECOVERY_RATE = 1;

/** Multiplier applied to the prosperity equilibrium target when health is below threshold. */
export const LOC_HEALTH_PROSPERITY_DAMPENER = 0.7;

/** Per-tick unrest bleed when populationHealth is below the dampener threshold. */
export const LOC_HEALTH_UNREST_BLEED = 1;

/** Health threshold at or below which the prosperity dampener and unrest bleed kick in. */
export const LOC_HEALTH_DAMPENER_THRESHOLD = 50;

// ─── Divine Presence Economy ───────────────────────────────────────────────

/** Per-tick decay of divinePresence toward 0. */
export const LOC_PRESENCE_DECAY_RATE = 0.01;

/** Flat prosperity bonus when divinePresence is at or above LOC_PRESENCE_PROSPERITY_THRESHOLD. */
export const LOC_PRESENCE_PROSPERITY_BONUS = 2;

/** divinePresence threshold at or above which the flat prosperity bonus applies. */
export const LOC_PRESENCE_PROSPERITY_THRESHOLD = 0.5;

// ── THR-618 P4: the remaining divine economic verbs ────────────────────────

/** Quantity a revealed vein starts with on the 0-100 abundance scale. */
export const LOC_REVEAL_VEIN_QUANTITY = 35;

/** Quantity boost when Reveal the Vein targets a location whose eligible deposit already exists. */
export const LOC_REVEAL_VEIN_BOOST = 20;

/** Volume added to every trade route touching a guided settlement (clamped at the route max). */
export const LOC_GUIDE_CARAVAN_VOLUME_DELTA = 1;

/** Quantity drained from every non-staple deposit at a soured location. */
export const LOC_SOUR_MINE_STOCK_DELTA = 25;
