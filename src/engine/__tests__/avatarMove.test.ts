import { describe, it, expect } from 'vitest';
import { moveAvatarToHex } from '../avatarMove';
import { WorldGraph } from '../graph';
import { getAvatarHexPosition } from '../visibility';

describe('moveAvatarToHex', () => {
  function buildGraph() {
    const graph = new WorldGraph();
    graph.addNode({ id: 'asc.1', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
    graph.addNode({ id: 'avatar.1', type: 'actor', name: 'Avatar', properties: { actorType: 'individual' } });
    graph.addNode({ id: 'loc.start', type: 'location', name: 'Start', properties: { hexCol: 5, hexRow: 7, locationType: 'settlement' } });
    graph.addEdge({ id: 'e.avatar_of', source: 'avatar.1', target: 'asc.1', type: 'avatar_of', properties: {} });
    graph.addEdge({ id: 'e.located_at', source: 'avatar.1', target: 'loc.start', type: 'located_at', properties: {} });
    return graph;
  }

  it('moves avatar to a hex with an existing location', () => {
    const graph = buildGraph();
    graph.addNode({ id: 'loc.dest', type: 'location', name: 'Dest', properties: { hexCol: 10, hexRow: 3, locationType: 'settlement' } });

    moveAvatarToHex(graph, 'asc.1', { col: 10, row: 3 });
    const pos = getAvatarHexPosition(graph, 'asc.1');
    expect(pos).toEqual({ col: 10, row: 3 });
  });

  it('creates a transient location if no location exists at target hex', () => {
    const graph = buildGraph();
    moveAvatarToHex(graph, 'asc.1', { col: 12, row: 8 });
    const pos = getAvatarHexPosition(graph, 'asc.1');
    expect(pos).toEqual({ col: 12, row: 8 });
  });

  it('removes old located_at edge', () => {
    const graph = buildGraph();
    graph.addNode({ id: 'loc.dest', type: 'location', name: 'Dest', properties: { hexCol: 10, hexRow: 3, locationType: 'settlement' } });
    moveAvatarToHex(graph, 'asc.1', { col: 10, row: 3 });

    const oldEdges = graph.getOutgoingEdges('avatar.1', 'located_at')
      .filter(e => e.target === 'loc.start');
    expect(oldEdges.length).toBe(0);
  });
});
