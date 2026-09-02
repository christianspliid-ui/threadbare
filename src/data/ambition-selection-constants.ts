// src/data/ambition-selection-constants.ts
//
// The weights that decide which drive an agent takes up (`ambitionSelection.ts`).
//
// The first three were inline literals in the scorer. They are promoted here by
// THR-1298 rather than left alone, because that slice adds a *fourth* weight term to
// the same sum: converging a new weight onto anonymous literals would put the whole
// selection mix outside the CMS, and NFP #1 asks that changing game feel be changing a
// number rather than editing an expression. Promotion is value-preserving — each
// constant carries the literal it replaced.

/** Per cultural sphere the template shares with the agent's cultures. Was inline `0.2`. */
export const AMBITION_CULTURAL_SPHERE_WEIGHT = 0.2;

/** Per boosting trait the agent holds. Was inline `0.15`. */
export const AMBITION_BOOSTING_TRAIT_WEIGHT = 0.15;

/** Tie-breaking jitter, seeded. Was inline `0.05`. */
export const AMBITION_SELECTION_JITTER = 0.05;

/**
 * Scale of the value-pole term (THR-1298); per-template `weight`s multiply this.
 *
 * Sized to sit between the trait weight and the sphere weight: a drive that matches who
 * an agent *is* should count for about as much as one that matches what they know, and
 * not so much that a strongly-poled agent takes the same drive from every wound
 * regardless of what they can actually do.
 */
export const POLE_AFFINITY_WEIGHT = 0.25;
