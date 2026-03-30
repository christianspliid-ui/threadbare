import { describe, it, expect } from 'vitest';
import {
  BIOME_CLIMATE_MAP,
  DEFAULT_CLIMATE,
  getClimateGroup,
  type ClimateGroup,
} from '../climate';

describe('climate types', () => {
  it('has 4 climate groups', () => {
    const groups = new Set(Object.values(BIOME_CLIMATE_MAP));
    expect(groups.size).toBe(4);
    expect(groups.has('cold')).toBe(true);
    expect(groups.has('temperate')).toBe(true);
    expect(groups.has('warm_dry')).toBe(true);
    expect(groups.has('warm_wet')).toBe(true);
  });

  it('DEFAULT_CLIMATE is temperate', () => {
    expect(DEFAULT_CLIMATE).toBe('temperate');
  });

  it('getClimateGroup returns correct group for known biomes', () => {
    expect(getClimateGroup('tundra')).toBe('cold');
    expect(getClimateGroup('forest')).toBe('temperate');
    expect(getClimateGroup('desert')).toBe('warm_dry');
    expect(getClimateGroup('jungle')).toBe('warm_wet');
  });

  it('getClimateGroup falls back to temperate for unknown biomes', () => {
    expect(getClimateGroup('mythical_realm' as any)).toBe('temperate');
  });

  it('every mapped biome has a valid climate group', () => {
    const validGroups: ClimateGroup[] = ['cold', 'temperate', 'warm_dry', 'warm_wet'];
    for (const group of Object.values(BIOME_CLIMATE_MAP)) {
      expect(validGroups).toContain(group);
    }
  });

  it('cold biomes include tundra, ice_field, glacier, mountain', () => {
    expect(BIOME_CLIMATE_MAP['tundra']).toBe('cold');
    expect(BIOME_CLIMATE_MAP['ice_field']).toBe('cold');
    expect(BIOME_CLIMATE_MAP['glacier']).toBe('cold');
    expect(BIOME_CLIMATE_MAP['mountain']).toBe('cold');
  });
});
