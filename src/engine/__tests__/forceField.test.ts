import { describe, it, expect } from 'vitest';
import { generateGeoField } from '../forceField';
import { createBalancedCosmology } from '../cosmology';

describe('generateGeoField', () => {
  const cols = 10;
  const rows = 10;

  it('returns a Map with entries for each coordinate', () => {
    const field = generateGeoField(cols, rows, 42);
    expect(field.size).toBe(cols * rows);
  });

  it('each GeoParams has elevation, temperature, moisture in [0, 1]', () => {
    const field = generateGeoField(cols, rows, 42);
    for (const params of field.values()) {
      expect(params.elevation).toBeGreaterThanOrEqual(0);
      expect(params.elevation).toBeLessThanOrEqual(1);
      expect(params.temperature).toBeGreaterThanOrEqual(0);
      expect(params.temperature).toBeLessThanOrEqual(1);
      expect(params.moisture).toBeGreaterThanOrEqual(0);
      expect(params.moisture).toBeLessThanOrEqual(1);
    }
  });

  it('is deterministic with same seed', () => {
    const a = generateGeoField(cols, rows, 42);
    const b = generateGeoField(cols, rows, 42);
    expect(a).toEqual(b);
  });

  it('varies with different seeds', () => {
    const a = generateGeoField(cols, rows, 42);
    const b = generateGeoField(cols, rows, 99);
    let different = false;
    for (const [key, paramsA] of a) {
      const paramsB = b.get(key);
      if (
        paramsB &&
        (Math.abs(paramsA.elevation - paramsB.elevation) > 0.001 ||
          Math.abs(paramsA.temperature - paramsB.temperature) > 0.001 ||
          Math.abs(paramsA.moisture - paramsB.moisture) > 0.001)
      ) {
        different = true;
        break;
      }
    }
    expect(different).toBe(true);
  });

  it('applies cosmology bias (energy -> higher temperature)', () => {
    const baseField = generateGeoField(cols, rows, 42);
    const highEnergyCosmology = { ...createBalancedCosmology(), energy: 0.5 };
    const biasedField = generateGeoField(cols, rows, 42, highEnergyCosmology);

    let tempHigher = 0;
    for (const [key, baseParams] of baseField) {
      const biasedParams = biasedField.get(key);
      if (biasedParams && biasedParams.temperature > baseParams.temperature) {
        tempHigher++;
      }
    }
    expect(tempHigher).toBeGreaterThan(cols * rows * 0.3);
  });
});
