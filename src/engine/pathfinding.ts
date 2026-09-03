/**
 * Pathfinding — Dijkstra's shortest-path algorithm on the movement graph.
 *
 * Finds the lowest-cost path from start to end, respecting:
 * - Edge costs (computed via computeEdgeCost)
 * - Impassable terrain (cost = Infinity)
 * - Location-only traversal (skips non-location nodes)
 * - Movement edge types: 'adjacent' and 'contains'
 */

import { WorldGraph } from './graph';
import { computeEdgeCost } from './movementCost';
import type { HexCoord, HexTile } from '../types';
import { hexNeighbors, hexDistance } from '../lib/hexMath';
import { hexKey, hexKeyFromCoord } from '../lib/hexKey';
import { getTerrainTax, ROAD_MAJOR_COST_MULTIPLIER, ROAD_TRAIL_COST_MULTIPLIER, MIN_EDGE_COST } from '../data/movement-content';
import { BASE_EDGE_TRAVERSAL_COST } from '../types/movement';

/** Metadata for a road segment used in a path */
export interface RoadSegmentInfo {
  /** Source location node ID */
  fromId: string;
  /** Destination location node ID */
  toId: string;
  /** Road type used */
  roadType: 'major' | 'trail';
  /** Full hex path for this road segment */
  hexPath: HexCoord[];
  /** Discounted cost for this segment */
  discountedCost: number;
}

export interface PathResult {
  /** Node IDs to visit (excludes start) */
  path: string[];
  /** Total accumulated cost */
  totalCost: number;
  /** If set, the path includes road segments with hex-level detail */
  roadSegments?: RoadSegmentInfo[];
}

/**
 * The one Dijkstra (THR-1389). Both public entry points run this: the per-destination
 * `findShortestPath` (an early exit at `endId`) and the single-source
 * `findAllShortestPaths` (no exit — every reachable location priced once).
 *
 * **Why single-source exists.** `generateMovementCandidates` used to call
 * `findShortestPath` once per location node in the world — on the seed-42 small map at
 * tick 120 that was 812 full runs per company member, ~80% of them to unreachable
 * nodes that each exhausted the whole frontier before returning null, repeated for every
 * member every `DECISION_REEVALUATION_TICKS`. Measured: 169 ms per member, 2150 ms per
 * tick of company re-decisions, the 2.5 s worst tick THR-1385 recorded. One run from the
 * member's position prices every reachable destination in 0.44 ms with identical costs
 * (0 mismatches on 2108 destination pairs across two seeded worlds).
 *
 * The frontier is a binary heap keyed on cost; the previous linear scan of an unvisited
 * set was O(n²) and is what put `findShortestPath`'s self time at 38% of a tick.
 * Relaxation is unchanged: `adjacent` and `contains` edges priced by `computeEdgeCost`
 * (agent-aware — traits and range effects), road edges both ways by
 * `computeRoadEdgeCost`. Costs are identical to the old implementation; tie-breaking
 * between equal-cost parents follows heap order, which is deterministic for the same
 * graph and the same start (NFP #3).
 */
interface DijkstraState {
  distance: Map<string, number>;
  parent: Map<string, string>;
  roadEdgeUsed: Map<string, { roadType: 'major' | 'trail'; hexPath: HexCoord[]; discountedCost: number }>;
}

class CostHeap {
  private items: { id: string; cost: number }[] = [];
  get size(): number { return this.items.length; }
  push(id: string, cost: number): void {
    const a = this.items;
    a.push({ id, cost });
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p].cost <= a[i].cost) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }
  pop(): { id: string; cost: number } {
    const a = this.items;
    const top = a[0];
    const last = a.pop()!;
    if (a.length > 0) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < a.length && a[l].cost < a[m].cost) m = l;
        if (r < a.length && a[r].cost < a[m].cost) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }
    return top;
  }
}

function runDijkstra(
  graph: WorldGraph,
  agentId: string,
  startId: string,
  endId: string | null,
): DijkstraState & { reachedEnd: boolean } {
  const distance = new Map<string, number>([[startId, 0]]);
  const parent = new Map<string, string>();
  const roadEdgeUsed: DijkstraState['roadEdgeUsed'] = new Map();
  const settled = new Set<string>();
  const heap = new CostHeap();
  heap.push(startId, 0);

  const relax = (
    from: string,
    to: string,
    cost: number,
    road: { roadType: 'major' | 'trail'; hexPath: HexCoord[]; discountedCost: number } | null,
  ): void => {
    const newDist = distance.get(from)! + cost;
    if (newDist < (distance.get(to) ?? Infinity)) {
      distance.set(to, newDist);
      parent.set(to, from);
      if (road) roadEdgeUsed.set(`${from}→${to}`, road);
      else roadEdgeUsed.delete(`${from}→${to}`);
      heap.push(to, newDist);
    }
  };

  while (heap.size > 0) {
    const { id: current, cost } = heap.pop();
    if (settled.has(current) || cost > (distance.get(current) ?? Infinity)) continue;
    settled.add(current);
    if (endId !== null && current === endId) {
      return { distance, parent, roadEdgeUsed, reachedEnd: true };
    }

    for (const edge of [...graph.getOutgoingEdges(current, 'adjacent'), ...graph.getOutgoingEdges(current, 'contains')]) {
      const neighborNode = graph.getNode(edge.target);
      if (!neighborNode || neighborNode.type !== 'location') continue;
      const edgeCost = computeEdgeCost(graph, agentId, current, edge.target);
      if (edgeCost.totalCost === Infinity) continue;
      relax(current, edge.target, edgeCost.totalCost, null);
    }
    for (const edge of graph.getOutgoingEdges(current, 'road')) {
      const roadCost = computeRoadEdgeCost(edge);
      if (roadCost === null) continue; // Fail-soft: skip corrupt road edge
      relax(current, edge.target, roadCost.discountedCost, roadCost);
    }
    for (const edge of graph.getIncomingEdges(current, 'road')) {
      const roadCost = computeRoadEdgeCost(edge);
      if (roadCost === null) continue;
      relax(current, edge.source, roadCost.discountedCost, { ...roadCost, hexPath: [...roadCost.hexPath].reverse() });
    }
  }
  return { distance, parent, roadEdgeUsed, reachedEnd: false };
}

/**
 * Find the shortest path from a location to a location, as an agent.
 *
 * @returns the path (excluding the start), its cost and any road segments — or null
 *          when either end is not a location node or no path exists.
 */
export function findShortestPath(
  graph: WorldGraph,
  agentId: string,
  startId: string,
  endId: string,
): PathResult | null {
  if (startId === endId) return { path: [], totalCost: 0 };
  const startNode = graph.getNode(startId);
  const endNode = graph.getNode(endId);
  if (!startNode || !endNode) return null;
  if (startNode.type !== 'location' || endNode.type !== 'location') return null;
  const run = runDijkstra(graph, agentId, startId, endId);
  if (!run.reachedEnd) return null;
  return reconstructPath(run.parent, endId, run.distance, run.roadEdgeUsed);
}

/**
 * Every reachable location's shortest path from `startId`, as an agent, in one run.
 *
 * The map is keyed by destination id and excludes the start. Each entry is exactly what
 * `findShortestPath(graph, agentId, startId, id)` returns for that destination. Callers
 * that price many destinations from one spot — movement candidates, company
 * re-decisions — read this instead of calling the per-destination function in a loop.
 */
export function findAllShortestPaths(
  graph: WorldGraph,
  agentId: string,
  startId: string,
): ReadonlyMap<string, PathResult> {
  const out = new Map<string, PathResult>();
  const startNode = graph.getNode(startId);
  if (!startNode || startNode.type !== 'location') return out;
  const run = runDijkstra(graph, agentId, startId, null);
  for (const id of run.distance.keys()) {
    if (id === startId) continue;
    out.set(id, reconstructPath(run.parent, id, run.distance, run.roadEdgeUsed));
  }
  return out;
}

/**
 * Compute discounted road edge cost from a road graph edge.
 * Returns null if the edge is missing required properties (fail-soft).
 */
function computeRoadEdgeCost(
  edge: { properties: Record<string, unknown> },
): { roadType: 'major' | 'trail'; hexPath: HexCoord[]; discountedCost: number } | null {
  const totalCost = edge.properties.totalCost;
  const roadType = edge.properties.roadType as string | undefined;
  const hexPath = edge.properties.hexPath as HexCoord[] | undefined;

  if (typeof totalCost !== 'number' || !isFinite(totalCost)) return null;
  if (roadType !== 'major' && roadType !== 'trail') return null;
  // Fail-soft: road edge without hexPath data can't support hex-by-hex traversal — skip it
  if (!hexPath || hexPath.length < 2) return null;

  const multiplier = roadType === 'major' ? ROAD_MAJOR_COST_MULTIPLIER : ROAD_TRAIL_COST_MULTIPLIER;
  const discountedCost = Math.max(MIN_EDGE_COST, totalCost * multiplier);

  return {
    roadType,
    hexPath: hexPath ?? [],
    discountedCost,
  };
}

/**
 * Reconstruct the path from start to end using the parent map.
 * Also collects road segment info for any road edges used in the path.
 */
function reconstructPath(
  parent: Map<string, string>,
  endId: string,
  distance: Map<string, number>,
  roadEdgeUsed: Map<string, { roadType: 'major' | 'trail'; hexPath: HexCoord[]; discountedCost: number }>,
): PathResult {
  const path: string[] = [];
  let current = endId;

  // Walk backwards from end to start using parent pointers
  while (parent.has(current)) {
    path.unshift(current);
    current = parent.get(current)!;
  }

  // path is now [node1, node2, ..., endId] (excludes start)
  const totalCost = distance.get(endId) ?? 0;

  // Collect road segments from the path
  const roadSegments: RoadSegmentInfo[] = [];
  let prevId = current; // current is now the start ID (walked back past all parents)
  for (const nodeId of path) {
    const roadInfo = roadEdgeUsed.get(`${prevId}→${nodeId}`);
    if (roadInfo) {
      roadSegments.push({
        fromId: prevId,
        toId: nodeId,
        roadType: roadInfo.roadType,
        hexPath: roadInfo.hexPath,
        discountedCost: roadInfo.discountedCost,
      });
    }
    prevId = nodeId;
  }

  return {
    path,
    totalCost,
    ...(roadSegments.length > 0 ? { roadSegments } : {}),
  };
}

// ─── Hex-Grid A* Pathfinder ────────────────────────────────────────────────

export interface HexPathResult {
  /** Hex coordinates to visit (excludes start) */
  path: HexCoord[];
  /** Total accumulated movement cost */
  totalCost: number;
}

/**
 * Find the shortest path between two hex coordinates using A* on the hex grid.
 *
 * Uses actual hex-grid adjacency (6 neighbors per hex) instead of graph edges,
 * so it works for arbitrary hexes — not just those with location nodes.
 *
 * @param tiles — the hex tile array (for terrain lookup)
 * @param from — starting hex coordinate
 * @param to — destination hex coordinate
 * @param cols — grid column count (for bounds checking)
 * @param rows — grid row count (for bounds checking)
 * @returns HexPathResult with hex path and total cost, or null if unreachable
 */
export function findHexPath(
  tiles: HexTile[],
  from: HexCoord,
  to: HexCoord,
  cols: number,
  rows: number,
): HexPathResult | null {
  if (from.col === to.col && from.row === to.row) {
    return { path: [], totalCost: 0 };
  }

  // Build a fast terrain lookup: "col,row" → TerrainType
  const terrainMap = new Map<string, string>();
  for (const tile of tiles) {
    terrainMap.set(hexKeyFromCoord(tile.coord), tile.terrain);
  }

  const key = hexKeyFromCoord;

  // Check destination is passable
  const destTerrain = terrainMap.get(key(to));
  if (!destTerrain || getTerrainTax(destTerrain as import('../types').TerrainType) === Infinity) {
    return null;
  }

  // A* open/closed sets
  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();
  const cameFrom = new Map<string, HexCoord>();
  const openSet = new Set<string>();
  const closedSet = new Set<string>();

  const startKey = key(from);
  gScore.set(startKey, 0);
  fScore.set(startKey, hexDistance(from, to));
  openSet.add(startKey);

  // Store coord for each key to avoid re-parsing
  const coordMap = new Map<string, HexCoord>();
  coordMap.set(startKey, from);

  while (openSet.size > 0) {
    // Find open node with lowest fScore
    let currentKey: string | null = null;
    let bestF = Infinity;
    for (const k of openSet) {
      const f = fScore.get(k) ?? Infinity;
      if (f < bestF) {
        bestF = f;
        currentKey = k;
      }
    }

    if (currentKey === null) break;

    const current = coordMap.get(currentKey)!;
    const toKey = key(to);

    if (currentKey === toKey) {
      // Reconstruct path
      const path: HexCoord[] = [];
      let walk: HexCoord | undefined = to;
      while (walk && !(walk.col === from.col && walk.row === from.row)) {
        path.unshift(walk);
        const wk = key(walk);
        walk = cameFrom.get(wk);
      }
      return { path, totalCost: gScore.get(toKey)! };
    }

    openSet.delete(currentKey);
    closedSet.add(currentKey);

    const currentG = gScore.get(currentKey)!;

    for (const neighbor of hexNeighbors(current)) {
      // Bounds check
      if (neighbor.col < 0 || neighbor.col >= cols || neighbor.row < 0 || neighbor.row >= rows) {
        continue;
      }

      const nk = key(neighbor);
      if (closedSet.has(nk)) continue;

      const terrain = terrainMap.get(nk);
      if (!terrain) continue;

      const tax = getTerrainTax(terrain as import('../types').TerrainType);
      if (tax === Infinity) continue; // Impassable

      const edgeCost = BASE_EDGE_TRAVERSAL_COST + tax;
      const tentativeG = currentG + edgeCost;

      if (tentativeG < (gScore.get(nk) ?? Infinity)) {
        coordMap.set(nk, neighbor);
        cameFrom.set(nk, current);
        gScore.set(nk, tentativeG);
        fScore.set(nk, tentativeG + hexDistance(neighbor, to));
        openSet.add(nk);
      }
    }
  }

  return null; // No path found
}
