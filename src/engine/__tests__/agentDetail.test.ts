import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { getAgentDetail } from '../agentDetail';
import type { AgentDetail } from '../agentDetail';
import type { AxiologicalProfile } from '../../types/agent';
import type { ReachDomain } from '../../types/traits';

const ALL_DOMAINS: ReachDomain[] = ['iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star', 'flesh'];

function makeProfile(overrides: Partial<AxiologicalProfile> = {}): AxiologicalProfile {
  const base: AxiologicalProfile = {
    ambition_contentment: 0, courage_prudence: 0, cruelty_compassion: 0,
    cunning_honesty: 0, devotion_independence: 0, loyalty_treachery: 0,
    tradition_innovation: 0, dominance_humility: 0, wrath_patience: 0, greed_generosity: 0,
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
        axiologicalProfile: makeProfile({ ambition_contentment: 0.8, cruelty_compassion: -0.6 }),
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
        axiologicalProfile: makeProfile({ ambition_contentment: 0.9, cruelty_compassion: -0.7, devotion_independence: 0.5, wrath_patience: 0.2 }),
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
});
