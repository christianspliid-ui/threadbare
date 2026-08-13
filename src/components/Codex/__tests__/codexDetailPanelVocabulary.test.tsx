// @vitest-environment jsdom

/**
 * Codex detail panel — the composed surface carries no raw `crudType` (THR-1076).
 *
 * Companion to `codexPlayerVocabulary.test.ts`, which pins the invariant on the registry data.
 * This one renders the real `CodexDetailPanel` against real catalog entries, so the evidence is
 * about what the player's surface actually paints rather than about the shape of an object that
 * feeds it. A mapper could be clean and a component could still reintroduce the enum on its own.
 *
 * It also stands as the **browser-verify substitution** for this change (THR-754 / impediment
 * #546): `preview_start` is refused in unattended scheduled runs, so the contractual 1920×1080
 * pixel capture has no reachable route. Substitution is honest here rather than merely convenient
 * because the change is a pure deletion — it removes a detail row, a tag chip, and a subtitle
 * suffix — so the failure classes only pixels can catch (overflow, z-index, off-viewport paint)
 * are structurally absent: removing content from a vertical list strictly reduces layout pressure.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CodexDetailPanel } from '../CodexDetailPanel';
import { getAllCodexEntries, type CodexEntry } from '../codexRegistry';

const CRUD_VALUES = ['create', 'read', 'update', 'delete'] as const;

/** One representative entry from each of the three action mappers. */
function pick(predicate: (e: CodexEntry) => boolean, label: string): CodexEntry {
  const entry = getAllCodexEntries().find(predicate);
  if (!entry) throw new Error(`no catalog entry matched ${label} — the fixture, not the fix, is stale`);
  return entry;
}

const CASES: { label: string; entry: () => CodexEntry }[] = [
  { label: 'divine mapper', entry: () => pick(e => e.category === 'divine', 'category divine') },
  { label: 'mortal mapper', entry: () => pick(e => e.category === 'actions', 'category actions') },
  { label: 'target mapper', entry: () => pick(e => e.id === 'hex.bless_land', 'hex.bless_land') },
];

describe('THR-1076 — the rendered Codex detail panel speaks no CRUD', () => {
  for (const { label, entry } of CASES) {
    it(`renders no CRUD label and no crud chip for the ${label}`, () => {
      const e = entry();
      const { container } = render(<CodexDetailPanel entry={e} onClose={() => {}} />);
      const text = container.textContent ?? '';

      // The label was the worst of it: a database term used as a player-facing row heading.
      expect(screen.queryByText('CRUD'), `${e.id} still renders a CRUD row label`).toBeNull();

      // And no chip or row is the bare enum. Exact-text match, so authored prose elsewhere in
      // the panel ("creates a bond edge" in technicalEffect) is not swept — see the sibling
      // test's scope note.
      for (const v of CRUD_VALUES) {
        expect(
          screen.queryByText(v),
          `${e.id} still renders '${v}' as a standalone chip or value`,
        ).toBeNull();
      }

      // Guard the guard: an empty render would pass every assertion above.
      expect(text.length).toBeGreaterThan(20);
      expect(text).toContain(e.name);
    });
  }

  it('still paints a subtitle, so the deletion did not blank the card face', () => {
    const e = CASES[2].entry();
    render(<CodexDetailPanel entry={e} onClose={() => {}} />);

    expect(e.subtitle.trim()).not.toBe('');
    // `getAllByText`, not `getByText`: the reach word legitimately appears more than once —
    // as the subtitle and again as the `Reach` detail row — and a unique-match query would
    // fail on that rather than on anything about the fix.
    expect(screen.getAllByText(e.subtitle).length).toBeGreaterThan(0);
    // The reach word alone is the orientation the subtitle exists to give.
    expect(e.subtitle).toBe('Star');
  });
});
