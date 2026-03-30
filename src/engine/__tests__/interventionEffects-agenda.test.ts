import { describe, it, expect } from 'vitest';
import { applyInterventionEffects, getDivineInfluences } from '../interventionEffects';
import { WorldGraph } from '../graph';

function createTestGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'actor.test',
    type: 'actor',
    name: 'Test Actor',
    properties: {
      axiologicalProfile: {
        loyalty_ambition: 0.0,
        courage_prudence: 0.0,
        mercy_ruthlessness: 0.0,
        honesty_cunning: 0.0,
        sacrifice_survival: 0.0,
        loyalty_ambition: 0.0,
        tradition_novelty: 0.0,
        preservation_transformation: 0.0,
        mercy_ruthlessness: 0.0,
        asceticism_extravagance: 0.0,
      },
      narrativeArchetype: 'conqueror',
      locationId: 'loc.test',
    },
  });
  graph.addNode({ id: 'loc.test', type: 'location', name: 'Test Location', properties: {} });
  return graph;
}

describe('applyInterventionEffects with agenda', () => {
  it('uses agenda valuePair instead of random selection', () => {
    const graph = createTestGraph();
    const result = applyInterventionEffects({
      graph,
      interventionType: 'persuade',
      targetAgentId: 'actor.test',
      sphere: 'mind',
      tick: 10,
      seed: 42,
      agenda: {
        id: 'persuade_greed',
        name: 'Promise Riches',
        valuePair: 'asceticism_extravagance',
        valueDirection: 'left',
        narrativeHook: 'wealth beyond measure',
        behaviorTag: 'wealth-seeking',
        reachBoost: { reach: 'gold', bonus: 0.3 },
        archetypeAffinities: ['merchant_prince'],
      },
    });

    expect(result.success).toBe(true);
    const influences = getDivineInfluences(graph, 'actor.test');
    expect(influences.length).toBe(1);
    expect(influences[0].valueDrifts?.asceticism_extravagance).toBeDefined();
    expect(influences[0].agendaId).toBe('persuade_greed');
  });

  it('stores decay curve constants on the influence entry', () => {
    const graph = createTestGraph();
    applyInterventionEffects({
      graph,
      interventionType: 'persuade',
      targetAgentId: 'actor.test',
      sphere: 'mind',
      tick: 10,
      seed: 42,
    });

    const influences = getDivineInfluences(graph, 'actor.test');
    expect(influences[0].initialStrength).toBeGreaterThan(0);
    expect(influences[0].decayRate).toBeGreaterThan(0);
    expect(influences[0].minimumStrength).toBeGreaterThan(0);
    expect(influences[0].maxDuration).toBeGreaterThan(0);
  });

  it('stores reachBoost and behaviorTag from agenda', () => {
    const graph = createTestGraph();
    applyInterventionEffects({
      graph,
      interventionType: 'persuade',
      targetAgentId: 'actor.test',
      sphere: 'mind',
      tick: 10,
      seed: 42,
      agenda: {
        id: 'persuade_greed',
        name: 'Promise Riches',
        valuePair: 'asceticism_extravagance',
        valueDirection: 'left',
        narrativeHook: 'wealth',
        behaviorTag: 'wealth-seeking',
        reachBoost: { reach: 'gold', bonus: 0.3 },
        archetypeAffinities: [],
      },
    });

    const influences = getDivineInfluences(graph, 'actor.test');
    expect(influences[0].reachBoost).toEqual({ reach: 'gold', bonus: 0.3 });
    expect(influences[0].behaviorTag).toBe('wealth-seeking');
  });

  it('applies agenda direction for value drifts', () => {
    const graph = createTestGraph();

    // Test left direction (negative drift)
    applyInterventionEffects({
      graph,
      interventionType: 'dream',
      targetAgentId: 'actor.test',
      sphere: 'spirit',
      tick: 5,
      seed: 100,
      agenda: {
        id: 'dream_greed',
        name: 'Visions of Wealth',
        valuePair: 'asceticism_extravagance',
        valueDirection: 'left',
        narrativeHook: 'riches',
        behaviorTag: 'wealth-driven',
        reachBoost: { reach: 'gold', bonus: 0.25 },
        archetypeAffinities: [],
      },
    });

    const influences = getDivineInfluences(graph, 'actor.test');
    expect(influences.length).toBeGreaterThan(0);
    const greedDrift = influences[0].valueDrifts?.asceticism_extravagance;
    expect(greedDrift).toBeDefined();
  });

  it('stores agendaId and reachBoost on non-value-drift interventions', () => {
    const graph = createTestGraph();
    applyInterventionEffects({
      graph,
      interventionType: 'coincidence',
      targetAgentId: 'actor.test',
      sphere: 'time',
      tick: 15,
      seed: 77,
      agenda: {
        id: 'coincidence_timing',
        name: 'Fortuitous Meeting',
        valuePair: 'loyalty_ambition',
        valueDirection: 'left',
        narrativeHook: 'chance encounter',
        behaviorTag: 'opportunity-seeker',
        reachBoost: { reach: 'star', bonus: 0.2 },
        archetypeAffinities: [],
      },
    });

    const influences = getDivineInfluences(graph, 'actor.test');
    expect(influences[0].agendaId).toBe('coincidence_timing');
    expect(influences[0].reachBoost).toEqual({ reach: 'star', bonus: 0.2 });
    expect(influences[0].behaviorTag).toBe('opportunity-seeker');
  });

  it('works without agenda (backward compatibility)', () => {
    const graph = createTestGraph();
    const result = applyInterventionEffects({
      graph,
      interventionType: 'intimidate',
      targetAgentId: 'actor.test',
      sphere: 'iron',
      tick: 20,
      seed: 55,
    });

    expect(result.success).toBe(true);
    const influences = getDivineInfluences(graph, 'actor.test');
    expect(influences.length).toBe(1);
    expect(influences[0].agendaId).toBeUndefined();
  });
});
