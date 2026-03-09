// src/data/hex-vignette-content.ts
/**
 * Hex Vignette Content Package — All prose vocabulary for hex tooltips.
 *
 * ═══════════════════════════════════════════════════════════════════
 * CONTENT MANAGER: This is the file you edit to add variety to hex tooltips.
 * Adding entries to these arrays requires NO engine or component changes.
 * ═══════════════════════════════════════════════════════════════════
 */

import type { TerrainType, LocationSubtype } from '../types';
import type { HexVisibilityState } from '../types/visibility';
import type {
  TemperatureBand,
  MoistureBand,
  PopulationBand,
  CompassDirection,
  VisibilityTransforms,
} from '../types/hexVignette';
import type { AllSphereName } from './hex-tile-assets';

// ═══════════════════════════════════════════════════════════════════
// 1. TERRAIN OPENINGS — Tier 1 first clause
// ═══════════════════════════════════════════════════════════════════

export const TERRAIN_OPENINGS: Record<TerrainType, string[]> = {
  // Water
  ocean: [
    'Deep waters stretch endlessly here.',
    'The open sea dominates this expanse.',
    'Dark ocean currents churn beneath the surface.',
  ],
  coastal_shallows: [
    'Shallow waters lap against the shore.',
    'The coastline breaks into sandy shallows.',
    'Turquoise waters reveal the sea floor below.',
  ],
  lake: [
    'A still lake mirrors the sky.',
    'Calm waters fill this lowland basin.',
    'A lake of dark water rests here.',
  ],
  river: [
    'A river cuts through the landscape.',
    'Flowing water carves its path onward.',
    'The river bends and widens here.',
  ],
  // Lowlands
  grassland: [
    'Open grasslands roll toward the horizon.',
    'Tall grasses sway across the plain.',
    'The land stretches flat and green.',
  ],
  farmland: [
    'Tended fields pattern the landscape.',
    'Rows of crops mark cultivated earth.',
    'Farmland spreads in ordered parcels.',
  ],
  savanna: [
    'Scattered trees dot the dry grassland.',
    'The savanna shimmers under an open sky.',
    'Golden grass stretches between sparse acacias.',
  ],
  steppe: [
    'Wind-swept steppe extends in every direction.',
    'Short grass covers the dry plain.',
    'The open steppe offers no shelter.',
  ],
  // Forest
  deciduous_forest: [
    'These ancient forests shade the land.',
    'Dense woodland stretches across the hex.',
    'Broad-leafed trees form a canopy overhead.',
  ],
  dense_forest: [
    'Impenetrable forest fills every hollow.',
    'Old-growth trees crowd together in darkness.',
    'The forest is thick and primordial.',
  ],
  taiga: [
    'Evergreen forest blankets the cold earth.',
    'Spruce and pine stand in silent ranks.',
    'The taiga stretches northward without end.',
  ],
  jungle: [
    'Lush jungle teems with hidden life.',
    'Vines and broadleaves fight for light.',
    'The jungle canopy blocks out the sky.',
  ],
  // Wet
  swamp: [
    'Murky water pools beneath twisted roots.',
    'The swamp breathes mist and decay.',
    'Boggy ground sinks underfoot here.',
  ],
  bog: [
    'Peat moss covers the waterlogged ground.',
    'The bog stretches, treacherous and silent.',
    'Stagnant water hides beneath a skin of moss.',
  ],
  // Elevated
  hills: [
    'Rolling hills define the landscape.',
    'The land rises and falls in gentle crests.',
    'Grass-covered hills catch the wind.',
  ],
  mountains: [
    'Jagged peaks pierce the clouds.',
    'The mountains rise, immovable and ancient.',
    'Rock and snow dominate the heights.',
  ],
  plateau: [
    'A flat-topped plateau commands the view.',
    'The plateau rises abruptly from the lowlands.',
    'High tableland stretches above the valleys.',
  ],
  badlands: [
    'Eroded pillars and ravines scar the earth.',
    'The badlands crack and crumble underfoot.',
    'Wind-carved stone forms alien shapes.',
  ],
  // Elevated + forested
  forested_hills_evergreen: [
    'Pine-clad hills roll into the distance.',
    'Evergreen forests climb the hillsides.',
    'Dark conifers blanket the rising ground.',
  ],
  forested_hills_deciduous: [
    'Wooded hills shelter hidden valleys.',
    'Deciduous forest covers the undulating land.',
    'Leafy canopies drape over rolling hills.',
  ],
  forested_hills_jungle: [
    'Tropical forest clings to steep hillsides.',
    'Jungle growth spills over the ridgelines.',
    'Dense vegetation swallows the hilly terrain.',
  ],
  // Special
  great_home_trees: [
    'Colossal trees tower above the canopy.',
    'The great home trees are monuments to life.',
    'Ancient trunks wider than towers rise here.',
  ],
  broken_lands: [
    'The earth itself is shattered and wrong.',
    'Reality fractures across the broken lands.',
    'Twisted terrain defies natural order.',
  ],
  // Extreme
  desert: [
    'Sun-blasted dunes stretch to the horizon.',
    'The desert offers nothing but sand and silence.',
    'Parched earth cracks beneath a merciless sun.',
  ],
  tundra: [
    'Frozen tundra extends beneath a pale sky.',
    'Lichens and moss cling to the permafrost.',
    'The tundra lies still, locked in cold.',
  ],
  glacier: [
    'Blue ice groans and shifts underfoot.',
    'The glacier crawls forward, ancient and patient.',
    'A frozen river of ice dominates the land.',
  ],
  volcanic: [
    'Volcanic rock radiates lingering heat.',
    'The ground smokes near vents and fissures.',
    'Lava once flowed here — the scars remain.',
  ],
};

// ═══════════════════════════════════════════════════════════════════
// 2. CLIMATE MATRIX — Tier 1 second clause
// ═══════════════════════════════════════════════════════════════════

export const CLIMATE_MATRIX: Record<TemperatureBand, Record<MoistureBand, string[]>> = {
  frigid: {
    arid: ['A biting, dry cold clings to everything.', 'The air is brittle and bone-dry.'],
    dry: ['Frost coats the sparse ground.', 'Cold and dry, the land barely sustains life.'],
    moderate: ['Snow falls softly on the frozen ground.', 'The cold is sharp but not without moisture.'],
    damp: ['Icy fog drifts across the landscape.', 'Damp cold seeps into everything.'],
    saturated: ['Freezing mist hangs in the still air.', 'Everything drips and freezes in turn.'],
  },
  cold: {
    arid: ['The cold air is crisp and clear.', 'A dry chill settles over the land.'],
    dry: ['Cool winds carry no hint of rain.', 'The dry cold is bracing.'],
    moderate: ['The air is cool and fresh.', 'A pleasant chill accompanies the breeze.'],
    damp: ['Cold dampness clings to skin and cloth.', 'Mist rolls through at dawn and dusk.'],
    saturated: ['Rain and cold conspire without end.', 'The ground never dries under grey skies.'],
  },
  temperate: {
    arid: ['Warm and dry, the land thirsts quietly.', 'The temperate climate lacks only rain.'],
    dry: ['Mild air and low moisture define this place.', 'The weather is pleasant but parched.'],
    moderate: ['The climate is mild and balanced.', 'Neither too hot nor too cold, neither parched nor flooded.'],
    damp: ['Gentle rains keep the land green.', 'The air carries the scent of damp earth.'],
    saturated: ['Persistent rain feeds every hollow.', 'Water is never far from the surface.'],
  },
  warm: {
    arid: ['Heat shimmers off the dry ground.', 'The warm air is painfully dry.'],
    dry: ['Warmth radiates from sun-baked earth.', 'The land is warm and thirsty.'],
    moderate: ['Warm breezes carry a hint of moisture.', 'The climate is warm and livable.'],
    damp: ['Humid warmth hangs beneath the canopy.', 'Damp heat clings to everything.'],
    saturated: ['Tropical moisture saturates the thick air.', 'Water and warmth conspire endlessly.'],
  },
  scorching: {
    arid: ['The sun punishes all beneath it.', 'Scorching heat and no water — death walks here.'],
    dry: ['Blistering heat dries the earth to dust.', 'The heat is relentless and dry.'],
    moderate: ['Hot winds carry a hint of distant rain.', 'The scorching air holds some moisture.'],
    damp: ['Sweltering humidity makes the air heavy.', 'Oppressive heat and damp refuse to relent.'],
    saturated: ['Steam rises from the soaked, baking earth.', 'The air is a furnace of wet heat.'],
  },
};

// ═══════════════════════════════════════════════════════════════════
// 3. POPULATION PHRASES — Tier 2 first sentence
// ═══════════════════════════════════════════════════════════════════

export const POPULATION_PHRASES: Record<PopulationBand, string[]> = {
  empty: [
    'The land lies empty.',
    'No souls linger here.',
    'This place stands abandoned to the wild.',
  ],
  sparse: [
    'A few souls linger here.',
    'Sparse signs of habitation mark the land.',
    'Life here is thin and scattered.',
  ],
  moderate: [
    'A settled presence marks this hex.',
    'Communities have taken root here.',
    'The land supports a modest population.',
  ],
  bustling: [
    'The land teems with activity.',
    'Civilization thrives here.',
    'A bustling presence fills the hex.',
  ],
};

// ═══════════════════════════════════════════════════════════════════
// 4. LOCATION TEMPLATES — Tier 2 spotlight sentences
// ═══════════════════════════════════════════════════════════════════

export const LOCATION_TEMPLATES: string[] = [
  '{direction}, {name} — a {subtype} touched by {sphere}.',
  'A {subtype} called {name} stands {direction}, resonating with {sphere}.',
  '{name}, a {subtype}, rises {direction}.',
  '{direction} lies {name}, a {subtype} steeped in {sphere}.',
  'The {subtype} of {name} watches {direction}, marked by {sphere}.',
];

// ═══════════════════════════════════════════════════════════════════
// 5. CULTURE PHRASES — Tier 3
// ═══════════════════════════════════════════════════════════════════

export const CULTURE_PHRASES: string[] = [
  'The people follow the ways of the {cultureName}, drawn to {foundationBias}.',
  'The {cultureName} hold sway here, their ways shaped by {foundationBias}.',
  '{cultureName} traditions mark the culture, rooted in {foundationBias}.',
  'The influence of the {cultureName} is felt — their bond to {foundationBias} runs deep.',
];

// ═══════════════════════════════════════════════════════════════════
// 6. SPHERE AURA PHRASES — Tier 3
// ═══════════════════════════════════════════════════════════════════

export const SPHERE_AURA_PHRASES: Record<AllSphereName, string[]> = {
  force: [
    'Threads of Force pulse through this place.',
    'A tension hangs in the air — raw power, barely contained.',
  ],
  matter: [
    'The earth here feels dense, almost alive with Matter.',
    'Stone and soil resonate with an unnatural solidity.',
  ],
  energy: [
    'Sparks of Energy crackle at the edges of perception.',
    'The air hums with latent Energy.',
  ],
  life: [
    'Life surges abundantly — every surface teems with growth.',
    'The pulse of Life beats strong in this place.',
  ],
  mind: [
    'Thoughts sharpen near this place — Mind touches everything.',
    'A clarity hangs in the air, sharp and demanding.',
  ],
  spirit: [
    'The veil between worlds thins here — Spirit seeps through.',
    'Whispers of Spirit drift on unseen currents.',
  ],
  time: [
    'Time moves strangely here — moments stretch and compress.',
    'The weight of ages presses down on this place.',
  ],
  entropy: [
    'Threads of Entropy weave through this place.',
    'Something unravels quietly — the touch of Entropy.',
  ],
  chaos: [
    'The air shimmers with unpredictability — Chaos reigns.',
    'Nothing stays fixed for long in this place.',
  ],
  order: [
    'An invisible structure holds everything in place — Order prevails.',
    'Patterns repeat with uncanny precision here.',
  ],
  light: [
    'A radiance suffuses this place, sourceless and warm.',
    'Light touches even the deepest shadows here.',
  ],
  darkness: [
    'Shadows pool thickly, even in daylight.',
    'Darkness clings to every surface, reluctant to release.',
  ],
};

// ═══════════════════════════════════════════════════════════════════
// 7. FACTION PHRASES — Tier 3
// ═══════════════════════════════════════════════════════════════════

export const FACTION_PHRASES: string[] = [
  'The {factionName} hold this ground.',
  '{factionName} banners mark the territory.',
  'This land answers to the {factionName}.',
  'The grip of the {factionName} is felt here.',
];

// ═══════════════════════════════════════════════════════════════════
// 8. ENCOUNTER PHRASES — Tier 3
// ═══════════════════════════════════════════════════════════════════

export const ENCOUNTER_PHRASES: string[] = [
  'A trial of {encounterType} unfolds at {locationName}.',
  'Something stirs at {locationName} — a matter of {encounterType}.',
  'Events at {locationName} demand attention — {encounterType} is afoot.',
];

// ═══════════════════════════════════════════════════════════════════
// 9. COMPASS WORDS — Direction vocabulary
// ═══════════════════════════════════════════════════════════════════

export const COMPASS_WORDS: Record<CompassDirection, string[]> = {
  north:     ['To the north', 'Northward', 'In the northern reaches'],
  northeast: ['To the northeast', 'Northeastward'],
  east:      ['To the east', 'Eastward', 'In the eastern quarter'],
  southeast: ['To the southeast', 'Southeastward'],
  south:     ['To the south', 'Southward', 'In the southern reaches'],
  southwest: ['To the southwest', 'Southwestward'],
  west:      ['To the west', 'Westward', 'In the western quarter'],
  northwest: ['To the northwest', 'Northwestward'],
};

// ═══════════════════════════════════════════════════════════════════
// 10. VISIBILITY WRAPPERS — Voice transformations
// ═══════════════════════════════════════════════════════════════════

export const VISIBILITY_WRAPPERS: Record<HexVisibilityState, VisibilityTransforms> = {
  visible: {
    wrapTier1: (s) => s,
    wrapTier2: (s) => s,
    wrapTier3: (s) => s,
  },
  remembered: {
    wrapTier1: (s) => `You recall: ${s.charAt(0).toLowerCase()}${s.slice(1)}`,
    wrapTier2: (s) => `You recall ${s.charAt(0).toLowerCase()}${s.slice(1)}`,
    wrapTier3: (s) => `${s.replace(/\.$/, '')} — as you last saw it.`,
  },
  unexplored: {
    wrapTier1: (s) => s,
    wrapTier2: (s) => s,
    wrapTier3: (s) => s,
  },
};

// ═══════════════════════════════════════════════════════════════════
// 11. SUBTYPE DISPLAY NAMES — Human-readable location subtype labels
// ═══════════════════════════════════════════════════════════════════

export const SUBTYPE_DISPLAY_NAMES: Record<LocationSubtype, string> = {
  hamlet: 'hamlet',
  town: 'town',
  city: 'city',
  capital: 'capital',
  camp: 'camp',
  farmland: 'farmstead',
  castle: 'castle',
  fort: 'fort',
  tower: 'tower',
  shrine: 'shrine',
  temple: 'temple',
  mining: 'mining outpost',
  ruins: 'ruins',
  ruined_tower: 'ruined tower',
  ruined_city: 'ruined city',
  ruined_village: 'ruined village',
  battleground: 'battleground',
  oasis: 'oasis',
  unexplored_poi: 'unknown site',
  wilderness: 'wilderness',
};
