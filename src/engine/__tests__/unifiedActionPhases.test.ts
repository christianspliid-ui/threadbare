/**
 * Integration tests for the unified action pipeline running through
 * phaseUnifiedActionProgress over multiple ticks.
 *
 * These tests verify that the full orchestrator phase correctly handles:
 * - Multi-step actions progressing tick-by-tick
 * - Per-step resolution with fail_action and continue_weakened
 * - Per-step GraphOp execution
 * - Events generated at each step transition
 * - Multiple concurrent actions at different scales
 *
 * Sprint 3D — Task 3D.2
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { phaseUnifiedActionProgress } from '../unifiedActionResolution';
import { createUnifiedAction, resetUnifiedActionCounter } from '../unifiedActionLifecycle';
import type { UnifiedActionTemplate, ActionStep } from '../../types/unifiedAction';
import type { GameState } from '../../types/gameState';
import { WorldGraph } from '../graph';
import { resetOpCounter } from '../graphOpExecutor';
import { clearTraces } from '../traceBuffer';

// ─── Test Helpers ───────────────────────────────────────────────

/** RNG that always succeeds: roll = floor(0.01*100)+1 = 2 */
const successRng = () => 0.01;

/** RNG that always fails: roll = floor(0.99*100)+1 = 100 */
const failureRng = () => 0.99;

const fixedRng = () => 0.5;

function makeStep(overrides: Partial<ActionStep> = {}): ActionStep {
  return {
    reach: 'iron',
    duration: { min: 1, max: 1 },
    difficulty: 0.3,
    onSuccess: [],
    onFailure: [],
    failBehavior: 'fail_action',
    ...overrides,
  };
}

function make3StepTemplate(overrides: Partial<UnifiedActionTemplate> = {}): UnifiedActionTemplate {
  return {
    id: 'encounter.multi-step',
    name: 'Multi-Step Encounter',
    reach: 'shadow',
    crudType: 'read',
    scale: 'local',
    steps: [
      makeStep({ reach: 'shadow', difficulty: 0.3 }),
      makeStep({ reach: 'iron', difficulty: 0.4 }),
      makeStep({ reach: 'gold', difficulty: 0.5 }),
    ],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ['ambition_contentment'],
    narrativeTemplates: {
      initiation: 'begins encounter',
      success: 'completes encounter',
      failure: 'fails encounter',
    },
    ...overrides,
  };
}

function createMinimalGameState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'actor-1', type: 'actor', name: 'Alice',
    properties: { actorType: 'individual' },
  });
  graph.addNode({
    id: 'actor-2', type: 'actor', name: 'Bob',
    properties: { actorType: 'individual' },
  });
  graph.addNode({
    id: 'loc-1', type: 'location', name: 'Market',
    properties: {},
  });
  graph.addEdge({
    id: 'edge-loc-1', source: 'actor-1', target: 'loc-1',
    type: 'located_at', properties: {},
  });
  graph.addEdge({
    id: 'edge-loc-2', source: 'actor-2', target: 'loc-1',
    type: 'located_at', properties: {},
  });

  return {
    tick: 10,
    seed: 42,
    cycle: 1,
    phase: 'playing',
    graph,
    cosmology: {} as any,
    tiles: [],
    clock: {} as any,
    ascendantId: 'asc-1',
    essencePool: {} as any,
    mandateDefinition: null,
    mandateState: null,
    rivalDefinitions: [],
    rivalStates: [],
    doomDefinition: {} as any,
    doomClock: {} as any,
    tickEvents: [],
    recentEvents: [],
    chronicleEntries: [],
    stealthExposure: 0,
    visibilityMap: {} as any,
    familiarityMap: {} as any,
    culturalInsightMap: new Map(),
    encounterProgress: [],
    actionsInProgress: [],
    unifiedActions: [],
    worldSoul: {} as any,
    echoDefinitions: [],
    echoStates: [],
    chronicle: {} as any,
  };
}

/** Run phaseUnifiedActionProgress for N ticks, forwarding state each time */
function runTicks(
  state: GameState,
  templates: UnifiedActionTemplate[],
  rng: () => number,
  numTicks: number,
): { state: GameState; allEvents: GameState['tickEvents'] } {
  const allEvents: GameState['tickEvents'] = [];
  let current = state;
  for (let i = 0; i < numTicks; i++) {
    current = { ...current, tickEvents: [] };
    const result = phaseUnifiedActionProgress(current, templates, rng);
    current = { ...current, ...result, tick: current.tick + 1 };
    allEvents.push(...(result.tickEvents ?? []));
  }
  return { state: current, allEvents };
}

// ─── Tests ──────────────────────────────────────────────────────

describe('unifiedActionPhases — multi-step integration', () => {
  beforeEach(() => {
    resetUnifiedActionCounter();
    resetOpCounter();
    clearTraces();
  });

  it('walks a 3-step action through the full pipeline to completion', () => {
    const template = make3StepTemplate();
    const state = createMinimalGameState();

    const action = createUnifiedAction({
      actorId: 'actor-1', templateId: template.id, targetId: 'loc-1',
      scale: 'local', source: 'agent', tick: state.tick, template, rng: fixedRng,
    });
    state.unifiedActions = [action];

    // Each step has duration 1, so each tick completes a step
    const { state: finalState, allEvents } = runTicks(state, [template], successRng, 3);

    const finalAction = finalState.unifiedActions[0];
    expect(finalAction.resolved).toBe(true);
    expect(finalAction.outcome).toBe('success');
    expect(finalAction.stepOutcomes).toEqual(['success', 'success', 'success']);

    // Should have 3 events: 2 step-progression + 1 completion
    expect(allEvents.length).toBe(3);
    expect(allEvents[0].message).toContain('progresses');
    expect(allEvents[0].message).toContain('step 1/3');
    expect(allEvents[1].message).toContain('progresses');
    expect(allEvents[1].message).toContain('step 2/3');
    expect(allEvents[2].message).toContain('completed');
  });

  it('stops at step 2 with fail_action when step fails', () => {
    const template = make3StepTemplate(); // all steps: fail_action
    const state = createMinimalGameState();

    const action = createUnifiedAction({
      actorId: 'actor-1', templateId: template.id, targetId: 'loc-1',
      scale: 'local', source: 'agent', tick: state.tick, template, rng: fixedRng,
    });
    state.unifiedActions = [action];

    // Tick 1: succeed step 0 (successRng)
    let current = { ...state, tickEvents: [] as any[] };
    let result = phaseUnifiedActionProgress(current, [template], successRng);
    current = { ...current, ...result, tick: current.tick + 1 };

    expect(current.unifiedActions[0].currentStep).toBe(1);
    expect(current.unifiedActions[0].resolved).toBe(false);

    // Tick 2: fail step 1 (failureRng) — should fail entire action
    current = { ...current, tickEvents: [] };
    result = phaseUnifiedActionProgress(current, [template], failureRng);
    current = { ...current, ...result };

    const finalAction = current.unifiedActions[0];
    expect(finalAction.resolved).toBe(true);
    expect(finalAction.outcome).toBe('failure');
    expect(finalAction.stepOutcomes).toEqual(['success', 'failure']);
    // Never reached step 2
    expect(finalAction.currentStep).toBe(1);
  });

  it('continues through failure with continue_weakened behavior', () => {
    const template = make3StepTemplate({
      steps: [
        makeStep({ reach: 'shadow', difficulty: 0.3, failBehavior: 'continue_weakened' }),
        makeStep({ reach: 'iron', difficulty: 0.4, failBehavior: 'continue_weakened' }),
        makeStep({ reach: 'gold', difficulty: 0.5, failBehavior: 'fail_action' }),
      ],
    });
    const state = createMinimalGameState();

    const action = createUnifiedAction({
      actorId: 'actor-1', templateId: template.id, targetId: 'loc-1',
      scale: 'local', source: 'agent', tick: state.tick, template, rng: fixedRng,
    });
    state.unifiedActions = [action];

    // Tick 1: fail step 0 (continue_weakened → advances to step 1)
    let current = { ...state, tickEvents: [] as any[] };
    let result = phaseUnifiedActionProgress(current, [template], failureRng);
    current = { ...current, ...result, tick: current.tick + 1 };

    expect(current.unifiedActions[0].currentStep).toBe(1);
    expect(current.unifiedActions[0].resolved).toBe(false);
    expect(current.unifiedActions[0].stepOutcomes).toEqual(['failure']);

    // Tick 2: succeed step 1
    current = { ...current, tickEvents: [] };
    result = phaseUnifiedActionProgress(current, [template], successRng);
    current = { ...current, ...result, tick: current.tick + 1 };

    expect(current.unifiedActions[0].currentStep).toBe(2);
    expect(current.unifiedActions[0].resolved).toBe(false);

    // Tick 3: succeed step 2 → resolved, but outcome is failure (step 0 failed)
    current = { ...current, tickEvents: [] };
    result = phaseUnifiedActionProgress(current, [template], successRng);
    current = { ...current, ...result };

    const finalAction = current.unifiedActions[0];
    expect(finalAction.resolved).toBe(true);
    // Outcome is failure because step 0 failed (continue_weakened taints result)
    expect(finalAction.outcome).toBe('failure');
    expect(finalAction.stepOutcomes).toEqual(['failure', 'success', 'success']);
  });

  it('executes per-step GraphOps on success', () => {
    const template = make3StepTemplate({
      steps: [
        makeStep({
          reach: 'shadow', difficulty: 0,
          onSuccess: [{ op: 'update_node', nodeId: 'loc-1', changes: { step0: true } }],
        }),
        makeStep({
          reach: 'iron', difficulty: 0,
          onSuccess: [{ op: 'update_node', nodeId: 'loc-1', changes: { step1: true } }],
        }),
        makeStep({
          reach: 'gold', difficulty: 0,
          onSuccess: [{ op: 'update_node', nodeId: 'loc-1', changes: { step2: true } }],
        }),
      ],
    });
    const state = createMinimalGameState();

    const action = createUnifiedAction({
      actorId: 'actor-1', templateId: template.id, targetId: 'loc-1',
      scale: 'local', source: 'agent', tick: state.tick, template, rng: fixedRng,
    });
    state.unifiedActions = [action];

    // Run 3 ticks — all difficulty 0 so all succeed
    const { state: finalState } = runTicks(state, [template], fixedRng, 3);

    // Verify GraphOps executed on the shared graph
    const loc = finalState.graph.getNode('loc-1');
    expect(loc?.properties.step0).toBe(true);
    expect(loc?.properties.step1).toBe(true);
    expect(loc?.properties.step2).toBe(true);

    expect(finalState.unifiedActions[0].resolved).toBe(true);
    expect(finalState.unifiedActions[0].outcome).toBe('success');
  });

  it('skips failure GraphOps when step succeeds', () => {
    const template = make3StepTemplate({
      steps: [
        makeStep({
          reach: 'shadow', difficulty: 0,
          onSuccess: [{ op: 'update_node', nodeId: 'loc-1', changes: { success_ran: true } }],
          onFailure: [{ op: 'update_node', nodeId: 'loc-1', changes: { failure_ran: true } }],
        }),
      ],
    });
    const state = createMinimalGameState();

    const action = createUnifiedAction({
      actorId: 'actor-1', templateId: template.id, targetId: 'loc-1',
      scale: 'local', source: 'agent', tick: state.tick, template, rng: fixedRng,
    });
    state.unifiedActions = [action];

    const { state: finalState } = runTicks(state, [template], successRng, 1);

    const loc = finalState.graph.getNode('loc-1');
    expect(loc?.properties.success_ran).toBe(true);
    expect(loc?.properties.failure_ran).toBeUndefined();
  });

  it('handles multi-step with varying durations', () => {
    const template = make3StepTemplate({
      steps: [
        makeStep({ reach: 'shadow', difficulty: 0, duration: { min: 2, max: 2 } }),
        makeStep({ reach: 'iron', difficulty: 0, duration: { min: 1, max: 1 } }),
        makeStep({ reach: 'gold', difficulty: 0, duration: { min: 3, max: 3 } }),
      ],
    });
    const state = createMinimalGameState();

    const action = createUnifiedAction({
      actorId: 'actor-1', templateId: template.id, targetId: 'loc-1',
      scale: 'local', source: 'agent', tick: state.tick, template, rng: fixedRng,
    });
    state.unifiedActions = [action];

    // Step 0: duration 2 → tick 1 progresses, tick 2 completes step
    const { state: after2 } = runTicks(state, [template], successRng, 2);
    expect(after2.unifiedActions[0].currentStep).toBe(1);
    expect(after2.unifiedActions[0].resolved).toBe(false);

    // Step 1: duration 1 → tick 3 completes step
    const { state: after3 } = runTicks(after2, [template], successRng, 1);
    expect(after3.unifiedActions[0].currentStep).toBe(2);
    expect(after3.unifiedActions[0].resolved).toBe(false);

    // Step 2: duration 3 → ticks 4-5 progress, tick 6 completes
    const { state: after5 } = runTicks(after3, [template], successRng, 2);
    expect(after5.unifiedActions[0].resolved).toBe(false);

    const { state: after6 } = runTicks(after5, [template], successRng, 1);
    expect(after6.unifiedActions[0].resolved).toBe(true);
    expect(after6.unifiedActions[0].outcome).toBe('success');
    expect(after6.unifiedActions[0].stepOutcomes).toEqual(['success', 'success', 'success']);
  });

  it('handles two concurrent actions from different actors', () => {
    const template = make3StepTemplate({
      steps: [
        makeStep({ difficulty: 0, duration: { min: 1, max: 1 } }),
        makeStep({ difficulty: 0, duration: { min: 1, max: 1 } }),
        makeStep({ difficulty: 0, duration: { min: 1, max: 1 } }),
      ],
    });
    const state = createMinimalGameState();

    const action1 = createUnifiedAction({
      actorId: 'actor-1', templateId: template.id, targetId: 'loc-1',
      scale: 'local', source: 'agent', tick: state.tick, template, rng: fixedRng,
    });
    const action2 = createUnifiedAction({
      actorId: 'actor-2', templateId: template.id, targetId: 'loc-1',
      scale: 'local', source: 'agent', tick: state.tick, template, rng: fixedRng,
    });
    state.unifiedActions = [action1, action2];

    // Both actions should progress in parallel over 3 ticks
    const { state: finalState, allEvents } = runTicks(state, [template], successRng, 3);

    expect(finalState.unifiedActions[0].resolved).toBe(true);
    expect(finalState.unifiedActions[1].resolved).toBe(true);
    expect(finalState.unifiedActions[0].outcome).toBe('success');
    expect(finalState.unifiedActions[1].outcome).toBe('success');

    // Should have 6 events: 3 per action (2 step progressions + 1 completion each)
    expect(allEvents.length).toBe(6);
  });

  it('preserves resolved actions across ticks (no re-processing)', () => {
    const template = make3StepTemplate({
      steps: [makeStep({ difficulty: 0, duration: { min: 1, max: 1 } })],
    });
    const state = createMinimalGameState();

    const action = createUnifiedAction({
      actorId: 'actor-1', templateId: template.id, targetId: 'loc-1',
      scale: 'local', source: 'agent', tick: state.tick, template, rng: fixedRng,
    });
    state.unifiedActions = [action];

    // Tick 1: completes
    const { state: after1, allEvents: events1 } = runTicks(state, [template], successRng, 1);
    expect(after1.unifiedActions[0].resolved).toBe(true);
    expect(events1.length).toBe(1);

    // Tick 2: resolved action should not generate new events
    const { allEvents: events2 } = runTicks(after1, [template], successRng, 1);
    expect(events2.length).toBe(0);
  });
});
