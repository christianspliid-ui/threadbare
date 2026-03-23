// src/engine/coastline.ts

import type { HexTile, TerrainType } from '../types';
import type { Point2D, ContourLoop, CoastlineData, CoastlineConfig } from '../types/coastline';
import { COASTLINE_DEFAULTS } from '../types/coastline';
import { hexToPixel, HEX_SCALE_X, HEX_SCALE_Y } from '../lib/hexMath';
import { SimplexNoise } from '../lib/simplexNoise';

// ─── Water terrain classification ─────────────────────────────────
const WATER_TERRAINS: ReadonlySet<TerrainType> = new Set([
  'ocean', 'deep_ocean', 'tropical_ocean', 'coastal_shallows', 'coast', 'lake', 'river', 'reef',
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
  /** Margin added to hex positions in field space; must be subtracted from contour output. */
  margin: number;
}

/**
 * Build a metaball-style scalar field from land hex positions.
 * Each land hex emits a quartic falloff: (1 - d²/r²)².
 *
 * When lakeIds is provided, lake hexes are treated as LAND for the scalar field.
 * This ensures the organic coastline contour wraps around land+lakes together,
 * so the ocean mask holes include lake areas (lakes stay visible, not covered by ocean).
 */
export function buildScalarField(
  tiles: HexTile[],
  hexSize: number,
  cols: number,
  rows: number,
  opts: Pick<CoastlineConfig, 'blobRadius' | 'fieldResolution'> = COASTLINE_DEFAULTS,
  lakeIds?: Int16Array,
): ScalarFieldResult {
  const fieldRes = opts.fieldResolution;
  const blobRadius = opts.blobRadius * hexSize;
  const r2 = blobRadius * blobRadius;

  // Canvas dimensions in local coordinate space (inside tileBaseTransform group).
  // Margin must be at least as large as the blob radius so blobs from edge hexes
  // roll off smoothly within the field — otherwise marching squares clips them,
  // producing triangular contour artifacts along the field boundary.
  const margin = Math.ceil(blobRadius);
  const canvasW = cols * hexSize * HEX_SCALE_X + hexSize * 0.5 + hexSize + margin * 2;
  const canvasH = rows * HEX_SCALE_Y * hexSize + HEX_SCALE_Y * hexSize * 0.5 + hexSize + margin * 2;

  // Collect land hex pixel positions. Lake hexes (lakeId >= 0) are included as land
  // so the organic coastline wraps around both land and lakes together.
  const landPositions: Point2D[] = [];
  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i];
    const isLake = lakeIds && lakeIds[i] >= 0;
    if (isWaterTerrain(tile.terrain) && !isLake) continue;
    const { x, y } = hexToPixel(tile.coord, hexSize);
    landPositions.push({ x: x + margin, y: y + margin });
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

  return { field, gridW, gridH, fieldRes, canvasW, canvasH, margin };
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
  // In screen coordinates (Y-down), positive signedArea = CW.
  // Prototype convention: reverse if positive → ensure CCW (consistent outward normals).
  if (signedArea(loop) > 0) loop.reverse();
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

/** Shift all contour points back to hexToPixel coordinate space by subtracting the field margin. */
function shiftLoops(loops: ContourLoop[], margin: number): ContourLoop[] {
  return loops.map(loop =>
    loop.map(p => ({ x: p.x - margin, y: p.y - margin })),
  );
}

/**
 * Build a metaball-style scalar field from LAKE hex positions.
 * Used for organic lake shore contours — same approach as land coastline
 * but with lake hexes as the "blob emitters".
 */
export function buildLakeScalarField(
  tiles: HexTile[],
  hexSize: number,
  cols: number,
  rows: number,
  lakeIds: Int16Array | undefined,
  opts: Pick<CoastlineConfig, 'blobRadius' | 'fieldResolution'> = COASTLINE_DEFAULTS,
): ScalarFieldResult | null {
  if (!lakeIds) return null;

  const fieldRes = opts.fieldResolution;
  const blobRadius = opts.blobRadius * hexSize;
  const r2 = blobRadius * blobRadius;

  const margin = Math.ceil(blobRadius);
  const canvasW = cols * hexSize * HEX_SCALE_X + hexSize * 0.5 + hexSize + margin * 2;
  const canvasH = rows * HEX_SCALE_Y * hexSize + HEX_SCALE_Y * hexSize * 0.5 + hexSize + margin * 2;

  // Collect lake hex positions
  const lakePositions: Point2D[] = [];
  for (let i = 0; i < tiles.length; i++) {
    if (lakeIds[i] < 0) continue; // not a lake hex
    const { x, y } = hexToPixel(tiles[i].coord, hexSize);
    lakePositions.push({ x: x + margin, y: y + margin });
  }

  if (lakePositions.length === 0) return null;

  const gridW = Math.ceil(canvasW / fieldRes) + 1;
  const gridH = Math.ceil(canvasH / fieldRes) + 1;
  const field = new Float32Array(gridW * gridH);

  for (let gy = 0; gy < gridH; gy++) {
    const py = gy * fieldRes;
    for (let gx = 0; gx < gridW; gx++) {
      const px = gx * fieldRes;
      let value = 0;
      for (const hex of lakePositions) {
        const dx = px - hex.x;
        const dy = py - hex.y;
        const d2 = dx * dx + dy * dy;
        if (d2 >= r2) continue;
        const t = 1 - d2 / r2;
        value += t * t;
      }
      field[gy * gridW + gx] = value;
    }
  }

  return { field, gridW, gridH, fieldRes, canvasW, canvasH, margin };
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
  lakeIds?: Int16Array,
): CoastlineData {
  const { field, gridW, gridH, fieldRes, margin } = buildScalarField(tiles, hexSize, cols, rows, config, lakeIds);

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

  // Mid-depth organic band (wider than land boundary, narrower than shallows)
  let midLoops: ContourLoop[] = [];
  if (config.midWidth > 0) {
    const midThreshold = Math.max(0.01, config.threshold - config.midWidth);
    midLoops = processLoops(
      field, gridW, gridH,
      midThreshold,
      config.smoothPasses,
      config.displacement,
      config.noiseScale,
      seed,
      hexSize,
      config.minLoopPoints,
      fieldRes,
    );
  }

  // Shallows organic band (widest — outermost water band)
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

  // Lake shore contours — organic boundaries for inland lakes
  let lakeLoops: ContourLoop[] = [];
  const lakeField = buildLakeScalarField(tiles, hexSize, cols, rows, lakeIds, config);
  if (lakeField) {
    lakeLoops = processLoops(
      lakeField.field, lakeField.gridW, lakeField.gridH,
      config.threshold,
      config.smoothPasses,
      config.displacement * 0.5, // Less displacement for lakes — they're calmer
      config.noiseScale,
      seed + 7, // Different seed offset so lake shores don't mirror coastline noise
      hexSize,
      config.minLoopPoints,
      lakeField.fieldRes,
    );
    lakeLoops = shiftLoops(lakeLoops, lakeField.margin);
  }

  // Shift contour coordinates from field-space back to hexToPixel-space.
  return {
    loops: shiftLoops(loops, margin),
    midLoops: shiftLoops(midLoops, margin),
    shallowLoops: shiftLoops(shallowLoops, margin),
    lakeLoops,
  };
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
