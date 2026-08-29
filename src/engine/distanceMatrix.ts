/**
 * distanceMatrix — BFS-based hop-distance matrix between **place-tier** locations.
 *
 * Two live consumers walk a matrix row directly (neither uses {@link getDistance},
 * because both want a whole row rather than a point lookup):
 *   - `socialEncounterGeneration.findVisibleAgents` — every agent-to-agent social
 *     encounter in the game is generated from the locations within
 *     `VISIBLE_AGENT_MAX_HOPS` of the actor.
 *   - `idleBehavior.deriveAmbitionTarget` — an ambitious idle agent drifts to the
 *     nearest location within `MAX_AWARENESS_HOPS`.
 *
 * Both run inside `phaseAgentDecision`, i.e. on the per-tick path.
 *
 * THR-1346: the index is scoped to the **place tier** — `getPlaceTierLocations`,
 * not the bare `getNodesByType('location')`, which since the THR-1183 tier
 * unification returns sublocations too. Two reasons, and the second is the bug:
 *
 *   1. Hop distance from a settlement to a room inside *another* settlement is not
 *      a quantity either consumer wants. Sublocations are reached through
 *      `parentLocationId`, never through `adjacent`.
 *   2. Sublocations outnumber place-tier locations ~2:1 and were consuming the cap.
 *      Measured at seed 42, tick 0 (see MAX_DISTANCE_MATRIX_SIZE below).
 *
 * Excluding them is behaviour-neutral for an agent standing at a sublocation.
 * Measured across all four presets: **zero** sublocations carry an `adjacent` edge
 * in either direction, so a sublocation's row was always `{self: 0}` — and both
 * consumers treat a `{self: 0}` row and a missing row identically (`findVisibleAgents`
 * seeds its set with `sourceLocationId` before consulting the row; `deriveAmbitionTarget`
 * skips `locId === agentLocationId` and so returns `null` either way). Pinned by
 * `distanceMatrix.test.ts` § 'sublocation rows'.
 */
import type { WorldGraph } from './graph';
import { getPlaceTierLocations } from './sublocationShape';

// --- Constants ---

/**
 * Maximum number of locations the matrix will index.
 *
 * TB-088 raised this from 500 to 1200. THR-1346 re-measured it and left the number
 * alone, because the overflow was never about the cap being too low — it was about
 * the matrix indexing the wrong tier.
 *
 * Place-tier locations per preset, measured on a generated world (seed 42, tick 0):
 *
 * | preset | place-tier | all `location` nodes (the pre-THR-1346 index) |
 * | ------ | ---------- | --------------------------------------------- |
 * | small  |        131 |                                           423 |
 * | medium |        214 |                                           654 |
 * | large  |        542 |                                          1628 |
 * | epic   |        791 |                                          2549 |
 *
 * The right-hand column is why `large` and `epic` silently truncated: 235 and 391
 * *real settlements* respectively fell outside the first 1200 by insertion order and
 * got no row at all, which reads to both consumers as "no other location is near me".
 * `?view=game&seeded` derives a `large` map, so the deployed build was running that
 * degradation. The left-hand column is the load the matrix actually carries now, and
 * it leaves ~35% headroom on the largest preset.
 *
 * (CLAUDE.md previously cited "large ~584, epic ~805" — those figures are close to
 * today's place-tier counts and were almost certainly measured before THR-1183 folded
 * sublocations into `getNodesByType('location')`. They were never a measurement of
 * what the matrix was indexing.)
 *
 * The matrix is O(N²) in memory and O(N × E) to build, where N = locations and
 * E = adjacent edges per location. The generated-world assertion in
 * `distanceMatrix.test.ts` is what keeps this table honest — a fixture cannot, since
 * a fixture supplies its own location count.
 */
export const MAX_DISTANCE_MATRIX_SIZE = 1200;

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
 * Build a full hop-distance matrix for every **place-tier** location in the graph.
 *
 * Sublocations are deliberately excluded — see the module header (THR-1346) for the
 * measurement and the behaviour-neutrality argument.
 *
 * If the graph has more than MAX_DISTANCE_MATRIX_SIZE place-tier locations, only
 * the first N (by insertion order from getPlaceTierLocations) are indexed.
 */
export function buildDistanceMatrix(graph: WorldGraph): DistanceMatrix {
  const locationNodes = getPlaceTierLocations(graph);

  // TB-088: Warn if cap is reached instead of silently truncating
  if (locationNodes.length > MAX_DISTANCE_MATRIX_SIZE) {
    console.warn(
      `[DistanceMatrix] Place-tier location count (${locationNodes.length}) exceeds MAX_DISTANCE_MATRIX_SIZE (${MAX_DISTANCE_MATRIX_SIZE}). ` +
      `${locationNodes.length - MAX_DISTANCE_MATRIX_SIZE} locations will not be indexed. ` +
      `Agents standing there will generate no cross-location social encounters and derive no ambition drift target.`
    );
  }

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
