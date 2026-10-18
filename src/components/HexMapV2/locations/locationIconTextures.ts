/**
 * locationIconTextures.ts — the map's one icon texture path (THR-1878 plan D13, THR-1903).
 *
 * - buildMapIconTexture: rasterises any `IconShape` from `iconShape()` (THR-1885) to a
 *   THREE.CanvasTexture in the map's ink — outline pass first, then fill — scaled from the
 *   shape's own viewBox, so a carved 512-grid shape and a 100-grid drawing fill the same box.
 *   Place icons use it today; Trouble/Trade badges and the battle sprites (Lenses II) reuse it.
 *   No other code rasterises an icon for the map.
 * - buildLocationIconTexture: a place type's carved shape (`PLACE_ICON` → `iconShape`) in the
 *   near-black ink, or a lair/anomaly tint. An unknown type draws the `fallback` shape (Law 58).
 * - buildLocationIconTextureCache: one texture per registry type, built once at scene init.
 *
 * NFP #1 (tunability): texture size, ink and outline width are named constants.
 * NFP #4 (fail-soft): a malformed viewBox falls back to 100×100; an unknown place type draws
 *   the fallback shape and warns once — never a blank, never a throw.
 */

import * as THREE from 'three';
import { iconShape } from '../../shared/iconShape';
import { PLACE_ICON } from '../../../data/icons/conceptIcons';
import { FALLBACK_ICON_NAME, type IconShape } from '../../../data/icons/iconRegistry';

// ── NFP #1: Tunable constants ─────────────────────────────────────────────────

/**
 * Canvas rasterization resolution in pixels (power of 2 for GPU efficiency). 256 since THR-1903:
 * the carved silhouettes (village, medieval gate) carry detail that 128 px blurs when a
 * full-class icon draws at about 160 px (k = 20).
 */
export const LOCATION_TEXTURE_SIZE = 256;

/** Fill color for all location icon paths — same near-black as signifiers. */
export const LOCATION_FILL_COLOR = '#1a1a1a';

/** Outline stroke color for location icons — dark outline for legibility over terrain. */
export const LOCATION_OUTLINE_COLOR = '#0a0a0a';

/**
 * Outline pass width as a share of the shape's viewBox width — 2.5 on the old 100 grid,
 * 12.8 on the carved 512 grid, so the outline is the same on screen for both.
 */
export const LOCATION_OUTLINE_WIDTH_FRACTION = 0.025;

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

/** Source grid used when a shape's viewBox does not parse (NFP #4). */
const FALLBACK_VIEWBOX_EXTENT = 100;

// ── The one map icon builder ──────────────────────────────────────────────────

export interface MapIconTextureOptions {
  /** Canvas size in pixels. */
  size: number;
  /** Fill ink for every path. */
  fill: string;
  /** Outline ink, stroked under the fill. */
  outline: string;
  /** Outline width as a share of the shape's viewBox width. */
  outlineWidthFraction: number;
}

/** The map's default ink for an icon texture: near-black fill and outline, at 256 px. */
export const MAP_ICON_INK: MapIconTextureOptions = {
  size: LOCATION_TEXTURE_SIZE,
  fill: LOCATION_FILL_COLOR,
  outline: LOCATION_OUTLINE_COLOR,
  outlineWidthFraction: LOCATION_OUTLINE_WIDTH_FRACTION,
};

/**
 * What surrounds an icon on its texture (THR-1898): a ground painted first (a lens
 * badge's dark disc and ring, the siege's encirclement ring), and how far in the icon
 * sits, as a share of the canvas on each side. Both optional — a place icon has neither.
 */
export interface MapIconFrame {
  underlay?: (ctx: CanvasRenderingContext2D, size: number) => void;
  inset?: number;
}

/**
 * How a shape's viewBox maps onto a square canvas: the scale on each axis and the outline
 * width in viewBox units. Pure, so the "same box for any grid" rule is testable without a canvas.
 */
export function mapIconTransform(
  viewBox: string,
  size: number,
  outlineWidthFraction: number,
): { scaleX: number; scaleY: number; outlineWidth: number; vbW: number; vbH: number } {
  const parts = viewBox.split(/[\s,]+/).map(Number);
  const vbW = parts[2] > 0 ? parts[2] : FALLBACK_VIEWBOX_EXTENT;
  const vbH = parts[3] > 0 ? parts[3] : FALLBACK_VIEWBOX_EXTENT;
  return { scaleX: size / vbW, scaleY: size / vbH, outlineWidth: vbW * outlineWidthFraction, vbW, vbH };
}

/**
 * Rasterises any icon shape to a THREE.CanvasTexture in the map's ink (plan D13).
 * Pass 1 strokes every path with the outline ink; pass 2 fills on top. Per-path opacity
 * (our own layered drawings) is honoured; carved shapes are one path at opacity 1.
 */
export function buildMapIconTexture(
  shape: IconShape,
  opts: MapIconTextureOptions = MAP_ICON_INK,
  frame: MapIconFrame = {},
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = opts.size;
  canvas.height = opts.size;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    // NFP #4: no 2D context (a headless test canvas) — an empty texture, never a throw.
    const blank = new THREE.CanvasTexture(canvas);
    blank.needsUpdate = true;
    return blank;
  }

  // THR-1898: a badge or a siege ring paints its own ground first, then the icon
  // sits inside it, inset by `frame.inset` of the canvas on each side.
  frame.underlay?.(ctx, opts.size);
  const inset = Math.max(0, Math.min(0.45, frame.inset ?? 0)) * opts.size;
  const box = opts.size - inset * 2;
  const { scaleX, scaleY, outlineWidth } = mapIconTransform(shape.viewBox, box, opts.outlineWidthFraction);

  ctx.save();
  if (inset > 0) ctx.translate(inset, inset);
  ctx.scale(scaleX, scaleY);

  ctx.strokeStyle = opts.outline;
  ctx.lineWidth = outlineWidth;
  ctx.lineJoin = 'round';
  for (const path of shape.paths) {
    ctx.globalAlpha = path.opacity ?? 1;
    ctx.stroke(new Path2D(path.d));
  }

  ctx.fillStyle = opts.fill;
  for (const path of shape.paths) {
    ctx.globalAlpha = path.opacity ?? 1;
    ctx.fill(new Path2D(path.d));
  }
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// ── Places ────────────────────────────────────────────────────────────────────

/** Place types that drew the fallback in the current map build (reset per build). */
const placeIconFallbacks = new Set<string>();
/** Place types already warned about — warn once per page, not once per rebuild. */
const warnedPlaceTypes = new Set<string>();

function recordPlaceIconFallback(type: string, message: string): void {
  placeIconFallbacks.add(type);
  if (warnedPlaceTypes.has(type)) return;
  warnedPlaceTypes.add(type);
  console.warn(message);
}

/** Whether `type` has a place shape in `PLACE_ICON`. */
function hasPlaceIcon(type: string): type is keyof typeof PLACE_ICON {
  return Object.prototype.hasOwnProperty.call(PLACE_ICON, type);
}

/**
 * The carved shape a place type draws on the map: `iconShape(PLACE_ICON[type])`. A type with
 * no `PLACE_ICON` entry draws the `fallback` shape, warns once, and is listed in
 * `getPlaceIconStatus().fallbacks` (Law 58).
 */
export function placeIconShape(type: string): IconShape {
  if (hasPlaceIcon(type)) return iconShape(PLACE_ICON[type]);
  recordPlaceIconFallback(type, `[map] no place icon for location type "${type}"; drawing the fallback mark`);
  return iconShape(FALLBACK_ICON_NAME);
}

/** Records that a place type drew the fallback because the map registry has no entry for it. */
export function notePlaceIconFallback(type: string): void {
  recordPlaceIconFallback(type, `[map] no map icon entry for location type "${type}"; drawing the fallback mark at small`);
}

/**
 * Starts a new map build's fallback record, so `getPlaceIconStatus()` describes the places on
 * the map now — not every unknown type this page has ever seen (a new world after a wake).
 */
export function beginPlaceIconPass(): void {
  placeIconFallbacks.clear();
}

/** `__DEBUG.getMapChrome().placeIcons` — the place types that drew the fallback in the current build. */
export function getPlaceIconStatus(): { fallbacks: string[] } {
  return { fallbacks: [...placeIconFallbacks].sort() };
}

/** Test hook: forget which place types already fell back. */
export function resetPlaceIconFallbacksForTest(): void {
  placeIconFallbacks.clear();
  warnedPlaceTypes.clear();
}

/**
 * Rasterises a place type's carved shape in the map's ink.
 *
 * @param type              Location type (a `PLACE_ICON` key; anything else draws `fallback`)
 * @param size              Canvas size in pixels (default: LOCATION_TEXTURE_SIZE)
 * @param fillColorOverride Optional fill — lair sphere tints and the cleared-lair fill.
 */
export function buildLocationIconTexture(
  type: string,
  size: number = LOCATION_TEXTURE_SIZE,
  fillColorOverride?: string,
): THREE.CanvasTexture {
  return buildMapIconTexture(placeIconShape(type), {
    ...MAP_ICON_INK,
    size,
    fill: fillColorOverride ?? LOCATION_FILL_COLOR,
  });
}

/** Texture-cache key for the fallback mark an unknown place type draws. */
export const PLACE_FALLBACK_TEXTURE_KEY = 'fallback';

/**
 * Builds a texture cache for an entire location icon registry, plus the fallback mark.
 * Key format: LocationType string (one texture per location type, no variants).
 *
 * Called once at scene init — no per-frame cost.
 * All textures remain alive for the scene's lifetime.
 */
export function buildLocationIconTextureCache(
  registry: Record<string, unknown>,
): Map<string, THREE.CanvasTexture> {
  const cache = new Map<string, THREE.CanvasTexture>();
  for (const locationType of Object.keys(registry)) {
    cache.set(locationType, buildLocationIconTexture(locationType));
  }
  cache.set(PLACE_FALLBACK_TEXTURE_KEY, buildMapIconTexture(iconShape(FALLBACK_ICON_NAME)));
  return cache;
}
