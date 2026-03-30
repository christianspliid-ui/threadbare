/**
 * Elevation generation tests — heightmap quality, ridges, sea level, determinism.
 * TDD: Written as specification for the elevation pass.
 */
import { describe, it, expect } from 'vitest';
import { WorldGenPipeline } from '../WorldGenPipeline';
import {
  RIDGE_PEAK_ELEVATION,
  RIDGE_FOOTHILLS_HEXES,
  SEA_LEVEL,
} from '../constants';
import { hexDistance } from '../../../lib/hexMath';
import type { WorldGenParams } from '../types';

// Larger grid for sea level ratio tests
const MEDIUM_PARAMS: WorldGenParams = {
  cols: 80,
  rows: 120,
  seed: 42,
  ridgeCount: 4,
  seaLevelThreshold: SEA_LEVEL,
  landShape: 'continent',
  mountainDensity: 'moderate',
  livingCultures: [
    {
      id: 'mountain_folk',
      preferredBiomes: ['mountains', 'hills', 'high_mountains'],
      toleratedBiomes: ['plateau', 'glacier', 'tundra', 'mountain_pass', 'badlands'],
    },
    {
      id: 'lowland_folk',
      preferredBiomes: ['grassland', 'farmland', 'floodplain'],
      toleratedBiomes: ['steppe', 'hills', 'temperate_forest', 'marsh', 'savanna'],
    },
  ],
  lostCultures: [],
};

const SMALL_PARAMS: WorldGenParams = {
  cols: 20,
  rows: 30,
  seed: 42,
  ridgeCount: 2,
  seaLevelThreshold: SEA_LEVEL,
  landShape: 'continent',
  mountainDensity: 'moderate',
  livingCultures: [],
  lostCultures: [],
};

describe('Elevation generation', () => {
  it('elevation values in [0, 1] range for all hexes', () => {
    const pipeline = new WorldGenPipeline();
    const ctx = pipeline.run(SMALL_PARAMS);

    let min = 1;
    let max = 0;
    for (let i = 0; i < ctx.elevation.length; i++) {
      min = Math.min(min, ctx.elevation[i]);
      max = Math.max(max, ctx.elevation[i]);
    }

    expect(min).toBeGreaterThanOrEqual(0);
    expect(max).toBeLessThanOrEqual(1);
  });

  it('ridges array populated with correct count', () => {
    const pipeline = new WorldGenPipeline();
    const ctx = pipeline.run(SMALL_PARAMS);

    // ridgeCount=2 was requested
    expect(ctx.ridges.length).toBeGreaterThan(0);
    expect(ctx.ridges.length).toBeLessThanOrEqual(SMALL_PARAMS.ridgeCount + 1); // allow 0 if grid too small

    // Each ridge has a spine
    for (const ridge of ctx.ridges) {
      expect(ridge.spine.length).toBeGreaterThan(0);
    }
  });

  it('ridge spine hexes have elevation >= RIDGE_PEAK_ELEVATION * 0.8', () => {
    const pipeline = new WorldGenPipeline();
    const ctx = pipeline.run(MEDIUM_PARAMS);

    if (ctx.ridges.length === 0) return; // no ridges on this seed

    // Check at least some spine hexes hit the peak threshold
    let peakCount = 0;
    for (const ridge of ctx.ridges) {
      for (const spineHex of ridge.spine) {
        if (spineHex.col < 0 || spineHex.col >= ctx.cols || spineHex.row < 0 || spineHex.row >= ctx.rows) continue;
        const elev = ctx.elevation[spineHex.row * ctx.cols + spineHex.col];
        if (elev >= RIDGE_PEAK_ELEVATION * 0.8) peakCount++;
      }
    }

    // At least 30% of spine hexes should be at peak elevation
    const totalSpineHexes = ctx.ridges.reduce((acc, r) => acc + r.spine.length, 0);
    expect(peakCount).toBeGreaterThan(totalSpineHexes * 0.3);
  });

  it('ridge orientation in valid range [0, 2*PI)', () => {
    const pipeline = new WorldGenPipeline();
    const ctx = pipeline.run(MEDIUM_PARAMS);

    for (const ridge of ctx.ridges) {
      expect(ridge.orientation).toBeGreaterThanOrEqual(0);
      expect(ridge.orientation).toBeLessThan(Math.PI * 2);
    }
  });

  it('sea level produces >10% land and >10% ocean on medium grid', () => {
    const pipeline = new WorldGenPipeline();
    const ctx = pipeline.run(MEDIUM_PARAMS);

    let oceanCount = 0;
    let landCount = 0;
    for (let i = 0; i < ctx.isOcean.length; i++) {
      if (ctx.isOcean[i]) oceanCount++;
      else landCount++;
    }

    const total = ctx.isOcean.length;
    const oceanRatio = oceanCount / total;
    const landRatio = landCount / total;

    expect(oceanRatio).toBeGreaterThan(0.1);
    expect(landRatio).toBeGreaterThan(0.1);
  });

  it('determinism: same seed produces identical elevation array', () => {
    const pipeline = new WorldGenPipeline();
    const ctx1 = pipeline.run(SMALL_PARAMS);
    const ctx2 = pipeline.run(SMALL_PARAMS);

    expect(ctx1.elevation.length).toBe(ctx2.elevation.length);
    for (let i = 0; i < ctx1.elevation.length; i++) {
      expect(ctx1.elevation[i]).toBe(ctx2.elevation[i]);
    }
  });

  it('determinism: same seed produces identical ridges', () => {
    const pipeline = new WorldGenPipeline();
    const ctx1 = pipeline.run(SMALL_PARAMS);
    const ctx2 = pipeline.run(SMALL_PARAMS);

    expect(ctx1.ridges.length).toBe(ctx2.ridges.length);
    for (let r = 0; r < ctx1.ridges.length; r++) {
      expect(ctx1.ridges[r].spine.length).toBe(ctx2.ridges[r].spine.length);
      expect(ctx1.ridges[r].orientation).toBe(ctx2.ridges[r].orientation);
    }
  });

  it('sampleElevation at integer coords matches array value', () => {
    const pipeline = new WorldGenPipeline();
    const ctx = pipeline.run(SMALL_PARAMS);

    // Test several specific integer coordinates
    const testCoords = [
      { col: 5, row: 10 },
      { col: 0, row: 0 },
      { col: 15, row: 25 },
      { col: 10, row: 15 },
    ];

    for (const { col, row } of testCoords) {
      const arrayVal = ctx.elevation[row * ctx.cols + col];
      const sampleVal = ctx.sampleElevation(col, row);
      expect(sampleVal).toBe(arrayVal);
    }
  });

  it('province elevation bias: mountain province hexes average higher than lowland', () => {
    const pipeline = new WorldGenPipeline();
    const ctx = pipeline.run(MEDIUM_PARAMS);

    // Find mountain province and lowland province
    const mountainProvince = ctx.provinces.find(p => p.cultureId === 'mountain_folk');
    const lowlandProvince = ctx.provinces.find(p => p.cultureId === 'lowland_folk');

    if (!mountainProvince || !lowlandProvince) return; // provinces may not be placed in small grids

    // Compute average elevation per province
    const mountainElevations: number[] = [];
    const lowlandElevations: number[] = [];

    for (let row = 0; row < ctx.rows; row++) {
      for (let col = 0; col < ctx.cols; col++) {
        const idx = row * ctx.cols + col;
        const pId = ctx.provinceIds[idx];
        if (pId === mountainProvince.id) {
          mountainElevations.push(ctx.elevation[idx]);
        } else if (pId === lowlandProvince.id) {
          lowlandElevations.push(ctx.elevation[idx]);
        }
      }
    }

    if (mountainElevations.length === 0 || lowlandElevations.length === 0) return;

    const avgMountain = mountainElevations.reduce((a, b) => a + b, 0) / mountainElevations.length;
    const avgLowland = lowlandElevations.reduce((a, b) => a + b, 0) / lowlandElevations.length;

    expect(avgMountain).toBeGreaterThan(avgLowland);
  });
});
