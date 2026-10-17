/**
 * Unrest as pressure (THR-1934 S1) — every number the target, the drift and the
 * Restless and Lawless effects read.
 *
 * Unrest no longer decays by a flat 1 a tick. Once a day each settlement's
 * **target** is summed from what the town lives through (hunger, poverty, a siege,
 * sickness, its recent dead, less its contentment), and every tick `unrest` moves
 * toward that target by at most `UNREST_DRIFT_PER_DAY / TICKS_PER_DAY`. One-off
 * pushes (Incite Unrest, doom cards, complications) ride on top and drift back at
 * the same rate.
 *
 * Plan: Docs/plans/2026-10-16-thr-1934-hunger-and-unrest.md § Constants.
 */

// ─── Rollback ─────────────────────────────────────────────────────────────────

/** Off = today's flat decay, the scarcity arc's unrest jumps and the per-tick health bleed. */
export const UNREST_PRESSURE_ENABLED = true;

// ─── Target and drift ─────────────────────────────────────────────────────────

/** Most unrest moves toward its target in a day (spread evenly over the day's ticks). */
export const UNREST_DRIFT_PER_DAY = 4;

/** Tick within the day (`tick % TICKS_PER_DAY`) on which the target is recomputed. */
export const UNREST_TARGET_TICK_OFFSET = 0;

/** Hunger term: the first hungry day. */
export const HUNGER_BASE = 10;
/** Hunger term: each further hungry day in a row. */
export const HUNGER_PER_DAY = 3;
/** Hunger term cap. Hunger drives most of the pressure, so it is the first lever (kill criteria). */
export const HUNGER_MAX = 55;

/** Prosperity below which want raises unrest. */
export const POVERTY_PIVOT = 35;
/** Unrest per point of prosperity under the pivot. */
export const POVERTY_PER_POINT = 0.6;
/** Poverty term cap. */
export const POVERTY_MAX = 20;

/** Siege term (flat, so also its cap) while an army besieges the town. */
export const SIEGE_PRESSURE = 30;
/** Days the siege term lingers after the last siege seen at the town. */
export const SIEGE_LINGER_DAYS = 5;

/** Sickness term (flat, so also its cap) while population health is below the line. */
export const SICK_PRESSURE = 10;
/** Population health below which a town counts as sick. */
export const SICK_HEALTH_LINE = 40;

/** Before the settlement economy: prosperity above which a town is content. */
export const PROSPERITY_CONTENT_LINE = 60;
/** Before the settlement economy: how much contentment lowers the target. */
export const PROSPERITY_CONTENT_RELIEF = 10;

// ─── Bands (for traces and the Fortunes row; the chips are location traits) ──

/** Unrest at which a town reads Restless (the `restless` trait's enter, below). */
export const UNREST_BAND_RESTLESS = 30;
/** Unrest at which a town reads Lawless (the `lawless` trait's enter). */
export const UNREST_BAND_LAWLESS = 50;
/** Unrest at which a town reads On the edge (S2's trait enter). */
export const UNREST_BAND_ON_THE_EDGE = 70;
/** Unrest at which a town rises (S2). */
export const UNREST_BAND_RISING = 90;

// ─── Restless — people leave ──────────────────────────────────────────────────

/** One person leaves a Restless town this often (days of being Restless). */
export const RESTLESS_LEAVE_DAYS = 3;
/** Hex radius within which a leaver looks for a fed, calm town. */
export const MIGRATION_RADIUS_HEXES = 6;
/** A Restless home counts this much poorer for a mortal's want of Means (one Means band). */
export const MEANS_RESTLESS_DROP = 20;

// ─── Lawless — riots ──────────────────────────────────────────────────────────

/** One Lawless-while-hungry granary riot seed per town at most this often (days). */
export const RIOT_SEED_COOLDOWN_DAYS = 10;
/**
 * The scene a hungry town's anger becomes — the scarcity arc's unrest phase and the
 * Lawless riot. A riot seed's delay and priority are the scarcity arc's
 * (`SCARCITY_ARC_SEED_DELAY_TICKS`, `SCARCITY_ARC_SEED_PRIORITY`), so both read alike.
 */
export const GRANARY_RIOT_TEMPLATE_ID = 'encounter.town.granary_riot';
