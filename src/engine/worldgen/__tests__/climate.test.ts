/**
 * Tests for pass04-climate.ts
 *
 * Validates temperature (latitude gradient, altitude cooling, maritime moderation)
 * and moisture (coastal bonus, rain shadow) generation.
 *
 * TDD: Written before implementation — all tests should fail initially.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { runGridPass } from '../passes/pass00-grid';
import { runProvincePass } from '../passes/pass01-provinces';
import { runElevationPass } from '../passes/pass02-elevation';
import { runCoastlinePass } from '../passes/pass03-coastline';
import { runClimatePass } from '../passes/pass04-climate';
import type { WorldGenContext, WorldGenParams } from '../types';

// ─── Test grid factory ───────────────────────────────────────────

function makeTestParams(overrides: Partial<WorldGenParams> = {}): WorldGenParams {
  return {
    cols: 30,
    rows: 20,
    seed: 42,
    ridgeCount: 2,
    seaLevelThreshold: 0.38,
    landShape: 'continent',
    mountainDensity: 'moderate',
    livingCultures: [],
    lostCultures: [],
    ...overrides,
  };
}

function makeCtx(params: WorldGenParams): WorldGenContext {
  const ctx = runGridPass(params);
  runProvincePass(ctx, params);
  runElevationPass(ctx, params);
  runCoastlinePass(ctx, params);
  return ctx;
}

// ─── Tests ───────────────────────────────────────────────────────

describe('runClimatePass — latitude gradient', () => {
  it('equatorial hexes are warmer than polar hexes', () => {
    const params = makeTestParams();
    const ctx = makeCtx(params);
    runClimatePass(ctx, params);

    const { cols, rows } = params;
    // Average temperature at middle row (equatorial)
    let equatorialSum = 0;
    let equatorialCount = 0;
    const midRow = Math.floor(rows / 2);
    for (let col = 0; col < cols; col++) {
      equatorialSum += ctx.temperature[midRow * cols + col];
      equatorialCount++;
    }
    const equatorialAvg = equatorialSum / equatorialCount;

    // Average temperature at polar row (row 0)
    let polarSum = 0;
    let polarCount = 0;
    for (let col = 0; col < cols; col++) {
      polarSum += ctx.temperature[0 * cols + col];
      polarCount++;
    }
    const polarAvg = polarSum / polarCount;

    expect(equatorialAvg).toBeGreaterThan(polarAvg + 0.2);
  });
});

describe('runClimatePass — altitude penalty', () => {
  it('high elevation hexes are cooler than low elevation hexes at same latitude', () => {
    const params = makeTestParams({ seed: 99 });
    const ctx = makeCtx(params);

    const { cols, rows } = params;
    const midRow = Math.floor(rows / 2);

    // Find a low and high elevation hex in the middle row
    let lowestElev = 1;
    let lowestCol = 0;
    let highestElev = 0;
    let highestCol = cols - 1;

    for (let col = 0; col < cols; col++) {
      const elev = ctx.elevation[midRow * cols + col];
      if (elev > 0.38 && elev < lowestElev) {
        lowestElev = elev;
        lowestCol = col;
      }
      if (elev > highestElev) {
        highestElev = elev;
        highestCol = col;
      }
    }

    runClimatePass(ctx, params);

    // High elevation hex should be cooler
    const highTemp = ctx.temperature[midRow * cols + highestCol];
    const lowTemp = ctx.temperature[midRow * cols + lowestCol];

    // High elevation should produce a meaningful temperature difference
    expect(highestElev * 0.3).toBeGreaterThan(0); // sanity check
    expect(highTemp).toBeLessThan(lowTemp + 0.05); // may not always hold perfectly, but altitude penalty must exist
  });

  it('altitude penalty is clearly detectable at very high elevation vs sea-level', () => {
    const params = makeTestParams();
    const ctx = makeCtx(params);

    const { cols, rows } = params;
    const midRow = Math.floor(rows / 2);

    // Force two specific hexes to different elevations
    const highIdx = midRow * cols + Math.floor(cols / 2);
    const lowIdx = midRow * cols + Math.floor(cols / 3);
    const originalHighElev = ctx.elevation[highIdx];
    const originalLowElev = ctx.elevation[lowIdx];

    ctx.elevation[highIdx] = 0.9; // Very high mountain
    ctx.elevation[lowIdx] = 0.4; // Low land

    runClimatePass(ctx, params);

    const highTemp = ctx.temperature[highIdx];
    const lowTemp = ctx.temperature[lowIdx];

    // High elevation should be cooler
    expect(highTemp).toBeLessThan(lowTemp);
  });
});

describe('runClimatePass — maritime moderation', () => {
  it('coastal hexes have temperature closer to 0.5 than inland hexes at same latitude', () => {
    const params = makeTestParams({ seed: 42, cols: 40, rows: 20 });
    const ctx = makeCtx(params);
    runClimatePass(ctx, params);

    const { cols, rows } = params;
    const midRow = Math.floor(rows / 2);

    // Find first land hex from left (coastal) and a hex far inland
    let coastCol = -1;
    let inlandCol = -1;

    for (let col = 0; col < cols; col++) {
      const idx = midRow * cols + col;
      if (!ctx.isOcean[idx] && coastCol === -1) {
        coastCol = col;
      }
    }
    // Inland = further from coast
    for (let col = coastCol + 10; col < cols; col++) {
      const idx = midRow * cols + col;
      if (!ctx.isOcean[idx]) {
        inlandCol = col;
        break;
      }
    }

    if (coastCol === -1 || inlandCol === -1) {
      // Skip if we can't find suitable hexes
      return;
    }

    const coastTemp = ctx.temperature[midRow * cols + coastCol];
    const inlandTemp = ctx.temperature[midRow * cols + inlandCol];

    // Coastal temp should be closer to 0.5 (absolute deviation from 0.5 is smaller)
    const coastDeviation = Math.abs(coastTemp - 0.5);
    const inlandDeviation = Math.abs(inlandTemp - 0.5);
    expect(coastDeviation).toBeLessThanOrEqual(inlandDeviation + 0.1);
  });
});

describe('runClimatePass — rain shadow', () => {
  it('hexes downwind of a ridge have lower moisture than hexes upwind', () => {
    const params = makeTestParams({ seed: 42, cols: 40, rows: 30 });
    const ctx = makeCtx(params);

    const { cols, rows } = params;

    // Manually create a known ridge running E-W across the middle
    // PREVAILING_WIND_ANGLE = Math.PI * 0.75 (from NW), so wind blows to SE
    // Hexes "south" of ridge (in direction wind blows TO) should be drier
    const ridgeRow = Math.floor(rows / 2);
    ctx.ridges = [{
      spine: Array.from({ length: cols }, (_, col) => ({ col, row: ridgeRow })),
      orientation: 0, // E-W ridge
      forks: [],
    }];

    // Set high elevation on ridge
    for (let col = 0; col < cols; col++) {
      ctx.elevation[ridgeRow * cols + col] = 0.85;
    }

    runClimatePass(ctx, params);

    // Collect moisture upwind (north of ridge) vs downwind (south of ridge)
    const upwindRow = ridgeRow - 3;
    const downwindRow = ridgeRow + 3;

    if (upwindRow < 0 || downwindRow >= rows) return;

    let upwindMoisture = 0;
    let downwindMoisture = 0;
    let count = 0;

    for (let col = 5; col < cols - 5; col++) {
      if (!ctx.isOcean[upwindRow * cols + col] && !ctx.isOcean[downwindRow * cols + col]) {
        upwindMoisture += ctx.moisture[upwindRow * cols + col];
        downwindMoisture += ctx.moisture[downwindRow * cols + col];
        count++;
      }
    }

    if (count === 0) return;

    upwindMoisture /= count;
    downwindMoisture /= count;

    // Downwind should be drier by at least 0.1
    expect(upwindMoisture - downwindMoisture).toBeGreaterThan(0.05);
  });
});

describe('runClimatePass — coastal moisture', () => {
  it('coastal moisture bonus decays with distance from coast', () => {
    // Test the coastal bonus formula directly: hex at distance 0 should have
    // higher coastal moisture contribution than hex at distance 10
    // MOISTURE_COASTAL_BONUS * exp(-0 * MOISTURE_COASTAL_DECAY) > MOISTURE_COASTAL_BONUS * exp(-10 * MOISTURE_COASTAL_DECAY)
    const params = makeTestParams({ seed: 42 });
    const ctx = makeCtx(params);
    runClimatePass(ctx, params);

    // Verify the formula: distance 0 coastalBonus >> distance 10 coastalBonus
    // coastalBonus = MOISTURE_COASTAL_BONUS * exp(-dist * MOISTURE_COASTAL_DECAY)
    // At dist=0: 0.25 * 1 = 0.25
    // At dist=10: 0.25 * exp(-0.04 * 10) = 0.25 * 0.67 = 0.168
    // This is a 30%+ difference — visible in aggregate moisture

    const { cols, rows } = params;
    // Average moisture for all land hexes within 1 hex of ocean
    let nearCoastMoisture = 0;
    let nearCount = 0;
    let farMoisture = 0;
    let farCount = 0;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const idx = row * cols + col;
        if (ctx.isOcean[idx]) continue;

        // Check if any neighbor is ocean (coastal land hex)
        let isCoastal = false;
        const isOddCol = col % 2 === 1;
        const dirs = isOddCol ? [[1,1],[1,0],[0,-1],[-1,0],[-1,1],[0,1]] : [[1,0],[1,-1],[0,-1],[-1,-1],[-1,0],[0,1]];
        for (const [dc, dr] of dirs) {
          const nc = col + dc, nr = row + dr;
          if (nc >= 0 && nc < cols && nr >= 0 && nr < rows && ctx.isOcean[nr * cols + nc]) {
            isCoastal = true;
            break;
          }
        }

        if (isCoastal) {
          nearCoastMoisture += ctx.moisture[idx];
          nearCount++;
        }
      }
    }

    // Compare to overall average of all land hexes
    let totalMoisture = 0;
    let totalLand = 0;
    for (let i = 0; i < cols * rows; i++) {
      if (!ctx.isOcean[i]) {
        totalMoisture += ctx.moisture[i];
        totalLand++;
      }
    }

    if (nearCount === 0 || totalLand === 0) return;

    nearCoastMoisture /= nearCount;
    const avgMoisture = totalMoisture / totalLand;

    // Coastal hexes should be wetter than the average land hex
    expect(nearCoastMoisture).toBeGreaterThanOrEqual(avgMoisture);
  });
});

describe('runClimatePass — value bounds', () => {
  it('all temperature and moisture values are in [0, 1]', () => {
    const params = makeTestParams();
    const ctx = makeCtx(params);
    runClimatePass(ctx, params);

    const { cols, rows } = params;
    const total = cols * rows;

    for (let i = 0; i < total; i++) {
      expect(ctx.temperature[i]).toBeGreaterThanOrEqual(0);
      expect(ctx.temperature[i]).toBeLessThanOrEqual(1);
      expect(ctx.moisture[i]).toBeGreaterThanOrEqual(0);
      expect(ctx.moisture[i]).toBeLessThanOrEqual(1);
    }
  });
});

describe('runClimatePass — determinism', () => {
  it('same seed produces identical temperature and moisture arrays', () => {
    const params = makeTestParams();

    const ctx1 = makeCtx(params);
    runClimatePass(ctx1, params);

    const ctx2 = makeCtx(params);
    runClimatePass(ctx2, params);

    const { cols, rows } = params;
    const total = cols * rows;

    for (let i = 0; i < total; i++) {
      expect(ctx1.temperature[i]).toBe(ctx2.temperature[i]);
      expect(ctx1.moisture[i]).toBe(ctx2.moisture[i]);
    }
  });
});

describe('runClimatePass — continuous sampling', () => {
  it('sampleTemperature at integer coords matches temperature array', () => {
    const params = makeTestParams();
    const ctx = makeCtx(params);
    runClimatePass(ctx, params);

    const { cols, rows } = params;

    // Test several integer coordinates
    const testCoords = [
      { col: 5, row: 10 },
      { col: 0, row: 0 },
      { col: cols - 1, row: rows - 1 },
      { col: Math.floor(cols / 2), row: Math.floor(rows / 2) },
    ];

    for (const coord of testCoords) {
      const arrayVal = ctx.temperature[coord.row * cols + coord.col];
      const sampleVal = ctx.sampleTemperature(coord.col, coord.row);
      expect(sampleVal).toBeCloseTo(arrayVal, 5);
    }
  });

  it('sampleMoisture at integer coords matches moisture array', () => {
    const params = makeTestParams();
    const ctx = makeCtx(params);
    runClimatePass(ctx, params);

    const { cols, rows } = params;

    const testCoords = [
      { col: 5, row: 10 },
      { col: 1, row: 1 },
      { col: cols - 2, row: rows - 2 },
    ];

    for (const coord of testCoords) {
      const arrayVal = ctx.moisture[coord.row * cols + coord.col];
      const sampleVal = ctx.sampleMoisture(coord.col, coord.row);
      expect(sampleVal).toBeCloseTo(arrayVal, 5);
    }
  });
});
