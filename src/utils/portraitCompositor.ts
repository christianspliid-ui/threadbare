/**
 * portraitCompositor.ts — Canvas compositing for ascendant portraits.
 *
 * Combines an origin portrait (mortal face) with a sphere frame (divine border)
 * into a single image. Results are cached per originId+sphere key.
 *
 * Two output modes:
 *   - Full: rectangular portrait with frame overlay (for character sheet)
 *   - Circular: head-region crop in a circle (for hex map / identity chip)
 *
 * Cache must be owned per session (SimulationRuntime), not module scope.
 * See architectural decision: "Engine caches must be owned per session."
 *
 * NFP #1: Dimensions and crop offsets are named constants.
 * NFP #4: Fails soft — returns null on load error, callers fall back.
 */

import { getOriginPortraitUrl, getSphereFrameUrl } from '../data/avatar-portrait-assets';
import type { SphereName } from '../types';

// ── Constants (NFP #1: tunability) ──────────────────────────────────────────

/** Full composed portrait width in pixels */
export const PORTRAIT_FULL_WIDTH = 512;
/** Full composed portrait height in pixels */
export const PORTRAIT_FULL_HEIGHT = 640;
/** Vertical offset for circular crop — shifts crop window down to center on head region (fraction of image height) */
const CIRCULAR_CROP_Y_OFFSET = 0.1;
/** Luminance threshold below which frame pixels become fully transparent (0-255) */
const FRAME_BLACK_THRESHOLD = 30;
/** Luminance range over which frame pixels fade from transparent to opaque */
const FRAME_FADE_RANGE = 20;

// ── Image Loader ────────────────────────────────────────────────────────────

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

// ── Frame Alpha Conversion ─────────────────────────────────────────────────

/**
 * Convert dark pixels in a frame image to transparent.
 * JPG frames have near-black (not transparent) centers — this converts
 * pixels below a luminance threshold to alpha=0, with a smooth fade.
 */
function frameToAlpha(frameImg: HTMLImageElement, width: number, height: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(frameImg, 0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    // Perceived luminance (fast approximation)
    const lum = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
    if (lum < FRAME_BLACK_THRESHOLD) {
      d[i + 3] = 0; // fully transparent
    } else if (lum < FRAME_BLACK_THRESHOLD + FRAME_FADE_RANGE) {
      // smooth fade from transparent to opaque
      d[i + 3] = Math.round(255 * (lum - FRAME_BLACK_THRESHOLD) / FRAME_FADE_RANGE);
    }
    // else: keep original alpha (255 for JPG)
  }
  ctx.putImageData(imageData, 0, 0);
  return c;
}

// ── Compositing Functions ───────────────────────────────────────────────────

/**
 * Compose a full rectangular portrait: origin portrait + sphere frame overlay.
 * Returns an HTMLCanvasElement or null on load failure.
 */
export async function composePortrait(
  originFragmentId: string,
  primarySphere: SphereName,
  width: number = PORTRAIT_FULL_WIDTH,
  height: number = PORTRAIT_FULL_HEIGHT,
): Promise<HTMLCanvasElement | null> {
  const portraitUrl = getOriginPortraitUrl(originFragmentId);
  const frameUrl = getSphereFrameUrl(primarySphere);

  try {
    const [portraitImg, frameImg] = await Promise.all([
      loadImage(portraitUrl),
      loadImage(frameUrl),
    ]);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Layer 1: origin portrait (fills canvas)
    ctx.drawImage(portraitImg, 0, 0, width, height);

    // Layer 2: sphere frame — convert dark pixels to transparent, then overlay
    const alphaFrame = frameToAlpha(frameImg, width, height);
    ctx.drawImage(alphaFrame, 0, 0);

    return canvas;
  } catch {
    // NFP #4: fail-soft — return null, caller falls back to legacy portrait
    return null;
  }
}

/**
 * Compose a circular crop of the portrait, centered on the head region.
 * Used for hex map agent icons and identity chip thumbnails.
 * Returns an HTMLCanvasElement or null on load failure.
 */
export async function composePortraitCircular(
  originFragmentId: string,
  primarySphere: SphereName,
  diameter: number = 128,
): Promise<HTMLCanvasElement | null> {
  const full = await composePortrait(originFragmentId, primarySphere);
  if (!full) return null;

  const canvas = document.createElement('canvas');
  canvas.width = diameter;
  canvas.height = diameter;
  const ctx = canvas.getContext('2d')!;

  const radius = diameter / 2;

  // Circular clip
  ctx.beginPath();
  ctx.arc(radius, radius, radius, 0, Math.PI * 2);
  ctx.clip();

  // Cover crop from head region of the full portrait
  const srcSize = full.width;
  const srcY = full.height * CIRCULAR_CROP_Y_OFFSET;
  ctx.drawImage(full, 0, srcY, srcSize, srcSize, 0, 0, diameter, diameter);

  return canvas;
}

// ── Per-Session Cache ───────────────────────────────────────────────────────

export interface PortraitCache {
  /** Get or compose a full rectangular portrait. Returns cached canvas or null on failure. */
  getComposed(originFragmentId: string, primarySphere: SphereName): Promise<HTMLCanvasElement | null>;
  /** Get or compose a circular crop. Returns cached canvas or null on failure. */
  getCircular(originFragmentId: string, primarySphere: SphereName, diameter?: number): Promise<HTMLCanvasElement | null>;
  /** Clear all cached canvases (call on session end). */
  clear(): void;
}

/**
 * Creates a per-session portrait cache.
 * Attach to SimulationRuntime so it's scoped to the current playthrough.
 */
export function createPortraitCache(): PortraitCache {
  const composedCache = new Map<string, HTMLCanvasElement | null>();
  const circularCache = new Map<string, HTMLCanvasElement | null>();

  return {
    async getComposed(originFragmentId, primarySphere) {
      const key = `${originFragmentId}-${primarySphere}`;
      if (composedCache.has(key)) return composedCache.get(key)!;
      const result = await composePortrait(originFragmentId, primarySphere);
      composedCache.set(key, result);
      return result;
    },

    async getCircular(originFragmentId, primarySphere, diameter = 128) {
      const key = `${originFragmentId}-${primarySphere}-${diameter}`;
      if (circularCache.has(key)) return circularCache.get(key)!;
      const result = await composePortraitCircular(originFragmentId, primarySphere, diameter);
      circularCache.set(key, result);
      return result;
    },

    clear() {
      composedCache.clear();
      circularCache.clear();
    },
  };
}
