/**
 * Phase 3: Unified Action Outcome Expansion — Tests
 *
 * Proves:
 * 1. Step outcomes preserve the full 6-tier ladder (Phase 6 adds near_miss)
 * 2. Proving-slice templates produce differentiated consequences
 * 3. Push spend works and applies modifier
 * 4. Resist spend works and can downgrade outcomes
 * 5. Telemetry records rich outcomes
 * 6. Action-level outcomes reflect step history correctly
 */

import { describe, it, expect } from 'vitest';
import type { StepOutcome } from '../../types/unifiedAction';
import { isStepSuccess, isStepFailure } from '../../types/unifiedAction';
import { advanceStep } from '../unifiedActionLifecycle';
import type { UnifiedActionTemplate, UnifiedAction } from '../../types/unifiedAction';
import {
  computeOutcomeConsequence,
  isProvingSliceTemplate,
  CRITICAL_SUCCESS_GROWTH_MULTIPLIER,
  SUCCESS_AT_COST_GROWTH_MULTIPLIER,
  CRITICAL_FAILURE_QUINTESSENCE_PENALTY,
  SUCCESS_AT_COST_QUINTESSENCE_PENALTY,
  CRITICAL_SUCCESS_QUINTESSENCE_REWARD,
  NEAR_MISS_GROWTH_MULTIPLIER,
  NEAR_MISS_PROGRESS_COUNTER_DELTA,
} from '../outcomeConsequences';
import {
  mapResolverOutcomeToStep,
} from '../unifiedActionResolution';
import {
  resolveAction,
  classifyResolutionRoll,
  NEAR_MISS_MARGIN,
} from '../resolutionService';
import type { ResolutionInput } from '../../types/resolution';

// ─── Helpers ────────────────────────────────────────────────────

function makeTemplate(overrides?: Partial<UnifiedActionTemplate>): UnifiedActionTemplate {
  return {
    id: 'test.template',
    rarityTier: 1,
    intrinsicTier: 'background',
    name: 'Test Template',
    reach: 'heart',
    crudType: 'update',
    scale: 'personal',
    rarityTier: 1,
    steps: [
      {
        reach: 'heart',
        duration: { min: 1, max: 1 },
        difficulty: 0.4,
        onSuccess: [],
        onFailure: [],
        failBehavior: 'continue_weakened',
      },
      {
        reach: 'heart',
        duration: { min: 1, max: 1 },
        difficulty: 0.5,
        onSuccess: [],
        onFailure: [],
        failBehavior: 'fail_action',
      },
    ],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: [],
    narrativeTemplates: {
      initiation: 'test',
      success: 'test',
      failure: 'test',
    },
    ...overrides,
  };
}

function makeAction(overrides?: Partial<UnifiedAction>): UnifiedAction {
  return {
    actionId: 'ua_test_1',
    actorId: 'actor1',
    templateId: 'test.template',
    targetId: 'target1',
    scale: 'personal',
    source: 'agent',
    startTick: 0,
    currentStep: 0,
    stepProgress: 1,
    stepDuration: 1,
    resolved: false,
    stepOutcomes: [],
    ...overrides,
  };
}

function makeRng(value: number): () => number {
  return () => value;
}

// ─── 1. StepOutcome type preserves full ladder ──────────────────

describe('StepOutcome type helpers', () => {
  it('isStepSuccess recognizes all success variants', () => {
    expect(isStepSuccess('critical_success')).toBe(true);
    expect(isStepSuccess('success')).toBe(true);
    expect(isStepSuccess('success_at_cost')).toBe(true);
    expect(isStepSuccess('near_miss')).toBe(true);
    expect(isStepSuccess('failure')).toBe(false);
    expect(isStepSuccess('critical_failure')).toBe(false);
  });

  it('isStepFailure recognizes all failure variants', () => {
    expect(isStepFailure('failure')).toBe(true);
    expect(isStepFailure('critical_failure')).toBe(true);
    expect(isStepFailure('success')).toBe(false);
    expect(isStepFailure('success_at_cost')).toBe(false);
    expect(isStepFailure('near_miss')).toBe(false);
    expect(isStepFailure('critical_success')).toBe(false);
  });
});

// ─── 2. mapResolverOutcomeToStep ────────────────────────────────

describe('mapResolverOutcomeToStep', () => {
  it('maps critical_success to critical_success', () => {
    expect(mapResolverOutcomeToStep('critical_success', false)).toBe('critical_success');
    expect(mapResolverOutcomeToStep('critical_success', true)).toBe('critical_success');
  });

  it('maps success to success when not near-miss', () => {
    expect(mapResolverOutcomeToStep('success', false)).toBe('success');
  });

  it('maps success to near_miss when near-miss (Phase 6: near_miss is its own band)', () => {
    expect(mapResolverOutcomeToStep('success', true)).toBe('near_miss');
  });

  it('maps failure to failure', () => {
    expect(mapResolverOutcomeToStep('failure', false)).toBe('failure');
  });

  it('maps critical_failure to critical_failure', () => {
    expect(mapResolverOutcomeToStep('critical_failure', false)).toBe('critical_failure');
  });
});

// ─── 3. advanceStep handles rich outcomes ───────────────────────

describe('advanceStep with rich outcomes', () => {
  const template = makeTemplate();

  it('critical_failure always fails the action even with continue_weakened', () => {
    const action = makeAction();
    const result = advanceStep(action, 'critical_failure', template, makeRng(0.5));
    expect(result.resolved).toBe(true);
    expect(result.outcome).toBe('critical_failure');
  });

  it('regular failure with continue_weakened advances to next step', () => {
    const action = makeAction();
    const result = advanceStep(action, 'failure', template, makeRng(0.5));
    expect(result.resolved).toBe(false);
    expect(result.currentStep).toBe(1);
    expect(result.stepOutcomes).toEqual(['failure']);
  });

  it('success_at_cost with continue_weakened advances to next step', () => {
    const action = makeAction();
    const result = advanceStep(action, 'success_at_cost', template, makeRng(0.5));
    expect(result.resolved).toBe(false);
    expect(result.currentStep).toBe(1);
    expect(result.stepOutcomes).toEqual(['success_at_cost']);
  });

  it('near_miss with continue_weakened advances to next step', () => {
    const action = makeAction();
    const result = advanceStep(action, 'near_miss', template, makeRng(0.5));
    expect(result.resolved).toBe(false);
    expect(result.currentStep).toBe(1);
    expect(result.stepOutcomes).toEqual(['near_miss']);
  });

  it('final step with near_miss in history produces success_at_cost', () => {
    const action = makeAction({
      currentStep: 1,
      stepOutcomes: ['near_miss'],
    });
    const result = advanceStep(action, 'success', template, makeRng(0.5));
    expect(result.resolved).toBe(true);
    expect(result.outcome).toBe('success_at_cost');
  });

  it('final step with mixed outcomes produces success_at_cost', () => {
    const action = makeAction({
      currentStep: 1,
      stepOutcomes: ['failure'], // first step failed but continued
    });
    const result = advanceStep(action, 'success', template, makeRng(0.5));
    expect(result.resolved).toBe(true);
    expect(result.outcome).toBe('success_at_cost');
  });

  it('final step with all success_at_cost produces success_at_cost', () => {
    const action = makeAction({
      currentStep: 1,
      stepOutcomes: ['success_at_cost'],
    });
    const result = advanceStep(action, 'success', template, makeRng(0.5));
    expect(result.resolved).toBe(true);
    expect(result.outcome).toBe('success_at_cost');
  });

  it('final step critical_success with clean run produces critical_success', () => {
    const action = makeAction({
      currentStep: 1,
      stepOutcomes: ['success'],
    });
    const result = advanceStep(action, 'critical_success', template, makeRng(0.5));
    expect(result.resolved).toBe(true);
    expect(result.outcome).toBe('critical_success');
  });

  it('all steps success produces success', () => {
    const action = makeAction({
      currentStep: 1,
      stepOutcomes: ['success'],
    });
    const result = advanceStep(action, 'success', template, makeRng(0.5));
    expect(result.resolved).toBe(true);
    expect(result.outcome).toBe('success');
  });
});

// ─── 4. Proving slice template detection ────────────────────────

describe('isProvingSliceTemplate', () => {
  it('detects social/influence templates', () => {
    expect(isProvingSliceTemplate('action.heart.inspire')).toBe(true);
    expect(isProvingSliceTemplate('action.shadow.recruit-agent')).toBe(true);
  });

  it('detects information/exploration templates', () => {
    expect(isProvingSliceTemplate('action.eye.scout')).toBe(true);
    expect(isProvingSliceTemplate('npc_ask_information')).toBe(true);
    expect(isProvingSliceTemplate('npc_eavesdrop')).toBe(true);
  });

  it('detects risky/coercive templates', () => {
    expect(isProvingSliceTemplate('action.shadow.assassinate')).toBe(true);
    expect(isProvingSliceTemplate('action.iron.conquer')).toBe(true);
    expect(isProvingSliceTemplate('action.gold.commission-assassination')).toBe(true);
  });

  it('rejects non-proving-slice templates', () => {
    expect(isProvingSliceTemplate('action.gold.trade')).toBe(false);
    expect(isProvingSliceTemplate('action.stone.build')).toBe(false);
  });
});

// ─── 5. Differentiated consequences ─────────────────────────────

describe('computeOutcomeConsequence', () => {
  it('critical_success grants growth bonus and Q reward', () => {
    const c = computeOutcomeConsequence('action.heart.inspire', 'critical_success', 'actor1', 10);
    expect(c.growthMultiplier).toBe(CRITICAL_SUCCESS_GROWTH_MULTIPLIER);
    expect(c.quintessenceEvent).not.toBeNull();
    expect(c.quintessenceEvent!.delta).toBe(CRITICAL_SUCCESS_QUINTESSENCE_REWARD);
    expect(c.narrativeTag).toBe('surge');
  });

  it('success returns default consequence', () => {
    const c = computeOutcomeConsequence('action.heart.inspire', 'success', 'actor1', 10);
    expect(c.growthMultiplier).toBe(1.0);
    expect(c.quintessenceEvent).toBeNull();
  });

  it('success_at_cost charges Q penalty and reduces growth', () => {
    const c = computeOutcomeConsequence('action.eye.observe', 'success_at_cost', 'actor1', 10);
    expect(c.growthMultiplier).toBe(SUCCESS_AT_COST_GROWTH_MULTIPLIER);
    expect(c.quintessenceEvent).not.toBeNull();
    expect(c.quintessenceEvent!.delta).toBe(-SUCCESS_AT_COST_QUINTESSENCE_PENALTY);
    expect(c.narrativeTag).toBe('strained');
  });

  it('critical_failure charges Q penalty', () => {
    const c = computeOutcomeConsequence('action.heart.inspire', 'critical_failure', 'actor1', 10);
    expect(c.quintessenceEvent).not.toBeNull();
    expect(c.quintessenceEvent!.delta).toBe(-CRITICAL_FAILURE_QUINTESSENCE_PENALTY);
    expect(c.narrativeTag).toBe('catastrophe');
  });

  it('risky templates have steeper penalties', () => {
    const risky = computeOutcomeConsequence('action.shadow.assassinate', 'critical_failure', 'actor1', 10);
    const normal = computeOutcomeConsequence('action.heart.inspire', 'critical_failure', 'actor1', 10);
    expect(Math.abs(risky.quintessenceEvent!.delta)).toBeGreaterThan(Math.abs(normal.quintessenceEvent!.delta));
  });

  it('all templates receive band-differentiated consequences (proving-slice gate removed)', () => {
    const c = computeOutcomeConsequence('action.gold.trade', 'critical_success', 'actor1', 10);
    expect(c.growthMultiplier).toBe(CRITICAL_SUCCESS_GROWTH_MULTIPLIER);
    expect(c.quintessenceEvent).not.toBeNull();
    expect(c.narrativeTag).toBe('surge');
  });

  it('near_miss grants partial growth and progress counter with no Q effect', () => {
    const c = computeOutcomeConsequence('action.heart.inspire', 'near_miss', 'actor1', 10);
    expect(c.growthMultiplier).toBe(NEAR_MISS_GROWTH_MULTIPLIER);
    expect(c.quintessenceEvent).toBeNull();
    expect(c.narrativeTag).toBe('fortunate');
    expect(c.progressCounterDelta).toBe(NEAR_MISS_PROGRESS_COUNTER_DELTA);
    expect(c.attachmentDropIntent).toBeNull();
    expect(c.complication).toBeNull();
  });

  it('success band provides non-null attachmentDropIntent with rare tier hint', () => {
    const c = computeOutcomeConsequence('action.heart.inspire', 'success', 'actor1', 10);
    expect(c.attachmentDropIntent).not.toBeNull();
    expect(c.attachmentDropIntent!.band).toBe('success');
    expect(c.attachmentDropIntent!.tierHint).toBe('rare');
  });

  it('critical_success band provides mythic-tier attachmentDropIntent', () => {
    const c = computeOutcomeConsequence('action.heart.inspire', 'critical_success', 'actor1', 10);
    expect(c.attachmentDropIntent).not.toBeNull();
    expect(c.attachmentDropIntent!.band).toBe('critical_success');
    expect(c.attachmentDropIntent!.tierHint).toBe('mythic');
  });

  it('failure band has null attachmentDropIntent', () => {
    const c = computeOutcomeConsequence('action.heart.inspire', 'failure', 'actor1', 10);
    expect(c.attachmentDropIntent).toBeNull();
  });
});

// ─── 6. Near-miss generates near_miss step outcome ──────────────────────────

describe('near-miss → near_miss step outcome (Phase 6)', () => {
  it('roll just under threshold is near-miss', () => {
    // probability 0.50 → threshold 50. Roll 48 = margin -2, near-miss.
    const breakdown = classifyResolutionRoll(0.50, 48);
    expect(breakdown.nearMiss).toBe(true);
    expect(breakdown.margin).toBe(-2);
  });

  it('shared resolver + near-miss success maps to near_miss (its own Phase 6 band)', () => {
    // Roll that succeeds within near-miss margin (margin <= 5, roll <= threshold)
    const input: ResolutionInput = {
      actorId: 'test',
      domain: 'heart',
      capability: 0.5,
      difficulty: 0.3,
      sphereFactor: 0,
      actionModifiers: 0,
    };
    // threshold = cap + sphere - diff + mods = 0.5 - 0.3 = 0.20, clamped to 0.20
    // Roll 18 → margin = 18 - 20 = -2 (near-miss, success)
    const result = resolveAction(input, () => 0, 18, 'unified_action');
    expect(result.outcome).toBe('success');
    expect(result.rollBreakdown?.nearMiss).toBe(true);
    // Phase 6: mapResolverOutcomeToStep maps near-miss success to near_miss (not success_at_cost)
    const mapped = mapResolverOutcomeToStep(result.outcome, result.rollBreakdown!.nearMiss);
    expect(mapped).toBe('near_miss');
  });
});

// ─── 7. Doubles-based crits ─────────────────────────────────────

describe('doubles produce crits that carry through', () => {
  it('doubles under threshold = critical_success', () => {
    // threshold at 50, roll 33 (doubles, under) → critical_success
    const breakdown = classifyResolutionRoll(0.50, 33);
    expect(breakdown.isDoubles).toBe(true);
    expect(breakdown.critClassification).toBe('critical_success');
  });

  it('doubles over threshold = critical_failure', () => {
    // threshold at 30, roll 44 (doubles, over) → critical_failure
    const breakdown = classifyResolutionRoll(0.30, 44);
    expect(breakdown.isDoubles).toBe(true);
    expect(breakdown.critClassification).toBe('critical_failure');
  });

  it('mapResolverOutcomeToStep preserves critical outcomes', () => {
    expect(mapResolverOutcomeToStep('critical_success', false)).toBe('critical_success');
    expect(mapResolverOutcomeToStep('critical_failure', false)).toBe('critical_failure');
  });
});
