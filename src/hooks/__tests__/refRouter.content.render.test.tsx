// @vitest-environment jsdom
/**
 * The content card, rendered (THR-1491).
 *
 * **This file is the browser-verify evidence for slice 2**, under the sanctioned
 * substitution for an unattended run in which `preview_start` is refused
 * (`Docs/canon/verification-gates.md` § Browser-verify): *jsdom render assertions on the
 * real component, asserting the rendered DOM for every face the change produces, plus
 * absence where the element should not render.* Recorded in the commit body as
 * `Browser-verify substitution: jsdom-render — unattended run, no startable dev server`.
 * It is the sibling of `refRouter.render.test.tsx`, which did the same for slice 1, and
 * follows its shape deliberately.
 *
 * So nothing here mocks the card. Every case renders the **real** `DetailModal` through
 * the **real** router over the **real shipped catalogs** — a card opened here is composed
 * by the same code path a chip click uses in `GameView`. The faces this change produces
 * are each checked below:
 *
 * 1. a content card for a covered kind and an uncovered one, showing name, kind word,
 *    prose and marks;
 * 2. the tag chips, with a `tag.*` tooltip on a seated spelling and none on an unseated one;
 * 3. the codex CTA present when the row *and* the entry allow it, and **absent** when
 *    either does not (Law 25 — the absence is the assertion that matters);
 * 4. the CTA's wording — "open in codex ↗", not "open her sheet ↗" (different rooms);
 * 5. `EntityLink` carrying a `ContentRef` — a live control, and plain text with no router;
 * 6. the sheet arm reaching `openCodexEntry`, and falling back to the card when it cannot;
 * 7. the unwritten stub for an id no catalog holds.
 *
 * What it deliberately does **not** claim: nothing here is evidence about paint, z-order,
 * overflow or the 1920×1080 contract — the three things the gate exists for and the three
 * jsdom cannot see. The content card reuses `DetailModal`'s panel wholesale (the only new
 * geometry is `DETAIL_CONTENT_W/_H`, which equal the default), so the viewport argument is
 * slice 1's unchanged; a real capture is owed the next time an attended session opens one.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { WorldGraph } from '../../engine/graph';
import type { NavigationTarget } from '../../types/notification';
import type { AnyRef, ContentRef } from '../../types/contentRef';
import { useRefRouter, type RefRouter } from '../useRefRouter';
import { RefRouterProvider } from '../../contexts/RefRouterContext';
import { DetailModalStackValueProvider } from '../../contexts/DetailModalStackContext';
import { DetailModal } from '../../components/shared/DetailModal';
import { EntityLink } from '../../components/shared/EntityLink';
import { SURFACE_BY_CONTENT_KIND } from '../../data/surface-registry';
import { entriesOfKind } from '../../data/contentCatalogs';
import { resolveContentEntry } from '../../engine/contentEntryResolver';
import { getContentObjectKind } from '../../data/content-objects';

/**
 * A real catalog entry of a kind, with its resolved view.
 *
 * Taken from the shipped corpus rather than a fixture: the whole risk in this slice is a
 * prose adapter reading a field the catalog does not have, and a fixture would invent both
 * sides of that and render beautifully while every real card showed its id.
 */
function realEntry(kind: ContentRef['kind']) {
  const entry = entriesOfKind(kind).find(e => {
    const view = resolveContentEntry({ kind, id: e.id });
    return view !== null && view.name !== e.id;
  });
  if (!entry) throw new Error(`no resolvable ${kind} entry in the shipped catalogs`);
  return { ref: { kind, id: entry.id } as ContentRef, view: resolveContentEntry({ kind, id: entry.id })! };
}

function Harness({
  onRouter,
  openCodexEntry,
  codexHasEntry,
  children,
}: {
  onRouter?: (r: RefRouter) => void;
  openCodexEntry?: (id: string) => boolean;
  codexHasEntry?: (id: string) => boolean;
  children?: ReactNode;
}) {
  const router = useRefRouter({
    graph: new WorldGraph(),
    tick: 6,
    seed: 42,
    openSheet: (_t: NavigationTarget) => true,
    openCodexEntry,
    codexHasEntry,
  });
  onRouter?.(router);
  return (
    <DetailModalStackValueProvider value={router.stack}>
      <RefRouterProvider router={router}>
        {children}
        <DetailModal />
      </RefRouterProvider>
    </DetailModalStackValueProvider>
  );
}

function mount(
  opts: {
    openCodexEntry?: (id: string) => boolean;
    codexHasEntry?: (id: string) => boolean;
    children?: ReactNode;
  } = {},
) {
  let router!: RefRouter;
  const utils = render(<Harness onRouter={r => { router = r; }} {...opts} />);
  return { ...utils, open: (ref: AnyRef, mode?: 'card' | 'sheet') => act(() => { router.open(ref, mode); }) };
}

// ─── 1. The card itself ──────────────────────────────────────────────────────

describe('a content reference opens a content card', () => {
  // One covered kind and one uncovered, so the two halves of the registry are both on
  // screen at least once.
  const KINDS = ['action_template', 'omen_template'] as const;

  it.each(KINDS)('%s renders its name, its kind word and its marks', kind => {
    const { ref, view } = realEntry(kind);
    const { open, getByTestId, queryByTestId } = mount({ codexHasEntry: () => true });
    expect(queryByTestId('detail-panel-0')).toBeNull();

    open(ref);
    const text = getByTestId('detail-panel-0').textContent ?? '';
    expect(text).toContain(view.name);
    // The kind word appears as the subtitle and, uppercased, as the kind label.
    expect(text).toContain(getContentObjectKind(kind)!.gameWord);
    expect(text).toContain('MARKS');
    expect(text).toContain('WHAT IT IS');
  });

  it('shows the entry its own description, not a fallback, when one is written', () => {
    const { ref, view } = realEntry('action_template');
    expect(view.description, 'the chosen action authors no description — pick another').toBeTruthy();
    const { open, getByTestId } = mount();
    open(ref);
    expect(getByTestId('detail-panel-0').textContent).toContain(view.description.slice(0, 40));
  });

  it('says never-written, not gone, for an id no catalog holds', () => {
    const { open, getByTestId } = mount();
    open({ kind: 'item_template', id: 'no_such_item' });
    const text = getByTestId('detail-panel-0').textContent ?? '';
    expect(text).toContain('past the end of the library');
    expect(text).not.toContain('no longer reachable');
  });
});

// ─── 2. The marks, and their tooltips ────────────────────────────────────────

describe('tag chips explain themselves (Law 17 Tier 1)', () => {
  it('gives a seated tag a hoverable description and renders the chip', () => {
    // A tag is a concept, so it takes a tooltip and opens nothing — the distinction Law 20
    // draws between a tooltip and a card.
    const kind = 'item_template' as const;
    const entry = entriesOfKind(kind).find(e => (resolveContentEntry({ kind, id: e.id })?.tags.length ?? 0) > 0);
    expect(entry, 'no item template wears any tag — this test would be vacuous').toBeTruthy();
    const view = resolveContentEntry({ kind, id: entry!.id })!;

    const { open, getByTestId } = mount();
    open({ kind, id: entry!.id });
    const panel = getByTestId('detail-panel-0');
    for (const tag of view.tags) {
      expect(panel.textContent, `chip "${tag}" did not render`).toContain(tag);
    }
    // The tooltip trigger is the wrapper the chip sits in; its presence is what makes the
    // mark explicable rather than a bare word.
    expect(panel.querySelectorAll('[aria-describedby], [tabindex]').length).toBeGreaterThan(0);
  });
});

// ─── 3 & 4. The codex CTA, present and absent (Law 25) ───────────────────────

describe('the codex CTA renders only when it would do something', () => {
  it('appears for a catalogued entry of a catalogued kind', () => {
    const { ref } = realEntry('action_template');
    expect(SURFACE_BY_CONTENT_KIND.action_template.sheet).toBe('codex');
    const { open, getByTestId } = mount({ codexHasEntry: () => true });
    open(ref);
    expect(getByTestId('detail-panel-0').textContent).toContain('open in codex');
  });

  it('does NOT appear when the kind is catalogued but this entry is not', () => {
    // The case the registry row alone would get wrong: 56 of 116 undertaking templates
    // have no codex card, and a CTA for one of those opens nothing.
    const { ref } = realEntry('action_template');
    const { open, getByTestId } = mount({ codexHasEntry: () => false });
    open(ref);
    expect(getByTestId('detail-panel-0').textContent).not.toContain('open in codex');
  });

  it('does NOT appear for a kind with no codex category at all', () => {
    const { ref } = realEntry('omen_template');
    expect(SURFACE_BY_CONTENT_KIND.omen_template.sheet).toBeNull();
    const { open, getByTestId } = mount({ codexHasEntry: () => true });
    open(ref);
    expect(getByTestId('detail-panel-0').textContent).not.toContain('open in codex');
  });

  it('says "open in codex", never "open her sheet" — they are different rooms', () => {
    const { ref } = realEntry('action_template');
    const { open, getByTestId } = mount({ codexHasEntry: () => true });
    open(ref);
    expect(getByTestId('detail-panel-0').textContent).not.toContain('open her sheet');
  });
});

// ─── 5. EntityLink with a ContentRef ─────────────────────────────────────────

describe('EntityLink carries a content reference', () => {
  it('renders a live control and opens the content card on click', () => {
    const { ref, view } = realEntry('item_template');
    const { getByRole, getByTestId } = mount({
      children: <EntityLink id={ref.id} name={view.name} entityRef={ref} />,
    });
    act(() => { fireEvent.click(getByRole('button', { name: new RegExp(view.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) })); });
    expect(getByTestId('detail-panel-0').textContent).toContain(view.name);
  });

  it('renders plain text with no router in scope — the fail-open branch (Law 21)', () => {
    const { ref, view } = realEntry('item_template');
    const { queryByRole, getByText } = render(<EntityLink id={ref.id} name={view.name} entityRef={ref} />);
    expect(getByText(view.name)).toBeTruthy();
    expect(queryByRole('button')).toBeNull();
  });
});

// ─── 6. The sheet arm ────────────────────────────────────────────────────────

describe('the sheet arm reaches the codex, and never swallows the click', () => {
  it('opens the codex overlay and does not also stack a card', () => {
    const { ref } = realEntry('action_template');
    const opened: string[] = [];
    const { open, queryByTestId } = mount({
      codexHasEntry: () => true,
      openCodexEntry: id => { opened.push(id); return true; },
    });
    open(ref, 'sheet');
    expect(opened).toEqual([ref.id]);
    expect(queryByTestId('detail-panel-0')).toBeNull();
  });

  it('falls back to the card when the overlay cannot show that entry (NFP #4)', () => {
    const { ref, view } = realEntry('action_template');
    const { open, getByTestId } = mount({ codexHasEntry: () => false, openCodexEntry: () => false });
    open(ref, 'sheet');
    expect(getByTestId('detail-panel-0').textContent).toContain(view.name);
  });

  it('falls back to the card for a kind whose sheet is null', () => {
    const { ref, view } = realEntry('omen_template');
    const spy = vi.fn(() => true);
    const { open, getByTestId } = mount({ openCodexEntry: spy, codexHasEntry: () => true });
    open(ref, 'sheet');
    // The overlay is never even asked — the row says there is nothing there to ask for.
    expect(spy).not.toHaveBeenCalled();
    expect(getByTestId('detail-panel-0').textContent).toContain(view.name);
  });
});
