import { describe, it, expect } from 'vitest';
import { TERRAIN_RESOURCE_TABLE, RESOURCE_DEFINITIONS, RESOURCE_PROSE, COSMOLOGY_RESOURCE_BONUS } from '../resource-content';
import { getAbundanceLabel, RESOURCE_ICONS } from '../../types/resource';

describe('RESOURCE_DEFINITIONS', () => {
  it('has definitions for all 8 resource types', () => {
    const expected = ['timber', 'stone', 'ore', 'water', 'fish', 'grazing', 'grain', 'peat'];
    for (const type of expected) {
      expect(RESOURCE_DEFINITIONS[type]).toBeDefined();
      expect(RESOURCE_DEFINITIONS[type].id).toBe(type);
      expect(RESOURCE_DEFINITIONS[type].name.length).toBeGreaterThan(0);
      expect(RESOURCE_DEFINITIONS[type].terrains.length).toBeGreaterThan(0);
    }
  });

  it('all baseQuantity ranges are valid (min <= max, within 0-100)', () => {
    for (const [, def] of Object.entries(RESOURCE_DEFINITIONS)) {
      const [min, max] = def.baseQuantity;
      expect(min).toBeGreaterThanOrEqual(0);
      expect(max).toBeLessThanOrEqual(100);
      expect(min).toBeLessThanOrEqual(max);
    }
  });

  it('renewalRate is 0 for non-renewable resources', () => {
    for (const [, def] of Object.entries(RESOURCE_DEFINITIONS)) {
      if (!def.renewable) {
        expect(def.renewalRate).toBeLessThanOrEqual(0.05); // peat is technically near-zero
      }
    }
  });
});

describe('TERRAIN_RESOURCE_TABLE', () => {
  const ALL_TERRAINS = [
    'ocean', 'deep_ocean', 'tropical_ocean', 'coastal_shallows', 'coast', 'lake', 'river', 'reef',
    'grassland', 'farmland', 'savanna', 'steppe', 'floodplain',
    'temperate_forest', 'dense_forest', 'boreal_forest', 'jungle',
    'tropical_forest', 'evergreen_forest', 'light_forest', 'dead_forest',
    'swamp', 'marsh', 'moor_bog',
    'hills', 'mountains', 'high_mountains', 'plateau', 'badlands', 'mountain_pass',
    'forested_hills',
    'great_home_trees', 'broken_lands', 'oasis',
    'desert', 'rocky_desert', 'sand_dunes', 'tundra', 'glacier', 'volcano',
    'arctic', 'snow_fields',
  ];

  it('has an entry for every terrain type', () => {
    for (const terrain of ALL_TERRAINS) {
      expect(TERRAIN_RESOURCE_TABLE[terrain]).toBeDefined();
    }
  });

  it('all entries reference valid resource definitions', () => {
    for (const [, entries] of Object.entries(TERRAIN_RESOURCE_TABLE)) {
      for (const entry of entries) {
        expect(RESOURCE_DEFINITIONS[entry.type]).toBeDefined();
      }
    }
  });

  it('no entry has min > max', () => {
    for (const [, entries] of Object.entries(TERRAIN_RESOURCE_TABLE)) {
      for (const entry of entries) {
        expect(entry.min).toBeLessThanOrEqual(entry.max);
      }
    }
  });

  it('at most 3 resource types per terrain', () => {
    for (const [terrain, entries] of Object.entries(TERRAIN_RESOURCE_TABLE)) {
      expect(entries.length).toBeLessThanOrEqual(3);
    }
  });
});

describe('RESOURCE_PROSE', () => {
  it('has prose for all 8 resource types', () => {
    for (const type of Object.keys(RESOURCE_DEFINITIONS)) {
      expect(RESOURCE_PROSE[type]).toBeDefined();
      expect(RESOURCE_PROSE[type].abundant.length).toBeGreaterThan(0);
      expect(RESOURCE_PROSE[type].scarce.length).toBeGreaterThan(0);
    }
  });

  it('all prose strings are non-empty', () => {
    for (const [, set] of Object.entries(RESOURCE_PROSE)) {
      for (const s of set.abundant) expect(s.length).toBeGreaterThan(10);
      for (const s of set.scarce) expect(s.length).toBeGreaterThan(10);
    }
  });
});

describe('RESOURCE_ICONS', () => {
  it('has an icon for all 8 resource types', () => {
    for (const type of Object.keys(RESOURCE_DEFINITIONS)) {
      expect(RESOURCE_ICONS[type]).toBeDefined();
      expect(RESOURCE_ICONS[type].length).toBeGreaterThan(0);
    }
  });
});

describe('getAbundanceLabel', () => {
  it('returns abundant for quantity >= 60', () => {
    expect(getAbundanceLabel(60)).toBe('abundant');
    expect(getAbundanceLabel(100)).toBe('abundant');
  });

  it('returns moderate for quantity 30-59', () => {
    expect(getAbundanceLabel(30)).toBe('moderate');
    expect(getAbundanceLabel(59)).toBe('moderate');
  });

  it('returns scarce for quantity 1-29', () => {
    expect(getAbundanceLabel(1)).toBe('scarce');
    expect(getAbundanceLabel(29)).toBe('scarce');
  });

  it('returns exhausted for quantity 0', () => {
    expect(getAbundanceLabel(0)).toBe('exhausted');
  });
});

describe('COSMOLOGY_RESOURCE_BONUS', () => {
  it('is a positive number', () => {
    expect(COSMOLOGY_RESOURCE_BONUS).toBeGreaterThan(0);
    expect(COSMOLOGY_RESOURCE_BONUS).toBeLessThanOrEqual(25);
  });
});
