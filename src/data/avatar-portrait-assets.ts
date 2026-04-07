/**
 * Avatar Portrait Asset Registry — maps origins to portraits, spheres to frames.
 *
 * Two-layer portrait system:
 *   - Origin portraits: mortal-looking faces keyed by remembrance origin choice
 *   - Sphere frames: ornate picture frames keyed by primary Creation Sphere
 *
 * Composed at runtime by composePortrait() in src/utils/portraitCompositor.ts.
 *
 * NFP #1 (tunability): Registries are simple records — add/swap by changing paths.
 * NFP #4 (fail-soft): Lookup functions always return a valid string; unknown keys
 *   fall back to a default. Image load failure handled downstream.
 */

import type { SphereName } from '../types';

// ── Origin Portraits ────────────────────────────────────────────────────────

/** Default origin used when the identity's originFragmentId isn't in the registry (e.g. 'origin.dev') */
const DEFAULT_ORIGIN_ID = 'origin.ancient-scholar';

/** Map origin fragment ID → portrait path (relative to public/) */
export const ORIGIN_PORTRAITS: Record<string, string> = {
  'origin.recent-shepherd':   '/portraits/origin-recent-shepherd.jpg',
  'origin.recent-commander':  '/portraits/origin-recent-commander.jpg',
  'origin.recent-healer':     '/portraits/origin-recent-healer.jpg',
  'origin.recent-merchant':   '/portraits/origin-recent-merchant.jpg',
  'origin.recent-judge':      '/portraits/origin-recent-judge.jpg',
  'origin.recent-rebel':      '/portraits/origin-recent-rebel.jpg',
  'origin.ancient-scholar':   '/portraits/origin-ancient-scholar.jpg',
  'origin.ancient-ruler':     '/portraits/origin-ancient-ruler.jpg',
  'origin.ancient-wanderer':  '/portraits/origin-ancient-wanderer.jpg',
  'origin.ancient-priest':    '/portraits/origin-ancient-priest.jpg',
  'origin.ancient-dreamer':   '/portraits/origin-ancient-dreamer.jpg',
  'origin.ancient-artisan':   '/portraits/origin-ancient-artisan.jpg',
};

/** Get origin portrait URL. Falls back to ancient-scholar for unknown IDs (fail-soft). */
export function getOriginPortraitUrl(originFragmentId: string): string {
  return ORIGIN_PORTRAITS[originFragmentId] ?? ORIGIN_PORTRAITS[DEFAULT_ORIGIN_ID];
}

// ── Sphere Frames ───────────────────────────────────────────────────────────

/** Map primary sphere → ornate frame overlay path (relative to public/) */
export const SPHERE_FRAMES: Record<SphereName, string> = {
  force:   '/portraits/frame-force.jpg',
  matter:  '/portraits/frame-matter.jpg',
  energy:  '/portraits/frame-energy.jpg',
  life:    '/portraits/frame-life.jpg',
  mind:    '/portraits/frame-mind.jpg',
  spirit:  '/portraits/frame-spirit.jpg',
  time:    '/portraits/frame-time.jpg',
  entropy: '/portraits/frame-entropy.jpg',
};

/** Get sphere frame URL for the player's primary sphere. */
export function getSphereFrameUrl(primarySphere: SphereName): string {
  return SPHERE_FRAMES[primarySphere];
}

// ── Legacy Compat (deprecated — remove after full migration) ────────────────

/** @deprecated Use getOriginPortraitUrl + getSphereFrameUrl instead */
export const AVATAR_PORTRAITS: Record<SphereName, string> = {
  force:   '/portraits/avatar-force.jpg',
  matter:  '/portraits/avatar-matter.jpg',
  energy:  '/portraits/avatar-energy.jpg',
  life:    '/portraits/avatar-life.jpg',
  mind:    '/portraits/avatar-mind.jpg',
  spirit:  '/portraits/avatar-spirit.jpg',
  time:    '/portraits/avatar-time.jpg',
  entropy: '/portraits/avatar-entropy.jpg',
};

/** @deprecated Use getOriginPortraitUrl instead */
export function getAvatarPortraitUrl(primarySphere: SphereName): string {
  return AVATAR_PORTRAITS[primarySphere];
}
