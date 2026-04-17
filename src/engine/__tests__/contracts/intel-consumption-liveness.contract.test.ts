/**
 * Intelligence Consumption Liveness Contract (THR-113)
 *
 * Verifies the grant → consume loop is actually live end-to-end:
 *   plant record → call the consumption hooks → intelligence_referenced trace fires.
 *
 * Three separate consumption surfaces each exercise a distinct path:
 *   1. scoring_boost — scoreAndSelect() on a matching candidate
 *   2. prose_enrichment — enrichProse() on a template with {intel:*} placeholder
 *   3. resolution_match — observeResolutionIntelligence() on a resolved action
 *
 * A single contract test file keeps the three hooks co-located, so adding a
 * fourth future consumption surface (e.g. difficulty-bonus) has an obvious
 * home.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../../graph';
import { scoreAndSelect } from '../../encounterScoring';
import { enrichProse } from '../../proseEnrichment';
import type { NarrativeContext } from '../../proseEnrichment';
import { observeResolutionIntelligence } from '../../intelligence';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../../traceBuffer';
import type { GameState } from '../../../types/gameState';
import type { EncounterCacheEntry } from '../../encounterCache';
import type { IntelligenceRecord, UnifiedAction } from '../../../types/unifiedAction';
import type { ReachDomain } from '../../../types/traits';

// ─── Fixtures ────────────────────────────────────────────────────

const AGENT_ID = 'agent.seeker';
const LOC_ID = 'loc.pale-shrine';

function makeGraph(): WorldGraph {
  const g = new WorldGraph();
  g.addNode({
    id: LOC_ID,
    type: 'location',
    name: 'Pale Court Shrine',
    properties: { locationType: 'settlement', hexCol: 0, hexRow: 0 },
  });
  g.addNode({
    id: AGENT_ID,
    type: 'actor',
    name: 'Seeker',
    properties: { actorType: 'individual', locationId: LOC_ID },
  });
  return g;
}

function makeRecord(): IntelligenceRecord {
  return {
    recordId: 'liveness-intel-001',
    agentId: AGENT_ID,
    category: 'shrine_location',
    label: 'The Pale Court shrine',
    detail: 'Map fragment with route notes.',
    targetEntityId: LOC_ID,
    targetRegion: 'vessen_uplands',
    sourceEncounterId: 'encounter.quest',
    acquiredTick: 10,
    reliability: 0.85,
  };
}

beforeEach(() => {
  clearTraces();
  enableTracing();
});

afterEach(() => {
  disableTracing();
  clearTraces();
});

// ─── scoring_boost liveness ──────────────────────────────────────

describe('Intelligence consumption liveness — scoring_boost', () => {
  it('plants a record, scores a matching candidate, and emits a scoring_boost trace', () => {
    const graph = makeGraph();
    const record = makeRecord();

    const candidate: EncounterCacheEntry = {
      templateId: 'pilgrim.shrine.visit',
      locationId: LOC_ID,
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
      totalTickCost: 3,
      successRewardEstimate: 2.0,
      stepCount: 1,
      stepDifficulties: [50],
      stepReaches: ['iron'] as ReachDomain[],
    };

    const result = scoreAndSelect(
      [candidate],
      AGENT_ID,
      LOC_ID,
      graph,
      50,
      undefined, undefined, undefined, undefined, undefined,
      [record],
    );

    const scoringTrace = getTraces().find(
      t => t.category === 'intelligence_referenced' && (t as any).referencedBy === 'scoring_boost',
    );
    expect(scoringTrace, 'scoring_boost trace was not emitted').toBeDefined();
    expect((scoringTrace as any).recordId).toBe(record.recordId);
    expect(result.rankedCandidates[0].intelBonus).toBeGreaterThan(0);
  });
});

// ─── prose_enrichment liveness ───────────────────────────────────

describe('Intelligence consumption liveness — prose_enrichment', () => {
  it('plants a record, enriches prose with {intel:*}, and emits a prose_enrichment trace', () => {
    const record = makeRecord();
    const ctx: NarrativeContext = {
      agentName: 'Seeker',
      agentId: AGENT_ID,
      archetypeId: '',
      cultureName: 'unknown',
      primaryReach: 'iron' as ReachDomain,
      titles: [],
      notableArtifacts: [],
      strongAllies: [],
      rivals: [],
      currentLocationName: 'Pale Court Shrine',
      completedPhases: [],
      beatHistory: [],
      pronouns: { they: 'they', them: 'them', their: 'their', s: '' },
      intelligence: {
        byCategory: { shrine_location: record },
        flags: { shrine_location: true },
        all: [record],
      },
      tick: 50,
    };

    const result = enrichProse('I remember {intel:shrine_location}.', ctx);

    expect(result).toBe('I remember The Pale Court shrine.');
    const proseTrace = getTraces().find(
      t => t.category === 'intelligence_referenced' && (t as any).referencedBy === 'prose_enrichment',
    );
    expect(proseTrace, 'prose_enrichment trace was not emitted').toBeDefined();
    expect((proseTrace as any).recordId).toBe(record.recordId);
  });
});

// ─── resolution_match liveness ───────────────────────────────────

describe('Intelligence consumption liveness — resolution_match', () => {
  it('plants a record, resolves an action matching it, and emits a resolution_match trace', () => {
    const record = makeRecord();
    const state = {
      intelligenceRecords: [record],
    } as unknown as GameState;

    const action: UnifiedAction = {
      actionId: 'action-1',
      actorId: AGENT_ID,
      templateId: 'pilgrim.shrine.visit',
      targetId: LOC_ID,
      scale: 'local',
      source: 'agent',
      startTick: 40,
      currentStep: 0,
      stepProgress: 1,
      stepDuration: 1,
      resolved: true,
      outcome: 'success',
      stepOutcomes: ['success'],
    };

    observeResolutionIntelligence(state, action, undefined, 50);

    const resolutionTrace = getTraces().find(
      t => t.category === 'intelligence_referenced' && (t as any).referencedBy === 'resolution_match',
    );
    expect(resolutionTrace, 'resolution_match trace was not emitted').toBeDefined();
    expect((resolutionTrace as any).recordId).toBe(record.recordId);
    expect((resolutionTrace as any).agentId).toBe(AGENT_ID);
  });

  it('does not emit when action has no actorId', () => {
    const record = makeRecord();
    const state = {
      intelligenceRecords: [record],
    } as unknown as GameState;

    const action = { templateId: 'pilgrim.shrine.visit', targetId: LOC_ID } as unknown as UnifiedAction;
    observeResolutionIntelligence(state, action, undefined, 50);

    const traces = getTraces().filter(t => t.category === 'intelligence_referenced');
    expect(traces).toHaveLength(0);
  });
});
