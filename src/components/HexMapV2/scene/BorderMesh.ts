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
import { hexNeighbors } from '../../../lib/hexMath';
import { hexKeyFromCoord, hexKey as hexKeyFn } from '../../../lib/hexKey';
import { getActivePalette } from '../palette/activePalette';
import { hexToWorld } from '../../../lib/worldPosition';
import { RENDER_ORDER, LAYER_Z } from './RenderLayers';
import { HEX_CONSTANTS } from './HexFillMesh';

// ─── Border rendering constants (NFP #1: Tunability) ─────────────────────────

/** Half-width of domain borders in world units (visual width = 2 * DOMAIN_HALF_WIDTH) */
const DOMAIN_HALF_WIDTH = 0.75;

/** Half-width of province borders in world units (visual width = 2 * PROVINCE_HALF_WIDTH) */
const PROVINCE_HALF_WIDTH = 0.375;

/** How far to extend each edge endpoint along its direction to close corner gaps */
const EDGE_EXTENSION = 0.35;

/** Border opacity (0–1). Slightly transparent to blend with terrain. */
const BORDER_OPACITY = 0.7;

/** Z position for border vertices — from centralized LAYER_Z */
const BORDER_Z = LAYER_Z.BORDERS;

/** Border color — reads from active palette theme */
const BORDER_COLOR_DEFAULT = 0xC83030;

/**
 * Correct mapping from hexNeighbors() direction index to the shared hex edge.
 * Each entry [v0, v1] gives the two vertex indices of the flat-top hex edge
 * shared with the neighbor at that direction.
 *
 * hexNeighbors() returns directions in this spatial order (both odd and even cols):
 *   Dir 0: SE, Dir 1: NE, Dir 2: N, Dir 3: NW, Dir 4: SW, Dir 5: S
 *
 * hexVertexWorld computes vertices in Three.js coords (y-up), at angle 60*i degrees:
 *   v0=E(0°), v1=NE(60°), v2=NW(120°), v3=W(180°), v4=SW(240°), v5=SE(300°)
 *
 * Edge midpoints face these directions:
 *   v5-v0=SE, v0-v1=NE, v1-v2=N, v2-v3=NW, v3-v4=SW, v4-v5=S
 *
 * Formula: EDGE_VERTICES[d] = [(d+5)%6, d]
 * Verified empirically: shared vertices match between adjacent hexes for all 6 directions.
 */
const EDGE_VERTICES: readonly [number, number][] = [
  [5, 0], // Dir 0 (SE) → edge v5-v0
  [0, 1], // Dir 1 (NE) → edge v0-v1
  [1, 2], // Dir 2 (N)  → edge v1-v2
  [2, 3], // Dir 3 (NW) → edge v2-v3
  [3, 4], // Dir 4 (SW) → edge v3-v4
  [4, 5], // Dir 5 (S)  → edge v4-v5
];

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

  // Extend endpoints along edge direction to close corner gaps
  const ux = dx / len * EDGE_EXTENSION;
  const uy = dy / len * EDGE_EXTENSION;
  const ex0 = x0 - ux;
  const ey0 = y0 - uy;
  const ex1 = x1 + ux;
  const ey1 = y1 + uy;

  // Perpendicular normal
  const nx = -dy / len * halfWidth;
  const ny =  dx / len * halfWidth;

  // 4 corner vertices (using extended endpoints)
  const ax = ex0 + nx; const ay = ey0 + ny; // p0 left
  const bx = ex0 - nx; const by = ey0 - ny; // p0 right
  const cx = ex1 + nx; const cy = ey1 + ny; // p1 left
  const dx2 = ex1 - nx; const dy2 = ey1 - ny; // p1 right

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
 * Get the shared edge between a hex and its neighbor at direction `dir`.
 * Uses EDGE_VERTICES lookup to correctly map neighbor direction to hex vertices.
 *
 * @param hexCenter - World position (Y-flipped) of the hex
 * @param dir - Direction index (0-5) from hexNeighbors()
 * @param size - HEX_SIZE
 */
function getEdgePoints(hexCenter: Point2D, dir: number, size: number): { start: Point2D; end: Point2D } {
  const [v0, v1] = EDGE_VERTICES[dir];
  return {
    start: hexVertexWorld(hexCenter, v0, size),
    end: hexVertexWorld(hexCenter, v1, size),
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
 * Create domain and province border meshes from region data.
 *
 * Returns two separate THREE.Mesh objects:
 *   - domainMesh:   thick borders along domain boundaries
 *   - provinceMesh: thin borders along province boundaries (within same domain)
 *
 * REGN-06: Only political boundaries produce geometry. Geographic region
 * differences without province/domain differences produce nothing.
 *
 * @param regionData - Region data from worldgen (with hexProvinceId + hexDomainId maps)
 * @param tiles - All hex tiles in the world
 * @param cols - Grid width
 */
export function createBorderMesh(
  regionData: RegionData,
  tiles: HexTile[],
  cols: number,
): { domainMesh: THREE.Mesh; provinceMesh: THREE.Mesh } {
  const { hexProvinceId, hexDomainId } = regionData;

  const domainPositions: number[] = [];
  const provincePositions: number[] = [];

  // Build fast tile set for O(1) lookup (only need existence check)
  const tileSet = new Set<string>();
  for (const tile of tiles) {
    tileSet.add(hexKeyFromCoord(tile.coord));
  }

  // Edge dedup: canonical key per edge so we never draw the same border twice
  const processedEdges = new Set<string>();

  const size = HEX_CONSTANTS.HEX_SIZE;

  for (const tile of tiles) {
    const { col, row } = tile.coord;
    const hKey = hexKeyFn(col, row);

    const provinceA = hexProvinceId.get(hKey);
    const domainA = hexDomainId.get(hKey);

    // Skip hexes with no political assignment (NFP #4 Fail-soft)
    if (provinceA === undefined) continue;

    const hexCenter: Point2D = hexToWorld({ col, row }, size);

    const neighbors = hexNeighbors({ col, row });

    for (let dirIdx = 0; dirIdx < 6; dirIdx++) {
      const neighbor = neighbors[dirIdx];
      const neighborKey = hexKeyFn(neighbor.col, neighbor.row);

      const edgeKey = hKey < neighborKey
        ? `${hKey}|${neighborKey}`
        : `${neighborKey}|${hKey}`;
      if (processedEdges.has(edgeKey)) continue;

      const neighborExists = tileSet.has(neighborKey);
      const provinceB = neighborExists ? hexProvinceId.get(neighborKey) : undefined;
      const domainB = neighborExists ? hexDomainId.get(neighborKey) : undefined;

      let borderType: 'domain' | 'province' | null = null;

      if (!neighborExists || provinceB === undefined) {
        // Outer boundary — use domain border if hex belongs to a domain, else province border.
        borderType = domainA !== undefined ? 'domain' : 'province';
      } else if (domainA !== undefined && domainB !== undefined && domainA !== domainB) {
        // Domain boundary — thick border
        borderType = 'domain';
      } else if (provinceA !== provinceB) {
        // Province boundary within same domain — thin border
        borderType = 'province';
      }
      // Same province and same domain = no border

      if (borderType === null) continue;

      processedEdges.add(edgeKey);

      const { start, end } = getEdgePoints(hexCenter, dirIdx, size);

      if (borderType === 'domain') {
        buildThickEdge(start.x, start.y, end.x, end.y, DOMAIN_HALF_WIDTH, BORDER_Z, domainPositions);
      } else {
        buildThickEdge(start.x, start.y, end.x, end.y, PROVINCE_HALF_WIDTH, BORDER_Z, provincePositions);
      }
    }
  }

  const mat = new THREE.MeshBasicMaterial({
    color: getActivePalette().borderColor,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: BORDER_OPACITY,
  });

  const domainGeo = buildGeometry(domainPositions);
  const domainMesh = new THREE.Mesh(domainGeo, mat.clone());
  domainMesh.renderOrder = RENDER_ORDER.BORDERS;

  const provinceGeo = buildGeometry(provincePositions);
  const provinceMesh = new THREE.Mesh(provinceGeo, mat.clone());
  provinceMesh.renderOrder = RENDER_ORDER.BORDERS;

  return { domainMesh, provinceMesh };
}
