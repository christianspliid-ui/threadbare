/**
 * Trait definitions that carry attribute modifiers.
 *
 * These define which traits grant modifiers when assigned via has_trait edges.
 * The modifiers record is copied to the has_trait edge properties at assignment time.
 */

import type { TraitCategory } from '../types/traits';

export interface TraitModifierDefinition {
  traitId: string;
  name: string;
  /**
   * Trait category. Named `subcategory` to match the canonical field on
   * `TraitDefinitionProperties` (`types/traits.ts`) — these rows describe trait
   * definitions, so they use the same vocabulary the graph nodes do (THR-787).
   */
  subcategory: TraitCategory;
  description: string;
  modifiers: Record<string, number>;
}

export const LOS_TRAIT_DEFINITIONS: TraitModifierDefinition[] = [
  {
    traitId: 'trait.innate.eagle-eyed',
    name: 'Eagle-Eyed',
    subcategory: 'innate',
    description: 'Born with exceptional visual acuity. Sees further than most.',
    modifiers: { los_range: 1 },
  },
  {
    traitId: 'trait.scar.night-blind',
    name: 'Night Blind',
    subcategory: 'scar',
    description: 'A wound or curse has dimmed their sight. Struggles to see beyond arm\'s reach.',
    modifiers: { los_range: -1 },
  },
  {
    traitId: 'trait.mastery.far-sight',
    name: 'Far Sight',
    subcategory: 'mastery',
    description: 'Years of training or magical attunement grant vision across great distances.',
    modifiers: { los_range: 2 },
  },
  {
    traitId: 'trait.condition.fog-touched',
    name: 'Fog-Touched',
    subcategory: 'condition',
    description: 'A lingering miasma clings to them, clouding their perception.',
    modifiers: { los_range: -1 },
  },
  {
    traitId: 'trait.innate.mountain-born',
    name: 'Mountain-Born',
    subcategory: 'innate',
    description: 'Raised among peaks, accustomed to reading distant horizons.',
    modifiers: { los_range: 1 },
  },
];

/** Lookup modifiers for a trait by ID. Returns empty record if not found. */
export function getLOSTraitModifiers(traitId: string): Record<string, number> {
  const def = LOS_TRAIT_DEFINITIONS.find(d => d.traitId === traitId);
  return def?.modifiers ?? {};
}
