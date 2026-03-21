import * as THREE from 'three';
import type { HexTile } from '../../../types';
import { hexToPixel } from '../../../lib/hexMath';
import { getHexColor } from '../palette/colorUtils';
import { RENDER_ORDER } from './RenderLayers';

/**
 * Grid and hex sizing constants.
 * NFP #1: Every magic number is named — tune game feel by adjusting values here.
 */
export const HEX_CONSTANTS = {
  HEX_SIZE:             10,    // Flat-top hex radius in Three.js world units (1 unit = 1px at zoom 1)
  GRID_COLS:            200,   // Expected grid width
  GRID_ROWS:            300,   // Expected grid height
  GRID_LINE_OPACITY:    0.12,  // ~12% opacity black on hex edges (CONTEXT.md decision)
  BRIGHTNESS_NOISE_RANGE: 0.05, // ±5% luminosity variation per TERR-05
} as const;

/**
 * Builds a flat-top hexagonal BufferGeometry with the given radius.
 * Constructed as 6 triangles fanning from the center.
 * Angle formula: angle_i = 60° × i (flat-top: first vertex at 0° = rightmost).
 */
export function buildHexGeometry(size: number): THREE.BufferGeometry {
  const positions: number[] = [];

  for (let i = 0; i < 6; i++) {
    const a0 = (Math.PI / 180) * (60 * i);
    const a1 = (Math.PI / 180) * (60 * ((i + 1) % 6));

    // Triangle: center -> v[i] -> v[i+1]
    positions.push(0, 0, 0);
    positions.push(size * Math.cos(a0), size * Math.sin(a0), 0);
    positions.push(size * Math.cos(a1), size * Math.sin(a1), 0);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  return geo;
}

/**
 * Creates an InstancedMesh for all hex tiles with per-instance terrain colors.
 * Uses a single draw call for 60K hexes.
 *
 * NFP #1: lakeIds parameter is optional — fail-soft when not provided.
 * NFP #3: Deterministic — colors derived from seeded noise + elevation, same seed = same appearance.
 * NFP #7: Performance — single InstancedMesh draw call for the entire grid.
 *
 * When lakeIds is provided, lake hexes (lakeId >= 0) render with lake water color.
 * Ocean hexes render with depth-band colors based on elevation.
 */
export function createHexFillMesh(
  tiles: HexTile[],
  seed: number,
  lakeIds?: Int16Array,
): THREE.InstancedMesh {
  const geo = buildHexGeometry(HEX_CONSTANTS.HEX_SIZE);
  const mat = new THREE.MeshBasicMaterial({ vertexColors: false });
  const mesh = new THREE.InstancedMesh(geo, mat, tiles.length);

  const matrix = new THREE.Matrix4();
  const color  = new THREE.Color();

  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i];
    const { x, y } = hexToPixel(tile.coord, HEX_CONSTANTS.HEX_SIZE);

    // Y-flip: SVG is y-down, Three.js world is y-up
    matrix.setPosition(x, -y, 0);
    mesh.setMatrixAt(i, matrix);

    const lakeId = lakeIds ? lakeIds[i] : undefined;
    const [r, g, b] = getHexColor(tile.terrain, seed, tile.coord.col, tile.coord.row, {
      elevation: tile.geoParams.elevation,
      lakeId,
    });
    color.setRGB(r, g, b);
    mesh.setColorAt(i, color);
  }

  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) {
    mesh.instanceColor.needsUpdate = true;
  }

  mesh.renderOrder = RENDER_ORDER.HEX_FILL;
  return mesh;
}

/**
 * Re-applies per-hex colors to an existing InstancedMesh.
 * Used for dynamic terrain updates without rebuilding geometry.
 */
export function updateHexColors(
  mesh: THREE.InstancedMesh,
  tiles: HexTile[],
  seed: number,
  lakeIds?: Int16Array,
): void {
  const color = new THREE.Color();

  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i];
    const lakeId = lakeIds ? lakeIds[i] : undefined;
    const [r, g, b] = getHexColor(tile.terrain, seed, tile.coord.col, tile.coord.row, {
      elevation: tile.geoParams.elevation,
      lakeId,
    });
    color.setRGB(r, g, b);
    mesh.setColorAt(i, color);
  }

  if (mesh.instanceColor) {
    mesh.instanceColor.needsUpdate = true;
  }
}
