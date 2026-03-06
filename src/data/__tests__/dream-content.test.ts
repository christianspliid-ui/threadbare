import { describe, it, expect } from 'vitest';
import {
  MANIPULATION_DEFINITIONS,
  INTERVENTION_DEFINITIONS,
  TIER_MODIFIERS,
  DELIVERY_RANGE,
  LOCAL_ENCOUNTER,
} from '../dream-content';

describe('dream-content', () => {
  it('exports 6 manipulation definitions', () => {
    expect(Object.keys(MANIPULATION_DEFINITIONS)).toHaveLength(6);
  });

  it('each manipulation has required fields', () => {
    for (const def of Object.values(MANIPULATION_DEFINITIONS)) {
      expect(def.type).toBeTruthy();
      expect(typeof def.baseCost).toBe('number');
      expect(typeof def.riskLevel).toBe('number');
      expect(def.description).toBeTruthy();
    }
  });

  it('exports 8 intervention definitions', () => {
    expect(Object.keys(INTERVENTION_DEFINITIONS)).toHaveLength(8);
  });

  it('each intervention has required fields', () => {
    for (const def of Object.values(INTERVENTION_DEFINITIONS)) {
      expect(def.type).toBeTruthy();
      expect(def.sphereAffinities.length).toBeGreaterThanOrEqual(1);
      expect(typeof def.baseCost).toBe('number');
      expect(typeof def.detectionRisk).toBe('number');
      expect(def.description).toBeTruthy();
      expect(def.deliveryMode).toBeTruthy();
    }
  });

  it('exports tier modifiers for all actor types', () => {
    expect(TIER_MODIFIERS.individual).toBe(1.0);
    expect(TIER_MODIFIERS.god).toBe(10.0);
  });

  it('exports delivery range constants', () => {
    expect(DELIVERY_RANGE.deceive).toBe(3);
    expect(DELIVERY_RANGE.intimidate).toBe(3);
    expect(DELIVERY_RANGE.inspire).toBe(5);
  });

  it('exports local encounter constants', () => {
    expect(LOCAL_ENCOUNTER.visitImpactBonus).toBe(1.15);
    expect(LOCAL_ENCOUNTER.summonEssenceCost).toBe(1);
  });
});
