import { describe, it, expect } from 'vitest';
import {
  createBalancedCosmology,
  normalizeCosmology,
  COSMOLOGY_PRESETS,
} from '../cosmology';
import { FORCE_NAMES, type CosmologyProfile } from '../../types';

describe('createBalancedCosmology', () => {
  it('returns equal weights summing to 1.0', () => {
    const c = createBalancedCosmology();
    const sum = FORCE_NAMES.reduce((s, f) => s + c[f], 0);
    expect(sum).toBeCloseTo(1.0);
    expect(c.aether).toBeCloseTo(0.2);
    expect(c.verdance).toBeCloseTo(0.2);
  });
});

describe('normalizeCosmology', () => {
  it('normalizes weights to sum to 1.0', () => {
    const raw: CosmologyProfile = { aether: 2, verdance: 3, ignis: 1, umbra: 2, terra: 2 };
    const n = normalizeCosmology(raw);
    const sum = FORCE_NAMES.reduce((s, f) => s + n[f], 0);
    expect(sum).toBeCloseTo(1.0);
    expect(n.verdance).toBeCloseTo(0.3);
  });

  it('handles all-zero input by returning balanced', () => {
    const raw: CosmologyProfile = { aether: 0, verdance: 0, ignis: 0, umbra: 0, terra: 0 };
    const n = normalizeCosmology(raw);
    expect(n.aether).toBeCloseTo(0.2);
  });
});

describe('COSMOLOGY_PRESETS', () => {
  it('all presets sum to 1.0', () => {
    for (const [name, preset] of Object.entries(COSMOLOGY_PRESETS)) {
      const sum = FORCE_NAMES.reduce((s, f) => s + preset[f], 0);
      expect(sum, `Preset "${name}" doesn't sum to 1.0`).toBeCloseTo(1.0);
    }
  });
});
