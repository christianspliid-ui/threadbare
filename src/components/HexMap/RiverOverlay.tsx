import { memo, useMemo } from 'react';
import type { HexCoord } from '../../types';
import type { RiverPath } from '../../engine/worldGenData';
import { hexToPixel } from '../../lib/hexMath';
import { SimplexNoise } from '../../lib/simplexNoise';

// ─── River rendering constants ───────────────────────────────────
const RIVER_COLOR = 'rgba(35, 60, 95, 0.75)'; // ~20%L — STYLE.md water surface range
const RIVER_WIDTH_SOURCE = 1.2;
const RIVER_WIDTH_MOUTH = 3.5;

// ─── Meander tuning constants (NFP #1: Tunability) ──────────────
/** Intermediate waypoints inserted between each pair of hex centers */
const MEANDER_SUBDIVISIONS = 4;
/** Noise frequency — lower = wider bends, higher = tighter wiggles */
const MEANDER_NOISE_SCALE = 0.035;
/** Max perpendicular displacement as fraction of hex size */
const MEANDER_AMPLITUDE = 0.35;
/** Chaikin corner-cutting passes after noise displacement */
const MEANDER_SMOOTH_PASSES = 2;
/** Noise seed offset so river meander pattern differs from coastline noise */
const MEANDER_SEED_OFFSET = 5501;

type Point2D = { x: number; y: number };

function r(n: number): number {
  return Math.round(n * 10) / 10;
}

// ─── Sub-hex interpolation ──────────────────────────────────────

/**
 * Insert evenly-spaced intermediate points between each pair of hex centers.
 * This gives the noise displacement more points to work with, creating
 * finer-grained meander curves within each hex segment.
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

// ─── Perpendicular noise displacement ───────────────────────────

/**
 * Displace each point perpendicular to the local flow direction using
 * seeded simplex noise. Same technique as coastline displaceContour but
 * adapted for open paths (not closed loops).
 *
 * Endpoints are pinned (no displacement) so rivers start/end at hex centers.
 * Amplitude ramps up from the source over the first few points and ramps
 * down near the mouth, preventing unnatural wiggles at termini.
 */
function displaceRiverPath(
  points: Point2D[],
  seed: number,
  noiseScale: number,
  amplitude: number,
  hexSize: number,
): Point2D[] {
  if (amplitude < 0.001 || points.length < 3) return points;

  const noise = new SimplexNoise(seed + MEANDER_SEED_OFFSET);
  const n = points.length;
  const displaced: Point2D[] = [];

  for (let i = 0; i < n; i++) {
    // Pin endpoints
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

    // Sample noise at this position
    const n1 = noise.noise2D(curr.x * noiseScale, curr.y * noiseScale);

    // Ramp factor: ease in over first 15% of path, ease out over last 10%
    // This prevents wild wiggles at the source headwaters and at river mouths
    const progress = i / (n - 1);
    const rampIn = Math.min(1, progress / 0.15);
    const rampOut = Math.min(1, (1 - progress) / 0.10);
    const ramp = rampIn * rampOut;

    const disp = n1 * amplitude * hexSize * ramp;
    displaced.push({ x: curr.x + nx * disp, y: curr.y + ny * disp });
  }

  return displaced;
}

// ─── Chaikin corner-cutting (open path variant) ─────────────────

/**
 * Smooth an open path using Chaikin's algorithm.
 * Unlike the closed-loop version in coastline.ts, this preserves
 * the first and last points exactly (endpoints stay pinned).
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
      // Skip first/last segment endpoints from being doubled
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

// ─── SVG path conversion ────────────────────────────────────────

/**
 * Convert a river path (hex coords) to a meandering SVG path string.
 *
 * Pipeline:
 * 1. Map hex coords → pixel centers
 * 2. Subdivide with intermediate waypoints between hex centers
 * 3. Displace perpendicular to flow using seeded simplex noise
 * 4. Chaikin-smooth the displaced points
 * 5. Emit as Catmull-Rom → Bezier SVG path
 *
 * Exported for testing.
 */
export function riverPathToSvgPath(
  hexes: HexCoord[],
  hexSize: number,
  seed: number = 0,
): string {
  if (hexes.length < 2) return '';

  let points: Point2D[] = hexes.map(h => hexToPixel(h, hexSize));

  if (points.length === 2) {
    // Even 2-hex paths get a slight meander
    points = subdividePoints(points, MEANDER_SUBDIVISIONS);
    points = displaceRiverPath(points, seed, MEANDER_NOISE_SCALE, MEANDER_AMPLITUDE * 0.5, hexSize);
    points = chaikinSmoothOpen(points, 1);
  } else {
    points = subdividePoints(points, MEANDER_SUBDIVISIONS);
    points = displaceRiverPath(points, seed, MEANDER_NOISE_SCALE, MEANDER_AMPLITUDE, hexSize);
    points = chaikinSmoothOpen(points, MEANDER_SMOOTH_PASSES);
  }

  if (points.length < 2) return '';

  if (points.length === 2) {
    return `M${r(points[0].x)},${r(points[0].y)} L${r(points[1].x)},${r(points[1].y)}`;
  }

  // Cubic Bezier through points using Catmull-Rom → Bezier conversion
  const parts: string[] = [`M${r(points[0].x)},${r(points[0].y)}`];

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    // Catmull-Rom to Bezier control points
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    parts.push(`C${r(cp1x)},${r(cp1y)} ${r(cp2x)},${r(cp2y)} ${r(p2.x)},${r(p2.y)}`);
  }

  return parts.join(' ');
}

// ─── Component ──────────────────────────────────────────────────

interface RiverOverlayProps {
  riverPaths: RiverPath[];
  hexSize: number;
  seed: number;
}

export const RiverOverlay = memo(function RiverOverlay({
  riverPaths,
  hexSize,
  seed,
}: RiverOverlayProps) {
  const paths = useMemo(
    () => riverPaths.map(rp => ({
      id: rp.id,
      d: riverPathToSvgPath(rp.hexes, hexSize, seed),
      hexCount: rp.hexes.length,
    })),
    [riverPaths, hexSize, seed],
  );

  return (
    <g className="river-overlay">
      {paths.map(({ id, d, hexCount }) => {
        if (!d) return null;
        // Fork rivers and lake outflows are thinner distributaries
        const isFork = id.includes('fork');
        const isOutflow = id.includes('outflow');
        const widthScale = isFork ? 0.6 : isOutflow ? 0.8 : 1.0;
        // Width increases from source to mouth
        const strokeWidth = (RIVER_WIDTH_SOURCE +
          (RIVER_WIDTH_MOUTH - RIVER_WIDTH_SOURCE) * Math.min(1, hexCount / 10)) * widthScale;
        return (
          <path
            key={id}
            d={d}
            fill="none"
            stroke={RIVER_COLOR}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}
    </g>
  );
});
