import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { getRetinueAgents, getThreadedNodes, groupThreadedNodes } from '../retinue';
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

    // Add thread edge with tier 0
    graph.addEdge({
      id: 'thread.1',
      source: ascendantId,
      target: 'actor.aware',
      type: 'thread',
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

  it('excludes agents without thread edge', () => {
    // Create agent but no thread edge
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
        id: `thread.tier${tier}`,
        source: ascendantId,
        target: agentId,
        type: 'thread',
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
      id: 'thread.located',
      source: ascendantId,
      target: 'actor.located',
      type: 'thread',
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
      id: 'thread.profile',
      source: ascendantId,
      target: 'actor.profile',
      type: 'thread',
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
      id: 'thread.caps',
      source: ascendantId,
      target: 'actor.caps',
      type: 'thread',
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
        id: `thread.tiernamed${tier}`,
        source: ascendantId,
        target: agentId,
        type: 'thread',
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
      id: 'thread.member',
      source: ascendantId,
      target: 'actor.member',
      type: 'thread',
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
      id: 'thread.nofaction',
      source: ascendantId,
      target: 'actor.nofaction',
      type: 'thread',
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
        id: `thread.${agent.id}`,
        source: ascendantId,
        target: agent.id,
        type: 'thread',
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

describe('getThreadedNodes', () => {
  let graph: WorldGraph;
  const ascendantId = 'ascendant.test';

  function makeThreadEdge(id: string, targetId: string, tier: number = 1) {
    graph.addEdge({
      id,
      source: ascendantId,
      target: targetId,
      type: 'thread',
      properties: {
        tier,
        ticksAtCurrentTier: 0,
        establishedTick: 0,
        totalEssenceSpent: 0,
        maintenanceCurrent: false,
        readBackstoryTier: 0,
      },
    });
  }

  beforeEach(() => {
    graph = new WorldGraph();
    graph.addNode({
      id: ascendantId,
      type: 'actor',
      name: 'Divine Being',
      properties: { actorType: 'ascendant' },
    });
  });

  it('returns empty array when no thread edges exist', () => {
    const result = getThreadedNodes(graph, ascendantId);
    expect(result).toEqual([]);
  });

  it('excludes tier-0 thread targets', () => {
    graph.addNode({
      id: 'actor.tier0',
      type: 'actor',
      name: 'Tier Zero',
      properties: { actorType: 'individual' },
    });
    makeThreadEdge('thread.tier0', 'actor.tier0', 0);
    const result = getThreadedNodes(graph, ascendantId);
    expect(result).toHaveLength(0);
  });

  it('classifies individual actors as category agent', () => {
    graph.addNode({
      id: 'actor.agent1',
      type: 'actor',
      name: 'Seraphel',
      properties: { actorType: 'individual' },
    });
    makeThreadEdge('thread.agent1', 'actor.agent1', 1);
    const result = getThreadedNodes(graph, ascendantId);
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe('agent');
    expect(result[0].name).toBe('Seraphel');
  });

  it('classifies faction actors as category faction', () => {
    graph.addNode({
      id: 'actor.faction1',
      type: 'actor',
      name: 'Iron Brotherhood',
      properties: { actorType: 'faction' },
    });
    makeThreadEdge('thread.faction1', 'actor.faction1', 2);
    const result = getThreadedNodes(graph, ascendantId);
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe('faction');
    expect(result[0].name).toBe('Iron Brotherhood');
  });

  it('classifies group actors WITH armyState as category army', () => {
    graph.addNode({
      id: 'actor.army1',
      type: 'actor',
      name: 'Third Legion',
      properties: {
        actorType: 'group',
        armyState: { size: 500, objective: 'March north' },
      },
    });
    makeThreadEdge('thread.army1', 'actor.army1', 1);
    const result = getThreadedNodes(graph, ascendantId);
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe('army');
    if (result[0].category === 'army') {
      expect(result[0].size).toBe(500);
      expect(result[0].objective).toBe('March north');
    }
  });

  it('does NOT classify group actors WITHOUT armyState (skips them)', () => {
    graph.addNode({
      id: 'actor.group1',
      type: 'actor',
      name: 'Guild Group',
      properties: {
        actorType: 'group',
        // no armyState
      },
    });
    makeThreadEdge('thread.group1', 'actor.group1', 1);
    const result = getThreadedNodes(graph, ascendantId);
    expect(result).toHaveLength(0);
  });

  it('classifies location nodes as category location', () => {
    graph.addNode({
      id: 'loc.thornwall',
      type: 'location',
      name: 'Thornwall',
      properties: { hexCol: 5, hexRow: 3, prosperityScore: 60 },
    });
    makeThreadEdge('thread.thornwall', 'loc.thornwall', 1);
    const result = getThreadedNodes(graph, ascendantId);
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe('location');
    if (result[0].category === 'location') {
      expect(result[0].prosperityLabel).toBe('Stable');
    }
  });

  it('classifies artifact and artifact_legendary nodes as category artifact', () => {
    graph.addNode({
      id: 'artifact.sword',
      type: 'artifact',
      name: 'Sword of Dawn',
      properties: {},
    });
    graph.addNode({
      id: 'artifact.crown',
      type: 'artifact_legendary',
      name: 'Crown of Eternity',
      properties: {},
    });
    makeThreadEdge('thread.sword', 'artifact.sword', 1);
    makeThreadEdge('thread.crown', 'artifact.crown', 2);
    const result = getThreadedNodes(graph, ascendantId);
    expect(result).toHaveLength(2);
    expect(result.every(n => n.category === 'artifact')).toBe(true);
  });

  it('sorts results by tier descending then name ascending', () => {
    graph.addNode({
      id: 'actor.zeta',
      type: 'actor',
      name: 'Zeta',
      properties: { actorType: 'individual' },
    });
    graph.addNode({
      id: 'actor.alpha',
      type: 'actor',
      name: 'Alpha',
      properties: { actorType: 'individual' },
    });
    graph.addNode({
      id: 'actor.beta',
      type: 'actor',
      name: 'Beta',
      properties: { actorType: 'individual' },
    });
    makeThreadEdge('thread.zeta', 'actor.zeta', 1);
    makeThreadEdge('thread.alpha', 'actor.alpha', 3);
    makeThreadEdge('thread.beta', 'actor.beta', 1);
    const result = getThreadedNodes(graph, ascendantId);
    expect(result).toHaveLength(3);
    expect(result[0].name).toBe('Alpha'); // tier 3 first
    expect(result[1].name).toBe('Beta');  // tier 1, B before Z
    expect(result[2].name).toBe('Zeta');  // tier 1, Z last
  });

  it('groupThreadedNodes groups by category correctly', () => {
    graph.addNode({
      id: 'actor.agent2',
      type: 'actor',
      name: 'Agent One',
      properties: { actorType: 'individual' },
    });
    graph.addNode({
      id: 'actor.faction2',
      type: 'actor',
      name: 'Iron Guard',
      properties: { actorType: 'faction' },
    });
    graph.addNode({
      id: 'loc.grove',
      type: 'location',
      name: 'Sacred Grove',
      properties: {},
    });
    makeThreadEdge('thread.a2', 'actor.agent2', 1);
    makeThreadEdge('thread.f2', 'actor.faction2', 1);
    makeThreadEdge('thread.l2', 'loc.grove', 1);

    const nodes = getThreadedNodes(graph, ascendantId);
    const groups = groupThreadedNodes(nodes);
    expect(groups.agent).toHaveLength(1);
    expect(groups.faction).toHaveLength(1);
    expect(groups.location).toHaveLength(1);
    expect(groups.army).toHaveLength(0);
    expect(groups.artifact).toHaveLength(0);
  });

  it('faction entries include dominantSphere resolved from territory sphere data', () => {
    // Create faction
    graph.addNode({
      id: 'actor.faction3',
      type: 'actor',
      name: 'Flame Council',
      properties: { actorType: 'faction' },
    });
    // Create a controlled location with sphere affinity data
    graph.addNode({
      id: 'loc.volcano',
      type: 'location',
      name: 'Volcano Peak',
      properties: {
        sphereAffinity: {
          scores: { force: 8, life: 2, mind: 1 },
        },
      },
    });
    // Connect faction → controls → location
    graph.addEdge({
      id: 'controls.1',
      source: 'actor.faction3',
      target: 'loc.volcano',
      type: 'controls',
      properties: {},
    });
    makeThreadEdge('thread.f3', 'actor.faction3', 2);

    const result = getThreadedNodes(graph, ascendantId);
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe('faction');
    if (result[0].category === 'faction') {
      expect(result[0].dominantSphere).toBe('force');
    }
  });

  it('faction entries have dominantSphere null when no sphere data available', () => {
    graph.addNode({
      id: 'actor.faction4',
      type: 'actor',
      name: 'Empty Faction',
      properties: { actorType: 'faction' },
    });
    makeThreadEdge('thread.f4', 'actor.faction4', 1);

    const result = getThreadedNodes(graph, ascendantId);
    expect(result).toHaveLength(1);
    if (result[0].category === 'faction') {
      expect(result[0].dominantSphere).toBeNull();
    }
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
    preservation_transformation: -0.2,
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
