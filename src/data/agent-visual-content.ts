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
export const AGENT_DOT_RADIUS = 2.5;

/** Radius of small agent portrait at zoomed-in tier (k >= 5) — ring-positioned.
 *  Must be small enough to leave room for center location + location ring. */
export const AGENT_TOKEN_RADIUS = 1.5;

/** Radius of large agent portrait at zoomed-out tier (k < 5) — ring-positioned, slight hex clip OK */
export const AGENT_PORTRAIT_RADIUS = 4.5;

/** Stroke width of ring around portrait thumbnail */
export const AGENT_PORTRAIT_RING_WIDTH = 1.2;

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

/** Ring distance from hex center for agent positioning — inside hex edge (HEX_SIZE=10) */
export const AGENT_RING_RADIUS = 6;

// --- Fixed-Slot Hex Layout Constants ---

/** Shared ring radius for all perimeter slots (agents + locations). */
export const SLOT_RING_RADIUS = 6;

/** Fixed angles (degrees) for secondary location slots — hex vertex directions. */
export const VERTEX_ANGLES_DEG: readonly number[] = [0, 60, 120, 180, 240, 300];

/** Fixed angles (degrees) for agent slots — hex edge-midpoint directions. */
export const EDGE_MID_ANGLES_DEG: readonly number[] = [30, 90, 150, 210, 270, 330];

// --- Location Ring Constants ---

/** @deprecated Use SLOT_RING_RADIUS instead. Kept for V1 HexMap consumers. */
export const LOCATION_RING_RADIUS = 6;

/** @deprecated Structural 30° separation replaces this rotation hack. Kept for V1 HexMap consumers. */
export const LOCATION_RING_ROTATION_DEG = 8;

/** Scale multiplier for locations placed in the ring (smaller to fit comfortably) */
export const LOCATION_RING_SCALE_FACTOR = 0.75;

/** Max locations shown in ring around hex before overflow */
export const MAX_RING_LOCATIONS = 6;

// --- Movement Trail Constants ---

/** Trail line color — dark ink on parchment aesthetic */
export const TRAIL_LINE_COLOR = '#1a1a1a';

/** Trail line stroke width in SVG units */
export const TRAIL_LINE_WIDTH = 0.75;

/** Maximum trail opacity (current position end) */
export const TRAIL_OPACITY_MAX = 0.8;

/** Minimum trail opacity (oldest position end) */
export const TRAIL_OPACITY_MIN = 0.05;

// --- Movement Animation Constants ---

/** Duration of bezier animation when agent moves between hexes (ms) */
export const AGENT_MOVE_TRANSITION_MS = 800;

/** Duration of arrival flash animation when agent reaches a new hex (ms) */
export const AGENT_ARRIVE_FLASH_MS = 500;

/** Animation duration per hex on major roads (ms) — fast travel */
export const ROAD_MAJOR_HOP_MS = 300;

/** Animation duration per hex on trails (ms) — moderate travel */
export const ROAD_TRAIL_HOP_MS = 500;

/** Multiplier on standard wobble magnitude for road hops (1.0 = same as off-road) */
export const ROAD_WOBBLE_FACTOR = 0.3;

// --- Ghost Dot Constants ---

/** Initial opacity for ghost dots when agent leaves LOS */
export const GHOST_DOT_INITIAL_OPACITY = 0.3;

/** Ticks before ghost dot fully fades (~7 in-game days) */
export const GHOST_DOT_DECAY_TICKS = 28;

/** Ghost dot color (faded grey) */
export const GHOST_DOT_COLOR = '#888888';
