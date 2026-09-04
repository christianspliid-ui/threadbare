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
