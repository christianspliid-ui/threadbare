// src/data/descent-constants.ts
// Tuning for the play-time readers of descent from a dead empire (THR-1658).
// Kept apart from `world-past-constants.ts`, which tunes worldgen only.

/**
 * How near an elder ruin of the heir's own dead empire they must stand for the
 * Raise-the-Old-Banner milestone *walk the old stones*. 0 = the same hex — the game's
 * own unit of "here" (encounter awareness is hex-granular). The lever if heirs are
 * measured passing near ruins but never standing on one at a milestone check.
 */
export const OLD_BANNER_RUIN_REACH_HEXES = 0;

/** Provenance stem; the intent line reads "Because of the old blood of {empire}". */
export const OLD_BANNER_LABEL_STEM = 'the old blood of';

/** The drive this module's readers exist for. */
export const OLD_BANNER_TEMPLATE_ID = 'ambition_raise_the_old_banner';
