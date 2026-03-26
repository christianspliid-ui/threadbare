import { describe, it, expect } from 'vitest';
import {
  createMandateState,
  evaluateCondition,
  evaluateMandate,
  advanceMandateStage,
} from '../mandate';
import { WorldGraph } from '../graph';
import type {
  MandateType,
  MandateStage,
  MandateDefinition,
  MandateState,
  MandateCondition,
} from '../../types/mandate';

describe('Mandate type definitions', () => {
  it('MandateDefinition has correct shape', () => {
    const mandate: MandateDefinition = {
      id: 'mandate_1',
      type: 'graph_state',
      name: 'Conquer the North',
      description: 'Your devoted actors control 5+ regions',
      stages: [
        { stage: 'setup', description: 'Establish first foothold', conditions: [] },
        { stage: 'escalation', description: 'Rivals react to expansion', conditions: [] },
        { stage: 'culmination', description: 'Final push for dominance', conditions: [] },
      ],
    };
    expect(mandate.stages.length).toBe(3);
    expect(mandate.type).toBe('graph_state');
  });

  it('MandateState tracks progress correctly', () => {
    const state: MandateState = {
      mandateId: 'mandate_1',
      currentStage: 'setup',
      progress: 0.0,
      completed: false,
      failed: false,
    };
    expect(state.currentStage).toBe('setup');
    expect(state.completed).toBe(false);
  });
});

describe('mandate evaluation engine', () => {
  function buildTestGraph() {
    const graph = new WorldGraph();

    // Ascendant
    graph.addNode({ id: 'actor_asc', type: 'actor', name: 'The Verdant One', properties: { actorType: 'ascendant' } });

    // 3 regions controlled by devoted actors
    for (let i = 1; i <= 3; i++) {
      graph.addNode({ id: `loc_region_${i}`, type: 'location', name: `Region ${i}`, properties: { locationType: 'region' } });
      graph.addNode({ id: `actor_champion_${i}`, type: 'actor', name: `Champion ${i}`, properties: { actorType: 'individual' } });

      // Thread edge
      graph.addEdge({ id: `edge_thread_${i}`, source: 'actor_asc', target: `actor_champion_${i}`, type: 'thread', properties: { tier: 2 } });

      // Controls edge
      graph.addEdge({ id: `edge_control_${i}`, source: `actor_champion_${i}`, target: `loc_region_${i}`, type: 'controls', properties: {} });
    }

    return graph;
  }

  it('createMandateState returns initial state', () => {
    const state = createMandateState('mandate_1', 10);
    expect(state.currentStage).toBe('setup');
    expect(state.progress).toBe(0);
    expect(state.completed).toBe(false);
    expect(state.assignedTick).toBe(10);
  });

  it('evaluateCondition: node_count checks actor count with matching properties', () => {
    const graph = buildTestGraph();
    const condition: MandateCondition = {
      type: 'node_count',
      description: 'Have 3+ devoted champions',
      params: {
        nodeType: 'actor',
        edgeType: 'thread',
        edgeTarget: 'actor_asc',
        minTier: 2,
        minCount: 3,
      },
    };
    const result = evaluateCondition(graph, condition, 'actor_asc');
    expect(result).toBe(true);
  });

  it('evaluateCondition: node_count fails when count insufficient', () => {
    const graph = buildTestGraph();
    const condition: MandateCondition = {
      type: 'node_count',
      description: 'Have 5+ devoted champions',
      params: {
        nodeType: 'actor',
        edgeType: 'thread',
        edgeTarget: 'actor_asc',
        minTier: 2,
        minCount: 5,
      },
    };
    const result = evaluateCondition(graph, condition, 'actor_asc');
    expect(result).toBe(false);
  });

  it('evaluateMandate returns progress based on conditions met', () => {
    const graph = buildTestGraph();
    const mandate: MandateDefinition = {
      id: 'mandate_1',
      type: 'graph_state',
      name: 'Build a Cult',
      description: 'Establish 3 devoted champions',
      stages: [
        {
          stage: 'setup',
          description: 'Recruit first champion',
          conditions: [{
            type: 'node_count',
            description: 'Have 1+ retinue member',
            params: { nodeType: 'actor', edgeType: 'thread', edgeTarget: 'actor_asc', minTier: 1, minCount: 1 },
          }],
        },
        {
          stage: 'escalation',
          description: 'Expand the cult',
          conditions: [{
            type: 'node_count',
            description: 'Have 2+ devoted',
            params: { nodeType: 'actor', edgeType: 'thread', edgeTarget: 'actor_asc', minTier: 2, minCount: 2 },
          }],
        },
        {
          stage: 'culmination',
          description: 'Full cult established',
          conditions: [{
            type: 'node_count',
            description: 'Have 3+ devoted',
            params: { nodeType: 'actor', edgeType: 'thread', edgeTarget: 'actor_asc', minTier: 2, minCount: 3 },
          }],
        },
      ],
    };

    let state = createMandateState('mandate_1', 0);

    // All stages should be completable with our test graph (3 tier-2 retinue members)
    state = evaluateMandate(graph, mandate, state, 'actor_asc', 10);
    // Setup conditions met, should advance
    expect(state.currentStage).toBe('setup');
    // All setup conditions met → progress = 1.0 for this stage
    expect(state.progress).toBe(1.0);
  });

  it('advanceMandateStage moves to next stage', () => {
    let state = createMandateState('mandate_1', 0);
    state.progress = 1.0; // setup complete

    state = advanceMandateStage(state, 10);
    expect(state.currentStage).toBe('escalation');
    expect(state.progress).toBe(0);
    expect(state.stageCompletedTicks?.setup).toBe(10);
  });

  it('advanceMandateStage from culmination marks completed', () => {
    let state = createMandateState('mandate_1', 0);
    state.currentStage = 'culmination';
    state.progress = 1.0;

    state = advanceMandateStage(state, 50);
    expect(state.completed).toBe(true);
    expect(state.stageCompletedTicks?.culmination).toBe(50);
  });

  it('actor_tier counts agents at or above min tier', () => {
    const graph = buildTestGraph();
    const condition: MandateCondition = {
      type: 'actor_tier',
      description: 'Have 2+ tier-2 retinue members',
      params: {
        minTier: 2,
        minCount: 2,
      },
    };
    const result = evaluateCondition(graph, condition, 'actor_asc');
    expect(result).toBe(true);
  });

  it('actor_tier fails when not enough high-tier agents', () => {
    const graph = buildTestGraph();
    const condition: MandateCondition = {
      type: 'actor_tier',
      description: 'Have 1+ tier-4 retinue members',
      params: {
        minTier: 4,
        minCount: 1,
      },
    };
    const result = evaluateCondition(graph, condition, 'actor_asc');
    expect(result).toBe(false);
  });

  it('sphere_weight checks region sphere influence', () => {
    const graph = buildTestGraph();

    // Add a sphere node
    graph.addNode({ id: 'sphere_chaos', type: 'sphere', name: 'Chaos', properties: {} });

    // Add sphere_influence edge from first location to the sphere with weight 0.8
    graph.addEdge({
      id: 'edge_sphere_inf_1',
      source: 'loc_region_1',
      target: 'sphere_chaos',
      type: 'sphere_influence',
      properties: { weight: 0.8 },
    });

    const condition: MandateCondition = {
      type: 'sphere_weight',
      description: 'Chaos influences 1+ region',
      params: {
        sphere: 'chaos',
        minWeight: 0.7,
        minRegions: 1,
      },
    };
    const result = evaluateCondition(graph, condition, 'actor_asc');
    expect(result).toBe(true);
  });

  it('sphere_weight fails when insufficient regions', () => {
    const graph = buildTestGraph();

    // Add a sphere node
    graph.addNode({ id: 'sphere_order', type: 'sphere', name: 'Order', properties: {} });

    // Add sphere_influence edge from first location only
    graph.addEdge({
      id: 'edge_sphere_inf_order',
      source: 'loc_region_1',
      target: 'sphere_order',
      type: 'sphere_influence',
      properties: { weight: 0.9 },
    });

    const condition: MandateCondition = {
      type: 'sphere_weight',
      description: 'Order influences 3+ regions',
      params: {
        sphere: 'order',
        minWeight: 0.8,
        minRegions: 3,
      },
    };
    const result = evaluateCondition(graph, condition, 'actor_asc');
    expect(result).toBe(false);
  });
});
