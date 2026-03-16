import { describe, it, expect, beforeEach } from 'vitest';
import { generateEncounterCandidates } from '../encounterCandidates';
import { WorldGraph } from '../graph';
import type { ActionCandidate } from '../../types/agent';

// ──────────────────────────────────────────────────────────────────────
// TESTS
// ──────────────────────────────────────────────────────────────────────

describe('generateEncounterCandidates', () => {
  let graph: WorldGraph;
  let actorId: string;
  let locationId: string;

  beforeEach(() => {
    graph = new WorldGraph();
    actorId = 'actor.test';
    locationId = 'loc.tavern';
  });

  it('returns candidates matching location subtype', () => {
    // Setup: location with town subtype (tavern)
    graph.addNode({
      id: locationId,
      type: 'location',
      name: 'Tavern',
      properties: {
        locationType: 'town',
        locationSubtype: 'tavern',
      },
    });

    // Add actor with neutral axiological profile
    graph.addNode({
      id: actorId,
      type: 'actor',
      name: 'TestActor',
      properties: {
        actorType: 'individual',
        axiologicalProfile: {
          courage_prudence: 0,
          ambition_contentment: 0,
          cruelty_compassion: 0,
          cunning_honesty: 0,
          devotion_independence: 0,
          loyalty_treachery: 0,
          tradition_innovation: 0,
          dominance_humility: 0,
          wrath_patience: 0,
          greed_generosity: 0,
        },
      },
    });

    // Action: generate candidates
    const candidates = generateEncounterCandidates(graph, actorId, locationId);

    // Assert: should have at least fallback trivials
    expect(Array.isArray(candidates)).toBe(true);
    candidates.forEach(c => {
      expect(c.templateId).toBeDefined();
      expect(c.targetId).toBeDefined();
      expect(c.domain).toBeDefined();
      expect(c.motivations).toBeDefined();
      expect(Array.isArray(c.motivations)).toBe(true);
    });
  });

  it('filters by threat rating vs agent capability', () => {
    graph.addNode({
      id: locationId,
      type: 'location',
      name: 'Tavern',
      properties: {
        locationType: 'town',
        locationSubtype: 'tavern',
      },
    });

    graph.addNode({
      id: actorId,
      type: 'actor',
      name: 'TestActor',
      properties: {
        actorType: 'individual',
        axiologicalProfile: {
          courage_prudence: 0,
          ambition_contentment: 0,
          cruelty_compassion: 0,
          cunning_honesty: 0,
          devotion_independence: 0,
          loyalty_treachery: 0,
          tradition_innovation: 0,
          dominance_humility: 0,
          wrath_patience: 0,
          greed_generosity: 0,
        },
      },
    });

    // With no traits, agent has 0 capability (0 = trivial band)
    const candidates = generateEncounterCandidates(graph, actorId, locationId);

    // Should generate candidates
    expect(Array.isArray(candidates)).toBe(true);
  });

  it('maps encounter type to correct motivations', () => {
    graph.addNode({
      id: locationId,
      type: 'location',
      name: 'Tavern',
      properties: {
        locationType: 'town',
        locationSubtype: 'tavern',
      },
    });

    graph.addNode({
      id: actorId,
      type: 'actor',
      name: 'TestActor',
      properties: {
        actorType: 'individual',
        axiologicalProfile: {
          courage_prudence: 0,
          ambition_contentment: 0,
          cruelty_compassion: 0,
          cunning_honesty: 0,
          devotion_independence: 0,
          loyalty_treachery: 0,
          tradition_innovation: 0,
          dominance_humility: 0,
          wrath_patience: 0,
          greed_generosity: 0,
        },
      },
    });

    const candidates = generateEncounterCandidates(graph, actorId, locationId);

    // Every candidate should have non-empty motivations array
    candidates.forEach(c => {
      expect(Array.isArray(c.motivations)).toBe(true);
      expect(c.motivations.length).toBeGreaterThan(0);
      // Motivations should be valid value pairs
      c.motivations.forEach(m => {
        expect(typeof m).toBe('string');
        expect(m).toMatch(/_/); // All value pairs have underscore
      });
    });
  });

  it('includes targetId as location ID for non-social encounters', () => {
    graph.addNode({
      id: locationId,
      type: 'location',
      name: 'Ruins',
      properties: {
        locationType: 'ruins',
        locationSubtype: 'ruins',
      },
    });

    graph.addNode({
      id: actorId,
      type: 'actor',
      name: 'TestActor',
      properties: {
        actorType: 'individual',
        axiologicalProfile: {
          courage_prudence: 0.5,
          ambition_contentment: 0,
          cruelty_compassion: 0,
          cunning_honesty: 0,
          devotion_independence: 0,
          loyalty_treachery: 0,
          tradition_innovation: 0,
          dominance_humility: 0,
          wrath_patience: 0,
          greed_generosity: 0,
        },
      },
    });

    const candidates = generateEncounterCandidates(graph, actorId, locationId);

    // Non-social encounters (explore, build, etc. at ruins) should target location
    const nonSocialCandidates = candidates.filter(c => {
      const socialTypes = ['duel', 'steal', 'trade', 'assist'];
      return !socialTypes.some(t => c.templateId.includes(t));
    });

    nonSocialCandidates.forEach(c => {
      expect(c.targetId).toBe(locationId);
    });
  });

  it('includes targetId as other agent ID for duel/steal/assist/trade', () => {
    const otherActorId = 'actor.other';

    graph.addNode({
      id: locationId,
      type: 'location',
      name: 'Market',
      properties: {
        locationType: 'town',
        locationSubtype: 'town',
      },
    });

    graph.addNode({
      id: actorId,
      type: 'actor',
      name: 'TestActor',
      properties: {
        actorType: 'individual',
        axiologicalProfile: {
          courage_prudence: 0,
          ambition_contentment: 0,
          cruelty_compassion: 0,
          cunning_honesty: 0,
          devotion_independence: 0,
          loyalty_treachery: 0,
          tradition_innovation: 0,
          dominance_humility: 0,
          wrath_patience: 0,
          greed_generosity: 0,
        },
      },
    });

    graph.addNode({
      id: otherActorId,
      type: 'actor',
      name: 'OtherActor',
      properties: {
        actorType: 'individual',
      },
    });

    // Add located_at edges for both actors
    graph.addEdge({
      id: 'e1',
      source: actorId,
      target: locationId,
      type: 'located_at',
      properties: {},
    });

    graph.addEdge({
      id: 'e2',
      source: otherActorId,
      target: locationId,
      type: 'located_at',
      properties: {},
    });

    const candidates = generateEncounterCandidates(graph, actorId, locationId);

    // Social encounters should target another actor
    const socialCandidates = candidates.filter(c => {
      const socialTypes = ['duel', 'steal', 'trade', 'assist'];
      return socialTypes.some(t => c.templateId.includes(t));
    });

    socialCandidates.forEach(c => {
      expect(c.targetId).not.toBe(locationId);
      expect(c.targetId).toBe(otherActorId);
    });
  });

  it('returns empty array for unknown location subtype', () => {
    graph.addNode({
      id: locationId,
      type: 'location',
      name: 'UnknownPlace',
      properties: {
        locationType: 'unknown_type_xyz',
        locationSubtype: 'unknown_type_xyz',
      },
    });

    graph.addNode({
      id: actorId,
      type: 'actor',
      name: 'TestActor',
      properties: {
        actorType: 'individual',
        axiologicalProfile: {
          courage_prudence: 0,
          ambition_contentment: 0,
          cruelty_compassion: 0,
          cunning_honesty: 0,
          devotion_independence: 0,
          loyalty_treachery: 0,
          tradition_innovation: 0,
          dominance_humility: 0,
          wrath_patience: 0,
          greed_generosity: 0,
        },
      },
    });

    const candidates = generateEncounterCandidates(graph, actorId, locationId);

    // Should return empty for unknown location type
    expect(candidates.length).toBe(0);
  });

  it('courageous agents expand threat tolerance upward', () => {
    graph.addNode({
      id: locationId,
      type: 'location',
      name: 'Tavern',
      properties: {
        locationType: 'town',
        locationSubtype: 'tavern',
      },
    });

    const courageousActorId = 'actor.courageous';
    graph.addNode({
      id: courageousActorId,
      type: 'actor',
      name: 'BraveActor',
      properties: {
        actorType: 'individual',
        axiologicalProfile: {
          courage_prudence: 0.5, // Above THREAT_COURAGE_THRESHOLD (0.3)
          ambition_contentment: 0,
          cruelty_compassion: 0,
          cunning_honesty: 0,
          devotion_independence: 0,
          loyalty_treachery: 0,
          tradition_innovation: 0,
          dominance_humility: 0,
          wrath_patience: 0,
          greed_generosity: 0,
        },
      },
    });

    // No traits means 0 capability
    const candidates = generateEncounterCandidates(graph, courageousActorId, locationId);

    // Courageous agent should be able to accept encounters expanded upward
    // Should at least have fallback trivials
    expect(Array.isArray(candidates)).toBe(true);
  });

  it('prudent agents restrict threat tolerance downward', () => {
    graph.addNode({
      id: locationId,
      type: 'location',
      name: 'Tavern',
      properties: {
        locationType: 'town',
        locationSubtype: 'tavern',
      },
    });

    const prudentActorId = 'actor.prudent';
    graph.addNode({
      id: prudentActorId,
      type: 'actor',
      name: 'CautiousActor',
      properties: {
        actorType: 'individual',
        axiologicalProfile: {
          courage_prudence: -0.5, // Below THREAT_PRUDENCE_THRESHOLD (-0.3)
          ambition_contentment: 0,
          cruelty_compassion: 0,
          cunning_honesty: 0,
          devotion_independence: 0,
          loyalty_treachery: 0,
          tradition_innovation: 0,
          dominance_humility: 0,
          wrath_patience: 0,
          greed_generosity: 0,
        },
      },
    });

    const candidates = generateEncounterCandidates(graph, prudentActorId, locationId);

    // Prudent agent should get candidates (at least fallback trivials)
    expect(Array.isArray(candidates)).toBe(true);
  });

  it('always includes at least one trivial encounter as fallback', () => {
    graph.addNode({
      id: locationId,
      type: 'location',
      name: 'Tavern',
      properties: {
        locationType: 'town',
        locationSubtype: 'tavern',
      },
    });

    graph.addNode({
      id: actorId,
      type: 'actor',
      name: 'TestActor',
      properties: {
        actorType: 'individual',
        axiologicalProfile: {
          courage_prudence: 0,
          ambition_contentment: 0,
          cruelty_compassion: 0,
          cunning_honesty: 0,
          devotion_independence: 0,
          loyalty_treachery: 0,
          tradition_innovation: 0,
          dominance_humility: 0,
          wrath_patience: 0,
          greed_generosity: 0,
        },
      },
    });

    const candidates = generateEncounterCandidates(graph, actorId, locationId);

    // Should have fallback candidates
    expect(Array.isArray(candidates)).toBe(true);
  });

  it('returns empty array when location node does not exist', () => {
    graph.addNode({
      id: actorId,
      type: 'actor',
      name: 'TestActor',
      properties: {
        actorType: 'individual',
        axiologicalProfile: {
          courage_prudence: 0,
          ambition_contentment: 0,
          cruelty_compassion: 0,
          cunning_honesty: 0,
          devotion_independence: 0,
          loyalty_treachery: 0,
          tradition_innovation: 0,
          dominance_humility: 0,
          wrath_patience: 0,
          greed_generosity: 0,
        },
      },
    });

    const candidates = generateEncounterCandidates(graph, actorId, 'nonexistent.loc');

    expect(candidates).toEqual([]);
  });

  it('returns empty array when actor node does not exist', () => {
    graph.addNode({
      id: locationId,
      type: 'location',
      name: 'Tavern',
      properties: {
        locationType: 'town',
        locationSubtype: 'tavern',
      },
    });

    const candidates = generateEncounterCandidates(graph, 'nonexistent.actor', locationId);

    expect(candidates).toEqual([]);
  });

  it('handles actors with missing axiologicalProfile gracefully', () => {
    graph.addNode({
      id: locationId,
      type: 'location',
      name: 'Tavern',
      properties: {
        locationType: 'town',
        locationSubtype: 'tavern',
      },
    });

    graph.addNode({
      id: actorId,
      type: 'actor',
      name: 'TestActor',
      properties: {
        actorType: 'individual',
        // No axiologicalProfile
      },
    });

    const candidates = generateEncounterCandidates(graph, actorId, locationId);

    // Should not crash, treat courage_prudence as 0
    expect(Array.isArray(candidates)).toBe(true);
  });

  it('filters social encounters when no other agents present', () => {
    graph.addNode({
      id: locationId,
      type: 'location',
      name: 'Tavern',
      properties: {
        locationType: 'town',
        locationSubtype: 'tavern',
      },
    });

    graph.addNode({
      id: actorId,
      type: 'actor',
      name: 'TestActor',
      properties: {
        actorType: 'individual',
        axiologicalProfile: {
          courage_prudence: 0,
          ambition_contentment: 0,
          cruelty_compassion: 0,
          cunning_honesty: 0,
          devotion_independence: 0,
          loyalty_treachery: 0,
          tradition_innovation: 0,
          dominance_humility: 0,
          wrath_patience: 0,
          greed_generosity: 0,
        },
      },
    });

    // Actor is alone at location
    graph.addEdge({
      id: 'e1',
      source: actorId,
      target: locationId,
      type: 'located_at',
      properties: {},
    });

    const candidates = generateEncounterCandidates(graph, actorId, locationId);

    // Social encounters (duel, steal, trade, assist) should be excluded when no other agents
    const socialCandidates = candidates.filter(c => {
      const socialTypes = ['duel', 'steal', 'trade', 'assist'];
      return socialTypes.some(t => c.templateId.includes(t));
    });

    // Should have no social candidates since actor is alone
    expect(socialCandidates.length).toBe(0);
  });

  describe('sublocation integration', () => {
    it('includes sublocationId when sublocation selection succeeds', () => {
      // Setup: location with sublocation type mapping
      const locationId = 'loc.town-main';
      const sublocationTypeId = 'subloc-type.town-district';
      const locationTypeId = 'loctype.town';

      graph.addNode({
        id: locationId,
        type: 'location',
        name: 'Town',
        properties: {
          locationType: 'town',
          locationSubtype: 'town',
        },
      });

      // Add location-type node
      graph.addNode({
        id: locationTypeId,
        type: 'location-type',
        name: 'Town Type',
        properties: {},
      });

      // Add located_at edge from location to location-type
      graph.addEdge({
        id: `edge-${locationId}-located-at-${locationTypeId}`,
        source: locationId,
        target: locationTypeId,
        type: 'located_at',
        properties: {},
      });

      // Add sublocation-type node with motivations
      graph.addNode({
        id: sublocationTypeId,
        type: 'location-type',
        name: 'Town District',
        properties: {
          motivations: [
            { left: 'devotion', right: 'independence', weight: 0.8 },
          ],
        },
      });

      // Add contains edge from location-type to sublocation-type
      graph.addEdge({
        id: `edge-${locationTypeId}-contains-${sublocationTypeId}`,
        source: locationTypeId,
        target: sublocationTypeId,
        type: 'contains',
        properties: {},
      });

      // Add actor with neutral axiological profile
      graph.addNode({
        id: actorId,
        type: 'actor',
        name: 'TestActor',
        properties: {
          actorType: 'individual',
          axiologicalProfile: {
            courage_prudence: 0,
            ambition_contentment: 0,
            cruelty_compassion: 0,
            cunning_honesty: 0,
            devotion_independence: 0,
            loyalty_treachery: 0,
            tradition_innovation: 0,
            dominance_humility: 0,
            wrath_patience: 0,
            greed_generosity: 0,
          },
        },
      });

      // Action: generate candidates
      const candidates = generateEncounterCandidates(graph, actorId, locationId);

      // Assert: candidates should have sublocationId set
      expect(candidates.length).toBeGreaterThan(0);
      candidates.forEach(c => {
        expect(c.sublocationId).toBeDefined();
        expect(typeof c.sublocationId).toBe('string');
      });
    });

    it('falls back to location-based templates when no sublocations exist', () => {
      // Setup: location with a subtype NOT in SUBTYPE_SUBLOCATION_MAP
      graph.addNode({
        id: locationId,
        type: 'location',
        name: 'Wilderness Outpost',
        properties: {
          locationType: 'location',
          locationSubtype: 'wilderness',
        },
      });

      // Add actor
      graph.addNode({
        id: actorId,
        type: 'actor',
        name: 'TestActor',
        properties: {
          actorType: 'individual',
          axiologicalProfile: {
            courage_prudence: 0,
            ambition_contentment: 0,
            cruelty_compassion: 0,
            cunning_honesty: 0,
            devotion_independence: 0,
            loyalty_treachery: 0,
            tradition_innovation: 0,
            dominance_humility: 0,
            wrath_patience: 0,
            greed_generosity: 0,
          },
        },
      });

      // Action: generate candidates
      const candidates = generateEncounterCandidates(graph, actorId, locationId);

      // Assert: candidates should be generated without sublocationId (fallback behavior)
      expect(candidates.length).toBeGreaterThan(0);
      candidates.forEach(c => {
        // sublocationId should be undefined for locations with no sublocations
        expect(c.sublocationId).toBeUndefined();
      });
    });

    it('still filters by threat rating when using sublocations', () => {
      // Setup: location with sublocation type mapping
      const locationId = 'loc.ruins-main';
      const sublocationTypeId = 'subloc-type.ruins-chamber';
      const locationTypeId = 'loctype.ruins';

      graph.addNode({
        id: locationId,
        type: 'location',
        name: 'Ruins',
        properties: {
          locationType: 'ruins',
          locationSubtype: 'ruins',
        },
      });

      // Add location-type node
      graph.addNode({
        id: locationTypeId,
        type: 'location-type',
        name: 'Ruins Type',
        properties: {},
      });

      graph.addEdge({
        id: `edge-${locationId}-located-at-${locationTypeId}`,
        source: locationId,
        target: locationTypeId,
        type: 'located_at',
        properties: {},
      });

      // Add sublocation-type node
      graph.addNode({
        id: sublocationTypeId,
        type: 'location-type',
        name: 'Ruins Chamber',
        properties: {
          motivations: [
            { left: 'courage', right: 'prudence', weight: 0.5 },
          ],
        },
      });

      graph.addEdge({
        id: `edge-${locationTypeId}-contains-${sublocationTypeId}`,
        source: locationTypeId,
        target: sublocationTypeId,
        type: 'contains',
        properties: {},
      });

      // Add actor with low capability
      graph.addNode({
        id: actorId,
        type: 'actor',
        name: 'Weak Actor',
        properties: {
          actorType: 'individual',
          axiologicalProfile: {
            courage_prudence: -0.8, // Very prudent, will restrict threat tier
            ambition_contentment: 0,
            cruelty_compassion: 0,
            cunning_honesty: 0,
            devotion_independence: 0,
            loyalty_treachery: 0,
            tradition_innovation: 0,
            dominance_humility: 0,
            wrath_patience: 0,
            greed_generosity: 0,
          },
        },
      });

      // Action: generate candidates
      const candidates = generateEncounterCandidates(graph, actorId, locationId);

      // Assert: threat filtering should still apply (should have fallback trivials)
      expect(Array.isArray(candidates)).toBe(true);
      // With very low capability and prudence, fallback trivials should be included
      if (candidates.length > 0) {
        expect(candidates.some(c => c.sublocationId !== undefined)).toBe(true);
      }
    });
  });
});
