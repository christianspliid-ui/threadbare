import { describe, it, expect } from 'vitest';
import {
  spherePowerMultiplier,
  scaledEffect,
  scaledCost,
} from '../sphereScaling';
import { MAX_SPHERE_SCORE } from '../../types/sphereAffinity';
import {
  SIGNATURE_SCALE_FLOOR,
  SIGNATURE_SCALE_CEIL,
} from '../../data/reach-signature-content';

describe('sphereScaling — spherePowerMultiplier', () => {
  it('returns the floor at score 0', () => {
    expect(spherePowerMultiplier(0)).toBeCloseTo(SIGNATURE_SCALE_FLOOR, 10);
  });

  it('returns the ceil at MAX_SPHERE_SCORE', () => {
    expect(spherePowerMultiplier(MAX_SPHERE_SCORE)).toBeCloseTo(SIGNATURE_SCALE_CEIL, 10);
  });

  it('returns the midpoint at half the max score', () => {
    const mid = (SIGNATURE_SCALE_FLOOR + SIGNATURE_SCALE_CEIL) / 2;
    expect(spherePowerMultiplier(MAX_SPHERE_SCORE / 2)).toBeCloseTo(mid, 10);
  });

  it('is monotonically non-decreasing across the full score range', () => {
    let prev = -Infinity;
    for (let score = 0; score <= MAX_SPHERE_SCORE; score++) {
      const mult = spherePowerMultiplier(score);
      expect(mult).toBeGreaterThanOrEqual(prev);
      prev = mult;
    }
  });

  it('stays within [floor, ceil] for every in-range score', () => {
    for (let score = 0; score <= MAX_SPHERE_SCORE; score++) {
      const mult = spherePowerMultiplier(score);
      expect(mult).toBeGreaterThanOrEqual(SIGNATURE_SCALE_FLOOR);
      expect(mult).toBeLessThanOrEqual(SIGNATURE_SCALE_CEIL);
    }
  });

  it('clamps out-of-range scores fail-soft (no multiplier outside the band)', () => {
    expect(spherePowerMultiplier(-5)).toBeCloseTo(SIGNATURE_SCALE_FLOOR, 10);
    expect(spherePowerMultiplier(MAX_SPHERE_SCORE + 100)).toBeCloseTo(SIGNATURE_SCALE_CEIL, 10);
  });
});

describe('sphereScaling — scaledEffect', () => {
  it('scales the base directly by the multiplier', () => {
    expect(scaledEffect(10, 2)).toBe(20);
    expect(scaledEffect(10, 0.6)).toBeCloseTo(6, 10);
    expect(scaledEffect(10, 1)).toBe(10);
  });

  it('shrinks the effect at the floor multiplier', () => {
    const effect = scaledEffect(100, spherePowerMultiplier(0));
    expect(effect).toBeLessThan(100);
    expect(effect).toBeCloseTo(100 * SIGNATURE_SCALE_FLOOR, 10);
  });
});

describe('sphereScaling — scaledCost', () => {
  it('never drops the cost below base (multiplier floored at 1)', () => {
    expect(scaledCost(10, 0.6)).toBe(10);
    expect(scaledCost(10, 0.99)).toBe(10);
    expect(scaledCost(10, spherePowerMultiplier(0))).toBe(10);
  });

  it('scales the cost up for multipliers above 1', () => {
    expect(scaledCost(10, 2)).toBe(20);
    expect(scaledCost(10, spherePowerMultiplier(MAX_SPHERE_SCORE))).toBeCloseTo(
      10 * SIGNATURE_SCALE_CEIL,
      10,
    );
  });

  it('leaves cost at base when the multiplier is exactly 1', () => {
    expect(scaledCost(10, 1)).toBe(10);
  });
});
