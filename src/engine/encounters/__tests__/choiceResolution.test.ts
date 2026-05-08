import { describe, expect, it } from 'vitest';
import { resolveEncounterChoice } from '../choiceResolution';
import type { PendingChoiceCommit } from '../../../types/gameState';

function makeCommit(overrides: Partial<PendingChoiceCommit> = {}): PendingChoiceCommit {
  return {
    agentId: 'agent-1',
    encounterId: 'enc-1',
    beatIndex: 0,
    reach: 'iron',
    cost: 'small_breath',
    moralAxisPole: 'virtue',
    effectiveProbability: 0.5,
    driftMagnitude: 0.04,
    ...overrides,
  };
}

function constantPrng(value: number): () => number {
  return () => value;
}

describe('resolveEncounterChoice', () => {
  describe('determinism', () => {
    it('produces identical results for the same prng seed', () => {
      const commit = makeCommit({ effectiveProbability: 0.6 });
      let callCount = 0;
      const prng = () => {
        callCount++;
        return 0.3;
      };
      const a = resolveEncounterChoice(commit, prng);
      callCount = 0;
      const prng2 = () => { callCount++; return 0.3; };
      const b = resolveEncounterChoice(commit, prng2);
      expect(a.outcomeBand).toBe(b.outcomeBand);
      expect(a.rolledD100).toBe(b.rolledD100);
    });
  });

  describe('d100 roll range', () => {
    it('produces rolledD100 in [1, 100]', () => {
      // prng returns 0 → roll = 1
      const c1 = resolveEncounterChoice(makeCommit(), constantPrng(0));
      expect(c1.rolledD100).toBe(1);

      // prng returns 0.999 → roll = 100
      const c2 = resolveEncounterChoice(makeCommit(), constantPrng(0.999));
      expect(c2.rolledD100).toBe(100);
    });
  });

  describe('outcome band: success zone', () => {
    it('returns critical_success for a roll well inside the success zone', () => {
      // p = 0.8, normalizedRoll = 0.10 → successRatio = 0.125 <= 0.3 → critical_success
      const outcome = resolveEncounterChoice(
        makeCommit({ effectiveProbability: 0.8 }),
        constantPrng(0.099), // roll = 10, normalized = 0.10
      );
      expect(outcome.outcomeBand).toBe('critical_success');
    });

    it('returns success for a roll in the upper success zone', () => {
      // p = 0.8, roll = 0.75 → successRatio = 0.9375 > 0.3 → success
      const outcome = resolveEncounterChoice(
        makeCommit({ effectiveProbability: 0.8 }),
        constantPrng(0.749), // roll = 75, normalized = 0.75
      );
      expect(outcome.outcomeBand).toBe('success');
    });
  });

  describe('outcome band: failure zone', () => {
    it('returns fail_forward for a roll just outside the success zone', () => {
      // p = 0.5, roll = 0.55 → failRatio = (0.55 - 0.5) / 0.5 = 0.1 <= 0.2 → fail_forward
      const outcome = resolveEncounterChoice(
        makeCommit({ effectiveProbability: 0.5 }),
        constantPrng(0.549), // roll = 55
      );
      expect(outcome.outcomeBand).toBe('fail_forward');
    });

    it('returns fail for a mid-range failure roll', () => {
      // p = 0.3, roll = 0.65 → failRatio = (0.65 - 0.3) / 0.7 = 0.5 → between 0.2 and 0.85 → fail
      const outcome = resolveEncounterChoice(
        makeCommit({ effectiveProbability: 0.3 }),
        constantPrng(0.649), // roll = 65
      );
      expect(outcome.outcomeBand).toBe('fail');
    });

    it('returns critical_fail for a roll in the top zone of failure', () => {
      // p = 0.1, roll = 0.99 → failRatio = (0.99 - 0.1) / 0.9 = 0.989 >= 0.85 → critical_fail
      const outcome = resolveEncounterChoice(
        makeCommit({ effectiveProbability: 0.1 }),
        constantPrng(0.989), // roll = 99
      );
      expect(outcome.outcomeBand).toBe('critical_fail');
    });
  });

  describe('probability clamping', () => {
    it('clamps effectiveProbability above 1.0', () => {
      const outcome = resolveEncounterChoice(
        makeCommit({ effectiveProbability: 1.5 }),
        constantPrng(0.5),
      );
      expect(outcome.effectiveProbability).toBe(1);
    });

    it('clamps effectiveProbability below 0.0', () => {
      const outcome = resolveEncounterChoice(
        makeCommit({ effectiveProbability: -0.3 }),
        constantPrng(0.5),
      );
      expect(outcome.effectiveProbability).toBe(0);
    });

    it('fails soft when effectiveProbability is NaN', () => {
      const outcome = resolveEncounterChoice(
        makeCommit({ effectiveProbability: Number.NaN }),
        constantPrng(0.5),
      );
      expect(outcome.outcomeBand).toBe('fail');
      expect(Number.isNaN(outcome.effectiveProbability)).toBe(true);
      expect(outcome.rolledD100).toBe(51);
    });
  });

  describe('fail-soft: undefined fields', () => {
    it('does not throw when reach is undefined', () => {
      expect(() => resolveEncounterChoice(
        makeCommit({ reach: undefined as never }),
        constantPrng(0.5),
      )).not.toThrow();
    });

    it('does not throw when moralAxisPole is undefined', () => {
      expect(() => resolveEncounterChoice(
        makeCommit({ moralAxisPole: undefined as never }),
        constantPrng(0.5),
      )).not.toThrow();
    });
  });

  describe('output fields', () => {
    it('preserves agentId, encounterId, beatIndex', () => {
      const commit = makeCommit({ agentId: 'agt', encounterId: 'enc-42', beatIndex: 3 });
      const outcome = resolveEncounterChoice(commit, constantPrng(0.3));
      expect(outcome.agentId).toBe('agt');
      expect(outcome.encounterId).toBe('enc-42');
      expect(outcome.beatIndex).toBe(3);
    });
  });
});
