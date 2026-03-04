import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  createMortalDetectionState,
  processMortalDetection,
  createRivalDetectionState,
  processRivalDetection,
} from '../stealth';
import {
  createMandateState,
  evaluateMandate,
  advanceMandateStage,
} from '../mandate';
import type { MandateDefinition } from '../../types/mandate';

describe('Stealth + Mandate integration', () => {
  function buildWorld() {
    const graph = new WorldGraph();

    graph.addNode({ id: 'actor_asc', type: 'actor', name: 'The Verdant One', properties: { actorType: 'ascendant' } });
    graph.addNode({ id: 'actor_rival', type: 'actor', name: 'The Iron Judge', properties: { actorType: 'ascendant' } });
    graph.addNode({ id: 'loc_north', type: 'location', name: 'Northern Reach', properties: { locationType: 'region' } });

    // 4 worshippers at various tiers
    for (let i = 1; i <= 4; i++) {
      graph.addNode({ id: `actor_agent_${i}`, type: 'actor', name: `Agent ${i}`, properties: { actorType: 'individual' } });
      graph.addEdge({ id: `edge_worship_${i}`, source: `actor_agent_${i}`, target: 'actor_asc', type: 'worships', properties: { tier: i <= 2 ? 2 : 3 } });
      graph.addEdge({ id: `edge_loc_${i}`, source: `actor_agent_${i}`, target: 'loc_north', type: 'located_at', properties: {} });
    }

    return graph;
  }

  it('heavy intervention use triggers both mortal and rival detection', () => {
    let mortalState = createMortalDetectionState('actor_agent_1');
    let rivalState = createRivalDetectionState('actor_rival', 'loc_north');

    // 5 coincidence interventions (3.0 each)
    for (let tick = 1; tick <= 5; tick++) {
      mortalState = processMortalDetection(mortalState, 'coincidence', tick);
      rivalState = processRivalDetection(rivalState, 'coincidence', tick);
    }

    // Mortal: 5 × 3.0 = 15.0 → revelation
    expect(mortalState.awarenessLevel).toBe('revelation');

    // Rival: 5 × 3.0 = 15.0 → identified (threshold 12.0, below targeted 20.0)
    expect(rivalState.awarenessLevel).toBe('identified');
  });

  it('mandate progresses through stages as graph conditions are met', () => {
    const graph = buildWorld();

    const mandate: MandateDefinition = {
      id: 'mandate_cult',
      type: 'graph_state',
      name: 'Build the Cult',
      description: 'Establish champions across the land',
      stages: [
        {
          stage: 'setup',
          description: 'Recruit worshippers',
          conditions: [{
            type: 'node_count',
            description: '2+ worshippers',
            params: { nodeType: 'actor', edgeType: 'worships', edgeTarget: 'actor_asc', minTier: 1, minCount: 2 },
          }],
        },
        {
          stage: 'escalation',
          description: 'Elevate champions',
          conditions: [{
            type: 'node_count',
            description: '2+ champions (tier 3)',
            params: { nodeType: 'actor', edgeType: 'worships', edgeTarget: 'actor_asc', minTier: 3, minCount: 2 },
          }],
        },
        {
          stage: 'culmination',
          description: 'Dominate the region',
          conditions: [{
            type: 'node_count',
            description: '4+ worshippers',
            params: { nodeType: 'actor', edgeType: 'worships', edgeTarget: 'actor_asc', minTier: 2, minCount: 4 },
          }],
        },
      ],
    };

    // Start at setup
    let state = createMandateState('mandate_cult', 0);

    // Evaluate setup: 4 worshippers at tier 2+ → meets "2+ worshippers" condition
    state = evaluateMandate(graph, mandate, state, 'actor_asc', 10);
    expect(state.progress).toBe(1.0);

    // Advance to escalation
    state = advanceMandateStage(state, 10);
    expect(state.currentStage).toBe('escalation');

    // Evaluate escalation: 2 agents at tier 3 → meets "2+ champions" condition
    state = evaluateMandate(graph, mandate, state, 'actor_asc', 20);
    expect(state.progress).toBe(1.0);

    // Advance to culmination
    state = advanceMandateStage(state, 20);
    expect(state.currentStage).toBe('culmination');

    // Evaluate culmination: 4 worshippers at tier 2+ → meets "4+ worshippers" condition
    state = evaluateMandate(graph, mandate, state, 'actor_asc', 30);
    expect(state.progress).toBe(1.0);

    // Complete!
    state = advanceMandateStage(state, 30);
    expect(state.completed).toBe(true);
  });
});
