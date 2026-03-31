import type { SphereName, TerrainType } from './index';
import type { ReachDomain } from './traits';

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
