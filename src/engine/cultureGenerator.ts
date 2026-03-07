/**
 * Culture Generator — composes culture identities and assigns them at world seeding time.
 *
 * Pure functions called from seedWorld(). Each culture is generated from:
 * 1. Foundation bias (chaos/order/light/darkness)
 * 2. 1-2 venerated creation spheres
 * 3. Primary biome from origin location terrain
 *
 * Source: Docs/plans/2026-03-07-culture-generator-design.md
 */

import type { SphereName, TerrainType } from '../types/index';
import type { CultureIdentity } from '../types/culture';
import {
  getFoundationModifier,
  getCreationSphereModifier,
  getBiomeModifier,
  CULTURE_NAME_FRAGMENTS,
} from '../data/culture-content';

/** Merge arrays and deduplicate */
function mergeUnique(...arrays: string[][]): string[] {
  return [...new Set(arrays.flat())];
}

/** Pick a random element from an array using the provided rng */
function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

/**
 * Compose a culture identity from foundation + creation sphere + biome modifiers.
 * Merges keyword pools, material vocabulary, metaphor palettes, and trait seed IDs.
 */
export function composeCultureIdentity(
  foundationId: string,
  spheres: SphereName[],
  biome: TerrainType,
): CultureIdentity {
  const foundation = getFoundationModifier(foundationId);
  const sphereMods = spheres
    .map(s => getCreationSphereModifier(s))
    .filter((m): m is NonNullable<typeof m> => m !== undefined);
  const biomeMod = getBiomeModifier(biome);

  const socialStructure = foundation?.socialStructure ?? 'Mixed traditions';
  const accountability = foundation?.accountability ?? 'Community consensus';
  const foundationKeywords = foundation?.behavioralKeywords ?? [];
  const foundationMetaphors = foundation?.metaphorSeeds ?? [];

  const sphereKeywords = sphereMods.flatMap(m => m.behavioralKeywords);
  const sphereMaterial = sphereMods.flatMap(m => m.materialVocabulary);
  const sphereFormative = sphereMods.flatMap(m => m.formativeTraitSeeds);
  const sphereBehavioral = sphereMods.flatMap(m => m.behavioralTraitSeeds);

  const biomeKeywords = biomeMod?.survivalTraitKeywords ?? [];
  const biomeMaterial = biomeMod?.materialCulture ?? [];
  const biomeMetaphors = biomeMod?.metaphorPalette ?? [];

  return {
    foundationBias: foundationId,
    veneratedSpheres: spheres,
    primaryBiome: biome,
    socialStructure,
    accountability,
    behavioralKeywords: mergeUnique(foundationKeywords, sphereKeywords, biomeKeywords),
    materialVocabulary: mergeUnique(sphereMaterial, biomeMaterial),
    metaphorPalette: mergeUnique(foundationMetaphors, biomeMetaphors),
    formativeTraitSeedIds: mergeUnique(sphereFormative),
    behavioralTraitSeedIds: mergeUnique(sphereBehavioral),
  };
}

/**
 * Generate a culture name from modifier fragments.
 * Uses pattern templates filled with foundation/sphere/biome name fragments.
 */
export function generateCultureName(
  identity: CultureIdentity,
  rng: () => number,
): string {
  const foundFrags = CULTURE_NAME_FRAGMENTS.foundation[identity.foundationBias];
  const foundFrag = foundFrags ? pick(rng, foundFrags) : identity.foundationBias;

  const sphereFrags = CULTURE_NAME_FRAGMENTS.sphere[identity.veneratedSpheres[0]];
  const sphereFrag = sphereFrags ? pick(rng, sphereFrags) : identity.veneratedSpheres[0];

  const biomeFrags = CULTURE_NAME_FRAGMENTS.biome[identity.primaryBiome];
  const biomeFrag = biomeFrags ? pick(rng, biomeFrags) : identity.primaryBiome;

  const pattern = pick(rng, CULTURE_NAME_FRAGMENTS.patterns);

  return pattern
    .replace('{foundation}', foundFrag)
    .replace('{sphere}', sphereFrag)
    .replace('{biome}', biomeFrag);
}
