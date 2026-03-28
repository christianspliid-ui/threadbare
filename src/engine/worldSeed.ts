// src/engine/worldSeed.ts

/**
 * World Seeding — procedural world population.
 *
 * Creates actors, locations, artifacts, and relationships from
 * cosmology profile + seed + echo injections.
 */
import { WorldGraph } from './graph';
import { generateRoadEdges } from './roadNetwork';
import type { CosmologyProfile, SphereName, HexTile, TerrainType, LocationSubtype } from '../types/index';
import { SPHERE_NAMES } from '../types/index';
import type { AxiologicalProfile } from '../types/agent';
import { VALUE_PAIRS } from '../types/agent';
import type { ReachDomain } from '../types/traits';
import type { EchoDefinition } from '../types/echo';
import type { ActiveInjection } from './echo';
import { NARRATIVE_ARCHETYPES } from '../data/archetype-content';
import { assignCooperationStrategy } from './disposition';
import { DEFAULT_REPUTATION } from '../types/disposition';
import type { FundamentState } from '../types/worldSoul';
import { generateCultures, assignCulturesToActors } from './cultureGenerator';
import {
  instantiateFormativeTraits,
  instantiateBehavioralTraits,
  grantFormativeTraits,
  grantBehavioralTraits,
} from './culturalTraits';
import type { CultureIdentity } from '../types/culture';
import { detectRegions } from './regionDetection';
import { hexDistance } from '../lib/hexMath';
import { generateHistoricalCultures, assignHistoricalTerritories } from './historicalCulture';
import { generateRegionName } from './regionNaming';
import { seedLocationResources } from './resourceSeeding';
import { seedAttachments } from './seedAttachments';
import { seedGuilds } from './guildSeeding';
import { seedAllFactions } from './factionSeeding';
import { FACTION_DEFINITIONS } from '../data/faction-definitions';
import { ensureSublocations } from './sublocation';
import { assignInitialAmbitions } from './ambitionAssignment';
import { AMBITION_TEMPLATES } from '../data/ambition-templates';
import type { AmbitionAgentSnapshot } from './ambitionSelection';

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
/** Location count is now proportional to habitable hexes — see LOCATION_DENSITY */
export const LOCATION_COUNT = { min: 4, max: 6 }; // legacy fallback only
/** Fraction of habitable (non-ocean/coastal) hexes that should contain a location */
export const LOCATION_DENSITY = { min: 0.30, max: 0.50 };
export const ARTIFACT_COUNT = { min: 1, max: 2 };

/**
 * Minimum hex distance between settlements by subtype.
 * Prevents clusters of large settlements. The rule is bidirectional:
 * when placing a new settlement, the enforced gap is the MAX of the
 * new settlement's spacing and each existing settlement's spacing.
 */
export const SETTLEMENT_MIN_SPACING: Partial<Record<LocationSubtype, number>> = {
  capital: 4,
  city:    4,
  town:    2,
  hamlet:  1,
};

/** Initial prosperity by settlement subtype — larger settlements start wealthier */
export const INITIAL_PROSPERITY: Partial<Record<LocationSubtype, number>> = {
  capital: 65,
  city: 55,
  town: 40,
  hamlet: 20,
  fort: 30,
  castle: 35,
  tower: 15,
  camp: 10,
  mining: 30,
  farmland: 25,
  shrine: 10,
  temple: 20,
  oasis: 15,
  ruins: 0,
  battleground: 0,
  unexplored_poi: 0,
};

// VALUE_PAIRS imported from types/agent.ts

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

export const LOCATION_NAMES = [
  'Ardenmor Keep', 'The Shattered Sanctum', 'Thornhaven', 'The Sunken Library',
  'Wraithwood', 'The Forge of Sorrow', 'Crystalspire', 'The Bone Coast',
];

// ─── Procedural Location Naming ──────────────────────────────────

/** Prefixes by location subtype for procedural names */
const LOCATION_PREFIXES: Partial<Record<LocationSubtype, string[]>> = {
  hamlet:   ['Little', 'Old', 'Lower', 'Upper', 'East', 'West', 'New'],
  town:     ['Greater', 'Market', 'Fair', 'High', 'Free'],
  city:     ['Grand', 'Royal', 'Great', 'Noble'],
  capital:  ['Imperial', 'Crown', 'Sovereign', 'High'],
  camp:     ['Wanderer\'s', 'Ranger\'s', 'Exile\'s', 'Hunter\'s', 'Drifter\'s'],
  fort:     ['Iron', 'Stone', 'Grey', 'Black', 'Red', 'Shield'],
  tower:    ['Lone', 'Tall', 'Dark', 'Pale', 'Silver', 'Broken'],
  shrine:   ['Sacred', 'Silent', 'Hidden', 'Blessed', 'Ancient'],
  temple:   ['Holy', 'Grand', 'Eternal', 'Divine', 'Hallowed'],
  mining:   ['Deep', 'Dark', 'Rich', 'Copper', 'Iron', 'Silver'],
  ruins:    ['Fallen', 'Shattered', 'Crumbled', 'Forgotten', 'Lost'],
  oasis:    ['Green', 'Cool', 'Hidden', 'Bright', 'Sweet'],
  castle:   ['Storm', 'Raven', 'Wolf', 'Dragon', 'Eagle'],
  farmland: ['Golden', 'Green', 'Rich', 'Harvest', 'Sunny'],
};

/** Core name roots by terrain type */
const TERRAIN_NAME_ROOTS: Partial<Record<TerrainType, string[]>> = {
  grassland:   ['Meadow', 'Field', 'Green', 'Lea', 'Downs'],
  farmland:    ['Grange', 'Stead', 'Furrow', 'Acre', 'Tilth'],
  savanna:     ['Reach', 'Flat', 'Grass', 'Plain', 'Dry'],
  steppe:      ['Wind', 'Dust', 'Wide', 'Vast', 'Horse'],
  forest:      ['Wood', 'Thorn', 'Oak', 'Elm', 'Briar'],
  dense_forest:['Deep', 'Shadow', 'Dark', 'Old', 'Moss'],
  ancient_forest: ['Elder', 'Root', 'Bark', 'Hollow', 'Verdant'],
  hills:       ['Hill', 'Crest', 'Ridge', 'Knoll', 'Barrow'],
  mountains:   ['Peak', 'Crag', 'Stone', 'Rock', 'Granite'],
  desert:      ['Sand', 'Dust', 'Dry', 'Sun', 'Salt'],
  swamp:       ['Mire', 'Bog', 'Muck', 'Marsh', 'Murk'],
  marsh:       ['Reed', 'Fen', 'Sedge', 'Pool', 'Wet'],
  tundra:      ['Frost', 'Ice', 'Snow', 'Pale', 'Bitter'],
  volcano:     ['Ash', 'Cinder', 'Flame', 'Ember', 'Slag'],
  jungle:      ['Vine', 'Fern', 'Tangle', 'Canopy', 'Orchid'],
  broken_lands:['Scar', 'Ruin', 'Shatter', 'Wreck', 'Void'],
  glacier:     ['Crystal', 'Frost', 'Gleam', 'Ice', 'Pale'],
};

/** Suffix by location subtype */
const LOCATION_SUFFIXES: Partial<Record<LocationSubtype, string[]>> = {
  hamlet:   ['bury', 'ton', 'wick', 'stead', 'ford', 'ham', 'vale'],
  town:     ['town', 'borough', 'gate', 'bridge', 'cross', 'market'],
  city:     ['city', 'polis', 'haven', 'port', 'hold'],
  capital:  ['throne', 'seat', 'crown', 'heart', 'spire'],
  camp:     [' Camp', ' Rest', ' Halt', ' Clearing', ' Hollow'],
  fort:     ['guard', 'wall', 'hold', 'keep', 'watch'],
  tower:    [' Tower', ' Spire', ' Pinnacle', ' Watch'],
  shrine:   [' Shrine', ' Altar', ' Sanctum', ' Circle'],
  temple:   [' Temple', ' Cathedral', ' Basilica', ' Monastery'],
  mining:   [' Mine', ' Delve', ' Quarry', ' Shaft', ' Dig'],
  ruins:    [' Ruins', ' Remnant', ' Hollow', ' Cairn'],
  oasis:    [' Oasis', ' Spring', ' Pool', ' Wells'],
  castle:   [' Castle', ' Citadel', ' Fortress', ' Keep'],
  farmland: [' Fields', ' Farms', ' Pastures', ' Commons'],
  battleground: [' Field', ' Crossing', ' Stand', ' Pass'],
  unexplored_poi: [' Mystery', ' Unknown', ' Enigma', ' Wonder'],
};

const DEFAULT_ROOTS = ['Stone', 'Grey', 'Iron', 'Silver', 'Raven', 'Wolf', 'Thorn', 'Hawk'];

/**
 * Generate a procedural location name from terrain + subtype.
 * Deterministic for a given rng state.
 */
function generateLocationName(
  rng: () => number,
  terrain: TerrainType,
  subtype: LocationSubtype,
  usedNames: Set<string>,
): string {
  const maxAttempts = 5;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const prefixes = LOCATION_PREFIXES[subtype] ?? ['Old', 'New', 'Far'];
    const roots = TERRAIN_NAME_ROOTS[terrain] ?? DEFAULT_ROOTS;
    const suffixes = LOCATION_SUFFIXES[subtype] ?? ['ton', 'bury', 'vale'];

    const usePrefix = rng() < 0.35;
    const root = roots[Math.floor(rng() * roots.length)];
    const suffix = suffixes[Math.floor(rng() * suffixes.length)];

    let name: string;
    if (usePrefix) {
      const prefix = prefixes[Math.floor(rng() * prefixes.length)];
      // If suffix starts with space, it's a separate word
      name = suffix.startsWith(' ')
        ? `${prefix} ${root}${suffix}`
        : `${prefix} ${root}${suffix}`;
    } else {
      name = suffix.startsWith(' ')
        ? `${root}${suffix}`
        : `${root}${suffix}`;
    }

    if (!usedNames.has(name) || attempt === maxAttempts - 1) {
      return name;
    }
  }
  // Final fallback — append a number
  return `Settlement ${usedNames.size + 1}`;
}

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
    const bias = pair === 'tradition_novelty' ? chaosBias : 0;
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
  guildIds: string[];
  factionDefIds: string[];
  locationIds: string[];
  artifactIds: string[];
  cultureIds: string[];
  regionIds: string[];
  historicalCultureIds: string[];
}

// ─── Location Subtype Selection ──────────────────────────────────────

/** Terrain → eligible settlement subtypes (weighted) */
export const TERRAIN_SETTLEMENT_WEIGHTS: Partial<Record<TerrainType, Array<[LocationSubtype, number]>>> = {
  desert:     [['oasis', 3], ['camp', 4], ['ruins', 2], ['hamlet', 1]],
  mountains:  [['mining', 3], ['fort', 2], ['shrine', 2], ['tower', 1], ['ruins', 1]],
  hills:      [['hamlet', 3], ['town', 2], ['mining', 2], ['fort', 1], ['ruins', 1]],
  volcano:    [['mining', 2], ['ruins', 3], ['camp', 2], ['shrine', 1]],
  broken_lands: [['ruins', 4], ['camp', 2], ['battleground', 2]],
  jungle:     [['ruins', 3], ['shrine', 2], ['camp', 2], ['hamlet', 1]],
  swamp:      [['ruins', 2], ['camp', 2], ['shrine', 1], ['hamlet', 1]],
  marsh:      [['ruins', 2], ['camp', 2], ['shrine', 1]],
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
  fundament?: FundamentState,
): SeedResult {
  const rng = mulberry32(seed + 7919);
  const graph = new WorldGraph();

  const individualIds: string[] = [];
  const factionIds: string[] = [];
  const locationIds: string[] = [];
  const artifactIds: string[] = [];
  const cultureIds: string[] = [];

  // ── Regions & Historical Cultures (before locations) ──────
  const regionIds: string[] = [];
  const historicalCultureIds: string[] = [];

  // Detect geographic regions via flood-fill
  const clusters = detectRegions(tiles);

  // Create region nodes (unnamed for now)
  for (let i = 0; i < clusters.length; i++) {
    const id = `region_${i}`;
    graph.addNode({
      id,
      type: 'region',
      name: '', // will be named after territory assignment
      properties: {
        featureType: clusters[i].featureType,
        hexCount: clusters[i].hexes.length,
        centerCol: clusters[i].centerCol,
        centerRow: clusters[i].centerRow,
      },
    });
    regionIds.push(id);

    // Set regionId on each hex tile
    for (const h of clusters[i].hexes) {
      const tile = tiles.find(t => t.coord.col === h.col && t.coord.row === h.row);
      if (tile) tile.regionId = id;
    }
  }

  // Generate historical cultures
  const histCultureRng = mulberry32(seed + 13331); // separate PRNG stream
  const histIds = generateHistoricalCultures(graph, cosmology, histCultureRng);
  historicalCultureIds.push(...histIds);

  // Assign historical territories
  assignHistoricalTerritories(graph, histIds, clusters, histCultureRng);

  // Name regions based on historical culture ownership
  const usedRegionNames = new Set<string>();
  for (let i = 0; i < clusters.length; i++) {
    const regionId = regionIds[i];
    const ownerEdge = graph.getEdgesByType('belongs_to')
      .find(e => e.source === regionId && e.properties.cultureLayer === 'historical');
    const ownerCultureId = ownerEdge?.target;

    const name = generateRegionName(
      clusters[i].featureType,
      ownerCultureId,
      graph,
      histCultureRng,
      usedRegionNames,
    );
    usedRegionNames.add(name);
    graph.updateNode(regionId, { name });
  }

  // ── Locations ────────────────────────────────────────────
  // Density-based: spawn locations on 30-50% of habitable hexes
  const habitableTiles = tiles.filter(t =>
    t.terrain !== 'ocean' && t.terrain !== 'deep_ocean'
    && t.terrain !== 'coastal_shallows' && t.terrain !== 'lake'
  );
  const densityFraction = LOCATION_DENSITY.min + rng() * (LOCATION_DENSITY.max - LOCATION_DENSITY.min);
  const locCount = Math.max(
    LOCATION_COUNT.min,
    Math.round(habitableTiles.length * densityFraction),
  );

  // Shuffle habitable tiles for unique hex placement (Fisher-Yates)
  const shuffledTiles = [...habitableTiles];
  for (let i = shuffledTiles.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffledTiles[i], shuffledTiles[j]] = [shuffledTiles[j], shuffledTiles[i]];
  }

  // Pre-roll subtypes for each candidate tile so we can sort by placement tier.
  // Placement order: capital/city → town → hamlet → everything else.
  // This ensures large settlements claim space first, preventing small settlements
  // from blocking prime locations.
  const candidates: Array<{ tile: HexTile; subtype: LocationSubtype; sortOrder: number }> = [];
  for (let i = 0; i < Math.min(locCount * 2, shuffledTiles.length); i++) {
    const subtype = pickLocationSubtype(rng, shuffledTiles[i].terrain, i, locCount);
    let sortOrder: number;
    if (subtype === 'capital' || subtype === 'city') sortOrder = 0;
    else if (subtype === 'town') sortOrder = 1;
    else if (subtype === 'hamlet') sortOrder = 2;
    else sortOrder = 3;
    candidates.push({ tile: shuffledTiles[i], subtype, sortOrder });
  }
  // Stable sort by tier (preserves shuffled order within each tier)
  candidates.sort((a, b) => a.sortOrder - b.sortOrder);

  const usedLocationNames = new Set<string>();
  const usedHexes = new Set<string>();

  // Track placed settlements for minimum-spacing enforcement
  const placedSettlements: Array<{ col: number; row: number; subtype: LocationSubtype }> = [];

  let locIndex = 0;
  for (const { tile, subtype: locationSubtype } of candidates) {
    if (locIndex >= locCount) break;

    // No two locations on the same hex
    const hexKey = `${tile.coord.col},${tile.coord.row}`;
    if (usedHexes.has(hexKey)) continue;

    // ── Settlement spacing enforcement ──────────────────────
    // The required gap is the MAX of the new settlement's spacing
    // and each existing settlement's spacing (bidirectional rule).
    const newSpacing = SETTLEMENT_MIN_SPACING[locationSubtype] ?? 0;
    const tooClose = placedSettlements.some(placed => {
      const requiredGap = Math.max(newSpacing, SETTLEMENT_MIN_SPACING[placed.subtype] ?? 0);
      if (requiredGap === 0) return false;
      const dist = hexDistance(tile.coord, { col: placed.col, row: placed.row });
      return dist <= requiredGap;
    });
    if (tooClose) continue; // skip this tile, try next candidate

    const locInjection = injections?.find(inj => inj.injection.injectionType === 'location_feature');
    const sphereBiases = locInjection ? { ...locInjection.injection.sphereBiases } : {};

    const id = `loc_${locIndex}`;

    // Use handcrafted names first, then procedural generation
    let name: string;
    if (locIndex < LOCATION_NAMES.length) {
      name = LOCATION_NAMES[locIndex];
    } else {
      name = generateLocationName(rng, tile.terrain, locationSubtype, usedLocationNames);
    }
    usedLocationNames.add(name);

    // Initialize sphereInfluence on each location (used by mandate evaluation)
    const sphereInfluence: Record<string, number> = {};
    for (const sp of SPHERE_NAMES) {
      sphereInfluence[sp] = (sphereBiases as Record<string, number>)[sp] ?? (rng() * 0.1);
    }

    usedHexes.add(hexKey);
    placedSettlements.push({ col: tile.coord.col, row: tile.coord.row, subtype: locationSubtype });

    graph.addNode({
      id,
      type: 'location',
      name,
      properties: {
        locationType: locationSubtype,
        locationSubtype,
        hexCol: tile.coord.col,
        hexRow: tile.coord.row,
        terrain: tile.terrain,
        sphereBiases,
        sphereInfluence,
        prosperity: INITIAL_PROSPERITY[locationSubtype] ?? 0,
      },
    });
    locationIds.push(id);
    locIndex++;
  }

  // Add bidirectional adjacency edges between locations that are hex-neighbors.
  // Two locations are adjacent if their hex distance is exactly 1.
  let adjEdgeIdx = 0;
  for (let i = 0; i < locationIds.length; i++) {
    const nodeA = graph.getNode(locationIds[i]);
    if (!nodeA) continue;
    const colA = nodeA.properties.hexCol as number;
    const rowA = nodeA.properties.hexRow as number;
    for (let j = i + 1; j < locationIds.length; j++) {
      const nodeB = graph.getNode(locationIds[j]);
      if (!nodeB) continue;
      const colB = nodeB.properties.hexCol as number;
      const rowB = nodeB.properties.hexRow as number;
      if (hexDistance({ col: colA, row: rowA }, { col: colB, row: rowB }) === 1) {
        graph.addEdge({
          id: `edge_adj_${adjEdgeIdx}_fwd`,
          source: locationIds[i],
          target: locationIds[j],
          type: 'adjacent',
          properties: {},
        });
        graph.addEdge({
          id: `edge_adj_${adjEdgeIdx}_rev`,
          source: locationIds[j],
          target: locationIds[i],
          type: 'adjacent',
          properties: {},
        });
        adjEdgeIdx++;
      }
    }
  }

  // ── Region → Location contains edges ────────────────────
  for (const locId of locationIds) {
    const locNode = graph.getNode(locId);
    if (!locNode) continue;
    const hexCol = locNode.properties.hexCol as number;
    const hexRow = locNode.properties.hexRow as number;
    const tile = tiles.find(t => t.coord.col === hexCol && t.coord.row === hexRow);
    if (tile?.regionId) {
      graph.addEdge({
        id: `edge_region_contains_${tile.regionId}_${locId}`,
        source: tile.regionId,
        target: locId,
        type: 'contains',
        properties: {},
      });
    }
  }

  // ── Eager Base Sublocations ──────────────────────────────
  for (let i = 0; i < locationIds.length; i++) {
    ensureSublocations(graph, locationIds[i], seed + i * 7717);
  }

  // ── Resources ────────────────────────────────────────────
  const resourceRng = mulberry32(seed + 22091); // separate PRNG stream
  seedLocationResources(graph, locationIds, cosmology, resourceRng);

  // ── Road Network ──────────────────────────────────────────
  const roadCols = tiles.reduce((max, t) => Math.max(max, t.coord.col), 0) + 1;
  const roadRows = tiles.reduce((max, t) => Math.max(max, t.coord.row), 0) + 1;
  generateRoadEdges(graph, tiles, roadCols, roadRows);

  // ── Cultures ──────────────────────────────────────────────
  const generatedCultureIds = generateCultures(graph, cosmology, locationIds, rng, fundament);
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

  // ── Seed graph structures for mandate evaluation ──────────
  // Give each location 1-2 constructed_by edges (to random factions/individuals later)
  // and 1 controls edge to the strongest faction at each location
  for (let li = 0; li < locationIds.length; li++) {
    const locId = locationIds[li];
    // Controls: first faction controls first location, etc. (round-robin)
    if (factionIds.length > 0) {
      const controllingFaction = factionIds[li % factionIds.length];
      graph.addEdge({
        id: `edge_controls_${li}`,
        source: controllingFaction,
        target: locId,
        type: 'controls',
        properties: { influence: 0.5 + rng() * 0.3 },
      });
    }
    // Constructed_by: 1-2 structures per location (constructed by factions)
    const structureCount = 1 + Math.floor(rng() * 2);
    for (let si = 0; si < structureCount; si++) {
      if (factionIds.length > 0) {
        const builder = factionIds[Math.floor(rng() * factionIds.length)];
        graph.addEdge({
          id: `edge_built_${li}_${si}`,
          source: builder,
          target: locId,
          type: 'constructed_by',
          properties: { structureType: si === 0 ? 'settlement' : 'fortification' },
        });
      }
    }
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
        properties: {
          role: 'member',
          rank: 0.3,       // Default rank for seeded members (Phase 0f)
          joinedTick: 0,    // World creation tick
        },
      });
    }

    graph.addEdge({
      id: `${id}_located_at_${locationId}`,
      source: id,
      target: locationId,
      type: 'located_at',
      properties: {},
    });
  }

  // ── Culture assignment to actors ──────────────────────────
  assignCulturesToActors(graph, individualIds, factionIds, cultureIds, rng);

  // ── Cultural trait instantiation + granting ──────────────────
  for (const cultureId of cultureIds) {
    const cultureNode = graph.getNode(cultureId);
    if (!cultureNode) continue;
    const identity = cultureNode.properties.cultureIdentity as CultureIdentity | undefined;
    if (!identity) continue;

    const formativeIds = instantiateFormativeTraits(graph, identity.formativeTraitSeedIds);
    const behavioralIds = instantiateBehavioralTraits(graph, identity.behavioralTraitSeedIds);

    // Find all actors belonging to this culture
    const belongEdges = graph.getEdgesByType('belongs_to')
      .filter(e => e.target === cultureId);

    for (const edge of belongEdges) {
      const actorNode = graph.getNode(edge.source);
      if (!actorNode || actorNode.type !== 'actor') continue;
      const actorType = actorNode.properties.actorType as string;
      if (actorType !== 'individual' && actorType !== 'faction') continue;

      grantFormativeTraits(graph, edge.source, formativeIds, 0);
      grantBehavioralTraits(graph, edge.source, behavioralIds, 0);
    }
  }

  // ── Initial Ambitions ──────────────────────────────────────
  for (const indId of individualIds) {
    const actorNode = graph.getNode(indId);
    if (!actorNode) continue;

    const caps = (actorNode.properties.domainCapabilities as Record<ReachDomain, number>) ?? {} as Record<ReachDomain, number>;
    const traitEdges = graph.getOutgoingEdges(indId, 'has_trait');
    const traits = traitEdges
      .map(e => graph.getNode(e.target)?.name ?? e.target)
      .filter(Boolean);

    const snapshot: AmbitionAgentSnapshot = {
      domainCapabilities: caps,
      traits,
      culturalSpheres: [],
      bonds: [],
    };

    // Derive a stable per-agent seed from the agent's index
    const agentIndex = parseInt(indId.replace('ind_', ''), 10) || 0;
    const assignments = assignInitialAmbitions(AMBITION_TEMPLATES, snapshot, seed + 29173 + agentIndex * 97);

    for (const assignment of assignments) {
      const ambitionNodeId = `ambition.${assignment.templateId}`;
      if (!graph.getNode(ambitionNodeId)) {
        const tmpl = AMBITION_TEMPLATES.find(t => t.id === assignment.templateId);
        graph.addNode({
          id: ambitionNodeId,
          type: 'ambition',
          name: tmpl?.displayName ?? assignment.templateId,
          properties: {
            templateId: assignment.templateId,
            displayName: tmpl?.displayName ?? assignment.templateId,
            category: tmpl?.category ?? 'survival',
            reachAffinity: tmpl?.reachAffinity ?? {},
            totalMilestones: tmpl?.milestones.length ?? 0,
          },
        });
      }

      graph.addEdge({
        id: `pursues_${indId}_${ambitionNodeId}`,
        source: indId,
        target: ambitionNodeId,
        type: 'pursues',
        properties: {
          priority: assignment.priority,
          status: 'active',
          assignedTick: 0,
          completedMilestones: [],
        },
      });
    }
  }

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
            trust: sentiment * 0.5, // Initialize trust from sentiment (Phase 0e)
          },
        });
      }
    }
  }

  // ── Starter attachments ──────────────────────────────────
  seedAttachments(graph);

  // ── Guilds (System 3) ────────────────────────────────────
  // Separate PRNG stream (seed + 31337) — avoids collision with other streams.
  // Guilds are spawned after resources are seeded (guild type depends on resources)
  // and after factions/individuals exist (for graph integrity).
  const guildIds = seedGuilds(graph, locationIds, seed + 31337);

  // ── Faction Definitions (TB-058) ────────────────────────────
  // Separate PRNG stream (seed + 41449) — avoids collision with other streams.
  // Seeds data-driven factions (Adventuring Guild, etc.) with guild hall sublocations.
  const factionDefResults = seedAllFactions(graph, FACTION_DEFINITIONS, locationIds, seed + 41449);
  const factionDefIds = factionDefResults.map(r => r.factionId);

  return { graph, individualIds, factionIds, guildIds, factionDefIds, locationIds, artifactIds, cultureIds, regionIds, historicalCultureIds };
}
