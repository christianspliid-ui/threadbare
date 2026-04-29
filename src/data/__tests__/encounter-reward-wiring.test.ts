/**
 * Verify that reward-eligible encounter templates have rewardPool on their final step.
 */
import { describe, it, expect } from 'vitest';
import { ENCOUNTER_TEMPLATES } from '../encounter-content';
import { isActionStepBranch } from '../../types/unifiedAction';

function getFinalStep(template: (typeof ENCOUNTER_TEMPLATES)[number]) {
  const raw = template.steps[template.steps.length - 1];
  return isActionStepBranch(raw) ? raw.fallback : raw;
}

describe('encounter reward pool wiring', () => {
  it('some encounters have rewardPool on final step successMetadata', () => {
    const withReward = ENCOUNTER_TEMPLATES.filter(t => {
      const finalStep = getFinalStep(t);
      return finalStep.successMetadata?.rewardPool !== undefined;
    });
    // At least some templates should have reward pools wired
    expect(withReward.length).toBeGreaterThan(0);
  });

  it('at least 60% of encounter templates have rewardPool wired on final step', () => {
    const withReward = ENCOUNTER_TEMPLATES.filter(t => {
      const finalStep = getFinalStep(t);
      return finalStep.successMetadata?.rewardPool !== undefined;
    });
    expect(withReward.length / ENCOUNTER_TEMPLATES.length).toBeGreaterThanOrEqual(0.6);
  });

  it('reward pools on final steps have valid categoryWeights', () => {
    const withPools = ENCOUNTER_TEMPLATES.filter(t => {
      const finalStep = getFinalStep(t);
      return finalStep.successMetadata?.rewardPool !== undefined;
    });
    expect(withPools.length).toBeGreaterThan(0);

    for (const template of withPools) {
      const finalStep = getFinalStep(template);
      const pool = finalStep.successMetadata!.rewardPool!;
      expect(pool.categoryWeights).toBeDefined();
      expect(Object.keys(pool.categoryWeights).length).toBeGreaterThan(0);
    }
  });

  it('reward pools do not contain tierCurve or badOutcomeChance (resolved at runtime)', () => {
    for (const template of ENCOUNTER_TEMPLATES) {
      for (const stepOrBranch of template.steps) {
        const step = isActionStepBranch(stepOrBranch) ? stepOrBranch.fallback : stepOrBranch;
        if (step.successMetadata?.rewardPool) {
          expect((step.successMetadata.rewardPool as Record<string, unknown>).tierCurve).toBeUndefined();
          expect((step.successMetadata.rewardPool as Record<string, unknown>).badOutcomeChance).toBeUndefined();
        }
        if (step.failureMetadata?.rewardPool) {
          expect((step.failureMetadata.rewardPool as Record<string, unknown>).tierCurve).toBeUndefined();
          expect((step.failureMetadata.rewardPool as Record<string, unknown>).badOutcomeChance).toBeUndefined();
        }
      }
    }
  });
});
