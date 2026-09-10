/**
 * THR-1450 — the bandless-instant convention, pinned where it is stated.
 *
 * `INSTANT_COMPLETION_BAND` says what a completion with no checkpoint reads as. Three
 * readers had honoured that convention by hand — two banded tables' `_DEFAULT`
 * siblings, and `plotDeath`'s `?? 'success'` — while two others silently took the
 * failure arm, which is how `use × Location`'s harvest came to pay nothing in every
 * live run.
 *
 * The fix moved the decision to one boundary, so what is left to rot is the *agreement
 * between the constant and the defaults that predate it*: someone retunes a band table
 * and leaves its `_DEFAULT` behind, and the convention quietly means two things again.
 * These are equality pins against the table row, not restatements of the literals —
 * asserting `CONDITION_TIER_CAP_DEFAULT === 1` would pass just as happily with the
 * `success` row moved to 2, which is the drift worth catching.
 */
import { describe, it, expect } from 'vitest';
import { STEP_OUTCOMES } from '../../types/unifiedAction';
import {
  INSTANT_COMPLETION_BAND,
  CONDITION_TIER_CAP_BY_BAND,
  CONDITION_TIER_CAP_DEFAULT,
  CURSE_DURATION_TICKS_BY_BAND,
  CURSE_DURATION_TICKS_DEFAULT,
  YIELD_DRAW_BAND_SCALE,
  OBSERVE_CLUE_PRECISION_BY_BAND,
  UNDERTAKING_VERB_DURATION,
} from '../strategic-action-constants';

describe('the bandless-instant convention (THR-1450)', () => {
  it('names a real row on the outcome ladder', () => {
    expect(STEP_OUTCOMES).toContain(INSTANT_COMPLETION_BAND);
  });

  it('is the plain-success row, not a good one — an instant cell cannot crit', () => {
    // A cell that cannot fail must not therefore excel: the convention exists to stop
    // a bandless completion reading as a failure, not to hand it the best outcome.
    expect(INSTANT_COMPLETION_BAND).toBe('success');
  });

  it('pays something in every banded table an instant cell can reach', () => {
    // The defect in one sentence: the convention is worthless if the row it names has
    // no entry. `use` reaches the yield scale, `observe` reaches the clue precision.
    expect(YIELD_DRAW_BAND_SCALE[INSTANT_COMPLETION_BAND]).toBeGreaterThan(0);
    expect(OBSERVE_CLUE_PRECISION_BY_BAND[INSTANT_COMPLETION_BAND]).toBeDefined();
  });

  it('is the row the hand-rolled defaults already meant', () => {
    expect(CONDITION_TIER_CAP_DEFAULT).toBe(CONDITION_TIER_CAP_BY_BAND[INSTANT_COMPLETION_BAND]);
    expect(CURSE_DURATION_TICKS_DEFAULT).toBe(CURSE_DURATION_TICKS_BY_BAND[INSTANT_COMPLETION_BAND]);
  });

  it('governs exactly the verbs that are instant at every tier', () => {
    // If a third verb is ever made instant, or `use`/`observe` grows a checkpoint, the
    // convention's reach changes and this file is where that should be noticed.
    const instant = Object.entries(UNDERTAKING_VERB_DURATION)
      .filter(([, perTier]) => perTier.every(d => d === 0))
      .map(([variant]) => variant)
      .sort();
    expect(instant).toEqual(['observe', 'use']);
  });
});
