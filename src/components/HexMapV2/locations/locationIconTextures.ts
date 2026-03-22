/**
 * locationIconTextures.ts — SVG path data to Three.js CanvasTexture conversion for location icons.
 *
 * Follows the signifierTextures.ts pattern exactly:
 * - buildLocationIconTexture: rasterizes a single LocationIconDef to a THREE.CanvasTexture
 * - buildLocationIconTextureCache: builds textures for all registry entries once at startup
 *
 * NFP #1 (tunability): LOCATION_TEXTURE_SIZE is a named constant.
 * NFP #4 (fail-soft): buildLocationIconTexture returns valid (empty) texture for invalid viewBox.
 */

import * as THREE from 'three';
import type { LocationIconDef } from './locationIconRegistry';

// ── NFP #1: Tunable constants ─────────────────────────────────────────────────

/** Canvas rasterization resolution in pixels (power of 2 for GPU efficiency). */
export const LOCATION_TEXTURE_SIZE = 128;

/** Fill color for all location icon paths — same near-black as signifiers. */
const LOCATION_FILL_COLOR = '#1a1a1a';

// ── Texture builders ──────────────────────────────────────────────────────────

/**
 * Rasterizes a single LocationIconDef to a THREE.CanvasTexture.
 *
 * Draws all paths with per-path opacity onto a transparent canvas,
 * scaling from viewBox coordinates to the target pixel size.
 *
 * NFP #4: If viewBox is malformed, falls back to 100×100 source dimensions.
 */
export function buildLocationIconTexture(
  def: LocationIconDef,
  size: number = LOCATION_TEXTURE_SIZE,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Parse viewBox: "minX minY width height" — use width/height for scaling
  const parts = def.viewBox.split(' ').map(Number);
  const vbW = parts[2] || 100;
  const vbH = parts[3] || 100;
  const scaleX = size / vbW;
  const scaleY = size / vbH;

  ctx.save();
  ctx.scale(scaleX, scaleY);
  for (const path of def.paths) {
    ctx.globalAlpha = path.opacity;
    ctx.fillStyle = LOCATION_FILL_COLOR;
    ctx.fill(new Path2D(path.d));
  }
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

/**
 * Builds a texture cache for an entire location icon registry.
 * Key format: LocationType string (one texture per location type, no variants).
 *
 * Called once at scene init — no per-frame cost.
 * All textures remain alive for the scene's lifetime.
 */
export function buildLocationIconTextureCache(
  registry: Record<string, LocationIconDef>,
): Map<string, THREE.CanvasTexture> {
  const cache = new Map<string, THREE.CanvasTexture>();
  for (const [locationType, def] of Object.entries(registry)) {
    cache.set(locationType, buildLocationIconTexture(def));
  }
  return cache;
}
