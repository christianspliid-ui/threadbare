import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { applyEncounterAftermathReaction } from '../encounterAftermath';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import { createSimulationRuntime, type SimulationRuntime } from '../simulationRuntime';
import { FORMATIVE_MARK_MAX_MAGNITUDE } from '../../data/agent-behavior-constants';
import type { AxiologicalProfile } from '../../types/agent';
import type { GameState } from '../../types/gameState';
import type {
  EncounterAftermathReaction,
  EncounterAftermathReactionEffect,
  UnifiedAction,
} from '../../types/unifiedAction';

/**
 * THR-529 — Formative-mark primitive. The `axiological_mark_apply` aftermath effect moves an
 * agent's *baseline* moral position on one reach's axis (the standing `AxiologicalProfile` value),
 * clamped to ±FORMATIVE_MARK_MAX_MAGNITUDE per mark and to [−1, +1] overall.
 *
 * Iron's axis ValuePair is `mercy_ruthlessness` (virtue/Protector +, vice/Conqueror −).
 */
const IRON_VALUE_PAIR = 'mercy_ruthlessness';

function buildState(profile?: Partial<AxiologicalProfile>): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'actor-1',
    type: 'actor',
    name: 'Eira',
    properties: {
      actorType: 'individual',
      ...(profile ? { axiologicalProfile: profile } : {}),
    },
  });
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
    archetypeDrift: [],
  } as GameState;
}

function makeAction(actorId = 'actor-1'): UnifiedAction {
  return {
    actionId: 'ua_mark_test',
    actorId,
    templateId: 'encounter.test.mark',
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
  } as UnifiedAction;
}

function makeReaction(effect: EncounterAftermathReactionEffect): EncounterAftermathReaction {
  return { id: 'rx-mark', label: 'Apply Mark', effects: [effect] };
}

function profileOf(state: GameState, agentId: string): AxiologicalProfile | undefined {
  return state.graph.getNode(agentId)?.properties.axiologicalProfile as AxiologicalProfile | undefined;
}

describe('encounter aftermath effect: axiological_mark_apply (THR-529)', () => {
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

  it('shifts the baseline toward virtue, emits a chronicle beat and a trace', () => {
    const state = buildState({ [IRON_VALUE_PAIR]: 0.2 });

    const result = applyEncounterAftermathReaction(
      state,
      makeAction('actor-1'),
      makeReaction({ kind: 'axiological_mark_apply', reach: 'iron', signedMagnitude: 0.15 }),
      41,
      runtime,
    );

    // Baseline moved from 0.2 → 0.35 (in place).
    expect(profileOf(result.state, 'actor-1')?.[IRON_VALUE_PAIR]).toBeCloseTo(0.35, 10);
    expect(result.mutationSummary.touchedWorld).toBe(true);

    // "Becoming" chronicle beat.
    expect(result.state.recentEvents).toHaveLength(1);
    expect(result.state.recentEvents[0]?.actorId).toBe('actor-1');

    const markTrace = getTraces().find(t => t.category === 'axiological_mark_applied') as Record<string, unknown> | undefined;
    expect(markTrace?.agentId).toBe('actor-1');
    expect(markTrace?.valuePair).toBe(IRON_VALUE_PAIR);
    expect(markTrace?.previousBaseline).toBeCloseTo(0.2, 10);
    expect(markTrace?.newBaseline).toBeCloseTo(0.35, 10);
  });

  it('shifts the baseline toward vice on a negative magnitude', () => {
    const state = buildState({ [IRON_VALUE_PAIR]: 0.1 });

    const result = applyEncounterAftermathReaction(
      state,
      makeAction('actor-1'),
      makeReaction({ kind: 'axiological_mark_apply', reach: 'iron', signedMagnitude: -0.15 }),
      41,
      runtime,
    );

    expect(profileOf(result.state, 'actor-1')?.[IRON_VALUE_PAIR]).toBeCloseTo(-0.05, 10);
  });

  it('clamps the applied magnitude to ±FORMATIVE_MARK_MAX_MAGNITUDE', () => {
    const state = buildState({ [IRON_VALUE_PAIR]: 0 });

    const result = applyEncounterAftermathReaction(
      state,
      makeAction('actor-1'),
      // Author over-reaches with 0.5; the cap holds the actual shift to the constant.
      makeReaction({ kind: 'axiological_mark_apply', reach: 'iron', signedMagnitude: 0.5 }),
      41,
      runtime,
    );

    expect(profileOf(result.state, 'actor-1')?.[IRON_VALUE_PAIR]).toBeCloseTo(FORMATIVE_MARK_MAX_MAGNITUDE, 10);
    const markTrace = getTraces().find(t => t.category === 'axiological_mark_applied') as Record<string, unknown> | undefined;
    expect(markTrace?.signedMagnitude).toBeCloseTo(FORMATIVE_MARK_MAX_MAGNITUDE, 10);
  });

  it('clamps the resulting baseline to [−1, +1]', () => {
    const state = buildState({ [IRON_VALUE_PAIR]: 0.95 });

    const result = applyEncounterAftermathReaction(
      state,
      makeAction('actor-1'),
      makeReaction({ kind: 'axiological_mark_apply', reach: 'iron', signedMagnitude: 0.15 }),
      41,
      runtime,
    );

    // 0.95 + 0.15 = 1.10 → clamped to 1.0.
    expect(profileOf(result.state, 'actor-1')?.[IRON_VALUE_PAIR]).toBeCloseTo(1.0, 10);
  });

  it('initializes a profile for a born-neutral agent (fail-soft)', () => {
    const state = buildState(); // no axiologicalProfile

    const result = applyEncounterAftermathReaction(
      state,
      makeAction('actor-1'),
      makeReaction({ kind: 'axiological_mark_apply', reach: 'iron', signedMagnitude: 0.1 }),
      41,
      runtime,
    );

    expect(profileOf(result.state, 'actor-1')?.[IRON_VALUE_PAIR]).toBeCloseTo(0.1, 10);
  });

  it('routes the mark to an explicit targetAgentId', () => {
    const state = buildState({ [IRON_VALUE_PAIR]: 0.2 });

    const result = applyEncounterAftermathReaction(
      state,
      makeAction('actor-1'),
      makeReaction({ kind: 'axiological_mark_apply', reach: 'iron', signedMagnitude: 0.15, targetAgentId: 'actor-2' }),
      41,
      runtime,
    );

    // actor-1 untouched; actor-2 (born neutral) initialized to +0.15.
    expect(profileOf(result.state, 'actor-1')?.[IRON_VALUE_PAIR]).toBeCloseTo(0.2, 10);
    expect(profileOf(result.state, 'actor-2')?.[IRON_VALUE_PAIR]).toBeCloseTo(0.15, 10);
  });

  it('skips fail-soft when the target node is missing', () => {
    const state = buildState({ [IRON_VALUE_PAIR]: 0.2 });

    const result = applyEncounterAftermathReaction(
      state,
      makeAction('actor-1'),
      makeReaction({ kind: 'axiological_mark_apply', reach: 'iron', signedMagnitude: 0.15, targetAgentId: 'ghost' }),
      41,
      runtime,
    );

    expect(result.state.recentEvents).toHaveLength(0);
    const effectTrace = getTraces().find(
      t => t.category === 'encounter_aftermath_effect'
        && (t as { effectKind?: string }).effectKind === 'axiological_mark_apply',
    ) as Record<string, unknown> | undefined;
    expect(effectTrace?.success).toBe(false);
    expect(effectTrace?.failReason).toBe('target_node_missing');
  });
});
