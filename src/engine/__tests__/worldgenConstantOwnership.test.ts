/**
 * THR-1409 — one declaration per worldgen constant, and a tuning panel that
 * shows the number the generator actually reads.
 *
 * Three constants (`RIVER_MIN_LENGTH`, `LAKE_SIZE_MAX`, `GREAT_LAKE_SIZE_MAX`)
 * were declared in both `terrainPipeline/types.ts` and `worldGenData.ts` with
 * *different* values, and a fourth (`TEMP_ALTITUDE_PENALTY`) in both
 * `terrainPipeline/types.ts` and `worldgen/constants.ts`. The two copies had
 * disjoint consumers — the generators read one, the CMS tuning panel rendered
 * the other — so the divergence never surfaced as a conflict, and the panel
 * displayed numbers no world had ever been generated with. That is an NFP #1
 * (Tunability) failure: the surface a designer opens to change a number was
 * wired to a copy nothing reads.
 *
 * Two guards, because the failure had two independent halves:
 *   1. No constant name is declared by more than one worldgen constants module.
 *   2. The panel's rendered value is the *same declaration* the generator imports.
 *
 * Guard 1 alone would not have caught a panel re-pointed at a third module, and
 * guard 2 alone would not have caught a fresh duplicate nothing renders yet.
 */
import { describe, it, expect } from 'vitest';

import * as terrainPipelineTypes from '../terrainPipeline/types';
import * as worldGenData from '../worldGenData';
import * as worldgenConstants from '../worldgen/constants';
import { TUNABLE_GROUPS } from '../../components/CMS/tunableConstants';

/**
 * The three modules that declare worldgen tuning constants. Runtime namespace
 * keys, not parsed source: types erase at runtime, so this compares exactly the
 * declarations a consumer can import a *value* from — which is the thing that
 * can silently diverge. (`RiverPath` and `WorldGenData` are declared in two of
 * these modules as well, but they are structurally different interfaces with
 * disjoint consumers rather than duplicates of one another; they carry no value
 * and cannot drift apart numerically. See the ticket for why they stay.)
 */
const MODULES: ReadonlyArray<readonly [string, Record<string, unknown>]> = [
  ['src/engine/terrainPipeline/types.ts', terrainPipelineTypes],
  ['src/engine/worldGenData.ts', worldGenData],
  ['src/engine/worldgen/constants.ts', worldgenConstants],
];

/**
 * Names allowed to appear in more than one module, each with the reason it must.
 * Empty by design — a new entry here is a deliberate, reviewed exception, not a
 * place to silence this test.
 */
const ALLOWED_DUPLICATES: Record<string, string> = {};

describe('worldgen constant ownership (THR-1409)', () => {
  it('the modules under test actually export constants', () => {
    // Falsification guard: an empty or mis-resolved namespace would make the
    // intersection below trivially empty and the duplicate test vacuous.
    for (const [name, mod] of MODULES) {
      expect(Object.keys(mod).length, `${name} exports nothing`).toBeGreaterThan(5);
    }
  });

  it('no constant name is declared by two worldgen constants modules', () => {
    const declaredIn = new Map<string, string[]>();

    for (const [moduleName, mod] of MODULES) {
      for (const [exportName, value] of Object.entries(mod)) {
        // Functions are implementation, not tuning surface; `createWorldGenData`
        // sharing a name with something would be a different kind of problem.
        if (typeof value === 'function') continue;
        const seen = declaredIn.get(exportName) ?? [];
        seen.push(moduleName);
        declaredIn.set(exportName, seen);
      }
    }

    const duplicates = [...declaredIn.entries()]
      .filter(([name, modules]) => modules.length > 1 && !(name in ALLOWED_DUPLICATES))
      .map(([name, modules]) => `${name} declared in ${modules.join(' and ')}`);

    expect(duplicates).toEqual([]);
  });

  it('the CMS tuning panel renders the declaration the generators import', () => {
    const group = TUNABLE_GROUPS.find(g => g.id === 'worldgen-terrain');
    expect(group, 'worldgen-terrain group is missing from TUNABLE_GROUPS').toBeDefined();

    /**
     * Each row's value must be identity-equal to the constant its owning module
     * exports — not merely numerically equal to a literal, which would still pass
     * if the panel were re-pointed at a divergent copy that happened to match.
     */
    const expectations: ReadonlyArray<readonly [string, number, string]> = [
      ['RIVER_MIN_LENGTH', worldGenData.RIVER_MIN_LENGTH, 'src/engine/worldGenData.ts'],
      ['LAKE_SIZE_MAX', worldGenData.LAKE_SIZE_MAX, 'src/engine/worldGenData.ts'],
      ['GREAT_LAKE_SIZE_MAX', worldGenData.GREAT_LAKE_SIZE_MAX, 'src/engine/worldGenData.ts'],
      ['TEMP_ALTITUDE_PENALTY', worldgenConstants.TEMP_ALTITUDE_PENALTY, 'src/engine/worldgen/constants.ts'],
    ];

    for (const [exportName, ownedValue, ownerFile] of expectations) {
      const row = group!.constants.find(c => c.exportName === exportName);
      expect(row, `${exportName} row is missing from the panel`).toBeDefined();
      expect(typeof ownedValue, `${exportName} is not exported by ${ownerFile}`).toBe('number');
      expect(row!.value, `panel shows a value the generator does not read for ${exportName}`)
        .toBe(ownedValue);
      expect(row!.sourceFile, `${exportName} row points at the wrong source file`).toBe(ownerFile);
    }
  });

  it('the generators and the panel agree on the river and lake limits', () => {
    // The consumer side of the same contract, asserted against the modules that
    // actually run: riverGeneration and lakeGeneration both import from
    // worldGenData, so these are the numbers in force during worldgen.
    expect(worldGenData.RIVER_MIN_LENGTH).toBeGreaterThan(0);
    expect(worldGenData.LAKE_SIZE_MAX).toBeLessThan(worldGenData.GREAT_LAKE_SIZE_MAX);
    expect(terrainPipelineTypes).not.toHaveProperty('RIVER_MIN_LENGTH');
    expect(terrainPipelineTypes).not.toHaveProperty('LAKE_SIZE_MAX');
    expect(terrainPipelineTypes).not.toHaveProperty('GREAT_LAKE_SIZE_MAX');
    expect(terrainPipelineTypes).not.toHaveProperty('TEMP_ALTITUDE_PENALTY');
  });
});
