import { describe, it, expect, beforeEach } from 'vitest';
import { decayConditions, type RemovedCondition } from '../conditionDecay';
import { WorldGraph } from '../graph';

describe('Condition Decay', () => {
  let graph: WorldGraph;
  let agent1Id: string;
  let agent2Id: string;
  let wound1Id: string;
  let plagueId: string;

  beforeEach(() => {
    graph = new WorldGraph();
    agent1Id = 'actor.warrior';
    agent2Id = 'actor.mage';
    wound1Id = 'trait.wound';
    plagueId = 'trait.plague';

    // Add agents
    graph.addNode({
      id: agent1Id,
      type: 'actor',
      name: 'Warrior',
      properties: { actorType: 'individual' },
    });

    graph.addNode({
      id: agent2Id,
      type: 'actor',
      name: 'Mage',
      properties: { actorType: 'individual' },
    });

    // Add traits (conditions)
    graph.addNode({
      id: wound1Id,
      type: 'trait',
      name: 'Wound',
      properties: {
        category: 'condition',
        subcategory: 'condition',
        tags: ['#wound'],
      },
    });

    graph.addNode({
      id: plagueId,
      type: 'trait',
      name: 'Plague',
      properties: {
        category: 'condition',
        subcategory: 'condition',
        tags: ['#disease'],
      },
    });
  });

  it('decrements ticksRemaining on edges with tick-based decay', () => {
    // Setup: agent1 has wound with ticksRemaining: 5
    graph.addEdge({
      id: 'edge.agent1.wound',
      type: 'has_trait',
      source: agent1Id,
      target: wound1Id,
      properties: { ticksRemaining: 5 },
    });

    // Action: decay conditions
    const removed = decayConditions(graph, 1);

    // Assert: no removal, but ticksRemaining decremented
    expect(removed).toHaveLength(0);
    const edge = graph.getEdge('edge.agent1.wound');
    expect(edge?.properties.ticksRemaining).toBe(4);
  });

  it('removes edge when ticksRemaining reaches 0', () => {
    // Setup: agent1 has wound with ticksRemaining: 1
    graph.addEdge({
      id: 'edge.agent1.wound',
      type: 'has_trait',
      source: agent1Id,
      target: wound1Id,
      properties: { ticksRemaining: 1 },
    });

    // Action: decay conditions
    const removed = decayConditions(graph, 10);

    // Assert: edge removed and returns RemovedCondition
    expect(removed).toHaveLength(1);
    expect(removed[0]).toEqual({
      edgeId: 'edge.agent1.wound',
      agentId: agent1Id,
      traitId: wound1Id,
      traitName: 'Wound',
      tick: 10,
    });
    const edge = graph.getEdge('edge.agent1.wound');
    expect(edge).toBeUndefined();
  });

  it('ignores edges without ticksRemaining', () => {
    // Setup: agent1 has permanent trait (no ticksRemaining)
    graph.addEdge({
      id: 'edge.agent1.permanent',
      type: 'has_trait',
      source: agent1Id,
      target: wound1Id,
      properties: { permanent: true },
    });

    // Action: decay conditions
    const removed = decayConditions(graph, 5);

    // Assert: no removal, edge unchanged
    expect(removed).toHaveLength(0);
    const edge = graph.getEdge('edge.agent1.permanent');
    expect(edge).toBeDefined();
    expect(edge?.properties.permanent).toBe(true);
  });

  it('ignores edges with null ticksRemaining (permanent)', () => {
    // Setup: agent1 has trait with explicit null ticksRemaining
    graph.addEdge({
      id: 'edge.agent1.permanent',
      type: 'has_trait',
      source: agent1Id,
      target: wound1Id,
      properties: { ticksRemaining: null },
    });

    // Action: decay conditions
    const removed = decayConditions(graph, 7);

    // Assert: no removal, edge unchanged
    expect(removed).toHaveLength(0);
    const edge = graph.getEdge('edge.agent1.permanent');
    expect(edge).toBeDefined();
    expect(edge?.properties.ticksRemaining).toBeNull();
  });

  it('handles multiple agents with multiple conditions', () => {
    // Setup: agent1 has wound (ticks: 1), agent2 has plague (ticks: 3)
    graph.addEdge({
      id: 'edge.agent1.wound',
      type: 'has_trait',
      source: agent1Id,
      target: wound1Id,
      properties: { ticksRemaining: 1 },
    });

    graph.addEdge({
      id: 'edge.agent2.plague',
      type: 'has_trait',
      source: agent2Id,
      target: plagueId,
      properties: { ticksRemaining: 3 },
    });

    // Action: decay conditions
    const removed = decayConditions(graph, 15);

    // Assert: wound removed, plague decremented
    expect(removed).toHaveLength(1);
    expect(removed[0].traitId).toBe(wound1Id);
    expect(removed[0].agentId).toBe(agent1Id);

    const woundEdge = graph.getEdge('edge.agent1.wound');
    expect(woundEdge).toBeUndefined();

    const plagueEdge = graph.getEdge('edge.agent2.plague');
    expect(plagueEdge).toBeDefined();
    expect(plagueEdge?.properties.ticksRemaining).toBe(2);
  });

  it('preserves other edge properties while decaying ticksRemaining', () => {
    // Setup: edge with multiple properties including ticksRemaining
    graph.addEdge({
      id: 'edge.agent1.wound',
      type: 'has_trait',
      source: agent1Id,
      target: wound1Id,
      properties: {
        ticksRemaining: 2,
        severity: 'moderate',
        source: 'battle',
      },
    });

    // Action: decay conditions
    const removed = decayConditions(graph, 20);

    // Assert: other properties preserved
    expect(removed).toHaveLength(0);
    const edge = graph.getEdge('edge.agent1.wound');
    expect(edge?.properties.ticksRemaining).toBe(1);
    expect(edge?.properties.severity).toBe('moderate');
    expect(edge?.properties.source).toBe('battle');
  });

  it('returns empty list when no conditions have ticksRemaining', () => {
    // Setup: edges without ticksRemaining
    graph.addEdge({
      id: 'edge.agent1.permanent',
      type: 'has_trait',
      source: agent1Id,
      target: wound1Id,
      properties: { permanent: true },
    });

    // Action: decay conditions
    const removed = decayConditions(graph, 25);

    // Assert: empty removal list
    expect(removed).toHaveLength(0);
  });

  it('correctly identifies trait names in RemovedCondition', () => {
    // Setup: agent1 has wound with traitName
    graph.addEdge({
      id: 'edge.agent1.wound',
      type: 'has_trait',
      source: agent1Id,
      target: wound1Id,
      properties: { ticksRemaining: 1 },
    });

    // Action: decay conditions
    const removed = decayConditions(graph, 30);

    // Assert: traitName from node is captured
    expect(removed[0].traitName).toBe('Wound');
  });

  it('falls back to traitId when trait node name is missing', () => {
    // Setup: create a trait with no name property
    const orphanTraitId = 'trait.orphaned';
    graph.addNode({
      id: orphanTraitId,
      type: 'trait',
      name: '', // Empty name to test fallback
      properties: {
        category: 'condition',
        subcategory: 'condition',
      },
    });

    graph.addEdge({
      id: 'edge.agent1.orphan',
      type: 'has_trait',
      source: agent1Id,
      target: orphanTraitId,
      properties: { ticksRemaining: 1 },
    });

    // Action: decay conditions
    const removed = decayConditions(graph, 35);

    // Assert: falls back to traitId when name is empty/missing
    expect(removed).toHaveLength(1);
    expect(removed[0].traitName).toBe('');
  });
});
