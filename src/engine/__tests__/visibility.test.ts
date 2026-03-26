import { describe, it, expect } from 'vitest';
import {
  collectLOSSources,
  recalcVisibility,
  getAvatarHexPosition,
} from '../visibility';
import { WorldGraph } from '../graph';
import type { VisibilityMap } from '../../types/visibility';
import { visKey, AVATAR_SIGHT_RANGE, AGENT_SIGHT_RANGE } from '../../types/visibility';

// Helper: build a minimal graph with ascendant + avatar at a hex
function buildTestGraph(avatarHexCol: number, avatarHexRow: number): {
  graph: WorldGraph;
  ascendantId: string;
} {
  const graph = new WorldGraph();
  const ascendantId = 'asc.1';
  const avatarId = 'avatar.1';
  const locId = 'loc.start';

  graph.addNode({ id: ascendantId, type: 'actor', name: 'TestGod', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: avatarId, type: 'actor', name: 'TestAvatar', properties: { actorType: 'individual' } });
  graph.addNode({
    id: locId, type: 'location', name: 'Start',
    properties: { hexCol: avatarHexCol, hexRow: avatarHexRow, locationType: 'settlement' },
  });
  graph.addEdge({ id: 'e.avatar_of', source: avatarId, target: ascendantId, type: 'avatar_of', properties: {} });
  graph.addEdge({ id: 'e.located_at', source: avatarId, target: locId, type: 'located_at', properties: {} });

  return { graph, ascendantId };
}

describe('getAvatarHexPosition', () => {
  it('returns avatar hex coords from graph', () => {
    const { graph, ascendantId } = buildTestGraph(5, 7);
    const pos = getAvatarHexPosition(graph, ascendantId);
    expect(pos).toEqual({ col: 5, row: 7 });
  });

  it('returns null if no avatar', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'asc.1', type: 'actor', name: 'God', properties: {} });
    expect(getAvatarHexPosition(graph, 'asc.1')).toBeNull();
  });
});

describe('collectLOSSources', () => {
  it('includes avatar as LOS source with AVATAR_SIGHT_RANGE', () => {
    const { graph, ascendantId } = buildTestGraph(5, 7);
    const sources = collectLOSSources(graph, ascendantId, []);
    expect(sources).toContainEqual({ hexCol: 5, hexRow: 7, range: AVATAR_SIGHT_RANGE });
  });

  it('includes retinue agents as LOS sources with AGENT_SIGHT_RANGE', () => {
    const { graph, ascendantId } = buildTestGraph(5, 7);
    // Add a retinue agent at a different location
    const agentId = 'agent.1';
    const agentLocId = 'loc.agent';
    graph.addNode({ id: agentId, type: 'actor', name: 'Scout', properties: { actorType: 'individual' } });
    graph.addNode({ id: agentLocId, type: 'location', name: 'Outpost', properties: { hexCol: 10, hexRow: 3, locationType: 'settlement' } });
    graph.addEdge({ id: 'e.thread', source: ascendantId, target: agentId, type: 'thread', properties: { tier: 2, devotion: 50 } });
    graph.addEdge({ id: 'e.located_at_agent', source: agentId, target: agentLocId, type: 'located_at', properties: {} });

    const sources = collectLOSSources(graph, ascendantId, []);
    expect(sources).toContainEqual({ hexCol: 10, hexRow: 3, range: AGENT_SIGHT_RANGE });
  });

  it('includes scry targets', () => {
    const { graph, ascendantId } = buildTestGraph(5, 7);
    const scryTargets = [{ col: 15, row: 10 }];
    const sources = collectLOSSources(graph, ascendantId, scryTargets);
    expect(sources.length).toBeGreaterThanOrEqual(2); // avatar + scry
    expect(sources).toContainEqual({ hexCol: 15, hexRow: 10, range: 0 });
  });
});

describe('recalcVisibility', () => {
  it('marks hexes near avatar as visible on empty map', () => {
    const { graph, ascendantId } = buildTestGraph(5, 7);
    const prev: VisibilityMap = new Map();
    const sources = collectLOSSources(graph, ascendantId, []);
    const next = recalcVisibility(prev, sources, graph, 1, 20, 15);

    expect(next.get(visKey(5, 7))?.state).toBe('visible');
    // With range 0, adjacent hexes are NOT visible
    expect(next.get(visKey(6, 7))?.state).toBe('unexplored');
    expect(next.get(visKey(4, 7))?.state).toBe('unexplored');
  });

  it('marks distant hexes as unexplored', () => {
    const { graph, ascendantId } = buildTestGraph(5, 7);
    const prev: VisibilityMap = new Map();
    const sources = collectLOSSources(graph, ascendantId, []);
    const next = recalcVisibility(prev, sources, graph, 1, 20, 15);

    expect(next.get(visKey(19, 14))?.state).toBe('unexplored');
  });

  it('transitions visible → remembered with stale snapshot', () => {
    const { graph, ascendantId } = buildTestGraph(5, 7);
    const sources1 = collectLOSSources(graph, ascendantId, []);
    const tick1 = recalcVisibility(new Map(), sources1, graph, 1, 20, 15);
    expect(tick1.get(visKey(5, 7))?.state).toBe('visible');

    // Move avatar to (15, 10)
    const locEdges = graph.getOutgoingEdges('avatar.1', 'located_at');
    for (const e of locEdges) graph.removeEdge(e.id);
    const newLocId = 'loc.new';
    graph.addNode({ id: newLocId, type: 'location', name: 'Far', properties: { hexCol: 15, hexRow: 10, locationType: 'settlement' } });
    graph.addEdge({ id: 'e.located_at_new', source: 'avatar.1', target: newLocId, type: 'located_at', properties: {} });

    const sources2 = collectLOSSources(graph, ascendantId, []);
    const tick2 = recalcVisibility(tick1, sources2, graph, 2, 20, 15);

    expect(tick2.get(visKey(5, 7))?.state).toBe('remembered');
    expect(tick2.get(visKey(5, 7))?.snapshot?.lastSeenTick).toBe(1);
    expect(tick2.get(visKey(15, 10))?.state).toBe('visible');
  });

  it('transitions unexplored → visible when entering range', () => {
    const { graph, ascendantId } = buildTestGraph(5, 7);
    const sources = collectLOSSources(graph, ascendantId, []);
    const result = recalcVisibility(new Map(), sources, graph, 1, 20, 15);

    // With range 0, only the avatar's own hex is visible
    expect(result.get(visKey(5, 7))?.state).toBe('visible');
    expect(result.get(visKey(6, 7))?.state).toBe('unexplored');
  });

  it('transitions remembered → visible when re-entering range', () => {
    const prev: VisibilityMap = new Map();
    prev.set(visKey(5, 7), {
      state: 'remembered',
      snapshot: { terrain: 'plains', locationNames: [], agentNames: [], lastSeenTick: 1 },
    });

    const { graph, ascendantId } = buildTestGraph(5, 7);
    const sources = collectLOSSources(graph, ascendantId, []);
    const result = recalcVisibility(prev, sources, graph, 3, 20, 15);

    expect(result.get(visKey(5, 7))?.state).toBe('visible');
    expect(result.get(visKey(5, 7))?.snapshot).toBeUndefined();
  });
});
