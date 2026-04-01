/**
 * Tests for raritySeeding.ts — world-gen rarity tier assignment.
 *
 * Strategy: build minimal WorldGraph fixtures with specific properties
 * and verify that seedAllRarityTiers assigns rarityTier + importance correctly.
 * A mock rng that always returns 0.0 produces base tier 1 (Mundane) from both
 * actor and location distributions, letting bias tests verify tier increments cleanly.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { seedAllRarityTiers } from '../raritySeeding';
import type { GraphNode } from '../../types/graph';

// ─── PRNG helpers ────────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** rng that always returns 0.0 → base tier 1 (first bucket in any distribution). */
const zeroRng = () => 0.0;

// ─── Graph builder helpers ────────────────────────────────────────────

function makeGraph(): WorldGraph {
  return new WorldGraph();
}

function addLocation(
  graph: WorldGraph,
  id: string,
  props: Record<string, unknown> = {},
): GraphNode {
  const node: GraphNode = {
    id,
    type: 'location',
    name: id,
    properties: { locationType: 'hamlet', ...props },
  };
  graph.addNode(node);
  return graph.getNode(id)!;
}

function addActor(
  graph: WorldGraph,
  id: string,
  actorType: string = 'individual',
  props: Record<string, unknown> = {},
): GraphNode {
  const node: GraphNode = {
    id,
    type: 'actor',
    name: id,
    properties: { actorType, ...props },
  };
  graph.addNode(node);
  return graph.getNode(id)!;
}

function addTrait(graph: WorldGraph, actorId: string, traitIndex: number): void {
  const traitId = `trait_${actorId}_${traitIndex}`;
  graph.addNode({ id: traitId, type: 'trait', name: traitId, properties: {} });
  graph.addEdge({
    id: `edge_trait_${actorId}_${traitIndex}`,
    source: actorId,
    target: traitId,
    type: 'has_trait',
    properties: {},
  });
}

function locateActorAt(graph: WorldGraph, actorId: string, locationId: string): void {
  graph.addEdge({
    id: `edge_located_${actorId}`,
    source: actorId,
    target: locationId,
    type: 'located_at',
    properties: {},
  });
}

// ═══════════════════════════════════════════════════════════════════
// seedAllRarityTiers
// ═══════════════════════════════════════════════════════════════════

describe('seedAllRarityTiers', () => {
  it('assigns rarityTier to all individual actor nodes', () => {
    const graph = makeGraph();
    addActor(graph, 'actor_a');
    addActor(graph, 'actor_b');
    seedAllRarityTiers(graph, zeroRng);
    expect(graph.getNode('actor_a')!.properties['rarityTier']).toBeTypeOf('number');
    expect(graph.getNode('actor_b')!.properties['rarityTier']).toBeTypeOf('number');
  });

  it('assigns importance = 0 to all individual actor nodes', () => {
    const graph = makeGraph();
    addActor(graph, 'actor_a');
    seedAllRarityTiers(graph, zeroRng);
    expect(graph.getNode('actor_a')!.properties['importance']).toBe(0);
  });

  it('assigns rarityTier to all location nodes', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc_a');
    addLocation(graph, 'loc_b');
    seedAllRarityTiers(graph, zeroRng);
    expect(graph.getNode('loc_a')!.properties['rarityTier']).toBeTypeOf('number');
    expect(graph.getNode('loc_b')!.properties['rarityTier']).toBeTypeOf('number');
  });

  it('assigns importance = 0 to all location nodes', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc_a');
    seedAllRarityTiers(graph, zeroRng);
    expect(graph.getNode('loc_a')!.properties['importance']).toBe(0);
  });

  it('does not assign rarityTier to faction/culture/group actor nodes', () => {
    const graph = makeGraph();
    addActor(graph, 'faction_a', 'faction');
    addActor(graph, 'culture_a', 'culture');
    addActor(graph, 'group_a', 'group');
    addActor(graph, 'asc_a', 'ascendant');
    seedAllRarityTiers(graph, zeroRng);
    expect(graph.getNode('faction_a')!.properties['rarityTier']).toBeUndefined();
    expect(graph.getNode('culture_a')!.properties['rarityTier']).toBeUndefined();
    expect(graph.getNode('group_a')!.properties['rarityTier']).toBeUndefined();
    expect(graph.getNode('asc_a')!.properties['rarityTier']).toBeUndefined();
  });

  it('location rarityTier is seeded before actor rarity bias is applied', () => {
    // Build: Mythic location + actor at that location
    // With zero rng, base tier = 1. Location has temple subtype → tier biased to 2.
    // Actor at location tier 2 → no location-rarity bias (needs tier ≥ 3).
    // Add entropy alignment >0.3 to the actor to verify actor bias works independently.
    const graph = makeGraph();
    addLocation(graph, 'loc_temple', { locationType: 'temple' }); // tier 2 after bias
    const actorId = 'actor_atLoc';
    addActor(graph, actorId, 'individual', {
      sphereAlignment: { entropy: 0.5 },
    });
    locateActorAt(graph, actorId, 'loc_temple');
    seedAllRarityTiers(graph, zeroRng);

    // Location must have been seeded and its tier must be accessible during actor seeding
    const locTier = graph.getNode('loc_temple')!.properties['rarityTier'] as number;
    expect(locTier).toBeGreaterThanOrEqual(1);
    // Actor should have a tier (seeding ran without error)
    expect(graph.getNode(actorId)!.properties['rarityTier']).toBeTypeOf('number');
  });

  it('is deterministic: same seed → same tier assignments', () => {
    function buildAndSeed(seed: number): number[] {
      const graph = makeGraph();
      addLocation(graph, 'loc_1');
      addLocation(graph, 'loc_2', { locationType: 'temple' });
      addActor(graph, 'actor_1');
      addActor(graph, 'actor_2', 'individual', { sphereAlignment: { entropy: 0.5 } });
      const rng = mulberry32(seed);
      seedAllRarityTiers(graph, rng);
      return [
        graph.getNode('loc_1')!.properties['rarityTier'] as number,
        graph.getNode('loc_2')!.properties['rarityTier'] as number,
        graph.getNode('actor_1')!.properties['rarityTier'] as number,
        graph.getNode('actor_2')!.properties['rarityTier'] as number,
      ];
    }
    const run1 = buildAndSeed(42);
    const run2 = buildAndSeed(42);
    expect(run1).toEqual(run2);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Location rarity biases
// ═══════════════════════════════════════════════════════════════════

describe('location rarity biases', () => {
  it('temple subtype gets +1 tier bias (capped at 3)', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc_temple', { locationType: 'temple' });
    seedAllRarityTiers(graph, zeroRng);
    // zeroRng → base tier 1, temple bias +1 → tier 2
    expect(graph.getNode('loc_temple')!.properties['rarityTier']).toBe(2);
  });

  it('ruin subtype gets +1 tier bias', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc_ruin', { locationType: 'ruin' });
    seedAllRarityTiers(graph, zeroRng);
    expect(graph.getNode('loc_ruin')!.properties['rarityTier']).toBe(2);
  });

  it('lair subtype gets +1 tier bias', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc_lair', { locationType: 'lair' });
    seedAllRarityTiers(graph, zeroRng);
    expect(graph.getNode('loc_lair')!.properties['rarityTier']).toBe(2);
  });

  it('dungeon subtype gets +1 tier bias', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc_dungeon', { locationType: 'dungeon' });
    seedAllRarityTiers(graph, zeroRng);
    expect(graph.getNode('loc_dungeon')!.properties['rarityTier']).toBe(2);
  });

  it('ancient_site subtype gets +1 tier bias', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc_ancient', { locationType: 'ancient_site' });
    seedAllRarityTiers(graph, zeroRng);
    expect(graph.getNode('loc_ancient')!.properties['rarityTier']).toBe(2);
  });

  it('hamlet subtype gets no bias', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc_hamlet', { locationType: 'hamlet' });
    seedAllRarityTiers(graph, zeroRng);
    // zeroRng → base tier 1, no bias
    expect(graph.getNode('loc_hamlet')!.properties['rarityTier']).toBe(1);
  });

  it('high magicalSaturation (>0.7) gets +1 tier bias', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc_magic', { locationType: 'hamlet', magicalSaturation: 0.9 });
    seedAllRarityTiers(graph, zeroRng);
    expect(graph.getNode('loc_magic')!.properties['rarityTier']).toBe(2);
  });

  it('magicalSaturation exactly 0.7 gets no bias (threshold is >0.7)', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc_magic', { locationType: 'hamlet', magicalSaturation: 0.7 });
    seedAllRarityTiers(graph, zeroRng);
    expect(graph.getNode('loc_magic')!.properties['rarityTier']).toBe(1);
  });

  it('historical culture presence gets +1 tier bias', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc_historical', {
      locationType: 'hamlet',
      historicalCultureId: 'culture_ancient_elves',
    });
    seedAllRarityTiers(graph, zeroRng);
    expect(graph.getNode('loc_historical')!.properties['rarityTier']).toBe(2);
  });

  it('empty historicalCultureId gets no bias', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc_noculture', {
      locationType: 'hamlet',
      historicalCultureId: '',
    });
    seedAllRarityTiers(graph, zeroRng);
    expect(graph.getNode('loc_noculture')!.properties['rarityTier']).toBe(1);
  });

  it('multiple biases stack but cap at tier 3', () => {
    // temple (+1) + magicalSaturation (+1) + historicalCultureId (+1) = +3
    // base tier 1 + 3 = 4, but SEEDING_TIER_CAP = 3 → final tier 3
    const graph = makeGraph();
    addLocation(graph, 'loc_maxbias', {
      locationType: 'temple',
      magicalSaturation: 0.9,
      historicalCultureId: 'culture_foo',
    });
    seedAllRarityTiers(graph, zeroRng);
    expect(graph.getNode('loc_maxbias')!.properties['rarityTier']).toBe(3);
  });

  it('biases never produce tier 4 at seeding', () => {
    // Maximum achievable: base 3 (highest from distribution) + 3 biases, capped to 3
    const graph = makeGraph();
    addLocation(graph, 'loc_maxbias', {
      locationType: 'temple',
      magicalSaturation: 0.9,
      historicalCultureId: 'culture_foo',
    });
    // Use a rng that always returns 0.95 to maximize base tier from distribution
    const highRng = () => 0.95;
    seedAllRarityTiers(graph, highRng);
    const tier = graph.getNode('loc_maxbias')!.properties['rarityTier'] as number;
    expect(tier).toBeLessThanOrEqual(3);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Actor rarity biases
// ═══════════════════════════════════════════════════════════════════

describe('actor rarity biases', () => {
  it('actor with 3+ traits gets +1 tier bias', () => {
    const graph = makeGraph();
    addActor(graph, 'actor_traited');
    addTrait(graph, 'actor_traited', 0);
    addTrait(graph, 'actor_traited', 1);
    addTrait(graph, 'actor_traited', 2);
    seedAllRarityTiers(graph, zeroRng);
    // base tier 1 + trait bias +1 = tier 2
    expect(graph.getNode('actor_traited')!.properties['rarityTier']).toBe(2);
  });

  it('actor with 2 traits gets no trait bias', () => {
    const graph = makeGraph();
    addActor(graph, 'actor_2traits');
    addTrait(graph, 'actor_2traits', 0);
    addTrait(graph, 'actor_2traits', 1);
    seedAllRarityTiers(graph, zeroRng);
    expect(graph.getNode('actor_2traits')!.properties['rarityTier']).toBe(1);
  });

  it('actor with entropy sphere alignment >0.3 gets +1 tier bias', () => {
    const graph = makeGraph();
    addActor(graph, 'actor_entropy', 'individual', {
      sphereAlignment: { entropy: 0.5 },
    });
    seedAllRarityTiers(graph, zeroRng);
    expect(graph.getNode('actor_entropy')!.properties['rarityTier']).toBe(2);
  });

  it('actor with time sphere alignment >0.3 gets +1 tier bias', () => {
    const graph = makeGraph();
    addActor(graph, 'actor_time', 'individual', {
      sphereAlignment: { time: 0.4 },
    });
    seedAllRarityTiers(graph, zeroRng);
    expect(graph.getNode('actor_time')!.properties['rarityTier']).toBe(2);
  });

  it('actor with entropy alignment exactly 0.3 gets no bias (threshold is >0.3)', () => {
    const graph = makeGraph();
    addActor(graph, 'actor_entropyEdge', 'individual', {
      sphereAlignment: { entropy: 0.3 },
    });
    seedAllRarityTiers(graph, zeroRng);
    expect(graph.getNode('actor_entropyEdge')!.properties['rarityTier']).toBe(1);
  });

  it('actor at a Mythic (tier 3) location gets +1 tier bias', () => {
    // Need a location that seeds at tier 3.
    // temple + magicalSaturation + historicalCultureId all bias → tier 3 with zeroRng.
    const graph = makeGraph();
    addLocation(graph, 'loc_mythic', {
      locationType: 'temple',
      magicalSaturation: 0.9,
      historicalCultureId: 'culture_foo',
    });
    addActor(graph, 'actor_atMythic');
    locateActorAt(graph, 'actor_atMythic', 'loc_mythic');
    seedAllRarityTiers(graph, zeroRng);

    const locTier = graph.getNode('loc_mythic')!.properties['rarityTier'] as number;
    expect(locTier).toBe(3); // confirm prerequisite

    // base tier 1 + location bias +1 = tier 2
    expect(graph.getNode('actor_atMythic')!.properties['rarityTier']).toBe(2);
  });

  it('actor at a Storied (tier 2) location gets no location rarity bias', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc_storied', { locationType: 'temple' }); // tier 2 with zeroRng
    addActor(graph, 'actor_atStoried');
    locateActorAt(graph, 'actor_atStoried', 'loc_storied');
    seedAllRarityTiers(graph, zeroRng);

    const locTier = graph.getNode('loc_storied')!.properties['rarityTier'] as number;
    expect(locTier).toBe(2); // confirm tier 2

    // base tier 1, location tier 2 < threshold 3 → no bias
    expect(graph.getNode('actor_atStoried')!.properties['rarityTier']).toBe(1);
  });

  it('all actor biases stack but never produce tier 4', () => {
    // Traits (3+) + entropy >0.3 + mythic location = +3 bias → base 1 + 3 = 4, capped to 3
    const graph = makeGraph();
    addLocation(graph, 'loc_mythic2', {
      locationType: 'temple',
      magicalSaturation: 0.9,
      historicalCultureId: 'culture_bar',
    });
    addActor(graph, 'actor_maxbias', 'individual', {
      sphereAlignment: { entropy: 0.8 },
    });
    addTrait(graph, 'actor_maxbias', 0);
    addTrait(graph, 'actor_maxbias', 1);
    addTrait(graph, 'actor_maxbias', 2);
    locateActorAt(graph, 'actor_maxbias', 'loc_mythic2');

    seedAllRarityTiers(graph, zeroRng);

    const tier = graph.getNode('actor_maxbias')!.properties['rarityTier'] as number;
    expect(tier).toBeLessThanOrEqual(3);
    expect(tier).toBe(3);
  });
});
