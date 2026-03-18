import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { getRetinueAgents } from '../retinue';
import type { RetinueAgent } from '../retinue';
import type { AxiologicalProfile } from '../../types/agent';
import type { ReachDomain } from '../../types/traits';

describe('getRetinueAgents', () => {
  let graph: WorldGraph;
  let ascendantId: string;
  let locationId: string;

  beforeEach(() => {
    graph = new WorldGraph();
    ascendantId = 'ascendant.test';
    locationId = 'loc.grove';

    // Create ascendant node
    graph.addNode({
      id: ascendantId,
      type: 'actor',
      name: 'Divine Being',
      properties: {
        actorType: 'ascendant',
      },
    });

    // Create location node
    graph.addNode({
      id: locationId,
      type: 'location',
      name: 'Sacred Grove',
      properties: {
        locationType: 'location',
      },
    });
  });

  it('returns empty array when no influenced agents', () => {
    const result = getRetinueAgents(graph, ascendantId);
    expect(result).toEqual([]);
  });

  it('excludes tier 0 agents (unaware)', () => {
    // Create agent with tier 0
    graph.addNode({
      id: 'actor.aware',
      type: 'actor',
      name: 'Aware One',
      properties: {
        actorType: 'individual',
        axiologicalProfile: createTestProfile(),
        domainCapabilities: createTestDomainCapabilities(),
        locationId,
      },
    });

    // Add worships edge with tier 0
    graph.addEdge({
      id: 'worships.1',
      source: 'actor.aware',
      target: ascendantId,
      type: 'worships',
      properties: {
        tier: 0,
        ticksAtCurrentTier: 0,
        establishedTick: 0,
        totalEssenceSpent: 0,
        maintenanceCurrent: false,
      },
    });

    const result = getRetinueAgents(graph, ascendantId);
    expect(result).toHaveLength(0);
  });

  it('excludes agents without worships edge', () => {
    // Create agent but no worships edge
    graph.addNode({
      id: 'actor.unlinked',
      type: 'actor',
      name: 'Unlinked One',
      properties: {
        actorType: 'individual',
        axiologicalProfile: createTestProfile(),
        domainCapabilities: createTestDomainCapabilities(),
        locationId,
      },
    });

    const result = getRetinueAgents(graph, ascendantId);
    expect(result).toHaveLength(0);
  });

  it('includes agents with tier >= 1', () => {
    const tiers: (1 | 2 | 3 | 4)[] = [1, 2, 3, 4];

    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      const agentId = `actor.tier${tier}`;
      const agentName = `Tier ${tier} Agent`;

      graph.addNode({
        id: agentId,
        type: 'actor',
        name: agentName,
        properties: {
          actorType: 'individual',
          axiologicalProfile: createTestProfile(),
          domainCapabilities: createTestDomainCapabilities(),
          locationId,
        },
      });

      graph.addEdge({
        id: `worships.tier${tier}`,
        source: agentId,
        target: ascendantId,
        type: 'worships',
        properties: {
          tier,
          ticksAtCurrentTier: 10,
          establishedTick: 0,
          totalEssenceSpent: tier * 5,
          maintenanceCurrent: true,
        },
      });
    }

    const result = getRetinueAgents(graph, ascendantId);
    expect(result).toHaveLength(4);
  });

  it('includes location name from graph', () => {
    graph.addNode({
      id: 'actor.located',
      type: 'actor',
      name: 'Located Agent',
      properties: {
        actorType: 'individual',
        axiologicalProfile: createTestProfile(),
        domainCapabilities: createTestDomainCapabilities(),
        locationId,
      },
    });

    graph.addEdge({
      id: 'worships.located',
      source: 'actor.located',
      target: ascendantId,
      type: 'worships',
      properties: {
        tier: 1,
        ticksAtCurrentTier: 0,
        establishedTick: 0,
        totalEssenceSpent: 0,
        maintenanceCurrent: false,
      },
    });

    const result = getRetinueAgents(graph, ascendantId);
    expect(result).toHaveLength(1);
    expect(result[0].locationName).toBe('Sacred Grove');
  });

  it('includes axiological profile', () => {
    const profile = createTestProfile();

    graph.addNode({
      id: 'actor.profile',
      type: 'actor',
      name: 'Profile Agent',
      properties: {
        actorType: 'individual',
        axiologicalProfile: profile,
        domainCapabilities: createTestDomainCapabilities(),
        locationId,
      },
    });

    graph.addEdge({
      id: 'worships.profile',
      source: 'actor.profile',
      target: ascendantId,
      type: 'worships',
      properties: {
        tier: 1,
        ticksAtCurrentTier: 0,
        establishedTick: 0,
        totalEssenceSpent: 0,
        maintenanceCurrent: false,
      },
    });

    const result = getRetinueAgents(graph, ascendantId);
    expect(result).toHaveLength(1);
    expect(result[0].profile).toEqual(profile);
  });

  it('includes domain capabilities', () => {
    const caps = createTestDomainCapabilities();

    graph.addNode({
      id: 'actor.caps',
      type: 'actor',
      name: 'Capable Agent',
      properties: {
        actorType: 'individual',
        axiologicalProfile: createTestProfile(),
        domainCapabilities: caps,
        locationId,
      },
    });

    graph.addEdge({
      id: 'worships.caps',
      source: 'actor.caps',
      target: ascendantId,
      type: 'worships',
      properties: {
        tier: 1,
        ticksAtCurrentTier: 0,
        establishedTick: 0,
        totalEssenceSpent: 0,
        maintenanceCurrent: false,
      },
    });

    const result = getRetinueAgents(graph, ascendantId);
    expect(result).toHaveLength(1);
    expect(result[0].domainCapabilities).toEqual(caps);
  });

  it('includes tier name based on tier number', () => {
    const tierNames = ['', 'Touched', 'Devoted', 'Champion', 'Aspect'];

    for (let tier = 1; tier <= 4; tier++) {
      const agentId = `actor.tiernamed${tier}`;

      graph.addNode({
        id: agentId,
        type: 'actor',
        name: `Tier ${tier}`,
        properties: {
          actorType: 'individual',
          axiologicalProfile: createTestProfile(),
          domainCapabilities: createTestDomainCapabilities(),
          locationId,
        },
      });

      graph.addEdge({
        id: `worships.tiernamed${tier}`,
        source: agentId,
        target: ascendantId,
        type: 'worships',
        properties: {
          tier: tier as 1 | 2 | 3 | 4,
          ticksAtCurrentTier: 0,
          establishedTick: 0,
          totalEssenceSpent: 0,
          maintenanceCurrent: false,
        },
      });
    }

    const result = getRetinueAgents(graph, ascendantId);
    // Results are sorted by tier descending, so tiers come back as 4,3,2,1
    expect(result[0].tier).toBe(4);
    expect(result[0].tierName).toBe('Aspect');
    expect(result[1].tier).toBe(3);
    expect(result[1].tierName).toBe('Champion');
    expect(result[2].tier).toBe(2);
    expect(result[2].tierName).toBe('Devoted');
    expect(result[3].tier).toBe(1);
    expect(result[3].tierName).toBe('Touched');
  });

  it('includes faction name from member_of edge', () => {
    const factionId = 'faction.shadowblades';

    graph.addNode({
      id: factionId,
      type: 'actor',
      name: 'Shadowblades',
      properties: {
        actorType: 'faction',
      },
    });

    graph.addNode({
      id: 'actor.member',
      type: 'actor',
      name: 'Member Agent',
      properties: {
        actorType: 'individual',
        axiologicalProfile: createTestProfile(),
        domainCapabilities: createTestDomainCapabilities(),
        locationId,
      },
    });

    // Add member_of edge from agent to faction
    graph.addEdge({
      id: 'member.1',
      source: 'actor.member',
      target: factionId,
      type: 'member_of',
      properties: {},
    });

    graph.addEdge({
      id: 'worships.member',
      source: 'actor.member',
      target: ascendantId,
      type: 'worships',
      properties: {
        tier: 1,
        ticksAtCurrentTier: 0,
        establishedTick: 0,
        totalEssenceSpent: 0,
        maintenanceCurrent: false,
      },
    });

    const result = getRetinueAgents(graph, ascendantId);
    expect(result).toHaveLength(1);
    expect(result[0].factionName).toBe('Shadowblades');
  });

  it('includes null for faction name when agent has no faction', () => {
    graph.addNode({
      id: 'actor.nofaction',
      type: 'actor',
      name: 'Lone Agent',
      properties: {
        actorType: 'individual',
        axiologicalProfile: createTestProfile(),
        domainCapabilities: createTestDomainCapabilities(),
        locationId,
      },
    });

    graph.addEdge({
      id: 'worships.nofaction',
      source: 'actor.nofaction',
      target: ascendantId,
      type: 'worships',
      properties: {
        tier: 1,
        ticksAtCurrentTier: 0,
        establishedTick: 0,
        totalEssenceSpent: 0,
        maintenanceCurrent: false,
      },
    });

    const result = getRetinueAgents(graph, ascendantId);
    expect(result).toHaveLength(1);
    expect(result[0].factionName).toBeNull();
  });

  it('sorts by tier descending, then name ascending', () => {
    // Create agents in mixed order with same and different tiers
    const agents = [
      { id: 'actor.a', name: 'Zeta', tier: 2 },
      { id: 'actor.b', name: 'Alpha', tier: 3 },
      { id: 'actor.c', name: 'Beta', tier: 2 },
      { id: 'actor.d', name: 'Delta', tier: 1 },
    ];

    for (const agent of agents) {
      graph.addNode({
        id: agent.id,
        type: 'actor',
        name: agent.name,
        properties: {
          actorType: 'individual',
          axiologicalProfile: createTestProfile(),
          domainCapabilities: createTestDomainCapabilities(),
          locationId,
        },
      });

      graph.addEdge({
        id: `worships.${agent.id}`,
        source: agent.id,
        target: ascendantId,
        type: 'worships',
        properties: {
          tier: agent.tier as 1 | 2 | 3 | 4,
          ticksAtCurrentTier: 0,
          establishedTick: 0,
          totalEssenceSpent: 0,
          maintenanceCurrent: false,
        },
      });
    }

    const result = getRetinueAgents(graph, ascendantId);
    expect(result).toHaveLength(4);

    // Should be sorted: tier 3 first, then tier 2 (Beta, Zeta), then tier 1
    expect(result[0].tier).toBe(3);
    expect(result[0].name).toBe('Alpha');

    expect(result[1].tier).toBe(2);
    expect(result[1].name).toBe('Beta');

    expect(result[2].tier).toBe(2);
    expect(result[2].name).toBe('Zeta');

    expect(result[3].tier).toBe(1);
    expect(result[3].name).toBe('Delta');
  });
});

// ─── Helpers ───────────────────────────────────────────

function createTestProfile(): AxiologicalProfile {
  return {
    loyalty_ambition: 0.2,
    courage_prudence: -0.1,
    mercy_ruthlessness: 0.3,
    honesty_cunning: -0.5,
    sacrifice_survival: 0.7,
    loyalty_ambition: 0.9,
    tradition_novelty: 0.1,
    humility_pride: -0.2,
    mercy_ruthlessness: 0.4,
    asceticism_extravagance: -0.3,
  };
}

function createTestDomainCapabilities(): Record<ReachDomain, number> {
  return {
    iron: 5,
    gold: 7,
    shadow: 3,
    veil: 8,
    heart: 6,
    eye: 9,
    stone: 4,
    star: 7,
    flesh: 6,
  };
}
