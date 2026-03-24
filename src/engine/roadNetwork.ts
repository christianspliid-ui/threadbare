/**
 * Road Network — generates road graph edges during worldgen.
 *
 * Algorithm:
 * 1. Group settlements by region (province) using 'contains' edges
 * 2. Per province, build a Minimum Spanning Tree (MST) connecting
 *    road-worthy settlements (capitals, cities, towns, forts, castles)
 *    using A* pathfinding costs as edge weights (terrain-aware)
 * 3. Connect each hamlet to its nearest road-worthy settlement via trail
 *
 * NFP #1: All tuning in ROAD_NETWORK_CONSTANTS.
 * NFP #2: Road edges carry hexPath, totalCost, pathLength for tracing.
 * NFP #3: Deterministic — same tiles + same graph = same roads.
 * NFP #4: Fail-soft — empty regions, single settlements, water blocks → no crash.
 */

import type { WorldGraph } from './graph';
import type { GraphNode } from '../types/graph';
import type { HexCoord, HexTile } from '../types';
import { findHexPath } from './pathfinding';

// ─── Types ────────────────────────────────────────────────────────────────────

export type RoadType = 'major' | 'trail';

export interface RoadPath {
  path: HexCoord[];
  roadType: RoadType;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * | Constant            | Default                                       | Purpose                                    |
 * |---------------------|-----------------------------------------------|--------------------------------------------|
 * | ROAD_WORTHY_TYPES   | capital, city, town, fort, castle              | Settlement types connected by major roads  |
 * | TRAIL_WORTHY_TYPES  | hamlet                                        | Settlement types connected by trails       |
 */
export const ROAD_NETWORK_CONSTANTS = {
  ROAD_WORTHY_TYPES: ['capital', 'city', 'town', 'fort', 'castle'] as readonly string[],
  TRAIL_WORTHY_TYPES: ['hamlet'] as readonly string[],
} as const;

// ─── Union-Find for Kruskal's MST ────────────────────────────────────────────

class UnionFind {
  private parent: Map<string, string> = new Map();
  private rank: Map<string, number> = new Map();

  find(x: string): string {
    if (!this.parent.has(x)) {
      this.parent.set(x, x);
      this.rank.set(x, 0);
    }
    let root = x;
    while (this.parent.get(root) !== root) {
      root = this.parent.get(root)!;
    }
    // Path compression
    let curr = x;
    while (curr !== root) {
      const next = this.parent.get(curr)!;
      this.parent.set(curr, root);
      curr = next;
    }
    return root;
  }

  union(a: string, b: string): void {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra === rb) return;
    const rankA = this.rank.get(ra) ?? 0;
    const rankB = this.rank.get(rb) ?? 0;
    if (rankA < rankB) {
      this.parent.set(ra, rb);
    } else if (rankA > rankB) {
      this.parent.set(rb, ra);
    } else {
      this.parent.set(rb, ra);
      this.rank.set(ra, rankA + 1);
    }
  }

  connected(a: string, b: string): boolean {
    return this.find(a) === this.find(b);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface SettlementInfo {
  id: string;
  locationType: string;
  coord: HexCoord;
}

/**
 * Extract settlement info from a graph node.
 * Fail-soft: returns null if required properties are missing.
 */
function toSettlementInfo(node: GraphNode): SettlementInfo | null {
  const hexCol = node.properties.hexCol as number | undefined;
  const hexRow = node.properties.hexRow as number | undefined;
  const locationType = node.properties.locationType as string | undefined;
  if (hexCol == null || hexRow == null || !locationType) return null;
  return {
    id: node.id,
    locationType,
    coord: { col: hexCol, row: hexRow },
  };
}

/**
 * Group settlements by their containing region.
 * Uses 'contains' edges from region → location in the graph.
 */
function groupByRegion(
  graph: WorldGraph,
  settlements: SettlementInfo[],
): Map<string, SettlementInfo[]> {
  const settlementById = new Map<string, SettlementInfo>();
  for (const s of settlements) {
    settlementById.set(s.id, s);
  }

  const regionMap = new Map<string, SettlementInfo[]>();

  // Find all contains edges from regions to our settlements
  const containsEdges = graph.getEdgesByType('contains');
  for (const edge of containsEdges) {
    const settlement = settlementById.get(edge.target);
    if (!settlement) continue;

    // Verify source is a region
    const sourceNode = graph.getNode(edge.source);
    if (!sourceNode || sourceNode.type !== 'region') continue;

    let list = regionMap.get(edge.source);
    if (!list) {
      list = [];
      regionMap.set(edge.source, list);
    }
    list.push(settlement);
  }

  return regionMap;
}

/**
 * Build MST for a set of settlements using Kruskal's algorithm.
 * Edge weights are A* pathfinding costs (terrain-aware).
 *
 * Returns array of { from, to, path, cost } for each MST edge.
 */
function buildMST(
  settlements: SettlementInfo[],
  tiles: HexTile[],
  cols: number,
  rows: number,
): Array<{ from: SettlementInfo; to: SettlementInfo; path: HexCoord[]; cost: number }> {
  if (settlements.length < 2) return [];

  // Compute all-pairs A* costs
  interface CandidateEdge {
    from: SettlementInfo;
    to: SettlementInfo;
    path: HexCoord[];
    cost: number;
  }

  const candidates: CandidateEdge[] = [];

  for (let i = 0; i < settlements.length; i++) {
    for (let j = i + 1; j < settlements.length; j++) {
      const from = settlements[i];
      const to = settlements[j];
      const result = findHexPath(tiles, from.coord, to.coord, cols, rows);
      if (!result || result.path.length === 0) continue;

      candidates.push({
        from,
        to,
        path: [from.coord, ...result.path],
        cost: result.totalCost,
      });
    }
  }

  // Sort by cost (ascending) for Kruskal's
  candidates.sort((a, b) => a.cost - b.cost);

  // Kruskal's MST: add cheapest edge that doesn't create a cycle
  const uf = new UnionFind();
  const mstEdges: CandidateEdge[] = [];

  for (const candidate of candidates) {
    if (!uf.connected(candidate.from.id, candidate.to.id)) {
      uf.union(candidate.from.id, candidate.to.id);
      mstEdges.push(candidate);
    }
    // MST has exactly N-1 edges
    if (mstEdges.length === settlements.length - 1) break;
  }

  return mstEdges;
}

/**
 * Connect each hamlet to its nearest road-worthy settlement via trail.
 */
function buildTrailStubs(
  hamlets: SettlementInfo[],
  roadNodes: SettlementInfo[],
  tiles: HexTile[],
  cols: number,
  rows: number,
): Array<{ from: SettlementInfo; to: SettlementInfo; path: HexCoord[]; cost: number }> {
  if (hamlets.length === 0 || roadNodes.length === 0) return [];

  const trails: Array<{ from: SettlementInfo; to: SettlementInfo; path: HexCoord[]; cost: number }> = [];

  for (const hamlet of hamlets) {
    let bestResult: { to: SettlementInfo; path: HexCoord[]; cost: number } | null = null;

    for (const roadNode of roadNodes) {
      const result = findHexPath(tiles, hamlet.coord, roadNode.coord, cols, rows);
      if (!result || result.path.length === 0) continue;

      if (!bestResult || result.totalCost < bestResult.cost) {
        bestResult = {
          to: roadNode,
          path: [hamlet.coord, ...result.path],
          cost: result.totalCost,
        };
      }
    }

    if (bestResult) {
      trails.push({
        from: hamlet,
        to: bestResult.to,
        path: bestResult.path,
        cost: bestResult.cost,
      });
    }
  }

  return trails;
}

// ─── Main entry point ─────────────────────────────────────────────────────────

/**
 * Generate road edges and add them to the world graph.
 *
 * Called during worldgen after settlements and regions are created.
 * Produces 'road' edges with hexPath, totalCost, roadType properties.
 *
 * NFP #3: Deterministic — iterates regions/settlements in stable order (by ID).
 * NFP #4: Fail-soft — empty graph, no settlements, no regions → no edges added.
 */
export function generateRoadEdges(
  graph: WorldGraph,
  tiles: HexTile[],
  cols: number,
  rows: number,
): void {
  // Get all location nodes
  const locationNodes = graph.getNodesByType('location');
  const allSettlements: SettlementInfo[] = [];

  for (const node of locationNodes) {
    const info = toSettlementInfo(node);
    if (info) allSettlements.push(info);
  }

  if (allSettlements.length < 2) return;

  // Group by region
  const regionGroups = groupByRegion(graph, allSettlements);

  // Sort region keys for deterministic iteration
  const regionKeys = [...regionGroups.keys()].sort();

  for (const regionId of regionKeys) {
    const settlements = regionGroups.get(regionId)!;

    // Separate into road-worthy and trail-worthy
    const roadWorthy = settlements
      .filter(s => ROAD_NETWORK_CONSTANTS.ROAD_WORTHY_TYPES.includes(s.locationType))
      .sort((a, b) => a.id.localeCompare(b.id)); // deterministic order

    const trailWorthy = settlements
      .filter(s => ROAD_NETWORK_CONSTANTS.TRAIL_WORTHY_TYPES.includes(s.locationType))
      .sort((a, b) => a.id.localeCompare(b.id));

    // Phase 1: MST for road-worthy settlements → major roads
    const mstEdges = buildMST(roadWorthy, tiles, cols, rows);

    for (const edge of mstEdges) {
      const [sourceId, targetId] = edge.from.id < edge.to.id
        ? [edge.from.id, edge.to.id]
        : [edge.to.id, edge.from.id];

      graph.addEdge({
        id: `road_${sourceId}_${targetId}`,
        source: sourceId,
        target: targetId,
        type: 'road',
        properties: {
          roadType: 'major' as RoadType,
          hexPath: edge.path.map(c => ({ col: c.col, row: c.row })),
          totalCost: edge.cost,
          pathLength: edge.path.length,
        },
      });
    }

    // Phase 2: Trail stubs from hamlets to nearest road node
    const trailEdges = buildTrailStubs(trailWorthy, roadWorthy, tiles, cols, rows);

    for (const edge of trailEdges) {
      const [sourceId, targetId] = edge.from.id < edge.to.id
        ? [edge.from.id, edge.to.id]
        : [edge.to.id, edge.from.id];

      // Avoid duplicate edge IDs if two hamlets connect to the same road node
      const edgeId = `road_${sourceId}_${targetId}`;
      try {
        graph.addEdge({
          id: edgeId,
          source: sourceId,
          target: targetId,
          type: 'road',
          properties: {
            roadType: 'trail' as RoadType,
            hexPath: edge.path.map(c => ({ col: c.col, row: c.row })),
            totalCost: edge.cost,
            pathLength: edge.path.length,
          },
        });
      } catch {
        // Fail-soft: duplicate edge ID (two hamlets connecting same pair) — skip
      }
    }
  }
}

// ─── Extraction for renderer ──────────────────────────────────────────────────

/**
 * Extract road paths from the world graph for rendering.
 * Converts 'road' graph edges back to the RoadPath format consumed by RoadMesh.
 */
export function extractRoadPaths(graph: WorldGraph): RoadPath[] {
  const roadEdges = graph.getEdgesByType('road');
  return roadEdges.map(edge => ({
    path: (edge.properties.hexPath as Array<{ col: number; row: number }>)
      .map(c => ({ col: c.col, row: c.row })),
    roadType: (edge.properties.roadType as RoadType) ?? 'trail',
  }));
}
