/**
 * SignifierMesh.ts — Three.js scene module for landscape signifier sprites.
 *
 * Places one THREE.Sprite per land hex using the signifier registry.
 * Sprites are textured from CanvasTextures built once at startup.
 * Seeded jitter and rotation are applied per hex using getSignifierParams.
 *
 * Follows the CoastlineMesh pattern: factory function returns THREE.Group,
 * all tunable values are named constants.
 *
 * NFP #1 (tunability): SIGNIFIER_SPRITE_SCALE and SIGNIFIER_Z are named constants.
 * NFP #3 (determinism): sprite placement uses getSignifierParams (mulberry32 seeded).
 * NFP #4 (fail-soft): unknown terrain types, missing textures, and water tiles all
 *   silently skip — never crash the scene.
 */

import * as THREE from 'three';
import type { HexTile } from '../../../types';
import { hexToPixel } from '../../../lib/hexMath';
import { RENDER_ORDER } from './RenderLayers';
import { HEX_CONSTANTS } from './HexFillMesh';
import {
  SIGNIFIER_REGISTRY,
  TERRAIN_SIGNIFIER_FALLBACK,
  getSignifierParams,
} from '../signifiers/signifierRegistry';
import { buildSignifierTextureCache } from '../signifiers/signifierTextures';

// ── NFP #1: Tunable constants ────────────────────────────────────────────────

/** Sprite world-size as a fraction of HEX_SIZE (flat-top hex radius). */
export const SIGNIFIER_SPRITE_SCALE = 0.7;

/** Z offset for signifier sprites — above borders (0.06), below location overlays. */
export const SIGNIFIER_Z = 0.07;

// ── Water terrain types (no signifiers) ─────────────────────────────────────

/**
 * Terrain types that should never receive a signifier sprite.
 * All are water/aquatic surfaces where land icons would be incorrect.
 */
const WATER_TYPES = new Set<string>([
  'ocean',
  'deep_ocean',
  'tropical_ocean',
  'coastal_shallows',
  'coast',
  'lake',
  'river',
  'reef',
]);

// ── Scene Module Factory ─────────────────────────────────────────────────────

/**
 * Creates a THREE.Group containing one Sprite per land hex.
 *
 * @param tiles  Full grid of hex tiles from worldgen
 * @param seed   World seed — used for deterministic jitter and variant selection
 * @returns      THREE.Group at RENDER_ORDER.SIGNIFIERS (7)
 *
 * NFP #4: Returns empty Group if tiles is empty or all tiles are water.
 * NFP #7: One Sprite per land hex — acceptable for up to 60K tiles.
 *         A future optimization pass can use InstancedMesh if profiling reveals issues.
 */
export function createSignifierMesh(tiles: HexTile[], seed: number): THREE.Group {
  const group = new THREE.Group();
  group.renderOrder = RENDER_ORDER.SIGNIFIERS;

  // Build texture cache once at scene init (no per-frame cost)
  const textureCache = buildSignifierTextureCache(SIGNIFIER_REGISTRY);

  const spriteSize = HEX_CONSTANTS.HEX_SIZE * SIGNIFIER_SPRITE_SCALE;

  for (const tile of tiles) {
    // NFP #4: Skip water tiles — no signifier for aquatic terrain
    if (WATER_TYPES.has(tile.terrain)) continue;

    // Resolve terrain type to a registry key (direct or fallback)
    let registryKey: string = tile.terrain;
    if (!SIGNIFIER_REGISTRY[registryKey]) {
      registryKey = TERRAIN_SIGNIFIER_FALLBACK[registryKey] ?? '';
    }
    // NFP #4: Unknown terrain type — silently skip, never crash
    if (!registryKey || !SIGNIFIER_REGISTRY[registryKey]) continue;

    const variants = SIGNIFIER_REGISTRY[registryKey];
    const params = getSignifierParams(tile.coord.col, tile.coord.row, seed, variants.length);

    const texKey = `${registryKey}:${params.variantIndex}`;
    const texture = textureCache.get(texKey);
    // NFP #4: Missing texture — silently skip
    if (!texture) continue;

    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    });
    material.rotation = params.rotation;

    const sprite = new THREE.Sprite(material);

    const { x, y } = hexToPixel(tile.coord, HEX_CONSTANTS.HEX_SIZE);

    // Apply seeded jitter (±10% of hex size in each axis)
    const jx = params.jitterX * HEX_CONSTANTS.HEX_SIZE;
    const jy = params.jitterY * HEX_CONSTANTS.HEX_SIZE;

    // Y-flip: SVG is y-down, Three.js world is y-up
    sprite.position.set(x + jx, -y + jy, SIGNIFIER_Z);
    sprite.scale.set(spriteSize, spriteSize, 1);

    group.add(sprite);
  }

  return group;
}
