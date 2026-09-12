/**
 * styleguideSync — the machine gate for UI Law 29.
 *
 * Law 29: "Every shared primitive renders at `?view=styleguide` with sample
 * data; a new primitive lands with its styleguide entry **and its
 * `component-selection.md` row in the same PR**, enforced by the
 * styleguide-sync test." (THR-1011.)
 *
 * ── Why the predicate is the DIRECTORY, not `shared/index.ts` ────────────────
 *
 * THR-1011 proposed keying this on "every export of `src/components/shared/
 * index.ts`". Measured at pickup, that predicate would have been vacuous in the
 * exact place it matters most: the barrel omitted `CardKeywordChip`,
 * `EntityVisual` and `OddsPips` — the three most-consumed primitives in the
 * library, `EntityVisual` being the reference implementation Laws 1, 3 and 27
 * are written around — while it *did* export the three that no production file
 * imports at all (`DetailBreadcrumb`, `DetailModal`, `Section`).
 *
 * So a barrel-keyed gate would have exempted the live primitives and policed
 * only the dead ones, and a primitive could be removed from the gate forever by
 * the accident of not being re-exported. The directory is the honest membership
 * predicate for "shared primitive": a `.tsx` file in `src/components/shared/`
 * is one, and there is no way to be one without being one.
 *
 * The barrel is still checked — as its own assertion, below — because an
 * unexported primitive is a real (if lesser) defect. It is just not the gate.
 *
 * ── Why this is a source-text gate ──────────────────────────────────────────
 *
 * Rendering `StyleGuide` and asserting on the output would go green on a
 * primitive whose section throws inside its `GameErrorBoundary`, and would need
 * every primitive's context and sample data stood up to prove a one-line
 * omission. Reading the source answers the question Law 29 actually asks —
 * "does this primitive have an entry?" — and fails on a deleted entry, which is
 * the Done-when. `assertCoverage` is exercised against a synthetic source in
 * the negative-control test so the matcher cannot silently pass on anything.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { SURFACE_BY_WORLD_REF } from '../../../data/surface-registry';

const here = dirname(fileURLToPath(import.meta.url));
const componentsDir = resolve(here, '../..');
const sharedDir = resolve(componentsDir, 'shared');

/**
 * Non-component modules that live in `shared/` but are not primitives: helpers,
 * resolvers, and the barrel itself. Each entry needs a reason — an unexplained
 * name here is how a gate gets hollowed out one exemption at a time.
 */
const NON_PRIMITIVE_MODULES: Record<string, string> = {
  'index.ts': 'the barrel itself',
  'entityVisualResolver.ts': 'pure resolver module, no component export (Law 3 resolver, rendered via EntityVisual)',
};

/** Every shared primitive: one `.tsx` module per primitive, no exceptions. */
function listPrimitives(): string[] {
  return readdirSync(sharedDir)
    .filter((f) => f.endsWith('.tsx'))
    .map((f) => f.replace(/\.tsx$/, ''))
    .filter((name) => !(`${name}.tsx` in NON_PRIMITIVE_MODULES))
    .sort();
}

/**
 * The shared predicate, extracted so the negative control below runs the
 * identical matcher the real assertion does.
 *
 * A primitive counts as covered when the source both imports it from
 * `shared/<Name>` and uses it somewhere that is not an import line — an import
 * alone is how a stale entry survives its own deletion.
 *
 * The usage count must be taken with import lines removed, not merely
 * discounted: `import { Ghost } from '../shared/Ghost'` contains the name
 * twice, so a naive "more than one occurrence" test scores an import-only file
 * as covered and the gate passes on exactly the shape it exists to catch.
 */
export function assertCoverage(source: string, primitive: string): boolean {
  const imported = new RegExp(`from '\\.\\./shared/${primitive}'`).test(source);
  if (!imported) return false;
  // Strip whole import statements, not import *lines* — a multi-line import
  // leaves its interior names behind under a line filter, which re-opens the
  // same hole for any primitive imported in braces across several lines.
  const body = source.replace(/^\s*import\b[\s\S]*?;\s*$/gm, '');
  return new RegExp(`\\b${primitive}\\b`).test(body);
}

const styleGuideSource = readFileSync(resolve(componentsDir, 'StyleGuide/StyleGuide.tsx'), 'utf8');
const barrelSource = readFileSync(resolve(sharedDir, 'index.ts'), 'utf8');
const primitives = listPrimitives();

describe('styleguide sync (UI Law 29)', () => {
  it('finds the primitive set from the directory, not from a hand-kept list', () => {
    expect(primitives.length).toBeGreaterThan(0);
    expect(primitives).toContain('EntityVisual');
    expect(primitives).toContain('Button');
  });

  it.each(primitives)('%s renders at ?view=styleguide', (primitive) => {
    expect(
      assertCoverage(styleGuideSource, primitive),
      `${primitive} has no StyleGuide entry. Law 29: a new primitive lands with its styleguide ` +
        `entry and its component-selection.md row in the same PR. Add a section to ` +
        `src/components/StyleGuide/StyleGuide.tsx rendering it with sample data.`,
    ).toBe(true);
  });

  it.each(primitives)('%s is re-exported from shared/index.ts', (primitive) => {
    expect(
      new RegExp(`from '\\./${primitive}'`).test(barrelSource),
      `${primitive} is not exported from src/components/shared/index.ts, so consumers must ` +
        `deep-import it. Add it to the barrel.`,
    ).toBe(true);
  });

  it('every primitive carries a component-selection.md row', () => {
    const selection = readFileSync(
      resolve(componentsDir, '../../Docs/design-system/component-selection.md'),
      'utf8',
    );
    const missing = primitives.filter((p) => !selection.includes(`\`${p}\``));
    expect(
      missing,
      `Law 29 requires the component-selection.md row to land with the primitive. Missing: ${missing.join(', ')}`,
    ).toEqual([]);
  });

  it('every primitive carries a primitives.md inventory row', () => {
    const spec = readFileSync(resolve(componentsDir, '../../Docs/design-system/primitives.md'), 'utf8');
    const missing = primitives.filter((p) => !spec.includes(`\`${p}\``));
    expect(
      missing,
      `primitives.md is the spec Law 27 cites. Missing inventory rows: ${missing.join(', ')}`,
    ).toEqual([]);
  });

  // ── Negative control ───────────────────────────────────────────────────────
  // The Done-when: "the sync test demonstrably fails when a primitive is removed
  // from the styleguide". Asserting that here rather than by hand-deleting an
  // import keeps the proof in the suite, where it re-runs.
  describe('the gate detects a removal', () => {
    it('fails a primitive whose import was deleted', () => {
      const withoutButton = styleGuideSource
        .split('\n')
        .filter((line) => !line.includes("from '../shared/Button'"))
        .join('\n');
      expect(assertCoverage(withoutButton, 'Button')).toBe(false);
      expect(assertCoverage(styleGuideSource, 'Button')).toBe(true);
    });

    it('fails a primitive that is imported but never rendered', () => {
      const importOnly = "import { Ghost } from '../shared/Ghost';\n";
      expect(assertCoverage(importOnly, 'Ghost')).toBe(false);
    });

    it('fails a primitive absent from the source entirely', () => {
      expect(assertCoverage(styleGuideSource, 'NotAPrimitive')).toBe(false);
    });
  });
});

// ─── Sheet mounts (THR-1490) ────────────────────────────────────────────────
//
// The gate above proves a *shared primitive* is documented. It says nothing about the
// Tier-3 sheets under `src/components/Game/`, which are not primitives and were never in
// its membership — and that is the gap the THR-1482 assessment measured: the agent had
// six card components and two of them (`AgentDetailPanel`, `NpcDetailView`) had no
// production mount at all, while both still carried rows in `component-selection.md`. A
// doc row for a component nothing renders is worse than no row: it reads as an
// instruction to use it.
//
// So the predicate here is *mount*, not documentation. A sheet is mounted when something
// outside tests and the style guide imports it. That is deliberately the weakest claim
// that catches the measured defect — asserting a render would need every sheet's props
// and context stood up, and would go green on a sheet imported into a branch no state
// can reach, which this does not pretend to catch either.

/** The Tier-3 sheets the surface registry can route to. Each must have a production mount. */
const ROUTED_SHEETS = [
  'AgentProfileModal',
  'LocationProfileModal',
  'FactionSheet',
  'ArmySheet',
  'ArtifactSheet',
  'AttachmentDetailView',
  'AscendantSheet',
] as const;

/** Files that importing a sheet does *not* count as mounting it. */
function isProductionModule(path: string): boolean {
  return !path.includes('__tests__') && !path.includes('StyleGuide') && !path.endsWith('.test.tsx');
}

function listProductionSources(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === 'StyleGuide') continue;
      listProductionSources(full, acc);
    } else if ((entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) && isProductionModule(full)) {
      acc.push(full);
    }
  }
  return acc;
}

describe('routed sheets have a production mount (THR-1490)', () => {
  const sources = listProductionSources(componentsDir).map(p => ({ path: p, text: readFileSync(p, 'utf8') }));

  /** Modules that import `sheet` by name, excluding the sheet's own file. */
  function importersOf(sheet: string): string[] {
    return sources
      .filter(s => !s.path.endsWith(`${sheet}.tsx`))
      .filter(s => new RegExp(`from '[^']*${sheet}'`).test(s.text))
      .map(s => s.path);
  }

  it.each(ROUTED_SHEETS)('%s is imported by a production module', (sheet) => {
    expect(
      importersOf(sheet).length,
      `${sheet} is a sheet the surface registry routes to and nothing outside tests and the ` +
        `styleguide imports it. Either mount it, or take its surface-registry row and its ` +
        `component-selection.md row out in the same PR — a documented sheet with no mount is ` +
        `an instruction to use something that does not exist.`,
    ).toBeGreaterThan(0);
  });

  it('detects an unmounted component — negative control', () => {
    // The Done-when: this gate demonstrably fails on a `Game/` component with no mount.
    // Run against a name nothing imports rather than by deleting a real import, so the
    // proof stays in the suite.
    expect(importersOf('NoSuchSheetComponent')).toEqual([]);
  });

  it('every sheet the registry promises is covered by this gate', () => {
    // Pins the hand-written list above against the registry, so a sheet added to a
    // surface row without being added here cannot slip past unmounted.
    // (`agent` → AgentProfileModal, `hex` → HexDetailView, `area` → the hex chronicle:
    // the three arms whose destination is not a modal sheet are excluded by name.)
    const NON_SHEET_ARMS = new Set(['hex', 'area', 'encounter', 'journey', 'receipt']);
    const promised = Object.values(SURFACE_BY_WORLD_REF)
      .map(row => row.sheet)
      .filter((s): s is NonNullable<typeof s> => s !== null && !NON_SHEET_ARMS.has(s));
    // Every promised arm maps to one of the sheets listed above; the mapping is by
    // convention (arm 'faction' → FactionSheet) and is asserted loosely by name.
    for (const arm of promised) {
      const matched = ROUTED_SHEETS.some(s => s.toLowerCase().includes(arm.toLowerCase()));
      expect(matched, `surface registry promises sheet arm "${arm}" and ROUTED_SHEETS names no component for it`).toBe(true);
    }
  });
});

// ─── Nav ↔ section sync (THR-1167) ──────────────────────────────────────────
//
// The `SECTIONS` registry drives the left-hand nav; each entry's `id` is expected
// to anchor a `<section id="section-${id}">` in the same file. The two are written
// ~1000 lines apart, so retiring a styleguide section is exactly the edit that
// leaves a nav link pointing at nothing — a dead anchor that scrolls nowhere and
// reads as a broken page rather than as a removed demo. THR-1167 removed the
// `encounter-choice-c2` pair when its prototype component was retired; this gate is
// what makes the *next* such removal fail loudly instead of silently.

describe('styleguide nav and sections stay in sync', () => {
  function navIds(source: string): string[] {
    const registry = source.match(/const SECTIONS = \[([\s\S]*?)\n\];/);
    if (!registry) return [];
    return [...registry[1].matchAll(/id: '([^']+)'/g)].map((m) => m[1]);
  }

  function sectionIds(source: string): string[] {
    return [...source.matchAll(/id="section-([^"]+)"/g)].map((m) => m[1]);
  }

  // Vacuity guard, first: if either matcher stops parsing the file, both
  // assertions below go green against empty sets and prove nothing.
  it('parses a non-empty nav registry and section set', () => {
    expect(navIds(styleGuideSource).length).toBeGreaterThan(0);
    expect(sectionIds(styleGuideSource).length).toBeGreaterThan(0);
  });

  it('every nav entry anchors a section that exists', () => {
    const sections = sectionIds(styleGuideSource);
    const orphaned = navIds(styleGuideSource).filter((id) => !sections.includes(id));
    expect(
      orphaned,
      `nav entries pointing at no section (dead anchors): ${orphaned.join(', ')}`,
    ).toEqual([]);
  });

  it('every section is reachable from the nav', () => {
    const nav = navIds(styleGuideSource);
    const unreachable = sectionIds(styleGuideSource).filter((id) => !nav.includes(id));
    expect(
      unreachable,
      `sections with no nav entry (unreachable by scroll): ${unreachable.join(', ')}`,
    ).toEqual([]);
  });

  // Negative control — the matchers must actually fail on the shape they exist
  // to catch, or the two assertions above are green on a file they never read.
  it('detects a nav entry whose section was removed', () => {
    const withSectionGone = styleGuideSource.replace('id="section-tokens"', 'id="section-renamed"');
    expect(navIds(withSectionGone)).toContain('tokens');
    expect(sectionIds(withSectionGone)).not.toContain('tokens');
  });
});
