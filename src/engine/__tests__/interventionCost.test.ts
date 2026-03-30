import { describe, it, expect } from 'vitest';
import {
  computeInterventionCost,
  triangularCost,
  computeSphereMultiplier,
  INTERVENTION_MAX_BONUS,
  OPPOSING_SPHERE_COST_MULTIPLIER,
  NEUTRAL_SPHERE_COST_MULTIPLIER,
  BOND_EFFICIENCY,
} from '../interventionCost';
import type { DivineAttention } from '../divineAttention';

const NO_ATTENTION: DivineAttention = { level: 'none', costDiscount: 0, efficiencyBoost: 0 };

// --- Tests ---

describe('triangularCost', () => {
  it('returns correct triangular numbers', () => {
    expect(triangularCost(1)).toBe(1);
    expect(triangularCost(2)).toBe(3);
    expect(triangularCost(3)).toBe(6);
    expect(triangularCost(5)).toBe(15);
    expect(triangularCost(10)).toBe(55);
    expect(triangularCost(15)).toBe(120);
    expect(triangularCost(20)).toBe(210);
  });

  it('returns 0 for 0 or negative', () => {
    expect(triangularCost(0)).toBe(0);
    expect(triangularCost(-5)).toBe(0);
  });
});

describe('computeSphereMultiplier', () => {
  it('returns 1.0 for matching spheres', () => {
    expect(computeSphereMultiplier('life', 'life')).toBe(1.0);
  });

  it('returns opposing multiplier for opposed spheres', () => {
    expect(computeSphereMultiplier('life', 'entropy')).toBe(OPPOSING_SPHERE_COST_MULTIPLIER);
  });

  it('returns neutral multiplier for unrelated spheres', () => {
    expect(computeSphereMultiplier('life', 'force')).toBe(NEUTRAL_SPHERE_COST_MULTIPLIER);
  });

  it('returns 1.0 when encounter has no sphere', () => {
    expect(computeSphereMultiplier('life', undefined)).toBe(1.0);
  });

  it('returns neutral when agent has no sphere', () => {
    expect(computeSphereMultiplier(undefined, 'life')).toBe(NEUTRAL_SPHERE_COST_MULTIPLIER);
  });
});

describe('computeInterventionCost', () => {
  it('computes basic cost with aligned spheres', () => {
    const result = computeInterventionCost(0.05, 'life', 'life', 2, NO_ATTENTION);
    expect(result.probabilityBonus).toBe(0.05);
    expect(result.essenceCost).toBe(15); // triangular(5) = 15, multiplier 1.0
    expect(result.sphereMultiplier).toBe(1.0);
    expect(result.bondEfficiency).toBe(BOND_EFFICIENCY[2]);
    expect(result.effectiveBonus).toBeCloseTo(0.05 * 0.6);
  });

  it('applies opposing sphere multiplier', () => {
    const result = computeInterventionCost(0.05, 'life', 'entropy', 2, NO_ATTENTION);
    expect(result.sphereMultiplier).toBe(OPPOSING_SPHERE_COST_MULTIPLIER);
    expect(result.essenceCost).toBe(Math.ceil(15 * OPPOSING_SPHERE_COST_MULTIPLIER));
  });

  it('clamps bonus to INTERVENTION_MAX_BONUS', () => {
    const result = computeInterventionCost(0.50, 'life', 'life', 4, NO_ATTENTION);
    expect(result.probabilityBonus).toBe(INTERVENTION_MAX_BONUS);
  });

  it('uses unbonded efficiency for tier 0', () => {
    const result = computeInterventionCost(0.10, 'mind', 'mind', 0, NO_ATTENTION);
    expect(result.bondEfficiency).toBe(0.2);
    expect(result.effectiveBonus).toBeCloseTo(0.10 * 0.2);
  });

  it('applies divine attention cost discount', () => {
    const attention: DivineAttention = { level: 'attuned', costDiscount: 0.3, efficiencyBoost: 0 };
    const withDiscount = computeInterventionCost(0.05, 'life', 'life', 2, attention);
    const without = computeInterventionCost(0.05, 'life', 'life', 2, NO_ATTENTION);
    expect(withDiscount.essenceCost).toBeLessThan(without.essenceCost);
  });

  it('applies divine attention efficiency boost', () => {
    const attention: DivineAttention = { level: 'focused', costDiscount: 0, efficiencyBoost: 0.4 };
    const result = computeInterventionCost(0.10, 'life', 'life', 2, attention);
    // Bond efficiency = 0.6 + 0.4 efficiency boost = 1.0
    expect(result.effectiveBonus).toBeCloseTo(0.10 * 1.0);
  });

  it('returns 0 cost for 0 bonus', () => {
    const result = computeInterventionCost(0, 'life', 'life', 2, NO_ATTENTION);
    expect(result.essenceCost).toBe(0);
    expect(result.effectiveBonus).toBe(0);
  });

  it('falls back to unbonded efficiency for unknown tier', () => {
    const result = computeInterventionCost(0.05, 'life', 'life', 99, NO_ATTENTION);
    expect(result.bondEfficiency).toBe(BOND_EFFICIENCY[0]);
  });
});
