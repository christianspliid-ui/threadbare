import { describe, it, expect } from 'vitest';
import {
  getFamiliarity,
  addFamiliarity,
  getKnowledgeLevel,
  checkThresholdCrossed,
  getEffectiveKnowledgeLevel,
} from '../familiarity';
import type { KnowledgeLevel, FamiliarityMap } from '../../types/familiarity';

describe('familiarity engine', () => {
  describe('getFamiliarity', () => {
    it('returns 0 for unknown objects', () => {
      const map: FamiliarityMap = new Map();
      expect(getFamiliarity(map, 'unknown-id')).toBe(0);
    });

    it('returns stored value for known objects', () => {
      const map: FamiliarityMap = new Map([['agent-1', 0.45]]);
      expect(getFamiliarity(map, 'agent-1')).toBe(0.45);
    });
  });

  describe('addFamiliarity', () => {
    it('adds to existing familiarity', () => {
      const map: FamiliarityMap = new Map([['agent-1', 0.3]]);
      const result = addFamiliarity(map, 'agent-1', 0.15);
      expect(result.get('agent-1')).toBeCloseTo(0.45);
    });

    it('creates entry for new objects', () => {
      const map: FamiliarityMap = new Map();
      const result = addFamiliarity(map, 'agent-1', 0.3);
      expect(result.get('agent-1')).toBe(0.3);
    });

    it('clamps to 1.0', () => {
      const map: FamiliarityMap = new Map([['agent-1', 0.9]]);
      const result = addFamiliarity(map, 'agent-1', 0.5);
      expect(result.get('agent-1')).toBe(1.0);
    });

    it('applies sphere multiplier', () => {
      const map: FamiliarityMap = new Map();
      const result = addFamiliarity(map, 'agent-1', 0.1, 1.5);
      expect(result.get('agent-1')).toBeCloseTo(0.15);
    });

    it('does not mutate original map', () => {
      const map: FamiliarityMap = new Map([['agent-1', 0.3]]);
      addFamiliarity(map, 'agent-1', 0.15);
      expect(map.get('agent-1')).toBe(0.3);
    });
  });

  describe('getKnowledgeLevel', () => {
    it('returns stranger for 0.0', () => {
      expect(getKnowledgeLevel(0.0)).toBe('stranger');
    });

    it('returns recognised for 0.2', () => {
      expect(getKnowledgeLevel(0.2)).toBe('recognised');
    });

    it('returns known for 0.4', () => {
      expect(getKnowledgeLevel(0.4)).toBe('known');
    });

    it('returns intimate for 0.6', () => {
      expect(getKnowledgeLevel(0.6)).toBe('intimate');
    });

    it('returns transparent for 0.8', () => {
      expect(getKnowledgeLevel(0.8)).toBe('transparent');
    });

    it('returns correct level for in-between values', () => {
      expect(getKnowledgeLevel(0.19)).toBe('stranger');
      expect(getKnowledgeLevel(0.39)).toBe('recognised');
      expect(getKnowledgeLevel(0.59)).toBe('known');
      expect(getKnowledgeLevel(0.79)).toBe('intimate');
      expect(getKnowledgeLevel(1.0)).toBe('transparent');
    });
  });

  describe('checkThresholdCrossed', () => {
    it('returns new level when threshold crossed', () => {
      expect(checkThresholdCrossed(0.15, 0.25)).toBe('recognised');
    });

    it('returns null when no threshold crossed', () => {
      expect(checkThresholdCrossed(0.21, 0.35)).toBeNull();
    });

    it('returns highest level when multiple crossed', () => {
      expect(checkThresholdCrossed(0.1, 0.5)).toBe('known');
    });
  });

  describe('getEffectiveKnowledgeLevel', () => {
    it('returns base level with no sphere bonus', () => {
      expect(getEffectiveKnowledgeLevel('known', undefined)).toBe('known');
    });

    it('sphere bonus does not change base level', () => {
      expect(getEffectiveKnowledgeLevel('known', 'eye')).toBe('known');
    });
  });
});
