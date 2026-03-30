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
};

// ─── Cosmology Bonus ──────────────────────────────────────────────
//
// Sphere weights in cosmology bias resource quantities.
// If a resource's sphere affinity matches a high cosmology weight,
// quantity gets a boost.

/** Maximum bonus quantity from cosmology sphere affinity. */
export const COSMOLOGY_RESOURCE_BONUS = 15;
