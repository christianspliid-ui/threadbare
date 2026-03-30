import { describe, it, expect } from 'vitest';
import {
  TIER_NAMES,
  TIER_MAINTENANCE,
  TIER_PROMOTION_THRESHOLDS,
  BASE_ESSENCE_PER_TICK,
  ESSENCE_PER_WORSHIPPER,
  ESSENCE_PER_PLACE_OF_POWER,
  BASE_MAX_ESSENCE,
  MAX_ESSENCE_PER_WORSHIPPER,
  RECRUIT_COST,
  DISCOVER_COST,
  OBSERVE_COST,
} from '../influence-content';

describe('influence-content', () => {
  it('exports tier names for tiers 0-4', () => {
    expect(Object.keys(TIER_NAMES)).toHaveLength(5);
    expect(TIER_NAMES[0]).toBe('Unaware');
    expect(TIER_NAMES[1]).toBe('Touched');
    expect(TIER_NAMES[2]).toBe('Devoted');
    expect(TIER_NAMES[3]).toBe('Champion');
    expect(TIER_NAMES[4]).toBe('Aspect');
  });

  it('exports tier maintenance costs', () => {
    expect(TIER_MAINTENANCE[0]).toBe(0);
    expect(TIER_MAINTENANCE[1]).toBe(0.5);
    expect(TIER_MAINTENANCE[2]).toBe(1.0);
    expect(TIER_MAINTENANCE[3]).toBe(2.0);
    expect(TIER_MAINTENANCE[4]).toBe(4.0);
  });

  it('exports promotion thresholds', () => {
    expect(TIER_PROMOTION_THRESHOLDS[0]).toBe(0);
    expect(TIER_PROMOTION_THRESHOLDS[1]).toBe(0);
    expect(TIER_PROMOTION_THRESHOLDS[2]).toBe(30);
    expect(TIER_PROMOTION_THRESHOLDS[3]).toBe(90);
    expect(TIER_PROMOTION_THRESHOLDS[4]).toBe(180);
  });

  it('exports economy constants', () => {
    expect(BASE_ESSENCE_PER_TICK).toBe(1.0);
    expect(ESSENCE_PER_WORSHIPPER).toBe(0.1);
    expect(ESSENCE_PER_PLACE_OF_POWER).toBe(0.5);
    expect(BASE_MAX_ESSENCE).toBe(50);
    expect(MAX_ESSENCE_PER_WORSHIPPER).toBe(5);
  });

  it('exports action cost constants', () => {
    expect(RECRUIT_COST).toBe(5);
    expect(DISCOVER_COST).toBe(1);
    expect(OBSERVE_COST).toBe(0.5);
  });
});
