/**
 * Guild Identity Prose Resolver Tests — location and faction guild prose.
 *
 * Tests guildIdentityResolver (location → contains → guild_hall → guild → guildType)
 * and guildFactionIdentityResolver (faction actor with guildType property).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import type { GraphNode, GraphEdge } from '../../types/graph';
import {
  guildIdentityResolver,
  guildFactionIdentityResolver,
} from '../proseResolvers';
import { GUILD_IDENTITY_PROSE } from '../../data/prose-layer-content';

describe('guildIdentityResolver (location)', () => {
  let graph: WorldGraph;
  const testSeed = 42;

  beforeEach(() => {
    graph = new WorldGraph();

    // Location: Thornhaven (town)
    const location: GraphNode = {
      id: 'loc_0',
      type: 'location',
      name: 'Thornhaven',
      properties: {
        locationSubtype: 'town',
        terrain: 'grassland',
      },
    };
    graph.addNode(location);

    // Guild faction actor (miners guild)
    const guild: GraphNode = {
      id: 'guild_0',
      type: 'actor',
      name: 'The Thornhaven Miners\' Brotherhood',
      properties: {
        actorType: 'faction',
        guildType: 'miners',
        wealth: 25,
      },
    };
    graph.addNode(guild);

    // Guild hall sublocation
    const guildHall: GraphNode = {
      id: 'subloc.guild-hall-guild_0-abc123',
      type: 'location',
      name: 'Guild Hall (The Thornhaven Miners\' Brotherhood)',
      properties: {
        sublocationTypeId: 'sublocation-type.guild-hall',
        parentLocationId: 'loc_0',
        guildId: 'guild_0',
        persistence: { type: 'permanent' },
      },
    };
    graph.addNode(guildHall);

    // contains edge: location → guild hall
    const containsEdge: GraphEdge = {
      id: 'edge_contains_0',
      source: 'loc_0',
      target: 'subloc.guild-hall-guild_0-abc123',
      type: 'contains',
      properties: {},
    };
    graph.addEdge(containsEdge);
  });

  it('returns character layer with priority 55 for location with guild hall', () => {
    const layers = guildIdentityResolver('loc_0', graph, testSeed);

    expect(layers).toHaveLength(1);
    const layer = layers[0];
    expect(layer.category).toBe('character');
    expect(layer.priority).toBe(55);
    expect(layer.source).toBe('guildIdentityResolver');
    expect(layer.text.length).toBeGreaterThan(0);
  });

  it('selects prose from the correct guild type (miners)', () => {
    const layers = guildIdentityResolver('loc_0', graph, testSeed);

    expect(layers).toHaveLength(1);
    const minersProse = GUILD_IDENTITY_PROSE.miners;
    expect(minersProse).toContain(layers[0].text);
  });

  it('returns empty array for missing node', () => {
    expect(guildIdentityResolver('nonexistent', graph, testSeed)).toEqual([]);
  });

  it('returns empty array for location with no contains edges', () => {
    const isolated: GraphNode = {
      id: 'loc_isolated',
      type: 'location',
      name: 'Isolated',
      properties: {},
    };
    graph.addNode(isolated);

    expect(guildIdentityResolver('loc_isolated', graph, testSeed)).toEqual([]);
  });

  it('returns empty array when contains edges lead to non-guild-hall sublocations', () => {
    const market: GraphNode = {
      id: 'subloc.market',
      type: 'location',
      name: 'Market Square',
      properties: {
        sublocationTypeId: 'sublocation-type.market-square',
        parentLocationId: 'loc_0',
      },
    };
    graph.addNode(market);
    graph.addEdge({
      id: 'edge_market',
      source: 'loc_0',
      target: 'subloc.market',
      type: 'contains',
      properties: {},
    });

    // Remove the guild hall to test this path
    const isolated: GraphNode = {
      id: 'loc_market_only',
      type: 'location',
      name: 'Market Town',
      properties: {},
    };
    graph.addNode(isolated);
    graph.addEdge({
      id: 'edge_market2',
      source: 'loc_market_only',
      target: 'subloc.market',
      type: 'contains',
      properties: {},
    });

    expect(guildIdentityResolver('loc_market_only', graph, testSeed)).toEqual([]);
  });

  it('returns empty when guild hall has no guildId', () => {
    const badHall: GraphNode = {
      id: 'subloc.bad-hall',
      type: 'location',
      name: 'Broken Guild Hall',
      properties: {
        sublocationTypeId: 'sublocation-type.guild-hall',
        parentLocationId: 'loc_0',
        // no guildId
      },
    };
    graph.addNode(badHall);

    const loc2: GraphNode = {
      id: 'loc_bad_hall',
      type: 'location',
      name: 'Bad Hall Town',
      properties: {},
    };
    graph.addNode(loc2);
    graph.addEdge({
      id: 'edge_bad_hall',
      source: 'loc_bad_hall',
      target: 'subloc.bad-hall',
      type: 'contains',
      properties: {},
    });

    expect(guildIdentityResolver('loc_bad_hall', graph, testSeed)).toEqual([]);
  });

  it('is deterministic — same seed produces same result', () => {
    const a = guildIdentityResolver('loc_0', graph, 123);
    const b = guildIdentityResolver('loc_0', graph, 123);
    expect(a).toEqual(b);
  });

  it('different seeds can produce different results', () => {
    // Try multiple seeds — at least one should differ
    const results = new Set<string>();
    for (let seed = 0; seed < 50; seed++) {
      const layers = guildIdentityResolver('loc_0', graph, seed);
      if (layers.length > 0) results.add(layers[0].text);
    }
    // With 4 miners fragments and 50 seeds, we should see variety
    expect(results.size).toBeGreaterThan(1);
  });

  it('works with each guild type', () => {
    const guildTypes = ['miners', 'artisans', 'traders', 'bankers', 'merchants'];

    for (const guildType of guildTypes) {
      // Update the guild node's guildType via updateNode
      graph.updateNode('guild_0', {
        name: `The ${guildType} guild`,
        properties: {
          actorType: 'faction',
          guildType,
        },
      });

      const layers = guildIdentityResolver('loc_0', graph, testSeed);
      expect(layers).toHaveLength(1);
      expect(GUILD_IDENTITY_PROSE[guildType]).toContain(layers[0].text);
    }
  });
});

describe('guildFactionIdentityResolver (actor)', () => {
  let graph: WorldGraph;
  const testSeed = 42;

  beforeEach(() => {
    graph = new WorldGraph();

    // Miners guild faction
    graph.addNode({
      id: 'guild_miners',
      type: 'actor',
      name: 'The Ironvein Miners\' Brotherhood',
      properties: {
        actorType: 'faction',
        guildType: 'miners',
        wealth: 30,
      },
    });

    // Bankers guild faction
    graph.addNode({
      id: 'guild_bankers',
      type: 'actor',
      name: 'The Silver Ledger',
      properties: {
        actorType: 'faction',
        guildType: 'bankers',
        wealth: 100,
      },
    });
  });

  it('returns origin layer with priority 100 for guild faction', () => {
    const layers = guildFactionIdentityResolver('guild_miners', graph, testSeed);

    expect(layers).toHaveLength(1);
    const layer = layers[0];
    expect(layer.category).toBe('origin');
    expect(layer.priority).toBe(100);
    expect(layer.source).toBe('guildFactionIdentityResolver');
    expect(layer.text.length).toBeGreaterThan(0);
  });

  it('selects prose from the correct guild type', () => {
    const miners = guildFactionIdentityResolver('guild_miners', graph, testSeed);
    expect(GUILD_IDENTITY_PROSE.miners).toContain(miners[0].text);

    const bankers = guildFactionIdentityResolver('guild_bankers', graph, testSeed);
    expect(GUILD_IDENTITY_PROSE.bankers).toContain(bankers[0].text);
  });

  it('returns empty array for missing node', () => {
    expect(guildFactionIdentityResolver('nonexistent', graph, testSeed)).toEqual([]);
  });

  it('returns empty array for actor without guildType', () => {
    graph.addNode({
      id: 'regular_faction',
      type: 'actor',
      name: 'The Iron Covenant',
      properties: {
        actorType: 'faction',
        // no guildType
      },
    });

    expect(guildFactionIdentityResolver('regular_faction', graph, testSeed)).toEqual([]);
  });

  it('falls back to merchants for unknown guild type', () => {
    graph.addNode({
      id: 'guild_unknown',
      type: 'actor',
      name: 'Unknown Guild',
      properties: {
        actorType: 'faction',
        guildType: 'unknown_type_xyz',
      },
    });

    const layers = guildFactionIdentityResolver('guild_unknown', graph, testSeed);
    expect(layers).toHaveLength(1);
    expect(GUILD_IDENTITY_PROSE.merchants).toContain(layers[0].text);
  });

  it('is deterministic — same seed produces same result', () => {
    const a = guildFactionIdentityResolver('guild_miners', graph, 123);
    const b = guildFactionIdentityResolver('guild_miners', graph, 123);
    expect(a).toEqual(b);
  });

  it('works with all 5 guild types', () => {
    const guildTypes = ['miners', 'artisans', 'traders', 'bankers', 'merchants'];

    for (const guildType of guildTypes) {
      graph.addNode({
        id: `guild_test_${guildType}`,
        type: 'actor',
        name: `Test ${guildType} guild`,
        properties: {
          actorType: 'faction',
          guildType,
        },
      });

      const layers = guildFactionIdentityResolver(`guild_test_${guildType}`, graph, testSeed);
      expect(layers).toHaveLength(1);
      expect(GUILD_IDENTITY_PROSE[guildType]).toContain(layers[0].text);
    }
  });
});
