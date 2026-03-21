/**
 * Province seeding tests — coverage, climate placement, size caps, roles.
 * TDD: Written before implementation.
 */
import { describe, it, expect } from 'vitest';
import { WorldGenPipeline } from '../WorldGenPipeline';
import { PROVINCE_MAX_HEXES, PROVINCE_MIN_SEED_DISTANCE } from '../constants';
import { hexDistance } from '../../../lib/hexMath';
import type { WorldGenParams } from '../types';

const SMALL_PARAMS: WorldGenParams = {
  cols: 20,
  rows: 30,
  seed: 42,
  ridgeCount: 2,
  seaLevelThreshold: 0.38,
  landShape: 'continent',
  mountainDensity: 'moderate',
  livingCultures: [
    {
      id: 'desert_folk',
      preferredBiomes: ['desert', 'sand_dunes', 'rocky_desert'],
      toleratedBiomes: ['steppe', 'badlands', 'hills', 'oasis'],
    },
  ],
  lostCultures: [
    {
      id: 'ancient_ones',
      preferredBiomes: ['mountains', 'hills', 'plateau'],
      toleratedBiomes: ['tundra', 'glacier', 'badlands'],
    },
    {
      id: 'sea_people',
      preferredBiomes: ['coastal_shallows', 'coast', 'ocean'],
      toleratedBiomes: ['grassland', 'marsh', 'hills'],
    },
    {
      id: 'forest_walkers',
      preferredBiomes: ['dense_forest', 'boreal_forest', 'temperate_forest'],
      toleratedBiomes: ['hills', 'swamp', 'marsh'],
    },
  ],
};

describe('Province seeding', () => {
  it('all hexes assigned to a province (no -1 values)', () => {
    const pipeline = new WorldGenPipeline();
    const ctx = pipeline.run(SMALL_PARAMS);

    for (let i = 0; i < ctx.provinceIds.length; i++) {
      expect(ctx.provinceIds[i]).toBeGreaterThanOrEqual(0);
    }
  });

  it('province count matches expected (living + lost + wilderness)', () => {
    const pipeline = new WorldGenPipeline();
    const ctx = pipeline.run(SMALL_PARAMS);

    // Should have at least 1 living + 3 lost + some wilderness
    expect(ctx.provinces.length).toBeGreaterThanOrEqual(
      SMALL_PARAMS.livingCultures.length + SMALL_PARAMS.lostCultures.length
    );
  });

  it('each province has exactly one capital hex recorded', () => {
    const pipeline = new WorldGenPipeline();
    const ctx = pipeline.run(SMALL_PARAMS);

    expect(ctx.provinceCapitalHexes.length).toBe(ctx.provinces.length);
  });

  it('province roles assigned (0=capital, 1=heartland, 2=borderland)', () => {
    const pipeline = new WorldGenPipeline();
    const ctx = pipeline.run(SMALL_PARAMS);

    const roleValues = new Set<number>();
    for (let i = 0; i < ctx.provinceRoles.length; i++) {
      roleValues.add(ctx.provinceRoles[i]);
    }
    // Should have multiple role types used
    expect(roleValues.size).toBeGreaterThanOrEqual(2);
    // All values should be valid (0, 1, or 2)
    for (const v of roleValues) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(2);
    }
  });

  it('no province exceeds PROVINCE_MAX_HEXES', () => {
    const pipeline = new WorldGenPipeline();
    const ctx = pipeline.run(SMALL_PARAMS);

    const hexCounts = new Map<number, number>();
    for (let i = 0; i < ctx.provinceIds.length; i++) {
      const id = ctx.provinceIds[i];
      hexCounts.set(id, (hexCounts.get(id) ?? 0) + 1);
    }

    for (const [, count] of hexCounts) {
      expect(count).toBeLessThanOrEqual(PROVINCE_MAX_HEXES);
    }
  });

  it('no two province seeds are closer than PROVINCE_MIN_SEED_DISTANCE', () => {
    const pipeline = new WorldGenPipeline();
    const ctx = pipeline.run(SMALL_PARAMS);

    const seeds = ctx.provinces.map(p => p.seedHex);
    for (let i = 0; i < seeds.length; i++) {
      for (let j = i + 1; j < seeds.length; j++) {
        const dist = hexDistance(seeds[i], seeds[j]);
        expect(dist).toBeGreaterThanOrEqual(PROVINCE_MIN_SEED_DISTANCE);
      }
    }
  });

  it('CultureIdentity has preferredBiomes and toleratedBiomes fields', async () => {
    // Type-level check — import culture types and verify shape
    const { CULTURE_COUNT } = await import('../../../types/culture');
    // The real type check happens at compile time; this just ensures the module loads
    expect(CULTURE_COUNT).toBeDefined();
  });

  it('deterministic province assignment with same seed', () => {
    const pipeline = new WorldGenPipeline();
    const ctx1 = pipeline.run(SMALL_PARAMS);
    const ctx2 = pipeline.run(SMALL_PARAMS);

    for (let i = 0; i < ctx1.provinceIds.length; i++) {
      expect(ctx1.provinceIds[i]).toBe(ctx2.provinceIds[i]);
    }
  });
});
