import * as THREE from 'three';
import type { HexTile } from '../../../types';
import { hexToPixel } from '../../../lib/hexMath';
import { RENDER_ORDER, LAYER_Z } from './RenderLayers';
import { HEX_CONSTANTS } from './HexFillMesh';

// ─── Grid line constants (NFP #1: Tunability) ───────────────────────────────

/** Half-width of hex grid lines in world units (visual width = 2 * GRID_LINE_HALF_WIDTH) */
const GRID_LINE_HALF_WIDTH = 0.30;

/** Grid line color — cool mid-grey */
const GRID_LINE_COLOR = 0x5D5E66;

/** Z position for grid line vertices — from centralized LAYER_Z */
const GRID_LINE_Z = LAYER_Z.GRID;

/**
 * Creates a Mesh showing all hex edge lines as quad-strip geometry.
 * Uses the same quad-strip technique as BorderMesh for reliable line width
 * (WebGL LineBasicMaterial.linewidth is clamped to 1px on most platforms).
 *
 * Shared edges between adjacent hexes are deduplicated — each edge drawn once.
 *
 * NFP #1: Width controlled by GRID_LINE_HALF_WIDTH, opacity by HEX_CONSTANTS.GRID_LINE_OPACITY.
 * NFP #7: Edge deduplication halves triangle count for interior hexes.
 */
export function createHexGridLines(tiles: HexTile[]): THREE.Mesh {
  const size = HEX_CONSTANTS.HEX_SIZE;

  // Precompute vertex angles for flat-top hex (6 vertices at 60° increments)
  const angles: number[] = [];
  for (let i = 0; i < 6; i++) {
    angles.push((Math.PI / 180) * (60 * i));
  }

  // Use a Set to deduplicate edges.
  // Key: sorted pair of rounded vertex coordinates joined by '|'
  const edgeSet = new Set<string>();

  // Collect deduplicated edge endpoints: [x0, y0, x1, y1][]
  const edges: number[][] = [];

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
        edges.push([vx[i], vy[i], vx[j], vy[j]]);
      }
    }
  }

  // Build quad-strip geometry: 2 triangles (4 vertices, 6 indices) per edge
  const vertCount = edges.length * 4;
  const positions = new Float32Array(vertCount * 3);
  const indices: number[] = [];

  for (let e = 0; e < edges.length; e++) {
    const [x0, y0, x1, y1] = edges[e];

    // Direction along the edge
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len = Math.sqrt(dx * dx + dy * dy);

    // Perpendicular normal (for width offset)
    const nx = (-dy / len) * GRID_LINE_HALF_WIDTH;
    const ny = (dx / len) * GRID_LINE_HALF_WIDTH;

    const base = e * 4;

    // 4 vertices forming the quad
    // v0: start - offset
    positions[base * 3 + 0] = x0 - nx;
    positions[base * 3 + 1] = y0 - ny;
    positions[base * 3 + 2] = GRID_LINE_Z;
    // v1: start + offset
    positions[base * 3 + 3] = x0 + nx;
    positions[base * 3 + 4] = y0 + ny;
    positions[base * 3 + 5] = GRID_LINE_Z;
    // v2: end + offset
    positions[base * 3 + 6] = x1 + nx;
    positions[base * 3 + 7] = y1 + ny;
    positions[base * 3 + 8] = GRID_LINE_Z;
    // v3: end - offset
    positions[base * 3 + 9] = x1 - nx;
    positions[base * 3 + 10] = y1 - ny;
    positions[base * 3 + 11] = GRID_LINE_Z;

    // Two triangles: (v0, v1, v2), (v0, v2, v3)
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setIndex(indices);

  const mat = new THREE.MeshBasicMaterial({
    color:       GRID_LINE_COLOR,
    transparent: true,
    opacity:     HEX_CONSTANTS.GRID_LINE_OPACITY,
    side:        THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = RENDER_ORDER.GRID;
  return mesh;
}
