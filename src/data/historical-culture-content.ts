import type { SphereName, TerrainType } from '../types';

export interface HistoricalCultureTemplate {
  id: string;
  name: string;
  foundationBias?: string;
  sphereAffinities?: SphereName[];
  biomePreference?: TerrainType;   // kept for backward compatibility
  preferredBiomes: TerrainType[];  // 3 core biomes for province generation
  toleratedBiomes: TerrainType[];  // up to 5 additional biomes for heartland
  ruinDescriptors: string[];
  legacyFlavor: string;
}

// ─── Tunable Constants (NFP #1) ──────────────────────────────────

export const HISTORICAL_CULTURE_COUNT = { min: 2, max: 4 };
export const HISTORICAL_TERRITORY_COVERAGE = 0.85;

// ─── Templates ───────────────────────────────────────────────────

export const HISTORICAL_CULTURE_TEMPLATES: HistoricalCultureTemplate[] = [
  {
    id: 'pale_builders',
    name: 'The Pale Builders',
    foundationBias: 'order',
    sphereAffinities: ['matter', 'time'],
    preferredBiomes: ['plateau', 'grassland', 'hills'],
    toleratedBiomes: ['temperate_forest', 'steppe', 'badlands', 'farmland', 'river'],
    ruinDescriptors: ['white stone walls', 'geometric foundations', 'precise arches', 'dust-filled cisterns'],
    legacyFlavor: 'They built to last forever. Their empire did not.',
  },
  {
    id: 'root_speakers',
    name: 'The Root-Speakers',
    foundationBias: 'light',
    sphereAffinities: ['life', 'spirit'],
    biomePreference: 'dense_forest',
    preferredBiomes: ['dense_forest', 'temperate_forest', 'great_home_trees'],
    toleratedBiomes: ['forested_hills', 'swamp', 'marsh', 'boreal_forest', 'hills'],
    ruinDescriptors: ['tree-grown walls', 'living stone altars', 'vine-choked doorways', 'root-carved glyphs'],
    legacyFlavor: 'They spoke to the deep roots, and the roots answered — until they didn\'t.',
  },
  {
    id: 'ash_crowned',
    name: 'The Ash-Crowned',
    foundationBias: 'darkness',
    sphereAffinities: ['entropy', 'force'],
    preferredBiomes: ['badlands', 'volcano', 'rocky_desert'],
    toleratedBiomes: ['dead_forest', 'broken_lands', 'steppe', 'hills', 'desert'],
    ruinDescriptors: ['scorched battlements', 'obsidian pillars', 'ash-filled halls', 'iron-bound gates'],
    legacyFlavor: 'They crowned themselves in ash and called it glory.',
  },
  {
    id: 'tide_callers',
    name: 'The Tide-Callers',
    foundationBias: 'chaos',
    sphereAffinities: ['energy', 'mind'],
    biomePreference: 'coast',
    preferredBiomes: ['coast', 'coastal_shallows', 'ocean'],
    toleratedBiomes: ['reef', 'marsh', 'grassland', 'hills', 'floodplain'],
    ruinDescriptors: ['salt-eaten towers', 'tidal channels', 'coral-crusted docks', 'wave-carved cellars'],
    legacyFlavor: 'They read the tides like scripture. The sea took them anyway.',
  },
  {
    id: 'iron_reclaimers',
    name: 'The Iron Reclaimers',
    foundationBias: 'order',
    sphereAffinities: ['force', 'matter'],
    biomePreference: 'mountains',
    preferredBiomes: ['mountains', 'hills', 'high_mountains'],
    toleratedBiomes: ['badlands', 'plateau', 'tundra', 'glacier', 'mountain_pass'],
    ruinDescriptors: ['deep mine shafts', 'iron-riveted gates', 'forge-scarred stone', 'collapsed tunnels'],
    legacyFlavor: 'They dug too deep for metal that was never meant to be found.',
  },
  {
    id: 'dream_weavers',
    name: 'The Dream-Weavers',
    foundationBias: 'light',
    sphereAffinities: ['mind', 'spirit'],
    preferredBiomes: ['plateau', 'hills', 'grassland'],
    toleratedBiomes: ['desert', 'temperate_forest', 'steppe', 'badlands', 'oasis'],
    ruinDescriptors: ['crystal spires', 'shimmering murals', 'echo chambers', 'meditation alcoves'],
    legacyFlavor: 'They built a civilization in dreams and forgot to wake.',
  },
  {
    id: 'bone_keepers',
    name: 'The Bone-Keepers',
    foundationBias: 'darkness',
    sphereAffinities: ['entropy', 'life'],
    biomePreference: 'swamp',
    preferredBiomes: ['swamp', 'marsh', 'moor_bog'],
    toleratedBiomes: ['dense_forest', 'river', 'lake', 'jungle', 'floodplain'],
    ruinDescriptors: ['ossuary walls', 'bone-inlaid paths', 'preserved burial mounds', 'peat-stained crypts'],
    legacyFlavor: 'They honored every death. In the end there were too many to honor.',
  },
  {
    id: 'star_readers',
    name: 'The Star-Readers',
    foundationBias: 'chaos',
    sphereAffinities: ['time', 'energy'],
    biomePreference: 'plateau',
    preferredBiomes: ['plateau', 'steppe', 'grassland'],
    toleratedBiomes: ['desert', 'hills', 'badlands', 'tundra', 'broken_lands'],
    ruinDescriptors: ['observatory domes', 'astral charts etched in stone', 'collapsed orreries', 'sky-aligned corridors'],
    legacyFlavor: 'They mapped the heavens perfectly. They did not see what was coming from below.',
  },
  {
    id: 'sand_kings',
    name: 'The Sand-Kings',
    foundationBias: 'darkness',
    sphereAffinities: ['force', 'time'],
    biomePreference: 'desert',
    preferredBiomes: ['desert', 'rocky_desert', 'sand_dunes'],
    toleratedBiomes: ['badlands', 'steppe', 'savanna', 'plateau', 'oasis'],
    ruinDescriptors: ['wind-scoured obelisks', 'buried step-pyramids', 'sand-choked colonnades', 'sun-bleached bastions'],
    legacyFlavor: 'They built to outlast the desert. The desert let them think so.',
  },
  {
    id: 'frost_wardens',
    name: 'The Frost-Wardens',
    foundationBias: 'order',
    sphereAffinities: ['matter', 'spirit'],
    biomePreference: 'tundra',
    preferredBiomes: ['tundra', 'glacier', 'snow_fields'],
    toleratedBiomes: ['arctic', 'high_mountains', 'boreal_forest', 'mountains', 'mountain_pass'],
    ruinDescriptors: ['ice-sheathed ramparts', 'frost-cracked longhalls', 'cairns lost under snow', 'wind-honed watchtowers'],
    legacyFlavor: 'They built against the cold for a thousand years. The cold was patient.',
  },
  {
    id: 'green_below',
    name: 'The Green-Below',
    foundationBias: 'chaos',
    sphereAffinities: ['life', 'entropy'],
    biomePreference: 'jungle',
    preferredBiomes: ['jungle', 'tropical_forest', 'swamp'],
    toleratedBiomes: ['dense_forest', 'marsh', 'floodplain', 'coast', 'reef'],
    ruinDescriptors: ['vine-swallowed ziggurats', 'root-split causeways', 'moss-blind idols', 'flooded step-wells'],
    legacyFlavor: 'The jungle lent them the ground. It has since called in the loan.',
  },
  {
    id: 'salt_factors',
    name: 'The Salt-Factors',
    foundationBias: 'light',
    sphereAffinities: ['mind', 'energy'],
    biomePreference: 'floodplain',
    preferredBiomes: ['floodplain', 'river', 'lake'],
    toleratedBiomes: ['grassland', 'marsh', 'coast', 'hills', 'farmland'],
    ruinDescriptors: ['silted counting-houses', 'stone wharves gone dry', 'ledger-vaults picked clean', 'toll-bridge footings'],
    legacyFlavor: 'They kept the accounts of half the world. No ledger recorded their own ending.',
  },
];
