import { RARITY_NOTIFICATION_THRESHOLD } from '../../../data/rarity-constants';

/** Minimum rarity tier that receives a signifier (tier 3+). */
export const RARITY_SIGNIFIER_MIN_TIER = RARITY_NOTIFICATION_THRESHOLD;

/** Mythic signifier scale multiplier (x HEX_CONSTANTS.HEX_SIZE). */
export const RARITY_SIGNIFIER_SPRITE_SCALE_MYTHIC = 1.0;

/** Legendary signifier scale multiplier (x HEX_CONSTANTS.HEX_SIZE). */
export const RARITY_SIGNIFIER_SPRITE_SCALE_LEGENDARY = 1.15;

/** Canvas texture dimensions for rarity signifier ring textures. */
export const RARITY_SIGNIFIER_TEXTURE_SIZE = 128;

/** Inner ring radius as a fraction of half texture size. */
export const RARITY_SIGNIFIER_RING_INNER_RADIUS_FRAC = 0.32;

/** Outer ring radius as a fraction of half texture size. */
export const RARITY_SIGNIFIER_RING_OUTER_RADIUS_FRAC = 0.46;

/** Fixed opacity for Mythic (tier 3) signifiers. */
export const RARITY_SIGNIFIER_STATIC_OPACITY = 0.55;

/** Minimum opacity for Legendary (tier 4) pulsing signifiers. */
export const RARITY_SIGNIFIER_PULSE_MIN_OPACITY = 0.35;

/** Maximum opacity for Legendary (tier 4) pulsing signifiers. */
export const RARITY_SIGNIFIER_PULSE_MAX_OPACITY = 0.75;

/** Pulse period (seconds) for Legendary (tier 4) signifiers. */
export const RARITY_SIGNIFIER_PULSE_PERIOD_S = 3.5;
