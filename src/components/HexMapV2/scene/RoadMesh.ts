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
import type { RiverPath } from '../../../engine/worldGenData';
import type { LocationNode } from './LocationIconMesh';
import { hexToPixel } from '../../../lib/hexMath';
import { findHexPath } from '../../../engine/pathfinding';
import { isWaterTerrain } from '../../../engine/coastline';
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
  BRIDGE_COLOR:      '#8b7d6b',
  MAJOR_HALF_WIDTH:  0.4,
  TRAIL_HALF_WIDTH:  0.2,
  Z_OFFSET:          0.025,
  TRAIL_DASH_SIZE:   4,
  TRAIL_GAP_SIZE:    6,
  MAX_ROADS:         500,
  K_NEAREST:         3,
  SETTLEMENT_TYPES:  ['capital', 'city', 'town', 'hamlet', 'castle', 'fort'] as const,
  MAJOR_ROAD_TYPES:  ['capital', 'city', 'town', 'castle', 'fort'] as const,
  /** Bridge sprite size as multiple of HEX_SIZE */
  BRIDGE_SPRITE_SCALE: 1.5,
  /** Canvas size for bridge icon texture (square) */
  BRIDGE_CANVAS_SIZE:  64,
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

export type RoadType = 'major' | 'trail';

export interface RoadPath {
  path: HexCoord[];
  roadType: RoadType;
}

export interface RiverCrossing {
  from: HexCoord;
  to: HexCoord;
  worldMidpoint: { x: number; y: number };
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

  return result;
}

// ─── River crossing detection ─────────────────────────────────────────────────

/**
 * Find all crossings where road paths cross river paths.
 *
 * Uses a Set of normalized edge keys (min-col,min-row-max-col,max-row) for O(1) lookup.
 * Returns world midpoint (Y-flipped) for each crossing (for bridge sprite placement).
 *
 * NFP #4: Fail-soft — empty inputs, missing hexes return empty array.
 */
export function findRiverCrossings(
  roadPaths: RoadPath[],
  riverPaths: RiverPath[],
): RiverCrossing[] {
  if (!riverPaths || riverPaths.length === 0) return [];

  // Build set of river edges (normalized key: smaller coord first)
  const riverEdges = new Set<string>();
  for (const river of riverPaths) {
    if (!river.hexes || river.hexes.length < 2) continue;
    for (let i = 0; i < river.hexes.length - 1; i++) {
      const a = river.hexes[i];
      const b = river.hexes[i + 1];
      riverEdges.add(normalizeEdgeKey(a, b));
    }
  }

  if (riverEdges.size === 0) return [];

  const crossings: RiverCrossing[] = [];
  const seenCrossings = new Set<string>();

  for (const roadPath of roadPaths) {
    const path = roadPath.path;
    if (!path || path.length < 2) continue;

    for (let i = 0; i < path.length - 1; i++) {
      const from = path[i];
      const to = path[i + 1];
      const edgeKey = normalizeEdgeKey(from, to);

      if (riverEdges.has(edgeKey) && !seenCrossings.has(edgeKey)) {
        seenCrossings.add(edgeKey);

        // Compute world midpoint (Y-flipped for Three.js)
        const fromPx = hexToPixel(from, HEX_CONSTANTS.HEX_SIZE);
        const toPx = hexToPixel(to, HEX_CONSTANTS.HEX_SIZE);
        const worldMidpoint = {
          x: (fromPx.x + toPx.x) / 2,
          y: -((fromPx.y + toPx.y) / 2),
        };

        crossings.push({ from, to, worldMidpoint });
      }
    }
  }

  return crossings;
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

// ─── Bridge sprite ────────────────────────────────────────────────────────────

/**
 * Build a canvas texture for a bridge icon.
 * Simple stone arch: two pillars with a semicircular arc connecting their tops.
 *
 * NFP #4: If canvas context unavailable, returns minimal placeholder texture.
 */
function buildBridgeTexture(): THREE.CanvasTexture {
  const size = ROAD_CONSTANTS.BRIDGE_CANVAS_SIZE;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.clearRect(0, 0, size, size);

    const color = ROAD_CONSTANTS.BRIDGE_COLOR;
    const darkColor = '#5a4f3f';

    const pillarW = size * 0.2;
    const pillarH = size * 0.45;
    const pillarY = size * 0.52;
    const leftX = size * 0.15;
    const rightX = size * 0.65;
    const archR = (rightX - leftX) / 2 + pillarW / 2;
    const archCX = (leftX + rightX + pillarW) / 2;
    const archCY = pillarY;

    // Pillars
    ctx.fillStyle = color;
    ctx.strokeStyle = darkColor;
    ctx.lineWidth = 1.5;

    ctx.fillRect(leftX, pillarY, pillarW, pillarH);
    ctx.strokeRect(leftX, pillarY, pillarW, pillarH);

    ctx.fillRect(rightX, pillarY, pillarW, pillarH);
    ctx.strokeRect(rightX, pillarY, pillarW, pillarH);

    // Semicircular arch
    ctx.beginPath();
    ctx.arc(archCX, archCY, archR, Math.PI, 0);
    ctx.lineWidth = size * 0.12;
    ctx.strokeStyle = color;
    ctx.stroke();

    // Arch outline
    ctx.beginPath();
    ctx.arc(archCX, archCY, archR, Math.PI, 0);
    ctx.lineWidth = 1;
    ctx.strokeStyle = darkColor;
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// ─── Scene Module Factory ─────────────────────────────────────────────────────

/**
 * Creates a THREE.Group containing merged road meshes and bridge sprites.
 *
 * - Major roads: solid quad-strip geometry, one merged mesh
 * - Trails: dashed quad-strip geometry, one merged mesh
 * - Bridges: THREE.Sprite at each river-road crossing
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
 * @param riverPaths  River paths for bridge detection
 * @returns           THREE.Group at RENDER_ORDER.ROADS, initially hidden
 */
export function createRoadMesh(
  locations: LocationNode[],
  tiles: HexTile[],
  cols: number,
  rows: number,
  riverPaths: RiverPath[],
): THREE.Group {
  const group = new THREE.Group();
  group.renderOrder = RENDER_ORDER.ROADS;
  group.visible = false;

  // Fail-soft: generate paths (returns [] for < 2 settlements)
  const roadPaths = generateRoadPaths(locations, tiles, cols, rows);
  if (roadPaths.length === 0) return group;

  // Separate major and trail paths
  const majorPaths = roadPaths.filter(p => p.roadType === 'major');
  const trailPaths = roadPaths.filter(p => p.roadType === 'trail');

  // ── Major roads: merged solid quad-strip geometry ─────────────────────────
  if (majorPaths.length > 0) {
    const allMajorPositions: number[] = [];
    const allMajorIndices: number[] = [];
    let vertexOffset = 0;

    for (const roadPath of majorPaths) {
      const worldPoints = roadPathToWorldPoints(roadPath.path);
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
      const worldPoints = roadPathToWorldPoints(roadPath.path);
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

  // ── Bridge sprites: at each river-road crossing ───────────────────────────
  const crossings = findRiverCrossings(roadPaths, riverPaths);
  if (crossings.length > 0) {
    // Build bridge texture once (shared)
    const bridgeTexture = buildBridgeTexture();
    const bridgeSize = ROAD_CONSTANTS.BRIDGE_SPRITE_SCALE * HEX_CONSTANTS.HEX_SIZE;

    for (const crossing of crossings) {
      const mat = new THREE.SpriteMaterial({
        map: bridgeTexture,
        depthTest: false,
        transparent: true,
      });
      const sprite = new THREE.Sprite(mat);
      sprite.position.set(crossing.worldMidpoint.x, crossing.worldMidpoint.y, ROAD_CONSTANTS.Z_OFFSET + 0.001);
      sprite.scale.set(bridgeSize, bridgeSize, 1);
      sprite.renderOrder = RENDER_ORDER.ROADS;
      group.add(sprite);
    }
  }

  return group;
}
