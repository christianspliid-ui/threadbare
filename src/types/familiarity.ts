// ─── Knowledge Level Types ───────────────────────────────────────

/** Progressive disclosure levels: from stranger to complete transparency */
export type KnowledgeLevel = 'stranger' | 'recognised' | 'known' | 'intimate' | 'transparent';

/** Knowledge levels in progression order */
export const KNOWLEDGE_LEVELS: KnowledgeLevel[] = [
  'stranger',
  'recognised',
  'known',
  'intimate',
  'transparent',
];

/** Familiarity score threshold for each knowledge level (0.0-1.0 scale) */
export const FAMILIARITY_THRESHOLDS: Record<KnowledgeLevel, number> = {
  stranger: 0.0,
  recognised: 0.2,
  known: 0.4,
  intimate: 0.6,
  transparent: 0.8,
};

// ─── Familiarity Gain Sources ─────────────────────────────────────

/** Actions/events that increase familiarity with an actor */
export type FamiliarityGainSource =
  | 'worship_tier_1'
  | 'worship_tier_2'
  | 'worship_tier_3'
  | 'proximity'
  | 'scry'
  | 'narrative_contact'
  | 'dilemma';

/** Familiarity gain amount per source */
export const FAMILIARITY_GAINS: Record<FamiliarityGainSource, number> = {
  worship_tier_1: 0.3,
  worship_tier_2: 0.5,
  worship_tier_3: 0.7,
  proximity: 0.01,
  scry: 0.15,
  narrative_contact: 0.05,
  dilemma: 0.10,
};

// ─── Sphere-Specific Bonuses ──────────────────────────────────────

/** Optional modifiers per sphere that affect familiarity revelation */
export interface SphereFamiliarityBonus {
  /** Multiplier for familiarity gain from this sphere (e.g., Eye = 1.5×) */
  multiplier?: number;
  /** If set, traits are revealed 1 level earlier when this sphere is involved */
  revealTraitsEarly?: number;
  /** If set, bonds are revealed 1 level earlier when this sphere is involved */
  revealBondsEarly?: number;
}

/** Sphere-specific familiarity bonuses */
export const SPHERE_FAMILIARITY_BONUSES: Record<string, SphereFamiliarityBonus> = {
  eye: {
    multiplier: 1.5,
  },
  shadow: {
    revealTraitsEarly: 1,
  },
  heart: {
    revealBondsEarly: 1,
  },
};

// ─── Familiarity Map ──────────────────────────────────────────────

/** Map of actor ID → familiarity score (0.0-1.0) */
export type FamiliarityMap = Map<string, number>;
