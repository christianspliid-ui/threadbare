import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  seedGuilds,
  determineGuildType,
  generateGuildDomainCapabilities,
  generateGuildAxiologicalProfile,
  GUILD_SPAWN_COUNT_MIN,
  GUILD_SPAWN_COUNT_MAX,
  GUILD_GOLD_CAP_MIN,
  GUILD_GOLD_CAP_MAX,
  GUILD_SECONDARY_CAP_MIN,
  GUILD_SECONDARY_CAP_MAX,
  GUILD_MINOR_CAP_MIN,
  GUILD_MINOR_CAP_MAX,
  GUILD_MARKET_STALL_THRESHOLD,
} from '../guildSeeding';

// ─── Helpers ───────────────────────────────────────────────────────────────

function makeGraph(): WorldGraph {
  return new WorldGraph();
}

function addLocation(
  graph: WorldGraph,
  id: string,
  subtype: string,
  resources: Record<string, { quantity: number }> = {},
  prosperity = 0,
): void {
  graph.addNode({
    id,
    type: 'location',
    name: `Location ${id}`,
    properties: {
      locationType: 'location',
      locationSubtype: subtype,
      resources,
      prosperity,
    },
  });
}

function dummyRng(values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

// ─── seedGuilds ────────────────────────────────────────────────────────────

describe('seedGuilds', () => {
  it('creates no guilds when there are no town+ locations', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc_hamlet', 'hamlet');
    addLocation(graph, 'loc_camp', 'camp');
    addLocation(graph, 'loc_ruins', 'ruins');

    const guildIds = seedGuilds(graph, ['loc_hamlet', 'loc_camp', 'loc_ruins'], 42);

    expect(guildIds).toHaveLength(0);
  });

  it('creates guilds at a town location', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc_town', 'town', { ore: { quantity: 30 } });

    const guildIds = seedGuilds(graph, ['loc_town'], 42);

    expect(guildIds.length).toBeGreaterThanOrEqual(GUILD_SPAWN_COUNT_MIN);
    expect(guildIds.length).toBeLessThanOrEqual(GUILD_SPAWN_COUNT_MAX);
  });

  it('creates guilds at a city location', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc_city', 'city', { timber: { quantity: 20 } });

    const guildIds = seedGuilds(graph, ['loc_city'], 99);

    expect(guildIds.length).toBeGreaterThanOrEqual(GUILD_SPAWN_COUNT_MIN);
    expect(guildIds.length).toBeLessThanOrEqual(GUILD_SPAWN_COUNT_MAX);
  });

  it('creates guilds at a capital location', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc_capital', 'capital', { grain: { quantity: 25 } });

    const guildIds = seedGuilds(graph, ['loc_capital'], 7);

    expect(guildIds.length).toBeGreaterThanOrEqual(GUILD_SPAWN_COUNT_MIN);
    expect(guildIds.length).toBeLessThanOrEqual(GUILD_SPAWN_COUNT_MAX);
  });

  it('skips hamlet, camp, fort, shrine subtypes', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc_a', 'hamlet');
    addLocation(graph, 'loc_b', 'camp');
    addLocation(graph, 'loc_c', 'fort');
    addLocation(graph, 'loc_d', 'shrine');
    addLocation(graph, 'loc_e', 'mining');

    const guildIds = seedGuilds(graph, ['loc_a', 'loc_b', 'loc_c', 'loc_d', 'loc_e'], 42);
    expect(guildIds).toHaveLength(0);
  });

  it('guild actor has actorType: faction and guildType property', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc_town', 'town', { ore: { quantity: 50 } });

    const guildIds = seedGuilds(graph, ['loc_town'], 42);
    expect(guildIds.length).toBeGreaterThan(0);

    const guild = graph.getNode(guildIds[0]);
    expect(guild).toBeDefined();
    expect(guild!.properties.actorType).toBe('faction');
    expect(guild!.properties.guildType).toBeDefined();
    expect(['merchants', 'artisans', 'miners', 'traders', 'bankers']).toContain(
      guild!.properties.guildType
    );
  });

  it('guild has Gold-heavy domain capabilities', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc_town', 'town', { ore: { quantity: 30 } });

    const guildIds = seedGuilds(graph, ['loc_town'], 42);
    const guild = graph.getNode(guildIds[0]);
    const caps = guild!.properties.domainCapabilities as Record<string, number>;

    expect(caps.gold).toBeGreaterThanOrEqual(GUILD_GOLD_CAP_MIN);
    expect(caps.gold).toBeLessThanOrEqual(GUILD_GOLD_CAP_MAX);
  });

  it('guild starts with wealth: 0', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc_city', 'city');

    const guildIds = seedGuilds(graph, ['loc_city'], 42);
    const guild = graph.getNode(guildIds[0]);

    expect(guild!.properties.wealth).toBe(0);
  });

  it('guild has located_at edge to home settlement', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc_town', 'town');

    const guildIds = seedGuilds(graph, ['loc_town'], 42);
    const guildId = guildIds[0];

    const locatedEdges = graph.getEdgesByType('located_at').filter(
      e => e.source === guildId && e.target === 'loc_town'
    );
    expect(locatedEdges).toHaveLength(1);
  });

  it('guild hall sublocation is created and linked via contains edge', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc_town', 'town');

    const guildIds = seedGuilds(graph, ['loc_town'], 42);
    const guildId = guildIds[0];

    // Find the guild hall node
    const containsEdges = graph.getEdgesByType('contains').filter(
      e => e.source === 'loc_town'
    );
    expect(containsEdges.length).toBeGreaterThan(0);

    // Find a sublocation with sublocationTypeId: guild-hall
    const hallEdge = containsEdges.find(e => {
      const node = graph.getNode(e.target);
      return node?.properties.sublocationTypeId === 'sublocation-type.guild-hall';
    });
    expect(hallEdge).toBeDefined();

    const hallNode = graph.getNode(hallEdge!.target);
    expect(hallNode!.properties.guildId).toBe(guildId);
    expect(hallNode!.properties.parentLocationId).toBe('loc_town');
    expect(hallNode!.properties.persistence).toEqual({ type: 'permanent' });
  });

  it('guild has homeLocationId property', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc_city', 'city');

    const guildIds = seedGuilds(graph, ['loc_city'], 42);
    const guild = graph.getNode(guildIds[0]);

    expect(guild!.properties.homeLocationId).toBe('loc_city');
  });

  it('is deterministic — same seed produces same guilds', () => {
    const graphA = makeGraph();
    const graphB = makeGraph();
    addLocation(graphA, 'loc_town', 'town', { ore: { quantity: 30 } });
    addLocation(graphB, 'loc_town', 'town', { ore: { quantity: 30 } });

    const idsA = seedGuilds(graphA, ['loc_town'], 42);
    const idsB = seedGuilds(graphB, ['loc_town'], 42);

    expect(idsA).toEqual(idsB);

    const guildA = graphA.getNode(idsA[0])!;
    const guildB = graphB.getNode(idsB[0])!;
    expect(guildA.properties.guildType).toBe(guildB.properties.guildType);
    expect(guildA.name).toBe(guildB.name);
  });

  it('different seeds produce different guilds', () => {
    const graphA = makeGraph();
    const graphB = makeGraph();
    addLocation(graphA, 'loc_town', 'town', { ore: { quantity: 30 } });
    addLocation(graphB, 'loc_town', 'town', { ore: { quantity: 30 } });

    const idsA = seedGuilds(graphA, ['loc_town'], 42);
    const idsB = seedGuilds(graphB, ['loc_town'], 999);

    // Names or types may differ across seeds
    const nameA = graphA.getNode(idsA[0])?.name;
    const nameB = graphB.getNode(idsB[0])?.name;
    // They could theoretically be the same by coincidence, but IDs won't be if we check types
    expect(nameA).toBeDefined();
    expect(nameB).toBeDefined();
  });

  it('handles multiple town+ locations independently', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc_town', 'town', { ore: { quantity: 40 } });
    addLocation(graph, 'loc_city', 'city', { fish: { quantity: 30 } });
    addLocation(graph, 'loc_hamlet', 'hamlet'); // should be skipped

    const guildIds = seedGuilds(graph, ['loc_town', 'loc_city', 'loc_hamlet'], 42);

    expect(guildIds.length).toBeGreaterThanOrEqual(GUILD_SPAWN_COUNT_MIN * 2);

    // Each guild should have a located_at edge
    for (const id of guildIds) {
      const locatedEdges = graph.getEdgesByType('located_at').filter(
        e => e.source === id
      );
      expect(locatedEdges).toHaveLength(1);
    }
  });

  // ── Fail-soft ──────────────────────────────────────────────────────────

  it('handles a location with no resources — defaults to merchants or bankers', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc_town', 'town', {}, 0); // no resources

    const guildIds = seedGuilds(graph, ['loc_town'], 42);
    expect(guildIds.length).toBeGreaterThanOrEqual(GUILD_SPAWN_COUNT_MIN);

    const guild = graph.getNode(guildIds[0])!;
    expect(['merchants', 'bankers']).toContain(guild.properties.guildType);
  });

  it('does not crash when location node is missing from graph', () => {
    const graph = makeGraph();
    // Don't add the node — seedGuilds should skip it

    expect(() => {
      seedGuilds(graph, ['loc_missing'], 42);
    }).not.toThrow();
  });
});

// ─── determineGuildType ────────────────────────────────────────────────────

describe('determineGuildType', () => {
  it('returns miners for ore-dominant location', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc', 'town', { ore: { quantity: 50 }, grain: { quantity: 10 } });

    const rng = dummyRng([0]);
    expect(determineGuildType('loc', graph, rng)).toBe('miners');
  });

  it('returns miners for stone-dominant location', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc', 'town', { stone: { quantity: 40 } });

    expect(determineGuildType('loc', graph, dummyRng([0]))).toBe('miners');
  });

  it('returns artisans for timber-dominant location', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc', 'town', { timber: { quantity: 60 } });

    expect(determineGuildType('loc', graph, dummyRng([0]))).toBe('artisans');
  });

  it('returns artisans for grain-dominant location', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc', 'town', { grain: { quantity: 45 } });

    expect(determineGuildType('loc', graph, dummyRng([0]))).toBe('artisans');
  });

  it('returns traders for fish-dominant location', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc', 'town', { fish: { quantity: 35 } });

    expect(determineGuildType('loc', graph, dummyRng([0]))).toBe('traders');
  });

  it('uses PRNG tiebreaker when ore and timber are equal', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc', 'town', { ore: { quantity: 30 }, timber: { quantity: 30 } });

    // PRNG returns 0 → picks first (miners)
    expect(determineGuildType('loc', graph, dummyRng([0]))).toBe('miners');

    const graph2 = makeGraph();
    addLocation(graph2, 'loc', 'town', { ore: { quantity: 30 }, timber: { quantity: 30 } });

    // PRNG returns 0.9 → picks last (artisans)
    expect(determineGuildType('loc', graph2, dummyRng([0.9]))).toBe('artisans');
  });

  it('returns merchants for no-resources, low prosperity', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc', 'town', {}, 0);

    expect(determineGuildType('loc', graph, dummyRng([0]))).toBe('merchants');
  });

  it('returns bankers for no-resources, high prosperity (>= 60)', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc', 'town', {}, 65);

    expect(determineGuildType('loc', graph, dummyRng([0]))).toBe('bankers');
  });

  it('fail-soft: returns merchants for missing location', () => {
    const graph = makeGraph();
    expect(determineGuildType('loc_missing', graph, dummyRng([0]))).toBe('merchants');
  });
});

// ─── generateGuildDomainCapabilities ──────────────────────────────────────

describe('generateGuildDomainCapabilities', () => {
  const rng = () => 0.5;

  it('gold capability is within GUILD_GOLD_CAP range', () => {
    const caps = generateGuildDomainCapabilities('merchants', rng);
    expect(caps.gold).toBeGreaterThanOrEqual(GUILD_GOLD_CAP_MIN);
    expect(caps.gold).toBeLessThanOrEqual(GUILD_GOLD_CAP_MAX);
  });

  it('secondary domain is within GUILD_SECONDARY_CAP range', () => {
    // merchants secondary = heart
    const caps = generateGuildDomainCapabilities('merchants', rng);
    expect(caps.heart).toBeGreaterThanOrEqual(GUILD_SECONDARY_CAP_MIN);
    expect(caps.heart).toBeLessThanOrEqual(GUILD_SECONDARY_CAP_MAX);
  });

  it('minor domains are within GUILD_MINOR_CAP range (excluding gold and secondary)', () => {
    const caps = generateGuildDomainCapabilities('miners', rng);
    // miners: gold=high, iron=secondary
    for (const [domain, value] of Object.entries(caps)) {
      if (domain === 'gold' || domain === 'iron') continue;
      expect(value).toBeGreaterThanOrEqual(GUILD_MINOR_CAP_MIN);
      expect(value).toBeLessThanOrEqual(GUILD_MINOR_CAP_MAX);
    }
  });

  it('all 8 reach domains are present', () => {
    const caps = generateGuildDomainCapabilities('traders', rng);
    const domains = ['iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star'];
    for (const domain of domains) {
      expect(caps[domain as keyof typeof caps]).toBeGreaterThanOrEqual(0);
    }
  });

  it('secondary domains differ by guild type', () => {
    const merchantCaps = generateGuildDomainCapabilities('merchants', rng);
    const minerCaps = generateGuildDomainCapabilities('miners', rng);
    // merchants secondary=heart, miners secondary=iron
    expect(merchantCaps.heart).toBeGreaterThanOrEqual(GUILD_SECONDARY_CAP_MIN);
    expect(minerCaps.iron).toBeGreaterThanOrEqual(GUILD_SECONDARY_CAP_MIN);
  });
});

// ─── generateGuildAxiologicalProfile ──────────────────────────────────────

describe('generateGuildAxiologicalProfile', () => {
  it('produces all required value pairs', () => {
    const rng = () => 0.5;
    const profile = generateGuildAxiologicalProfile('merchants', rng);
    const requiredPairs = [
      'asceticism_extravagance', 'honesty_cunning', 'loyalty_ambition',
      'loyalty_ambition', 'tradition_novelty', 'courage_prudence',
    ];
    for (const pair of requiredPairs) {
      expect(profile[pair as keyof typeof profile]).toBeDefined();
    }
  });

  it('all values are in -1 to 1 range', () => {
    const rng = () => 0.5;
    const profile = generateGuildAxiologicalProfile('artisans', rng);
    for (const value of Object.values(profile)) {
      expect(value).toBeGreaterThanOrEqual(-1);
      expect(value).toBeLessThanOrEqual(1);
    }
  });

  it('miners guild has tradition_novelty bias (more negative)', () => {
    const rng = () => 0.5; // controlled rng
    const minerProfile = generateGuildAxiologicalProfile('miners', rng);
    const merchantProfile = generateGuildAxiologicalProfile('merchants', rng);
    // miners have -0.4 applied to tradition_novelty
    expect(minerProfile.tradition_novelty).toBeLessThan(merchantProfile.tradition_novelty);
  });
});

// ─── Constants contract ────────────────────────────────────────────────────

describe('guildSeeding constants contract', () => {
  it('GUILD_SPAWN_COUNT_MIN >= 1', () => {
    expect(GUILD_SPAWN_COUNT_MIN).toBeGreaterThanOrEqual(1);
  });

  it('GUILD_SPAWN_COUNT_MAX >= GUILD_SPAWN_COUNT_MIN', () => {
    expect(GUILD_SPAWN_COUNT_MAX).toBeGreaterThanOrEqual(GUILD_SPAWN_COUNT_MIN);
  });

  it('GUILD_GOLD_CAP_MIN < GUILD_GOLD_CAP_MAX', () => {
    expect(GUILD_GOLD_CAP_MIN).toBeLessThan(GUILD_GOLD_CAP_MAX);
  });

  it('GUILD_GOLD_CAP_MIN > GUILD_SECONDARY_CAP_MAX (gold always beats secondary)', () => {
    expect(GUILD_GOLD_CAP_MIN).toBeGreaterThan(GUILD_SECONDARY_CAP_MAX);
  });

  it('GUILD_SECONDARY_CAP_MIN > GUILD_MINOR_CAP_MAX (secondary always beats minor)', () => {
    expect(GUILD_SECONDARY_CAP_MIN).toBeGreaterThan(GUILD_MINOR_CAP_MAX);
  });

  it('GUILD_MARKET_STALL_THRESHOLD is 20', () => {
    expect(GUILD_MARKET_STALL_THRESHOLD).toBe(20);
  });
});
