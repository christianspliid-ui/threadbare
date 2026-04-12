/**
 * Condition Trait Content Package — transient condition traits applied
 * during encounter outcomes.
 *
 * Conditions use ticksRemaining for automatic decay via conditionDecay.ts.
 * Duration is set at assignment time, not in the definition.
 *
 * ─── Constants ──────────────────────────────────────────────────
 * | Name                          | Default | Purpose                             |
 * |-------------------------------|---------|-------------------------------------|
 * | CONDITION_WOUNDED_DURATION     | 24      | Ticks (2 game days)                 |
 * | CONDITION_INSPIRED_DURATION    | 18      | Ticks (1.5 game days)               |
 * | CONDITION_TERRIFIED_DURATION   | 12      | Ticks (1 game day)                  |
 * | CONDITION_BLESSED_DURATION     | 36      | Ticks (3 game days)                 |
 * | CONDITION_CURSED_DURATION      | 36      | Ticks (3 game days)                 |
 * | CONDITION_EXHAUSTED_DURATION   | 12      | Ticks (1 game day)                  |
 */

import type { GraphNode } from '../types/graph';
import type { TraitDefinitionProperties } from '../types/traits';

// ─── Duration Constants (ticks) ─────────────────────────────────────────────

/** Duration for wounded condition (2 game days) */
export const CONDITION_WOUNDED_DURATION = 24;

/** Duration for inspired condition (1.5 game days) */
export const CONDITION_INSPIRED_DURATION = 18;

/** Duration for terrified condition (1 game day) */
export const CONDITION_TERRIFIED_DURATION = 12;

/** Duration for blessed condition (3 game days) */
export const CONDITION_BLESSED_DURATION = 36;

/** Duration for cursed condition (3 game days) */
export const CONDITION_CURSED_DURATION = 36;

/** Duration for exhausted condition (1 game day) */
export const CONDITION_EXHAUSTED_DURATION = 12;

// ─── Trait Definition Nodes ─────────────────────────────────────────────────

export const CONDITION_TRAIT_DEFINITIONS: GraphNode[] = [
  {
    id: 'trait.condition.wounded',
    type: 'trait',
    name: 'Wounded',
    properties: {
      subcategory: 'condition',
      description: 'Suffering from injuries sustained in conflict. Combat effectiveness reduced.',
      importance: 0.7,
      maxLevel: 1,
      visibility: 'public',
      domainContributions: { iron: -0.08, stone: -0.04 },
      tags: ['#condition', '#combat', '#negative'],
      flavorText: 'Blood seeps through hastily bound cloth, a reminder that flesh is fragile.',
    } as TraitDefinitionProperties,
  },
  {
    id: 'trait.condition.inspired',
    type: 'trait',
    name: 'Inspired',
    properties: {
      subcategory: 'condition',
      description: 'Buoyed by a triumph of the spirit. Social and creative endeavors flourish.',
      importance: 0.6,
      maxLevel: 1,
      visibility: 'public',
      domainContributions: { heart: 0.08, star: 0.04 },
      tags: ['#condition', '#social', '#positive'],
      flavorText: 'A fire burns behind their eyes — the kind that lights other fires.',
    } as TraitDefinitionProperties,
  },
  {
    id: 'trait.condition.terrified',
    type: 'trait',
    name: 'Terrified',
    properties: {
      subcategory: 'condition',
      description: 'Gripped by fear from a harrowing encounter. Avoids danger at all costs.',
      importance: 0.7,
      maxLevel: 1,
      visibility: 'public',
      domainContributions: { iron: -0.06, shadow: 0.04 },
      tags: ['#condition', '#combat', '#negative'],
      flavorText: 'Every shadow hides a threat. Every silence hides a scream.',
    } as TraitDefinitionProperties,
  },
  {
    id: 'trait.condition.blessed',
    type: 'trait',
    name: 'Blessed',
    properties: {
      subcategory: 'condition',
      description: 'Touched by divine favor. Fortune bends in their direction.',
      importance: 0.8,
      maxLevel: 1,
      visibility: 'public',
      domainContributions: { star: 0.10, heart: 0.04 },
      tags: ['#condition', '#divine', '#positive'],
      flavorText: 'Light follows them — not the blinding kind, but the kind that opens doors.',
    } as TraitDefinitionProperties,
  },
  {
    id: 'trait.condition.cursed',
    type: 'trait',
    name: 'Cursed',
    properties: {
      subcategory: 'condition',
      description: 'Marked by malign forces. Misfortune clings to every endeavor.',
      importance: 0.8,
      maxLevel: 1,
      visibility: 'discoverable',
      domainContributions: { star: -0.08, gold: -0.06 },
      tags: ['#condition', '#mystical', '#negative'],
      flavorText: 'The world tilts against them in small, cruel ways.',
    } as TraitDefinitionProperties,
  },
  {
    id: 'trait.condition.exhausted',
    type: 'trait',
    name: 'Exhausted',
    properties: {
      subcategory: 'condition',
      description: 'Pushed beyond their limits. Everything takes more effort.',
      importance: 0.5,
      maxLevel: 1,
      visibility: 'public',
      domainContributions: { iron: -0.04, eye: -0.04, stone: -0.04 },
      tags: ['#condition', '#general', '#negative'],
      flavorText: 'Their limbs carry the weight of a world that will not let them rest.',
    } as TraitDefinitionProperties,
  },
];

/** Map of condition trait IDs to their default durations */
export const CONDITION_DURATIONS: Record<string, number> = {
  'trait.condition.wounded': CONDITION_WOUNDED_DURATION,
  'trait.condition.inspired': CONDITION_INSPIRED_DURATION,
  'trait.condition.terrified': CONDITION_TERRIFIED_DURATION,
  'trait.condition.blessed': CONDITION_BLESSED_DURATION,
  'trait.condition.cursed': CONDITION_CURSED_DURATION,
  'trait.condition.exhausted': CONDITION_EXHAUSTED_DURATION,
};
