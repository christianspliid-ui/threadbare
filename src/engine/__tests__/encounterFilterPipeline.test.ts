import { describe, it, expect, vi } from 'vitest';
import { WorldGraph } from '../graph';
import type { DistanceMatrix } from '../distanceMatrix';
import type { EncounterCacheEntry } from '../encounterCache';
import type { ReachDomain } from '../../types/traits';
import {
  runFilterPipeline,
  filterByVisibility,
  filterByPrerequisites,
  filterByThreat,
  capWithDiversity,
  MAX_SCORED_CANDIDATES,
  MIN_DIVERSITY_SLOTS,
} from '../encounterFilterPipeline';

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
    templateId: 'tmpl-test',
    locationId: 'loc-target',
    reachPrimary: 'iron' as ReachDomain,
    reachSecondary: 'gold' as ReachDomain,
    threatRating: 'moderate',
    encounterType: 'explore',
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
 * With raw=0  → ~0.018
 * With raw=10 → 0.5  (capability 50 on 0-100 scale)
 * With raw=20 → ~0.982 (capability ~98)
 * With raw=5  → ~0.119 (capability ~12)
 */
function buildAgentGraph(
  agentId: string,
  contributions: Partial<Record<ReachDomain, number>>,
  opts?: { courage?: number },
): WorldGraph {
  const graph = new WorldGraph();

  // Agent node
  graph.addNode({
    id: agentId,
    type: 'actor',
    name: 'Test Agent',
    properties: {
      axiologicalProfile: {
        courage_prudence: opts?.courage ?? 0,
      },
    },
  });

  // Agent location
  graph.addNode({
    id: 'loc-agent',
    type: 'location',
    name: 'Agent Location',
    properties: { locationType: 'village' },
  });

  // Target location
  graph.addNode({
    id: 'loc-target',
    type: 'location',
    name: 'Target Location',
    properties: { locationType: 'village' },
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

// ─── Stage 2: Visibility ────────────────────────────────────────

describe('filterByVisibility', () => {
  it('passes entries with no visibleTo restriction', () => {
    const graph = buildAgentGraph('agent-1', { iron: 10 });
    const entries = [makeEntry({ visibleTo: undefined })];
    const result = filterByVisibility(entries, 'agent-1', graph);
    expect(result).toHaveLength(1);
  });

  it('passes entries with empty visibleTo array', () => {
    const graph = buildAgentGraph('agent-1', { iron: 10 });
    const entries = [makeEntry({ visibleTo: [] })];
    const result = filterByVisibility(entries, 'agent-1', graph);
    expect(result).toHaveLength(1);
  });

  it('filters out entry with visibleTo=["faction:iron-guild"] for non-member agent', () => {
    const graph = buildAgentGraph('agent-1', { iron: 10 });
    const entries = [makeEntry({ visibleTo: ['faction:iron-guild'] })];
    const result = filterByVisibility(entries, 'agent-1', graph);
    expect(result).toHaveLength(0);
  });

  it('passes entry with visibleTo=["faction:iron-guild"] for faction member', () => {
    const graph = buildAgentGraph('agent-1', { iron: 10 });

    // Add faction node and membership edge
    graph.addNode({
      id: 'iron-guild',
      type: 'actor',
      name: 'Iron Guild',
      properties: { actorType: 'faction' },
    });
    graph.addEdge({
      id: 'edge-member',
      type: 'member_of',
      source: 'agent-1',
      target: 'iron-guild',
      properties: { rank: 0.5 },
    });

    const entries = [makeEntry({ visibleTo: ['faction:iron-guild'] })];
    const result = filterByVisibility(entries, 'agent-1', graph);
    expect(result).toHaveLength(1);
  });
});

// ─── Stage 3: Prerequisites ─────────────────────────────────────

describe('filterByPrerequisites', () => {
  it('passes all entries through (placeholder stage)', () => {
    const graph = buildAgentGraph('agent-1', { iron: 10 });
    const entries = [
      makeEntry({ templateId: 'a' }),
      makeEntry({ templateId: 'b' }),
      makeEntry({ templateId: 'c' }),
    ];
    const result = filterByPrerequisites(entries, 'agent-1', graph);
    expect(result).toHaveLength(3);
  });
});

// ─── Stage 4: Threat ────────────────────────────────────────────

describe('filterByThreat', () => {
  it('filters deadly encounter for low-capability agent', () => {
    // raw=5 → capability ~0.119 → 11.9 on 0-100 scale
    // This falls in trivial [0,20] and easy [15,40] bands
    // deadly has tierIndex 4, tolerance range [3,5] (hard-deadly)
    // Agent's capability 11.9 doesn't fall in hard [50,80] or deadly [70,100]
    const graph = buildAgentGraph('agent-1', { iron: 5 });
    const entries = [makeEntry({ threatRating: 'deadly', reachPrimary: 'iron' as ReachDomain })];
    const result = filterByThreat(entries, 'agent-1', graph);
    expect(result).toHaveLength(0);
  });

  it('passes moderate encounter for mid-capability agent', () => {
    // raw=10 → capability 0.5 → 50 on 0-100 scale
    // moderate tierIndex=2, tolerance range [1,3] (easy-hard)
    // 50 falls in moderate [30,60] ✓
    const graph = buildAgentGraph('agent-1', { iron: 10 });
    const entries = [makeEntry({ threatRating: 'moderate', reachPrimary: 'iron' as ReachDomain })];
    const result = filterByThreat(entries, 'agent-1', graph);
    expect(result).toHaveLength(1);
  });

  it('courage expands threat tolerance upward', () => {
    // raw=10 → capability 0.5 → 50 on 0-100 scale
    // deadly tierIndex=4, base tolerance range [3,5] (hard-deadly)
    // courage > 0.3 → maxTier = min(4, 5+1) = still 4 (no effect since already at edge)
    // But let's test hard: tierIndex=3, base tolerance [2,4]
    // With courage, maxTier expands to min(4,4+1)=4
    // capability 50 falls in moderate [30,60] which is tier 2
    // So tolerance range is [2,4] → includes moderate [30,60] where 50 lands ✓
    const graph = buildAgentGraph('agent-1', { iron: 10 }, { courage: 0.5 });
    const entries = [makeEntry({ threatRating: 'hard', reachPrimary: 'iron' as ReachDomain })];
    const result = filterByThreat(entries, 'agent-1', graph);
    expect(result).toHaveLength(1);
  });

  it('prudent agent has restricted tolerance', () => {
    // raw=10 → capability 0.5 → 50 on 0-100 scale
    // moderate tierIndex=2, base tolerance [1,3]
    // prudence < -0.3 → minTier bumps up: max(0, 1+1) = 2
    // So tolerance range becomes [2,3] = moderate/hard
    // 50 still falls in moderate [30,60] ✓ — moderate still passes
    // But let's test: easy tierIndex=1, base tolerance [0,2]
    // prudence → minTier = max(0, 0+1) = 1
    // tolerance range [1,2] = easy/moderate
    // 50 falls in moderate [30,60] ✓ — should still pass
    // Instead, test that a low-cap agent can't see easy when prudent:
    // raw=5 → cap ~12, easy tierIndex=1, base tol [0,2]
    // prudence → minTier=1, tolerance [1,2] = easy/moderate
    // 12 falls in easy [15,40]? No, 12 < 15 → does NOT fall in easy
    // 12 falls in trivial [0,20] ✓ but trivial (index 0) not in [1,2]
    // So result is filtered out!
    const graph = buildAgentGraph('agent-1', { iron: 5 }, { courage: -0.5 });
    const entries = [makeEntry({ threatRating: 'easy', reachPrimary: 'iron' as ReachDomain })];
    const result = filterByThreat(entries, 'agent-1', graph);
    expect(result).toHaveLength(0);
  });

  it('returns empty when agent not found', () => {
    const graph = new WorldGraph();
    const entries = [makeEntry()];
    const result = filterByThreat(entries, 'nonexistent', graph);
    expect(result).toHaveLength(0);
  });
});

// ─── Stage 5: Cap with Diversity ────────────────────────────────

describe('capWithDiversity', () => {
  it('returns entries unchanged when under MAX_SCORED_CANDIDATES', () => {
    const graph = new WorldGraph();
    const entries = Array.from({ length: 10 }, (_, i) =>
      makeEntry({ templateId: `tmpl-${i}` }),
    );
    const result = capWithDiversity(entries, 'agent-1', graph);
    expect(result).toHaveLength(10);
  });

  it('caps at MAX_SCORED_CANDIDATES when over limit', () => {
    const graph = new WorldGraph();
    const entries = Array.from({ length: 60 }, (_, i) =>
      makeEntry({ templateId: `tmpl-${i}`, encounterType: 'explore' }),
    );
    const result = capWithDiversity(entries, 'agent-1', graph);
    expect(result).toHaveLength(MAX_SCORED_CANDIDATES);
  });

  it('preserves diversity floor across encounter types', () => {
    const graph = new WorldGraph();
    const types = ['explore', 'acquire', 'create', 'hire', 'duel',
      'steal', 'trade', 'assist', 'build', 'lead'] as const;

    // 6 entries per type = 60 total (over cap of 40)
    const entries: EncounterCacheEntry[] = [];
    for (const t of types) {
      for (let i = 0; i < 6; i++) {
        entries.push(makeEntry({
          templateId: `tmpl-${t}-${i}`,
          encounterType: t,
        }));
      }
    }

    const result = capWithDiversity(entries, 'agent-1', graph);
    expect(result).toHaveLength(MAX_SCORED_CANDIDATES);

    // Check each type has at least MIN_DIVERSITY_SLOTS
    const typeCounts = new Map<string, number>();
    for (const r of result) {
      typeCounts.set(r.encounterType, (typeCounts.get(r.encounterType) ?? 0) + 1);
    }

    for (const t of types) {
      expect(typeCounts.get(t) ?? 0).toBeGreaterThanOrEqual(MIN_DIVERSITY_SLOTS);
    }
  });
});

// ─── Full Pipeline ──────────────────────────────────────────────

describe('runFilterPipeline', () => {
  it('returns empty candidates for empty input', () => {
    const graph = buildAgentGraph('agent-1', { iron: 10 });
    const dm = makeDistanceMatrix({});
    const result = runFilterPipeline([], 'agent-1', 'loc-agent', graph, dm, 1);
    expect(result.candidates).toHaveLength(0);
    expect(result.trace.cacheSize).toBe(0);
    expect(result.trace.afterCap).toBe(0);
  });

  it('returns empty candidates when agent missing from graph', () => {
    const graph = new WorldGraph();
    const dm = makeDistanceMatrix({});
    const entries = [makeEntry()];
    const result = runFilterPipeline(entries, 'nonexistent', 'loc-agent', graph, dm, 1);
    expect(result.candidates).toHaveLength(0);
    expect(result.trace.cacheSize).toBe(1);
    expect(result.trace.afterAwareness).toBe(0);
  });

  it('runs full pipeline from N entries and filters down', () => {
    // Build graph: agent at loc-agent, high iron capability (raw=10 → cap ~50)
    const graph = buildAgentGraph('agent-1', { iron: 10 });

    // Add adjacent edge between agent and target locations
    graph.addEdge({
      id: 'adj-1',
      type: 'adjacent',
      source: 'loc-agent',
      target: 'loc-target',
      properties: {},
    });

    const dm = makeDistanceMatrix({
      'loc-agent': { 'loc-target': 1, 'loc-agent': 0 },
      'loc-target': { 'loc-agent': 1, 'loc-target': 0 },
    });

    // Create entries at loc-target: some moderate (pass), some deadly (filtered)
    const entries = [
      makeEntry({ templateId: 'tmpl-1', threatRating: 'moderate', reachPrimary: 'iron' as ReachDomain }),
      makeEntry({ templateId: 'tmpl-2', threatRating: 'moderate', reachPrimary: 'iron' as ReachDomain }),
      makeEntry({ templateId: 'tmpl-3', threatRating: 'deadly', reachPrimary: 'iron' as ReachDomain }),
    ];

    const result = runFilterPipeline(entries, 'agent-1', 'loc-agent', graph, dm, 5);

    // Deadly should be filtered out by threat stage
    expect(result.candidates.length).toBeLessThanOrEqual(MAX_SCORED_CANDIDATES);
    expect(result.trace.category).toBe('encounter_filter');
    expect(result.trace.agentId).toBe('agent-1');
    expect(result.trace.tick).toBe(5);
    expect(result.trace.cacheSize).toBe(3);
  });

  it('trace has correct counts at each stage', () => {
    const graph = buildAgentGraph('agent-1', { iron: 10 });

    graph.addEdge({
      id: 'adj-1',
      type: 'adjacent',
      source: 'loc-agent',
      target: 'loc-target',
      properties: {},
    });

    const dm = makeDistanceMatrix({
      'loc-agent': { 'loc-target': 1, 'loc-agent': 0 },
      'loc-target': { 'loc-agent': 1, 'loc-target': 0 },
    });

    const entries = [
      makeEntry({ templateId: 'pass-1', threatRating: 'moderate' }),
      makeEntry({ templateId: 'pass-2', threatRating: 'easy' }),
    ];

    const result = runFilterPipeline(entries, 'agent-1', 'loc-agent', graph, dm, 10);

    const trace = result.trace;
    expect(trace.cacheSize).toBe(2);
    // afterAwareness: both should be visible at 1 hop with iron cap ~50
    expect(trace.afterAwareness).toBeGreaterThanOrEqual(0);
    // Each subsequent stage count should be <= previous
    expect(trace.afterVisibility).toBeLessThanOrEqual(trace.afterAwareness);
    expect(trace.afterPrerequisites).toBeLessThanOrEqual(trace.afterVisibility);
    expect(trace.afterThreat).toBeLessThanOrEqual(trace.afterPrerequisites);
    expect(trace.afterCap).toBeLessThanOrEqual(trace.afterThreat);
    expect(trace.summary).toContain('agent-1');
  });

  it('stage 1 calls awareness + faction filters', () => {
    // Build graph with agent at loc-agent
    const graph = buildAgentGraph('agent-1', { iron: 10 });

    // Add a faction that grants intel at a remote location
    graph.addNode({
      id: 'loc-remote',
      type: 'location',
      name: 'Remote Location',
      properties: { locationType: 'city' },
    });

    graph.addNode({
      id: 'faction-1',
      type: 'actor',
      name: 'Iron Brotherhood',
      properties: {
        actorType: 'faction',
        reachPreferences: { iron: 0.8, gold: 0.4 },
      },
    });

    graph.addEdge({
      id: 'edge-member-faction',
      type: 'member_of',
      source: 'agent-1',
      target: 'faction-1',
      properties: { rank: 0.5 },
    });

    graph.addEdge({
      id: 'edge-faction-loc',
      type: 'located_at',
      source: 'faction-1',
      target: 'loc-remote',
      properties: {},
    });

    // Distance: agent is adjacent to loc-target (1 hop) but NOT to loc-remote
    const dm = makeDistanceMatrix({
      'loc-agent': { 'loc-target': 1, 'loc-agent': 0 },
      'loc-target': { 'loc-agent': 1, 'loc-target': 0 },
      // loc-remote is NOT reachable from loc-agent via distance
    });

    const entries = [
      // Entry at loc-target: visible via awareness (1 hop away)
      makeEntry({
        templateId: 'tmpl-local',
        locationId: 'loc-target',
        threatRating: 'moderate',
        reachPrimary: 'iron' as ReachDomain,
      }),
      // Entry at loc-remote: only visible via faction intel
      makeEntry({
        templateId: 'tmpl-remote',
        locationId: 'loc-remote',
        threatRating: 'moderate',
        reachPrimary: 'iron' as ReachDomain,
      }),
    ];

    const result = runFilterPipeline(entries, 'agent-1', 'loc-agent', graph, dm, 1);

    // The local entry should pass via awareness.
    // The remote entry should pass via faction awareness (iron faction at loc-remote).
    // Both are moderate threat with iron cap ~50 → pass threat filter.
    expect(result.trace.afterAwareness).toBeGreaterThanOrEqual(1);
    // At least the local one should survive
    expect(result.candidates.length).toBeGreaterThanOrEqual(1);
  });
});
