import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  computeAwarenessHops,
  filterByAwareness,
  resolveLocationToHex,
  AWARENESS_THRESHOLD,
  BASE_AWARENESS_HOPS,
  CAPABILITY_PER_HOP,
  MAX_AWARENESS_HOPS,
} from '../encounterAwareness';
import type { EncounterCacheEntry } from '../encounterCache';
import type { ReachDomain } from '../../types/traits';

// ─── Helpers ────────────────────────────────────────────────────

/** Build a minimal encounter cache entry */
function makeEntry(overrides: Partial<EncounterCacheEntry> = {}): EncounterCacheEntry {
  return {
    templateId: 'tmpl.test',
    locationId: 'loc-target',
    sublocationId: null,
    sublocationTypeId: null,
    reachPrimary: 'iron' as ReachDomain,
    reachSecondary: 'gold' as ReachDomain,
    threatRating: 'moderate',
    encounterType: 'combat',
    motivations: [],
    requiresPresence: true,
    remotePenalty: 0,
    questPriority: 1.0,
    isQuestEncounter: false,
    totalTickCost: 2,
    successRewardEstimate: 1.0,
    stepCount: 1,
    stepDifficulties: [40],
    stepReaches: ['iron' as ReachDomain],
    ...overrides,
  };
}

/**
 * Add a location node with hex coordinates to the graph.
 */
function addLocation(graph: WorldGraph, id: string, col: number, row: number, extra: Record<string, unknown> = {}): void {
  graph.addNode({
    id,
    type: 'location',
    name: `Location ${id}`,
    properties: { hexCol: col, hexRow: row, ...extra },
  });
}

/**
 * Add a sublocation node linked to a parent location.
 */
function addSublocation(graph: WorldGraph, id: string, parentId: string): void {
  graph.addNode({
    id,
    type: 'location',
    name: `Sublocation ${id}`,
    properties: { parentLocationId: parentId, sublocationTypeId: 'test-sub' },
  });
  graph.addEdge({
    id: `edge-contains-${parentId}-${id}`,
    type: 'contains',
    source: parentId,
    target: id,
    properties: {},
  });
}

/**
 * Build a graph with an agent that has a trait giving known domain contributions.
 *
 * The sigmoid function used by computeCapability is: 1 / (1 + e^(-0.4*(x - 10)))
 * With raw=0  → ~0.018 (below threshold)
 * With raw=10 → 0.5
 * With raw=20 → ~0.982
 * With raw=5  → ~0.119
 * With raw=3  → ~0.047 (below AWARENESS_THRESHOLD of 0.05)
 */
function buildAgentGraph(
  agentId: string,
  contributions: Partial<Record<ReachDomain, number>>,
): WorldGraph {
  const graph = new WorldGraph();

  // Agent node
  graph.addNode({
    id: agentId,
    type: 'actor',
    name: 'Test Agent',
    properties: {},
  });

  // Trait definition node with specified domain contributions
  graph.addNode({
    id: 'trait-test',
    type: 'trait',
    name: 'Test Trait',
    properties: {
      subcategory: 'innate',
      description: 'Test trait',
      importance: 1.0,
      maxLevel: 3,
      visibility: 'public',
      domainContributions: contributions,
      tags: [],
      flavorText: '',
    },
  });

  // has_trait edge at level 1
  graph.addEdge({
    id: `edge-${agentId}-trait`,
    type: 'has_trait',
    source: agentId,
    target: 'trait-test',
    properties: {
      level: 1,
      acquiredTick: 0,
      lastReinforcedTick: 0,
      source: 'test',
      visibility: 'public',
    },
  });

  return graph;
}

// ─── computeAwarenessHops ───────────────────────────────────────

describe('computeAwarenessHops', () => {
  it('returns 0 when capability is below AWARENESS_THRESHOLD', () => {
    expect(computeAwarenessHops(0.04, 'iron')).toBe(0);
    expect(computeAwarenessHops(0, 'gold')).toBe(0);
  });

  it('returns BASE_AWARENESS_HOPS for capability just above threshold', () => {
    // 0.05 / 0.15 = 0.33 → floor = 0 → BASE + 0 = 1
    expect(computeAwarenessHops(AWARENESS_THRESHOLD, 'iron')).toBe(BASE_AWARENESS_HOPS);
  });

  it('scales with capability', () => {
    // 0.3 / 0.15 = 2 → BASE + 2 = 3
    expect(computeAwarenessHops(0.3, 'iron')).toBe(3);
    // 0.6 / 0.15 = 4 → BASE + 4 = 5
    expect(computeAwarenessHops(0.6, 'iron')).toBe(5);
  });

  it('caps at MAX_AWARENESS_HOPS for all reaches', () => {
    // 0.9 / 0.15 = 6 → BASE + 6 = 7 → capped at 5
    expect(computeAwarenessHops(0.9, 'iron')).toBe(MAX_AWARENESS_HOPS);
    expect(computeAwarenessHops(1.0, 'gold')).toBe(MAX_AWARENESS_HOPS);
    expect(computeAwarenessHops(0.99, 'veil')).toBe(MAX_AWARENESS_HOPS);
  });

  it('correctly computes intermediate values', () => {
    // 0.15 / 0.15 = 1 → BASE + 1 = 2
    expect(computeAwarenessHops(0.15, 'shadow')).toBe(2);
    // 0.45 / 0.15 = 3 → BASE + 3 = 4
    expect(computeAwarenessHops(0.45, 'eye')).toBe(4);
  });
});

// ─── resolveLocationToHex ────────────────────────────────────────

describe('resolveLocationToHex', () => {
  it('returns hex coords for a top-level location', () => {
    const graph = new WorldGraph();
    addLocation(graph, 'loc-city', 5, 10);
    expect(resolveLocationToHex(graph, 'loc-city')).toEqual({ col: 5, row: 10 });
  });

  it('resolves sublocation to parent hex coords', () => {
    const graph = new WorldGraph();
    addLocation(graph, 'loc-city', 5, 10);
    addSublocation(graph, 'sub-temple', 'loc-city');
    expect(resolveLocationToHex(graph, 'sub-temple')).toEqual({ col: 5, row: 10 });
  });

  it('returns null for non-existent node', () => {
    const graph = new WorldGraph();
    expect(resolveLocationToHex(graph, 'nonexistent')).toBeNull();
  });

  it('returns null for location without hex coordinates', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'loc-nohex', type: 'location', name: 'No Hex', properties: {} });
    expect(resolveLocationToHex(graph, 'loc-nohex')).toBeNull();
  });
});

// ─── filterByAwareness (hex-distance based) ─────────────────────

describe('filterByAwareness', () => {
  it('agent with 0 capability sees same-hex encounters (distance 0 always visible)', () => {
    // raw=0 → sigmoid ~0.018 → below threshold → 0 hops
    // But same-hex encounters are ALWAYS visible (distance 0 rule)
    const graph = buildAgentGraph('agent-1', {});
    addLocation(graph, 'loc-home', 3, 3);
    addLocation(graph, 'loc-near', 4, 3); // 1 hex away

    const entries = [
      makeEntry({ locationId: 'loc-home' }),
      makeEntry({ locationId: 'loc-near' }),
    ];

    const result = filterByAwareness(entries, 'agent-1', 'loc-home', graph);
    // Distance 0 (same hex) always visible; distance 1 needs capability above threshold
    expect(result.length).toBe(1);
    expect(result[0].locationId).toBe('loc-home');
  });

  it('agent with high iron capability sees iron encounters at hex distance 5', () => {
    // raw=20 → sigmoid ~0.982 → hops = 1 + floor(0.982/0.15) = 7 → capped at 5
    const graph = buildAgentGraph('agent-1', { iron: 20 });
    addLocation(graph, 'loc-home', 0, 0);
    addLocation(graph, 'loc-1', 1, 0);   // hex dist 1
    addLocation(graph, 'loc-5', 5, 0);   // hex dist 5
    addLocation(graph, 'loc-6', 6, 0);   // hex dist 6

    const entries = [
      makeEntry({ locationId: 'loc-1', reachPrimary: 'iron', reachSecondary: 'gold' }),
      makeEntry({ locationId: 'loc-5', reachPrimary: 'iron', reachSecondary: 'gold' }),
      makeEntry({ locationId: 'loc-6', reachPrimary: 'iron', reachSecondary: 'gold' }),
    ];

    const result = filterByAwareness(entries, 'agent-1', 'loc-home', graph);
    expect(result.length).toBe(2); // loc-1 (dist 1) and loc-5 (dist 5)
    expect(result.map((e) => e.locationId)).toEqual(['loc-1', 'loc-5']);
  });

  it('agent with low capability sees encounters at hex distance 1 only', () => {
    // raw=5 → sigmoid ~0.119 → hops = 1 + floor(0.119/0.15) = 1
    const graph = buildAgentGraph('agent-1', { iron: 5 });
    addLocation(graph, 'loc-home', 0, 0);
    addLocation(graph, 'loc-near', 1, 0);  // hex dist 1
    addLocation(graph, 'loc-far', 2, 0);   // hex dist 2

    const entries = [
      makeEntry({ locationId: 'loc-near', reachPrimary: 'iron', reachSecondary: 'gold' }),
      makeEntry({ locationId: 'loc-far', reachPrimary: 'iron', reachSecondary: 'gold' }),
    ];

    const result = filterByAwareness(entries, 'agent-1', 'loc-home', graph);
    expect(result.length).toBe(1);
    expect(result[0].locationId).toBe('loc-near');
  });

  it('uses max(primary, secondary) to pick the better visibility channel', () => {
    // Agent has high gold (raw=20 → ~0.982) but low iron (raw=0 → ~0.018)
    // Entry: primary=iron, secondary=gold
    // Iron cap: 0 hops. Gold cap: 5 hops.
    // max(0, 5) = 5 → sees at hex distance 3
    const graph = buildAgentGraph('agent-1', { gold: 20 });
    addLocation(graph, 'loc-home', 0, 0);
    addLocation(graph, 'loc-3', 3, 0);  // hex dist 3

    const entries = [
      makeEntry({ locationId: 'loc-3', reachPrimary: 'iron', reachSecondary: 'gold' }),
    ];

    const result = filterByAwareness(entries, 'agent-1', 'loc-home', graph);
    expect(result.length).toBe(1);
  });

  it('same-hex encounters always visible regardless of capability', () => {
    // Agent has NO capability in any reach → 0 hops
    // But distance 0 (same hex) always passes
    const graph = buildAgentGraph('agent-1', {});
    addLocation(graph, 'loc-home', 5, 5);

    const entries = [
      makeEntry({ locationId: 'loc-home', reachPrimary: 'iron', reachSecondary: 'gold' }),
    ];

    const result = filterByAwareness(entries, 'agent-1', 'loc-home', graph);
    expect(result.length).toBe(1);
  });

  it('agent at sublocation sees all encounters on same hex', () => {
    const graph = buildAgentGraph('agent-1', {});
    addLocation(graph, 'loc-city', 3, 3);
    addSublocation(graph, 'sub-temple', 'loc-city');

    // Encounters at the parent location (same hex)
    const entries = [
      makeEntry({ locationId: 'loc-city', reachPrimary: 'iron' }),
    ];

    // Agent is at the sublocation, should resolve to parent hex → distance 0
    const result = filterByAwareness(entries, 'agent-1', 'sub-temple', graph);
    expect(result.length).toBe(1);
  });

  it('returns empty array when agent is not in graph', () => {
    const graph = new WorldGraph();
    addLocation(graph, 'loc-home', 0, 0);

    const entries = [makeEntry({ locationId: 'loc-home' })];

    const result = filterByAwareness(entries, 'nonexistent-agent', 'loc-home', graph);
    expect(result).toEqual([]);
  });

  it('entry at location without hex coords is invisible', () => {
    const graph = buildAgentGraph('agent-1', { iron: 20 });
    addLocation(graph, 'loc-home', 0, 0);
    // loc-nohex has no hexCol/hexRow
    graph.addNode({ id: 'loc-nohex', type: 'location', name: 'No Hex', properties: {} });

    const entries = [
      makeEntry({ locationId: 'loc-nohex', reachPrimary: 'iron', reachSecondary: 'gold' }),
    ];

    const result = filterByAwareness(entries, 'agent-1', 'loc-home', graph);
    expect(result).toEqual([]);
  });

  it('returns empty array when agentLocationId is empty string', () => {
    const graph = buildAgentGraph('agent-1', { iron: 20 });

    const entries = [makeEntry()];

    const result = filterByAwareness(entries, 'agent-1', '', graph);
    expect(result).toEqual([]);
  });

  it('skips entries with no reachPrimary', () => {
    const graph = buildAgentGraph('agent-1', { iron: 20 });
    addLocation(graph, 'loc-home', 0, 0);
    addLocation(graph, 'loc-target', 1, 0);

    const brokenEntry = makeEntry({ locationId: 'loc-target' });
    // Force undefined reachPrimary to test fail-soft
    (brokenEntry as Record<string, unknown>).reachPrimary = undefined;

    const result = filterByAwareness([brokenEntry], 'agent-1', 'loc-home', graph);
    expect(result).toEqual([]);
  });

  it('filters a mix of near and far entries correctly', () => {
    // raw=10 → sigmoid = 0.5 → hops = 1 + floor(0.5/0.15) = 1+3 = 4
    const graph = buildAgentGraph('agent-1', { iron: 10 });
    addLocation(graph, 'loc-home', 0, 0);
    addLocation(graph, 'loc-1', 1, 0);  // hex dist 1
    addLocation(graph, 'loc-2', 2, 0);  // hex dist 2
    addLocation(graph, 'loc-3', 3, 0);  // hex dist 3
    addLocation(graph, 'loc-4', 4, 0);  // hex dist 4
    addLocation(graph, 'loc-5', 5, 0);  // hex dist 5

    const entries = [
      makeEntry({ templateId: 'a', locationId: 'loc-1', reachPrimary: 'iron', reachSecondary: 'iron' }),
      makeEntry({ templateId: 'b', locationId: 'loc-2', reachPrimary: 'iron', reachSecondary: 'iron' }),
      makeEntry({ templateId: 'c', locationId: 'loc-3', reachPrimary: 'iron', reachSecondary: 'iron' }),
      makeEntry({ templateId: 'd', locationId: 'loc-4', reachPrimary: 'iron', reachSecondary: 'iron' }),
      makeEntry({ templateId: 'e', locationId: 'loc-5', reachPrimary: 'iron', reachSecondary: 'iron' }),
    ];

    const result = filterByAwareness(entries, 'agent-1', 'loc-home', graph);
    // Hex distance 1,2,3,4 are within 4 hops; distance 5 is outside
    expect(result.length).toBe(4);
    expect(result.map((e) => e.templateId)).toEqual(['a', 'b', 'c', 'd']);
  });
});
