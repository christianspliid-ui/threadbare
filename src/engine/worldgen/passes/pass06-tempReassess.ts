/**
 * Pass 06: Temperature Reassessment
 *
 * Moderates temperature near lakes (lake effect) and boosts temperature
 * and moisture along river valleys. Runs AFTER hydrology pass (Plan 03).
 *
 * NFP #1 Tunability: All constants in constants.ts.
 * NFP #2 Inspectability: Reads ctx.lakeIds and ctx.hasRiver (set by hydrology).
 * NFP #3 Determinism: No PRNG — purely deterministic from ctx state.
 * NFP #4 Fail-soft: No-ops gracefully if hydrology hasn't run yet (lakeIds all -1).
 */
import {
  LAKE_EFFECT_RADIUS,
  LAKE_EFFECT_STRENGTH,
  LAKE_MIN_SIZE_FOR_EFFECT,
  RIVER_VALLEY_TEMP_BOOST,
  RIVER_VALLEY_MOISTURE_BOOST,
} from '../constants';
import type { WorldGenContext } from '../types';

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

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

export function runTempReassessPass(ctx: WorldGenContext): void {
  const { cols, rows } = ctx;
  const total = cols * rows;

  // Fail-soft: check if hydrology has populated lakeIds
  // If all lakeIds are -1 (default from worldGenData), hydrology hasn't run — skip lake effect
  let hasLakeData = false;
  for (let i = 0; i < total; i++) {
    if (ctx.lakeIds[i] >= 0) {
      hasLakeData = true;
      break;
    }
  }

  if (hasLakeData) {
    // 1. Lake effect: count hexes per lake
    const lakeSizes = new Map<number, number>();
    for (let i = 0; i < total; i++) {
      const lakeId = ctx.lakeIds[i];
      if (lakeId >= 0) {
        lakeSizes.set(lakeId, (lakeSizes.get(lakeId) ?? 0) + 1);
      }
    }

    // 2. For each non-lake hex near a large lake, moderate temperature toward 0.5
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const idx = row * cols + col;
        if (ctx.lakeIds[idx] >= 0) continue; // Skip lake hexes themselves

        // BFS to find nearest lake hex within LAKE_EFFECT_RADIUS
        // Simplified: check all hexes within a bounding box
        let minDist = Infinity;
        let nearestLakeId = -1;

        const r1 = Math.max(0, row - LAKE_EFFECT_RADIUS);
        const r2 = Math.min(rows - 1, row + LAKE_EFFECT_RADIUS);
        const c1 = Math.max(0, col - LAKE_EFFECT_RADIUS);
        const c2 = Math.min(cols - 1, col + LAKE_EFFECT_RADIUS);

        for (let nr = r1; nr <= r2; nr++) {
          for (let nc = c1; nc <= c2; nc++) {
            const nIdx = nr * cols + nc;
            const lakeId = ctx.lakeIds[nIdx];
            if (lakeId < 0) continue;
            if ((lakeSizes.get(lakeId) ?? 0) < LAKE_MIN_SIZE_FOR_EFFECT) continue;

            // Manhattan approximation for speed
            const dist = Math.abs(nc - col) + Math.abs(nr - row);
            if (dist < minDist) {
              minDist = dist;
              nearestLakeId = lakeId;
            }
          }
        }

        if (nearestLakeId >= 0 && minDist <= LAKE_EFFECT_RADIUS) {
          const temp = ctx.temperature[idx];
          ctx.temperature[idx] = clamp(
            temp + (0.5 - temp) * LAKE_EFFECT_STRENGTH * (1 - minDist / LAKE_EFFECT_RADIUS),
            0, 1,
          );
        }
      }
    }
  }

  // 3. River valley effect: boost temperature and moisture along rivers
  let hasRiverData = false;
  for (let i = 0; i < total; i++) {
    if (ctx.hasRiver[i] === 1) {
      hasRiverData = true;
      break;
    }
  }

  if (hasRiverData) {
    for (let i = 0; i < total; i++) {
      if (ctx.hasRiver[i] === 1) {
        ctx.temperature[i] = clamp(ctx.temperature[i] + RIVER_VALLEY_TEMP_BOOST, 0, 1);
        ctx.moisture[i] = clamp(ctx.moisture[i] + RIVER_VALLEY_MOISTURE_BOOST, 0, 1);
      }
    }
  }
}
