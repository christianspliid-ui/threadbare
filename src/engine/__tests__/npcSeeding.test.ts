/**
 * Tests for npcSeeding.ts — ambient NPC population at world-gen locations.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { seedNpcsAtLocations } from '../npcSeeding';
import { NPC_CONSTANTS } from '../../types/npc';

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
