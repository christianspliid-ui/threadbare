// @vitest-environment jsdom
/**
 * A ruler's card reaches their faction (THR-1851).
 *
 * Warm playtest round 2: three of three testers set out to learn who holds power, opened
 * a ruler's card from Notables, and found its "FACTION ALLEGIANCES" line rendered as
 * plain text. `Section` draws a link only when `DetailPageOpenerProvider` supplies a
 * handler, and the provider was mounted only in a test. These cases mount the provider
 * tree the way `GameView` now does — the real `useRefRouter`, the real
 * `useDetailNodeRefOpener`, the real `DetailModal` over a real `WorldGraph` — and click
 * what a player clicks.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
import { WorldGraph } from '../../engine/graph';
import type { GraphEdge, GraphNode } from '../../types/graph';
import type { NavigationTarget } from '../../types/notification';
import type { WorldRef } from '../../types/worldRef';
import type { NodeRef } from '../../types/detailPage';
import { useRefRouter, type RefRouter } from '../useRefRouter';
import { useDetailNodeRefOpener, worldRefForNodeId } from '../useDetailNodeRefOpener';
import { RefRouterProvider } from '../../contexts/RefRouterContext';
import { DetailModalStackValueProvider } from '../../contexts/DetailModalStackContext';
import { DetailPageOpenerProvider } from '../../contexts/DetailPageOpenerContext';
import { DetailModal } from '../../components/shared/DetailModal';
import { fromGraphNode } from '../../types/worldRefAdapters';

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
  g.addNode(n({ id: 'aethel', type: 'actor', name: 'Aethel', properties: { actorType: 'individual', sphereInfluence: { order: 0.7 }, role: 'ruler' } }));
  g.addNode(n({ id: 'skyfield', type: 'actor', name: 'Hold of Witness Skyfield', properties: { actorType: 'faction', factionType: 'hold' } }));
  g.addNode(n({ id: 'market', type: 'location', name: 'The Iron Market', properties: { locationSubtype: 'town' } }));
  g.addEdge(e('m1', 'aethel', 'skyfield', 'member_of', { rank: 1, role: 'ruler', joinedTick: 0 }));
  return g;
}

function Harness({
  graph,
  openSheet,
  onRouter,
  onOpener,
}: {
  graph: WorldGraph;
  openSheet: (t: NavigationTarget) => boolean;
  onRouter: (r: RefRouter) => void;
  onOpener?: (o: (ref: NodeRef) => void) => void;
}) {
  const router = useRefRouter({ graph, tick: 6, seed: 42, protagonistId: 'protag', openSheet });
  onRouter(router);
  const opener = useDetailNodeRefOpener(router, () => graph);
  onOpener?.(opener);
  return (
    <DetailModalStackValueProvider value={router.stack}>
      <RefRouterProvider router={router}>
        <DetailPageOpenerProvider value={opener}>
          <DetailModal />
        </DetailPageOpenerProvider>
      </RefRouterProvider>
    </DetailModalStackValueProvider>
  );
}

function mount() {
  const graph = worldGraph();
  const openSheet = vi.fn((_t: NavigationTarget) => true);
  let router!: RefRouter;
  const utils = render(<Harness graph={graph} openSheet={openSheet} onRouter={r => { router = r; }} />);
  return {
    ...utils,
    openSheet,
    open: (ref: WorldRef, mode?: 'card' | 'sheet') => act(() => { router.open(ref, mode); }),
  };
}

describe("a ruler's card reaches their faction (THR-1851)", () => {
  it('the faction allegiance line is a link, and clicking it opens the faction sheet', () => {
    const { open, getByTestId, queryByTestId, openSheet } = mount();
    open({ kind: 'agent', id: 'aethel' });
    const panel = getByTestId('detail-panel-0');
    expect(panel.textContent).toContain('Hold of Witness Skyfield');

    // The line the testers saw as plain text: now a button.
    const factionLine = Array.from(panel.querySelectorAll('[role="button"], button')).find(el =>
      el.textContent?.includes('Hold of Witness Skyfield'),
    );
    expect(factionLine).toBeDefined();
    fireEvent.click(factionLine!);

    // The faction *sheet* — not a second card — and the card stack is gone, so the
    // sheet is not hidden under a card's higher z-band.
    expect(openSheet).toHaveBeenCalledWith({ kind: 'faction', factionId: 'skyfield' });
    expect(queryByTestId('detail-panel-0')).toBeNull();
  });

  it("a ruler's card offers the full sheet, and the button opens the profile drawer", () => {
    const { open, getByTestId, openSheet } = mount();
    open({ kind: 'agent', id: 'aethel' });
    const cta = getByTestId('detail-full-sheet-cta');
    expect(cta.textContent).toContain('open the full sheet');
    fireEvent.click(cta);
    expect(openSheet).toHaveBeenCalledWith({ kind: 'agent', agentId: 'aethel' });
  });

  it('a faction card offers the full sheet too', () => {
    const { open, getByTestId, openSheet } = mount();
    open({ kind: 'faction', id: 'skyfield' });
    fireEvent.click(getByTestId('detail-full-sheet-cta'));
    expect(openSheet).toHaveBeenCalledWith({ kind: 'faction', factionId: 'skyfield' });
  });
});

describe('fromGraphNode names a node the way the router speaks (THR-1851)', () => {
  const g = worldGraph();
  g.addNode(n({ id: 'dunes', type: 'actor', name: 'The Shadow-Kept Dunes', properties: { actorType: 'culture' } }));
  g.addNode(n({ id: 'host', type: 'actor', name: 'Host', properties: { actorType: 'group' } }));
  g.addNode(n({ id: 'stall', type: 'location', name: 'A Stall', properties: { parentLocationId: 'market' } }));
  g.addNode(n({ id: 'evt', type: 'event', name: 'An event' }));

  it.each([
    ['aethel', 'agent'],
    ['skyfield', 'faction'],
    ['host', 'army'],
    ['market', 'location'],
    ['stall', 'sublocation'],
  ])('%s → %s', (id, kind) => {
    expect(fromGraphNode(g.getNode(id))?.kind).toBe(kind);
  });

  it('a node with no world-ref kind names nothing, so no door is drawn to it', () => {
    expect(fromGraphNode(g.getNode('evt'))).toBeUndefined();
    // A culture has no sheet of its own (FactionSheet would say "Faction data unavailable").
    expect(fromGraphNode(g.getNode('dunes'))).toBeUndefined();
    expect(fromGraphNode(undefined)).toBeUndefined();
  });
});

describe('a culture opens the Realm over it (THR-1851)', () => {
  it('worldRefForNodeId resolves a culture to the faction minted as realm.<cultureId>', () => {
    const g = worldGraph();
    g.addNode(n({ id: 'culture_0', type: 'actor', name: 'The Witness Skyfield', properties: { actorType: 'culture' } }));
    g.addNode(n({ id: 'faction_0', type: 'actor', name: 'the hold of Witness Skyfield', properties: { actorType: 'faction', factionDefId: 'realm.culture_0' } }));
    expect(worldRefForNodeId(g, 'culture_0')).toEqual({ kind: 'faction', id: 'faction_0', name: 'the hold of Witness Skyfield' });
  });

  it('a culture with no Realm over it names nothing, and a missing id names nothing', () => {
    const g = worldGraph();
    g.addNode(n({ id: 'culture_9', type: 'actor', name: 'The Lonely', properties: { actorType: 'culture' } }));
    expect(worldRefForNodeId(g, 'culture_9')).toBeUndefined();
    expect(worldRefForNodeId(g, 'nobody')).toBeUndefined();
  });
});

describe('a link with no sheet-bearing ref still opens its card (Law 25, THR-1851)', () => {
  it('an event link opens the event card rather than nothing', () => {
    const graph = worldGraph();
    graph.addNode(n({ id: 'evt', type: 'event', name: 'A meeting in the market', properties: { eventType: 'encounter_outcome', tick: 5, locationId: 'market', participantIds: ['aethel'], summary: 'They met under the arch.' } }));
    let opener!: (ref: NodeRef) => void;
    const { getByTestId } = render(
      <Harness graph={graph} openSheet={() => true} onRouter={() => {}} onOpener={o => { opener = o; }} />,
    );
    act(() => { opener({ nodeId: 'evt', pageKind: 'event' }); });
    expect(getByTestId('detail-panel-0').textContent).toContain('A meeting in the market');
  });
});
