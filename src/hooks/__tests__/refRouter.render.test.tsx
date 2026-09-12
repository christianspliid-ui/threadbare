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
 * the **real** `DetailModal` / `HoverCard` / `EntityLink` through the **real** router over
 * a **real** `WorldGraph`, and asserts what a player would see. The six card kinds, the
 * three fail-soft paths, the TTS button, the hover card and the two Law-25 absences are
 * each a face the change produces, and each is checked here because no screenshot could
 * be taken of it this run.
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
import { useRefRouter, type RefRouter } from '../useRefRouter';
import { RefRouterProvider } from '../../contexts/RefRouterContext';
import { DetailModalStackValueProvider } from '../../contexts/DetailModalStackContext';
import { DetailModal } from '../../components/shared/DetailModal';
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
 * Mounts the router exactly as `GameView` does — its own state, published through both
 * providers, with `DetailModal` and `HoverCard` beneath. `onRouter` hands the live router
 * back so a case can drive it the way a click would.
 */
function Harness({
  onRouter,
  openSheet = () => true,
  children,
}: {
  onRouter?: (r: RefRouter) => void;
  openSheet?: (t: NavigationTarget) => boolean;
  children?: ReactNode;
}) {
  const router = useRefRouter({ graph: worldGraph(), tick: 6, seed: 42, protagonistId: 'protag', openSheet });
  onRouter?.(router);
  return (
    <DetailModalStackValueProvider value={router.stack}>
      <RefRouterProvider router={router}>
        {children}
        <DetailModal />
        {router.hoverCard && <HoverCard page={router.hoverCard.page} anchorEl={router.hoverCard.anchorEl} />}
      </RefRouterProvider>
    </DetailModalStackValueProvider>
  );
}

/** Render the harness and return a handle on the live router. */
function mount(opts: { openSheet?: (t: NavigationTarget) => boolean; children?: ReactNode } = {}) {
  let router!: RefRouter;
  const utils = render(<Harness onRouter={r => { router = r; }} openSheet={opts.openSheet} children={opts.children} />);
  return { ...utils, open: (ref: WorldRef, mode?: 'card' | 'sheet') => act(() => { router.open(ref, mode); }) };
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

  it.each(CASES)('$ref.kind opens a $card card showing "$name"', ({ ref, card, name }) => {
    // The registry's claim, and then the rendered proof of it — asserting only the
    // registry would be a test of a table against itself.
    expect(SURFACE_BY_WORLD_REF[ref.kind].card).toBe(card);

    const { open, getByTestId, queryByTestId } = mount();
    expect(queryByTestId('detail-panel-0')).toBeNull();

    open(ref);
    const panel = getByTestId('detail-panel-0');
    expect(panel.textContent).toContain(name);
  });

  it('the group card says who leads them and what they are doing, in words', () => {
    // Law 13/14: `ArmyState` carries headcount 10000 and cohesion 90 and neither may
    // reach the surface. The card reads the same word table `ArmySheet` does.
    const { open, getByTestId } = mount();
    open({ kind: 'army', id: 'host' });
    const text = getByTestId('detail-panel-0').textContent ?? '';
    expect(text).toContain('Captain Veiren');      // commander chip
    expect(text).toContain('The Iron Guard');      // the banner that raised them
    expect(text).toContain('The Iron Market');     // the objective, as a sentence
    expect(text).not.toMatch(/10000|\b90\b/);      // no raw magnitudes (Law 13)
  });
});

// ─── The three fail-soft paths (NFP #4, Law 25) ──────────────────────────────

describe('no click is ever swallowed', () => {
  it('an id that resolves to nothing opens the stub, not nothing', () => {
    const { open, getByTestId } = mount();
    open({ kind: 'agent', id: 'nobody-at-all' });
    expect(getByTestId('detail-panel-0').textContent).toContain('Unknown');
  });

  it('a sheet ask on a sheet:null kind opens the card instead', () => {
    // companion — withheld by THR-1096. The old behaviour was `undefined` and a dead
    // click; the new behaviour is its card.
    expect(SURFACE_BY_WORLD_REF.companion.sheet).toBeNull();
    const { open, getByTestId } = mount();
    open({ kind: 'companion', id: 'veiren' }, 'sheet');
    expect(getByTestId('detail-panel-0')).toBeTruthy();
  });

  it('a sheet ask this host has no opener for falls back to the card', () => {
    const { open, getByTestId } = mount({ openSheet: () => false });
    open({ kind: 'agent', id: 'veiren' }, 'sheet');
    expect(getByTestId('detail-panel-0').textContent).toContain('Captain Veiren');
  });

  it('a sheet ask this host CAN open does not also stack a card', () => {
    const seen: NavigationTarget[] = [];
    const { open, queryByTestId } = mount({ openSheet: t => { seen.push(t); return true; } });
    open({ kind: 'agent', id: 'veiren' }, 'sheet');
    expect(seen).toEqual([{ kind: 'agent', agentId: 'veiren' }]);
    expect(queryByTestId('detail-panel-0')).toBeNull();
  });
});

// ─── The card's own furniture ────────────────────────────────────────────────

describe('the card body (THR-966 closed as mount)', () => {
  // Swept across every card kind rather than sampled on one, because the first
  // implementation filtered on `kind === 'prose'` and that put no button on the *actor*
  // card — an actor page leads with a `portrait` section whose paragraph is `bodyProse`.
  // Checking one kind is how that shipped; checking all six is how it did not.
  it.each(['agent', 'faction', 'location', 'artifact', 'encounter', 'army'] as const)(
    'carries the narration button on the %s card',
    kind => {
      const ids: Record<string, string> = {
        agent: 'veiren', faction: 'guard', location: 'market',
        artifact: 'token', encounter: 'evt', army: 'host',
      };
      const { open, getByTestId } = mount();
      open({ kind, id: ids[kind] });
      expect(getByTestId('prose-tts-button')).toBeTruthy();
    },
  );

  it('stacks, and the breadcrumb orients the depth (Law 24)', () => {
    const { open, getByTestId } = mount();
    open({ kind: 'agent', id: 'veiren' });
    open({ kind: 'faction', id: 'guard' });
    expect(getByTestId('detail-panel-1').textContent).toContain('The Iron Guard');
    // The trail names where you came from, not only where you are. (The breadcrumb
    // renders ALLCAPS — asserting the display form, not the node name.)
    expect(getByTestId('detail-panel-1').textContent).toContain('CAPTAIN VEIREN');
  });

  it('Escape closes the topmost card, not the whole stack (Law 23)', () => {
    const { open, getByTestId, queryByTestId } = mount();
    open({ kind: 'agent', id: 'veiren' });
    open({ kind: 'faction', id: 'guard' });
    act(() => { fireEvent.keyDown(document, { key: 'Escape' }); });
    expect(queryByTestId('detail-panel-1')).toBeNull();
    expect(getByTestId('detail-panel-0').textContent).toContain('Captain Veiren');
  });
});

// ─── EntityLink and the hover card ───────────────────────────────────────────

describe('EntityLink routes itself', () => {
  it('renders a control and opens the card on click', () => {
    const { getByRole, getByTestId } = mount({
      children: <EntityLink id="veiren" name="Captain Veiren" entityRef={{ kind: 'agent', id: 'veiren' }} />,
    });
    act(() => { fireEvent.click(getByRole('button', { name: /Captain Veiren/ })); });
    expect(getByTestId('detail-panel-0').textContent).toContain('Captain Veiren');
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

describe('the hover card never competes with a card', () => {
  it('is refused while a card is open — two floating answers to one question', () => {
    vi.useFakeTimers();
    try {
      const { open, getByRole, queryByTestId } = mount({
        children: <EntityLink id="guard" name="The Iron Guard" entityRef={{ kind: 'faction', id: 'guard' }} />,
      });
      open({ kind: 'agent', id: 'veiren' });
      act(() => { fireEvent.mouseEnter(getByRole('button', { name: /The Iron Guard/ })); });
      act(() => { vi.advanceTimersByTime(HOVER_CARD_DELAY_MS + 50); });
      expect(queryByTestId('hover-card')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
