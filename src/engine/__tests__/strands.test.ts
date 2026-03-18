import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import type { GraphNode, GraphEdge } from '../../types/graph';
import type { AxiologicalProfile } from '../../types/agent';
import {
  getPresenceStrand,
  getDesiresStrand,
  getBondsStrand,
  getAmbitionsStrand,
  getBeliefsStrand,
  getFearsStrand,
} from '../strands';

describe('Strand Data Extractors', () => {
  let graph: WorldGraph;
  let agentId: string;
  let locationId: string;
  let companionId: string;

  beforeEach(() => {
    graph = new WorldGraph();
    agentId = 'actor.protagonist';
    locationId = 'location.throne_room';
    companionId = 'actor.companion';

    // Create agent node with axiological profile
    const axiologicalProfile: AxiologicalProfile = {
      mercy_ruthlessness: 0.6,
      asceticism_extravagance: -0.1,
      honesty_cunning: -0.2,
      tradition_novelty: 0.8,
      loyalty_ambition: -0.7,
      frankness_propriety: 0,
      humility_pride: -0.6,
      sacrifice_survival: 0.5,
      stoicism_passion: 0,
      courage_prudence: 0.4,
    };

    const domainCapabilities = {
      iron: 0.8,
      gold: 0.5,
      shadow: 0.3,
      veil: 0.9,
      heart: 0.4,
      eye: 0.7,
      stone: 0.2,
      star: 0.6,
      flesh: 0.5,
    };

    graph.addNode({
      id: agentId,
      type: 'actor',
      name: 'Protagonist',
      properties: {
        actorType: 'individual',
        axiologicalProfile,
        domainCapabilities,
        locationId,
      },
    });

    // Create location node
    graph.addNode({
      id: locationId,
      type: 'location',
      name: 'Throne Room',
      properties: {},
    });

    // Create companion node
    graph.addNode({
      id: companionId,
      type: 'actor',
      name: 'Companion',
      properties: {
        actorType: 'individual',
        axiologicalProfile: {
          mercy_ruthlessness: 0.5,
          asceticism_extravagance: 0.4,
          honesty_cunning: 0.2,
          tradition_novelty: 0.1,
          loyalty_ambition: 0.3,
          frankness_propriety: 0,
          humility_pride: 0.2,
          sacrifice_survival: 0.1,
          stoicism_passion: 0,
          courage_prudence: 0.4,
        },
        domainCapabilities: {
          iron: 0.4,
          gold: 0.6,
          shadow: 0.5,
          veil: 0.3,
          heart: 0.8,
          eye: 0.4,
          stone: 0.5,
          star: 0.3,
          flesh: 0.4,
        },
        locationId,
      },
    });

    // Agent is at location (located_at edge)
    graph.addEdge({
      id: 'edge.agent_location',
      source: agentId,
      target: locationId,
      type: 'located_at',
      properties: {},
    });

    // Companion is at location
    graph.addEdge({
      id: 'edge.companion_location',
      source: companionId,
      target: locationId,
      type: 'located_at',
      properties: {},
    });

    // Create relationship
    const relatedActorId = 'actor.rival';
    graph.addNode({
      id: relatedActorId,
      type: 'actor',
      name: 'Rival',
      properties: { actorType: 'individual' },
    });

    graph.addEdge({
      id: 'edge.relates_to',
      source: agentId,
      target: relatedActorId,
      type: 'relates_to',
      properties: {
        sentiment: 0.3,
        strength: 0.8,
        basis: 'rivalry',
      },
    });

    // Create faction membership
    const factionId = 'actor.faction';
    graph.addNode({
      id: factionId,
      type: 'actor',
      name: 'The Circle',
      properties: { actorType: 'faction' },
    });

    graph.addEdge({
      id: 'edge.member_of',
      source: agentId,
      target: factionId,
      type: 'member_of',
      properties: { role: 'leader' },
    });
  });

  describe('Presence strand', () => {
    it('returns location and top domain capabilities', () => {
      const strand = getPresenceStrand(graph, agentId);

      expect(strand.strandName).toBe('Presence');
      expect(strand.locationName).toBe('Throne Room');
      expect(strand.locationId).toBe(locationId);
      expect(strand.topDomains).toHaveLength(3);
      expect(strand.topDomains[0].domain).toBe('veil'); // highest 0.9
      expect(strand.topDomains[0].score).toBe(0.9);
      expect(strand.topDomains[1].domain).toBe('iron'); // second 0.8
      expect(strand.topDomains[2].domain).toBe('eye'); // third 0.7
    });

    it('finds companions at same location', () => {
      const strand = getPresenceStrand(graph, agentId);

      expect(strand.companions).toHaveLength(1);
      expect(strand.companions[0].id).toBe(companionId);
      expect(strand.companions[0].name).toBe('Companion');
    });

    it('excludes agent itself from companions', () => {
      const strand = getPresenceStrand(graph, agentId);
      expect(strand.companions.some(c => c.id === agentId)).toBe(false);
    });

    it('handles missing location gracefully', () => {
      const orphanId = 'actor.orphan';
      graph.addNode({
        id: orphanId,
        type: 'actor',
        name: 'Orphan',
        properties: {
          actorType: 'individual',
          axiologicalProfile: {
            mercy_ruthlessness: 0,
            asceticism_extravagance: 0,
            honesty_cunning: 0,
            tradition_novelty: 0,
            loyalty_ambition: 0,
            frankness_propriety: 0,
            humility_pride: 0,
            sacrifice_survival: 0,
            stoicism_passion: 0,
            courage_prudence: 0,
          },
          domainCapabilities: { iron: 0.5, gold: 0.5, shadow: 0.5, veil: 0.5, heart: 0.5, eye: 0.5, stone: 0.5, star: 0.5, flesh: 0.5 },
          locationId: 'missing.location',
        },
      });

      const strand = getPresenceStrand(graph, orphanId);
      expect(strand.locationName).toBe('');
      expect(strand.locationId).toBe('missing.location');
    });
  });

  describe('Desires strand', () => {
    it('extracts desire-relevant values with labels and descriptions', () => {
      const strand = getDesiresStrand(graph, agentId);

      expect(strand.strandName).toBe('Desires');
      expect(strand.insights.length).toBeGreaterThan(0);

      // Find asceticism_extravagance insight (value: -0.1)
      const greedInsight = strand.insights.find(i => i.valuePair === 'asceticism_extravagance');
      expect(greedInsight).toBeDefined();
      expect(greedInsight!.value).toBe(-0.1);
      expect(greedInsight!.label).toBe('Extravagant'); // negative pole (right)
      expect(greedInsight!.description).toBe('Slightly extravagant');

      // Find mercy_ruthlessness insight (value: 0.6)
      const crueltyInsight = strand.insights.find(i => i.valuePair === 'mercy_ruthlessness');
      expect(crueltyInsight).toBeDefined();
      expect(crueltyInsight!.value).toBe(0.6);
      expect(crueltyInsight!.label).toBe('Merciful'); // positive pole
      expect(crueltyInsight!.description).toBe('Notably merciful');
    });

    it('sorts insights by absolute value descending', () => {
      const strand = getDesiresStrand(graph, agentId);
      for (let i = 1; i < strand.insights.length; i++) {
        const prevAbs = Math.abs(strand.insights[i - 1].value);
        const currAbs = Math.abs(strand.insights[i].value);
        expect(prevAbs).toBeGreaterThanOrEqual(currAbs);
      }
    });
  });

  describe('Bonds strand', () => {
    it('returns relationships with sentiment, strength, basis', () => {
      const strand = getBondsStrand(graph, agentId);

      expect(strand.strandName).toBe('Bonds');
      expect(strand.relationships).toHaveLength(1);
      expect(strand.relationships[0].targetId).toBe('actor.rival');
      expect(strand.relationships[0].targetName).toBe('Rival');
      expect(strand.relationships[0].sentiment).toBe(0.3);
      expect(strand.relationships[0].strength).toBe(0.8);
      expect(strand.relationships[0].basis).toBe('rivalry');
    });

    it('returns faction membership', () => {
      const strand = getBondsStrand(graph, agentId);

      expect(strand.factions).toHaveLength(1);
      expect(strand.factions[0].id).toBe('actor.faction');
      expect(strand.factions[0].name).toBe('The Circle');
      expect(strand.factions[0].role).toBe('leader');
    });

    it('extracts bond-relevant values', () => {
      const strand = getBondsStrand(graph, agentId);

      expect(strand.insights.length).toBeGreaterThan(0);

      // Check loyalty_ambition is present
      const loyaltyInsight = strand.insights.find(i => i.valuePair === 'loyalty_ambition');
      expect(loyaltyInsight).toBeDefined();
      expect(loyaltyInsight!.value).toBe(-0.7);
      expect(loyaltyInsight!.label).toBe('Ambitious');
    });
  });

  describe('Ambitions strand', () => {
    it('extracts ambition-relevant values', () => {
      const strand = getAmbitionsStrand(graph, agentId);

      expect(strand.strandName).toBe('Ambitions');
      expect(strand.insights.length).toBe(3);

      // Check loyalty_ambition
      const ambitionInsight = strand.insights.find(i => i.valuePair === 'loyalty_ambition');
      expect(ambitionInsight).toBeDefined();
      expect(ambitionInsight!.value).toBe(-0.7);
      expect(ambitionInsight!.label).toBe('Ambitious');
      expect(ambitionInsight!.description).toBe('Notably ambitious');

      // Check humility_pride
      const dominanceInsight = strand.insights.find(i => i.valuePair === 'humility_pride');
      expect(dominanceInsight).toBeDefined();
      expect(dominanceInsight!.value).toBe(-0.6);
      expect(dominanceInsight!.label).toBe('Proud');

      // Check courage_prudence
      const courageInsight = strand.insights.find(i => i.valuePair === 'courage_prudence');
      expect(courageInsight).toBeDefined();
      expect(courageInsight!.value).toBe(0.4);
      expect(courageInsight!.label).toBe('Courageous');
    });
  });

  describe('Beliefs strand', () => {
    it('extracts belief-relevant values', () => {
      const strand = getBeliefsStrand(graph, agentId);

      expect(strand.strandName).toBe('Beliefs');
      expect(strand.insights.length).toBe(3);

      // Check tradition_novelty
      const traditionInsight = strand.insights.find(i => i.valuePair === 'tradition_novelty');
      expect(traditionInsight).toBeDefined();
      expect(traditionInsight!.value).toBe(0.8);
      expect(traditionInsight!.label).toBe('Traditional');
      expect(traditionInsight!.description).toBe('Deeply traditional');

      // Check honesty_cunning
      const cunningInsight = strand.insights.find(i => i.valuePair === 'honesty_cunning');
      expect(cunningInsight).toBeDefined();
      expect(cunningInsight!.value).toBe(-0.2);
      expect(cunningInsight!.label).toBe('Cunning');

      // Check sacrifice_survival
      const devotionInsight = strand.insights.find(i => i.valuePair === 'sacrifice_survival');
      expect(devotionInsight).toBeDefined();
      expect(devotionInsight!.value).toBe(0.5);
      expect(devotionInsight!.label).toBe('Self-Sacrificing');
    });
  });

  describe('Fears strand', () => {
    it('derives fears from shadow side of strong values', () => {
      const strand = getFearsStrand(graph, agentId);

      expect(strand.strandName).toBe('Fears');
      expect(strand.insights.length).toBeGreaterThan(0);

      // loyalty_ambition: 0.7 > 0.3, should include fear
      const ambitionFear = strand.insights.find(i => i.valuePair === 'loyalty_ambition');
      expect(ambitionFear).toBeDefined();
      expect(ambitionFear!.description).toContain('Fears');

      // tradition_novelty: 0.8 > 0.3, should include fear
      const traditionFear = strand.insights.find(i => i.valuePair === 'tradition_novelty');
      expect(traditionFear).toBeDefined();
    });

    it('excludes weak values (|v| <= 0.3)', () => {
      const strand = getFearsStrand(graph, agentId);

      // honesty_cunning: 0.2, should NOT be included
      const cunningFear = strand.insights.find(i => i.valuePair === 'honesty_cunning');
      expect(cunningFear).toBeUndefined();

      // asceticism_extravagance: 0.1, should NOT be included
      const greedFear = strand.insights.find(i => i.valuePair === 'asceticism_extravagance');
      expect(greedFear).toBeUndefined();
    });

    it('uses correct fear description based on pole', () => {
      const strand = getFearsStrand(graph, agentId);

      // mercy_ruthlessness: 0.6, positive pole, should use first fear
      const crueltyFear = strand.insights.find(i => i.valuePair === 'mercy_ruthlessness');
      expect(crueltyFear).toBeDefined();
      expect(crueltyFear!.description).toBe('Fears vulnerability from showing mercy');

      // loyalty_ambition: -0.7, negative pole, should use second fear
      const ambitionFear = strand.insights.find(i => i.valuePair === 'loyalty_ambition');
      expect(ambitionFear).toBeDefined();
      expect(ambitionFear!.description).toBe('Fears irrelevance and failure');
    });
  });
});
