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
 *     Shallow depth band fills (shallowLoops) and lake shore fills render on top
 *     of the water hex fill, creating the coastal shallows gradient.
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
    // Use a lower threshold for stencil contour to extend coverage past outer land hex edges
    const stencilConfig = { ...COASTLINE_DEFAULTS, threshold: STENCIL_THRESHOLD };
    coastlineData = computeCoastline(
      tiles,
      HEX_CONSTANTS.HEX_SIZE,
      cols,
      rows,
      seed,
      stencilConfig,
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

  // ── Shallow depth band fills (renderOrder = COASTLINE = 1) ────────
  for (const loop of coastlineData.shallowLoops) {
    const mesh = loopToMesh(loop, COASTLINE_SHALLOW_COLOR, COASTLINE_SHALLOW_Z);
    if (mesh) {
      mesh.renderOrder = RENDER_ORDER.COASTLINE;
      group.add(mesh);
    }
  }

  // ── Lake shore fills (renderOrder = COASTLINE = 1) ────────────────
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
