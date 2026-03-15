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
    label: 'Investiture',
    desc: 'Open the Divine Court — assign agents to positions of power and bestow sacred titles.',
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

  // ─── Simulation Controls (extended) ─────────────────────────────
  'ui.sim_step': {
    label: 'Step',
    desc: 'Advance the world by one tick. Use when paused to move at your own pace.',
  },
  'ui.season_display': {
    label: 'Season',
    desc: 'The current season and year. Each season spans roughly ninety ticks.',
  },

  // ─── World Pulse ─────────────────────────────────────────────────
  'ui.world_pulse_tick': {
    label: 'World Tick',
    desc: 'The current simulation tick — one turn of the world engine.',
  },
  'ui.world_pulse_agents': {
    label: 'Active Agents',
    desc: 'Number of mortal agents currently alive and acting in the world.',
  },
  'ui.world_pulse_cultures': {
    label: 'Cultures',
    desc: 'Distinct cultural groups shaping behavior, values, and conflict across the world.',
  },
  'ui.world_pulse_mood': {
    label: 'World Mood',
    desc: 'A narrative read of the current world tone, drawn from the {{ui.doom_bar}} stage.',
  },

  // ─── Doom Stages ─────────────────────────────────────────────────
  'ui.doom_stage_whisper': {
    label: 'Whisper',
    desc: 'The first stage — unease spreads beneath the surface. The world has not yet noticed what stirs.',
  },
  'ui.doom_stage_stir': {
    label: 'Stir',
    desc: 'Patterns emerge. Strange events cluster. Those who watch closely begin to see the shape of it.',
  },
  'ui.doom_stage_surge': {
    label: 'Surge',
    desc: 'The doom accelerates. Crisis manifests in multiple regions. Containment is no longer trivial.',
  },
  'ui.doom_stage_breaking': {
    label: 'Breaking',
    desc: 'The world fractures under pressure. Each tick escalates entropy effects across all spheres.',
  },
  'ui.doom_stage_unmaking': {
    label: 'Unmaking',
    desc: 'The final stage. All sphere bonds collapse. Complete your {{ui.mandate_tracker}} or the world returns to void.',
  },

  // ─── Narrative Log ───────────────────────────────────────────────
  'ui.narrative_log': {
    label: 'Narrative Log',
    desc: 'A chronicle of world events — agent actions, interventions, doom escalations, and turning points.',
  },
  'ui.event_type_routine': {
    label: 'Routine Event',
    desc: 'Everyday agent activity — movement, encounters, small decisions. The texture of a living world.',
  },
  'ui.event_type_notable': {
    label: 'Notable Event',
    desc: 'A significant moment — a dilemma resolved, a doom stage crossed, a mandate progressed.',
  },
  'ui.event_type_intervention': {
    label: 'Intervention',
    desc: 'Your direct act upon the world. Each intervention costs {{ui.essence_panel}} and carries {{ui.detection_risk}}.',
  },

  // ─── Action System ───────────────────────────────────────────────
  'ui.essence_cost': {
    label: 'Essence Cost',
    desc: 'Divine essence required to perform this intervention. Drawn from your {{ui.essence_panel}}.',
  },
  'ui.detection_risk': {
    label: 'Detection Risk',
    desc: 'Chance that this intervention reveals your divine presence. Higher on overt or world-altering acts.',
  },
  'ui.action_range': {
    label: 'Action Range',
    desc: 'Delivery scope — local, regional, astral, or remote. Wider range costs more essence.',
  },
  'ui.action_locked': {
    label: 'Locked',
    desc: 'This intervention is unavailable. Requirements not met — check essence, reach, or agent conditions.',
  },
  'ui.action_glyph': {
    label: 'Action Glyph',
    desc: 'The sphere symbol identifying this intervention\'s domain. Matches {{sphere}} affinities.',
  },

  // ─── Intervention ────────────────────────────────────────────────
  'ui.intervention_delivery': {
    label: 'Delivery Mode',
    desc: 'How the intervention reaches its target — local touch, regional wave, astral projection, or remote reach.',
  },
  'ui.intervention_confirm': {
    label: 'Confirm',
    desc: 'Commit this act upon the world. Essence is spent and cannot be recovered.',
  },
  'ui.intervention_cancel': {
    label: 'Cancel',
    desc: 'Dismiss without acting. No essence is spent.',
  },

  // ─── Agenda ──────────────────────────────────────────────────────
  'ui.agenda_template': {
    label: 'Agenda',
    desc: 'A behavioral pattern for an agent — shapes how they prioritize actions and what drives them.',
  },
  'ui.agenda_select': {
    label: 'Set Agenda',
    desc: 'Assign this agenda to the agent. Their future decisions will lean toward its behavioral tag.',
  },

  // ─── Scry ────────────────────────────────────────────────────────
  'ui.scry_rank_herald': {
    label: 'Herald',
    desc: 'An outer court rank — this agent carries your influence into the world at a distance.',
  },
  'ui.scry_rank_steward': {
    label: 'Steward',
    desc: 'An inner court rank — this agent manages your interests with direct authority.',
  },
  'ui.scry_rank_champion': {
    label: 'Champion',
    desc: 'The apex court rank — this agent acts as your primary instrument of divine will.',
  },
  'ui.scry_position': {
    label: 'Court Position',
    desc: 'A slot in your divine court. Each position grants the assigned agent influence and a title.',
  },
  'ui.scry_assign': {
    label: 'Assign to Court',
    desc: 'Place this agent in the selected court position. Replaces any current occupant.',
  },

  // ─── Harvest ─────────────────────────────────────────────────────
  'ui.harvest_type': {
    label: 'Harvest Outcome',
    desc: 'How this cycle ended — triumphant, somber, or bittersweet. Shapes the echoes carried forward.',
  },
  'ui.harvest_echo': {
    label: 'Cosmic Echo',
    desc: 'A persistent blessing or scar carried into the next cycle, earned by how this world ended.',
  },
  'ui.harvest_cycle': {
    label: 'Cycle',
    desc: 'One complete arc of world-simulation — from first tick to harvest. Each cycle builds on echoes from the last.',
  },

  // ─── Mandate Stages ──────────────────────────────────────────────
  'ui.mandate_stage_seed': {
    label: 'Seed',
    desc: 'The opening stage — foundation conditions must be established before the mandate can grow.',
  },
  'ui.mandate_stage_growth': {
    label: 'Growth',
    desc: 'The middle stage — conditions develop and pressure builds toward the final test.',
  },
  'ui.mandate_stage_test': {
    label: 'Test',
    desc: 'The critical stage — the mandate is tried against mounting obstacles.',
  },
  'ui.mandate_stage_culmination': {
    label: 'Culmination',
    desc: 'The final stage. Completion grants essence and slows the {{ui.doom_bar}}.',
  },

  // ─── Hex / Map ───────────────────────────────────────────────────
  'ui.fog_unexplored': {
    label: 'Unexplored',
    desc: 'This hex has never been observed. Its contents are entirely unknown.',
  },
  'ui.fog_remembered': {
    label: 'Remembered',
    desc: 'This hex was once visible but is no longer in sight. Details may be out of date.',
  },
  'ui.fog_visible': {
    label: 'Visible',
    desc: 'This hex is within your divine sight or an agent\'s line of sight.',
  },
  'ui.sight_level_blind': {
    label: 'Blind',
    desc: 'No sight reaches this hex. All activity here is hidden.',
  },
  'ui.sight_level_dim': {
    label: 'Dim Sight',
    desc: 'Partial visibility — outlines are perceived but fine detail is obscured.',
  },
  'ui.sight_level_clear': {
    label: 'Clear Sight',
    desc: 'Full visibility — agents, encounters, and events in this hex are fully observed.',
  },

  // ─── Encounter ───────────────────────────────────────────────────
  'ui.encounter_step': {
    label: 'Encounter Step',
    desc: 'One stage in an ongoing encounter. Each step tests a reach and advances or ends the sequence.',
  },
  'ui.encounter_threat_low': {
    label: 'Low Threat',
    desc: 'The encounter poses little danger. Most agents will resolve it without difficulty.',
  },
  'ui.encounter_threat_medium': {
    label: 'Medium Threat',
    desc: 'The encounter requires capable agents. Failure carries meaningful consequences.',
  },
  'ui.encounter_threat_high': {
    label: 'High Threat',
    desc: 'A dangerous encounter. Only your strongest agents can reliably see it through.',
  },
  'ui.encounter_progress': {
    label: 'Encounter Progress',
    desc: 'Steps completed and outcomes so far — how deep into this encounter the agent has come.',
  },

  // ─── Misc ─────────────────────────────────────────────────────────
  'ui.avatar_center': {
    label: 'Center on Avatar',
    desc: 'Scroll the map to your current divine position.',
  },
  'ui.avatar_actions': {
    label: 'Divine Actions',
    desc: 'Open the wheel of interventions available from your current position.',
  },
};

/** Lookup a UI tooltip by ID. Returns null if not found. */
export function getUITooltip(id: string): TooltipContent | null {
  return UI_TOOLTIPS[id] ?? null;
}
