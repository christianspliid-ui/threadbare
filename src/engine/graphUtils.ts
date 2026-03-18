/**
 * Graph Utilities — general-purpose graph traversal algorithms.
 *
 * These operate on WorldGraph and are used by multiple systems
 * (reputation walks, distance matrix, social awareness).
 *
 * NFP: Fail-soft (returns empty on missing nodes), Determinism (no randomness),
 * Inspectability (returns full path data).
 */

import type { WorldGraph } from './graph';
import type { EdgeType } from '../types/graph';

// ─── Constants ───────────────────────────────────────────────────

/** Maximum nodes visited during a single findAllPaths call (safety cap) */
export const REPUTATION_WALK_MAX_NODES = 100;

// ─── Path Types ──────────────────────────────────────────────────

/** A single path through the graph: sequence of node IDs from source to target */
export interface GraphPath {
  /** Ordered node IDs from source to target (inclusive) */
  nodeIds: string[];
  /** Edge IDs traversed (length = nodeIds.length - 1) */
  edgeIds: string[];
  /** Number of hops (edges) in this path */
  hops: number;
}

// ─── findAllPaths ────────────────────────────────────────────────

/**
 * Find all simple paths between two nodes in the graph, bounded by max hops
 * and a safety cap on total nodes visited.
 *
 * Uses depth-limited DFS with visited tracking to find simple paths
 * (no repeated nodes). Bidirectional edges are followed in both directions
 * (outgoing edges from each node).
 *
 * @param graph - The world graph to search
 * @param sourceId - Starting node ID
 * @param targetId - Destination node ID
 * @param maxHops - Maximum number of edges to traverse (inclusive)
 * @param edgeType - Optional edge type filter (only traverse edges of this type)
 * @returns Array of paths from source to target, shortest first. Empty if no paths found.
 *
 * Fail-soft: returns [] if source or target doesn't exist.
 */
export function findAllPaths(
  graph: WorldGraph,
  sourceId: string,
  targetId: string,
  maxHops: number,
  edgeType?: EdgeType,
): GraphPath[] {
  // Fail-soft: missing nodes → empty result
  if (!graph.getNode(sourceId) || !graph.getNode(targetId)) return [];
  if (sourceId === targetId) return [];
  if (maxHops <= 0) return [];

  const results: GraphPath[] = [];
  let nodesVisited = 0;

  // DFS with backtracking
  function dfs(
    currentId: string,
    pathNodes: string[],
    pathEdges: string[],
    visited: Set<string>,
  ): void {
    if (nodesVisited >= REPUTATION_WALK_MAX_NODES) return;

    const edges = graph.getOutgoingEdges(currentId, edgeType);
    // Also check incoming edges (relationships are often bidirectional)
    const incomingEdges = graph.getIncomingEdges(currentId, edgeType);

    const allNeighborEdges = [
      ...edges.map(e => ({ edge: e, neighborId: e.target })),
      ...incomingEdges.map(e => ({ edge: e, neighborId: e.source })),
    ];

    for (const { edge, neighborId } of allNeighborEdges) {
      if (visited.has(neighborId)) continue;
      if (nodesVisited >= REPUTATION_WALK_MAX_NODES) return;

      nodesVisited++;
      const nextNodes = [...pathNodes, neighborId];
      const nextEdges = [...pathEdges, edge.id];

      if (neighborId === targetId) {
        results.push({
          nodeIds: nextNodes,
          hops: nextEdges.length,
          edgeIds: nextEdges,
        });
        continue; // Don't traverse further from target
      }

      // Only recurse if we haven't hit max hops
      if (nextEdges.length < maxHops) {
        visited.add(neighborId);
        dfs(neighborId, nextNodes, nextEdges, visited);
        visited.delete(neighborId);
      }
    }
  }

  const visited = new Set<string>([sourceId]);
  nodesVisited = 1;
  dfs(sourceId, [sourceId], [], visited);

  // Sort by hops (shortest first), then by path string for determinism
  results.sort((a, b) => {
    if (a.hops !== b.hops) return a.hops - b.hops;
    return a.nodeIds.join(',').localeCompare(b.nodeIds.join(','));
  });

  return results;
}
