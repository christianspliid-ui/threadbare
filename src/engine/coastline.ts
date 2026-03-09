// src/engine/coastline.ts

import type { HexTile, TerrainType } from '../types';
import type { Point2D, ContourLoop, CoastlineData, CoastlineConfig } from '../types/coastline';
import { COASTLINE_DEFAULTS } from '../types/coastline';
import { hexToPixel, HEX_SCALE_X, HEX_SCALE_Y } from '../lib/hexMath';
import { SimplexNoise } from '../lib/simplexNoise';

// ─── Water terrain classification ─────────────────────────────────
const WATER_TERRAINS: ReadonlySet<TerrainType> = new Set([
  'ocean', 'coastal_shallows', 'lake', 'river',
] as TerrainType[]);

export function isWaterTerrain(terrain: TerrainType): boolean {
  return WATER_TERRAINS.has(terrain);
}

// ─── Scalar Field ─────────────────────────────────────────────────
export interface ScalarFieldResult {
  field: Float32Array;
  gridW: number;
  gridH: number;
  fieldRes: number;
  canvasW: number;
  canvasH: number;
}

/**
 * Build a metaball-style scalar field from land hex positions.
 * Each land hex emits a quartic falloff: (1 - d²/r²)².
 */
export function buildScalarField(
  tiles: HexTile[],
  hexSize: number,
  cols: number,
  rows: number,
  opts: Pick<CoastlineConfig, 'blobRadius' | 'fieldResolution'> = COASTLINE_DEFAULTS,
): ScalarFieldResult {
  const fieldRes = opts.fieldResolution;
  const blobRadius = opts.blobRadius * hexSize;
  const r2 = blobRadius * blobRadius;

  // Canvas dimensions (matching HexMap.tsx computation)
  const padding = hexSize;
  const canvasW = cols * hexSize * HEX_SCALE_X + hexSize * 0.5 + hexSize * 2 + padding * 2;
  const canvasH = rows * HEX_SCALE_Y * hexSize + HEX_SCALE_Y * hexSize * 0.5 + hexSize * 2 + padding * 2;

  // Collect land hex pixel positions (with the same offset as HexMap tileBaseTransform)
  const offsetX = padding + hexSize;
  const offsetY = padding + hexSize * 0.8;
  const landPositions: Point2D[] = [];
  for (const tile of tiles) {
    if (isWaterTerrain(tile.terrain)) continue;
    const { x, y } = hexToPixel(tile.coord, hexSize);
    landPositions.push({ x: x + offsetX, y: y + offsetY });
  }

  const gridW = Math.ceil(canvasW / fieldRes) + 1;
  const gridH = Math.ceil(canvasH / fieldRes) + 1;
  const field = new Float32Array(gridW * gridH);

  for (let gy = 0; gy < gridH; gy++) {
    const py = gy * fieldRes;
    for (let gx = 0; gx < gridW; gx++) {
      const px = gx * fieldRes;
      let value = 0;
      for (const hex of landPositions) {
        const dx = px - hex.x;
        const dy = py - hex.y;
        const d2 = dx * dx + dy * dy;
        if (d2 >= r2) continue;
        const t = 1 - d2 / r2;
        value += t * t; // quartic falloff
      }
      field[gy * gridW + gx] = value;
    }
  }

  return { field, gridW, gridH, fieldRes, canvasW, canvasH };
}

// ─── Marching Squares Iso-Contour Extraction ──────────────────────

interface Segment {
  p1: Point2D;
  p2: Point2D;
}

// Lookup table: case index → pairs of [edgeA, edgeB]
const MARCHING_CASES: [number, number][][] = [
  [],              // 0
  [[3, 0]],        // 1: c0
  [[0, 1]],        // 2: c1
  [[3, 1]],        // 3: c0,c1
  [[1, 2]],        // 4: c2
  [[3, 0],[1, 2]], // 5: saddle
  [[0, 2]],        // 6: c1,c2
  [[3, 2]],        // 7: c0,c1,c2
  [[2, 3]],        // 8: c3
  [[2, 0]],        // 9: c0,c3
  [[0, 1],[2, 3]], // 10: saddle
  [[2, 1]],        // 11: c0,c1,c3
  [[1, 3]],        // 12: c2,c3
  [[1, 0]],        // 13: c0,c2,c3
  [[0, 3]],        // 14: c1,c2,c3
  [],              // 15: all above
];

export function extractContours(
  field: Float32Array,
  gridW: number,
  gridH: number,
  threshold: number,
  fieldRes: number = 4,
): Segment[] {
  const segments: Segment[] = [];

  for (let gy = 0; gy < gridH - 1; gy++) {
    for (let gx = 0; gx < gridW - 1; gx++) {
      const v0 = field[gy * gridW + gx];           // top-left
      const v1 = field[gy * gridW + gx + 1];       // top-right
      const v2 = field[(gy + 1) * gridW + gx + 1]; // bottom-right
      const v3 = field[(gy + 1) * gridW + gx];     // bottom-left

      let ci = 0;
      if (v0 >= threshold) ci |= 1;
      if (v1 >= threshold) ci |= 2;
      if (v2 >= threshold) ci |= 4;
      if (v3 >= threshold) ci |= 8;

      if (ci === 0 || ci === 15) continue;

      const x0 = gx * fieldRes, y0 = gy * fieldRes;
      const x1 = x0 + fieldRes, y1 = y0 + fieldRes;

      const interp = (va: number, vb: number, ax: number, ay: number, bx: number, by: number): Point2D => {
        if (Math.abs(vb - va) < 1e-10) return { x: (ax + bx) / 2, y: (ay + by) / 2 };
        const t = (threshold - va) / (vb - va);
        return { x: ax + t * (bx - ax), y: ay + t * (by - ay) };
      };

      const edgePts = [
        interp(v0, v1, x0, y0, x1, y0), // edge 0: top
        interp(v1, v2, x1, y0, x1, y1), // edge 1: right
        interp(v3, v2, x0, y1, x1, y1), // edge 2: bottom
        interp(v0, v3, x0, y0, x0, y1), // edge 3: left
      ];

      for (const [ea, eb] of MARCHING_CASES[ci]) {
        segments.push({ p1: edgePts[ea], p2: edgePts[eb] });
      }
    }
  }

  return segments;
}

// ─── Contour Chaining ─────────────────────────────────────────────

const SNAP_DISTANCE = 0.5;

export function chainSegmentsIntoLoops(segments: Segment[]): ContourLoop[] {
  if (segments.length === 0) return [];

  const snapKey = (p: Point2D) =>
    `${Math.round(p.x / SNAP_DISTANCE)},${Math.round(p.y / SNAP_DISTANCE)}`;

  interface IndexedSeg {
    p1: Point2D;
    p2: Point2D;
    k1: string;
    k2: string;
    used: boolean;
  }

  const segs: IndexedSeg[] = segments.map(s => ({
    p1: s.p1,
    p2: s.p2,
    k1: snapKey(s.p1),
    k2: snapKey(s.p2),
    used: false,
  }));

  const byEndpoint: Record<string, { seg: IndexedSeg; startSide: boolean }[]> = {};
  for (const seg of segs) {
    (byEndpoint[seg.k1] ??= []).push({ seg, startSide: true });
    (byEndpoint[seg.k2] ??= []).push({ seg, startSide: false });
  }

  const loops: ContourLoop[] = [];

  for (const startSeg of segs) {
    if (startSeg.used) continue;
    startSeg.used = true;

    const chain: Point2D[] = [startSeg.p1, startSeg.p2];
    let currentKey = startSeg.k2;
    const startKey = startSeg.k1;

    let safety = 0;
    while (safety++ < 50000) {
      const candidates = (byEndpoint[currentKey] ?? []).filter(c => !c.seg.used);
      if (candidates.length === 0) break;

      const next = candidates[0];
      next.seg.used = true;

      if (next.startSide) {
        chain.push(next.seg.p2);
        currentKey = next.seg.k2;
      } else {
        chain.push(next.seg.p1);
        currentKey = next.seg.k1;
      }

      if (currentKey === startKey) break;
    }

    if (chain.length >= 3) {
      loops.push(chain);
    }
  }

  return loops;
}

// ─── Winding Order ────────────────────────────────────────────────

export function signedArea(loop: ContourLoop): number {
  let area = 0;
  for (let i = 0; i < loop.length; i++) {
    const j = (i + 1) % loop.length;
    area += loop[i].x * loop[j].y;
    area -= loop[j].x * loop[i].y;
  }
  return area / 2;
}

export function ensureClockwise(loop: ContourLoop): ContourLoop {
  if (signedArea(loop) < 0) loop.reverse();
  return loop;
}

// ─── Chaikin Corner-Cutting Smoothing ─────────────────────────────

export function chaikinSmooth(loop: ContourLoop, passes: number): ContourLoop {
  let pts = loop;
  for (let pass = 0; pass < passes; pass++) {
    const n = pts.length;
    if (n < 3) break;
    const smoothed: Point2D[] = [];
    for (let i = 0; i < n; i++) {
      const p0 = pts[i];
      const p1 = pts[(i + 1) % n];
      smoothed.push({ x: 0.75 * p0.x + 0.25 * p1.x, y: 0.75 * p0.y + 0.25 * p1.y });
      smoothed.push({ x: 0.25 * p0.x + 0.75 * p1.x, y: 0.25 * p0.y + 0.75 * p1.y });
    }
    pts = smoothed;
  }
  return pts;
}

// ─── Contour Displacement ─────────────────────────────────────────

const DEFAULT_HEX_SIZE_FOR_DISPLACEMENT = 30;

export function displaceContour(
  loop: ContourLoop,
  seed: number,
  noiseScale: number,
  amplitude: number,
  hexSize: number = DEFAULT_HEX_SIZE_FOR_DISPLACEMENT,
): ContourLoop {
  if (amplitude < 0.001) return loop;

  const noise = new SimplexNoise(seed);
  const n = loop.length;
  const displaced: Point2D[] = [];

  for (let i = 0; i < n; i++) {
    const prev = loop[(i - 1 + n) % n];
    const curr = loop[i];
    const next = loop[(i + 1) % n];

    const tx = next.x - prev.x;
    const ty = next.y - prev.y;
    const tLen = Math.sqrt(tx * tx + ty * ty) || 1;

    // Outward normal (perpendicular)
    const nx = ty / tLen;
    const ny = -tx / tLen;

    const n1 = noise.noise2D(curr.x * noiseScale, curr.y * noiseScale);
    const disp = n1 * amplitude * hexSize;

    displaced.push({ x: curr.x + nx * disp, y: curr.y + ny * disp });
  }

  return displaced;
}

// ─── Full Pipeline ────────────────────────────────────────────────

function processLoops(
  field: Float32Array,
  gridW: number,
  gridH: number,
  threshold: number,
  smoothPasses: number,
  displacement: number,
  noiseScale: number,
  seed: number,
  hexSize: number,
  minLoopPoints: number,
  fieldRes: number,
): ContourLoop[] {
  const rawSegments = extractContours(field, gridW, gridH, threshold, fieldRes);
  let loops = chainSegmentsIntoLoops(rawSegments);

  loops = loops.map(loop => {
    let smoothed = chaikinSmooth(loop, smoothPasses);
    smoothed = ensureClockwise(smoothed);
    smoothed = displaceContour(smoothed, seed, noiseScale, displacement, hexSize);
    return smoothed;
  });

  return loops.filter(l => l.length >= minLoopPoints);
}

/**
 * Full coastline computation pipeline.
 */
export function computeCoastline(
  tiles: HexTile[],
  hexSize: number,
  cols: number,
  rows: number,
  seed: number,
  config: CoastlineConfig = COASTLINE_DEFAULTS,
): CoastlineData {
  const { field, gridW, gridH, fieldRes } = buildScalarField(tiles, hexSize, cols, rows, config);

  const loops = processLoops(
    field, gridW, gridH,
    config.threshold,
    config.smoothPasses,
    config.displacement,
    config.noiseScale,
    seed,
    hexSize,
    config.minLoopPoints,
    fieldRes,
  );

  let shallowLoops: ContourLoop[] = [];
  if (config.shallowWidth > 0) {
    const shallowThreshold = Math.max(0.01, config.threshold - config.shallowWidth);
    shallowLoops = processLoops(
      field, gridW, gridH,
      shallowThreshold,
      config.smoothPasses,
      config.displacement,
      config.noiseScale,
      seed,
      hexSize,
      config.minLoopPoints,
      fieldRes,
    );
  }

  return { loops, shallowLoops };
}

// ─── SVG Path Conversion ──────────────────────────────────────────

/** Convert a single contour loop to an SVG path `d` string. */
export function contourLoopToSvgPath(loop: ContourLoop): string {
  if (loop.length < 3) return '';
  const r = (n: number) => Math.round(n * 10) / 10;
  const parts = [`M${r(loop[0].x)},${r(loop[0].y)}`];
  for (let i = 1; i < loop.length; i++) {
    parts.push(`L${r(loop[i].x)},${r(loop[i].y)}`);
  }
  parts.push('Z');
  return parts.join('');
}

/** Combine multiple contour loops into a single SVG path string (even-odd fill). */
export function combineLoopPaths(loops: ContourLoop[]): string {
  return loops.map(contourLoopToSvgPath).filter(Boolean).join(' ');
}
