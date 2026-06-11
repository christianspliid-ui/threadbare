/**
 * End-to-end consumption tests for intelligence records (THR-113).
 * Verifies scoring bonus + trace emission for scoring_boost, and that
 * non-matching candidates do not emit traces.
 */

import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { scoreAndSelect } from '../encounterScoring';
import { INTEL_SCORING_BONUS } from '../../data/agent-behavior-constants';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import { phaseIntelligenceDecay } from '../phaseIntelligenceDecay';
import {
  INTEL_RELIABILITY_GRACE_TICKS,
  INTEL_RELIABILITY_DECAY_PER_TICK,
  RELIABILITY_THRESHOLD_RELIABLE,
  reliabilityDescriptor,
} from '../intelligence';
import type { EncounterCacheEntry } from '../encounterCache';
import type { IntelligenceRecord } from '../../types/unifiedAction';
import type { GameState } from '../../types/gameState';
import type { ReachDomain } from '../../types/traits';

function makeGraph(): WorldGraph {
  const g = new WorldGraph();
  g.addNode({
    id: 'loc-shrine',
    type: 'location',
    name: 'Pale Court Shrine',
    properties: { locationType: 'settlement', hexCol: 0, hexRow: 0 },
  });
  g.addNode({
    id: 'loc-other',
    type: 'location',
    name: 'Other',
    properties: { locationType: 'settlement', hexCol: 1, hexRow: 0 },
  });
  g.addNode({
    id: 'agent-1',
    type: 'actor',
    name: 'Seeker',
    properties: { actorType: 'individual', locationId: 'loc-shrine' },
  });
  return g;
}

function mkCandidate(overrides: Partial<EncounterCacheEntry>): EncounterCacheEntry {
  return {
    templateId: 'base.template',
    locationId: 'loc-shrine',
    sublocationId: null,
    sublocationTypeId: null,
    reachPrimary: 'iron' as ReachDomain,
    reachSecondary: 'gold' as ReachDomain,
    threatRating: 'moderate' as any,
    encounterType: 'exploration' as any,
    motivations: [],
    requiresPresence: true,
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

const INTEL_SHRINE: IntelligenceRecord = {
  recordId: 'intel_shrine_1',
  agentId: 'agent-1',
  category: 'shrine_location',
  label: 'Pale Court shrine',
  detail: 'Hidden pilgrim route.',
  targetEntityId: 'loc-shrine',
  sourceEncounterId: 'encounter.quest',
  acquiredTick: 10,
  reliability: 0.85,
};

const INTEL_TRADE: IntelligenceRecord = {
  recordId: 'intel_trade_1',
  agentId: 'agent-1',
  category: 'trade_route',
  label: 'Salt caravan',
  detail: 'Northern waystation rotations.',
  targetEntityId: 'route-salt-north',
  sourceEncounterId: 'encounter.merchant',
  acquiredTick: 20,
  reliability: 0.7,
};

const INTEL_WRONG_AGENT: IntelligenceRecord = {
  ...INTEL_SHRINE,
  recordId: 'intel_foreign',
  agentId: 'agent-99',
};

beforeEach(() => {
  clearTraces();
  enableTracing();
});

afterEach(() => {
  disableTracing();
  clearTraces();
});

describe('scoreAndSelect — intelligence consumption', () => {
  it('raises finalScore by INTEL_SCORING_BONUS when actionable intel matches', () => {
    const graph = makeGraph();
    const candidate = mkCandidate({ templateId: 'pilgrim.shrine.visit' });

    const baseline = scoreAndSelect([candidate], 'agent-1', 'loc-shrine', graph, 50);
    const withIntel = scoreAndSelect(
      [candidate],
      'agent-1',
      'loc-shrine',
      graph,
      50,
      undefined, undefined, undefined, undefined, undefined,
      [INTEL_SHRINE],
    );

    const baseScore = baseline.rankedCandidates[0].finalScore;
    const boostedScore = withIntel.rankedCandidates[0].finalScore;
    expect(boostedScore - baseScore).toBeCloseTo(INTEL_SCORING_BONUS, 5);
    expect(withIntel.rankedCandidates[0].intelBonus).toBeCloseTo(INTEL_SCORING_BONUS, 5);
    expect(baseline.rankedCandidates[0].intelBonus).toBe(0);
  });

  it('emits intelligence_referenced trace with referencedBy=scoring_boost on match', () => {
    const graph = makeGraph();
    const candidate = mkCandidate({ templateId: 'pilgrim.shrine.visit' });

    scoreAndSelect(
      [candidate],
      'agent-1',
      'loc-shrine',
      graph,
      50,
      undefined, undefined, undefined, undefined, undefined,
      [INTEL_SHRINE],
    );

    const traces = getTraces().filter(t => t.category === 'intelligence_referenced');
    expect(traces.length).toBeGreaterThanOrEqual(1);
    const scoring = traces.find(t => (t as any).referencedBy === 'scoring_boost');
    expect(scoring).toBeDefined();
    expect((scoring as any).recordId).toBe('intel_shrine_1');
    expect((scoring as any).agentId).toBe('agent-1');
    expect((scoring as any).templateId).toBe('pilgrim.shrine.visit');
  });

  it('does not emit scoring_boost trace or bonus for unrelated candidates', () => {
    const graph = makeGraph();
    const unrelated = mkCandidate({
      templateId: 'combat.skirmish',
      locationId: 'loc-other',
      stepDifficulties: [40],
    });

    const result = scoreAndSelect(
      [unrelated],
      'agent-1',
      'loc-shrine',
      graph,
      50,
      undefined, undefined, undefined, undefined, undefined,
      [INTEL_TRADE], // trade intel can't match a combat template
    );

    expect(result.rankedCandidates[0].intelBonus).toBe(0);
    const scoringTraces = getTraces().filter(
      t => t.category === 'intelligence_referenced' && (t as any).referencedBy === 'scoring_boost',
    );
    expect(scoringTraces).toHaveLength(0);
  });

  it('ignores records belonging to other agents', () => {
    const graph = makeGraph();
    const candidate = mkCandidate({ templateId: 'pilgrim.shrine.visit' });

    const result = scoreAndSelect(
      [candidate],
      'agent-1',
      'loc-shrine',
      graph,
      50,
      undefined, undefined, undefined, undefined, undefined,
      [INTEL_WRONG_AGENT], // belongs to agent-99
    );

    expect(result.rankedCandidates[0].intelBonus).toBe(0);
  });

  it('applies bonus once even if multiple records match', () => {
    const graph = makeGraph();
    const candidate = mkCandidate({ templateId: 'pilgrim.shrine.visit' });

    const secondShrineRecord: IntelligenceRecord = {
      ...INTEL_SHRINE,
      recordId: 'intel_shrine_2',
      acquiredTick: 20, // newer
    };

    const result = scoreAndSelect(
      [candidate],
      'agent-1',
      'loc-shrine',
      graph,
      50,
      undefined, undefined, undefined, undefined, undefined,
      [INTEL_SHRINE, secondShrineRecord],
    );

    expect(result.rankedCandidates[0].intelBonus).toBeCloseTo(INTEL_SCORING_BONUS, 5);
  });

  it('dedupes intelligence_referenced traces across many matching candidates in one call', () => {
    const graph = makeGraph();
    // Three candidates all matching the same record via the pilgrim template substring.
    const c1 = mkCandidate({ templateId: 'pilgrim.shrine.visit' });
    const c2 = mkCandidate({ templateId: 'pilgrim.shrine.vigil' });
    const c3 = mkCandidate({ templateId: 'pilgrim.shrine.contrition' });

    scoreAndSelect(
      [c1, c2, c3],
      'agent-1',
      'loc-shrine',
      graph,
      50,
      undefined, undefined, undefined, undefined, undefined,
      [INTEL_SHRINE],
    );

    const traces = getTraces().filter(
      t =>
        t.category === 'intelligence_referenced' &&
        (t as any).referencedBy === 'scoring_boost' &&
        (t as any).recordId === 'intel_shrine_1',
    );
    expect(traces).toHaveLength(1);
  });
});

// ─── Integration: decay → scoring + prose + chronicle (THR-137) ───────────────

describe('phaseIntelligenceDecay — integration with consumption pipeline', () => {
  function makeMinimalState(records: IntelligenceRecord[], tick: number): GameState {
    return {
      tick,
      intelligenceRecords: records,
      tickEvents: [],
      recentEvents: [],
      graph: undefined as unknown as GameState['graph'],
    } as unknown as GameState;
  }

  it('scoring bonus still applies after partial decay (reliability > 0 but below reliable)', () => {
    const graph = makeGraph();
    const candidate = mkCandidate({ templateId: 'pilgrim.shrine.visit' });

    // Start below the reliable threshold but still above 0
    const decayedRecord: IntelligenceRecord = {
      ...INTEL_SHRINE,
      reliability: RELIABILITY_THRESHOLD_RELIABLE - 0.1,
    };

    const result = scoreAndSelect(
      [candidate],
      'agent-1',
      'loc-shrine',
      graph,
      50,
      undefined, undefined, undefined, undefined, undefined,
      [decayedRecord],
    );

    // Scoring bonus is presence-based, not reliability-scaled — intel still boosts
    expect(result.rankedCandidates[0].intelBonus).toBeCloseTo(INTEL_SCORING_BONUS, 5);
  });

  it('reliabilityDescriptor demotes when reliability crosses threshold after decay ticks', () => {
    // Start just above the reliable threshold
    const startReliability = RELIABILITY_THRESHOLD_RELIABLE + INTEL_RELIABILITY_DECAY_PER_TICK * 0.5;
    let record: IntelligenceRecord = { ...INTEL_SHRINE, acquiredTick: 0, reliability: startReliability };
    let state = makeMinimalState([record], INTEL_RELIABILITY_GRACE_TICKS + 1);

    expect(reliabilityDescriptor(record.reliability)).toBe('reliable');

    // One decay tick crosses into uncertain
    const result = phaseIntelligenceDecay(state);
    const updatedRecords = result.intelligenceRecords ?? state.intelligenceRecords!;
    expect(reliabilityDescriptor(updatedRecords[0].reliability)).toBe('uncertain');
  });

  it('chronicle event of type intelligence_decay appears on threshold crossing tick', () => {
    const startReliability = RELIABILITY_THRESHOLD_RELIABLE + INTEL_RELIABILITY_DECAY_PER_TICK * 0.5;
    const record: IntelligenceRecord = { ...INTEL_SHRINE, acquiredTick: 0, reliability: startReliability };
    const state = makeMinimalState([record], INTEL_RELIABILITY_GRACE_TICKS + 1);

    const result = phaseIntelligenceDecay(state);
    const crossingEvent = (result.tickEvents ?? []).find(e => e.type === 'intelligence_decay');
    expect(crossingEvent).toBeDefined();
    expect(crossingEvent!.actorId).toBe('agent-1');
  });
});

