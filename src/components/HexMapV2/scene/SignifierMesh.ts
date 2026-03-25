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

/** Default sprite world-size as a fraction of HEX_SIZE (flat-top hex radius). */
export const SIGNIFIER_SPRITE_SCALE = 1.3;

/** Per-terrain scale overrides — terrain types that need to fill the hex more fully. */
export const SIGNIFIER_SCALE_OVERRIDES: Record<string, number> = {
  badlands: 2.0,
  grassland: 2.0,
  steppe: 2.0,
  tundra: 2.0,
  boreal_forest: 1.3 * 0.9, // 10% smaller than default for better centering
};

/** Per-terrain position offset (fraction of HEX_SIZE) for hand-tuned centering. */
export const SIGNIFIER_OFFSET_OVERRIDES: Record<string, { dx: number; dy: number }> = {
  boreal_forest: { dx: -0.05, dy: -0.05 }, // nudge left and down (y-flipped, so -dy = down)
};

/** Hand-drawn signifiers that are already precisely positioned — no jitter applied. */
const NO_JITTER_TYPES = new Set<string>([
  'boreal_forest',
  'dead_forest',
]);

/** Z offset for signifier sprites — above borders (0.06), below location overlays. */
export const SIGNIFIER_Z = 0.07;

// ── Excluded terrain types (no signifiers) ───────────────────────────────────

/**
 * Terrain types that should never receive a signifier sprite.
 * Water/aquatic surfaces and plateau (which relies on elevation ticks only).
 */
const EXCLUDED_TYPES = new Set<string>([
  'ocean',
  'deep_ocean',
  'tropical_ocean',
  'coastal_shallows',
  'coast',
  'lake',
  'river',
  'reef',
  'plateau',
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
export function createSignifierMesh(
  tiles: HexTile[],
  seed: number,
  centeredLocationHexes?: Set<string>,
): THREE.Group {
  const group = new THREE.Group();
  group.renderOrder = RENDER_ORDER.SIGNIFIERS;

  // Build texture cache once at scene init (no per-frame cost)
  const textureCache = buildSignifierTextureCache(SIGNIFIER_REGISTRY);

  for (const tile of tiles) {
    // NFP #4: Skip water tiles — no signifier for aquatic terrain
    if (EXCLUDED_TYPES.has(tile.terrain)) continue;

    // Skip hexes with centered (full/medium) location icons to avoid overlap
    if (centeredLocationHexes?.has(`${tile.coord.col},${tile.coord.row}`)) continue;

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

    // Apply seeded jitter (±10% of hex size in each axis) — skip for hand-drawn icons
    const noJitter = NO_JITTER_TYPES.has(registryKey);
    const jx = noJitter ? 0 : params.jitterX * HEX_CONSTANTS.HEX_SIZE;
    const jy = noJitter ? 0 : params.jitterY * HEX_CONSTANTS.HEX_SIZE;

    // Per-terrain offset override for hand-tuned centering
    const offsetOverride = SIGNIFIER_OFFSET_OVERRIDES[registryKey];
    const ox = offsetOverride ? offsetOverride.dx * HEX_CONSTANTS.HEX_SIZE : 0;
    const oy = offsetOverride ? offsetOverride.dy * HEX_CONSTANTS.HEX_SIZE : 0;

    // Per-terrain scale override (e.g. badlands fills full hex)
    const scale = SIGNIFIER_SCALE_OVERRIDES[registryKey] ?? SIGNIFIER_SPRITE_SCALE;
    const spriteSize = HEX_CONSTANTS.HEX_SIZE * scale;

    // Y-flip: SVG is y-down, Three.js world is y-up
    sprite.position.set(x + jx + ox, -y + jy + oy, SIGNIFIER_Z);
    sprite.scale.set(spriteSize, spriteSize, 1);

    group.add(sprite);
  }

  return group;
}
