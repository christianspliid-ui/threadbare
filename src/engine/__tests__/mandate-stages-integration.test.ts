import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  createMandateState,
  evaluateMandate,
  advanceMandateStage,
} from '../mandate';
import type { MandateDefinition } from '../../types/mandate';

describe('Mandate stage progression', () => {
  function buildWorld() {
    const graph = new WorldGraph();

    graph.addNode({ id: 'actor_asc', type: 'actor', name: 'The Verdant One', properties: { actorType: 'ascendant' } });
    graph.addNode({ id: 'loc_north', type: 'location', name: 'Northern Reach', properties: { locationType: 'region' } });

    // 4 threaded agents at various tiers
    for (let i = 1; i <= 4; i++) {
      graph.addNode({ id: `actor_agent_${i}`, type: 'actor', name: `Agent ${i}`, properties: { actorType: 'individual' } });
      graph.addEdge({ id: `edge_thread_${i}`, source: 'actor_asc', target: `actor_agent_${i}`, type: 'thread', properties: { tier: i <= 2 ? 2 : 3 } });
      graph.addEdge({ id: `edge_loc_${i}`, source: `actor_agent_${i}`, target: 'loc_north', type: 'located_at', properties: {} });
    }

    return graph;
  }

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
          description: 'Recruit threaded agents',
          conditions: [{
            type: 'actor_tier',
            description: '2+ threaded agents',
            params: { minTier: 1, minCount: 2 },
          }],
        },
        {
          stage: 'escalation',
          description: 'Elevate champions',
          conditions: [{
            type: 'actor_tier',
            description: '2+ champions (tier 3)',
            params: { minTier: 3, minCount: 2 },
          }],
        },
        {
          stage: 'culmination',
          description: 'Dominate the region',
          conditions: [{
            type: 'actor_tier',
            description: '4+ threaded agents',
            params: { minTier: 2, minCount: 4 },
          }],
        },
      ],
    };

    // Start at setup
    let state = createMandateState('mandate_cult', 0);

    // Evaluate setup: 4 threaded agents at tier 2+ → meets "2+ threaded agents" condition
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

    // Evaluate culmination: 4 threaded agents at tier 2+ → meets "4+ threaded agents" condition
    state = evaluateMandate(graph, mandate, state, 'actor_asc', 30);
    expect(state.progress).toBe(1.0);

    // Complete!
    state = advanceMandateStage(state, 30);
    expect(state.completed).toBe(true);
  });
});
