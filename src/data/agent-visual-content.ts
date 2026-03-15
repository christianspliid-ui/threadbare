/**
 * Agent Visual Content Data
 *
 * Tunable constants for rendering agent dots/tokens on the hex map.
 */

/** d3 zoom scale threshold: below = dots, above = tokens with initials */
export const ZOOM_TOKEN_THRESHOLD = 2.5;

/** Max agents shown in ring around settlement before overflow badge */
export const MAX_RING_AGENTS = 6;

/** Radius of agent dot at default zoom */
export const AGENT_DOT_RADIUS = 3;

/** Radius of agent dot at token zoom */
export const AGENT_TOKEN_RADIUS = 8;

/** Agent domain-to-color mapping for dot rendering */
export const DOMAIN_COLORS: Record<string, string> = {
  iron: '#6B7280',
  gold: '#D4A017',
  shadow: '#1F1F3A',
  veil: '#7B5EA7',
  heart: '#C94040',
  eye: '#2E86AB',
  stone: '#8B6F47',
  star: '#FFD700',
  flesh: '#D4826A',
};

/** Default agent dot color when domain is unknown */
export const DEFAULT_AGENT_COLOR = '#555555';

/** Ring distance from hex center for agent positioning */
export const AGENT_RING_RADIUS = 12;

// --- Movement Trail Constants ---

/** Trail line color — dark ink on parchment aesthetic */
export const TRAIL_LINE_COLOR = '#1a1a1a';

/** Trail line stroke width in SVG units */
export const TRAIL_LINE_WIDTH = 1.5;

/** Maximum trail opacity (current position end) */
export const TRAIL_OPACITY_MAX = 0.6;

/** Minimum trail opacity (oldest position end) */
export const TRAIL_OPACITY_MIN = 0.05;

// --- Ghost Dot Constants ---

/** Initial opacity for ghost dots when agent leaves LOS */
export const GHOST_DOT_INITIAL_OPACITY = 0.3;

/** Ticks before ghost dot fully fades (~7 in-game days) */
export const GHOST_DOT_DECAY_TICKS = 28;

/** Ghost dot color (faded grey) */
export const GHOST_DOT_COLOR = '#888888';
