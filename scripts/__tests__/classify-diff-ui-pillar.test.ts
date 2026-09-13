/**
 * THR-1471 — the browser-verify route reminder on `npm run classify:diff`.
 *
 * The rule ("decide the browser-verify route at claim, not at the capture") is
 * written in `Docs/canon/verification-gates.md` § Browser-verify and again in
 * pull-work Step 3, and fired at neither placement: impediment row 1011 recorded a
 * run that implemented THR-1452 in full, ran suite/ratchet/build/CLI smoke, and only
 * then hit the `preview_start` unattended refusal at the capture — ×4, on a class
 * whose tail runs rows 546 (×13), 574, 638 (×12), 683 (×13).
 *
 * The fix is a printed line on the one script every code-diff session already runs
 * before choosing a gate track. These tests pin the two halves of that: the line
 * appears for a UI-pillar diff, and does not appear for one without UI paths.
 *
 * They assert on the **rendered output**, not on the source that renders it, for the
 * reason `docs-only-predicate.ts` already gives about the predicate copies: a test
 * that only proves a string is present in a file is the same kind of evidence that
 * failed here twice — the rule was present both times.
 */

import { describe, it, expect } from 'vitest';

import { UI_PILLAR_REMINDER, renderClassification } from '../classify-diff.ts';
import { UI_PILLAR_PREFIXES, isUiPillarPath, uiPillarPaths } from '../docs-only-predicate.ts';

const BASE = 'origin/main...HEAD';

/** A path under each UI-pillar prefix, derived so a new prefix is covered on arrival. */
const UI_PILLAR_FIXTURES = UI_PILLAR_PREFIXES.map((prefix) =>
  prefix.endsWith('/') ? `${prefix}Example.tsx` : prefix,
);

/**
 * Code paths that must NOT trip the reminder. `src/index.ts` and `src/hooksUtil.ts`
 * are the load-bearing rows: a prefix test written as a bare `startsWith('src/index')`
 * or `startsWith('src/hooks')` would swallow both, which is the way this predicate is
 * most likely to be wrong without looking wrong.
 */
const NON_UI_FIXTURES = [
  'src/engine/graph.ts',
  'src/types/gameState.ts',
  'src/data/unified-action-templates.ts',
  'scripts/classify-diff.ts',
  'src/index.ts',
  'src/hooksUtil.ts',
];

describe('UI-pillar membership predicate', () => {
  it.each(UI_PILLAR_FIXTURES)('classifies %s as UI pillar', (file) => {
    expect(isUiPillarPath(file)).toBe(true);
  });

  it.each(NON_UI_FIXTURES)('does not classify %s as UI pillar', (file) => {
    expect(isUiPillarPath(file)).toBe(false);
  });

  it('matches Windows-style separators, since git output is not the only caller', () => {
    expect(isUiPillarPath('src\\components\\HexMapV2\\HexMap.tsx')).toBe(true);
  });

  it('covers every prefix CLAUDE.md names, so a widened rule cannot ship half-wired', () => {
    expect([...UI_PILLAR_PREFIXES]).toEqual([
      'src/components/',
      'src/hooks/',
      'src/contexts/',
      'src/index.css',
    ]);
  });

  it('drops blank entries, which git diff output carries as a trailing line', () => {
    expect(uiPillarPaths(['', '  ', 'src/components/A.tsx'])).toEqual(['src/components/A.tsx']);
  });
});

describe('classify:diff — browser-verify route reminder', () => {
  it('prints the reminder for a UI-pillar diff, naming the offending path', () => {
    const output = renderClassification(['src/components/HexMapV2/HexMap.tsx'], BASE);

    expect(output).toContain(UI_PILLAR_REMINDER);
    expect(output).toContain('src/components/HexMapV2/HexMap.tsx');
  });

  it.each(UI_PILLAR_FIXTURES)('prints the reminder when the diff touches %s', (file) => {
    expect(renderClassification([file], BASE)).toContain(UI_PILLAR_REMINDER);
  });

  it('does not print the reminder for an engine-only diff', () => {
    const output = renderClassification(['src/engine/graph.ts'], BASE);

    expect(output).toContain('classify:diff — code');
    expect(output).not.toContain(UI_PILLAR_REMINDER);
  });

  it('does not print the reminder for a docs-only diff', () => {
    const output = renderClassification(['Docs/canon/process.md'], BASE);

    expect(output).toContain('classify:diff — docs-only');
    expect(output).not.toContain(UI_PILLAR_REMINDER);
  });

  it('prints it on a mixed diff — one UI path among engine and docs changes', () => {
    const output = renderClassification(
      // Any doc path serves; deliberately not `Docs/impediments.md`, which
      // `docs-code-decoupling.test.ts` forbids a test file from naming at all.
      ['Docs/changelog.md', 'src/engine/graph.ts', 'src/hooks/useSimulation.ts'],
      BASE,
    );

    expect(output).toContain(UI_PILLAR_REMINDER);
    expect(output).toContain('src/hooks/useSimulation.ts');
  });

  it('still owes the full gate — the reminder is additional, not a substitute', () => {
    const output = renderClassification(['src/components/HexMapV2/HexMap.tsx'], BASE);

    expect(output).toContain('Owes the full gate');
  });

  it('names the evidence contract and the claim-time deadline, not just "browser-verify"', () => {
    // The whole failure mode is a reminder that says less than the session needs at
    // the moment it reads it. These are the three facts a run cannot act without.
    expect(UI_PILLAR_REMINDER).toContain('four-part');
    expect(UI_PILLAR_REMINDER).toContain('verification-gates.md');
    expect(UI_PILLAR_REMINDER).toContain('Browser-verify substitution');
  });
});
