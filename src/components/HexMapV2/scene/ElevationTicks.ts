import * as THREE from 'three';
import type { HexTile } from '../../../types';
import { hexToPixel, hexNeighbors } from '../../../lib/hexMath';
import { RENDER_ORDER } from './RenderLayers';
import { HEX_CONSTANTS } from './HexFillMesh';

/**
 * Elevation tick constants.
 * NFP #1: Every tunable number is named here — change game feel by adjusting these values.
 */
export const ELEVATION_TICK_CONSTANTS = {
  /** Minimum elevation difference (0–1) to show caterpillar tick marks on an edge. */
  TICK_THRESHOLD:    0.08,
  /** Elevation difference per tick step — lower value = more ticks per given elevation diff. */
  TICK_DENSITY_STEP: 0.03,
  /** Half-length of each tick mark in world units (perpendicular to hex edge). */
  TICK_LENGTH:       0.8,
  /** Dark brown — blends with mountain/highland terrain. */
  TICK_COLOR:        0x2a1a0a,
  /** Tick mark opacity (0–1). */
  TICK_OPACITY:      0.6,
  /** Minimum ticks per qualifying edge (gentle slope). */
  TICK_MIN:          3,
  /** Maximum ticks per qualifying edge (cliff face). */
  TICK_MAX:          8,
} as const;

// ─── Hex-pair deduplication key ────────────────────────────────────────────────

/**
 * Canonical key for a hex pair — sorted so (A,B) and (B,A) produce the same key.
 * Used to ensure each shared edge between adjacent hexes emits ticks only once.
 */
function hexPairKey(
  colA: number, rowA: number,
  colB: number, rowB: number,
): string {
  const ka = `${colA},${rowA}`;
  const kb = `${colB},${rowB}`;
  return ka < kb ? `${ka}:${kb}` : `${kb}:${ka}`;
}

// ─── Shared edge geometry ──────────────────────────────────────────────────────

/**
 * Returns the two shared vertex positions (world space, Y-flipped) between two adjacent hexes.
 * Shared vertices are those that appear in BOTH hexes' vertex arrays (within tolerance).
 *
 * For a flat-top hex, vertices are at angles 0°, 60°, ..., 300° relative to center.
 */
function sharedEdgeVertices(
  tileCX: number, tileCY: number,
  neighborCX: number, neighborCY: number,
  size: number,
): { x0: number; y0: number; x1: number; y1: number } | null {
  const angles: number[] = [];
  for (let i = 0; i < 6; i++) {
    angles.push((Math.PI / 180) * (60 * i));
  }

  // Vertices of tile A (world space, Y-flipped)
  const avx: number[] = [];
  const avy: number[] = [];
  for (let i = 0; i < 6; i++) {
    avx.push(tileCX + size * Math.cos(angles[i]));
    avy.push(tileCY + size * Math.sin(angles[i]));
  }

  // Vertices of tile B (world space, Y-flipped)
  const bvx: number[] = [];
  const bvy: number[] = [];
  for (let i = 0; i < 6; i++) {
    bvx.push(neighborCX + size * Math.cos(angles[i]));
    bvy.push(neighborCY + size * Math.sin(angles[i]));
  }

  // Find vertices shared between A and B (within floating-point tolerance)
  const TOL = 0.01;
  const shared: Array<{ x: number; y: number }> = [];

  for (let ai = 0; ai < 6; ai++) {
    for (let bi = 0; bi < 6; bi++) {
      const dx = avx[ai] - bvx[bi];
      const dy = avy[ai] - bvy[bi];
      if (Math.abs(dx) < TOL && Math.abs(dy) < TOL) {
        shared.push({ x: avx[ai], y: avy[ai] });
      }
    }
  }

  if (shared.length < 2) return null;
  return { x0: shared[0].x, y0: shared[0].y, x1: shared[1].x, y1: shared[1].y };
}

// ─── Factory function ──────────────────────────────────────────────────────────

/**
 * Creates a LineSegments mesh showing caterpillar-style tick marks on steep hex edges.
 * Tick density scales 3–8 per edge based on elevation difference (like topographic hatch marks).
 *
 * NFP #1: All constants tunable via ELEVATION_TICK_CONSTANTS.
 * NFP #2: Pure function — deterministic output for same tile set.
 * NFP #3: No randomness — tick positions are purely geometric.
 * NFP #4: Fail-soft — empty tiles or all-flat terrain returns empty LineSegments (no crash).
 * NFP #7: Hex-pair deduplication ensures each shared edge is processed exactly once.
 */
export function createElevationTicks(tiles: HexTile[]): THREE.LineSegments {
  const {
    TICK_THRESHOLD,
    TICK_DENSITY_STEP,
    TICK_LENGTH,
    TICK_COLOR,
    TICK_OPACITY,
    TICK_MIN,
    TICK_MAX,
  } = ELEVATION_TICK_CONSTANTS;

  const size = HEX_CONSTANTS.HEX_SIZE;

  // Fail-soft: return empty LineSegments for empty input
  if (tiles.length === 0) {
    return buildLineSegments([], TICK_COLOR, TICK_OPACITY);
  }

  // O(1) tile lookup: "col,row" → HexTile
  const tileMap = new Map<string, HexTile>();
  for (const tile of tiles) {
    tileMap.set(`${tile.coord.col},${tile.coord.row}`, tile);
  }

  // Track processed hex pairs to avoid double-processing shared edges
  const processedPairs = new Set<string>();
  const tickPoints: number[] = [];

  for (const tile of tiles) {
    const { x: cx, y: cy } = hexToPixel(tile.coord, size);
    const worldCY = -cy; // Y-flip: SVG y-down → Three.js y-up

    const neighbors = hexNeighbors(tile.coord);

    for (const neighbor of neighbors) {
      const neighborTile = tileMap.get(`${neighbor.col},${neighbor.row}`);
      if (!neighborTile) continue; // Map boundary — no ticks

      // Dedup: process each (tileA, tileB) pair exactly once
      const pairKey = hexPairKey(
        tile.coord.col, tile.coord.row,
        neighbor.col, neighbor.row,
      );
      if (processedPairs.has(pairKey)) continue;
      processedPairs.add(pairKey);

      // Compute elevation difference
      const elevDiff = Math.abs(
        tile.geoParams.elevation - neighborTile.geoParams.elevation,
      );

      // Skip edges with gentle or no slope
      if (elevDiff < TICK_THRESHOLD) continue;

      // Scale tick count with steepness, clamped to [TICK_MIN, TICK_MAX]
      const tickCount = Math.min(TICK_MAX, Math.max(TICK_MIN, Math.floor(elevDiff / TICK_DENSITY_STEP)));

      // Get the shared edge geometry between these two adjacent hexes
      const { x: ncx, y: ncy } = hexToPixel(neighbor, size);
      const worldNCY = -ncy; // Y-flip

      const edge = sharedEdgeVertices(cx, worldCY, ncx, worldNCY, size);
      if (!edge) continue;

      // Edge vector and perpendicular
      const edgeDX = edge.x1 - edge.x0;
      const edgeDY = edge.y1 - edge.y0;
      const edgeLen = Math.sqrt(edgeDX * edgeDX + edgeDY * edgeDY);
      if (edgeLen < 1e-6) continue;

      // Unit perpendicular to the edge (rotate edge vector 90°)
      const perpX = -edgeDY / edgeLen;
      const perpY =  edgeDX / edgeLen;

      // Emit tickCount evenly-spaced tick marks along the edge
      for (let k = 0; k < tickCount; k++) {
        // Lerp parameter: distribute evenly, not at endpoints
        const t = (k + 1) / (tickCount + 1);
        const midX = edge.x0 + edgeDX * t;
        const midY = edge.y0 + edgeDY * t;

        // Tick line: perpendicular segment of length 2 × TICK_LENGTH centered on edge
        tickPoints.push(
          midX - perpX * TICK_LENGTH, midY - perpY * TICK_LENGTH, 0,
          midX + perpX * TICK_LENGTH, midY + perpY * TICK_LENGTH, 0,
        );
      }
    }
  }

  return buildLineSegments(tickPoints, TICK_COLOR, TICK_OPACITY);
}

// ─── Internal helpers ──────────────────────────────────────────────────────────

function buildLineSegments(
  points: number[],
  color: number,
  opacity: number,
): THREE.LineSegments {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));

  const mat = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
  });

  const lines = new THREE.LineSegments(geo, mat);
  lines.renderOrder = RENDER_ORDER.ELEVATION_TICKS;
  return lines;
}
