/**
 * Integration test: aftermath reaction effect kinds (THR-90 task 3).
 *
 * Gap filled: src/engine/__tests__/encounterAftermath.test.ts covers each kind
 * in isolation. This test fires a SINGLE reaction with ALL 7 kinds on a non-
 * Gate-Duty template and asserts the full contract end-to-end:
 *   (a) every effect mutated state as expected (checked via returned state)
 *   (b) every effect emitted encounter_aftermath_effect
 *   (c) per-kind sub-traces fired (encounter_seed_planted, hidden_mark_placed, intelligence_granted)
 *   (d) wrapping encounter_aftermath_applied fired exactly once
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { applyEncounterAftermathReaction } from '../encounterAftermath';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import { createSimulationRuntime, type SimulationRuntime } from '../simulationRuntime';
import type { GameState } from '../../types/gameState';
import type { ClearanceGateRuntimeState } from '../../types/contentShells';
import type { EncounterAftermathReaction, UnifiedAction } from '../../types/unifiedAction';

function createGameState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'actor.thr90',
    type: 'actor',
    name: 'Serafina',
    properties: { actorType: 'individual', reputationScore: 0.5 },
  });

  return {
    tick: 10,
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
      ['gate-thr90', {
        runtimeId: 'gate-thr90',
        templateId: 'enc.test.all_kinds',
        gateId: 'checkpoint',
        anchorLocationId: 'loc.town',
        subjectNodeId: 'actor.thr90',
        authorityNodeId: 'npc.captain',
        witnessNodeIds: [],
        locationNodeId: 'loc.gate',
        persistence: 'must-persist',
        state: 'pending',
        revealedSignalKeys: [],
        followOnTags: [],
        attempts: 0,
        lastUpdatedTick: 10,
        history: [],
      }],
    ]),
  } as GameState;
}

function makeAction(): UnifiedAction {
  return {
    actionId: 'ua_thr90',
    actorId: 'actor.thr90',
    templateId: 'enc.test.all_kinds',
    targetId: 'actor.thr90',
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

describe('unifiedAftermath — all 7 effect kinds (THR-90)', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('fires all 7 effect kinds: correct state mutations + trace contract', () => {
    const state = createGameState();
    const action = makeAction();

    const reaction: EncounterAftermathReaction = {
      id: 'react.all_kinds',
      label: 'All kinds test reaction',
      closeAfterSelection: true,
      effects: [
        // 1. reputation_score
        { kind: 'reputation_score', delta: 0.05 },
        // 2. reputation_tally
        { kind: 'reputation_tally', key: 'shadow.positive', delta: 1 },
        // 3. clearance_gate_tag (valid runtimeId in state)
        { kind: 'clearance_gate_tag', runtimeId: 'gate-thr90', tag: '#verified' },
        // 4. recent_event
        { kind: 'recent_event', eventType: 'ripple_consequence', message: 'Something shifted.', significance: 0.4 },
        // 5. encounter_seed
        { kind: 'encounter_seed', encounterFamily: 'thieves_guild', seedLabel: 'The mark knows your face', delayTicks: 12, priority: 1.5 },
        // 6. hidden_mark — 'concealed_action' is a valid HiddenMarkCategory
        { kind: 'hidden_mark', category: 'concealed_action', severity: 0.6, label: 'Witnessed the theft', revealFamilies: ['investigation'] },
        // 7. intelligence — 'trade_route' is a valid IntelligenceCategory
        { kind: 'intelligence', category: 'trade_route', label: 'Northern caravan schedule', detail: 'Wagons leave at dawn every 6 ticks', reliability: 0.85, targetRegion: 'city_north' },
      ],
    };

    // (F2 fix) Use the returned state for state mutation assertions
    const { state: updated } = applyEncounterAftermathReaction(state, action, reaction, 10, runtime);
    const traces = getTraces();

    // (a) — state mutations via returned state

    // encounter_seed: pendingEncounterSeeds has a new entry
    expect(updated.pendingEncounterSeeds).toBeDefined();
    expect(updated.pendingEncounterSeeds!.length).toBeGreaterThan(0);
    const seed = updated.pendingEncounterSeeds!.find(s => s.seedLabel === 'The mark knows your face');
    expect(seed).toBeDefined();
    expect(seed!.encounterFamily).toBe('thieves_guild');
    expect(seed!.eligibleAfterTick).toBe(22); // tick 10 + delayTicks 12

    // hidden_mark: hiddenMarks has a new entry
    expect(updated.hiddenMarks).toBeDefined();
    expect(updated.hiddenMarks!.length).toBeGreaterThan(0);
    const mark = updated.hiddenMarks!.find(m => m.label === 'Witnessed the theft');
    expect(mark).toBeDefined();
    expect(mark!.category).toBe('concealed_action');
    expect(mark!.severity).toBe(0.6);

    // intelligence: intelligenceRecords has a new entry
    expect(updated.intelligenceRecords).toBeDefined();
    expect(updated.intelligenceRecords!.length).toBeGreaterThan(0);
    const intel = updated.intelligenceRecords!.find(r => r.label === 'Northern caravan schedule');
    expect(intel).toBeDefined();
    expect(intel!.category).toBe('trade_route');
    expect(intel!.reliability).toBe(0.85);

    // recent_event: recentEvents has new entry
    expect(updated.recentEvents.length).toBeGreaterThan(state.recentEvents.length);

    // clearance_gate_tag: clearanceGateStates updated for the matching gate
    expect(updated.clearanceGateStates).toBeDefined();
    const gate = updated.clearanceGateStates!.get('gate-thr90');
    expect(gate).toBeDefined();
    expect(gate!.followOnTags).toContain('#verified');

    // (b) — encounter_aftermath_effect traces: one per effect (7 total)
    const effectTraces = traces.filter(t => t.category === 'encounter_aftermath_effect');
    expect(effectTraces).toHaveLength(7);

    const effectKinds = effectTraces.map(t =>
      t.category === 'encounter_aftermath_effect' ? t.effectKind : null,
    );
    expect(effectKinds).toContain('reputation_score');
    expect(effectKinds).toContain('reputation_tally');
    expect(effectKinds).toContain('clearance_gate_tag');
    expect(effectKinds).toContain('recent_event');
    expect(effectKinds).toContain('encounter_seed');
    expect(effectKinds).toContain('hidden_mark');
    expect(effectKinds).toContain('intelligence');

    // All effects should succeed (valid actor, valid gate runtime id)
    effectTraces.forEach(t => {
      if (t.category === 'encounter_aftermath_effect') {
        expect(t.success, `effect kind '${t.effectKind}' should succeed`).toBe(true);
      }
    });

    // (c) — per-kind sub-traces

    const seedTraces = traces.filter(t => t.category === 'encounter_seed_planted');
    expect(seedTraces).toHaveLength(1);
    if (seedTraces[0].category === 'encounter_seed_planted') {
      expect(seedTraces[0].encounterFamily).toBe('thieves_guild');
      expect(seedTraces[0].seedLabel).toBe('The mark knows your face');
      expect(seedTraces[0].eligibleAfterTick).toBe(22);
    }

    const markTraces = traces.filter(t => t.category === 'hidden_mark_placed');
    expect(markTraces).toHaveLength(1);
    if (markTraces[0].category === 'hidden_mark_placed') {
      expect(markTraces[0].markCategory).toBe('concealed_action');
      expect(markTraces[0].severity).toBe(0.6);
      expect(markTraces[0].revealFamilies).toContain('investigation');
    }

    const intelTraces = traces.filter(t => t.category === 'intelligence_granted');
    expect(intelTraces).toHaveLength(1);
    if (intelTraces[0].category === 'intelligence_granted') {
      expect(intelTraces[0].intelCategory).toBe('trade_route');
      expect(intelTraces[0].reliability).toBe(0.85);
      expect(intelTraces[0].targetRegion).toBe('city_north');
    }

    // (d) — wrapping encounter_aftermath_applied fires exactly once
    const appliedTraces = traces.filter(t => t.category === 'encounter_aftermath_applied');
    expect(appliedTraces).toHaveLength(1);
    if (appliedTraces[0].category === 'encounter_aftermath_applied') {
      expect(appliedTraces[0].encounterId).toBe('enc.test.all_kinds');
      expect(appliedTraces[0].reactionId).toBe('react.all_kinds');
      expect(appliedTraces[0].effectKinds).toHaveLength(7);
    }
  });
});
