import type { SphereName, TerrainType } from './index';
import type { ReachDomain } from './traits';

// ─── Phonetic Signature Types ────────────────────────────────────

export type SyllableTemplate = 'CV' | 'CVC' | 'VC' | 'CVV' | 'CVVC';

export type PhoneticOrthography = 'title' | 'compound' | 'apostrophe';

/**
 * Deterministic per-culture phoneme inventory and syllable rules.
 * Built once at worldgen time and stored on the culture node.
 * Drives name generation for agents, settlements, demonyms, and homelands.
 */
export interface CulturePhoneticSignature {
  seedHash: number;
  vowels: string[];
  onsets: string[];
  codas: string[];
  syllableTemplates: SyllableTemplate[];
  personalSyllableRange: { min: number; max: number };
  settlementSyllableRange: { min: number; max: number };
  nameSuffixes: string[];
  settlementSuffixes: string[];
  orthography: PhoneticOrthography;
}

// ─── Phonetic Generator Constants ────────────────────────────────

export const PHONETIC_GENERATOR_ENABLED = true;
export const PHONETIC_SEED_SALT = 0x9E3779B1;
export const VOWEL_COUNT_RANGE = { min: 3, max: 5 };
export const ONSET_COUNT_RANGE = { min: 4, max: 8 };
export const CODA_COUNT_RANGE = { min: 0, max: 6 };
export const OPEN_SYLLABLE_CHANCE_BY_FOUNDATION: Record<string, number> = {
  chaos: 0.45, order: 0.1, light: 0.55, darkness: 0.15,
};
export const SYLLABLE_TEMPLATE_COUNT_RANGE = { min: 2, max: 3 };
export const PERSONAL_SYLLABLE_RANGE = { min: 2, max: 3 };
export const SETTLEMENT_SYLLABLE_RANGE = { min: 2, max: 4 };
export const NAME_SUFFIX_CHANCE = 0.4;
export const SETTLEMENT_SUFFIX_CHANCE = 0.7;
export const MAX_PHONETIC_ATTEMPTS = 16;
/** Chance phonetic generator is tried before curated pool. 0 = pool always first. */
export const PHONETIC_PRIMARY_CHANCE = 0.35;

/**
 * Composed culture identity — merged from foundation + creation sphere + biome modifiers.
 * Generated at world seeding time by cultureGenerator.ts.
 */
export interface CultureIdentity {
  foundationBias: string;
  veneratedSpheres: SphereName[];
  primaryBiome: TerrainType;   // kept for backward compatibility
  preferredBiomes: TerrainType[];   // 3 core biomes for province generation (worldgen)
  toleratedBiomes: TerrainType[];   // up to 5 additional biomes for heartland
  /** Human-readable archetype label, e.g. "The Protector Mountain Folk" */
  archetypeLabel: string;
  /** Short demonym for the people, e.g. "Daru" */
  demonym?: string;
  /** Name for the culture's homeland, e.g. "Daruheim" */
  homePlaceName?: string;
  socialStructure: string;
  accountability: string;
  behavioralKeywords: string[];
  materialVocabulary: string[];
  metaphorPalette: string[];
  formativeTraitSeedIds: string[];
  behavioralTraitSeedIds: string[];
  readonly reachPreferences: Record<ReachDomain, number>;
}

/**
 * Properties stored on belongs_to edges between actors/locations and culture nodes.
 */
export interface CultureEdgeProperties {
  culturalStrength: number;
  cultureLayer?: 'historical' | 'current';
}

// ─── Tunable Constants ──────────────────────────────────────────

/** Flat fallback used when tileCount is unknown. */
export const CULTURE_COUNT = { min: 2, max: 4 };

/**
 * Culture count per map size tier (tile area thresholds match worldSeed.ts mapSizeKey logic).
 * Fixed counts while playtesting — revisit once kingdom rivalry is implemented.
 * small ≤400 tiles (20×15): 2 | medium ≤1000 (32×24): 3 | large ≤2000 (48×36): 4 | epic >2000: 5
 */
export const CULTURE_COUNT_BY_TILE_COUNT: Array<{ maxTiles: number; count: number }> = [
  { maxTiles: 400,      count: 2 },
  { maxTiles: 1000,     count: 3 },
  { maxTiles: 2000,     count: 4 },
  { maxTiles: Infinity, count: 5 },
];
export const CULTURE_STRENGTH_INDIVIDUAL = { min: 0.5, max: 0.9 };
export const CULTURE_STRENGTH_FACTION = { min: 0.6, max: 0.95 };
export const DUAL_CULTURE_PROBABILITY = 0.2;
export const CULTURELESS_PROBABILITY = 0.1;

// ─── Territory-Aware Seeding Constants ────────────────────────
export const CULTURE_HOMELAND_STRENGTH = { min: 0.7, max: 0.9 };
export const CULTURE_BORDER_STRENGTH = { min: 0.3, max: 0.5 };
export const CULTURE_BORDER_DUAL_CHANCE = 0.4;
export const CULTURE_DIASPORA_FRACTION = 0.1;
export const CULTURE_WILDERNESS_CHANCE = 0.3;

// ─── Culture Settlement Hierarchy ─────────────────────────────
/** Target settlement composition per culture province. */
export const CULTURE_SETTLEMENT_QUOTA = {
  capital: 1,
  city: 1,
  town: 3,
  hamlet: 9,
} as const;
