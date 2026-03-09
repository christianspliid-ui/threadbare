/**
 * Prose Resolvers (Agent) Tests — agent prose fragment generation via graph walking.
 *
 * Tests 4 agent resolvers (archetype, culture, faction, disposition).
 * Uses a test graph with agent, culture, and faction nodes/edges.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import type { GraphNode, GraphEdge } from '../../types/graph';
import {
  archetypeResolver,
  agentCultureResolver,
  agentFactionResolver,
  dispositionResolver,
} from '../proseResolvers';

function buildAgentTestGraph(): { graph: WorldGraph; agentId: string } {
  const graph = new WorldGraph();

  // Agent: Kael (tragic_hero archetype, tit-for-tat cooperation)
  const agent: GraphNode = {
    id: 'ind_0',
    type: 'actor',
    name: 'Kael',
    properties: {
      actorType: 'individual',
      narrativeArchetype: 'tragic_hero',
      cooperationStrategy: 'tit-for-tat', // HYPHENS, not underscores
    },
  };
  graph.addNode(agent);

  // Culture: The Ashen Kin (chaos_darkness foundation pair)
  const culture: GraphNode = {
    id: 'culture_0',
    type: 'actor',
    name: 'The Ashen Kin',
    properties: {
      actorType: 'culture',
      cultureIdentity: {
        foundationPair: 'chaos_darkness',
        creationSphere: 'entropy',
        biomeName: 'volcanic',
      },
    },
  };
  graph.addNode(culture);

  // belongs_to edge from agent to culture
  const belongsTo: GraphEdge = {
    id: 'edge_belongs_0',
    source: 'ind_0',
    target: 'culture_0',
    type: 'belongs_to',
    properties: {},
  };
  graph.addEdge(belongsTo);

  // Faction: The Obsidian Watch
  const faction: GraphNode = {
    id: 'fac_0',
    type: 'actor',
    name: 'The Obsidian Watch',
    properties: {
      actorType: 'faction',
    },
  };
  graph.addNode(faction);

  // member_of edge from agent to faction
  const memberOf: GraphEdge = {
    id: 'edge_member_0',
    source: 'ind_0',
    target: 'fac_0',
    type: 'member_of',
    properties: { role: 'leader' },
  };
  graph.addEdge(memberOf);

  return { graph, agentId: 'ind_0' };
}

describe('Prose Resolvers (Agent)', () => {
  const testSeed = 42;

  describe('archetypeResolver', () => {
    it('returns origin layer with priority 100 for valid archetype', () => {
      const { graph, agentId } = buildAgentTestGraph();
      const layers = archetypeResolver(agentId, graph, testSeed);

      expect(layers.length).toBeGreaterThan(0);
      const layer = layers[0];
      expect(layer.priority).toBe(100);
      expect(layer.category).toBe('origin');
      expect(layer.source).toBe('archetypeResolver');
      expect(layer.text).toContain('Kael'); // name placeholder replaced
      expect(layer.text.length).toBeGreaterThan(0);
    });

    it('replaces {name} placeholder with agent name', () => {
      const { graph, agentId } = buildAgentTestGraph();
      const layers = archetypeResolver(agentId, graph, testSeed);

      expect(layers.length).toBeGreaterThan(0);
      expect(layers[0].text).toContain('Kael');
      expect(layers[0].text).not.toContain('{name}');
    });

    it('returns empty array when node missing', () => {
      const { graph } = buildAgentTestGraph();
      const layers = archetypeResolver('nonexistent', graph, testSeed);

      expect(layers).toEqual([]);
    });

    it('returns empty array when narrativeArchetype property missing', () => {
      const graph = new WorldGraph();
      const agent: GraphNode = {
        id: 'ind_no_arch',
        type: 'actor',
        name: 'Nameless',
        properties: {
          actorType: 'individual',
          // no narrativeArchetype
        },
      };
      graph.addNode(agent);

      const layers = archetypeResolver('ind_no_arch', graph, testSeed);
      expect(layers).toEqual([]);
    });

    it('returns empty array when archetype not in content', () => {
      const graph = new WorldGraph();
      const agent: GraphNode = {
        id: 'ind_unknown',
        type: 'actor',
        name: 'Unknown',
        properties: {
          actorType: 'individual',
          narrativeArchetype: 'unknown_archetype_xyz',
        },
      };
      graph.addNode(agent);

      const layers = archetypeResolver('ind_unknown', graph, testSeed);
      expect(layers).toEqual([]);
    });
  });

  describe('agentCultureResolver', () => {
    it('returns character layer with priority 90 when belongs_to culture edge exists', () => {
      const { graph, agentId } = buildAgentTestGraph();
      const layers = agentCultureResolver(agentId, graph, testSeed);

      expect(layers.length).toBeGreaterThan(0);
      const layer = layers[0];
      expect(layer.priority).toBe(90);
      expect(layer.category).toBe('character');
      expect(layer.source).toBe('agentCultureResolver');
      expect(layer.text.length).toBeGreaterThan(0);
    });

    it('uses foundationPair from culture node for prose lookup', () => {
      const { graph, agentId } = buildAgentTestGraph();
      const layers = agentCultureResolver(agentId, graph, testSeed);

      expect(layers.length).toBeGreaterThan(0);
      // chaos_darkness prose should mention chaos and darkness concepts
      expect(layers[0].text.length).toBeGreaterThan(0);
    });

    it('returns empty array when no belongs_to edge exists', () => {
      const graph = new WorldGraph();
      const agent: GraphNode = {
        id: 'ind_isolated',
        type: 'actor',
        name: 'Isolated',
        properties: { actorType: 'individual' },
      };
      graph.addNode(agent);

      const layers = agentCultureResolver('ind_isolated', graph, testSeed);
      expect(layers).toEqual([]);
    });

    it('returns empty array when culture node missing cultureIdentity', () => {
      const graph = new WorldGraph();
      const agent: GraphNode = {
        id: 'ind_1',
        type: 'actor',
        name: 'Agent',
        properties: { actorType: 'individual' },
      };
      graph.addNode(agent);

      const culture: GraphNode = {
        id: 'culture_bad',
        type: 'actor',
        name: 'Bad Culture',
        properties: {
          actorType: 'culture',
          // no cultureIdentity
        },
      };
      graph.addNode(culture);

      const edge: GraphEdge = {
        id: 'edge_bad',
        source: 'ind_1',
        target: 'culture_bad',
        type: 'belongs_to',
        properties: {},
      };
      graph.addEdge(edge);

      const layers = agentCultureResolver('ind_1', graph, testSeed);
      expect(layers).toEqual([]);
    });

    it('returns empty array when culture missing foundationPair', () => {
      const graph = new WorldGraph();
      const agent: GraphNode = {
        id: 'ind_2',
        type: 'actor',
        name: 'Agent',
        properties: { actorType: 'individual' },
      };
      graph.addNode(agent);

      const culture: GraphNode = {
        id: 'culture_no_pair',
        type: 'actor',
        name: 'Incomplete Culture',
        properties: {
          actorType: 'culture',
          cultureIdentity: {
            creationSphere: 'entropy',
            // no foundationPair
          },
        },
      };
      graph.addNode(culture);

      const edge: GraphEdge = {
        id: 'edge_no_pair',
        source: 'ind_2',
        target: 'culture_no_pair',
        type: 'belongs_to',
        properties: {},
      };
      graph.addEdge(edge);

      const layers = agentCultureResolver('ind_2', graph, testSeed);
      expect(layers).toEqual([]);
    });
  });

  describe('agentFactionResolver', () => {
    it('returns character layer with priority 70 when member_of faction edge exists', () => {
      const { graph, agentId } = buildAgentTestGraph();
      const layers = agentFactionResolver(agentId, graph, testSeed);

      expect(layers.length).toBeGreaterThan(0);
      const layer = layers[0];
      expect(layer.priority).toBe(70);
      expect(layer.category).toBe('character');
      expect(layer.source).toBe('agentFactionResolver');
      expect(layer.text).toContain('Obsidian Watch');
      expect(layer.text.length).toBeGreaterThan(0);
    });

    it('replaces {faction} placeholder with faction name', () => {
      const { graph, agentId } = buildAgentTestGraph();
      const layers = agentFactionResolver(agentId, graph, testSeed);

      expect(layers.length).toBeGreaterThan(0);
      expect(layers[0].text).toContain('Obsidian Watch');
      expect(layers[0].text).not.toContain('{faction}');
    });

    it('returns empty array when no member_of edge exists', () => {
      const graph = new WorldGraph();
      const agent: GraphNode = {
        id: 'ind_unaffiliated',
        type: 'actor',
        name: 'Unaffiliated',
        properties: { actorType: 'individual' },
      };
      graph.addNode(agent);

      const layers = agentFactionResolver('ind_unaffiliated', graph, testSeed);
      expect(layers).toEqual([]);
    });

    it('returns empty array when agent node missing', () => {
      const { graph } = buildAgentTestGraph();

      const layers = agentFactionResolver('nonexistent', graph, testSeed);
      expect(layers).toEqual([]);
    });
  });

  describe('dispositionResolver', () => {
    it('returns character layer with priority 60 for valid cooperation strategy', () => {
      const { graph, agentId } = buildAgentTestGraph();
      const layers = dispositionResolver(agentId, graph, testSeed);

      expect(layers.length).toBeGreaterThan(0);
      const layer = layers[0];
      expect(layer.priority).toBe(60);
      expect(layer.category).toBe('character');
      expect(layer.source).toBe('dispositionResolver');
      expect(layer.text).toContain('Kael'); // name placeholder replaced
      expect(layer.text.length).toBeGreaterThan(0);
    });

    it('replaces {name} placeholder with agent name', () => {
      const { graph, agentId } = buildAgentTestGraph();
      const layers = dispositionResolver(agentId, graph, testSeed);

      expect(layers.length).toBeGreaterThan(0);
      expect(layers[0].text).toContain('Kael');
      expect(layers[0].text).not.toContain('{name}');
    });

    it('returns empty array when node missing', () => {
      const { graph } = buildAgentTestGraph();
      const layers = dispositionResolver('nonexistent', graph, testSeed);

      expect(layers).toEqual([]);
    });

    it('returns empty array when cooperationStrategy property missing', () => {
      const graph = new WorldGraph();
      const agent: GraphNode = {
        id: 'ind_no_strategy',
        type: 'actor',
        name: 'Unaligned',
        properties: {
          actorType: 'individual',
          // no cooperationStrategy
        },
      };
      graph.addNode(agent);

      const layers = dispositionResolver('ind_no_strategy', graph, testSeed);
      expect(layers).toEqual([]);
    });

    it('returns empty array when strategy not in content', () => {
      const graph = new WorldGraph();
      const agent: GraphNode = {
        id: 'ind_unknown_strat',
        type: 'actor',
        name: 'Unknown',
        properties: {
          actorType: 'individual',
          cooperationStrategy: 'unknown_strategy_xyz',
        },
      };
      graph.addNode(agent);

      const layers = dispositionResolver('ind_unknown_strat', graph, testSeed);
      expect(layers).toEqual([]);
    });

    it('handles all 5 cooperation strategies (with hyphens)', () => {
      const strategies = [
        'tit-for-tat',
        'grudger',
        'pavlov',
        'always-cooperate',
        'always-defect',
      ];

      for (const strategy of strategies) {
        const graph = new WorldGraph();
        const agent: GraphNode = {
          id: 'ind_strat',
          type: 'actor',
          name: 'Strategist',
          properties: {
            actorType: 'individual',
            cooperationStrategy: strategy,
          },
        };
        graph.addNode(agent);

        const layers = dispositionResolver('ind_strat', graph, testSeed);
        expect(layers.length).toBeGreaterThan(0);
        expect(layers[0].text).toContain('Strategist');
      }
    });
  });

  describe('all agent resolvers together', () => {
    it('all return properly prioritized layers for complete agent', () => {
      const { graph, agentId } = buildAgentTestGraph();

      const archLayers = archetypeResolver(agentId, graph, testSeed);
      const cultLayers = agentCultureResolver(agentId, graph, testSeed);
      const factLayers = agentFactionResolver(agentId, graph, testSeed);
      const dispLayers = dispositionResolver(agentId, graph, testSeed);

      // All should return valid layers
      expect(archLayers.length).toBeGreaterThan(0);
      expect(cultLayers.length).toBeGreaterThan(0);
      expect(factLayers.length).toBeGreaterThan(0);
      expect(dispLayers.length).toBeGreaterThan(0);

      // Priorities should be in correct order
      expect(archLayers[0].priority).toBe(100);
      expect(cultLayers[0].priority).toBe(90);
      expect(factLayers[0].priority).toBe(70);
      expect(dispLayers[0].priority).toBe(60);

      // All should have 'character' or 'origin' category
      expect(['origin', 'character']).toContain(archLayers[0].category);
      expect(['origin', 'character']).toContain(cultLayers[0].category);
      expect(['origin', 'character']).toContain(factLayers[0].category);
      expect(['origin', 'character']).toContain(dispLayers[0].category);
    });
  });
});
