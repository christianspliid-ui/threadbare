/**
 * Mastery Trait Content Package — mastery traits earned through repeated
 * success in non-economic encounter domains.
 *
 * Each trait is a graph node (type: 'trait') with TraitDefinitionProperties.
 * Acquisition is handled by phaseEncounterTraits; these are just definitions.
 *
 * Mastery traits decay without reinforcement (decayPeriod in ticks).
 *
 * ─── Constants ──────────────────────────────────────────────────
 * | Name                              | Default | Purpose                               |
 * |-----------------------------------|---------|---------------------------------------|
 * | MASTERY_IRON_MIN_SUCCESSES        | 4       | Combat successes needed for level 1   |
 * | MASTERY_HEART_MIN_SUCCESSES       | 4       | Social successes needed for level 1   |
 * | MASTERY_SHADOW_MIN_SUCCESSES      | 4       | Stealth successes needed for level 1  |
 * | MASTERY_VEIL_MIN_SUCCESSES        | 4       | Mystical successes needed for level 1 |
 * | MASTERY_EYE_MIN_SUCCESSES         | 4       | Perception successes needed for level 1|
 * | MASTERY_STONE_MIN_SUCCESSES       | 4       | Stability successes needed for level 1|
 * | MASTERY_STAR_MIN_SUCCESSES        | 5       | Divine successes needed for level 1   |
 * | MASTERY_DECAY_PERIOD              | 48      | Ticks before level loss (4 game days) |
 */

import type { GraphNode } from '../types/graph';
import type { TraitDefinitionProperties } from '../types/traits';

// ─── Acquisition Threshold Constants ────────────────────────────────────────

/** Minimum combat encounter successes for battle-hardened */
export const MASTERY_IRON_MIN_SUCCESSES = 4;

/** Minimum social encounter successes for silver tongue */
export const MASTERY_HEART_MIN_SUCCESSES = 4;

/** Minimum stealth/shadow encounter successes for shadow walker */
export const MASTERY_SHADOW_MIN_SUCCESSES = 4;

/** Minimum mystical encounter successes for spell-weaver */
export const MASTERY_VEIL_MIN_SUCCESSES = 4;

/** Minimum perception/eye encounter successes for keen-eyed */
export const MASTERY_EYE_MIN_SUCCESSES = 4;

/** Minimum stability/stone encounter successes for steadfast */
export const MASTERY_STONE_MIN_SUCCESSES = 4;

/** Minimum divine/star encounter successes for anointed */
export const MASTERY_STAR_MIN_SUCCESSES = 5;

/** Ticks between decay checks for all mastery traits (4 game days) */
export const MASTERY_DECAY_PERIOD = 48;

// ─── Trait Definition Nodes ─────────────────────────────────────────────────

export const MASTERY_TRAIT_DEFINITIONS: GraphNode[] = [
  {
    id: 'trait.mastery.battle-hardened',
    type: 'trait',
    name: 'Battle-Hardened',
    properties: {
      subcategory: 'mastery',
      description: 'Forged in repeated combat, their reflexes are honed to a deadly edge.',
      importance: 0.8,
      maxLevel: 3,
      visibility: 'public',
      domainContributions: { iron: 0.10 },
      decayPeriod: MASTERY_DECAY_PERIOD,
      tags: ['#iron', '#combat', '#mastery'],
      flavorText: 'Every scar is a lesson written in flesh.',
    } as TraitDefinitionProperties,
  },
  {
    id: 'trait.mastery.silver-tongue',
    type: 'trait',
    name: 'Silver Tongue',
    properties: {
      subcategory: 'mastery',
      description: 'Words flow like water — persuading, inspiring, and disarming in equal measure.',
      importance: 0.8,
      maxLevel: 3,
      visibility: 'public',
      domainContributions: { heart: 0.10 },
      decayPeriod: MASTERY_DECAY_PERIOD,
      tags: ['#heart', '#social', '#mastery'],
      flavorText: 'They could talk a dragon into lending its hoard.',
    } as TraitDefinitionProperties,
  },
  {
    id: 'trait.mastery.shadow-walker',
    type: 'trait',
    name: 'Shadow Walker',
    properties: {
      subcategory: 'mastery',
      description: 'Moves unseen and unheard, a ghost in the margins of the world.',
      importance: 0.8,
      maxLevel: 3,
      visibility: 'discoverable',
      domainContributions: { shadow: 0.10 },
      decayPeriod: MASTERY_DECAY_PERIOD,
      tags: ['#shadow', '#stealth', '#mastery'],
      flavorText: 'Even their footsteps forget where they walked.',
    } as TraitDefinitionProperties,
  },
  {
    id: 'trait.mastery.spell-weaver',
    type: 'trait',
    name: 'Spell-Weaver',
    properties: {
      subcategory: 'mastery',
      description: 'The arcane answers their call with growing familiarity.',
      importance: 0.8,
      maxLevel: 3,
      visibility: 'public',
      domainContributions: { veil: 0.10 },
      decayPeriod: MASTERY_DECAY_PERIOD,
      tags: ['#veil', '#mystical', '#mastery'],
      flavorText: 'Magic clings to them like morning dew.',
    } as TraitDefinitionProperties,
  },
  {
    id: 'trait.mastery.keen-eyed',
    type: 'trait',
    name: 'Keen-Eyed',
    properties: {
      subcategory: 'mastery',
      description: 'Nothing escapes their notice — patterns, lies, and hidden things alike.',
      importance: 0.7,
      maxLevel: 3,
      visibility: 'public',
      domainContributions: { eye: 0.10 },
      decayPeriod: MASTERY_DECAY_PERIOD,
      tags: ['#eye', '#perception', '#mastery'],
      flavorText: 'They see the threads that bind cause to consequence.',
    } as TraitDefinitionProperties,
  },
  {
    id: 'trait.mastery.steadfast',
    type: 'trait',
    name: 'Steadfast',
    properties: {
      subcategory: 'mastery',
      description: 'An anchor in storms — unyielding through labor, siege, and upheaval.',
      importance: 0.7,
      maxLevel: 3,
      visibility: 'public',
      domainContributions: { stone: 0.10 },
      decayPeriod: MASTERY_DECAY_PERIOD,
      tags: ['#stone', '#stability', '#mastery'],
      flavorText: 'The mountain does not flinch when the wind howls.',
    } as TraitDefinitionProperties,
  },
  {
    id: 'trait.mastery.anointed',
    type: 'trait',
    name: 'Anointed',
    properties: {
      subcategory: 'mastery',
      description: 'Touched by the divine through repeated acts of faith and sacrifice.',
      importance: 0.9,
      maxLevel: 3,
      visibility: 'public',
      domainContributions: { star: 0.12 },
      decayPeriod: MASTERY_DECAY_PERIOD,
      tags: ['#star', '#divine', '#mastery'],
      flavorText: 'The light remembers those who serve it.',
    } as TraitDefinitionProperties,
  },
];

/** Map from reach domain to the mastery trait ID for that domain */
export const MASTERY_TRAIT_BY_REACH: Record<string, string> = {
  iron: 'trait.mastery.battle-hardened',
  heart: 'trait.mastery.silver-tongue',
  shadow: 'trait.mastery.shadow-walker',
  veil: 'trait.mastery.spell-weaver',
  eye: 'trait.mastery.keen-eyed',
  stone: 'trait.mastery.steadfast',
  star: 'trait.mastery.anointed',
};

/** Map from reach domain to the minimum successes required */
export const MASTERY_THRESHOLDS: Record<string, number> = {
  iron: MASTERY_IRON_MIN_SUCCESSES,
  heart: MASTERY_HEART_MIN_SUCCESSES,
  shadow: MASTERY_SHADOW_MIN_SUCCESSES,
  veil: MASTERY_VEIL_MIN_SUCCESSES,
  eye: MASTERY_EYE_MIN_SUCCESSES,
  stone: MASTERY_STONE_MIN_SUCCESSES,
  star: MASTERY_STAR_MIN_SUCCESSES,
};
