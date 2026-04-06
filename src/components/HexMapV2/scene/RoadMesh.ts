/**
 * RoadMesh.ts — Road network rendering for HexMapV2.
 *
 * Builds quad-strip geometry for roads from pre-computed RoadPath[] data.
 * Road generation logic lives in src/engine/roadNetwork.ts (worldgen).
 *
 * NFP #1 (tunability): All rendering constants in ROAD_CONSTANTS.
 * NFP #4 (fail-soft): Empty road paths → empty group, no crash.
 * NFP #7 (performance): Major roads and trails each merged into a single BufferGeometry.
 */

import * as THREE from 'three';
import type { HexCoord, HexTile } from '../../../types';
import { getTerrainTax } from '../../../data/movement-content';
import { RENDER_ORDER, LAYER_Z } from './RenderLayers';
import { HEX_CONSTANTS } from './HexFillMesh';
import { hexKeyFromCoord, hexKey as hexKeyFn } from '../../../lib/hexKey';
import { hexToWorld } from '../../../lib/worldPosition';
import { getActivePalette } from '../palette/activePalette';

// Re-export types from engine for backward compat
export type { RoadPath, RoadType } from '../../../engine/roadNetwork';
import type { RoadPath } from '../../../engine/roadNetwork';

// ─── Road rendering constants (NFP #1: all named, all tunable) ───────────────

/**
 * All tunable constants for the road rendering system.
 *
 * | Constant           | Default     | Purpose                                       |
 * |--------------------|-------------|-----------------------------------------------|
 * | MAJOR_COLOR        | '#6b5a40'   | Warm earth — 40% brightness (per UI-SPEC)     |
 * | TRAIL_COLOR        | '#4a3d2c'   | Darker earth — 25% brightness (per UI-SPEC)   |
 * | MAJOR_HALF_WIDTH   | 0.4         | Half-width of major roads in world units       |
 * | TRAIL_HALF_WIDTH   | 0.1         | Half-width of trail roads in world units       |
 * | Z_OFFSET           | LAYER_Z.ROADS | From centralized LAYER_Z (monotonic with renderOrder) |
 * | TRAIL_DASH_SIZE    | 0.5         | World units per dash segment                  |
 * | TRAIL_GAP_SIZE     | 0.5         | World units per gap between dashes            |
 */
export const ROAD_CONSTANTS = {
  /** @deprecated Use getActivePalette().roadMajor — kept for constant table docs only */
  MAJOR_COLOR:       '#6b5a40',
  /** @deprecated Use getActivePalette().roadTrail — kept for constant table docs only */
  TRAIL_COLOR:       '#4a3d2c',
  MAJOR_HALF_WIDTH:  0.4,
  TRAIL_HALF_WIDTH:  0.1,
  Z_OFFSET:          LAYER_Z.ROADS,
  TRAIL_DASH_SIZE:   0.5,
  TRAIL_GAP_SIZE:    0.5,
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
  /** Wobble scale factor for trails relative to major roads (0–1). Lower = subtler curves. */
  TRAIL_WOBBLE_SCALE:  0.6,
} as const;

// ─── Geometry builders ────────────────────────────────────────────────────────

type Point2D = { x: number; y: number };

/**
 * Build quad strip geometry from a list of 2D centerline points.
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

    const tx = next.x - prev.x;
    const ty = next.y - prev.y;
    const tLen = Math.sqrt(tx * tx + ty * ty) || 1;

    const nx = -ty / tLen;
    const ny =  tx / tLen;

    const px = points[i].x;
    const py = points[i].y;

    positions.push(px + nx * halfWidth, py + ny * halfWidth, zOffset);
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
  return path.map(coord => hexToWorld(coord, HEX_CONSTANTS.HEX_SIZE));
}

// ─── Deterministic hash for road wobble (NFP #3) ─────────────────────────────

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

function wobbleMagnitudeForTax(tax: number): number {
  if (tax <= 0)   return ROAD_CONSTANTS.WOBBLE_BASE;
  if (tax <= 0.5) return ROAD_CONSTANTS.WOBBLE_LIGHT;
  if (tax <= 1.0) return ROAD_CONSTANTS.WOBBLE_MODERATE;
  return ROAD_CONSTANTS.WOBBLE_HEAVY;
}

/**
 * Add terrain-aware wobble to road paths.
 * Start/end anchored at hex centers. Intermediates drift perpendicular to road direction.
 */
function addTerrainWobble(
  path: HexCoord[],
  terrainMap: Map<string, string>,
  wobbleScale = 1.0,
): Point2D[] {
  if (path.length < 2) return roadPathToWorldPoints(path);

  const hexSize = HEX_CONSTANTS.HEX_SIZE;
  const waypointDrift = ROAD_CONSTANTS.WAYPOINT_DRIFT;
  const lastIdx = path.length - 1;

  const waypoints: Point2D[] = [];

  for (let i = 0; i <= lastIdx; i++) {
    const coord = path[i];
    const wp = hexToWorld(coord, hexSize);
    let wx = wp.x;
    let wy = wp.y;

    if (i > 0 && i < lastIdx) {
      const prevW = hexToWorld(path[i - 1], hexSize);
      const nextW = hexToWorld(path[i + 1], hexSize);
      const dx = nextW.x - prevW.x;
      const dy = nextW.y - prevW.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const perpX = -dy / len;
      const perpY = dx / len;

      const terrain = terrainMap.get(hexKeyFn(coord.col, coord.row)) ?? 'grassland';
      const tax = getTerrainTax(terrain as import('../../../types').TerrainType);
      const wobbleFrac = wobbleMagnitudeForTax(tax === Infinity ? 0 : tax);

      const hash = roadSegmentHash(coord.col * 7, coord.row * 13, coord.col, coord.row);
      const drift = hash * (waypointDrift + wobbleFrac * 0.5) * hexSize * wobbleScale;

      wx += perpX * drift;
      wy += perpY * drift;
    }

    waypoints.push({ x: wx, y: wy });
  }

  const result: Point2D[] = [waypoints[0]];

  for (let i = 0; i < waypoints.length - 1; i++) {
    const from = path[i];
    const to = path[i + 1];
    const a = waypoints[i];
    const b = waypoints[i + 1];

    const terrain = terrainMap.get(hexKeyFn(to.col, to.row)) ?? 'grassland';
    const tax = getTerrainTax(terrain as import('../../../types').TerrainType);
    const wobbleFraction = wobbleMagnitudeForTax(tax === Infinity ? 0 : tax);

    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const segLen = Math.sqrt(dx * dx + dy * dy) || 1;
    const perpX = -dy / segLen;
    const perpY = dx / segLen;

    const hash = roadSegmentHash(from.col, from.row, to.col, to.row);
    const offset = hash * wobbleFraction * hexSize * wobbleScale;

    const midX = (a.x + b.x) / 2 + perpX * offset;
    const midY = (a.y + b.y) / 2 + perpY * offset;
    result.push({ x: midX, y: midY });
    result.push(b);
  }

  return result;
}

// ─── Catmull-Rom spline interpolation ────────────────────────────────────────

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

function smoothWithCatmullRom(points: Point2D[]): Point2D[] {
  if (points.length < 3) return points;

  const samples = ROAD_CONSTANTS.SPLINE_SAMPLES;
  const result: Point2D[] = [points[0]];

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    for (let s = 1; s <= samples; s++) {
      const t = s / samples;
      result.push(catmullRom(p0, p1, p2, p3, t));
    }
  }

  // Anchor: ensure final point is exactly the original endpoint
  // (spline interpolation can drift slightly from the last control point)
  result[result.length - 1] = points[points.length - 1];

  return result;
}

function buildWindingRoadPoints(
  path: HexCoord[],
  terrainMap: Map<string, string>,
  wobbleScale = 1.0,
): Point2D[] {
  const wobbled = addTerrainWobble(path, terrainMap, wobbleScale);
  return smoothWithCatmullRom(wobbled);
}

/**
 * Build dashed quad strip geometry for trail roads.
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

  let accDist = 0;
  let segmentPoints: Point2D[] = [points[0]];
  let inDash = true;

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

      const newCyclePos = accDist % cycleLength;
      const crossedBoundary = newCyclePos < (step % cycleLength) + 0.0001;

      if (crossedBoundary || remaining <= 0.0001) {
        if (inDash && segmentPoints.length >= 2) {
          const { positions, indices } = buildQuadStripFromPoints(segmentPoints, halfWidth, zOffset);
          for (const p of positions) allPositions.push(p);
          for (const idx of indices) allIndices.push(idx + vertexOffset);
          vertexOffset += segmentPoints.length * 2;
        }
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
    vertexOffset += segmentPoints.length * 2;
  }

  // ── Endpoint anchors: always render a small solid dot at both ends ──
  // This prevents trails from visually ending in a gap before reaching the settlement.
  const anchorLen = dashSize * 0.6; // short solid anchor
  const emitAnchor = (p0: Point2D, p1: Point2D) => {
    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const endPt = { x: p0.x + (dx / len) * Math.min(anchorLen, len), y: p0.y + (dy / len) * Math.min(anchorLen, len) };
    const anchorPoints = [p0, endPt];
    const { positions, indices } = buildQuadStripFromPoints(anchorPoints, halfWidth, zOffset);
    for (const p of positions) allPositions.push(p);
    for (const idx of indices) allIndices.push(idx + vertexOffset);
    vertexOffset += anchorPoints.length * 2;
  };

  if (points.length >= 2) {
    // Anchor at start (settlement A end)
    emitAnchor(points[0], points[1]);
    // Anchor at end (settlement B end)
    emitAnchor(points[points.length - 1], points[points.length - 2]);
  }

  return { positions: allPositions, indices: allIndices };
}

// ─── Scene Module Factory ─────────────────────────────────────────────────────

/**
 * Creates a THREE.Group containing merged road meshes from pre-computed RoadPath[].
 *
 * - Major roads: solid quad-strip geometry, one merged mesh
 * - Trails: dashed quad-strip geometry, one merged mesh
 * - Group is initially hidden (zoom matrix controls visibility)
 *
 * @param roadPaths  Pre-computed road paths from world graph (via extractRoadPaths)
 * @param tiles      Hex tile array for terrain wobble lookup
 * @returns          THREE.Group at RENDER_ORDER.ROADS, initially hidden
 */
export function createRoadMesh(
  roadPaths: RoadPath[],
  tiles: HexTile[],
): THREE.Group {
  const group = new THREE.Group();
  group.renderOrder = RENDER_ORDER.ROADS;
  group.visible = false;

  if (roadPaths.length === 0) return group;

  // Build terrain lookup for winding road generation
  const terrainMap = new Map<string, string>();
  for (const tile of tiles) {
    terrainMap.set(hexKeyFromCoord(tile.coord), tile.terrain);
  }

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
        color: new THREE.Color(getActivePalette().roadMajor),
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
        depthTest: true,
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
      // Trails get the same wobble+spline treatment as major roads, but at reduced
      // magnitude (TRAIL_WOBBLE_SCALE) so they feel like lighter, organic footpaths.
      const worldPoints = buildWindingRoadPoints(
        roadPath.path, terrainMap, ROAD_CONSTANTS.TRAIL_WOBBLE_SCALE,
      );
      if (worldPoints.length < 2) continue;

      const { positions, indices } = buildDashedQuadStrip(
        worldPoints,
        ROAD_CONSTANTS.TRAIL_HALF_WIDTH,
        ROAD_CONSTANTS.Z_OFFSET,
      );

      for (const p of positions) allTrailPositions.push(p);
      for (const idx of indices) allTrailIndices.push(idx + vertexOffset);
      vertexOffset += positions.length / 3;
    }

    if (allTrailPositions.length > 0) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(allTrailPositions, 3));
      geo.setIndex(allTrailIndices);

      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(getActivePalette().roadTrail),
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
        depthTest: true,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.renderOrder = RENDER_ORDER.ROADS;
      group.add(mesh);
    }
  }

  return group;
}
