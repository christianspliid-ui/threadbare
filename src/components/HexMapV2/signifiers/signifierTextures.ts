/**
 * signifierTextures.ts — SVG path data to Three.js CanvasTexture conversion.
 *
 * Rasterizes SignifierVariant path data using the Canvas 2D API with Path2D,
 * producing THREE.CanvasTexture objects. All textures are built once at startup
 * via buildSignifierTextureCache — no per-frame CPU cost.
 *
 * NFP #1 (tunability): SIGNIFIER_TEXTURE_SIZE and SIGNIFIER_FILL_COLOR are named constants.
 * NFP #4 (fail-soft): buildSignifierTexture returns a valid (empty) texture for invalid viewBox.
 */

import * as THREE from 'three';
import type { SignifierVariant, SignifierRegistry } from './signifierRegistry';

// ── NFP #1: Tunable constants ────────────────────────────────────────────────

/** Canvas rasterization resolution in pixels (power of 2 for GPU efficiency). */
export const SIGNIFIER_TEXTURE_SIZE = 128;

/**
 * Fill color for all signifier paths.
 * Per locked art-direction decision: pure near-black silhouettes with per-path opacity.
 */
export const SIGNIFIER_FILL_COLOR = '#1a1a1a';

// ── Texture builders ─────────────────────────────────────────────────────────

/**
 * Rasterizes a single SignifierVariant to a THREE.CanvasTexture.
 *
 * Draws all paths with per-path opacity onto a transparent canvas,
 * scaling from viewBox coordinates to the target pixel size.
 *
 * NFP #4: If viewBox is malformed, falls back to 100×100 source dimensions.
 */
export function buildSignifierTexture(
  variant: SignifierVariant,
  size: number = SIGNIFIER_TEXTURE_SIZE,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Parse viewBox: "minX minY width height" — use width/height for scaling
  const parts = variant.viewBox.split(' ').map(Number);
  const vbW = parts[2] || 100;
  const vbH = parts[3] || 100;
  const scaleX = size / vbW;
  const scaleY = size / vbH;

  ctx.save();
  ctx.scale(scaleX, scaleY);
  for (const path of variant.paths) {
    ctx.globalAlpha = path.opacity;
    ctx.fillStyle = SIGNIFIER_FILL_COLOR;
    ctx.fill(new Path2D(path.d));
  }
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

/**
 * Builds a texture cache for an entire SignifierRegistry.
 * Key format: `${terrainType}:${variantIndex}`.
 *
 * Called once at scene init — no per-frame cost.
 * All textures remain alive for the scene's lifetime.
 */
export function buildSignifierTextureCache(
  registry: SignifierRegistry,
): Map<string, THREE.CanvasTexture> {
  const cache = new Map<string, THREE.CanvasTexture>();
  for (const [terrain, variants] of Object.entries(registry)) {
    for (let i = 0; i < variants.length; i++) {
      const key = `${terrain}:${i}`;
      cache.set(key, buildSignifierTexture(variants[i]));
    }
  }
  return cache;
}
