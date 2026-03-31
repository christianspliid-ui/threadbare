/**
 * Trait System type definitions.
 *
 * Traits are graph-native: definitions are nodes (type: 'trait'),
 * assignments are 'has_trait' edges with level/decay/visibility properties.
 */

import type { CulturalStrengthRange } from '../data/culture-content';

export type TraitCategory = 'innate' | 'mastery' | 'reputation' | 'scar' | 'condition' | 'destiny' | 'cultural' | 'bestowed';

// ─── Reputation Trait Effects (parseable payload) ──────────────────

/** Polarity of a reach-based reputation trait */
export type ReputationPolarity = 'positive' | 'negative';

/** Who reacts to the bearer's reputation */
export type ReputationReactionTarget =
  | 'merchant' | 'guard' | 'commoner' | 'scholar' | 'priest'
  | 'faction_rival' | 'faction_ally' | 'monster' | 'criminal';

/** What the reaction is */
export type ReputationReactionEffect =
  | 'defer' | 'flee' | 'approach' | 'hostility' | 'reverence'
  | 'price_gouge' | 'discount' | 'recruit' | 'avoid' | 'challenge';

/** A single NPC/entity reaction to a reputation bearer */
export interface ReputationReaction {
  /** Who reacts */
  target: ReputationReactionTarget;
  /** What they do */
  effect: ReputationReactionEffect;
  /** Strength of reaction (0.0–1.0), scaled by reputation level */
  magnitude: number;
}

/**
 * Parseable effects payload for reputation traits.
 * Consumed by encounter pipeline, social system, disposition, and prose enrichment.
 */
export interface ReputationEffects {
  /** How other entities react to the bearer */
  reactions: ReputationReaction[];
  /** Encounter IDs this reputation unlocks or blocks */
  encounterGates: {
    unlocks: string[];
    blocks: string[];
  };
  /** Per-reach scoring modifiers applied additively in encounter scoring */
  scoringModifiers: Partial<Record<ReachDomain, number>>;
  /** Hex range per level: [level1, level2, level3] (0=same hex, 3=regional, 99=world) */
  scopeByLevel: [number, number, number];
}

export type TraitVisibility = 'public' | 'discoverable' | 'divine_only';

/** The Eight Reaches — action domains (Flesh reach removed in TB-075 Phase 1; absorbed into Quintessence) */
export type ReachDomain =
  | 'iron' | 'gold' | 'shadow' | 'veil' | 'heart'
  | 'eye' | 'stone' | 'star';

export const REACH_DOMAINS: ReachDomain[] = [
  'iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star',
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
  strengthThresholds?: Partial<Record<CulturalStrengthRange, string>>; // cultural trait strength expressions
  /** Parseable reputation effects — only present on subcategory: 'reputation' traits with reach-polarity structure */
  reputationEffects?: ReputationEffects;
}

/** Properties stored on a has_trait edge (edge.properties) */
export interface TraitAssignmentProperties {
  level: number;
  acquiredTick: number;
  lastReinforcedTick: number;
  source: string;                // what caused acquisition
  visibility: TraitVisibility;
  /** Ticks until auto-removal. null = permanent until dispelled. undefined = no decay. */
  ticksRemaining?: number | null;
  /** Attribute deltas carried by this trait assignment (fed into modifier engine). */
  modifiers?: Record<string, number>;
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
  // Flesh lexicon removed (TB-075 Phase 1) — content migrated to Quintessence reach in Plan 02:
  // flesh: ['Frail', 'Weak', 'Hardy', 'Tough', 'Vigorous', 'Robust', 'Mighty', 'Titanic', 'Undying', 'Deathless'],
};
