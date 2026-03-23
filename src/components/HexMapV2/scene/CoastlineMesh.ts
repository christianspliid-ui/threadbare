/**
 * CoastlineMesh — Three.js scene module for coastline rendering.
 *
 * Two-pass stencil approach:
 *
 *   Pass 1 (renderOrder = STENCIL_WRITE = -1):
 *     Marching-squares organic contour writes stencil=1 for the land interior.
 *     The contour runs THROUGH coastal land hexes at the default threshold,
 *     creating an organic boundary that partially clips coastal hexes.
 *     Uses ShapeGeometry from contour loops (regular Mesh, not InstancedMesh).
 *
 *   Pass 2 (renderOrder = COASTLINE = 1):
 *     Ocean-blue PlaneGeometry with NotEqualStencilFunc(ref=1).
 *     Only renders where stencil=0 — water area + water-side slivers of coastal hexes.
 *
 * Result: inland land = full terrain colors, coastal land = partially clipped
 * (terrain on land side, blue on water side), water = uniform ocean blue.
 *
 * NFP #1: All tunable values are named constants.
 * NFP #4: Fail-soft — returns empty Group on computeCoastline failure.
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

// ─── Constants (NFP #1) ───────────────────────────────────────────

/** Ocean overlay color — uniform blue for all water area. */
export const OCEAN_OVERLAY_COLOR = WATER_PALETTE['ocean'];

// ─── Geometry Helpers ─────────────────────────────────────────────

/** Signed area of a contour loop (Shoelace formula). Positive = CCW in y-down. */
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
 * Creates a stencil write mesh from a contour loop.
 * Applies Y-flip (SVG y-down → Three.js y-up) and fixes winding for ShapeGeometry.
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
  return new THREE.Mesh(geometry, stencilMaterial);
}

// ─── Scene Module Factory ─────────────────────────────────────────

/**
 * Creates a THREE.Group containing coastline geometry.
 *
 * The organic contour at the default threshold (0.35) runs through coastal
 * land hexes — it sits between land hex centers and water hex centers.
 * This creates partially-clipped coastal hexes: terrain color on the land side,
 * ocean blue on the water side.
 */
export function createCoastlineMesh(
  tiles: HexTile[],
  cols: number,
  rows: number,
  seed: number,
  lakeIds?: Int16Array,
): THREE.Group {
  const group = new THREE.Group();

  // ── Compute organic coastline contour at default threshold ──────
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
    console.error('[CoastlineMesh] computeCoastline failed:', err);
    return group;
  }

  // ── Stencil write pass (renderOrder = STENCIL_WRITE = -1) ───────
  // Organic contour fills write stencil=1 for the land interior.
  // The contour cuts through coastal land hexes at the default threshold.
  const stencilMat = new THREE.MeshBasicMaterial({
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
    const mesh = loopToStencilMesh(loop, stencilMat);
    if (mesh) {
      mesh.renderOrder = RENDER_ORDER.STENCIL_WRITE;
      group.add(mesh);
    }
  }

  // ── Ocean overlay with inverse stencil (renderOrder = COASTLINE) ──
  // Uniform ocean blue — renders where stencil ≠ 1 (water + coastal slivers).
  {
    const hexSize = HEX_CONSTANTS.HEX_SIZE;
    const mapW = cols * hexSize * HEX_SCALE_X + hexSize * 2;
    const mapH = rows * HEX_SCALE_Y * hexSize + HEX_SCALE_Y * hexSize;
    const pad = 200;

    const overlayGeo = new THREE.PlaneGeometry(mapW + pad * 2, mapH + pad * 2);
    const [r, g, b] = hexToThreeColor(OCEAN_OVERLAY_COLOR);
    const overlayMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(r, g, b),
      transparent: true,
      opacity: 1.0,
      depthTest: false,
      side: THREE.DoubleSide,
      stencilWrite: true,
      stencilFunc: THREE.NotEqualStencilFunc,
      stencilRef: 1,
      stencilFuncMask: 0xFF,
      stencilFail: THREE.KeepStencilOp,
      stencilZFail: THREE.KeepStencilOp,
      stencilZPass: THREE.KeepStencilOp,
    });

    const overlayMesh = new THREE.Mesh(overlayGeo, overlayMat);
    overlayMesh.position.set(mapW / 2 - hexSize, -(mapH / 2), 0.03);
    overlayMesh.renderOrder = RENDER_ORDER.COASTLINE;
    group.add(overlayMesh);
  }

  return group;
}
