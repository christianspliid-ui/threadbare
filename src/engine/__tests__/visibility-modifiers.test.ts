import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { collectLOSSources } from '../visibility';
import { getModifiedValue } from '../modifiers';
import { AVATAR_SIGHT_RANGE, AGENT_SIGHT_RANGE } from '../../types/visibility';

describe('visibility modifier integration', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
  });

  it('agent with Eagle-Eyed trait gets increased LOS', () => {
    // Create agent on a hex with a trait granting +1 LOS
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

  it('agent in dense forest gets -1 LOS from terrain', () => {
    const agentId = 'agent1';
    graph.addNode({ id: agentId, type: 'actor', name: 'Scout', properties: {} });
    graph.addNode({ id: 'loc1', type: 'location', name: 'Woods', properties: { hex: '1,1', terrain: 'dense_forest' } });
    graph.addEdge({ id: 'e1', source: agentId, target: 'loc1', type: 'located_at', properties: {} });

    const modifiedRange = getModifiedValue(graph, agentId, 'los_range', AGENT_SIGHT_RANGE);
    // With base 0, -1 would be -1, but floor is 0
    expect(modifiedRange).toBe(0);
  });

  it('avatar LOS is modified by traits', () => {
    const avatarId = 'avatar1';
    graph.addNode({ id: avatarId, type: 'actor', name: 'Avatar', properties: {} });
    graph.addNode({ id: 'trait1', type: 'trait', name: 'Far-Seeing', properties: {} });
    graph.addEdge({ id: 'e1', source: avatarId, target: 'trait1', type: 'has_trait', properties: { modifiers: { los_range: 2 } } });

    const modifiedRange = getModifiedValue(graph, avatarId, 'los_range', AVATAR_SIGHT_RANGE);
    expect(modifiedRange).toBe(AVATAR_SIGHT_RANGE + 2);
  });

  it('combined trait and terrain modifiers stack', () => {
    const agentId = 'agent1';
    graph.addNode({ id: agentId, type: 'actor', name: 'Scout', properties: {} });
    graph.addNode({ id: 'loc1', type: 'location', name: 'Summit', properties: { hex: '4,4', terrain: 'mountains' } });
    graph.addNode({ id: 'trait1', type: 'trait', name: 'Eagle-Eyed', properties: {} });
    graph.addEdge({ id: 'e1', source: agentId, target: 'loc1', type: 'located_at', properties: {} });
    graph.addEdge({ id: 'e2', source: agentId, target: 'trait1', type: 'has_trait', properties: { modifiers: { los_range: 1 } } });

    const modifiedRange = getModifiedValue(graph, agentId, 'los_range', AGENT_SIGHT_RANGE);
    // Base 0 + trait +1 + mountains +2 = 3
    expect(modifiedRange).toBe(3);
  });
});
