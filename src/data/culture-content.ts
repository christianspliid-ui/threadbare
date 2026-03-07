/**
 * Culture Content Package — foundation modifiers, creation sphere modifiers, and biome modifiers.
 *
 * Cultures are shaped by:
 * 1. Foundation Spheres (Chaos/Order/Light/Darkness) — sets social structure and accountability model
 * 2. Creation Spheres (8 domains) — influences behavioral coloring, material vocabulary, and trait seeds
 * 3. Biome (22 terrain types) — drives survival priorities, material culture, and metaphor palette
 *
 * Together, these three layers generate culture-specific:
 * - Social structure and accountability systems
 * - Behavioral traits and tendencies
 * - Material and artistic vocabulary
 * - Narrative metaphors and worldview
 *
 * Source: Docs/plans/2026-03-06-culture-bounded-context-design.md
 */

import type { SphereName, TerrainType } from '../types/index';

// ─── Foundation Modifier Interface ────────────────────────────────

export interface FoundationModifier {
  id: string;
  socialStructure: string;
  accountability: string;
  behavioralKeywords: string[];
  metaphorSeeds: string[];
}

// ─── Creation Sphere Modifier Interface ───────────────────────────

export interface CreationSphereModifier {
  sphere: SphereName;
  behavioralColoring: string;
  behavioralKeywords: string[];
  materialVocabulary: string[];
  formativeTraitSeeds: string[];
  behavioralTraitSeeds: string[];
}

// ─── Biome Modifier Interface ─────────────────────────────────────

export interface BiomeModifier {
  terrain: TerrainType;
  survivalTraitKeywords: string[];
  materialCulture: string[];
  metaphorPalette: string[];
}

// ─── Foundation Modifiers (4 sets) ────────────────────────────────

export const FOUNDATION_MODIFIERS: FoundationModifier[] = [
  {
    id: 'chaos',
    socialStructure: 'Fluid hierarchy; power earned and contested',
    accountability: 'Personal honor; challenges determine status',
    behavioralKeywords: ['shifting', 'storm-born', 'untamed', 'rebellious', 'spontaneous', 'defiant'],
    metaphorSeeds: ['the unbroken wave', 'fire that chooses its own path', 'a flock without a shepherd'],
  },
  {
    id: 'order',
    socialStructure: 'Rigid social roles; birth and function determine rank',
    accountability: 'Institutional justice; laws bind all equally',
    behavioralKeywords: ['stone-set', 'the old way', 'by the book', 'codified', 'precedent', 'unshakable'],
    metaphorSeeds: ['pillars that hold the sky', 'chains that bind willingly', 'the measured step'],
  },
  {
    id: 'light',
    socialStructure: 'Communal decision-making; transparency above all',
    accountability: 'Shame-based; transgressions exposed to witness',
    behavioralKeywords: ['sun-sworn', 'nothing hidden', 'in the open', 'transparent', 'witnessed', 'luminous'],
    metaphorSeeds: ['the eye that never blinks', 'roots growing toward the sun', 'glass that shows all'],
  },
  {
    id: 'darkness',
    socialStructure: 'Initiation circles; knowledge granted by degrees',
    accountability: 'Secret tribunals; justice hidden from the profane',
    behavioralKeywords: ['veiled', 'shadow-kept', 'the inner circle', 'whispered', 'oath-bound', 'occult'],
    metaphorSeeds: ['the door behind the door', 'ink that drinks the light', 'a web only the spider sees'],
  },
];

// ─── Creation Sphere Modifiers (8 sets) ────────────────────────────

export const CREATION_SPHERE_MODIFIERS: CreationSphereModifier[] = [
  {
    sphere: 'force',
    behavioralColoring: 'Martial honor codes; valor defines worth',
    behavioralKeywords: ['battle-tested', 'honor-bound', 'challenge-seeking', 'glory-hungry', 'scar-proud', 'war-wise'],
    materialVocabulary: ['heavy metals', 'war trophies', 'scarred wood', 'battle standards', 'tempered steel', 'trophy racks'],
    formativeTraitSeeds: ['weapon_mastery', 'battle_tactics'],
    behavioralTraitSeeds: ['challenge_compulsion', 'glory_seeking'],
  },
  {
    sphere: 'matter',
    behavioralColoring: 'Craft guilds and material pride; mastery through practice',
    behavioralKeywords: ['meticulous', 'craft-sworn', 'material-wise', 'precision-loving', 'guild-bound', 'maker-minded'],
    materialVocabulary: ['stone', 'worked metal', 'carved bone', 'kiln-fired clay', 'hammered copper', 'polished granite'],
    formativeTraitSeeds: ['craft_expertise', 'material_lore'],
    behavioralTraitSeeds: ['material_obsession', 'craft_pride'],
  },
  {
    sphere: 'energy',
    behavioralColoring: 'Kinetic culture; movement and momentum valorized',
    behavioralKeywords: ['restless', 'motion-hungry', 'thrill-seeking', 'momentum-chasing', 'flicker-swift', 'surge-timed'],
    materialVocabulary: ['light materials', 'flame imagery', 'woven silk', 'molten glass', 'ember-cloth', 'lantern oil'],
    formativeTraitSeeds: ['endurance_training', 'energy_channeling'],
    behavioralTraitSeeds: ['restlessness', 'thrill_seeking'],
  },
  {
    sphere: 'life',
    behavioralColoring: 'Fertility rites; birth and death cycles revered',
    behavioralKeywords: ['fecund', 'cycle-wise', 'seed-blessed', 'birth-honoring', 'death-welcoming', 'nature-kinned'],
    materialVocabulary: ['living materials', 'garden cities', 'woven vines', 'pressed flowers', 'seed-pearl', 'root-wood'],
    formativeTraitSeeds: ['herbalism', 'midwifery'],
    behavioralTraitSeeds: ['birth_death_reverence', 'nature_communion'],
  },
  {
    sphere: 'mind',
    behavioralColoring: 'Scholarly castes; knowledge as currency and power',
    behavioralKeywords: ['knowledge-hungry', 'debate-loving', 'logic-bound', 'lore-hoarding', 'cipher-wise', 'truth-seeking'],
    materialVocabulary: ['paper', 'ink', 'glass', 'quartz lenses', 'bound vellum', 'clockwork'],
    formativeTraitSeeds: ['literacy', 'analytical_thinking'],
    behavioralTraitSeeds: ['knowledge_hoarding', 'debate_obsession'],
  },
  {
    sphere: 'spirit',
    behavioralColoring: 'Meditation and communion; the unseen made sacred',
    behavioralKeywords: ['spirit-touched', 'communion-seeking', 'ritual-bound', 'sensitive-keen', 'trance-wise', 'veil-thin'],
    materialVocabulary: ['incense', 'crystal', 'prayer beads', 'spirit masks', 'blessed water', 'dream-catchers'],
    formativeTraitSeeds: ['meditation', 'spirit_sight'],
    behavioralTraitSeeds: ['spirit_sensitivity', 'ritual_devotion'],
  },
  {
    sphere: 'time',
    behavioralColoring: 'Elder councils and prophecy; patience as philosophy',
    behavioralKeywords: ['patient-fatalistic', 'ancestor-honoring', 'cycle-aware', 'prophecy-minded', 'season-wise', 'elder-led'],
    materialVocabulary: ['astronomical instruments', 'calendars', 'hourglasses', 'sundials', 'aged wood', 'patina bronze'],
    formativeTraitSeeds: ['calendar_mastery', 'prophecy_reading'],
    behavioralTraitSeeds: ['patience_fatalism', 'ancestor_reverence'],
  },
  {
    sphere: 'entropy',
    behavioralColoring: 'Death cults and acceptance; decay as transformation',
    behavioralKeywords: ['death-accepting', 'dissolution-fascinated', 'rot-wise', 'grave-keeper', 'ending-honored', 'void-touched'],
    materialVocabulary: ['bone', 'ash', 'corroded metal', 'grave dust', 'tarnished silver', 'cracked obsidian'],
    formativeTraitSeeds: ['decay_reading', 'corpse_preparation'],
    behavioralTraitSeeds: ['death_acceptance', 'dissolution_fascination'],
  },
];

// ─── Biome Modifiers (22 sets) ────────────────────────────────────

export const BIOME_MODIFIERS: BiomeModifier[] = [
  // Water group (4)
  {
    terrain: 'ocean',
    survivalTraitKeywords: ['seafaring', 'navigation', 'storm-reading', 'saltwater-wise', 'depth-sensing'],
    materialCulture: ['driftwood', 'shell', 'coral', 'sail-cloth', 'whale-bone', 'kelp-rope'],
    metaphorPalette: ['the deep that swallows', 'tides that remember', 'the horizon\'s promise'],
  },
  {
    terrain: 'coastal_shallows',
    survivalTraitKeywords: ['tide-walking', 'net-weaving', 'pearl-diving', 'shallow-reading', 'beach-knowing'],
    materialCulture: ['woven nets', 'beach glass', 'salt-cured leather', 'tidal stone', 'crab shell'],
    metaphorPalette: ['the shore between worlds', 'sand that shifts beneath', 'pools that hold secrets'],
  },
  {
    terrain: 'lake',
    survivalTraitKeywords: ['fishing', 'reed-craft', 'still-water reading', 'freshwater-wise', 'reflection-sense'],
    materialCulture: ['reed-woven baskets', 'lake clay', 'freshwater pearl', 'birch bark', 'lily pads'],
    metaphorPalette: ['the mirror that thinks', 'depths that hold their breath', 'calm that deceives'],
  },
  {
    terrain: 'river',
    survivalTraitKeywords: ['current-reading', 'bridge-building', 'flood-sense', 'water-craft', 'rapids-knowing'],
    materialCulture: ['river stone', 'otter pelt', 'rush matting', 'ferry ropes', 'water-smoothed wood'],
    metaphorPalette: ['the path that carves itself', 'the current\'s memory', 'water finding its level'],
  },

  // Lowlands (4)
  {
    terrain: 'grassland',
    survivalTraitKeywords: ['herding', 'weather-sense', 'endurance riding', 'grass-reading', 'horizon-sight'],
    materialCulture: ['horsehair', 'dried grass', 'leather', 'bone needles', 'felt'],
    metaphorPalette: ['the sea of grass', 'winds that carry whispers', 'the horizon\'s edge'],
  },
  {
    terrain: 'farmland',
    survivalTraitKeywords: ['crop-tending', 'seasonal wisdom', 'irrigation', 'soil-lore', 'harvest-timing'],
    materialCulture: ['grain sheaves', 'woven straw', 'clay pots', 'iron plows', 'sun-dried brick'],
    metaphorPalette: ['the seed that remembers', 'furrows like written lines', 'the patient harvest'],
  },
  {
    terrain: 'savanna',
    survivalTraitKeywords: ['tracking', 'fire-management', 'drought-endurance', 'herd-reading', 'dry-craft'],
    materialCulture: ['thorned wood', 'sun-bleached bone', 'woven grass', 'ochre pigment', 'acacia bark'],
    metaphorPalette: ['the golden silence', 'heat that shimmers like memory', 'the watering hole\'s truce'],
  },
  {
    terrain: 'steppe',
    survivalTraitKeywords: ['mounted archery', 'wind-reading', 'nomadic packing', 'vast-sense', 'swift-riding'],
    materialCulture: ['yurt felt', 'horsehide', 'fermented milk vessels', 'wind-chimes', 'sinew cord'],
    metaphorPalette: ['the wind\'s verdict', 'dust that buries empires', 'the endless ride'],
  },

  // Forest (4)
  {
    terrain: 'deciduous_forest',
    survivalTraitKeywords: ['foraging', 'tree-climbing', 'seasonal tracking', 'canopy-reading', 'leaf-craft'],
    materialCulture: ['hardwood', 'acorn flour', 'maple syrup', 'bark cloth', 'mushroom leather'],
    metaphorPalette: ['the canopy\'s counsel', 'roots that whisper', 'leaves that fall like pages'],
  },
  {
    terrain: 'dense_forest',
    survivalTraitKeywords: ['shadow-stalking', 'vine-weaving', 'canopy navigation', 'darkness-comfort', 'thick-wise'],
    materialCulture: ['dark heartwood', 'moss', 'spider silk', 'phosphor fungi', 'hanging vine'],
    metaphorPalette: ['the green darkness', 'paths that close behind you', 'the forest\'s memory'],
  },
  {
    terrain: 'taiga',
    survivalTraitKeywords: ['cold-endurance', 'trapping', 'resin-craft', 'winter-wise', 'silence-hearing'],
    materialCulture: ['pine resin', 'fur pelts', 'frozen amber', 'snowshoe frames', 'smoked fish'],
    metaphorPalette: ['the endless white', 'trees bent by patience', 'silence that cracks like ice'],
  },
  {
    terrain: 'jungle',
    survivalTraitKeywords: ['poison-lore', 'vine-swinging', 'humidity survival', 'rot-wisdom', 'tangle-navigation'],
    materialCulture: ['bright feathers', 'rubber sap', 'orchid dye', 'bamboo', 'poison-dart frogs'],
    metaphorPalette: ['the green cathedral', 'vines that strangle slowly', 'heat that breathes'],
  },

  // Wet (2)
  {
    terrain: 'swamp',
    survivalTraitKeywords: ['mud-navigation', 'toxin-tolerance', 'stilted-building', 'bog-craft', 'stilt-wise'],
    materialCulture: ['peat', 'cypress knee', 'alligator hide', 'bog iron', 'cattail fiber'],
    metaphorPalette: ['the ground that drinks', 'mist that thinks', 'waters that remember the dead'],
  },
  {
    terrain: 'bog',
    survivalTraitKeywords: ['preservation-lore', 'sphagnum-craft', 'sinking-avoidance', 'peat-wise', 'time-keeper'],
    materialCulture: ['bog butter', 'preserved wood', 'peat bricks', 'cranberry dye', 'sphagnum bandages'],
    metaphorPalette: ['the earth that swallows whole', 'time trapped in amber', 'the false path'],
  },

  // Elevated (4)
  {
    terrain: 'hills',
    survivalTraitKeywords: ['terracing', 'mining', 'wind-harnessing', 'slope-wise', 'ridge-craft'],
    materialCulture: ['slate', 'copper ore', 'heather', 'limestone', 'hill marble'],
    metaphorPalette: ['the fold that hides', 'the vantage that reveals', 'the climb without a summit'],
  },
  {
    terrain: 'mountains',
    survivalTraitKeywords: ['cliff-dwelling', 'altitude endurance', 'avalanche-reading', 'peak-craft', 'high-sight'],
    materialCulture: ['granite', 'ice crystal', 'mountain goat hide', 'obsidian', 'eagle feather'],
    metaphorPalette: ['the peak\'s judgment', 'stone that touches sky', 'the path that tests'],
  },
  {
    terrain: 'plateau',
    survivalTraitKeywords: ['wind-farming', 'long-sight', 'mesa-building', 'flat-wide sense', 'horizon-reading'],
    materialCulture: ['sandstone', 'wind-carved stone', 'turquoise', 'sun-baked adobe', 'dried sage'],
    metaphorPalette: ['the flat that sees forever', 'winds that never rest', 'the table of the gods'],
  },
  {
    terrain: 'badlands',
    survivalTraitKeywords: ['canyon-navigation', 'flash-flood sense', 'mineral-finding', 'maze-craft', 'layer-reading'],
    materialCulture: ['layered sediment', 'fossil bone', 'red clay', 'sulfur crystal', 'wind-sculpted stone'],
    metaphorPalette: ['the earth\'s broken teeth', 'colors bleeding from stone', 'the maze that shifts'],
  },

  // Extreme (4)
  {
    terrain: 'desert',
    survivalTraitKeywords: ['water-finding', 'heat-endurance', 'sand-navigation', 'dune-craft', 'oasis-sense'],
    materialCulture: ['sandstone', 'cactus fiber', 'bleached bone', 'copper wire', 'indigo dye'],
    metaphorPalette: ['the forge that shapes the worthy', 'sand that buries all', 'oasis mirage'],
  },
  {
    terrain: 'tundra',
    survivalTraitKeywords: ['cold-survival', 'ice-building', 'aurora-reading', 'white-sense', 'permafrost-wise'],
    materialCulture: ['walrus ivory', 'caribou hide', 'permafrost clay', 'lichen dye', 'ice-crystal'],
    metaphorPalette: ['the frozen breath', 'the white silence', 'light that dances without warmth'],
  },
  {
    terrain: 'glacier',
    survivalTraitKeywords: ['crevasse-sensing', 'ice-carving', 'glacial patience', 'flow-reading', 'freeze-craft'],
    materialCulture: ['compacted ice', 'moraine gravel', 'glacial silt', 'frozen quartz', 'permafrost bone'],
    metaphorPalette: ['the river of ice', 'the grinding patience', 'cold that preserves'],
  },
  {
    terrain: 'volcanic',
    survivalTraitKeywords: ['heat-resistance', 'lava-reading', 'obsidian-craft', 'ash-navigation', 'magma-sense'],
    materialCulture: ['basalt', 'volcanic glass', 'pumice', 'sulfur', 'obsidian blades'],
    metaphorPalette: ['the mountain\'s anger', 'fire that builds as it destroys', 'the forge of the earth'],
  },
];

// ─── Lookup Functions ─────────────────────────────────────────────

/**
 * Retrieve a foundation modifier by id.
 * @param id The foundation modifier id (chaos, order, light, or darkness)
 * @returns The foundation modifier, or undefined if not found
 */
export function getFoundationModifier(id: string): FoundationModifier | undefined {
  return FOUNDATION_MODIFIERS.find(m => m.id === id);
}

/**
 * Retrieve a creation sphere modifier by sphere name.
 * @param sphere The sphere name
 * @returns The creation sphere modifier, or undefined if not found
 */
export function getCreationSphereModifier(sphere: SphereName): CreationSphereModifier | undefined {
  return CREATION_SPHERE_MODIFIERS.find(m => m.sphere === sphere);
}

/**
 * Retrieve a biome modifier by terrain type.
 * @param terrain The terrain type
 * @returns The biome modifier, or undefined if not found
 */
export function getBiomeModifier(terrain: TerrainType): BiomeModifier | undefined {
  return BIOME_MODIFIERS.find(m => m.terrain === terrain);
}
