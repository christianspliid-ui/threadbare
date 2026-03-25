/**
 * SignifierMesh.ts — Three.js scene module for landscape signifier sprites.
 *
 * Uses InstancedMesh per terrain type with a texture atlas — collapses ~4K
 * draw calls to ~20 (one per terrain type with signifiers).
 *
 * Each terrain type's variants are composited into a single atlas texture.
 * Per-instance UV rect attributes select the correct variant from the atlas.
 * Per-instance fog alpha enables fog culling without toggling instance visibility.
 *
 * NFP #1 (tunability): SIGNIFIER_SPRITE_SCALE and SIGNIFIER_Z are named constants.
 * NFP #3 (determinism): sprite placement uses getSignifierParams (mulberry32 seeded).
 * NFP #4 (fail-soft): unknown terrain types, missing textures, and water tiles all
 *   silently skip — never crash the scene.
 * NFP #7 (performance): InstancedMesh per terrain type — ~20 draw calls vs ~4K sprites.
 */

import * as THREE from 'three';
import type { HexTile } from '../../../types';
import { hexKeyFromCoord } from '../../../lib/hexKey';
import { hexToWorld } from '../../../lib/worldPosition';
import { RENDER_ORDER } from './RenderLayers';
import { HEX_CONSTANTS } from './HexFillMesh';
import {
  SIGNIFIER_REGISTRY,
  TERRAIN_SIGNIFIER_FALLBACK,
  getSignifierParams,
} from '../signifiers/signifierRegistry';
import { buildSignifierTexture, SIGNIFIER_TEXTURE_SIZE } from '../signifiers/signifierTextures';

// ── NFP #1: Tunable constants ────────────────────────────────────────────────

/** Default sprite world-size as a fraction of HEX_SIZE (flat-top hex radius). */
export const SIGNIFIER_SPRITE_SCALE = 1.3;

/** Per-terrain scale overrides — terrain types that need to fill the hex more fully. */
export const SIGNIFIER_SCALE_OVERRIDES: Record<string, number> = {
  badlands: 2.0,
  grassland: 2.0,
  steppe: 2.0,
  tundra: 2.0,
  boreal_forest: 1.3 * 0.9,
};

/** Per-terrain position offset (fraction of HEX_SIZE) for hand-tuned centering. */
export const SIGNIFIER_OFFSET_OVERRIDES: Record<string, { dx: number; dy: number }> = {
  boreal_forest: { dx: -0.05, dy: -0.05 },
};

/** Hand-drawn signifiers that are already precisely positioned — no jitter applied. */
const NO_JITTER_TYPES = new Set<string>([
  'boreal_forest',
  'dead_forest',
]);

/** Z offset for signifier sprites — above borders (0.06), below location overlays. */
export const SIGNIFIER_Z = 0.07;

/** Padding between atlas cells to prevent texture bleed. */
const ATLAS_PADDING_PX = 2;

/** Minimum atlas dimension. */
const ATLAS_MIN_SIZE = 64;

// ── Excluded terrain types ───────────────────────────────────────────────────

const EXCLUDED_TYPES = new Set<string>([
  'ocean', 'deep_ocean', 'tropical_ocean', 'coastal_shallows',
  'coast', 'lake', 'river', 'reef', 'plateau',
]);

// ── Custom ShaderMaterial ────────────────────────────────────────────────────

const VERTEX_SHADER = `
  attribute vec4 aUvRect;
  attribute float aFogAlpha;
  varying vec2 vUv;
  varying float vFogAlpha;

  void main() {
    vUv = uv * aUvRect.zw + aUvRect.xy;
    vFogAlpha = aFogAlpha;
    vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAGMENT_SHADER = `
  uniform sampler2D uAtlas;
  varying vec2 vUv;
  varying float vFogAlpha;

  void main() {
    vec4 texel = texture2D(uAtlas, vUv);
    if (texel.a < 0.01) discard;
    texel.a *= vFogAlpha;
    if (texel.a < 0.01) discard;
    gl_FragColor = texel;
  }
`;

// ── Atlas Builder ────────────────────────────────────────────────────────────

interface AtlasResult {
  texture: THREE.CanvasTexture;
  /** UV rects for each variant: [uOffset, vOffset, uScale, vScale] */
  uvRects: [number, number, number, number][];
}

/**
 * Builds a texture atlas for a set of signifier variants.
 * Variants are laid out side by side horizontally.
 */
function buildAtlas(
  terrainKey: string,
  variantCount: number,
): AtlasResult | null {
  const variants = SIGNIFIER_REGISTRY[terrainKey];
  if (!variants || variants.length === 0) return null;

  const texSize = SIGNIFIER_TEXTURE_SIZE;
  const cellSize = texSize + ATLAS_PADDING_PX;
  const atlasWidth = Math.max(ATLAS_MIN_SIZE, variantCount * cellSize);
  const atlasHeight = Math.max(ATLAS_MIN_SIZE, texSize);

  const canvas = document.createElement('canvas');
  canvas.width = atlasWidth;
  canvas.height = atlasHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const uvRects: [number, number, number, number][] = [];

  for (let i = 0; i < variantCount; i++) {
    // Build individual variant texture and draw it onto the atlas
    const variantTex = buildSignifierTexture(variants[i], texSize);
    const variantCanvas = variantTex.image as HTMLCanvasElement;

    const xOffset = i * cellSize;
    ctx.drawImage(variantCanvas, xOffset, 0, texSize, texSize);

    // UV rect: uOffset, vOffset, uScale, vScale
    uvRects.push([
      xOffset / atlasWidth,       // uOffset
      0,                          // vOffset
      texSize / atlasWidth,       // uScale
      texSize / atlasHeight,      // vScale
    ]);

    // Dispose the individual texture (we've drawn it onto the atlas)
    variantTex.dispose();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  return { texture, uvRects };
}

// ── Hex data pre-processing ──────────────────────────────────────────────────

interface HexInstance {
  wx: number;
  wy: number;
  scale: number;
  rotation: number;
  variantIndex: number;
  hexKey: string;
}

/**
 * Groups qualifying hex tiles by resolved terrain type and computes
 * per-instance position, scale, rotation, and variant.
 */
function groupTilesByTerrain(
  tiles: HexTile[],
  seed: number,
  centeredLocationHexes?: Set<string>,
): Map<string, HexInstance[]> {
  const groups = new Map<string, HexInstance[]>();

  for (const tile of tiles) {
    if (EXCLUDED_TYPES.has(tile.terrain)) continue;
    if (centeredLocationHexes?.has(hexKeyFromCoord(tile.coord))) continue;

    let registryKey: string = tile.terrain;
    if (!SIGNIFIER_REGISTRY[registryKey]) {
      registryKey = TERRAIN_SIGNIFIER_FALLBACK[registryKey] ?? '';
    }
    if (!registryKey || !SIGNIFIER_REGISTRY[registryKey]) continue;

    const variants = SIGNIFIER_REGISTRY[registryKey];
    const params = getSignifierParams(tile.coord.col, tile.coord.row, seed, variants.length);

    const { x: wx, y: wy } = hexToWorld(tile.coord, HEX_CONSTANTS.HEX_SIZE);

    const noJitter = NO_JITTER_TYPES.has(registryKey);
    const jx = noJitter ? 0 : params.jitterX * HEX_CONSTANTS.HEX_SIZE;
    const jy = noJitter ? 0 : params.jitterY * HEX_CONSTANTS.HEX_SIZE;

    const offsetOverride = SIGNIFIER_OFFSET_OVERRIDES[registryKey];
    const ox = offsetOverride ? offsetOverride.dx * HEX_CONSTANTS.HEX_SIZE : 0;
    const oy = offsetOverride ? offsetOverride.dy * HEX_CONSTANTS.HEX_SIZE : 0;

    const scale = SIGNIFIER_SCALE_OVERRIDES[registryKey] ?? SIGNIFIER_SPRITE_SCALE;
    const spriteSize = HEX_CONSTANTS.HEX_SIZE * scale;

    if (!groups.has(registryKey)) groups.set(registryKey, []);
    groups.get(registryKey)!.push({
      wx: wx + jx + ox,
      wy: wy + jy + oy,
      scale: spriteSize,
      rotation: params.rotation,
      variantIndex: params.variantIndex,
      hexKey: hexKeyFromCoord(tile.coord),
    });
  }

  return groups;
}

// ── Scene Module Factory ─────────────────────────────────────────────────────

/**
 * Metadata about the instanced signifier group, exposed for fog culling.
 */
export interface SignifierGroupMeta {
  /** Maps hex key → { terrainKey, instanceIndex } for fog alpha updates */
  hexInstanceMap: Map<string, { terrainKey: string; instanceIndex: number }>;
  /** Maps terrain key → InstancedMesh for direct buffer access */
  meshMap: Map<string, THREE.InstancedMesh>;
  /** Updates the fog alpha for a specific hex. Call after changing visibility. */
  setFogAlpha: (hexKey: string, alpha: number) => void;
  /** Marks all fog alpha buffers as needing GPU upload. Call once after batch updates. */
  flushFogAlpha: () => void;
}

/**
 * Creates a THREE.Group containing one InstancedMesh per terrain type.
 *
 * @param tiles  Full grid of hex tiles from worldgen
 * @param seed   World seed — used for deterministic jitter and variant selection
 * @param centeredLocationHexes  Hex keys with centered location icons (skip signifiers)
 * @returns      { group, meta } — group at RENDER_ORDER.SIGNIFIERS, meta for fog culling
 */
export function createSignifierMesh(
  tiles: HexTile[],
  seed: number,
  centeredLocationHexes?: Set<string>,
): THREE.Group & { meta?: SignifierGroupMeta } {
  const group = new THREE.Group() as THREE.Group & { meta?: SignifierGroupMeta };
  group.renderOrder = RENDER_ORDER.SIGNIFIERS;

  if (tiles.length === 0) return group;

  const terrainGroups = groupTilesByTerrain(tiles, seed, centeredLocationHexes);
  if (terrainGroups.size === 0) return group;

  const hexInstanceMap = new Map<string, { terrainKey: string; instanceIndex: number }>();
  const meshMap = new Map<string, THREE.InstancedMesh>();
  const fogBuffers = new Map<string, Float32Array>();

  // Shared quad geometry for all InstancedMeshes (1×1 plane)
  const quadGeometry = new THREE.PlaneGeometry(1, 1);

  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();

  for (const [terrainKey, instances] of terrainGroups) {
    const variants = SIGNIFIER_REGISTRY[terrainKey];
    if (!variants || variants.length === 0) continue;

    const atlas = buildAtlas(terrainKey, variants.length);
    if (!atlas) continue;

    const instanceCount = instances.length;

    // Create custom shader material for this terrain type's atlas
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uAtlas: { value: atlas.texture },
      },
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.InstancedMesh(quadGeometry, material, instanceCount);
    mesh.renderOrder = RENDER_ORDER.SIGNIFIERS;
    mesh.frustumCulled = true;

    // Per-instance UV rect attribute (vec4)
    const uvRectData = new Float32Array(instanceCount * 4);
    // Per-instance fog alpha attribute (float)
    const fogAlphaData = new Float32Array(instanceCount);

    for (let i = 0; i < instanceCount; i++) {
      const inst = instances[i];

      // Set instance matrix: position + rotation + scale
      position.set(inst.wx, inst.wy, SIGNIFIER_Z);
      quaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), inst.rotation);
      scale.set(inst.scale, inst.scale, 1);
      matrix.compose(position, quaternion, scale);
      mesh.setMatrixAt(i, matrix);

      // Set UV rect for variant selection
      const uvRect = atlas.uvRects[inst.variantIndex];
      uvRectData[i * 4 + 0] = uvRect[0]; // uOffset
      uvRectData[i * 4 + 1] = uvRect[1]; // vOffset
      uvRectData[i * 4 + 2] = uvRect[2]; // uScale
      uvRectData[i * 4 + 3] = uvRect[3]; // vScale

      // Default fog alpha = 1.0 (fully visible)
      fogAlphaData[i] = 1.0;

      // Track hex key → instance for fog updates
      hexInstanceMap.set(inst.hexKey, { terrainKey, instanceIndex: i });
    }

    // Attach instanced buffer attributes
    mesh.geometry.setAttribute('aUvRect',
      new THREE.InstancedBufferAttribute(uvRectData, 4));
    mesh.geometry.setAttribute('aFogAlpha',
      new THREE.InstancedBufferAttribute(fogAlphaData, 1));

    mesh.instanceMatrix.needsUpdate = true;

    group.add(mesh);
    meshMap.set(terrainKey, mesh);
    fogBuffers.set(terrainKey, fogAlphaData);
  }

  // Build meta for fog culling
  group.meta = {
    hexInstanceMap,
    meshMap,
    setFogAlpha(hexKey: string, alpha: number) {
      const entry = hexInstanceMap.get(hexKey);
      if (!entry) return;
      const buffer = fogBuffers.get(entry.terrainKey);
      if (!buffer) return;
      buffer[entry.instanceIndex] = alpha;
    },
    flushFogAlpha() {
      for (const [terrainKey, mesh] of meshMap) {
        const attr = mesh.geometry.getAttribute('aFogAlpha') as THREE.InstancedBufferAttribute;
        if (attr) attr.needsUpdate = true;
      }
    },
  };

  return group;
}
