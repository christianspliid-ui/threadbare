/**
 * Shared Movement Path Utilities
 *
 * Single source of truth for computing wobbled bezier curves between hex positions.
 * Used by both AgentDots (forward animation) and MovementTrails (backward trail rendering).
 *
 * Design: The wobble seed is based on (agentId, fromHex, toHex), so the curve between
 * any two hexes is always identical regardless of when or why it's computed. This guarantees
 * the trail exactly matches the path the dot traveled.
 */

import { hexToPixel } from './hexMath';
import type { HexCoord } from '../types';

// ─── Types ───────────────────────────────────────────────────────

export interface Point {
  x: number;
  y: number;
}

export interface SegmentBezier {
  /** Start point */
  p0: Point;
  /** Quadratic bezier control point */
  ctrl: Point;
  /** End point */
  p2: Point;
}

// ─── Constants ───────────────────────────────────────────────────

/** Wobble magnitude as fraction of hex size for bezier control point offset */
const WOBBLE_FACTOR = 0.5;

/** Number of samples for arc-length lookup table */
const ARC_LENGTH_SAMPLES = 20;

// ─── Deterministic hash ──────────────────────────────────────────

/**
 * Deterministic hash producing consistent values for the same inputs.
 * Used for wobble direction so curves are stable across renders.
 */
function hashInts(...values: number[]): number {
  let h = 0x9e3779b9;
  for (const v of values) {
    h = ((h << 5) - h + (v | 0)) | 0;
    h = (h ^ (h >>> 16)) | 0;
  }
  return h;
}

/**
 * Hash an agent ID + hex pair into a deterministic number.
 * Same (agentId, fromHex, toHex) always produces the same value.
 */
function segmentHash(agentId: string, from: HexCoord, to: HexCoord): number {
  let h = 0;
  for (let i = 0; i < agentId.length; i++) {
    h = ((h << 5) - h + agentId.charCodeAt(i)) | 0;
  }
  return hashInts(h, from.col, from.row, to.col, to.row);
}

// ─── Bezier math ─────────────────────────────────────────────────

/** Evaluate quadratic bezier B(t) = (1-t)²·P0 + 2(1-t)t·P1 + t²·P2 */
export function evalQuadBezier(p0: Point, ctrl: Point, p2: Point, t: number): Point {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * ctrl.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * ctrl.y + t * t * p2.y,
  };
}

/**
 * Reparametrize by arc length: uniform `s` in [0,1] → constant speed along curve.
 * Returns the bezier `t` parameter that corresponds to fraction `s` of total arc length.
 */
export function arcLengthT(p0: Point, ctrl: Point, p2: Point, s: number): number {
  if (s <= 0) return 0;
  if (s >= 1) return 1;

  // Build cumulative arc-length table
  const lengths = new Array(ARC_LENGTH_SAMPLES + 1);
  lengths[0] = 0;
  let prev = p0;
  for (let i = 1; i <= ARC_LENGTH_SAMPLES; i++) {
    const t = i / ARC_LENGTH_SAMPLES;
    const pt = evalQuadBezier(p0, ctrl, p2, t);
    const dx = pt.x - prev.x;
    const dy = pt.y - prev.y;
    lengths[i] = lengths[i - 1] + Math.sqrt(dx * dx + dy * dy);
    prev = pt;
  }

  const totalLen = lengths[ARC_LENGTH_SAMPLES];
  if (totalLen === 0) return s;

  const targetLen = s * totalLen;
  let lo = 0;
  let hi = ARC_LENGTH_SAMPLES;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (lengths[mid] < targetLen) lo = mid;
    else hi = mid;
  }

  const segLen = lengths[hi] - lengths[lo];
  const frac = segLen > 0 ? (targetLen - lengths[lo]) / segLen : 0;
  return (lo + frac) / ARC_LENGTH_SAMPLES;
}

/**
 * Evaluate a bezier at arc-length fraction `s` (constant speed).
 */
export function evalBezierAtArcLength(p0: Point, ctrl: Point, p2: Point, s: number): Point {
  return evalQuadBezier(p0, ctrl, p2, arcLengthT(p0, ctrl, p2, s));
}

// ─── Shared path computation ─────────────────────────────────────

/**
 * Compute the wobbled quadratic bezier between two hex positions for a given agent.
 *
 * The curve is deterministic: same (agentId, fromHex, toHex) always produces the
 * same bezier. Both AgentDots and MovementTrails call this to ensure the dot's
 * animation path exactly matches the trail drawn behind it.
 *
 * @param agentId — agent node ID (used for deterministic wobble seed)
 * @param fromHex — source hex coordinate
 * @param toHex — destination hex coordinate
 * @param hexSize — hex tile size in pixels
 * @param fromOffset — optional pixel offset from hex center (e.g., ring slot position)
 * @param toOffset — optional pixel offset from hex center at destination
 */
export function getSegmentBezier(
  agentId: string,
  fromHex: HexCoord,
  toHex: HexCoord,
  hexSize: number,
  fromOffset?: Point,
  toOffset?: Point,
): SegmentBezier {
  const fromCenter = hexToPixel(fromHex, hexSize);
  const toCenter = hexToPixel(toHex, hexSize);

  const p0: Point = {
    x: fromCenter.x + (fromOffset?.x ?? 0),
    y: fromCenter.y + (fromOffset?.y ?? 0),
  };
  const p2: Point = {
    x: toCenter.x + (toOffset?.x ?? 0),
    y: toCenter.y + (toOffset?.y ?? 0),
  };

  // Compute perpendicular wobble for control point
  const dx = p2.x - p0.x;
  const dy = p2.y - p0.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const perpX = -dy / len;
  const perpY = dx / len;

  const hash = segmentHash(agentId, fromHex, toHex);
  // Map hash to [-1, 1] range
  const wobbleNorm = ((hash & 0xffff) / 0xffff) * 2 - 1;
  const wobbleMag = hexSize * WOBBLE_FACTOR * wobbleNorm;

  const ctrl: Point = {
    x: (p0.x + p2.x) / 2 + perpX * wobbleMag,
    y: (p0.y + p2.y) / 2 + perpY * wobbleMag,
  };

  return { p0, ctrl, p2 };
}

// ─── Ring slot computation ───────────────────────────────────────

/**
 * Compute the ring slot offset for an agent at a hex.
 *
 * Agents are assigned ring positions by sorting their IDs among all agents
 * present at the hex, then evenly distributing around the ring. This guarantees
 * no overlaps at rest and is deterministic for a given set of agents.
 *
 * @param agentIndex — the agent's sorted index among agents at this hex (0-based)
 * @param totalAgents — total number of agents at this hex
 * @param ringRadius — radius of the ring around hex center
 * @returns pixel offset from hex center
 */
export function getRingSlotOffset(
  agentIndex: number,
  totalAgents: number,
  ringRadius: number,
  rotationOffset = 0,
): Point {
  const angle = (2 * Math.PI * agentIndex) / Math.max(totalAgents, 1) - Math.PI / 2 + rotationOffset;
  return {
    x: Math.cos(angle) * ringRadius,
    y: Math.sin(angle) * ringRadius,
  };
}
