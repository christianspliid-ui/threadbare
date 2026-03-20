import type { HexCoord } from '../types';
import type { WorldGenData } from './worldGenData';
import { hexNeighbors } from '../lib/hexMath';
import { mulberry32 } from '../lib/prng';
import {
  RIVER_SOURCE_COUNT_MIN,
  RIVER_SOURCE_COUNT_MAX,
  RIVER_MIN_LENGTH,
  RIVER_SOURCE_ELEVATION_THRESHOLD,
  RIVER_COASTAL_MAX_STEPS,
  RIVER_MERGE_PROXIMITY_BIAS,
  RIVER_FORK_COASTAL_CHANCE,
  RIVER_FORK_MAX_PER_RIVER,
  RIVER_FORK_MIN_REMAINING_LENGTH,
} from './worldGenData';

function inBounds(col: number, row: number, cols: number, rows: number): boolean {
  return col >= 0 && col < cols && row >= 0 && row < rows;
}

function isEdgeHex(col: number, row: number, cols: number, rows: number): boolean {
  return col === 0 || col === cols - 1 || row === 0 || row === rows - 1;
}

/** Check if a terrain type is open ocean (river terminus) */
function isOpenOcean(t: string): boolean {
  return t === 'ocean' || t === 'deep_ocean' || t === 'tropical_ocean';
}

/**
 * Route a single river path via steepest descent on the drainage elevation surface.
 * Returns the hex path (may be empty if stuck immediately).
 *
 * Features:
 * - Uses drainageElevation for routing (falls back to elevation if not filled)
 * - Coastal continuation: routes through shallows to reach open ocean
 * - Proximity merging: biases toward adjacent river hexes
 * - Terminates at open ocean, grid edge, or confluence
 */
function routeRiver(
  data: WorldGenData,
  startCol: number,
  startRow: number,
  globalVisited: Set<string> | null,
  rng: () => number,
): HexCoord[] {
  const { cols, rows, terrain, hasRiver, drainageElevation, elevation } = data;

  // Use drainageElevation if it's been filled, otherwise fall back to elevation
  const routeElev = drainageElevation[0] !== 0 || elevation[0] !== 0
    ? drainageElevation
    : elevation;
  // More robust check: if drainageElevation is all zeros but elevation isn't, use elevation
  const useDrainage = drainageElevation.some((v, i) => v !== 0 || elevation[i] === 0);
  const elev = useDrainage ? drainageElevation : elevation;

  const path: HexCoord[] = [{ col: startCol, row: startRow }];
  const visited = new Set<string>();
  visited.add(`${startCol},${startRow}`);

  let currentCol = startCol;
  let currentRow = startRow;
  let coastalSteps = 0;
  let inCoastal = false;
  let safety = 0;

  while (safety++ < 500) {
    const currentIdx = currentRow * cols + currentCol;
    const currentElev = elev[currentIdx];
    const currentTerrain = terrain[currentIdx];

    // Track coastal traversal
    if (currentTerrain === 'coastal_shallows') {
      if (!inCoastal) inCoastal = true;
      coastalSteps++;
      if (coastalSteps > RIVER_COASTAL_MAX_STEPS) break;
    }

    // Terminate at grid edge
    if (isEdgeHex(currentCol, currentRow, cols, rows) && path.length > 1) break;

    // Find best neighbor via steepest descent
    const neighbors = hexNeighbors({ col: currentCol, row: currentRow })
      .filter(n => inBounds(n.col, n.row, cols, rows));

    let bestNeighbor: HexCoord | null = null;
    let bestScore = Infinity;

    for (const n of neighbors) {
      const key = `${n.col},${n.row}`;
      if (visited.has(key)) continue;
      if (globalVisited?.has(key)) continue;
      const nIdx = n.row * cols + n.col;
      let score = elev[nIdx];

      // Proximity merge bias: if this neighbor is adjacent to an existing river hex
      // (but isn't itself a river hex), reduce its score slightly to attract the river
      // toward existing rivers for natural-looking confluence
      if (hasRiver[nIdx] === 0) {
        const nNeighbors = hexNeighbors(n).filter(nn => inBounds(nn.col, nn.row, cols, rows));
        for (const nn of nNeighbors) {
          const nnKey = `${nn.col},${nn.row}`;
          if (visited.has(nnKey)) continue;
          const nnIdx = nn.row * cols + nn.col;
          if (hasRiver[nnIdx] === 1) {
            score -= RIVER_MERGE_PROXIMITY_BIAS;
            break;
          }
        }
      }

      if (score < bestScore) {
        bestScore = score;
        bestNeighbor = n;
      }
    }

    // If no strictly downhill neighbor, try near-flat (plateau traversal)
    if (!bestNeighbor || bestScore >= currentElev) {
      for (const n of neighbors) {
        const key = `${n.col},${n.row}`;
        if (visited.has(key)) continue;
        if (globalVisited?.has(key)) continue;
        const nIdx = n.row * cols + n.col;
        if (elev[nIdx] <= currentElev + 0.01) {
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
    const nTerrain = terrain[nIdx];

    // Terminate at open ocean
    if (isOpenOcean(nTerrain)) break;

    // Terminate at lake (lake outflows are handled separately)
    if (nTerrain === 'lake') break;

    // Terminate at confluence (existing river)
    if (hasRiver[nIdx] === 1) break;
  }

  return path;
}

/**
 * Generate rivers via steepest-descent routing from high-elevation sources.
 *
 * Uses drainageElevation (from fillDepressions) for routing so rivers cross
 * filled depressions instead of dead-ending. Falls back to raw elevation if
 * fillDepressions hasn't run.
 *
 * Features:
 * - Coastal continuation: rivers route through shallows to open ocean
 * - Proximity merging: rivers bias toward adjacent existing rivers
 * - Delta forking: rivers can fork near the coast into distributaries
 *
 * Mutates data.hasRiver and data.riverPaths in place.
 */
export function generateRivers(data: WorldGenData): void {
  const { cols, rows, seed, elevation, isOcean, terrain, hasRiver } = data;
  const rng = mulberry32(seed + 7919);

  // 1. Find candidate sources: high-elevation land hexes
  const candidates: { col: number; row: number; elev: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      if (isOcean[idx]) continue;
      if (elevation[idx] >= RIVER_SOURCE_ELEVATION_THRESHOLD) {
        candidates.push({ col: c, row: r, elev: elevation[idx] });
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
  let nextRiverId = 0;

  for (let s = 0; s < sourceCount; s++) {
    const source = candidates[s];
    if (!source) continue;

    const path = routeRiver(data, source.col, source.row, null, rng);

    // Discard rivers that are too short
    if (path.length < RIVER_MIN_LENGTH) continue;

    // Mark hexes and store path
    for (const hex of path) {
      hasRiver[hex.row * cols + hex.col] = 1;
    }

    const riverId = `river-${nextRiverId++}`;
    data.riverPaths.push({ id: riverId, hexes: path });

    // 3. Delta forking: try to fork near coastal/low-elevation areas
    let forksCreated = 0;
    for (let i = Math.max(1, path.length - 6); i < path.length - 1 && forksCreated < RIVER_FORK_MAX_PER_RIVER; i++) {
      const hex = path[i];
      const idx = hex.row * cols + hex.col;
      const remainingLength = path.length - i;

      if (remainingLength < RIVER_FORK_MIN_REMAINING_LENGTH) continue;

      // Only fork near coast or in low elevation areas
      const isNearCoast = terrain[idx] === 'coastal_shallows' ||
        hexNeighbors(hex)
          .filter(n => inBounds(n.col, n.row, cols, rows))
          .some(n => {
            const t = terrain[n.row * cols + n.col];
            return t === 'coastal_shallows' || isOpenOcean(t);
          });

      if (!isNearCoast && elevation[idx] > 0.3) continue;

      if (rng() > RIVER_FORK_COASTAL_CHANCE) continue;

      // Find a fork direction: a neighbor that isn't on the main path
      // and is downhill, but in a different direction
      const mainPathSet = new Set(path.map(h => `${h.col},${h.row}`));
      const forkPath = routeRiver(data, hex.col, hex.row, mainPathSet, rng);

      if (forkPath.length < 2) continue;

      // Mark fork hexes (skip first hex — it's the shared fork point)
      for (let j = 1; j < forkPath.length; j++) {
        hasRiver[forkPath[j].row * cols + forkPath[j].col] = 1;
      }

      data.riverPaths.push({
        id: `${riverId}-fork-${forksCreated}`,
        hexes: forkPath,
      });
      forksCreated++;
    }
  }
}
