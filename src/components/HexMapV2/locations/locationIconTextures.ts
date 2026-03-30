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

/** Outline stroke color for location icons — dark outline for legibility over terrain. */
const LOCATION_OUTLINE_COLOR = '#0a0a0a';

/** Fixed fill color for cleared lair icons — desaturated, muted relative to terrain. */
export const CLEARED_LAIR_FILL_COLOR = '#2a2520';

/**
 * Sphere-darkened fill colors for active lair icons.
 * Base sphere colors darkened to 30–35% lightness in HSL for silhouette readability.
 * NFP #1: all values are named constants — change sphere identity, change this map.
 */
export const LAIR_SPHERE_FILL_COLORS: Record<string, string> = {
  force:   '#5c1010',
  matter:  '#3d2f1f',
  energy:  '#5c4e00',
  life:    '#004d1f',
  mind:    '#0d3366',
  spirit:  '#3d1a52',
  time:    '#5c3800',
  entropy: '#1f3330',
};

/** Outline stroke width in viewBox units (scaled with the icon). */
const LOCATION_OUTLINE_WIDTH = 2.5;

// ── Texture builders ──────────────────────────────────────────────────────────

/**
 * Rasterizes a single LocationIconDef to a THREE.CanvasTexture.
 *
 * Draws all paths with per-path opacity onto a transparent canvas,
 * scaling from viewBox coordinates to the target pixel size.
 *
 * @param def              Icon definition (paths, viewBox, sizeClass)
 * @param size             Canvas size in pixels (default: LOCATION_TEXTURE_SIZE)
 * @param fillColorOverride Optional fill color override — used for lair sphere tints.
 *                          When provided, replaces LOCATION_FILL_COLOR for all fill passes.
 *
 * NFP #4: If viewBox is malformed, falls back to 100×100 source dimensions.
 */
export function buildLocationIconTexture(
  def: LocationIconDef,
  size: number = LOCATION_TEXTURE_SIZE,
  fillColorOverride?: string,
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

  const fillColor = fillColorOverride ?? LOCATION_FILL_COLOR;

  ctx.save();
  ctx.scale(scaleX, scaleY);

  // Pass 1: stroke outlines (drawn first so fill renders on top)
  ctx.strokeStyle = LOCATION_OUTLINE_COLOR;
  ctx.lineWidth = LOCATION_OUTLINE_WIDTH;
  ctx.lineJoin = 'round';
  for (const path of def.paths) {
    ctx.globalAlpha = path.opacity;
    ctx.stroke(new Path2D(path.d));
  }

  // Pass 2: fill paths on top of outlines
  for (const path of def.paths) {
    ctx.globalAlpha = path.opacity;
    ctx.fillStyle = fillColor;
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
