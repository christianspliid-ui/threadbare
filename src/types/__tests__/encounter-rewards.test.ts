import { describe, it, expect } from 'vitest';
import type { EncounterOutcome } from '../encounter';

describe('EncounterOutcome reward pool', () => {
  it('supports optional rewardPool recipe (template-level, no tierCurve)', () => {
    const outcome: EncounterOutcome = {
      narrative: 'The merchant offers a gift.',
      rewardPool: {
        categoryWeights: { possession: 0.8, condition: 0.2 },
      },
    };
    expect(outcome.rewardPool).toBeDefined();
    expect(outcome.rewardPool!.categoryWeights.possession).toBe(0.8);
  });

  it('supports rewardPool with tagFilters', () => {
    const outcome: EncounterOutcome = {
      narrative: 'You find treasure among the ruins.',
      rewardPool: {
        categoryWeights: { possession: 0.7, condition: 0.3 },
        tagFilters: ['#ancient', '#cursed'],
      },
    };
    expect(outcome.rewardPool!.tagFilters).toContain('#ancient');
  });

  it('still works without rewardPool (backward compatible)', () => {
    const outcome: EncounterOutcome = {
      narrative: 'Nothing of note.',
    };
    expect(outcome.rewardPool).toBeUndefined();
  });
});
