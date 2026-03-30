import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { getAgentDetail } from '../agentDetail';
import { getRetinueAgents } from '../retinue';
import { NARRATIVE_ARCHETYPES } from '../../data/archetype-content';
import type { AxiologicalProfile } from '../../types/agent';
import type { ReachDomain } from '../../types/traits';

describe('agent detail integration', () => {
  it('full flow: retinue agent → detail with archetype, values, bonds', () => {
    const graph = new WorldGraph();

    graph.addNode({ id: 'asc', type: 'actor', name: 'The Weaver', properties: { actorType: 'ascendant' } });
    graph.addNode({ id: 'loc.1', type: 'location', name: 'Thornhaven', properties: { locationType: 'settlement' } });
    graph.addNode({ id: 'fac.1', type: 'actor', name: 'Seekers of the Veil', properties: { actorType: 'faction' } });

    const profile: AxiologicalProfile = {
      mercy_ruthlessness: -0.7,
      asceticism_extravagance: 0.2,
      honesty_cunning: 0.3,
      tradition_novelty: -0.2,
      loyalty_ambition: 0.9,
      revelation_discretion: 0,
      preservation_transformation: 0.4,
      sacrifice_survival: 0.6,
      courage_prudence: -0.4,
    };
    const domainCaps: Record<ReachDomain, number> = {
      iron: 3,
      gold: 1,
      shadow: 6,
      veil: 8,
      heart: 4,
      eye: 7,
      stone: 2,
      star: 5,
    };

    graph.addNode({
      id: 'agent.1',
      type: 'actor',
      name: 'Selene Ashwhisper',
      properties: {
        actorType: 'individual',
        axiologicalProfile: profile,
        domainCapabilities: domainCaps,
        locationId: 'loc.1',
        narrativeArchetype: 'seeker',
      },
    });
    graph.addEdge({ id: 't.1', source: 'asc', target: 'agent.1', type: 'thread', properties: { tier: 3 } });
    graph.addEdge({ id: 'm.1', source: 'agent.1', target: 'fac.1', type: 'member_of', properties: { role: 'adept' } });

    graph.addNode({ id: 'agent.2', type: 'actor', name: 'Bram Ironhand', properties: { actorType: 'individual' } });
    graph.addEdge({
      id: 'rel.1',
      source: 'agent.1',
      target: 'agent.2',
      type: 'relates_to',
      properties: { sentiment: -0.4, strength: 0.7, basis: 'rivalry' },
    });

    // 1. Agent appears in retinue
    const retinue = getRetinueAgents(graph, 'asc');
    expect(retinue).toHaveLength(1);
    expect(retinue[0].name).toBe('Selene Ashwhisper');

    // 2. Detail aggregation works
    const detail = getAgentDetail(graph, 'agent.1', 'asc');
    expect(detail).not.toBeNull();
    expect(detail!.name).toBe('Selene Ashwhisper');
    expect(detail!.tier).toBe(3);
    expect(detail!.tierName).toBe('Champion');
    expect(detail!.locationName).toBe('Thornhaven');
    expect(detail!.factionName).toBe('Seekers of the Veil');

    // 3. Archetype resolved
    expect(detail!.archetype).not.toBeNull();
    expect(detail!.archetype!.id).toBe('seeker');
    expect(detail!.archetype!.reachAffinities).toContain('eye');

    // 4. Top values sorted by |value|
    expect(detail!.topValues[0].pair).toBe('loyalty_ambition');
    expect(detail!.topValues[1].pair).toBe('mercy_ruthlessness');
    expect(detail!.topValues[2].pair).toBe('sacrifice_survival');

    // 5. Bond included
    expect(detail!.topBonds).toHaveLength(1);
    expect(detail!.topBonds[0].targetName).toBe('Bram Ironhand');
    expect(detail!.topBonds[0].basis).toBe('rivalry');
  });

  it('all 19 archetypes are resolvable from getAgentDetail', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'asc', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
    graph.addNode({ id: 'loc.1', type: 'location', name: 'Place', properties: {} });

    for (const arch of NARRATIVE_ARCHETYPES) {
      const agentId = `agent.${arch.id}`;
      graph.addNode({
        id: agentId,
        type: 'actor',
        name: `Agent ${arch.name}`,
        properties: {
          actorType: 'individual',
          axiologicalProfile: {
            mercy_ruthlessness: 0,
            asceticism_extravagance: 0,
            honesty_cunning: 0,
            tradition_novelty: 0,
            loyalty_ambition: 0,
            revelation_discretion: 0,
            preservation_transformation: 0,
            sacrifice_survival: 0,
            sacrifice_survival: 0,
            courage_prudence: 0,
          },
          domainCapabilities: {
            iron: 0,
            gold: 0,
            shadow: 0,
            veil: 0,
            heart: 0,
            eye: 0,
            stone: 0,
            star: 0,
          },
          locationId: 'loc.1',
          narrativeArchetype: arch.id,
        },
      });
      graph.addEdge({
        id: `t.${arch.id}`,
        source: 'asc',
        target: agentId,
        type: 'thread',
        properties: { tier: 1 },
      });

      const detail = getAgentDetail(graph, agentId, 'asc');
      expect(detail).not.toBeNull();
      expect(detail!.archetype).not.toBeNull();
      expect(detail!.archetype!.id).toBe(arch.id);
    }
  });
});
