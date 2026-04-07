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
  'origin.recent-shepherd':   '/portraits/origin-recent-shepherd.png',
  'origin.recent-commander':  '/portraits/origin-recent-commander.png',
  'origin.recent-healer':     '/portraits/origin-recent-healer.png',
  'origin.recent-merchant':   '/portraits/origin-recent-merchant.png',
  'origin.recent-judge':      '/portraits/origin-recent-judge.png',
  'origin.recent-rebel':      '/portraits/origin-recent-rebel.png',
  'origin.ancient-scholar':   '/portraits/origin-ancient-scholar.png',
  'origin.ancient-ruler':     '/portraits/origin-ancient-ruler.png',
  'origin.ancient-wanderer':  '/portraits/origin-ancient-wanderer.png',
  'origin.ancient-priest':    '/portraits/origin-ancient-priest.png',
  'origin.ancient-dreamer':   '/portraits/origin-ancient-dreamer.png',
  'origin.ancient-artisan':   '/portraits/origin-ancient-artisan.png',
};

/** Get origin portrait URL. Falls back to ancient-scholar for unknown IDs (fail-soft). */
export function getOriginPortraitUrl(originFragmentId: string): string {
  return ORIGIN_PORTRAITS[originFragmentId] ?? ORIGIN_PORTRAITS[DEFAULT_ORIGIN_ID];
}

// ── Sphere Frames ───────────────────────────────────────────────────────────

/** Map primary sphere → ornate frame overlay path (relative to public/) */
export const SPHERE_FRAMES: Record<SphereName, string> = {
  force:   '/portraits/frame-force.png',
  matter:  '/portraits/frame-matter.png',
  energy:  '/portraits/frame-energy.png',
  life:    '/portraits/frame-life.png',
  mind:    '/portraits/frame-mind.png',
  spirit:  '/portraits/frame-spirit.png',
  time:    '/portraits/frame-time.png',
  entropy: '/portraits/frame-entropy.png',
};

/** Get sphere frame URL for the player's primary sphere. */
export function getSphereFrameUrl(primarySphere: SphereName): string {
  return SPHERE_FRAMES[primarySphere];
}

// ── Legacy Compat (deprecated — remove after full migration) ────────────────

/** @deprecated Use getOriginPortraitUrl + getSphereFrameUrl instead */
export const AVATAR_PORTRAITS: Record<SphereName, string> = {
  force:   '/portraits/avatar-force.png',
  matter:  '/portraits/avatar-matter.png',
  energy:  '/portraits/avatar-energy.png',
  life:    '/portraits/avatar-life.png',
  mind:    '/portraits/avatar-mind.png',
  spirit:  '/portraits/avatar-spirit.png',
  time:    '/portraits/avatar-time.png',
  entropy: '/portraits/avatar-entropy.png',
};

/** @deprecated Use getOriginPortraitUrl instead */
export function getAvatarPortraitUrl(primarySphere: SphereName): string {
  return AVATAR_PORTRAITS[primarySphere];
}
