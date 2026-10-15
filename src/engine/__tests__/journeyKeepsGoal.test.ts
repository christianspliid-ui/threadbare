// @vitest-lane heavy — builds the attended world and drives it 150 ticks (THR-1384)
/**
 * A journey keeps its goal (THR-1639 — plan § S2, contract
 * `journey-keeps-encounter-target`).
 *
 * Seed 42 carried both defects this pins, measured on `main` before the fix: The
 * First went 50 ticks without an encounter, first because a journey with no
 * recorded pull was abandoned at the first re-check, then because the encounter it
 * walked to was cut from the board on arrival and it walked back.
 *
 * THR-1930: the guard reads those defects directly — a journey with no pull, a
 * reroute that loses its target, an arrival goal dropped while it still stands —
 * on seeds 42, 99 and 11. It used to gate the seed-42 longest gap (≤ 30), which
 * moves between 19 and 40 when one unrelated template joins the pool; THR-1840's
 * 37 was a long walk and a need-driven rest outvoting a kept goal, with zero faults.
 */
import { describe, it, expect } from 'vitest';
import {
  measureFirstRhythm,
  FIRST_FIRST_ENCOUNTER_MAX_TICK,
} from '../../../scripts/first-encounter-gate';

describe('journey keeps its goal — The First on the attended world', () => {
  it('seed 42 meets its first encounter early', () => {
    const r = measureFirstRhythm(42, 150);
    expect(r.firstId).toBeTruthy();
    expect(r.firstTick).not.toBeNull();
    expect(r.firstTick!).toBeLessThanOrEqual(FIRST_FIRST_ENCOUNTER_MAX_TICK);
    // The same run carries the fault read; asserted here so seed 42 builds once.
    expect(r.journeys).toBeGreaterThan(0);
    expect(r.arrivalsKept + r.arrivalsDropped).toBeGreaterThan(0);
    expect(r.faults).toEqual([]);
  }, 180_000);

  for (const seed of [99, 11]) {
    it(`seed ${seed}: every journey keeps its pull, its target and its goal`, () => {
      const r = measureFirstRhythm(seed, 150);
      // Non-vacuous: the guard must have watched journeys and arrivals to pass.
      expect(r.journeys).toBeGreaterThan(0);
      expect(r.arrivalsKept + r.arrivalsDropped).toBeGreaterThan(0);
      expect(r.faults).toEqual([]);
    }, 180_000);
  }
});
