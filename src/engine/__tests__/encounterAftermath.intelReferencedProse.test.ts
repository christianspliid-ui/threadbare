/**
 * THR-139 — Unit tests for the `intel_referenced_prose` dispatcher case
 * in `applyEncounterAftermathReaction` (src/engine/encounterAftermath.ts).
 *
 * Covers: success path, no-matching-record skip, dubious-suppression skip,
 * empty-prose skip, trace shape with referencedBy: 'aftermath_prose'.
 *
 * Companion plan: Docs/plans/2026-05-08-thr-139-intel-referenced-prose-reaction.md §Tests
 */

import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { applyEncounterAftermathReaction } from '../encounterAftermath';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import { createSimulationRuntime, type SimulationRuntime } from '../simulationRuntime';
import type { GameState } from '../../types/gameState';
import type {
  EncounterAftermathReaction,
  IntelligenceRecord,
  UnifiedAction,
} from '../../types/unifiedAction';

function makeState(records: IntelligenceRecord[]): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'actor-1',
    type: 'actor',
    name: 'Aelin',
    properties: { actorType: 'individual', locationId: 'loc-grove' },
  });
  graph.addNode({
    id: 'loc-grove',
    type: 'location',
    name: 'Amber Grove',
    properties: { locationType: 'wilderness', region: 'reach.northern' },
  });
  return {
    tick: 50,
    seed: 42,
    cycle: 1,
    phase: 'playing',
    graph,
    intelligenceRecords: records,
    tickEvents: [],
    recentEvents: [],
  } as unknown as GameState;
}

function makeAction(): UnifiedAction {
  return {
    actionId: 'ua_test',
    actorId: 'actor-1',
    templateId: 'enc.cultural.amber_grove',
    targetId: 'loc-grove',
    scale: 'personal',
    source: 'agent',
    startTick: 1,
    currentStep: 0,
    stepProgress: 1,
    stepDuration: 1,
    resolved: true,
    outcome: 'success',
    stepOutcomes: [],
  } as UnifiedAction;
}

const INTEL_RELIABLE: IntelligenceRecord = {
  recordId: 'intel_reliable_1',
  agentId: 'actor-1',
  category: 'cultural_knowledge',
  label: 'Amber-sap grove',
  detail: 'Slow amber sap.',
  targetEntityId: 'loc-grove',
  sourceEncounterId: 'encounter.discovery',
  acquiredTick: 10,
  reliability: 0.85,
};

const INTEL_DUBIOUS: IntelligenceRecord = {
  ...INTEL_RELIABLE,
  recordId: 'intel_dubious_1',
  reliability: 0.2,
};

function makeReaction(overrides: Partial<EncounterAftermathReaction> = {}): EncounterAftermathReaction {
  return {
    id: 'react_test',
    label: 'Test reaction',
    closeAfterSelection: true,
    effects: [],
    ...overrides,
  } as EncounterAftermathReaction;
}

describe('applyEncounterAftermathReaction — intel_referenced_prose (THR-139)', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('appends a chronicle TickEvent when an actionable record matches and band is reliable', () => {
    const state = makeState([INTEL_RELIABLE]);
    const reaction = makeReaction({
      effects: [{
        kind: 'intel_referenced_prose',
        category: 'cultural_knowledge',
        prose: { reliable: 'reliable prose', uncertain: 'uncertain prose', dubious: 'dubious prose' },
      }],
    });

    const result = applyEncounterAftermathReaction(state, makeAction(), reaction, 50, runtime);

    expect(result.state.tickEvents.length).toBe(1);
    expect(result.state.tickEvents[0].message).toBe('reliable prose');
    expect(result.state.tickEvents[0].type).toBe('narrative');
    expect(result.state.tickEvents[0].actorId).toBe('actor-1');
    expect(result.state.recentEvents.length).toBe(1);
  });

  it('skips silently with failReason no_matching_record when no matching record exists', () => {
    const state = makeState([]); // no records
    const reaction = makeReaction({
      effects: [{
        kind: 'intel_referenced_prose',
        category: 'cultural_knowledge',
        prose: { reliable: 'reliable prose' },
      }],
    });

    const result = applyEncounterAftermathReaction(state, makeAction(), reaction, 50, runtime);

    expect(result.state.tickEvents.length).toBe(0);
    expect(result.state.recentEvents.length).toBe(0);
    const skip = getTraces().find(t =>
      t.category === 'encounter_aftermath_effect'
      && (t as { effectKind?: string }).effectKind === 'intel_referenced_prose',
    );
    expect(skip).toBeDefined();
    expect((skip as { success?: boolean }).success).toBe(false);
    expect((skip as { failReason?: string }).failReason).toBe('no_matching_record');
  });

  it('emits intelligence_referenced trace with referencedBy aftermath_prose on success', () => {
    const state = makeState([INTEL_RELIABLE]);
    const reaction = makeReaction({
      effects: [{
        kind: 'intel_referenced_prose',
        category: 'cultural_knowledge',
        prose: { reliable: 'reliable prose' },
      }],
    });

    applyEncounterAftermathReaction(state, makeAction(), reaction, 50, runtime);

    const refTrace = getTraces().find(t => t.category === 'intelligence_referenced');
    expect(refTrace).toBeDefined();
    expect((refTrace as { referencedBy?: string }).referencedBy).toBe('aftermath_prose');
    expect((refTrace as { recordId?: string }).recordId).toBe('intel_reliable_1');
    expect((refTrace as { intelCategory?: string }).intelCategory).toBe('cultural_knowledge');
  });

  it('selects the dubious prose variant when matched record reliability is dubious', () => {
    const state = makeState([INTEL_DUBIOUS]);
    const reaction = makeReaction({
      effects: [{
        kind: 'intel_referenced_prose',
        category: 'cultural_knowledge',
        prose: { reliable: 'reliable line', uncertain: 'uncertain line', dubious: 'dubious line' },
      }],
    });

    const result = applyEncounterAftermathReaction(state, makeAction(), reaction, 50, runtime);

    expect(result.state.tickEvents.length).toBe(1);
    expect(result.state.tickEvents[0].message).toBe('dubious line');
  });

  it('inherits upward from dubious → uncertain → reliable when band variants missing', () => {
    const state = makeState([INTEL_DUBIOUS]);
    const reaction = makeReaction({
      effects: [{
        kind: 'intel_referenced_prose',
        category: 'cultural_knowledge',
        // only reliable supplied — dubious must inherit upward
        prose: { reliable: 'only reliable line' },
      }],
    });

    const result = applyEncounterAftermathReaction(state, makeAction(), reaction, 50, runtime);

    expect(result.state.tickEvents.length).toBe(1);
    expect(result.state.tickEvents[0].message).toBe('only reliable line');
  });

  it('skips with failReason skipped_empty_prose when reliable is empty string', () => {
    const state = makeState([INTEL_RELIABLE]);
    const reaction = makeReaction({
      effects: [{
        kind: 'intel_referenced_prose',
        category: 'cultural_knowledge',
        prose: { reliable: '' },
      }],
    });

    const result = applyEncounterAftermathReaction(state, makeAction(), reaction, 50, runtime);

    expect(result.state.tickEvents.length).toBe(0);
    const skip = getTraces().find(t =>
      t.category === 'encounter_aftermath_effect'
      && (t as { effectKind?: string }).effectKind === 'intel_referenced_prose'
      && (t as { failReason?: string }).failReason === 'skipped_empty_prose',
    );
    expect(skip).toBeDefined();
  });

  it('uses authored significance override when supplied', () => {
    const state = makeState([INTEL_RELIABLE]);
    const reaction = makeReaction({
      effects: [{
        kind: 'intel_referenced_prose',
        category: 'cultural_knowledge',
        prose: { reliable: 'reliable prose' },
        significance: 0.77,
      }],
    });

    const result = applyEncounterAftermathReaction(state, makeAction(), reaction, 50, runtime);

    expect(result.state.tickEvents.length).toBe(1);
    expect(result.state.tickEvents[0].significance).toBe(0.77);
  });
});
