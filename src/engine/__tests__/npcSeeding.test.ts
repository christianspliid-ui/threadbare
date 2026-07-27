/**
 * Tests for npcSeeding.ts — ambient NPC population at world-gen locations.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { assignFactionsToExistingNpcs, seedNpcsAtLocations } from '../npcSeeding';
import { NPC_CONSTANTS, NPC_ROLE_REACH_MAP, type NpcRole } from '../../types/npc';
import { FACTION_DEFINITIONS } from '../../data/faction-definitions';

// ─── PRNG ────────────────────────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeGraphWithLocation(
  locationSubtype: string,
  locationId = 'loc_0',
): { graph: WorldGraph; locationIds: string[] } {
  const graph = new WorldGraph();

  // Add a culture node (current layer)
  graph.addNode({
    id: 'culture_0',
    type: 'culture',
    name: 'Test Culture',
    properties: {},
  });

  graph.addNode({
    id: locationId,
    type: 'location',
    name: `Test ${locationSubtype}`,
    properties: { locationSubtype, hexCol: 0, hexRow: 0 },
  });

  // Wire location → culture via belongs_to (current layer)
  graph.addEdge({
    id: `edge_loc_cult`,
    source: locationId,
    target: 'culture_0',
    type: 'belongs_to',
    properties: { culturalStrength: 1.0, cultureLayer: 'current' },
  });

  return { graph, locationIds: [locationId] };
}

function makeGraphWithMultipleLocations(subtypes: string[]): {
  graph: WorldGraph;
  locationIds: string[];
} {
  const graph = new WorldGraph();

  graph.addNode({
    id: 'culture_0',
    type: 'culture',
    name: 'Test Culture',
    properties: {},
  });

  const locationIds: string[] = [];
  for (let i = 0; i < subtypes.length; i++) {
    const id = `loc_${i}`;
    graph.addNode({
      id,
      type: 'location',
      name: `Location ${i}`,
      properties: { locationSubtype: subtypes[i], hexCol: i, hexRow: 0 },
    });
    graph.addEdge({
      id: `edge_loc_cult_${i}`,
      source: id,
      target: 'culture_0',
      type: 'belongs_to',
      properties: { culturalStrength: 1.0, cultureLayer: 'current' },
    });
    locationIds.push(id);
  }

  return { graph, locationIds };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('seedNpcsAtLocations', () => {
  it('creates ambient NPCs at hamlet locations', () => {
    const { graph, locationIds } = makeGraphWithLocation('hamlet');
    const result = seedNpcsAtLocations(graph, locationIds, mulberry32(42));

    // Hamlet roster: innkeeper (1.0), elder (1.0), guard (0.8) — expect 2–3 NPCs
    expect(result.npcIds.length).toBeGreaterThanOrEqual(2);
    expect(result.npcIds.length).toBeLessThanOrEqual(NPC_CONSTANTS.MAX_NPCS_HAMLET);
  });

  it('creates more NPCs at city than hamlet', () => {
    const { graph: g1, locationIds: l1 } = makeGraphWithLocation('hamlet', 'loc_h');
    const r1 = seedNpcsAtLocations(g1, l1, mulberry32(42));

    const { graph: g2, locationIds: l2 } = makeGraphWithLocation('city', 'loc_c');
    const r2 = seedNpcsAtLocations(g2, l2, mulberry32(42));

    expect(r2.npcIds.length).toBeGreaterThan(r1.npcIds.length);
  });

  it('creates no NPCs at lair locations', () => {
    const { graph, locationIds } = makeGraphWithLocation('lair');
    const result = seedNpcsAtLocations(graph, locationIds, mulberry32(42));
    expect(result.npcIds.length).toBe(0);
  });

  it('creates no NPCs at ruin locations', () => {
    const { graph, locationIds } = makeGraphWithLocation('ruin');
    const result = seedNpcsAtLocations(graph, locationIds, mulberry32(42));
    expect(result.npcIds.length).toBe(0);
  });

  it('all seeded NPCs have actorType individual, spotlightTier ambient, npcRole set, importance 0', () => {
    const { graph, locationIds } = makeGraphWithLocation('town');
    const result = seedNpcsAtLocations(graph, locationIds, mulberry32(42));

    expect(result.npcIds.length).toBeGreaterThan(0);
    for (const id of result.npcIds) {
      const node = graph.getNode(id);
      expect(node).toBeDefined();
      expect(node!.properties.actorType).toBe('individual');
      expect(node!.properties.spotlightTier).toBe('ambient');
      expect(node!.properties.npcRole).toBeDefined();
      expect(typeof node!.properties.npcRole).toBe('string');
      expect(node!.properties.importance).toBe(0);
    }
  });

  it('NPCs get belongs_to culture edges', () => {
    const { graph, locationIds } = makeGraphWithLocation('hamlet');
    const result = seedNpcsAtLocations(graph, locationIds, mulberry32(42));

    expect(result.npcIds.length).toBeGreaterThan(0);
    for (const id of result.npcIds) {
      const edges = graph.getOutgoingEdges(id, 'belongs_to');
      expect(edges.length).toBeGreaterThanOrEqual(1);
      // Target should be the culture node
      expect(edges[0].target).toBe('culture_0');
    }
  });

  it('NPCs get located_at edges to their location', () => {
    const { graph, locationIds } = makeGraphWithLocation('hamlet');
    const result = seedNpcsAtLocations(graph, locationIds, mulberry32(42));

    for (const id of result.npcIds) {
      const edges = graph.getOutgoingEdges(id, 'located_at');
      expect(edges.length).toBe(1);
      expect(edges[0].target).toBe('loc_0');
    }
  });

  it('respects hamlet population cap', () => {
    const { graph, locationIds } = makeGraphWithLocation('hamlet');
    // Force all RNG calls to return 1.0 (always passes chance check) to hit the cap
    const alwaysPass = () => 0.99;
    const result = seedNpcsAtLocations(graph, locationIds, alwaysPass);
    expect(result.npcIds.length).toBeLessThanOrEqual(NPC_CONSTANTS.MAX_NPCS_HAMLET);
  });

  it('respects city population cap', () => {
    const { graph, locationIds } = makeGraphWithLocation('city');
    const alwaysPass = () => 0.01; // below all chance values → always spawns
    const result = seedNpcsAtLocations(graph, locationIds, alwaysPass);
    expect(result.npcIds.length).toBeLessThanOrEqual(NPC_CONSTANTS.MAX_NPCS_CITY);
  });

  it('is deterministic — same seed produces same NPCs', () => {
    const { graph: g1, locationIds: l1 } = makeGraphWithLocation('town');
    const r1 = seedNpcsAtLocations(g1, l1, mulberry32(99));

    const { graph: g2, locationIds: l2 } = makeGraphWithLocation('town');
    const r2 = seedNpcsAtLocations(g2, l2, mulberry32(99));

    expect(r1.npcIds.length).toBe(r2.npcIds.length);
    // Names and roles should match
    for (let i = 0; i < r1.npcIds.length; i++) {
      const n1 = g1.getNode(r1.npcIds[i])!;
      const n2 = g2.getNode(r2.npcIds[i])!;
      expect(n1.name).toBe(n2.name);
      expect(n1.properties.npcRole).toBe(n2.properties.npcRole);
    }
  });

  it('emits NpcSeededTrace for each seeded NPC', () => {
    const { graph, locationIds } = makeGraphWithLocation('town');
    const result = seedNpcsAtLocations(graph, locationIds, mulberry32(42));

    expect(result.traces.length).toBe(result.npcIds.length);
    for (const trace of result.traces) {
      expect(trace.type).toBe('npc_seeded');
      expect(trace.tick).toBe(0);
      expect(trace.locationId).toBe('loc_0');
      expect(typeof trace.actorId).toBe('string');
      expect(typeof trace.role).toBe('string');
    }
  });

  it('creates member_of edges when factionLocationMap is provided', () => {
    const { graph, locationIds } = makeGraphWithLocation('hamlet');

    // Add a faction node
    graph.addNode({
      id: 'faction_0',
      type: 'faction',
      name: 'Test Faction',
      properties: { actorType: 'faction' },
    });

    const factionLocationMap = new Map<string, string>([['loc_0', 'faction_0']]);
    const result = seedNpcsAtLocations(graph, locationIds, mulberry32(42), factionLocationMap);

    expect(result.npcIds.length).toBeGreaterThan(0);
    for (const id of result.npcIds) {
      const edges = graph.getOutgoingEdges(id, 'member_of');
      expect(edges.length).toBe(1);
      expect(edges[0].target).toBe('faction_0');
      expect(edges[0].properties.rank).toBe(0.1);
      expect(edges[0].properties.joinedTick).toBe(0);
    }
  });

  it('does not create member_of edges when location is not in factionLocationMap', () => {
    const { graph, locationIds } = makeGraphWithLocation('hamlet');
    const emptyMap = new Map<string, string>();
    const result = seedNpcsAtLocations(graph, locationIds, mulberry32(42), emptyMap);

    for (const id of result.npcIds) {
      const edges = graph.getOutgoingEdges(id, 'member_of');
      expect(edges.length).toBe(0);
    }
  });

  it('processes multiple locations independently', () => {
    const { graph, locationIds } = makeGraphWithMultipleLocations(['hamlet', 'city', 'lair']);
    const result = seedNpcsAtLocations(graph, locationIds, mulberry32(42));

    // Hamlet and city should get NPCs; lair should get none
    // NPCs at city should be reachable via located_at edges
    const cityLocId = 'loc_1';
    const cityNpcs = result.npcIds.filter(id => {
      const edges = graph.getOutgoingEdges(id, 'located_at');
      return edges.some(e => e.target === cityLocId);
    });
    expect(cityNpcs.length).toBeGreaterThan(0);

    const lairLocId = 'loc_2';
    const lairNpcs = result.npcIds.filter(id => {
      const edges = graph.getOutgoingEdges(id, 'located_at');
      return edges.some(e => e.target === lairLocId);
    });
    expect(lairNpcs.length).toBe(0);
  });

  it('handles temple subtypes (maps temple → temple roster)', () => {
    const { graph, locationIds } = makeGraphWithLocation('temple');
    const result = seedNpcsAtLocations(graph, locationIds, mulberry32(42));
    // Temple roster: priest (1.0), acolyte (0.9), monk (0.8), chaplain (0.7), warrior_priest (0.5)
    // Cap is 3, so expect 1–3 NPCs
    expect(result.npcIds.length).toBeGreaterThanOrEqual(1);
    expect(result.npcIds.length).toBeLessThanOrEqual(3);
    // All should have valid temple roster roles
    const validRoles = new Set(['priest', 'acolyte', 'monk', 'chaplain', 'warrior_priest']);
    for (const id of result.npcIds) {
      const node = graph.getNode(id)!;
      expect(validRoles.has(node.properties.npcRole as string)).toBe(true);
    }
  });

  it('handles shrine subtype (maps to temple roster)', () => {
    const { graph, locationIds } = makeGraphWithLocation('shrine');
    const result = seedNpcsAtLocations(graph, locationIds, mulberry32(42));
    expect(result.npcIds.length).toBeGreaterThanOrEqual(1);
  });

  it('NPC IDs are unique across multiple calls with counter incrementing', () => {
    const { graph, locationIds } = makeGraphWithMultipleLocations(['hamlet', 'town']);
    const result = seedNpcsAtLocations(graph, locationIds, mulberry32(42));
    const idSet = new Set(result.npcIds);
    expect(idSet.size).toBe(result.npcIds.length);
  });
});

// ─── THR-816: faction routing must distribute, not take the first match ──────

/** The six definitions that declare `factionType: 'guild'` — the starved bracket. */
const GUILD_DEF_IDS = [
  'adventuring_guild',
  'merchant_consortium',
  'builders_fellowship',
  'lorekeepers_covenant',
  'thieves_guild',
  'arcane_circle',
] as const;

/**
 * Guild-affinity roles — every `NpcRole` whose `ROLE_FACTION_AFFINITY` list leads with
 * `'guild'`. This is the mix a live run actually presents to the bracket, and the set
 * whose collective outcome Done-when #1 is about.
 */
const GUILD_AFFINITY_ROLES: NpcRole[] = [
  'trader', 'clerk', 'appraiser', 'broker', 'merchant', 'scholar', 'scribe',
  'librarian', 'researcher', 'smith', 'mason', 'brewer', 'innkeeper', 'wanderer',
];

/**
 * One location hosting every guild, plus NPCs standing there.
 *
 * Mirrors the shape `assignFactionsToExistingNpcs` sees in a real run: NPC actors
 * already placed by `seedNpcsAtLocations`, and a locationId → factionIds[] map built
 * from guild-hall / controls edges. `roles` is cycled to fill `npcCount`, so a
 * single-element array models one role monopolising a location and the full list
 * models the realistic mix.
 */
function makeGuildBracket(roles: NpcRole | NpcRole[], npcCount: number): {
  graph: WorldGraph;
  locationFactionMap: Map<string, string[]>;
  factionIds: string[];
} {
  const roleCycle = Array.isArray(roles) ? roles : [roles];
  const graph = new WorldGraph();
  graph.addNode({
    id: 'loc_0',
    type: 'location',
    name: 'Test City',
    properties: { locationSubtype: 'city', hexCol: 0, hexRow: 0 },
  });

  const factionIds: string[] = [];
  for (const defId of GUILD_DEF_IDS) {
    const id = `faction_${defId}`;
    graph.addNode({
      id,
      type: 'actor',
      name: defId,
      properties: { actorType: 'faction', factionType: 'guild', factionDefId: defId },
    });
    factionIds.push(id);
  }

  for (let i = 0; i < npcCount; i++) {
    const id = `npc_test_${i}`;
    graph.addNode({
      id,
      type: 'actor',
      name: `NPC ${i}`,
      properties: {
        actorType: 'individual',
        spotlightTier: 'ambient',
        npcRole: roleCycle[i % roleCycle.length],
      },
    });
    graph.addEdge({
      id: `${id}_located_at_loc_0`,
      source: id,
      target: 'loc_0',
      type: 'located_at',
      properties: {},
    });
  }

  return { graph, locationFactionMap: new Map([['loc_0', factionIds]]), factionIds };
}

function memberCounts(graph: WorldGraph, factionIds: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const id of factionIds) {
    counts.set(id, graph.getIncomingEdges(id, 'member_of').length);
  }
  return counts;
}

describe('assignFactionsToExistingNpcs — equal-type faction distribution (THR-816)', () => {
  it('starves no guild across the role mix a live run presents', () => {
    // The Done-when this pins. Pre-THR-816 the bracket was resolved by `Array.find`,
    // so the same guild won every contest regardless of role and the other five were
    // seeded zero members — `builders_fellowship` measurably so on seeds 42 and 99,
    // which made all ten `bf.*` templates unreachable with no gate reporting it.
    //
    // Deliberately asserted over the *mix* of guild-affinity roles rather than one
    // role: within a single role, merit is supposed to dominate (a Lorekeepers'
    // Covenant should not fill up with traders). Starvation is a claim about what a
    // guild gets across the whole population, which is what the CLI census measures.
    const { graph, locationFactionMap, factionIds } = makeGuildBracket(
      GUILD_AFFINITY_ROLES,
      GUILD_AFFINITY_ROLES.length * 6,
    );
    assignFactionsToExistingNpcs(graph, locationFactionMap);

    const counts = memberCounts(graph, factionIds);
    const starved = [...counts].filter(([, n]) => n === 0).map(([id]) => id);

    expect(starved).toEqual([]);
    expect([...counts.values()].reduce((a, b) => a + b, 0)).toBe(
      GUILD_AFFINITY_ROLES.length * 6,
    );
  });

  it('spreads a single role across more than one guild rather than one absorbing all', () => {
    // The narrower, purely positional half of the defect: before THR-816 exactly one
    // faction received every NPC of a given role, because the pick never looked past
    // `[0]`. Merit may still concentrate membership — this asserts only that it is no
    // longer a monopoly by construction.
    const { graph, locationFactionMap, factionIds } = makeGuildBracket('trader', 60);
    assignFactionsToExistingNpcs(graph, locationFactionMap);

    const counts = memberCounts(graph, factionIds);
    const withMembers = [...counts.values()].filter(n => n > 0);

    expect(withMembers.length).toBeGreaterThan(1);
    expect(Math.max(...counts.values())).toBeLessThan(60);
  });

  it('routes a role to the guild whose reachWeights actually fit it', () => {
    // A mason is stone-primary; Builders' Fellowship carries stone 0.9 against the
    // Arcane Circle's 0.1. Merit, not array position, has to decide the first pick.
    const affinity = NPC_ROLE_REACH_MAP['mason'];
    const builders = FACTION_DEFINITIONS.get('builders_fellowship');
    expect(affinity.primary).toBe('stone');
    expect(builders?.reachWeights.stone).toBeGreaterThan(0.5);

    const { graph, locationFactionMap } = makeGuildBracket('mason', 1);
    assignFactionsToExistingNpcs(graph, locationFactionMap);

    const edge = graph.getOutgoingEdges('npc_test_0', 'member_of')[0];
    expect(edge?.target).toBe('faction_builders_fellowship');
  });

  it('is deterministic — identical graphs produce identical assignments (NFP #3)', () => {
    const a = makeGuildBracket('clerk', 24);
    const b = makeGuildBracket('clerk', 24);
    assignFactionsToExistingNpcs(a.graph, a.locationFactionMap);
    assignFactionsToExistingNpcs(b.graph, b.locationFactionMap);

    expect([...memberCounts(a.graph, a.factionIds)]).toEqual(
      [...memberCounts(b.graph, b.factionIds)],
    );
  });

  it('keeps the type bracket — a political-affinity role never lands in a guild', () => {
    // Stage 1 of the pick is unchanged: the role's preferred type still wins outright.
    // Only the choice *within* the bracket became a scored one.
    const { graph, locationFactionMap, factionIds } = makeGuildBracket('noble', 4);
    graph.addNode({
      id: 'faction_political',
      type: 'actor',
      name: 'Court',
      properties: { actorType: 'faction', factionType: 'political', factionDefId: 'underking_court' },
    });
    locationFactionMap.set('loc_0', [...factionIds, 'faction_political']);

    assignFactionsToExistingNpcs(graph, locationFactionMap);

    expect(graph.getIncomingEdges('faction_political', 'member_of')).toHaveLength(4);
    for (const id of factionIds) {
      expect(graph.getIncomingEdges(id, 'member_of')).toHaveLength(0);
    }
  });
});
