/**
 * Tests for the novelty pressure system (THR-453).
 * Covers: computeGlobalNoveltyPenalty, computeAgentNoveltyPenalty,
 *         computeNoveltyMultiplier, and scoreAndSelect integration.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import type { EncounterCacheEntry } from '../encounterCache';
import type { ReachDomain } from '../../types/traits';
import type { ValuePair } from '../../types/agent';
import {
  computeGlobalNoveltyPenalty,
  computeAgentNoveltyPenalty,
  computeNoveltyMultiplier,
  scoreAndSelect,
  type EncounterNoveltyRecord,
} from '../encounterScoring';
import {
  NOVELTY_GLOBAL_MAX_PENALTY,
  NOVELTY_GLOBAL_HALF_LIFE,
  NOVELTY_AGENT_MAX_PENALTY,
  NOVELTY_COMBINED_CAP,
  NOVELTY_CATEGORY_QUOTA_SOFT,
  NOVELTY_CATEGORY_QUOTA_MAX_PENALTY,
} from '../../data/agent-behavior-constants';

// ─── Helpers ────────────────────────────────────────────────────

function makeEntry(overrides: Partial<EncounterCacheEntry> = {}): EncounterCacheEntry {
  return {
    templateId: 'tmpl_default',
    locationId: 'loc_a',
    sublocationId: null,
    sublocationTypeId: null,
    reachPrimary: 'iron' as ReachDomain,
    reachSecondary: 'gold' as ReachDomain,
    threatRating: 'moderate' as any,
    encounterType: 'combat' as any,
    motivations: ['mercy_ruthlessness'] as ValuePair[],
    requiresPresence: false,
    remotePenalty: 0,
    questPriority: 1.0,
    isQuestEncounter: false,
    totalTickCost: 3,
    successRewardEstimate: 2.0,
    stepCount: 1,
    stepDifficulties: [50],
    stepReaches: ['iron'] as ReachDomain[],
    ...overrides,
  };
}

function makeEmptyNoveltyRecord(startTick = 0): EncounterNoveltyRecord {
  return {
    globalLastSelected: {},
    categoryWindowCounts: {},
    categoryWindowTotal: 0,
    categoryWindowStart: startTick,
  };
}

function makeGraph(agentId: string): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: agentId,
    type: 'actor',
    name: 'Test Agent',
    properties: { actorType: 'individual', hexCol: 0, hexRow: 0 },
  });
  graph.addNode({
    id: 'loc_a',
    type: 'location',
    name: 'Location A',
    properties: { hexCol: 0, hexRow: 0 },
  });
  graph.addNode({
    id: 'loc_b',
    type: 'location',
    name: 'Location B',
    properties: { hexCol: 0, hexRow: 0 },
  });
  graph.addEdge({ id: 'e1', type: 'located_at', source: agentId, target: 'loc_a', properties: {} });
  return graph;
}

// ─── computeGlobalNoveltyPenalty ────────────────────────────────

describe('computeGlobalNoveltyPenalty', () => {
  it('returns 0 when no record is provided', () => {
    expect(computeGlobalNoveltyPenalty(undefined, 'tmpl_a', 10)).toBe(0);
  });

  it('returns 0 when template is not in the record', () => {
    const record = makeEmptyNoveltyRecord();
    expect(computeGlobalNoveltyPenalty(record, 'tmpl_a', 10)).toBe(0);
  });

  it('returns MAX_PENALTY when template was selected this tick (ticksSince = 0)', () => {
    const record: EncounterNoveltyRecord = {
      globalLastSelected: { 'tmpl_a': 10 },
      categoryWindowCounts: {},
      categoryWindowTotal: 0,
      categoryWindowStart: 0,
    };
    const penalty = computeGlobalNoveltyPenalty(record, 'tmpl_a', 10);
    expect(penalty).toBeCloseTo(NOVELTY_GLOBAL_MAX_PENALTY, 6);
  });

  it('returns ~half MAX_PENALTY after HALF_LIFE ticks have passed', () => {
    const record: EncounterNoveltyRecord = {
      globalLastSelected: { 'tmpl_a': 0 },
      categoryWindowCounts: {},
      categoryWindowTotal: 0,
      categoryWindowStart: 0,
    };
    const penalty = computeGlobalNoveltyPenalty(record, 'tmpl_a', NOVELTY_GLOBAL_HALF_LIFE);
    expect(penalty).toBeCloseTo(NOVELTY_GLOBAL_MAX_PENALTY / 2, 4);
  });

  it('approaches 0 for old selections', () => {
    const record: EncounterNoveltyRecord = {
      globalLastSelected: { 'tmpl_a': 0 },
      categoryWindowCounts: {},
      categoryWindowTotal: 0,
      categoryWindowStart: 0,
    };
    const penalty = computeGlobalNoveltyPenalty(record, 'tmpl_a', 100);
    expect(penalty).toBeLessThan(0.01);
  });
});

// ─── computeAgentNoveltyPenalty ─────────────────────────────────

describe('computeAgentNoveltyPenalty', () => {
  it('returns 0 when no agent record is provided', () => {
    expect(computeAgentNoveltyPenalty(undefined, 'tmpl_a', 10)).toBe(0);
  });

  it('returns 0 when template is not in the agent record', () => {
    expect(computeAgentNoveltyPenalty({}, 'tmpl_a', 10)).toBe(0);
  });

  it('returns MAX_PENALTY when selected this tick', () => {
    const penalty = computeAgentNoveltyPenalty({ 'tmpl_a': 5 }, 'tmpl_a', 5);
    expect(penalty).toBeCloseTo(NOVELTY_AGENT_MAX_PENALTY, 6);
  });
});

// ─── computeNoveltyMultiplier ───────────────────────────────────

describe('computeNoveltyMultiplier', () => {
  it('returns 1.0 with no record and no agent history', () => {
    expect(computeNoveltyMultiplier(undefined, undefined, 'tmpl_a', 'iron', 10)).toBe(1.0);
  });

  it('combined penalties are capped at NOVELTY_COMBINED_CAP', () => {
    // Flood the record: template selected this tick (max global + max agent penalty)
    const record: EncounterNoveltyRecord = {
      globalLastSelected: { 'tmpl_a': 10 },
      categoryWindowCounts: { 'iron': 100 },
      categoryWindowTotal: 100,
      categoryWindowStart: 0,
    };
    const agentRecord = { 'tmpl_a': 10 };
    const multiplier = computeNoveltyMultiplier(record, agentRecord, 'tmpl_a', 'iron', 10);
    expect(multiplier).toBeCloseTo(1 - NOVELTY_COMBINED_CAP, 6);
  });

  it('applies category quota penalty when one reach dominates the window', () => {
    // 80% of selections are 'iron' — well above NOVELTY_CATEGORY_QUOTA_SOFT
    const record: EncounterNoveltyRecord = {
      globalLastSelected: {},
      categoryWindowCounts: { 'iron': 80 },
      categoryWindowTotal: 100,
      categoryWindowStart: 0,
    };
    const multiplier = computeNoveltyMultiplier(record, undefined, 'tmpl_a', 'iron', 50);
    // Should be strictly less than 1 (quota penalty active)
    expect(multiplier).toBeLessThan(1.0);
    // But not below the combined cap floor
    expect(multiplier).toBeGreaterThanOrEqual(1 - NOVELTY_COMBINED_CAP);
  });

  it('applies no quota penalty when category is under soft limit', () => {
    // 10% of selections are 'iron' — below NOVELTY_CATEGORY_QUOTA_SOFT (0.18)
    const record: EncounterNoveltyRecord = {
      globalLastSelected: {},
      categoryWindowCounts: { 'iron': 10 },
      categoryWindowTotal: 100,
      categoryWindowStart: 0,
    };
    // No global/agent recency → only quota signal, which is zero here
    const multiplier = computeNoveltyMultiplier(record, undefined, 'tmpl_a', 'iron', 50);
    expect(multiplier).toBe(1.0);
  });
});

// ─── scoreAndSelect integration ─────────────────────────────────

describe('scoreAndSelect novelty integration', () => {
  it('penalises a recently over-selected template relative to a fresh one', () => {
    const agentId = 'agent_1';
    const graph = makeGraph(agentId);

    const hotTemplate = makeEntry({ templateId: 'tmpl_hot', locationId: 'loc_a', requiresPresence: false });
    const freshTemplate = makeEntry({ templateId: 'tmpl_fresh', locationId: 'loc_a', requiresPresence: false });

    // noveltyRecord with tmpl_hot selected THIS tick
    const noveltyRecord: EncounterNoveltyRecord = {
      globalLastSelected: { 'tmpl_hot': 5 },
      categoryWindowCounts: {},
      categoryWindowTotal: 0,
      categoryWindowStart: 0,
    };

    const result = scoreAndSelect(
      [hotTemplate, freshTemplate],
      agentId,
      'loc_a',
      graph,
      5,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      noveltyRecord,
    );

    // The hot template should score lower than the fresh one
    const hotCandidate = result.rankedCandidates.find(c => c.entry.templateId === 'tmpl_hot')!;
    const freshCandidate = result.rankedCandidates.find(c => c.entry.templateId === 'tmpl_fresh')!;
    expect(hotCandidate.noveltyMultiplier).toBeLessThan(freshCandidate.noveltyMultiplier);
    expect(hotCandidate.finalScore).toBeLessThan(freshCandidate.finalScore);
  });

  it('emits noveltyChangedSelection=true in trace when novelty flips the winner', () => {
    const agentId = 'agent_1';
    const graph = makeGraph(agentId);

    // Make tmpl_dominant slightly higher base score but penalised by recency
    const dominant = makeEntry({
      templateId: 'tmpl_dominant',
      locationId: 'loc_a',
      requiresPresence: false,
      successRewardEstimate: 2.1,
    });
    const challenger = makeEntry({
      templateId: 'tmpl_challenger',
      locationId: 'loc_a',
      requiresPresence: false,
      successRewardEstimate: 2.0,
    });

    // dominant was selected this tick — maximum novelty penalty
    const noveltyRecord: EncounterNoveltyRecord = {
      globalLastSelected: { 'tmpl_dominant': 5 },
      categoryWindowCounts: {},
      categoryWindowTotal: 0,
      categoryWindowStart: 0,
    };

    const result = scoreAndSelect(
      [dominant, challenger],
      agentId,
      'loc_a',
      graph,
      5,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      noveltyRecord,
    );

    // If the penalty was large enough to flip selection, check the trace flag
    if (result.selected?.entry.templateId === 'tmpl_challenger') {
      expect(result.trace.noveltyChangedSelection).toBe(true);
      expect(result.trace.preNoveltyWinnerId).toBe('tmpl_dominant');
    }
    // Whether or not it flipped, the noveltyMultiplier should be < 1 for tmpl_dominant
    const domCandidate = result.rankedCandidates.find(c => c.entry.templateId === 'tmpl_dominant')!;
    expect(domCandidate.noveltyMultiplier).toBeLessThan(1.0);
  });

  it('returns noveltyChangedSelection=false and noveltyMultiplier=1 when no noveltyRecord', () => {
    const agentId = 'agent_1';
    const graph = makeGraph(agentId);
    const entry = makeEntry({ templateId: 'tmpl_a', requiresPresence: false });

    const result = scoreAndSelect(
      [entry],
      agentId,
      'loc_a',
      graph,
      1,
    );

    const candidate = result.rankedCandidates[0]!;
    expect(candidate.noveltyMultiplier).toBe(1.0);
    expect(result.trace.noveltyChangedSelection).toBe(false);
  });
});
