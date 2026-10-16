/**
 * Death-site haunting — the bounded unrest a recent death leaves on a place (THR-1925).
 *
 * The doom identity's `deathSiteUnrestBonus` (0–3) used to be added to `unrest`
 * every tick at any place with `deathCount > 0`, and `deathCount` never falls. With
 * `UNREST_DECAY_RATE` 1, one death pinned a town at 100 under Reckoning (+3) and
 * Breach (+2), and froze it under Sundering (+1).
 *
 * Now the haunting is a **target**, not an add: the place is lifted toward
 * `bonus × DEATH_SITE_UNREST_TARGET_SCALE` (capped at `DEATH_SITE_UNREST_TARGET_MAX`)
 * once a day, and the target fades linearly to 0 over
 * `DEATH_SITE_HAUNTING_WINDOW_TICKS` after the last death there. Past the window
 * ordinary decay carries the town back down.
 *
 * This is the once-a-day stopgap the ticket names. The hunger-and-unrest S1 build
 * (THR-1934) reads the same target, written as `deathSiteUnrestTarget`, as its
 * `deathSite` input.
 *
 * | Identity  | bonus | target (×4, cap 12) |
 * |-----------|-------|---------------------|
 * | Reckoning | 3     | 12                  |
 * | Breach    | 2     | 8                   |
 * | Sundering | 1     | 4                   |
 */

/** Unrest target per point of the identity's `deathSiteUnrestBonus`. */
export const DEATH_SITE_UNREST_TARGET_SCALE = 4;

/** Ceiling on the death-site unrest target, whatever the bonus. */
export const DEATH_SITE_UNREST_TARGET_MAX = 12;

/** Ticks after the last death there over which the target fades to 0 (10 days at 12 ticks a day). */
export const DEATH_SITE_HAUNTING_WINDOW_TICKS = 120;

/** The haunting is applied once per this many ticks — one day (`TICKS_PER_DAY` 12). */
export const DEATH_SITE_HAUNTING_CADENCE_TICKS = 12;

/** Location property: the tick of the most recent death recorded at the place. */
export const LAST_DEATH_TICK_PROPERTY = 'lastDeathTick';

/** Location property: the current haunting target, for traces, the debug view and THR-1934's `deathSite` input. */
export const DEATH_SITE_UNREST_TARGET_PROPERTY = 'deathSiteUnrestTarget';
