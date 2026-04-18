import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { generateInitiativeCandidates } from '../initiativeCandidates';
import {
  INITIATIVE_MIN_WEALTH_FLOOR,
  INITIATIVE_COOLDOWN_TICKS,
} from '../../data/initiative-constants';

function buildBaseGraph() {
  const graph = new WorldGraph();

  graph.addNode({
    id: 'actor_1',
    name: 'Serafina',
    type: 'actor',
    properties: {
      actorType: 'individual',
      spotlightTier: 'spotlight',
      wealth: 50,
      // Ambitious alignment (loyalty_ambition toward -1 = ambition pole)
      axiologicalProfile: { loyalty_ambition: -0.8 },
      domainCapabilities: { heart: 0.6, gold: 0.4, eye: 0.3, shadow: 0.2, star: 0.1, veil: 0.1, iron: 0.1, stone: 0.1 },
    },
  });

  graph.addNode({
    id: 'loc_city',
    name: 'Ironhaven',
    type: 'location',
    properties: { locationSubtype: 'city', hexCol: 5, hexRow: 5, population: 8 },
  });

  graph.addEdge({
    id: 'located_1',
    source: 'actor_1',
    target: 'loc_city',
    type: 'located_at',
    properties: {},
  });

  return graph;
}

describe('generateInitiativeCandidates', () => {
  it('returns empty when agent already has active initiative', () => {
    const graph = buildBaseGraph();
    const actor = graph.getNode('actor_1')!;
    actor.properties.activeInitiative = { status: 'active', templateId: 'initiative.found-organization' };

    const result = generateInitiativeCandidates(graph, 'actor_1', 'loc_city', 10, []);
    expect(result.candidates).toHaveLength(0);
  });

  it('returns empty when wealth is below floor', () => {
    const graph = buildBaseGraph();
    const actor = graph.getNode('actor_1')!;
    actor.properties.wealth = INITIATIVE_MIN_WEALTH_FLOOR - 1;

    const result = generateInitiativeCandidates(graph, 'actor_1', 'loc_city', 10, []);
    expect(result.candidates).toHaveLength(0);
  });

  it('returns empty during cooldown period', () => {
    const graph = buildBaseGraph();
    const actor = graph.getNode('actor_1')!;
    const tick = 100;
    actor.properties.lastInitiativeCompletedTick = tick - 2; // 2 ticks ago, within cooldown

    const result = generateInitiativeCandidates(graph, 'actor_1', 'loc_city', tick, []);
    expect(result.candidates).toHaveLength(0);
  });

  it('returns candidates after cooldown expires', () => {
    const graph = buildBaseGraph();
    const actor = graph.getNode('actor_1')!;
    const tick = 100;
    actor.properties.lastInitiativeCompletedTick = tick - INITIATIVE_COOLDOWN_TICKS - 1;

    const result = generateInitiativeCandidates(graph, 'actor_1', 'loc_city', tick, []);
    expect(result.candidates.length).toBeGreaterThan(0);
  });

  it('returns candidates with valid scores (0 to 1)', () => {
    const graph = buildBaseGraph();
    const result = generateInitiativeCandidates(graph, 'actor_1', 'loc_city', 10, []);
    for (const c of result.candidates) {
      expect(c.finalScore).toBeGreaterThanOrEqual(0);
      expect(c.finalScore).toBeLessThanOrEqual(1);
    }
  });

  it('candidates are sorted descending by finalScore', () => {
    const graph = buildBaseGraph();
    const result = generateInitiativeCandidates(graph, 'actor_1', 'loc_city', 10, []);
    for (let i = 1; i < result.candidates.length; i++) {
      expect(result.candidates[i - 1].finalScore).toBeGreaterThanOrEqual(result.candidates[i].finalScore);
    }
  });

  it('excludes templates the agent cannot afford', () => {
    const graph = buildBaseGraph();
    const actor = graph.getNode('actor_1')!;
    // Set wealth just above floor but below all template minimums
    actor.properties.wealth = INITIATIVE_MIN_WEALTH_FLOOR + 1;

    const result = generateInitiativeCandidates(graph, 'actor_1', 'loc_city', 10, []);
    for (const c of result.candidates) {
      expect(c.wealthCost).toBeLessThanOrEqual((actor.properties.wealth as number));
    }
  });

  it('excludes templates requiring a subtype the location lacks', () => {
    const graph = buildBaseGraph();
    // city qualifies for town+; hamlet does not for town
    const actor = graph.getNode('actor_1')!;
    (graph.getNode('loc_city')!).properties.locationSubtype = 'hamlet';
    actor.properties.domainCapabilities = { heart: 0.9, gold: 0.9, star: 0.9, veil: 0.9, eye: 0.9, shadow: 0.9, iron: 0.9, stone: 0.9 };

    const result = generateInitiativeCandidates(graph, 'actor_1', 'loc_city', 10, []);
    // found-organization requires town+, establish-spy-network requires city+ — both should be excluded
    const ids = result.candidates.map(c => c.templateId);
    expect(ids).not.toContain('initiative.found-organization');
    expect(ids).not.toContain('initiative.establish-spy-network');
  });

  it('apply inspire bonus when present', () => {
    const graph = buildBaseGraph();
    const actor = graph.getNode('actor_1')!;
    actor.properties.initiativeInspireBonus = 0.5;

    const withBonus = generateInitiativeCandidates(graph, 'actor_1', 'loc_city', 10, []);
    actor.properties.initiativeInspireBonus = undefined;
    const withoutBonus = generateInitiativeCandidates(graph, 'actor_1', 'loc_city', 10, []);

    if (withBonus.candidates.length > 0 && withoutBonus.candidates.length > 0) {
      expect(withBonus.candidates[0].finalScore).toBeGreaterThan(withoutBonus.candidates[0].finalScore);
    }
  });
});
