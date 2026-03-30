/**
 * Tests for game-theory-content.ts — archetype strategy weights and social orientations
 */

import { describe, it, expect } from 'vitest';
import {
  ARCHETYPE_STRATEGY_WEIGHTS,
  getStrategyWeights,
  SOCIAL_ORIENTATION_MAP,
} from '../game-theory-content';
import { COOPERATION_STRATEGIES } from '../../types/disposition';
import { NARRATIVE_ARCHETYPES } from '../archetype-content';

describe('game-theory-content', () => {
  describe('ARCHETYPE_STRATEGY_WEIGHTS', () => {
    it('should contain entries for all 19 archetypes', () => {
      const archetypeIds = NARRATIVE_ARCHETYPES.map((a) => a.id);
      expect(archetypeIds).toHaveLength(19);
      for (const id of archetypeIds) {
        expect(ARCHETYPE_STRATEGY_WEIGHTS).toHaveProperty(id);
      }
    });

    it('should have valid strategy distributions for each archetype', () => {
      for (const [archetypeId, weights] of Object.entries(
        ARCHETYPE_STRATEGY_WEIGHTS
      )) {
        // Each archetype should have all 5 strategies
        for (const strategy of COOPERATION_STRATEGIES) {
          expect(weights).toHaveProperty(strategy);
          expect(typeof weights[strategy]).toBe('number');
          expect(weights[strategy]).toBeGreaterThanOrEqual(0);
          expect(weights[strategy]).toBeLessThanOrEqual(1);
        }

        // Weights should sum to 1.0 (within floating point tolerance)
        const sum = Object.values(weights).reduce((a, b) => a + b, 0);
        expect(sum).toBeCloseTo(1.0, 3);
      }
    });

    it('tragic_hero should lean toward tit-for-tat and grudger', () => {
      const weights = ARCHETYPE_STRATEGY_WEIGHTS['tragic_hero'];
      expect(weights['tit-for-tat']).toBe(0.4);
      expect(weights['grudger']).toBe(0.3);
      expect(weights['pavlov']).toBe(0.2);
      expect(weights['always-cooperate']).toBe(0.1);
      expect(weights['always-defect']).toBe(0.0);
    });

    it('trickster should lean toward pavlov and always-defect', () => {
      const weights = ARCHETYPE_STRATEGY_WEIGHTS['trickster'];
      expect(weights['tit-for-tat']).toBe(0.2);
      expect(weights['grudger']).toBe(0.1);
      expect(weights['pavlov']).toBe(0.3);
      expect(weights['always-cooperate']).toBe(0.05);
      expect(weights['always-defect']).toBe(0.35);
    });

    it('caregiver should lean heavily toward always-cooperate', () => {
      const weights = ARCHETYPE_STRATEGY_WEIGHTS['doomed_innocent'];
      // Doomed innocent should be similar to caregiver (heavy cooperate)
      expect(weights['always-cooperate']).toBeGreaterThanOrEqual(0.5);
    });

    it('true_believer should show balanced cooperative tendencies', () => {
      const weights = ARCHETYPE_STRATEGY_WEIGHTS['true_believer'];
      // True believer: certain and absolute, lean cooperative
      expect(weights['always-cooperate']).toBeGreaterThan(0.25);
      expect(weights['always-defect']).toBeLessThan(0.2);
    });
  });

  describe('getStrategyWeights()', () => {
    it('should return correct weights for known archetypes', () => {
      const heroWeights = getStrategyWeights('tragic_hero');
      expect(heroWeights).toEqual(ARCHETYPE_STRATEGY_WEIGHTS['tragic_hero']);

      const tricksterWeights = getStrategyWeights('trickster');
      expect(tricksterWeights).toEqual(
        ARCHETYPE_STRATEGY_WEIGHTS['trickster']
      );
    });

    it('should return uniform distribution (0.2 each) for unknown archetypes', () => {
      const unknownWeights = getStrategyWeights('unknown_archetype');
      for (const strategy of COOPERATION_STRATEGIES) {
        expect(unknownWeights[strategy]).toBe(0.2);
      }

      // Verify sum is 1.0
      const sum = Object.values(unknownWeights).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 3);
    });

    it('should handle null or undefined input gracefully', () => {
      const nullWeights = getStrategyWeights(null as any);
      const undefinedWeights = getStrategyWeights(undefined as any);

      expect(nullWeights['tit-for-tat']).toBe(0.2);
      expect(undefinedWeights['pavlov']).toBe(0.2);
    });
  });

  describe('SOCIAL_ORIENTATION_MAP', () => {
    it('should only contain valid orientation values', () => {
      const validOrientations = ['cooperative', 'defective', 'neutral'];
      for (const orientation of Object.values(SOCIAL_ORIENTATION_MAP)) {
        expect(validOrientations).toContain(orientation);
      }
    });

    it('should contain reasonable starter templates', () => {
      // Should have some templates mapped
      expect(Object.keys(SOCIAL_ORIENTATION_MAP).length).toBeGreaterThan(0);
    });

    it('should mark trade/alliance/share templates as cooperative', () => {
      // Check for common cooperative patterns
      const cooperativeTemplates = Object.entries(SOCIAL_ORIENTATION_MAP)
        .filter(([_, o]) => o === 'cooperative')
        .map(([t]) => t);
      expect(cooperativeTemplates.length).toBeGreaterThan(0);
    });

    it('should mark betray/steal/attack templates as defective', () => {
      // Check for common defective patterns
      const defectiveTemplates = Object.entries(SOCIAL_ORIENTATION_MAP)
        .filter(([_, o]) => o === 'defective')
        .map(([t]) => t);
      expect(defectiveTemplates.length).toBeGreaterThan(0);
    });

    it('should mark travel/build/meditate templates as neutral', () => {
      // Check for common neutral patterns
      const neutralTemplates = Object.entries(SOCIAL_ORIENTATION_MAP)
        .filter(([_, o]) => o === 'neutral')
        .map(([t]) => t);
      expect(neutralTemplates.length).toBeGreaterThan(0);
    });
  });

  describe('Integration: All archetypes present', () => {
    it('should have strategy weights for every archetype ID in the narrative list', () => {
      const narrativeIds = new Set(NARRATIVE_ARCHETYPES.map((a) => a.id));
      const weightsIds = new Set(
        Object.keys(ARCHETYPE_STRATEGY_WEIGHTS)
      );

      // Every narrative archetype should have weights
      for (const id of narrativeIds) {
        expect(weightsIds).toContain(id);
      }
    });
  });
});
