import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { applyEncounterAftermathReaction } from '../encounterAftermath';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import { createSimulationRuntime, type SimulationRuntime } from '../simulationRuntime';
import type { ArchetypeDrift, GameState } from '../../types/gameState';
import type {
  EncounterAftermathReaction,
  EncounterAftermathReactionEffect,
  UnifiedAction,
} from '../../types/unifiedAction';

function buildState(drift: ArchetypeDrift[]): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'actor-1', type: 'actor', name: 'Eira', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'actor-2', type: 'actor', name: 'Kael', properties: { actorType: 'individual' } });
  return {
    tick: 40,
    seed: 42,
    cycle: 1,
    phase: 'playing',
    graph,
    cosmology: {} as never,
    tiles: [],
    clock: {} as never,
    ascendantId: 'asc-1',
    essencePool: {} as never,
    mandateDefinition: null,
    mandateState: null,
    rivalDefinitions: [],
    rivalStates: [],
    doomDefinition: {} as never,
    doomClock: {} as never,
    tickEvents: [],
    recentEvents: [],
    chronicleEntries: [],
    stealthExposure: 0,
    visibilityMap: {} as never,
    familiarityMap: {} as never,
    culturalInsightMap: new Map(),
    agentKnowledge: new Map(),
    encounterProgress: [],
    actionsInProgress: [],
    unifiedActions: [],
    worldSoul: {} as never,
    echoDefinitions: [],
    echoStates: [],
    chronicle: {} as never,
    encounterNotifications: [],
    clearanceGateStates: new Map(),
    archetypeDrift: drift,
  } as GameState;
}

function makeAction(actorId = 'actor-1'): UnifiedAction {
  return {
    actionId: 'ua_drift_test',
    actorId,
    templateId: 'encounter.test.drift',
    targetId: actorId,
    scale: 'personal',
    source: 'agent',
    startTick: 1,
    currentStep: 0,
    stepProgress: 1,
    stepDuration: 1,
    resolved: true,
    outcome: 'success',
    stepOutcomes: [],
  };
}

function makeReaction(effect: EncounterAftermathReactionEffect): EncounterAftermathReaction {
  return { id: 'rx-drift', label: 'Register Drift', effects: [effect] };
}

describe('encounter aftermath effect: archetype_drift_register', () => {
  let runtime: SimulationRuntime;

  beforeEach(() => {
    clearTraces();
    enableTracing();
    runtime = createSimulationRuntime();
  });

  afterEach(() => {
    clearTraces();
    disableTracing();
  });

  it('registers soft threshold as virtue and emits both traces', () => {
    const state = buildState([
      { agentId: 'actor-1', axisId: 'protector_conqueror', fromPosition: 0.2, toPosition: 0.32, lastUpdatedTick: 40 },
    ]);

    const result = applyEncounterAftermathReaction(
      state,
      makeAction('actor-1'),
      makeReaction({ kind: 'archetype_drift_register', axisId: 'protector_conqueror', threshold: 'soft' }),
      41,
      runtime,
    );

    expect(result.state.recentEvents).toHaveLength(1);
    expect(result.state.recentEvents[0]?.actorId).toBe('actor-1');
    expect(result.state.recentEvents[0]?.message).toContain('protector_conqueror');

    const traces = getTraces();
    const driftTrace = traces.find(trace => trace.category === 'drift_threshold_crossed') as Record<string, unknown> | undefined;
    expect(driftTrace?.agentId).toBe('actor-1');
    expect(driftTrace?.thresholdCrossed).toBe('soft');
    expect(driftTrace?.pole).toBe('virtue');

    const effectTrace = traces.find(
      trace =>
        trace.category === 'encounter_aftermath_effect'
        && (trace as { effectKind?: string }).effectKind === 'archetype_drift_register',
    ) as Record<string, unknown> | undefined;
    expect(effectTrace?.success).toBe(true);
  });

  it('registers banner threshold as flaw when drift is negative', () => {
    const state = buildState([
      { agentId: 'actor-1', axisId: 'protector_conqueror', fromPosition: -0.55, toPosition: -0.65, lastUpdatedTick: 40 },
    ]);

    applyEncounterAftermathReaction(
      state,
      makeAction('actor-1'),
      makeReaction({ kind: 'archetype_drift_register', axisId: 'protector_conqueror', threshold: 'banner' }),
      41,
      runtime,
    );

    const traces = getTraces();
    const driftTrace = traces.find(trace => trace.category === 'drift_threshold_crossed') as Record<string, unknown> | undefined;
    expect(driftTrace?.thresholdCrossed).toBe('banner');
    expect(driftTrace?.pole).toBe('flaw');
  });

  it('registers becoming threshold as virtue for high positive drift', () => {
    const state = buildState([
      { agentId: 'actor-1', axisId: 'protector_conqueror', fromPosition: 0.78, toPosition: 0.9, lastUpdatedTick: 40 },
    ]);

    applyEncounterAftermathReaction(
      state,
      makeAction('actor-1'),
      makeReaction({ kind: 'archetype_drift_register', axisId: 'protector_conqueror', threshold: 'becoming' }),
      41,
      runtime,
    );

    const traces = getTraces();
    const driftTrace = traces.find(trace => trace.category === 'drift_threshold_crossed') as Record<string, unknown> | undefined;
    expect(driftTrace?.thresholdCrossed).toBe('becoming');
    expect(driftTrace?.pole).toBe('virtue');
  });

  it('fail-softs when threshold is not currently held', () => {
    const state = buildState([
      { agentId: 'actor-1', axisId: 'protector_conqueror', fromPosition: 0.12, toPosition: 0.2, lastUpdatedTick: 40 },
    ]);

    const result = applyEncounterAftermathReaction(
      state,
      makeAction('actor-1'),
      makeReaction({ kind: 'archetype_drift_register', axisId: 'protector_conqueror', threshold: 'soft' }),
      41,
      runtime,
    );

    expect(result.state.recentEvents).toHaveLength(0);
    const traces = getTraces();
    expect(traces.some(trace => trace.category === 'drift_threshold_crossed')).toBe(false);
    const effectTrace = traces.find(
      trace =>
        trace.category === 'encounter_aftermath_effect'
        && (trace as { effectKind?: string }).effectKind === 'archetype_drift_register',
    ) as Record<string, unknown> | undefined;
    expect(effectTrace?.success).toBe(false);
    expect(effectTrace?.failReason).toBe('threshold_not_held');
  });

  it('fail-softs when no drift entry exists for the requested axis', () => {
    const state = buildState([
      { agentId: 'actor-1', axisId: 'mercy_wrath', fromPosition: 0.1, toPosition: 0.4, lastUpdatedTick: 40 },
    ]);

    const result = applyEncounterAftermathReaction(
      state,
      makeAction('actor-1'),
      makeReaction({ kind: 'archetype_drift_register', axisId: 'protector_conqueror', threshold: 'soft' }),
      41,
      runtime,
    );

    expect(result.state.recentEvents).toHaveLength(0);
    const traces = getTraces();
    expect(traces.some(trace => trace.category === 'drift_threshold_crossed')).toBe(false);
    const effectTrace = traces.find(
      trace =>
        trace.category === 'encounter_aftermath_effect'
        && (trace as { effectKind?: string }).effectKind === 'archetype_drift_register',
    ) as Record<string, unknown> | undefined;
    expect(effectTrace?.success).toBe(false);
    expect(effectTrace?.failReason).toBe('drift_entry_missing');
  });

  it('applies to targetAgentId override instead of action actor', () => {
    const state = buildState([
      { agentId: 'actor-2', axisId: 'protector_conqueror', fromPosition: 0.4, toPosition: 0.7, lastUpdatedTick: 40 },
    ]);

    const result = applyEncounterAftermathReaction(
      state,
      makeAction('actor-1'),
      makeReaction({
        kind: 'archetype_drift_register',
        axisId: 'protector_conqueror',
        threshold: 'banner',
        targetAgentId: 'actor-2',
      }),
      41,
      runtime,
    );

    expect(result.state.recentEvents).toHaveLength(1);
    expect(result.state.recentEvents[0]?.actorId).toBe('actor-2');
    expect(result.state.recentEvents[0]?.actorId).not.toBe('actor-1');

    const traces = getTraces();
    const driftTrace = traces.find(trace => trace.category === 'drift_threshold_crossed') as Record<string, unknown> | undefined;
    expect(driftTrace?.agentId).toBe('actor-2');
  });

  it('participates in when-predicate gating and skips when false', () => {
    const state = buildState([
      { agentId: 'actor-1', axisId: 'protector_conqueror', fromPosition: 0.4, toPosition: 0.7, lastUpdatedTick: 40 },
    ]);

    const result = applyEncounterAftermathReaction(
      state,
      makeAction('actor-1'),
      makeReaction({
        kind: 'archetype_drift_register',
        axisId: 'protector_conqueror',
        threshold: 'banner',
        when: 'in_combat',
      }),
      41,
      runtime,
    );

    expect(result.state.recentEvents).toHaveLength(0);
    const traces = getTraces();
    expect(
      traces.some(
        trace =>
          trace.category === 'aftermath_effect_skipped_by_when'
          && (trace as { effectKind?: string }).effectKind === 'archetype_drift_register',
      ),
    ).toBe(true);
    expect(
      traces.some(
        trace =>
          trace.category === 'encounter_aftermath_effect'
          && (trace as { effectKind?: string }).effectKind === 'archetype_drift_register',
      ),
    ).toBe(false);
    expect(traces.some(trace => trace.category === 'drift_threshold_crossed')).toBe(false);
  });
});

