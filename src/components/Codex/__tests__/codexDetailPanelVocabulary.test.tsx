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

/**
 * THR-1113 — the agreement, resource and magnitude rows, on the composed surface.
 *
 * **This block is the browser-verify substitution for THR-1113** (THR-754 route 3; impediments
 * #546 ×10, #574). `preview_start` was verified refused in this run — *"Dev servers can't be
 * started from unattended sessions"* — so the contractual 1920×1080 capture has no reachable
 * route, and the Playwright fallback presumes the same dev server.
 *
 * **Why the substitution is honest for this change specifically.** Two kinds of edit ship here,
 * and neither adds layout pressure. Most are string substitutions inside a row or chip that
 * already rendered, exactly the THR-1103 case above. The one structural change *removes* rows —
 * twelve blank `Domain Effects` rows stop rendering — and removing entries from a vertical list
 * strictly reduces the pressure the pixel classes (overflow, off-viewport paint) need in order to
 * exist. Nothing is added, resized or repositioned.
 *
 * The honest residue, stated rather than waived: values got **longer** in two rows
 * (`+0.04 Gold, +0.02 Heart` → `a slight edge in Gold, a faint edge in Heart`, and the joined
 * effect phrases), and only pixels can confirm the reflow *looks* right. The length bound below
 * checks the property a render test can actually see; THR-1109 is the standing precedent that an
 * owed pixel pass is filed, not waived, if one is later judged necessary here.
 */
describe('THR-1113 — the rendered panel speaks no agreement, resource or magnitude key', () => {
  it('paints a timed agreement in days, with resolved type and effect phrases', () => {
    const e = pick(x => x.id === 'agreement.debt.minor', 'agreement.debt.minor');
    render(<CodexDetailPanel entry={e} onClose={() => {}} />);

    // Positive assertions first — an absence check alone cannot tell a resolved row from a
    // deleted one, which is the failure mode these suites exist to catch.
    expect(screen.getByText('Type')).toBeTruthy();
    expect(screen.getAllByText('Debt').length).toBeGreaterThan(0);   // subtitle + Type row
    expect(screen.getByText('Duration')).toBeTruthy();
    expect(screen.getByText('four days')).toBeTruthy();              // was `48 ticks`
    expect(screen.getByText('Effects')).toBeTruthy();
    expect(screen.getByText('shifts standing')).toBeTruthy();        // was `social_modifier`

    // And the raw forms are gone from the composed surface.
    for (const raw of ['debt', '48 ticks', 'social_modifier']) {
      expect(screen.queryByText(raw), `panel still paints raw '${raw}'`).toBeNull();
    }
  });

  it('paints a permanent agreement without inventing a duration', () => {
    // The other branch of the duration decision — `Permanent` must survive the tick conversion.
    const e = pick(x => x.id === 'agreement.oath.service', 'agreement.oath.service');
    render(<CodexDetailPanel entry={e} onClose={() => {}} />);

    expect(screen.getByText('Permanent')).toBeTruthy();
    expect(screen.getByText('sways behaviour, opens or bars actions')).toBeTruthy();
    expect(screen.queryByText('oath')).toBeNull();
  });

  it('paints a resource class resolved in the subtitle, the chip and the row', () => {
    const e = pick(x => x.id === 'resource.arcane_crystal', 'resource.arcane_crystal');
    render(<CodexDetailPanel entry={e} onClose={() => {}} />);

    expect(screen.getByText('Class')).toBeTruthy();
    // Three faces of the same key: subtitle, tag chip, `Class` row — all resolved now.
    expect(screen.getAllByText(/Arcane/).length).toBeGreaterThan(1);
    expect(screen.queryByText('arcane'), 'panel still paints the raw category').toBeNull();
  });

  it('paints a banded domain contribution, with no numeral on the surface', () => {
    // The one entry in the catalog carrying a populated `domainContributions`.
    const e = pick(x => x.id === 'reward_bestowed_patrons_backing', 'the bestowed patron entry');
    const { container } = render(<CodexDetailPanel entry={e} onClose={() => {}} />);

    expect(screen.getByText('Domain Effects')).toBeTruthy();
    expect(screen.getByText('a slight edge in Gold, a faint edge in Heart')).toBeTruthy();

    // Scoped to the row rather than the whole panel: authored prose elsewhere may legitimately
    // contain a digit, and sweeping the container would fail on English rather than on a leak.
    const row = Array.from(container.querySelectorAll('*'))
      .find(el => el.textContent === 'a slight edge in Gold, a faint edge in Heart');
    expect(row, 'the banded row did not render').toBeTruthy();
    expect(/\d/.test(row!.textContent ?? '')).toBe(false);
  });

  it('renders no blank-valued row on a condition that carries an empty contribution record', () => {
    // Twelve conditions author `domainContributions: {}`, which passed the old truthiness guard
    // and painted a `Domain Effects` label with nothing after it. The row must now be absent —
    // not present-and-empty.
    const e = pick(
      x => x.id === 'reward_condition_gale_touched',
      'a condition with an empty domainContributions record',
    );
    render(<CodexDetailPanel entry={e} onClose={() => {}} />);

    expect(screen.queryByText('Domain Effects'), 'blank row still renders its label').toBeNull();
    // Guard the guard: the panel must still have painted something.
    expect(screen.getByText(e.name)).toBeTruthy();
  });

  it('keeps the lengthened values inside the 360px panel', () => {
    // The rows this change touches are the ones that grew. The banded contribution is the longest
    // the catalog can produce; the bound is set above it with headroom for a two-reach condition,
    // and the panel's rows are flex `<div>`s that wrap rather than clip.
    const grown = getAllCodexEntries()
      .flatMap(e => e.details.map(d => ({ id: e.id, label: d.label, value: d.value })))
      .filter(d => ['Domain Effects', 'Reach Bonus', 'Duration', 'Type', 'Effects', 'Class'].includes(d.label));

    expect(grown.length).toBeGreaterThan(80);
    expect(grown.filter(d => d.value.length > 60).map(d => `${d.id}: ${d.label} = "${d.value}"`)).toEqual([]);
    // No row may go empty, which is the defect this ticket also repaired.
    expect(grown.filter(d => d.value.trim() === '').map(d => `${d.id}: ${d.label}`)).toEqual([]);
  });
});
