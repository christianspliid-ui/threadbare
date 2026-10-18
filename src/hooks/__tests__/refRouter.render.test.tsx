// @vitest-environment jsdom
/**
 * The ref router, rendered (THR-1490).
 *
 * **This file is the browser-verify evidence for slice 1**, under the sanctioned
 * substitution for an unattended run in which `preview_start` is refused
 * (`Docs/canon/verification-gates.md` § Browser-verify): *jsdom render assertions on the
 * real component, asserting the rendered DOM for every face the change produces, plus
 * absence where the element should not render.* Recorded in the commit body as
 * `Browser-verify substitution: jsdom-render — unattended run, no startable dev server`.
 *
 * So the shape below is deliberate. It is not a unit test of `open()`: every case renders
 * the **real** `HoverCard` / `EntityLink` through the **real** router over a **real**
 * `WorldGraph`, and asserts what a player would see. THR-1912 retired the `DetailModal`
 * stack: a card or a sheet now opens the Inspector, so those cases assert the Inspector
 * was asked, and the generated page is read through the hover card, the one floating
 * surface left that draws it.
 *
 * What it deliberately does **not** claim: nothing here is evidence about paint, z-order,
 * overflow or the 1920×1080 contract — the three things the gate exists for and the three
 * jsdom cannot see. The viewport-contract half is argued in the commit body from the code
 * (both surfaces portal to `document.body` and take their z from the stacking table) and
 * is owed a real capture the next time an attended session touches this surface.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { WorldGraph } from '../../engine/graph';
import type { GraphEdge, GraphNode } from '../../types/graph';
import type { NavigationTarget } from '../../types/notification';
import type { WorldRef } from '../../types/worldRef';
import type { AnyRef } from '../../types/contentRef';
import { useRefRouter, type RefRouter } from '../useRefRouter';
import { RefRouterProvider } from '../../contexts/RefRouterContext';
import { HoverCard } from '../../components/shared/HoverCard';
import { EntityLink } from '../../components/shared/EntityLink';
import { HOVER_CARD_DELAY_MS } from '../../types/detailPage';
import { SURFACE_BY_WORLD_REF } from '../../data/surface-registry';

// ─── A world with one of everything the registry routes to ───────────────────

function n(p: Partial<GraphNode> & Pick<GraphNode, 'id' | 'type' | 'name'>): GraphNode {
  return { properties: {}, ...p };
}
function e(
  id: string,
  source: string,
  target: string,
  type: GraphEdge['type'],
  properties: Record<string, unknown> = {},
): GraphEdge {
  return { id, source, target, type, properties };
}

function worldGraph(): WorldGraph {
  const g = new WorldGraph();
  g.addNode(n({ id: 'protag', type: 'actor', name: 'Avatar of Witness', properties: { actorType: 'individual', isPortfolioPinned: true } }));
  g.addNode(n({ id: 'veiren', type: 'actor', name: 'Captain Veiren', properties: { actorType: 'individual', sphereInfluence: { spirit: 0.7 }, role: 'captain of the watch' } }));
  g.addNode(n({ id: 'guard', type: 'actor', name: 'The Iron Guard', properties: { actorType: 'faction', factionType: 'martial order' } }));
  g.addNode(n({ id: 'market', type: 'location', name: 'The Iron Market', properties: { sphereInfluence: { matter: 0.6 }, locationSubtype: 'town' } }));
  g.addNode(n({ id: 'token', type: 'artifact', name: 'Veirens Token', properties: { category: 'token' } }));
  g.addNode(n({ id: 'evt', type: 'event', name: 'A meeting in the market', properties: { eventType: 'encounter_outcome', tick: 5, locationId: 'market', participantIds: ['protag', 'veiren'], summary: 'You met under the iron arch.' } }));
  // The group kind's subject: an army is an `actor` told apart by `actorType: 'group'`.
  g.addNode(n({
    id: 'host', type: 'actor', name: 'The Iron Covenant — Host',
    properties: {
      actorType: 'group', groupKind: 'army',
      armyState: { size: 'host', headcount: 10000, cohesion: 90, cohesionMax: 100, supplyTier: 'supplied', objective: { type: 'conquer', targetId: 'market' }, raisedTick: 1, maintenanceCost: 5, thresholdsFired: [] },
    },
  }));
  g.addEdge(e('c1', 'host', 'veiren', 'commanded_by'));
  // `member_of` requires these three; a fixture that omits them warns on every render and
  // is a small version of inventing the shape the code is being tested against.
  g.addEdge(e('c2', 'host', 'guard', 'member_of', { rank: 'host', role: 'levy', joinedTick: 1 }));
  return g;
}

/**
 * Mounts the router exactly as `GameView` does — its own state, published through the
 * provider, with `HoverCard` beneath. `onRouter` hands the live router back so a case can
 * drive it the way a click would; `openInspector` is the spy every card and sheet reaches.
 */
function Harness({
  onRouter,
  openSheet = () => true,
  openInspector,
  children,
}: {
  onRouter?: (r: RefRouter) => void;
  openSheet?: (t: NavigationTarget) => boolean;
  openInspector: (ref: AnyRef, size: 'docked' | 'wide') => void;
  children?: ReactNode;
}) {
  const router = useRefRouter({ graph: worldGraph(), tick: 6, seed: 42, protagonistId: 'protag', openSheet, openInspector });
  onRouter?.(router);
  return (
    <RefRouterProvider router={router}>
      {children}
      {router.hoverCard && <HoverCard page={router.hoverCard.page} anchorEl={router.hoverCard.anchorEl} />}
    </RefRouterProvider>
  );
}

/** Render the harness and return a handle on the live router. */
function mount(opts: { openSheet?: (t: NavigationTarget) => boolean; children?: ReactNode } = {}) {
  let router!: RefRouter;
  const openInspector = vi.fn();
  const utils = render(<Harness onRouter={r => { router = r; }} openSheet={opts.openSheet} openInspector={openInspector} children={opts.children} />);
  const anchor = document.createElement('span');
  document.body.appendChild(anchor);
  return {
    ...utils,
    openInspector,
    open: (ref: WorldRef, mode?: 'card' | 'sheet') => act(() => { router.open(ref, mode); }),
    hover: (ref: WorldRef) => act(() => { router.open(ref, 'hover', { anchorEl: anchor }); }),
  };
}

// ─── Every card kind the registry can produce ────────────────────────────────

describe('the card renders for every card kind (Law 21 — every kind opens)', () => {
  const CASES: Array<{ ref: WorldRef; card: string; name: string }> = [
    { ref: { kind: 'agent', id: 'veiren' }, card: 'actor', name: 'Captain Veiren' },
    { ref: { kind: 'faction', id: 'guard' }, card: 'faction', name: 'The Iron Guard' },
    { ref: { kind: 'location', id: 'market' }, card: 'place', name: 'The Iron Market' },
    { ref: { kind: 'artifact', id: 'token' }, card: 'item', name: 'Veirens Token' },
    { ref: { kind: 'encounter', id: 'evt' }, card: 'event', name: 'A meeting in the market' },
    { ref: { kind: 'army', id: 'host' }, card: 'group', name: 'The Iron Covenant — Host' },
  ];

  it.each(CASES)('$ref.kind draws a $card card showing "$name"', ({ ref, card, name }) => {
    // The registry's claim, and then the rendered proof of it — asserting only the
    // registry would be a test of a table against itself.
    expect(SURFACE_BY_WORLD_REF[ref.kind].card).toBe(card);

    const { hover, getByTestId, queryByTestId } = mount();
    expect(queryByTestId('hover-card')).toBeNull();

    hover(ref);
    expect(getByTestId('hover-card').textContent).toContain(name);
  });

  it('the group card reads in words, never in magnitudes (Law 13)', () => {
    // `ArmyState` carries headcount 10000 and cohesion 90 and neither may reach the surface.
    const { hover, getByTestId } = mount();
    hover({ kind: 'army', id: 'host' });
    const text = getByTestId('hover-card').textContent ?? '';
    expect(text).toContain('The Iron Covenant — Host');
    expect(text).not.toMatch(/10000|90/);
  });
});

// ─── The fail-soft paths (NFP #4, Law 25) ────────────────────────────────────

describe('no click is ever swallowed', () => {
  it('an id that resolves to nothing draws the stub, not nothing', () => {
    const { hover, getByTestId } = mount();
    hover({ kind: 'agent', id: 'nobody-at-all' });
    expect(getByTestId('hover-card').textContent).toContain('Unknown');
  });

  it('a card opens the Inspector at its row size', () => {
    const { open, openInspector } = mount();
    open({ kind: 'agent', id: 'veiren' });
    expect(openInspector).toHaveBeenCalledWith({ kind: 'agent', id: 'veiren' }, 'docked');
  });

  it('a sheet ask opens the Inspector wide, and a live encounter its Stage', () => {
    const seen: NavigationTarget[] = [];
    const { open, openInspector } = mount({ openSheet: t => { seen.push(t); return true; } });
    open({ kind: 'agent', id: 'veiren' }, 'sheet');
    expect(openInspector).toHaveBeenCalledWith({ kind: 'agent', id: 'veiren' }, 'wide');
    expect(seen).toEqual([]);
    open({ kind: 'encounter', id: 'evt' }, 'sheet');
    expect(seen).toHaveLength(1);
  });
});

// ─── EntityLink and the hover card ───────────────────────────────────────────

describe('EntityLink routes itself', () => {
  it('renders a control and opens the Inspector on click', () => {
    const { getByRole, openInspector } = mount({
      children: <EntityLink id="veiren" name="Captain Veiren" entityRef={{ kind: 'agent', id: 'veiren' }} />,
    });
    act(() => { fireEvent.click(getByRole('button', { name: /Captain Veiren/ })); });
    expect(openInspector).toHaveBeenCalledWith({ kind: 'agent', id: 'veiren' }, 'docked');
  });

  it('opens a hover card after the dwell, and closes it on leave', async () => {
    vi.useFakeTimers();
    try {
      const { getByRole, queryByTestId, getByTestId } = mount({
        children: <EntityLink id="veiren" name="Captain Veiren" entityRef={{ kind: 'agent', id: 'veiren' }} />,
      });
      const link = getByRole('button', { name: /Captain Veiren/ });

      act(() => { fireEvent.mouseEnter(link); });
      // Below the dwell there is nothing — that is what makes it a dwell and not a flicker.
      act(() => { vi.advanceTimersByTime(HOVER_CARD_DELAY_MS - 50); });
      expect(queryByTestId('hover-card')).toBeNull();

      act(() => { vi.advanceTimersByTime(100); });
      expect(getByTestId('hover-card').textContent).toContain('Captain Veiren');

      act(() => { fireEvent.mouseLeave(link); });
      expect(queryByTestId('hover-card')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('renders plain text — no control — with no ref and no handler (Law 25)', () => {
    const { queryByRole, getByText } = render(<EntityLink id="veiren" name="Captain Veiren" />);
    expect(queryByRole('button')).toBeNull();
    expect(getByText('Captain Veiren')).toBeTruthy();
  });

  it('renders plain text with a ref but no router in scope — the styleguide case', () => {
    const { queryByRole } = render(
      <EntityLink id="veiren" name="Captain Veiren" entityRef={{ kind: 'agent', id: 'veiren' }} />,
    );
    expect(queryByRole('button')).toBeNull();
  });
});
