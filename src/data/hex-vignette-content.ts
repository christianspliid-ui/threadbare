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
    'Nothing but water and horizon in every direction.',
    'The sea rolls on, indifferent to what floats upon it.',
  ],
  coastal_shallows: [
    'Shallow waters lap against the shore.',
    'The coastline breaks into sandy shallows.',
    'Turquoise waters reveal the sea floor below.',
    'Wading birds pick through the tidal pools.',
    'The shallows shift with each incoming tide.',
  ],
  lake: [
    'A still lake mirrors the sky.',
    'Calm waters fill this lowland basin.',
    'A lake of dark water rests here.',
    'The lake holds its secrets beneath a flat surface.',
    'Reeds border the water where land gives way.',
  ],
  river: [
    'A river cuts through the landscape.',
    'Flowing water carves its path onward.',
    'The river bends and widens here.',
    'Current pulls at the banks, patient and tireless.',
    'The water moves with purpose older than memory.',
  ],
  deep_ocean: [
    'Fathomless depths press upward with cold weight.',
    'The deep ocean offers nothing but darkness below.',
    'Abyssal currents stir in waters too deep to fathom.',
    'The surface gives no hint of what lies beneath.',
    'Pressure and silence rule the deep waters.',
  ],
  tropical_ocean: [
    'Warm currents drift through sun-bright waters.',
    'The tropical sea shimmers with deceptive calm.',
    'Heat-heavy waves roll across the open tropics.',
    'The water is warm enough to forget the depths below.',
    'Bright surface waters hide the darker blue beneath.',
  ],
  coast: [
    'The coast breaks where land meets the relentless sea.',
    'Rocky shoreline endures the tide\'s endless argument.',
    'Salt spray and wind scour the coastal edge.',
    'The boundary between land and sea shifts with every wave.',
    'Driftwood and kelp mark the tide\'s high reach.',
  ],
  reef: [
    'Coral ridges lurk just beneath the surface.',
    'The reef sprawls in hidden architecture below the waves.',
    'Shallow waters hide a labyrinth of living stone.',
    'Colours bloom beneath the surface where coral builds.',
    'The reef is a city no one walks through.',
  ],
  // Lowlands
  grassland: [
    'Open grasslands roll toward the horizon.',
    'Tall grasses sway across the plain.',
    'The land stretches flat and green.',
    'Wind draws patterns across the open grass.',
    'The plain offers distance in every direction.',
  ],
  farmland: [
    'Tended fields pattern the landscape.',
    'Rows of crops mark cultivated earth.',
    'Farmland spreads in ordered parcels.',
    'Stone walls divide the land into claims and counter-claims.',
    'The soil is worked and dark with turning.',
  ],
  savanna: [
    'Scattered trees dot the dry grassland.',
    'The savanna shimmers under an open sky.',
    'Golden grass stretches between sparse acacias.',
    'Heat rises from red earth between the thorn trees.',
    'The dry grassland hums with insect and wind.',
  ],
  steppe: [
    'Wind-swept steppe extends in every direction.',
    'Short grass covers the dry plain.',
    'The open steppe offers no shelter.',
    'Low scrub clings to ground too sparse for trees.',
    'The wind carries the same song for a hundred leagues.',
  ],
  floodplain: [
    'Rich silt marks where waters rise and fall.',
    'The floodplain lies low, shaped by seasonal drowning.',
    'Fertile mud stretches flat beneath an uncertain sky.',
    'The land remembers water even when dry.',
    'Channels and oxbows trace the river\'s former paths.',
  ],
  // Forest
  temperate_forest: [
    'These ancient forests shade the land.',
    'Dense woodland stretches across the hex.',
    'Broad-leafed trees form a canopy overhead.',
    'Birch and oak lean together in the half-light.',
    'The forest floor is soft with fallen leaves.',
  ],
  dense_forest: [
    'Impenetrable forest fills every hollow.',
    'Old-growth trees crowd together in darkness.',
    'The forest is thick and primordial.',
    'Sunlight struggles to reach the ground here.',
    'The canopy closes like a door overhead.',
  ],
  boreal_forest: [
    'Evergreen forest blankets the cold earth.',
    'Spruce and pine stand in silent ranks.',
    'The taiga stretches northward without end.',
    'Resin and cold stone scent the still air.',
    'Snow lingers between the dark trunks.',
  ],
  jungle: [
    'Lush jungle teems with hidden life.',
    'Vines and broadleaves fight for light.',
    'The jungle canopy blocks out the sky.',
    'Moisture drips from every surface.',
    'Something moves in the green darkness.',
  ],
  tropical_forest: [
    'Tropical growth presses in from every direction.',
    'The forest drips with heat and green abundance.',
    'Dense tropical canopy admits no direct light.',
    'The air is thick enough to taste.',
    'Ferns and palms crowd the understory.',
  ],
  evergreen_forest: [
    'Needled branches hold their green through every season.',
    'The evergreen forest stands in year-round shadow.',
    'Pine and spruce crowd together in dark permanence.',
    'The forest floor is carpeted in brown needles.',
    'A sharp, clean scent fills the cold air.',
  ],
  light_forest: [
    'Scattered trees admit generous light between them.',
    'The woodland is open and airy, almost welcoming.',
    'Light forest covers the ground in dappled shade.',
    'Birdsong carries easily between the spaced trunks.',
    'Wildflowers grow where the canopy thins.',
  ],
  dead_forest: [
    'Bare trunks stand like monuments to what once lived.',
    'The forest died standing — grey and skeletal.',
    'Dead wood stretches in every direction, stripped of life.',
    'Bark peels from trunks that will never leaf again.',
    'The silence here is the kind left after something ends.',
  ],
  // Wet
  swamp: [
    'Murky water pools beneath twisted roots.',
    'The swamp breathes mist and decay.',
    'Boggy ground sinks underfoot here.',
    'Dark water reflects nothing but shadow.',
    'Insects own the air in numbers.',
  ],
  marsh: [
    'Peat moss covers the waterlogged ground.',
    'The bog stretches, treacherous and silent.',
    'Stagnant water hides beneath a skin of moss.',
    'Each step is a negotiation with ground that may not hold.',
    'The air smells of damp earth and slow rot.',
  ],
  moor_bog: [
    'Peat and heather stretch across waterlogged moor.',
    'The bog hides its depths beneath false ground.',
    'Wind-swept moorland offers nothing but endurance.',
    'The moor is honest — bleak in every direction.',
    'Water seeps from ground that looks solid.',
  ],
  // Elevated
  hills: [
    'Rolling hills define the landscape.',
    'The land rises and falls in gentle crests.',
    'Grass-covered hills catch the wind.',
    'Each ridge offers a different view of the same country.',
    'Sheep paths wind along the contours.',
  ],
  mountains: [
    'Jagged peaks pierce the clouds.',
    'The mountains rise, immovable and ancient.',
    'Rock and snow dominate the heights.',
    'The air thins with altitude.',
    'Stone faces scarred by weather and time.',
  ],
  plateau: [
    'A flat-topped plateau commands the view.',
    'The plateau rises abruptly from the lowlands.',
    'High tableland stretches above the valleys.',
    'Wind screams across the exposed flat.',
    'The edges drop away into distant shadow.',
  ],
  badlands: [
    'Eroded pillars and ravines scar the earth.',
    'The badlands crack and crumble underfoot.',
    'Wind-carved stone forms alien shapes.',
    'Colour without life — rust and ash and purple shadow.',
    'The stone reveals its strata like pages of a book.',
  ],
  high_mountains: [
    'The highest peaks vanish into perpetual cloud.',
    'Sheer rock faces rise beyond where anything grows.',
    'Thin air and killing cold rule the high mountains.',
    'Snow and ice claim everything above the tree line.',
    'The altitude alone is enough to turn people back.',
  ],
  mountain_pass: [
    'A narrow gap threads between towering walls of stone.',
    'The pass is the only way through — and barely that.',
    'Wind funnels through the mountain pass with force.',
    'Stone walls rise on both sides, leaving only the path.',
    'The pass smells of cold rock and distance.',
  ],
  // Elevated + forested
  forested_hills: [
    'Wooded hills shelter hidden valleys.',
    'Dense forest blankets the rising ground.',
    'Leafy canopies drape over rolling hills.',
    'The trees grow thick on the sheltered slopes.',
    'Mist collects in the forested hollows.',
  ],
  // Special
  great_home_trees: [
    'Colossal trees tower above the canopy.',
    'The great home trees are monuments to life.',
    'Ancient trunks wider than towers rise here.',
    'The world beneath the canopy is always twilight.',
    'Roots as thick as roads anchor the giants.',
  ],
  broken_lands: [
    'The earth itself is shattered and wrong.',
    'Reality fractures across the broken lands.',
    'Twisted terrain defies natural order.',
    'The ground has not finished settling.',
    'Gravity behaves strangely near the deepest cracks.',
  ],
  oasis: [
    'A pocket of green defies the surrounding waste.',
    'Water surfaces here against all expectation.',
    'The oasis is a promise the desert rarely keeps.',
    'Palm shade and still water mark this place.',
    'Life crowds around the water source.',
  ],
  // Extreme
  desert: [
    'Sun-blasted dunes stretch to the horizon.',
    'The desert offers nothing but sand and silence.',
    'Parched earth cracks beneath a merciless sun.',
    'Heat shimmers turn the middle distance into illusion.',
    'The sand swallows footprints within the hour.',
  ],
  tundra: [
    'Frozen tundra extends beneath a pale sky.',
    'Lichens and moss cling to the permafrost.',
    'The tundra lies still, locked in cold.',
    'Nothing stands tall enough to cast shadow.',
    'The wind carries cold as a physical weight.',
  ],
  glacier: [
    'Blue ice groans and shifts underfoot.',
    'The glacier crawls forward, ancient and patient.',
    'A frozen river of ice dominates the land.',
    'Crevasses split the surface in shifting patterns.',
    'Light refracts through ice into impossible blues.',
  ],
  volcano: [
    'Volcanic rock radiates lingering heat.',
    'The ground smokes near vents and fissures.',
    'Lava once flowed here — the scars remain.',
    'The earth remembers fire and promises more.',
    'Sulphur and heat rise from cracks in the basalt.',
  ],
  rocky_desert: [
    'Stone and gravel stretch without mercy or shade.',
    'The rocky desert bakes under an indifferent sun.',
    'Nothing soft survives on this sunbaked pavement.',
    'Flat stone absorbs the heat and holds it.',
    'The horizon shimmers where rock meets sky.',
  ],
  sand_dunes: [
    'Dunes shift and reform in the wind\'s image.',
    'Sand rises in waves that mock the ocean\'s patience.',
    'The dunes erase all paths within hours.',
    'Windblown sand stings exposed skin.',
    'The crests of the dunes change shape overnight.',
  ],
  arctic: [
    'Ice and darkness share dominion over this place.',
    'The arctic waste admits no compromise with warmth.',
    'Frozen silence stretches to the edge of the world.',
    'The cold here is not weather but geography.',
    'White extends in every direction without feature.',
  ],
  snow_fields: [
    'Unbroken snow blankets the land in white silence.',
    'The snow fields reflect a sky that offers no comfort.',
    'Drifts of snow bury everything that does not move.',
    'Sound carries strangely across the flat white.',
    'The snow is deep enough to swallow a horse.',
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
