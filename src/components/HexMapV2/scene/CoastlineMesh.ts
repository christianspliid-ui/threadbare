/**
 * CoastlineMesh — Three.js scene module for organic coastline rendering.
 *
 * Renders three overlay layers on top of the hex fill mesh:
 *   Layer 1 (shallow band): shallowLoops filled with WATER_PALETTE.shallows
 *     — sits on top of deep ocean hex fill, creating the coastal shallow band
 *   Layer 2 (land boundary): loops filled with a terrain-neutral land color
 *     — sits on top of shallows, creating an organic land boundary
 *   Layer 3 (lake shores): lakeLoops filled with WATER_PALETTE.lake
 *     — renders lake shore fills
 *
 * Uses marching squares contour loops from computeCoastline().
 * Applies Y-flip to convert SVG coordinates (y-down) to Three.js (y-up).
 *
 * NFP #1: All tunable values are named constants.
 * NFP #4: Fail-soft — if computeCoastline returns empty loops, returns empty Group.
 */

import * as THREE from 'three';
import type { HexTile } from '../../../types';
import type { ContourLoop } from '../../../types/coastline';
import { computeCoastline } from '../../../engine/coastline';
import { COASTLINE_DEFAULTS } from '../../../types/coastline';
import { HEX_CONSTANTS } from './HexFillMesh';
import { RENDER_ORDER } from './RenderLayers';
import { WATER_PALETTE } from '../palette/waterPalette';
import { hexToThreeColor } from '../palette/colorUtils';

// ─── Constants (NFP #1) ───────────────────────────────────────────

/**
 * Z offset for the land boundary contour (above shallow band).
 * Rendering order: hex fill (z=0) → shallows band (z=0.01) → land boundary (z=0.02).
 */
export const COASTLINE_LAND_Z = 0.02;

/**
 * Z offset for the shallow band contour (above hex fill).
 */
export const COASTLINE_SHALLOW_Z = 0.01;

/**
 * Land boundary color — dark green-brown neutral, matching inland biome edge.
 * This is a terrain-neutral land fill that creates the organic land boundary.
 * The hex fill still shows through for inland hexes — this only matters at the coast.
 *
 * Value: dark green-brown (matches TERRAIN_PALETTE temperate_forest range).
 */
export const COASTLINE_LAND_COLOR = '#5a7a48';

/**
 * Shallow band color — matches WATER_PALETTE.shallows for coastal shallow water.
 * This creates the shallowing band between deep ocean and the land boundary.
 */
export const COASTLINE_SHALLOW_COLOR = WATER_PALETTE['shallows'];

// ─── Geometry Helpers ─────────────────────────────────────────────

/**
 * Computes signed area of a contour loop (Shoelace formula).
 * Positive = counter-clockwise in screen-space (y-down).
 * After Y-flip, positive SVG area becomes negative Three.js area (CW in 3D space).
 */
function signedArea(loop: ContourLoop): number {
  let area = 0;
  const n = loop.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += loop[i].x * loop[j].y;
    area -= loop[j].x * loop[i].y;
  }
  return area / 2;
}

/**
 * Creates a filled THREE.Mesh from a contour loop using THREE.Shape + ShapeGeometry.
 *
 * Y-flip: SVG uses y-down, Three.js uses y-up.
 * All points are negated in Y before being passed to THREE.Shape.
 *
 * Winding: THREE.Shape expects CCW outer loops.
 * In SVG space (y-down), CCW = positive signedArea.
 * After Y-flip, positive SVG area → positive Three.js area (still CCW in Three.js).
 * If the loop is CW in SVG space (negative area), it becomes CW after Y-flip → we reverse it.
 *
 * NFP #4: Fail-soft — loops with < 3 points are skipped.
 */
function loopToMesh(loop: ContourLoop, color: string, zOffset: number): THREE.Mesh | null {
  if (loop.length < 3) return null;

  // Apply Y-flip to all points
  const flippedPoints: THREE.Vector2[] = loop.map(p => new THREE.Vector2(p.x, -p.y));

  // Check winding in Three.js (y-up) space
  // After Y-flip, positive SVG signed area becomes positive Three.js signed area.
  // THREE.Shape expects CCW (positive) outer loops.
  // If negative after flip → CW in Three.js → reverse to make CCW.
  const svgArea = signedArea(loop);
  // After Y-flip: y negation flips the winding direction, so:
  // positive SVG area (CCW in y-down) → negative Three.js area (CW in y-up) → reverse
  // negative SVG area (CW in y-down)  → positive Three.js area (CCW in y-up) → keep
  if (svgArea > 0) {
    flippedPoints.reverse();
  }

  const shape = new THREE.Shape(flippedPoints);
  const geometry = new THREE.ShapeGeometry(shape);

  const [r, g, b] = hexToThreeColor(color);
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(r, g, b),
    side: THREE.DoubleSide,
    depthTest: false,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.z = zOffset;

  return mesh;
}

// ─── Scene Module Factory ─────────────────────────────────────────

/**
 * Creates a THREE.Group containing coastline overlay geometry.
 *
 * The group contains three layers:
 * 1. Shallow band meshes (from shallowLoops, at COASTLINE_SHALLOW_Z)
 * 2. Land boundary meshes (from loops, at COASTLINE_LAND_Z)
 * 3. Lake shore meshes (from lakeLoops, at COASTLINE_SHALLOW_Z)
 *
 * NFP #4: Returns empty Group if computeCoastline returns no loops (all-ocean world).
 * NFP #7: Uses ShapeGeometry per loop — acceptable for the number of coastline loops
 *         (typically 1-10). A future optimization pass can merge geometries if needed.
 */
export function createCoastlineMesh(
  tiles: HexTile[],
  cols: number,
  rows: number,
  seed: number,
  lakeIds?: Int16Array,
): THREE.Group {
  const group = new THREE.Group();
  group.renderOrder = RENDER_ORDER.COASTLINE;

  let coastlineData;
  try {
    coastlineData = computeCoastline(
      tiles,
      HEX_CONSTANTS.HEX_SIZE,
      cols,
      rows,
      seed,
      COASTLINE_DEFAULTS,
    );
  } catch (err) {
    // NFP #4: Fail-soft — computeCoastline failure returns empty group, never crashes
    console.error('[CoastlineMesh] computeCoastline failed:', err);
    return group;
  }

  const { loops, shallowLoops } = coastlineData;

  // Layer 1: Shallow water band (below land boundary)
  for (const loop of shallowLoops) {
    const mesh = loopToMesh(loop, COASTLINE_SHALLOW_COLOR, COASTLINE_SHALLOW_Z);
    if (mesh) {
      mesh.renderOrder = RENDER_ORDER.COASTLINE;
      group.add(mesh);
    }
  }

  // Layer 2: Land boundary (above shallow band)
  for (const loop of loops) {
    const mesh = loopToMesh(loop, COASTLINE_LAND_COLOR, COASTLINE_LAND_Z);
    if (mesh) {
      mesh.renderOrder = RENDER_ORDER.COASTLINE;
      group.add(mesh);
    }
  }

  // Layer 3: Lake shore fills
  if (coastlineData.lakeLoops && coastlineData.lakeLoops.length > 0) {
    const lakeColor = WATER_PALETTE['lake'];
    for (const loop of coastlineData.lakeLoops) {
      const mesh = loopToMesh(loop, lakeColor, COASTLINE_SHALLOW_Z);
      if (mesh) {
        mesh.renderOrder = RENDER_ORDER.COASTLINE;
        group.add(mesh);
      }
    }
  }

  return group;
}
