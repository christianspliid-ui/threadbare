/**
 * FogOverlayMesh.ts — Parchment fog-of-war overlay that floats above all scene content.
 *
 * Creates an InstancedMesh of hex-shaped quads positioned at each hex center,
 * at a Z height above 3D city models and all other scene layers. Each instance
 * is either fully opaque (unexplored — shows parchment texture) or fully
 * transparent (remembered/visible — discarded in fragment shader).
 *
 * This approach covers ALL layers at once — rivers, borders, signifiers, labels,
 * 3D models — without per-layer culling logic.
 *
 * NFP #1: All constants are named. Z height and render order from RenderLayers.ts.
 * NFP #3: Deterministic — same fog state = same visual output.
 * NFP #4: Fail-soft — texture load failure falls back to solid parchment color.
 */

import * as THREE from 'three';
import type { HexTile } from '../../../types';
import { hexToWorld } from '../../../lib/worldPosition';
import { buildHexGeometry, HEX_CONSTANTS } from './HexFillMesh';
import { HEX_SCALE_X, HEX_SCALE_Y } from '../../../lib/hexMath';
import { RENDER_ORDER, LAYER_Z } from './RenderLayers';
import { PARCHMENT_FOG_CONSTANTS } from './fogShader';
import { getActivePalette } from '../palette/activePalette';

// ── Overlay Shaders ──────────────────────────────────────────────────────────

/**
 * Vertex shader for the fog overlay.
 * Reads per-instance aFogAlpha (1.0 = opaque parchment, 0.0 = fully transparent).
 */
const OVERLAY_VERTEX_SHADER = /* glsl */ `
  attribute float aFogAlpha;

  varying vec2 vUv;
  varying float vAlpha;

  void main() {
    vUv = uv;
    vAlpha = aFogAlpha;

    vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

/**
 * Fragment shader for the fog overlay.
 * Discards fragments when alpha is near zero (remembered/visible hexes).
 * Renders parchment texture (or fallback color) when alpha > 0.
 */
const OVERLAY_FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uParchmentTex;
  uniform vec3 uParchmentFallback;
  uniform float uHasTexture;

  varying vec2 vUv;
  varying float vAlpha;

  void main() {
    if (vAlpha < 0.01) discard;

    if (uHasTexture > 0.5) {
      gl_FragColor = texture2D(uParchmentTex, vUv);
      gl_FragColor.a = 1.0;  // Fully opaque — occlude everything behind
    } else {
      gl_FragColor = vec4(uParchmentFallback, 1.0);
    }
  }
`;

// ── Result Type ──────────────────────────────────────────────────────────────

export interface FogOverlayResult {
  mesh: THREE.InstancedMesh;
  /** Large background plane covering area beyond the hex grid */
  backgroundPlane: THREE.Mesh;
  /** Per-instance alpha buffer: 1.0 = unexplored (opaque), 0.0 = visible/remembered */
  alphaBuffer: Float32Array;
  /** Hex key ("col,row") → instance index */
  indexByKey: Map<string, number>;
}

// ── Factory ──────────────────────────────────────────────────────────────────

/**
 * Creates the fog overlay InstancedMesh covering all hex tiles.
 *
 * Each hex gets one overlay instance positioned at its center at FOG_OVERLAY Z height.
 * The overlay starts fully opaque (all hexes unexplored).
 *
 * @param tiles - All hex tiles in the grid
 * @param cols - Grid width in hexes
 * @param rows - Grid height in hexes
 * @param parchmentTexture - Pre-loaded parchment texture (null = solid fallback)
 */
export function createFogOverlayMesh(
  tiles: HexTile[],
  cols: number,
  rows: number,
  parchmentTexture: THREE.Texture | null,
): FogOverlayResult {
  const geo = buildHexGeometry(HEX_CONSTANTS.HEX_SIZE);

  const fallbackColor = new THREE.Color(PARCHMENT_FOG_CONSTANTS.PARCHMENT_FALLBACK_COLOR);

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uParchmentTex: { value: parchmentTexture },
      uParchmentFallback: { value: fallbackColor },
      uHasTexture: { value: parchmentTexture ? 1.0 : 0.0 },
    },
    vertexShader: OVERLAY_VERTEX_SHADER,
    fragmentShader: OVERLAY_FRAGMENT_SHADER,
    transparent: true,    // Needed for fragment discard on remembered/visible hexes
    depthWrite: true,     // Write depth for opaque parchment — occlude objects behind overlay
    depthTest: true,
    side: THREE.FrontSide,
  });

  const count = tiles.length;
  const mesh = new THREE.InstancedMesh(geo, material, count);
  mesh.renderOrder = RENDER_ORDER.FOG;
  mesh.frustumCulled = true;

  // Per-instance alpha buffer — starts at 1.0 (all unexplored = opaque)
  const alphaBuffer = new Float32Array(count).fill(1.0);
  mesh.geometry.setAttribute(
    'aFogAlpha',
    new THREE.InstancedBufferAttribute(alphaBuffer, 1),
  );

  // Position each instance at its hex center, at the fog overlay Z height
  const matrix = new THREE.Matrix4();
  const indexByKey = new Map<string, number>();

  for (let i = 0; i < count; i++) {
    const tile = tiles[i];
    const { x, y } = hexToWorld(tile.coord, HEX_CONSTANTS.HEX_SIZE);
    matrix.setPosition(x, y, LAYER_Z.FOG_OVERLAY);
    mesh.setMatrixAt(i, matrix);
    indexByKey.set(`${tile.coord.col},${tile.coord.row}`, i);
  }

  mesh.instanceMatrix.needsUpdate = true;

  // ── Background plane — extends parchment far beyond the hex grid ──
  // Covers 3x the map dimensions in each direction so the edge is never visible.
  // Uses a simple textured quad at the same Z, rendered just before the hex overlay.
  const mapWorldWidth = cols * HEX_CONSTANTS.HEX_SIZE * HEX_SCALE_X;
  const mapWorldHeight = rows * HEX_CONSTANTS.HEX_SIZE * HEX_SCALE_Y;
  const padding = Math.max(mapWorldWidth, mapWorldHeight) * 2; // 2x map dimension of padding — generous coverage
  const planeWidth = mapWorldWidth + padding * 2;
  const planeHeight = mapWorldHeight + padding * 2;

  const planeGeo = new THREE.PlaneGeometry(planeWidth, planeHeight);
  // Use scene background color so the plane is invisible against the canvas background.
  // The hex overlay instances handle the parchment texture on the actual map area —
  // the background plane just ensures no scene content is visible beyond the grid.
  const planeMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(getActivePalette().sceneBackground),
    depthTest: false,     // Render regardless of depth — purely visual filler
    depthWrite: false,    // Must NOT write depth — would block terrain on visible hexes
    side: THREE.FrontSide,
  });

  const backgroundPlane = new THREE.Mesh(planeGeo, planeMat);
  // Center the plane on the map center
  const centerX = (cols - 1) * HEX_CONSTANTS.HEX_SIZE * HEX_SCALE_X / 2;
  const centerY = -((rows - 1) * HEX_CONSTANTS.HEX_SIZE * HEX_SCALE_Y / 2);
  backgroundPlane.position.set(centerX, centerY, -0.1); // Behind all hex content
  backgroundPlane.renderOrder = RENDER_ORDER.STENCIL_WRITE - 1; // Render before everything else

  return { mesh, backgroundPlane, alphaBuffer, indexByKey };
}

/**
 * Updates the fog overlay alpha for a specific hex.
 * Call this from useFogCulling when visibility state changes.
 *
 * @param result - The FogOverlayResult from createFogOverlayMesh
 * @param hexKey - "col,row" hex key
 * @param alpha - 1.0 for unexplored (opaque), 0.0 for remembered/visible (transparent)
 */
export function setFogOverlayAlpha(
  result: FogOverlayResult,
  hexKey: string,
  alpha: number,
): void {
  const idx = result.indexByKey.get(hexKey);
  if (idx === undefined) return; // fail-soft
  result.alphaBuffer[idx] = alpha;
}

/**
 * Marks the fog overlay alpha attribute as needing GPU upload.
 * Call once after batch-updating alpha values.
 */
export function flushFogOverlay(result: FogOverlayResult): void {
  const attr = result.mesh.geometry.getAttribute('aFogAlpha') as THREE.InstancedBufferAttribute | undefined;
  if (attr) attr.needsUpdate = true;
}

/**
 * Updates the parchment texture uniform on the overlay material.
 * Used when texture loads asynchronously after mesh creation.
 */
export function updateFogOverlayTexture(
  result: FogOverlayResult,
  texture: THREE.Texture,
): void {
  // Update hex overlay shader uniform
  const mat = result.mesh.material as THREE.ShaderMaterial;
  mat.uniforms.uParchmentTex.value = texture;
  mat.uniforms.uHasTexture.value = 1.0;
  // Background plane uses scene background color — no texture needed
}
