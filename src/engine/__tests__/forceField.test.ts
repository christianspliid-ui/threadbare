import { describe, it, expect } from 'vitest';
import { generateForceField } from '../forceField';
import { createBalancedCosmology } from '../cosmology';
import { FORCE_NAMES } from '../../types';

describe('generateForceField', () => {
  const cosmology = createBalancedCosmology();
  const coords = [
    { col: 0, row: 0 },
    { col: 1, row: 0 },
    { col: 0, row: 1 },
    { col: 5, row: 5 },
  ];

  it('returns a ForceVector for each input coordinate', () => {
    const field = generateForceField(coords, cosmology, 42);
    expect(field).toHaveLength(coords.length);
  });

  it('each ForceVector sums to approximately 1.0', () => {
    const field = generateForceField(coords, cosmology, 42);
    for (const fv of field) {
      const sum = FORCE_NAMES.reduce((s, f) => s + fv[f], 0);
      expect(sum).toBeCloseTo(1.0, 1);
    }
  });

  it('all force values are between 0 and 1', () => {
    const field = generateForceField(coords, cosmology, 42);
    for (const fv of field) {
      for (const f of FORCE_NAMES) {
        expect(fv[f]).toBeGreaterThanOrEqual(0);
        expect(fv[f]).toBeLessThanOrEqual(1);
      }
    }
  });

  it('is deterministic with same seed', () => {
    const a = generateForceField(coords, cosmology, 42);
    const b = generateForceField(coords, cosmology, 42);
    expect(a).toEqual(b);
  });

  it('varies with different seeds', () => {
    const a = generateForceField(coords, cosmology, 42);
    const b = generateForceField(coords, cosmology, 99);
    const same = a.every((fv, i) =>
      FORCE_NAMES.every(f => Math.abs(fv[f] - b[i][f]) < 0.001)
    );
    expect(same).toBe(false);
  });
});
