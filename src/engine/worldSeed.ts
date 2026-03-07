// src/engine/worldSeed.ts

/**
 * World Seeding — procedural world population.
 *
 * Creates actors, locations, artifacts, and relationships from
 * cosmology profile + seed + echo injections.
 */
import { WorldGraph } from './graph';
import type { CosmologyProfile, SphereName, HexTile, TerrainType, LocationSubtype } from '../types/index';
import { SPHERE_NAMES } from '../types/index';
import type { AxiologicalProfile, ValuePair } from '../types/agent';
import type { ReachDomain } from '../types/traits';
import type { EchoDefinition } from '../types/echo';
import type { ActiveInjection } from './echo';
import { NARRATIVE_ARCHETYPES } from '../data/archetype-content';
import { assignCooperationStrategy } from './disposition';
import { DEFAULT_REPUTATION } from '../types/disposition';
import type { FoundationBalances } from '../types/worldSoul';
import { generateCultures, assignCulturesToActors } from './cultureGenerator';

// ─── Seeded PRNG ──────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Constants ────────────────────────────────────────────────────

export const INDIVIDUAL_COUNT = { min: 8, max: 12 };
export const FACTION_COUNT = { min: 2, max: 3 };
export const LOCATION_COUNT = { min: 4, max: 6 };
export const ARTIFACT_COUNT = { min: 1, max: 2 };

const VALUE_PAIRS: ValuePair[] = [
  'ambition_contentment', 'courage_prudence', 'cruelty_compassion',
  'cunning_honesty', 'devotion_independence', 'loyalty_treachery',
  'tradition_innovation', 'dominance_humility', 'wrath_patience', 'greed_generosity',
];

const REACH_DOMAINS: ReachDomain[] = [
  'iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star', 'flesh',
];

const INDIVIDUAL_NAMES = [
  'Kael', 'Mirael', 'Thorne', 'Lyssa', 'Dren', 'Isolde', 'Varn', 'Ashara',
  'Brynn', 'Cael', 'Dara', 'Fen', 'Gale', 'Hestia', 'Jorik', 'Kira',
];

const FACTION_NAMES = [
  'The Iron Covenant', 'The Verdant Circle', 'The Ashen Hand',
  'The Silver Tide', 'The Obsidian Watch', 'The Gilded Pact',
];

const ARTIFACT_NAMES = [
  'The Crown of Echoes', 'Griefender', 'The Aegis of Dawn',
  'The Soulweaver', 'Voidthorn', 'The Lantern of Stars',
];

const LOCATION_NAMES = [
  'Ardenmor Keep', 'The Shattered Sanctum', 'Thornhaven', 'The Sunken Library',
  'Wraithwood', 'The Forge of Sorrow', 'Crystalspire', 'The Bone Coast',
];

// ─── Generators ───────────────────────────────────────────────────

function randomInRange(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

function pickRandom<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function generateAxiologicalProfile(rng: () => number, cosmology: CosmologyProfile): AxiologicalProfile {
  const profile = {} as AxiologicalProfile;
  const chaosBias = cosmology.entropy > 0.15 ? 0.2 : -0.1;

  for (const pair of VALUE_PAIRS) {
    const base = (rng() * 1.6) - 0.8;
    const bias = pair === 'tradition_innovation' ? chaosBias : 0;
    profile[pair] = Math.max(-1, Math.min(1, base + bias));
  }
  return profile;
}

function generateDomainCapabilities(
  rng: () => number,
): Record<ReachDomain, number> {
  const caps = {} as Record<ReachDomain, number>;
  for (const domain of REACH_DOMAINS) {
    caps[domain] = 10 + Math.floor(rng() * 31);
  }
  const boostCount = 1 + Math.floor(rng() * 2);
  for (let i = 0; i < boostCount; i++) {
    const domain = pickRandom(rng, REACH_DOMAINS);
    caps[domain] = Math.min(100, caps[domain] + 20 + Math.floor(rng() * 20));
  }
  return caps;
}

// ─── Main Seeder ──────────────────────────────────────────────────

export interface SeedResult {
  graph: WorldGraph;
  individualIds: string[];
  factionIds: string[];
  locationIds: string[];
  artifactIds: string[];
  cultureIds: string[];
}

// ─── Location Subtype Selection ──────────────────────────────────────

/** Terrain → eligible settlement subtypes (weighted) */
const TERRAIN_SETTLEMENT_WEIGHTS: Partial<Record<TerrainType, Array<[LocationSubtype, number]>>> = {
  desert:     [['oasis', 3], ['camp', 4], ['ruins', 2], ['hamlet', 1]],
  mountains:  [['mining', 3], ['fort', 2], ['shrine', 2], ['tower', 1], ['ruins', 1]],
  hills:      [['hamlet', 3], ['town', 2], ['mining', 2], ['fort', 1], ['ruins', 1]],
  volcanic:   [['mining', 2], ['ruins', 3], ['camp', 2], ['shrine', 1]],
  broken_lands: [['ruins', 4], ['camp', 2], ['battleground', 2]],
  jungle:     [['ruins', 3], ['shrine', 2], ['camp', 2], ['hamlet', 1]],
  swamp:      [['ruins', 2], ['camp', 2], ['shrine', 1], ['hamlet', 1]],
  bog:        [['ruins', 2], ['camp', 2], ['shrine', 1]],
  glacier:    [['ruins', 1], ['shrine', 1]],
  tundra:     [['camp', 3], ['hamlet', 1], ['ruins', 1]],
};

/** Default weights for most terrain types */
const DEFAULT_SETTLEMENT_WEIGHTS: Array<[LocationSubtype, number]> = [
  ['hamlet', 5], ['town', 3], ['city', 1],
  ['camp', 2], ['fort', 1], ['tower', 1],
  ['shrine', 1], ['temple', 1], ['farmland', 2],
  ['ruins', 1],
];

function pickLocationSubtype(
  rng: () => number,
  terrain: TerrainType,
  locationIndex: number,
  totalLocations: number,
): LocationSubtype {
  // First location is always a capital (player's starting area)
  if (locationIndex === 0) return 'capital';

  // Some locations are unexplored POIs (~5%)
  if (rng() < 0.05) return 'unexplored_poi';

  // Pick from terrain-weighted distribution
  const weights = TERRAIN_SETTLEMENT_WEIGHTS[terrain] ?? DEFAULT_SETTLEMENT_WEIGHTS;
  const totalWeight = weights.reduce((sum, [, w]) => sum + w, 0);
  let roll = rng() * totalWeight;
  for (const [subtype, weight] of weights) {
    roll -= weight;
    if (roll <= 0) return subtype;
  }
  return 'wilderness';
}

export function seedWorld(
  cosmology: CosmologyProfile,
  tiles: HexTile[],
  seed: number,
  injections?: ActiveInjection[],
  foundations?: FoundationBalances,
): SeedResult {
  const rng = mulberry32(seed + 7919);
  const graph = new WorldGraph();

  const individualIds: string[] = [];
  const factionIds: string[] = [];
  const locationIds: string[] = [];
  const artifactIds: string[] = [];
  const cultureIds: string[] = [];

  // ── Locations ────────────────────────────────────────────
  const locCount = randomInRange(rng, LOCATION_COUNT.min, LOCATION_COUNT.max);
  const usedNameIndices = new Set<number>();

  for (let i = 0; i < locCount; i++) {
    let nameIdx: number;
    do { nameIdx = Math.floor(rng() * LOCATION_NAMES.length); }
    while (usedNameIndices.has(nameIdx) && usedNameIndices.size < LOCATION_NAMES.length);
    usedNameIndices.add(nameIdx);

    const id = `loc_${i}`;
    const validTiles = tiles.filter(t =>
      t.terrain !== 'ocean' && t.terrain !== 'coastal_shallows'
    );
    const tile = validTiles.length > 0
      ? validTiles[Math.floor(rng() * validTiles.length)]
      : tiles[0];

    const locInjection = injections?.find(inj => inj.injection.injectionType === 'location_feature');
    const sphereBiases = locInjection ? { ...locInjection.injection.sphereBiases } : {};

    const locationSubtype = pickLocationSubtype(rng, tile.terrain, i, locCount);

    graph.addNode({
      id,
      type: 'location',
      name: LOCATION_NAMES[nameIdx],
      properties: {
        locationType: 'location',
        locationSubtype,
        hexCol: tile.coord.col,
        hexRow: tile.coord.row,
        terrain: tile.terrain,
        sphereBiases,
      },
    });
    locationIds.push(id);
  }

  // Add adjacency edges between locations
  for (let i = 0; i < locationIds.length - 1; i++) {
    graph.addEdge({
      id: `edge_adj_${i}`,
      source: locationIds[i],
      target: locationIds[i + 1],
      type: 'adjacent',
      properties: {},
    });
  }

  // ── Cultures ──────────────────────────────────────────────
  const generatedCultureIds = generateCultures(graph, cosmology, locationIds, rng, foundations);
  cultureIds.push(...generatedCultureIds);

  // ── Factions ─────────────────────────────────────────────
  const facCount = randomInRange(rng, FACTION_COUNT.min, FACTION_COUNT.max);
  const usedFacNames = new Set<number>();

  for (let i = 0; i < facCount; i++) {
    let nameIdx: number;
    do { nameIdx = Math.floor(rng() * FACTION_NAMES.length); }
    while (usedFacNames.has(nameIdx) && usedFacNames.size < FACTION_NAMES.length);
    usedFacNames.add(nameIdx);

    const id = `faction_${i}`;
    const profile = generateAxiologicalProfile(rng, cosmology);

    graph.addNode({
      id,
      type: 'actor',
      name: FACTION_NAMES[nameIdx],
      properties: {
        actorType: 'faction',
        axiologicalProfile: profile,
        domainCapabilities: generateDomainCapabilities(rng),
      },
    });
    factionIds.push(id);
  }

  // ── Individuals ──────────────────────────────────────────
  const indCount = randomInRange(rng, INDIVIDUAL_COUNT.min, INDIVIDUAL_COUNT.max);
  const usedIndNames = new Set<number>();

  const culturalInjection = injections?.find(
    inj => inj.injection.injectionType === 'cultural_template'
  );

  for (let i = 0; i < indCount; i++) {
    let nameIdx: number;
    do { nameIdx = Math.floor(rng() * INDIVIDUAL_NAMES.length); }
    while (usedIndNames.has(nameIdx) && usedIndNames.size < INDIVIDUAL_NAMES.length);
    usedIndNames.add(nameIdx);

    const id = `ind_${i}`;
    const profile = generateAxiologicalProfile(rng, cosmology);

    if (culturalInjection?.injection.traitTendencies) {
      for (const tendency of culturalInjection.injection.traitTendencies) {
        const pair = tendency as ValuePair;
        if (profile[pair] !== undefined) {
          profile[pair] = Math.max(-1, Math.min(1,
            profile[pair] + culturalInjection.strength * 0.3
          ));
        }
      }
    }

    const locationId = pickRandom(rng, locationIds);

    const narrativeArchetypeId = NARRATIVE_ARCHETYPES[Math.floor(rng() * NARRATIVE_ARCHETYPES.length)].id;
    const cooperationStrategy = assignCooperationStrategy(narrativeArchetypeId, profile, rng);

    graph.addNode({
      id,
      type: 'actor',
      name: INDIVIDUAL_NAMES[nameIdx],
      properties: {
        actorType: 'individual',
        axiologicalProfile: profile,
        domainCapabilities: generateDomainCapabilities(rng),
        locationId,
        narrativeArchetype: narrativeArchetypeId,
        cooperationStrategy,
        reputationScore: DEFAULT_REPUTATION,
      },
    });
    individualIds.push(id);

    if (rng() < 0.7 && factionIds.length > 0) {
      const factionId = pickRandom(rng, factionIds);
      graph.addEdge({
        id: `edge_member_${id}`,
        source: id,
        target: factionId,
        type: 'member_of',
        properties: { role: 'member' },
      });
    }

    graph.addEdge({
      id: `edge_at_${id}`,
      source: id,
      target: locationId,
      type: 'contains',
      properties: {},
    });
  }

  // ── Culture assignment to actors ──────────────────────────
  assignCulturesToActors(graph, individualIds, factionIds, cultureIds, rng);

  // ── Artifacts ────────────────────────────────────────────
  const artCount = randomInRange(rng, ARTIFACT_COUNT.min, ARTIFACT_COUNT.max);
  const usedArtNames = new Set<number>();

  for (let i = 0; i < artCount; i++) {
    let nameIdx: number;
    do { nameIdx = Math.floor(rng() * ARTIFACT_NAMES.length); }
    while (usedArtNames.has(nameIdx) && usedArtNames.size < ARTIFACT_NAMES.length);
    usedArtNames.add(nameIdx);

    const id = `artifact_${i}`;
    const sphereAffinity = pickRandom(rng, SPHERE_NAMES);

    const questInjection = injections?.find(
      inj => inj.injection.injectionType === 'quest_seed'
    );

    graph.addNode({
      id,
      type: 'artifact',
      name: ARTIFACT_NAMES[nameIdx],
      properties: {
        sphereAffinity,
        locationId: pickRandom(rng, locationIds),
        echoOrigin: questInjection ? true : false,
      },
    });
    artifactIds.push(id);
  }

  // ── Inter-actor relationships ────────────────────────────
  for (let i = 0; i < individualIds.length; i++) {
    for (let j = i + 1; j < individualIds.length; j++) {
      if (rng() < 0.3) {
        const sentiment = (rng() * 2) - 1;
        graph.addEdge({
          id: `edge_rel_${i}_${j}`,
          source: individualIds[i],
          target: individualIds[j],
          type: 'relates_to',
          properties: {
            sentiment,
            strength: 0.3 + rng() * 0.5,
            basis: sentiment > 0 ? 'friendship' : 'rivalry',
          },
        });
      }
    }
  }

  return { graph, individualIds, factionIds, locationIds, artifactIds, cultureIds };
}
