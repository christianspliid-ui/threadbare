/**
 * Verify that reward-eligible encounter templates have rewardPool on their final step.
 */
import { describe, it, expect } from 'vitest';
import { ENCOUNTER_TEMPLATES } from '../encounter-content';
import type { EncounterType } from '../../types/encounter';

const REWARD_ELIGIBLE_TYPES: EncounterType[] = [
  'acquire', 'steal', 'trade', 'create', 'explore', 'duel', 'assist',
];

const NON_REWARD_TYPES: EncounterType[] = [
  'hire', 'lead', 'build',
];

describe('encounter reward pool wiring', () => {
  it('reward-eligible encounters have rewardPool on final step onSuccess', () => {
    const eligible = ENCOUNTER_TEMPLATES.filter(t => REWARD_ELIGIBLE_TYPES.includes(t.encounterType));
    expect(eligible.length).toBeGreaterThan(0);

    const withReward = eligible.filter(t => {
      const finalStep = t.steps[t.steps.length - 1];
      return finalStep.onSuccess.rewardPool !== undefined;
    });

    // At least 80% of eligible encounters should have rewards
    expect(withReward.length / eligible.length).toBeGreaterThanOrEqual(0.8);
  });

  it('reward pools on final steps have same recipe on both onSuccess and onFailure', () => {
    const withRewards = ENCOUNTER_TEMPLATES.filter(t => {
      const finalStep = t.steps[t.steps.length - 1];
      return finalStep.onSuccess.rewardPool !== undefined;
    });

    for (const template of withRewards) {
      const finalStep = template.steps[template.steps.length - 1];
      const successPool = finalStep.onSuccess.rewardPool;
      const failurePool = finalStep.onFailure.rewardPool;

      expect(failurePool).toBeDefined();
      expect(successPool!.categoryWeights).toEqual(failurePool!.categoryWeights);
    }
  });

  it('non-reward types (hire/lead/build) do not have rewardPool', () => {
    const nonReward = ENCOUNTER_TEMPLATES.filter(t => NON_REWARD_TYPES.includes(t.encounterType));

    for (const template of nonReward) {
      for (const step of template.steps) {
        expect(step.onSuccess.rewardPool).toBeUndefined();
        expect(step.onFailure.rewardPool).toBeUndefined();
      }
    }
  });

  it('reward pools do not contain tierCurve or badOutcomeChance (resolved at runtime)', () => {
    for (const template of ENCOUNTER_TEMPLATES) {
      for (const step of template.steps) {
        if (step.onSuccess.rewardPool) {
          expect((step.onSuccess.rewardPool as Record<string, unknown>).tierCurve).toBeUndefined();
          expect((step.onSuccess.rewardPool as Record<string, unknown>).badOutcomeChance).toBeUndefined();
        }
        if (step.onFailure.rewardPool) {
          expect((step.onFailure.rewardPool as Record<string, unknown>).tierCurve).toBeUndefined();
          expect((step.onFailure.rewardPool as Record<string, unknown>).badOutcomeChance).toBeUndefined();
        }
      }
    }
  });
});
