import { describe, it, expect } from 'vitest';
import type { KnowledgeLevel, FamiliarityGainSource, SphereFamiliarityBonus } from '../familiarity';
import {
  KNOWLEDGE_LEVELS,
  FAMILIARITY_THRESHOLDS,
  FAMILIARITY_GAINS,
  SPHERE_FAMILIARITY_BONUSES,
} from '../familiarity';

describe('familiarity types', () => {
  describe('KNOWLEDGE_LEVELS', () => {
    it('exports 5 knowledge levels in progression order', () => {
      expect(KNOWLEDGE_LEVELS).toHaveLength(5);
      expect(KNOWLEDGE_LEVELS).toEqual([
        'stranger',
        'recognised',
        'known',
        'intimate',
        'transparent',
      ]);
    });

    it('all levels are strings', () => {
      for (const level of KNOWLEDGE_LEVELS) {
        expect(typeof level).toBe('string');
      }
    });
  });

  describe('FAMILIARITY_THRESHOLDS', () => {
    it('has thresholds for all 5 knowledge levels', () => {
      expect(Object.keys(FAMILIARITY_THRESHOLDS)).toHaveLength(5);
    });

    it('maps each knowledge level to a threshold value', () => {
      const levels: KnowledgeLevel[] = [
        'stranger',
        'recognised',
        'known',
        'intimate',
        'transparent',
      ];
      for (const level of levels) {
        expect(FAMILIARITY_THRESHOLDS[level]).toBeDefined();
        expect(typeof FAMILIARITY_THRESHOLDS[level]).toBe('number');
      }
    });

    it('has correct threshold values', () => {
      expect(FAMILIARITY_THRESHOLDS.stranger).toBe(0.0);
      expect(FAMILIARITY_THRESHOLDS.recognised).toBe(0.2);
      expect(FAMILIARITY_THRESHOLDS.known).toBe(0.4);
      expect(FAMILIARITY_THRESHOLDS.intimate).toBe(0.6);
      expect(FAMILIARITY_THRESHOLDS.transparent).toBe(0.8);
    });

    it('thresholds are monotonically increasing', () => {
      const values = KNOWLEDGE_LEVELS.map(level => FAMILIARITY_THRESHOLDS[level]);
      for (let i = 1; i < values.length; i++) {
        expect(values[i]).toBeGreaterThan(values[i - 1]);
      }
    });

    it('all thresholds are between 0.0 and 1.0', () => {
      for (const value of Object.values(FAMILIARITY_THRESHOLDS)) {
        expect(value).toBeGreaterThanOrEqual(0.0);
        expect(value).toBeLessThanOrEqual(1.0);
      }
    });
  });

  describe('FAMILIARITY_GAINS', () => {
    it('has 7 familiarity gain sources', () => {
      expect(Object.keys(FAMILIARITY_GAINS)).toHaveLength(7);
    });

    it('covers all required gain sources', () => {
      const sources: FamiliarityGainSource[] = [
        'worship_tier_1',
        'worship_tier_2',
        'worship_tier_3',
        'proximity',
        'scry',
        'narrative_contact',
        'dilemma',
      ];
      for (const source of sources) {
        expect(FAMILIARITY_GAINS[source]).toBeDefined();
        expect(typeof FAMILIARITY_GAINS[source]).toBe('number');
      }
    });

    it('has correct gain values', () => {
      expect(FAMILIARITY_GAINS.worship_tier_1).toBe(0.3);
      expect(FAMILIARITY_GAINS.worship_tier_2).toBe(0.5);
      expect(FAMILIARITY_GAINS.worship_tier_3).toBe(0.7);
      expect(FAMILIARITY_GAINS.proximity).toBe(0.01);
      expect(FAMILIARITY_GAINS.scry).toBe(0.15);
      expect(FAMILIARITY_GAINS.narrative_contact).toBe(0.05);
      expect(FAMILIARITY_GAINS.dilemma).toBe(0.10);
    });

    it('all gains are positive and reasonable', () => {
      for (const value of Object.values(FAMILIARITY_GAINS)) {
        expect(value).toBeGreaterThan(0.0);
        expect(value).toBeLessThanOrEqual(1.0);
      }
    });

    it('worship tier gains increase in order', () => {
      expect(FAMILIARITY_GAINS.worship_tier_1).toBeLessThan(FAMILIARITY_GAINS.worship_tier_2);
      expect(FAMILIARITY_GAINS.worship_tier_2).toBeLessThan(FAMILIARITY_GAINS.worship_tier_3);
    });
  });

  describe('SPHERE_FAMILIARITY_BONUSES', () => {
    it('has entries for eye, shadow, and heart spheres', () => {
      expect(SPHERE_FAMILIARITY_BONUSES.eye).toBeDefined();
      expect(SPHERE_FAMILIARITY_BONUSES.shadow).toBeDefined();
      expect(SPHERE_FAMILIARITY_BONUSES.heart).toBeDefined();
    });

    it('eye has multiplier bonus', () => {
      const eyeBonus = SPHERE_FAMILIARITY_BONUSES.eye as SphereFamiliarityBonus;
      expect(eyeBonus.multiplier).toBe(1.5);
      expect(typeof eyeBonus.multiplier).toBe('number');
    });

    it('shadow has revealTraitsEarly boolean', () => {
      const shadowBonus = SPHERE_FAMILIARITY_BONUSES.shadow as SphereFamiliarityBonus;
      expect(shadowBonus.revealTraitsEarly).toBe(1);
      expect(typeof shadowBonus.revealTraitsEarly).toBe('number');
    });

    it('heart has revealBondsEarly boolean', () => {
      const heartBonus = SPHERE_FAMILIARITY_BONUSES.heart as SphereFamiliarityBonus;
      expect(heartBonus.revealBondsEarly).toBe(1);
      expect(typeof heartBonus.revealBondsEarly).toBe('number');
    });

    it('each bonus is a valid SphereFamiliarityBonus object', () => {
      for (const [sphere, bonus] of Object.entries(SPHERE_FAMILIARITY_BONUSES)) {
        expect(bonus).toBeInstanceOf(Object);
        // At least one property should be defined
        const hasProperty =
          bonus.multiplier !== undefined ||
          bonus.revealTraitsEarly !== undefined ||
          bonus.revealBondsEarly !== undefined;
        expect(hasProperty, `${sphere} bonus has no properties`).toBe(true);
      }
    });
  });

  describe('type validation', () => {
    it('KnowledgeLevel type matches KNOWLEDGE_LEVELS array', () => {
      const levels: KnowledgeLevel[] = KNOWLEDGE_LEVELS;
      expect(levels).toBeDefined();
    });

    it('FamiliarityGainSource type covers all FAMILIARITY_GAINS keys', () => {
      const gains: Record<FamiliarityGainSource, number> = FAMILIARITY_GAINS;
      expect(gains).toBeDefined();
    });

    it('SphereFamiliarityBonus objects are correctly typed', () => {
      const bonuses: Record<string, SphereFamiliarityBonus> = SPHERE_FAMILIARITY_BONUSES;
      expect(bonuses).toBeDefined();
    });
  });
});
