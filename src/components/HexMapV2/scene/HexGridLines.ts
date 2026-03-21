import * as THREE from 'three';
import type { HexTile } from '../../../types';
import { hexToPixel } from '../../../lib/hexMath';
import { RENDER_ORDER } from './RenderLayers';
import { HEX_CONSTANTS } from './HexFillMesh';

/**
 * Creates a LineSegments mesh showing all hex edge lines across the grid.
 * Shared edges between adjacent hexes are deduplicated — each edge drawn once.
 *
 * NFP #1: Opacity controlled by GRID_LINE_OPACITY constant in HEX_CONSTANTS.
 * NFP #7: Edge deduplication halves line count for interior hexes.
 */
export function createHexGridLines(tiles: HexTile[]): THREE.LineSegments {
  const size = HEX_CONSTANTS.HEX_SIZE;

  // Precompute vertex angles for flat-top hex (6 vertices at 60° increments)
  const angles: number[] = [];
  for (let i = 0; i < 6; i++) {
    angles.push((Math.PI / 180) * (60 * i));
  }

  // Use a Set to deduplicate edges.
  // Key: sorted pair of rounded vertex coordinates joined by '|'
  const edgeSet = new Set<string>();
  const edgePoints: number[] = [];

  const ROUND = 2; // decimal places for dedup key

  function edgeKey(
    x0: number, y0: number,
    x1: number, y1: number,
  ): string {
    const ax = x0.toFixed(ROUND);
    const ay = y0.toFixed(ROUND);
    const bx = x1.toFixed(ROUND);
    const by = y1.toFixed(ROUND);
    // Sort so edge A->B and B->A produce the same key
    return ax < bx || (ax === bx && ay < by)
      ? `${ax},${ay}|${bx},${by}`
      : `${bx},${by}|${ax},${ay}`;
  }

  for (const tile of tiles) {
    const { x: cx, y: cy } = hexToPixel(tile.coord, size);
    const worldCY = -cy; // Y-flip: SVG y-down → Three.js y-up

    // 6 vertices of this hex
    const vx: number[] = [];
    const vy: number[] = [];
    for (let i = 0; i < 6; i++) {
      vx.push(cx + size * Math.cos(angles[i]));
      vy.push(worldCY + size * Math.sin(angles[i]));
    }

    // 6 edges: vertex i -> vertex (i+1) % 6
    for (let i = 0; i < 6; i++) {
      const j = (i + 1) % 6;
      const key = edgeKey(vx[i], vy[i], vx[j], vy[j]);
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        edgePoints.push(vx[i], vy[i], 0, vx[j], vy[j], 0);
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(edgePoints, 3));

  const mat = new THREE.LineBasicMaterial({
    color:       0x000000,
    transparent: true,
    opacity:     HEX_CONSTANTS.GRID_LINE_OPACITY,
  });

  const lines = new THREE.LineSegments(geo, mat);
  lines.renderOrder = RENDER_ORDER.GRID;
  return lines;
}
