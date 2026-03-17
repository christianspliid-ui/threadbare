import { describe, it, expect } from 'vitest';
import {
  resolveHexAction,
  isHexTargetId,
  parseHexTargetId,
  HEX_BLESS_INFLUENCE_DELTA,
  HEX_CORRUPT_CORRUPTION_DELTA,
  HEX_SEED_INFLUENCE_DELTA,
} from '../hexActionBridge';

describe('resolveHexAction', () => {
  it('returns divineInfluence mutation for bless_land on success', () => {
    const mutations = resolveHexAction('hex.bless_land', 3, 5, 'success', 10);
    expect(mutations).toHaveLength(1);
    expect(mutations[0].field).toBe('divineInfluence');
    expect(mutations[0].delta).toBe(HEX_BLESS_INFLUENCE_DELTA);
    expect(mutations[0].col).toBe(3);
    expect(mutations[0].row).toBe(5);
    expect(mutations[0].source).toBe('hex.bless_land');
  });

  it('returns no mutation for bless_land on failure', () => {
    const mutations = resolveHexAction('hex.bless_land', 3, 5, 'failure', 10);
    expect(mutations).toHaveLength(0);
  });

  it('returns corruption mutation for corrupt_land on success', () => {
    const mutations = resolveHexAction('hex.corrupt_land', 1, 2, 'success', 5);
    expect(mutations).toHaveLength(1);
    expect(mutations[0].field).toBe('corruption');
    expect(mutations[0].delta).toBe(HEX_CORRUPT_CORRUPTION_DELTA);
  });

  it('returns large divineInfluence mutation for seed_life on success', () => {
    const mutations = resolveHexAction('hex.seed_life', 0, 0, 'success', 1);
    expect(mutations).toHaveLength(1);
    expect(mutations[0].field).toBe('divineInfluence');
    expect(mutations[0].delta).toBe(HEX_SEED_INFLUENCE_DELTA);
  });

  it('returns empty array for hex.survey (observation action, no mutation)', () => {
    const mutations = resolveHexAction('hex.survey', 0, 0, 'success', 1);
    expect(mutations).toHaveLength(0);
  });

  it('returns empty array for unknown template ID (fail-soft)', () => {
    const mutations = resolveHexAction('unknown.template', 0, 0, 'success', 1);
    expect(mutations).toHaveLength(0);
  });
});

describe('isHexTargetId', () => {
  it('returns true for valid hex target IDs', () => {
    expect(isHexTargetId('hex_0_0')).toBe(true);
    expect(isHexTargetId('hex_12_34')).toBe(true);
    expect(isHexTargetId('hex_100_200')).toBe(true);
  });

  it('returns false for non-hex IDs', () => {
    expect(isHexTargetId('loc_123')).toBe(false);
    expect(isHexTargetId('actor_abc')).toBe(false);
    expect(isHexTargetId('hex_a_b')).toBe(false);
    expect(isHexTargetId('hex_5')).toBe(false);
    expect(isHexTargetId('')).toBe(false);
  });
});

describe('parseHexTargetId', () => {
  it('parses valid hex target IDs', () => {
    expect(parseHexTargetId('hex_3_5')).toEqual({ col: 3, row: 5 });
    expect(parseHexTargetId('hex_0_0')).toEqual({ col: 0, row: 0 });
    expect(parseHexTargetId('hex_12_34')).toEqual({ col: 12, row: 34 });
  });

  it('returns null for invalid IDs', () => {
    expect(parseHexTargetId('loc_123')).toBeNull();
    expect(parseHexTargetId('hex_a_b')).toBeNull();
    expect(parseHexTargetId('')).toBeNull();
  });
});
