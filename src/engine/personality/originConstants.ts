/**
 * Tunable constants for reach-axis origin-vignette birth seeding (THR-561).
 *
 * Every magic number the birth-seeding pass uses is named here (NFP #1 — tunability).
 * Changing how strongly an agent's pre-history shapes their moral baseline = changing
 * a number, not rewriting logic.
 *
 * These govern the **reach moral axes** (8 axes, one per Reach; `axisRegistry.ts`),
 * distinct from the Core layer's own draw constants (`core/coreConstants.ts`).
 */

/**
 * How many authored origin-vignettes are drawn per agent at birth and laid onto
 * their personality baseline. Each drawn vignette adds its signed magnitude
 * (virtue +, vice −) to one of the 8 reach axes, so a handful of draws spread
 * across the axes gives an agent an authored moral pull without overwhelming the
 * generated baseline. Distinct vignettes only — a duplicate draw is skipped.
 *
 * Tunable: more draws = stronger, more legible authored character (and more axes
 * touched per agent); fewer = closer to the generated baseline. Kept modest so a
 * single agent rarely stacks enough same-axis, same-pole vignettes to be *born*
 * across an emergent-trait threshold (0.8 / 0.2) — extremes stay rare and earned.
 */
export const ORIGIN_VIGNETTES_PER_AGENT = 5;
