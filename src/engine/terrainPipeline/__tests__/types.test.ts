import { describe, it, expect } from 'vitest';
import {
  CONTINENT_COUNT_MIN, CONTINENT_COUNT_MAX,
  LAND_TARGET_MIN, LAND_TARGET_MAX,
  FAULT_COUNT_MIN, FAULT_COUNT_MAX,
  RIVER_SOURCE_COUNT,
  LAKE_SIZE_MAX, GREAT_LAKE_SIZE_MAX,
  REGION_SIZE_MIN,
  LATITUDE_EQUATOR_ROW,
  WIND_DIRECTION,
  MOISTURE_COAST_BONUS,
  MOUNTAIN_SPINE_WIDTH,
} from '../types';

describe('terrainPipeline types', () => {
  it('continent count range is sane', () => {
    expect(CONTINENT_COUNT_MIN).toBeGreaterThanOrEqual(2);
    expect(CONTINENT_COUNT_MAX).toBeLessThanOrEqual(6);
    expect(CONTINENT_COUNT_MIN).toBeLessThan(CONTINENT_COUNT_MAX);
  });

  it('land coverage targets are percentages', () => {
    expect(LAND_TARGET_MIN).toBeGreaterThan(0.3);
    expect(LAND_TARGET_MAX).toBeLessThan(0.8);
  });

  it('all tunable constants are positive numbers', () => {
    const constants = [
      FAULT_COUNT_MIN, FAULT_COUNT_MAX,
      RIVER_SOURCE_COUNT,
      LAKE_SIZE_MAX, GREAT_LAKE_SIZE_MAX,
      REGION_SIZE_MIN,
      LATITUDE_EQUATOR_ROW,
      MOISTURE_COAST_BONUS,
      MOUNTAIN_SPINE_WIDTH,
    ];
    for (const c of constants) {
      expect(typeof c).toBe('number');
      expect(c).toBeGreaterThan(0);
    }
  });
});
