/**
 * Siege Encounter Content — TB-073 Phase 4.
 *
 * Spotlight templates for sieges (multi-step narrative beats) and regional
 * encounter templates (nearby entities drawn into the conflict).
 *
 * Design doc: Docs/plans/2026-03-29-conflict-and-destruction-design.md — Phase 4
 *
 * Spotlight templates fire at accelerating intervals during the siege.
 * Regional templates spawn for eligible actors within SIEGE_REGIONAL_ENCOUNTER_RANGE hexes.
 *
 * THR-18: intrinsicTier added to both interfaces. Tier assignments follow dramatic weight:
 * spotlights that frame/sustain pacing = shaping; outcome-pivoting beats = story_beat;
 * slow-burn atmospherics = background. Regionals default background, escalate to shaping
 * when they invite explicit player agency.
 */

import type { AttentionTier } from '../types/attention';

// ─── Spotlight Templates ────────────────────────────────────────────────

export interface SiegeSpotlightTemplate {
  id: string;
  title: string;
  phase: 'opening' | 'early' | 'middle' | 'crescendo' | 'any';
  steps: number;
  reaches: string[];
  prose: string;
  intrinsicTier: AttentionTier;
}

/**
 * Spotlight encounter templates for siege phases.
 * These fire during siege ticks based on the current siege phase.
 */
export const SIEGE_SPOTLIGHT_TEMPLATES: SiegeSpotlightTemplate[] = [
  {
    id: 'siege.spotlight.opens',
    title: 'The Siege Begins',
    phase: 'opening',
    steps: 1,
    reaches: [],
    prose: 'The army draws up before the walls. Banners unfurl in the cold wind. The defenders watch from the ramparts, and the long waiting begins.',
    intrinsicTier: 'shaping',
  },
  {
    id: 'siege.spotlight.sally_forth',
    title: 'The Defenders Sally Forth',
    phase: 'early',
    steps: 2,
    reaches: ['Iron', 'Eye'],
    prose: 'The gates open and armored figures pour out — a desperate strike at the siege lines before they can be fully established.',
    intrinsicTier: 'shaping',
  },
  {
    id: 'siege.spotlight.negotiate_terms',
    title: 'A Flag of Parley',
    phase: 'middle',
    steps: 2,
    reaches: ['Heart', 'Heart'],
    prose: 'A white banner appears at the gatehouse. Whether it signals surrender or stalling, only time will tell.',
    intrinsicTier: 'story_beat',
  },
  {
    id: 'siege.spotlight.starvation',
    title: 'Hunger in the Walls',
    phase: 'middle',
    steps: 1,
    reaches: ['Flesh'],
    prose: 'The granaries are running low. Gaunt faces at the walls. The smell of desperation drifts out over the siege lines.',
    intrinsicTier: 'background',
  },
  {
    id: 'siege.spotlight.breach',
    title: 'The Wall Is Breached',
    phase: 'crescendo',
    steps: 2,
    reaches: ['Iron', 'Stone'],
    prose: 'A thunder-crack, then a cascade of falling masonry. Dust billows outward. Through the haze, a gap in the wall.',
    intrinsicTier: 'story_beat',
  },
  {
    id: 'siege.spotlight.final_assault',
    title: 'The Final Assault',
    phase: 'crescendo',
    steps: 3,
    reaches: ['Iron', 'Iron', 'Heart'],
    prose: 'The moment of decision. Every reserve is committed. The fate of the siege — and the city — will be decided before nightfall.',
    intrinsicTier: 'story_beat',
  },
  {
    id: 'siege.spotlight.relief_arrives',
    title: 'A Relief Force Appears',
    phase: 'any',
    steps: 1,
    reaches: [],
    prose: 'Horns sound in the distance. Banners crest the hill. Someone has answered the call.',
    intrinsicTier: 'story_beat',
  },
];

// ─── Regional Encounter Templates ───────────────────────────────────────

export interface SiegeRegionalTemplate {
  id: string;
  title: string;
  triggerType: 'allied_defender' | 'allied_attacker' | 'shadow' | 'heart' | 'sabotage';
  prose: string;
  intrinsicTier: AttentionTier;
}

/**
 * Regional encounter templates for actors drawn toward a siege.
 * Spawned by generateRegionalEncounters for eligible actors within range.
 */
export const SIEGE_REGIONAL_TEMPLATES: SiegeRegionalTemplate[] = [
  {
    id: 'siege.regional.call_for_aid',
    title: 'The Besieged Call for Aid',
    triggerType: 'allied_defender',
    prose: 'A desperate plea has reached you. The defenders hold on, but not for much longer. Will you march to their relief?',
    intrinsicTier: 'shaping',
  },
  {
    id: 'siege.regional.join_attackers',
    title: 'Join the Siege',
    triggerType: 'allied_attacker',
    prose: 'Your allies press the siege. Bringing your strength to bear now could tip the balance and hasten victory.',
    intrinsicTier: 'background',
  },
  {
    id: 'siege.regional.smuggle_supplies',
    title: 'The Smuggler\'s Run',
    triggerType: 'shadow',
    prose: 'The siege lines are never airtight. Salt, grain, and medicine can be moved through shadow paths — for the right price, or the right cause.',
    intrinsicTier: 'shaping',
  },
  {
    id: 'siege.regional.negotiate_terms',
    title: 'Seek a Negotiated End',
    triggerType: 'heart',
    prose: 'Blood need not water these fields. A neutral voice, respected by both sides, might broker terms that let both factions walk away intact.',
    intrinsicTier: 'shaping',
  },
  {
    id: 'siege.regional.sabotage',
    title: 'Sabotage from the Shadows',
    triggerType: 'sabotage',
    prose: 'An opportunity presents itself: siege engines unguarded, supply lines exposed. One well-placed hand could change the outcome entirely.',
    intrinsicTier: 'background',
  },
];
