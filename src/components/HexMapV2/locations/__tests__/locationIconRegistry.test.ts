/**
 * locationIconRegistry.test.ts — Unit tests for the location icon registry.
 *
 * Tests:
 * - All LocationType values are present in LOCATION_ICON_REGISTRY
 * - Each entry has a non-empty paths array, valid viewBox, and valid sizeClass
 * - LOCATION_SIZE_SCALE has correct values for all size classes
 */

import { describe, it, expect } from 'vitest';
import {
  LOCATION_ICON_REGISTRY,
  LOCATION_SIZE_SCALE,
  type LocationType,
} from '../locationIconRegistry';

const EXPECTED_LOCATION_TYPES: LocationType[] = [
  'capital',
  'city',
  'town',
  'hamlet',
  'castle',
  'fort',
  'tower',
  'temple',
  'shrine',
  'ruins',
  'ruined_city',
  'ruined_tower',
  'ruined_village',
  'mining',
  'camp',
  'battleground',
  'unexplored_poi',
  'lair',
  'cleared_lair',
  // Sphere-resonant wonder locations
  'healing_spring',
  'master_forge',
  'living_archive',
  'fey_crossing',
  'sacrifice_site',
  'convergence',
  'time_scar',
  'standing_stones',
  'shadow_hollow',
  'ley_nexus',
  // Wilderness interest locations
  'cavern',
  'grove',
  'hot_spring',
  'shipwreck',
  'ancient_road',
  'monument',
  // Natural anomalies (economy/treasure)
  'gem_deposit',
  'golden_grove',
  'crystal_cavern',
  'ancient_vault',
  'sunken_treasury',
  'herb_garden',
  'fossil_bed',
  'iron_seep',
  'pearl_shoal',
  'glowcap_hollow',
  // Monster/danger locations
  'nest',
  'haunted_ground',
  'corruption_zone',
  // Ruins layer (THR-153)
  'place_of_power',
];

describe('LOCATION_ICON_REGISTRY', () => {
  it('has entries for all LocationType values', () => {
    expect(Object.keys(LOCATION_ICON_REGISTRY)).toHaveLength(EXPECTED_LOCATION_TYPES.length);
    for (const type of EXPECTED_LOCATION_TYPES) {
      expect(LOCATION_ICON_REGISTRY).toHaveProperty(type);
    }
  });

  it('each entry has a non-empty paths array', () => {
    for (const [type, def] of Object.entries(LOCATION_ICON_REGISTRY)) {
      expect(def.paths.length, `${type} should have paths`).toBeGreaterThan(0);
      for (const path of def.paths) {
        expect(typeof path.d, `${type} path.d should be string`).toBe('string');
        expect(path.d.length, `${type} path.d should be non-empty`).toBeGreaterThan(0);
        expect(typeof path.opacity, `${type} path.opacity should be number`).toBe('number');
      }
    }
  });

  it('each entry has a valid viewBox string', () => {
    for (const [type, def] of Object.entries(LOCATION_ICON_REGISTRY)) {
      expect(typeof def.viewBox, `${type} viewBox should be string`).toBe('string');
      const parts = def.viewBox.split(' ').map(Number);
      expect(parts.length, `${type} viewBox should have 4 parts`).toBe(4);
      expect(parts[2], `${type} viewBox width > 0`).toBeGreaterThan(0);
      expect(parts[3], `${type} viewBox height > 0`).toBeGreaterThan(0);
    }
  });

  it('each entry has a valid sizeClass', () => {
    const validSizeClasses = new Set(['full', 'medium', 'small', 'tiny']);
    for (const [type, def] of Object.entries(LOCATION_ICON_REGISTRY)) {
      expect(
        validSizeClasses.has(def.sizeClass),
        `${type} sizeClass "${def.sizeClass}" is not valid`,
      ).toBe(true);
    }
  });
});

describe('LOCATION_SIZE_SCALE', () => {
  it('maps full=0.80, medium=0.60, small=0.40, tiny=0.25', () => {
    expect(LOCATION_SIZE_SCALE.full).toBe(0.80);
    expect(LOCATION_SIZE_SCALE.medium).toBe(0.60);
    expect(LOCATION_SIZE_SCALE.small).toBe(0.40);
    expect(LOCATION_SIZE_SCALE.tiny).toBe(0.25);
  });
});
