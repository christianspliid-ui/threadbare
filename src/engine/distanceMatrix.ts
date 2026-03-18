/**
 * distanceMatrix — BFS-based hop-distance matrix between location nodes.
 *
 * Used by encounter awareness filter and scoring formula for fast
 * distance lookups without repeated graph traversals.
 */
import type { WorldGraph } from './graph';

// --- Constants ---

/** Maximum number of locations the matrix will index. */
export const MAX_DISTANCE_MATRIX_SIZE = 500;

// --- Types ---

export interface DistanceMatrix {
  /** Nested map: distances.get(fromId)?.get(toId) → hop count */
  distances: Map<string, Map<string, number>>;
  /** Tick at which the matrix was last fully rebuilt */
  builtAtTick: number;
  /** Number of locations currently indexed */
  locationCount: number;
}

// --- Helpers ---

/**
 * BFS from a single source location, returning hop distances to all
 * reachable location nodes via `adjacent` edges (bidirectional).
 */
function bfsFrom(
  graph: WorldGraph,
  sourceId: string,
  locationIds: ReadonlySet<string>,
): Map<string, number> {
  const dist = new Map<string, number>();
  dist.set(sourceId, 0);

  const queue: string[] = [sourceId];
  let head = 0;

  while (head < queue.length) {
    const current = queue[head++];
    const currentDist = dist.get(current)!;

    // Follow outgoing adjacent edges (current → neighbor)
    for (const edge of graph.getOutgoingEdges(current, 'adjacent')) {
      const neighbor = edge.target;
      if (!locationIds.has(neighbor)) continue;
      if (dist.has(neighbor)) continue;
      dist.set(neighbor, currentDist + 1);
      queue.push(neighbor);
    }

    // Follow incoming adjacent edges (neighbor → current, bidirectional)
    for (const edge of graph.getIncomingEdges(current, 'adjacent')) {
      const neighbor = edge.source;
      if (!locationIds.has(neighbor)) continue;
      if (dist.has(neighbor)) continue;
      dist.set(neighbor, currentDist + 1);
      queue.push(neighbor);
    }
  }

  return dist;
}

// --- Public API ---

/**
 * Build a full hop-distance matrix for all location nodes in the graph.
 *
 * If the graph has more than MAX_DISTANCE_MATRIX_SIZE locations, only
 * the first N (by insertion order from getNodesByType) are indexed.
 */
export function buildDistanceMatrix(graph: WorldGraph): DistanceMatrix {
  const locationNodes = graph.getNodesByType('location');
  const capped = locationNodes.slice(0, MAX_DISTANCE_MATRIX_SIZE);
  const locationIds = new Set(capped.map((n) => n.id));

  const distances = new Map<string, Map<string, number>>();

  for (const id of locationIds) {
    distances.set(id, bfsFrom(graph, id, locationIds));
  }

  return {
    distances,
    builtAtTick: 0,
    locationCount: locationIds.size,
  };
}

/**
 * Look up the hop distance between two locations.
 * Returns Infinity if either ID is not in the matrix or they are unreachable.
 */
export function getDistance(
  matrix: DistanceMatrix,
  fromId: string,
  toId: string,
): number {
  const row = matrix.distances.get(fromId);
  if (!row) return Infinity;
  return row.get(toId) ?? Infinity;
}

/**
 * Incrementally add a new location to an existing matrix.
 * BFS from the new location populates its row, then each existing row
 * is updated with its distance to the new location.
 */
export function addLocation(
  matrix: DistanceMatrix,
  graph: WorldGraph,
  locationId: string,
): void {
  // Gather the set of already-indexed locations plus the new one
  const locationIds = new Set(matrix.distances.keys());
  locationIds.add(locationId);

  // BFS from the new location
  const newRow = bfsFrom(graph, locationId, locationIds);
  matrix.distances.set(locationId, newRow);

  // Update existing rows: distance from existing → new = distance from new → existing
  for (const [existingId, existingRow] of matrix.distances) {
    if (existingId === locationId) continue;
    const d = newRow.get(existingId);
    if (d !== undefined) {
      existingRow.set(locationId, d);
    }
  }

  matrix.locationCount = matrix.distances.size;
}

/**
 * Remove a location from the matrix. Deletes its row and removes it
 * from all other rows.
 */
export function removeLocation(
  matrix: DistanceMatrix,
  locationId: string,
): void {
  matrix.distances.delete(locationId);

  for (const row of matrix.distances.values()) {
    row.delete(locationId);
  }

  matrix.locationCount = matrix.distances.size;
}
