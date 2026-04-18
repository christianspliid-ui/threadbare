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
import type { ActivityCategory } from '../../../types/locationActivity';

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
  /** true = this is the player's avatar. Renders with sphere-colored highlight. */
  isAvatar?: boolean;
  /** Sphere color hex for avatar highlight ring (only set when isAvatar) */
  avatarSphereColor?: string;
  /**
   * Activity category from AgentActivityThread — drives a colored halo ring at hero-local zoom.
   * Absent = no halo (agent is stranger-tier or has no active action).
   * 'idle' is never set (idle agents get no halo).
   */
  activityCategory?: ActivityCategory;
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

// ── Avatar Visual Treatment ──────────────────────────────────────────────────

/** Scale multiplier for the avatar sprite relative to normal agents */
export const AVATAR_SCALE_MULTIPLIER = 1.3;

/** Pulsing ring animation period in seconds */
export const AVATAR_PULSE_PERIOD_S = 2.0;

/** Pulsing ring opacity range [min, max] */
export const AVATAR_PULSE_OPACITY: [number, number] = [0.6, 1.0];

/** Z-offset bump for avatar to render above other agents */
export const AVATAR_Z_BUMP = 0.01;

/** Width of the avatar sphere-colored ring as fraction of sprite radius */
export const AVATAR_RING_WIDTH_FRACTION = 0.12;

// ── Activity Halo ────────────────────────────────────────────────────────────

/**
 * Colors for per-category activity halos shown at hero-local zoom.
 * 'idle' is excluded — idle agents receive no halo.
 * NFP #1: every color is named, change game feel here.
 */
export const ACTIVITY_HALO_COLORS: Partial<Record<ActivityCategory, string>> = {
  commerce:    '#d4a040', // gold — trade, barter
  conflict:    '#e53e3e', // red — combat, confrontation
  diplomacy:   '#3182ce', // blue — social negotiation
  intrigue:    '#805ad5', // purple — secrets, manipulation
  devotion:    '#38a169', // green — religious, spiritual
  craft:       '#dd6b20', // orange — construction, crafting
  exploration: '#00b5d8', // cyan — scouting, discovery
  gathering:   '#68d391', // light green — convergence
  dispersal:   '#a0aec0', // grey-blue — departure
};

/** Opacity of activity halo sprites at hero-local zoom. Subtle tint, not a bright ring. */
export const ACTIVITY_HALO_OPACITY = 0.5;

/** Halo sprite diameter as a fraction of portrait sprite scale. */
export const ACTIVITY_HALO_SCALE_FRACTION = 1.35;

/** Ring width as fraction of canvas radius for activity halo textures (thinner than avatar ring). */
export const ACTIVITY_HALO_RING_WIDTH_FRACTION = 0.08;
