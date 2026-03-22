/**
 * eventIndicatorRegistry.ts — SVG paths and animation params for hex event indicators.
 *
 * Provides 5 event indicator types that render at hex centers to signal recent
 * world events (battle, construction, divine intervention, corruption, trade route).
 * Event sprites render at RENDER_ORDER.EVENTS (10) with fade-in/fade-out animations.
 *
 * NFP #1 (tunability): All animation timing values in EVENT_ANIMATION_PARAMS.
 * NFP #4 (fail-soft): buildEventIconTextureCache skips invalid paths.
 * NFP #7 (performance): Textures built once — no per-frame canvas ops.
 */

import * as THREE from 'three';

// ── Constants ─────────────────────────────────────────────────────────────────

/** Canvas resolution for event indicator textures (power of 2). */
const EVENT_TEXTURE_SIZE = 64;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EventIconEntry {
  /** SVG path data array — 2–3 paths per icon, silhouette style */
  paths: Array<{ d: string; opacity: number }>;
  /** SVG viewBox string */
  viewBox: string;
}

export interface EventAnimParams {
  /** Fade-in duration in ms */
  fadeIn: number;
  /** Fade-out duration in ms (0 = instant/permanent until removed) */
  fadeOut: number;
}

// ── Animation Parameters ──────────────────────────────────────────────────────

/**
 * Per-event-type fade timing parameters (ms).
 * NFP #1: All timing values named — change game feel by adjusting these numbers.
 */
export const EVENT_ANIMATION_PARAMS: Record<string, EventAnimParams> = {
  battle:              { fadeIn: 150, fadeOut: 300 },
  construction:        { fadeIn: 150, fadeOut: 300 },
  divine_intervention: { fadeIn: 200, fadeOut: 500 },
  corruption:          { fadeIn: 300, fadeOut:   0 },
  trade_route:         { fadeIn: 150, fadeOut: 300 },
};

// ── Registry ──────────────────────────────────────────────────────────────────

/**
 * Registry of 5 event indicator icons.
 * Each icon uses near-black silhouette paths with per-path opacity.
 *
 * Supported event types: 'battle', 'construction', 'divine_intervention',
 *   'corruption', 'trade_route'
 */
export const EVENT_ICON_REGISTRY: Record<string, EventIconEntry> = {
  /**
   * battle — Crossed swords flash (sharper, more dynamic than activity swords).
   * Signals a recent combat encounter on this hex.
   */
  battle: {
    viewBox: '0 0 100 100',
    paths: [
      {
        // First blade (top-left to bottom-right, thinner and more acute)
        d: 'M 18 12 L 26 12 L 88 78 L 88 86 L 80 86 L 18 20 Z',
        opacity: 1.0,
      },
      {
        // Second blade (top-right to bottom-left)
        d: 'M 82 12 L 74 12 L 12 78 L 12 86 L 20 86 L 82 20 Z',
        opacity: 1.0,
      },
      {
        // Impact starburst center
        d: 'M 50 42 L 54 50 L 50 58 L 46 50 Z',
        opacity: 0.9,
      },
    ],
  },

  /**
   * construction — Hammer with scaffold frame.
   * Signals active building/construction on this hex.
   */
  construction: {
    viewBox: '0 0 100 100',
    paths: [
      {
        // Hammer head (angled)
        d: 'M 15 18 L 50 18 L 50 36 L 40 36 L 40 30 L 25 30 L 25 36 L 15 36 Z',
        opacity: 1.0,
      },
      {
        // Hammer handle (diagonal)
        d: 'M 40 32 L 48 32 L 80 82 L 72 82 Z',
        opacity: 0.85,
      },
      {
        // Scaffold frame (right side: L-shape)
        d: 'M 62 15 L 88 15 L 88 88 L 80 88 L 80 22 L 62 22 Z',
        opacity: 0.6,
      },
    ],
  },

  /**
   * divine_intervention — Radiant burst (star-like rays).
   * Signals a divine action performed on this hex.
   */
  divine_intervention: {
    viewBox: '0 0 100 100',
    paths: [
      {
        // Central circle of the burst
        d: 'M 50 38 A 12 12 0 1 1 49.999 38 Z',
        opacity: 1.0,
      },
      {
        // 8 radiant rays (star polygon approximation)
        d: `M 50 10 L 53 40 L 74 18 L 60 44 L 90 50 L 60 56 L 74 82 L 53 60
            L 50 90 L 47 60 L 26 82 L 40 56 L 10 50 L 40 44 L 26 18 L 47 40 Z`,
        opacity: 0.9,
      },
      {
        // Inner glow ring (slightly larger than center circle)
        d: 'M 50 32 A 18 18 0 1 1 49.999 32 Z M 50 38 A 12 12 0 1 0 50.001 38 Z',
        opacity: 0.4,
      },
    ],
  },

  /**
   * corruption — Dark wisp/tendril shape.
   * Signals corruption spreading from or into this hex. Permanent until cleared (fadeOut: 0).
   */
  corruption: {
    viewBox: '0 0 100 100',
    paths: [
      {
        // Main wisp tendril (S-curve approximation)
        d: `M 50 15 Q 70 25 55 40 Q 40 55 60 65 Q 75 75 65 90
            Q 55 90 48 78 Q 35 65 52 50 Q 65 35 45 22 Z`,
        opacity: 1.0,
      },
      {
        // Secondary tendril (left)
        d: `M 35 30 Q 20 40 30 55 Q 40 68 28 80
            Q 22 75 22 65 Q 18 50 32 38 Z`,
        opacity: 0.75,
      },
      {
        // Wisp wisps (top spatter)
        d: 'M 60 20 L 64 15 L 68 22 L 63 24 Z M 42 12 L 46 8 L 50 14 L 45 15 Z',
        opacity: 0.5,
      },
    ],
  },

  /**
   * trade_route — Coin with motion lines.
   * Signals active trade or commerce flowing through this hex.
   */
  trade_route: {
    viewBox: '0 0 100 100',
    paths: [
      {
        // Coin (circle ring)
        d: 'M 38 20 A 20 20 0 1 1 37.999 20 Z M 38 28 A 12 12 0 1 0 38.001 28 Z',
        opacity: 1.0,
      },
      {
        // Motion lines (three horizontal dashes to the right)
        d: `M 65 35 L 88 35 L 88 41 L 65 41 Z
            M 68 48 L 88 48 L 88 54 L 68 54 Z
            M 65 61 L 85 61 L 85 67 L 65 67 Z`,
        opacity: 0.85,
      },
      {
        // Coin inner mark (simplified $ shape as vertical bar)
        d: 'M 36 26 L 40 26 L 40 50 L 36 50 Z',
        opacity: 0.55,
      },
    ],
  },
};

// ── Texture cache builder ─────────────────────────────────────────────────────

/**
 * Builds a CanvasTexture for a single event icon.
 *
 * Uses Path2D canvas rasterization. NFP #4: invalid paths skipped silently.
 */
function buildEventIconTexture(entry: EventIconEntry): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width  = EVENT_TEXTURE_SIZE;
  canvas.height = EVENT_TEXTURE_SIZE;
  const ctx = canvas.getContext('2d')!;

  const parts = entry.viewBox.split(' ').map(Number);
  const vbW = parts[2] || 100;
  const vbH = parts[3] || 100;
  const scaleX = EVENT_TEXTURE_SIZE / vbW;
  const scaleY = EVENT_TEXTURE_SIZE / vbH;

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
 * Builds CanvasTextures for all event icons in EVENT_ICON_REGISTRY.
 *
 * Called once at scene init — no per-frame cost.
 * Returns a Map keyed by event type name.
 */
export function buildEventIconTextureCache(): Map<string, THREE.CanvasTexture> {
  const cache = new Map<string, THREE.CanvasTexture>();
  for (const [key, entry] of Object.entries(EVENT_ICON_REGISTRY)) {
    cache.set(key, buildEventIconTexture(entry));
  }
  return cache;
}
