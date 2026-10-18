// @vitest-environment jsdom
/**
 * A ruler's card reaches their faction (THR-1851).
 *
 * Warm playtest round 2: three of three testers set out to learn who holds power, opened
 * a ruler's card from Notables, and found its "FACTION ALLEGIANCES" line rendered as
 * plain text. `Section` draws a link only when `DetailPageOpenerProvider` supplies a
 * handler, and the provider was mounted only in a test. These cases mount the provider
 * tree the way `GameView` does — the real `useRefRouter` and the real
 * `useDetailNodeRefOpener` over a real `WorldGraph` — and follow a link the way a page's
 * line does. Since THR-1912 every card and sheet is the Inspector, so the cases assert
 * what the Inspector was asked to open.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import { WorldGraph } from '../../engine/graph';
import type { GraphEdge, GraphNode } from '../../types/graph';
import type { NavigationTarget } from '../../types/notification';
import type { AnyRef } from '../../types/contentRef';
import type { NodeRef } from '../../types/detailPage';
import { useRefRouter, type RefRouter } from '../useRefRouter';
import { useDetailNodeRefOpener, worldRefForNodeId } from '../useDetailNodeRefOpener';
import { RefRouterProvider } from '../../contexts/RefRouterContext';
import { DetailPageOpenerProvider } from '../../contexts/DetailPageOpenerContext';
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
  openInspector,
  onOpener,
}: {
  graph: WorldGraph;
  openSheet: (t: NavigationTarget) => boolean;
  openInspector: (ref: AnyRef, size: 'docked' | 'wide') => void;
  onOpener?: (o: (ref: NodeRef) => void) => void;
}) {
  const router = useRefRouter({ graph, tick: 6, seed: 42, protagonistId: 'protag', openSheet, openInspector });
  const opener = useDetailNodeRefOpener(router, () => graph);
  onOpener?.(opener);
  return (
    <RefRouterProvider router={router}>
      <DetailPageOpenerProvider value={opener}>{null}</DetailPageOpenerProvider>
    </RefRouterProvider>
  );
}

function mount(graph: WorldGraph = worldGraph()) {
  const openSheet = vi.fn((_t: NavigationTarget) => true);
  const openInspector = vi.fn();
  let opener!: (ref: NodeRef) => void;
  render(<Harness graph={graph} openSheet={openSheet} openInspector={openInspector} onOpener={o => { opener = o; }} />);
  return { openSheet, openInspector, follow: (ref: NodeRef) => act(() => { opener(ref); }) };
}

describe("a ruler's card reaches their faction (THR-1851)", () => {
  it('the faction allegiance link opens the faction page wide, not a second card', () => {
    const { follow, openInspector, openSheet } = mount();
    follow({ nodeId: 'skyfield', pageKind: 'faction' });
    expect(openInspector).toHaveBeenCalledWith(expect.objectContaining({ kind: 'faction', id: 'skyfield' }), 'wide');
    expect(openSheet).not.toHaveBeenCalled();
  });

  it("a person link opens that person's page at its row size", () => {
    const { follow, openInspector } = mount();
    follow({ nodeId: 'aethel', pageKind: 'actor' });
    expect(openInspector).toHaveBeenCalledWith(expect.objectContaining({ kind: 'agent', id: 'aethel' }), 'docked');
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
  it('an event link opens the event page rather than nothing', () => {
    const graph = worldGraph();
    graph.addNode(n({ id: 'evt', type: 'event', name: 'A meeting in the market', properties: { eventType: 'encounter_outcome', tick: 5, locationId: 'market', participantIds: ['aethel'], summary: 'They met under the arch.' } }));
    const { follow, openInspector } = mount(graph);
    follow({ nodeId: 'evt', pageKind: 'event' });
    expect(openInspector).toHaveBeenCalledTimes(1);
    expect(openInspector.mock.calls[0]![0]).toMatchObject({ kind: 'encounter', id: 'evt' });
  });
});
