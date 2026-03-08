/**
 * UI Content Package — Tooltip strings for UI-system elements.
 *
 * CONTENT MANAGER: This is the file you edit to change tooltip text
 * for UI buttons, panels, and controls. Game-entity tooltips (spheres,
 * reaches, archetypes) are resolved from their respective content
 * packages — do NOT duplicate them here.
 */

import type { TooltipContent } from '../types/tooltip';

export const UI_TOOLTIPS: Record<string, TooltipContent> = {
  // ─── Core HUD ──────────────────────────────────────────────────
  'ui.doom_bar': {
    label: 'Doom Clock',
    desc: 'Tracks the world\'s descent toward the Unmaking. Each stage escalates {{sphere.entropy}} effects.',
  },
  'ui.essence_panel': {
    label: 'Divine Essence',
    desc: 'Your power reserve. Spent on {{ui.avatar_wheel}} interventions, replenished by {{ui.mandate_tracker}} completion.',
  },
  'ui.mandate_tracker': {
    label: 'Active Mandates',
    desc: 'Divine objectives — complete them to gain essence and slow the {{ui.doom_bar}}.',
  },

  // ─── Avatar Actions ────────────────────────────────────────────
  'ui.avatar_move': {
    label: 'Move Avatar',
    desc: 'Relocate your divine presence to a visible hex on the map.',
  },
  'ui.avatar_wheel': {
    label: 'Agent Wheel',
    desc: 'Open the wheel of divine interventions for the selected agent.',
  },
  'ui.avatar_scry': {
    label: 'Ascendant Scry',
    desc: 'Organize your divine court — assign agents to positions of power.',
  },

  // ─── Simulation Controls ──────────────────────────────────────
  'ui.sim_play_pause': {
    label: 'Play / Pause',
    desc: 'Advance or pause the world simulation.',
  },
  'ui.sim_speed': {
    label: 'Tick Speed',
    desc: 'How fast the world turns — higher speed skips routine events.',
  },

  // ─── Panels ────────────────────────────────────────────────────
  'ui.rival_panel': {
    label: 'Rival Gods',
    desc: 'Other divine powers competing for influence over the world.',
  },
  'ui.retinue_panel': {
    label: 'Retinue',
    desc: 'Mortal agents under your divine influence, ranked by tier.',
  },
  'ui.debug_panel': {
    label: 'Debug Traces',
    desc: 'Engine decision traces — action selection, narrative generation, context harvest.',
  },
};

/** Lookup a UI tooltip by ID. Returns null if not found. */
export function getUITooltip(id: string): TooltipContent | null {
  return UI_TOOLTIPS[id] ?? null;
}
