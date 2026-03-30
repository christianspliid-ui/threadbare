/**
 * Sphere Pressure Wiring — Contract tests
 *
 * Verifies that real upstream phase execution produces real SpherePressureEvents
 * with the correct sphere, magnitude, source, and targetEntityId fields.
 *
 * These are CONTRACT tests: they use real phase functions with real-enough inputs,
 * not mocks. If a phase stops emitting pressure, these tests will catch it.
 *
 * Phases covered:
 *   1. phaseControlEffects  — active sphere-tagged control effect → pressure per tick
 *   2. phaseUnifiedActionProgress — completed sphere-tagged action → pressure on resolution
 *   3. phaseDoom            — tier escalation → entropy pressure on all location nodes
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../engine/graph';
import type { GameState } from '../../types/gameState';
import type { SphereName } from '../../types/index';
import type { SpherePressureEvent } from '../../types/sphereAffinity';
import {
  CONTROL_PRESSURE_PER_TICK,
  ACTION_PRESSURE_SUCCESS,
  ACTION_PRESSURE_FAILURE,
  DOOM_PRESSURE_PER_TIER,
} from '../../types/sphereAffinity';
import { phaseControlEffects } from '../../engine/phaseControlEffects';
import { phaseUnifiedActionProgress } from '../../engine/unifiedActionResolution';
import { phaseDoom } from '../../engine/phaseDoom';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeSeed(): number { return 42; }

function makeMinimalState(overrides: Partial<GameState> = {}): GameState {
  const graph = new WorldGraph();
  return {
    tick: 1,
    seed: makeSeed(),
    phase: 'playing' as const,
    graph,
    tickEvents: [],
    pendingSpherePressures: [],
    controlEffects: [],
    unifiedActions: [],
    encounterProgress: [],
    rivalDefinitions: [],
    rivalStates: [],
    tiles: [],
    ascendantId: 'asc_1',
    essencePool: { force: 100, matter: 100, energy: 100, life: 100, mind: 100, spirit: 100, time: 100, entropy: 100 },
    doomClock: { currentStage: 0, ticks: 0, stagesElapsed: 0, expired: false, stageTransitions: [] },
    doomDefinition: {
      archetype: 'test',
      stages: [
        { name: 'Stage 1', description: 'Stage 1', threshold: 5 },
        { name: 'Stage 2', description: 'Stage 2', threshold: 10 },
      ],
    },
    mandateState: undefined,
    mandateDefinition: undefined,
    pendingHexMutations: [],
    ...overrides,
  } as unknown as GameState;
}

// ─── Contract Test 1: phaseControlEffects ────────────────────────────────────

describe('spherePressureWiring: phaseControlEffects', () => {
  it('produces pressure event for active control effect with sphere-tagged cost', () => {

    const graph = new WorldGraph();
    // Owner must exist in graph
    graph.addNode({ id: 'asc_1', type: 'actor', name: 'Ascendant', properties: { actorType: 'ascendant' } });
    // Target node must exist
    graph.addNode({ id: 'loc_1', type: 'location', name: 'Location', properties: {} });

    const effect = {
      effectId: 'eff_1',
      templateId: 'tap_source',
      ownerId: 'asc_1',
      targetHexCol: 0,
      targetHexRow: 0,
      targetNodeId: 'loc_1',        // required for sphere pressure
      establishedTick: 0,
      ritualEssenceInvested: 5,
      perTickCost: { life: 1 } as Record<SphereName, number>,  // sphere-tagged cost
      perTickMutations: [],
      perTickGraphOps: [],
      active: true,
      ticksActive: 0,
      narrativeTemplates: { established: '', active: '', lapsed: '' },
    };

    const state = makeMinimalState({ graph, controlEffects: [effect] }) as GameState;
    const result = phaseControlEffects(state) as Partial<GameState>;

    expect(result.pendingSpherePressures).toBeDefined();
    const pressures = result.pendingSpherePressures as SpherePressureEvent[];

    const lifePressure = pressures.find(p => p.sphere === 'life' && p.source === 'control_effect');
    expect(lifePressure).toBeDefined();
    expect(lifePressure!.targetEntityId).toBe('loc_1');
    expect(lifePressure!.magnitude).toBe(CONTROL_PRESSURE_PER_TICK);
    expect(lifePressure!.sourceId).toBe('eff_1');
  });

  it('does not produce pressure for control effect without targetNodeId', () => {

    const graph = new WorldGraph();
    graph.addNode({ id: 'asc_1', type: 'actor', name: 'Ascendant', properties: { actorType: 'ascendant' } });

    const effect = {
      effectId: 'eff_2',
      templateId: 'tap_source',
      ownerId: 'asc_1',
      targetHexCol: 0,
      targetHexRow: 0,
      // No targetNodeId — no sphere pressure should be emitted
      establishedTick: 0,
      ritualEssenceInvested: 5,
      perTickCost: { force: 1 } as Record<SphereName, number>,
      perTickMutations: [],
      perTickGraphOps: [],
      active: true,
      ticksActive: 0,
      narrativeTemplates: { established: '', active: '', lapsed: '' },
    };

    const state = makeMinimalState({ graph, controlEffects: [effect] }) as GameState;
    const result = phaseControlEffects(state) as Partial<GameState>;

    const forcePressure = (result.pendingSpherePressures ?? []).find(
      p => p.sphere === 'force' && p.source === 'control_effect',
    );
    expect(forcePressure).toBeUndefined();
  });
});

// ─── Contract Test 2: phaseUnifiedActionProgress ─────────────────────────────

describe('spherePressureWiring: phaseUnifiedActionProgress', () => {
  it('produces pressure event when sphere-tagged action resolves successfully', () => {

    const graph = new WorldGraph();
    graph.addNode({ id: 'actor_1', type: 'actor', name: 'Actor', properties: { actorType: 'individual' } });
    graph.addNode({ id: 'loc_target', type: 'location', name: 'Target', properties: {} });

    // A completed action: stepProgress >= stepDuration, with a sphere-tagged template
    const action = {
      actionId: 'act_1',
      actorId: 'actor_1',
      targetId: 'loc_target',
      templateId: 'sphere_action',
      currentStep: 0,
      stepProgress: 5,    // matches stepDuration below → will complete
      stepDuration: 5,
      totalProgress: 5,
      startedTick: 0,
      resolved: false,
      outcome: undefined,
      scale: 'local' as const,
      source: 'agent' as const,
      stepOutcomes: [],   // required by UnifiedAction type
    };

    // Template: single step, guaranteed success (difficulty 0), with sphere affinity
    const template = {
      id: 'sphere_action',
      name: 'Sphere Action',
      reach: 'iron' as const,
      crudType: 'create' as const,
      scale: 'local' as const,
      steps: [{
        reach: 'iron' as const,
        duration: { min: 5, max: 5 },
        difficulty: 0,     // divine: always success
        onSuccess: [],
        onFailure: [],
        failBehavior: 'fail_action' as const,
      }],
      apCost: 1,
      actorAffinities: ['individual' as const],
      sphereAffinity: 'force' as SphereName,   // sphere tagged
      durationMode: 'instant' as const,
    };

    const rng = () => 0.5;
    const state = makeMinimalState({ graph, unifiedActions: [action] }) as GameState;
    const result = phaseUnifiedActionProgress(state, [template], rng) as Partial<GameState>;

    const forcePressure = (result.pendingSpherePressures ?? []).find(
      p => p.sphere === 'force' && p.source === 'divine_action',
    );
    expect(forcePressure).toBeDefined();
    expect(forcePressure!.targetEntityId).toBe('loc_target');
    expect(forcePressure!.magnitude).toBe(ACTION_PRESSURE_SUCCESS);
    expect(forcePressure!.sourceId).toBe('act_1');
  });

  it('produces lower pressure on action failure', () => {

    const graph = new WorldGraph();
    graph.addNode({ id: 'actor_1', type: 'actor', name: 'Actor', properties: { actorType: 'individual', domainCapabilities: {} } });
    graph.addNode({ id: 'loc_target', type: 'location', name: 'Target', properties: {} });

    const action = {
      actionId: 'act_fail',
      actorId: 'actor_1',
      targetId: 'loc_target',
      templateId: 'hard_action',
      currentStep: 0,
      stepProgress: 3,
      stepDuration: 3,
      totalProgress: 3,
      startedTick: 0,
      resolved: false,
      outcome: undefined,
      scale: 'local' as const,
      source: 'agent' as const,
      stepOutcomes: [],   // required by UnifiedAction type
    };

    // Template: difficulty 1.0 = impossible, will always fail
    const template = {
      id: 'hard_action',
      name: 'Hard Action',
      reach: 'iron' as const,
      crudType: 'update' as const,
      scale: 'local' as const,
      steps: [{
        reach: 'iron' as const,
        duration: { min: 3, max: 3 },
        difficulty: 1.0,   // impossible: always failure
        onSuccess: [],
        onFailure: [],
        failBehavior: 'fail_action' as const,
      }],
      apCost: 1,
      actorAffinities: ['individual' as const],
      sphereAffinity: 'matter' as SphereName,
      durationMode: 'instant' as const,
    };

    // RNG returning 0.99 (high roll) ensures failure against difficulty 1.0
    const rng = () => 0.99;
    const state = makeMinimalState({ graph, unifiedActions: [action] }) as GameState;
    const result = phaseUnifiedActionProgress(state, [template], rng) as Partial<GameState>;

    const matterPressure = (result.pendingSpherePressures ?? []).find(
      p => p.sphere === 'matter' && p.source === 'divine_action',
    );
    expect(matterPressure).toBeDefined();
    expect(matterPressure!.magnitude).toBe(ACTION_PRESSURE_FAILURE);
    expect(matterPressure!.targetEntityId).toBe('loc_target');
  });

  it('does not produce pressure when template has no sphereAffinity', () => {

    const graph = new WorldGraph();
    graph.addNode({ id: 'actor_1', type: 'actor', name: 'Actor', properties: { actorType: 'individual' } });
    graph.addNode({ id: 'loc_target', type: 'location', name: 'Target', properties: {} });

    const action = {
      actionId: 'act_no_sphere',
      actorId: 'actor_1',
      targetId: 'loc_target',
      templateId: 'generic_action',
      currentStep: 0,
      stepProgress: 2,
      stepDuration: 2,
      totalProgress: 2,
      startedTick: 0,
      resolved: false,
      outcome: undefined,
      scale: 'local' as const,
      source: 'agent' as const,
      stepOutcomes: [],   // required by UnifiedAction type
    };

    const template = {
      id: 'generic_action',
      name: 'Generic Action',
      reach: 'iron' as const,
      crudType: 'read' as const,
      scale: 'local' as const,
      steps: [{
        reach: 'iron' as const,
        duration: { min: 2, max: 2 },
        difficulty: 0,
        onSuccess: [],
        onFailure: [],
        failBehavior: 'fail_action' as const,
      }],
      apCost: 1,
      actorAffinities: ['individual' as const],
      // No sphereAffinity — no pressure should be emitted
      durationMode: 'instant' as const,
    };

    const rng = () => 0.5;
    const state = makeMinimalState({ graph, unifiedActions: [action] }) as GameState;
    const result = phaseUnifiedActionProgress(state, [template], rng) as Partial<GameState>;

    const anyPressure = (result.pendingSpherePressures ?? []).filter(
      p => p.source === 'divine_action',
    );
    expect(anyPressure).toHaveLength(0);
  });
});

// ─── Contract Test 3: phaseDoom ──────────────────────────────────────────────

describe('spherePressureWiring: phaseDoom', () => {
  // Helper to build a proper DoomClockState (matches DoomClockState interface)
  function makeDoomClock(currentTick: number, totalTicks: number, currentStage: number = 1) {
    return {
      definitionArchetype: 'breach' as const,
      currentTick,
      totalTicks,
      currentStage,
      progress: currentTick / totalTicks,
      stageTransitions: [0],
      expired: false,
      tickModifier: 1.0,
    };
  }

  // Helper to build a proper DoomClockDefinition (matches DoomClockDefinition interface)
  // DEFAULT_THRESHOLDS: [0.2, 0.4, 0.6, 0.8, 1.0] — so stage 2 triggers at progress >= 0.2
  function makeDoomDefinition() {
    return {
      archetype: 'breach' as const,
      totalTicks: 100,
      stages: [
        { stage: 1, name: 'Whispers', tickThreshold: 0.2, events: [] },
        { stage: 2, name: 'Signs', tickThreshold: 0.4, events: [] },
        { stage: 3, name: 'Tremors', tickThreshold: 0.6, events: [] },
        { stage: 4, name: 'Crisis', tickThreshold: 0.8, events: [] },
        { stage: 5, name: 'Culmination', tickThreshold: 1.0, events: [] },
      ] as [any, any, any, any, any],
    };
  }

  it('produces entropy pressure on all location nodes when doom tier escalates', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'loc_1', type: 'location', name: 'Location 1', properties: {} });
    graph.addNode({ id: 'loc_2', type: 'location', name: 'Location 2', properties: {} });
    // Add a non-location node that should NOT receive pressure
    graph.addNode({ id: 'actor_1', type: 'actor', name: 'Actor', properties: {} });

    // Stage 1 crosses at progress >= 0.2 (i.e., tick 20 of 100).
    // Set currentTick=19, tickModifier=1: advanceDoomClock produces currentTick=20, progress=0.20.
    // getDoomClockStage(0.20): 0.20 is NOT < 0.20, so loops to stage 2 → returns 2.
    // 2 > 1 → escalation triggers → entropy pressure pushed.
    const doomClock = makeDoomClock(19, 100, 1);
    const doomDefinition = makeDoomDefinition();

    const state = makeMinimalState({ graph, doomClock, doomDefinition }) as GameState;
    const result = phaseDoom(state) as Partial<GameState>;

    const pressures = result.pendingSpherePressures as SpherePressureEvent[] | undefined;
    expect(pressures).toBeDefined();

    // Both location nodes should receive entropy pressure
    const loc1Pressure = pressures!.find(p => p.targetEntityId === 'loc_1' && p.sphere === 'entropy');
    const loc2Pressure = pressures!.find(p => p.targetEntityId === 'loc_2' && p.sphere === 'entropy');

    expect(loc1Pressure).toBeDefined();
    expect(loc2Pressure).toBeDefined();
    expect(loc1Pressure!.magnitude).toBe(DOOM_PRESSURE_PER_TIER);
    expect(loc1Pressure!.source).toBe('doom');

    // Actor node should NOT receive doom pressure
    const actorPressure = pressures!.find(p => p.targetEntityId === 'actor_1');
    expect(actorPressure).toBeUndefined();
  });

  it('does not produce pressure when doom stage does not escalate', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'loc_1', type: 'location', name: 'Location 1', properties: {} });

    // Stage 1 crosses at tick 20. Set currentTick=5: tick→6, progress=0.06 < 0.20 → stage 1 → no escalation.
    const doomClock = makeDoomClock(5, 100, 1);
    const doomDefinition = makeDoomDefinition();

    const state = makeMinimalState({ graph, doomClock, doomDefinition }) as GameState;
    const result = phaseDoom(state) as Partial<GameState>;

    // No entropy pressure should be added (no escalation)
    const entropyPressures = (result.pendingSpherePressures ?? []).filter(p => p.sphere === 'entropy');
    expect(entropyPressures).toHaveLength(0);
  });
});
