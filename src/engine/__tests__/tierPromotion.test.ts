import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  handleTierPromotion,
  PROMOTION_TRAITS,
  FACTION_RANK_PER_PROMOTION,
  FACTION_RANK_SECONDARY_FRACTION,
} from '../tierPromotion';
import { REACH_DOMAINS, type ReachDomain } from '../../types/traits';

function makeGraphWithAgent(agentId: string): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: agentId,
    type: 'actor',
    name: 'Test Agent',
    properties: { actorType: 'individual' },
  });
  return graph;
}

function addFaction(
  graph: WorldGraph,
  agentId: string,
  factionId: string,
  primaryReach: ReachDomain,
  secondaryReach: ReachDomain,
  initialRank: number = 0,
): void {
  const reachPreferences: Partial<Record<ReachDomain, number>> = {
    [primaryReach]: 0.8,
    [secondaryReach]: 0.5,
  };

  graph.addNode({
    id: factionId,
    type: 'actor',
    name: `Faction ${factionId}`,
    properties: {
      actorType: 'faction',
      reachPreferences,
    },
  });

  graph.addEdge({
    id: `edge_member_${agentId}_${factionId}`,
    source: agentId,
    target: factionId,
    type: 'member_of',
    properties: { rank: initialRank },
  });
}

describe('handleTierPromotion', () => {
  it('grants "Blooded" at tier 2 in iron', () => {
    const graph = makeGraphWithAgent('agent_1');
    const result = handleTierPromotion(graph, 'agent_1', 'iron', 2);

    expect(result.traitGranted).toBe('Blooded');

    // Verify trait node was created
    const traitNode = graph.getNode('promotion_iron_t2_agent_1');
    expect(traitNode).toBeDefined();
    expect(traitNode!.name).toBe('Blooded');
  });

  it('grants "Merchant Prince" at tier 4 in gold', () => {
    const graph = makeGraphWithAgent('agent_1');
    const result = handleTierPromotion(graph, 'agent_1', 'gold', 4);

    expect(result.traitGranted).toBe('Merchant Prince');
  });

  it('grants no trait at odd tiers (tier 3 has no entry)', () => {
    const graph = makeGraphWithAgent('agent_1');
    const result = handleTierPromotion(graph, 'agent_1', 'iron', 3);

    expect(result.traitGranted).toBeUndefined();
  });

  it('bumps faction rank when domain matches primary reach', () => {
    const graph = makeGraphWithAgent('agent_1');
    addFaction(graph, 'agent_1', 'faction_iron', 'iron', 'gold', 0.5);

    const result = handleTierPromotion(graph, 'agent_1', 'iron', 2);

    expect(result.factionRankChanges.length).toBe(1);
    expect(result.factionRankChanges[0].factionId).toBe('faction_iron');
    expect(result.factionRankChanges[0].oldRank).toBe(0.5);
    expect(result.factionRankChanges[0].newRank).toBeCloseTo(0.5 + FACTION_RANK_PER_PROMOTION);
  });

  it('applies secondary fraction for non-primary match', () => {
    const graph = makeGraphWithAgent('agent_1');
    // Faction's primary is iron, secondary is gold
    addFaction(graph, 'agent_1', 'faction_iron', 'iron', 'gold', 0.5);

    // Promote in gold (secondary reach)
    const result = handleTierPromotion(graph, 'agent_1', 'gold', 2);

    expect(result.factionRankChanges.length).toBe(1);
    expect(result.factionRankChanges[0].newRank).toBeCloseTo(0.5 + FACTION_RANK_SECONDARY_FRACTION);
  });

  it('returns empty result when no faction membership', () => {
    const graph = makeGraphWithAgent('agent_1');
    const result = handleTierPromotion(graph, 'agent_1', 'iron', 2);

    expect(result.factionRankChanges).toEqual([]);
    expect(result.traitGranted).toBe('Blooded'); // Still grants trait
  });

  it('returns empty result for missing agent (fail-soft)', () => {
    const graph = new WorldGraph();
    const result = handleTierPromotion(graph, 'nonexistent', 'iron', 2);

    expect(result.traitGranted).toBeUndefined();
    expect(result.factionRankChanges).toEqual([]);
  });

  it('has entries in PROMOTION_TRAITS for all 9 reaches', () => {
    for (const domain of REACH_DOMAINS) {
      const traits = PROMOTION_TRAITS[domain];
      expect(traits).toBeDefined();
      // Each reach should have at least tier 2 and tier 10 entries
      expect(traits[2]).toBeDefined();
      expect(traits[10]).toBeDefined();
      // Tier 10 should be an "Avatar of" title
      expect(traits[10]).toMatch(/^Avatar of /);
    }
  });
});
