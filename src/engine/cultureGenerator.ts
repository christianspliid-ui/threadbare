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
import type { ReachDomain } from '../types/traits';
import { REACH_DOMAINS } from '../types/traits';
import { REACH_VALUE_PAIR, ARCHETYPE_NAMES } from '../types/agent';
import {
  CULTURE_COUNT,
  CULTURE_COUNT_BY_TILE_COUNT,
  CULTURE_STRENGTH_INDIVIDUAL,
  CULTURE_STRENGTH_FACTION,
  DUAL_CULTURE_PROBABILITY,
  CULTURELESS_PROBABILITY,
  CULTURE_HOMELAND_STRENGTH,
  CULTURE_BORDER_STRENGTH,
  CULTURE_BORDER_DUAL_CHANCE,
  CULTURE_DIASPORA_FRACTION,
} from '../types/culture';
import {
  getFoundationModifier,
  getCreationSphereModifier,
  getBiomeModifier,
  CULTURE_NAME_FRAGMENTS,
  BIOME_MODIFIERS,
} from '../data/culture-content';
import type { CultureForWorldgen } from './worldgen/types';
import { PROVINCE_ROLE_CAPITAL, PROVINCE_ROLE_HEARTLAND } from './worldgen/types';
import type { WorldGraph } from './graph';
import type { FundamentState } from '../types/worldSoul';
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
 * Select a foundation bias weighted by current World-Soul foundation sphere weights.
 * Higher sphere weight = more likely to be selected as foundation bias.
 */
function selectFoundation(rng: () => number, sphereWeights: Record<string, number>): string {
  const weights: Record<string, number> = {
    chaos: Math.max(0.1, sphereWeights.chaos ?? (1 / 12)),
    order: Math.max(0.1, sphereWeights.order ?? (1 / 12)),
    light: Math.max(0.1, sphereWeights.light ?? (1 / 12)),
    darkness: Math.max(0.1, sphereWeights.darkness ?? (1 / 12)),
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
 * Compose reach preferences by summing reachWeights from foundation, sphere, and biome modifiers,
 * then clamping each domain to [-1, 1].
 */
function composeReachPreferences(
  foundation: ReturnType<typeof getFoundationModifier>,
  spheres: ReturnType<typeof getCreationSphereModifier>[],
  biome: ReturnType<typeof getBiomeModifier>,
): Record<ReachDomain, number> {
  const result = {} as Record<ReachDomain, number>;
  for (const domain of REACH_DOMAINS) {
    const sum =
      (foundation?.reachWeights[domain] ?? 0) +
      spheres.reduce((acc, s) => acc + (s?.reachWeights[domain] ?? 0), 0) +
      (biome?.reachWeights[domain] ?? 0);
    result[domain] = Math.max(-1, Math.min(1, sum));
  }
  return result;
}

/** Convert snake_case terrain to Title Case (e.g. 'boreal_forest' → 'Boreal Forest') */
function biomeLabel(terrain: TerrainType): string {
  return terrain.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

/** Biome collective nouns for archetype labels */
const BIOME_FOLK: Partial<Record<string, string>> = {
  ocean: 'Seafarers', deep_ocean: 'Abyssal Folk', coastal_shallows: 'Shore Folk',
  coast: 'Coast Folk', lake: 'Lake Folk', river: 'River Folk', reef: 'Reef Folk',
  grassland: 'Plains Folk', farmland: 'Tillers', savanna: 'Savanna Folk',
  steppe: 'Steppe Riders', temperate_forest: 'Forest Folk', dense_forest: 'Deepwood Folk',
  boreal_forest: 'Taiga Folk', jungle: 'Jungle Folk', tropical_forest: 'Canopy Folk',
  swamp: 'Swamp Folk', marsh: 'Marsh Folk', moor_bog: 'Moor Folk',
  hills: 'Hill Folk', forested_hills: 'Hill Folk', mountains: 'Mountain Folk',
  high_mountains: 'Highland Folk', mountain_pass: 'Pass Wardens', plateau: 'Plateau Folk',
  badlands: 'Badlands Folk', desert: 'Desert Folk', rocky_desert: 'Stone Desert Folk',
  sand_dunes: 'Dune Folk', oasis: 'Oasis Folk', tundra: 'Tundra Folk',
  snow_fields: 'Snow Folk', arctic: 'Frost Folk', glacier: 'Glacier Folk',
  volcano: 'Volcanic Folk', floodplain: 'Floodplain Folk', dead_forest: 'Ashwood Folk',
  evergreen_forest: 'Evergreen Folk', light_forest: 'Glade Folk',
  great_home_trees: 'Treehome Folk', broken_lands: 'Broken Lands Folk',
  tropical_ocean: 'Warm Sea Folk',
};

/**
 * Derive a readable archetype label from reach preferences and biome.
 * E.g. "The Protector Mountain Folk" or "The Seeker Forest Folk".
 * Uses the dominant reach → value pair → archetype name system.
 */
function composeArchetypeLabel(reachPrefs: Record<ReachDomain, number>, biome: TerrainType): string {
  // Find the two strongest reaches
  const sorted = (Object.entries(reachPrefs) as [ReachDomain, number][])
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));

  const topReach = sorted[0]?.[0];
  const topValue = sorted[0]?.[1] ?? 0;

  if (!topReach) return `The ${BIOME_FOLK[biome] ?? biomeLabel(biome) + ' Folk'}`;

  const valuePair = REACH_VALUE_PAIR[topReach];
  const archetype = ARCHETYPE_NAMES[valuePair];
  // Positive reach preference → positive archetype, negative → negative archetype
  const title = topValue >= 0 ? archetype.positive : archetype.negative;

  const folk = BIOME_FOLK[biome] ?? biomeLabel(biome) + ' Folk';
  return `The ${title} ${folk}`;
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

  const reachPreferences = composeReachPreferences(foundation, sphereMods, biomeMod);

  return {
    foundationBias: foundationId,
    veneratedSpheres: spheres,
    primaryBiome: biome,
    preferredBiomes: (biomeMod?.preferredBiomes ?? [biome]) as TerrainType[],
    toleratedBiomes: (biomeMod?.toleratedBiomes ?? []) as TerrainType[],
    archetypeLabel: composeArchetypeLabel(reachPreferences, biome),
    socialStructure,
    accountability,
    behavioralKeywords: mergeUnique(foundationKeywords, sphereKeywords, biomeKeywords),
    materialVocabulary: mergeUnique(sphereMaterial, biomeMaterial),
    metaphorPalette: mergeUnique(foundationMetaphors, biomeMetaphors),
    formativeTraitSeedIds: mergeUnique(sphereFormative),
    behavioralTraitSeedIds: mergeUnique(sphereBehavioral),
    reachPreferences,
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

  // Assign culture trait to actor for gating
  const traitNodeId = `trait.culture.${cultureId}`;
  if (graph.getNode(traitNodeId)) {
    const traitEdgeId = `edge_culture_trait_${actorId}_${cultureId}`;
    if (!graph.getNode(traitEdgeId)) {
      graph.addEdge({
        id: traitEdgeId,
        type: 'has_trait',
        source: actorId,
        target: traitNodeId,
        properties: { level: 1 },
      });
    }
  }
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

  // Assign culture trait to location for gating
  const traitNodeId = `trait.culture.${cultureId}`;
  if (graph.getNode(traitNodeId)) {
    const traitEdgeId = `edge_culture_trait_${locationId}_${cultureId}_${layer}`;
    if (!graph.getNode(traitEdgeId)) {
      graph.addEdge({
        id: traitEdgeId,
        type: 'has_trait',
        source: locationId,
        target: traitNodeId,
        properties: { level: 1 },
      });
    }
  }
}

// ─── Pre-Generation (before worldgen) ──────────────────────────────

/** Culture identity generated before worldgen — no graph node yet. */
export interface PregenCulture {
  id: string;
  name: string;
  identity: CultureIdentity;
  flagSvg: string;
}

/** Extract the minimal projection needed by worldgen province seeding. */
export function toCultureForWorldgen(c: PregenCulture): CultureForWorldgen {
  return {
    id: c.id,
    preferredBiomes: c.identity.preferredBiomes,
    toleratedBiomes: c.identity.toleratedBiomes,
  };
}

/**
 * Habitable terrain types suitable for culture origin biomes.
 * Excludes ocean/water/extreme terrains that cultures wouldn't originate from.
 */
const HABITABLE_BIOME_TERRAINS: TerrainType[] = BIOME_MODIFIERS
  .filter(m => !['ocean', 'deep_ocean', 'coastal_shallows', 'lake', 'reef',
    'tropical_ocean', 'glacier', 'arctic', 'volcano'].includes(m.terrain))
  .map(m => m.terrain);

/**
 * Generate culture identities BEFORE worldgen.
 * Creates culture compositions from foundation × sphere × biome, but does NOT
 * create graph nodes or assign locations — those happen after worldgen when
 * province data is available.
 */
export function generateCultureIdentities(
  cosmology: CosmologyProfile,
  rng: () => number,
  fundament?: FundamentState,
  tileCount?: number,
): PregenCulture[] {
  const defaultWeight = 1 / 12;
  const sphereWeights = fundament?.sphereWeights ?? {
    chaos: defaultWeight, order: defaultWeight, light: defaultWeight, darkness: defaultWeight,
    force: defaultWeight, matter: defaultWeight, energy: defaultWeight, life: defaultWeight,
    mind: defaultWeight, spirit: defaultWeight, time: defaultWeight, entropy: defaultWeight,
  };
  // Scale culture count by map size; fall back to flat CULTURE_COUNT range if tileCount unknown.
  let cultureCount: number;
  if (tileCount !== undefined) {
    const tier = CULTURE_COUNT_BY_TILE_COUNT.find(t => tileCount <= t.maxTiles) ?? CULTURE_COUNT_BY_TILE_COUNT[CULTURE_COUNT_BY_TILE_COUNT.length - 1];
    cultureCount = tier.count;
  } else {
    cultureCount = CULTURE_COUNT.min + Math.floor(rng() * (CULTURE_COUNT.max - CULTURE_COUNT.min + 1));
  }

  const cultures: PregenCulture[] = [];
  const usedBiomes = new Set<string>();

  // Shuffle habitable biomes for unique selection per culture
  const shuffledBiomes = [...HABITABLE_BIOME_TERRAINS].sort(() => rng() - 0.5);

  for (let i = 0; i < cultureCount; i++) {
    const id = `culture_${i}`;
    const foundationId = selectFoundation(rng, sphereWeights);
    const spheres = selectSpheres(rng, cosmology);

    // Pick a unique biome from the shuffled habitable list
    let biome: TerrainType = 'grassland';
    for (const candidate of shuffledBiomes) {
      if (!usedBiomes.has(candidate)) {
        biome = candidate;
        usedBiomes.add(candidate);
        break;
      }
    }

    const identity = composeCultureIdentity(foundationId, spheres, biome);
    const name = generateCultureName(identity, rng);

    // Derive demonym from culture name (first word or short form)
    const demonym = name.replace(/^The\s+/i, '').split(/[\s-]+/)[0];

    // Home place name: demonym + foundation-appropriate suffix
    const PLACE_SUFFIXES: Record<string, string[]> = {
      order: ['-hold', '-heim', '-gar', '-stan'],
      chaos: ['-reach', '-thos', '-shar', '-wilds'],
      force: ['-grad', '-hold', '-gar', '-forge'],
      life: ['-dell', '-mere', '-glen', '-haven'],
      mind: ['-spire', '-thos', '-reach', '-archive'],
      spirit: ['-haven', '-dell', '-mere', '-rest'],
      matter: ['-delve', '-hold', '-quarry', '-forge'],
      energy: ['-peak', '-storm', '-crest', '-reach'],
      entropy: ['-mire', '-blight', '-end', '-hollow'],
      time: ['-span', '-watch', '-rest', '-mark'],
      light: ['-haven', '-dawn', '-crest', '-beacon'],
      darkness: ['-shade', '-deep', '-hollow', '-veil'],
    };
    const suffixes = PLACE_SUFFIXES[foundationId] ?? ['-ton', '-bury', '-ford'];
    const suffixIdx = Math.abs(demonym.charCodeAt(0) * 31 + demonym.charCodeAt(Math.min(1, demonym.length - 1))) % suffixes.length;
    const homePlaceName = demonym + suffixes[suffixIdx];

    identity.demonym = demonym;
    identity.homePlaceName = homePlaceName;

    const flagSeed = Math.floor(rng() * 0xFFFFFFFF);
    const flagSvg = generateCultureFlag(identity, flagSeed);

    cultures.push({ id, name, identity, flagSvg });
  }

  return cultures;
}

/**
 * Register pre-generated cultures as graph nodes.
 * Called during seedWorld after worldgen provides province data.
 */
export function registerPregenCultures(
  graph: WorldGraph,
  cultures: PregenCulture[],
): string[] {
  const cultureIds: string[] = [];
  for (const pc of cultures) {
    graph.addNode({
      id: pc.id,
      type: 'actor',
      name: pc.name,
      properties: { actorType: 'culture', cultureIdentity: pc.identity, flagSvg: pc.flagSvg },
    });

    // Create culture trait node for gating
    const traitNodeId = `trait.culture.${pc.id}`;
    graph.addNode({
      id: traitNodeId,
      type: 'trait',
      name: pc.identity.demonym ?? pc.name,
      properties: {
        subcategory: 'cultural',
        description: `Cultural trait for the ${pc.identity.demonym ?? pc.name} people`,
        importance: 0,
        maxLevel: 1,
        visibility: 'public',
        domainContributions: {},
        tags: [pc.identity.demonym ?? pc.name],
        flavorText: '',
        category: 'innate',
      },
    });

    cultureIds.push(pc.id);
  }
  return cultureIds;
}

// ─── Main Culture Generator (legacy — used when no pregen available) ──

/**
 * Generate all cultures for the world and add as graph nodes.
 * Also assigns each location a culture (historical + current layers).
 *
 * @deprecated Prefer generateCultureIdentities() + registerPregenCultures() for
 * territory-aware seeding. This function is retained for backward compatibility.
 */
export function generateCultures(
  graph: WorldGraph,
  cosmology: CosmologyProfile,
  locationIds: string[],
  rng: () => number,
  fundament?: FundamentState,
): string[] {
  const defaultWeight = 1 / 12;
  const sphereWeights = fundament?.sphereWeights ?? {
    chaos: defaultWeight, order: defaultWeight, light: defaultWeight, darkness: defaultWeight,
    force: defaultWeight, matter: defaultWeight, energy: defaultWeight, life: defaultWeight,
    mind: defaultWeight, spirit: defaultWeight, time: defaultWeight, entropy: defaultWeight,
  };
  const cultureCount = CULTURE_COUNT.min + Math.floor(
    rng() * (CULTURE_COUNT.max - CULTURE_COUNT.min + 1)
  );

  const cultureIds: string[] = [];
  const usedBiomes = new Set<string>();

  for (let i = 0; i < cultureCount; i++) {
    const id = `culture_${i}`;
    const foundationId = selectFoundation(rng, sphereWeights);
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
 * Assign cultures to all actors.
 *
 * When `locationCultureMap` is provided (territory-aware path):
 *   - Actors inherit culture from their location's province
 *   - Strength varies by province role (capital/heartland = strong, borderland = weaker)
 *   - ~10% are diaspora (random different culture)
 *   - ~10% are cultureless
 *   - Borderland actors have ~40% chance of a secondary culture
 *
 * When `locationCultureMap` is not provided (legacy path):
 *   - 70% get 1 random culture, 20% get 2, 10% get none
 *   - Factions always get 1 random culture
 */
export function assignCulturesToActors(
  graph: WorldGraph,
  individualIds: string[],
  factionIds: string[],
  cultureIds: string[],
  rng: () => number,
  locationCultureMap?: Map<string, { cultureId: string; role: number }>,
): void {
  if (cultureIds.length === 0) return;

  const pickCulture = () => cultureIds[Math.floor(rng() * cultureIds.length)];
  const pickDifferentCulture = (exclude: string): string => {
    if (cultureIds.length <= 1) return exclude;
    let c = pickCulture();
    let attempts = 0;
    while (c === exclude && attempts < 5) { c = pickCulture(); attempts++; }
    return c;
  };
  const randInRange = (min: number, max: number) => min + rng() * (max - min);

  // Helper: find an actor's location ID via located_at edge
  const getActorLocationId = (actorId: string): string | undefined => {
    const edges = graph.getOutgoingEdges(actorId);
    const locEdge = edges.find(e => e.type === 'located_at');
    return locEdge?.target;
  };

  // Helper: find a faction's controlled location via controls edge
  const getFactionLocationId = (factionId: string): string | undefined => {
    const edges = graph.getOutgoingEdges(factionId);
    const controlEdge = edges.find(e => e.type === 'controls');
    return controlEdge?.target;
  };

  if (locationCultureMap && locationCultureMap.size > 0) {
    // ── Territory-aware path ──────────────────────────────────

    // Factions: use controlled location's culture
    for (const facId of factionIds) {
      const locId = getFactionLocationId(facId);
      const locCulture = locId ? locationCultureMap.get(locId) : undefined;
      if (locCulture) {
        const strength = randInRange(CULTURE_STRENGTH_FACTION.min, CULTURE_STRENGTH_FACTION.max);
        assignCultureToActor(graph, facId, locCulture.cultureId, strength);
      } else {
        // Faction in wilderness — assign random culture at lower strength
        const strength = randInRange(CULTURE_BORDER_STRENGTH.min, CULTURE_BORDER_STRENGTH.max);
        assignCultureToActor(graph, facId, pickCulture(), strength);
      }
    }

    // Individuals: inherit from location's province
    for (const indId of individualIds) {
      const roll = rng();

      // 10% cultureless
      if (roll < CULTURELESS_PROBABILITY) continue;

      const locId = getActorLocationId(indId);
      const locCulture = locId ? locationCultureMap.get(locId) : undefined;

      // 10% diaspora: random different culture at moderate strength
      if (roll < CULTURELESS_PROBABILITY + CULTURE_DIASPORA_FRACTION) {
        if (locCulture) {
          const diasporaCulture = pickDifferentCulture(locCulture.cultureId);
          const strength = randInRange(CULTURE_BORDER_STRENGTH.min, CULTURE_BORDER_STRENGTH.max);
          assignCultureToActor(graph, indId, diasporaCulture, strength);
        } else {
          // Wilderness diaspora: just pick any culture
          const strength = randInRange(CULTURE_BORDER_STRENGTH.min, CULTURE_BORDER_STRENGTH.max);
          assignCultureToActor(graph, indId, pickCulture(), strength);
        }
        continue;
      }

      if (!locCulture) {
        // Wilderness location — no culture assignment (wilderness chance already handled)
        continue;
      }

      // Strength based on province role
      const isCore = locCulture.role === PROVINCE_ROLE_CAPITAL || locCulture.role === PROVINCE_ROLE_HEARTLAND;
      const strength = isCore
        ? randInRange(CULTURE_HOMELAND_STRENGTH.min, CULTURE_HOMELAND_STRENGTH.max)
        : randInRange(CULTURE_BORDER_STRENGTH.min, CULTURE_BORDER_STRENGTH.max);

      assignCultureToActor(graph, indId, locCulture.cultureId, strength);

      // Borderland: 40% chance of a secondary culture
      if (!isCore && rng() < CULTURE_BORDER_DUAL_CHANCE && cultureIds.length > 1) {
        const secondCulture = pickDifferentCulture(locCulture.cultureId);
        if (secondCulture !== locCulture.cultureId) {
          const s2 = randInRange(CULTURE_BORDER_STRENGTH.min * 0.5, CULTURE_BORDER_STRENGTH.max * 0.5);
          assignCultureToActor(graph, indId, secondCulture, Math.min(s2, 1.0 - strength));
        }
      }
    }
  } else {
    // ── Legacy path (random assignment) ──────────────────────

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
        const c2 = pickDifferentCulture(c1);
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
}
