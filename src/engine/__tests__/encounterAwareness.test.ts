import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  computeAwarenessHops,
  filterByAwareness,
  AWARENESS_THRESHOLD,
  BASE_AWARENESS_HOPS,
  CAPABILITY_PER_HOP,
  MAX_AWARENESS_HOPS,
  FLESH_MAX_HOPS,
} from '../encounterAwareness';
import type { DistanceMatrix } from '../distanceMatrix';
import type { EncounterCacheEntry } from '../encounterCache';
import type { ReachDomain } from '../../types/traits';

// ─── Helpers ────────────────────────────────────────────────────

/** Build a minimal DistanceMatrix from a distance map */
function makeDistanceMatrix(
  distanceMap: Record<string, Record<string, number>>,
): DistanceMatrix {
  const distances = new Map<string, Map<string, number>>();
  for (const [from, targets] of Object.entries(distanceMap)) {
    const row = new Map<string, number>();
    for (const [to, dist] of Object.entries(targets)) {
      row.set(to, dist);
    }
    distances.set(from, row);
  }
  return { distances, builtAtTick: 0, locationCount: distances.size };
}

/** Build a minimal encounter cache entry */
function makeEntry(overrides: Partial<EncounterCacheEntry> = {}): EncounterCacheEntry {
  return {
    templateId: 'tmpl.test',
    locationId: 'loc-target',
    reachPrimary: 'iron' as ReachDomain,
    reachSecondary: 'gold' as ReachDomain,
    threatRating: 'moderate',
    encounterType: 'combat',
    motivations: [],
    requiresPresence: true,
    remotePenalty: 0,
    questPriority: 1.0,
    totalTickCost: 2,
    successRewardEstimate: 1.0,
    stepCount: 1,
    stepDifficulties: [40],
    stepReaches: ['iron' as ReachDomain],
    ...overrides,
  };
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

  it('caps at MAX_AWARENESS_HOPS for non-flesh reaches', () => {
    // 0.9 / 0.15 = 6 → BASE + 6 = 7 → capped at 5
    expect(computeAwarenessHops(0.9, 'iron')).toBe(MAX_AWARENESS_HOPS);
    expect(computeAwarenessHops(1.0, 'gold')).toBe(MAX_AWARENESS_HOPS);
    expect(computeAwarenessHops(0.99, 'veil')).toBe(MAX_AWARENESS_HOPS);
  });

  it('caps at FLESH_MAX_HOPS for flesh reach regardless of capability', () => {
    expect(computeAwarenessHops(0.9, 'flesh')).toBe(FLESH_MAX_HOPS);
    expect(computeAwarenessHops(0.5, 'flesh')).toBe(FLESH_MAX_HOPS);
    // Even minimal capability produces BASE (1) which equals FLESH_MAX_HOPS
    expect(computeAwarenessHops(AWARENESS_THRESHOLD, 'flesh')).toBe(FLESH_MAX_HOPS);
  });

  it('correctly computes intermediate values', () => {
    // 0.15 / 0.15 = 1 → BASE + 1 = 2
    expect(computeAwarenessHops(0.15, 'shadow')).toBe(2);
    // 0.45 / 0.15 = 3 → BASE + 3 = 4
    expect(computeAwarenessHops(0.45, 'eye')).toBe(4);
  });
});

// ─── filterByAwareness ──────────────────────────────────────────

describe('filterByAwareness', () => {
  it('agent with 0 capability sees only entries within BASE_AWARENESS_HOPS', () => {
    // raw=0 → sigmoid ~0.018 → below threshold → 0 hops → nothing visible
    const graph = buildAgentGraph('agent-1', {});
    const dm = makeDistanceMatrix({
      'loc-home': { 'loc-home': 0, 'loc-near': 1 },
    });

    const entries = [
      makeEntry({ locationId: 'loc-home' }),
      makeEntry({ locationId: 'loc-near' }),
    ];

    const result = filterByAwareness(entries, 'agent-1', 'loc-home', graph, dm);
    // With no traits, raw=0, sigmoid ~0.018 < 0.05 threshold → 0 hops
    // Distance 0 is not <= 0 ... actually 0 <= 0 is true
    // But with 0 hops, distance must be <= 0
    expect(result.length).toBe(1); // only loc-home at distance 0
    expect(result[0].locationId).toBe('loc-home');
  });

  it('agent with high iron capability sees iron encounters at distance 5', () => {
    // raw=20 → sigmoid ~0.982 → hops = 1 + floor(0.982/0.15) = 1+6 = 7 → capped 5
    const graph = buildAgentGraph('agent-1', { iron: 20 });
    const dm = makeDistanceMatrix({
      'loc-home': {
        'loc-home': 0,
        'loc-1': 1,
        'loc-2': 2,
        'loc-3': 3,
        'loc-4': 4,
        'loc-5': 5,
        'loc-6': 6,
      },
    });

    const entries = [
      makeEntry({ locationId: 'loc-1', reachPrimary: 'iron', reachSecondary: 'gold' }),
      makeEntry({ locationId: 'loc-5', reachPrimary: 'iron', reachSecondary: 'gold' }),
      makeEntry({ locationId: 'loc-6', reachPrimary: 'iron', reachSecondary: 'gold' }),
    ];

    const result = filterByAwareness(entries, 'agent-1', 'loc-home', graph, dm);
    expect(result.length).toBe(2); // loc-1 (dist 1) and loc-5 (dist 5)
    expect(result.map((e) => e.locationId)).toEqual(['loc-1', 'loc-5']);
  });

  it('agent with low capability sees encounters at distance 1 only', () => {
    // raw=5 → sigmoid ~0.119 → hops = 1 + floor(0.119/0.15) = 1+0 = 1
    const graph = buildAgentGraph('agent-1', { iron: 5 });
    const dm = makeDistanceMatrix({
      'loc-home': {
        'loc-home': 0,
        'loc-near': 1,
        'loc-far': 2,
      },
    });

    const entries = [
      makeEntry({ locationId: 'loc-near', reachPrimary: 'iron', reachSecondary: 'gold' }),
      makeEntry({ locationId: 'loc-far', reachPrimary: 'iron', reachSecondary: 'gold' }),
    ];

    const result = filterByAwareness(entries, 'agent-1', 'loc-home', graph, dm);
    expect(result.length).toBe(1);
    expect(result[0].locationId).toBe('loc-near');
  });

  it('flesh reach capped at FLESH_MAX_HOPS regardless of capability', () => {
    // raw=20 → sigmoid ~0.982 → flesh capped at 1
    const graph = buildAgentGraph('agent-1', { flesh: 20 });
    const dm = makeDistanceMatrix({
      'loc-home': {
        'loc-home': 0,
        'loc-1': 1,
        'loc-2': 2,
      },
    });

    const entries = [
      makeEntry({ locationId: 'loc-1', reachPrimary: 'flesh', reachSecondary: 'flesh' }),
      makeEntry({ locationId: 'loc-2', reachPrimary: 'flesh', reachSecondary: 'flesh' }),
    ];

    const result = filterByAwareness(entries, 'agent-1', 'loc-home', graph, dm);
    expect(result.length).toBe(1); // only dist 1
    expect(result[0].locationId).toBe('loc-1');
  });

  it('uses max(primary, secondary) to pick the better visibility channel', () => {
    // Agent has high gold (raw=20 → ~0.982) but low iron (raw=0 → ~0.018)
    // Entry: primary=iron, secondary=gold
    // Iron cap: 0 hops. Gold cap: 5 hops.
    // max(0, 5) = 5 → sees at distance 3
    const graph = buildAgentGraph('agent-1', { gold: 20 });
    const dm = makeDistanceMatrix({
      'loc-home': { 'loc-home': 0, 'loc-3': 3 },
    });

    const entries = [
      makeEntry({ locationId: 'loc-3', reachPrimary: 'iron', reachSecondary: 'gold' }),
    ];

    const result = filterByAwareness(entries, 'agent-1', 'loc-home', graph, dm);
    expect(result.length).toBe(1);
  });

  it('local encounters (distance 0) visible if capability above threshold', () => {
    // raw=5 → sigmoid ~0.119 → above threshold → at least 1 hop
    const graph = buildAgentGraph('agent-1', { iron: 5 });
    const dm = makeDistanceMatrix({
      'loc-home': { 'loc-home': 0 },
    });

    const entries = [
      makeEntry({ locationId: 'loc-home', reachPrimary: 'iron', reachSecondary: 'gold' }),
    ];

    const result = filterByAwareness(entries, 'agent-1', 'loc-home', graph, dm);
    expect(result.length).toBe(1);
  });

  it('returns empty array when agent is not in graph', () => {
    const graph = new WorldGraph();
    const dm = makeDistanceMatrix({
      'loc-home': { 'loc-home': 0, 'loc-1': 1 },
    });

    const entries = [makeEntry({ locationId: 'loc-1' })];

    const result = filterByAwareness(entries, 'nonexistent-agent', 'loc-home', graph, dm);
    expect(result).toEqual([]);
  });

  it('entry at unreachable location (Infinity distance) is invisible', () => {
    const graph = buildAgentGraph('agent-1', { iron: 20 });
    // loc-unreachable not in distance matrix → getDistance returns Infinity
    const dm = makeDistanceMatrix({
      'loc-home': { 'loc-home': 0 },
    });

    const entries = [
      makeEntry({ locationId: 'loc-unreachable', reachPrimary: 'iron', reachSecondary: 'gold' }),
    ];

    const result = filterByAwareness(entries, 'agent-1', 'loc-home', graph, dm);
    expect(result).toEqual([]);
  });

  it('returns empty array when agentLocationId is empty string', () => {
    const graph = buildAgentGraph('agent-1', { iron: 20 });
    const dm = makeDistanceMatrix({});

    const entries = [makeEntry()];

    const result = filterByAwareness(entries, 'agent-1', '', graph, dm);
    expect(result).toEqual([]);
  });

  it('skips entries with no reachPrimary', () => {
    const graph = buildAgentGraph('agent-1', { iron: 20 });
    const dm = makeDistanceMatrix({
      'loc-home': { 'loc-home': 0, 'loc-target': 1 },
    });

    const brokenEntry = makeEntry({ locationId: 'loc-target' });
    // Force undefined reachPrimary to test fail-soft
    (brokenEntry as Record<string, unknown>).reachPrimary = undefined;

    const result = filterByAwareness([brokenEntry], 'agent-1', 'loc-home', graph, dm);
    expect(result).toEqual([]);
  });

  it('filters a mix of near and far entries correctly', () => {
    // raw=10 → sigmoid = 0.5 → hops = 1 + floor(0.5/0.15) = 1+3 = 4
    const graph = buildAgentGraph('agent-1', { iron: 10 });
    const dm = makeDistanceMatrix({
      'loc-home': {
        'loc-home': 0,
        'loc-1': 1,
        'loc-2': 2,
        'loc-3': 3,
        'loc-4': 4,
        'loc-5': 5,
      },
    });

    const entries = [
      makeEntry({ templateId: 'a', locationId: 'loc-1', reachPrimary: 'iron', reachSecondary: 'iron' }),
      makeEntry({ templateId: 'b', locationId: 'loc-2', reachPrimary: 'iron', reachSecondary: 'iron' }),
      makeEntry({ templateId: 'c', locationId: 'loc-3', reachPrimary: 'iron', reachSecondary: 'iron' }),
      makeEntry({ templateId: 'd', locationId: 'loc-4', reachPrimary: 'iron', reachSecondary: 'iron' }),
      makeEntry({ templateId: 'e', locationId: 'loc-5', reachPrimary: 'iron', reachSecondary: 'iron' }),
    ];

    const result = filterByAwareness(entries, 'agent-1', 'loc-home', graph, dm);
    // Distance 1,2,3,4 are within 4 hops; distance 5 is outside
    expect(result.length).toBe(4);
    expect(result.map((e) => e.templateId)).toEqual(['a', 'b', 'c', 'd']);
  });
});
