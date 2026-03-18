import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { getAgentDetail, getAgentInfoCard, getAgentFullProfile } from '../agentDetail';
import type { AgentDetail } from '../agentDetail';
import type { AxiologicalProfile } from '../../types/agent';
import type { ReachDomain } from '../../types/traits';
import type { InteractionRecord } from '../../types/disposition';

const ALL_DOMAINS: ReachDomain[] = ['iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star', 'flesh'];

function makeProfile(overrides: Partial<AxiologicalProfile> = {}): AxiologicalProfile {
  const base: AxiologicalProfile = {
    loyalty_ambition: 0, courage_prudence: 0, mercy_ruthlessness: 0,
    honesty_cunning: 0, sacrifice_survival: 0, loyalty_ambition: 0,
    tradition_novelty: 0, humility_pride: 0, mercy_ruthlessness: 0, asceticism_extravagance: 0,
  };
  return { ...base, ...overrides };
}

function makeDomainCaps(overrides: Partial<Record<ReachDomain, number>> = {}): Record<ReachDomain, number> {
  const base: Record<ReachDomain, number> = {} as any;
  for (const d of ALL_DOMAINS) base[d] = 0;
  return { ...base, ...overrides };
}

describe('getAgentDetail', () => {
  it('returns null for non-existent agent', () => {
    const graph = new WorldGraph();
    expect(getAgentDetail(graph, 'nonexistent', 'asc')).toBeNull();
  });

  it('aggregates basic agent data', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'asc', type: 'actor', name: 'The God', properties: { actorType: 'ascendant' } });
    graph.addNode({
      id: 'agent.1', type: 'actor', name: 'Kael',
      properties: {
        actorType: 'individual',
        axiologicalProfile: makeProfile({ loyalty_ambition: 0.8, mercy_ruthlessness: -0.6 }),
        domainCapabilities: makeDomainCaps({ iron: 7, shadow: 5, heart: 3 }),
        locationId: 'loc.1',
        narrativeArchetype: 'tragic_hero',
      },
    });
    graph.addNode({ id: 'loc.1', type: 'location', name: 'Ashvale', properties: {} });
    graph.addEdge({ id: 'w.1', source: 'agent.1', target: 'asc', type: 'worships', properties: { tier: 2 } });

    const detail = getAgentDetail(graph, 'agent.1', 'asc');
    expect(detail).not.toBeNull();
    expect(detail!.name).toBe('Kael');
    expect(detail!.tier).toBe(2);
    expect(detail!.locationName).toBe('Ashvale');
    expect(detail!.archetype).toBeDefined();
    expect(detail!.archetype!.name).toBe('Tragic Hero');
  });

  it('returns top 3 axiological values sorted by absolute magnitude', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'asc', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
    graph.addNode({
      id: 'agent.1', type: 'actor', name: 'Test',
      properties: {
        actorType: 'individual',
        axiologicalProfile: makeProfile({ loyalty_ambition: 0.9, mercy_ruthlessness: -0.7, sacrifice_survival: 0.5, mercy_ruthlessness: 0.2 }),
        domainCapabilities: makeDomainCaps(),
        locationId: 'loc.1',
      },
    });
    graph.addNode({ id: 'loc.1', type: 'location', name: 'Here', properties: {} });
    graph.addEdge({ id: 'w.1', source: 'agent.1', target: 'asc', type: 'worships', properties: { tier: 1 } });

    const detail = getAgentDetail(graph, 'agent.1', 'asc')!;
    expect(detail.topValues).toHaveLength(3);
    expect(Math.abs(detail.topValues[0].value)).toBeGreaterThanOrEqual(Math.abs(detail.topValues[1].value));
  });

  it('includes top 5 relationships from bonds', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'asc', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
    graph.addNode({
      id: 'agent.1', type: 'actor', name: 'Kael',
      properties: { actorType: 'individual', axiologicalProfile: makeProfile(), domainCapabilities: makeDomainCaps(), locationId: 'loc.1' },
    });
    graph.addNode({ id: 'loc.1', type: 'location', name: 'Here', properties: {} });
    graph.addEdge({ id: 'w.1', source: 'agent.1', target: 'asc', type: 'worships', properties: { tier: 1 } });
    for (let i = 2; i <= 7; i++) {
      graph.addNode({ id: `agent.${i}`, type: 'actor', name: `Agent ${i}`, properties: { actorType: 'individual' } });
      graph.addEdge({ id: `rel.${i}`, source: 'agent.1', target: `agent.${i}`, type: 'relationship', properties: { sentiment: (i % 2 === 0) ? 0.5 : -0.3, strength: 0.4 + i * 0.05, basis: 'friendship' } });
    }
    const detail = getAgentDetail(graph, 'agent.1', 'asc')!;
    expect(detail.topBonds.length).toBeLessThanOrEqual(5);
  });

  it('handles missing archetype gracefully', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'asc', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
    graph.addNode({
      id: 'agent.1', type: 'actor', name: 'NoArch',
      properties: { actorType: 'individual', axiologicalProfile: makeProfile(), domainCapabilities: makeDomainCaps(), locationId: 'loc.1' },
    });
    graph.addNode({ id: 'loc.1', type: 'location', name: 'Here', properties: {} });
    graph.addEdge({ id: 'w.1', source: 'agent.1', target: 'asc', type: 'worships', properties: { tier: 1 } });
    const detail = getAgentDetail(graph, 'agent.1', 'asc')!;
    expect(detail.archetype).toBeNull();
  });

  it('includes faction name from member_of edge', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'asc', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
    graph.addNode({
      id: 'agent.1', type: 'actor', name: 'Kael',
      properties: { actorType: 'individual', axiologicalProfile: makeProfile(), domainCapabilities: makeDomainCaps(), locationId: 'loc.1' },
    });
    graph.addNode({ id: 'loc.1', type: 'location', name: 'Here', properties: {} });
    graph.addNode({ id: 'fac.1', type: 'actor', name: 'Iron Brotherhood', properties: { actorType: 'faction' } });
    graph.addEdge({ id: 'w.1', source: 'agent.1', target: 'asc', type: 'worships', properties: { tier: 3 } });
    graph.addEdge({ id: 'm.1', source: 'agent.1', target: 'fac.1', type: 'member_of', properties: { role: 'member' } });
    const detail = getAgentDetail(graph, 'agent.1', 'asc')!;
    expect(detail.factionName).toBe('Iron Brotherhood');
  });

  it('includes cooperation strategy and reputation score', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'asc', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
    graph.addNode({
      id: 'agent.1', type: 'actor', name: 'Kael',
      properties: {
        actorType: 'individual',
        axiologicalProfile: makeProfile(),
        domainCapabilities: makeDomainCaps(),
        locationId: 'loc.1',
        cooperationStrategy: 'tit-for-tat',
        reputationScore: 0.72,
      },
    });
    graph.addNode({ id: 'loc.1', type: 'location', name: 'Here', properties: {} });
    graph.addEdge({ id: 'w.1', source: 'agent.1', target: 'asc', type: 'worships', properties: { tier: 1 } });

    const detail = getAgentDetail(graph, 'agent.1', 'asc')!;
    expect(detail.cooperationStrategy).toBe('tit-for-tat');
    expect(detail.reputationScore).toBe(0.72);
  });

  it('defaults reputation to 0.5 when not set', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'asc', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
    graph.addNode({
      id: 'agent.1', type: 'actor', name: 'Kael',
      properties: { actorType: 'individual', axiologicalProfile: makeProfile(), domainCapabilities: makeDomainCaps(), locationId: 'loc.1' },
    });
    graph.addNode({ id: 'loc.1', type: 'location', name: 'Here', properties: {} });
    graph.addEdge({ id: 'w.1', source: 'agent.1', target: 'asc', type: 'worships', properties: { tier: 1 } });

    const detail = getAgentDetail(graph, 'agent.1', 'asc')!;
    expect(detail.cooperationStrategy).toBeNull();
    expect(detail.reputationScore).toBe(0.5);
  });

  it('gathers recent interactions from relates_to edges (both directions)', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'asc', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
    graph.addNode({
      id: 'agent.1', type: 'actor', name: 'Kael',
      properties: {
        actorType: 'individual',
        axiologicalProfile: makeProfile(),
        domainCapabilities: makeDomainCaps(),
        locationId: 'loc.1',
        cooperationStrategy: 'grudger',
        reputationScore: 0.3,
      },
    });
    graph.addNode({ id: 'agent.2', type: 'actor', name: 'Mara', properties: { actorType: 'individual' } });
    graph.addNode({ id: 'agent.3', type: 'actor', name: 'Zorn', properties: { actorType: 'individual' } });
    graph.addNode({ id: 'loc.1', type: 'location', name: 'Here', properties: {} });
    graph.addEdge({ id: 'w.1', source: 'agent.1', target: 'asc', type: 'worships', properties: { tier: 2 } });

    const log1: InteractionRecord[] = [
      { tick: 10, actorMove: 'cooperate', targetMove: 'cooperate', context: 'trade', stakes: 'low' },
      { tick: 5, actorMove: 'defect', targetMove: 'cooperate', context: 'war', stakes: 'high' },
    ];
    const log2: InteractionRecord[] = [
      { tick: 8, actorMove: 'cooperate', targetMove: 'defect', context: 'diplomacy', stakes: 'high' },
      { tick: 3, actorMove: 'defect', targetMove: 'defect', context: 'siege', stakes: 'high' },
    ];

    // Outgoing edge from agent.1
    graph.addEdge({ id: 'rt.1', source: 'agent.1', target: 'agent.2', type: 'relates_to', properties: { interactionLog: log1 } });
    // Incoming edge to agent.1
    graph.addEdge({ id: 'rt.2', source: 'agent.3', target: 'agent.1', type: 'relates_to', properties: { interactionLog: log2 } });

    const detail = getAgentDetail(graph, 'agent.1', 'asc')!;
    expect(detail.recentInteractions).toHaveLength(3); // top 3 by tick
    expect(detail.recentInteractions[0].tick).toBe(10);
    expect(detail.recentInteractions[1].tick).toBe(8);
    expect(detail.recentInteractions[2].tick).toBe(5);
  });

  it('returns empty interactions when no relates_to edges exist', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'asc', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
    graph.addNode({
      id: 'agent.1', type: 'actor', name: 'Loner',
      properties: { actorType: 'individual', axiologicalProfile: makeProfile(), domainCapabilities: makeDomainCaps(), locationId: 'loc.1' },
    });
    graph.addNode({ id: 'loc.1', type: 'location', name: 'Here', properties: {} });
    graph.addEdge({ id: 'w.1', source: 'agent.1', target: 'asc', type: 'worships', properties: { tier: 1 } });

    const detail = getAgentDetail(graph, 'agent.1', 'asc')!;
    expect(detail.recentInteractions).toHaveLength(0);
  });
});

describe('getAgentInfoCard (familiarity-gated)', () => {
  it('at stranger level: returns only name, location, sphere', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'asc', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
    graph.addNode({
      id: 'agent.1', type: 'actor', name: 'Kael',
      properties: {
        actorType: 'individual',
        axiologicalProfile: makeProfile({ loyalty_ambition: 0.8 }),
        domainCapabilities: makeDomainCaps({ iron: 7 }),
        locationId: 'loc.1',
        narrativeArchetype: 'tragic_hero',
        primarySphere: 'iron',
      },
    });
    graph.addNode({ id: 'loc.1', type: 'location', name: 'Ashvale', properties: {} });
    graph.addEdge({ id: 'w.1', source: 'agent.1', target: 'asc', type: 'worships', properties: { tier: 1 } });

    const card = getAgentInfoCard(graph, 'agent.1', 'asc', 'stranger');
    expect(card).not.toBeNull();
    expect(card!.name).toBe('Kael');
    expect(card!.locationName).toBe('Ashvale');
    expect(card!.primarySphere).toBe('iron');
    expect(card!.knowledgeLevel).toBe('stranger');
    expect(card!.archetypeLabel).toBeUndefined();
    expect(card!.domains).toBeUndefined();
    expect(card!.topValues).toBeUndefined();
    expect(card!.topBonds).toBeUndefined();
  });

  it('at recognised level: returns archetype, faction, 1 domain (vague), 1 value', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'asc', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
    graph.addNode({
      id: 'agent.1', type: 'actor', name: 'Kael',
      properties: {
        actorType: 'individual',
        axiologicalProfile: makeProfile({ loyalty_ambition: 0.8, mercy_ruthlessness: -0.6 }),
        domainCapabilities: makeDomainCaps({ iron: 7, shadow: 5, heart: 3 }),
        locationId: 'loc.1',
        narrativeArchetype: 'tragic_hero',
        primarySphere: 'iron',
      },
    });
    graph.addNode({ id: 'loc.1', type: 'location', name: 'Ashvale', properties: {} });
    graph.addNode({ id: 'fac.1', type: 'actor', name: 'Iron Brotherhood', properties: { actorType: 'faction' } });
    graph.addEdge({ id: 'w.1', source: 'agent.1', target: 'asc', type: 'worships', properties: { tier: 1 } });
    graph.addEdge({ id: 'm.1', source: 'agent.1', target: 'fac.1', type: 'member_of', properties: { role: 'member' } });

    const card = getAgentInfoCard(graph, 'agent.1', 'asc', 'recognised');
    expect(card).not.toBeNull();
    expect(card!.name).toBe('Kael');
    expect(card!.archetypeLabel).toBe('Tragic Hero');
    expect(card!.factionName).toBe('Iron Brotherhood');
    expect(card!.topValues).toHaveLength(1);
    expect(card!.domains).toHaveLength(1);
    expect(card!.topBonds).toBeUndefined();
  });

  it('at known level: returns top 3 domains + all dominant values + key bonds + 1 quote', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'asc', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
    graph.addNode({
      id: 'agent.1', type: 'actor', name: 'Kael',
      properties: {
        actorType: 'individual',
        axiologicalProfile: makeProfile({ loyalty_ambition: 0.8, mercy_ruthlessness: -0.6, sacrifice_survival: 0.5 }),
        domainCapabilities: makeDomainCaps({ iron: 7, shadow: 5, heart: 3 }),
        locationId: 'loc.1',
        narrativeArchetype: 'tragic_hero',
        primarySphere: 'iron',
      },
    });
    graph.addNode({ id: 'loc.1', type: 'location', name: 'Ashvale', properties: {} });
    for (let i = 1; i <= 2; i++) {
      graph.addNode({ id: `agent.${i + 1}`, type: 'actor', name: `Agent ${i + 1}`, properties: { actorType: 'individual' } });
      graph.addEdge({ id: `rel.${i}`, source: 'agent.1', target: `agent.${i + 1}`, type: 'relationship', properties: { sentiment: 0.5, strength: 0.7 - i * 0.1, basis: 'friendship' } });
    }
    graph.addEdge({ id: 'w.1', source: 'agent.1', target: 'asc', type: 'worships', properties: { tier: 1 } });

    const card = getAgentInfoCard(graph, 'agent.1', 'asc', 'known');
    expect(card).not.toBeNull();
    expect(card!.domains).toHaveLength(3);
    expect(card!.topValues).toBeDefined();
    expect(card!.topValues!.length).toBeGreaterThan(0);
    expect(card!.topBonds).toBeDefined();
    expect(card!.quotes).toHaveLength(1);
  });

  it('at intimate level: returns full 9 domains, all traits, all quotes, backstory paragraph 1', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'asc', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
    graph.addNode({
      id: 'agent.1', type: 'actor', name: 'Kael',
      properties: {
        actorType: 'individual',
        axiologicalProfile: makeProfile({ loyalty_ambition: 0.8, mercy_ruthlessness: -0.6 }),
        domainCapabilities: makeDomainCaps({ iron: 7, shadow: 5, heart: 3, veil: 2, gold: 1, eye: 4, stone: 2, star: 3, flesh: 2 }),
        locationId: 'loc.1',
        narrativeArchetype: 'tragic_hero',
        primarySphere: 'iron',
        cooperationStrategy: 'tit-for-tat',
        reputationScore: 0.72,
      },
    });
    graph.addNode({ id: 'loc.1', type: 'location', name: 'Ashvale', properties: {} });
    graph.addNode({ id: 'trait.1', type: 'trait', name: 'Resilient', properties: {} });
    graph.addNode({ id: 'trait.2', type: 'trait', name: 'Protective', properties: {} });
    graph.addNode({ id: 'culture.1', type: 'actor', name: 'The Ironborn', properties: { actorType: 'culture' } });
    graph.addEdge({ id: 'w.1', source: 'agent.1', target: 'asc', type: 'worships', properties: { tier: 1 } });
    graph.addEdge({ id: 'ht.1', source: 'agent.1', target: 'trait.1', type: 'has_trait', properties: {} });
    graph.addEdge({ id: 'ht.2', source: 'agent.1', target: 'trait.2', type: 'has_trait', properties: {} });
    graph.addEdge({ id: 'bt.1', source: 'agent.1', target: 'culture.1', type: 'belongs_to', properties: { culturalStrength: 0.8 } });

    const card = getAgentInfoCard(graph, 'agent.1', 'asc', 'intimate');
    expect(card).not.toBeNull();
    expect(card!.domains).toHaveLength(9);
    expect(card!.quotes).toBeDefined();
    expect(card!.quotes!.length).toBeGreaterThan(0);
    expect(card!.cooperationStrategy).toBe('tit-for-tat');
    expect(card!.backstoryParagraph1).toBeDefined();
    expect(card!.allTraits).toBeDefined();
    expect(card!.allTraits).toContain('Resilient');
    expect(card!.allTraits).toContain('Protective');
    expect(card!.cultureName).toBe('The Ironborn');
  });

  it('at transparent level: includes full backstory + history', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'asc', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
    graph.addNode({
      id: 'agent.1', type: 'actor', name: 'Kael',
      properties: {
        actorType: 'individual',
        axiologicalProfile: makeProfile({ loyalty_ambition: 0.8 }),
        domainCapabilities: makeDomainCaps({ iron: 7 }),
        locationId: 'loc.1',
        narrativeArchetype: 'tragic_hero',
        primarySphere: 'iron',
      },
    });
    graph.addNode({ id: 'loc.1', type: 'location', name: 'Ashvale', properties: {} });
    graph.addEdge({ id: 'w.1', source: 'agent.1', target: 'asc', type: 'worships', properties: { tier: 1 } });

    const card = getAgentInfoCard(graph, 'agent.1', 'asc', 'transparent');
    expect(card).not.toBeNull();
    expect(card!.backstoryParagraph1).toBeDefined();
  });
});

describe('getAgentFullProfile (familiarity-gated)', () => {
  it('at stranger level: returns undefined', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'asc', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
    graph.addNode({
      id: 'agent.1', type: 'actor', name: 'Kael',
      properties: {
        actorType: 'individual',
        axiologicalProfile: makeProfile(),
        domainCapabilities: makeDomainCaps(),
        locationId: 'loc.1',
      },
    });
    graph.addNode({ id: 'loc.1', type: 'location', name: 'Ashvale', properties: {} });
    graph.addEdge({ id: 'w.1', source: 'agent.1', target: 'asc', type: 'worships', properties: { tier: 1 } });

    const profile = getAgentFullProfile(graph, 'agent.1', 'asc', 'stranger');
    expect(profile).toBeUndefined();
  });

  it('at intimate level: includes quotes + backstory paragraph 1', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'asc', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
    graph.addNode({
      id: 'agent.1', type: 'actor', name: 'Kael',
      properties: {
        actorType: 'individual',
        axiologicalProfile: makeProfile({ loyalty_ambition: 0.8 }),
        domainCapabilities: makeDomainCaps({ iron: 7 }),
        locationId: 'loc.1',
        narrativeArchetype: 'tragic_hero',
        primarySphere: 'iron',
      },
    });
    graph.addNode({ id: 'loc.1', type: 'location', name: 'Ashvale', properties: {} });
    graph.addEdge({ id: 'w.1', source: 'agent.1', target: 'asc', type: 'worships', properties: { tier: 1 } });

    const profile = getAgentFullProfile(graph, 'agent.1', 'asc', 'intimate');
    expect(profile).not.toBeUndefined();
    expect(profile!.quotes).toBeTruthy();
    expect(profile!.backstoryParagraph1).toBeTruthy();
    expect(profile!.fullBackstory).toBeUndefined();
  });

  it('at transparent level: includes full backstory + history timeline', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'asc', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
    graph.addNode({
      id: 'agent.1', type: 'actor', name: 'Kael',
      properties: {
        actorType: 'individual',
        axiologicalProfile: makeProfile({ loyalty_ambition: 0.8 }),
        domainCapabilities: makeDomainCaps({ iron: 7 }),
        locationId: 'loc.1',
        narrativeArchetype: 'tragic_hero',
        primarySphere: 'iron',
        cooperationStrategy: 'tit-for-tat',
        reputationScore: 0.72,
      },
    });
    graph.addNode({ id: 'agent.2', type: 'actor', name: 'Mara', properties: { actorType: 'individual' } });
    graph.addNode({ id: 'loc.1', type: 'location', name: 'Ashvale', properties: {} });
    graph.addEdge({ id: 'w.1', source: 'agent.1', target: 'asc', type: 'worships', properties: { tier: 1 } });

    const log: InteractionRecord[] = [
      { tick: 10, actorMove: 'cooperate', targetMove: 'cooperate', context: 'trade', stakes: 'low' },
      { tick: 8, actorMove: 'cooperate', targetMove: 'defect', context: 'diplomacy', stakes: 'high' },
    ];
    graph.addEdge({ id: 'rt.1', source: 'agent.1', target: 'agent.2', type: 'relates_to', properties: { interactionLog: log } });

    const profile = getAgentFullProfile(graph, 'agent.1', 'asc', 'transparent');
    expect(profile).not.toBeUndefined();
    expect(profile!.fullBackstory).toBeTruthy();
    expect(profile!.historyTimeline).toBeTruthy();
    expect(profile!.historyTimeline!.length).toBeGreaterThan(0);
  });
});
