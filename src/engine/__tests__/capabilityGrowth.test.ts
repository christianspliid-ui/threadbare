import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  difficultyScaling,
  computeGrowthAmount,
  applyEncounterGrowth,
  BASE_ENCOUNTER_GROWTH,
  FAILURE_GROWTH_FRACTION,
  PROMOTION_ELIGIBLE_MULTIPLIER,
  DIMINISHING_RETURNS_FACTOR,
} from '../capabilityGrowth';
import type { DomainContributions } from '../../types/traits';

/** Create a minimal graph with an agent and an existing trait for capability */
function makeGraphWithAgent(agentId: string, domain: string = 'iron', traitLevel: number = 0): WorldGraph {
  const graph = new WorldGraph();

  graph.addNode({
    id: agentId,
    type: 'actor',
    name: 'Test Agent',
    properties: { actorType: 'individual' },
  });

  if (traitLevel > 0) {
    const contributions: DomainContributions = { [domain]: 1.0 };
    graph.addNode({
      id: `trait_${domain}_base`,
      type: 'trait',
      name: `Base ${domain} Trait`,
      properties: {
        subcategory: 'innate',
        description: 'test',
        importance: 0.5,
        maxLevel: 10,
        visibility: 'public',
        domainContributions: contributions,
        tags: [],
        flavorText: 'test',
      },
    });
    graph.addEdge({
      id: `edge_trait_${domain}_base`,
      source: agentId,
      target: `trait_${domain}_base`,
      type: 'has_trait',
      properties: {
        level: traitLevel,
        acquiredTick: 0,
        lastReinforcedTick: 0,
        source: 'test',
        visibility: 'public',
      },
    });
  }

  return graph;
}

describe('difficultyScaling', () => {
  it('returns correct values for each difficulty range', () => {
    expect(difficultyScaling(10)).toBe(0.2);   // < 20
    expect(difficultyScaling(19)).toBe(0.2);   // < 20
    expect(difficultyScaling(20)).toBe(0.5);   // 20-39
    expect(difficultyScaling(39)).toBe(0.5);   // 20-39
    expect(difficultyScaling(40)).toBe(1.0);   // 40-59
    expect(difficultyScaling(59)).toBe(1.0);   // 40-59
    expect(difficultyScaling(60)).toBe(1.3);   // 60-79
    expect(difficultyScaling(79)).toBe(1.3);   // 60-79
    expect(difficultyScaling(80)).toBe(1.5);   // >= 80
    expect(difficultyScaling(100)).toBe(1.5);  // >= 80
  });
});

describe('computeGrowthAmount', () => {
  it('computes growth for success at moderate difficulty', () => {
    const growth = computeGrowthAmount(50, true, false, 0.3);
    // base(0.5) * promoMult(1.0) * diffScale(1.0) * diminishing(1 - 0.3*0.7 = 0.79)
    expect(growth).toBeCloseTo(0.5 * 1.0 * 1.0 * 0.79, 5);
  });

  it('returns FAILURE_GROWTH_FRACTION on failure', () => {
    const growth = computeGrowthAmount(50, false, false, 0.3);
    // base(0.5) * FAILURE_GROWTH_FRACTION(0.2) * diffScale(1.0)
    expect(growth).toBeCloseTo(BASE_ENCOUNTER_GROWTH * FAILURE_GROWTH_FRACTION * 1.0, 5);
  });

  it('doubles growth when promotion-eligible', () => {
    const normal = computeGrowthAmount(50, true, false, 0.3);
    const promo = computeGrowthAmount(50, true, true, 0.3);
    expect(promo).toBeCloseTo(normal * PROMOTION_ELIGIBLE_MULTIPLIER, 5);
  });

  it('reduces growth at high capability (diminishing returns)', () => {
    const lowCap = computeGrowthAmount(50, true, false, 0.1);
    const highCap = computeGrowthAmount(50, true, false, 0.9);
    expect(highCap).toBeLessThan(lowCap);
  });

  it('never goes below the 0.1 diminishing floor', () => {
    // At capability 1.0: diminishing = 1 - 1.0 * 0.7 = 0.3 > 0.1
    // At capability 2.0 (hypothetical): diminishing = 1 - 2.0 * 0.7 = -0.4, clamped to 0.1
    const growth = computeGrowthAmount(50, true, false, 2.0);
    expect(growth).toBeCloseTo(BASE_ENCOUNTER_GROWTH * 1.0 * 1.0 * 0.1, 5);
  });
});

describe('applyEncounterGrowth', () => {
  it('creates experience trait if missing', () => {
    const graph = makeGraphWithAgent('agent_1');
    const result = applyEncounterGrowth(graph, 'agent_1', 'iron', 50, true, false);

    expect(result.growthApplied).toBeGreaterThan(0);

    // Check that the experience trait node was created
    const traitNode = graph.getNode('trait.experience.iron');
    expect(traitNode).toBeDefined();
    expect(traitNode!.name).toBe('Experience (iron)');

    // Check edge exists
    const edges = graph.getOutgoingEdges('agent_1', 'has_trait');
    const expEdge = edges.find(e => e.target === 'trait.experience.iron');
    expect(expEdge).toBeDefined();
    expect((expEdge!.properties.level as number)).toBeGreaterThan(0);
  });

  // ─── THR-1395: one definition, many bearers ──────────────────────
  //
  // The point of the change, stated as the thing that used to be false: two agents who
  // both fight now hold ONE "Experience (iron)" between them. Before, the trait pool grew
  // by one node per (agent, domain) — 44 nodes for 44 bearers on a seeded medium world.
  it('mints one shared experience definition however many agents earn it', () => {
    const graph = makeGraphWithAgent('agent_1');
    graph.addNode({
      id: 'agent_2', type: 'actor', name: 'Second Agent',
      properties: { actorType: 'individual' },
    });

    applyEncounterGrowth(graph, 'agent_1', 'iron', 50, true, false);
    applyEncounterGrowth(graph, 'agent_2', 'iron', 50, true, false);

    // One node, not two — and no node carries either agent's id.
    const expNodes = graph.getNodesByType('trait')
      .filter(n => n.properties.subcategory === 'experience');
    expect(expNodes.map(n => n.id)).toEqual(['trait.experience.iron']);

    // Both agents bear it, on their own edges, each with its own level.
    for (const agentId of ['agent_1', 'agent_2']) {
      const edges = graph.getOutgoingEdges(agentId, 'has_trait')
        .filter(e => e.target === 'trait.experience.iron');
      expect(edges).toHaveLength(1);
      expect(edges[0].properties.level as number).toBeGreaterThan(0);
    }
  });

  it('keeps a per-domain definition per domain, not a shared one across domains', () => {
    const graph = makeGraphWithAgent('agent_1');
    applyEncounterGrowth(graph, 'agent_1', 'iron', 50, true, false);
    applyEncounterGrowth(graph, 'agent_1', 'veil', 50, true, false);

    const ids = graph.getNodesByType('trait')
      .filter(n => n.properties.subcategory === 'experience')
      .map(n => n.id)
      .sort();
    expect(ids).toEqual(['trait.experience.iron', 'trait.experience.veil']);
  });

  // Saved worlds hold the pre-THR-1395 per-bearer node. Growth must land on the edge that
  // already exists, not open a second one — two edges for one trait double-count capability.
  it('accrues onto a legacy per-bearer experience edge instead of minting a second', () => {
    const graph = makeGraphWithAgent('agent_1');
    const legacyId = 'encounter_experience_iron_agent_1';
    graph.addNode({
      id: legacyId, type: 'trait', name: 'Experience (iron)',
      properties: {
        subcategory: 'experience', description: 'legacy', importance: 0.3, maxLevel: 100,
        visibility: 'discoverable', domainContributions: { iron: 1.0 } as DomainContributions,
        tags: ['experience'], flavorText: 'legacy',
      },
    });
    graph.addEdge({
      id: 'edge_experience_iron_agent_1', source: 'agent_1', target: legacyId,
      type: 'has_trait',
      properties: {
        level: 5, acquiredTick: 0, lastReinforcedTick: 0,
        source: 'encounter_growth', visibility: 'discoverable',
      },
    });

    applyEncounterGrowth(graph, 'agent_1', 'iron', 50, true, false);

    const edges = graph.getOutgoingEdges('agent_1', 'has_trait');
    expect(edges).toHaveLength(1);
    expect(edges[0].target).toBe(legacyId);
    expect(edges[0].properties.level as number).toBeGreaterThan(5);
    // The new shared definition is not minted alongside the legacy one.
    expect(graph.getNode('trait.experience.iron')).toBeUndefined();
  });

  it('accumulates on existing experience trait', () => {
    const graph = makeGraphWithAgent('agent_1');

    // First growth
    const r1 = applyEncounterGrowth(graph, 'agent_1', 'iron', 50, true, false);
    const firstLevel = r1.growthApplied;

    // Second growth
    const r2 = applyEncounterGrowth(graph, 'agent_1', 'iron', 50, true, false);

    // Check edge level accumulated
    const edges = graph.getOutgoingEdges('agent_1', 'has_trait');
    const expEdge = edges.find(e => e.target === 'trait.experience.iron');
    expect(expEdge).toBeDefined();
    const totalLevel = expEdge!.properties.level as number;
    expect(totalLevel).toBeGreaterThan(firstLevel);
  });

  it('detects tier crossing', () => {
    // Give agent a high base trait level so they're near a tier boundary
    const graph = makeGraphWithAgent('agent_1', 'iron', 8);

    // Apply large growth with promotion multiplier
    const result = applyEncounterGrowth(graph, 'agent_1', 'iron', 80, true, true);

    // The tier may or may not cross depending on exact sigmoid math,
    // but newCapability should be >= previousCapability
    expect(result.newCapability).toBeGreaterThanOrEqual(result.previousCapability);
    expect(result.growthApplied).toBeGreaterThan(0);
  });

  it('returns no tier crossing for small growth', () => {
    const graph = makeGraphWithAgent('agent_1', 'iron', 5);

    // Very small growth (low difficulty failure)
    const result = applyEncounterGrowth(graph, 'agent_1', 'iron', 10, false, false);

    // With such small growth, tier should not change
    expect(result.growthApplied).toBeGreaterThan(0);
    expect(result.previousTier).toBe(result.newTier);
    expect(result.tierCrossed).toBe(false);
  });

  it('returns zero growth for missing agent (fail-soft)', () => {
    const graph = new WorldGraph();
    const result = applyEncounterGrowth(graph, 'nonexistent', 'iron', 50, true, false);

    expect(result.growthApplied).toBe(0);
    expect(result.previousCapability).toBe(0);
    expect(result.newCapability).toBe(0);
    expect(result.tierCrossed).toBe(false);
  });

  // Phase 3: growthMultiplier wiring
  it('1.5x growthMultiplier produces 1.5× the default growth', () => {
    const graph1 = makeGraphWithAgent('agent_mult_1');
    const graph2 = makeGraphWithAgent('agent_mult_2');
    const base = applyEncounterGrowth(graph1, 'agent_mult_1', 'iron', 60, true, false, 1.0);
    const boosted = applyEncounterGrowth(graph2, 'agent_mult_2', 'iron', 60, true, false, 1.5);
    expect(boosted.growthApplied).toBeCloseTo(base.growthApplied * 1.5, 5);
  });

  it('0.5x growthMultiplier produces half the default growth', () => {
    const graph1 = makeGraphWithAgent('agent_half_1');
    const graph2 = makeGraphWithAgent('agent_half_2');
    const base = applyEncounterGrowth(graph1, 'agent_half_1', 'iron', 60, true, false, 1.0);
    const reduced = applyEncounterGrowth(graph2, 'agent_half_2', 'iron', 60, true, false, 0.5);
    expect(reduced.growthApplied).toBeCloseTo(base.growthApplied * 0.5, 5);
  });

  it('default growthMultiplier (omitted) behaves identically to 1.0', () => {
    const graph1 = makeGraphWithAgent('agent_def_1');
    const graph2 = makeGraphWithAgent('agent_def_2');
    const implicit = applyEncounterGrowth(graph1, 'agent_def_1', 'iron', 60, true, false);
    const explicit = applyEncounterGrowth(graph2, 'agent_def_2', 'iron', 60, true, false, 1.0);
    expect(implicit.growthApplied).toBeCloseTo(explicit.growthApplied, 10);
  });
});
