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
 *
 * **Why the player saw near-black (THR-1902, measured for THR-1878 plan § D12).** The
 * overlay was mounted, on top and its texture loaded — but the fragment shader wrote
 * the sampled texel straight to the screen. The texture is decoded from sRGB to linear
 * on sampling and the renderer outputs sRGB, so a custom ShaderMaterial must encode its
 * colour on the way out (`colorspace_fragment`); without it the authored dark-umber
 * parchment (mean ≈ #352920) was written as its linear value (≈ #0a0705), which is the
 * `#0a0a0c` void THR-1831 measured. The fill now comes from the palette token
 * `fogUnexploredFill`, is sampled in world space (one continuous sheet of paper, not a
 * copy per hex), and fades to the scene background over UNCHARTED_VIGNETTE_HEXES where
 * the grid ends, so off-grid space stays dark (Law 32).
 */

import * as THREE from 'three';
import type { HexTile } from '../../../types';
import { hexToWorld } from '../../../lib/worldPosition';
import { buildHexGeometry, HEX_CONSTANTS } from './HexFillMesh';
import { HEX_SCALE_X, HEX_SCALE_Y } from '../../../lib/hexMath';
import { RENDER_ORDER, LAYER_Z } from './RenderLayers';
import { getActivePalette } from '../palette/activePalette';

// ── Constants (NFP #1) ───────────────────────────────────────────────────────

export const UNCHARTED_FILL_CONSTANTS = {
  /** Width, in hexes, of the fade from parchment to the off-grid dark at the grid's edge. */
  UNCHARTED_VIGNETTE_HEXES: 1.5,
  /** World units one repeat of the parchment texture spans — about a dozen hexes. */
  PARCHMENT_WORLD_SPAN: 60,
} as const;

/** What an unexplored hex is showing — read by `__DEBUG.getMapChrome().fog`. */
export type UnexploredFillMode = 'parchment' | 'tint';

// ── Overlay Shaders ──────────────────────────────────────────────────────────

/**
 * Vertex shader for the fog overlay.
 * Reads per-instance aFogAlpha (1.0 = opaque parchment, 0.0 = fully transparent).
 */
export const OVERLAY_VERTEX_SHADER = /* glsl */ `
  attribute float aFogAlpha;

  varying vec2 vWorld;
  varying float vAlpha;

  void main() {
    vAlpha = aFogAlpha;

    vec4 world = modelMatrix * instanceMatrix * vec4(position, 1.0);
    vWorld = world.xy;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

/**
 * Fragment shader for the fog overlay.
 * Discards fragments when alpha is near zero (remembered/visible hexes).
 * Renders parchment texture (or fallback color) when alpha > 0.
 */
export const OVERLAY_FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uParchmentTex;
  uniform vec3 uTint;
  uniform vec3 uTextureTint;
  uniform float uHasTexture;
  uniform vec3 uBackground;
  uniform vec4 uGridRect;      // minX, minY, maxX, maxY of the grid's outer edge
  uniform float uVignetteWidth;
  uniform float uWorldSpan;

  varying vec2 vWorld;
  varying float vAlpha;

  void main() {
    if (vAlpha < 0.01) discard;

    vec3 paper = uHasTexture > 0.5
      ? texture2D(uParchmentTex, vWorld / uWorldSpan).rgb * uTextureTint
      : uTint;

    // Fade to the off-grid dark where the grid ends (Law 32).
    float edge = min(
      min(vWorld.x - uGridRect.x, uGridRect.z - vWorld.x),
      min(vWorld.y - uGridRect.y, uGridRect.w - vWorld.y)
    );
    float fade = smoothstep(0.0, uVignetteWidth, edge);

    // Fully opaque — occlude everything behind.
    gl_FragColor = vec4(mix(uBackground, paper, fade), 1.0);
    #include <colorspace_fragment>
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
  /** True once a parchment texture is bound (at creation or by `updateFogOverlayTexture`). */
  textureLoaded: boolean;
}

/** `__DEBUG.getMapChrome().fog` — what the player sees on uncharted land (THR-1902). */
export interface FogOverlayStatus {
  /** Fog of war is drawn at all (off under `?nofog`). */
  enabled: boolean;
  /** 'parchment' when the texture is bound, 'tint' when the flat palette tint fills it. */
  unexplored: UnexploredFillMode;
  textureLoaded: boolean;
  /** Hexes the overlay currently covers. */
  unexploredHexes: number;
}

/** Reads the overlay's state for the debug bridge. Pure. */
export function getFogOverlayStatus(result: FogOverlayResult | null): FogOverlayStatus {
  if (!result) return { enabled: false, unexplored: 'tint', textureLoaded: false, unexploredHexes: 0 };
  let covered = 0;
  for (let i = 0; i < result.alphaBuffer.length; i++) if (result.alphaBuffer[i] > 0.01) covered++;
  return {
    enabled: result.mesh.visible,
    unexplored: result.textureLoaded ? 'parchment' : 'tint',
    textureLoaded: result.textureLoaded,
    unexploredHexes: result.mesh.visible ? covered : 0,
  };
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

  const palette = getActivePalette();
  const fill = palette.fogUnexploredFill;
  // A palette with no texture never binds one, even if a texture was loaded.
  const texture = fill.texture ? parchmentTexture : null;

  // The grid's outer edge: tile centres ± one hex, so the outermost hexes sit inside
  // the fade rather than under it.
  let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
  for (const tile of tiles) {
    const { x, y } = hexToWorld(tile.coord, HEX_CONSTANTS.HEX_SIZE);
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  const pad = HEX_CONSTANTS.HEX_SIZE;
  const gridRect = tiles.length > 0
    ? new THREE.Vector4(minX - pad, minY - pad, maxX + pad, maxY + pad)
    : new THREE.Vector4(-1e6, -1e6, 1e6, 1e6);
  const hexWidth = HEX_CONSTANTS.HEX_SIZE * HEX_SCALE_X;

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uParchmentTex: { value: texture },
      uTint: { value: new THREE.Color(fill.tint) },
      uTextureTint: { value: new THREE.Color(fill.textureTint ?? '#ffffff') },
      uHasTexture: { value: texture ? 1.0 : 0.0 },
      uBackground: { value: new THREE.Color(palette.sceneBackground) },
      uGridRect: { value: gridRect },
      uVignetteWidth: { value: UNCHARTED_FILL_CONSTANTS.UNCHARTED_VIGNETTE_HEXES * hexWidth },
      uWorldSpan: { value: UNCHARTED_FILL_CONSTANTS.PARCHMENT_WORLD_SPAN },
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

  return { mesh, backgroundPlane, alphaBuffer, indexByKey, textureLoaded: texture !== null };
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
  // A palette whose fill is a flat tint keeps it (THR-1902).
  if (!getActivePalette().fogUnexploredFill.texture) return;
  // Update hex overlay shader uniform
  const mat = result.mesh.material as THREE.ShaderMaterial;
  mat.uniforms.uParchmentTex.value = texture;
  mat.uniforms.uHasTexture.value = 1.0;
  result.textureLoaded = true;
  // Background plane uses scene background color — no texture needed
}
