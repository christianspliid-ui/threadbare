/**
 * Tests for npcGraduation.ts — NPC importance tracking and spotlight tier promotion.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { bumpImportance, hydrateToTier, phaseNpcGraduation } from '../npcGraduation';
import { NPC_CONSTANTS, NPC_ROLE_REACH_MAP } from '../../types/npc';
import { VALUE_PAIRS } from '../../types/agent';
import { REACH_DOMAINS } from '../../types/traits';
import type { GameState } from '../../types/gameState';

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

// ─── Graph helpers ───────────────────────────────────────────────────────────

function makeAmbientNpc(graph: WorldGraph, id: string, role = 'guard'): void {
  graph.addNode({
    id,
    type: 'actor',
    name: 'Test NPC',
    properties: {
      actorType: 'individual',
      spotlightTier: 'ambient',
      npcRole: role,
      importance: 0,
    },
  });
}

function makeNotableNpc(graph: WorldGraph, id: string, role = 'merchant'): void {
  graph.addNode({
    id,
    type: 'actor',
    name: 'Test Notable',
    properties: {
      actorType: 'individual',
      spotlightTier: 'notable',
      npcRole: role,
      importance: NPC_CONSTANTS.NOTABLE_THRESHOLD,
    },
  });
}

function makeSpotlightAgent(graph: WorldGraph, id: string): void {
  graph.addNode({
    id,
    type: 'actor',
    name: 'Spotlight Agent',
    properties: {
      actorType: 'individual',
      spotlightTier: 'spotlight',
      importance: 30,
    },
  });
}

function makeLegacyActor(graph: WorldGraph, id: string): void {
  // Legacy node: no spotlightTier property
  graph.addNode({
    id,
    type: 'actor',
    name: 'Legacy Actor',
    properties: {
      actorType: 'individual',
      importance: 0,
    },
  });
}

/** Minimal GameState stub for phaseNpcGraduation */
function makeState(graph: WorldGraph, seed = 42): GameState {
  return {
    tick: 1,
    seed,
    graph,
    tickEvents: [],
    // Satisfy other required fields with minimal stubs
  } as unknown as GameState;
}

// ─── bumpImportance ───────────────────────────────────────────────────────────

describe('bumpImportance', () => {
  it('increments importance on an ambient NPC', () => {
    const graph = new WorldGraph();
    makeAmbientNpc(graph, 'npc_0');

    bumpImportance(graph, 'npc_0', 'encounter_reference');
    const node = graph.getNode('npc_0')!;
    expect(node.properties.importance).toBe(NPC_CONSTANTS.IMPORTANCE_ENCOUNTER_REFERENCE);
  });

  it('accumulates importance across multiple bumps', () => {
    const graph = new WorldGraph();
    makeAmbientNpc(graph, 'npc_0');

    bumpImportance(graph, 'npc_0', 'player_action');
    bumpImportance(graph, 'npc_0', 'encounter_reference');
    bumpImportance(graph, 'npc_0', 'edge_created');

    const expected =
      NPC_CONSTANTS.IMPORTANCE_PLAYER_ACTION +
      NPC_CONSTANTS.IMPORTANCE_ENCOUNTER_REFERENCE +
      NPC_CONSTANTS.IMPORTANCE_EDGE_CREATED;

    const node = graph.getNode('npc_0')!;
    expect(node.properties.importance).toBe(expected);
  });

  it('is no-op for spotlight agents', () => {
    const graph = new WorldGraph();
    makeSpotlightAgent(graph, 'agent_spotlight');

    bumpImportance(graph, 'agent_spotlight', 'player_action');
    const node = graph.getNode('agent_spotlight')!;
    // Should remain unchanged
    expect(node.properties.importance).toBe(30);
  });

  it('is no-op for legacy nodes with no spotlightTier', () => {
    const graph = new WorldGraph();
    makeLegacyActor(graph, 'legacy_0');

    bumpImportance(graph, 'legacy_0', 'trait_gained');
    const node = graph.getNode('legacy_0')!;
    expect(node.properties.importance).toBe(0);
  });
});

// ─── hydrateToTier ────────────────────────────────────────────────────────────

describe('hydrateToTier', () => {
  it('promotes ambient → notable, adds axiological profile and wealth', () => {
    const graph = new WorldGraph();
    makeAmbientNpc(graph, 'npc_0', 'merchant');

    hydrateToTier(graph, 'npc_0', 'notable', mulberry32(42));

    const node = graph.getNode('npc_0')!;
    expect(node.properties.spotlightTier).toBe('notable');
    expect(typeof node.properties.narrativeArchetype).toBe('string');
    expect(node.properties.axiologicalProfile).toBeDefined();
    expect(node.properties.wealth).toBeDefined();
    expect(node.properties.reputationScore).toBe(0);

    // Axiological profile should have all VALUE_PAIRS as keys
    const profile = node.properties.axiologicalProfile as Record<string, number>;
    for (const pair of VALUE_PAIRS) {
      expect(profile[pair]).toBeDefined();
      expect(typeof profile[pair]).toBe('number');
      expect(profile[pair]).toBeGreaterThanOrEqual(-1);
      expect(profile[pair]).toBeLessThanOrEqual(1);
    }
  });

  it('promotes ambient → spotlight, adds full agent properties including domainCapabilities', () => {
    const graph = new WorldGraph();
    makeAmbientNpc(graph, 'npc_0', 'guard');

    hydrateToTier(graph, 'npc_0', 'spotlight', mulberry32(99));

    const node = graph.getNode('npc_0')!;
    expect(node.properties.spotlightTier).toBe('spotlight');
    expect(typeof node.properties.narrativeArchetype).toBe('string');
    expect(node.properties.axiologicalProfile).toBeDefined();
    expect(node.properties.wealth).toBeDefined();
    expect(node.properties.reputationScore).toBe(0);
    expect(node.properties.cooperationStrategy).toBe('tit_for_tat');

    const caps = node.properties.domainCapabilities as Record<string, number>;
    expect(caps).toBeDefined();
    // Should have all 8 reaches (no flesh)
    for (const domain of REACH_DOMAINS) {
      expect(caps[domain]).toBeDefined();
      expect(caps[domain]).toBeGreaterThanOrEqual(1);
    }
    expect(caps['flesh']).toBeUndefined();
  });

  it('notable promotion generates role-aware domainCapabilities', () => {
    const graph = new WorldGraph();
    makeAmbientNpc(graph, 'npc_0', 'guard'); // guard = iron primary, stone secondary

    hydrateToTier(graph, 'npc_0', 'notable', mulberry32(42));

    const node = graph.getNode('npc_0')!;
    const caps = node.properties.domainCapabilities as Record<string, number>;
    expect(caps).toBeDefined();

    // Primary (iron) should be in notable primary range
    expect(caps.iron).toBeGreaterThanOrEqual(NPC_CONSTANTS.NOTABLE_PRIMARY_BASE);
    expect(caps.iron).toBeLessThan(NPC_CONSTANTS.NOTABLE_PRIMARY_BASE + NPC_CONSTANTS.NOTABLE_PRIMARY_RANGE);

    // Secondary (stone) should be in notable secondary range
    expect(caps.stone).toBeGreaterThanOrEqual(NPC_CONSTANTS.NOTABLE_SECONDARY_BASE);
    expect(caps.stone).toBeLessThan(NPC_CONSTANTS.NOTABLE_SECONDARY_BASE + NPC_CONSTANTS.NOTABLE_SECONDARY_RANGE);

    // Other reaches should be in notable other range
    for (const domain of ['gold', 'shadow', 'veil', 'heart', 'eye', 'star'] as const) {
      expect(caps[domain]).toBeGreaterThanOrEqual(NPC_CONSTANTS.NOTABLE_OTHER_BASE);
      expect(caps[domain]).toBeLessThan(NPC_CONSTANTS.NOTABLE_OTHER_BASE + NPC_CONSTANTS.NOTABLE_OTHER_RANGE);
    }
  });

  it('spotlight promotion boosts role primary/secondary reaches highest', () => {
    const graph = new WorldGraph();
    makeAmbientNpc(graph, 'npc_0', 'merchant'); // gold primary, eye secondary

    // First promote to notable
    const rng1 = mulberry32(42);
    hydrateToTier(graph, 'npc_0', 'notable', rng1);

    // Then promote to spotlight
    graph.updateNode('npc_0', { properties: { spotlightTier: 'notable' } });
    const rng2 = mulberry32(99);
    hydrateToTier(graph, 'npc_0', 'spotlight', rng2);

    const caps = graph.getNode('npc_0')!.properties.domainCapabilities as Record<string, number>;
    const affinity = NPC_ROLE_REACH_MAP['merchant'];

    // Primary should be the highest or among the highest
    const primaryVal = caps[affinity.primary];
    const secondaryVal = caps[affinity.secondary];
    const otherVals = REACH_DOMAINS
      .filter(d => d !== affinity.primary && d !== affinity.secondary)
      .map(d => caps[d]);
    const maxOther = Math.max(...otherVals);

    // Primary should exceed max of other reaches
    expect(primaryVal).toBeGreaterThan(maxOther);
    // Secondary should be >= most others
    expect(secondaryVal).toBeGreaterThanOrEqual(maxOther - 5); // some tolerance for rng
  });

  it('is deterministic — same seed produces same axiological profile', () => {
    const graph1 = new WorldGraph();
    makeAmbientNpc(graph1, 'npc_0', 'merchant');
    hydrateToTier(graph1, 'npc_0', 'notable', mulberry32(77));

    const graph2 = new WorldGraph();
    makeAmbientNpc(graph2, 'npc_0', 'merchant');
    hydrateToTier(graph2, 'npc_0', 'notable', mulberry32(77));

    const profile1 = graph1.getNode('npc_0')!.properties.axiologicalProfile as Record<string, number>;
    const profile2 = graph2.getNode('npc_0')!.properties.axiologicalProfile as Record<string, number>;

    for (const pair of VALUE_PAIRS) {
      expect(profile1[pair]).toBe(profile2[pair]);
    }
  });

  it('is no-op when target tier <= current tier', () => {
    const graph = new WorldGraph();
    makeNotableNpc(graph, 'npc_0', 'merchant');

    // Attempt to promote to ambient (downgrade) — should be no-op
    hydrateToTier(graph, 'npc_0', 'notable', mulberry32(42));
    const node = graph.getNode('npc_0')!;
    // Should still be notable with original importance
    expect(node.properties.spotlightTier).toBe('notable');
  });

  it('sets wealth based on role for notable promotion', () => {
    const graph = new WorldGraph();

    makeAmbientNpc(graph, 'npc_merchant', 'merchant');
    hydrateToTier(graph, 'npc_merchant', 'notable', mulberry32(1));
    expect(graph.getNode('npc_merchant')!.properties.wealth).toBe(60);

    makeAmbientNpc(graph, 'npc_noble', 'noble');
    hydrateToTier(graph, 'npc_noble', 'notable', mulberry32(2));
    expect(graph.getNode('npc_noble')!.properties.wealth).toBe(70);

    makeAmbientNpc(graph, 'npc_guard', 'guard');
    hydrateToTier(graph, 'npc_guard', 'notable', mulberry32(3));
    expect(graph.getNode('npc_guard')!.properties.wealth).toBe(25);
  });

  it('preserves an existing narrative archetype during promotion', () => {
    const graph = new WorldGraph();
    makeAmbientNpc(graph, 'npc_0', 'merchant');
    graph.updateNode('npc_0', {
      properties: { narrativeArchetype: 'schemer' },
    });

    hydrateToTier(graph, 'npc_0', 'notable', mulberry32(42));

    expect(graph.getNode('npc_0')!.properties.narrativeArchetype).toBe('schemer');
  });
});

// ─── phaseNpcGraduation ───────────────────────────────────────────────────────

describe('phaseNpcGraduation', () => {
  it('promotes ambient to notable when importance crosses threshold', () => {
    const graph = new WorldGraph();
    makeAmbientNpc(graph, 'npc_0');
    // Set importance at or above threshold
    graph.updateNode('npc_0', {
      properties: { importance: NPC_CONSTANTS.NOTABLE_THRESHOLD },
    });

    const state = makeState(graph);
    const events = phaseNpcGraduation(state);

    expect(events.length).toBe(1);
    expect(events[0].type).toBe('npc_graduated');
    expect(events[0].actorId).toBe('npc_0');
    expect(events[0].fromTier).toBe('ambient');
    expect(events[0].toTier).toBe('notable');

    // Node should now be notable
    const node = graph.getNode('npc_0')!;
    expect(node.properties.spotlightTier).toBe('notable');
  });

  it('does not promote when importance is below threshold', () => {
    const graph = new WorldGraph();
    makeAmbientNpc(graph, 'npc_0');
    graph.updateNode('npc_0', {
      properties: { importance: NPC_CONSTANTS.NOTABLE_THRESHOLD - 1 },
    });

    const state = makeState(graph);
    const events = phaseNpcGraduation(state);

    expect(events.length).toBe(0);
    expect(graph.getNode('npc_0')!.properties.spotlightTier).toBe('ambient');
  });

  it('promotes notable to spotlight when importance + edge requirements are met', () => {
    const graph = new WorldGraph();
    makeNotableNpc(graph, 'npc_0', 'merchant');
    graph.updateNode('npc_0', {
      properties: { importance: NPC_CONSTANTS.SPOTLIGHT_THRESHOLD },
    });

    // Add enough relates_to edges (need >= SPOTLIGHT_MIN_EDGES)
    for (let i = 0; i < NPC_CONSTANTS.SPOTLIGHT_MIN_EDGES; i++) {
      graph.addNode({
        id: `other_${i}`,
        type: 'actor',
        name: `Other ${i}`,
        properties: { actorType: 'individual' },
      });
      graph.addEdge({
        id: `edge_relates_${i}`,
        source: 'npc_0',
        target: `other_${i}`,
        type: 'relates_to',
        properties: { strength: 0.5, polarity: 1 },
      });
    }

    const state = makeState(graph);
    const events = phaseNpcGraduation(state);

    expect(events.length).toBe(1);
    expect(events[0].type).toBe('npc_graduated');
    expect(events[0].fromTier).toBe('notable');
    expect(events[0].toTier).toBe('spotlight');

    expect(graph.getNode('npc_0')!.properties.spotlightTier).toBe('spotlight');
  });

  it('does not promote notable to spotlight when edge count is below minimum', () => {
    const graph = new WorldGraph();
    makeNotableNpc(graph, 'npc_0', 'merchant');
    graph.updateNode('npc_0', {
      properties: { importance: NPC_CONSTANTS.SPOTLIGHT_THRESHOLD },
    });

    // Add only 1 relates_to edge (below SPOTLIGHT_MIN_EDGES = 3)
    graph.addNode({ id: 'other_0', type: 'actor', name: 'Other', properties: {} });
    graph.addEdge({
      id: 'edge_r0',
      source: 'npc_0',
      target: 'other_0',
      type: 'relates_to',
      properties: { strength: 0.5, polarity: 1 },
    });

    const state = makeState(graph);
    const events = phaseNpcGraduation(state);

    // Notable NPCs with insufficient importance or edges should NOT promote
    expect(events.length).toBe(0);
    expect(graph.getNode('npc_0')!.properties.spotlightTier).toBe('notable');
  });
});
