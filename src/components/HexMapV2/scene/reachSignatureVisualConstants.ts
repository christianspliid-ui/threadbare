/**
 * Reach-signature signifier visual constants (THR-554). NFP #1: every tunable
 * number the warhost / rift / wonder map glyphs read is named here.
 *
 * Colours echo the canonical reach palette (REACH_ICON_COLORS / SPHERE_COLORS):
 * warhost = Iron/force red, wonder = Stone/matter tan. The rift is tinted to the
 * Creation Sphere it amplifies at runtime, falling back to Veil/mind blue.
 */

/** Iron / Warhost muster ring — force red (matches REACH_ICON_COLORS.iron). */
export const WARHOST_SIGNIFIER_COLOR = '#ff6b6b';

/** Stone / Wonder glyph — matter tan (matches REACH_ICON_COLORS.stone). */
export const WONDER_SIGNIFIER_COLOR = '#d4a87a';

/** Rift fallback tint when the amplified sphere has no palette entry — Veil/mind blue. */
export const RIFT_SIGNIFIER_FALLBACK_COLOR = '#44aaff';

/** Canvas texture dimensions (px) for each signature glyph. */
export const REACH_SIGNATURE_TEXTURE_SIZE = 128;

/** Sprite diameter as a multiple of HEX_SIZE for each glyph kind. */
export const WARHOST_SPRITE_SCALE = 1.05;
export const RIFT_SPRITE_SCALE = 1.15;
export const WONDER_SPRITE_SCALE = 1.1;

/** Static opacity for the non-pulsing glyphs (warhost, wonder). */
export const REACH_SIGNATURE_STATIC_OPACITY = 0.6;

/** Rift pulse opacity bounds — it is a live, breathing tear in the world. */
export const RIFT_PULSE_MIN_OPACITY = 0.35;
export const RIFT_PULSE_MAX_OPACITY = 0.85;

/** Rift pulse period (seconds). Slightly faster than the rarity ring's 3.5s. */
export const RIFT_PULSE_PERIOD_S = 2.6;

/**
 * Minimum d3-zoom scale (k) at which signature glyphs render — regional tier.
 * Matches SIGNIFIER/location thresholds so a signature reads at the same zoom
 * as the entity it marks.
 */
export const REACH_SIGNATURE_ZOOM_THRESHOLD = 5;
