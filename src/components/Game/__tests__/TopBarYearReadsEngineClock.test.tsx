/**
 * @vitest-environment jsdom
 *
 * The top bar's year is the engine's year (THR-1452).
 *
 * `useSimulation` used to derive the year it hands the top bar as `Math.floor(tick / 120) + 1`,
 * a divisor of its own, while the season rendered beside it came from the engine's 90-tick
 * season. This drives the real hook and asserts the year it returns tracks `clock.year`.
 *
 * The falsification is the point: every case below is set at a tick where the retired
 * `tick / 120` formula gives a *different* answer from the engine clock, so restoring that
 * line turns this red rather than leaving it quietly green. The `expect(...).not.toBe(retired)`
 * line states that explicitly, so the guard cannot be satisfied by the defect coming back.
 */
import { describe, it, expect } from 'vitest';
import { renderHook, act, render } from '@testing-library/react';
import { useSimulation } from '../hooks/useSimulation';
import { SimulationControls } from '../SimulationControls';
import { createScryState } from '../../../engine/scry';
import { createBalancedCosmology } from '../../../engine/cosmology';
import { generateArchetypes } from '../../../engine/ascendant';
import { deriveSeasonAndYear, TICKS_PER_SEASON } from '../../../types/temporal';

const SEED = 42;
const RETIRED_UI_TICKS_PER_YEAR = 120;

/**
 * Ticks chosen so the engine clock and the retired divisor disagree at every one of them —
 * the first is the ticket's own worked example (engine year 1, retired year 3).
 */
const DIVERGENT_TICKS = [360, 720, 1080];

describe('the top bar year comes from the engine clock', () => {
  it('tracks clock.year across a multi-year sweep, not a divisor of its own', () => {
    const archetype = generateArchetypes(4, SEED)[0];

    const { result } = renderHook(() =>
      useSimulation({
        archetype,
        avatarName: 'calendar',
        cosmology: createBalancedCosmology(),
        seed: SEED,
        scryState: createScryState(),
        mapSize: 'small',
      }),
    );

    // Guard against a vacuous sweep: the hook really produced a world to read a clock from.
    expect(result.current.gameState.clock).toBeDefined();

    for (const tick of DIVERGENT_TICKS) {
      const { season, year } = deriveSeasonAndYear(tick, TICKS_PER_SEASON);

      act(() => {
        result.current.setGameState(prev => ({
          ...prev,
          tick,
          clock: { ...prev.clock, currentTick: tick, season, year },
        }));
      });

      // The display convention is 1-based; the engine's year is 0-based.
      expect(result.current.year).toBe(year + 1);

      // And it is genuinely not the retired formula — these ticks were picked to differ.
      const retired = Math.floor(tick / RETIRED_UI_TICKS_PER_YEAR) + 1;
      expect(retired).not.toBe(year + 1);
      expect(result.current.year).not.toBe(retired);
    }
  });

  it('shows the season and the year of the same moment', () => {
    const archetype = generateArchetypes(4, SEED)[0];

    const { result } = renderHook(() =>
      useSimulation({
        archetype,
        avatarName: 'calendar',
        cosmology: createBalancedCosmology(),
        seed: SEED,
        scryState: createScryState(),
        mapSize: 'small',
      }),
    );

    // Tick 450: one season into year 1. Both halves of `{season} · year {year}` must agree
    // that this is that moment — the pairing that was impossible before THR-1452.
    const tick = 450;
    const { season, year } = deriveSeasonAndYear(tick, TICKS_PER_SEASON);
    expect({ season, year }).toEqual({ season: 1, year: 1 });

    act(() => {
      result.current.setGameState(prev => ({
        ...prev,
        tick,
        clock: { ...prev.clock, currentTick: tick, season, year },
      }));
    });

    expect(result.current.seasonName).toBe('summer');
    expect(result.current.year).toBe(2);
  });
});

/**
 * Browser-verify substitution: jsdom-render — this is a scheduled unattended run and
 * `preview_start` is refused outright for such sessions, which shuts the Playwright route too
 * (it presumes a running server). Per `Docs/canon/verification-gates.md` § Browser-verify the
 * sanctioned substitution is jsdom render assertions on the real component, asserting the
 * rendered text for every face the change produces.
 *
 * `SimulationControls` renders the year on both of its tiers, so both are asserted — driven by
 * the value the real `useSimulation` hook produced, so this covers the whole chain the defect
 * lived in: engine clock → hook → rendered text.
 */
describe('the rendered top bar shows the engine clock year (jsdom substitution)', () => {
  const noop = () => {};

  /** Drive the real hook to a tick where the engine clock and the retired divisor disagree. */
  function seasonAndYearFromTheRealHook(tick: number) {
    const archetype = generateArchetypes(4, SEED)[0];
    const { result } = renderHook(() =>
      useSimulation({
        archetype,
        avatarName: 'calendar',
        cosmology: createBalancedCosmology(),
        seed: SEED,
        scryState: createScryState(),
        mapSize: 'small',
      }),
    );

    const { season, year } = deriveSeasonAndYear(tick, TICKS_PER_SEASON);
    act(() => {
      result.current.setGameState(prev => ({
        ...prev,
        tick,
        clock: { ...prev.clock, currentTick: tick, season, year },
      }));
    });
    return { seasonName: result.current.seasonName, year: result.current.year };
  }

  it('compact tier reads "winter · year 3" at tick 990, not the retired "year 9"', () => {
    // tick 990 → engine: 11 seasons in, so season 3 (winter) of year 2 → displayed year 3.
    // Retired divisor: floor(990/120) + 1 = 9. Three times apart, so the face is decisive.
    const { seasonName, year } = seasonAndYearFromTheRealHook(990);
    expect({ seasonName, year }).toEqual({ seasonName: 'winter', year: 3 });

    const { container } = render(
      <SimulationControls
        compact
        season={seasonName}
        year={year}
        running={false}
        speed={1}
        onToggle={noop}
        onStep={noop}
        onSpeedChange={noop}
      />,
    );

    expect(container.textContent).toContain('winter · year 3');
    expect(container.textContent).not.toContain('year 9');
  });

  it('full tier reads the same season and year, so the two tiers cannot disagree', () => {
    const { seasonName, year } = seasonAndYearFromTheRealHook(990);

    const { container } = render(
      <SimulationControls
        season={seasonName}
        year={year}
        running={false}
        speed={1}
        onToggle={noop}
        onStep={noop}
        onSpeedChange={noop}
      />,
    );

    expect(container.textContent).toContain('winter');
    expect(container.textContent).toContain('Year 3');
    expect(container.textContent).not.toContain('Year 9');
  });
});
