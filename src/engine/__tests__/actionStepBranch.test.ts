import { describe, it, expect, beforeEach } from 'vitest';
import {
  resolveStepDefinition,
  createUnifiedAction,
  advanceStep,
  resetUnifiedActionCounter,
} from '../unifiedActionLifecycle';
import type {
  UnifiedActionTemplate,
  ActionStep,
  ActionStepBranch,
  ActionStepOrBranch,
  BranchAwareAftermathConfig,
} from '../../types/unifiedAction';
import { isActionStepBranch } from '../../types/unifiedAction';
import type { EncounterChoiceMemory } from '../../types/encounter';

// ── Test fixtures ──────────────────────────────────────────────

const STEP_A: ActionStep = {
  reach: 'eye',
  duration: { min: 2, max: 2 },
  difficulty: 0.3,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate: 'Step A prose',
};

const STEP_ACCEPT: ActionStep = {
  reach: 'shadow',
  duration: { min: 3, max: 3 },
  difficulty: 0.5,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'fail_action',
  narrativeTemplate: 'Accept path prose',
};

const STEP_REFUSE: ActionStep = {
  reach: 'heart',
  duration: { min: 2, max: 2 },
  difficulty: 0.4,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'fail_action',
  narrativeTemplate: 'Refuse path prose',
};

const STEP_FALLBACK: ActionStep = {
  reach: 'iron',
  duration: { min: 1, max: 1 },
  difficulty: 0.2,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'fail_action',
  narrativeTemplate: 'Fallback prose',
};

const BRANCH_STEP: ActionStepBranch = {
  branchOnStep: 0,
  variants: {
    'accept': STEP_ACCEPT,
    'refuse': STEP_REFUSE,
  },
  fallback: STEP_FALLBACK,
};

function makeChoiceMemory(stepIndex: number, choiceId: string): EncounterChoiceMemory {
  return {
    stepIndex,
    stepId: `test.step.${stepIndex}`,
    choiceId,
    choiceText: `Choice: ${choiceId}`,
    interventionType: 'supportive',
    essenceSpent: 0,
    probabilityBoost: 0,
    tick: 1,
  };
}

function makeLinearTemplate(steps: readonly ActionStep[]): UnifiedActionTemplate {
  return {
    id: 'test.linear',
    rarityTier: 'common',
    name: 'Test Linear',
    reach: 'eye',
    crudType: 'read',
    scale: 'local',
    steps,
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: [{ positive: 'loyalty', negative: 'ambition' }],
    narrativeTemplates: {
      initiation: 'Test starts',
      success: 'Test succeeds',
      failure: 'Test fails',
    },
  };
}

function makeBranchingTemplate(
  steps: readonly ActionStepOrBranch[],
  aftermathConfig?: BranchAwareAftermathConfig,
): UnifiedActionTemplate {
  return {
    ...makeLinearTemplate([]),
    id: 'test.branching',
    name: 'Test Branching',
    steps,
    aftermathConfig,
  };
}

const fixedRng = () => 0.5;

// ── Tests ──────────────────────────────────────────────────────

describe('isActionStepBranch', () => {
  it('returns false for a plain ActionStep', () => {
    expect(isActionStepBranch(STEP_A)).toBe(false);
  });

  it('returns true for an ActionStepBranch', () => {
    expect(isActionStepBranch(BRANCH_STEP)).toBe(true);
  });
});

describe('resolveStepDefinition', () => {
  it('returns a plain ActionStep directly', () => {
    const template = makeLinearTemplate([STEP_A]);
    expect(resolveStepDefinition(template, 0)).toBe(STEP_A);
  });

  it('returns the correct variant when choice matches', () => {
    const template = makeBranchingTemplate([STEP_A, BRANCH_STEP]);
    const history = [makeChoiceMemory(0, 'accept')];
    expect(resolveStepDefinition(template, 1, history)).toBe(STEP_ACCEPT);
  });

  it('returns a different variant for a different choice', () => {
    const template = makeBranchingTemplate([STEP_A, BRANCH_STEP]);
    const history = [makeChoiceMemory(0, 'refuse')];
    expect(resolveStepDefinition(template, 1, history)).toBe(STEP_REFUSE);
  });

  it('returns fallback when choiceId does not match any variant', () => {
    const template = makeBranchingTemplate([STEP_A, BRANCH_STEP]);
    const history = [makeChoiceMemory(0, 'unknown_choice')];
    expect(resolveStepDefinition(template, 1, history)).toBe(STEP_FALLBACK);
  });

  it('returns fallback when choice history is empty', () => {
    const template = makeBranchingTemplate([STEP_A, BRANCH_STEP]);
    expect(resolveStepDefinition(template, 1, [])).toBe(STEP_FALLBACK);
  });

  it('returns fallback when choice history is undefined', () => {
    const template = makeBranchingTemplate([STEP_A, BRANCH_STEP]);
    expect(resolveStepDefinition(template, 1, undefined)).toBe(STEP_FALLBACK);
  });

  it('resolves step 0 as plain even in a branching template', () => {
    const template = makeBranchingTemplate([STEP_A, BRANCH_STEP]);
    expect(resolveStepDefinition(template, 0)).toBe(STEP_A);
  });
});

describe('advanceStep with branching', () => {
  beforeEach(() => resetUnifiedActionCounter());

  it('linear template behavior is unchanged', () => {
    const template = makeLinearTemplate([STEP_A, STEP_ACCEPT]);
    const action = createUnifiedAction({
      actorId: 'a1',
      templateId: template.id,
      targetId: 't1',
      scale: 'local',
      source: 'agent',
      tick: 1,
      template,
      rng: fixedRng,
    });

    const advanced = advanceStep(action, 'success', template, fixedRng);
    expect(advanced.currentStep).toBe(1);
    expect(advanced.resolved).toBe(false);
    // Duration should come from STEP_ACCEPT (min: 3, max: 3)
    expect(advanced.stepDuration).toBe(3);
  });

  it('branching template uses correct variant duration after accept choice', () => {
    const template = makeBranchingTemplate([STEP_A, BRANCH_STEP]);
    const action = createUnifiedAction({
      actorId: 'a1',
      templateId: template.id,
      targetId: 't1',
      scale: 'local',
      source: 'agent',
      tick: 1,
      template,
      rng: fixedRng,
    });

    // Simulate choice at step 0
    const withChoice: typeof action = {
      ...action,
      choiceHistory: [makeChoiceMemory(0, 'accept')],
    };

    const advanced = advanceStep(withChoice, 'success', template, fixedRng);
    expect(advanced.currentStep).toBe(1);
    // Duration from STEP_ACCEPT: min 3, max 3
    expect(advanced.stepDuration).toBe(3);
  });

  it('branching template uses refuse variant duration after refuse choice', () => {
    const template = makeBranchingTemplate([STEP_A, BRANCH_STEP]);
    const action = createUnifiedAction({
      actorId: 'a1',
      templateId: template.id,
      targetId: 't1',
      scale: 'local',
      source: 'agent',
      tick: 1,
      template,
      rng: fixedRng,
    });

    const withChoice: typeof action = {
      ...action,
      choiceHistory: [makeChoiceMemory(0, 'refuse')],
    };

    const advanced = advanceStep(withChoice, 'success', template, fixedRng);
    expect(advanced.currentStep).toBe(1);
    // Duration from STEP_REFUSE: min 2, max 2
    expect(advanced.stepDuration).toBe(2);
  });

  it('branching template uses fallback when no choice recorded', () => {
    const template = makeBranchingTemplate([STEP_A, BRANCH_STEP]);
    const action = createUnifiedAction({
      actorId: 'a1',
      templateId: template.id,
      targetId: 't1',
      scale: 'local',
      source: 'agent',
      tick: 1,
      template,
      rng: fixedRng,
    });

    const advanced = advanceStep(action, 'success', template, fixedRng);
    expect(advanced.currentStep).toBe(1);
    // Duration from STEP_FALLBACK: min 1, max 1
    expect(advanced.stepDuration).toBe(1);
  });

  it('resolves final step correctly on branching template', () => {
    const template = makeBranchingTemplate([STEP_A, BRANCH_STEP]);
    const action = createUnifiedAction({
      actorId: 'a1',
      templateId: template.id,
      targetId: 't1',
      scale: 'local',
      source: 'agent',
      tick: 1,
      template,
      rng: fixedRng,
    });

    // Advance past step 0
    const withChoice: typeof action = {
      ...action,
      choiceHistory: [makeChoiceMemory(0, 'accept')],
    };
    const atStep1 = advanceStep(withChoice, 'success', template, fixedRng);

    // Now resolve step 1 (final step, fail_action)
    const resolved = advanceStep(atStep1, 'success', template, fixedRng);
    expect(resolved.resolved).toBe(true);
    expect(resolved.outcome).toBe('success');
    expect(resolved.stepOutcomes).toEqual(['success', 'success']);
  });
});

describe('NPC role broker', () => {
  it('broker is a valid NPC role', async () => {
    const { NPC_ROLES } = await import('../../types/npc');
    expect(NPC_ROLES).toContain('broker');
  });
});
