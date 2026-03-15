import { describe, it, expect, beforeEach } from 'vitest';
import {
  createUnifiedAction,
  progressUnifiedAction,
  isStepComplete,
  advanceStep,
  completeUnifiedAction,
  isUnifiedAgentIdle,
  getActiveUnifiedActions,
  sortByPriority,
  resetUnifiedActionCounter,
} from '../unifiedActionLifecycle';
import type { UnifiedActionTemplate, UnifiedAction } from '../../types/unifiedAction';

// ─── Test Helpers ───────────────────────────────────────────────

/** Deterministic RNG that always returns 0.5 */
const fixedRng = () => 0.5;

/** Deterministic RNG that always returns 0 (picks min) */
const minRng = () => 0;

/** Deterministic RNG that always returns 0.99 (picks max) */
const maxRng = () => 0.99;

function make1StepTemplate(overrides: Partial<UnifiedActionTemplate> = {}): UnifiedActionTemplate {
  return {
    id: 'action.iron.test',
    name: 'Test Action',
    reach: 'iron',
    crudType: 'update',
    scale: 'personal',
    steps: [{
      reach: 'iron',
      duration: { min: 2, max: 4 },
      difficulty: 0.3,
      onSuccess: [],
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

function make3StepTemplate(overrides: Partial<UnifiedActionTemplate> = {}): UnifiedActionTemplate {
  return {
    id: 'encounter.test-multi',
    name: 'Multi-Step Test',
    reach: 'shadow',
    crudType: 'read',
    scale: 'local',
    steps: [
      { reach: 'shadow', duration: { min: 1, max: 1 }, difficulty: 0.3, onSuccess: [], onFailure: [], failBehavior: 'fail_action' },
      { reach: 'iron', duration: { min: 2, max: 3 }, difficulty: 0.4, onSuccess: [], onFailure: [], failBehavior: 'fail_action' },
      { reach: 'gold', duration: { min: 1, max: 2 }, difficulty: 0.5, onSuccess: [], onFailure: [], failBehavior: 'fail_action' },
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

// ─── Tests ──────────────────────────────────────────────────────

describe('unifiedActionLifecycle', () => {
  beforeEach(() => {
    resetUnifiedActionCounter();
  });

  // ─── createUnifiedAction ────────────────────────────────────

  describe('createUnifiedAction', () => {
    it('creates an action with correct initial state', () => {
      const template = make1StepTemplate();
      const action = createUnifiedAction({
        actorId: 'actor-1',
        templateId: 'action.iron.test',
        targetId: 'loc-1',
        scale: 'personal',
        source: 'agent',
        tick: 10,
        template,
        rng: fixedRng,
      });

      expect(action.actionId).toBe('ua_1');
      expect(action.actorId).toBe('actor-1');
      expect(action.templateId).toBe('action.iron.test');
      expect(action.targetId).toBe('loc-1');
      expect(action.scale).toBe('personal');
      expect(action.source).toBe('agent');
      expect(action.startTick).toBe(10);
      expect(action.currentStep).toBe(0);
      expect(action.stepProgress).toBe(0);
      expect(action.resolved).toBe(false);
      expect(action.outcome).toBeUndefined();
      expect(action.stepOutcomes).toEqual([]);
    });

    it('computes stepDuration from template range using rng', () => {
      const template = make1StepTemplate(); // duration { min: 2, max: 4 }
      const actionMin = createUnifiedAction({
        actorId: 'a', templateId: 't', targetId: 'l', scale: 'personal',
        source: 'agent', tick: 0, template, rng: minRng,
      });
      const actionMax = createUnifiedAction({
        actorId: 'a', templateId: 't', targetId: 'l', scale: 'personal',
        source: 'agent', tick: 0, template, rng: maxRng,
      });

      expect(actionMin.stepDuration).toBe(2); // min
      expect(actionMax.stepDuration).toBe(4); // max
    });

    it('handles fixed duration (min === max)', () => {
      const template = make1StepTemplate({
        steps: [{
          reach: 'iron', duration: { min: 1, max: 1 }, difficulty: 0.3,
          onSuccess: [], onFailure: [], failBehavior: 'fail_action',
        }],
      });
      const action = createUnifiedAction({
        actorId: 'a', templateId: 't', targetId: 'l', scale: 'personal',
        source: 'agent', tick: 0, template, rng: fixedRng,
      });
      expect(action.stepDuration).toBe(1);
    });

    it('preserves essencePaid for divine actions', () => {
      const template = make1StepTemplate({ essenceCost: 15 });
      const action = createUnifiedAction({
        actorId: 'ascendant-1', templateId: 'divine.inspire', targetId: 'a-1',
        scale: 'cosmic', source: 'player', tick: 5, template, rng: fixedRng,
        essencePaid: 15,
      });
      expect(action.essencePaid).toBe(15);
    });

    it('generates unique IDs', () => {
      const template = make1StepTemplate();
      const a1 = createUnifiedAction({
        actorId: 'a', templateId: 't', targetId: 'l', scale: 'personal',
        source: 'agent', tick: 0, template, rng: fixedRng,
      });
      const a2 = createUnifiedAction({
        actorId: 'a', templateId: 't', targetId: 'l', scale: 'personal',
        source: 'agent', tick: 0, template, rng: fixedRng,
      });
      expect(a1.actionId).not.toBe(a2.actionId);
    });
  });

  // ─── progressUnifiedAction ──────────────────────────────────

  describe('progressUnifiedAction', () => {
    it('increments stepProgress by 1', () => {
      const template = make1StepTemplate();
      const action = createUnifiedAction({
        actorId: 'a', templateId: 't', targetId: 'l', scale: 'personal',
        source: 'agent', tick: 0, template, rng: fixedRng,
      });
      const progressed = progressUnifiedAction(action);
      expect(progressed.stepProgress).toBe(1);
    });

    it('returns same action if already resolved', () => {
      const template = make1StepTemplate();
      let action = createUnifiedAction({
        actorId: 'a', templateId: 't', targetId: 'l', scale: 'personal',
        source: 'agent', tick: 0, template, rng: fixedRng,
      });
      action = completeUnifiedAction(action, 'success');
      const progressed = progressUnifiedAction(action);
      expect(progressed.stepProgress).toBe(0); // unchanged
      expect(progressed).toBe(action); // same reference
    });

    it('does not mutate original', () => {
      const template = make1StepTemplate();
      const action = createUnifiedAction({
        actorId: 'a', templateId: 't', targetId: 'l', scale: 'personal',
        source: 'agent', tick: 0, template, rng: fixedRng,
      });
      const progressed = progressUnifiedAction(action);
      expect(action.stepProgress).toBe(0);
      expect(progressed.stepProgress).toBe(1);
    });
  });

  // ─── isStepComplete ─────────────────────────────────────────

  describe('isStepComplete', () => {
    it('returns false when progress < duration', () => {
      const template = make1StepTemplate({
        steps: [{ reach: 'iron', duration: { min: 3, max: 3 }, difficulty: 0.3, onSuccess: [], onFailure: [], failBehavior: 'fail_action' }],
      });
      let action = createUnifiedAction({
        actorId: 'a', templateId: 't', targetId: 'l', scale: 'personal',
        source: 'agent', tick: 0, template, rng: fixedRng,
      });
      action = progressUnifiedAction(action);
      action = progressUnifiedAction(action);
      expect(isStepComplete(action)).toBe(false); // 2 < 3
    });

    it('returns true when progress >= duration', () => {
      const template = make1StepTemplate({
        steps: [{ reach: 'iron', duration: { min: 2, max: 2 }, difficulty: 0.3, onSuccess: [], onFailure: [], failBehavior: 'fail_action' }],
      });
      let action = createUnifiedAction({
        actorId: 'a', templateId: 't', targetId: 'l', scale: 'personal',
        source: 'agent', tick: 0, template, rng: fixedRng,
      });
      action = progressUnifiedAction(action);
      action = progressUnifiedAction(action);
      expect(isStepComplete(action)).toBe(true); // 2 >= 2
    });
  });

  // ─── advanceStep ────────────────────────────────────────────

  describe('advanceStep', () => {
    it('marks 1-step action resolved on success', () => {
      const template = make1StepTemplate();
      const action = createUnifiedAction({
        actorId: 'a', templateId: 't', targetId: 'l', scale: 'personal',
        source: 'agent', tick: 0, template, rng: fixedRng,
      });

      const advanced = advanceStep(action, 'success', template, fixedRng);
      expect(advanced.resolved).toBe(true);
      expect(advanced.outcome).toBe('success');
      expect(advanced.stepOutcomes).toEqual(['success']);
    });

    it('marks 1-step action failed on failure', () => {
      const template = make1StepTemplate();
      const action = createUnifiedAction({
        actorId: 'a', templateId: 't', targetId: 'l', scale: 'personal',
        source: 'agent', tick: 0, template, rng: fixedRng,
      });

      const advanced = advanceStep(action, 'failure', template, fixedRng);
      expect(advanced.resolved).toBe(true);
      expect(advanced.outcome).toBe('failure');
      expect(advanced.stepOutcomes).toEqual(['failure']);
    });

    it('advances multi-step action to next step on success', () => {
      const template = make3StepTemplate();
      const action = createUnifiedAction({
        actorId: 'a', templateId: 't', targetId: 'l', scale: 'local',
        source: 'agent', tick: 0, template, rng: fixedRng,
      });

      const advanced = advanceStep(action, 'success', template, fixedRng);
      expect(advanced.resolved).toBe(false);
      expect(advanced.currentStep).toBe(1);
      expect(advanced.stepProgress).toBe(0); // reset
      expect(advanced.stepOutcomes).toEqual(['success']);
    });

    it('walks through all 3 steps to completion', () => {
      const template = make3StepTemplate();
      let action = createUnifiedAction({
        actorId: 'a', templateId: 't', targetId: 'l', scale: 'local',
        source: 'agent', tick: 0, template, rng: fixedRng,
      });

      // Step 0 → success → advance to step 1
      action = advanceStep(action, 'success', template, fixedRng);
      expect(action.currentStep).toBe(1);
      expect(action.resolved).toBe(false);

      // Step 1 → success → advance to step 2
      action = advanceStep(action, 'success', template, fixedRng);
      expect(action.currentStep).toBe(2);
      expect(action.resolved).toBe(false);

      // Step 2 → success → resolved
      action = advanceStep(action, 'success', template, fixedRng);
      expect(action.resolved).toBe(true);
      expect(action.outcome).toBe('success');
      expect(action.stepOutcomes).toEqual(['success', 'success', 'success']);
    });

    it('fails entire action on step failure with fail_action behavior', () => {
      const template = make3StepTemplate(); // all steps have failBehavior: 'fail_action'
      let action = createUnifiedAction({
        actorId: 'a', templateId: 't', targetId: 'l', scale: 'local',
        source: 'agent', tick: 0, template, rng: fixedRng,
      });

      // Step 0 succeeds
      action = advanceStep(action, 'success', template, fixedRng);
      expect(action.currentStep).toBe(1);

      // Step 1 fails → entire action fails
      action = advanceStep(action, 'failure', template, fixedRng);
      expect(action.resolved).toBe(true);
      expect(action.outcome).toBe('failure');
      expect(action.stepOutcomes).toEqual(['success', 'failure']);
    });

    it('continues on failure with continue_weakened behavior', () => {
      const template = make3StepTemplate({
        steps: [
          { reach: 'shadow', duration: { min: 1, max: 1 }, difficulty: 0.3, onSuccess: [], onFailure: [], failBehavior: 'continue_weakened' },
          { reach: 'iron', duration: { min: 2, max: 2 }, difficulty: 0.4, onSuccess: [], onFailure: [], failBehavior: 'fail_action' },
          { reach: 'gold', duration: { min: 1, max: 1 }, difficulty: 0.5, onSuccess: [], onFailure: [], failBehavior: 'fail_action' },
        ],
      });
      let action = createUnifiedAction({
        actorId: 'a', templateId: 't', targetId: 'l', scale: 'local',
        source: 'agent', tick: 0, template, rng: fixedRng,
      });

      // Step 0 fails but continues
      action = advanceStep(action, 'failure', template, fixedRng);
      expect(action.resolved).toBe(false);
      expect(action.currentStep).toBe(1);
      expect(action.stepOutcomes).toEqual(['failure']);
    });

    it('marks final outcome as failure if any step failed with continue_weakened', () => {
      const template = make3StepTemplate({
        steps: [
          { reach: 'shadow', duration: { min: 1, max: 1 }, difficulty: 0.3, onSuccess: [], onFailure: [], failBehavior: 'continue_weakened' },
          { reach: 'iron', duration: { min: 1, max: 1 }, difficulty: 0.4, onSuccess: [], onFailure: [], failBehavior: 'continue_weakened' },
          { reach: 'gold', duration: { min: 1, max: 1 }, difficulty: 0.5, onSuccess: [], onFailure: [], failBehavior: 'continue_weakened' },
        ],
      });
      let action = createUnifiedAction({
        actorId: 'a', templateId: 't', targetId: 'l', scale: 'local',
        source: 'agent', tick: 0, template, rng: fixedRng,
      });

      action = advanceStep(action, 'failure', template, fixedRng); // step 0 fails, continues
      action = advanceStep(action, 'success', template, fixedRng); // step 1 succeeds
      action = advanceStep(action, 'success', template, fixedRng); // step 2 succeeds, final

      expect(action.resolved).toBe(true);
      expect(action.outcome).toBe('failure'); // one failure taints the outcome
      expect(action.stepOutcomes).toEqual(['failure', 'success', 'success']);
    });

    it('computes next step duration from template range', () => {
      const template = make3StepTemplate(); // step 1 has duration { min: 2, max: 3 }
      let action = createUnifiedAction({
        actorId: 'a', templateId: 't', targetId: 'l', scale: 'local',
        source: 'agent', tick: 0, template, rng: minRng,
      });

      // Advance to step 1 using minRng → duration should be 2 (min)
      action = advanceStep(action, 'success', template, minRng);
      expect(action.stepDuration).toBe(2);

      // Reset and advance using maxRng → duration should be 3 (max)
      resetUnifiedActionCounter();
      let actionMax = createUnifiedAction({
        actorId: 'a', templateId: 't', targetId: 'l', scale: 'local',
        source: 'agent', tick: 0, template, rng: maxRng,
      });
      actionMax = advanceStep(actionMax, 'success', template, maxRng);
      expect(actionMax.stepDuration).toBe(3);
    });
  });

  // ─── completeUnifiedAction ──────────────────────────────────

  describe('completeUnifiedAction', () => {
    it('marks action as resolved with given outcome', () => {
      const template = make1StepTemplate();
      const action = createUnifiedAction({
        actorId: 'a', templateId: 't', targetId: 'l', scale: 'personal',
        source: 'agent', tick: 0, template, rng: fixedRng,
      });

      const completed = completeUnifiedAction(action, 'contested_won');
      expect(completed.resolved).toBe(true);
      expect(completed.outcome).toBe('contested_won');
    });
  });

  // ─── isUnifiedAgentIdle ─────────────────────────────────────

  describe('isUnifiedAgentIdle', () => {
    it('returns true when agent has no actions', () => {
      expect(isUnifiedAgentIdle([], 'agent-1')).toBe(true);
    });

    it('returns false when agent has an active action', () => {
      const template = make1StepTemplate();
      const action = createUnifiedAction({
        actorId: 'agent-1', templateId: 't', targetId: 'l', scale: 'personal',
        source: 'agent', tick: 0, template, rng: fixedRng,
      });
      expect(isUnifiedAgentIdle([action], 'agent-1')).toBe(false);
    });

    it('returns true when agent only has resolved actions', () => {
      const template = make1StepTemplate();
      let action = createUnifiedAction({
        actorId: 'agent-1', templateId: 't', targetId: 'l', scale: 'personal',
        source: 'agent', tick: 0, template, rng: fixedRng,
      });
      action = completeUnifiedAction(action, 'success');
      expect(isUnifiedAgentIdle([action], 'agent-1')).toBe(true);
    });

    it('returns true when actions belong to a different agent', () => {
      const template = make1StepTemplate();
      const action = createUnifiedAction({
        actorId: 'agent-2', templateId: 't', targetId: 'l', scale: 'personal',
        source: 'agent', tick: 0, template, rng: fixedRng,
      });
      expect(isUnifiedAgentIdle([action], 'agent-1')).toBe(true);
    });
  });

  // ─── getActiveUnifiedActions ────────────────────────────────

  describe('getActiveUnifiedActions', () => {
    it('returns empty for all resolved', () => {
      const template = make1StepTemplate();
      let a = createUnifiedAction({
        actorId: 'a', templateId: 't', targetId: 'l', scale: 'personal',
        source: 'agent', tick: 0, template, rng: fixedRng,
      });
      a = completeUnifiedAction(a, 'success');
      expect(getActiveUnifiedActions([a])).toEqual([]);
    });

    it('filters out resolved actions', () => {
      const template = make1StepTemplate();
      const active = createUnifiedAction({
        actorId: 'a1', templateId: 't', targetId: 'l', scale: 'personal',
        source: 'agent', tick: 0, template, rng: fixedRng,
      });
      let resolved = createUnifiedAction({
        actorId: 'a2', templateId: 't', targetId: 'l', scale: 'personal',
        source: 'agent', tick: 0, template, rng: fixedRng,
      });
      resolved = completeUnifiedAction(resolved, 'failure');

      const result = getActiveUnifiedActions([active, resolved]);
      expect(result).toHaveLength(1);
      expect(result[0].actorId).toBe('a1');
    });
  });

  // ─── sortByPriority ─────────────────────────────────────────

  describe('sortByPriority', () => {
    it('sorts cosmic before regional before local before personal', () => {
      const template = make1StepTemplate();
      const personal = createUnifiedAction({
        actorId: 'a', templateId: 't', targetId: 'l', scale: 'personal',
        source: 'agent', tick: 0, template, rng: fixedRng,
      });
      const cosmic = createUnifiedAction({
        actorId: 'a', templateId: 't', targetId: 'l', scale: 'cosmic',
        source: 'player', tick: 0, template, rng: fixedRng,
      });
      const regional = createUnifiedAction({
        actorId: 'a', templateId: 't', targetId: 'l', scale: 'regional',
        source: 'agent', tick: 0, template, rng: fixedRng,
      });
      const local = createUnifiedAction({
        actorId: 'a', templateId: 't', targetId: 'l', scale: 'local',
        source: 'agent', tick: 0, template, rng: fixedRng,
      });

      const sorted = sortByPriority([personal, local, cosmic, regional]);
      expect(sorted.map(a => a.scale)).toEqual(['cosmic', 'regional', 'local', 'personal']);
    });

    it('sorts by startTick (FIFO) within same scale band', () => {
      const template = make1StepTemplate();
      const later = createUnifiedAction({
        actorId: 'a', templateId: 't', targetId: 'l', scale: 'personal',
        source: 'agent', tick: 10, template, rng: fixedRng,
      });
      const earlier = createUnifiedAction({
        actorId: 'a', templateId: 't', targetId: 'l', scale: 'personal',
        source: 'agent', tick: 5, template, rng: fixedRng,
      });

      const sorted = sortByPriority([later, earlier]);
      expect(sorted[0].startTick).toBe(5);
      expect(sorted[1].startTick).toBe(10);
    });

    it('scale takes priority over startTick', () => {
      const template = make1StepTemplate();
      const personalEarly = createUnifiedAction({
        actorId: 'a', templateId: 't', targetId: 'l', scale: 'personal',
        source: 'agent', tick: 1, template, rng: fixedRng,
      });
      const cosmicLate = createUnifiedAction({
        actorId: 'a', templateId: 't', targetId: 'l', scale: 'cosmic',
        source: 'player', tick: 100, template, rng: fixedRng,
      });

      const sorted = sortByPriority([personalEarly, cosmicLate]);
      expect(sorted[0].scale).toBe('cosmic');
      expect(sorted[1].scale).toBe('personal');
    });

    it('does not mutate original array', () => {
      const template = make1StepTemplate();
      const a1 = createUnifiedAction({
        actorId: 'a', templateId: 't', targetId: 'l', scale: 'personal',
        source: 'agent', tick: 0, template, rng: fixedRng,
      });
      const a2 = createUnifiedAction({
        actorId: 'a', templateId: 't', targetId: 'l', scale: 'cosmic',
        source: 'player', tick: 0, template, rng: fixedRng,
      });

      const original = [a1, a2];
      const sorted = sortByPriority(original);
      expect(original[0].scale).toBe('personal'); // unchanged
      expect(sorted[0].scale).toBe('cosmic');
    });
  });

  // ─── Full lifecycle integration ─────────────────────────────

  describe('full lifecycle', () => {
    it('1-step action: create → progress → complete', () => {
      const template = make1StepTemplate({
        steps: [{ reach: 'iron', duration: { min: 3, max: 3 }, difficulty: 0.3, onSuccess: [], onFailure: [], failBehavior: 'fail_action' }],
      });

      let action = createUnifiedAction({
        actorId: 'agent-1', templateId: 'action.iron.test', targetId: 'loc-1',
        scale: 'personal', source: 'agent', tick: 0, template, rng: fixedRng,
      });
      expect(action.stepDuration).toBe(3);

      // Tick 1
      action = progressUnifiedAction(action);
      expect(isStepComplete(action)).toBe(false);

      // Tick 2
      action = progressUnifiedAction(action);
      expect(isStepComplete(action)).toBe(false);

      // Tick 3
      action = progressUnifiedAction(action);
      expect(isStepComplete(action)).toBe(true);

      // Resolve
      action = advanceStep(action, 'success', template, fixedRng);
      expect(action.resolved).toBe(true);
      expect(action.outcome).toBe('success');
    });

    it('3-step action: full walk-through', () => {
      const template = make3StepTemplate({
        steps: [
          { reach: 'shadow', duration: { min: 1, max: 1 }, difficulty: 0.3, onSuccess: [], onFailure: [], failBehavior: 'fail_action' },
          { reach: 'iron', duration: { min: 2, max: 2 }, difficulty: 0.4, onSuccess: [], onFailure: [], failBehavior: 'fail_action' },
          { reach: 'gold', duration: { min: 1, max: 1 }, difficulty: 0.5, onSuccess: [], onFailure: [], failBehavior: 'fail_action' },
        ],
      });

      let action = createUnifiedAction({
        actorId: 'agent-1', templateId: 'encounter.test', targetId: 'loc-1',
        scale: 'local', source: 'agent', tick: 0, template, rng: fixedRng,
      });

      // Step 0: 1 tick
      action = progressUnifiedAction(action);
      expect(isStepComplete(action)).toBe(true);
      action = advanceStep(action, 'success', template, fixedRng);
      expect(action.currentStep).toBe(1);

      // Step 1: 2 ticks
      action = progressUnifiedAction(action);
      expect(isStepComplete(action)).toBe(false);
      action = progressUnifiedAction(action);
      expect(isStepComplete(action)).toBe(true);
      action = advanceStep(action, 'success', template, fixedRng);
      expect(action.currentStep).toBe(2);

      // Step 2: 1 tick
      action = progressUnifiedAction(action);
      expect(isStepComplete(action)).toBe(true);
      action = advanceStep(action, 'success', template, fixedRng);

      expect(action.resolved).toBe(true);
      expect(action.outcome).toBe('success');
      expect(action.stepOutcomes).toEqual(['success', 'success', 'success']);
    });
  });
});
