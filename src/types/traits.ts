/**
 * Trait System type definitions.
 *
 * Traits are graph-native: definitions are nodes (type: 'trait'),
 * assignments are 'has_trait' edges with level/decay/visibility properties.
 */

export type TraitCategory = 'innate' | 'mastery' | 'reputation' | 'scar' | 'condition' | 'destiny';

export type TraitVisibility = 'public' | 'discoverable' | 'divine_only';

/** The Nine Reaches — action domains */
export type ReachDomain =
  | 'iron' | 'gold' | 'shadow' | 'veil' | 'heart'
  | 'eye' | 'stone' | 'star' | 'flesh';

export const REACH_DOMAINS: ReachDomain[] = [
  'iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star', 'flesh',
];

/** Domain contributions: how much a trait contributes to each Reach */
export type DomainContributions = Partial<Record<ReachDomain, number>>;

/** Properties stored on a trait definition node (node.properties) */
export interface TraitDefinitionProperties {
  subcategory: TraitCategory;
  description: string;
  importance: number;            // 0.0–1.0
  maxLevel: number;              // 1 for binary, 3 for scaled
  visibility: TraitVisibility;
  domainContributions: DomainContributions; // per-level contributions
  decayPeriod?: number;          // ticks between decay checks (mastery only)
  tags: string[];
  flavorText: string;
}

/** Properties stored on a has_trait edge (edge.properties) */
export interface TraitAssignmentProperties {
  level: number;
  acquiredTick: number;
  lastReinforcedTick: number;
  source: string;                // what caused acquisition
  visibility: TraitVisibility;
}
