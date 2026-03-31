/**
 * Resource content data — definitions, terrain mappings, and prose.
 *
 * All magic numbers live here per NFP #1 (Tunability).
 */

import type { ResourceDefinition, TerrainResourceEntry } from '../types/resource';

// ─── Resource Definitions ─────────────────────────────────────────

export const RESOURCE_DEFINITIONS: Record<string, ResourceDefinition> = {
  timber: {
    id: 'timber',
    name: 'Timber',
    terrains: [
      'temperate_forest', 'dense_forest', 'boreal_forest', 'jungle',
      'tropical_forest', 'evergreen_forest', 'light_forest',
      'forested_hills', 'great_home_trees',
    ],
    baseQuantity: [40, 85],
    sphereAffinities: ['life', 'matter'],
    renewable: true,
    renewalRate: 0.3,
    description: 'Wood from felled trees, used for construction and fuel.',
  },
  stone: {
    id: 'stone',
    name: 'Stone',
    terrains: [
      'mountains', 'high_mountains', 'hills', 'badlands', 'plateau',
      'mountain_pass', 'broken_lands',
    ],
    baseQuantity: [50, 90],
    sphereAffinities: ['matter'],
    renewable: false,
    renewalRate: 0,
    description: 'Quarried rock for fortifications and monuments.',
  },
  ore: {
    id: 'ore',
    name: 'Ore',
    terrains: [
      'mountains', 'high_mountains', 'volcano', 'hills',
      'badlands', 'broken_lands',
    ],
    baseQuantity: [20, 70],
    sphereAffinities: ['matter', 'energy'],
    renewable: false,
    renewalRate: 0,
    description: 'Metal-bearing rock — iron, copper, tin, and rarer veins.',
  },
  water: {
    id: 'water',
    name: 'Fresh Water',
    terrains: [
      'lake', 'river', 'floodplain', 'oasis', 'marsh', 'swamp',
      'moor_bog', 'jungle', 'temperate_forest',
    ],
    baseQuantity: [30, 80],
    sphereAffinities: ['life'],
    renewable: true,
    renewalRate: 0.6,
    description: 'Clean water from springs, rivers, or lakes.',
  },
  fish: {
    id: 'fish',
    name: 'Fish',
    terrains: [
      'coast', 'coastal_shallows', 'lake', 'river', 'reef',
      'floodplain',
    ],
    baseQuantity: [30, 75],
    sphereAffinities: ['life'],
    renewable: true,
    renewalRate: 0.4,
    description: 'Catch from rivers, lakes, or coastal waters.',
  },
  grazing: {
    id: 'grazing',
    name: 'Grazing Land',
    terrains: [
      'grassland', 'savanna', 'steppe', 'farmland',
      'light_forest', 'hills',
    ],
    baseQuantity: [35, 80],
    sphereAffinities: ['life'],
    renewable: true,
    renewalRate: 0.5,
    description: 'Pasture for livestock and cavalry mounts.',
  },
  grain: {
    id: 'grain',
    name: 'Grain',
    terrains: [
      'farmland', 'floodplain', 'grassland',
    ],
    baseQuantity: [40, 85],
    sphereAffinities: ['life', 'matter'],
    renewable: true,
    renewalRate: 0.6,
    description: 'Cultivated crops — wheat, barley, millet, rice.',
  },
  peat: {
    id: 'peat',
    name: 'Peat',
    terrains: [
      'marsh', 'moor_bog', 'swamp',
    ],
    baseQuantity: [20, 55],
    sphereAffinities: ['entropy'],
    renewable: false,
    renewalRate: 0.05, // technically renewable but on geological timescales
    description: 'Compressed plant matter — fuel and preservative.',
  },

  // ── Rare Resources (anomaly-exclusive) ─────────────────────────────
  // Only appear at discovered anomaly locations. Lower base quantity than common resources.

  gemstones: {
    id: 'gemstones',
    name: 'Gemstones',
    terrains: ['hills', 'mountains', 'high_mountains'],
    baseQuantity: [10, 40],
    sphereAffinities: ['matter', 'light'],
    renewable: false,
    renewalRate: 0,
    description: 'Precious stones — high trade value, jewelry and enchantment reagent.',
  },
  arcane_crystal: {
    id: 'arcane_crystal',
    name: 'Arcane Crystal',
    terrains: ['mountains', 'high_mountains', 'volcano'],
    baseQuantity: [8, 25],
    sphereAffinities: ['energy', 'matter'],
    renewable: false,
    renewalRate: 0,
    description: 'Resonant crystal formations that amplify magical effects.',
  },
  golden_sap: {
    id: 'golden_sap',
    name: 'Golden Sap',
    terrains: ['temperate_forest', 'dense_forest', 'jungle'],
    baseQuantity: [15, 35],
    sphereAffinities: ['life', 'matter'],
    renewable: true,
    renewalRate: 0.1,
    description: 'Amber-like resin from rare trees — alchemical base and luxury trade good.',
  },
  medicinal_herb: {
    id: 'medicinal_herb',
    name: 'Medicinal Herbs',
    terrains: ['temperate_forest', 'grassland', 'jungle', 'hills'],
    baseQuantity: [20, 50],
    sphereAffinities: ['life'],
    renewable: true,
    renewalRate: 0.4,
    description: 'Wild healing plants — reduces recovery time, alchemical ingredient.',
  },
  ancient_relic: {
    id: 'ancient_relic',
    name: 'Ancient Relics',
    terrains: ['broken_lands', 'badlands', 'ruins'],
    baseQuantity: [5, 15],
    sphereAffinities: ['time', 'order'],
    renewable: false,
    renewalRate: 0,
    description: 'Preserved artifacts from a fallen civilization — knowledge and power.',
  },
  sunken_gold: {
    id: 'sunken_gold',
    name: 'Sunken Gold',
    terrains: ['coast', 'coastal_shallows', 'swamp'],
    baseQuantity: [10, 30],
    sphereAffinities: ['time', 'entropy'],
    renewable: false,
    renewalRate: 0,
    description: 'Coins and ingots from a drowned treasury — pure wealth.',
  },
  fossil_amber: {
    id: 'fossil_amber',
    name: 'Fossil Amber',
    terrains: ['desert', 'rocky_desert', 'badlands'],
    baseQuantity: [8, 20],
    sphereAffinities: ['time', 'matter'],
    renewable: false,
    renewalRate: 0,
    description: 'Ancient preserved remains with residual magical resonance.',
  },
  star_metal: {
    id: 'star_metal',
    name: 'Star Metal',
    terrains: ['mountains', 'volcano', 'hills'],
    baseQuantity: [5, 20],
    sphereAffinities: ['force', 'spirit'],
    renewable: false,
    renewalRate: 0,
    description: 'Meteoric iron fallen from the sky — extremely hard, slightly magical, feared in weapons.',
  },
  pearls: {
    id: 'pearls',
    name: 'Pearls',
    terrains: ['coast', 'coastal_shallows', 'reef'],
    baseQuantity: [10, 30],
    sphereAffinities: ['spirit', 'light'],
    renewable: true,
    renewalRate: 0.15,
    description: 'Natural pearls — luxury good, spirit-attuned, devotional offering.',
  },
  glowcap: {
    id: 'glowcap',
    name: 'Glowcap Spores',
    terrains: ['swamp', 'dense_forest', 'marsh'],
    baseQuantity: [12, 35],
    sphereAffinities: ['mind', 'darkness'],
    renewable: true,
    renewalRate: 0.3,
    description: 'Bioluminescent fungi — mind-expanding alchemical reagent.',
  },
};

// ─── Terrain → Resource Mapping ───────────────────────────────────
//
// Each terrain maps to 0-3 resource entries with quantity ranges.
// During seeding, each location picks from its terrain's table.

export const TERRAIN_RESOURCE_TABLE: Readonly<Record<string, readonly TerrainResourceEntry[]>> = {
  // Water
  ocean: [],
  deep_ocean: [],
  tropical_ocean: [],
  coastal_shallows: [
    { type: 'fish', min: 40, max: 75 },
  ],
  coast: [
    { type: 'fish', min: 35, max: 70 },
    { type: 'water', min: 15, max: 35 },
  ],
  lake: [
    { type: 'fish', min: 40, max: 75 },
    { type: 'water', min: 50, max: 80 },
  ],
  river: [
    { type: 'fish', min: 30, max: 60 },
    { type: 'water', min: 60, max: 85 },
  ],
  reef: [
    { type: 'fish', min: 50, max: 80 },
  ],

  // Lowlands
  grassland: [
    { type: 'grazing', min: 50, max: 80 },
    { type: 'grain', min: 20, max: 45 },
  ],
  farmland: [
    { type: 'grain', min: 55, max: 85 },
    { type: 'grazing', min: 30, max: 55 },
    { type: 'water', min: 25, max: 45 },
  ],
  savanna: [
    { type: 'grazing', min: 40, max: 70 },
  ],
  steppe: [
    { type: 'grazing', min: 35, max: 65 },
  ],
  floodplain: [
    { type: 'grain', min: 60, max: 90 },
    { type: 'water', min: 55, max: 80 },
    { type: 'fish', min: 25, max: 50 },
  ],

  // Forest
  temperate_forest: [
    { type: 'timber', min: 55, max: 85 },
    { type: 'water', min: 20, max: 40 },
  ],
  dense_forest: [
    { type: 'timber', min: 65, max: 90 },
  ],
  boreal_forest: [
    { type: 'timber', min: 50, max: 80 },
  ],
  jungle: [
    { type: 'timber', min: 60, max: 85 },
    { type: 'water', min: 40, max: 65 },
  ],
  tropical_forest: [
    { type: 'timber', min: 55, max: 80 },
    { type: 'water', min: 30, max: 50 },
  ],
  evergreen_forest: [
    { type: 'timber', min: 50, max: 75 },
  ],
  light_forest: [
    { type: 'timber', min: 30, max: 55 },
    { type: 'grazing', min: 20, max: 40 },
  ],
  dead_forest: [
    { type: 'timber', min: 10, max: 30 },
  ],

  // Wet
  swamp: [
    { type: 'peat', min: 30, max: 55 },
    { type: 'water', min: 35, max: 60 },
  ],
  marsh: [
    { type: 'peat', min: 35, max: 55 },
    { type: 'fish', min: 15, max: 35 },
    { type: 'water', min: 40, max: 65 },
  ],
  moor_bog: [
    { type: 'peat', min: 25, max: 50 },
  ],

  // Elevated
  hills: [
    { type: 'stone', min: 30, max: 60 },
    { type: 'grazing', min: 25, max: 50 },
    { type: 'ore', min: 10, max: 35 },
  ],
  mountains: [
    { type: 'stone', min: 60, max: 90 },
    { type: 'ore', min: 35, max: 70 },
  ],
  high_mountains: [
    { type: 'stone', min: 65, max: 95 },
    { type: 'ore', min: 40, max: 75 },
  ],
  plateau: [
    { type: 'stone', min: 35, max: 60 },
    { type: 'grazing', min: 20, max: 45 },
  ],
  badlands: [
    { type: 'stone', min: 40, max: 70 },
    { type: 'ore', min: 20, max: 50 },
  ],
  mountain_pass: [
    { type: 'stone', min: 25, max: 50 },
  ],

  // Elevated + forested
  forested_hills: [
    { type: 'timber', min: 40, max: 65 },
    { type: 'stone', min: 20, max: 45 },
  ],

  // Special
  great_home_trees: [
    { type: 'timber', min: 70, max: 95 },
    { type: 'water', min: 30, max: 55 },
  ],
  broken_lands: [
    { type: 'stone', min: 30, max: 60 },
    { type: 'ore', min: 25, max: 55 },
  ],
  oasis: [
    { type: 'water', min: 60, max: 85 },
    { type: 'grain', min: 20, max: 40 },
  ],

  // Extreme
  desert: [],
  rocky_desert: [
    { type: 'stone', min: 20, max: 45 },
  ],
  sand_dunes: [],
  tundra: [],
  glacier: [
    { type: 'water', min: 30, max: 55 },
  ],
  volcano: [
    { type: 'ore', min: 45, max: 80 },
    { type: 'stone', min: 35, max: 60 },
  ],
  arctic: [],
  snow_fields: [],
};

// ─── Resource Prose Templates ─────────────────────────────────────
//
// Each resource type has abundance and scarcity variants.
// The resolver picks based on quantity threshold.

export const RESOURCE_PROSE: Readonly<Record<string, { abundant: readonly string[]; scarce: readonly string[] }>> = {
  timber: {
    abundant: [
      'The forests here are rich with timber — ancient trunks ready for the axe.',
      'Lumber is the wealth of this place. Trees enough to build a city, if one had the will.',
      'Tall wood, straight-grained and plentiful. The sawyers have never gone hungry.',
    ],
    scarce: [
      'A few thin stands of trees cling to the slopes, hardly enough to build a single wall.',
      'What timber remains has been cut and recut. The stumps outnumber the trunks.',
    ],
  },
  stone: {
    abundant: [
      'The bedrock pushes close to the surface here — stone for the taking, if you have the backs for it.',
      'Quarries could be carved from these hills for a generation and never run dry.',
      'Good stone, close-grained and heavy. The sort that holds mortar and remembers shape.',
    ],
    scarce: [
      'The stone here is poor — crumbling shale and soft chalk, barely fit for a wall.',
      'What rock breaks the surface is thin and fractured. No great works will rise from it.',
    ],
  },
  ore: {
    abundant: [
      'Iron seams run through the hills like dark veins. A smith would weep at the richness.',
      'The ore here is close to pure — dark and heavy, worth more than the land above it.',
      'These mountains hold metal enough to arm an empire, buried under centuries of patience.',
    ],
    scarce: [
      'Traces of ore in the rock face — enough to tempt a prospector, not enough to sustain one.',
      'The deeper veins have been worked out. What remains is scattered and lean.',
    ],
  },
  water: {
    abundant: [
      'Water runs clear and generous here — springs that never dry, streams that never thin.',
      'This land has never known thirst. The water table sits high and steady beneath the soil.',
      'Fresh water in abundance. The kind of wealth that does not glitter but sustains everything.',
    ],
    scarce: [
      'Water is precious here — hoarded, measured, fought over in dry seasons.',
      'The wells run shallow and the streams are seasonal. This land knows thirst.',
    ],
  },
  fish: {
    abundant: [
      'The waters teem with fish, drawn by currents and the generosity of deep pools.',
      'Nets come up heavy here. The catch has been reliable since before anyone kept records.',
      'Fish enough to feed the settlement and trade the surplus. The waters provide.',
    ],
    scarce: [
      'The fishing is thin — a few bony specimens in muddy shallows.',
      'Once these waters held more. Now the nets come up light, and the fishers look elsewhere.',
    ],
  },
  grazing: {
    abundant: [
      'The grasslands stretch unbroken, thick with growth. Any herd would prosper here.',
      'Rich pasture, deep-rooted and self-renewing. The herders guard it like gold.',
      'Green land, rolling and generous. The kind of ground that fattens cattle and breeds horses.',
    ],
    scarce: [
      'The grazing is sparse — dry scrub and thin grass, hardly enough for a small flock.',
      'What pasture exists is overgrazed and patchy. The herds have outgrown the land.',
    ],
  },
  grain: {
    abundant: [
      'The soil here is dark and deep — grain grows tall without coaxing.',
      'Harvest follows harvest. This is the kind of land that feeds empires.',
      'The fields are golden and endless. Surplus is the expectation, not the exception.',
    ],
    scarce: [
      'The soil is thin and reluctant. What grain grows does so grudgingly.',
      'A poor harvest is the norm here. The land gives little and asks much.',
    ],
  },
  peat: {
    abundant: [
      'The bogs are deep with peat — fuel enough for generations, if you can stand the digging.',
      'Dark compressed earth, ancient and slow-burning. The marshfolk know its worth.',
    ],
    scarce: [
      'Thin layers of peat at the edges of the wet ground. Hardly worth the labor of cutting.',
    ],
  },
  // ── Rare resource prose ──
  gemstones: {
    abundant: [
      'The rock face glitters with exposed crystal — rubies, sapphires, stones that catch the light and hold it.',
      'A vein of precious stone runs deep through the hill. Enough to fund a dynasty, if one could guard it.',
    ],
    scarce: [
      'A few dull stones in the rubble, barely worth cutting. The main seam lies deeper, or has already been claimed.',
    ],
  },
  arcane_crystal: {
    abundant: [
      'The crystals hum in chorus, resonating with energies that make the teeth ache. Power, waiting to be shaped.',
      'Formations of pure arcane crystal thrust from the walls like frozen lightning. Mages would kill for this.',
    ],
    scarce: [
      'A few small shards, cloudy and cracked. Whatever power they held has mostly bled away.',
    ],
  },
  golden_sap: {
    abundant: [
      'The trees weep gold. Thick resin pools in the bark hollows, amber and sweet-smelling, warm to the touch.',
      'Every trunk in the grove bleeds this slow gold. The air is thick with its honeyed scent.',
    ],
    scarce: [
      'A thin trickle of sap from a single old tree. The grove has given most of what it will give.',
    ],
  },
  medicinal_herb: {
    abundant: [
      'The ground is carpeted with rare healing plants — feverfew, dreamroot, bloodmoss — growing wild and uncultivated.',
      'An apothecary\'s paradise. Species that shouldn\'t grow together thrive side by side, as if tended by unseen hands.',
    ],
    scarce: [
      'A few scraggly specimens cling to the shade. Barely enough for a single poultice.',
    ],
  },
  ancient_relic: {
    abundant: [
      'The vault holds wonders — mechanisms, tablets, instruments from a civilization that understood more than we do.',
      'Shelves of preserved artifacts, each one a window into a world that fell. The knowledge here could reshape empires.',
    ],
    scarce: [
      'Most of the vault has already been looted or crumbled to dust. A few fragments remain, barely legible.',
    ],
  },
  sunken_gold: {
    abundant: [
      'Coins spill from rotted chests, gold and silver dulled by water but no less valuable for it.',
      'The treasury lies open to the currents. Ingots, coins, jewelry — the wealth of a drowned kingdom.',
    ],
    scarce: [
      'A handful of corroded coins in the silt. Whatever fortune lay here has long since been scattered.',
    ],
  },
  fossil_amber: {
    abundant: [
      'The rock splits to reveal amber tombs — creatures frozen in resin for ages beyond counting, magic still flickering in their bones.',
      'Fossil beds of extraordinary richness. Each stone holds a preserved remnant of a world older than memory.',
    ],
    scarce: [
      'A few cracked nodules of amber, the specimens within too degraded to be of much use.',
    ],
  },
  star_metal: {
    abundant: [
      'The crater is veined with dark metal, dense and cold despite the sun. Star metal — fallen from above, harder than anything forged below.',
      'Chunks of meteoric iron, black and heavy, scatter the impact site. Smiths speak of this metal in whispers.',
    ],
    scarce: [
      'A few small fragments of dark metal in the soil, barely enough for a single blade. Most of the star\'s gift has already been claimed.',
    ],
  },
  pearls: {
    abundant: [
      'The oyster beds are vast and generous. Pearls of uncommon size and luster lie waiting in the shallows.',
      'Moon-white, perfectly round, and warm to the touch. The shoal produces pearls that temples and courts alike covet.',
    ],
    scarce: [
      'A few undersized pearls, seed-like and dull. The beds have been harvested too often or too carelessly.',
    ],
  },
  glowcap: {
    abundant: [
      'The hollow pulses with soft light. Glowcap fungi carpet every surface, their spores drifting like luminous snow.',
      'An alchemist\'s dream — glowcap in profusion, their mind-opening properties concentrated in the dark air itself.',
    ],
    scarce: [
      'A few dimly luminous caps cling to the damp stone. The colony is small and fragile.',
    ],
  },
};

// ─── Anomaly → Resource Mapping ──────────────────────────────────
// Maps anomaly location subtype to its rare resource ID.
// Used when discovery encounter succeeds to seed the resource.

export const ANOMALY_RESOURCE_MAP: Readonly<Record<string, string>> = {
  gem_deposit:     'gemstones',
  crystal_cavern:  'arcane_crystal',
  golden_grove:    'golden_sap',
  herb_garden:     'medicinal_herb',
  ancient_vault:   'ancient_relic',
  sunken_treasury: 'sunken_gold',
  fossil_bed:      'fossil_amber',
  iron_seep:       'star_metal',
  pearl_shoal:     'pearls',
  glowcap_hollow:  'glowcap',
};

// ─── Cosmology Bonus ──────────────────────────────────────────────
//
// Sphere weights in cosmology bias resource quantities.
// If a resource's sphere affinity matches a high cosmology weight,
// quantity gets a boost.

/** Maximum bonus quantity from cosmology sphere affinity. */
export const COSMOLOGY_RESOURCE_BONUS = 15;
