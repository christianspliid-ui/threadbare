import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { applyEncounterAftermathReaction } from '../encounterAftermath';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import { createSimulationRuntime, type SimulationRuntime } from '../simulationRuntime';
import type { GameState } from '../../types/gameState';
import type { ClearanceGateRuntimeState } from '../../types/contentShells';
import type { EncounterAftermathReaction, UnifiedAction, HiddenMark } from '../../types/unifiedAction';
import { buildPredicateContext, evaluatePredicate } from '../effects/effectPredicates';
import { THREAD_STRENGTH_MAX, THREAD_STRENGTH_MIN } from '../../data/effect-constants';

function createMinimalGameState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'actor-1',
    type: 'actor',
    name: 'Ashara',
    properties: { actorType: 'individual' },
  });

  return {
    tick: 20,
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
    clearanceGateStates: new Map<string, ClearanceGateRuntimeState>([
      ['gate-1', {
        runtimeId: 'gate-1',
        templateId: 'cg.quest.gate_duty',
        gateId: 'checkpoint_clearance',
        anchorLocationId: 'loc.town',
        subjectNodeId: 'npc.courier',
        authorityNodeId: 'npc.captain',
        witnessNodeIds: ['npc.witness'],
        locationNodeId: 'loc.gatehouse',
        persistence: 'must-persist',
        state: 'cleared',
        revealedSignalKeys: ['witness_pressure'],
        followOnTags: ['#watch_trusted'],
        attempts: 2,
        lastUpdatedTick: 20,
        history: [],
      }],
    ]),
  } as GameState;
}

describe('applyEncounterAftermathReaction — trace emission (THR-111)', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('emits encounter_aftermath_applied once per reaction application', () => {
    const state = createMinimalGameState();
    const action: UnifiedAction = {
      actionId: 'ua_test', actorId: 'actor-1', templateId: 'enc.test.template',
      targetId: 'actor-1', scale: 'personal', source: 'agent',
      startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
      resolved: true, outcome: 'success', stepOutcomes: [],
    };
    const reaction: EncounterAftermathReaction = {
      id: 'react_1',
      label: 'Test reaction',
      effects: [{ kind: 'reputation_score', delta: 0.05 }],
      closeAfterSelection: true,
    };
    applyEncounterAftermathReaction(state, action, reaction, 5, runtime);
    const traces = getTraces();
    const applied = traces.filter(t => t.category === 'encounter_aftermath_applied');
    expect(applied).toHaveLength(1);
    expect(applied[0].category).toBe('encounter_aftermath_applied');
    if (applied[0].category === 'encounter_aftermath_applied') {
      expect(applied[0].encounterId).toBe('enc.test.template');
      expect(applied[0].reactionId).toBe('react_1');
      expect(applied[0].effectKinds).toEqual(['reputation_score']);
    }
  });

  it('emits encounter_aftermath_effect for each effect in the reaction', () => {
    const state = createMinimalGameState();
    const action: UnifiedAction = {
      actionId: 'ua_test', actorId: 'actor-1', templateId: 'enc.test',
      targetId: 'actor-1', scale: 'personal', source: 'agent',
      startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
      resolved: true, outcome: 'success', stepOutcomes: [],
    };
    const reaction: EncounterAftermathReaction = {
      id: 'react_multi',
      label: 'Multi-effect',
      effects: [
        { kind: 'reputation_score', delta: 0.02 },
        { kind: 'reputation_tally', key: 'heart.positive', delta: 1 },
        {
          kind: 'recent_event',
          eventType: 'ripple_consequence',
          message: 'A narrative ripple.',
          significance: 0.5,
        },
      ],
      closeAfterSelection: false,
    };
    applyEncounterAftermathReaction(state, action, reaction, 5, runtime);
    const effectTraces = getTraces().filter(t => t.category === 'encounter_aftermath_effect');
    expect(effectTraces).toHaveLength(3);
    const kinds = effectTraces.map(t => {
      if (t.category === 'encounter_aftermath_effect') return t.effectKind;
      return null;
    });
    expect(kinds).toEqual(['reputation_score', 'reputation_tally', 'recent_event']);
    // All should be success
    effectTraces.forEach(t => {
      if (t.category === 'encounter_aftermath_effect') expect(t.success).toBe(true);
    });
  });

  it('emits encounter_aftermath_effect with success=false when actor node missing', () => {
    const state = createMinimalGameState();
    const action: UnifiedAction = {
      actionId: 'ua_test', actorId: 'actor-NONEXISTENT', templateId: 'enc.test',
      targetId: 'actor-1', scale: 'personal', source: 'agent',
      startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
      resolved: true, outcome: 'success', stepOutcomes: [],
    };
    const reaction: EncounterAftermathReaction = {
      id: 'react_fail',
      label: 'Fail reaction',
      effects: [{ kind: 'reputation_score', delta: 0.1 }],
      closeAfterSelection: true,
    };
    applyEncounterAftermathReaction(state, action, reaction, 5, runtime);
    const effectTraces = getTraces().filter(t => t.category === 'encounter_aftermath_effect');
    expect(effectTraces).toHaveLength(1);
    if (effectTraces[0].category === 'encounter_aftermath_effect') {
      expect(effectTraces[0].success).toBe(false);
      expect(effectTraces[0].failReason).toBe('target_node_missing');
    }
  });

  it('emits encounter_seed_planted + encounter_aftermath_effect for encounter_seed effects', () => {
    const state = createMinimalGameState();
    const action: UnifiedAction = {
      actionId: 'ua_seed', actorId: 'actor-1', templateId: 'enc.source',
      targetId: 'actor-1', scale: 'personal', source: 'agent',
      startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
      resolved: true, outcome: 'success', stepOutcomes: [],
    };
    const reaction: EncounterAftermathReaction = {
      id: 'react_seed',
      label: 'Plant a seed',
      effects: [{
        kind: 'encounter_seed',
        encounterFamily: 'thieves_guild',
        seedLabel: 'The mark knows your face',
        delayTicks: 10,
        priority: 1.5,
      }],
      closeAfterSelection: true,
    };
    applyEncounterAftermathReaction(state, action, reaction, 5, runtime);
    const traces = getTraces();
    const effectTrace = traces.filter(t => t.category === 'encounter_aftermath_effect');
    const plantedTrace = traces.filter(t => t.category === 'encounter_seed_planted');
    expect(effectTrace).toHaveLength(1);
    expect(plantedTrace).toHaveLength(1);
    if (plantedTrace[0].category === 'encounter_seed_planted') {
      expect(plantedTrace[0].encounterFamily).toBe('thieves_guild');
      expect(plantedTrace[0].seedLabel).toBe('The mark knows your face');
      expect(plantedTrace[0].eligibleAfterTick).toBe(15);
    }
  });

  it('emits hidden_mark_placed + encounter_aftermath_effect for hidden_mark effects', () => {
    const state = createMinimalGameState();
    const action: UnifiedAction = {
      actionId: 'ua_mark', actorId: 'actor-1', templateId: 'enc.marking',
      targetId: 'actor-1', scale: 'personal', source: 'agent',
      startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
      resolved: true, outcome: 'success', stepOutcomes: [],
    };
    const reaction: EncounterAftermathReaction = {
      id: 'react_mark',
      label: 'Leave a mark',
      effects: [{
        kind: 'hidden_mark',
        category: 'suspicion',
        severity: 0.7,
        label: 'Seen at the scene',
        revealFamilies: ['investigation', 'thieves_guild'],
      }],
      closeAfterSelection: true,
    };
    applyEncounterAftermathReaction(state, action, reaction, 5, runtime);
    const traces = getTraces();
    const effectTrace = traces.filter(t => t.category === 'encounter_aftermath_effect');
    const markTrace = traces.filter(t => t.category === 'hidden_mark_placed');
    expect(effectTrace).toHaveLength(1);
    expect(markTrace).toHaveLength(1);
    if (markTrace[0].category === 'hidden_mark_placed') {
      expect(markTrace[0].markCategory).toBe('suspicion');
      expect(markTrace[0].severity).toBe(0.7);
      expect(markTrace[0].revealFamilies).toContain('investigation');
    }
  });

  it('emits intelligence_granted + encounter_aftermath_effect for intelligence effects', () => {
    const state = createMinimalGameState();
    const action: UnifiedAction = {
      actionId: 'ua_intel', actorId: 'actor-1', templateId: 'enc.scouting',
      targetId: 'actor-1', scale: 'personal', source: 'agent',
      startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
      resolved: true, outcome: 'success', stepOutcomes: [],
    };
    const reaction: EncounterAftermathReaction = {
      id: 'react_intel',
      label: 'File the report',
      effects: [{
        kind: 'intelligence',
        category: 'patrol_routes',
        label: 'North gate rotation schedule',
        detail: 'Guards rotate every 4 ticks',
        reliability: 0.9,
        targetRegion: 'city_north',
      }],
      closeAfterSelection: true,
    };
    applyEncounterAftermathReaction(state, action, reaction, 5, runtime);
    const traces = getTraces();
    const effectTrace = traces.filter(t => t.category === 'encounter_aftermath_effect');
    const intelTrace = traces.filter(t => t.category === 'intelligence_granted');
    expect(effectTrace).toHaveLength(1);
    expect(intelTrace).toHaveLength(1);
    if (intelTrace[0].category === 'intelligence_granted') {
      expect(intelTrace[0].intelCategory).toBe('patrol_routes');
      expect(intelTrace[0].reliability).toBe(0.9);
      expect(intelTrace[0].targetRegion).toBe('city_north');
    }
  });

  it('contract: multi-effect reaction produces correct trace counts (1 applied + N effect + sub-traces)', () => {
    const state = createMinimalGameState();
    const action: UnifiedAction = {
      actionId: 'ua_contract', actorId: 'actor-1', templateId: 'enc.contract_test',
      targetId: 'actor-1', scale: 'personal', source: 'agent',
      startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
      resolved: true, outcome: 'success', stepOutcomes: [],
    };
    const reaction: EncounterAftermathReaction = {
      id: 'react_contract',
      label: 'Contract test',
      effects: [
        {
          kind: 'recent_event',
          eventType: 'ripple_consequence',
          message: 'Something happened.',
          significance: 0.5,
        },
        {
          kind: 'hidden_mark',
          category: 'suspicion',
          severity: 0.3,
          label: 'Noticed',
          revealFamilies: ['investigation'],
        },
        {
          kind: 'encounter_seed',
          encounterFamily: 'city_watch',
          seedLabel: 'The watch has questions',
          delayTicks: 5,
          priority: 1.0,
        },
        {
          kind: 'intelligence',
          category: 'faction_activity',
          label: 'Guild meets at the mill',
          detail: 'Weekly gathering point identified.',
          reliability: 0.75,
        },
      ],
      closeAfterSelection: true,
    };
    applyEncounterAftermathReaction(state, action, reaction, 10, runtime);
    const traces = getTraces();
    // 1 applied + 4 per-effect + 1 mark_placed + 1 seed_planted + 1 intel_granted
    expect(traces.filter(t => t.category === 'encounter_aftermath_applied')).toHaveLength(1);
    expect(traces.filter(t => t.category === 'encounter_aftermath_effect')).toHaveLength(4);
    expect(traces.filter(t => t.category === 'hidden_mark_placed')).toHaveLength(1);
    expect(traces.filter(t => t.category === 'encounter_seed_planted')).toHaveLength(1);
    expect(traces.filter(t => t.category === 'intelligence_granted')).toHaveLength(1);
  });
});

describe('applyEncounterAftermathReaction', () => {
  it('applies general aftermath effects back into the world model', () => {
    const runtime = createSimulationRuntime();
    const state = createMinimalGameState();
    const action: UnifiedAction = {
      actionId: 'ua_gate_duty',
      actorId: 'actor-1',
      templateId: 'cg.quest.gate_duty',
      targetId: 'loc-1',
      scale: 'personal',
      source: 'agent',
      startTick: 10,
      currentStep: 2,
      stepProgress: 1,
      stepDuration: 1,
      resolved: true,
      outcome: 'success',
      stepOutcomes: ['success', 'success', 'success'],
      clearanceGateIds: ['gate-1'],
    };
    const reaction: EncounterAftermathReaction = {
      id: 'follow_witness_story',
      label: "Follow the witness's telling",
      effects: [
        { kind: 'reputation_score', delta: 0.03 },
        { kind: 'reputation_tally', key: 'heart.positive', delta: 1 },
        { kind: 'clearance_gate_tag', tag: '#witness_story_followed' },
        {
          kind: 'recent_event',
          eventType: 'ripple_consequence',
          message: 'You keep a finger on the witness\u2019s telling as it leaves the gate.',
          significance: 0.61,
        },
      ],
      closeAfterSelection: true,
    };

    const { state: updated } = applyEncounterAftermathReaction(state, action, reaction, 20, runtime);
    const actor = updated.graph.getNode('actor-1');
    expect((actor?.properties?.reputationScore as number | undefined) ?? 0).toBeGreaterThan(0);
    expect((actor?.properties?.reputationTallies as Record<string, number>)['heart.positive']).toBe(1);
    expect(updated.clearanceGateStates?.get('gate-1')?.followOnTags).toContain('#witness_story_followed');
    expect(updated.recentEvents.at(-1)?.message).toContain('witness');
    expect(updated.tickEvents.at(-1)?.type).toBe('ripple_consequence');
  });

  it('routes archetype_drift_register effects through the dedicated handler', () => {
    clearTraces();
    enableTracing();
    const runtime = createSimulationRuntime();
    const state = createMinimalGameState();
    state.archetypeDrift = [
      {
        agentId: 'actor-1',
        axisId: 'iron',
        fromPosition: 0.25,
        toPosition: 0.34,
        lastUpdatedTick: 19,
      },
    ];
    const action: UnifiedAction = {
      actionId: 'ua_drift_reg',
      actorId: 'actor-1',
      templateId: 'enc.test',
      targetId: 'actor-1',
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
    const reaction: EncounterAftermathReaction = {
      id: 'react_drift_reg',
      label: 'Register drift',
      effects: [{ kind: 'archetype_drift_register', axisId: 'iron', threshold: 'soft' }],
      closeAfterSelection: true,
    };

    const { state: updated } = applyEncounterAftermathReaction(state, action, reaction, 20, runtime);

    const effectTrace = getTraces().find((trace) =>
      trace.category === 'encounter_aftermath_effect'
      && (trace as { effectKind?: string }).effectKind === 'archetype_drift_register',
    ) as { success?: boolean } | undefined;
    expect(effectTrace).toBeDefined();
    expect(effectTrace?.success).toBe(true);
    expect(updated.recentEvents.some((event) => event.message.includes('Drift registered'))).toBe(true);
    disableTracing();
    clearTraces();
  });

  it('fails soft when an unknown effect kind appears and still processes known effects', () => {
    clearTraces();
    enableTracing();
    const runtime = createSimulationRuntime();
    const state = createMinimalGameState();
    const action: UnifiedAction = {
      actionId: 'ua_unknown_effect',
      actorId: 'actor-1',
      templateId: 'enc.test',
      targetId: 'actor-1',
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
    const reaction: EncounterAftermathReaction = {
      id: 'react_unknown_effect',
      label: 'Unknown effect',
      effects: [
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { kind: 'made_up_kind' as any },
        { kind: 'reputation_score', delta: 0.02 },
      ],
      closeAfterSelection: true,
    };

    expect(() => applyEncounterAftermathReaction(state, action, reaction, 20, runtime)).not.toThrow();
    const effectTraces = getTraces().filter((trace) => trace.category === 'encounter_aftermath_effect');
    expect(effectTraces.length).toBeGreaterThanOrEqual(1);
    disableTracing();
    clearTraces();
  });
});

// ─── THR-116 Contract Tests: when gate + thread mutations ──────────

function makeAction(overrides?: Partial<UnifiedAction>): UnifiedAction {
  return {
    actionId: 'ua_thr116', actorId: 'actor-1', templateId: 'enc.thr116.test',
    targetId: 'actor-1', scale: 'personal', source: 'agent',
    startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: true, outcome: 'success', stepOutcomes: [],
    ...overrides,
  };
}

describe('THR-116 contract: when gate (tests 3–4)', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('test 3: when:in_combat skips effect in non-combat context, unconditional effect fires', () => {
    const state = createMinimalGameState();
    const reaction: EncounterAftermathReaction = {
      id: 'rx_when_test',
      label: 'When test',
      effects: [
        { kind: 'reputation_score', delta: 0.1, when: 'in_combat' }, // should be skipped
        { kind: 'reputation_score', delta: 0.05 },                   // should fire
      ],
    };
    applyEncounterAftermathReaction(state, makeAction(), reaction, 5, runtime);

    const traces = getTraces();
    const skipped = traces.filter(t => t.category === 'aftermath_effect_skipped_by_when');
    expect(skipped).toHaveLength(1);
    if (skipped[0].category === 'aftermath_effect_skipped_by_when') {
      expect(skipped[0].predicate).toBe('in_combat');
    }
    // No when_passed trace for effect without `when`
    const passed = traces.filter(t => t.category === 'aftermath_effect_when_passed');
    expect(passed).toHaveLength(0);
  });

  it('test 4: unknown predicate fails soft — effect skipped, trace emitted, no throw', () => {
    const state = createMinimalGameState();
    const reaction: EncounterAftermathReaction = {
      id: 'rx_unknown_pred',
      label: 'Unknown predicate test',
      effects: [
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { kind: 'reputation_score', delta: 0.1, when: 'zzz_unknown:xyz' as any },
      ],
    };
    expect(() => applyEncounterAftermathReaction(state, makeAction(), reaction, 5, runtime)).not.toThrow();

    const traces = getTraces();
    const skipped = traces.filter(t => t.category === 'aftermath_effect_skipped_by_when');
    expect(skipped).toHaveLength(1);
  });
});

describe('THR-116 contract: thread mutations (tests 5–9)', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  function setupThreadGraph(state: ReturnType<typeof createMinimalGameState>, strength = 1.0) {
    state.graph.addNode({ id: 'asc-1', type: 'actor', name: 'Ascendant', properties: {} });
    state.graph.addEdge({
      id: 'thread_asc1_actor1',
      source: 'asc-1', target: 'actor-1',
      type: 'thread',
      properties: { strength },
    });
  }

  it('test 5: thread_strengthen clamps at THREAD_STRENGTH_MAX', () => {
    const state = createMinimalGameState();
    setupThreadGraph(state, 0.95);
    const reaction: EncounterAftermathReaction = {
      id: 'rx_strengthen',
      label: 'Strengthen',
      effects: [{ kind: 'thread_strengthen', ascendantId: 'asc-1', mortalId: 'actor-1', delta: 0.2 }],
    };
    applyEncounterAftermathReaction(state, makeAction(), reaction, 5, runtime);

    const edge = state.graph.getEdge('thread_asc1_actor1');
    expect(edge?.properties.strength).toBe(THREAD_STRENGTH_MAX);
    const mutTraces = getTraces().filter(t => t.category === 'thread_mutation_applied');
    expect(mutTraces).toHaveLength(1);
  });

  it('test 6: thread_weaken clamps at THREAD_STRENGTH_MIN', () => {
    const state = createMinimalGameState();
    setupThreadGraph(state, 0.05);
    const reaction: EncounterAftermathReaction = {
      id: 'rx_weaken',
      label: 'Weaken',
      effects: [{ kind: 'thread_weaken', ascendantId: 'asc-1', mortalId: 'actor-1', delta: 0.2 }],
    };
    applyEncounterAftermathReaction(state, makeAction(), reaction, 5, runtime);

    const edge = state.graph.getEdge('thread_asc1_actor1');
    expect(edge?.properties.strength).toBe(THREAD_STRENGTH_MIN);
    const mutTraces = getTraces().filter(t => t.category === 'thread_mutation_applied');
    expect(mutTraces).toHaveLength(1);
  });

  it('test 7: thread_break removes edge and emits trace + TickEvent', () => {
    const state = createMinimalGameState();
    setupThreadGraph(state, 0.6);
    const reaction: EncounterAftermathReaction = {
      id: 'rx_break',
      label: 'Break',
      effects: [{ kind: 'thread_break', ascendantId: 'asc-1', mortalId: 'actor-1', reason: 'The thread is severed.' }],
    };
    const { state: updated } = applyEncounterAftermathReaction(state, makeAction(), reaction, 5, runtime);

    expect(updated.graph.getEdge('thread_asc1_actor1')).toBeUndefined();
    const mutTraces = getTraces().filter(t => t.category === 'thread_mutation_applied');
    expect(mutTraces).toHaveLength(1);
    const breakEvent = updated.tickEvents.find(e => e.type === 'narrative' && e.message === 'The thread is severed.');
    expect(breakEvent).toBeDefined();
  });

  it('test 8: thread_branch creates new edge without destroying old, with branchedFromMortalId', () => {
    const state = createMinimalGameState();
    setupThreadGraph(state, 0.8);
    state.graph.addNode({ id: 'actor-2', type: 'actor', name: 'NewMortal', properties: {} });
    const reaction: EncounterAftermathReaction = {
      id: 'rx_branch',
      label: 'Branch',
      effects: [{ kind: 'thread_branch', ascendantId: 'asc-1', sourceMortalId: 'actor-1', newMortalId: 'actor-2' }],
    };
    applyEncounterAftermathReaction(state, makeAction(), reaction, 5, runtime);

    // Original edge still exists
    expect(state.graph.getEdge('thread_asc1_actor1')).toBeDefined();
    // New branch edge exists
    const newEdges = state.graph.getOutgoingEdges('asc-1', 'thread').filter(e => e.target === 'actor-2');
    expect(newEdges).toHaveLength(1);
    expect(newEdges[0].properties.branchedFromMortalId).toBe('actor-1');
    const mutTraces = getTraces().filter(t => t.category === 'thread_mutation_applied');
    expect(mutTraces).toHaveLength(1);
  });

  it('test 9: thread_branch with missing newMortalId is fail-soft: node_missing trace, no throw', () => {
    const state = createMinimalGameState();
    setupThreadGraph(state, 0.7); // source thread exists
    const reaction: EncounterAftermathReaction = {
      id: 'rx_branch_missing',
      label: 'Branch missing',
      effects: [{ kind: 'thread_branch', ascendantId: 'asc-1', sourceMortalId: 'actor-1', newMortalId: 'ghost-nonexistent' }],
    };
    expect(() => applyEncounterAftermathReaction(state, makeAction(), reaction, 5, runtime)).not.toThrow();

    const skipped = getTraces().filter(t => t.category === 'thread_mutation_skipped');
    expect(skipped).toHaveLength(1);
    if (skipped[0].category === 'thread_mutation_skipped') {
      expect(skipped[0].reason).toBe('node_missing');
    }
  });
});

describe('THR-116 contract: predicate context extensions (test 10)', () => {
  it('test 10: has_mark:debt evaluates true for agent with that mark category', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'agent-thr116', type: 'actor', name: 'Test', properties: {} });
    const hiddenMarks: readonly HiddenMark[] = [{
      markId: 'mark-debt-1',
      targetAgentId: 'agent-thr116',
      category: 'debt',
      severity: 0.5,
      label: 'Owes a blood price',
      sourceEncounterId: 'enc.test',
      placedTick: 1,
    }];
    const ctx = buildPredicateContext(graph, 'agent-thr116', undefined, undefined, hiddenMarks);
    expect(evaluatePredicate('has_mark:debt', ctx)).toBe(true);
    expect(evaluatePredicate('has_mark:betrayal', ctx)).toBe(false);
  });
});
