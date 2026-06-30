/**
 * Tunable constants for the Core personality layer (THR-542, slice 1).
 *
 * Every magic number the Core mechanics use is named here (NFP #1 — tunability).
 * Changing Core feel = changing a number, not rewriting logic.
 */

// ─── Birth seeding (central-limit baseline) ─────────────────────────────────

/**
 * How many small ± draws are summed per continuum at birth. Summing several
 * independent draws yields a roughly normal baseline (central-limit) clustered
 * near neutral — most agents are born close to 0.5, extremes are rare. The
 * content slice's Core origin-vignette library will later add authored signed
 * contributions on top of this draw.
 */
export const CORE_SEED_DRAW_COUNT = 6;

/**
 * Half-width of each uniform seed draw, i.e. each draw is in
 * `[-CORE_SEED_DRAW_MAGNITUDE, +CORE_SEED_DRAW_MAGNITUDE]`. With
 * `CORE_SEED_DRAW_COUNT = 6` this gives a baseline spread of roughly ±0.11 (1σ)
 * around 0.5 — visible variation without anyone born at an extreme pole.
 */
export const CORE_SEED_DRAW_MAGNITUDE = 0.08;

// ─── Emergence thresholds (hysteresis) ──────────────────────────────────────
// Mirror the reach-axis emergent-trait thresholds (personality-trait-content.ts)
// so the two personality layers read consistently.

/** Live Core position at/above which a virtue continuum "emerges". */
export const CORE_EMERGENCE_VIRTUE_THRESHOLD = 0.8;
/** Live Core position at/below which a vice continuum "emerges". */
export const CORE_EMERGENCE_VICE_THRESHOLD = 0.2;
/** Hysteresis dead-band: release only after falling this far back inside. */
export const CORE_EMERGENCE_RELEASE_BAND = 0.15;
/** Derived: virtue emergence releases below this (0.8 − 0.15). */
export const CORE_EMERGENCE_VIRTUE_RELEASE = CORE_EMERGENCE_VIRTUE_THRESHOLD - CORE_EMERGENCE_RELEASE_BAND;
/** Derived: vice emergence releases above this (0.2 + 0.15). */
export const CORE_EMERGENCE_VICE_RELEASE = CORE_EMERGENCE_VICE_THRESHOLD + CORE_EMERGENCE_RELEASE_BAND;

// ─── Bend (directional coupling under low Quintessence) ──────────────────────

/**
 * Normalized Quintessence (`quintessence / quintessenceMax`, 0–1, low = less
 * self left) **below** which an agent starts to bend. At/above this the agent
 * holds their standing self and the Core contributes no bend. Couple
 * directionally, not evaluatively (see `coreRegistry.ts` canon-safe framing).
 */
export const CORE_BEND_QUINTESSENCE_THRESHOLD = 0.3;

/**
 * Strength of a single Core→reach bend nudge at full deviation. The actual nudge
 * scales with how far the continuum sits from neutral, so a barely-Cold agent
 * bends a coupled reach far less than a deeply-Cold one. This is a nudge that is
 * ADDED to reach drift by the consuming slice — it never caps a reach axis (the
 * cold philanthropist stays possible).
 */
export const CORE_BEND_MAGNITUDE = 0.1;

// ─── Colour (runtime expression tone) ───────────────────────────────────────

/**
 * Integrity (`core_integrity`, True↔False) at/above which an act reads as
 * sincere rather than performative — the "same Brave act is courage on a True
 * self, swagger on a False one" seam.
 */
export const CORE_COLOUR_SINCERE_THRESHOLD = 0.6;
/**
 * Humility (`core_humility`, Humble↔Proud) at/below which an act reads as
 * swaggering/performative regardless of integrity (Proud self).
 */
export const CORE_COLOUR_PROUD_THRESHOLD = 0.35;
