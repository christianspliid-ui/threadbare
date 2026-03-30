import { describe, it, expect } from 'vitest';
import {
  resolveHexAction,
  isHexTargetId,
  parseHexTargetId,
  HEX_BLESS_INFLUENCE_DELTA,
  HEX_CORRUPT_CORRUPTION_DELTA,
  HEX_SEED_INFLUENCE_DELTA,
  HEX_RAISE_LANDMARK_INFLUENCE_DELTA,
  HEX_SHIFT_SEASON_INFLUENCE_DELTA,
  HEX_SCORCH_EARTH_CORRUPTION_DELTA,
  HEX_REND_EARTH_CORRUPTION_DELTA,
  HEX_ATTUNE_LEYLINE_INFLUENCE_DELTA,
  HEX_SEVER_FLOW_CORRUPTION_DELTA,
  HEX_DISPEL_WILD_INFLUENCE_DELTA,
  HEX_SCATTER_CORRUPTION_DELTA,
  HEX_SMITE_CORRUPTION_DELTA,
  HEX_CONSECRATE_PAST_INFLUENCE_DELTA,
  HEX_BURY_PAST_CORRUPTION_DELTA,
  HEX_DESECRATE_CORRUPTION_DELTA,
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

  // TB-046: Land one-shot mutations
  it('returns divineInfluence mutation for raise_landmark on success', () => {
    const mutations = resolveHexAction('hex.raise_landmark', 2, 3, 'success', 1);
    expect(mutations).toHaveLength(1);
    expect(mutations[0].field).toBe('divineInfluence');
    expect(mutations[0].delta).toBe(HEX_RAISE_LANDMARK_INFLUENCE_DELTA);
  });

  it('returns divineInfluence mutation for shift_season on success', () => {
    const mutations = resolveHexAction('hex.shift_season', 1, 1, 'success', 1);
    expect(mutations).toHaveLength(1);
    expect(mutations[0].field).toBe('divineInfluence');
    expect(mutations[0].delta).toBe(HEX_SHIFT_SEASON_INFLUENCE_DELTA);
  });

  it('returns corruption mutation for scorch_earth on success', () => {
    const mutations = resolveHexAction('hex.scorch_earth', 4, 2, 'success', 1);
    expect(mutations).toHaveLength(1);
    expect(mutations[0].field).toBe('corruption');
    expect(mutations[0].delta).toBe(HEX_SCORCH_EARTH_CORRUPTION_DELTA);
  });

  it('returns corruption mutation for rend_earth on success', () => {
    const mutations = resolveHexAction('hex.rend_earth', 0, 0, 'success', 1);
    expect(mutations).toHaveLength(1);
    expect(mutations[0].field).toBe('corruption');
    expect(mutations[0].delta).toBe(HEX_REND_EARTH_CORRUPTION_DELTA);
  });

  it('returns empty array for dowse_resources (observation only)', () => {
    expect(resolveHexAction('hex.dowse_resources', 0, 0, 'success', 1)).toHaveLength(0);
  });

  it('returns empty array for sense_leylines (observation only)', () => {
    expect(resolveHexAction('hex.sense_leylines', 0, 0, 'success', 1)).toHaveLength(0);
  });

  // TB-046: Soul one-shot mutations
  it('returns divineInfluence mutation for attune_leyline on success', () => {
    const mutations = resolveHexAction('hex.attune_leyline', 5, 3, 'success', 1);
    expect(mutations).toHaveLength(1);
    expect(mutations[0].field).toBe('divineInfluence');
    expect(mutations[0].delta).toBe(HEX_ATTUNE_LEYLINE_INFLUENCE_DELTA);
  });

  it('returns corruption mutation for sever_flow on success', () => {
    const mutations = resolveHexAction('hex.sever_flow', 2, 2, 'success', 1);
    expect(mutations).toHaveLength(1);
    expect(mutations[0].field).toBe('corruption');
    expect(mutations[0].delta).toBe(HEX_SEVER_FLOW_CORRUPTION_DELTA);
  });

  it('returns divineInfluence mutation for dispel_wild on success', () => {
    const mutations = resolveHexAction('hex.dispel_wild', 1, 4, 'success', 1);
    expect(mutations).toHaveLength(1);
    expect(mutations[0].field).toBe('divineInfluence');
    expect(mutations[0].delta).toBe(HEX_DISPEL_WILD_INFLUENCE_DELTA);
  });

  it('returns empty array for read_currents (observation only)', () => {
    expect(resolveHexAction('hex.read_currents', 0, 0, 'success', 1)).toHaveLength(0);
  });

  it('returns no mutations for any new template on failure', () => {
    const templates = [
      'hex.raise_landmark', 'hex.shift_season', 'hex.scorch_earth', 'hex.rend_earth',
      'hex.attune_leyline', 'hex.sever_flow', 'hex.dispel_wild',
    ];
    for (const t of templates) {
      expect(resolveHexAction(t, 0, 0, 'failure', 1)).toHaveLength(0);
    }
  });

  // TB-047: People one-shot mutations
  it('returns corruption mutation for scatter on success', () => {
    const mutations = resolveHexAction('hex.scatter', 3, 1, 'success', 1);
    expect(mutations).toHaveLength(1);
    expect(mutations[0].field).toBe('corruption');
    expect(mutations[0].delta).toBe(HEX_SCATTER_CORRUPTION_DELTA);
  });

  it('returns corruption mutation for smite on success', () => {
    const mutations = resolveHexAction('hex.smite', 2, 4, 'success', 1);
    expect(mutations).toHaveLength(1);
    expect(mutations[0].field).toBe('corruption');
    expect(mutations[0].delta).toBe(HEX_SMITE_CORRUPTION_DELTA);
  });

  // TB-047: Ruins one-shot mutations
  it('returns divineInfluence mutation for consecrate_past on success', () => {
    const mutations = resolveHexAction('hex.consecrate_past', 1, 3, 'success', 1);
    expect(mutations).toHaveLength(1);
    expect(mutations[0].field).toBe('divineInfluence');
    expect(mutations[0].delta).toBe(HEX_CONSECRATE_PAST_INFLUENCE_DELTA);
  });

  it('returns corruption mutation for bury_past on success', () => {
    const mutations = resolveHexAction('hex.bury_past', 5, 2, 'success', 1);
    expect(mutations).toHaveLength(1);
    expect(mutations[0].field).toBe('corruption');
    expect(mutations[0].delta).toBe(HEX_BURY_PAST_CORRUPTION_DELTA);
  });

  it('returns corruption mutation for desecrate on success', () => {
    const mutations = resolveHexAction('hex.desecrate', 4, 4, 'success', 1);
    expect(mutations).toHaveLength(1);
    expect(mutations[0].field).toBe('corruption');
    expect(mutations[0].delta).toBe(HEX_DESECRATE_CORRUPTION_DELTA);
  });

  it('returns empty array for observation-only people/ruins templates', () => {
    const observationTemplates = [
      'hex.divine_populace', 'hex.scry_factions',
      'hex.read_stones', 'hex.whisper_intuition',
    ];
    for (const t of observationTemplates) {
      expect(resolveHexAction(t, 0, 0, 'success', 1)).toHaveLength(0);
    }
  });

  it('returns no mutations for TB-047 templates on failure', () => {
    const templates = [
      'hex.scatter', 'hex.smite', 'hex.consecrate_past',
      'hex.bury_past', 'hex.desecrate',
    ];
    for (const t of templates) {
      expect(resolveHexAction(t, 0, 0, 'failure', 1)).toHaveLength(0);
    }
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
