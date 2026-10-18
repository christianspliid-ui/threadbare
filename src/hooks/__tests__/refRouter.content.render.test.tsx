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
 * So nothing here mocks the card: every case runs the **real** router over the **real
 * shipped catalogs**. THR-1912 retired the `DetailModal` stack, and with it the card's
 * codex CTA footer; a content card now opens in the Inspector (whose own tests cover its
 * page), so these cases assert the routing and read the generated card through the hover
 * card, the one floating surface left that draws it.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { WorldGraph } from '../../engine/graph';
import type { NavigationTarget } from '../../types/notification';
import type { AnyRef, ContentRef } from '../../types/contentRef';
import { useRefRouter, type RefRouter } from '../useRefRouter';
import { RefRouterProvider } from '../../contexts/RefRouterContext';
import { HoverCard } from '../../components/shared/HoverCard';
import { EntityLink } from '../../components/shared/EntityLink';
import { SURFACE_BY_CONTENT_KIND } from '../../data/surface-registry';
import { entriesOfKind } from '../../data/contentCatalogs';
import { resolveContentEntry } from '../../engine/contentEntryResolver';

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
  openInspector,
  children,
}: {
  onRouter?: (r: RefRouter) => void;
  openCodexEntry?: (id: string) => boolean;
  codexHasEntry?: (id: string) => boolean;
  openInspector: (ref: AnyRef, size: 'docked' | 'wide') => void;
  children?: ReactNode;
}) {
  const router = useRefRouter({
    graph: new WorldGraph(),
    tick: 6,
    seed: 42,
    openSheet: (_t: NavigationTarget) => true,
    openCodexEntry,
    codexHasEntry,
    openInspector,
  });
  onRouter?.(router);
  return (
    <RefRouterProvider router={router}>
      {children}
      {router.hoverCard && <HoverCard page={router.hoverCard.page} anchorEl={router.hoverCard.anchorEl} />}
    </RefRouterProvider>
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
  const openInspector = vi.fn();
  const utils = render(<Harness onRouter={r => { router = r; }} openInspector={openInspector} {...opts} />);
  const anchor = document.createElement('span');
  document.body.appendChild(anchor);
  return {
    ...utils,
    openInspector,
    open: (ref: AnyRef, mode?: 'card' | 'sheet') => act(() => { router.open(ref, mode); }),
    hover: (ref: AnyRef) => act(() => { router.open(ref, 'hover', { anchorEl: anchor }); }),
  };
}

// ─── 1. The card itself ──────────────────────────────────────────────────────

describe('a content reference draws a content card', () => {
  // One covered kind and one uncovered, so the two halves of the registry are both on
  // screen at least once.
  const KINDS = ['action_template', 'omen_template'] as const;

  it.each(KINDS)('%s draws its name', kind => {
    const { ref, view } = realEntry(kind);
    const { hover, getByTestId, queryByTestId } = mount({ codexHasEntry: () => true });
    expect(queryByTestId('hover-card')).toBeNull();

    hover(ref);
    expect(getByTestId('hover-card').textContent ?? '').toContain(view.name);
  });

  it('says never-written, not gone, for an id no catalog holds', () => {
    const { hover, getByTestId } = mount();
    hover({ kind: 'item_template', id: 'no_such_item' });
    const text = getByTestId('hover-card').textContent ?? '';
    expect(text).not.toContain('no longer reachable');
  });

  it('a content card opens the Inspector docked', () => {
    const { ref } = realEntry('action_template');
    const { open, openInspector } = mount();
    open(ref);
    expect(openInspector).toHaveBeenCalledWith(ref, 'docked');
  });
});

// ─── 2. EntityLink with a ContentRef ─────────────────────────────────────────

describe('EntityLink carries a content reference', () => {
  it('renders a live control and opens the content card on click', () => {
    const { ref, view } = realEntry('item_template');
    const { getByRole, openInspector } = mount({
      children: <EntityLink id={ref.id} name={view.name} entityRef={ref} />,
    });
    act(() => { fireEvent.click(getByRole('button', { name: new RegExp(view.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) })); });
    expect(openInspector).toHaveBeenCalledWith(ref, 'docked');
  });

  it('renders plain text with no router in scope — the fail-open branch (Law 21)', () => {
    const { ref, view } = realEntry('item_template');
    const { queryByRole, getByText } = render(<EntityLink id={ref.id} name={view.name} entityRef={ref} />);
    expect(getByText(view.name)).toBeTruthy();
    expect(queryByRole('button')).toBeNull();
  });
});

// ─── 3. The sheet arm ────────────────────────────────────────────────────────

describe('the sheet arm reaches the codex, and never swallows the click', () => {
  it('opens the codex overlay and does not also open a card', () => {
    const { ref } = realEntry('action_template');
    expect(SURFACE_BY_CONTENT_KIND.action_template.sheet).toBe('codex');
    const opened: string[] = [];
    const { open, openInspector } = mount({
      codexHasEntry: () => true,
      openCodexEntry: id => { opened.push(id); return true; },
    });
    open(ref, 'sheet');
    expect(opened).toEqual([ref.id]);
    expect(openInspector).not.toHaveBeenCalled();
  });

  it('falls back to the card when the overlay cannot show that entry (NFP #4)', () => {
    const { ref } = realEntry('action_template');
    const { open, openInspector } = mount({ codexHasEntry: () => false, openCodexEntry: () => false });
    open(ref, 'sheet');
    expect(openInspector).toHaveBeenCalledWith(ref, 'docked');
  });

  it('falls back to the card for a kind whose sheet is null', () => {
    const { ref } = realEntry('omen_template');
    expect(SURFACE_BY_CONTENT_KIND.omen_template.sheet).toBeNull();
    const spy = vi.fn(() => true);
    const { open, openInspector } = mount({ openCodexEntry: spy, codexHasEntry: () => true });
    open(ref, 'sheet');
    // The overlay is never even asked — the row says there is nothing there to ask for.
    expect(spy).not.toHaveBeenCalled();
    expect(openInspector).toHaveBeenCalledWith(ref, 'docked');
  });
});
