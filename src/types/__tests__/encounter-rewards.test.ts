import { describe, it, expect } from 'vitest';
import type { EncounterOutcome } from '../encounter';

describe('EncounterOutcome reward pool', () => {
  it('supports optional rewardPool recipe', () => {
    const outcome: EncounterOutcome = {
      narrative: 'The merchant offers a gift.',
      rewardPool: {
        categoryWeights: { possession: 0.8, condition: 0.2 },
        tierCurve: { 1: 0.5, 2: 0.3, 3: 0.15, 4: 0.05 },
        badOutcomeChance: 0.1,
      },
    };
    expect(outcome.rewardPool).toBeDefined();
    expect(outcome.rewardPool!.categoryWeights.possession).toBe(0.8);
  });

  it('still works without rewardPool (backward compatible)', () => {
    const outcome: EncounterOutcome = {
      narrative: 'Nothing of note.',
    };
    expect(outcome.rewardPool).toBeUndefined();
  });
});
