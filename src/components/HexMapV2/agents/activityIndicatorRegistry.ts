/**
 * activityIndicatorRegistry.ts — SVG paths for agent activity indicator icons.
 *
 * Provides 6 activity indicator icons as silhouette SVG paths that render
 * below agent portraits at hero-local zoom (k >= 15).
 *
 * Icons are rasterized via buildActivityIconTextureCache using the same
 * Path2D canvas pattern as signifierTextures.ts.
 *
 * NFP #1 (tunability): ACTIVITY_INDICATOR_SIZE and ACTIVITY_INDICATOR_OFFSET are named constants.
 * NFP #4 (fail-soft): buildActivityIconTextureCache skips icons with missing/invalid paths.
 * NFP #7 (performance): Textures built once — no per-frame canvas ops.
 */

import * as THREE from 'three';

// ── Constants ─────────────────────────────────────────────────────────────────

/** Size of activity indicator as a fraction of HEX_SIZE (UI-SPEC: 0.20 × HEX_SIZE). */
export const ACTIVITY_INDICATOR_SIZE = 0.20;

/** Vertical offset in px below agent ring bottom at hero-local zoom. */
export const ACTIVITY_INDICATOR_OFFSET = 12;

/** Canvas resolution for activity indicator textures (power of 2). */
const ACTIVITY_TEXTURE_SIZE = 64;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ActivityIconEntry {
  /** SVG path data array — 2–3 paths per icon, silhouette style */
  paths: Array<{ d: string; opacity: number }>;
  /** SVG viewBox string "minX minY width height" */
  viewBox: string;
}

// ── Registry ──────────────────────────────────────────────────────────────────

/**
 * Registry of 6 activity indicator icons.
 * Each icon uses near-black #1a1a1a silhouette paths with per-path opacity.
 *
 * Supported keys: 'boot', 'swords', 'hourglass', 'coin', 'hammer', 'bandage'
 */
export const ACTIVITY_ICON_REGISTRY: Record<string, ActivityIconEntry> = {
  /**
   * boot — Walking boot profile silhouette.
   * Indicates a traveling/moving agent.
   */
  boot: {
    viewBox: '0 0 100 100',
    paths: [
      {
        // Boot shaft and toe (main silhouette)
        d: 'M 30 15 L 30 60 Q 30 70 40 72 L 80 72 L 80 62 L 50 62 Q 42 62 42 55 L 42 15 Z',
        opacity: 1.0,
      },
      {
        // Heel bump
        d: 'M 28 55 Q 20 60 22 72 L 38 72 L 38 60 Z',
        opacity: 0.85,
      },
    ],
  },

  /**
   * swords — Two crossed swords.
   * Indicates a combat/conflict activity.
   */
  swords: {
    viewBox: '0 0 100 100',
    paths: [
      {
        // First sword blade (top-left to bottom-right)
        d: 'M 15 15 L 22 22 L 80 78 L 78 85 L 70 85 L 78 78 L 22 22 L 15 22 Z',
        opacity: 1.0,
      },
      {
        // Second sword blade (top-right to bottom-left)
        d: 'M 85 15 L 78 22 L 20 78 L 22 85 L 30 85 L 22 78 L 78 22 L 85 22 Z',
        opacity: 1.0,
      },
      {
        // Crossguards
        d: 'M 38 44 L 62 44 L 62 56 L 38 56 Z',
        opacity: 0.7,
      },
    ],
  },

  /**
   * hourglass — Hourglass silhouette.
   * Indicates waiting/resting/passage of time.
   */
  hourglass: {
    viewBox: '0 0 100 100',
    paths: [
      {
        // Top half of hourglass
        d: 'M 20 12 L 80 12 L 80 18 L 55 45 L 55 50 L 45 50 L 45 45 L 20 18 Z',
        opacity: 1.0,
      },
      {
        // Bottom half of hourglass
        d: 'M 20 82 L 80 82 L 80 88 L 80 82 L 55 55 L 55 50 L 45 50 L 45 55 L 20 82 L 20 88 Z',
        opacity: 1.0,
      },
      {
        // Sand trickle detail
        d: 'M 46 52 L 54 52 L 54 62 L 46 62 Z',
        opacity: 0.5,
      },
    ],
  },

  /**
   * coin — Circular coin with inner detail.
   * Indicates trade/commerce/economic activity.
   */
  coin: {
    viewBox: '0 0 100 100',
    paths: [
      {
        // Outer coin ring
        d: 'M 50 10 A 40 40 0 1 1 49.999 10 Z M 50 20 A 30 30 0 1 0 50.001 20 Z',
        opacity: 1.0,
      },
      {
        // Inner detail mark (simplified as small diamond)
        d: 'M 50 30 L 58 50 L 50 70 L 42 50 Z',
        opacity: 0.6,
      },
    ],
  },

  /**
   * hammer — Hammer silhouette.
   * Indicates construction/crafting/building activity.
   */
  hammer: {
    viewBox: '0 0 100 100',
    paths: [
      {
        // Hammer head
        d: 'M 25 15 L 70 15 L 70 40 L 58 40 L 58 35 L 42 35 L 42 40 L 25 40 Z',
        opacity: 1.0,
      },
      {
        // Hammer handle
        d: 'M 45 35 L 55 35 L 60 85 L 40 85 Z',
        opacity: 0.85,
      },
    ],
  },

  /**
   * bandage — Cross/bandage shape.
   * Indicates healing/recuperation activity.
   */
  bandage: {
    viewBox: '0 0 100 100',
    paths: [
      {
        // Vertical bar of cross
        d: 'M 42 15 L 58 15 L 58 85 L 42 85 Z',
        opacity: 1.0,
      },
      {
        // Horizontal bar of cross
        d: 'M 15 42 L 85 42 L 85 58 L 15 58 Z',
        opacity: 1.0,
      },
    ],
  },
};

export type ActivityIndicatorKey = keyof typeof ACTIVITY_ICON_REGISTRY;

// ── Texture cache builder ─────────────────────────────────────────────────────

/**
 * Builds a CanvasTexture for a single activity icon.
 *
 * Uses Path2D canvas rasterization — same pattern as signifierTextures.ts.
 * NFP #4: If any path is invalid, that path is skipped (other paths still render).
 */
function buildActivityIconTexture(entry: ActivityIconEntry): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width  = ACTIVITY_TEXTURE_SIZE;
  canvas.height = ACTIVITY_TEXTURE_SIZE;
  const ctx = canvas.getContext('2d')!;

  const parts = entry.viewBox.split(' ').map(Number);
  const vbW = parts[2] || 100;
  const vbH = parts[3] || 100;
  const scaleX = ACTIVITY_TEXTURE_SIZE / vbW;
  const scaleY = ACTIVITY_TEXTURE_SIZE / vbH;

  ctx.save();
  ctx.scale(scaleX, scaleY);
  ctx.fillStyle = '#1a1a1a';

  for (const path of entry.paths) {
    try {
      ctx.globalAlpha = path.opacity;
      ctx.fill(new Path2D(path.d));
    } catch {
      // NFP #4: invalid path data — skip silently
    }
  }
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

/**
 * Builds CanvasTextures for all activity icons in ACTIVITY_ICON_REGISTRY.
 *
 * Called once at scene init — no per-frame cost.
 * Returns a Map keyed by activity icon name.
 */
export function buildActivityIconTextureCache(): Map<string, THREE.CanvasTexture> {
  const cache = new Map<string, THREE.CanvasTexture>();
  for (const [key, entry] of Object.entries(ACTIVITY_ICON_REGISTRY)) {
    cache.set(key, buildActivityIconTexture(entry));
  }
  return cache;
}
