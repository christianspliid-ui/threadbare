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

// ─── Open the Markets ──────────────────────────────────────────────────────

/** Prosperity gain on a successful Open the Markets. */
export const LOC_OPEN_MARKETS_PROSPERITY_DELTA = 6;

/** Unrest delta on a successful Open the Markets (negative = cooling). */
export const LOC_OPEN_MARKETS_UNREST_DELTA = -10;

/** Settlement unrest threshold at or above which the thieves' guild encounter seeds. */
export const LOC_OPEN_MARKETS_THIEVES_GUILD_THRESHOLD = 75;

/** Tick delay before the thieves' guild encounter is eligible to fire. */
export const LOC_OPEN_MARKETS_THIEVES_DELAY_TICKS = 8;

/** Max hex distance for the auto-spawned `trades_with` partner search. */
export const LOC_OPEN_MARKETS_TRADE_RANGE_HEXES = 4;

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
