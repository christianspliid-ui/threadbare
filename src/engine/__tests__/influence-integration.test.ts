import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { generateArchetypes, createAscendant } from '../ascendant';
import {
  computeEssenceGeneration,
  generateEssence,
  computeMaxEssence,
  processInfluenceMaintenance,
  checkTierPromotion,
  getInfluenceTier,
  dropAgent,
  spendEssence,
} from '../influence';
import type { AscendantProperties } from '../../types/influence';
import { RECRUIT_COST } from '../../types/influence';
import { SPHERE_NAMES } from '../../types/index';

describe('Ascendant Lifecycle Integration', () => {
  it('full lifecycle: create → generate → recruit → maintain → promote → drop', () => {
    const graph = new WorldGraph();

    // ── Setup world ──
    graph.addNode({
      id: 'loc.grove',
      type: 'location',
      name: 'Sacred Grove',
      properties: { locationType: 'location' },
    });

    // ── Create Ascendant ──
    const archetypes = generateArchetypes(4, 42);
    const { ascendantId, avatarId } = createAscendant(graph, {
      archetype: archetypes[0],
      avatar: {
        name: 'Elder Sage',
        startLocationId: 'loc.grove',
        formDescription: 'A weathered old wizard',
      },
    });

    // Verify creation
    expect(graph.getNode(ascendantId)).toBeDefined();
    expect(graph.getNode(avatarId)).toBeDefined();

    // ── Generate essence over 10 ticks ──
    const ascNode = graph.getNode(ascendantId)!;
    const pool = (ascNode.properties as AscendantProperties).essencePool;
    const maxEssence = computeMaxEssence(graph, ascendantId);

    for (let tick = 0; tick < 10; tick++) {
      const gen = computeEssenceGeneration(graph, ascendantId);
      generateEssence(pool, gen, maxEssence);
    }

    // Should have ~10 total essence (1.0 per tick × 10 ticks)
    const totalEssence = SPHERE_NAMES.reduce((sum, s) => sum + pool[s], 0);
    expect(totalEssence).toBeCloseTo(10.0, 1);

    // Persist accumulated pool back to graph (pool is mutated in-place by generateEssence)
    graph.updateNode(ascendantId, {
      properties: { ...ascNode.properties, essencePool: pool },
    });

    // Ensure primary sphere has enough for recruitment
    const alignment = (ascNode.properties as AscendantProperties).sphereAlignment;
    if (pool[alignment.primary] < RECRUIT_COST) {
      pool[alignment.primary] = RECRUIT_COST + 1;
    }

    // ── Recruit an agent ──
    graph.addNode({
      id: 'actor.warrior',
      type: 'actor',
      name: 'Thane Volkar',
      properties: { actorType: 'individual' },
    });

    // Spend recruit cost from primary sphere
    const canRecruit = spendEssence(pool, alignment.primary, RECRUIT_COST);
    expect(canRecruit).toBe(true);

    // Establish thread edge at tier 1
    graph.addEdge({
      id: 'edge.thread.warrior',
      source: ascendantId,
      target: 'actor.warrior',
      type: 'thread',
      properties: {
        tier: 1,
        ticksAtCurrentTier: 0,
        establishedTick: 10,
        totalEssenceSpent: RECRUIT_COST,
        maintenanceCurrent: true,
      },
    });

    expect(getInfluenceTier(graph, ascendantId, 'actor.warrior')).toBe(1);

    // ── Process maintenance for 30 ticks (enough to promote to tier 2) ──
    for (let tick = 11; tick <= 40; tick++) {
      // Generate essence multiple times per tick to ensure the primary sphere
      // accumulates enough for tier-1 maintenance (0.5/tick). With 1 threaded agent,
      // total generation is 1.1/tick, but the primary sphere only gets 35% = 0.385,
      // which is below the 0.5 maintenance cost. In a real game, places of power
      // or more threaded agents would cover this gap.
      for (let i = 0; i < 5; i++) {
        const gen = computeEssenceGeneration(graph, ascendantId);
        generateEssence(pool, gen, computeMaxEssence(graph, ascendantId));
      }

      // Write pool back to node
      graph.updateNode(ascendantId, {
        properties: { ...ascNode.properties, essencePool: pool },
      });

      // Process maintenance
      const maintResult = processInfluenceMaintenance(graph, ascendantId, tick);
      expect(maintResult.maintenanceFailed).toHaveLength(0);

      // Check for promotions
      checkTierPromotion(graph, ascendantId);
    }

    // After 30 ticks of tier 1, should be promoted to tier 2
    expect(getInfluenceTier(graph, ascendantId, 'actor.warrior')).toBe(2);

    // ── Drop the agent ──
    // First add the scar trait definition
    graph.addNode({
      id: 'trait.abandoned_by_divine',
      type: 'trait',
      name: 'Abandoned by the Divine',
      properties: {
        subcategory: 'scar',
        description: 'Once touched by divine purpose, now cast adrift.',
        importance: 0.7,
        maxLevel: 1,
        visibility: 'public',
        domainContributions: { heart: -0.5, star: -0.3 },
        tags: ['divine', 'abandonment'],
        flavorText: 'The silence where a god once whispered.',
      },
    });

    const dropResult = dropAgent(graph, ascendantId, 'actor.warrior', 41);
    expect(dropResult.tierWhenDropped).toBe(2);
    expect(dropResult.narrativeConsequence).toBe('crisis_of_faith');
    expect(dropResult.scarTraitAssigned).toBe(true);

    // Relationship should be gone
    expect(getInfluenceTier(graph, ascendantId, 'actor.warrior')).toBe(0);

    // Scar trait should be on the agent
    const traitEdges = graph.getOutgoingEdges('actor.warrior', 'has_trait');
    expect(traitEdges.some((e) => e.target === 'trait.abandoned_by_divine')).toBe(true);
  });
});
