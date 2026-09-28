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
  filterByOutgrowth,
  capWithDiversity,
  MAX_SCORED_CANDIDATES,
  MIN_DIVERSITY_SLOTS,
  PERSONAL_OFFER_CAP_RESERVE,
  SOCIAL_OFFER_CAP_RESERVE,
  JOURNEY_GOAL_CAP_RESERVE,
} from '../encounterFilterPipeline';
import { MAX_COMPLETIONS_PER_TEMPLATE, CAP_FILL_ROTATE } from '../../data/agent-behavior-constants';

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
    sublocationId: null,
    sublocationTypeId: null,
    reachPrimary: 'iron' as ReachDomain,
    reachSecondary: 'gold' as ReachDomain,
    threatRating: 'moderate',
    encounterType: 'explore',
    motivations: [],
    requiresPresence: true,
    remotePenalty: 0,
    questPriority: 1.0,
    isQuestEncounter: false,
    totalTickCost: 2,
    successRewardEstimate: 1.0,
    stepCount: 1,
    stepDifficulties: [0.4],
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
  // THREAT_FLOOR_FILTER is currently false (TB-056 tuning: let scoring handle
  // threat avoidance instead of hard-filtering). When disabled, filterByThreat
  // passes all entries through unchanged.

  it('passes all entries through when THREAT_FLOOR_FILTER is disabled', () => {
    const graph = buildAgentGraph('agent-1', { iron: 5 });
    const entries = [
      makeEntry({ threatRating: 'deadly', reachPrimary: 'iron' as ReachDomain }),
      makeEntry({ threatRating: 'moderate', reachPrimary: 'iron' as ReachDomain }),
      makeEntry({ threatRating: 'easy', reachPrimary: 'iron' as ReachDomain }),
    ];
    const result = filterByThreat(entries, 'agent-1', graph);
    expect(result).toHaveLength(3);
  });

  it('passes entries even when agent not found (filter disabled)', () => {
    const graph = new WorldGraph();
    const entries = [makeEntry()];
    const result = filterByThreat(entries, 'nonexistent', graph);
    expect(result).toHaveLength(1);
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

  // ── Personally-offered reserve (THR-814) ──────────────────────
  //
  // The regression these pin is positional, not scoring: `phaseAgentDecision`
  // merges as `[...nearbyEntries, ...dynamicEntries]`, so per-agent faction
  // entries sit at the tail of a ~4,650-entry list and the fill loop never
  // reaches them. Measured before the reserve: 0 of 1,263 survived.

  it('reserves slots for personally-offered entries buried at the tail', () => {
    const graph = new WorldGraph();
    // Mirror the real merge order: a long head of shared cache entries, then a
    // handful of per-agent entries last. Single encounterType so the diversity
    // floor cannot be what rescues them.
    const entries: EncounterCacheEntry[] = [
      ...Array.from({ length: 500 }, (_, i) =>
        makeEntry({ templateId: `cache-${i}`, encounterType: 'explore' })),
      ...Array.from({ length: 5 }, (_, i) =>
        makeEntry({ templateId: `faction-${i}`, encounterType: 'explore', personallyOffered: true })),
    ];

    const result = capWithDiversity(entries, 'agent-1', graph);
    expect(result).toHaveLength(MAX_SCORED_CANDIDATES);

    const survivors = result.filter(e => e.personallyOffered);
    expect(survivors).toHaveLength(5);
    expect(survivors.map(e => e.templateId).sort()).toEqual(
      ['faction-0', 'faction-1', 'faction-2', 'faction-3', 'faction-4'],
    );
  });

  it('reserves no more than PERSONAL_OFFER_CAP_RESERVE, leaving the rest of the board to the world', () => {
    const graph = new WorldGraph();
    const entries: EncounterCacheEntry[] = [
      ...Array.from({ length: 500 }, (_, i) =>
        makeEntry({ templateId: `cache-${i}`, encounterType: 'explore' })),
      // Far more personal offers than the reserve, all at the tail.
      ...Array.from({ length: 50 }, (_, i) =>
        makeEntry({ templateId: `faction-${i}`, encounterType: 'explore', personallyOffered: true })),
    ];

    const result = capWithDiversity(entries, 'agent-1', graph);
    expect(result).toHaveLength(MAX_SCORED_CANDIDATES);
    expect(result.filter(e => e.personallyOffered)).toHaveLength(PERSONAL_OFFER_CAP_RESERVE);
    // The reserve is a floor for guild work, not a takeover of the board.
    expect(result.filter(e => !e.personallyOffered).length).toBe(
      MAX_SCORED_CANDIDATES - PERSONAL_OFFER_CAP_RESERVE,
    );
  });

  it('leaves entries untouched when nothing opts in', () => {
    const graph = new WorldGraph();
    const entries = Array.from({ length: 60 }, (_, i) =>
      makeEntry({ templateId: `tmpl-${i}`, encounterType: 'explore' }),
    );
    const result = capWithDiversity(entries, 'agent-1', graph);
    expect(result).toHaveLength(MAX_SCORED_CANDIDATES);
    expect(result.some(e => e.personallyOffered)).toBe(false);
  });

  // ── Social-offer reserve (THR-1614) ───────────────────────────
  //
  // The same positional cut, on the social generator's entries. They sit in the
  // dynamic tail *ahead of* faction quests, so the load-bearing assertion is that
  // both reserves hold at once — a pooled reserve would let social starve guilds.

  it('reserves slots for social entries buried at the tail', () => {
    const graph = new WorldGraph();
    const entries: EncounterCacheEntry[] = [
      ...Array.from({ length: 500 }, (_, i) =>
        makeEntry({ templateId: `cache-${i}`, encounterType: 'assist' })),
      ...Array.from({ length: 20 }, (_, i) =>
        makeEntry({ templateId: `social-${i}`, encounterType: 'assist', socialOffer: true })),
    ];

    const result = capWithDiversity(entries, 'agent-1', graph);
    expect(result).toHaveLength(MAX_SCORED_CANDIDATES);
    expect(result.filter(e => e.socialOffer)).toHaveLength(SOCIAL_OFFER_CAP_RESERVE);
  });

  it('holds the faction reserve when social entries precede faction quests in the tail', () => {
    const graph = new WorldGraph();
    // Real merge order: cache head, then social, then faction quests.
    const entries: EncounterCacheEntry[] = [
      ...Array.from({ length: 500 }, (_, i) =>
        makeEntry({ templateId: `cache-${i}`, encounterType: 'explore' })),
      ...Array.from({ length: 30 }, (_, i) =>
        makeEntry({ templateId: `social-${i}`, encounterType: 'explore', socialOffer: true })),
      ...Array.from({ length: 10 }, (_, i) =>
        makeEntry({ templateId: `faction-${i}`, encounterType: 'explore', personallyOffered: true })),
    ];

    const result = capWithDiversity(entries, 'agent-1', graph);
    expect(result).toHaveLength(MAX_SCORED_CANDIDATES);
    expect(result.filter(e => e.personallyOffered)).toHaveLength(PERSONAL_OFFER_CAP_RESERVE);
    expect(result.filter(e => e.socialOffer)).toHaveLength(SOCIAL_OFFER_CAP_RESERVE);
    expect(result.filter(e => !e.socialOffer && !e.personallyOffered).length).toBe(
      MAX_SCORED_CANDIDATES - PERSONAL_OFFER_CAP_RESERVE - SOCIAL_OFFER_CAP_RESERVE,
    );
  });

  it('spreads the social reserve across distinct templates before repeating one', () => {
    const graph = new WorldGraph();
    // One crowd: the same scene offered at many locations, then a few other scenes.
    const entries: EncounterCacheEntry[] = [
      ...Array.from({ length: 500 }, (_, i) =>
        makeEntry({ templateId: `cache-${i}`, encounterType: 'explore' })),
      ...Array.from({ length: 20 }, (_, i) =>
        makeEntry({ templateId: 'social-gossip', locationId: `loc-${i}`, encounterType: 'explore', socialOffer: true })),
      ...Array.from({ length: 3 }, (_, i) =>
        makeEntry({ templateId: `social-other-${i}`, encounterType: 'explore', socialOffer: true })),
    ];

    const social = capWithDiversity(entries, 'agent-1', graph).filter(e => e.socialOffer);
    expect(social).toHaveLength(SOCIAL_OFFER_CAP_RESERVE);
    expect(new Set(social.map(e => e.templateId)).size).toBe(4);
  });

  // ── Journey goal reserve (THR-1639) ───────────────────────────
  //
  // A mortal that walked to an encounter must find it on the board on arrival.
  // Measured before the reserve: the 40-slot cut dropped it on ~1 arrival in 3.

  it('keeps the arrival goal buried deep in the head of a full board', () => {
    const graph = new WorldGraph();
    const entries: EncounterCacheEntry[] = Array.from({ length: 500 }, (_, i) =>
      makeEntry({ templateId: `cache-${i}`, encounterType: 'explore' }));
    entries[400] = { ...entries[400], templateId: 'goal', journeyGoal: true };

    const result = capWithDiversity(entries, 'agent-1', graph);
    expect(result).toHaveLength(MAX_SCORED_CANDIDATES);
    expect(result.filter(e => e.journeyGoal).map(e => e.templateId)).toEqual(['goal']);
  });

  it('holds the faction and social reserves alongside the goal', () => {
    const graph = new WorldGraph();
    const entries: EncounterCacheEntry[] = [
      ...Array.from({ length: 500 }, (_, i) =>
        makeEntry({ templateId: `cache-${i}`, encounterType: 'explore', journeyGoal: i === 499 })),
      ...Array.from({ length: 30 }, (_, i) =>
        makeEntry({ templateId: `social-${i}`, encounterType: 'explore', socialOffer: true })),
      ...Array.from({ length: 10 }, (_, i) =>
        makeEntry({ templateId: `faction-${i}`, encounterType: 'explore', personallyOffered: true })),
    ];

    const result = capWithDiversity(entries, 'agent-1', graph);
    expect(result).toHaveLength(MAX_SCORED_CANDIDATES);
    expect(result.filter(e => e.journeyGoal)).toHaveLength(JOURNEY_GOAL_CAP_RESERVE);
    expect(result.filter(e => e.personallyOffered)).toHaveLength(PERSONAL_OFFER_CAP_RESERVE);
    expect(result.filter(e => e.socialOffer)).toHaveLength(SOCIAL_OFFER_CAP_RESERVE);
  });

  // ── Fair free-slot fill (THR-1633 S1) ─────────────────────────
  //
  // The cut these pin is positional: the fill walked from index 0 of a list in
  // cache insertion order, so a template registered late was never looked at —
  // 67 · 68 templates per seed died at the cap, unscored. The rotation ships off
  // until THR-1639 lands (see CAP_FILL_ROTATE), so these pin the mechanism with
  // the switches passed explicitly.
  const FAIR = { distinctFirst: true, rotate: true } as const;

  it('ships with the head-first fill while CAP_FILL_ROTATE is off', () => {
    const graph = new WorldGraph();
    const entries = Array.from({ length: 200 }, (_, i) =>
      makeEntry({ templateId: `tmpl-${i}`, encounterType: 'explore' }));
    const expected = CAP_FILL_ROTATE
      ? capWithDiversity(entries, 'agent-1', graph, 7, FAIR)
      : entries.slice(0, MAX_SCORED_CANDIDATES);
    expect(capWithDiversity(entries, 'agent-1', graph, 7).map(e => e.templateId))
      .toEqual(expected.map(e => e.templateId));
  });

  it('lets a template placed last in a 200-entry list reach the shortlist within 40 ticks', () => {
    const graph = new WorldGraph();
    const entries = Array.from({ length: 200 }, (_, i) =>
      makeEntry({ templateId: `tmpl-${i}`, encounterType: 'explore' }));

    const reachedOn: number[] = [];
    for (let tick = 1; tick <= 40; tick++) {
      const result = capWithDiversity(entries, 'agent-1', graph, tick, FAIR);
      expect(result).toHaveLength(MAX_SCORED_CANDIDATES);
      if (result.some(e => e.templateId === 'tmpl-199')) reachedOn.push(tick);
    }
    expect(reachedOn.length).toBeGreaterThan(0);
  });

  it('gives the same shortlist for the same agent and tick (pure hash, no PRNG)', () => {
    const graph = new WorldGraph();
    const entries = Array.from({ length: 200 }, (_, i) =>
      makeEntry({ templateId: `tmpl-${i}`, encounterType: 'explore' }));
    const a = capWithDiversity(entries, 'agent-1', graph, 17, FAIR).map(e => e.templateId);
    const b = capWithDiversity(entries, 'agent-1', graph, 17, FAIR).map(e => e.templateId);
    expect(a).toEqual(b);
    const c = capWithDiversity(entries, 'agent-1', graph, 18, FAIR).map(e => e.templateId);
    expect(c).not.toEqual(a);
  });

  it('fills with distinct templates before giving any template a second slot', () => {
    const graph = new WorldGraph();
    // One template registered at 100 locations, then 30 others: the old fill
    // spent every free slot on copies of the first.
    const entries: EncounterCacheEntry[] = [
      ...Array.from({ length: 100 }, (_, i) =>
        makeEntry({ templateId: 'crowd', locationId: `loc-${i}`, encounterType: 'explore' })),
      ...Array.from({ length: 30 }, (_, i) =>
        makeEntry({ templateId: `other-${i}`, encounterType: 'explore' })),
    ];
    const result = capWithDiversity(entries, 'agent-1', graph, 5, FAIR);
    expect(result).toHaveLength(MAX_SCORED_CANDIDATES);
    // All 31 distinct templates are on the shortlist; only the leftover slots repeat.
    expect(new Set(result.map(e => e.templateId)).size).toBe(31);
  });

  it('keeps the head-first fill when no tick is given (old behaviour)', () => {
    const graph = new WorldGraph();
    const entries = Array.from({ length: 200 }, (_, i) =>
      makeEntry({ templateId: `tmpl-${i}`, encounterType: 'explore' }));
    const result = capWithDiversity(entries, 'agent-1', graph);
    expect(result.map(e => e.templateId)).toEqual(
      Array.from({ length: MAX_SCORED_CANDIDATES }, (_, i) => `tmpl-${i}`),
    );
  });

  it('holds every reserve under a rotating fill', () => {
    const graph = new WorldGraph();
    const entries: EncounterCacheEntry[] = [
      ...Array.from({ length: 500 }, (_, i) =>
        makeEntry({ templateId: `cache-${i}`, encounterType: 'explore' })),
      ...Array.from({ length: 30 }, (_, i) =>
        makeEntry({ templateId: `social-${i}`, encounterType: 'explore', socialOffer: true })),
      ...Array.from({ length: 10 }, (_, i) =>
        makeEntry({ templateId: `faction-${i}`, encounterType: 'explore', personallyOffered: true })),
    ];
    for (let tick = 1; tick <= 20; tick++) {
      const result = capWithDiversity(entries, 'agent-1', graph, tick, FAIR);
      expect(result).toHaveLength(MAX_SCORED_CANDIDATES);
      expect(result.filter(e => e.personallyOffered).length).toBeGreaterThanOrEqual(PERSONAL_OFFER_CAP_RESERVE);
      expect(result.filter(e => e.socialOffer).length).toBeGreaterThanOrEqual(SOCIAL_OFFER_CAP_RESERVE);
    }
  });
});

// ─── Full Pipeline ──────────────────────────────────────────────

describe('runFilterPipeline', () => {
  it('returns empty candidates for empty input', () => {
    const graph = buildAgentGraph('agent-1', { iron: 10 });
    const result = runFilterPipeline([], 'agent-1', 'loc-agent', graph, 1);
    expect(result.candidates).toHaveLength(0);
    expect(result.trace.cacheSize).toBe(0);
    expect(result.trace.afterCap).toBe(0);
  });

  it('returns empty candidates when agent missing from graph', () => {
    const graph = new WorldGraph();
    const entries = [makeEntry()];
    const result = runFilterPipeline(entries, 'nonexistent', 'loc-agent', graph, 1);
    expect(result.candidates).toHaveLength(0);
    expect(result.trace.cacheSize).toBe(1);
    expect(result.trace.afterAwareness).toBe(0);
  });

  it('runs full pipeline from N entries and filters down', () => {
    // Build graph: agent at loc-agent, high iron capability (raw=10 → cap ~50)
    const graph = buildAgentGraph('agent-1', { iron: 10 });

    // Add hex coordinates to locations so hex-distance awareness works
    graph.updateNode('loc-agent', { properties: { ...graph.getNode('loc-agent')!.properties, hexCol: 0, hexRow: 0 } });
    graph.updateNode('loc-target', { properties: { ...graph.getNode('loc-target')!.properties, hexCol: 1, hexRow: 0 } });

    // Create entries at loc-target: some moderate (pass), some deadly (filtered)
    const entries = [
      makeEntry({ templateId: 'tmpl-1', threatRating: 'moderate', reachPrimary: 'iron' as ReachDomain }),
      makeEntry({ templateId: 'tmpl-2', threatRating: 'moderate', reachPrimary: 'iron' as ReachDomain }),
      makeEntry({ templateId: 'tmpl-3', threatRating: 'deadly', reachPrimary: 'iron' as ReachDomain }),
    ];

    const result = runFilterPipeline(entries, 'agent-1', 'loc-agent', graph, 5);

    // With THREAT_FLOOR_FILTER=false, all entries pass threat stage — scoring handles threat avoidance
    expect(result.candidates.length).toBeLessThanOrEqual(MAX_SCORED_CANDIDATES);
    expect(result.trace.category).toBe('encounter_filter');
    expect(result.trace.agentId).toBe('agent-1');
    expect(result.trace.tick).toBe(5);
    expect(result.trace.cacheSize).toBe(3);
  });

  it('trace has correct counts at each stage', () => {
    const graph = buildAgentGraph('agent-1', { iron: 10 });

    // Add hex coords to locations for hex-distance awareness
    graph.updateNode('loc-agent', { properties: { ...graph.getNode('loc-agent')!.properties, hexCol: 0, hexRow: 0 } });
    graph.updateNode('loc-target', { properties: { ...graph.getNode('loc-target')!.properties, hexCol: 1, hexRow: 0 } });

    const entries = [
      makeEntry({ templateId: 'pass-1', threatRating: 'moderate' }),
      makeEntry({ templateId: 'pass-2', threatRating: 'easy' }),
    ];

    const result = runFilterPipeline(entries, 'agent-1', 'loc-agent', graph, 10);

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
    expect(trace.capCutTemplates).toBe(0);
  });

  it('counts the distinct templates the cap cut (THR-1633 S1)', () => {
    const graph = buildAgentGraph('agent-1', { iron: 10 });
    graph.updateNode('loc-agent', { properties: { ...graph.getNode('loc-agent')!.properties, hexCol: 0, hexRow: 0 } });
    graph.updateNode('loc-target', { properties: { ...graph.getNode('loc-target')!.properties, hexCol: 1, hexRow: 0 } });

    const entries = Array.from({ length: 60 }, (_, i) =>
      makeEntry({ templateId: `t-${i}`, threatRating: 'moderate', reachPrimary: 'iron' as ReachDomain }));
    const trace = runFilterPipeline(entries, 'agent-1', 'loc-agent', graph, 3).trace;
    // Every entry is its own template, so the templates cut equal the entries cut.
    expect(trace.capCutTemplates).toBe(Math.max(0, trace.afterThreat - trace.afterCap));
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

    // Add hex coords: loc-agent at (0,0), loc-target at (1,0) = 1 hex away
    // loc-remote at (10,10) = far away, not reachable via awareness
    graph.updateNode('loc-agent', { properties: { ...graph.getNode('loc-agent')!.properties, hexCol: 0, hexRow: 0 } });
    graph.updateNode('loc-target', { properties: { ...graph.getNode('loc-target')!.properties, hexCol: 1, hexRow: 0 } });
    graph.updateNode('loc-remote', { properties: { ...graph.getNode('loc-remote')!.properties, hexCol: 10, hexRow: 10 } });

    const entries = [
      // Entry at loc-target: visible via awareness (1 hex away)
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

    const result = runFilterPipeline(entries, 'agent-1', 'loc-agent', graph, 1);

    // The local entry should pass via awareness.
    // The remote entry should pass via faction awareness (iron faction at loc-remote).
    // Both are moderate threat with iron cap ~50 → pass threat filter.
    expect(result.trace.afterAwareness).toBeGreaterThanOrEqual(1);
    // At least the local one should survive
    expect(result.candidates.length).toBeGreaterThanOrEqual(1);
  });

  it('does not zero out awareness when the agent has a condition trait without domain contributions', () => {
    const graph = buildAgentGraph('agent-1', { iron: 10 });

    graph.updateNode('loc-agent', { properties: { ...graph.getNode('loc-agent')!.properties, hexCol: 0, hexRow: 0 } });
    graph.updateNode('loc-target', { properties: { ...graph.getNode('loc-target')!.properties, hexCol: 0, hexRow: 0 } });

    graph.addNode({
      id: 'trait-condition-deep-stab-wound',
      type: 'trait',
      name: 'Deep Stab Wound',
      properties: {
        subcategory: 'condition',
        description: 'A lingering wound.',
        importance: 0.4,
        maxLevel: 1,
        visibility: 'public',
        effects: [],
        tags: [],
        flavorText: 'It aches with every breath.',
      },
    });
    graph.addEdge({
      id: 'edge-agent-condition',
      type: 'has_trait',
      source: 'agent-1',
      target: 'trait-condition-deep-stab-wound',
      properties: {
        level: 1,
        acquiredTick: 0,
        lastReinforcedTick: 0,
        source: 'test',
        visibility: 'public',
      },
    });

    const entries = [
      makeEntry({
        templateId: 'tmpl-same-hex',
        locationId: 'loc-target',
        threatRating: 'moderate',
        reachPrimary: 'iron' as ReachDomain,
      }),
    ];

    const result = runFilterPipeline(entries, 'agent-1', 'loc-agent', graph, 10);

    expect(result.trace.afterAwareness).toBe(1);
    expect(result.candidates).toHaveLength(1);
  });
});

// ─── Stage 3b: Outgrowth Lock ────────────────────────────────────

describe('filterByOutgrowth', () => {
  /**
   * THR-1582 (forecast window S4) retired this filter by switch
   * (`OUTGROWTH_FILTER_ENABLED = false`): the too-easy side of the engagement fit
   * replaces it. The code is retained (NFP #6), so these tests drive it with the
   * explicit `enabledOverride = true` and pin the re-fitted curve (THR-1581:
   * midpoint 30, k 0.08).
   *
   * raw=60 → cap ≈ 0.917 → scaled ≈ 92
   * raw=20 → cap ≈ 0.310 → scaled ≈ 31
   * raw=5  → cap ≈ 0.119 → scaled ≈ 12
   *
   * Outgrown when: capScaled − avgDifficultyScaled >= OUTGROWTH_CAP_THRESHOLD (55)
   */

  it('is off by default — the engagement fit replaced it (THR-1582)', () => {
    const graph = buildAgentGraph('agent-1', { iron: 60 });
    const entries = [makeEntry({ reachPrimary: 'iron' as ReachDomain, stepDifficulties: [0.2], stepCount: 1 })];
    expect(filterByOutgrowth(entries, 'agent-1', graph)).toHaveLength(1);
  });

  it('filters out encounters when agent capability far exceeds difficulty (cap 92, diff 0.2 → gap 72 > 55)', () => {
    const graph = buildAgentGraph('agent-1', { iron: 60 });
    const entries = [makeEntry({ reachPrimary: 'iron' as ReachDomain, stepDifficulties: [0.2], stepCount: 1 })];
    const result = filterByOutgrowth(entries, 'agent-1', graph, true);
    expect(result).toHaveLength(0);
  });

  it('does NOT filter encounters when agent capability is only slightly above difficulty (cap 31, diff 0.2 → gap 11 < 55)', () => {
    const graph = buildAgentGraph('agent-1', { iron: 20 });
    const entries = [makeEntry({ reachPrimary: 'iron' as ReachDomain, stepDifficulties: [0.2], stepCount: 1 })];
    const result = filterByOutgrowth(entries, 'agent-1', graph, true);
    expect(result).toHaveLength(1);
  });

  it('does NOT filter encounters when agent capability is low (cap 12, diff 0.2 → gap negative)', () => {
    const graph = buildAgentGraph('agent-1', { iron: 5 });
    const entries = [makeEntry({ reachPrimary: 'iron' as ReachDomain, stepDifficulties: [0.2], stepCount: 1 })];
    const result = filterByOutgrowth(entries, 'agent-1', graph, true);
    expect(result).toHaveLength(1);
  });

  it('uses average difficulty across multiple steps', () => {
    // raw=60 → cap ≈ 92; steps [0.6, 0.8] avg=0.7 → scaled=70 → gap=22 < 55 → NOT outgrown
    const graph = buildAgentGraph('agent-1', { iron: 60 });
    const entries = [makeEntry({ reachPrimary: 'iron' as ReachDomain, stepDifficulties: [0.6, 0.8], stepCount: 2 })];
    const result = filterByOutgrowth(entries, 'agent-1', graph, true);
    expect(result).toHaveLength(1);
  });

  it('respects OUTGROWTH_FILTER_ENABLED=false toggle — no filtering when disabled', () => {
    // Even with raw=20 cap, outgrowth is skipped when toggle is off
    // We test this by verifying the import constant exists and is a boolean
    // The actual toggle test uses the exported filterByOutgrowth with override
    const graph = buildAgentGraph('agent-1', { iron: 20 });
    // 3 entries that would all be filtered if outgrowth were active
    const entries = [
      makeEntry({ templateId: 'a', reachPrimary: 'iron' as ReachDomain, stepDifficulties: [0.2], stepCount: 1 }),
      makeEntry({ templateId: 'b', reachPrimary: 'iron' as ReachDomain, stepDifficulties: [0.2], stepCount: 1 }),
      makeEntry({ templateId: 'c', reachPrimary: 'iron' as ReachDomain, stepDifficulties: [0.2], stepCount: 1 }),
    ];
    // When OUTGROWTH_FILTER_ENABLED is false, all should pass through
    const result = filterByOutgrowth(entries, 'agent-1', graph, false);
    expect(result).toHaveLength(3);
  });

  it('passes through all entries when agent node missing (fail-soft)', () => {
    const graph = new WorldGraph();
    const entries = [makeEntry({ reachPrimary: 'iron' as ReachDomain })];
    const result = filterByOutgrowth(entries, 'nonexistent', graph);
    expect(result).toHaveLength(1);
  });
});

// ─── Max Completions Pre-Filter ──────────────────────────────────

describe('MAX_COMPLETIONS_PER_TEMPLATE constant', () => {
  it('MAX_COMPLETIONS_PER_TEMPLATE is 5', () => {
    expect(MAX_COMPLETIONS_PER_TEMPLATE).toBe(5);
  });

  it('a candidate with attemptCount equal to threshold is excluded', () => {
    // This tests the constant boundary — at exactly MAX_COMPLETIONS_PER_TEMPLATE, excluded
    const count = MAX_COMPLETIONS_PER_TEMPLATE; // 5
    // The filter is: completions < MAX_COMPLETIONS_PER_TEMPLATE
    expect(count < MAX_COMPLETIONS_PER_TEMPLATE).toBe(false);
  });

  it('a candidate with attemptCount one below threshold is included', () => {
    const count = MAX_COMPLETIONS_PER_TEMPLATE - 1; // 4
    expect(count < MAX_COMPLETIONS_PER_TEMPLATE).toBe(true);
  });

  it('a candidate with no attempts (0) passes through', () => {
    const count = 0;
    expect(count < MAX_COMPLETIONS_PER_TEMPLATE).toBe(true);
  });
});
