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

/** 10-tier narrative lexicon per domain */
export const NARRATIVE_LEXICON: Record<ReachDomain, string[]> = {
  iron:   ['Frail', 'Soft', 'Sturdy', 'Trained', 'Steeled', 'Tempered', 'Fearsome', 'Dread', 'Ruinous', 'Cataclysmic'],
  gold:   ['Destitute', 'Poor', 'Thrifty', 'Comfortable', 'Prosperous', 'Wealthy', 'Affluent', 'Magnate', 'Sovereign', 'Imperial'],
  shadow: ['Exposed', 'Clumsy', 'Cautious', 'Sly', 'Veiled', 'Shadowed', 'Masked', 'Spectral', 'Invisible', 'Void'],
  veil:   ['Mundane', 'Dull', 'Touched', 'Sensitive', 'Gifted', 'Adept', 'Arcane', 'Eldritch', 'Transcendent', 'Mythic'],
  heart:  ['Hollow', 'Cold', 'Warm', 'Kind', 'Devoted', 'Inspiring', 'Radiant', 'Luminous', 'Incandescent', 'Absolute'],
  eye:    ['Blind', 'Dim', 'Keen', 'Alert', 'Perceptive', 'Watchful', 'Prescient', 'Oracular', 'Omniscient', 'All-Seeing'],
  stone:  ['Rootless', 'Loose', 'Grounded', 'Settled', 'Rooted', 'Entrenched', 'Enduring', 'Immovable', 'Eternal', 'Primordial'],
  star:   ['Godless', 'Doubting', 'Pious', 'Faithful', 'Devoted', 'Blessed', 'Anointed', 'Exalted', 'Sacred', 'Divine'],
  flesh:  ['Frail', 'Weak', 'Hardy', 'Tough', 'Vigorous', 'Robust', 'Mighty', 'Titanic', 'Undying', 'Deathless'],
};
