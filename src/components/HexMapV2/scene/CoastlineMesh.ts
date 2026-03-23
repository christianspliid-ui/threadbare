/**
 * CoastlineMesh — Three.js scene module for coastline rendering.
 *
 * Two-pass stencil approach:
 *
 *   Pass 1 (renderOrder = STENCIL_WRITE = -1):
 *     Merged hex geometry for all land tiles writes stencil=1.
 *     Uses a regular Mesh (not InstancedMesh) because Three.js InstancedMesh
 *     ignores material stencil properties. colorWrite: false — invisible.
 *
 *   Pass 2 (renderOrder = COASTLINE = 1):
 *     Ocean-blue PlaneGeometry with NotEqualStencilFunc(ref=1).
 *     Only renders where stencil=0 (water area + background).
 *     Covers water hexes, hex grid gaps, and scene background with uniform blue.
 *
 * Result: land hexes show per-hex terrain colors, everything else is uniform ocean blue.
 * The coastline boundary follows the exact hex edges of the outermost land tiles.
 *
 * NFP #1: All tunable values are named constants.
 * NFP #4: Fail-soft — returns empty Group if no land tiles exist.
 * NFP #7: One merged Mesh draw call for stencil (~90K vertices for ~5K land hexes).
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

/** Ocean overlay color — uniform blue for all water area. */
export const OCEAN_OVERLAY_COLOR = WATER_PALETTE['ocean'];

// ─── Scene Module Factory ─────────────────────────────────────────

/**
 * Creates a THREE.Group containing coastline geometry.
 *
 * @param landTileIndices - Indices into tiles[] for land hexes.
 *   Uses the SAME classification as HexFillMesh to avoid mismatches.
 *   Pass this from HexFillMeshResult.landTileIndices.
 */
export function createCoastlineMesh(
  tiles: HexTile[],
  cols: number,
  rows: number,
  _seed: number,
  _lakeIds?: Int16Array,
  landTileIndices?: number[],
): THREE.Group {
  const group = new THREE.Group();

  // ── Determine land tile indices ──────────────────────────────────
  // Prefer the passed-in indices (same source as HexFillMesh) to avoid
  // classification mismatches. Fall back to isWaterTerrain if not provided.
  let landIndices: number[];
  if (landTileIndices) {
    landIndices = landTileIndices;
  } else {
    landIndices = [];
    for (let i = 0; i < tiles.length; i++) {
      if (!isWaterTerrain(tiles[i].terrain)) {
        landIndices.push(i);
      }
    }
  }

  // ── Hex-based stencil write pass (renderOrder = STENCIL_WRITE) ──
  // Merges all land hex shapes into one BufferGeometry Mesh.
  // Writes stencil=1 for every land hex pixel.
  if (landIndices.length > 0) {
    const hexGeo = buildHexGeometry(HEX_CONSTANTS.HEX_SIZE);
    const hexPositions = hexGeo.getAttribute('position');
    const verticesPerHex = hexPositions.count;

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

    const stencilMesh = new THREE.Mesh(mergedGeo, stencilMat);
    stencilMesh.renderOrder = RENDER_ORDER.STENCIL_WRITE;
    group.add(stencilMesh);

    hexGeo.dispose();
  }

  // ── Ocean overlay with inverse stencil (renderOrder = COASTLINE) ──
  // Uniform ocean blue quad — only renders where stencil ≠ 1 (water area).
  // Covers water hex colors, hex grid gaps, and background with uniform blue.
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
