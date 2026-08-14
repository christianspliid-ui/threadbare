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

/**
 * THR-1103 — the composed panel resolves every key it paints.
 *
 * **This block is the browser-verify substitution for THR-1103** (THR-754 route 3; impediments
 * #546 ×10, #574). `preview_start` is refused in unattended scheduled runs — verified refused at
 * the start of this run, before implementation, per CLAUDE.md's "decide the route before claiming
 * a UI-pillar ticket" rule — so the contractual 1920×1080 capture has no reachable route.
 *
 * The substitution is honest for *this* change specifically: every edit is a string
 * substitution inside an existing row or chip that already rendered, so no element is added,
 * removed, resized or repositioned. The failure classes only pixels can catch — overflow,
 * z-index, off-viewport paint — need a layout delta to exist, and there is none. What could
 * genuinely break is *which words appear*, and that is exactly what a render assertion sees.
 *
 * One real layout consideration, checked rather than assumed: values got **longer**
 * (`regional` → `Regional`, `3` → `3 essence`). The rows are `<div>`s in a 360px-wide flex
 * column that wraps, so a longer value reflows rather than clipping — and the longest value the
 * catalog can now produce is asserted below to stay inside the width the panel already handles
 * for existing rows like `Loss Condition`.
 */
describe('THR-1103 — the rendered Codex detail panel speaks no raw keys', () => {
  const RAW_TOKENS = ['regional', 'personal', 'local', 'cosmic', 'star', 'life', 'time', 'shadow'];

  it('paints hex.bless_land with every axis resolved — the entry the ticket measured', () => {
    const e = pick(x => x.id === 'hex.bless_land', 'hex.bless_land');
    render(<CodexDetailPanel entry={e} onClose={() => {}} />);

    // The three violations named in the ticket, each asserted as the *player-visible* string.
    // Positive assertions first: these prove the row still renders and now renders resolved,
    // which a bare "the raw token is absent" check cannot distinguish from a deleted row.
    expect(screen.getByText('Reach')).toBeTruthy();
    expect(screen.getAllByText('Star').length).toBeGreaterThan(0);   // was `star` in the tag chip
    expect(screen.getByText('Scale')).toBeTruthy();
    // `getAllByText` for the same reason the sibling suite needs it on the reach word: scale now
    // paints twice — the tag chip and the `Scale` row — which is the point, both resolved.
    expect(screen.getAllByText('Regional').length).toBe(2);          // was `regional` in both
    expect(screen.getByText('Cost')).toBeTruthy();
    expect(screen.getByText('3 essence')).toBeTruthy();              // was `3`

    // And the raw forms are gone from the composed surface.
    for (const token of RAW_TOKENS) {
      expect(screen.queryByText(token), `panel still paints raw '${token}'`).toBeNull();
    }

    // The stale row label is gone with it — the unit moved into the value.
    expect(screen.queryByText('Essence Cost')).toBeNull();
  });

  it('paints a free action as `Free`, not `0`', () => {
    // The other branch of the cost decision. `0` is the shape that would read as a magnitude;
    // `Free` is what ActionCard has always said for the same template.
    const e = pick(x => x.details.some(d => d.label === 'Cost' && d.value === 'Free'), 'a free action');
    render(<CodexDetailPanel entry={e} onClose={() => {}} />);

    expect(screen.getByText('Free')).toBeTruthy();
    expect(screen.queryByText('0')).toBeNull();
  });

  it('paints no raw key on any of the three action mappers', () => {
    for (const { label, entry } of CASES) {
      const e = entry();
      const { container, unmount } = render(<CodexDetailPanel entry={e} onClose={() => {}} />);

      for (const token of RAW_TOKENS) {
        expect(
          screen.queryByText(token),
          `${label} (${e.id}) still paints raw '${token}'`,
        ).toBeNull();
      }

      // Guard the guard: an empty render passes every absence assertion above.
      expect((container.textContent ?? '').length).toBeGreaterThan(20);
      unmount();
    }
  });

  it('keeps every detail value short enough for the 360px panel', () => {
    // The change lengthens values, so this is the one layout property a render test can still
    // check. 40 chars is comfortably inside what the panel already carries (`Loss Condition`
    // values run longer), and a regression here would mean a vocabulary row went wrong rather
    // than a style breaking.
    const long = getAllCodexEntries()
      .flatMap(e => e.details.map(d => ({ id: e.id, label: d.label, value: d.value })))
      .filter(d => ['Reach', 'Scale', 'Cost', 'Sphere', 'Visibility'].includes(d.label))
      .filter(d => d.value.length > 40);

    expect(long.map(d => `${d.id}: ${d.label} = "${d.value}"`)).toEqual([]);
  });
});
