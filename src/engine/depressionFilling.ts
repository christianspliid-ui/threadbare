import type { WorldGenData } from './worldGenData';
import { DRAIN_EPSILON } from './worldGenData';

/**
 * Get flat-array neighbor indices for a hex in odd-q offset coordinates.
 * Matches the canonical hexNeighbors in src/lib/hexMath.ts.
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
 * Simple min-heap for priority-flood algorithm.
 * Stores { idx, elevation } pairs ordered by elevation.
 */
class MinHeap {
  private data: { idx: number; elev: number }[] = [];

  get size(): number { return this.data.length; }

  push(item: { idx: number; elev: number }): void {
    this.data.push(item);
    this.bubbleUp(this.data.length - 1);
  }

  pop(): { idx: number; elev: number } | undefined {
    if (this.data.length === 0) return undefined;
    const top = this.data[0];
    const last = this.data.pop()!;
    if (this.data.length > 0) {
      this.data[0] = last;
      this.sinkDown(0);
    }
    return top;
  }

  private bubbleUp(i: number): void {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.data[i].elev >= this.data[parent].elev) break;
      [this.data[i], this.data[parent]] = [this.data[parent], this.data[i]];
      i = parent;
    }
  }

  private sinkDown(i: number): void {
    const n = this.data.length;
    while (true) {
      let smallest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      if (left < n && this.data[left].elev < this.data[smallest].elev) smallest = left;
      if (right < n && this.data[right].elev < this.data[smallest].elev) smallest = right;
      if (smallest === i) break;
      [this.data[i], this.data[smallest]] = [this.data[smallest], this.data[i]];
      i = smallest;
    }
  }
}

/**
 * Priority-flood pit-filling (simplified Planchon-Darboux).
 *
 * Produces a drainageElevation surface where every land hex has a guaranteed
 * downhill path to an edge or ocean hex. The original elevation array is unchanged.
 *
 * Also computes filledDepth (drainageElevation - elevation) for each hex,
 * used later by promoteDepressionLakes to identify multi-hex basins.
 *
 * Mutates data.drainageElevation and data.filledDepth in place.
 */
export function fillDepressions(data: WorldGenData): void {
  const { cols, rows, elevation, isOcean, terrain, drainageElevation, filledDepth } = data;
  const total = cols * rows;
  const resolved = new Uint8Array(total);
  const heap = new MinHeap();

  // Initialize drainageElevation as copy of elevation
  drainageElevation.set(elevation);

  // Seed with edge hexes and ocean/lake hexes — these are "resolved" (drain naturally)
  for (let i = 0; i < total; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const isEdge = col === 0 || col === cols - 1 || row === 0 || row === rows - 1;
    const isWater = isOcean[i] === 1 || terrain[i] === 'lake';

    if (isEdge || isWater) {
      resolved[i] = 1;
      heap.push({ idx: i, elev: elevation[i] });
    }
  }

  // Process: flood outward from resolved hexes
  while (heap.size > 0) {
    const current = heap.pop()!;
    const neighbors = getNeighborIndices(current.idx, cols, rows);

    for (const nIdx of neighbors) {
      if (resolved[nIdx]) continue;
      resolved[nIdx] = 1;

      if (elevation[nIdx] >= drainageElevation[current.idx]) {
        // Neighbor drains naturally — its elevation is already >= current
        drainageElevation[nIdx] = elevation[nIdx];
      } else {
        // Neighbor is in a depression — raise it to current + epsilon
        drainageElevation[nIdx] = drainageElevation[current.idx] + DRAIN_EPSILON;
      }

      filledDepth[nIdx] = drainageElevation[nIdx] - elevation[nIdx];
      heap.push({ idx: nIdx, elev: drainageElevation[nIdx] });
    }
  }
}
