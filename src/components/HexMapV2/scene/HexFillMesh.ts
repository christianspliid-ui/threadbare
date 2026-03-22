import * as THREE from 'three';
import type { HexTile } from '../../../types';
import { hexToPixel } from '../../../lib/hexMath';
import { getHexColor } from '../palette/colorUtils';
import { RENDER_ORDER } from './RenderLayers';
import { isWaterTerrain } from '../../../engine/coastline';

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
 * Result of createHexFillMesh — two InstancedMeshes for land and water.
 * Both render as full hexagonal shapes.
 * Organic coastline clipping is handled by CoastlineMesh ocean mask overlay
 * (water-colored rectangle with coastline contour holes, rendered on top).
 */
export interface HexFillMeshResult {
  landMesh: THREE.InstancedMesh;
  waterMesh: THREE.InstancedMesh;
  /** Global tile index (into tiles[]) for each land mesh instance */
  landTileIndices: number[];
  /** Global tile index (into tiles[]) for each water mesh instance */
  waterTileIndices: number[];
}

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
 * Creates two InstancedMeshes for hex tiles — one for land (stencil-tested) and one for water (normal).
 *
 * Land mesh uses GPU stencil testing: only renders where the stencil buffer = 1.
 * The coastline contour (CoastlineMesh at renderOrder -1) writes 1 into the stencil buffer
 * for all land pixels, so the land hex color is only visible inside the organic coastline shape.
 *
 * Water mesh renders normally as full hexagons with no stencil constraints.
 *
 * NFP #1: lakeIds parameter is optional — fail-soft when not provided.
 * NFP #3: Deterministic — colors derived from seeded noise + elevation, same seed = same appearance.
 * NFP #7: Performance — two InstancedMesh draw calls for the entire grid (split from one).
 *
 * When lakeIds is provided, lake hexes (lakeId >= 0) render with lake water color, in water mesh.
 * Ocean hexes render with depth-band colors based on elevation, in water mesh.
 */
export function createHexFillMesh(
  tiles: HexTile[],
  seed: number,
  lakeIds?: Int16Array,
): HexFillMeshResult {
  const geo = buildHexGeometry(HEX_CONSTANTS.HEX_SIZE);

  // First pass: classify each tile as land or water
  const landTileIndices: number[] = [];
  const waterTileIndices: number[] = [];

  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i];
    const lakeId = lakeIds ? lakeIds[i] : -1;
    const isWater = isWaterTerrain(tile.terrain) || (lakeIds !== undefined && lakeId >= 0);
    if (isWater) {
      waterTileIndices.push(i);
    } else {
      landTileIndices.push(i);
    }
  }

  // Land mesh — renders full hex shapes; organic coastline clipping is handled by
  // CoastlineMesh ocean mask overlay (water-colored fill with coastline contour holes).
  const landMat = new THREE.MeshBasicMaterial({ vertexColors: false });

  const landMesh = new THREE.InstancedMesh(geo, landMat, landTileIndices.length);
  landMesh.renderOrder = RENDER_ORDER.HEX_FILL;
  landMesh.frustumCulled = true;

  // Water mesh — no stencil constraints; renders as full hexagonal shapes
  const waterMat = new THREE.MeshBasicMaterial({ vertexColors: false });
  const waterMesh = new THREE.InstancedMesh(geo, waterMat, waterTileIndices.length);
  waterMesh.renderOrder = RENDER_ORDER.HEX_FILL;
  waterMesh.frustumCulled = true;

  const matrix = new THREE.Matrix4();
  const color  = new THREE.Color();

  // Populate land mesh instances
  for (let i = 0; i < landTileIndices.length; i++) {
    const globalIdx = landTileIndices[i];
    const tile = tiles[globalIdx];
    const { x, y } = hexToPixel(tile.coord, HEX_CONSTANTS.HEX_SIZE);
    matrix.setPosition(x, -y, 0);
    landMesh.setMatrixAt(i, matrix);

    const lakeId = lakeIds ? lakeIds[globalIdx] : undefined;
    const [r, g, b] = getHexColor(tile.terrain, seed, tile.coord.col, tile.coord.row, {
      elevation: tile.geoParams.elevation,
      lakeId,
    });
    color.setRGB(r, g, b);
    landMesh.setColorAt(i, color);
  }

  // Populate water mesh instances
  for (let i = 0; i < waterTileIndices.length; i++) {
    const globalIdx = waterTileIndices[i];
    const tile = tiles[globalIdx];
    const { x, y } = hexToPixel(tile.coord, HEX_CONSTANTS.HEX_SIZE);
    matrix.setPosition(x, -y, 0);
    waterMesh.setMatrixAt(i, matrix);

    const lakeId = lakeIds ? lakeIds[globalIdx] : undefined;
    const [r, g, b] = getHexColor(tile.terrain, seed, tile.coord.col, tile.coord.row, {
      elevation: tile.geoParams.elevation,
      lakeId,
    });
    color.setRGB(r, g, b);
    waterMesh.setColorAt(i, color);
  }

  landMesh.instanceMatrix.needsUpdate = true;
  if (landMesh.instanceColor) landMesh.instanceColor.needsUpdate = true;

  waterMesh.instanceMatrix.needsUpdate = true;
  if (waterMesh.instanceColor) waterMesh.instanceColor.needsUpdate = true;

  return { landMesh, waterMesh, landTileIndices, waterTileIndices };
}

/**
 * Re-applies per-hex colors to both InstancedMeshes in a HexFillMeshResult.
 * Used for dynamic terrain updates without rebuilding geometry.
 */
export function updateHexColors(
  result: HexFillMeshResult,
  tiles: HexTile[],
  seed: number,
  lakeIds?: Int16Array,
): void {
  const color = new THREE.Color();

  // Update land mesh colors
  for (let i = 0; i < result.landTileIndices.length; i++) {
    const globalIdx = result.landTileIndices[i];
    const tile = tiles[globalIdx];
    const lakeId = lakeIds ? lakeIds[globalIdx] : undefined;
    const [r, g, b] = getHexColor(tile.terrain, seed, tile.coord.col, tile.coord.row, {
      elevation: tile.geoParams.elevation,
      lakeId,
    });
    color.setRGB(r, g, b);
    result.landMesh.setColorAt(i, color);
  }
  if (result.landMesh.instanceColor) result.landMesh.instanceColor.needsUpdate = true;

  // Update water mesh colors
  for (let i = 0; i < result.waterTileIndices.length; i++) {
    const globalIdx = result.waterTileIndices[i];
    const tile = tiles[globalIdx];
    const lakeId = lakeIds ? lakeIds[globalIdx] : undefined;
    const [r, g, b] = getHexColor(tile.terrain, seed, tile.coord.col, tile.coord.row, {
      elevation: tile.geoParams.elevation,
      lakeId,
    });
    color.setRGB(r, g, b);
    result.waterMesh.setColorAt(i, color);
  }
  if (result.waterMesh.instanceColor) result.waterMesh.instanceColor.needsUpdate = true;
}
