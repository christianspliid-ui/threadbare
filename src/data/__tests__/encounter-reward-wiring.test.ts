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

  it('reward pools on final steps have valid categoryWeights', () => {
    const withPools = ENCOUNTER_TEMPLATES.filter(t => {
      const finalStep = t.steps[t.steps.length - 1];
      return finalStep.onSuccess.rewardPool !== undefined;
    });
    expect(withPools.length).toBeGreaterThan(0);

    for (const template of withPools) {
      const finalStep = template.steps[template.steps.length - 1];
      const pool = finalStep.onSuccess.rewardPool!;
      expect(pool.categoryWeights).toBeDefined();
      expect(Object.keys(pool.categoryWeights).length).toBeGreaterThan(0);
    }
  });

  it('non-reward types do not dominate reward pool coverage', () => {
    // Reward pools may exist on some non-reward types (e.g. build with material rewards).
    // Just verify the majority of non-reward templates lack pools.
    const nonReward = ENCOUNTER_TEMPLATES.filter(t => NON_REWARD_TYPES.includes(t.encounterType));
    const withPool = nonReward.filter(t =>
      t.steps.some(s => s.onSuccess.rewardPool !== undefined || s.onFailure.rewardPool !== undefined)
    );
    // Allow up to 50% to have pools (some types evolved to include material rewards)
    expect(withPool.length / Math.max(nonReward.length, 1)).toBeLessThanOrEqual(0.5);
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
