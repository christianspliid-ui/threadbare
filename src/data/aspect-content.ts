/**
 * Aspect Content Package — apex-milestone constants and prose (THR-479).
 *
 * ═══════════════════════════════════════════════════════════════════
 * CONTENT MANAGER: This is the file you edit to tune how a mortal
 * becomes an *Aspect* of the god (the beyond-tier-4 apex milestone),
 * how much a living Aspect channels, and the prose surfaced at
 * attainment and at the Aspect's death (mythic echo).
 *
 * "Aspect" is NOT a sixth Influence tier. The tier ladder stays five
 * integer rungs (0|1|2|3|4). Aspect is a distinct apex reached by a
 * handful of mortals per run, modelled as an `aspect_of` graph edge
 * (ascendant → mortal), never garbage-collected. See
 * Docs/plans/2026-06-23-thr479-aspect-apex-state.md.
 * ═══════════════════════════════════════════════════════════════════
 */

// ─── Tuning constants (NFP #1) ───────────────────────────────────────

/**
 * Ticks a thread must hold at tier 4 (Enthralled) before the apotheosis
 * capstone can seed. ~2 months on top of the 180-tick climb to tier 4,
 * so apotheosis reads as earned, not mechanical. (12 ticks/day.)
 */
export const ASPECT_ELIGIBILITY_TICKS = 60;

/**
 * Cooldown after a refused or failed apotheosis before the offer can
 * re-seed onto the same mortal.
 */
export const ASPECT_REOFFER_COOLDOWN_TICKS = 90;

/**
 * Living-conduit essence trickle per Aspect per tick (the "light
 * mechanic"). Below ESSENCE_PER_PLACE_OF_POWER (0.5) so an Aspect is
 * a modest conduit, not a power spike. A mythic echo (dead Aspect)
 * contributes nothing.
 */
export const ASPECT_ESSENCE_PER_TICK = 0.3;

/**
 * Importance/rarity weight added to the mortal on attainment so the
 * Aspect anchors curated encounters more often (feeds the rarity
 * graduation / portfolio-scan loop). No combat/capability inflation.
 */
export const ASPECT_GRAVITY_BONUS = 5;

/** Template id of the bespoke apotheosis capstone encounter. */
export const APOTHEOSIS_ENCOUNTER_TEMPLATE_ID = 'encounter.apotheosis.ascension';

// ─── Prose (Threadbare voice, player-as-god framing) ──────────────────

/**
 * Chronicle-beat prose for the moment a mortal becomes an Aspect.
 * `{name}` is replaced with the mortal's name at emit time.
 */
export const ASPECT_CHRONICLE_TITLE = 'The Vessel Opens';
export const ASPECT_CHRONICLE_PROSE =
  'There is a threshold past devotion that has no name in the tongues of the faithful, ' +
  'and {name} crossed it without a sound. Not louder prayer, not deeper kneeling — something ' +
  'in the shape of the soul gave way, the way a riverbank gives way after the hundredth flood, ' +
  'and the god poured through. Those nearby felt it as weather: a pressure behind the eyes, a ' +
  'taste of the divine in ordinary water. {name} is no longer only {name}. The god looks out ' +
  'now through a second pair of eyes, and the world has one more place where heaven leaks in.';

/** Short prose for the Aspect section of a thread-detail panel. */
export const ASPECT_THREAD_DETAIL_PROSE =
  'No longer merely threaded — an aspect of you. Where this one walks, you partly walk; ' +
  'what this one touches, your hand half-touches. The bond cannot be undone, and will outlast ' +
  'the body that holds it.';

/**
 * Mythic-echo prose for a dead Aspect, surfaced as lasting myth.
 * `{name}` is replaced with the mortal's name at emit time.
 */
export const ASPECT_ECHO_CHRONICLE_TITLE = 'The Echo Remains';
export const ASPECT_ECHO_CHRONICLE_PROSE =
  'The body that held {name} has failed, as all bodies do, but an aspect of the god does not ' +
  'simply end. The conduit closes; the myth does not. In the places {name} passed, the story ' +
  'thickens into legend — half-remembered, half-invented, wholly true in the way that matters. ' +
  'The god kept what was poured out. The world keeps the rumor of it.';

/** Short prose for a mythic-echo entry in a thread-detail panel. */
export const ASPECT_ECHO_THREAD_DETAIL_PROSE =
  'An aspect, now an echo. The vessel is gone; the bond endures as myth. No longer channels, ' +
  'but is never forgotten and never unmade.';
