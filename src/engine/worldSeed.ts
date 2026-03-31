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
import { generateCultures, assignCulturesToActors, registerPregenCultures, assignCultureToLocation } from './cultureGenerator';
import type { PregenCulture } from './cultureGenerator';
import type { Province } from './worldgen/types';
import {
  PROVINCE_ROLE_CAPITAL,
  PROVINCE_ROLE_HEARTLAND,
  PROVINCE_ROLE_BORDERLAND,
} from './worldgen/types';
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
import { AGENT_COUNT_BY_MAP_SIZE, AGENT_COUNT_FALLBACK } from '../data/agent-behavior-constants';
import { MC_COMPANY_NAMES } from '../data/mercenary-company-definition';
import { spawnArmy } from './armySpawning';
import type { GameState } from '../types/gameState';
import { ensureSublocations } from './sublocation';
import { assignInitialAmbitions } from './ambitionAssignment';
import { getTerrainSphereScores } from '../types/sphereAffinity';
import type { SphereName as SphereNameType } from '../types/index';
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

/** @deprecated Use AGENT_COUNT_BY_MAP_SIZE from agent-behavior-constants.ts instead */
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
  // Sphere-resonant — low material prosperity, high narrative value
  healing_spring: 5,
  master_forge: 20,
  living_archive: 10,
  fey_crossing: 0,
  sacrifice_site: 0,
  convergence: 0,
  time_scar: 0,
  standing_stones: 0,
  shadow_hollow: 0,
  ley_nexus: 5,
  // Wilderness interest — minimal prosperity
  cavern: 0,
  grove: 0,
  hot_spring: 5,
  shipwreck: 10,
  monument: 0,
  ancient_road: 0,
  // Natural anomalies — economic value (discoverable treasure)
  gem_deposit: 35,
  golden_grove: 25,
  crystal_cavern: 30,
  ancient_vault: 40,
  sunken_treasury: 35,
  herb_garden: 15,
  fossil_bed: 10,
  iron_seep: 25,
  pearl_shoal: 30,
  glowcap_hollow: 15,
  // Monster/danger — no starting prosperity
  nest: 0,
  haunted_ground: 0,
  corruption_zone: 0,
  unexplored_poi: 0,
};

// VALUE_PAIRS imported from types/agent.ts

const REACH_DOMAINS: ReachDomain[] = [
  'iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star',
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
  // Sphere-resonant
  healing_spring:  ['Gentle', 'Blessed', 'Radiant', 'Whispering', 'Warm'],
  master_forge:    ['Ancient', 'Singing', 'Blazing', 'Tireless', 'Eternal'],
  living_archive:  ['Whispering', 'Breathing', 'Turning', 'Endless', 'Deep'],
  fey_crossing:    ['Shimmering', 'Twilight', 'Dancing', 'Waning', 'Silver'],
  sacrifice_site:  ['Blood', 'Dark', 'Hallowed', 'Ashen', 'Silent'],
  convergence:     ['Great', 'Terrible', 'Roaring', 'Blazing', 'World'],
  time_scar:       ['Fractured', 'Echoing', 'Bleeding', 'Frozen', 'Thinning'],
  standing_stones: ['Ancient', 'Nameless', 'Grey', 'Towering', 'Weathered'],
  shadow_hollow:   ['Dim', 'Sunken', 'Quiet', 'Hungry', 'Pale'],
  ley_nexus:       ['Bright', 'Crackling', 'Surging', 'Pulsing', 'Singing'],
  // Wilderness interest
  cavern:          ['Deep', 'Dark', 'Echoing', 'Hidden', 'Dripping'],
  grove:           ['Old', 'Quiet', 'Verdant', 'Mossy', 'Gnarled'],
  hot_spring:      ['Steaming', 'Bubbling', 'Warm', 'Sulphur', 'Mist'],
  shipwreck:       ['Storm-Broken', 'Lost', 'Barnacled', 'Sunken', 'Rotting'],
  monument:        ['Forgotten', 'Weathered', 'Crumbling', 'Moss-Covered', 'Ancient'],
  ancient_road:    ['Worn', 'Cracked', 'Overgrown', 'Wide', 'Paved'],
  // Anomalies (economy/treasure)
  gem_deposit:     ['Gleaming', 'Rich', 'Hidden', 'Bright', 'Precious'],
  golden_grove:    ['Amber', 'Gilded', 'Dripping', 'Rich', 'Honeyed'],
  crystal_cavern:  ['Resonant', 'Singing', 'Bright', 'Prismatic', 'Deep'],
  ancient_vault:   ['Sealed', 'Forgotten', 'Buried', 'Lost', 'Warded'],
  sunken_treasury: ['Drowned', 'Silted', 'Barnacled', 'Deep', 'Lost'],
  herb_garden:     ['Wild', 'Fragrant', 'Lush', 'Hidden', 'Rare'],
  fossil_bed:      ['Ancient', 'Petrified', 'Exposed', 'Weathered', 'Bone'],
  iron_seep:       ['Red', 'Bleeding', 'Rich', 'Dark', 'Heavy'],
  pearl_shoal:     ['Moonlit', 'Quiet', 'Shallow', 'Lustrous', 'Pale'],
  glowcap_hollow:  ['Luminous', 'Eerie', 'Soft', 'Pulsing', 'Dim'],
  // Monster/danger
  nest:            ['Writhing', 'Teeming', 'Buzzing', 'Dark', 'Pulsing'],
  haunted_ground:  ['Weeping', 'Cold', 'Restless', 'Grey', 'Hollow'],
  corruption_zone: ['Blighted', 'Rotting', 'Seeping', 'Festering', 'Broken'],
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
  // Sphere-resonant
  healing_spring:  [' Spring', ' Waters', ' Pool', ' Font', ' Wellspring'],
  master_forge:    [' Forge', ' Anvil', ' Crucible', ' Hearth'],
  living_archive:  [' Archive', ' Library', ' Codex', ' Scriptorium'],
  fey_crossing:    [' Crossing', ' Gate', ' Threshold', ' Glade'],
  sacrifice_site:  [' Altar', ' Circle', ' Ground', ' Pit'],
  convergence:     [' Convergence', ' Nexus', ' Crucible', ' Vortex'],
  time_scar:       [' Scar', ' Rift', ' Wound', ' Fracture'],
  standing_stones: [' Stones', ' Circle', ' Henge', ' Dolmen'],
  shadow_hollow:   [' Hollow', ' Shade', ' Murk', ' Gloom'],
  ley_nexus:       [' Nexus', ' Wellspring', ' Conduit', ' Beacon'],
  // Wilderness interest
  cavern:          [' Cavern', ' Grotto', ' Cave', ' Depths'],
  grove:           [' Grove', ' Copse', ' Glade', ' Stand'],
  hot_spring:      [' Springs', ' Pools', ' Vents', ' Baths'],
  shipwreck:       [' Wreck', ' Hulk', ' Bones', ' Keel'],
  monument:        [' Tomb', ' Barrow', ' Cairn', ' Monolith'],
  ancient_road:    [' Road', ' Way', ' Path', ' Causeway'],
  // Anomalies (economy/treasure)
  gem_deposit:     [' Seam', ' Deposit', ' Vein', ' Pocket'],
  golden_grove:    [' Grove', ' Arbor', ' Copse', ' Stand'],
  crystal_cavern:  [' Cavern', ' Geode', ' Chamber', ' Gallery'],
  ancient_vault:   [' Vault', ' Hoard', ' Cache', ' Strongroom'],
  sunken_treasury: [' Treasury', ' Wreck', ' Cache', ' Hoard'],
  herb_garden:     [' Garden', ' Meadow', ' Patch', ' Dell'],
  fossil_bed:      [' Beds', ' Fields', ' Flats', ' Basin'],
  iron_seep:       [' Seep', ' Vein', ' Lode', ' Flow'],
  pearl_shoal:     [' Shoal', ' Beds', ' Shallows', ' Banks'],
  glowcap_hollow:  [' Hollow', ' Dell', ' Grotto', ' Bower'],
  // Monster/danger
  nest:            [' Nest', ' Hive', ' Warren', ' Brood'],
  haunted_ground:  [' Ground', ' Fields', ' Mound', ' Barrow'],
  corruption_zone: [' Blight', ' Mire', ' Waste', ' Taint'],
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
  pregenCultures?: PregenCulture[],
  provinceIds?: Int16Array,
  provinces?: Province[],
  provinceRoles?: Uint8Array,
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

  // ── Pass 2: Sphere-Resonant Wonder Locations ────────────────────
  // Scan empty habitable hexes. If dominant sphere score >= threshold, roll for
  // a sphere-themed wonder location. Higher scores = higher chance.
  // These are the "magic seeping through the terrain" locations from Place Archetypes.

  const wonderRng = mulberry32(seed + 23017); // separate PRNG stream

  /** Minimum sphere score on a hex to be eligible for a wonder location */
  const WONDER_SPHERE_THRESHOLD = 2;
  /** Base chance for a hex meeting threshold to spawn a wonder (scaled by score) */
  const WONDER_BASE_CHANCE = 0.12;
  /** Max fraction of empty habitable hexes that can become wonders */
  const WONDER_MAX_FRACTION = 0.06;

  /** Maps dominant sphere → eligible wonder location subtypes */
  const SPHERE_WONDER_TABLE: Partial<Record<SphereNameType, LocationSubtype[]>> = {
    life:     ['healing_spring', 'grove'],
    matter:   ['master_forge', 'crystal_cavern'],
    energy:   ['ley_nexus'],
    spirit:   ['fey_crossing', 'living_archive'],
    mind:     ['living_archive', 'standing_stones'],
    force:    ['convergence', 'master_forge'],
    time:     ['time_scar', 'standing_stones'],
    entropy:  ['sacrifice_site', 'shadow_hollow', 'corruption_zone'],
    chaos:    ['fey_crossing', 'corruption_zone'],
    order:    ['standing_stones', 'living_archive'],
    light:    ['ley_nexus', 'healing_spring'],
    darkness: ['shadow_hollow', 'sacrifice_site', 'haunted_ground'],
  };

  // Helper: check if placing a non-settlement location violates existing settlement spacing.
  // Non-settlement locations have no spacing of their own, but must respect existing settlements'.
  const violatesSettlementSpacing = (tile: HexTile): boolean => {
    return placedSettlements.some(placed => {
      const gap = SETTLEMENT_MIN_SPACING[placed.subtype] ?? 0;
      if (gap === 0) return false;
      const dist = hexDistance(tile.coord, { col: placed.col, row: placed.row });
      return dist <= gap;
    });
  };

  const emptyHabitableTiles = habitableTiles.filter(t => {
    const hk = `${t.coord.col},${t.coord.row}`;
    return !usedHexes.has(hk);
  });

  const maxWonders = Math.floor(emptyHabitableTiles.length * WONDER_MAX_FRACTION);
  let wonderCount = 0;

  // Shuffle empty tiles for fair distribution
  const shuffledEmpty = [...emptyHabitableTiles];
  for (let i = shuffledEmpty.length - 1; i > 0; i--) {
    const j = Math.floor(wonderRng() * (i + 1));
    [shuffledEmpty[i], shuffledEmpty[j]] = [shuffledEmpty[j], shuffledEmpty[i]];
  }

  for (const tile of shuffledEmpty) {
    if (wonderCount >= maxWonders) break;

    const sphereScores = getTerrainSphereScores(tile.terrain);
    // Find the dominant sphere (highest score)
    let dominantSphere: SphereNameType | null = null;
    let maxScore = 0;
    for (const [sphere, score] of Object.entries(sphereScores)) {
      if ((score as number) > maxScore) {
        maxScore = score as number;
        dominantSphere = sphere as SphereNameType;
      }
    }

    if (maxScore < WONDER_SPHERE_THRESHOLD || !dominantSphere) continue;

    // Don't place too close to an existing settlement
    if (violatesSettlementSpacing(tile)) continue;

    // Chance scales with sphere strength
    const chance = WONDER_BASE_CHANCE * (maxScore / WONDER_SPHERE_THRESHOLD);
    if (wonderRng() > chance) continue;

    // Pick a wonder subtype from the sphere's eligible list
    const eligible = SPHERE_WONDER_TABLE[dominantSphere];
    if (!eligible || eligible.length === 0) continue;
    const subtype = eligible[Math.floor(wonderRng() * eligible.length)];

    const hexKey = `${tile.coord.col},${tile.coord.row}`;
    const id = `loc_${locIndex}`;
    const name = generateLocationName(wonderRng, tile.terrain, subtype, usedLocationNames);
    usedLocationNames.add(name);

    const sphereInfluence: Record<string, number> = {};
    for (const sp of SPHERE_NAMES) {
      sphereInfluence[sp] = wonderRng() * 0.1;
    }

    usedHexes.add(hexKey);
    graph.addNode({
      id,
      type: 'location',
      name,
      properties: {
        locationType: subtype,
        locationSubtype: subtype,
        hexCol: tile.coord.col,
        hexRow: tile.coord.row,
        terrain: tile.terrain,
        sphereBiases: {},
        sphereInfluence,
        prosperity: INITIAL_PROSPERITY[subtype] ?? 0,
        isWonderLocation: true,
      },
    });
    locationIds.push(id);
    locIndex++;
    wonderCount++;
  }

  // ── Pass 3: Wilderness Interest Points ──────────────────────────
  // Scatter non-magical points of interest in empty hexes based on terrain.
  // These make the wilderness feel alive — caves, groves, hot springs, etc.

  const wildRng = mulberry32(seed + 31337);

  /** Fraction of remaining empty hexes that get a wilderness interest point */
  const WILDERNESS_INTEREST_FRACTION = 0.10;

  /** Terrain → eligible wilderness subtypes (weighted) */
  const TERRAIN_WILDERNESS_TABLE: Partial<Record<TerrainType, Array<[LocationSubtype, number]>>> = {
    mountains:       [['cavern', 4], ['hot_spring', 1], ['monument', 1]],
    high_mountains:  [['cavern', 3], ['monument', 1]],
    hills:           [['cavern', 2], ['monument', 2], ['ancient_road', 1]],
    forested_hills:  [['cavern', 2], ['grove', 2]],
    forest:          [['grove', 3], ['ancient_road', 1]],
    temperate_forest:[['grove', 3], ['ancient_road', 1]],
    dense_forest:    [['grove', 4]],
    boreal_forest:   [['grove', 2], ['hot_spring', 1]],
    jungle:          [['grove', 2], ['monument', 2]],
    volcano:         [['hot_spring', 3], ['cavern', 2]],
    coast:           [['shipwreck', 3], ['monument', 1]],
    desert:          [['monument', 2], ['ancient_road', 2]],
    rocky_desert:    [['cavern', 2], ['monument', 2]],
    tundra:          [['hot_spring', 1], ['monument', 1]],
    glacier:         [['cavern', 1]],
    swamp:           [['monument', 1]],
    broken_lands:    [['ancient_road', 2], ['monument', 1]],
    grassland:       [['ancient_road', 2], ['monument', 1], ['grove', 1]],
    plains:          [['ancient_road', 2], ['monument', 1]],
    savanna:         [['monument', 1], ['ancient_road', 1]],
    steppe:          [['monument', 1], ['ancient_road', 1]],
    plateau:         [['monument', 1], ['cavern', 1], ['ancient_road', 1]],
    badlands:        [['cavern', 2], ['monument', 1]],
  };

  // Refresh empty hex list (wonders may have claimed some)
  const emptyAfterWonders = habitableTiles.filter(t => {
    const hk = `${t.coord.col},${t.coord.row}`;
    return !usedHexes.has(hk);
  });
  const shuffledWild = [...emptyAfterWonders];
  for (let i = shuffledWild.length - 1; i > 0; i--) {
    const j = Math.floor(wildRng() * (i + 1));
    [shuffledWild[i], shuffledWild[j]] = [shuffledWild[j], shuffledWild[i]];
  }

  const maxWild = Math.floor(emptyAfterWonders.length * WILDERNESS_INTEREST_FRACTION);
  let wildCount = 0;

  for (const tile of shuffledWild) {
    if (wildCount >= maxWild) break;

    // Don't place too close to an existing settlement
    if (violatesSettlementSpacing(tile)) continue;

    // Look up terrain-specific table, fallback to null (skip this hex)
    const weights = TERRAIN_WILDERNESS_TABLE[tile.terrain];
    if (!weights || weights.length === 0) continue;

    const totalWeight = weights.reduce((sum, [, w]) => sum + w, 0);
    let roll = wildRng() * totalWeight;
    let subtype: LocationSubtype = 'wilderness';
    for (const [st, weight] of weights) {
      roll -= weight;
      if (roll <= 0) { subtype = st; break; }
    }
    if (subtype === 'wilderness') continue;

    const hexKey = `${tile.coord.col},${tile.coord.row}`;
    const id = `loc_${locIndex}`;
    const name = generateLocationName(wildRng, tile.terrain, subtype, usedLocationNames);
    usedLocationNames.add(name);

    const sphereInfluence: Record<string, number> = {};
    for (const sp of SPHERE_NAMES) {
      sphereInfluence[sp] = wildRng() * 0.05;
    }

    usedHexes.add(hexKey);
    graph.addNode({
      id,
      type: 'location',
      name,
      properties: {
        locationType: subtype,
        locationSubtype: subtype,
        hexCol: tile.coord.col,
        hexRow: tile.coord.row,
        terrain: tile.terrain,
        sphereBiases: {},
        sphereInfluence,
        prosperity: INITIAL_PROSPERITY[subtype] ?? 0,
      },
    });
    locationIds.push(id);
    locIndex++;
    wildCount++;
  }

  // ── Pass 4: Natural Anomalies (Economy/Treasure) ────────────────
  // Resource-bearing locations discoverable via Eye reach exploration.
  // Seeded as hidden by default — agents must explore to find them.
  // These are Endless Legend-style anomalies providing economic bonuses.

  const anomalyRng = mulberry32(seed + 41953);

  /** Fraction of remaining empty hexes that get an anomaly */
  const ANOMALY_FRACTION = 0.03;

  /** Terrain → eligible anomaly subtypes (weighted) */
  const TERRAIN_ANOMALY_TABLE: Partial<Record<TerrainType, Array<[LocationSubtype, number]>>> = {
    mountains:       [['gem_deposit', 3], ['iron_seep', 2], ['crystal_cavern', 2]],
    high_mountains:  [['gem_deposit', 2], ['crystal_cavern', 3]],
    hills:           [['gem_deposit', 2], ['iron_seep', 2], ['fossil_bed', 1]],
    volcano:         [['iron_seep', 3], ['crystal_cavern', 2], ['gem_deposit', 1]],
    forest:          [['golden_grove', 2], ['herb_garden', 3], ['glowcap_hollow', 1]],
    temperate_forest:[['herb_garden', 3], ['golden_grove', 2]],
    dense_forest:    [['glowcap_hollow', 3], ['herb_garden', 2], ['golden_grove', 1]],
    jungle:          [['herb_garden', 3], ['glowcap_hollow', 2], ['golden_grove', 1]],
    coast:           [['pearl_shoal', 3], ['sunken_treasury', 2]],
    swamp:           [['glowcap_hollow', 3], ['herb_garden', 1]],
    marsh:           [['glowcap_hollow', 2], ['herb_garden', 1]],
    desert:          [['fossil_bed', 3], ['gem_deposit', 1]],
    rocky_desert:    [['fossil_bed', 3], ['gem_deposit', 2]],
    badlands:        [['fossil_bed', 3], ['iron_seep', 1]],
    broken_lands:    [['ancient_vault', 3], ['fossil_bed', 2]],
    grassland:       [['herb_garden', 2], ['fossil_bed', 1]],
    plains:          [['herb_garden', 2], ['fossil_bed', 1]],
    tundra:          [['fossil_bed', 1], ['crystal_cavern', 1]],
    glacier:         [['crystal_cavern', 1]],
    plateau:         [['gem_deposit', 1], ['iron_seep', 1], ['fossil_bed', 1]],
    boreal_forest:   [['herb_garden', 2], ['golden_grove', 1]],
  };

  // Refresh empty hex list
  const emptyAfterWild = habitableTiles.filter(t => {
    const hk = `${t.coord.col},${t.coord.row}`;
    return !usedHexes.has(hk);
  });
  const shuffledAnomaly = [...emptyAfterWild];
  for (let i = shuffledAnomaly.length - 1; i > 0; i--) {
    const j = Math.floor(anomalyRng() * (i + 1));
    [shuffledAnomaly[i], shuffledAnomaly[j]] = [shuffledAnomaly[j], shuffledAnomaly[i]];
  }

  const maxAnomalies = Math.floor(emptyAfterWild.length * ANOMALY_FRACTION);
  let anomalyCount = 0;

  for (const tile of shuffledAnomaly) {
    if (anomalyCount >= maxAnomalies) break;

    // Anomalies can spawn near settlements — they're hidden natural resources.
    // Only skip if hex is already occupied (checked via usedHexes filter above).

    const weights = TERRAIN_ANOMALY_TABLE[tile.terrain];
    if (!weights || weights.length === 0) continue;

    const totalWeight = weights.reduce((sum, [, w]) => sum + w, 0);
    let roll = anomalyRng() * totalWeight;
    let subtype: LocationSubtype = 'wilderness';
    for (const [st, weight] of weights) {
      roll -= weight;
      if (roll <= 0) { subtype = st; break; }
    }
    if (subtype === 'wilderness') continue;

    const hexKey = `${tile.coord.col},${tile.coord.row}`;
    const id = `loc_${locIndex}`;
    const name = generateLocationName(anomalyRng, tile.terrain, subtype, usedLocationNames);
    usedLocationNames.add(name);

    const sphereInfluence: Record<string, number> = {};
    for (const sp of SPHERE_NAMES) {
      sphereInfluence[sp] = anomalyRng() * 0.05;
    }

    usedHexes.add(hexKey);
    graph.addNode({
      id,
      type: 'location',
      name,
      properties: {
        locationType: subtype,
        locationSubtype: subtype,
        hexCol: tile.coord.col,
        hexRow: tile.coord.row,
        terrain: tile.terrain,
        sphereBiases: {},
        sphereInfluence,
        prosperity: INITIAL_PROSPERITY[subtype] ?? 0,
        isAnomalyLocation: true,
        discoveredByExploration: false, // requires Eye reach to find
      },
    });
    locationIds.push(id);
    locIndex++;
    anomalyCount++;
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
  // Build location → culture map from province data for territory-aware assignment
  const locationCultureMap = new Map<string, { cultureId: string; role: number }>();

  if (pregenCultures && provinceIds && provinces) {
    // Territory-aware path: register pre-generated cultures as graph nodes
    const registeredIds = registerPregenCultures(graph, pregenCultures);
    cultureIds.push(...registeredIds);

    // Assign cultures to locations based on their province membership
    const gridCols = tiles.reduce((max, t) => Math.max(max, t.coord.col), 0) + 1;
    for (const locId of locationIds) {
      const node = graph.getNode(locId);
      if (!node) continue;
      const hexCol = node.properties.hexCol as number;
      const hexRow = node.properties.hexRow as number;
      const hexIdx = hexRow * gridCols + hexCol;
      const provId = provinceIds[hexIdx];
      if (provId < 0 || provId >= provinces.length) continue;

      const province = provinces[provId];
      if (!province.cultureId || !cultureIds.includes(province.cultureId)) continue;

      // Assign current culture from province
      assignCultureToLocation(graph, locId, province.cultureId, 'current');
      // Historical layer: same culture for now (future: could differ for lost provinces)
      assignCultureToLocation(graph, locId, province.cultureId, 'historical');

      // Track for actor assignment — use province role from worldgen typed array
      const role = provinceRoles ? provinceRoles[hexIdx] ?? PROVINCE_ROLE_BORDERLAND : PROVINCE_ROLE_BORDERLAND;
      locationCultureMap.set(locId, { cultureId: province.cultureId, role });
    }
  } else {
    // Legacy fallback: generate cultures internally with round-robin assignment
    const generatedCultureIds = generateCultures(graph, cosmology, locationIds, rng, fundament);
    cultureIds.push(...generatedCultureIds);
  }

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
  // Derive map size category from tile count to scale agent population
  const tileCount = tiles.length;
  const mapSizeKey = tileCount <= 400 ? 'small'
    : tileCount <= 1000 ? 'medium'
    : tileCount <= 2000 ? 'large'
    : 'epic';
  const agentRange = AGENT_COUNT_BY_MAP_SIZE[mapSizeKey] ?? AGENT_COUNT_FALLBACK;
  const indCount = randomInRange(rng, agentRange.min, agentRange.max);
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
  assignCulturesToActors(graph, individualIds, factionIds, cultureIds, rng,
    locationCultureMap.size > 0 ? locationCultureMap : undefined);

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

  // ── Mercenary Company Post-Seeding Wiring (TB-073 Phase 0 / Phase 18) ──
  // After generic seedAllFactions creates the two merc company faction nodes,
  // this block adds per-company: distinctive name, static ambition, placeholder
  // commander (with located_at), and an army at the primary hall location.
  // CRITICAL: does NOT remove anything created by seedAllFactions.

  // Constants (NFP #1 — all magic numbers named)
  const MC_SEED_OFFSET = 51929;       // Distinct PRNG stream for merc post-processing
  const MC_COMMANDER_IRON_CAP = 60;   // Iron capability for placeholder commanders
  const MC_COMMANDER_GOLD_CAP = 40;   // Gold capability for placeholder commanders (drives army size)

  const mercResults = factionDefResults.filter(r =>
    r.factionId.startsWith('faction_def_mercenary_company_'),
  );

  for (let i = 0; i < mercResults.length; i++) {
    const result = mercResults[i];
    const companyName = MC_COMPANY_NAMES[i] ?? `Mercenary Company ${i}`;

    // 1. Rename the faction instance to its distinctive company name
    graph.updateNode(result.factionId, { name: companyName });

    // 2. Seed static resource_acquisition ambition
    const ambitionId = `amb_${result.factionId}_seed`;
    graph.addNode({
      id: ambitionId,
      type: 'ambition',
      name: `${companyName} — resource acquisition`,
      properties: {
        ambitionType: 'resource_acquisition',
        priority: 0.5,
        targetNodeId: null,
        grievanceDecay: 0,
        createdTick: 0,
      },
    });
    graph.addEdge({
      id: `e_pursues_${result.factionId}_seed`,
      source: result.factionId,
      target: ambitionId,
      type: 'pursues',
      properties: { priority: 0.5, status: 'active', milestones: [] },
    });

    // 3. Create placeholder commander agent
    // Capabilities: high Iron (combat) and moderate Gold (logistics)
    const commanderId = `agent_mc_cmdr_${i}`;
    graph.addNode({
      id: commanderId,
      type: 'actor',
      name: `${companyName} Commander`,
      properties: {
        actorType: 'individual',
        domainCapabilities: {
          iron: MC_COMMANDER_IRON_CAP,
          gold: MC_COMMANDER_GOLD_CAP,
          shadow: 20,
          veil: 10,
          heart: 15,
          eye: 15,
          stone: 20,
          star: 10,
        },
        displaced: false,
      },
    });

    // Get primary hall location from the first guild hall
    // Hall nodes store parentLocationId in properties
    const primaryHallId = result.guildHallIds[0];
    const primaryHallNode = primaryHallId ? graph.getNode(primaryHallId) : null;
    const primaryLocationId = (primaryHallNode?.properties?.parentLocationId as string | undefined)
      ?? result.guildHallIds[0]; // Fallback: point directly to hall if no parent

    if (primaryLocationId) {
      // located_at edge: commander → primary hall location
      // This is required by spawnArmy — it reads commander's located_at to find spawn point
      graph.addEdge({
        id: `e_located_at_${commanderId}`,
        source: commanderId,
        target: primaryLocationId,
        type: 'located_at',
        properties: {},
      });
    }

    // member_of edge: commander → faction (role: commander, rank: war_chief)
    graph.addEdge({
      id: `e_member_of_${commanderId}`,
      source: commanderId,
      target: result.factionId,
      type: 'member_of',
      properties: {
        role: 'commander',
        rank: 'war_chief',
        reputation: 0.9,
        factionDefId: 'mercenary_company',
        joinedTick: 0,
      },
    });

    // 4. Spawn army at commander's location
    // spawnArmy only accesses state.graph and state.tick — verified in armySpawning.ts
    // A partial cast is safe here; no other fields are read.
    const _mcSeedOffset = MC_SEED_OFFSET + i; // keep constant referenced (NFP #1)
    if (primaryLocationId) {
      const seedTimeState = { graph, tick: 0 } as GameState;
      spawnArmy(seedTimeState, result.factionId, commanderId, ambitionId);
    }
  }

  return { graph, individualIds, factionIds, guildIds, factionDefIds, locationIds, artifactIds, cultureIds, regionIds, historicalCultureIds };
}
