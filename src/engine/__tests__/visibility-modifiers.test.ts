import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { collectLOSSources } from '../visibility';
import { getModifiedValue } from '../modifiers';
import { AVATAR_SIGHT_RANGE, AGENT_SIGHT_RANGE, SCRY_SIGHT_RANGE } from '../../types/visibility';

describe('visibility modifier integration', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
  });

  // --- Unit-level modifier verification ---

  it('agent with Eagle-Eyed trait gets increased LOS', () => {
    const agentId = 'agent1';
    graph.addNode({ id: agentId, type: 'actor', name: 'Scout', properties: {} });
    graph.addNode({ id: 'loc1', type: 'location', name: 'Outpost', properties: { hex: '2,2', terrain: 'grassland' } });
    graph.addNode({ id: 'trait1', type: 'trait', name: 'Eagle-Eyed', properties: {} });
    graph.addEdge({ id: 'e1', source: agentId, target: 'loc1', type: 'located_at', properties: {} });
    graph.addEdge({ id: 'e2', source: agentId, target: 'trait1', type: 'has_trait', properties: { modifiers: { los_range: 1 } } });

    const modifiedRange = getModifiedValue(graph, agentId, 'los_range', AGENT_SIGHT_RANGE);
    expect(modifiedRange).toBe(AGENT_SIGHT_RANGE + 1);
  });

  it('agent in mountains gets +2 LOS from terrain', () => {
    const agentId = 'agent1';
    graph.addNode({ id: agentId, type: 'actor', name: 'Scout', properties: {} });
    graph.addNode({ id: 'loc1', type: 'location', name: 'Peak', properties: { hex: '3,3', terrain: 'mountains' } });
    graph.addEdge({ id: 'e1', source: agentId, target: 'loc1', type: 'located_at', properties: {} });

    const modifiedRange = getModifiedValue(graph, agentId, 'los_range', AGENT_SIGHT_RANGE);
    expect(modifiedRange).toBe(AGENT_SIGHT_RANGE + 2);
  });

  it('agent in dense forest LOS floors at 0', () => {
    const agentId = 'agent1';
    graph.addNode({ id: agentId, type: 'actor', name: 'Scout', properties: {} });
    graph.addNode({ id: 'loc1', type: 'location', name: 'Woods', properties: { hex: '1,1', terrain: 'dense_forest' } });
    graph.addEdge({ id: 'e1', source: agentId, target: 'loc1', type: 'located_at', properties: {} });

    const modifiedRange = getModifiedValue(graph, agentId, 'los_range', AGENT_SIGHT_RANGE);
    expect(modifiedRange).toBe(0);
  });

  it('combined trait and terrain modifiers stack', () => {
    const agentId = 'agent1';
    graph.addNode({ id: agentId, type: 'actor', name: 'Scout', properties: {} });
    graph.addNode({ id: 'loc1', type: 'location', name: 'Summit', properties: { hex: '4,4', terrain: 'mountains' } });
    graph.addNode({ id: 'trait1', type: 'trait', name: 'Eagle-Eyed', properties: {} });
    graph.addEdge({ id: 'e1', source: agentId, target: 'loc1', type: 'located_at', properties: {} });
    graph.addEdge({ id: 'e2', source: agentId, target: 'trait1', type: 'has_trait', properties: { modifiers: { los_range: 1 } } });

    const modifiedRange = getModifiedValue(graph, agentId, 'los_range', AGENT_SIGHT_RANGE);
    // Base 1 + trait +1 + mountains +2 = 4
    expect(modifiedRange).toBe(4);
  });

  // --- collectLOSSources integration tests ---

  it('collectLOSSources returns modified range for avatar with trait', () => {
    // Set up ascendant → avatar → location + trait
    graph.addNode({ id: 'asc1', type: 'ascendant', name: 'Player God', properties: {} });
    graph.addNode({ id: 'avatar1', type: 'actor', name: 'Avatar', properties: {} });
    graph.addNode({ id: 'loc1', type: 'location', name: 'Hilltop', properties: { hexCol: 5, hexRow: 5, terrain: 'hills' } });
    graph.addNode({ id: 'trait1', type: 'trait', name: 'Far-Seeing', properties: {} });
    graph.addEdge({ id: 'e1', source: 'avatar1', target: 'asc1', type: 'avatar_of', properties: {} });
    graph.addEdge({ id: 'e2', source: 'avatar1', target: 'loc1', type: 'located_at', properties: {} });
    graph.addEdge({ id: 'e3', source: 'avatar1', target: 'trait1', type: 'has_trait', properties: { modifiers: { los_range: 2 } } });

    const sources = collectLOSSources(graph, 'asc1', []);
    expect(sources).toHaveLength(1);
    // Base 0 + trait +2 + hills terrain +1 = 3
    expect(sources[0].range).toBe(AVATAR_SIGHT_RANGE + 2 + 1);
    expect(sources[0].hexCol).toBe(5);
    expect(sources[0].hexRow).toBe(5);
  });

  it('collectLOSSources returns modified range for retinue agent with terrain', () => {
    // Set up ascendant + thread agent in mountains
    graph.addNode({ id: 'asc1', type: 'ascendant', name: 'Player God', properties: {} });
    graph.addNode({ id: 'agent1', type: 'actor', name: 'Scout', properties: {} });
    graph.addNode({ id: 'loc1', type: 'location', name: 'Mountain Peak', properties: { hexCol: 3, hexRow: 3, terrain: 'mountains' } });
    graph.addEdge({ id: 'e1', source: 'asc1', target: 'agent1', type: 'thread', properties: { tier: 1 } });
    graph.addEdge({ id: 'e2', source: 'agent1', target: 'loc1', type: 'located_at', properties: {} });

    const sources = collectLOSSources(graph, 'asc1', []);
    // No avatar, just the agent — base 0 + mountains +2 = 2
    expect(sources).toHaveLength(1);
    expect(sources[0].range).toBe(AGENT_SIGHT_RANGE + 2);
  });

  it('collectLOSSources keeps scry targets at static range', () => {
    graph.addNode({ id: 'asc1', type: 'ascendant', name: 'Player God', properties: {} });

    const scryTargets = [{ col: 7, row: 7 }];
    const sources = collectLOSSources(graph, 'asc1', scryTargets);
    expect(sources).toHaveLength(1);
    expect(sources[0].range).toBe(SCRY_SIGHT_RANGE);
  });
});
