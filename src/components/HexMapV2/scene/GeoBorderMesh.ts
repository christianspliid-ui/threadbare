/**
 * GeoBorderMesh.ts — Geographic region border polylines for the Three.js hex renderer.
 *
 * Renders dim, dotted borders between geographic regions detected by
 * detectRegionsBorderCost(). These borders convey the historical/ephemeral nature
 * of geographic naming — distinct from the bold red political borders.
 *
 * Uses THREE.LineSegments with LineDashedMaterial for a dotted appearance.
 *
 * Border strategy:
 *   - Walk every hex pair (dedup edges via canonical key).
 *   - If two adjacent land hexes belong to different geographic regions → geo border edge.
 *   - Skip edges that are already political borders (kingdom or barony) to avoid clutter.
 *
 * NFP #1 Tunability: All sizes, colors, and dash params in named constants.
 * NFP #3 Determinism: Pure geometry from input data — no randomness.
 * NFP #4 Fail-soft: Hexes with no region assignment are skipped silently.
 * NFP #7 Performance: Single merged LineSegments geometry, minimal draw calls.
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

// ─── Geographic border rendering constants (NFP #1: Tunability) ──────────────

/** Geographic border opacity — fully opaque */
const GEO_BORDER_OPACITY = 1.0;

/** Line width (note: WebGL only supports lineWidth=1 on most GPUs, but we set it for intent) */
const GEO_LINE_WIDTH = 1;

/** Dash size in world units — length of each visible dash segment */
const GEO_DASH_SIZE = 1.2;

/** Gap size in world units — length of each invisible gap between dashes */
const GEO_GAP_SIZE = 1.0;

// ─── Edge vertex mapping (same as BorderMesh.ts) ─────────────────────────────

/**
 * hexNeighbors() direction → shared hex edge vertex pair.
 * Formula: EDGE_VERTICES[d] = [(d+5)%6, d]
 */
const EDGE_VERTICES: readonly [number, number][] = [
  [5, 0], // Dir 0 (SE)
  [0, 1], // Dir 1 (NE)
  [1, 2], // Dir 2 (N)
  [2, 3], // Dir 3 (NW)
  [3, 4], // Dir 4 (SW)
  [4, 5], // Dir 5 (S)
];

// ─── Internal helpers ─────────────────────────────────────────────────────────

type Point2D = { x: number; y: number };

function hexVertexWorld(hex: Point2D, vertexIndex: number, size: number): Point2D {
  const angle = (Math.PI / 180) * (60 * vertexIndex);
  return {
    x: hex.x + size * Math.cos(angle),
    y: hex.y + size * Math.sin(angle),
  };
}

function getEdgePoints(hexCenter: Point2D, dir: number, size: number): { start: Point2D; end: Point2D } {
  const [v0, v1] = EDGE_VERTICES[dir];
  return {
    start: hexVertexWorld(hexCenter, v0, size),
    end: hexVertexWorld(hexCenter, v1, size),
  };
}

// ─── Factory ─────────────────────────────────────────────────────────────────

/**
 * Create a geographic region border mesh from region data.
 *
 * Returns THREE.LineSegments with LineDashedMaterial for a dotted look.
 * Edges that are already political borders (different kingdom or barony)
 * are excluded to avoid visual clutter.
 *
 * @param regionData - Region data from worldgen (with hexRegionId, hexProvinceId maps)
 * @param tiles - All hex tiles in the world
 */
export function createGeoBorderMesh(
  regionData: RegionData,
  tiles: HexTile[],
): THREE.LineSegments {
  const { hexRegionId, hexProvinceId } = regionData;

  const positions: number[] = [];

  const tileSet = new Set<string>();
  for (const tile of tiles) {
    tileSet.add(hexKeyFromCoord(tile.coord));
  }

  const processedEdges = new Set<string>();
  const size = HEX_CONSTANTS.HEX_SIZE;
  const z = LAYER_Z.GEO_BORDERS;

  for (const tile of tiles) {
    const { col, row } = tile.coord;
    const hKey = hexKeyFn(col, row);

    const geoA = hexRegionId.get(hKey);
    if (geoA === undefined) continue;

    const provinceA = hexProvinceId.get(hKey);

    const hexCenter: Point2D = hexToWorld({ col, row }, size);
    const neighbors = hexNeighbors({ col, row });

    for (let dirIdx = 0; dirIdx < 6; dirIdx++) {
      const neighbor = neighbors[dirIdx];
      const neighborKey = hexKeyFn(neighbor.col, neighbor.row);

      // Canonical edge key for dedup
      const edgeKey = hKey < neighborKey
        ? `${hKey}|${neighborKey}`
        : `${neighborKey}|${hKey}`;
      if (processedEdges.has(edgeKey)) continue;

      const neighborExists = tileSet.has(neighborKey);
      const geoB = neighborExists ? hexRegionId.get(neighborKey) : undefined;

      // Only draw border between different geographic regions
      if (geoB === undefined || geoA === geoB) continue;

      // Skip edges that are already political borders (kingdom or barony differ)
      const provinceB = neighborExists ? hexProvinceId.get(neighborKey) : undefined;
      if (provinceA !== undefined && provinceB !== undefined && provinceA !== provinceB) continue;

      processedEdges.add(edgeKey);

      const { start, end } = getEdgePoints(hexCenter, dirIdx, size);
      // LineSegments expects pairs of vertices: [start, end, start, end, ...]
      positions.push(start.x, start.y, z, end.x, end.y, z);
    }
  }

  const geo = new THREE.BufferGeometry();
  if (positions.length > 0) {
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  }

  // computeLineDistances() is required for LineDashedMaterial to work —
  // it calculates cumulative distances along each line segment pair.
  const lineSegments = new THREE.LineSegments(geo);
  lineSegments.computeLineDistances();

  const mat = new THREE.LineDashedMaterial({
    color: getActivePalette().geoBorderColor,
    transparent: true,
    opacity: GEO_BORDER_OPACITY,
    linewidth: GEO_LINE_WIDTH,
    dashSize: GEO_DASH_SIZE,
    gapSize: GEO_GAP_SIZE,
  });

  lineSegments.material = mat;
  lineSegments.renderOrder = RENDER_ORDER.GEO_BORDERS;

  return lineSegments;
}
