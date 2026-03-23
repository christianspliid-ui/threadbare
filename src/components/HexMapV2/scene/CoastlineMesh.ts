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
import { isWaterTerrain } from '../../../engine/coastline';
import { HEX_CONSTANTS, buildHexGeometry } from './HexFillMesh';
import { RENDER_ORDER } from './RenderLayers';
import { WATER_PALETTE } from '../palette/waterPalette';
import { hexToThreeColor } from '../palette/colorUtils';
import { hexToPixel, HEX_SCALE_X, HEX_SCALE_Y } from '../../../lib/hexMath';

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
 * Stencil contour threshold — much lower than the default land threshold (0.35).
 * Lower value extends the stencil=1 area well past coastal land hex edges into
 * the water zone. This ensures NO land hex pixel is covered by the water overlay.
 * The organic coastline boundary is defined by where the stencil=1 area meets
 * the water overlay — so a lower threshold pushes the visible shore outward.
 * NFP #1: Named constant for tunability.
 */
export const STENCIL_THRESHOLD = 0.01;

// ─── Scene Module Factory ─────────────────────────────────────────

/**
 * Creates a THREE.Group containing coastline geometry.
 *
 * The group contains:
 * 1. Hex-based stencil write mesh: merged BufferGeometry of all land hexes.
 *    colorWrite: false, stencilWrite: true, stencilRef: 1.
 *    Writes stencil=1 for every land hex pixel (not contour-based).
 *    renderOrder = STENCIL_WRITE (-1) — render before hex fill.
 * 2. Water overlay: PlaneGeometry with NotEqualStencilFunc(ref=1).
 *    Renders ocean blue where stencil=0 (water area), covering hex grid
 *    edges and background. renderOrder = COASTLINE (1).
 *
 * NFP #4: Returns empty Group if no land tiles exist.
 * NFP #7: One merged Mesh draw call for stencil (~90K vertices for ~5K land hexes).
 */
export function createCoastlineMesh(
  tiles: HexTile[],
  cols: number,
  rows: number,
  seed: number,
  lakeIds?: Int16Array,
): THREE.Group {
  const group = new THREE.Group();

  // ── Hex-based stencil write pass (renderOrder = STENCIL_WRITE = -1) ─────
  // Merge all land hex geometries into a single BufferGeometry Mesh.
  // Writes stencil=1 for every land hex pixel. Using a regular Mesh (not InstancedMesh)
  // because Three.js InstancedMesh ignores stencil material properties.
  //
  // Performance: ~5000 land hexes × 18 vertices = ~90K vertices in one draw call.
  {
    const hexGeo = buildHexGeometry(HEX_CONSTANTS.HEX_SIZE);
    const hexPositions = hexGeo.getAttribute('position');
    const verticesPerHex = hexPositions.count; // 18 (6 triangles × 3 vertices)

    // Count land tiles
    const landIndices: number[] = [];
    for (let i = 0; i < tiles.length; i++) {
      const tile = tiles[i];
      const lakeId = lakeIds ? lakeIds[i] : -1;
      const isWater = isWaterTerrain(tile.terrain) || (lakeIds !== undefined && lakeId >= 0);
      if (!isWater) landIndices.push(i);
    }

    if (landIndices.length > 0) {
      // Merge hex geometries: translate each hex template to its world position
      const totalVerts = landIndices.length * verticesPerHex;
      const mergedPositions = new Float32Array(totalVerts * 3);

      for (let li = 0; li < landIndices.length; li++) {
        const tile = tiles[landIndices[li]];
        const { x, y } = hexToPixel(tile.coord, HEX_CONSTANTS.HEX_SIZE);
        const baseIdx = li * verticesPerHex * 3;

        for (let v = 0; v < verticesPerHex; v++) {
          mergedPositions[baseIdx + v * 3]     = hexPositions.getX(v) + x;
          mergedPositions[baseIdx + v * 3 + 1] = hexPositions.getY(v) - y; // Y-flip
          mergedPositions[baseIdx + v * 3 + 2] = 0;
        }
      }

      const mergedGeo = new THREE.BufferGeometry();
      mergedGeo.setAttribute('position', new THREE.Float32BufferAttribute(mergedPositions, 3));

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

      const stencilMesh = new THREE.Mesh(mergedGeo, stencilWriteMaterial);
      stencilMesh.renderOrder = RENDER_ORDER.STENCIL_WRITE;
      group.add(stencilMesh);
    }

    hexGeo.dispose();
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
    // Use ocean blue so the overlay shows as water where it covers hex edges
    // past the organic coastline boundary. Matches mid-ocean depth band.
    const [oR, oG, oB] = hexToThreeColor(WATER_PALETTE['ocean']);
    const overlayMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(oR, oG, oB),
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
