// @vitest-environment jsdom

/**
 * The CMS tuning panel paints the worldgen constants the generators read (THR-1409).
 *
 * THR-1409 is a duplicate-declaration defect: `RIVER_MIN_LENGTH`, `LAKE_SIZE_MAX` and
 * `GREAT_LAKE_SIZE_MAX` were declared in both `engine/terrainPipeline/types.ts` (5 / 6 / 15)
 * and `engine/worldGenData.ts` (4 / 5 / 12), with `TEMP_ALTITUDE_PENALTY` similarly split
 * between `terrainPipeline/types.ts` and `worldgen/constants.ts`. The generators imported one
 * copy and this panel rendered the other, so a designer opening the tuning surface saw numbers
 * no world had been generated with — an NFP #1 (Tunability) failure.
 *
 * This file is the **browser-verify substitution** for the UI half (THR-754 / impediments
 * #546, #574): `preview_start` is refused in unattended scheduled runs — verified this run, the
 * tool returned "Dev servers can't be started from unattended sessions" — so the contractual
 * 1920×1080 capture has no reachable route. Recorded in the commit body as
 * `Browser-verify substitution: jsdom-render — unattended run, no startable dev server`.
 *
 * Substitution is honest here rather than merely convenient: the change alters the *value and
 * source attribution* of four rows that already ship on this surface, rendered by the same
 * `ConstantRow` component as their ~60 siblings. No row is added, removed, or re-laid-out, so
 * the failure classes only pixels can catch — overflow, z-index, off-viewport paint — are
 * structurally absent.
 *
 * What this asserts that a screenshot could not: that the number reaching the surface is the
 * *generator's* declaration. A capture would show "4" without proving it came from
 * `worldGenData` rather than from a second copy that happened to agree.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConfigManager } from '../viewers/ConfigManager';
import { TUNABLE_GROUPS } from '../tunableConstants';
import {
  RIVER_MIN_LENGTH,
  LAKE_SIZE_MAX,
  GREAT_LAKE_SIZE_MAX,
} from '../../../engine/worldGenData';
import { TEMP_ALTITUDE_PENALTY } from '../../../engine/worldgen/constants';

describe('ConfigManager — worldgen terrain constants (THR-1409)', () => {
  it('paints RIVER_MIN_LENGTH with the value riverGeneration imports', () => {
    render(<ConfigManager groups={TUNABLE_GROUPS} searchQuery="RIVER_MIN_LENGTH" />);

    expect(screen.getByText('RIVER_MIN_LENGTH')).toBeTruthy();
    // Live constant, not a literal copied into the test: this arm fails if the panel is
    // re-pointed at any module the river generator does not import.
    expect(screen.getByDisplayValue(String(RIVER_MIN_LENGTH))).toBeTruthy();
    expect(screen.getByText('src/engine/worldGenData.ts')).toBeTruthy();
  });

  it('paints LAKE_SIZE_MAX and GREAT_LAKE_SIZE_MAX with the values lakeGeneration imports', () => {
    render(<ConfigManager groups={TUNABLE_GROUPS} searchQuery="LAKE_SIZE_MAX" />);

    expect(screen.getByText('LAKE_SIZE_MAX')).toBeTruthy();
    expect(screen.getByText('GREAT_LAKE_SIZE_MAX')).toBeTruthy();
    expect(screen.getByDisplayValue(String(LAKE_SIZE_MAX))).toBeTruthy();
    expect(screen.getByDisplayValue(String(GREAT_LAKE_SIZE_MAX))).toBeTruthy();
  });

  it('paints TEMP_ALTITUDE_PENALTY from the module the climate pass imports', () => {
    render(<ConfigManager groups={TUNABLE_GROUPS} searchQuery="TEMP_ALTITUDE_PENALTY" />);

    expect(screen.getByText('TEMP_ALTITUDE_PENALTY')).toBeTruthy();
    expect(screen.getByDisplayValue(String(TEMP_ALTITUDE_PENALTY))).toBeTruthy();
    expect(screen.getByText('src/engine/worldgen/constants.ts')).toBeTruthy();
  });

  it('no longer paints the divergent values, nor attributes them to the dead module', () => {
    // The absence half of the substitution. These are the exact numbers the panel used to
    // show — 5 / 6 / 15 — and the module it used to credit them to. Rendering any of them
    // again means the defect is back, whatever the guard test says about declarations.
    render(<ConfigManager groups={TUNABLE_GROUPS} searchQuery="RIVER_MIN_LENGTH" />);
    expect(screen.queryByDisplayValue('5')).toBeNull();
    expect(screen.queryByText('src/engine/terrainPipeline/types.ts')).toBeNull();

    render(<ConfigManager groups={TUNABLE_GROUPS} searchQuery="GREAT_LAKE_SIZE_MAX" />);
    expect(screen.queryByDisplayValue('15')).toBeNull();

    // Sanity: the searches above actually matched something, so the absence assertions are
    // not passing on an empty render.
    expect(screen.getByText('GREAT_LAKE_SIZE_MAX')).toBeTruthy();
  });
});

/**
 * THR-1418 — the rest of the group, and why the substitution is honest a second time.
 *
 * THR-1409 fixed four rows that had a live counterpart to re-point at. The sweep it required
 * showed the larger shape: `engine/terrainPipeline/` had no pipeline behind it — no passes, no
 * orchestrator, no caller — and 22 further rows in this group read it. The live worldgen path
 * is `engine/worldgen/` (noise field + province flood-fill), which models neither continents
 * nor fault lines, so most of those rows had nothing to re-point at and the fix was a judgement
 * about what the surface should promise, not a rename.
 *
 * Per-row decisions, recorded here because this file is where they are enforced:
 *   RE-POINTED onto the live control for the same phenomenon (10 rows → 11):
 *     FAULT_COUNT_MIN/MAX      → RIDGE_COUNT_DEFAULT      (pass02 lays ridges, not faults)
 *     FAULT_CONTROL_POINTS     → RIDGE_STEP_VARIANCE + RIDGE_MIN/MAX_LENGTH (spine shape)
 *     TEMP_BASE_RANGE          → TEMP_LATITUDE_WEIGHT
 *     WIND_DIRECTION           → PREVAILING_WIND_ANGLE
 *     MOISTURE_COAST_BONUS     → MOISTURE_COASTAL_BONUS
 *     RAIN_SHADOW_FACTOR       → RAIN_SHADOW_PENALTY
 *     RIVER_SOURCE_COUNT       → RIVER_SOURCE_COUNT_MIN / _MAX
 *     GREAT_LAKE_CHANCE        → GREAT_LAKE_COUNT        (a count, not a probability)
 *     REGION_SIZE_MIN/MAX      → PROVINCE_MIN_SEED_DISTANCE / PROVINCE_MAX_HEXES
 *   REMOVED, live pipeline models no such thing (6 rows):
 *     CONTINENT_COUNT_MIN/MAX, CONTINENT_RADIUS_MIN/MAX, MOISTURE_BASE, LATITUDE_EQUATOR_ROW
 *   REMOVED, live control already rendered by another group — re-pointing would duplicate a
 *   row rather than fix one (6 rows):
 *     LAND_TARGET_MIN/MAX      → SEA_LEVEL             already in `biome-classification`
 *     ELEVATION_MOUNTAIN_BASE  → RIDGE_PEAK_ELEVATION  already in `biome-classification`
 *     MOUNTAIN_SPINE_WIDTH     → RIDGE_FOOTHILLS_HEXES already in `biome-classification`
 *     ELEVATION_FALLOFF_RATE   → RIDGE_FOOTHILLS_HEXES already in `biome-classification`
 *     ELEVATION_NOISE_AMPLITUDE→ elevation noise       already in `worldgen-noise`
 *
 * `preview_start` was refused again this run ("Dev servers can't be started from unattended
 * sessions"), so requirement 1 of the browser-verify contract takes the same sanctioned
 * substitution. It is honest for the same structural reason: every row here is painted by the
 * same `ConstantRow` as its ~60 siblings, and rows are removed rather than re-laid-out, so the
 * failure classes only pixels catch — overflow, z-index, off-viewport paint — cannot be
 * introduced by deleting table rows from an already-scrolling group.
 */

import {
  RIVER_SOURCE_COUNT_MIN,
  RIVER_SOURCE_COUNT_MAX,
  GREAT_LAKE_COUNT,
} from '../../../engine/worldGenData';
import {
  RIDGE_COUNT_DEFAULT,
  TEMP_LATITUDE_WEIGHT,
  MOISTURE_COASTAL_BONUS,
  RAIN_SHADOW_PENALTY,
  PROVINCE_MAX_HEXES,
  PROVINCE_MIN_SEED_DISTANCE,
} from '../../../engine/worldgen/constants';

/** Every constant the group promised before THR-1418 and no longer declares anywhere. */
const RETIRED_ROWS = [
  'CONTINENT_COUNT_MIN', 'CONTINENT_COUNT_MAX',
  'LAND_TARGET_MIN', 'LAND_TARGET_MAX',
  'CONTINENT_RADIUS_MIN', 'CONTINENT_RADIUS_MAX',
  'FAULT_COUNT_MIN', 'FAULT_COUNT_MAX',
  'MOUNTAIN_SPINE_WIDTH', 'FAULT_CONTROL_POINTS',
  'ELEVATION_MOUNTAIN_BASE', 'ELEVATION_FALLOFF_RATE', 'ELEVATION_NOISE_AMPLITUDE',
  'TEMP_BASE_RANGE', 'WIND_DIRECTION', 'MOISTURE_COAST_BONUS',
  'RAIN_SHADOW_FACTOR', 'MOISTURE_BASE', 'RIVER_SOURCE_COUNT',
  'GREAT_LAKE_CHANCE', 'REGION_SIZE_MIN', 'REGION_SIZE_MAX',
] as const;

describe('ConfigManager — worldgen terrain group rebuilt on live constants (THR-1418)', () => {
  it('paints every re-pointed row with the value its live generator imports', () => {
    const rows: ReadonlyArray<readonly [string, number, string]> = [
      ['RIDGE_COUNT_DEFAULT', RIDGE_COUNT_DEFAULT, 'src/engine/worldgen/constants.ts'],
      ['TEMP_LATITUDE_WEIGHT', TEMP_LATITUDE_WEIGHT, 'src/engine/worldgen/constants.ts'],
      ['MOISTURE_COASTAL_BONUS', MOISTURE_COASTAL_BONUS, 'src/engine/worldgen/constants.ts'],
      ['RAIN_SHADOW_PENALTY', RAIN_SHADOW_PENALTY, 'src/engine/worldgen/constants.ts'],
      ['PROVINCE_MAX_HEXES', PROVINCE_MAX_HEXES, 'src/engine/worldgen/constants.ts'],
      ['PROVINCE_MIN_SEED_DISTANCE', PROVINCE_MIN_SEED_DISTANCE, 'src/engine/worldgen/constants.ts'],
      ['RIVER_SOURCE_COUNT_MIN', RIVER_SOURCE_COUNT_MIN, 'src/engine/worldGenData.ts'],
      ['RIVER_SOURCE_COUNT_MAX', RIVER_SOURCE_COUNT_MAX, 'src/engine/worldGenData.ts'],
      ['GREAT_LAKE_COUNT', GREAT_LAKE_COUNT, 'src/engine/worldGenData.ts'],
    ];

    for (const [exportName, liveValue, ownerFile] of rows) {
      const { unmount } = render(
        <ConfigManager groups={TUNABLE_GROUPS} searchQuery={exportName} />,
      );
      expect(screen.getByText(exportName), `${exportName} does not paint`).toBeTruthy();
      // Live import, never a literal: this fails if the row is re-pointed at any module
      // the worldgen passes do not read, even one whose value happens to agree.
      expect(
        screen.getAllByDisplayValue(String(liveValue)).length,
        `${exportName} paints a value its generator does not read`,
      ).toBeGreaterThan(0);
      expect(
        screen.getAllByText(ownerFile).length,
        `${exportName} is not attributed to ${ownerFile}`,
      ).toBeGreaterThan(0);
      unmount();
    }
  });

  it('no longer paints any row backed by the retired terrainPipeline module', () => {
    // Whole-panel render: no searchQuery, and ConfigManager starts every group expanded,
    // so absence here is absence from the surface a designer actually opens.
    render(<ConfigManager groups={TUNABLE_GROUPS} />);

    // Falsification guard: the panel really did paint, so the absences below are not the
    // trivial truth of an empty render.
    expect(screen.getByText('World Generation — Terrain')).toBeTruthy();
    expect(screen.getAllByText('RIDGE_COUNT_DEFAULT').length).toBeGreaterThan(0);

    for (const name of RETIRED_ROWS) {
      expect(screen.queryByText(name), `${name} still paints`).toBeNull();
    }
    expect(screen.queryByText('src/engine/terrainPipeline/types.ts')).toBeNull();
  });

  it('no longer describes the group as modelling continents and tectonics', () => {
    render(<ConfigManager groups={TUNABLE_GROUPS} />);

    // The group description is itself a promise the surface makes. The live pipeline places
    // no continents and no fault lines, so the old wording was a false one.
    expect(screen.queryByText(/Continent placement, tectonics/)).toBeNull();
    expect(screen.getByText(/Mountain ridges, climate, hydrology/)).toBeTruthy();
  });
});
