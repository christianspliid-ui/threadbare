/**
 * THR-1511 — where a completed undertaking's wake is offered.
 *
 * The anchor is read off the graph the completion wrote: created nodes first, then
 * the object, then the target. A route resolves to its settlement end, a Place to
 * its parent, a group to where it stands; a masterwork resolves to nothing.
 */
import { describe, expect, it } from 'vitest';
import { WorldGraph } from '../graph';
import { catalystAnchorLocationId, catalystAnchorOfNode } from '../undertakingCatalystAnchor';
import { ROUTE_IDENTITY_SUBTYPE } from '../../data/strategic-action-constants';
import type { GraphOpResult } from '../strategicGraphOps';

function worldWithSettlements(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'town-1', type: 'location', name: 'Wraithwood', properties: { locationSubtype: 'town' } });
  graph.addNode({ id: 'city-1', type: 'location', name: 'Greycity', properties: { locationSubtype: 'city' } });
  graph.addNode({ id: 'fort-1', type: 'location', name: 'Ashen Keep', properties: { locationSubtype: 'fort' } });
  graph.addNode({ id: 'fort-2', type: 'location', name: 'Hollow Watch', properties: { locationSubtype: 'fort' } });
  graph.addNode({ id: 'actor-1', type: 'actor', name: 'Ashara', properties: { actorType: 'individual' } });
  graph.addEdge({ id: 'e-actor-loc', type: 'located_at', source: 'actor-1', target: 'fort-1', properties: {} });
  return graph;
}

function routeNode(graph: WorldGraph, id: string, from: string, to: string): void {
  graph.addNode({
    id, type: 'location', name: `${from}–${to} Road`,
    properties: { locationSubtype: ROUTE_IDENTITY_SUBTYPE, routeSourceId: from, routeTargetId: to, routeEdgeId: `trades_with_${from}_${to}` },
  });
}

const created = (createdId: string): GraphOpResult => ({ success: true, op: 'create_location', createdId });

describe('catalystAnchorOfNode (THR-1511)', () => {
  it('a route anchors on the settlement it reaches — the far end first', () => {
    const graph = worldWithSettlements();
    routeNode(graph, 'road-1', 'fort-1', 'town-1');
    expect(catalystAnchorOfNode(graph, 'road-1')?.id).toBe('town-1');
  });

  it('a route whose far end is a fort anchors on its settlement near end', () => {
    const graph = worldWithSettlements();
    routeNode(graph, 'road-2', 'city-1', 'fort-1');
    expect(catalystAnchorOfNode(graph, 'road-2')?.id).toBe('city-1');
  });

  it('a route between two forts still anchors on its far end rather than nowhere', () => {
    const graph = worldWithSettlements();
    routeNode(graph, 'road-3', 'fort-1', 'fort-2');
    expect(catalystAnchorOfNode(graph, 'road-3')?.id).toBe('fort-2');
  });

  it('a Place anchors on the Location that contains it', () => {
    const graph = worldWithSettlements();
    graph.addNode({ id: 'town-1_sub_market', type: 'location', name: 'Market district', properties: { parentLocationId: 'town-1' } });
    expect(catalystAnchorOfNode(graph, 'town-1_sub_market')?.id).toBe('town-1');
  });

  it('a settlement anchors on itself', () => {
    const graph = worldWithSettlements();
    expect(catalystAnchorOfNode(graph, 'city-1')?.id).toBe('city-1');
  });

  it('an army anchors where it stands, resolved to the Location tier', () => {
    const graph = worldWithSettlements();
    graph.addNode({ id: 'town-1_sub_barracks', type: 'location', name: 'Barracks', properties: { parentLocationId: 'town-1' } });
    graph.addNode({ id: 'army-1', type: 'actor', name: 'The Ashen Host', properties: { actorType: 'group', groupKind: 'army' } });
    graph.addEdge({ id: 'e-army-loc', type: 'located_at', source: 'army-1', target: 'town-1_sub_barracks', properties: {} });
    expect(catalystAnchorOfNode(graph, 'army-1')?.id).toBe('town-1');
  });

  it('a masterwork, a faction and a missing node anchor nowhere', () => {
    const graph = worldWithSettlements();
    graph.addNode({ id: 'artifact-1', type: 'artifact', name: 'A blade', properties: {} });
    graph.addNode({ id: 'faction-1', type: 'actor', name: 'The Consortium', properties: { actorType: 'faction' } });
    expect(catalystAnchorOfNode(graph, 'artifact-1')).toBeUndefined();
    expect(catalystAnchorOfNode(graph, 'faction-1')).toBeUndefined();
    expect(catalystAnchorOfNode(graph, 'no-such-node')).toBeUndefined();
  });
});

describe('catalystAnchorLocationId (THR-1511)', () => {
  it('a route laid from a fort is anchored on the town it reaches — the seed-99 repro', () => {
    const graph = worldWithSettlements();
    routeNode(graph, 'road-1', 'fort-1', 'town-1');
    const anchor = catalystAnchorLocationId(
      graph,
      { objectHandle: { kind: 'node', nodeId: 'town-1' }, targetNodeId: 'town-1' },
      [{ success: true, op: 'create_trade_route', createdId: 'trades_with_fort-1_town-1' }, created('road-1')],
    );
    expect(anchor).toBe('town-1');
  });

  it('a created node outranks the object handle, and the handle outranks the target', () => {
    const graph = worldWithSettlements();
    expect(catalystAnchorLocationId(
      graph, { objectHandle: { kind: 'node', nodeId: 'city-1' }, targetNodeId: 'fort-1' }, [created('town-1')],
    )).toBe('town-1');
    expect(catalystAnchorLocationId(
      graph, { objectHandle: { kind: 'node', nodeId: 'city-1' }, targetNodeId: 'fort-1' }, [],
    )).toBe('city-1');
    expect(catalystAnchorLocationId(graph, { targetNodeId: 'fort-1' }, [])).toBe('fort-1');
  });

  it('a failed op and an op that created nothing standing are skipped, not trusted', () => {
    const graph = worldWithSettlements();
    graph.addNode({ id: 'artifact-1', type: 'artifact', name: 'A blade', properties: {} });
    expect(catalystAnchorLocationId(
      graph, { targetNodeId: 'city-1' },
      [{ success: false, op: 'create_location', createdId: 'town-1' }, created('artifact-1')],
    )).toBe('city-1');
  });

  it('a work that made nothing that stands anywhere anchors nowhere, so the seed judges at the feet', () => {
    const graph = worldWithSettlements();
    graph.addNode({ id: 'artifact-1', type: 'artifact', name: 'A blade', properties: {} });
    expect(catalystAnchorLocationId(graph, {}, [created('artifact-1')])).toBeUndefined();
  });
});
