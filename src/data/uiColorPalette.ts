/**
 * Centralized UI color palette for The Fantasy World Simulator.
 * Single source of truth for all hardcoded colors across components.
 * All named constants follow camelCase convention and are tunable.
 */

import type { TickEvent } from '../types';

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
  narrative: '#c084fc',         // light purple (WCAG AA on dark surfaces)
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
  encounter_resolution: '#10b981',     // green (encounter progress)
  familiarity_change: '#fbbf24',    // amber-400 (knowledge/connection growth)
  movement: '#38bdf8',              // sky-400 (travel/pathfinding)
  // THR-115: world-shaping aftermath effects
  artifact_spawned: '#f59e0b',      // amber (material world change)
  omen_emitted: '#a855f7',          // purple (atmospheric pressure)
  omen_decayed: '#6b7280',          // gray (expiry)
  faction_splintered: '#ef4444',    // red (rupture)
  faction_absorbed: '#3b82f6',      // blue (merger)
  faction_dissolved: '#374151',     // dark gray (dissolution)
  faction_war_declared: '#dc2626',  // bright red (conflict)
  faction_peace_forced: '#22c55e',  // green (resolution)
  // THR-136: authored aftermath inspectors
  hidden_mark_placed: '#f97316',    // orange-500 (concealment/mark)
  hidden_mark_revealed: '#fbbf24',  // amber-400 (revelation)
  encounter_seed_planted: '#2dd4bf', // teal-400 (planted future)
  encounter_seed_triggered: '#0d9488', // teal-600 (fired/consumed)
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

// ============================================================================
// Rival Behavior Colors & Icons
// ============================================================================
export const BEHAVIOR_COLORS: Record<string, string> = {
  aggressive: '#dc2626',
  subtle: '#7c3aed',
  territorial: '#ea580c',
  expansionist: '#059669',
};

export const BEHAVIOR_COLOR_DEFAULT = '#78716c';

export const BEHAVIOR_ICONS: Record<string, string> = {
  aggressive: '⚔',
  subtle: '◇',
  territorial: '▪',
  expansionist: '⬆',
};

// ============================================================================
// Tick Event Type Colors (NarrativeLog, NarrativeFeed)
// ============================================================================
export const TICK_EVENT_COLORS: Record<TickEvent['type'], string> = {
  agent_action: '#d4a574',
  agent_action_resolved: '#c4956a',
  doom_escalation: '#dc2626',
  rival_action: '#7c3aed',
  essence_gain: '#b8860b',
  mandate_progress: '#059669',
  narrative: '#9c27b0',
  phase_change: '#eab308',
  stealth_alert: '#6b7280',
  dilemma_resolved: '#44aaff',
  domain_revealed: '#a78bfa',      // violet — knowledge/revelation theme
  army_mobilization: '#f97316',    // orange — military mobilization
  army_disbanded: '#78716c',       // stone gray — army gone, low emphasis
  battle_started: '#ef4444',       // red-500 — combat starting
  battle_resolved: '#dc2626',      // red-600 — combat concluded (slightly darker)
  siege_established: '#fb923c',    // orange-400 — siege (matches SIEGE_COLOR from BattleIndicatorLayer)
  army_attrition: '#a8a29e',       // warm gray — degradation, low emphasis
};

// ============================================================================
// Event Log Category Colors (broader categories, not tick event types)
// ============================================================================
export const EVENT_CATEGORY_COLORS: Record<string, string> = {
  essence: '#b8860b',
  influence: '#7cb342',
  narrative: '#9c27b0',
  system: '#78716c',
};

// ============================================================================
// Hostility Color Scale (replaces raw RGB calc in RivalPanel)
// ============================================================================
export function getHostilityColor(hostility: number): string {
  const clamped = Math.max(0, Math.min(1, hostility));
  if (clamped < 0.5) {
    const t = clamped * 2;
    const r = Math.round(80 + t * 160);
    const g = Math.round(180 - t * 60);
    return `rgb(${r}, ${g}, 50)`;
  }
  const t = (clamped - 0.5) * 2;
  const r = 240;
  const g = Math.round(120 - t * 90);
  const b = Math.round(50 - t * 20);
  return `rgb(${r}, ${g}, ${b})`;
}

// ============================================================================
// HexZoomView SVG Colors
// ============================================================================
export const HEX_ZOOM_COLORS = {
  HEX_FILL: '#0a0a0e',             // --bg-abyss
  HEX_BORDER: '#d4a040',           // --accent-gold
  LOCATION_FILL: '#1a1a1f',        // --bg-surface
  LOCATION_FILL_HIDDEN: '#15131e',
  LOCATION_BORDER: '#2a2520',      // --border-subtle
  LOCATION_NAME: '#e8dcc8',        // --text-primary
  LOCATION_NAME_HIDDEN: '#555',
  SUBTYPE_TEXT: '#b8a890',          // --text-secondary (close)
  TRAVEL_LINE: '#d4a04050',        // --accent-gold @ 50%
  AGENT_COUNT_BG: '#d4a040',       // --accent-gold
  AGENT_COUNT_TEXT: '#0a0a0e',     // --bg-abyss
} as const;

// ============================================================================
// Tier Color Default (fallback)
// ============================================================================
export const TIER_COLOR_DEFAULT = '#78716c';
