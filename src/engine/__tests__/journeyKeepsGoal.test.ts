// @vitest-lane heavy — builds the attended world and drives it 150 ticks (THR-1384)
/**
 * A journey keeps its goal (THR-1639 — plan § S2, contract
 * `journey-keeps-encounter-target`).
 *
 * Seed 42 is the seed that carried both defects this pins, measured on `main`
 * before the fix: The First went 50 ticks without an encounter, first because a
 * journey with no recorded pull was abandoned at the first re-check, then because
 * the encounter it walked to was cut from the board on arrival and it walked back.
 */
import { describe, it, expect } from 'vitest';
import {
  measureFirstRhythm,
  FIRST_FIRST_ENCOUNTER_MAX_TICK,
  FIRST_ENCOUNTER_MAX_GAP_TICKS,
} from '../../../scripts/first-encounter-gate';

describe('journey keeps its goal — The First on the attended seed-42 world', () => {
  it('meets its first encounter early and never goes quiet for long', () => {
    const r = measureFirstRhythm(42, 150);
    expect(r.firstId).toBeTruthy();
    expect(r.firstTick).not.toBeNull();
    expect(r.firstTick!).toBeLessThanOrEqual(FIRST_FIRST_ENCOUNTER_MAX_TICK);
    expect(r.longestGap).toBeLessThanOrEqual(FIRST_ENCOUNTER_MAX_GAP_TICKS);
  }, 180_000);
});
