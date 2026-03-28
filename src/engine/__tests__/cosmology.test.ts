import { describe, it, expect } from 'vitest';
import {
  createBalancedCosmology,
  normalizeCosmology,
  COSMOLOGY_PRESETS,
} from '../cosmology';
import { SPHERE_NAMES, type CosmologyProfile } from '../../types';

describe('createBalancedCosmology', () => {
  it('returns equal weights summing to 1.0', () => {
    const c = createBalancedCosmology();
    const sum = SPHERE_NAMES.reduce((s, sp) => s + c[sp], 0);
    expect(sum).toBeCloseTo(1.0);
    expect(c.force).toBeCloseTo(1 / 12);
    expect(c.chaos).toBeCloseTo(1 / 12);
  });
});

describe('normalizeCosmology', () => {
  it('normalizes weights to sum to 1.0', () => {
    const raw: CosmologyProfile = {
      chaos: 1, order: 1, light: 1, darkness: 1,
      force: 2, matter: 3, energy: 1, life: 2,
      mind: 2, spirit: 1, time: 1, entropy: 1,
    };
    const n = normalizeCosmology(raw);
    const sum = SPHERE_NAMES.reduce((s, sp) => s + n[sp], 0);
    expect(sum).toBeCloseTo(1.0);
    expect(n.matter).toBeCloseTo(3 / 17);
  });

  it('handles all-zero input by returning balanced', () => {
    const raw: CosmologyProfile = {
      chaos: 0, order: 0, light: 0, darkness: 0,
      force: 0, matter: 0, energy: 0, life: 0,
      mind: 0, spirit: 0, time: 0, entropy: 0,
    };
    const n = normalizeCosmology(raw);
    expect(n.force).toBeCloseTo(1 / 12);
  });
});

describe('COSMOLOGY_PRESETS', () => {
  it('all presets sum to 1.0', () => {
    for (const [name, preset] of Object.entries(COSMOLOGY_PRESETS)) {
      const sum = SPHERE_NAMES.reduce((s, sp) => s + preset[sp], 0);
      expect(sum, `Preset "${name}" doesn't sum to 1.0`).toBeCloseTo(1.0);
    }
  });
});
