import { describe, it, expect } from 'vitest';
import {
  computeProbability,
  classifyForecast,
  resolveAction,
  resolveContestedAction,
} from '../resolution';

describe('Resolution System', () => {
  describe('computeProbability', () => {
    it('clamps to [0.05, 0.95]', () => {
      expect(computeProbability(1.0, 0.2, 0.0, 0.2)).toBeLessThanOrEqual(0.95);
      expect(computeProbability(0.0, 0.0, 1.0, -0.2)).toBeGreaterThanOrEqual(0.05);
    });

    it('higher capability means higher probability', () => {
      const pLow = computeProbability(0.3, 0.0, 0.5, 0.0);
      const pHigh = computeProbability(0.7, 0.0, 0.5, 0.0);
      expect(pHigh).toBeGreaterThan(pLow);
    });

    it('higher difficulty means lower probability', () => {
      const pEasy = computeProbability(0.5, 0.0, 0.2, 0.0);
      const pHard = computeProbability(0.5, 0.0, 0.8, 0.0);
      expect(pEasy).toBeGreaterThan(pHard);
    });

    it('sphere factor boosts probability', () => {
      const pBase = computeProbability(0.5, 0.0, 0.5, 0.0);
      const pBoosted = computeProbability(0.5, 0.2, 0.5, 0.0);
      expect(pBoosted).toBeGreaterThan(pBase);
    });
  });

  describe('classifyForecast', () => {
    it('classifies probability ranges correctly', () => {
      expect(classifyForecast(0.10)).toBe('doomed');
      expect(classifyForecast(0.30)).toBe('perilous');
      expect(classifyForecast(0.50)).toBe('uncertain');
      expect(classifyForecast(0.70)).toBe('favorable');
      expect(classifyForecast(0.90)).toBe('fated');
    });
  });

  describe('resolveAction', () => {
    it('returns a valid outcome with deterministic roll', () => {
      const result = resolveAction(0.60, 45); // P=60%, roll=45 → success
      expect(result.outcome).toBe('success');
      expect(result.roll).toBe(45);
      expect(result.probability).toBe(0.60);
    });

    it('critical success when roll <= P * 10', () => {
      const result = resolveAction(0.60, 3); // P=60%, crit threshold=6
      expect(result.outcome).toBe('critical_success');
    });

    it('critical failure when roll >= 96', () => {
      const result = resolveAction(0.60, 98);
      expect(result.outcome).toBe('critical_failure');
    });

    it('failure when roll > P * 100', () => {
      const result = resolveAction(0.40, 55); // P=40%, roll=55 → failure
      expect(result.outcome).toBe('failure');
    });

    it('uses random roll when none provided', () => {
      const result = resolveAction(0.50);
      expect(result.roll).toBeGreaterThanOrEqual(1);
      expect(result.roll).toBeLessThanOrEqual(100);
    });
  });

  describe('resolveContestedAction', () => {
    it('returns contested outcome based on two independent rolls', () => {
      const result = resolveContestedAction(
        0.70, 30,  // attacker: P=70%, roll=30 → success
        0.40, 55,  // defender: P=40%, roll=55 → failure
      );
      expect(result.attacker.outcome).toBe('success');
      expect(result.defender.outcome).toBe('failure');
      expect(result.contestOutcome).toBe('attacker_wins');
    });

    it('stalemate when both succeed', () => {
      const result = resolveContestedAction(0.70, 30, 0.70, 30);
      expect(result.contestOutcome).toBe('stalemate');
    });

    it('mutual failure when both fail', () => {
      const result = resolveContestedAction(0.30, 80, 0.30, 80);
      expect(result.contestOutcome).toBe('mutual_failure');
    });
  });
});
