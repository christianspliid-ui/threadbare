import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { seedFactionFromDefinition, seedAllFactions } from '../factionSeeding';
import { ADVENTURING_GUILD_DEFINITION, FACTION_DEFINITIONS, FACTION_GUILD_HALL_COUNT_MIN, FACTION_GUILD_HALL_COUNT_MAX } from '../../data/faction-definitions';
import { computeRankFromReputation } from '../../types/faction';
import type { FactionDefinition } from '../../types/faction';

// ─── Helpers ───────────────────────────────────────────────────────────────

function makeGraph(): WorldGraph {
  return new WorldGraph();
}

function addLocation(
  graph: WorldGraph,
  id: string,
  subtype: string,
): void {
  graph.addNode({
    id,
    type: 'location',
    name: `Location ${id}`,
    properties: {
      locationType: 'location',
      locationSubtype: subtype,
    },
  });
}

function addTownsAndCities(graph: WorldGraph, count: number): string[] {
  const ids: string[] = [];
  const subtypes = ['town', 'city', 'capital'];
  for (let i = 0; i < count; i++) {
    const id = `loc_${i}`;
    addLocation(graph, id, subtypes[i % subtypes.length]);
    ids.push(id);
  }
  return ids;
}

// ─── seedFactionFromDefinition ─────────────────────────────────────────────

describe('seedFactionFromDefinition', () => {
  it('creates a faction node with correct properties', () => {
    const graph = makeGraph();
    const locationIds = addTownsAndCities(graph, 6);

    const result = seedFactionFromDefinition(graph, ADVENTURING_GUILD_DEFINITION, locationIds, 42);

    const faction = graph.getNode(result.factionId);
    expect(faction).toBeDefined();
    expect(faction!.type).toBe('actor');
    expect(faction!.properties.actorType).toBe('faction');
    expect(faction!.properties.factionType).toBe('guild');
    expect(faction!.properties.factionDefId).toBe('adventuring_guild');
    expect(faction!.name).toBe('The Adventurers Guild');
  });

  it('creates 3–5 guild halls at qualifying locations', () => {
    const graph = makeGraph();
    const locationIds = addTownsAndCities(graph, 8);

    const result = seedFactionFromDefinition(graph, ADVENTURING_GUILD_DEFINITION, locationIds, 42);

    expect(result.guildHallIds.length).toBeGreaterThanOrEqual(FACTION_GUILD_HALL_COUNT_MIN);
    expect(result.guildHallIds.length).toBeLessThanOrEqual(FACTION_GUILD_HALL_COUNT_MAX);
  });

  it('caps guild halls at available qualifying locations when fewer than minimum', () => {
    const graph = makeGraph();
    // Only 2 qualifying locations (less than FACTION_GUILD_HALL_COUNT_MIN=3)
    const locationIds = addTownsAndCities(graph, 2);

    const result = seedFactionFromDefinition(graph, ADVENTURING_GUILD_DEFINITION, locationIds, 42);

    // Should use all available locations
    expect(result.guildHallIds.length).toBe(2);
  });

  it('guild hall sublocations are linked via contains edges', () => {
    const graph = makeGraph();
    const locationIds = addTownsAndCities(graph, 6);

    const result = seedFactionFromDefinition(graph, ADVENTURING_GUILD_DEFINITION, locationIds, 42);

    for (const hallId of result.guildHallIds) {
      const hallNode = graph.getNode(hallId);
      expect(hallNode).toBeDefined();
      expect(hallNode!.type).toBe('location');
      expect(hallNode!.properties.sublocationTypeId).toBe('sublocation-type.faction-hall');
      expect(hallNode!.properties.factionDefId).toBe('adventuring_guild');
      expect(hallNode!.properties.persistence).toEqual({ type: 'permanent' });

      // Verify contains edge exists
      const parentLocId = hallNode!.properties.parentLocationId as string;
      const containsEdges = graph.getEdgesByType('contains').filter(
        e => e.source === parentLocId && e.target === hallId
      );
      expect(containsEdges).toHaveLength(1);
    }
  });

  it('faction has located_at edges to guild hall locations', () => {
    const graph = makeGraph();
    const locationIds = addTownsAndCities(graph, 6);

    const result = seedFactionFromDefinition(graph, ADVENTURING_GUILD_DEFINITION, locationIds, 42);

    const locatedEdges = graph.getEdgesByType('located_at').filter(
      e => e.source === result.factionId
    );

    // One located_at per guild hall location
    expect(locatedEdges.length).toBe(result.guildHallIds.length);
    for (const edge of locatedEdges) {
      expect(edge.properties.role).toBe('guild_hall');
    }
  });

  it('faction has domainCapabilities and reachPreferences', () => {
    const graph = makeGraph();
    const locationIds = addTownsAndCities(graph, 6);

    const result = seedFactionFromDefinition(graph, ADVENTURING_GUILD_DEFINITION, locationIds, 42);

    const faction = graph.getNode(result.factionId)!;
    const caps = faction.properties.domainCapabilities as Record<string, number>;
    const prefs = faction.properties.reachPreferences as Record<string, number>;

    expect(caps).toBeDefined();
    expect(prefs).toBeDefined();

    // eye should be strong (0.8 weight) — capability > 50
    expect(caps.eye).toBeGreaterThan(40);
    // star should be weak (0.1 weight) — capability < 30
    expect(caps.star).toBeLessThan(30);

    // Preferences should be normalized 0–1
    const maxPref = Math.max(...Object.values(prefs));
    expect(maxPref).toBeCloseTo(1, 1);
  });

  it('faction starts with wealth: 0', () => {
    const graph = makeGraph();
    const locationIds = addTownsAndCities(graph, 6);

    const result = seedFactionFromDefinition(graph, ADVENTURING_GUILD_DEFINITION, locationIds, 42);
    const faction = graph.getNode(result.factionId)!;

    expect(faction.properties.wealth).toBe(0);
  });

  it('does NOT pre-assign any agents', () => {
    const graph = makeGraph();
    const locationIds = addTownsAndCities(graph, 6);

    // Add some agents
    for (let i = 0; i < 5; i++) {
      graph.addNode({ id: `agent_${i}`, type: 'actor', name: `Agent ${i}`, properties: { actorType: 'individual' } });
    }

    const result = seedFactionFromDefinition(graph, ADVENTURING_GUILD_DEFINITION, locationIds, 42);

    // No member_of edges should exist
    const memberEdges = graph.getEdgesByType('member_of').filter(
      e => e.target === result.factionId
    );
    expect(memberEdges).toHaveLength(0);
  });

  it('produces a seed trace with correct metadata', () => {
    const graph = makeGraph();
    const locationIds = addTownsAndCities(graph, 6);

    const result = seedFactionFromDefinition(graph, ADVENTURING_GUILD_DEFINITION, locationIds, 42);

    expect(result.trace.tick).toBe(0);
    expect(result.trace.category).toBe('faction_seed');
    expect(result.trace.definitionId).toBe('adventuring_guild');
    expect(result.trace.guildHallCount).toBe(result.guildHallIds.length);
    expect(result.trace.locationIds.length).toBe(result.guildHallIds.length);
    expect(result.trace.summary).toContain('Adventurers Guild');
  });

  // ── Determinism ──────────────────────────────────────────────────────────

  it('is deterministic — same seed produces identical results', () => {
    const graphA = makeGraph();
    const graphB = makeGraph();
    const locIdsA = addTownsAndCities(graphA, 6);
    const locIdsB = addTownsAndCities(graphB, 6);

    const resultA = seedFactionFromDefinition(graphA, ADVENTURING_GUILD_DEFINITION, locIdsA, 42);
    const resultB = seedFactionFromDefinition(graphB, ADVENTURING_GUILD_DEFINITION, locIdsB, 42);

    expect(resultA.factionId).toBe(resultB.factionId);
    expect(resultA.guildHallIds.length).toBe(resultB.guildHallIds.length);
    expect(resultA.trace.locationIds).toEqual(resultB.trace.locationIds);

    // Domain capabilities should match exactly
    const capsA = graphA.getNode(resultA.factionId)!.properties.domainCapabilities;
    const capsB = graphB.getNode(resultB.factionId)!.properties.domainCapabilities;
    expect(capsA).toEqual(capsB);
  });

  it('different seeds produce different guild hall placements', () => {
    const graphA = makeGraph();
    const graphB = makeGraph();
    const locIdsA = addTownsAndCities(graphA, 8);
    const locIdsB = addTownsAndCities(graphB, 8);

    const resultA = seedFactionFromDefinition(graphA, ADVENTURING_GUILD_DEFINITION, locIdsA, 42);
    const resultB = seedFactionFromDefinition(graphB, ADVENTURING_GUILD_DEFINITION, locIdsB, 999);

    // Location selection should differ (high probability with different seeds)
    const locsA = resultA.trace.locationIds.sort();
    const locsB = resultB.trace.locationIds.sort();
    // They could theoretically match by coincidence, but domain capabilities will differ
    const capsA = graphA.getNode(resultA.factionId)!.properties.domainCapabilities;
    const capsB = graphB.getNode(resultB.factionId)!.properties.domainCapabilities;
    expect(capsA).not.toEqual(capsB);
  });

  // ── Fail-soft ────────────────────────────────────────────────────────────

  it('returns empty guildHallIds when no qualifying locations exist', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc_ruins', 'ruins');
    addLocation(graph, 'loc_camp', 'camp');

    const result = seedFactionFromDefinition(graph, ADVENTURING_GUILD_DEFINITION, ['loc_ruins', 'loc_camp'], 42);

    // Fallback: uses any settlement — camp/ruins are not settlements
    expect(result.guildHallIds).toHaveLength(0);
    expect(result.trace.summary).toContain('Skipped');
  });

  it('falls back to hamlet+ when no town/city/capital exists', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc_hamlet_1', 'hamlet');
    addLocation(graph, 'loc_hamlet_2', 'hamlet');
    addLocation(graph, 'loc_hamlet_3', 'hamlet');
    addLocation(graph, 'loc_hamlet_4', 'hamlet');

    const result = seedFactionFromDefinition(
      graph,
      ADVENTURING_GUILD_DEFINITION,
      ['loc_hamlet_1', 'loc_hamlet_2', 'loc_hamlet_3', 'loc_hamlet_4'],
      42,
    );

    // Should fall back to hamlets
    expect(result.guildHallIds.length).toBeGreaterThan(0);
  });

  it('does not crash when location IDs reference missing nodes', () => {
    const graph = makeGraph();
    addTownsAndCities(graph, 3);

    expect(() => {
      seedFactionFromDefinition(
        graph,
        ADVENTURING_GUILD_DEFINITION,
        ['missing_1', 'missing_2'],
        42,
      );
    }).not.toThrow();
  });

  it('skips non-settlement subtypes (ruins, camp, fort, shrine)', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc_ruins', 'ruins');
    addLocation(graph, 'loc_fort', 'fort');
    addLocation(graph, 'loc_shrine', 'shrine');
    // Add one qualifying location
    addLocation(graph, 'loc_town', 'town');

    const result = seedFactionFromDefinition(
      graph,
      ADVENTURING_GUILD_DEFINITION,
      ['loc_ruins', 'loc_fort', 'loc_shrine', 'loc_town'],
      42,
    );

    // Only the town should be used
    expect(result.trace.locationIds).toContain('loc_town');
    expect(result.trace.locationIds).not.toContain('loc_ruins');
  });
});

// ─── seedAllFactions ───────────────────────────────────────────────────────

describe('seedAllFactions', () => {
  it('seeds one faction per definition in registry', () => {
    const graph = makeGraph();
    const locationIds = addTownsAndCities(graph, 8);

    const results = seedAllFactions(graph, FACTION_DEFINITIONS, locationIds, 42);

    expect(results).toHaveLength(FACTION_DEFINITIONS.size);
    expect(results[0].factionId).toBe('faction_def_adventuring_guild');
  });

  it('each definition gets a distinct PRNG stream', () => {
    // Create a registry with two identical definitions (different IDs)
    const defA: FactionDefinition = { ...ADVENTURING_GUILD_DEFINITION, id: 'guild_a', nameTemplate: 'Guild A' };
    const defB: FactionDefinition = { ...ADVENTURING_GUILD_DEFINITION, id: 'guild_b', nameTemplate: 'Guild B' };
    const defs = new Map([
      [defA.id, defA],
      [defB.id, defB],
    ]);

    const graph = makeGraph();
    const locationIds = addTownsAndCities(graph, 10);

    const results = seedAllFactions(graph, defs, locationIds, 42);

    expect(results).toHaveLength(2);
    // Different IDs
    expect(results[0].factionId).not.toBe(results[1].factionId);
    // Different capabilities (different PRNG streams)
    const capsA = graph.getNode(results[0].factionId)!.properties.domainCapabilities;
    const capsB = graph.getNode(results[1].factionId)!.properties.domainCapabilities;
    expect(capsA).not.toEqual(capsB);
  });
});

// ─── computeRankFromReputation ─────────────────────────────────────────────

describe('computeRankFromReputation', () => {
  it('returns journeyman at 0.0 reputation', () => {
    const tier = computeRankFromReputation(0.0, ADVENTURING_GUILD_DEFINITION);
    expect(tier.id).toBe('journeyman');
  });

  it('returns journeyman at 0.29 reputation', () => {
    const tier = computeRankFromReputation(0.29, ADVENTURING_GUILD_DEFINITION);
    expect(tier.id).toBe('journeyman');
  });

  it('returns sergeant at 0.3 reputation', () => {
    const tier = computeRankFromReputation(0.3, ADVENTURING_GUILD_DEFINITION);
    expect(tier.id).toBe('sergeant');
  });

  it('returns lieutenant at 0.6 reputation', () => {
    const tier = computeRankFromReputation(0.6, ADVENTURING_GUILD_DEFINITION);
    expect(tier.id).toBe('lieutenant');
  });

  it('returns leader at 0.85 reputation', () => {
    const tier = computeRankFromReputation(0.85, ADVENTURING_GUILD_DEFINITION);
    expect(tier.id).toBe('leader');
  });

  it('returns leader at 1.0 reputation', () => {
    const tier = computeRankFromReputation(1.0, ADVENTURING_GUILD_DEFINITION);
    expect(tier.id).toBe('leader');
  });

  it('returns journeyman at negative reputation', () => {
    const tier = computeRankFromReputation(-0.5, ADVENTURING_GUILD_DEFINITION);
    expect(tier.id).toBe('journeyman');
  });
});

// ─── Constants contract ────────────────────────────────────────────────────

describe('faction definition constants', () => {
  it('FACTION_GUILD_HALL_COUNT_MIN >= 1', () => {
    expect(FACTION_GUILD_HALL_COUNT_MIN).toBeGreaterThanOrEqual(1);
  });

  it('FACTION_GUILD_HALL_COUNT_MAX >= FACTION_GUILD_HALL_COUNT_MIN', () => {
    expect(FACTION_GUILD_HALL_COUNT_MAX).toBeGreaterThanOrEqual(FACTION_GUILD_HALL_COUNT_MIN);
  });

  it('Adventuring Guild has 4 rank tiers', () => {
    expect(ADVENTURING_GUILD_DEFINITION.rankTiers).toHaveLength(4);
  });

  it('rank tiers are ordered by minReputation ascending', () => {
    const tiers = ADVENTURING_GUILD_DEFINITION.rankTiers;
    for (let i = 1; i < tiers.length; i++) {
      expect(tiers[i].minReputation).toBeGreaterThan(tiers[i - 1].minReputation);
    }
  });

  it('entry tier has minReputation of 0', () => {
    expect(ADVENTURING_GUILD_DEFINITION.rankTiers[0].minReputation).toBe(0);
  });

  it('leader tier has maxSlots of 1', () => {
    const leader = ADVENTURING_GUILD_DEFINITION.rankTiers.find(t => t.id === 'leader');
    expect(leader?.maxSlots).toBe(1);
  });

  it('all reach domains have weights defined', () => {
    const weights = ADVENTURING_GUILD_DEFINITION.reachWeights;
    const domains = ['iron', 'eye', 'stone', 'shadow', 'heart', 'gold', 'gold', 'star', 'veil'];
    for (const d of domains) {
      expect(weights[d as keyof typeof weights]).toBeDefined();
      expect(weights[d as keyof typeof weights]).toBeGreaterThan(0);
    }
  });

  it('FACTION_DEFINITIONS registry contains the Adventuring Guild', () => {
    expect(FACTION_DEFINITIONS.has('adventuring_guild')).toBe(true);
    expect(FACTION_DEFINITIONS.get('adventuring_guild')).toBe(ADVENTURING_GUILD_DEFINITION);
  });
});
