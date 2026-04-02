/**
 * Tests for balanceTargets.ts — versioned target definitions.
 */

import { describe, it, expect } from 'vitest';
import {
  DEFAULT_BALANCE_TARGETS,
  BALANCE_TARGETS_VERSION,
  getDefaultBalanceTargets,
  getTargetBands,
  getTargetBand,
} from '../balanceTargets';
import type { BalanceTargets } from '../../types/balanceEval';

describe('DEFAULT_BALANCE_TARGETS', () => {
  it('has a non-empty version string', () => {
    expect(DEFAULT_BALANCE_TARGETS.version).toBeTruthy();
    expect(DEFAULT_BALANCE_TARGETS.version).toBe(BALANCE_TARGETS_VERSION);
  });

  it('has a description', () => {
    expect(DEFAULT_BALANCE_TARGETS.description).toBeTruthy();
  });

  it('has at least one band per core metric family', () => {
    const metricIds = new Set(DEFAULT_BALANCE_TARGETS.bands.map(b => b.metricId));
    expect(metricIds.has('step_success_rate')).toBe(true);
    expect(metricIds.has('completion_rate')).toBe(true);
    expect(metricIds.has('fail_forward_share')).toBe(true);
    expect(metricIds.has('quintessence_recovery_per_100_ticks')).toBe(true);
    expect(metricIds.has('durable_rewards_per_100_encounters')).toBe(true);
    expect(metricIds.has('time_to_first_reward')).toBe(true);
    expect(metricIds.has('time_to_first_setback')).toBe(true);
    expect(metricIds.has('time_to_first_growth_beat')).toBe(true);
  });

  it('has step_success_rate bands for all core threat tiers', () => {
    const scopes = DEFAULT_BALANCE_TARGETS.bands
      .filter(b => b.metricId === 'step_success_rate')
      .map(b => b.scope);
    expect(scopes).toContain('trivial');
    expect(scopes).toContain('easy');
    expect(scopes).toContain('moderate');
    expect(scopes).toContain('hard');
    expect(scopes).toContain('deadly');
    expect(scopes).toContain('epic');
  });

  it('all bands have valid min <= max', () => {
    for (const b of DEFAULT_BALANCE_TARGETS.bands) {
      expect(b.min).toBeLessThanOrEqual(b.max);
    }
  });

  it('all bands have non-empty metricId and label', () => {
    for (const b of DEFAULT_BALANCE_TARGETS.bands) {
      expect(b.metricId).toBeTruthy();
      expect(b.label).toBeTruthy();
    }
  });

  it('warnBelow (if set) is >= min', () => {
    for (const b of DEFAULT_BALANCE_TARGETS.bands) {
      if (b.warnBelow !== undefined) {
        expect(b.warnBelow).toBeGreaterThanOrEqual(b.min - 0.001);
      }
    }
  });

  it('warnAbove (if set) is <= max', () => {
    for (const b of DEFAULT_BALANCE_TARGETS.bands) {
      if (b.warnAbove !== undefined) {
        expect(b.warnAbove).toBeLessThanOrEqual(b.max + 0.001);
      }
    }
  });
});

describe('getDefaultBalanceTargets()', () => {
  it('returns the DEFAULT_BALANCE_TARGETS object', () => {
    const targets = getDefaultBalanceTargets();
    expect(targets).toBe(DEFAULT_BALANCE_TARGETS);
  });

  it('is structurally valid as BalanceTargets', () => {
    const targets: BalanceTargets = getDefaultBalanceTargets();
    expect(targets.version).toBeTruthy();
    expect(Array.isArray(targets.bands)).toBe(true);
    expect(targets.bands.length).toBeGreaterThan(0);
  });
});

describe('getTargetBands()', () => {
  it('returns all bands for a metric when no scope is provided', () => {
    const bands = getTargetBands('step_success_rate');
    expect(bands.length).toBeGreaterThanOrEqual(5);
  });

  it('returns only bands matching the scope', () => {
    const bands = getTargetBands('step_success_rate', 'easy');
    expect(bands.every(b => b.scope === 'easy')).toBe(true);
  });

  it('returns empty array for unknown metricId', () => {
    const bands = getTargetBands('nonexistent_metric_xyz');
    expect(bands).toEqual([]);
  });
});

describe('getTargetBand()', () => {
  it('returns the correct band for metricId + scope', () => {
    const b = getTargetBand('step_success_rate', 'moderate');
    expect(b).not.toBeNull();
    expect(b!.metricId).toBe('step_success_rate');
    expect(b!.scope).toBe('moderate');
    // Moderate ideal zone: warnBelow=60%, warnAbove=75%; fail outside [55%, 78%]
    expect(b!.warnBelow).toBeCloseTo(0.60);
    expect(b!.warnAbove).toBeCloseTo(0.75);
    expect(b!.min).toBeCloseTo(0.55);
    expect(b!.max).toBeCloseTo(0.78);
  });

  it('returns null for unknown scope', () => {
    const b = getTargetBand('step_success_rate', 'legendary');
    expect(b).toBeNull();
  });
});
