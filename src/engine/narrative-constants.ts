import type { ProseShape } from '../types/narrative';

export type ShapeWeights = Record<ProseShape, number>;

/**
 * How often each prose shape is selected when all shapes exist in the pool.
 * svo weighted highest — it's the reader's familiarity anchor.
 * Weights need not sum to 1; weightedPick normalizes internally.
 */
export const DEFAULT_SHAPE_WEIGHTS: ShapeWeights = {
  svo: 0.4,
  aftermath: 0.2,
  inverted: 0.15,
  compound: 0.15,
  fragment: 0.1,
};

/** Max attempts to avoid the previously-used shape before accepting a repeat. */
export const SHAPE_REROLL_LIMIT = 3;

/** Minimum distinct shapes each event type's template pool must carry. Enforced by test. */
export const MIN_SHAPES_PER_EVENT_TYPE = 3;
