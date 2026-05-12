// Tunable constants for ascendant self-targeting divine actions (THR-399).
// Change these numbers to adjust the feel of self-actions without touching logic.

/** Essence added to the primary sphere when Stillness completes successfully. */
export const STILLNESS_ESSENCE_REGEN = 4;

/** Fraction of the next action's essence cost that is refunded when Recede completes. */
export const RECEDE_DISCOUNT_FRACTION = 0.5;

/** Tier boost applied to the ascendant's next non-self action after Focus completes. */
export const FOCUS_TIER_BOOST = 1;

/** Max hex distance for Reveal's influence radiation (0 = current hex only). */
export const REVEAL_HEX_DISTANCE = 0;

/** Devotion delta applied per mortal on the reveal hex. */
export const REVEAL_DEVOTION_DELTA = 15;

/** Fear delta applied per mortal on the reveal hex. */
export const REVEAL_FEAR_DELTA = 10;

/** Awe delta applied per mortal on the reveal hex. */
export const REVEAL_AWE_DELTA = 20;

/** Duration in ticks that the wake mark (from Reveal) persists. */
export const REVEAL_WAKE_MARK_DURATION = 10;
