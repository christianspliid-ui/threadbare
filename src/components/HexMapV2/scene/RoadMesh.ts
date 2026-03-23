/**
 * RoadMesh.ts — Road network rendering for HexMapV2.
 *
 * Builds quad-strip geometry for roads connecting settlements, with dashed
 * trails for minor connections and bridge sprites at river crossings.
 *
 * NFP #1 (tunability): All constants in ROAD_CONSTANTS, all named.
 * NFP #3 (determinism): Pathfinding is seeded via findHexPath (A*), deterministic.
 * NFP #4 (fail-soft): Empty settlement lists, failed pathfinding, zero geometry
 *   all return empty group without crashing.
 * NFP #7 (performance): Major roads and trails each merged into a single BufferGeometry.
 */

import * as THREE from 'three';
import type { HexCoord, HexTile } from '../../../types';
import type { LocationNode } from './LocationIconMesh';
import { hexToPixel } from '../../../lib/hexMath';
import { findHexPath } from '../../../engine/pathfinding';
import { isWaterTerrain } from '../../../engine/coastline';
import { getTerrainTax } from '../../../data/movement-content';
import { RENDER_ORDER } from './RenderLayers';
import { HEX_CONSTANTS } from './HexFillMesh';

// ─── Road rendering constants (NFP #1: all named, all tunable) ───────────────

/**
 * All tunable constants for the road rendering system.
 *
 * | Constant           | Default     | Purpose                                       |
 * |--------------------|-------------|-----------------------------------------------|
 * | MAJOR_COLOR        | '#6b5a40'   | Warm earth — 40% brightness (per UI-SPEC)     |
 * | TRAIL_COLOR        | '#4a3d2c'   | Darker earth — 25% brightness (per UI-SPEC)   |
 * | BRIDGE_COLOR       | '#8b7d6b'   | Aged stone (per UI-SPEC)                      |
 * | MAJOR_HALF_WIDTH   | 0.4         | Half-width of major roads in world units       |
 * | TRAIL_HALF_WIDTH   | 0.2         | Half-width of trail roads in world units       |
 * | Z_OFFSET           | 0.025       | Between coastline (0.01) and rivers (0.03)    |
 * | TRAIL_DASH_SIZE    | 4           | World units per dash segment                  |
 * | TRAIL_GAP_SIZE     | 6           | World units per gap between dashes            |
 * | MAX_ROADS          | 500         | Cap total road paths for performance          |
 * | K_NEAREST          | 3           | Connect each settlement to K nearest neighbors|
 * | SETTLEMENT_TYPES   | [...]       | Location types that generate roads            |
 * | MAJOR_ROAD_TYPES   | [...]       | Location types that get solid major roads     |
 */
export const ROAD_CONSTANTS = {
  MAJOR_COLOR:       '#6b5a40',
  TRAIL_COLOR:       '#4a3d2c',
  MAJOR_HALF_WIDTH:  0.4,
  TRAIL_HALF_WIDTH:  0.1,
  Z_OFFSET:          0.025,
  TRAIL_DASH_SIZE:   0.5,
  TRAIL_GAP_SIZE:    0.5,
  MAX_ROADS:         500,
  K_NEAREST:         3,
  SETTLEMENT_TYPES:  ['capital', 'city', 'town', 'hamlet', 'castle', 'fort'] as const,
  MAJOR_ROAD_TYPES:  ['capital', 'city', 'town', 'castle', 'fort'] as const,
  // ── Winding road constants ──────────────────────────────────────────────────
  /** Base wobble magnitude as fraction of hex size for flat terrain */
  WOBBLE_BASE:         0.08,
  /** Wobble scaling for light terrain (tax 0.5) */
  WOBBLE_LIGHT:        0.18,
  /** Wobble scaling for moderate terrain (tax 1.0) */
  WOBBLE_MODERATE:     0.30,
  /** Wobble scaling for heavy terrain (tax 1.5+) */
  WOBBLE_HEAVY:        0.45,
  /** Number of interpolation points per hex-to-hex segment for Catmull-Rom */
  SPLINE_SAMPLES:      6,
  /** Catmull-Rom spline tension (0 = Catmull-Rom, 0.5 = tighter, 1 = linear) */
  SPLINE_TENSION:      0.0,
  /** Fraction of hex size to offset intermediate waypoints from hex centers */
  WAYPOINT_DRIFT:      0.25,
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

export type RoadType = 'major' | 'trail';

export interface RoadPath {
  path: HexCoord[];
  roadType: RoadType;
}


// ─── Road classification ──────────────────────────────────────────────────────

/**
 * Classify a road by its endpoint types.
 * Returns 'major' if BOTH endpoints are in MAJOR_ROAD_TYPES, 'trail' otherwise.
 *
 * NFP #1: Logic references ROAD_CONSTANTS.MAJOR_ROAD_TYPES — change there to tune.
 */
export function classifyRoad(fromType: string, toType: string): RoadType {
  const majorTypes: readonly string[] = ROAD_CONSTANTS.MAJOR_ROAD_TYPES;
  if (majorTypes.includes(fromType) && majorTypes.includes(toType)) {
    return 'major';
  }
  return 'trail';
}

// ─── Road path generation ─────────────────────────────────────────────────────

/**
 * Generate road paths connecting settlements using A* pathfinding.
 *
 * Algorithm:
 * 1. Filter to SETTLEMENT_TYPES only
 * 2. If < 2 settlements, return []
 * 3. For each settlement, find K_NEAREST nearest neighbors by pixel distance
 * 4. Deduplicate pairs by sorting by coord key
 * 5. Run A* for each unique pair (water hexes have Infinity cost in findHexPath)
 * 6. Cap at MAX_ROADS
 * 7. Classify each road by endpoint types
 *
 * NFP #3: Deterministic — A* on same tile data + same locations = same paths.
 * NFP #4: Fail-soft — empty locations, null paths, water blocks all handled.
 *
 * @param locations  All location nodes (filtered internally to SETTLEMENT_TYPES)
 * @param tiles      Hex tile array for terrain costs
 * @param cols       Grid column count (for bounds checking)
 * @param rows       Grid row count (for bounds checking)
 */
export function generateRoadPaths(
  locations: LocationNode[],
  tiles: HexTile[],
  cols: number,
  rows: number,
): RoadPath[] {
  // Filter to settlement types only
  const settlementTypes: readonly string[] = ROAD_CONSTANTS.SETTLEMENT_TYPES;
  const settlements = locations.filter(loc => settlementTypes.includes(loc.locationType));

  // Fail-soft: need at least 2 settlements
  if (settlements.length < 2) return [];

  // Build a tile lookup for water detection (for marking impassable tiles)
  const tileMap = new Map<string, HexTile>();
  for (const tile of tiles) {
    tileMap.set(`${tile.coord.col},${tile.coord.row}`, tile);
  }

  // Build water-blocked tiles: replace water terrain with Infinity-cost proxy
  // findHexPath already uses getTerrainTax which returns Infinity for ocean/water
  // So we can pass tiles directly — water hexes will be naturally impassable.

  // Track unique pairs to avoid duplicate road segments
  const seenPairs = new Set<string>();
  const result: RoadPath[] = [];

  for (const settlement of settlements) {
    // Find K_NEAREST nearest neighbors by pixel distance
    const fromPixel = hexToPixel({ col: settlement.hexCol, row: settlement.hexRow }, HEX_CONSTANTS.HEX_SIZE);

    // Sort other settlements by Euclidean pixel distance
    const others = settlements
      .filter(s => s !== settlement)
      .map(s => {
        const px = hexToPixel({ col: s.hexCol, row: s.hexRow }, HEX_CONSTANTS.HEX_SIZE);
        const dx = px.x - fromPixel.x;
        const dy = px.y - fromPixel.y;
        return { settlement: s, dist: Math.sqrt(dx * dx + dy * dy) };
      })
      .sort((a, b) => a.dist - b.dist)
      .slice(0, ROAD_CONSTANTS.K_NEAREST);

    for (const { settlement: toSettlement } of others) {
      // Deduplicate: create canonical key by sorting col,row pairs
      const fromKey = `${settlement.hexCol},${settlement.hexRow}`;
      const toKey = `${toSettlement.hexCol},${toSettlement.hexRow}`;
      const pairKey = fromKey < toKey ? `${fromKey}|${toKey}` : `${toKey}|${fromKey}`;

      if (seenPairs.has(pairKey)) continue;
      seenPairs.add(pairKey);

      // Cap total paths for performance
      if (result.length >= ROAD_CONSTANTS.MAX_ROADS) break;

      // Run A* pathfinding (water hexes have Infinity cost → natural blockage)
      const from: HexCoord = { col: settlement.hexCol, row: settlement.hexRow };
      const to: HexCoord = { col: toSettlement.hexCol, row: toSettlement.hexRow };
      const pathResult = findHexPath(tiles, from, to, cols, rows);

      if (!pathResult || pathResult.path.length === 0) continue;

      // Build full path including start coord
      const fullPath = [from, ...pathResult.path];

      result.push({
        path: fullPath,
        roadType: classifyRoad(settlement.locationType, toSettlement.locationType),
      });
    }

    if (result.length >= ROAD_CONSTANTS.MAX_ROADS) break;
  }

  return deduplicateOverlappingRoads(result, locations);
}

// ─── Road overlap deduplication ───────────────────────────────────────────────

/**
 * Priority score for a location type. Higher = more important.
 * Used to determine which road "wins" when multiple roads share edges.
 *
 * | Type     | Score | Rationale                           |
 * |----------|-------|-------------------------------------|
 * | capital  | 5     | Most important settlement           |
 * | city     | 4     | Major population center             |
 * | temple   | 3     | Significant religious site          |
 * | castle   | 3     | Military stronghold                 |
 * | fort     | 3     | Fortified position                  |
 * | town     | 2     | Minor settlement                    |
 * | hamlet   | 1     | Small settlement                    |
 */
const LOCATION_PRIORITY: Record<string, number> = {
  capital: 5,
  city: 4,
  temple: 3,
  castle: 3,
  fort: 3,
  town: 2,
  hamlet: 1,
};

/**
 * Compute priority score for a road based on the importance of its endpoints.
 * Sum of both endpoint priorities — the road between two capitals scores highest.
 */
function roadPriority(road: RoadPath, locations: LocationNode[]): number {
  if (road.path.length < 2) return 0;
  const start = road.path[0];
  const end = road.path[road.path.length - 1];

  const startLoc = locations.find(l => l.hexCol === start.col && l.hexRow === start.row);
  const endLoc = locations.find(l => l.hexCol === end.col && l.hexRow === end.row);

  return (LOCATION_PRIORITY[startLoc?.locationType ?? ''] ?? 0) +
         (LOCATION_PRIORITY[endLoc?.locationType ?? ''] ?? 0);
}

// ─── Union-Find for connectivity tracking ────────────────────────────────────

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
    if (rankA < rankB) { this.parent.set(ra, rb); }
    else if (rankA > rankB) { this.parent.set(rb, ra); }
    else { this.parent.set(rb, ra); this.rank.set(ra, rankA + 1); }
  }

  connected(a: string, b: string): boolean {
    return this.find(a) === this.find(b);
  }
}

/**
 * Deduplicate and cull redundant roads using connectivity-aware filtering.
 *
 * Strategy (processed in priority order, highest first):
 * 1. Major roads with >40% edge overlap with a higher-priority road → downgrade to trail
 * 2. Trails that connect two settlements already reachable via existing roads → REMOVE
 * 3. Only keep trails that provide new connectivity (MST-like behavior)
 *
 * This prevents the "web of trails" problem where K-nearest generates
 * redundant paths between already-connected settlement clusters.
 *
 * NFP #3: Deterministic — same inputs always produce same culling decisions.
 */
function deduplicateOverlappingRoads(
  roads: RoadPath[],
  locations: LocationNode[],
): RoadPath[] {
  if (roads.length < 2) return roads;

  // Score and sort roads by priority (highest first)
  const scored = roads.map((road, idx) => ({
    road,
    idx,
    priority: roadPriority(road, locations),
  }));
  scored.sort((a, b) => b.priority - a.priority);

  // Track which edges are "claimed" by a major road
  const claimedEdges = new Set<string>();

  // Union-Find tracks which settlements are connected
  const uf = new UnionFind();

  // Helper: get settlement key from a road endpoint
  const endpointKey = (coord: HexCoord) => `${coord.col},${coord.row}`;

  const result: (RoadPath | null)[] = new Array(roads.length).fill(null);

  for (const { road, idx } of scored) {
    const startKey = endpointKey(road.path[0]);
    const endKey = endpointKey(road.path[road.path.length - 1]);

    // Count edge overlap with already-claimed major roads
    const edges: string[] = [];
    let claimedCount = 0;
    for (let i = 0; i < road.path.length - 1; i++) {
      const edgeKey = normalizeEdgeKey(road.path[i], road.path[i + 1]);
      edges.push(edgeKey);
      if (claimedEdges.has(edgeKey)) claimedCount++;
    }
    const totalEdges = edges.length || 1;
    const overlapRatio = claimedCount / totalEdges;

    if (road.roadType === 'major') {
      // Major roads: remove entirely if >40% overlap with higher-priority road
      if (overlapRatio > 0.4) {
        // Don't render — it would just clutter alongside the existing road
        result[idx] = null;
      } else {
        result[idx] = { path: road.path, roadType: 'major' };
        for (const edge of edges) claimedEdges.add(edge);
      }
      // Always contribute connectivity regardless of rendering
      uf.union(startKey, endKey);
    } else {
      // Trails: only keep if they provide NEW connectivity
      if (uf.connected(startKey, endKey)) {
        result[idx] = null;
      } else {
        result[idx] = { path: road.path, roadType: 'trail' };
        uf.union(startKey, endKey);
      }
    }
  }

  return result.filter((r): r is RoadPath => r !== null);
}

/** Canonical edge key: smaller col,row pair first */
function normalizeEdgeKey(a: HexCoord, b: HexCoord): string {
  const aKey = `${a.col},${a.row}`;
  const bKey = `${b.col},${b.row}`;
  return aKey <= bKey ? `${aKey}-${bKey}` : `${bKey}-${aKey}`;
}

// ─── Geometry builders ────────────────────────────────────────────────────────

type Point2D = { x: number; y: number };

/**
 * Build quad strip geometry from a list of 2D centerline points.
 *
 * At each point, two vertices are emitted offset perpendicular to the local
 * tangent by ±halfWidth. Follows RiverMesh.ts buildQuadStripGeometry pattern.
 *
 * Vertex layout:
 *   left  = center + normal * halfWidth  (index 2*i)
 *   right = center - normal * halfWidth  (index 2*i + 1)
 *
 * Triangle strip per segment [i-1 → i]:
 *   Triangle A: [2(i-1), 2(i-1)+1, 2i]
 *   Triangle B: [2(i-1)+1, 2i+1, 2i]
 */
function buildQuadStripFromPoints(
  points: Point2D[],
  halfWidth: number,
  zOffset: number,
): { positions: number[]; indices: number[] } {
  const n = points.length;
  const positions: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i < n; i++) {
    const prev = points[Math.max(0, i - 1)];
    const next = points[Math.min(n - 1, i + 1)];

    // Tangent
    const tx = next.x - prev.x;
    const ty = next.y - prev.y;
    const tLen = Math.sqrt(tx * tx + ty * ty) || 1;

    // Normal (perpendicular, rotated 90° CCW)
    const nx = -ty / tLen;
    const ny =  tx / tLen;

    const px = points[i].x;
    const py = points[i].y;

    // Left vertex (index 2*i)
    positions.push(px + nx * halfWidth, py + ny * halfWidth, zOffset);
    // Right vertex (index 2*i + 1)
    positions.push(px - nx * halfWidth, py - ny * halfWidth, zOffset);

    if (i > 0) {
      const a = 2 * (i - 1);
      const b = 2 * (i - 1) + 1;
      const c = 2 * i;
      const d = 2 * i + 1;
      indices.push(a, b, c);
      indices.push(b, d, c);
    }
  }

  return { positions, indices };
}

/**
 * Convert a road path's hex coords to world-space 2D points (Y-flipped).
 */
function roadPathToWorldPoints(path: HexCoord[]): Point2D[] {
  return path.map(coord => {
    const px = hexToPixel(coord, HEX_CONSTANTS.HEX_SIZE);
    return { x: px.x, y: -px.y };
  });
}

// ─── Deterministic hash for road wobble (NFP #3) ─────────────────────────────

/**
 * Deterministic hash for road segment wobble. Same inputs = same wobble.
 * Produces a value in [-1, 1] for perpendicular offset direction.
 */
function roadSegmentHash(fromCol: number, fromRow: number, toCol: number, toRow: number): number {
  let h = 0x9e3779b9;
  h = ((h << 5) - h + fromCol) | 0;
  h = (h ^ (h >>> 16)) | 0;
  h = ((h << 5) - h + fromRow) | 0;
  h = (h ^ (h >>> 16)) | 0;
  h = ((h << 5) - h + toCol) | 0;
  h = (h ^ (h >>> 16)) | 0;
  h = ((h << 5) - h + toRow) | 0;
  h = (h ^ (h >>> 16)) | 0;
  return ((h & 0xffff) / 0xffff) * 2 - 1;
}

/**
 * Map terrain tax to wobble magnitude fraction.
 *
 * | Tax       | Terrain examples           | Wobble |
 * |-----------|----------------------------|--------|
 * | 0         | grassland, farmland        | BASE   |
 * | 0.5       | hills, forest, boreal      | LIGHT  |
 * | 1.0       | swamp, desert, badlands    | MODERATE |
 * | 1.5+      | mountains, glacier, volcano| HEAVY  |
 */
function wobbleMagnitudeForTax(tax: number): number {
  if (tax <= 0)   return ROAD_CONSTANTS.WOBBLE_BASE;
  if (tax <= 0.5) return ROAD_CONSTANTS.WOBBLE_LIGHT;
  if (tax <= 1.0) return ROAD_CONSTANTS.WOBBLE_MODERATE;
  return ROAD_CONSTANTS.WOBBLE_HEAVY;
}

/**
 * Add terrain-aware wobble to road paths, including drifting intermediate
 * waypoints off hex centers so roads don't rigidly pass through every center.
 *
 * Only the first and last points (the settlements) stay anchored at hex centers.
 * All intermediate hex waypoints are drifted perpendicular to the overall road
 * direction, and midpoints between waypoints are wobbled based on terrain.
 *
 * This breaks the "through-every-center" pattern that the human eye catches.
 *
 * NFP #1: Wobble magnitudes and WAYPOINT_DRIFT in ROAD_CONSTANTS.
 * NFP #3: Deterministic via roadSegmentHash.
 */
function addTerrainWobble(
  path: HexCoord[],
  terrainMap: Map<string, string>,
): Point2D[] {
  if (path.length < 2) return roadPathToWorldPoints(path);

  const hexSize = HEX_CONSTANTS.HEX_SIZE;
  const waypointDrift = ROAD_CONSTANTS.WAYPOINT_DRIFT;
  const lastIdx = path.length - 1;

  // First pass: compute drifted waypoint positions.
  // Start and end stay at hex centers (settlements); intermediates drift.
  const waypoints: Point2D[] = [];

  for (let i = 0; i <= lastIdx; i++) {
    const coord = path[i];
    const px = hexToPixel(coord, hexSize);
    let wx = px.x;
    let wy = -px.y;

    // Drift intermediate waypoints off hex centers
    if (i > 0 && i < lastIdx) {
      // Use prev→next direction for perpendicular drift
      const prevPx = hexToPixel(path[i - 1], hexSize);
      const nextPx = hexToPixel(path[i + 1], hexSize);
      const dx = nextPx.x - prevPx.x;
      const dy = -(nextPx.y - prevPx.y); // Y-flipped
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const perpX = -dy / len;
      const perpY = dx / len;

      // Terrain-aware drift: rougher terrain = more drift
      const terrainKey = `${coord.col},${coord.row}`;
      const terrain = terrainMap.get(terrainKey) ?? 'grassland';
      const tax = getTerrainTax(terrain as import('../../../types').TerrainType);
      const wobbleFrac = wobbleMagnitudeForTax(tax === Infinity ? 0 : tax);

      // Hash for deterministic direction — use a different salt than midpoint hash
      const hash = roadSegmentHash(coord.col * 7, coord.row * 13, coord.col, coord.row);
      const drift = hash * (waypointDrift + wobbleFrac * 0.5) * hexSize;

      wx += perpX * drift;
      wy += perpY * drift;
    }

    waypoints.push({ x: wx, y: wy });
  }

  // Second pass: insert wobbled midpoints between each pair of waypoints
  const result: Point2D[] = [waypoints[0]];

  for (let i = 0; i < waypoints.length - 1; i++) {
    const from = path[i];
    const to = path[i + 1];
    const a = waypoints[i];
    const b = waypoints[i + 1];

    // Get terrain at destination hex for midpoint wobble
    const terrainKey = `${to.col},${to.row}`;
    const terrain = terrainMap.get(terrainKey) ?? 'grassland';
    const tax = getTerrainTax(terrain as import('../../../types').TerrainType);
    const wobbleFraction = wobbleMagnitudeForTax(tax === Infinity ? 0 : tax);

    // Perpendicular to segment direction
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const segLen = Math.sqrt(dx * dx + dy * dy) || 1;
    const perpX = -dy / segLen;
    const perpY = dx / segLen;

    // Deterministic wobble for midpoint
    const hash = roadSegmentHash(from.col, from.row, to.col, to.row);
    const offset = hash * wobbleFraction * hexSize;

    // Insert wobbled midpoint
    const midX = (a.x + b.x) / 2 + perpX * offset;
    const midY = (a.y + b.y) / 2 + perpY * offset;
    result.push({ x: midX, y: midY });

    // Then the (already-drifted) endpoint
    result.push(b);
  }

  return result;
}

// ─── Catmull-Rom spline interpolation ────────────────────────────────────────

/**
 * Evaluate a Catmull-Rom spline segment at parameter t ∈ [0,1].
 *
 * Uses the standard Catmull-Rom matrix with configurable tension.
 * At tension=0, this is the standard Catmull-Rom spline.
 *
 * @param p0 — control point before segment start
 * @param p1 — segment start
 * @param p2 — segment end
 * @param p3 — control point after segment end
 * @param t  — interpolation parameter [0,1]
 */
function catmullRom(p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D, t: number): Point2D {
  const t2 = t * t;
  const t3 = t2 * t;
  const tension = ROAD_CONSTANTS.SPLINE_TENSION;
  const s = (1 - tension) / 2;

  return {
    x: s * ((-t3 + 2 * t2 - t) * p0.x + (3 * t3 - 5 * t2 + 2) * p1.x +
        (-3 * t3 + 4 * t2 + t) * p2.x + (t3 - t2) * p3.x),
    y: s * ((-t3 + 2 * t2 - t) * p0.y + (3 * t3 - 5 * t2 + 2) * p1.y +
        (-3 * t3 + 4 * t2 + t) * p2.y + (t3 - t2) * p3.y),
  };
}

/**
 * Smooth a polyline using Catmull-Rom spline interpolation.
 *
 * Takes the wobbled path points and produces a smooth curve by interpolating
 * SPLINE_SAMPLES points between each pair of control points.
 *
 * NFP #1: SPLINE_SAMPLES and SPLINE_TENSION in ROAD_CONSTANTS.
 */
function smoothWithCatmullRom(points: Point2D[]): Point2D[] {
  if (points.length < 3) return points;

  const samples = ROAD_CONSTANTS.SPLINE_SAMPLES;
  const result: Point2D[] = [points[0]];

  for (let i = 0; i < points.length - 1; i++) {
    // Catmull-Rom needs 4 points: p0, p1, p2, p3
    // Clamp indices at boundaries
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    for (let s = 1; s <= samples; s++) {
      const t = s / samples;
      result.push(catmullRom(p0, p1, p2, p3, t));
    }
  }

  return result;
}

/**
 * Build a natural, winding road path from hex coordinates.
 *
 * Pipeline:
 * 1. hex coords → world points with terrain-aware wobble at midpoints
 * 2. wobbled points → Catmull-Rom spline smoothing
 *
 * Result: roads that are roughly linear on flat terrain, gently curved
 * in forests/hills, and noticeably winding in mountains.
 *
 * @param path       — hex coords from A* pathfinding
 * @param terrainMap — "col,row" → terrain type for wobble lookup
 */
function buildWindingRoadPoints(
  path: HexCoord[],
  terrainMap: Map<string, string>,
): Point2D[] {
  const wobbled = addTerrainWobble(path, terrainMap);
  return smoothWithCatmullRom(wobbled);
}

/**
 * Build dashed quad strip geometry for trail roads.
 *
 * Splits path into segments of TRAIL_DASH_SIZE + TRAIL_GAP_SIZE alternating
 * by accumulated world-space distance. Only dash segments get geometry.
 *
 * NFP #1: TRAIL_DASH_SIZE and TRAIL_GAP_SIZE are tunable in ROAD_CONSTANTS.
 */
function buildDashedQuadStrip(
  points: Point2D[],
  halfWidth: number,
  zOffset: number,
): { positions: number[]; indices: number[] } {
  if (points.length < 2) return { positions: [], indices: [] };

  const dashSize = ROAD_CONSTANTS.TRAIL_DASH_SIZE;
  const gapSize = ROAD_CONSTANTS.TRAIL_GAP_SIZE;
  const cycleLength = dashSize + gapSize;

  const allPositions: number[] = [];
  const allIndices: number[] = [];
  let vertexOffset = 0;

  // Walk along path, accumulating distance; group consecutive "dash" points into segments
  let accDist = 0;
  let segmentPoints: Point2D[] = [points[0]];
  let inDash = true; // start in dash

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;
    const segLen = Math.sqrt(dx * dx + dy * dy);

    let remaining = segLen;
    let t = 0;

    while (remaining > 0) {
      const cyclePos = accDist % cycleLength;
      const currentPhaseEnd = inDash ? dashSize : dashSize + gapSize;
      const distToPhaseEnd = currentPhaseEnd - cyclePos;
      const step = Math.min(distToPhaseEnd, remaining);
      t += step / segLen;

      const interpX = prev.x + (curr.x - prev.x) * t;
      const interpY = prev.y + (curr.y - prev.y) * t;

      if (inDash) {
        segmentPoints.push({ x: interpX, y: interpY });
      }

      accDist += step;
      remaining -= step;

      // Check if we crossed a phase boundary
      const newCyclePos = accDist % cycleLength;
      const crossedBoundary = newCyclePos < (step % cycleLength) + 0.0001;

      if (crossedBoundary || remaining <= 0.0001) {
        if (inDash && segmentPoints.length >= 2) {
          // Emit this dash segment
          const { positions, indices } = buildQuadStripFromPoints(segmentPoints, halfWidth, zOffset);
          for (const p of positions) allPositions.push(p);
          for (const idx of indices) allIndices.push(idx + vertexOffset);
          vertexOffset += segmentPoints.length * 2;
        }
        // Toggle phase
        if (crossedBoundary) {
          inDash = !inDash;
          segmentPoints = inDash ? [{ x: interpX, y: interpY }] : [];
        }
      }
    }
  }

  // Emit final dash segment if still in one
  if (inDash && segmentPoints.length >= 2) {
    const { positions, indices } = buildQuadStripFromPoints(segmentPoints, halfWidth, zOffset);
    for (const p of positions) allPositions.push(p);
    for (const idx of indices) allIndices.push(idx + vertexOffset);
  }

  return { positions: allPositions, indices: allIndices };
}

// ─── Scene Module Factory ─────────────────────────────────────────────────────

/**
 * Creates a THREE.Group containing merged road meshes.
 *
 * - Major roads: solid quad-strip geometry, one merged mesh
 * - Trails: dashed quad-strip geometry, one merged mesh
 * - Group is initially hidden (Plan 03 wires zoom visibility)
 *
 * NFP #1: All constants in ROAD_CONSTANTS.
 * NFP #4: Returns empty group for 0 settlements, null paths, missing tiles.
 * NFP #7: Major and trail roads each in one merged BufferGeometry (minimal draw calls).
 *
 * @param locations   All location nodes (filtered to SETTLEMENT_TYPES internally)
 * @param tiles       Hex tile array for pathfinding terrain costs
 * @param cols        Grid column count
 * @param rows        Grid row count
 * @returns           THREE.Group at RENDER_ORDER.ROADS, initially hidden
 */
export function createRoadMesh(
  locations: LocationNode[],
  tiles: HexTile[],
  cols: number,
  rows: number,
): THREE.Group {
  const group = new THREE.Group();
  group.renderOrder = RENDER_ORDER.ROADS;
  group.visible = false;

  // Fail-soft: generate paths (returns [] for < 2 settlements)
  const roadPaths = generateRoadPaths(locations, tiles, cols, rows);
  if (roadPaths.length === 0) return group;

  // Build terrain lookup for winding road generation
  const terrainMap = new Map<string, string>();
  for (const tile of tiles) {
    terrainMap.set(`${tile.coord.col},${tile.coord.row}`, tile.terrain);
  }

  // Separate major and trail paths
  const majorPaths = roadPaths.filter(p => p.roadType === 'major');
  const trailPaths = roadPaths.filter(p => p.roadType === 'trail');

  // ── Major roads: merged solid quad-strip geometry ─────────────────────────
  if (majorPaths.length > 0) {
    const allMajorPositions: number[] = [];
    const allMajorIndices: number[] = [];
    let vertexOffset = 0;

    for (const roadPath of majorPaths) {
      const worldPoints = buildWindingRoadPoints(roadPath.path, terrainMap);
      if (worldPoints.length < 2) continue;

      const { positions, indices } = buildQuadStripFromPoints(
        worldPoints,
        ROAD_CONSTANTS.MAJOR_HALF_WIDTH,
        ROAD_CONSTANTS.Z_OFFSET,
      );

      for (const p of positions) allMajorPositions.push(p);
      for (const idx of indices) allMajorIndices.push(idx + vertexOffset);
      vertexOffset += worldPoints.length * 2;
    }

    if (allMajorPositions.length > 0) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(allMajorPositions, 3));
      geo.setIndex(allMajorIndices);

      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(ROAD_CONSTANTS.MAJOR_COLOR),
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
        depthTest: false,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.renderOrder = RENDER_ORDER.ROADS;
      group.add(mesh);
    }
  }

  // ── Trail roads: merged dashed quad-strip geometry ────────────────────────
  if (trailPaths.length > 0) {
    const allTrailPositions: number[] = [];
    const allTrailIndices: number[] = [];
    let vertexOffset = 0;

    for (const roadPath of trailPaths) {
      const worldPoints = buildWindingRoadPoints(roadPath.path, terrainMap);
      if (worldPoints.length < 2) continue;

      const { positions, indices } = buildDashedQuadStrip(
        worldPoints,
        ROAD_CONSTANTS.TRAIL_HALF_WIDTH,
        ROAD_CONSTANTS.Z_OFFSET,
      );

      for (const p of positions) allTrailPositions.push(p);
      for (const idx of indices) allTrailIndices.push(idx + vertexOffset);
      vertexOffset += positions.length / 3; // 3 floats per vertex, 2 verts per point
    }

    if (allTrailPositions.length > 0) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(allTrailPositions, 3));
      geo.setIndex(allTrailIndices);

      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(ROAD_CONSTANTS.TRAIL_COLOR),
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
        depthTest: false,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.renderOrder = RENDER_ORDER.ROADS;
      group.add(mesh);
    }
  }

  return group;
}
