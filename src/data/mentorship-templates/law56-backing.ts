/**
 * Mentorship chip-backing tuning — UI Law 56, THR-1141. (NFP #1)
 *
 * The three mentorship templates author eleven consequence chips between them,
 * every one of which claimed a per-choice outcome — "a bond honored", "a rivalry
 * seeded", "the settlement marks the apprenticeship" — while no per-choice write
 * existed anywhere on the template.
 *
 * The underlying *event* was always real: `mentorshipOutcomes.ts` grants the
 * mastery trait, strengthens the `relates_to` edge and advances the bond's phase
 * before these encounters are seeded. What was missing is the half the chips
 * actually name. A chip keyed to `name_the_rivalry` cannot honestly report a
 * write that fires identically whichever choice was taken, so each variant now
 * carries the write its own sentence claims.
 *
 * The magnitudes live here rather than inline because the three templates are a
 * ladder — an offer, a graduation, a falling-out — and their deltas only read
 * correctly against each other.
 */

/** The tally key the settlement marks an apprenticeship under. */
export const MENTORSHIP_TALLY_KEY = 'mentorship.bond';

/** An offer accepted with a steady hand under it. The smallest rung. */
export const MENTORSHIP_STEADY_SENTIMENT = 0.15;
export const MENTORSHIP_STEADY_TRUST = 0.1;

/** A graduation honored — years of teaching closing well. The warmest rung. */
export const MENTORSHIP_HONORED_SENTIMENT = 0.3;
export const MENTORSHIP_HONORED_TRUST = 0.2;

/** A rivalry named aloud. Negative, and the edge stays live rather than closing. */
export const MENTORSHIP_RIVALRY_SENTIMENT = -0.35;

/** A break let happen. The largest single move either way. */
export const MENTORSHIP_BREAK_SENTIMENT = -0.45;

/** A breach mended. Real, but it does not undo what caused it. */
export const MENTORSHIP_MENDED_SENTIMENT = 0.25;
export const MENTORSHIP_MENDED_TRUST = 0.15;

/**
 * Taking a side is asymmetric by definition — the deltas are written one way
 * only (`reciprocal: false`), because the person sided against does not
 * reciprocate the god's warmth toward the other.
 */
export const MENTORSHIP_SIDED_SENTIMENT = -0.3;

/** Ticks until teacher and former apprentice meet again (~25 game days). */
export const MENTORSHIP_NEXT_MEETING_DELAY_TICKS = 300;
