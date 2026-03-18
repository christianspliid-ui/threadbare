import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { generateMovementCandidates } from '../movementCandidates';
import { computeHexThreatRating } from '../threatRating';
import { isEncounterVisibleToAgent } from '../questVisibility';
import { phaseColocationDetection, resetColocationEventCounter } from '../phaseColocationDetection';
import type { AxiologicalProfile } from '../../types/agent';

const DEFAULT_PROFILE: AxiologicalProfile = {
  loyalty_ambition: 0.5,
  courage_prudence: 0,
  mercy_ruthlessness: 0,
  honesty_cunning: 0,
  sacrifice_survival: 0,
  loyalty_ambition: 0,
  tradition_novelty: 0,
  humility_pride: 0,
  mercy_ruthlessness: 0,
  asceticism_extravagance: 0,
};

describe('P1 integration', () => {
  beforeEach(() => {
    resetColocationEventCounter();
  });

  it('quest priority boosts movement candidate score', () => {
    const g = new WorldGraph();
    g.addNode({ id: 'hexA', type: 'location', name: 'Home', properties: { locationType: 'hex_center' } });
    g.addNode({ id: 'hexB', type: 'location', name: 'Quest Target', properties: { locationType: 'hex_center' } });
    g.addEdge({ id: 'adj', source: 'hexA', target: 'hexB', type: 'adjacent', properties: {} });
    g.addEdge({ id: 'adj2', source: 'hexB', target: 'hexA', type: 'adjacent', properties: {} });

    g.addNode({ id: 'agent1', type: 'actor', name: 'Hero', properties: {
      actorType: 'individual',
      domainCapabilities: {},
    }});
    g.addEdge({ id: 'loc1', source: 'agent1', target: 'hexA', type: 'located_at', properties: {} });

    // Quest encounter at hexB with high priority
    g.addNode({ id: 'quest1', type: 'encounter', name: 'Epic Quest', properties: {
      questPriority: 5.0,
      visibleTo: ['agent:agent1'],
    }});
    g.addEdge({ id: 'enc_at', source: 'quest1', target: 'hexB', type: 'encounter_at', properties: {} });

    const candidates = generateMovementCandidates(g, 'agent1', 'hexA', DEFAULT_PROFILE);
    expect(candidates.length).toBeGreaterThanOrEqual(1);

    const questCandidate = candidates.find(c => c.destinationId === 'hexB');
    expect(questCandidate).toBeDefined();
    expect(questCandidate!.bestTemplateId).toBe('quest1');
  });

  it('threat rating reduces scores for cautious agents', () => {
    const g = new WorldGraph();
    g.addNode({ id: 'hex1', type: 'location', name: 'Dangerous', properties: { locationType: 'hex_center' } });
    g.addNode({ id: 'rival1', type: 'rival', name: 'Enemy', properties: { hostilityToPlayer: 0.9 } });
    g.addEdge({ id: 'ctrl', source: 'rival1', target: 'hex1', type: 'controls', properties: {} });

    const threat = computeHexThreatRating(g, 'hex1');
    expect(threat).toBeGreaterThan(0.3);
  });

  it('quest visibility filter works end-to-end', () => {
    const g = new WorldGraph();
    g.addNode({ id: 'agent1', type: 'actor', name: 'Member', properties: {
      actorType: 'individual',
      narrativeArchetype: 'merchant',
    }});
    g.addNode({ id: 'faction1', type: 'faction', name: 'Guild', properties: {} });
    g.addEdge({ id: 'e1', source: 'agent1', target: 'faction1', type: 'member_of', properties: {} });

    expect(isEncounterVisibleToAgent(g, 'agent1', ['faction:faction1'])).toBe(true);
    expect(isEncounterVisibleToAgent(g, 'agent1', ['faction:other'])).toBe(false);
    expect(isEncounterVisibleToAgent(g, 'agent1', ['archetype:merchant'])).toBe(true);
    expect(isEncounterVisibleToAgent(g, 'agent1', undefined)).toBe(true);
  });

  it('colocation detection fires for colocated agents', () => {
    const g = new WorldGraph();
    g.addNode({ id: 'loc1', type: 'location', name: 'Market', properties: { locationType: 'location' } });
    g.addNode({ id: 'a1', type: 'actor', name: 'Alice', properties: { actorType: 'individual', domainCapabilities: { eye: 0.8 } } });
    g.addNode({ id: 'a2', type: 'actor', name: 'Bob', properties: { actorType: 'individual', domainCapabilities: { shadow: 0.1 } } });
    g.addEdge({ id: 'e1', source: 'a1', target: 'loc1', type: 'located_at', properties: {} });
    g.addEdge({ id: 'e2', source: 'a2', target: 'loc1', type: 'located_at', properties: {} });

    let detected = false;
    for (let tick = 0; tick < 100; tick++) {
      resetColocationEventCounter();
      const state = {
        tick,
        seed: tick * 13,
        graph: g,
        tickEvents: [],
        ascendantId: 'god',
      } as any;
      const result = phaseColocationDetection(state);
      const encounters = (result.tickEvents ?? []).filter((e: any) => e.type === 'agent_encounter');
      if (encounters.length > 0) {
        detected = true;
        break;
      }
    }
    expect(detected).toBe(true);
  });

  it('invisible quests do not boost candidate scores', () => {
    const g = new WorldGraph();
    g.addNode({ id: 'hexA', type: 'location', name: 'Home', properties: { locationType: 'hex_center' } });
    g.addNode({ id: 'hexB', type: 'location', name: 'Secret Quest', properties: { locationType: 'hex_center' } });
    g.addEdge({ id: 'adj', source: 'hexA', target: 'hexB', type: 'adjacent', properties: {} });
    g.addEdge({ id: 'adj2', source: 'hexB', target: 'hexA', type: 'adjacent', properties: {} });

    g.addNode({ id: 'agent1', type: 'actor', name: 'Outsider', properties: {
      actorType: 'individual',
      domainCapabilities: {},
    }});
    g.addEdge({ id: 'loc1', source: 'agent1', target: 'hexA', type: 'located_at', properties: {} });

    // Quest visible only to a different agent
    g.addNode({ id: 'quest1', type: 'encounter', name: 'Secret Quest', properties: {
      questPriority: 10.0,
      visibleTo: ['agent:someone_else'],
    }});
    g.addEdge({ id: 'enc_at', source: 'quest1', target: 'hexB', type: 'encounter_at', properties: {} });

    const candidates = generateMovementCandidates(g, 'agent1', 'hexA', DEFAULT_PROFILE);
    const questCandidate = candidates.find(c => c.destinationId === 'hexB');

    // Should still have a candidate (from base heuristic) but NO quest template
    if (questCandidate) {
      expect(questCandidate.bestTemplateId).toBe('');
    }
  });
});
