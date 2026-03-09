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

import type { SphereName, TerrainType, CosmologyProfile } from '../types/index';
import { SPHERE_NAMES } from '../types/index';
import type { CultureIdentity } from '../types/culture';
import {
  CULTURE_COUNT,
  CULTURE_STRENGTH_INDIVIDUAL,
  CULTURE_STRENGTH_FACTION,
  DUAL_CULTURE_PROBABILITY,
  CULTURELESS_PROBABILITY,
} from '../types/culture';
import {
  getFoundationModifier,
  getCreationSphereModifier,
  getBiomeModifier,
  CULTURE_NAME_FRAGMENTS,
} from '../data/culture-content';
import type { WorldGraph } from './graph';
import type { FoundationBalances } from '../types/worldSoul';
import { DEFAULT_FOUNDATION_BALANCES } from '../types/worldSoul';
import { generateCultureFlag } from './cultureFlag';

/** Merge arrays and deduplicate */
function mergeUnique(...arrays: string[][]): string[] {
  return [...new Set(arrays.flat())];
}

/** Pick a random element from an array using the provided rng */
function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

// ─── Foundation & Sphere Selection ──────────────────────────────────

const FOUNDATION_IDS = ['chaos', 'order', 'light', 'darkness'] as const;

/**
 * Select a foundation bias weighted by current World-Soul foundation balances.
 */
function selectFoundation(rng: () => number, foundations: FoundationBalances): string {
  const weights: Record<string, number> = {
    chaos: Math.max(0.1, 1.0 - foundations.chaos_order),
    order: Math.max(0.1, 1.0 + foundations.chaos_order),
    light: Math.max(0.1, 1.0 - foundations.light_darkness),
    darkness: Math.max(0.1, 1.0 + foundations.light_darkness),
  };
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let roll = rng() * total;
  for (const [id, w] of Object.entries(weights)) {
    roll -= w;
    if (roll <= 0) return id;
  }
  return 'chaos';
}

/**
 * Select 1-2 creation spheres weighted by cosmology profile.
 */
function selectSpheres(rng: () => number, cosmology: CosmologyProfile): SphereName[] {
  const spheres = [...SPHERE_NAMES];
  const weights = spheres.map(s => Math.max(0.01, cosmology[s]));
  const total = weights.reduce((a, b) => a + b, 0);

  const pickWeighted = (): SphereName => {
    let roll = rng() * total;
    for (let i = 0; i < spheres.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return spheres[i];
    }
    return spheres[0];
  };

  const first = pickWeighted();
  if (rng() < 0.5) {
    let second = pickWeighted();
    let attempts = 0;
    while (second === first && attempts < 5) {
      second = pickWeighted();
      attempts++;
    }
    if (second !== first) return [first, second];
  }
  return [first];
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

// ─── Culture & Location Assignment ──────────────────────────────────

/**
 * Assign a culture to an actor with strength.
 */
export function assignCultureToActor(
  graph: WorldGraph,
  actorId: string,
  cultureId: string,
  strength: number,
): void {
  graph.addEdge({
    id: `edge_culture_${actorId}_${cultureId}`,
    source: actorId,
    target: cultureId,
    type: 'belongs_to',
    properties: { culturalStrength: strength },
  });
}

/**
 * Assign culture to a location (historical or current layer).
 */
export function assignCultureToLocation(
  graph: WorldGraph,
  locationId: string,
  cultureId: string,
  layer: 'historical' | 'current',
): void {
  graph.addEdge({
    id: `edge_culture_${locationId}_${cultureId}_${layer}`,
    source: locationId,
    target: cultureId,
    type: 'belongs_to',
    properties: { culturalStrength: 1.0, cultureLayer: layer },
  });
}

// ─── Main Culture Generator ─────────────────────────────────────────

/**
 * Generate all cultures for the world and add as graph nodes.
 * Also assigns each location a culture (historical + current layers).
 */
export function generateCultures(
  graph: WorldGraph,
  cosmology: CosmologyProfile,
  locationIds: string[],
  rng: () => number,
  foundations?: FoundationBalances,
): string[] {
  const founds = foundations ?? DEFAULT_FOUNDATION_BALANCES;
  const cultureCount = CULTURE_COUNT.min + Math.floor(
    rng() * (CULTURE_COUNT.max - CULTURE_COUNT.min + 1)
  );

  const cultureIds: string[] = [];
  const usedBiomes = new Set<string>();

  for (let i = 0; i < cultureCount; i++) {
    const id = `culture_${i}`;
    const foundationId = selectFoundation(rng, founds);
    const spheres = selectSpheres(rng, cosmology);

    let biome: TerrainType = 'grassland';
    const shuffledLocs = [...locationIds].sort(() => rng() - 0.5);
    for (const locId of shuffledLocs) {
      const node = graph.getNode(locId);
      if (node) {
        const terrain = node.properties.terrain as TerrainType;
        if (!usedBiomes.has(terrain) || i >= locationIds.length) {
          biome = terrain;
          usedBiomes.add(terrain);
          break;
        }
      }
    }

    const identity = composeCultureIdentity(foundationId, spheres, biome);
    const name = generateCultureName(identity, rng);

    // Generate deterministic flag from seeded PRNG
    const flagSeed = Math.floor(rng() * 0xFFFFFFFF);
    const flagSvg = generateCultureFlag(identity, flagSeed);

    graph.addNode({
      id,
      type: 'actor',
      name,
      properties: { actorType: 'culture', cultureIdentity: identity, flagSvg },
    });
    cultureIds.push(id);
  }

  // Assign cultures to locations (round-robin with historical + current)
  for (let i = 0; i < locationIds.length; i++) {
    const cultureId = cultureIds[i % cultureIds.length];
    assignCultureToLocation(graph, locationIds[i], cultureId, 'historical');
    assignCultureToLocation(graph, locationIds[i], cultureId, 'current');
  }

  return cultureIds;
}

/**
 * Assign cultures to all actors based on budget model:
 * - 70% of individuals get 1 culture
 * - 20% get 2 cultures (strengths sum ≤1.0)
 * - 10% get 0 cultures
 * - Factions always get 1 culture
 */
export function assignCulturesToActors(
  graph: WorldGraph,
  individualIds: string[],
  factionIds: string[],
  cultureIds: string[],
  rng: () => number,
): void {
  if (cultureIds.length === 0) return;

  const pickCulture = () => cultureIds[Math.floor(rng() * cultureIds.length)];
  const randInRange = (min: number, max: number) => min + rng() * (max - min);

  for (const facId of factionIds) {
    const strength = randInRange(CULTURE_STRENGTH_FACTION.min, CULTURE_STRENGTH_FACTION.max);
    assignCultureToActor(graph, facId, pickCulture(), strength);
  }

  for (const indId of individualIds) {
    const roll = rng();
    if (roll < CULTURELESS_PROBABILITY) {
      continue;
    } else if (roll < CULTURELESS_PROBABILITY + DUAL_CULTURE_PROBABILITY) {
      const c1 = pickCulture();
      let c2 = pickCulture();
      let attempts = 0;
      while (c2 === c1 && cultureIds.length > 1 && attempts < 5) {
        c2 = pickCulture();
        attempts++;
      }
      const s1 = randInRange(CULTURE_STRENGTH_INDIVIDUAL.min, CULTURE_STRENGTH_INDIVIDUAL.max * 0.6);
      const s2 = Math.min(
        randInRange(CULTURE_STRENGTH_INDIVIDUAL.min, CULTURE_STRENGTH_INDIVIDUAL.max * 0.6),
        1.0 - s1,
      );
      assignCultureToActor(graph, indId, c1, s1);
      if (c2 !== c1) {
        assignCultureToActor(graph, indId, c2, s2);
      }
    } else {
      const strength = randInRange(CULTURE_STRENGTH_INDIVIDUAL.min, CULTURE_STRENGTH_INDIVIDUAL.max);
      assignCultureToActor(graph, indId, pickCulture(), strength);
    }
  }
}
