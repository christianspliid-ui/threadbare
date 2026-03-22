/**
 * BorderMesh.ts — Political border polylines for the Three.js hex renderer.
 *
 * Renders kingdom and barony borders as red quad-strip meshes along hex edges.
 * Only political boundaries are rendered — geographic region differences produce
 * no geometry (REGN-06 compliance).
 *
 * Border strategy:
 *   - Walk every hex pair (check 3 of 6 directions to avoid double-counting).
 *   - If two adjacent hexes belong to different kingdoms → kingdom border edge.
 *   - Else if different baronies → barony border edge.
 *   - Build quad-strip geometry per edge using two triangles (same pattern as RiverMesh).
 *
 * NFP #1 Tunability: All sizes and colors in named constants.
 * NFP #2 Inspectability: Separate kingdom and barony meshes for easy toggle/debug.
 * NFP #3 Determinism: Pure geometry from input data — no randomness.
 * NFP #4 Fail-soft: Hexes with no barony/kingdom assignment are skipped silently.
 * NFP #7 Performance: Two merged BufferGeometry objects (one per tier), minimal draw calls.
 */

import * as THREE from 'three';
import type { HexTile } from '../../../types';
import type { RegionData } from '../../../engine/regionTypes';
import { hexToPixel, hexNeighbors } from '../../../lib/hexMath';
import { RENDER_ORDER } from './RenderLayers';
import { HEX_CONSTANTS } from './HexFillMesh';

// ─── Border rendering constants (NFP #1: Tunability) ─────────────────────────

/** Half-width of kingdom borders in world units (visual width = 2 * KINGDOM_HALF_WIDTH) */
const KINGDOM_HALF_WIDTH = 1.5;

/** Half-width of barony borders in world units (visual width = 2 * BARONY_HALF_WIDTH) */
const BARONY_HALF_WIDTH = 0.75;

/** Z position for border vertices — above rivers (0.03), below signifiers */
const BORDER_Z = 0.035;

/** Border color: red, matches capital marker color */
const BORDER_COLOR = 0xC83030;

/**
 * Directions to check per hex (indices 0, 1, 2 of 6 neighbors).
 * Only checking 3 of 6 avoids processing each edge twice.
 * For flat-top odd-q grid, neighbor indices correspond to directions:
 * 0 = right (E), 1 = lower-right (SE), 2 = upper-left from odd col...
 * We use indices 0, 1, 2 (first 3 neighbors from hexNeighbors() output).
 */
const CHECKED_NEIGHBOR_INDICES = [0, 1, 2] as const;

// ─── Internal helpers ─────────────────────────────────────────────────────────

type Point2D = { x: number; y: number };

/**
 * Build a thick edge segment (quad strip) between two 2D points.
 * Appends 6 floats (2 triangles, 3 vertices each) to positions array.
 *
 * Vertex layout:
 *   p0 ± normal*halfWidth, p1 ± normal*halfWidth
 * Two triangles:
 *   (p0+n, p0-n, p1+n) and (p0-n, p1-n, p1+n)
 *
 * @param x0 - Start X
 * @param y0 - Start Y
 * @param x1 - End X
 * @param y1 - End Y
 * @param halfWidth - Half the visual width of the edge
 * @param z - Z offset for the edge
 * @param positions - Output array (flat xyz per vertex)
 */
function buildThickEdge(
  x0: number, y0: number,
  x1: number, y1: number,
  halfWidth: number,
  z: number,
  positions: number[],
): void {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;

  // Perpendicular normal
  const nx = -dy / len * halfWidth;
  const ny =  dx / len * halfWidth;

  // 4 corner vertices
  const ax = x0 + nx; const ay = y0 + ny; // p0 left
  const bx = x0 - nx; const by = y0 - ny; // p0 right
  const cx = x1 + nx; const cy = y1 + ny; // p1 left
  const dx2 = x1 - nx; const dy2 = y1 - ny; // p1 right

  // Triangle 1: a, b, c
  positions.push(ax, ay, z, bx, by, z, cx, cy, z);
  // Triangle 2: b, dx2, c
  positions.push(bx, by, z, dx2, dy2, z, cx, cy, z);
}

/**
 * Get the world-space position (with Y-flip) for a hex vertex.
 * Flat-top hex: vertex i at angle 60*i degrees from center.
 * Y-flip: threeY = -svgY (SVG y-down → Three.js y-up).
 */
function hexVertexWorld(hex: Point2D, vertexIndex: number, size: number): Point2D {
  const angle = (Math.PI / 180) * (60 * vertexIndex);
  return {
    x: hex.x + size * Math.cos(angle),
    y: hex.y + size * Math.sin(angle),
  };
}

/**
 * Get the shared edge between two adjacent hexes as start/end world points.
 * The edge between hex A and its neighbor at neighbor index `dir` is
 * vertex `dir` and vertex `(dir+1)%6` of hex A (flat-top convention).
 *
 * @param hexCenter - World position (Y-flipped) of the hex
 * @param dir - Direction index (0-5) indicating which neighbor
 * @param size - HEX_SIZE
 */
function getEdgePoints(hexCenter: Point2D, dir: number, size: number): { start: Point2D; end: Point2D } {
  return {
    start: hexVertexWorld(hexCenter, dir, size),
    end: hexVertexWorld(hexCenter, (dir + 1) % 6, size),
  };
}

/**
 * Build a THREE.BufferGeometry from a flat positions array (xyz triplets, no index needed).
 * Returns geometry with 0 vertices if positions array is empty.
 */
function buildGeometry(positions: number[]): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  if (positions.length > 0) {
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  }
  return geo;
}

// ─── Factory ─────────────────────────────────────────────────────────────────

/**
 * Create kingdom and barony border meshes from region data.
 *
 * Returns two separate THREE.Mesh objects:
 *   - kingdomMesh: thick borders along kingdom boundaries
 *   - baronyMesh:  thin borders along barony boundaries (within same kingdom)
 *
 * REGN-06: Only political boundaries produce geometry. Geographic region
 * differences without barony/kingdom differences produce nothing.
 *
 * @param regionData - Region data from worldgen (with hexBaronyId + hexKingdomId maps)
 * @param tiles - All hex tiles in the world
 * @param cols - Grid width
 */
export function createBorderMesh(
  regionData: RegionData,
  tiles: HexTile[],
  cols: number,
): { kingdomMesh: THREE.Mesh; baronyMesh: THREE.Mesh } {
  const { hexBaronyId, hexKingdomId } = regionData;

  const kingdomPositions: number[] = [];
  const baronyPositions: number[] = [];

  // Build fast tile set for O(1) lookup (only need existence check)
  const tileSet = new Set<string>();
  for (const tile of tiles) {
    tileSet.add(`${tile.coord.col},${tile.coord.row}`);
  }

  const size = HEX_CONSTANTS.HEX_SIZE;

  for (const tile of tiles) {
    const { col, row } = tile.coord;
    const hexKey = `${col},${row}`;

    const baronyA = hexBaronyId.get(hexKey);
    const kingdomA = hexKingdomId.get(hexKey);

    // Skip hexes with no political assignment (NFP #4 Fail-soft)
    if (baronyA === undefined) continue;

    const svgCenter = hexToPixel({ col, row }, size);
    // Y-flip: SVG y-down → Three.js y-up
    const hexCenter: Point2D = { x: svgCenter.x, y: -svgCenter.y };

    const neighbors = hexNeighbors({ col, row });

    for (const dirIdx of CHECKED_NEIGHBOR_INDICES) {
      const neighbor = neighbors[dirIdx];
      const neighborKey = `${neighbor.col},${neighbor.row}`;

      if (!tileSet.has(neighborKey)) continue;

      const baronyB = hexBaronyId.get(neighborKey);
      const kingdomB = hexKingdomId.get(neighborKey);

      // Both must be assigned
      if (baronyB === undefined) continue;

      // Get the shared edge in world space
      const { start, end } = getEdgePoints(hexCenter, dirIdx, size);

      if (kingdomA !== undefined && kingdomB !== undefined && kingdomA !== kingdomB) {
        // Kingdom boundary — thick border
        buildThickEdge(start.x, start.y, end.x, end.y, KINGDOM_HALF_WIDTH, BORDER_Z, kingdomPositions);
      } else if (baronyA !== baronyB) {
        // Barony boundary within same kingdom (or either unassigned to kingdom) — thin border
        buildThickEdge(start.x, start.y, end.x, end.y, BARONY_HALF_WIDTH, BORDER_Z, baronyPositions);
      }
      // REGN-06: same barony and same kingdom = no border (geographic only → nothing)
    }
  }

  const mat = new THREE.MeshBasicMaterial({ color: BORDER_COLOR, side: THREE.DoubleSide });

  const kingdomGeo = buildGeometry(kingdomPositions);
  const kingdomMesh = new THREE.Mesh(kingdomGeo, mat.clone());
  kingdomMesh.renderOrder = RENDER_ORDER.BORDERS;

  const baronyGeo = buildGeometry(baronyPositions);
  const baronyMesh = new THREE.Mesh(baronyGeo, mat.clone());
  baronyMesh.renderOrder = RENDER_ORDER.BORDERS;

  return { kingdomMesh, baronyMesh };
}
