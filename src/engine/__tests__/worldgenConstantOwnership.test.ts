/**
 * THR-1409 / THR-1418 — one declaration per worldgen constant, and a tuning
 * panel every row of which reads the declaration a generator imports.
 *
 * THR-1409: three constants (`RIVER_MIN_LENGTH`, `LAKE_SIZE_MAX`,
 * `GREAT_LAKE_SIZE_MAX`) were declared in both `terrainPipeline/types.ts` and
 * `worldGenData.ts` with *different* values, and a fourth
 * (`TEMP_ALTITUDE_PENALTY`) in both `terrainPipeline/types.ts` and
 * `worldgen/constants.ts`. The two copies had disjoint consumers — the
 * generators read one, the CMS tuning panel rendered the other — so the
 * divergence never surfaced as a conflict, and the panel displayed numbers no
 * world had ever been generated with. That is an NFP #1 (Tunability) failure:
 * the surface a designer opens to change a number was wired to a copy nothing
 * reads.
 *
 * THR-1418: the sweep that fix required showed the duplication was the small
 * half. `terrainPipeline/` had no pipeline — no passes, no orchestrator, no
 * caller — and 22 further panel rows read it. It has been retired, and the
 * `worldgen-terrain` group rebuilt from the live pipeline's own constants.
 * The third guard below generalises the second: it holds for *every* row in
 * the group, so a future row wired to a module no generator reads fails here
 * rather than waiting for someone to notice a dial that does nothing.
 *
 * Three guards, because the failure has three independent halves:
 *   1. No constant name is declared by more than one worldgen constants module.
 *   2. Every panel row resolves to a live module and is identity-equal to it.
 *   3. The four THR-1409 constants specifically still point at their owner.
 *
 * Guard 1 alone would not have caught a panel re-pointed at a third module,
 * guard 2 alone would not have caught a fresh duplicate nothing renders yet,
 * and guard 3 pins the specific regression that motivated the first two.
 */
import { describe, it, expect } from 'vitest';

import * as worldGenData from '../worldGenData';
import * as worldgenConstants from '../worldgen/constants';
import { TUNABLE_GROUPS } from '../../components/CMS/tunableConstants';

/**
 * The modules that declare worldgen tuning constants. Runtime namespace keys,
 * not parsed source: types erase at runtime, so this compares exactly the
 * declarations a consumer can import a *value* from — which is the thing that
 * can silently diverge.
 *
 * `terrainPipeline/types.ts` was the third entry until THR-1418 retired it.
 * The keys here are also the only `sourceFile` values a `worldgen-terrain` row
 * may carry; anything else fails guard 2 rather than being skipped by it.
 */
const MODULES: ReadonlyArray<readonly [string, Record<string, unknown>]> = [
  ['src/engine/worldGenData.ts', worldGenData],
  ['src/engine/worldgen/constants.ts', worldgenConstants],
];

/**
 * Names allowed to appear in more than one module, each with the reason it must.
 * Empty by design — a new entry here is a deliberate, reviewed exception, not a
 * place to silence this test.
 */
const ALLOWED_DUPLICATES: Record<string, string> = {};

describe('worldgen constant ownership (THR-1409, THR-1418)', () => {
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

  it('every worldgen-terrain row reads a constant a live module declares', () => {
    const group = TUNABLE_GROUPS.find(g => g.id === 'worldgen-terrain');
    expect(group, 'worldgen-terrain group is missing from TUNABLE_GROUPS').toBeDefined();

    const rows = group!.constants;
    // Falsification guard: an empty group would make every assertion below
    // vacuous, and "no row is broken" would pass on a panel showing nothing.
    expect(rows.length, 'worldgen-terrain group renders no rows').toBeGreaterThan(10);

    const byFile = new Map(MODULES);
    const failures: string[] = [];
    const filesSeen = new Set<string>();

    for (const row of rows) {
      const mod = byFile.get(row.sourceFile);
      if (!mod) {
        // An unrecognised sourceFile FAILS rather than being skipped — a row
        // pointed at a module nothing generates from is the whole defect.
        failures.push(`${row.exportName} points at ${row.sourceFile}, which declares no worldgen constants`);
        continue;
      }
      filesSeen.add(row.sourceFile);
      if (!(row.exportName in mod)) {
        failures.push(`${row.exportName} is not exported by ${row.sourceFile}`);
        continue;
      }
      if (row.value !== mod[row.exportName]) {
        failures.push(
          `${row.exportName} renders ${String(row.value)} but ${row.sourceFile} declares ${String(mod[row.exportName])}`,
        );
      }
    }

    expect(failures).toEqual([]);

    // Coverage guard: the loop must actually exercise both modules, or a
    // regression confined to one of them would pass unnoticed.
    expect([...filesSeen].sort()).toEqual(MODULES.map(([f]) => f).sort());
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
    expect(worldGenData.RIVER_SOURCE_COUNT_MIN).toBeLessThan(worldGenData.RIVER_SOURCE_COUNT_MAX);
  });
});
