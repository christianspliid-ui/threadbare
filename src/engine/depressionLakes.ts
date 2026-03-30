import type { WorldGenData } from './worldGenData';
import { DEPRESSION_LAKE_MIN_SIZE } from './worldGenData';

/**
 * Get flat-array neighbor indices for a hex in odd-q offset coordinates.
 */
function getNeighborIndices(idx: number, cols: number, rows: number): number[] {
  const col = idx % cols;
  const row = Math.floor(idx / cols);
  const isOddCol = col % 2 === 1;
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
 * Promote multi-hex river-fed depressions to lakes.
 *
 * After river generation, identifies contiguous clusters of filled hexes
 * (filledDepth > 0) where at least one hex has a river flowing through it.
 * Clusters >= DEPRESSION_LAKE_MIN_SIZE are converted to lake terrain.
 *
 * Must run AFTER generateRivers and AFTER fillDepressions.
 * Must run BEFORE generateLakeOutflows.
 *
 * Mutates data.terrain and data.lakeIds in place.
 */
export function promoteDepressionLakes(data: WorldGenData): void {
  const { cols, rows, filledDepth, hasRiver, terrain, lakeIds } = data;
  const total = cols * rows;

  // Skip if fillDepressions didn't run (filledDepth is all zeros)
  if (!filledDepth.some(d => d > 0)) return;

  const visited = new Uint8Array(total);

  // Find next available lake ID
  let nextLakeId = 0;
  for (let i = 0; i < total; i++) {
    if (lakeIds[i] >= nextLakeId) nextLakeId = lakeIds[i] + 1;
  }

  for (let i = 0; i < total; i++) {
    if (visited[i]) continue;
    if (filledDepth[i] <= 0) continue;
    if (terrain[i] === 'lake') continue; // already a lake from generateLakes

    // Flood-fill this depression cluster
    const cluster: number[] = [i];
    visited[i] = 1;
    let hasRiverInCluster = hasRiver[i] === 1;
    const queue = [i];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const neighbors = getNeighborIndices(current, cols, rows);
      for (const n of neighbors) {
        if (visited[n]) continue;
        if (filledDepth[n] <= 0) continue;
        if (terrain[n] === 'lake') continue;
        visited[n] = 1;
        cluster.push(n);
        if (hasRiver[n] === 1) hasRiverInCluster = true;
        queue.push(n);
      }
    }

    // Only promote if river-fed and large enough
    if (!hasRiverInCluster) continue;
    if (cluster.length < DEPRESSION_LAKE_MIN_SIZE) continue;

    const id = nextLakeId++;
    for (const idx of cluster) {
      terrain[idx] = 'lake';
      lakeIds[idx] = id;
    }
  }
}
