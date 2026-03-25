/**
 * agentSpriteTypes.ts — Agent rendering type definitions and constants.
 *
 * Defines AgentRenderData (the shape each rendered agent provides),
 * faction heraldic colors, retinue border treatment, and zoom tier thresholds
 * for the three-tier agent visibility system.
 *
 * NFP #1 (tunability): All color values and thresholds are named constants.
 * NFP #2 (inspectability): AgentRenderData contains all data needed to trace why
 *   an agent appears in a particular visual state.
 */

import { LAYER_Z } from '../scene/RenderLayers';

// ── Agent Render Data ────────────────────────────────────────────────────────

/**
 * All data needed to render a single agent on the hex map.
 * Callers build this from the world graph; the rendering layer only sees this shape.
 */
export interface AgentRenderData {
  /** Unique agent node ID */
  id: string;
  /** Hex column of the agent's current location */
  hexCol: number;
  /** Hex row of the agent's current location */
  hexRow: number;
  /** URL to the agent's portrait image (may be undefined if not loaded or not visible) */
  portraitUrl?: string;
  /** Faction index 0-5, indexes into FACTION_HERALDIC_COLORS */
  factionIndex: number;
  /** true = renders with gold/white retinue border instead of faction color */
  isRetinue: boolean;
  /** Activity icon key shown on the dot at regional zoom */
  activityIcon?: 'boot' | 'swords' | 'hourglass' | 'coin' | 'hammer' | 'bandage';
  /** Agent name — used for fallback initial rendering when portrait unavailable */
  name?: string;
  /** Road type the agent is currently traversing (for animation timing) */
  currentRoadType?: 'major' | 'trail';
  /** Number of remaining hexes in the road queue (0 or undefined = last hop or not on road) */
  roadHexQueueLength?: number;
}

// ── Faction Heraldic Colors ──────────────────────────────────────────────────

/**
 * Six distinct faction colors used for agent rings and dots.
 * Ordered: red, blue, purple, magenta, cyan, orange.
 * NFP #1: every color is named by faction index, not hard-coded at use sites.
 */
export const FACTION_HERALDIC_COLORS: string[] = [
  '#e53e3e', // 0 — red
  '#3182ce', // 1 — blue
  '#805ad5', // 2 — purple
  '#d53f8c', // 3 — magenta
  '#00b5d8', // 4 — cyan
  '#dd6b20', // 5 — orange
];

// ── Retinue Border Colors ────────────────────────────────────────────────────

/**
 * Gold ring color for retinue agents (replaces faction color ring).
 * Matches the gold used in the ascendant's sphere color system.
 */
export const RETINUE_BORDER_COLOR = '#d4a040';

/**
 * White inner highlight ring for retinue agents (drawn inside the gold ring).
 * Creates a two-tone effect that distinguishes retinue from regular agents.
 */
export const RETINUE_BORDER_ALT_COLOR = 'rgba(255,255,255,0.9)';

// ── Zoom Thresholds ──────────────────────────────────────────────────────────

/**
 * Zoom level thresholds that control agent sprite visibility tier.
 * Matches the existing ZOOM_THRESHOLDS from RegionLabelOverlay.
 *
 * Tier behavior:
 *   k >= HERO_LOCAL  → portrait thumbnails with faction rings
 *   k >= REGIONAL    → colored dots (faction color or gold for retinue)
 *   k >= CONTINENTAL → tiny dots (retinue agents only)
 *   k < CONTINENTAL  → hidden
 */
export const AGENT_ZOOM_THRESHOLDS = {
  /** Hero-local zoom: large portrait thumbnails with colored borders */
  HERO_LOCAL: 5,
  /** Regional zoom: colored faction dots */
  REGIONAL: 5,
  /** Continental zoom: tiny retinue-only dots */
  CONTINENTAL: 1.5,
} as const;

// ── Z Offsets ────────────────────────────────────────────────────────────────

/**
 * Z position for agent sprites — from centralized LAYER_Z.
 * Must be above LOCATION_ICON_Z so agents render over location icons.
 * NFP #1: named constant, no magic numbers at use sites.
 */
export const AGENT_SPRITE_Z = LAYER_Z.AGENTS;

// ── Texture Sizes ────────────────────────────────────────────────────────────

/**
 * Canvas resolution for portrait textures (power of 2 for GPU efficiency).
 * NFP #1: change this to adjust portrait texture quality.
 */
export const PORTRAIT_TEXTURE_SIZE = 128;

/**
 * Canvas resolution for faction dot textures (power of 2 for GPU efficiency).
 * NFP #1: change this to adjust dot texture quality.
 */
export const FACTION_DOT_TEXTURE_SIZE = 64;
