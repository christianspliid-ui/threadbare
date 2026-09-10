/**
 * The calendar has one clock (THR-1452).
 *
 * The defect this guards: the top bar rendered `{season} · year {year}` where the season came
 * from a 90-tick engine season and the year from a private `tick / 120`. Four seasons make 360,
 * not 120, so one readout's two halves disagreed threefold and diverged without bound — at tick
 * 360 the engine clock read year 1 and the bar read year 4.
 *
 * Ruling: the engine's clock is canonical. See `src/types/temporal.ts` for the reasoning.
 *
 * These are falsification guards, not green-watching. Each names the revert that reddens it:
 *  - the live arm reddens if the orchestrator goes back to dividing by literal 90 / 360, because
 *    a non-default `ticksPerSeason` then moves nothing;
 *  - the sweep reddens if any second divisor is reintroduced anywhere, because it pins the
 *    season and the year to the *same* `ticksPerSeason` at every tick of a multi-year run;
 *  - the retired-divisor case reddens if `tick / 120` comes back, and is written as the
 *    disagreement itself rather than as a restatement of the surviving formula.
 */
import { describe, it, expect } from 'vitest';
import {
  TICKS_PER_SEASON,
  SEASONS_PER_YEAR,
  deriveSeasonAndYear,
} from '../../types/temporal';
import { DEFAULT_TICKS_PER_SEASON, initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { runTick } from '../orchestrator';
import { createBalancedCosmology } from '../cosmology';
import { generateArchetypes } from '../ascendant';
import { createSimulationRuntime } from '../simulationRuntime';

const SEED = 42;

/** The divisor the top bar used to carry. Kept only so the disagreement stays assertable. */
const RETIRED_UI_TICKS_PER_YEAR = 120;

describe('the calendar has exactly one clock', () => {
  it('pins the season and the year to one ticksPerSeason across a multi-year sweep', () => {
    const ticksPerYear = TICKS_PER_SEASON * SEASONS_PER_YEAR;
    const lastTick = ticksPerYear * 4; // four full years

    let seasonsSeen = new Set<number>();
    let maxYear = 0;

    for (let tick = 0; tick <= lastTick; tick++) {
      const { season, year } = deriveSeasonAndYear(tick, TICKS_PER_SEASON);

      // The invariant that was violated: the year must be the season counter's own
      // quotient, not an independently-chosen divisor of the same tick.
      const totalSeasons = season + year * SEASONS_PER_YEAR;
      expect(totalSeasons).toBe(Math.floor(tick / TICKS_PER_SEASON));

      seasonsSeen.add(season);
      maxYear = Math.max(maxYear, year);
    }

    // The sweep is not vacuous: it really crossed four years and all four seasons.
    expect(maxYear).toBe(4);
    expect([...seasonsSeen].sort()).toEqual([0, 1, 2, 3]);
  });

  it('disagrees with the retired tick/120 year, which is the defect it replaced', () => {
    // The ticket's own worked example. Written as the *disagreement* so that reintroducing
    // the retired divisor anywhere cannot satisfy this by coincidence.
    const tick = 360;
    const { season, year } = deriveSeasonAndYear(tick, TICKS_PER_SEASON);

    expect({ season, year }).toEqual({ season: 0, year: 1 });

    const retired = Math.floor(tick / RETIRED_UI_TICKS_PER_YEAR);
    expect(retired).toBe(3);
    expect(retired).not.toBe(year);
  });

  it('keeps the CMS tunable and the clock constant the same number', () => {
    // They were two independent literal 90s before THR-1452. A tunable that does not move
    // the clock it advertises is the same defect with a slider on it.
    expect(DEFAULT_TICKS_PER_SEASON).toBe(TICKS_PER_SEASON);
  });

  it('falls back rather than emitting NaN when ticksPerSeason is unusable', () => {
    // NFP #4: a readout should never render `year NaN`.
    for (const bad of [0, -5, Number.NaN, Number.POSITIVE_INFINITY]) {
      const { season, year } = deriveSeasonAndYear(720, bad);
      expect(Number.isInteger(season)).toBe(true);
      expect(Number.isInteger(year)).toBe(true);
      expect({ season, year }).toEqual(deriveSeasonAndYear(720, TICKS_PER_SEASON));
    }
  });
});

describe('the live orchestrator advances that one clock', () => {
  /**
   * Drives the real `initializeGameState → runTick` pipeline. A short season length is what
   * makes a *multi-year* live sweep affordable: at 3 ticks per season a year is 12 ticks, so
   * 26 ticks crosses two year boundaries and cycles the seasons twice.
   *
   * That short season is also the falsification. Before THR-1452 the orchestrator divided by
   * literal 90 and 360, so this whole run would sit at season 0 / year 0 regardless.
   */
  it('honours clock.ticksPerSeason, so the tunable actually moves the calendar', () => {
    const runtime = createSimulationRuntime();
    const archetype = generateArchetypes(4, SEED)[0];
    const preset = MAP_SIZE_PRESETS.small;
    const init = initializeGameState(
      archetype, 'calendar', createBalancedCosmology(), SEED, preset.cols, preset.rows,
    );

    const TICKS_PER_SEASON_UNDER_TEST = 3;
    const ticksPerYear = TICKS_PER_SEASON_UNDER_TEST * SEASONS_PER_YEAR;
    let state = {
      ...init.state,
      clock: { ...init.state.clock, ticksPerSeason: TICKS_PER_SEASON_UNDER_TEST },
    };

    const seasonsSeen = new Set<number>();
    for (let i = 0; i < 26; i++) {
      state = runTick(state, [], runtime);

      // The two halves of the readout, checked against each other at every single tick.
      expect(state.clock.season).toBe(
        Math.floor(state.tick / TICKS_PER_SEASON_UNDER_TEST) % SEASONS_PER_YEAR,
      );
      expect(state.clock.year).toBe(Math.floor(state.tick / ticksPerYear));
      expect(state.clock.currentTick).toBe(state.tick);
      seasonsSeen.add(state.clock.season);
    }

    // The arm genuinely perturbed: with the default 90-tick season these same 26 ticks would
    // never have left season 0 / year 0, which is exactly what the pre-fix code produced.
    expect(deriveSeasonAndYear(26, DEFAULT_TICKS_PER_SEASON)).toEqual({ season: 0, year: 0 });
    expect(state.clock.year).toBe(2);
    expect([...seasonsSeen].sort()).toEqual([0, 1, 2, 3]);
    // Builds a real small world and drives it 26 ticks: ~2s alone, but the default 5s budget
    // is tight once the fast lane's workers contend, so the timeout is stated rather than
    // left to chance (it timed out at 5s in-suite while passing in isolation).
  }, 30_000);
});
