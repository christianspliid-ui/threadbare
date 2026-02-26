import { describe, it, expect } from 'vitest';
import { classifyTerrain, deriveTileProperties } from '../terrain';
import type { ForceVector } from '../../types';

describe('classifyTerrain', () => {
  it('returns crystal_wastes for aether-dominant', () => {
    const fv: ForceVector = { aether: 0.6, verdance: 0.1, ignis: 0.1, umbra: 0.1, terra: 0.1 };
    expect(classifyTerrain(fv)).toBe('crystal_wastes');
  });

  it('returns enchanted_grove for aether + verdance secondary', () => {
    const fv: ForceVector = { aether: 0.4, verdance: 0.25, ignis: 0.1, umbra: 0.1, terra: 0.15 };
    expect(classifyTerrain(fv)).toBe('enchanted_grove');
  });

  it('returns contested_ground when no force dominates', () => {
    const fv: ForceVector = { aether: 0.20, verdance: 0.20, ignis: 0.20, umbra: 0.20, terra: 0.20 };
    expect(classifyTerrain(fv)).toBe('contested_ground');
  });

  it('returns deep_forest for verdance-dominant', () => {
    const fv: ForceVector = { aether: 0.05, verdance: 0.7, ignis: 0.05, umbra: 0.1, terra: 0.1 };
    expect(classifyTerrain(fv)).toBe('deep_forest');
  });
});

describe('deriveTileProperties', () => {
  it('returns elevation, moisture, and magicDensity in [0,1]', () => {
    const fv: ForceVector = { aether: 0.3, verdance: 0.2, ignis: 0.1, umbra: 0.1, terra: 0.3 };
    const props = deriveTileProperties(fv);
    expect(props.elevation).toBeGreaterThanOrEqual(0);
    expect(props.elevation).toBeLessThanOrEqual(1);
    expect(props.moisture).toBeGreaterThanOrEqual(0);
    expect(props.moisture).toBeLessThanOrEqual(1);
    expect(props.magicDensity).toBeGreaterThanOrEqual(0);
    expect(props.magicDensity).toBeLessThanOrEqual(1);
  });

  it('terra-heavy hex has high elevation', () => {
    const fv: ForceVector = { aether: 0.05, verdance: 0.05, ignis: 0.05, umbra: 0.05, terra: 0.8 };
    const props = deriveTileProperties(fv);
    expect(props.elevation).toBeGreaterThan(0.5);
  });
});
