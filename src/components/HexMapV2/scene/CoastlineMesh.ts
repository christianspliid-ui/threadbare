/**
 * CoastlineMesh — Three.js scene module for organic coastline rendering.
 *
 * Implements stencil-buffer coastline clipping:
 *
 *   Pass 1 (renderOrder = STENCIL_WRITE = -1):
 *     Writes 1 into the stencil buffer for all land pixels using the organic coastline
 *     contour loops. colorWrite: false — invisible, but marks land area in stencil.
 *
 *   Pass 2 (renderOrder = HEX_FILL = 0):
 *     Land InstancedMesh tests stencilRef = 1. Hexes only render where stencil = 1.
 *     This clips the full hexagonal land tiles to the organic coastline boundary.
 *
 *   Pass 3 (renderOrder = COASTLINE = 1):
 *     Shallow depth band fills (shallowLoops) and lake shore fills.
 *     Currently DISABLED — the stencil write only covers coastline boundary, not
 *     full land interior, so an inverse stencil test can't distinguish land from water.
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
import { HEX_SCALE_X, HEX_SCALE_Y } from '../../../lib/hexMath';
import { SCENE_CONSTANTS } from './HexSceneSetup';

// ─── Constants (NFP #1) ───────────────────────────────────────────

/**
 * Z offset for the shallow band contour (above hex fill).
 */
export const COASTLINE_SHALLOW_Z = 0.01;

/**
 * Shallow band color — matches WATER_PALETTE.shallows for coastal shallow water.
 * This creates the shallowing band between deep ocean and the land boundary.
 */
export const COASTLINE_SHALLOW_COLOR = WATER_PALETTE['shallows'];

/**
 * Stencil contour threshold — slightly lower than the default land threshold (0.35).
 * Lower value extends the land contour past the outer land hex edges, ensuring
 * the stencil covers all land hex pixels including their outermost edges.
 * NFP #1: Named constant for tunability.
 */
export const STENCIL_THRESHOLD = 0.30;

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
 * After Y-flip: y negation flips the winding direction, so:
 *   positive SVG area (CCW in y-down) → CW in y-up → reverse to make CCW
 *   negative SVG area (CW in y-down)  → CCW in y-up → keep
 *
 * NFP #4: Fail-soft — loops with < 3 points are skipped.
 */
function loopToMesh(loop: ContourLoop, color: string, zOffset: number): THREE.Mesh | null {
  if (loop.length < 3) return null;

  const flippedPoints: THREE.Vector2[] = loop.map(p => new THREE.Vector2(p.x, -p.y));
  const svgArea = signedArea(loop);
  if (svgArea > 0) flippedPoints.reverse();

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

/**
 * Creates a stencil write mesh from a contour loop.
 * This mesh writes 1 into the stencil buffer for all land pixels.
 * colorWrite: false — invisible but marks land area in stencil buffer.
 *
 * Uses a shared stencil material passed in to minimize material allocations.
 */
function loopToStencilMesh(
  loop: ContourLoop,
  stencilMaterial: THREE.MeshBasicMaterial,
): THREE.Mesh | null {
  if (loop.length < 3) return null;

  const flippedPoints: THREE.Vector2[] = loop.map(p => new THREE.Vector2(p.x, -p.y));
  const svgArea = signedArea(loop);
  if (svgArea > 0) flippedPoints.reverse();

  const shape = new THREE.Shape(flippedPoints);
  const geometry = new THREE.ShapeGeometry(shape);
  const mesh = new THREE.Mesh(geometry, stencilMaterial);

  return mesh;
}

// ─── Scene Module Factory ─────────────────────────────────────────

/**
 * Creates a THREE.Group containing coastline geometry.
 *
 * The group contains:
 * 1. Stencil write meshes (from coastlineData.loops at STENCIL_THRESHOLD):
 *    colorWrite: false, stencilWrite: true, stencilRef: 1
 *    renderOrder = STENCIL_WRITE (-1) — render before hex fill
 * 2. Shallow band meshes (from shallowLoops, at COASTLINE_SHALLOW_Z):
 *    renderOrder = COASTLINE (1) — render above hex fill, below grid
 * 3. Lake shore meshes (from lakeLoops, at COASTLINE_SHALLOW_Z):
 *    renderOrder = COASTLINE (1)
 *
 * NFP #4: Returns empty Group if computeCoastline returns no loops (all-ocean world).
 */
export function createCoastlineMesh(
  tiles: HexTile[],
  cols: number,
  rows: number,
  seed: number,
  lakeIds?: Int16Array,
): THREE.Group {
  const group = new THREE.Group();

  let coastlineData;
  try {
    // Use default threshold for all coastline contours (stencil + display).
    // Using a lower threshold (e.g. STENCIL_THRESHOLD 0.30) causes shallowLoops to
    // cover the entire map, painting all hexes with shallow-water color.
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

  // ── Stencil write pass (renderOrder = STENCIL_WRITE = -1) ─────────
  // One shared stencil material for all land contour loops (minimizes allocations)
  const stencilWriteMaterial = new THREE.MeshBasicMaterial({
    colorWrite: false,
    depthWrite: false,
    depthTest: false,
    stencilWrite: true,
    stencilWriteMask: 0xFF,
    stencilFunc: THREE.AlwaysStencilFunc,
    stencilRef: 1,
    stencilFuncMask: 0xFF,
    stencilFail: THREE.ReplaceStencilOp,
    stencilZFail: THREE.ReplaceStencilOp,
    stencilZPass: THREE.ReplaceStencilOp,
    side: THREE.DoubleSide,
  });

  for (const loop of coastlineData.loops) {
    const mesh = loopToStencilMesh(loop, stencilWriteMaterial);
    if (mesh) {
      mesh.renderOrder = RENDER_ORDER.STENCIL_WRITE;
      group.add(mesh);
    }
  }

  // ── Water-colored overlay with inverse stencil (renderOrder = COASTLINE) ──
  // A full-map quad that only renders where stencil != 1 (water area).
  // This covers the jagged hex edges of coastal land hexes that extend past
  // the organic coastline boundary, creating smooth organic shores.
  //
  // Three.js InstancedMesh ignores material stencil properties, so we can't
  // stencil-test the land InstancedMesh directly. Instead, this regular Mesh
  // overlay paints water color on top of hex edges outside the organic boundary.
  // Stencil test works correctly on regular Mesh (verified with diagnostic).
  {
    const hexSize = HEX_CONSTANTS.HEX_SIZE;
    const mapW = cols * hexSize * HEX_SCALE_X + hexSize * 2;
    const mapH = rows * HEX_SCALE_Y * hexSize + HEX_SCALE_Y * hexSize;
    const pad = 100;

    const overlayGeo = new THREE.PlaneGeometry(mapW + pad * 2, mapH + pad * 2);
    // Use scene background color so the overlay blends with the dark canvas.
    // Construct Color from hex int to match SCENE_CONSTANTS.BACKGROUND_COLOR exactly.
    const overlayMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(SCENE_CONSTANTS.BACKGROUND_COLOR),
      transparent: true,
      opacity: 1.0,
      depthTest: false,
      side: THREE.DoubleSide,
      // Inverse stencil: only render where stencil != 1 (water pixels)
      stencilWrite: true,
      stencilFunc: THREE.NotEqualStencilFunc,
      stencilRef: 1,
      stencilFuncMask: 0xFF,
      stencilFail: THREE.KeepStencilOp,
      stencilZFail: THREE.KeepStencilOp,
      stencilZPass: THREE.KeepStencilOp,
    });

    const overlayMesh = new THREE.Mesh(overlayGeo, overlayMat);
    // Center the quad over the hex grid (hexToPixel origin is top-left)
    overlayMesh.position.set(mapW / 2 - hexSize, -(mapH / 2), 0.03);
    overlayMesh.renderOrder = RENDER_ORDER.COASTLINE;
    group.add(overlayMesh);
  }

  return group;
}
