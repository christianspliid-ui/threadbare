/**
 * Pass 04: Climate Field Generation
 *
 * Generates temperature and moisture fields using:
 * - Temperature: latitude gradient + altitude penalty + maritime moderation + noise
 * - Moisture: coastal proximity bonus + rain shadow (orographic effect) + noise
 *
 * Exposes continuous sampleTemperature and sampleMoisture functions for Phase 3 rendering.
 *
 * NFP #1 Tunability: All magic numbers in constants.ts.
 * NFP #2 Inspectability: Temperature/moisture arrays stored in ctx; sampleFns exposed.
 * NFP #3 Determinism: mulberry32(seed + PASS_SEED_CLIMATE) drives noise streams.
 * NFP #4 Fail-soft: Uses clamp everywhere; gracefully handles empty ridge arrays.
 */
import { createNoise2D } from 'simplex-noise';
import { mulberry32 } from '../../../lib/prng';
import { hexDistance } from '../../../lib/hexMath';
import {
  PASS_SEED_CLIMATE,
  SEA_LEVEL,
  TEMP_LATITUDE_WEIGHT,
  TEMP_ALTITUDE_PENALTY,
  TEMP_NOISE_WEIGHT,
  TEMP_NOISE_SCALE,
  TEMP_MARITIME_RADIUS,
  TEMP_MARITIME_STRENGTH,
  MOISTURE_COASTAL_BONUS,
  MOISTURE_COASTAL_DECAY,
  MOISTURE_NOISE_WEIGHT,
  MOISTURE_NOISE_SCALE,
  RAIN_SHADOW_PENALTY,
  RAIN_SHADOW_DECAY,
  PREVAILING_WIND_ANGLE,
} from '../constants';
import type { WorldGenContext, WorldGenParams, Ridge } from '../types';
import type { HexCoord } from '../../../types';

// ─── Helpers ─────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

// ─── Maritime moderation ──────────────────────────────────────────

/**
 * BFS from all ocean hexes to build coast distance map.
 * Returns Float32Array where value is hexes from coast (Infinity = not reachable).
 * Capped at TEMP_MARITIME_RADIUS to limit BFS scope.
 */
function buildCoastDistanceMap(ctx: WorldGenContext): Float32Array {
  const { cols, rows } = ctx;
  const total = cols * rows;
  const coastDist = new Float32Array(total).fill(Infinity);

  // Find all ocean hexes adjacent to land (coastal ocean hexes)
  const queue: number[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const idx = row * cols + col;
      if (!ctx.isOcean[idx]) {
        // Land hex — check if any neighbor is ocean
        const neighbors = getNeighborIndices(col, row, cols, rows);
        for (const nIdx of neighbors) {
          if (ctx.isOcean[nIdx]) {
            // This is a coastal land hex — distance 0 from coast
            coastDist[idx] = 0;
            queue.push(idx);
            break;
          }
        }
      } else {
        // Ocean hex — distance 0 from coast
        coastDist[idx] = 0;
        queue.push(idx);
      }
    }
  }

  // BFS to propagate distances for land hexes only
  // Reset ocean to Infinity (coast distance from coast doesn't apply to ocean)
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const idx = row * cols + col;
      if (ctx.isOcean[idx]) {
        coastDist[idx] = 0; // Ocean is distance 0 (it IS coast)
      }
    }
  }

  // BFS only for land hexes to find distance from nearest ocean
  const landDist = new Float32Array(total).fill(Infinity);
  const bfsQueue: number[] = [];

  // Seed: all land hexes adjacent to ocean have distance 1
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const idx = row * cols + col;
      if (!ctx.isOcean[idx]) {
        const neighbors = getNeighborIndices(col, row, cols, rows);
        for (const nIdx of neighbors) {
          if (ctx.isOcean[nIdx]) {
            landDist[idx] = 1;
            bfsQueue.push(idx);
            break;
          }
        }
      }
    }
  }

  // BFS expand
  let head = 0;
  while (head < bfsQueue.length) {
    const idx = bfsQueue[head++];
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const dist = landDist[idx];
    if (dist >= TEMP_MARITIME_RADIUS) continue;

    const neighbors = getNeighborIndices(col, row, cols, rows);
    for (const nIdx of neighbors) {
      if (!ctx.isOcean[nIdx] && landDist[nIdx] === Infinity) {
        landDist[nIdx] = dist + 1;
        bfsQueue.push(nIdx);
      }
    }
  }

  return landDist;
}

/** Get valid neighbor indices for a hex in flat-top odd-q grid */
function getNeighborIndices(col: number, row: number, cols: number, rows: number): number[] {
  const isOddCol = col % 2 === 1;
  const dirs = isOddCol
    ? [
        [1, 1], [1, 0],
        [0, -1], [-1, 0],
        [-1, 1], [0, 1],
      ]
    : [
        [1, 0], [1, -1],
        [0, -1], [-1, -1],
        [-1, 0], [0, 1],
      ];

  const result: number[] = [];
  for (const [dc, dr] of dirs) {
    const nc = col + dc;
    const nr = row + dr;
    if (nc >= 0 && nc < cols && nr >= 0 && nr < rows) {
      result.push(nr * cols + nc);
    }
  }
  return result;
}

// ─── Rain shadow ─────────────────────────────────────────────────

/**
 * Computes rain shadow penalty for a hex based on all ridges.
 *
 * For each ridge: find nearest spine point. Compute angle from that spine point
 * to this hex. If the angle is within ±60° of the PREVAILING_WIND_ANGLE
 * (meaning this hex is downwind), apply penalty. Hexes on the windward side
 * get a moisture bonus of half the shadow penalty.
 *
 * Returns net moisture modifier (negative = shadow, positive = windward bonus).
 */
export function computeRainShadow(col: number, row: number, ridges: Ridge[]): number {
  if (ridges.length === 0) return 0;

  let totalPenalty = 0;

  for (const ridge of ridges) {
    // Find nearest spine point
    let minDist = Infinity;
    let nearestSpine: HexCoord | null = null;

    for (const spineHex of ridge.spine) {
      const dist = hexDistance({ col, row }, spineHex);
      if (dist < minDist) {
        minDist = dist;
        nearestSpine = spineHex;
      }
    }
    // Also check forks
    for (const fork of ridge.forks) {
      for (const forkHex of fork) {
        const dist = hexDistance({ col, row }, forkHex);
        if (dist < minDist) {
          minDist = dist;
          nearestSpine = forkHex;
        }
      }
    }

    if (!nearestSpine || minDist === 0) continue;

    // Angle from spine point to this hex
    const dx = col - nearestSpine.col;
    const dy = row - nearestSpine.row;
    const angleToHex = Math.atan2(dy, dx);

    // Angular difference from prevailing wind direction
    let angleDiff = angleToHex - PREVAILING_WIND_ANGLE;
    // Normalize to [-PI, PI]
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    const absAngleDiff = Math.abs(angleDiff);
    const SHADOW_CONE = Math.PI / 3; // ±60 degrees

    if (absAngleDiff < SHADOW_CONE) {
      // Downwind — apply rain shadow penalty
      const penalty = RAIN_SHADOW_PENALTY * Math.exp(-minDist * RAIN_SHADOW_DECAY);
      totalPenalty += penalty;
    } else if (absAngleDiff > Math.PI - SHADOW_CONE) {
      // Windward — apply moisture bonus (half the shadow penalty amount)
      const bonus = (RAIN_SHADOW_PENALTY / 2) * Math.exp(-minDist * RAIN_SHADOW_DECAY);
      totalPenalty -= bonus; // negative penalty = bonus
    }
  }

  return totalPenalty;
}

// ─── Temperature evaluator ────────────────────────────────────────

/** Evaluate raw temperature at any (possibly fractional) col/row */
function evaluateTemperature(
  col: number,
  row: number,
  rows: number,
  elevation: (c: number, r: number) => number,
  tempNoise: (x: number, y: number) => number,
  coastDist: (c: number, r: number) => number,
): number {
  // Latitude component: 1.0 at equator, 0.0 at poles
  const latitudeTemp = 1 - Math.abs(row - rows / 2) / (rows / 2);

  // Altitude penalty: elevation above sea level reduces temperature
  const elev = elevation(col, row);
  const altitudePenalty = Math.max(0, elev - SEA_LEVEL) * TEMP_ALTITUDE_PENALTY / (1 - SEA_LEVEL);

  // Noise contribution
  const noiseContrib =
    ((tempNoise(col * TEMP_NOISE_SCALE, row * TEMP_NOISE_SCALE) + 1) / 2) * TEMP_NOISE_WEIGHT;

  // Maritime moderation: pulls temperature toward 0.5 if near coast
  const dist = coastDist(col, row);
  const rawTemp = latitudeTemp * TEMP_LATITUDE_WEIGHT + noiseContrib - altitudePenalty;
  let maritimeModeration = 0;
  if (dist < TEMP_MARITIME_RADIUS && dist !== Infinity) {
    maritimeModeration = TEMP_MARITIME_STRENGTH * (1 - dist / TEMP_MARITIME_RADIUS) * (0.5 - rawTemp);
  }

  return clamp(rawTemp + maritimeModeration, 0, 1);
}

/** Evaluate raw moisture at any (possibly fractional) col/row */
function evaluateMoisture(
  col: number,
  row: number,
  coastDist: (c: number, r: number) => number,
  moistureNoise: (x: number, y: number) => number,
  ridges: Ridge[],
): number {
  const dist = coastDist(col, row);
  const effectiveDist = dist === Infinity ? 100 : dist;
  const coastalBonus = MOISTURE_COASTAL_BONUS * Math.exp(-effectiveDist * MOISTURE_COASTAL_DECAY);
  const noiseContrib =
    ((moistureNoise(col * MOISTURE_NOISE_SCALE, row * MOISTURE_NOISE_SCALE) + 1) / 2) *
    MOISTURE_NOISE_WEIGHT;
  const rainShadowPenalty = computeRainShadow(col, row, ridges);

  return clamp(coastalBonus + noiseContrib + 0.3 - rainShadowPenalty, 0, 1);
}

// ─── Main pass ───────────────────────────────────────────────────

export function runClimatePass(ctx: WorldGenContext, params: WorldGenParams): void {
  const { cols, rows, seed } = params;
  const total = cols * rows;
  const rng = mulberry32(seed + PASS_SEED_CLIMATE);

  // Create seeded noise functions
  const tempNoise = createNoise2D(rng);
  const moistureNoise = createNoise2D(rng);

  // 1. Build coast distance map (BFS from ocean hexes)
  const coastDistMap = buildCoastDistanceMap(ctx);

  // Helper to look up coast distance at integer or fractional coords
  const coastDistAt = (c: number, r: number): number => {
    const col = Math.max(0, Math.min(cols - 1, Math.round(c)));
    const row = Math.max(0, Math.min(rows - 1, Math.round(r)));
    return coastDistMap[row * cols + col];
  };

  // Elevation at fractional or integer coords
  const elevAt = (c: number, r: number): number => ctx.sampleElevation(c, r);

  // 2. Compute temperature field
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const idx = row * cols + col;
      ctx.temperature[idx] = evaluateTemperature(
        col, row, rows, elevAt, tempNoise, coastDistAt,
      );
    }
  }

  // 3. Compute moisture field
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const idx = row * cols + col;
      ctx.moisture[idx] = evaluateMoisture(
        col, row, coastDistAt, moistureNoise, ctx.ridges,
      );
    }
  }

  // 4. Expose continuous sampling functions
  ctx.sampleTemperature = (c: number, r: number): number => {
    if (Number.isInteger(c) && Number.isInteger(r)) {
      const ci = Math.max(0, Math.min(cols - 1, c));
      const ri = Math.max(0, Math.min(rows - 1, r));
      return ctx.temperature[ri * cols + ci];
    }
    return evaluateTemperature(c, r, rows, elevAt, tempNoise, coastDistAt);
  };

  ctx.sampleMoisture = (c: number, r: number): number => {
    if (Number.isInteger(c) && Number.isInteger(r)) {
      const ci = Math.max(0, Math.min(cols - 1, c));
      const ri = Math.max(0, Math.min(rows - 1, r));
      return ctx.moisture[ri * cols + ci];
    }
    return evaluateMoisture(c, r, coastDistAt, moistureNoise, ctx.ridges);
  };
}
