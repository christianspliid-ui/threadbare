/**
 * Avatar Portrait Asset Registry — maps Creation Spheres to avatar portrait paths.
 *
 * Avatar portraits are sphere-specific divine figure images stored in public/portraits/.
 * Unlike archetype portraits (one per narrative archetype), these represent the player's
 * ascendant avatar — a divine being woven from sphere-colored threads.
 *
 * NFP #1 (tunability): Registry is a simple record — add/swap portraits by changing the path.
 * NFP #4 (fail-soft): getAvatarPortraitUrl always returns a string; image load failure
 *   is handled downstream by agentPortraitTextures fallback.
 */

import type { SphereName } from '../types';

/** Map primary sphere → avatar portrait path (relative to public/) */
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

/** Get avatar portrait URL for the player's primary sphere */
export function getAvatarPortraitUrl(primarySphere: SphereName): string {
  return AVATAR_PORTRAITS[primarySphere];
}
