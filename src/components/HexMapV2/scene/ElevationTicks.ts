import * as THREE from 'three';
import type { HexTile } from '../../../types';
import { hexNeighbors } from '../../../lib/hexMath';
import { hexKeyFromCoord, hexKey as hexKeyFn } from '../../../lib/hexKey';
import { hexToWorld } from '../../../lib/worldPosition';
import { RENDER_ORDER, LAYER_Z } from './RenderLayers';
import { HEX_CONSTANTS } from './HexFillMesh';

/**
 * Elevation tick constants.
 * NFP #1: Every tunable number is named here — change game feel by adjusting these values.
 */
export const ELEVATION_TICK_CONSTANTS = {
  /** Minimum elevation difference (0–1) to show tick marks on a plateau edge. */
  TICK_THRESHOLD:    0.01,
  /** Tick length as fraction of hex edge length. */
  TICK_LENGTH_FRAC:  0.20,
  /** Width of each tick quad in world units (along the hex edge direction). */
  TICK_WIDTH:        0.12,
  /** Number of tick lines evenly spaced along each hex edge (excludes corners). */
  TICKS_PER_EDGE:    4,
  /** Dark brown — blends with mountain/highland terrain. */
  TICK_COLOR:        0x2a1a0a,
  /** Tick mark opacity (0–1). */
  TICK_OPACITY:      0.7,
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
 * Creates a Mesh of thin quads showing caterpillar-style tick marks on steep hex edges.
 * Tick density scales 3–8 per edge based on elevation difference (like topographic hatch marks).
 *
 * Uses quad geometry (two triangles per tick) instead of LineSegments because
 * WebGL ignores linewidth > 1 on most platforms, making line-based ticks invisible.
 *
 * NFP #1: All constants tunable via ELEVATION_TICK_CONSTANTS.
 * NFP #2: Pure function — deterministic output for same tile set.
 * NFP #3: No randomness — tick positions are purely geometric.
 * NFP #4: Fail-soft — empty tiles or all-flat terrain returns empty Mesh (no crash).
 * NFP #7: Hex-pair deduplication ensures each shared edge is processed exactly once.
 */
export function createElevationTicks(tiles: HexTile[]): THREE.Mesh {
  const {
    TICK_THRESHOLD,
    TICK_LENGTH_FRAC,
    TICK_WIDTH,
    TICKS_PER_EDGE,
    TICK_COLOR,
    TICK_OPACITY,
  } = ELEVATION_TICK_CONSTANTS;

  const size = HEX_CONSTANTS.HEX_SIZE;

  // Fail-soft: return empty Mesh for empty input
  if (tiles.length === 0) {
    return buildTickMesh([], [], TICK_COLOR, TICK_OPACITY);
  }

  // O(1) tile lookup: "col,row" → HexTile
  const tileMap = new Map<string, HexTile>();
  for (const tile of tiles) {
    tileMap.set(hexKeyFromCoord(tile.coord), tile);
  }

  const processedPairs = new Set<string>();
  const positions: number[] = [];
  const indices: number[] = [];
  let vertexIndex = 0;

  const halfW = TICK_WIDTH / 2;

  // Helper: emit one tick quad at a position, extending tickLen in the down direction
  function emitTick(
    baseX: number, baseY: number,
    downX: number, downY: number,
    alongX: number, alongY: number,
    tickLen: number,
  ) {
    const t0x = baseX - alongX * halfW;
    const t0y = baseY - alongY * halfW;
    const t1x = baseX + alongX * halfW;
    const t1y = baseY + alongY * halfW;
    const b0x = t0x + downX * tickLen;
    const b0y = t0y + downY * tickLen;
    const b1x = t1x + downX * tickLen;
    const b1y = t1y + downY * tickLen;

    positions.push(
      t0x, t0y, LAYER_Z.ELEVATION_TICKS,
      t1x, t1y, LAYER_Z.ELEVATION_TICKS,
      b0x, b0y, LAYER_Z.ELEVATION_TICKS,
      b1x, b1y, LAYER_Z.ELEVATION_TICKS,
    );
    indices.push(
      vertexIndex, vertexIndex + 1, vertexIndex + 2,
      vertexIndex + 1, vertexIndex + 3, vertexIndex + 2,
    );
    vertexIndex += 4;
  }

  for (const tile of tiles) {
    // Only plateau hexes get elevation ticks
    if (tile.terrain !== 'plateau') continue;

    const { x: cx, y: worldCY } = hexToWorld(tile.coord, size);

    const neighbors = hexNeighbors(tile.coord);

    for (const neighbor of neighbors) {
      const neighborTile = tileMap.get(hexKeyFn(neighbor.col, neighbor.row));
      if (!neighborTile) continue;

      // Skip if neighbor is also plateau
      if (neighborTile.terrain === 'plateau') continue;

      // Skip if neighbor is higher or equal elevation
      const tileElev = tile.geoParams.elevation;
      const neighborElev = neighborTile.geoParams.elevation;
      if (neighborElev >= tileElev) continue;

      const elevDiff = tileElev - neighborElev;
      if (elevDiff < TICK_THRESHOLD) continue;

      // Dedup edges
      const pairKey = hexPairKey(
        tile.coord.col, tile.coord.row,
        neighbor.col, neighbor.row,
      );
      if (processedPairs.has(pairKey)) continue;
      processedPairs.add(pairKey);

      // Get shared edge
      const { x: ncx, y: worldNCY } = hexToWorld(neighbor, size);

      const edge = sharedEdgeVertices(cx, worldCY, ncx, worldNCY, size);
      if (!edge) continue;

      const edgeDX = edge.x1 - edge.x0;
      const edgeDY = edge.y1 - edge.y0;
      const edgeLen = Math.sqrt(edgeDX * edgeDX + edgeDY * edgeDY);
      if (edgeLen < 1e-6) continue;

      // Tick length = fraction of hex edge length
      const tickLen = edgeLen * TICK_LENGTH_FRAC;

      // Unit along edge
      const alongX = edgeDX / edgeLen;
      const alongY = edgeDY / edgeLen;

      // Direction from edge toward the lower (neighbor) hex
      const edgeMidX = (edge.x0 + edge.x1) / 2;
      const edgeMidY = (edge.y0 + edge.y1) / 2;
      const toNX = ncx - edgeMidX;
      const toNY = worldNCY - edgeMidY;
      const toNLen = Math.sqrt(toNX * toNX + toNY * toNY);
      if (toNLen < 1e-6) continue;

      const downX = toNX / toNLen;
      const downY = toNY / toNLen;

      // 4 ticks evenly spaced along the edge (not at endpoints)
      for (let k = 0; k < TICKS_PER_EDGE; k++) {
        const t = (k + 1) / (TICKS_PER_EDGE + 1);
        const baseX = edge.x0 + edgeDX * t;
        const baseY = edge.y0 + edgeDY * t;
        emitTick(baseX, baseY, downX, downY, alongX, alongY, tickLen);
      }

    }
  }

  return buildTickMesh(positions, indices, TICK_COLOR, TICK_OPACITY);
}

// ─── Internal helpers ──────────────────────────────────────────────────────────

function buildTickMesh(
  positions: number[],
  indices: number[],
  color: number,
  opacity: number,
): THREE.Mesh {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  if (indices.length > 0) {
    geo.setIndex(indices);
  }

  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = RENDER_ORDER.ELEVATION_TICKS;
  return mesh;
}
