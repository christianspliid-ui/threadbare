/**
 * Centralized UI color palette for The Fantasy World Simulator.
 * Single source of truth for all hardcoded colors across components.
 * All named constants follow camelCase convention and are tunable.
 */

// ============================================================================
// Strand Colors (StrandView)
// ============================================================================
export const STRAND_COLORS: Record<string, string> = {
  Presence: '#d4a574',   // warm amber/tan
  Desires: '#e87534',    // coral/orange
  Bonds: '#5c6bc0',      // indigo
  Ambitions: '#eab308',  // gold/yellow
  Beliefs: '#7cb342',    // lime green
  Fears: '#b71c1c',      // deep red
};

// ============================================================================
// Sentiment & Relationship Colors
// ============================================================================
export const SENTIMENT_POSITIVE = '#10b981'; // green (positive relationships)
export const SENTIMENT_NEUTRAL = '#a89968';  // amber/tan (neutral)
export const SENTIMENT_NEGATIVE = '#dc2626'; // red (negative relationships)
export const SENTIMENT_GREEN = '#22c55e';    // brighter green
export const SENTIMENT_RED = '#ef4444';      // brighter red

// ============================================================================
// Mandate Tracker Type Colors
// ============================================================================
export const MANDATE_TYPE_COLORS: Record<string, string> = {
  graph_state: '#d4a574',       // warm amber (matches Presence strand)
  sphere_dominance: '#5c6bc0',  // indigo (matches Bonds strand)
  narrative: '#9c27b0',         // purple
};

// ============================================================================
// Doom Clock Archetype Colors
// ============================================================================
export const DOOM_ARCHETYPE_COLORS: Record<string, string> = {
  breach: '#dc2626',        // red
  convergence: '#7c3aed',   // purple
  changing: '#059669',      // green
  sundering: '#ea580c',     // orange
  failing: '#6b7280',       // gray
  ascension: '#eab308',     // gold
  reckoning: '#1d4ed8',     // blue
};

// ============================================================================
// Agent Tier Colors (AgentDetailPanel)
// ============================================================================
export const TIER_COLORS: Record<number, string> = {
  1: '#6b7280',  // gray (common)
  2: '#a78bfa',  // purple (uncommon)
  3: '#eab308',  // gold (rare)
  4: '#ef4444',  // red (legendary)
};

// ============================================================================
// Debug Trace Category Badge Colors (DebugPanel)
// ============================================================================
export const TRACE_CATEGORY_COLORS: Record<string, string> = {
  action_selection: '#d4a574',      // warm amber
  narrative_generation: '#aa44dd',  // purple
  context_harvest: '#2288ff',       // blue
  dilemma_resolution: '#ff4444',    // red
  tick_summary: '#ca8a04',          // amber-600
  ordeal_resolution: '#10b981',     // green (ordeal progress)
};

// ============================================================================
// Agent Wheel & Interaction Colors
// ============================================================================
export const WHEEL_AVAILABLE_COLOR = '#d4a574';      // warm amber (available slots)
export const WHEEL_UNAVAILABLE_COLOR = '#57534e';    // stone/gray (locked slots)
export const WHEEL_ICON_BACKGROUND = '#e8dcc4';      // light tan (icon bg)
export const WHEEL_ICON_ACCENT = '#a89968';          // amber tone (accents)

// ============================================================================
// Agent Detail Panel Accent Colors
// ============================================================================
export const ARCHETYPE_DOT_COLOR = '#b4a07f';        // amber tone (reach affinity dots)
export const FACTION_TAG_COLOR = '#b4a07f';          // amber tone (faction tags)
export const FACTION_TAG_BACKGROUND = '#78716c40';   // stone bg with opacity
export const FACTION_TAG_BORDER = '#78716c80';       // stone border with opacity

// ============================================================================
// Avatar HUD Colors
// ============================================================================
export const AVATAR_HUD_ICON_DEFAULT = '#fbbf24';    // amber-400
export const AVATAR_HUD_ICON_ACTIVE = '#fef3c7';     // amber-100

// ============================================================================
// Progress Bar Colors (shared by MandateTracker & DoomBar)
// ============================================================================
export const PROGRESS_BAR_BACKGROUND = '#57534e';    // stone-600
export const PROGRESS_BAR_GLOW_OPACITY = '80';       // hex opacity for glows (0x80 = 128 decimal)
