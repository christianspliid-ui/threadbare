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

export const CULTURE_COUNT = { min: 2, max: 4 };
export const CULTURE_STRENGTH_INDIVIDUAL = { min: 0.5, max: 0.9 };
export const CULTURE_STRENGTH_FACTION = { min: 0.6, max: 0.95 };
export const DUAL_CULTURE_PROBABILITY = 0.2;
export const CULTURELESS_PROBABILITY = 0.1;
