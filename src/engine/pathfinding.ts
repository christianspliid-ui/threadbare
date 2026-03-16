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
import { getTerrainTax } from '../data/movement-content';
import { BASE_EDGE_TRAVERSAL_COST } from '../types/movement';

export interface PathResult {
  /** Node IDs to visit (excludes start) */
  path: string[];
  /** Total accumulated cost */
  totalCost: number;
}

/**
 * Find the shortest path from startId to endId using Dijkstra's algorithm.
 *
 * @param graph — the world graph
 * @param agentId — the actor traveling (used for speed modifier calculation)
 * @param startId — starting location node ID
 * @param endId — destination location node ID
 * @returns PathResult with path and totalCost, or null if unreachable
 */
export function findShortestPath(
  graph: WorldGraph,
  agentId: string,
  startId: string,
  endId: string,
): PathResult | null {
  // Special case: already at destination
  if (startId === endId) {
    return {
      path: [],
      totalCost: 0,
    };
  }

  // Validate start and end nodes exist and are locations
  const startNode = graph.getNode(startId);
  const endNode = graph.getNode(endId);

  if (!startNode || !endNode) {
    return null;
  }

  if (startNode.type !== 'location' || endNode.type !== 'location') {
    return null;
  }

  // --- Dijkstra's Algorithm ---

  // Distance map: nodeId → lowest cost found so far
  const distance = new Map<string, number>();
  distance.set(startId, 0);

  // Parent map: nodeId → previous nodeId on shortest path
  const parent = new Map<string, string>();

  // Priority queue: array of unvisited nodeIds (we'll sort manually)
  // For ~320 hexes, O(n²) sorting is acceptable
  const unvisited = new Set<string>();

  // Initialize unvisited set with start node
  unvisited.add(startId);

  while (unvisited.size > 0) {
    // Find unvisited node with minimum distance
    let current: string | null = null;
    let minDist = Infinity;

    for (const nodeId of unvisited) {
      const d = distance.get(nodeId) ?? Infinity;
      if (d < minDist) {
        minDist = d;
        current = nodeId;
      }
    }

    if (current === null || minDist === Infinity) {
      // No path found
      break;
    }

    // If we reached the end, we can return early (Dijkstra property)
    if (current === endId) {
      return reconstructPath(parent, endId, distance);
    }

    unvisited.delete(current);

    const currentNode = graph.getNode(current)!;

    // Examine all outgoing edges from current
    // Include both 'adjacent' and 'contains' edge types
    const outgoingEdges = [
      ...graph.getOutgoingEdges(current, 'adjacent'),
      ...graph.getOutgoingEdges(current, 'contains'),
    ];

    for (const edge of outgoingEdges) {
      const neighborId = edge.target;
      const neighborNode = graph.getNode(neighborId);

      // Skip non-location nodes (only traverse locations)
      if (!neighborNode || neighborNode.type !== 'location') {
        continue;
      }

      // Compute edge cost (includes terrain and location entry taxes)
      const edgeCost = computeEdgeCost(graph, agentId, current, neighborId);

      // Skip impassable edges (Infinity cost)
      if (edgeCost.totalCost === Infinity) {
        continue;
      }

      const currentDist = distance.get(current)!;
      const newDist = currentDist + edgeCost.totalCost;
      const neighborDist = distance.get(neighborId) ?? Infinity;

      // If we found a shorter path, update it
      if (newDist < neighborDist) {
        distance.set(neighborId, newDist);
        parent.set(neighborId, current);
        // Add to unvisited if not already present
        unvisited.add(neighborId);
      }
    }
  }

  // If we exit the loop without reaching endId, no path exists
  return null;
}

/**
 * Reconstruct the path from start to end using the parent map.
 */
function reconstructPath(
  parent: Map<string, string>,
  endId: string,
  distance: Map<string, number>,
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

  return {
    path,
    totalCost,
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
    terrainMap.set(`${tile.coord.col},${tile.coord.row}`, tile.terrain);
  }

  const key = (c: HexCoord) => `${c.col},${c.row}`;

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
