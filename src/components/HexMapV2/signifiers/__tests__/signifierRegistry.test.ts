import { describe, it, expect } from 'vitest';
import {
  SIGNIFIER_REGISTRY,
  TERRAIN_SIGNIFIER_FALLBACK,
  getSignifierParams,
} from '../signifierRegistry';

// The 25 terrain types with direct registry entries (TerrainType names, not LART names)
const DIRECT_REGISTRY_KEYS = [
  // Lowlands (4 direct: farmland + oasis use fallback)
  'grassland',   // LART-01: 1 variant
  'savanna',     // LART-02: 3 variants
  'steppe',      // LART-03: 1 variant
  'floodplain',  // LART-04: 2 variants
  // Forest (6 direct: jungle + evergreen_forest use fallback)
  'light_forest',      // LART-05: 1 variant (hand-drawn)
  'temperate_forest',  // LART-06: 1 variant (deep forest)
  'dense_forest',      // LART-07: 3 variants
  'boreal_forest',     // LART-08: 1 variant (hand-drawn)
  'tropical_forest',   // LART-09: 3 variants
  'dead_forest',       // LART-30: 1 variant (hand-drawn)
  // Wet (3 direct)
  'marsh',    // LART-10: 3 variants
  'swamp',    // LART-11: 1 variant (hand-drawn)
  'moor_bog', // LART-12: 1 variant (hand-drawn)
  // Elevated (6 direct)
  'hills',          // LART-13: 1 variant (hand-drawn)
  'forested_hills', // LART-14: 1 variant (hand-drawn)
  'mountains',      // LART-15: 1 variant (hand-drawn)
  'high_mountains', // LART-16: 1 variant (hand-drawn)
  'plateau',        // LART-17: 3 variants
  'mountain_pass',  // LART-18: 2 variants
  'badlands',       // LART-23: 1 variant (hand-drawn)
  'hardened_clay',  // LART-22: 1 variant (hand-drawn, formerly in badlands)
  // Extreme (6 direct: arctic + great_home_trees use fallback)
  'desert',       // LART-19 'sand_desert': 3 variants
  'sand_dunes',   // LART-20: 1 variant (hand-drawn)
  'rocky_desert', // LART-21: 3 variants
  'tundra',       // LART-24: 3 variants
  'snow_fields',  // LART-25: 2 variants
  'glacier',      // LART-26: 2 variants
  'volcano',      // LART-27 (3) + LART-28 (2) = 5 variants
  'broken_lands', // LART-29: 2 variants
];

// Expected variant counts per TerrainType registry key
const EXPECTED_VARIANT_COUNTS: Record<string, number> = {
  grassland: 1,
  savanna: 3,
  steppe: 1,
  floodplain: 2,
  light_forest: 1,
  temperate_forest: 1,
  dense_forest: 3,
  boreal_forest: 1,
  tropical_forest: 3,
  dead_forest: 1,
  marsh: 3,
  swamp: 1,
  moor_bog: 1,
  hills: 1,
  forested_hills: 1,
  mountains: 1,
  high_mountains: 1,
  plateau: 3,
  mountain_pass: 2,
  badlands: 1,   // hand-drawn
  hardened_clay: 0, // cleared — awaiting new art
  desert: 3,
  sand_dunes: 1,
  rocky_desert: 3,
  tundra: 1,
  snow_fields: 2,
  glacier: 2,
  volcano: 5,    // LART-27 volcanic (3) + LART-28 lava (2)
  broken_lands: 2,
};

describe('SIGNIFIER_REGISTRY', () => {
  it('Test 1: registry has entries for all 29 direct terrain types', () => {
    for (const key of DIRECT_REGISTRY_KEYS) {
      expect(SIGNIFIER_REGISTRY[key], `Missing registry entry for '${key}'`).toBeDefined();
      expect(Array.isArray(SIGNIFIER_REGISTRY[key]), `Entry for '${key}' should be an array`).toBe(true);
    }
    expect(Object.keys(SIGNIFIER_REGISTRY).length).toBeGreaterThanOrEqual(29);
  });

  it('Test 2: each registry entry has the correct number of variants', () => {
    for (const [key, expectedCount] of Object.entries(EXPECTED_VARIANT_COUNTS)) {
      const variants = SIGNIFIER_REGISTRY[key];
      expect(variants, `Missing entry for '${key}'`).toBeDefined();
      expect(variants.length, `'${key}' should have ${expectedCount} variants`).toBe(expectedCount);
    }
    // volcano has exactly 5 variants (LART-27 + LART-28)
    expect(SIGNIFIER_REGISTRY['volcano'].length).toBe(5);
    // Cleared entries (awaiting new art) are allowed to have 0 variants
    const clearedEntries = ['hardened_clay'];
    // All other entries have 1-4 variants
    for (const [key, variants] of Object.entries(SIGNIFIER_REGISTRY)) {
      if (key === 'volcano' || clearedEntries.includes(key)) continue;
      expect(variants.length, `'${key}' should have 1-4 variants`).toBeGreaterThanOrEqual(1);
      expect(variants.length, `'${key}' should have 1-4 variants`).toBeLessThanOrEqual(4);
    }
  });

  it('Test 3: every SignifierPath has opacity >= 0.2 and <= 0.7', () => {
    for (const [key, variants] of Object.entries(SIGNIFIER_REGISTRY)) {
      for (const variant of variants) {
        for (const path of variant.paths) {
          expect(path.opacity, `'${key}' path opacity ${path.opacity} out of range`).toBeGreaterThanOrEqual(0.2);
          expect(path.opacity, `'${key}' path opacity ${path.opacity} out of range`).toBeLessThanOrEqual(0.7);
        }
      }
    }
  });

  it('Test 4: every SignifierPath has a non-empty d string', () => {
    for (const [key, variants] of Object.entries(SIGNIFIER_REGISTRY)) {
      for (const variant of variants) {
        for (const path of variant.paths) {
          expect(path.d, `'${key}' path has empty d string`).toBeTruthy();
          expect(path.d.length, `'${key}' path d is empty`).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe('getSignifierParams', () => {
  it('Test 5: returns same values for same (col, row, seed, variantCount) — determinism', () => {
    const params1 = getSignifierParams(10, 20, 42, 3);
    const params2 = getSignifierParams(10, 20, 42, 3);
    expect(params1).toEqual(params2);
  });

  it('Test 6: jitterX and jitterY are within [-0.1, 0.1]', () => {
    for (let col = 0; col < 10; col++) {
      for (let row = 0; row < 10; row++) {
        const params = getSignifierParams(col, row, 42, 3);
        expect(params.jitterX).toBeGreaterThanOrEqual(-0.1);
        expect(params.jitterX).toBeLessThanOrEqual(0.1);
        expect(params.jitterY).toBeGreaterThanOrEqual(-0.1);
        expect(params.jitterY).toBeLessThanOrEqual(0.1);
      }
    }
  });

  it('Test 7: rotation is always 0 (locked upright)', () => {
    for (let col = 0; col < 10; col++) {
      for (let row = 0; row < 10; row++) {
        const params = getSignifierParams(col, row, 42, 3);
        expect(Math.abs(params.rotation)).toBe(0);
      }
    }
  });

  it('Test 8: variantIndex is in range [0, variantCount)', () => {
    for (let col = 0; col < 10; col++) {
      for (let row = 0; row < 10; row++) {
        const params3 = getSignifierParams(col, row, 42, 3);
        expect(params3.variantIndex).toBeGreaterThanOrEqual(0);
        expect(params3.variantIndex).toBeLessThan(3);

        const params5 = getSignifierParams(col, row, 42, 5);
        expect(params5.variantIndex).toBeGreaterThanOrEqual(0);
        expect(params5.variantIndex).toBeLessThan(5);
      }
    }
  });
});

describe('TERRAIN_SIGNIFIER_FALLBACK', () => {
  it('Test 9: maps the 6 TerrainTypes not covered by direct LART entries', () => {
    expect(TERRAIN_SIGNIFIER_FALLBACK['farmland']).toBe('grassland');
    expect(TERRAIN_SIGNIFIER_FALLBACK['jungle']).toBe('tropical_forest');
    expect(TERRAIN_SIGNIFIER_FALLBACK['evergreen_forest']).toBe('boreal_forest');
    expect(TERRAIN_SIGNIFIER_FALLBACK['arctic']).toBe('snow_fields');
    expect(TERRAIN_SIGNIFIER_FALLBACK['great_home_trees']).toBe('dense_forest');
    expect(TERRAIN_SIGNIFIER_FALLBACK['oasis']).toBe('savanna');
    expect(Object.keys(TERRAIN_SIGNIFIER_FALLBACK).length).toBe(6);
  });
});

describe('getSignifierParams variant distribution', () => {
  it('Test 10: adjacent hex coordinates with same seed produce different variant indices (variantCount >= 2)', () => {
    // With 100 adjacent pairs, at least some should differ (overwhelmingly likely with good PRNG)
    let differentCount = 0;
    for (let col = 0; col < 20; col++) {
      const p1 = getSignifierParams(col, 0, 42, 3);
      const p2 = getSignifierParams(col + 1, 0, 42, 3);
      if (p1.variantIndex !== p2.variantIndex) differentCount++;
    }
    // With 3 variants and 20 pairs, we'd expect ~14 to differ (P(same) = 1/3)
    expect(differentCount).toBeGreaterThan(0);
  });
});
