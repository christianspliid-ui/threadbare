/**
 * Tests for SphereAffinity types, triangle math, and entity seeding functions.
 * Written before implementation (TDD RED phase).
 */

import { describe, it, expect } from 'vitest';
import {
  triangleCost,
  triangleTotal,
  createDefaultSphereAffinity,
  TERRAIN_SPHERE_TABLE,
  getTerrainSphereScores,
  MAX_SPHERE_SCORE,
  ARCHETYPE_SPHERE_BONUS_PRIMARY,
  ARCHETYPE_SPHERE_BONUS_SECONDARY,
} from '../../types/sphereAffinity';
import { SPHERE_NAMES } from '../../types';

// ─── Triangle Math ────────────────────────────────────────────────

describe('triangleCost', () => {
  it('returns 1 for level 1', () => {
    expect(triangleCost(1)).toBe(1);
  });

  it('returns 5 for level 5', () => {
    expect(triangleCost(5)).toBe(5);
  });

  it('returns 10 for level 10', () => {
    expect(triangleCost(10)).toBe(10);
  });

  it('returns N for any level N (cost equals the level)', () => {
    for (let n = 1; n <= 10; n++) {
      expect(triangleCost(n)).toBe(n);
    }
  });
});

describe('triangleTotal', () => {
  it('returns 0 for level 0', () => {
    expect(triangleTotal(0)).toBe(0);
  });

  it('returns 1 for level 1', () => {
    expect(triangleTotal(1)).toBe(1);
  });

  it('returns 6 for level 3', () => {
    expect(triangleTotal(3)).toBe(6);
  });

  it('returns 55 for level 10', () => {
    expect(triangleTotal(10)).toBe(55);
  });

  it('follows n*(n+1)/2 formula', () => {
    for (let n = 0; n <= 10; n++) {
      expect(triangleTotal(n)).toBe(n * (n + 1) / 2);
    }
  });
});

// ─── createDefaultSphereAffinity ─────────────────────────────────

describe('createDefaultSphereAffinity', () => {
  it('returns an object with scores and progress properties', () => {
    const affinity = createDefaultSphereAffinity();
    expect(affinity).toHaveProperty('scores');
    expect(affinity).toHaveProperty('progress');
  });

  it('returns all 8 spheres at score 0', () => {
    const affinity = createDefaultSphereAffinity();
    for (const sphere of SPHERE_NAMES) {
      expect(affinity.scores[sphere]).toBe(0);
    }
  });

  it('returns all 8 spheres at progress 0', () => {
    const affinity = createDefaultSphereAffinity();
    for (const sphere of SPHERE_NAMES) {
      expect(affinity.progress[sphere]).toBe(0);
    }
  });

  it('returns exactly 8 sphere entries in scores', () => {
    const affinity = createDefaultSphereAffinity();
    expect(Object.keys(affinity.scores)).toHaveLength(8);
  });

  it('returns a new object each call (no shared reference)', () => {
    const a = createDefaultSphereAffinity();
    const b = createDefaultSphereAffinity();
    a.scores.force = 5;
    expect(b.scores.force).toBe(0);
  });
});

// ─── MAX_SPHERE_SCORE ─────────────────────────────────────────────

describe('MAX_SPHERE_SCORE', () => {
  it('equals 10', () => {
    expect(MAX_SPHERE_SCORE).toBe(10);
  });
});

// ─── TERRAIN_SPHERE_TABLE ─────────────────────────────────────────

describe('TERRAIN_SPHERE_TABLE', () => {
  it('forest returns { life: 3, spirit: 1 }', () => {
    expect(TERRAIN_SPHERE_TABLE['forest']).toMatchObject({ life: 3, spirit: 1 });
  });

  it('mountains returns { matter: 3, force: 1 }', () => {
    const scores = TERRAIN_SPHERE_TABLE['mountains'];
    expect(scores).toBeDefined();
    expect(scores!.matter).toBe(3);
    expect(scores!.force).toBe(1);
  });

  it('volcanic returns { force: 3, entropy: 2 }', () => {
    expect(TERRAIN_SPHERE_TABLE['volcanic']).toMatchObject({ force: 3, entropy: 2 });
  });

  it('has entries for all major terrain categories', () => {
    const expectedKeys = [
      'forest', 'mountains', 'plains', 'desert', 'swamp',
      'coast', 'volcanic', 'tundra', 'sacred_grove', 'ruins',
    ];
    for (const key of expectedKeys) {
      expect(TERRAIN_SPHERE_TABLE[key]).toBeDefined();
    }
  });
});

// ─── getTerrainSphereScores ───────────────────────────────────────

describe('getTerrainSphereScores', () => {
  it('maps temperate_forest to forest bucket (life-heavy)', () => {
    const scores = getTerrainSphereScores('temperate_forest');
    expect(scores.life).toBeGreaterThanOrEqual(2);
  });

  it('maps dense_forest to forest bucket', () => {
    const scores = getTerrainSphereScores('dense_forest');
    expect(scores.life).toBeGreaterThanOrEqual(2);
  });

  it('maps boreal_forest to forest bucket', () => {
    const scores = getTerrainSphereScores('boreal_forest');
    expect(scores.life).toBeGreaterThanOrEqual(2);
  });

  it('maps mountains to mountains bucket', () => {
    const scores = getTerrainSphereScores('mountains');
    expect(scores.matter).toBeGreaterThanOrEqual(2);
  });

  it('maps high_mountains to mountains bucket', () => {
    const scores = getTerrainSphereScores('high_mountains');
    expect(scores.matter).toBeGreaterThanOrEqual(2);
  });

  it('maps grassland to plains bucket', () => {
    const scores = getTerrainSphereScores('grassland');
    expect(scores.energy).toBeGreaterThanOrEqual(1);
  });

  it('maps desert to desert bucket', () => {
    const scores = getTerrainSphereScores('desert');
    expect(scores.force).toBeGreaterThanOrEqual(1);
  });

  it('maps rocky_desert to desert bucket', () => {
    const scores = getTerrainSphereScores('rocky_desert');
    expect(scores.force).toBeGreaterThanOrEqual(1);
  });

  it('maps swamp to swamp bucket', () => {
    const scores = getTerrainSphereScores('swamp');
    expect(scores.entropy).toBeGreaterThanOrEqual(1);
  });

  it('maps ocean to coast bucket (time-heavy)', () => {
    const scores = getTerrainSphereScores('ocean');
    expect(scores.time).toBeGreaterThanOrEqual(1);
  });

  it('maps tundra to tundra bucket', () => {
    const scores = getTerrainSphereScores('tundra');
    expect(scores.entropy).toBeGreaterThanOrEqual(1);
  });

  it('maps glacier to tundra bucket', () => {
    const scores = getTerrainSphereScores('glacier');
    expect(scores.entropy).toBeGreaterThanOrEqual(1);
  });

  it('maps volcano terrain to volcanic bucket', () => {
    const scores = getTerrainSphereScores('volcano');
    expect(scores.force).toBeGreaterThanOrEqual(2);
  });

  it('returns empty or default object for unknown terrain (fail-soft)', () => {
    const scores = getTerrainSphereScores('unknown_terrain_xyz');
    expect(scores).toBeDefined();
    expect(typeof scores).toBe('object');
  });

  it('returns only non-zero sphere entries (sparse)', () => {
    const scores = getTerrainSphereScores('forest');
    // Should have life and spirit, not all 8
    expect(Object.keys(scores).length).toBeLessThan(8);
  });
});

// ─── Constants ───────────────────────────────────────────────────

describe('sphere affinity constants', () => {
  it('ARCHETYPE_SPHERE_BONUS_PRIMARY equals 2', () => {
    expect(ARCHETYPE_SPHERE_BONUS_PRIMARY).toBe(2);
  });

  it('ARCHETYPE_SPHERE_BONUS_SECONDARY equals 1', () => {
    expect(ARCHETYPE_SPHERE_BONUS_SECONDARY).toBe(1);
  });
});
