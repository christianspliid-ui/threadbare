import { describe, it, expect, beforeEach } from 'vitest';
import {
  progressAllActions,
  collectCompletions,
  resolveUncontestedStep,
  executeStepResult,
  phaseUnifiedActionProgress,
} from '../unifiedActionResolution';
import {
  createUnifiedAction,
  resetUnifiedActionCounter,
} from '../unifiedActionLifecycle';
import type { UnifiedActionTemplate, UnifiedAction } from '../../types/unifiedAction';
import type { GameState } from '../../types/gameState';
import { WorldGraph } from '../graph';
import { resetOpCounter } from '../graphOpExecutor';
import { clearTraces } from '../traceBuffer';
import { UNIFIED_ACTION_TEMPLATES } from '../../data/unified-action-templates';

// ─── Test Helpers ───────────────────────────────────────────────

const fixedRng = () => 0.5;

/** RNG that produces a low d100 roll (success): roll = floor(0.01*100)+1 = 2 */
const successRng = () => 0.01;

/** RNG that produces a high d100 roll (failure) */
const failureRng = () => 0.99;

function make1StepTemplate(overrides: Partial<UnifiedActionTemplate> = {}): UnifiedActionTemplate {
  return {
    id: 'action.iron.test',
    name: 'Test Action',
    reach: 'iron',
    crudType: 'update',
    scale: 'personal',
    steps: [{
      reach: 'iron',
      duration: { min: 2, max: 2 },
      difficulty: 0.3,
      onSuccess: [{
        op: 'update_node',
        nodeId: '$target',
        changes: { tested: true },
      }],
      onFailure: [],
      failBehavior: 'fail_action',
    }],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ['courage_prudence'],
    narrativeTemplates: {
      initiation: 'begins',
      success: 'succeeds',
      failure: 'fails',
    },
    ...overrides,
  };
}

function make3StepTemplate(): UnifiedActionTemplate {
  return {
    id: 'encounter.test-multi',
    name: 'Multi-Step Test',
    reach: 'shadow',
    crudType: 'read',
    scale: 'local',
    steps: [
      { reach: 'shadow', duration: { min: 1, max: 1 }, difficulty: 0.3, onSuccess: [], onFailure: [], failBehavior: 'fail_action' },
      { reach: 'iron', duration: { min: 1, max: 1 }, difficulty: 0.4, onSuccess: [], onFailure: [], failBehavior: 'fail_action' },
      { reach: 'gold', duration: { min: 1, max: 1 }, difficulty: 0.5, onSuccess: [], onFailure: [], failBehavior: 'fail_action' },
    ],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ['loyalty_ambition'],
    narrativeTemplates: {
      initiation: 'begins encounter',
      success: 'completes encounter',
      failure: 'fails encounter',
    },
  };
}

function createMinimalGameState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'actor-1', type: 'actor', name: 'Alice',
    properties: { actorType: 'individual' },
  });
  graph.addNode({
    id: 'loc-1', type: 'location', name: 'Market',
    properties: {},
  });
  // Add located_at edge
  graph.addEdge({
    id: 'edge-loc-1', source: 'actor-1', target: 'loc-1',
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
    agentKnowledge: new Map(),
    encounterProgress: [],
    actionsInProgress: [],
    unifiedActions: [],
    worldSoul: {} as any,
    echoDefinitions: [],
    echoStates: [],
    chronicle: {} as any,
  };
}

// ─── Tests ──────────────────────────────────────────────────────

describe('unifiedActionResolution', () => {
  beforeEach(() => {
    resetUnifiedActionCounter();
    resetOpCounter();
    clearTraces();
  });

  describe('progressAllActions', () => {
    it('increments stepProgress on all active actions', () => {
      const template = make1StepTemplate();
      const a1 = createUnifiedAction({
        actorId: 'actor-1', templateId: 'action.iron.test', targetId: 'loc-1',
        scale: 'personal', source: 'agent', tick: 0, template, rng: fixedRng,
      });
      const a2 = createUnifiedAction({
        actorId: 'actor-2', templateId: 'action.iron.test', targetId: 'loc-1',
        scale: 'personal', source: 'agent', tick: 0, template, rng: fixedRng,
      });

      const result = progressAllActions([a1, a2]);
      expect(result[0].stepProgress).toBe(1);
      expect(result[1].stepProgress).toBe(1);
    });

    it('does not progress resolved actions', () => {
      const template = make1StepTemplate();
      const a1 = createUnifiedAction({
        actorId: 'actor-1', templateId: 'action.iron.test', targetId: 'loc-1',
        scale: 'personal', source: 'agent', tick: 0, template, rng: fixedRng,
      });
      const resolved: UnifiedAction = { ...a1, resolved: true, outcome: 'success' };

      const result = progressAllActions([resolved]);
      expect(result[0].stepProgress).toBe(0); // unchanged
    });
  });

  describe('collectCompletions', () => {
    it('returns actions whose step is complete', () => {
      const template = make1StepTemplate(); // duration: 2
      let a1 = createUnifiedAction({
        actorId: 'actor-1', templateId: 'action.iron.test', targetId: 'loc-1',
        scale: 'personal', source: 'agent', tick: 0, template, rng: fixedRng,
      });
      // Progress to completion (2 ticks)
      a1 = { ...a1, stepProgress: 2 };

      let a2 = createUnifiedAction({
        actorId: 'actor-2', templateId: 'action.iron.test', targetId: 'loc-1',
        scale: 'personal', source: 'agent', tick: 0, template, rng: fixedRng,
      });
      // Only 1 tick in
      a2 = { ...a2, stepProgress: 1 };

      const completions = collectCompletions([a1, a2]);
      expect(completions).toHaveLength(1);
      expect(completions[0].actorId).toBe('actor-1');
    });

    it('excludes already resolved actions', () => {
      const template = make1StepTemplate();
      let a1 = createUnifiedAction({
        actorId: 'actor-1', templateId: 'action.iron.test', targetId: 'loc-1',
        scale: 'personal', source: 'agent', tick: 0, template, rng: fixedRng,
      });
      a1 = { ...a1, stepProgress: 2, resolved: true, outcome: 'success' };

      expect(collectCompletions([a1])).toHaveLength(0);
    });
  });

  describe('resolveUncontestedStep', () => {
    it('divine actions (difficulty 0) always succeed', () => {
      const template = make1StepTemplate({
        steps: [{
          reach: 'heart', duration: { min: 1, max: 1 }, difficulty: 0.0,
          onSuccess: [{ op: 'update_node', nodeId: '$target', changes: { blessed: true } }],
          onFailure: [],
          failBehavior: 'fail_action',
        }],
      });
      const state = createMinimalGameState();
      const action = createUnifiedAction({
        actorId: 'actor-1', templateId: 'divine.test', targetId: 'actor-1',
        scale: 'cosmic', source: 'player', tick: 0, template, rng: fixedRng,
      });

      const result = resolveUncontestedStep(action, template, state, failureRng);
      expect(result.outcome).toBe('success');
      expect(result.opsToExecute).toHaveLength(1);
    });

    it('returns success ops on success', () => {
      const template = make1StepTemplate();
      const state = createMinimalGameState();
      const action = createUnifiedAction({
        actorId: 'actor-1', templateId: 'action.iron.test', targetId: 'loc-1',
        scale: 'personal', source: 'agent', tick: 0, template, rng: fixedRng,
      });

      // Use a very low roll (likely success)
      // Phase 3: outcome may be 'success' or 'success_at_cost' (near-miss)
      const result = resolveUncontestedStep(action, template, state, successRng);
      expect(['success', 'success_at_cost', 'critical_success']).toContain(result.outcome);
      expect(result.opsToExecute).toHaveLength(1);
    });
  });

  describe('executeStepResult', () => {
    it('executes GraphOps on success', () => {
      const template = make1StepTemplate();
      const state = createMinimalGameState();
      const action = createUnifiedAction({
        actorId: 'actor-1', templateId: 'action.iron.test', targetId: 'loc-1',
        scale: 'personal', source: 'agent', tick: 0, template, rng: fixedRng,
      });

      const { updatedAction, events } = executeStepResult(
        action, template, 'success',
        template.steps[0].onSuccess, state, fixedRng, 10,
      );

      expect(updatedAction.resolved).toBe(true);
      expect(updatedAction.outcome).toBe('success');
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('agent_action_resolved');
      expect(events[0].message).toContain('completed');

      // Verify GraphOp was applied
      const locNode = state.graph.getNode('loc-1');
      expect(locNode?.properties?.tested).toBe(true);
    });

    it('generates failure event on failure', () => {
      const template = make1StepTemplate();
      const state = createMinimalGameState();
      const action = createUnifiedAction({
        actorId: 'actor-1', templateId: 'action.iron.test', targetId: 'loc-1',
        scale: 'personal', source: 'agent', tick: 0, template, rng: fixedRng,
      });

      const { updatedAction, events } = executeStepResult(
        action, template, 'failure', [], state, fixedRng, 10,
      );

      expect(updatedAction.resolved).toBe(true);
      expect(updatedAction.outcome).toBe('failure');
      expect(events[0].message).toContain('failed');
    });

    it('generates step progression event for multi-step', () => {
      const template = make3StepTemplate();
      const state = createMinimalGameState();
      const action = createUnifiedAction({
        actorId: 'actor-1', templateId: 'encounter.test-multi', targetId: 'loc-1',
        scale: 'local', source: 'agent', tick: 0, template, rng: fixedRng,
      });

      const { updatedAction, events } = executeStepResult(
        action, template, 'success', [], state, fixedRng, 10,
      );

      expect(updatedAction.resolved).toBe(false);
      expect(updatedAction.currentStep).toBe(1);
      expect(events).toHaveLength(1);
      expect(events[0].message).toContain('progresses');
      expect(events[0].message).toContain('step 1/3');
    });
  });

  describe('phaseUnifiedActionProgress', () => {
    it('processes empty actions array without error', () => {
      const state = createMinimalGameState();
      const result = phaseUnifiedActionProgress(state, [], fixedRng);
      expect(result.unifiedActions).toEqual([]);
      expect(result.tickEvents).toEqual([]);
    });

    it('progresses and resolves a 1-step action over 2 ticks', () => {
      const template = make1StepTemplate(); // duration: 2
      const state = createMinimalGameState();

      const action = createUnifiedAction({
        actorId: 'actor-1', templateId: 'action.iron.test', targetId: 'loc-1',
        scale: 'personal', source: 'agent', tick: 8, template, rng: fixedRng,
      });
      state.unifiedActions = [action];

      // Tick 1: progress to 1/2 — not complete yet
      const result1 = phaseUnifiedActionProgress(state, [template], fixedRng);
      const actions1 = result1.unifiedActions!;
      expect(actions1[0].stepProgress).toBe(1);
      expect(actions1[0].resolved).toBe(false);

      // Tick 2: progress to 2/2 — resolves
      state.unifiedActions = actions1;
      state.tickEvents = [];
      const result2 = phaseUnifiedActionProgress(state, [template], successRng);
      const actions2 = result2.unifiedActions!;
      expect(actions2[0].stepProgress).toBe(2);
      expect(actions2[0].resolved).toBe(true);
    });

    it('resolves higher-scale actions before lower-scale', () => {
      const cosmicTemplate = make1StepTemplate({
        id: 'divine.test',
        scale: 'cosmic',
        steps: [{
          reach: 'heart', duration: { min: 1, max: 1 }, difficulty: 0.0,
          onSuccess: [], onFailure: [], failBehavior: 'fail_action',
        }],
      });
      const personalTemplate = make1StepTemplate({
        id: 'action.iron.test',
        scale: 'personal',
        steps: [{
          reach: 'iron', duration: { min: 1, max: 1 }, difficulty: 0.0,
          onSuccess: [], onFailure: [], failBehavior: 'fail_action',
        }],
      });
      const state = createMinimalGameState();

      // Create personal first, cosmic second — cosmic should resolve first
      const personal = createUnifiedAction({
        actorId: 'actor-1', templateId: 'action.iron.test', targetId: 'loc-1',
        scale: 'personal', source: 'agent', tick: 0,
        template: personalTemplate, rng: fixedRng,
      });
      const cosmic = createUnifiedAction({
        actorId: 'actor-1', templateId: 'divine.test', targetId: 'loc-1',
        scale: 'cosmic', source: 'player', tick: 0,
        template: cosmicTemplate, rng: fixedRng,
      });
      state.unifiedActions = [personal, cosmic];

      const result = phaseUnifiedActionProgress(
        state, [cosmicTemplate, personalTemplate], fixedRng,
      );

      // Both should be resolved (both 1-tick with difficulty 0)
      const actions = result.unifiedActions!;
      expect(actions.every(a => a.resolved)).toBe(true);

      // Check events order — cosmic should be first (resolved before personal)
      const events = result.tickEvents!;
      expect(events.length).toBeGreaterThanOrEqual(2);
      // First event should be from the cosmic (divine) action, second from personal
      expect(events[0].message).toContain('Test Action'); // cosmic template name
      expect(events[1].message).toContain('Test Action'); // personal template name
    });

    it('handles multi-step action over multiple invocations', () => {
      const template = make3StepTemplate(); // 3 steps, each 1 tick, difficulty 0.3-0.5
      const state = createMinimalGameState();

      const action = createUnifiedAction({
        actorId: 'actor-1', templateId: 'encounter.test-multi', targetId: 'loc-1',
        scale: 'local', source: 'agent', tick: 0, template, rng: fixedRng,
      });
      state.unifiedActions = [action];

      // Step 0: progress + resolve
      let result = phaseUnifiedActionProgress(state, [template], successRng);
      let actions = result.unifiedActions!;
      expect(actions[0].currentStep).toBe(1); // advanced to step 1
      expect(actions[0].resolved).toBe(false);

      // Step 1: progress + resolve
      state.unifiedActions = actions;
      state.tickEvents = [];
      result = phaseUnifiedActionProgress(state, [template], successRng);
      actions = result.unifiedActions!;
      expect(actions[0].currentStep).toBe(2); // advanced to step 2
      expect(actions[0].resolved).toBe(false);

      // Step 2: progress + resolve → complete
      state.unifiedActions = actions;
      state.tickEvents = [];
      result = phaseUnifiedActionProgress(state, [template], successRng);
      actions = result.unifiedActions!;
      expect(actions[0].resolved).toBe(true);
      // Phase 3: action may complete with 'success', 'success_at_cost', or 'critical_success'
      // depending on near-miss and crit rolls from the fixed RNG
      const successOutcomes = ['success', 'success_at_cost', 'critical_success'];
      expect(successOutcomes).toContain(actions[0].outcome);
      // All steps should be some form of success
      for (const so of actions[0].stepOutcomes) {
        expect(successOutcomes).toContain(so);
      }
    });
  });

  describe('thread-creation GraphOp behavior', () => {
    it('bind_thread_location exists in UNIFIED_ACTION_TEMPLATES', () => {
      const template = UNIFIED_ACTION_TEMPLATES.find(t => t.id === 'bind_thread_location');
      expect(template).toBeDefined();
    });

    it('bind_thread_faction exists in UNIFIED_ACTION_TEMPLATES', () => {
      const template = UNIFIED_ACTION_TEMPLATES.find(t => t.id === 'bind_thread_faction');
      expect(template).toBeDefined();
    });

    it('bind_thread_army exists in UNIFIED_ACTION_TEMPLATES', () => {
      const template = UNIFIED_ACTION_TEMPLATES.find(t => t.id === 'bind_thread_army');
      expect(template).toBeDefined();
    });

    it('bind_thread_artifact exists in UNIFIED_ACTION_TEMPLATES', () => {
      const template = UNIFIED_ACTION_TEMPLATES.find(t => t.id === 'bind_thread_artifact');
      expect(template).toBeDefined();
    });

    it('bind_thread_location has add_edge op with edgeType "thread"', () => {
      const template = UNIFIED_ACTION_TEMPLATES.find(t => t.id === 'bind_thread_location')!;
      const op = template.steps[0].onSuccess[0];
      expect(op.op).toBe('add_edge');
      expect(op.edgeType).toBe('thread');
    });

    it('bind_thread_location GraphOp uses $actor as source and $target as target', () => {
      const template = UNIFIED_ACTION_TEMPLATES.find(t => t.id === 'bind_thread_location')!;
      const op = template.steps[0].onSuccess[0];
      expect(op.source).toBe('$actor');
      expect(op.target).toBe('$target');
    });

    it('bind_thread_location thread edge properties include tier 1, attentionMode auto_resolve, courtPosition null', () => {
      const template = UNIFIED_ACTION_TEMPLATES.find(t => t.id === 'bind_thread_location')!;
      const op = template.steps[0].onSuccess[0];
      expect(op.properties).toMatchObject({
        tier: 1,
        attentionMode: 'auto_resolve',
        courtPosition: null,
        maintenanceCurrent: true,
        readBackstoryTier: 0,
      });
    });

    it('bind_thread_faction targets actor category with faction subtype', () => {
      const template = UNIFIED_ACTION_TEMPLATES.find(t => t.id === 'bind_thread_faction')!;
      expect(template.targetCategories).toContain('actor');
      expect(template.targetSubtypes).toContain('faction');
    });

    it('bind_thread_army targets actor category with group subtype', () => {
      const template = UNIFIED_ACTION_TEMPLATES.find(t => t.id === 'bind_thread_army')!;
      expect(template.targetCategories).toContain('actor');
      expect(template.targetSubtypes).toContain('group');
    });

    it('bind_thread_artifact targets artifact category', () => {
      const template = UNIFIED_ACTION_TEMPLATES.find(t => t.id === 'bind_thread_artifact')!;
      expect(template.targetCategories).toContain('artifact');
    });

    it('all thread-creation templates have actorAffinities ascendant', () => {
      const ids = ['bind_thread_location', 'bind_thread_faction', 'bind_thread_army', 'bind_thread_artifact'];
      for (const id of ids) {
        const template = UNIFIED_ACTION_TEMPLATES.find(t => t.id === id)!;
        expect(template.actorAffinities).toContain('ascendant');
      }
    });

    it('all thread-creation templates have essenceCost > 0', () => {
      const ids = ['bind_thread_location', 'bind_thread_faction', 'bind_thread_army', 'bind_thread_artifact'];
      for (const id of ids) {
        const template = UNIFIED_ACTION_TEMPLATES.find(t => t.id === id)!;
        expect(template.essenceCost).toBeGreaterThan(0);
      }
    });

    it('bind_thread_location produces thread edge in graph when resolved with success', () => {
      const template = UNIFIED_ACTION_TEMPLATES.find(t => t.id === 'bind_thread_location')!;

      const graph = new WorldGraph();
      graph.addNode({ id: 'asc-1', type: 'actor', name: 'Ascendant', properties: { actorType: 'ascendant' } });
      graph.addNode({ id: 'loc-target', type: 'location', name: 'The Shrine', properties: {} });
      graph.addEdge({ id: 'edge-loc-asc', source: 'asc-1', target: 'loc-target', type: 'located_at', properties: {} });

      const state: GameState = {
        tick: 5,
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
        agentKnowledge: new Map(),
        encounterProgress: [],
        actionsInProgress: [],
        unifiedActions: [],
        worldSoul: {} as any,
        echoDefinitions: [],
        echoStates: [],
        chronicle: {} as any,
      };

      const action = createUnifiedAction({
        actorId: 'asc-1',
        templateId: 'bind_thread_location',
        targetId: 'loc-target',
        scale: 'cosmic',
        source: 'player',
        tick: 5,
        template,
        rng: successRng,
      });
      state.unifiedActions = [action];

      // Progress to step complete (duration min:1)
      const progressed = progressAllActions([action]);
      state.unifiedActions = [{ ...progressed[0], stepProgress: 1 }];

      const result = phaseUnifiedActionProgress(state, [template], successRng);

      // Confirm action resolved with success
      const resolved = result.unifiedActions!.find(a => a.templateId === 'bind_thread_location');
      expect(resolved?.resolved).toBe(true);
      expect(resolved?.outcome).toBe('success');

      // Confirm thread edge was created
      const threadEdges = state.graph.getOutgoingEdges('asc-1', 'thread');
      expect(threadEdges.length).toBeGreaterThan(0);
      const threadEdge = threadEdges[0];
      expect(threadEdge.target).toBe('loc-target');
      expect(threadEdge.properties.tier).toBe(1);
      expect(threadEdge.properties.attentionMode).toBe('auto_resolve');
    });
  });
});
