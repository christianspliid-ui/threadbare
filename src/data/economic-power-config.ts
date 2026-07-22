/**
 * Economic Power Constants — THR-617 (Mortal Economy P3).
 *
 * Monopoly resolution, sphere drift from sustained flows, and the faction
 * economic power term. All tunables named (NFP #1); defaults from the plan's
 * constants table (`Docs/plans/2026-07-04-mortal-economy-resource-web.md`).
 */

/** Regional control fraction of a resource's bearing locations that triggers Monopoly. */
export const MONOPOLY_CONTROL_FRACTION = 0.6;

/** Minimum bearing locations before a monopoly is even possible (one mine is not a monopoly). */
export const MONOPOLY_MIN_LOCATIONS = 2;

/** Ticks between economic-power scans (12 = one game day). */
export const ECON_POWER_SCAN_INTERVAL_TICKS = 12;

/** Local sphere-pressure drift per sustained flow, per tick of scan coverage. */
export const ECON_SPHERE_DRIFT_PER_TICK = 0.002;

/**
 * Weight of a faction's derived holdings prosperity (war chest, 0..~6) in its
 * GOLD raw capability score (pre-sigmoid). At 0.5 a broad landed faction adds
 * ~+1.5 raw gold — a solid but not dominating term next to trait/artifact
 * contributions.
 */
export const ECON_FACTION_POWER_WEIGHT = 0.5;

// ── Scarcity arcs (shortage → hoarding → unrest → flashpoint) ──────────────

/** Max simultaneously running scarcity arcs, world-wide (attention budget). */
export const SCARCITY_ARC_MAX_ACTIVE = 3;

/** Unrest added to the location when the arc reaches its unrest phase. */
export const SCARCITY_ARC_UNREST_DELTA = 12;

/** Unrest added when the arc reaches flashpoint. */
export const SCARCITY_ARC_FLASHPOINT_UNREST_DELTA = 25;

/** Ticks a seeded arc-intervention encounter waits before it may spawn. */
export const SCARCITY_ARC_SEED_DELAY_TICKS = 3;

/** Priority carried by arc-intervention seeds. */
export const SCARCITY_ARC_SEED_PRIORITY = 1.2;
