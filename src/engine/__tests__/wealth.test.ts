import { describe, it, expect } from 'vitest';
import {
  getWealthTier,
  applyWealthDelta,
  readWealth,
  WEALTH_TRADE_SUCCESS_MIN,
  WEALTH_TRADE_SUCCESS_MAX,
  WEALTH_ROUTE_CONTROL_INCOME,
  WEALTH_SUBLOCATION_INCOME,
  WEALTH_PROSPEROUS_HOME_INCOME,
  WEALTH_TRADE_FAILURE_MIN,
  WEALTH_TRADE_FAILURE_MAX,
  WEALTH_ROUTE_DISRUPTED_PENALTY,
  WEALTH_AGREEMENT_BROKEN_MIN,
  WEALTH_AGREEMENT_BROKEN_MAX,
  WEALTH_MERCENARY_COST,
  WEALTH_ASSASSINATION_COST,
  WEALTH_INFLUENCE_COST,
  WEALTH_CONSTRUCTION_COST,
  WEALTH_MONOPOLY_COST,
  WEALTH_TIER_MAGNATE,
  WEALTH_TIER_WEALTHY,
  WEALTH_TIER_COMFORTABLE,
  WEALTH_TIER_GETTING_BY,
} from '../wealth';

// ─── getWealthTier ────────────────────────────────────────────────────────

describe('getWealthTier', () => {
  it('returns Magnate at and above WEALTH_TIER_MAGNATE', () => {
    expect(getWealthTier(WEALTH_TIER_MAGNATE)).toBe('Magnate');
    expect(getWealthTier(100)).toBe('Magnate');
  });

  it('returns Wealthy between WEALTH_TIER_WEALTHY and WEALTH_TIER_MAGNATE', () => {
    expect(getWealthTier(WEALTH_TIER_WEALTHY)).toBe('Wealthy');
    expect(getWealthTier(WEALTH_TIER_MAGNATE - 1)).toBe('Wealthy');
  });

  it('returns Comfortable between WEALTH_TIER_COMFORTABLE and WEALTH_TIER_WEALTHY', () => {
    expect(getWealthTier(WEALTH_TIER_COMFORTABLE)).toBe('Comfortable');
    expect(getWealthTier(WEALTH_TIER_WEALTHY - 1)).toBe('Comfortable');
  });

  it('returns Getting by between WEALTH_TIER_GETTING_BY and WEALTH_TIER_COMFORTABLE', () => {
    expect(getWealthTier(WEALTH_TIER_GETTING_BY)).toBe('Getting by');
    expect(getWealthTier(WEALTH_TIER_COMFORTABLE - 1)).toBe('Getting by');
  });

  it('returns Destitute below WEALTH_TIER_GETTING_BY', () => {
    expect(getWealthTier(WEALTH_TIER_GETTING_BY - 1)).toBe('Destitute');
    expect(getWealthTier(0)).toBe('Destitute');
  });
});

// ─── applyWealthDelta ─────────────────────────────────────────────────────

describe('applyWealthDelta', () => {
  it('adds a positive delta correctly', () => {
    expect(applyWealthDelta(30, 10)).toBe(40);
  });

  it('subtracts a negative delta correctly', () => {
    expect(applyWealthDelta(30, -10)).toBe(20);
  });

  it('clamps to 0 when delta would go negative (fail-soft)', () => {
    expect(applyWealthDelta(5, -20)).toBe(0);
  });

  it('clamps to 100 maximum', () => {
    expect(applyWealthDelta(95, 20)).toBe(100);
  });

  it('handles zero delta', () => {
    expect(applyWealthDelta(50, 0)).toBe(50);
  });
});

// ─── readWealth ───────────────────────────────────────────────────────────

describe('readWealth', () => {
  it('reads a numeric wealth property', () => {
    expect(readWealth({ wealth: 42 })).toBe(42);
  });

  it('returns 0 when wealth property is missing (fail-soft)', () => {
    expect(readWealth({})).toBe(0);
  });

  it('returns 0 when wealth is not a number (fail-soft)', () => {
    expect(readWealth({ wealth: 'rich' })).toBe(0);
    expect(readWealth({ wealth: null })).toBe(0);
  });
});

// ─── Constants contract tests ─────────────────────────────────────────────

describe('wealth constants', () => {
  it('trade success range is valid (min ≤ max)', () => {
    expect(WEALTH_TRADE_SUCCESS_MIN).toBeGreaterThan(0);
    expect(WEALTH_TRADE_SUCCESS_MAX).toBeGreaterThanOrEqual(WEALTH_TRADE_SUCCESS_MIN);
  });

  it('trade failure range is valid (min ≤ max)', () => {
    expect(WEALTH_TRADE_FAILURE_MIN).toBeGreaterThan(0);
    expect(WEALTH_TRADE_FAILURE_MAX).toBeGreaterThanOrEqual(WEALTH_TRADE_FAILURE_MIN);
  });

  it('agreement broken range is valid', () => {
    expect(WEALTH_AGREEMENT_BROKEN_MIN).toBeGreaterThan(0);
    expect(WEALTH_AGREEMENT_BROKEN_MAX).toBeGreaterThanOrEqual(WEALTH_AGREEMENT_BROKEN_MIN);
  });

  it('all passive incomes are positive', () => {
    expect(WEALTH_ROUTE_CONTROL_INCOME).toBeGreaterThan(0);
    expect(WEALTH_SUBLOCATION_INCOME).toBeGreaterThan(0);
    expect(WEALTH_PROSPEROUS_HOME_INCOME).toBeGreaterThan(0);
  });

  it('route disrupted penalty is positive', () => {
    expect(WEALTH_ROUTE_DISRUPTED_PENALTY).toBeGreaterThan(0);
  });

  it('all spend costs are positive', () => {
    expect(WEALTH_MERCENARY_COST).toBeGreaterThan(0);
    expect(WEALTH_ASSASSINATION_COST).toBeGreaterThan(0);
    expect(WEALTH_INFLUENCE_COST).toBeGreaterThan(0);
    expect(WEALTH_CONSTRUCTION_COST).toBeGreaterThan(0);
    expect(WEALTH_MONOPOLY_COST).toBeGreaterThan(0);
  });

  it('tier thresholds are in ascending order', () => {
    expect(WEALTH_TIER_GETTING_BY).toBeLessThan(WEALTH_TIER_COMFORTABLE);
    expect(WEALTH_TIER_COMFORTABLE).toBeLessThan(WEALTH_TIER_WEALTHY);
    expect(WEALTH_TIER_WEALTHY).toBeLessThan(WEALTH_TIER_MAGNATE);
    expect(WEALTH_TIER_MAGNATE).toBeLessThanOrEqual(100);
  });

  it('monopoly costs more than hiring mercenaries (largest spend)', () => {
    expect(WEALTH_MONOPOLY_COST).toBeGreaterThan(WEALTH_MERCENARY_COST);
  });
});
