/**
 * WorldGenPipeline tests — determinism and structural integrity.
 * TDD: Written before implementation. Tests drive the shape of WorldGenContext.
 */
import { describe, it, expect } from 'vitest';
import { WorldGenPipeline } from '../WorldGenPipeline';
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
    {
      id: 'forest_folk',
      preferredBiomes: ['temperate_forest', 'dense_forest', 'boreal_forest'],
      toleratedBiomes: ['hills', 'marsh', 'grassland', 'forested_hills'],
    },
  ],
  lostCultures: [
    {
      id: 'ancient_ones',
      preferredBiomes: ['mountains', 'hills', 'plateau'],
      toleratedBiomes: ['tundra', 'glacier', 'badlands'],
    },
  ],
};

describe('WorldGenPipeline', () => {
  it('produces WorldGenContext with all required fields', () => {
    const pipeline = new WorldGenPipeline();
    const ctx = pipeline.run(SMALL_PARAMS);

    expect(ctx.cols).toBe(20);
    expect(ctx.rows).toBe(30);
    expect(ctx.seed).toBe(42);

    // Province fields
    expect(ctx.provinceIds).toBeInstanceOf(Int16Array);
    expect(ctx.provinceIds.length).toBe(20 * 30);
    expect(ctx.provinces).toBeInstanceOf(Array);
    expect(ctx.provinceCapitalHexes).toBeInstanceOf(Array);
    expect(ctx.provinceRoles).toBeInstanceOf(Uint8Array);

    // Elevation fields
    expect(ctx.elevation).toBeInstanceOf(Float32Array);
    expect(ctx.ridges).toBeInstanceOf(Array);
    expect(ctx.canyons).toBeInstanceOf(Array);

    // Continuous field functions
    expect(typeof ctx.sampleElevation).toBe('function');
    expect(typeof ctx.sampleTemperature).toBe('function');
    expect(typeof ctx.sampleMoisture).toBe('function');
  });

  it('deterministic: same seed produces identical output', () => {
    const pipeline = new WorldGenPipeline();
    const ctx1 = pipeline.run(SMALL_PARAMS);
    const ctx2 = pipeline.run(SMALL_PARAMS);

    // Compare elevation arrays element by element
    expect(ctx1.elevation.length).toBe(ctx2.elevation.length);
    for (let i = 0; i < ctx1.elevation.length; i++) {
      expect(ctx1.elevation[i]).toBe(ctx2.elevation[i]);
    }

    // Compare provinceIds
    for (let i = 0; i < ctx1.provinceIds.length; i++) {
      expect(ctx1.provinceIds[i]).toBe(ctx2.provinceIds[i]);
    }
  });

  it('different seeds produce different output', () => {
    const pipeline = new WorldGenPipeline();
    const ctx1 = pipeline.run(SMALL_PARAMS);
    const ctx2 = pipeline.run({ ...SMALL_PARAMS, seed: 99 });

    // At least some elevation values should differ
    let differences = 0;
    for (let i = 0; i < ctx1.elevation.length; i++) {
      if (ctx1.elevation[i] !== ctx2.elevation[i]) differences++;
    }
    expect(differences).toBeGreaterThan(0);
  });
});
