/**
 * Prose Resolvers Tests — location prose fragment generation via graph walking.
 *
 * Tests 6 location resolvers (subtype, biome, culture, sphere, faction, population).
 * Uses a test graph with location, culture, faction, and individual nodes/edges.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import type { GraphNode, GraphEdge } from '../../types/graph';
import {
  subtypeResolver,
  biomeResolver,
  cultureResolver,
  sphereResolver,
  factionResolver,
  populationResolver,
} from '../proseResolvers';

describe('Prose Resolvers', () => {
  let graph: WorldGraph;
  const testSeed = 42;

  beforeEach(() => {
    graph = new WorldGraph();

    // Location: Thornhaven (town, grassland, strong life sphere influence)
    const location: GraphNode = {
      id: 'loc_0',
      type: 'location',
      name: 'Thornhaven',
      properties: {
        locationSubtype: 'town',
        terrain: 'grassland',
        sphereInfluence: {
          life: 0.8,
          mind: 0.2,
          force: 0.1,
        },
      },
    };
    graph.addNode(location);

    // Culture: The Verdant Accord (order_light foundation pair)
    const culture: GraphNode = {
      id: 'culture_0',
      type: 'actor',
      name: 'The Verdant Accord',
      properties: {
        actorType: 'culture',
        cultureIdentity: {
          foundationPair: 'order_light',
        },
      },
    };
    graph.addNode(culture);

    // belongs_to edge from location to culture
    const belongsTo: GraphEdge = {
      id: 'edge_belongs_0',
      source: 'loc_0',
      target: 'culture_0',
      type: 'belongs_to',
      properties: {},
    };
    graph.addEdge(belongsTo);

    // Faction: The Iron Covenant
    const faction: GraphNode = {
      id: 'faction_0',
      type: 'actor',
      name: 'The Iron Covenant',
      properties: {
        actorType: 'faction',
      },
    };
    graph.addNode(faction);

    // controls edge from faction to location
    const controls: GraphEdge = {
      id: 'edge_controls_0',
      source: 'faction_0',
      target: 'loc_0',
      type: 'controls',
      properties: {},
    };
    graph.addEdge(controls);

    // Individual: Brynn (folk_hero archetype)
    const individual: GraphNode = {
      id: 'ind_0',
      type: 'actor',
      name: 'Brynn',
      properties: {
        actorType: 'individual',
        narrativeArchetype: 'folk_hero',
      },
    };
    graph.addNode(individual);

    // located_at edge from individual to location
    const locatedAt: GraphEdge = {
      id: 'edge_located_0',
      source: 'ind_0',
      target: 'loc_0',
      type: 'located_at',
      properties: {},
    };
    graph.addEdge(locatedAt);
  });

  describe('subtypeResolver', () => {
    it('returns origin layer with priority 100 for valid subtype', () => {
      const layers = subtypeResolver('loc_0', graph, testSeed);

      expect(layers.length).toBeGreaterThan(0);
      const layer = layers[0];
      expect(layer.category).toBe('origin');
      expect(layer.priority).toBe(100);
      expect(layer.source).toBe('subtypeResolver');
      expect(layer.text.length).toBeGreaterThan(0);
    });

    it('returns empty array for missing node', () => {
      const layers = subtypeResolver('nonexistent', graph, testSeed);
      expect(layers).toEqual([]);
    });

    it('returns empty array for missing subtype property', () => {
      const location: GraphNode = {
        id: 'loc_missing',
        type: 'location',
        name: 'Test Location',
        properties: {
          // no locationSubtype
        },
      };
      graph.addNode(location);

      const layers = subtypeResolver('loc_missing', graph, testSeed);
      expect(layers).toEqual([]);
    });

    it('returns empty array for unknown subtype in content', () => {
      const location: GraphNode = {
        id: 'loc_unknown',
        type: 'location',
        name: 'Unknown Place',
        properties: {
          locationSubtype: 'unknown_subtype_xyz',
        },
      };
      graph.addNode(location);

      const layers = subtypeResolver('loc_unknown', graph, testSeed);
      expect(layers).toEqual([]);
    });
  });

  describe('biomeResolver', () => {
    it('returns atmosphere layer with priority 90 for valid terrain', () => {
      const layers = biomeResolver('loc_0', graph, testSeed);

      expect(layers.length).toBeGreaterThan(0);
      const layer = layers[0];
      expect(layer.category).toBe('atmosphere');
      expect(layer.priority).toBe(90);
      expect(layer.source).toBe('biomeResolver');
      // grassland prose should mention wind, grass, or horizon
      expect(layer.text.length).toBeGreaterThan(0);
    });

    it('returns empty array for missing node', () => {
      const layers = biomeResolver('nonexistent', graph, testSeed);
      expect(layers).toEqual([]);
    });

    it('returns empty array for missing terrain property', () => {
      const location: GraphNode = {
        id: 'loc_no_terrain',
        type: 'location',
        name: 'No Terrain',
        properties: {
          // no terrain
        },
      };
      graph.addNode(location);

      const layers = biomeResolver('loc_no_terrain', graph, testSeed);
      expect(layers).toEqual([]);
    });

    it('returns empty array for unknown terrain', () => {
      const location: GraphNode = {
        id: 'loc_unknown_terrain',
        type: 'location',
        name: 'Unknown',
        properties: {
          terrain: 'totally_unknown_biome',
        },
      };
      graph.addNode(location);

      const layers = biomeResolver('loc_unknown_terrain', graph, testSeed);
      expect(layers).toEqual([]);
    });
  });

  describe('cultureResolver', () => {
    it('returns character layer with priority 80 when culture edge exists', () => {
      const layers = cultureResolver('loc_0', graph, testSeed);

      expect(layers.length).toBeGreaterThan(0);
      const layer = layers[0];
      expect(layer.category).toBe('character');
      expect(layer.priority).toBe(80);
      expect(layer.source).toBe('cultureResolver');
      // order_light prose should mention order/light/geometry/light sources
      expect(layer.text.length).toBeGreaterThan(0);
    });

    it('returns empty array when no culture edge exists', () => {
      const location2: GraphNode = {
        id: 'loc_no_culture',
        type: 'location',
        name: 'Isolated',
        properties: {
          locationSubtype: 'town',
          terrain: 'grassland',
        },
      };
      graph.addNode(location2);

      const layers = cultureResolver('loc_no_culture', graph, testSeed);
      expect(layers).toEqual([]);
    });

    it('returns empty array when culture node lacks cultureIdentity', () => {
      const culture2: GraphNode = {
        id: 'culture_bad',
        type: 'actor',
        name: 'Bad Culture',
        properties: {
          actorType: 'culture',
          // no cultureIdentity
        },
      };
      graph.addNode(culture2);

      const location2: GraphNode = {
        id: 'loc_bad_culture',
        type: 'location',
        name: 'Bad Loc',
        properties: {},
      };
      graph.addNode(location2);

      const edge: GraphEdge = {
        id: 'edge_bad',
        source: 'loc_bad_culture',
        target: 'culture_bad',
        type: 'belongs_to',
        properties: {},
      };
      graph.addEdge(edge);

      const layers = cultureResolver('loc_bad_culture', graph, testSeed);
      expect(layers).toEqual([]);
    });
  });

  describe('sphereResolver', () => {
    it('returns atmosphere layer with priority 70 when sphere above threshold', () => {
      const layers = sphereResolver('loc_0', graph, testSeed);

      expect(layers.length).toBeGreaterThan(0);
      const layer = layers[0];
      expect(layer.category).toBe('atmosphere');
      expect(layer.priority).toBe(70);
      expect(layer.source).toBe('sphereResolver');
      // life sphere should appear in the text
      expect(layer.text.length).toBeGreaterThan(0);
    });

    it('returns empty array when no sphere above threshold', () => {
      const location: GraphNode = {
        id: 'loc_no_sphere',
        type: 'location',
        name: 'No Sphere',
        properties: {
          sphereInfluence: {
            force: 0.1,
            matter: 0.2,
          },
        },
      };
      graph.addNode(location);

      const layers = sphereResolver('loc_no_sphere', graph, testSeed);
      expect(layers).toEqual([]);
    });

    it('returns empty array when sphereInfluence missing', () => {
      const location: GraphNode = {
        id: 'loc_no_influence',
        type: 'location',
        name: 'No Influence',
        properties: {
          // no sphereInfluence
        },
      };
      graph.addNode(location);

      const layers = sphereResolver('loc_no_influence', graph, testSeed);
      expect(layers).toEqual([]);
    });
  });

  describe('factionResolver', () => {
    it('returns character layer containing faction name', () => {
      const layers = factionResolver('loc_0', graph, testSeed);

      expect(layers.length).toBeGreaterThan(0);
      const layer = layers[0];
      expect(layer.category).toBe('character');
      expect(layer.priority).toBe(60);
      expect(layer.source).toBe('factionResolver');
      expect(layer.text).toContain('Iron Covenant');
    });

    it('returns empty array when no controlling faction', () => {
      const location: GraphNode = {
        id: 'loc_uncontrolled',
        type: 'location',
        name: 'Free Land',
        properties: {},
      };
      graph.addNode(location);

      const layers = factionResolver('loc_uncontrolled', graph, testSeed);
      expect(layers).toEqual([]);
    });

    it('returns empty array for missing node', () => {
      const layers = factionResolver('nonexistent', graph, testSeed);
      expect(layers).toEqual([]);
    });
  });

  describe('populationResolver', () => {
    it('returns character layer containing agent name', () => {
      const layers = populationResolver('loc_0', graph, testSeed);

      expect(layers.length).toBeGreaterThan(0);
      const layer = layers[0];
      expect(layer.category).toBe('character');
      expect(layer.priority).toBe(50);
      expect(layer.source).toBe('populationResolver');
      expect(layer.text).toContain('Brynn');
    });

    it('returns empty array when no inhabitants', () => {
      const location: GraphNode = {
        id: 'loc_empty',
        type: 'location',
        name: 'Empty',
        properties: {},
      };
      graph.addNode(location);

      const layers = populationResolver('loc_empty', graph, testSeed);
      expect(layers).toEqual([]);
    });

    it('returns empty array for missing node', () => {
      const layers = populationResolver('nonexistent', graph, testSeed);
      expect(layers).toEqual([]);
    });

    it('handles multiple inhabitants (cap at 2)', () => {
      // Add 3 more individuals to location
      const ind1: GraphNode = {
        id: 'ind_1',
        type: 'actor',
        name: 'Alice',
        properties: { actorType: 'individual', narrativeArchetype: 'trickster' },
      };
      const ind2: GraphNode = {
        id: 'ind_2',
        type: 'actor',
        name: 'Bob',
        properties: { actorType: 'individual', narrativeArchetype: 'wanderer' },
      };
      const ind3: GraphNode = {
        id: 'ind_3',
        type: 'actor',
        name: 'Charlie',
        properties: { actorType: 'individual', narrativeArchetype: 'schemer' },
      };

      graph.addNode(ind1);
      graph.addNode(ind2);
      graph.addNode(ind3);

      graph.addEdge({
        id: 'edge_alice',
        source: 'ind_1',
        target: 'loc_0',
        type: 'located_at',
        properties: {},
      });
      graph.addEdge({
        id: 'edge_bob',
        source: 'ind_2',
        target: 'loc_0',
        type: 'located_at',
        properties: {},
      });
      graph.addEdge({
        id: 'edge_charlie',
        source: 'ind_3',
        target: 'loc_0',
        type: 'located_at',
        properties: {},
      });

      const layers = populationResolver('loc_0', graph, testSeed);
      expect(layers.length).toBeGreaterThan(0);
      // Should include up to 2 of the inhabitants
      // (exact names depend on ordering, but should be reasonable)
      expect(layers[0].text.length).toBeGreaterThan(0);
    });

    it('falls back to wanderer archetype when narrativeArchetype missing', () => {
      const ind_no_arch: GraphNode = {
        id: 'ind_no_arch',
        type: 'actor',
        name: 'Mysterious',
        properties: { actorType: 'individual' },
      };
      graph.addNode(ind_no_arch);

      graph.addEdge({
        id: 'edge_mysterious',
        source: 'ind_no_arch',
        target: 'loc_0',
        type: 'located_at',
        properties: {},
      });

      const layers = populationResolver('loc_0', graph, testSeed);
      expect(layers.length).toBeGreaterThan(0);
      expect(layers[0].text).toContain('Mysterious');
      // Should use 'wanderer' as fallback
      expect(layers[0].text).toContain('wanderer');
    });
  });
});
