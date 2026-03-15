import type { HexCoord } from '../types';
import type { WorldGenData } from './worldGenData';
import { hexNeighbors } from '../lib/hexMath';
import { mulberry32 } from '../lib/prng';
import {
  RIVER_SOURCE_COUNT_MIN,
  RIVER_SOURCE_COUNT_MAX,
  RIVER_MIN_LENGTH,
  RIVER_SOURCE_ELEVATION_THRESHOLD,
} from './worldGenData';

function inBounds(col: number, row: number, cols: number, rows: number): boolean {
  return col >= 0 && col < cols && row >= 0 && row < rows;
}

/**
 * Generate rivers via steepest-descent routing from high-elevation sources.
 * Mutates data.hasRiver and data.riverPaths in place.
 */
export function generateRivers(data: WorldGenData): void {
  const { cols, rows, seed, elevation, isOcean, terrain, hasRiver } = data;
  const rng = mulberry32(seed + 7919); // offset seed for river-specific randomness

  // 1. Find candidate sources: high-elevation land hexes
  const candidates: { col: number; row: number; elev: number }[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const idx = row * cols + col;
      if (isOcean[idx]) continue;
      if (elevation[idx] >= RIVER_SOURCE_ELEVATION_THRESHOLD) {
        candidates.push({ col, row, elev: elevation[idx] });
      }
    }
  }

  // Sort by elevation descending, then pick top N
  candidates.sort((a, b) => b.elev - a.elev);
  const sourceCount = Math.min(
    candidates.length,
    RIVER_SOURCE_COUNT_MIN + Math.floor(rng() * (RIVER_SOURCE_COUNT_MAX - RIVER_SOURCE_COUNT_MIN + 1))
  );

  // 2. Route each river via steepest descent
  for (let s = 0; s < sourceCount; s++) {
    const source = candidates[s];
    if (!source) continue;

    const path: HexCoord[] = [{ col: source.col, row: source.row }];
    const visited = new Set<string>();
    visited.add(`${source.col},${source.row}`);

    let currentCol = source.col;
    let currentRow = source.row;
    let safety = 0;

    while (safety++ < 500) {
      const currentIdx = currentRow * cols + currentCol;
      const currentElev = elevation[currentIdx];

      // Find lowest-elevation neighbor using canonical hexNeighbors
      const neighbors = hexNeighbors({ col: currentCol, row: currentRow })
        .filter(n => inBounds(n.col, n.row, cols, rows));

      let bestNeighbor: HexCoord | null = null;
      let bestElev = currentElev;

      for (const n of neighbors) {
        const key = `${n.col},${n.row}`;
        if (visited.has(key)) continue;
        const nIdx = n.row * cols + n.col;
        if (elevation[nIdx] < bestElev) {
          bestElev = elevation[nIdx];
          bestNeighbor = n;
        }
      }

      // If no downhill neighbor, try flat terrain (allows traversal across plateaus)
      if (!bestNeighbor) {
        for (const n of neighbors) {
          const key = `${n.col},${n.row}`;
          if (visited.has(key)) continue;
          const nIdx = n.row * cols + n.col;
          if (elevation[nIdx] <= currentElev + 0.01) {
            bestNeighbor = n;
            break;
          }
        }
      }

      if (!bestNeighbor) break;

      path.push(bestNeighbor);
      visited.add(`${bestNeighbor.col},${bestNeighbor.row}`);
      currentCol = bestNeighbor.col;
      currentRow = bestNeighbor.row;

      const nIdx = currentRow * cols + currentCol;

      // Terminate at ocean, lake, or confluence
      const nTerrain = terrain[nIdx];
      if (nTerrain === 'ocean' || nTerrain === 'coastal_shallows' || nTerrain === 'lake') break;
      if (hasRiver[nIdx] === 1) break; // confluence
    }

    // Discard rivers that are too short
    if (path.length < RIVER_MIN_LENGTH) continue;

    // Mark hexes and store path
    for (const hex of path) {
      hasRiver[hex.row * cols + hex.col] = 1;
    }

    data.riverPaths.push({
      id: `river-${s}`,
      hexes: path,
    });
  }
}
