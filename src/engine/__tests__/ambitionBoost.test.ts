import { describe, it, expect } from 'vitest';
import {
  computeAmbitionBoost,
  applyAmbitionBoost,
  PRIMARY_AMBITION_WEIGHT,
  SECONDARY_AMBITION_WEIGHT,
  type ActiveAmbitionForScoring,
} from '../ambitionBoost';
import type { ActionCandidate } from '../../types/agent';

describe('ambitionBoost', () => {
  const ironCandidate: ActionCandidate = {
    templateId: 'march',
    targetId: 'fort',
    domain: 'iron',
    score: 1.0,
    motivations: ['courage_prudence'],
  };

  const goldCandidate: ActionCandidate = {
    templateId: 'trade',
    targetId: 'market',
    domain: 'gold',
    score: 0.5,
    motivations: ['greed_generosity'],
  };

  const shadowCandidate: ActionCandidate = {
    templateId: 'spy',
    targetId: 'rival',
    domain: 'shadow',
    score: 0.8,
    motivations: ['cunning_honesty'],
  };

  describe('computeAmbitionBoost', () => {
    it('returns 0 when no ambitions', () => {
      expect(computeAmbitionBoost(ironCandidate, [])).toBe(0);
    });

    it('boosts candidates matching primary ambition reach affinity', () => {
      const ambitions: ActiveAmbitionForScoring[] = [
        { reachAffinity: { iron: 0.8 }, priority: 'primary' },
      ];
      const boost = computeAmbitionBoost(ironCandidate, ambitions);
      expect(boost).toBeCloseTo(PRIMARY_AMBITION_WEIGHT * 0.8);
    });

    it('primary gets more boost than secondary', () => {
      const primaryAmbitions: ActiveAmbitionForScoring[] = [
        { reachAffinity: { iron: 0.8 }, priority: 'primary' },
      ];
      const secondaryAmbitions: ActiveAmbitionForScoring[] = [
        { reachAffinity: { iron: 0.8 }, priority: 'secondary' },
      ];
      const primaryBoost = computeAmbitionBoost(ironCandidate, primaryAmbitions);
      const secondaryBoost = computeAmbitionBoost(ironCandidate, secondaryAmbitions);
      expect(primaryBoost).toBeGreaterThan(secondaryBoost);
      expect(primaryBoost).toBeCloseTo(PRIMARY_AMBITION_WEIGHT * 0.8);
      expect(secondaryBoost).toBeCloseTo(SECONDARY_AMBITION_WEIGHT * 0.8);
    });

    it('returns zero boost for unrelated actions (different domain)', () => {
      const ambitions: ActiveAmbitionForScoring[] = [
        { reachAffinity: { iron: 0.8 }, priority: 'primary' },
      ];
      // gold candidate has no iron affinity in the ambition
      const boost = computeAmbitionBoost(goldCandidate, ambitions);
      expect(boost).toBe(0);
    });

    it('combines primary and secondary boosts', () => {
      const ambitions: ActiveAmbitionForScoring[] = [
        { reachAffinity: { iron: 0.8, gold: 0.3 }, priority: 'primary' },
        { reachAffinity: { iron: 0.5 }, priority: 'secondary' },
      ];
      const boost = computeAmbitionBoost(ironCandidate, ambitions);
      const expected =
        PRIMARY_AMBITION_WEIGHT * 0.8 + SECONDARY_AMBITION_WEIGHT * 0.5;
      expect(boost).toBeCloseTo(expected);
    });
  });

  describe('applyAmbitionBoost', () => {
    it('returns candidates unchanged when no ambitions', () => {
      const candidates = [ironCandidate, goldCandidate];
      const result = applyAmbitionBoost(candidates, []);
      expect(result).toBe(candidates); // same reference — no copy needed
    });

    it('adds boost to candidate scores', () => {
      const ambitions: ActiveAmbitionForScoring[] = [
        { reachAffinity: { iron: 1.0 }, priority: 'primary' },
      ];
      const candidates = [ironCandidate, goldCandidate, shadowCandidate];
      const result = applyAmbitionBoost(candidates, ambitions);

      // iron candidate gets boosted
      expect(result[0].score).toBeCloseTo(
        ironCandidate.score + PRIMARY_AMBITION_WEIGHT * 1.0,
      );
      // gold and shadow candidates unchanged (no affinity for those domains)
      expect(result[1].score).toBe(goldCandidate.score);
      expect(result[2].score).toBe(shadowCandidate.score);
    });
  });
});
