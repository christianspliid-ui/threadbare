/**
 * CoastlineMesh — Three.js scene module for organic coastline rendering.
 *
 * Two-curve stencil approach:
 *
 *   Inner curve (higher threshold): cuts through LAND hexes adjacent to water.
 *     Writes stencil=1 for the land interior. Land hexes near water get partially
 *     clipped — terrain on the land side, coastal blue on the water side.
 *
 *   Outer curve (lower threshold): the coastal boundary in shallow water.
 *     Rendered as visible blue ShapeGeometry where stencil≠1.
 *     Creates the blue coastal band between the two curves.
 *
 *   Beyond the outer curve: water hexes show their own per-hex colors.
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
import { getActivePalette } from '../palette/activePalette';

// ─── Constants (NFP #1) ───────────────────────────────────────────

/** Coastal band color — reads from active palette (theme override → base water palette). */
export function getCoastalBandColor(): string {
  const overrides = getActivePalette().waterOverrides;
  return overrides['ocean'] ?? WATER_PALETTE['ocean'];
}
/** @deprecated Use getCoastalBandColor() — kept for backward compat */
export const COASTAL_BAND_COLOR = WATER_PALETTE['ocean'];

/**
 * Inner curve threshold — higher value pushes contour INTO land hexes near water.
 * Must be high enough that the contour only touches land hexes adjacent to
 * shallow water, never touching the shallow water hexes themselves.
 * NFP #1: Named constant for tunability.
 */
export const INNER_CURVE_THRESHOLD = 0.9;

/**
 * Outer curve threshold — lower value pushes contour OUT toward water.
 * Defines the seaward edge of the coastal band.
 * NFP #1: Named constant for tunability.
 */
export const OUTER_CURVE_THRESHOLD = 0.30;

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

/**
 * Creates a visible colored mesh from a contour loop.
 * Applies Y-flip and fixes winding. Uses the provided material.
 */
function loopToVisibleMesh(
  loop: ContourLoop,
  material: THREE.MeshBasicMaterial,
  zOffset: number,
): THREE.Mesh | null {
  if (loop.length < 3) return null;

  const flippedPoints: THREE.Vector2[] = loop.map(p => new THREE.Vector2(p.x, -p.y));
  const svgArea = signedArea(loop);
  if (svgArea > 0) flippedPoints.reverse();

  const shape = new THREE.Shape(flippedPoints);
  const geometry = new THREE.ShapeGeometry(shape);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.z = zOffset;
  return mesh;
}

// ─── Scene Module Factory ─────────────────────────────────────────

/**
 * Creates a THREE.Group containing two-curve coastline geometry.
 *
 * Inner curve (INNER_CURVE_THRESHOLD): stencil write for land interior.
 * Outer curve (OUTER_CURVE_THRESHOLD): visible blue fill for coastal band.
 * Between them: the organic coastal band.
 * Beyond outer curve: water hexes show per-hex colors.
 */
export function createCoastlineMesh(
  tiles: HexTile[],
  cols: number,
  rows: number,
  seed: number,
  lakeIds?: Int16Array,
): THREE.Group {
  const group = new THREE.Group();

  // ── Compute inner curve (land interior boundary) ────────────────
  let innerData;
  try {
    const innerConfig = { ...COASTLINE_DEFAULTS, threshold: INNER_CURVE_THRESHOLD };
    innerData = computeCoastline(
      tiles, HEX_CONSTANTS.HEX_SIZE, cols, rows, seed, innerConfig, lakeIds,
    );
  } catch (err) {
    console.error('[CoastlineMesh] inner computeCoastline failed:', err);
    return group;
  }

  // ── Compute outer curve (coastal band seaward edge) ─────────────
  let outerData;
  try {
    const outerConfig = { ...COASTLINE_DEFAULTS, threshold: OUTER_CURVE_THRESHOLD };
    outerData = computeCoastline(
      tiles, HEX_CONSTANTS.HEX_SIZE, cols, rows, seed, outerConfig, lakeIds,
    );
  } catch (err) {
    console.error('[CoastlineMesh] outer computeCoastline failed:', err);
    return group;
  }

  // ── Pass 1: Stencil write from inner curve (renderOrder = STENCIL_WRITE) ──
  // Marks stencil=1 for the land interior (inside the inner curve).
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

  for (const loop of innerData.loops) {
    const mesh = loopToStencilMesh(loop, stencilMat);
    if (mesh) {
      mesh.renderOrder = RENDER_ORDER.STENCIL_WRITE;
      group.add(mesh);
    }
  }

  // ── Pass 2: Visible coastal band from outer curve (renderOrder = COASTLINE) ──
  // Blue fill for the outer curve shape, but only where stencil≠1.
  // This paints blue between the two curves (the coastal band)
  // and doesn't touch the land interior (stencil=1).
  const [r, g, b] = hexToThreeColor(getCoastalBandColor());
  const coastalBandMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(r, g, b),
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide,
    stencilWrite: true,
    stencilFunc: THREE.NotEqualStencilFunc,
    stencilRef: 1,
    stencilFuncMask: 0xFF,
    stencilFail: THREE.KeepStencilOp,
    stencilZFail: THREE.KeepStencilOp,
    stencilZPass: THREE.KeepStencilOp,
  });

  for (const loop of outerData.loops) {
    const mesh = loopToVisibleMesh(loop, coastalBandMat, 0.03);
    if (mesh) {
      mesh.renderOrder = RENDER_ORDER.COASTLINE;
      group.add(mesh);
    }
  }

  // ── Lake shores ──────────────────────────────────────────────────
  // Problem: the main stencil writes stencil=1 for all land interior,
  // including the area around inland lakes. The lake coastal band uses
  // NotEqualStencilFunc(1) — blocked by the land stencil.
  //
  // Fix: punch a hole in the stencil by writing stencil=0 inside lake
  // contours. Use the outer lake loops (threshold 0.30, which produces
  // reliable lake contours) for both the hole punch and the visible band.
  if (outerData.lakeLoops && outerData.lakeLoops.length > 0) {
    // Stencil clear material — writes stencil=0 to "punch holes" in land stencil
    const lakeStencilClearMat = new THREE.MeshBasicMaterial({
      colorWrite: false,
      depthWrite: false,
      depthTest: false,
      stencilWrite: true,
      stencilWriteMask: 0xFF,
      stencilFunc: THREE.AlwaysStencilFunc,
      stencilRef: 0,
      stencilFuncMask: 0xFF,
      stencilFail: THREE.ReplaceStencilOp,
      stencilZFail: THREE.ReplaceStencilOp,
      stencilZPass: THREE.ReplaceStencilOp,
      side: THREE.DoubleSide,
    });

    // Step 1: Clear stencil inside lake contours (write stencil=0).
    // renderOrder -0.5: AFTER main stencil write (-1) but BEFORE hex fill (0).
    for (const loop of outerData.lakeLoops) {
      const mesh = loopToStencilMesh(loop, lakeStencilClearMat);
      if (mesh) {
        mesh.renderOrder = -0.5;
        group.add(mesh);
      }
    }

    // Step 2: Re-write stencil=1 for the land ring around lake shore using inner lake loops.
    // renderOrder -0.4: AFTER clear (-0.5) so land ring stays stencil=1.
    if (innerData.lakeLoops && innerData.lakeLoops.length > 0) {
      for (const loop of innerData.lakeLoops) {
        const mesh = loopToStencilMesh(loop, stencilMat);
        if (mesh) {
          mesh.renderOrder = -0.4;
          group.add(mesh);
        }
      }
    }

    // Step 3: Visible blue band for lake shores (renders where stencil≠1)
    for (const loop of outerData.lakeLoops) {
      const mesh = loopToVisibleMesh(loop, coastalBandMat, 0.03);
      if (mesh) {
        mesh.renderOrder = RENDER_ORDER.COASTLINE;
        group.add(mesh);
      }
    }
  }

  return group;
}
