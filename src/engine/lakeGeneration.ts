import type { WorldGenData } from './worldGenData';
import { mulberry32 } from '../lib/prng';
import {
  LAKE_SIZE_MIN,
  LAKE_SIZE_MAX,
  GREAT_LAKE_SIZE_MAX,
  GREAT_LAKE_COUNT,
} from './worldGenData';

/**
 * Get flat-array neighbor indices for a hex in odd-q offset coordinates.
 * Matches the canonical hexNeighbors in src/lib/hexMath.ts.
 */
function getNeighborIndices(idx: number, cols: number, rows: number): number[] {
  const col = idx % cols;
  const row = Math.floor(idx / cols);
  const isOddCol = col % 2 === 1;
  // Odd-q flat-top: odd columns shift down
  const offsets = isOddCol
    ? [[1, 1], [1, 0], [0, -1], [-1, 0], [-1, 1], [0, 1]]
    : [[1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [0, 1]];

  const neighbors: number[] = [];
  for (const [dc, dr] of offsets) {
    const nc = col + dc;
    const nr = row + dr;
    if (nc >= 0 && nc < cols && nr >= 0 && nr < rows) {
      neighbors.push(nr * cols + nc);
    }
  }
  return neighbors;
}

/**
 * Generate lakes by finding elevation basins and flood-filling.
 *
 * Algorithm:
 * 1. Find local minima (lower than or equal to all neighbors) that aren't ocean
 * 2. Flood-fill from basin center up to a pour-point elevation threshold
 * 3. Size constraints: 1–5 hexes for normal lakes, max 1 great lake (6–12 hexes)
 * 4. Mark lake hexes with terrain type 'lake' and assign lakeId
 */
export function generateLakes(data: WorldGenData): void {
  const { cols, rows, seed, elevation, isOcean, terrain, lakeIds } = data;
  const rng = mulberry32(seed + 1013);
  const total = cols * rows;

  // Find local minima (lower than all neighbors) that aren't ocean
  const minima: { idx: number; elev: number }[] = [];
  for (let i = 0; i < total; i++) {
    if (isOcean[i]) continue;
    if (terrain[i] === 'lake') continue; // already a lake from biome classification

    const neighbors = getNeighborIndices(i, cols, rows);
    const isMinimum = neighbors.every(n => elevation[n] >= elevation[i]);
    if (isMinimum && elevation[i] < 0.5) { // only in low-to-mid elevation
      minima.push({ idx: i, elev: elevation[i] });
    }
  }

  // Sort by elevation (lowest first — most likely to be real basins)
  minima.sort((a, b) => a.elev - b.elev);

  let lakeIdCounter = 0;
  let greatLakeCount = 0;

  for (const basin of minima) {
    if (lakeIds[basin.idx] >= 0) continue; // already claimed

    // Determine max size for this lake
    const isGreatLake = greatLakeCount < GREAT_LAKE_COUNT && rng() < 0.15;
    const maxSize = isGreatLake ? GREAT_LAKE_SIZE_MAX : LAKE_SIZE_MAX;

    // Flood-fill from basin center
    const lakeCells: number[] = [basin.idx];
    const visited = new Set<number>([basin.idx]);
    const frontier: { idx: number; elev: number }[] = [];

    // Add neighbors to frontier
    for (const n of getNeighborIndices(basin.idx, cols, rows)) {
      if (!isOcean[n] && !visited.has(n) && lakeIds[n] < 0) {
        frontier.push({ idx: n, elev: elevation[n] });
      }
    }
    frontier.sort((a, b) => a.elev - b.elev);

    // Pour point: expand while below pour threshold
    const pourThreshold = elevation[basin.idx] + 0.08;

    while (lakeCells.length < maxSize && frontier.length > 0) {
      const next = frontier.shift()!;
      if (elevation[next.idx] > pourThreshold) break;
      if (visited.has(next.idx)) continue;

      visited.add(next.idx);
      lakeCells.push(next.idx);

      for (const n of getNeighborIndices(next.idx, cols, rows)) {
        if (!isOcean[n] && !visited.has(n) && lakeIds[n] < 0) {
          frontier.push({ idx: n, elev: elevation[n] });
        }
      }
      frontier.sort((a, b) => a.elev - b.elev);
    }

    // Only keep if meets minimum size
    if (lakeCells.length < LAKE_SIZE_MIN) continue;

    // Assign lake
    const id = lakeIdCounter++;
    if (isGreatLake && lakeCells.length > LAKE_SIZE_MAX) {
      greatLakeCount++;
    }

    for (const cellIdx of lakeCells) {
      lakeIds[cellIdx] = id;
      terrain[cellIdx] = 'lake';
    }
  }
}
