import * as THREE from 'three';
import type { HexTile } from '../../../types';
import type { RiverPath } from '../../../engine/worldGenData';
import { hexToWorld } from '../../../lib/worldPosition';
import { SimplexNoise } from '../../../lib/simplexNoise';
import { WATER_PALETTE } from '../palette/waterPalette';
import { getActivePalette } from '../palette/activePalette';
import { RENDER_ORDER, LAYER_Z } from './RenderLayers';
import { HEX_CONSTANTS } from './HexFillMesh';

// ─── River rendering constants (NFP #1: all named, all tunable) ──────────────

/** Half-width of river at source (thin mountain stream), in world units */
const RIVER_WIDTH_SOURCE = 0.3;
/** Half-width of river at mouth (wide lowland river), in world units */
const RIVER_WIDTH_MOUTH = 1.8;
/** Intermediate waypoints inserted between each pair of hex centers */
const RIVER_MEANDER_SUBDIVISIONS = 4;
/** Noise frequency — lower = wider bends, higher = tighter wiggles */
const RIVER_MEANDER_NOISE_SCALE = 0.035;
/** Max perpendicular displacement as fraction of HEX_SIZE */
const RIVER_MEANDER_AMPLITUDE = 0.35;
/** Chaikin corner-cutting passes after noise displacement */
const RIVER_SMOOTH_PASSES = 2;
/** Added to seed so river noise differs from coastline noise */
const RIVER_SEED_OFFSET = 5501;
/** Z position — from centralized LAYER_Z (monotonic with renderOrder) */
const RIVER_Z_OFFSET = LAYER_Z.RIVERS;
/** Bias from hex center toward the exit/entry edge for terminus points */
const RIVER_TERMINUS_EDGE_BIAS = 0.6;

// ─── Internal types ──────────────────────────────────────────────────────────

type Point2D = { x: number; y: number };

// ─── Geometry helpers ────────────────────────────────────────────────────────

function mid(a: Point2D, b: Point2D): Point2D {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function lerp2D(a: Point2D, b: Point2D, t: number): Point2D {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/**
 * Convert hex center path to edge-midpoint waypoints.
 * Routes through midpoints of shared hex edges rather than hex centers,
 * keeping the river away from hex center icons.
 */
function hexPathToEdgeMidpoints(centers: Point2D[]): Point2D[] {
  if (centers.length < 2) return centers;

  const edgeMids: Point2D[] = [];

  // Start: offset from first center toward first shared edge
  const firstEdge = mid(centers[0], centers[1]);
  edgeMids.push(lerp2D(centers[0], firstEdge, RIVER_TERMINUS_EDGE_BIAS));

  // Interior: shared edge midpoints
  for (let i = 0; i < centers.length - 1; i++) {
    edgeMids.push(mid(centers[i], centers[i + 1]));
  }

  // End: offset from last center toward last shared edge
  const lastEdge = mid(centers[centers.length - 2], centers[centers.length - 1]);
  edgeMids.push(lerp2D(centers[centers.length - 1], lastEdge, RIVER_TERMINUS_EDGE_BIAS));

  return edgeMids;
}

/**
 * Insert evenly-spaced intermediate points between each pair of waypoints.
 * Provides more points for noise displacement, creating finer-grained meanders.
 */
function subdividePoints(points: Point2D[], subdivisions: number): Point2D[] {
  if (points.length < 2) return points;
  const result: Point2D[] = [points[0]];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    for (let s = 1; s <= subdivisions; s++) {
      const t = s / (subdivisions + 1);
      result.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
    result.push(b);
  }
  return result;
}

/**
 * Displace each interior point perpendicular to the local flow direction
 * using seeded simplex noise. Endpoints are pinned (no displacement) so
 * rivers start/end precisely at their terminus positions.
 *
 * NFP #3: Deterministic — same seed + same path = same meander.
 * NFP #4: Fail-soft — amplitude < 0.001 or < 3 points returns unchanged.
 */
function displaceRiverPath(
  points: Point2D[],
  seed: number,
  noiseScale: number,
  amplitude: number,
  hexSize: number,
): Point2D[] {
  if (amplitude < 0.001 || points.length < 3) return points;

  const noise = new SimplexNoise(seed + RIVER_SEED_OFFSET);
  const n = points.length;
  const displaced: Point2D[] = [];

  for (let i = 0; i < n; i++) {
    // Pin endpoints — no displacement at source or mouth
    if (i === 0 || i === n - 1) {
      displaced.push(points[i]);
      continue;
    }

    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];

    // Tangent direction (prev → next)
    const tx = next.x - prev.x;
    const ty = next.y - prev.y;
    const tLen = Math.sqrt(tx * tx + ty * ty) || 1;

    // Perpendicular normal (rotated 90°)
    const nx = ty / tLen;
    const ny = -tx / tLen;

    // Sample noise at current position
    const n1 = noise.noise2D(curr.x * noiseScale, curr.y * noiseScale);

    // Ramp: ease in over first 15% of path, ease out over last 10%
    // Prevents wild wiggles at headwaters and mouths
    const progress = i / (n - 1);
    const rampIn  = Math.min(1, progress / 0.15);
    const rampOut = Math.min(1, (1 - progress) / 0.10);
    const ramp = rampIn * rampOut;

    const disp = n1 * amplitude * hexSize * ramp;
    displaced.push({ x: curr.x + nx * disp, y: curr.y + ny * disp });
  }

  return displaced;
}

/**
 * Smooth an open path using Chaikin's corner-cutting algorithm.
 * Preserves first and last points exactly (endpoints stay pinned).
 */
function chaikinSmoothOpen(points: Point2D[], passes: number): Point2D[] {
  let pts = points;
  for (let pass = 0; pass < passes; pass++) {
    const n = pts.length;
    if (n < 3) break;
    const smoothed: Point2D[] = [pts[0]]; // pin start
    for (let i = 0; i < n - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      // Skip doubling first/last segment endpoints
      if (i > 0) {
        smoothed.push({ x: 0.75 * p0.x + 0.25 * p1.x, y: 0.75 * p0.y + 0.25 * p1.y });
      }
      if (i < n - 2) {
        smoothed.push({ x: 0.25 * p0.x + 0.75 * p1.x, y: 0.25 * p0.y + 0.75 * p1.y });
      }
    }
    smoothed.push(pts[n - 1]); // pin end
    pts = smoothed;
  }
  return pts;
}

/**
 * Convert a RiverPath's hex coords to a smoothed, meandering list of 3D world points.
 * All Y coordinates are negated (SVG y-down → Three.js y-up).
 *
 * NFP #3: Deterministic — pipeline is seeded.
 * NFP #4: Fail-soft — paths with < 2 hexes return empty array.
 */
function riverPathToWorldPoints(
  hexes: Array<{ col: number; row: number }>,
  seed: number,
): Point2D[] {
  if (hexes.length < 2) return [];

  // 1. Convert hex coords to world-space centers (Y-flipped for Three.js)
  const centers: Point2D[] = hexes.map(h => hexToWorld(h, HEX_CONSTANTS.HEX_SIZE));

  // 3. Route through edge midpoints (avoids hex center icons)
  let points = hexPathToEdgeMidpoints(centers);

  // 4. Subdivide for finer meander resolution
  points = subdividePoints(points, RIVER_MEANDER_SUBDIVISIONS);

  // 5. Displace perpendicular to flow using seeded noise
  const amplitudeScale = hexes.length === 2 ? 0.5 : 1.0;
  points = displaceRiverPath(
    points,
    seed,
    RIVER_MEANDER_NOISE_SCALE,
    RIVER_MEANDER_AMPLITUDE * amplitudeScale,
    HEX_CONSTANTS.HEX_SIZE,
  );

  // 6. Chaikin smoothing (fewer passes for 2-hex paths)
  const smoothPasses = hexes.length === 2 ? 1 : RIVER_SMOOTH_PASSES;
  points = chaikinSmoothOpen(points, smoothPasses);

  return points;
}

/**
 * Build quad strip geometry (positions + triangle indices) from a list of
 * centerline points. At each point, two vertices are emitted offset perpendicular
 * to the local tangent by ±halfWidth. Width lerps from source to mouth.
 *
 * Vertex layout (per cross-section i):
 *   left  = center + normal * halfWidth    (index 2*i)
 *   right = center - normal * halfWidth    (index 2*i + 1)
 *
 * Triangle strip (per segment between cross-sections i and i+1):
 *   Triangle A: [2i, 2i+1, 2i+2]
 *   Triangle B: [2i+1, 2i+3, 2i+2]
 */
function buildQuadStripGeometry(
  points: Point2D[],
  sourceHalfWidth: number,
  mouthHalfWidth: number,
): THREE.BufferGeometry {
  const n = points.length;
  const positions: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i < n; i++) {
    const prev = points[Math.max(0, i - 1)];
    const next = points[Math.min(n - 1, i + 1)];

    // Tangent direction
    const tx = next.x - prev.x;
    const ty = next.y - prev.y;
    const tLen = Math.sqrt(tx * tx + ty * ty) || 1;

    // Normal (perpendicular, rotated 90° CCW)
    const nx = -ty / tLen;
    const ny =  tx / tLen;

    // Width lerp: 0 at source, 1 at mouth
    const t = n > 1 ? i / (n - 1) : 0;
    const halfWidth = sourceHalfWidth + (mouthHalfWidth - sourceHalfWidth) * t;

    const px = points[i].x;
    const py = points[i].y;

    // Left vertex (index 2*i)
    positions.push(px + nx * halfWidth, py + ny * halfWidth, RIVER_Z_OFFSET);
    // Right vertex (index 2*i + 1)
    positions.push(px - nx * halfWidth, py - ny * halfWidth, RIVER_Z_OFFSET);

    // Triangle strip indices for segment [i-1 → i]
    if (i > 0) {
      const a = 2 * (i - 1);      // prev left
      const b = 2 * (i - 1) + 1;  // prev right
      const c = 2 * i;             // curr left
      const d = 2 * i + 1;        // curr right
      indices.push(a, b, c);
      indices.push(b, d, c);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  return geo;
}

// ─── Scene Module Factory ────────────────────────────────────────────────────

/**
 * Creates a THREE.Group containing a single merged mesh for all river paths.
 * Rivers render as curved blue overlay lines using quad strip geometry.
 * Width scales from thin mountain streams to wide lowland rivers.
 *
 * NFP #1: All constants named above.
 * NFP #3: Deterministic — seed drives meander noise.
 * NFP #4: Fail-soft — empty paths return empty group, short paths skipped.
 * NFP #7: All river paths merged into one BufferGeometry (minimal draw calls).
 *
 * @param riverPaths - River paths from worldgen (RiverPath[])
 * @param tiles - Tile array for lookup (retained for future use)
 * @param seed - World seed for deterministic meander noise
 */
export function createRiverMesh(
  riverPaths: RiverPath[],
  _tiles: HexTile[],
  seed: number,
): THREE.Group {
  const group = new THREE.Group();
  group.renderOrder = RENDER_ORDER.RIVERS;

  // Fail-soft: empty paths array
  if (!riverPaths || riverPaths.length === 0) return group;

  // Accumulate all river path geometries into merged arrays
  const allPositions: number[] = [];
  const allIndices: number[] = [];
  let vertexOffset = 0;

  for (const riverPath of riverPaths) {
    // Fail-soft: skip rivers with < 2 hexes
    if (!riverPath.hexes || riverPath.hexes.length < 2) continue;

    // Generate smoothed world-space centerline
    const points = riverPathToWorldPoints(riverPath.hexes, seed);
    if (points.length < 2) continue;

    // Build quad strip for this river
    const geo = buildQuadStripGeometry(points, RIVER_WIDTH_SOURCE, RIVER_WIDTH_MOUTH);
    const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
    const idxAttr = geo.getIndex();

    if (!posAttr || !idxAttr) continue;

    // Merge positions
    for (let i = 0; i < posAttr.count * 3; i++) {
      allPositions.push(posAttr.array[i]);
    }

    // Merge indices (offset by current vertex count)
    const idxArr = idxAttr.array;
    for (let i = 0; i < idxArr.length; i++) {
      allIndices.push(idxArr[i] + vertexOffset);
    }

    vertexOffset += posAttr.count;
    geo.dispose();
  }

  // If no valid paths produced geometry, return empty group
  if (allPositions.length === 0) return group;

  // Build merged geometry
  const mergedGeo = new THREE.BufferGeometry();
  mergedGeo.setAttribute('position', new THREE.Float32BufferAttribute(allPositions, 3));
  mergedGeo.setIndex(allIndices);

  const mat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(getActivePalette().waterOverrides['deep_ocean'] ?? WATER_PALETTE['deep_ocean']),
    side: THREE.DoubleSide,
    depthTest: true,
  });

  const mesh = new THREE.Mesh(mergedGeo, mat);
  mesh.renderOrder = RENDER_ORDER.RIVERS;
  group.add(mesh);

  return group;
}
