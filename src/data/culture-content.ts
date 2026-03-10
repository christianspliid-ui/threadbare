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

import type { SphereName, TerrainType, ReachDomain } from '../types/index';

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

// ─── Cultural Prose Palette Interface ──────────────────────────────

export interface CulturalProsePalette {
  adjectives: string[];
  verbs: string[];
  rhythms: string[];
  greetings: string[];
  oaths: string[];
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
    terrain: 'temperate_forest',
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
    terrain: 'boreal_forest',
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
    terrain: 'marsh',
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
    terrain: 'volcano',
    survivalTraitKeywords: ['heat-resistance', 'lava-reading', 'obsidian-craft', 'ash-navigation', 'magma-sense'],
    materialCulture: ['basalt', 'volcanic glass', 'pumice', 'sulfur', 'obsidian blades'],
    metaphorPalette: ['the mountain\'s anger', 'fire that builds as it destroys', 'the forge of the earth'],
  },
];

// ─── Insider Beat Interface ───────────────────────────────────────

export interface InsiderBeat {
  id: string;
  name: string;
  requiredCultureTags: string[];  // sphere/biome tags that must be in the culture
  minStrength: number;            // 0.3–1.0 — minimum cultural strength to trigger
  trigger: string;                // human-readable trigger condition
  proseSeeds: string[];           // template sentences for narrative generation
  archetypeAffinity?: string[];   // archetype ids that amplify this beat
}

// ─── Insider Beats (~25 entries) ──────────────────────────────────

export const INSIDER_BEATS: InsiderBeat[] = [
  {
    id: 'blood_oath_challenge',
    name: 'Blood Oath Challenge',
    requiredCultureTags: ['force'],
    minStrength: 0.5,
    trigger: 'Two warriors with a grudge meet',
    proseSeeds: [
      'Steel sang as {actor} drew blade against {target}, invoking the ancient rite of blood oath.',
      'The challenge echoed across the settlement — no force culture refuses a blood oath.',
    ],
  },
  {
    id: 'trial_by_element',
    name: 'Trial by Element',
    requiredCultureTags: ['energy'],
    minStrength: 0.6,
    trigger: 'An accused must prove innocence',
    proseSeeds: [
      'The flames would judge — {actor} stepped into the trial circle as the culture demanded.',
      '{actor} faced the elemental encounter, flames licking at their resolve.',
    ],
  },
  {
    id: 'ancestor_communion',
    name: 'Ancestor Communion',
    requiredCultureTags: ['spirit'],
    minStrength: 0.5,
    trigger: 'A major decision faces the community',
    proseSeeds: [
      'In the sacred grove, {actor} knelt to hear the whispers of those who came before.',
      'The ancestor spirits stirred as {actor} sought their counsel on the matter.',
    ],
  },
  {
    id: 'name_day_tournament',
    name: 'Name-Day Tournament',
    requiredCultureTags: ['force', 'order'],
    minStrength: 0.4,
    trigger: 'A young warrior comes of age',
    proseSeeds: [
      'The arena filled for {actor}\'s name-day — in this culture, adulthood is earned in combat.',
      'Weapons were blessed and the crowd gathered for {actor}\'s proving.',
    ],
  },
  {
    id: 'shadow_market',
    name: 'Shadow Market',
    requiredCultureTags: ['darkness'],
    minStrength: 0.6,
    trigger: 'Trade of forbidden goods',
    proseSeeds: [
      'In the veiled bazaar, {actor} traded in things that light-sworn cultures would burn.',
      'The shadow market opened its doors — here, secrets are the truest currency.',
    ],
  },
  {
    id: 'dream_walk',
    name: 'Dream Walk',
    requiredCultureTags: ['spirit', 'mind'],
    minStrength: 0.8,
    trigger: 'A spiritual crisis demands deep communion',
    proseSeeds: [
      'The dream-walkers carried {actor} beyond the veil, into the realm of pure thought.',
      '{actor} drank the vision-brew and fell into the deep dream the culture reveres.',
    ],
  },
  {
    id: 'cultural_reclamation',
    name: 'Cultural Reclamation',
    requiredCultureTags: [],
    minStrength: 0.4,
    trigger: 'A conquered people resist assimilation',
    proseSeeds: [
      'Whispered in the old tongue, the {culture} ways stirred again in {actor}.',
      'The old songs rose unbidden — {actor} remembered what the conquerors tried to erase.',
    ],
  },
  {
    id: 'harvest_blessing',
    name: 'Harvest Blessing',
    requiredCultureTags: ['life'],
    minStrength: 0.4,
    trigger: 'The growing season begins or ends',
    proseSeeds: [
      'The life-singers of the {culture} raised their voices as the first seeds touched earth.',
      '{actor} led the harvest blessing, green light dancing on the offerings.',
    ],
  },
  {
    id: 'forge_dedication',
    name: 'Forge Dedication',
    requiredCultureTags: ['matter', 'force'],
    minStrength: 0.5,
    trigger: 'A new weapon or tool of significance is created',
    proseSeeds: [
      'The forge-master spoke the old words as {actor}\'s blade took shape in the sacred fire.',
      'In this culture, a weapon\'s birth is attended like a child\'s.',
    ],
  },
  {
    id: 'truth_duel',
    name: 'Truth Duel',
    requiredCultureTags: ['light', 'order'],
    minStrength: 0.6,
    trigger: 'Two conflicting accounts must be resolved',
    proseSeeds: [
      'Under the open sky, {actor} and {target} spoke their truths — the witnesses would judge.',
      'The truth duel began: in this culture, lies cannot survive the sun\'s gaze.',
    ],
  },
  {
    id: 'mercy_plea',
    name: 'Mercy Plea',
    requiredCultureTags: ['life', 'heart'],
    minStrength: 0.5,
    trigger: 'A condemned person appeals for life',
    proseSeeds: [
      '{actor} knelt before the council, invoking the life-bond that their culture holds sacred.',
      'The mercy plea silenced the crowd — in this culture, to refuse it carries heavy shame.',
    ],
  },
  {
    id: 'craft_competition',
    name: 'Craft Competition',
    requiredCultureTags: ['matter'],
    minStrength: 0.4,
    trigger: 'Artisans vie for prestige',
    proseSeeds: [
      'Hammers rang and chisels sang as {actor} entered the craft trials of the {culture}.',
      'Only the finest work survives the judges\' eye — craft is worship here.',
    ],
  },
  {
    id: 'storytelling_circle',
    name: 'Storytelling Circle',
    requiredCultureTags: ['time', 'spirit'],
    minStrength: 0.4,
    trigger: 'Community gathers to share and preserve knowledge',
    proseSeeds: [
      'The fire burned low as {actor} took the storyteller\'s seat, voice carrying ancient patterns.',
      'In the circle, every word is sacred — the {culture} remembers through its speakers.',
    ],
  },
  {
    id: 'initiation_encounter',
    name: 'Initiation Encounter',
    requiredCultureTags: ['darkness', 'force'],
    minStrength: 0.7,
    trigger: 'An outsider seeks acceptance into the culture',
    proseSeeds: [
      '{actor} entered the darkened chamber, knowing only those transformed emerge as true {culture}.',
      'The initiation stripped away the old self — what emerged bore the {culture}\'s mark.',
    ],
  },
  {
    id: 'star_reading',
    name: 'Star Reading',
    requiredCultureTags: ['time', 'star'],
    minStrength: 0.5,
    trigger: 'A celestial event demands interpretation',
    proseSeeds: [
      'The astrologers gathered as the stars aligned — {actor} read the heavens for the {culture}\'s fate.',
      'In this culture, the stars write destiny. {actor} was charged with reading.',
    ],
  },
  {
    id: 'death_celebration',
    name: 'Death Celebration',
    requiredCultureTags: ['entropy'],
    minStrength: 0.5,
    trigger: 'Someone significant dies',
    proseSeeds: [
      'The {culture} did not mourn — they celebrated the beautiful return to nothing.',
      '{actor} led the dissolution rites, finding beauty in the ending.',
    ],
  },
  {
    id: 'territorial_marking',
    name: 'Territorial Marking',
    requiredCultureTags: ['force', 'matter'],
    minStrength: 0.5,
    trigger: 'A new area is claimed',
    proseSeeds: [
      '{actor} planted the {culture}\'s banner with ancient words of claiming.',
      'The boundary stones were set with craft and ceremony — this land speaks {culture} now.',
    ],
  },
  {
    id: 'spirit_cleansing',
    name: 'Spirit Cleansing',
    requiredCultureTags: ['spirit', 'life'],
    minStrength: 0.6,
    trigger: 'A place or person is tainted',
    proseSeeds: [
      'The purification began at dawn — {actor} wielded sacred herbs against the corruption.',
      'The {culture}\'s healers worked in concert, driving impurity from the afflicted.',
    ],
  },
  {
    id: 'oath_of_silence',
    name: 'Oath of Silence',
    requiredCultureTags: ['darkness', 'mind'],
    minStrength: 0.7,
    trigger: 'Secret knowledge must be protected',
    proseSeeds: [
      '{actor} swore upon the inner circle\'s seal — what is known shall not be spoken.',
      'The oath bound tongue and thought alike — the {culture} guards its mysteries with silence.',
    ],
  },
  {
    id: 'water_blessing',
    name: 'Water Blessing',
    requiredCultureTags: ['life'],
    minStrength: 0.4,
    trigger: 'Water source is honored or a journey begins',
    proseSeeds: [
      'Sacred water touched {actor}\'s brow — the {culture} begins all ventures at the water\'s edge.',
      'The blessing of the deep was spoken, and the waters accepted {actor}\'s offering.',
    ],
  },
  {
    id: 'flame_dance',
    name: 'Flame Dance',
    requiredCultureTags: ['energy'],
    minStrength: 0.5,
    trigger: 'Celebration of fire and passion',
    proseSeeds: [
      'The dancers whirled through the flames, untouched — the {culture}\'s fire answered its own.',
      '{actor} joined the flame dance, moving with the {culture}\'s fierce joy.',
    ],
  },
  {
    id: 'bone_reading',
    name: 'Bone Reading',
    requiredCultureTags: ['entropy', 'time'],
    minStrength: 0.6,
    trigger: 'Divination through remains',
    proseSeeds: [
      'The bone-caster scattered ancient fragments and read the patterns of decay.',
      '{actor} studied the fallen bones — in this {culture}, the dead still speak through their remains.',
    ],
  },
  {
    id: 'mountain_pilgrimage',
    name: 'Mountain Pilgrimage',
    requiredCultureTags: ['spirit'],
    minStrength: 0.5,
    trigger: 'A spiritual journey to high places',
    proseSeeds: [
      '{actor} began the ascent the {culture} considers sacred — the mountain tests all pilgrims.',
      'Higher and higher, until the world fell away and only spirit remained.',
    ],
  },
  {
    id: 'song_of_binding',
    name: 'Song of Binding',
    requiredCultureTags: ['mind', 'heart'],
    minStrength: 0.5,
    trigger: 'Two people are joined in partnership',
    proseSeeds: [
      'The binding song wove {actor} and {target} together in the {culture}\'s oldest melody.',
      'Voices joined in harmony — the {culture} seals bonds with music that echoes in the soul.',
    ],
  },
  {
    id: 'ritual_exile',
    name: 'Ritual of Exile',
    requiredCultureTags: ['order', 'darkness'],
    minStrength: 0.7,
    trigger: 'Someone is cast out from the community',
    proseSeeds: [
      'The exile words were spoken and {actor}\'s name was struck from the {culture}\'s memory.',
      'Cast out beyond the boundary stones, {actor} ceased to exist in the eyes of the {culture}.',
    ],
  },
];

// ─── Sub-Location Template Interface ──────────────────────────────

export interface SubLocationTemplate {
  id: string;
  name: string;
  biomes: TerrainType[];
  sphereAffinity: SphereName;
  flavorText: string;
  grantedByTags: string[];
  culturalVariantDescriptors: string[];
}

// ─── Sub-Location Templates (27 entries) ─────────────────────────

export const SUB_LOCATION_TEMPLATES: SubLocationTemplate[] = [
  {
    id: 'bazaar',
    name: 'Bazaar',
    biomes: ['grassland', 'farmland', 'savanna', 'steppe', 'hills', 'plateau'],
    sphereAffinity: 'energy',
    flavorText: 'A bustling marketplace where thread-thin connections remain between scattered peoples. Crumbling stalls and weathered merchant tables recall wealthier days.',
    grantedByTags: ['gold', 'trade'],
    culturalVariantDescriptors: ['silk-draped stalls', 'spice-heavy arcade', 'copper-lamp market'],
  },
  {
    id: 'shrine',
    name: 'Shrine',
    biomes: ['temperate_forest', 'dense_forest', 'jungle', 'boreal_forest', 'tundra'],
    sphereAffinity: 'spirit',
    flavorText: 'A small sacred site where hidden magic lingers. Stone altars wear moss like memory, and the air tastes of incense from ages past.',
    grantedByTags: ['spirit', 'veil'],
    culturalVariantDescriptors: ['incense-clouded altar', 'crystal-adorned sanctuary', 'spirit-carved grotto'],
  },
  {
    id: 'arena',
    name: 'Arena',
    biomes: ['grassland', 'savanna', 'plateau', 'badlands'],
    sphereAffinity: 'force',
    flavorText: 'A cracked and dust-choked proving ground. Blood stains fade but never fully disappear from the packed earth.',
    grantedByTags: ['force', 'iron'],
    culturalVariantDescriptors: ['blood-stained pit', 'honor ring', 'bone-flagged coliseum'],
  },
  {
    id: 'library',
    name: 'Library',
    biomes: ['hills', 'mountains', 'plateau', 'forested_hills'],
    sphereAffinity: 'mind',
    flavorText: 'A repository of fragile scrolls and cracking vellum. Knowledge bleeds from margins as water damage spreads through forgotten chambers.',
    grantedByTags: ['mind', 'eye'],
    culturalVariantDescriptors: ['scroll-tower archive', 'crystal-indexed repository', 'ink-stained scriptorium'],
  },
  {
    id: 'forge',
    name: 'Forge',
    biomes: ['mountains', 'volcano', 'badlands', 'broken_lands'],
    sphereAffinity: 'matter',
    flavorText: 'A diminished smithy where ancient fires burn low. Rust-flecked tools rest beside half-finished work, abandoned when skilled hands moved on.',
    grantedByTags: ['matter', 'stone'],
    culturalVariantDescriptors: ['rune-marked smithy', 'crystal furnace', 'ancestral anvil hall'],
  },
  {
    id: 'temple',
    name: 'Temple',
    biomes: ['hills', 'mountains', 'plateau', 'temperate_forest', 'boreal_forest'],
    sphereAffinity: 'spirit',
    flavorText: 'A grand place of worship now tended by few. Stone columns offer shelter to ghosts of ceremony, and silence echoes louder than any hymn.',
    grantedByTags: ['spirit', 'heart'],
    culturalVariantDescriptors: ['star-domed cathedral', 'root-woven sanctuary', 'bone-arch cathedral'],
  },
  {
    id: 'guild_hall',
    name: 'Guild Hall',
    biomes: ['grassland', 'hills', 'plateau', 'temperate_forest', 'forested_hills'],
    sphereAffinity: 'matter',
    flavorText: 'A craftsguild stronghold where skill once conferred status. Now its benches hold dust instead of artisans, and guild secrets guard only emptiness.',
    grantedByTags: ['matter', 'gold'],
    culturalVariantDescriptors: ['craft-bannered lodge', 'copper-sealed chamber', 'master\'s gallery'],
  },
  {
    id: 'watchtower',
    name: 'Watchtower',
    biomes: ['hills', 'mountains', 'plateau', 'grassland', 'savanna', 'badlands'],
    sphereAffinity: 'force',
    flavorText: 'A tower built to pierce the sky and scan the lands below. Its watch has grown distant and weary; few things warrant its gaze anymore.',
    grantedByTags: ['force', 'star'],
    culturalVariantDescriptors: ['eagle-perch spire', 'flame-signal tower', 'far-sight pinnacle'],
  },
  {
    id: 'garden',
    name: 'Garden',
    biomes: ['grassland', 'farmland', 'temperate_forest', 'jungle', 'swamp', 'marsh'],
    sphereAffinity: 'life',
    flavorText: 'A cultivated plot struggling against wildness. Starving vegetables compete with weeds, and the carefully planted has given way to the feral.',
    grantedByTags: ['life', 'heart'],
    culturalVariantDescriptors: ['moon-bloom terrace', 'herb-spiral sanctuary', 'living-wall courtyard'],
  },
  {
    id: 'tomb',
    name: 'Tomb',
    biomes: ['hills', 'mountains', 'badlands', 'broken_lands', 'desert'],
    sphereAffinity: 'entropy',
    flavorText: 'A burial chamber where the honored dead rest in failing remembrance. Grave goods turn to dust, and the names carved in stone grow unreadable.',
    grantedByTags: ['entropy', 'veil'],
    culturalVariantDescriptors: ['echo-carved crypt', 'bone-lattice mausoleum', 'silence-sealed barrow'],
  },
  {
    id: 'observatory',
    name: 'Observatory',
    biomes: ['mountains', 'plateau', 'hills', 'grassland', 'desert', 'tundra'],
    sphereAffinity: 'time',
    flavorText: 'A high place built to study the turning heavens. Instruments rust into silence, but the stars remain indifferent to all that falls below.',
    grantedByTags: ['time', 'star'],
    culturalVariantDescriptors: ['star-map dome', 'celestial wheel chamber', 'moon-dial platform'],
  },
  {
    id: 'barracks',
    name: 'Barracks',
    biomes: ['grassland', 'hills', 'plateau', 'savanna', 'steppe'],
    sphereAffinity: 'force',
    flavorText: 'Soldier\'s quarters now empty of purpose. Weapon racks gather splinters, and the beds hold only memories of those who once slept here.',
    grantedByTags: ['force', 'iron'],
    culturalVariantDescriptors: ['trophy-hung dormitory', 'war-drum hall', 'weapon-rack longhouse'],
  },
  {
    id: 'market_square',
    name: 'Market Square',
    biomes: ['grassland', 'savanna', 'steppe', 'hills', 'plateau'],
    sphereAffinity: 'energy',
    flavorText: 'A central gathering place worn thin by seasons and diminishing crowds. Merchants\' stones lie bare, and the bustle is memory instead of commerce.',
    grantedByTags: ['gold', 'heart'],
    culturalVariantDescriptors: ['festival-ready plaza', 'barter-stone courtyard', 'lamp-lit commons'],
  },
  {
    id: 'council_chamber',
    name: 'Council Chamber',
    biomes: ['hills', 'mountains', 'plateau', 'grassland', 'temperate_forest'],
    sphereAffinity: 'mind',
    flavorText: 'A hall where councils once convened with authority. Empty thrones face an empty benches, and the decisions made here fade from consequence.',
    grantedByTags: ['mind', 'order'],
    culturalVariantDescriptors: ['truth-stone hall', 'ancestor-carved rotunda', 'judgment seat chamber'],
  },
  {
    id: 'ritual_ground',
    name: 'Ritual Ground',
    biomes: ['grassland', 'savanna', 'steppe', 'temperate_forest', 'jungle', 'swamp'],
    sphereAffinity: 'spirit',
    flavorText: 'An open place scarred by ceremonies, where magic once answered the call of gathered believers. The circles fade, but something lingers.',
    grantedByTags: ['spirit', 'entropy'],
    culturalVariantDescriptors: ['blood-circle clearing', 'spirit-door meadow', 'bone-dust amphitheater'],
  },
  {
    id: 'archive',
    name: 'Archive',
    biomes: ['mountains', 'hills', 'badlands', 'broken_lands', 'plateau'],
    sphereAffinity: 'mind',
    flavorText: 'Deep vaults carved into stone to preserve what matters most. But time devours what stone cannot protect, and the records crumble in darkness.',
    grantedByTags: ['mind', 'time'],
    culturalVariantDescriptors: ['memory-crystal vault', 'clay-tablet labyrinth', 'moth-proof sanctum'],
  },
  {
    id: 'harbor',
    name: 'Harbor',
    biomes: ['ocean', 'coastal_shallows', 'lake'],
    sphereAffinity: 'energy',
    flavorText: 'A waterfront where trade once flowed like tides. Docks splinter and rot, and the ships have gone to gray in harbor or to depths below.',
    grantedByTags: ['ocean'],
    culturalVariantDescriptors: ['tide-gate wharf', 'shell-crusted dock', 'storm-sheltered anchorage'],
  },
  {
    id: 'underground_passage',
    name: 'Underground Passage',
    biomes: ['mountains', 'hills', 'badlands', 'broken_lands', 'glacier'],
    sphereAffinity: 'entropy',
    flavorText: 'Hidden tunnels beneath the earth where secrets once moved unseen. Darkness presses close, and the ways grow uncertain with time\'s erosion.',
    grantedByTags: ['darkness', 'shadow'],
    culturalVariantDescriptors: ['whisper-tunnel network', 'shadow-mapped labyrinth', 'secret-sealed undercroft'],
  },
  {
    id: 'salt_dock',
    name: 'Salt Dock',
    biomes: ['coastal_shallows', 'lake', 'swamp', 'marsh'],
    sphereAffinity: 'matter',
    flavorText: 'A weathered pier thick with encrusted salt, where fishing communities clung to life from shallow waters. The nets lie coiled but empty.',
    grantedByTags: ['matter', 'gold'],
    culturalVariantDescriptors: ['brine-stained wharf', 'salt-caked moorings', 'corroded fishing lodge'],
  },
  {
    id: 'standing_stones',
    name: 'Standing Stones',
    biomes: ['grassland', 'savanna', 'steppe', 'plateau', 'badlands'],
    sphereAffinity: 'time',
    flavorText: 'Ancient monoliths marking something lost or binding something broken. Wind-carved and lichen-worn, they stand as monuments to power that no longer answers.',
    grantedByTags: ['time', 'veil'],
    culturalVariantDescriptors: ['moss-draped megaliths', 'weathered runestones', 'spiral-carved pillars'],
  },
  {
    id: 'breeding_ponds',
    name: 'Breeding Ponds',
    biomes: ['swamp', 'marsh', 'lake', 'jungle', 'grassland'],
    sphereAffinity: 'life',
    flavorText: 'Murky waters where life bred in profusion. The waters still teem, but the hatchery buildings crumble, and the caretakers no longer come.',
    grantedByTags: ['life', 'matter'],
    culturalVariantDescriptors: ['algae-thick pools', 'crane-haunted marshland', 'dike-bound wetland'],
  },
  {
    id: 'glass_works',
    name: 'Glass Works',
    biomes: ['desert', 'volcano', 'badlands', 'broken_lands'],
    sphereAffinity: 'matter',
    flavorText: 'A workshop where raw sand became art through heat and will. Furnaces cool and crack, and finished work lies abandoned on shelves gathering dust.',
    grantedByTags: ['matter', 'energy'],
    culturalVariantDescriptors: ['kiln-ash courtyard', 'sand-swept studio', 'furnace-scarred hall'],
  },
  {
    id: 'cold_springs',
    name: 'Cold Springs',
    biomes: ['tundra', 'glacier', 'mountains', 'boreal_forest'],
    sphereAffinity: 'spirit',
    flavorText: 'Waters that run pure and bitter cold, where seekers once came for spiritual cleansing. The pools remain, but the believers have moved on.',
    grantedByTags: ['spirit', 'mind'],
    culturalVariantDescriptors: ['frost-rimmed baths', 'mist-veiled pools', 'ice-carved grottos'],
  },
  {
    id: 'burnt_grove',
    name: 'Burnt Grove',
    biomes: ['temperate_forest', 'dense_forest', 'boreal_forest', 'forested_hills'],
    sphereAffinity: 'entropy',
    flavorText: 'A forest consumed by ancient fire, where blackened trunks stand like tombstones. New growth struggles through ash, a slow resurrection unwanted.',
    grantedByTags: ['entropy', 'life'],
    culturalVariantDescriptors: ['charred timber stand', 'ash-bed saplings', 'smoke-scarred clearing'],
  },
  {
    id: 'rope_bridge',
    name: 'Rope Bridge',
    biomes: ['mountains', 'hills', 'jungle', 'forested_hills', 'badlands'],
    sphereAffinity: 'energy',
    flavorText: 'A crossing hung high across chasm or gorge, woven from fiber grown fragile with age. It sways in wind that no longer carries merchants or refugees.',
    grantedByTags: ['energy', 'force'],
    culturalVariantDescriptors: ['fiber-woven span', 'cliff-locked causeway', 'gorge-web connector'],
  },
  {
    id: 'mill_ruins',
    name: 'Mill Ruins',
    biomes: ['river', 'grassland', 'hills', 'temperate_forest', 'farmland'],
    sphereAffinity: 'matter',
    flavorText: 'A grinding house once powered by water\'s tireless force. Wheels have seized, blades rest, and the grain that fed thousands no longer flows here.',
    grantedByTags: ['matter', 'energy'],
    culturalVariantDescriptors: ['gear-crusted foundation', 'waterwheel skeleton', 'stone-grinding chamber'],
  },
  {
    id: 'fish_trap',
    name: 'Fish Trap',
    biomes: ['river', 'lake', 'coastal_shallows', 'swamp', 'marsh'],
    sphereAffinity: 'life',
    flavorText: 'A weir or enclosure for catching fish, built where waters narrowed or pooled. The structures stand, but the fish pass through unmolested now.',
    grantedByTags: ['life', 'gold'],
    culturalVariantDescriptors: ['woven-stake fence', 'stonework weir', 'trap-pool enclosure'],
  },
];

// Biome coverage map (for reference): Ensure all terrain types have at least 2-3 template options
// - ocean (3): harbor
// - coastal_shallows (2): harbor, salt_dock
// - lake (2): harbor, salt_dock
// - river (1): mill_ruins
// - grassland (14): bazaar, arena, watchtower, barracks, market_square, garden, ritual_ground, council_chamber, standing_stones, breeding_ponds
// - farmland (2): bazaar, mill_ruins
// - savanna (6): bazaar, arena, watchtower, barracks, market_square, ritual_ground
// - steppe (6): bazaar, barracks, market_square, standing_stones, ritual_ground
// - temperate_forest (8): shrine, library, temple, guild_hall, council_chamber, burnt_grove, cold_springs, mill_ruins
// - dense_forest (2): shrine, burnt_grove
// - boreal_forest (4): shrine, temple, cold_springs, burnt_grove
// - jungle (4): shrine, garden, ritual_ground, rope_bridge
// - swamp (4): garden, ritual_ground, salt_dock, breeding_ponds
// - marsh (2): salt_dock, breeding_ponds
// - hills (15): library, forge, temple, guild_hall, watchtower, council_chamber, archive, garden, observation, barracks, standing_stones, rope_bridge, mill_ruins, cold_springs
// - mountains (13): library, forge, temple, watchtower, observation, archive, cold_springs, rope_bridge, underground_passage, glacier
// - plateau (10): bazaar, arena, library, watchtower, guild_hall, council_chamber, observation, standing_stones
// - badlands (8): arena, forge, tomb, archive, glass_works, underground_passage, rope_bridge
// - forested_hills (5): library, guild_hall, cold_springs, council_chamber, rope_bridge
// - desert (3): tomb, observation, glass_works
// - tundra (4): shrine, observation, cold_springs
// - glacier (3): underground_passage, cold_springs
// - volcano (2): forge, glass_works
// - broken_lands (6): forge, tomb, archive, glass_works, underground_passage
// - great_home_trees: (0) — Note: Added as gap; consider adding in next pass

// ─── Artifact Lore Pattern Interface ───────────────────────────────

export interface ArtifactLorePattern {
  id: string;
  template: string;  // must contain {culture} placeholder
  toneCategory: 'reverent' | 'martial' | 'mystical' | 'practical' | 'ominous';
}

// ─── Artifact Lore Patterns (6 entries) ───────────────────────────

export const ARTIFACT_LORE_PATTERNS: ArtifactLorePattern[] = [
  {
    id: 'reverent_origin',
    template: 'Crafted by the first artisans of the {culture}, blessed by hands that knew the old ways',
    toneCategory: 'reverent',
  },
  {
    id: 'martial_conquest',
    template: 'Won in battle when the {culture} stood against the tide and refused to break',
    toneCategory: 'martial',
  },
  {
    id: 'mystical_creation',
    template: 'Born in the dreaming hours when the {culture}\'s seers walked between worlds',
    toneCategory: 'mystical',
  },
  {
    id: 'practical_innovation',
    template: 'Devised by {culture} necessity, when survival demanded invention over tradition',
    toneCategory: 'practical',
  },
  {
    id: 'ominous_inheritance',
    template: 'Passed down through {culture} generations, each holder marked by its dark purpose',
    toneCategory: 'ominous',
  },
  {
    id: 'sacred_sacrifice',
    template: 'Forged from the sacrifice of a {culture} hero who gave everything for their people',
    toneCategory: 'reverent',
  },
];

// ─── Culture Name Fragments ─────────────────────────────────────

export const CULTURE_NAME_FRAGMENTS: {
  foundation: Record<string, string[]>;
  sphere: Record<string, string[]>;
  biome: Record<string, string[]>;
  patterns: string[];
} = {
  foundation: {
    chaos: ['Storm-Born', 'Untamed', 'Wild', 'Shifting', 'Unchained'],
    order: ['Stone-Set', 'Codex', 'Lawbound', 'Pillar', 'Measured'],
    light: ['Sun-Sworn', 'Open', 'Radiant', 'Witness', 'Bright'],
    darkness: ['Veiled', 'Shadow-Kept', 'Hidden', 'Inner', 'Masked'],
  },
  sphere: {
    force: ['Iron', 'War', 'Blade', 'Hammer', 'Shield'],
    matter: ['Stone', 'Craft', 'Forge', 'Earth', 'Anvil'],
    energy: ['Spark', 'Storm', 'Lightning', 'Flame', 'Current'],
    life: ['Root', 'Bloom', 'Seed', 'Grove', 'Green'],
    mind: ['Thought', 'Lore', 'Cipher', 'Ink', 'Scroll'],
    spirit: ['Ghost', 'Dream', 'Whisper', 'Veil', 'Prayer'],
    time: ['Hour', 'Tide', 'Dust', 'Ruin', 'Memory'],
    entropy: ['Ash', 'Hollow', 'Fade', 'Bone', 'Rust'],
  },
  biome: {
    desert: ['Sands', 'Dunes', 'Wastes', 'Oasis'],
    mountains: ['Peaks', 'Heights', 'Crags', 'Summit'],
    hills: ['Ridges', 'Slopes', 'Hollows', 'Downs'],
    grassland: ['Plains', 'Meadows', 'Fields', 'Steppe'],
    savanna: ['Savanna', 'Dry Fields', 'Sun-Lands', 'Flatlands'],
    steppe: ['Steppe', 'Windlands', 'Dry Reaches', 'Barrens'],
    temperate_forest: ['Groves', 'Canopy', 'Glades', 'Timberlands'],
    dense_forest: ['Deepwood', 'Thickets', 'Dark Timber', 'Old Growth'],
    boreal_forest: ['Pinelands', 'Frost-Wood', 'Northern Trees', 'Cold Forest'],
    jungle: ['Tangles', 'Green Depths', 'Rain Canopy', 'Overgrowth'],
    swamp: ['Mires', 'Bog-Lands', 'Still Waters', 'Fenlands'],
    marsh: ['Marshes', 'Peatlands', 'Dark Pools', 'Fen'],
    tundra: ['Frost', 'Ice Fields', 'Cold Reach', 'Permafrost'],
    glacier: ['Glacier', 'Ice Wall', 'Frozen Reach', 'Rime'],
    volcano: ['Cinder', 'Ember Fields', 'Ash Slopes', 'Crater'],
    broken_lands: ['Shatter', 'Ruin-Fields', 'Scarlands', 'Breach'],
    plateau: ['Mesa', 'High Table', 'Flatrock', 'Skyfield'],
    badlands: ['Badlands', 'Gulch', 'Dry Canyons', 'Cracked Earth'],
    farmland: ['Furrows', 'Tilth', 'Harvest-Lands', 'Homesteads'],
    forested_hills: ['Green Heights', 'Wooded Ridges', 'Forest Slopes', 'Dappled Hills'],
  },
  patterns: [
    'The {foundation} {sphere} of the {biome}',
    'The {sphere} {biome}',
    'Children of the {foundation} {biome}',
    '{foundation} {sphere}',
    'The {foundation} {biome}',
    'Keepers of the {sphere} {biome}',
  ],
};

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

/**
 * Retrieve a formative trait seed by ID.
 * @param id The trait seed ID
 * @returns The formative trait seed, or undefined if not found
 */
export function getFormativeTraitSeed(id: string): FormativeTraitSeed | undefined {
  return FORMATIVE_TRAIT_SEEDS.find(s => s.id === id);
}

/**
 * Retrieve a behavioral trait seed by ID.
 * @param id The trait seed ID
 * @returns The behavioral trait seed, or undefined if not found
 */
export function getBehavioralTraitSeed(id: string): BehavioralTraitSeed | undefined {
  return BEHAVIORAL_TRAIT_SEEDS.find(s => s.id === id);
}

/**
 * Retrieve an insider beat by ID.
 * @param id The beat ID
 * @returns The insider beat, or undefined if not found
 */
export function getInsiderBeat(id: string): InsiderBeat | undefined {
  return INSIDER_BEATS.find(b => b.id === id);
}

/**
 * Retrieve a sub-location template by ID.
 * @param id The template ID
 * @returns The sub-location template, or undefined if not found
 */
export function getSubLocationTemplate(id: string): SubLocationTemplate | undefined {
  return SUB_LOCATION_TEMPLATES.find(t => t.id === id);
}

/**
 * Filter insider beats by required culture tags.
 * Returns all beats that match at least one of the provided tags.
 * @param tags Culture tag identifiers
 * @returns Array of matching insider beats
 */
export function getBeatsForCultureTags(tags: string[]): InsiderBeat[] {
  return INSIDER_BEATS.filter(b =>
    b.requiredCultureTags.some(t => tags.includes(t))
  );
}

/**
 * Filter trait seeds by source tags.
 * Returns both formative and behavioral trait seeds that match at least one of the provided tags.
 * @param tags Source tag identifiers
 * @returns Object containing arrays of formative and behavioral trait seeds
 */
export function getTraitSeedsForTags(tags: string[]): {
  formative: FormativeTraitSeed[];
  behavioral: BehavioralTraitSeed[];
} {
  return {
    formative: FORMATIVE_TRAIT_SEEDS.filter(s =>
      s.sourceTags.some(t => tags.includes(t))
    ),
    behavioral: BEHAVIORAL_TRAIT_SEEDS.filter(s =>
      s.sourceTags.some(t => tags.includes(t))
    ),
  };
}

// ─── Trait Seed Interfaces ────────────────────────────────────────

/**
 * Formative traits are permanent innate cultural skills granted by sphere/biome combinations.
 * They represent foundational competencies that define cultural identity.
 */
export interface FormativeTraitSeed {
  id: string;
  name: string;
  description: string;
  sourceTags: string[];  // Which spheres/biomes grant this trait
  domainContributions: Partial<Record<ReachDomain, number>>;
  tags: string[];
}

/**
 * Cultural strength range for behavioral traits.
 * Fanatical > Strong > Fading > Silent (strongest to weakest expression)
 */
export type CulturalStrengthRange = 'fanatical' | 'strong' | 'fading' | 'silent';

/**
 * Behavioral traits scale with cultural strength. Same trait expresses differently
 * depending on how strongly the culture embodies that sphere/foundation.
 */
export interface BehavioralTraitSeed {
  id: string;
  name: string;
  description: string;
  sourceTags: string[];
  strengthThresholds: Partial<Record<CulturalStrengthRange, string>>;
  domainContributions: Partial<Record<ReachDomain, number>>;
  tags: string[];
}

// ─── Formative Trait Seeds (35 entries) ────────────────────────────

export const FORMATIVE_TRAIT_SEEDS: FormativeTraitSeed[] = [
  // Sphere-based (16)
  {
    id: 'weapon_mastery',
    name: 'Weapon Mastery',
    description: 'Innate understanding of arms and their use',
    sourceTags: ['force'],
    domainContributions: { iron: 2, flesh: 1 },
    tags: ['combat', 'martial'],
  },
  {
    id: 'battle_tactics',
    name: 'Battle Tactics',
    description: 'Instinctive grasp of battlefield formations and strategy',
    sourceTags: ['force'],
    domainContributions: { iron: 2, eye: 1 },
    tags: ['combat', 'strategy'],
  },
  {
    id: 'craft_expertise',
    name: 'Craft Expertise',
    description: 'Deep skill in shaping raw materials into finished works',
    sourceTags: ['matter'],
    domainContributions: { stone: 2, gold: 1 },
    tags: ['craft', 'production'],
  },
  {
    id: 'material_lore',
    name: 'Material Lore',
    description: 'Knowledge of stones, metals, and their hidden properties',
    sourceTags: ['matter'],
    domainContributions: { eye: 2, stone: 1 },
    tags: ['knowledge', 'craft'],
  },
  {
    id: 'endurance_training',
    name: 'Endurance Training',
    description: 'Bodies hardened through relentless physical culture',
    sourceTags: ['energy'],
    domainContributions: { flesh: 2, iron: 1 },
    tags: ['physical', 'endurance'],
  },
  {
    id: 'energy_channeling',
    name: 'Energy Channeling',
    description: 'Intuitive ability to direct and focus vital energy',
    sourceTags: ['energy'],
    domainContributions: { veil: 2, flesh: 1 },
    tags: ['magical', 'physical'],
  },
  {
    id: 'herbalism',
    name: 'Herbalism',
    description: 'Knowledge of plants and their healing properties',
    sourceTags: ['life'],
    domainContributions: { flesh: 2, eye: 1 },
    tags: ['healing', 'nature'],
  },
  {
    id: 'midwifery',
    name: 'Midwifery',
    description: 'Sacred knowledge of birth and the arrival of new life',
    sourceTags: ['life'],
    domainContributions: { heart: 2, flesh: 1 },
    tags: ['healing', 'social'],
  },
  {
    id: 'literacy',
    name: 'Literacy',
    description: 'Widespread ability to read and record knowledge',
    sourceTags: ['mind'],
    domainContributions: { eye: 2, heart: 1 },
    tags: ['knowledge', 'communication'],
  },
  {
    id: 'analytical_thinking',
    name: 'Analytical Thinking',
    description: 'Trained capacity for logical deduction and reasoning',
    sourceTags: ['mind'],
    domainContributions: { eye: 2, veil: 1 },
    tags: ['knowledge', 'strategy'],
  },
  {
    id: 'meditation',
    name: 'Meditation',
    description: 'Practiced stillness and inner focus in spiritual work',
    sourceTags: ['spirit'],
    domainContributions: { veil: 2, heart: 1 },
    tags: ['spiritual', 'mental'],
  },
  {
    id: 'spirit_sight',
    name: 'Spirit Sight',
    description: 'Sensitivity to the unseen world and its currents',
    sourceTags: ['spirit'],
    domainContributions: { veil: 2, eye: 1 },
    tags: ['spiritual', 'perception'],
  },
  {
    id: 'calendar_mastery',
    name: 'Calendar Mastery',
    description: 'Deep understanding of celestial cycles and their meanings',
    sourceTags: ['time'],
    domainContributions: { star: 2, eye: 1 },
    tags: ['knowledge', 'temporal'],
  },
  {
    id: 'prophecy_reading',
    name: 'Prophecy Reading',
    description: 'Ability to interpret omens, signs, and portents',
    sourceTags: ['time'],
    domainContributions: { star: 2, veil: 1 },
    tags: ['spiritual', 'temporal'],
  },
  {
    id: 'decay_reading',
    name: 'Decay Reading',
    description: 'Reading the age and history of things by their deterioration',
    sourceTags: ['entropy'],
    domainContributions: { eye: 2, veil: 1 },
    tags: ['knowledge', 'entropy'],
  },
  {
    id: 'corpse_preparation',
    name: 'Corpse Preparation',
    description: 'Sacred rituals for honoring and preserving the dead',
    sourceTags: ['entropy'],
    domainContributions: { heart: 1, veil: 2 },
    tags: ['spiritual', 'death'],
  },

  // Biome-based (19)
  {
    id: 'seafaring',
    name: 'Seafaring',
    description: 'Born to the open water; ship-craft and wave-reading',
    sourceTags: ['ocean'],
    domainContributions: { star: 2, iron: 1 },
    tags: ['navigation', 'maritime'],
  },
  {
    id: 'tidal_reading',
    name: 'Tidal Reading',
    description: 'Intuitive sense of water patterns and moon-pull',
    sourceTags: ['coastal_shallows', 'lake'],
    domainContributions: { star: 1, eye: 1 },
    tags: ['navigation', 'temporal'],
  },
  {
    id: 'net_craft',
    name: 'Net Craft',
    description: 'Skill in weaving and deploying fishing and hunting nets',
    sourceTags: ['coastal_shallows', 'river'],
    domainContributions: { gold: 1, stone: 1 },
    tags: ['craft', 'production'],
  },
  {
    id: 'mounted_riding',
    name: 'Mounted Riding',
    description: 'One with the horse; intuitive horsemanship',
    sourceTags: ['grassland', 'steppe'],
    domainContributions: { iron: 1, star: 1 },
    tags: ['combat', 'travel'],
  },
  {
    id: 'crop_wisdom',
    name: 'Crop Wisdom',
    description: 'Generational knowledge of soil, seed, and season',
    sourceTags: ['farmland'],
    domainContributions: { eye: 1, stone: 1 },
    tags: ['knowledge', 'production'],
  },
  {
    id: 'fire_management',
    name: 'Fire Management',
    description: 'Controlled use of wildfire for land management',
    sourceTags: ['savanna'],
    domainContributions: { iron: 1, eye: 1 },
    tags: ['survival', 'craft'],
  },
  {
    id: 'foraging',
    name: 'Foraging',
    description: 'Finding sustenance in wild places; plant and fungi lore',
    sourceTags: ['temperate_forest', 'jungle'],
    domainContributions: { eye: 1, flesh: 1 },
    tags: ['survival', 'knowledge'],
  },
  {
    id: 'shadow_stalking',
    name: 'Shadow Stalking',
    description: 'Moving unseen through dense growth and darkness',
    sourceTags: ['dense_forest'],
    domainContributions: { shadow: 2, iron: 1 },
    tags: ['stealth', 'survival'],
  },
  {
    id: 'cold_endurance',
    name: 'Cold Endurance',
    description: 'Natural resistance to bitter cold and icy conditions',
    sourceTags: ['boreal_forest', 'tundra', 'glacier'],
    domainContributions: { flesh: 2, iron: 1 },
    tags: ['physical', 'survival'],
  },
  {
    id: 'poison_lore',
    name: 'Poison Lore',
    description: 'Knowledge of venoms, toxins, and their antidotes',
    sourceTags: ['jungle', 'swamp'],
    domainContributions: { eye: 2, shadow: 1 },
    tags: ['knowledge', 'survival'],
  },
  {
    id: 'mud_navigation',
    name: 'Mud Navigation',
    description: 'Moving safely through treacherous wetlands and mire',
    sourceTags: ['swamp', 'marsh'],
    domainContributions: { star: 1, flesh: 1 },
    tags: ['navigation', 'survival'],
  },
  {
    id: 'terracing',
    name: 'Terracing',
    description: 'Engineering hillside agriculture and water management',
    sourceTags: ['hills'],
    domainContributions: { stone: 2, eye: 1 },
    tags: ['craft', 'production'],
  },
  {
    id: 'cliff_dwelling',
    name: 'Cliff Dwelling',
    description: 'Building secure homes in vertical rock faces',
    sourceTags: ['mountains'],
    domainContributions: { stone: 2, star: 1 },
    tags: ['craft', 'survival'],
  },
  {
    id: 'wind_reading',
    name: 'Wind Reading',
    description: 'Predicting weather and conditions from wind patterns',
    sourceTags: ['plateau', 'steppe'],
    domainContributions: { star: 1, eye: 1 },
    tags: ['knowledge', 'navigation'],
  },
  {
    id: 'canyon_navigation',
    name: 'Canyon Navigation',
    description: 'Pathfinding through labyrinthine ravines and canyons',
    sourceTags: ['badlands'],
    domainContributions: { star: 2, eye: 1 },
    tags: ['navigation', 'survival'],
  },
  {
    id: 'water_finding',
    name: 'Water Finding',
    description: 'Divining water sources in arid and hostile lands',
    sourceTags: ['desert'],
    domainContributions: { star: 2, eye: 1 },
    tags: ['survival', 'knowledge'],
  },
  {
    id: 'ice_craft',
    name: 'Ice Craft',
    description: 'Building and carving with frozen water and glacial ice',
    sourceTags: ['glacier', 'tundra'],
    domainContributions: { stone: 2, gold: 1 },
    tags: ['craft', 'survival'],
  },
  {
    id: 'lava_reading',
    name: 'Lava Reading',
    description: 'Predicting eruptions and finding safe volcanic paths',
    sourceTags: ['volcano'],
    domainContributions: { eye: 2, star: 1 },
    tags: ['knowledge', 'survival'],
  },
  {
    id: 'desert_navigation',
    name: 'Desert Navigation',
    description: 'Finding paths across featureless sand and dunes',
    sourceTags: ['desert'],
    domainContributions: { star: 2, eye: 1 },
    tags: ['navigation', 'survival'],
  },
];

// ─── Behavioral Trait Seeds (45 entries) ───────────────────────────

export const BEHAVIORAL_TRAIT_SEEDS: BehavioralTraitSeed[] = [
  // Sphere-based (16)
  {
    id: 'challenge_compulsion',
    name: 'Challenge Compulsion',
    description: 'Compulsion to meet disputes with physical challenge',
    sourceTags: ['force'],
    strengthThresholds: {
      fanatical: 'Compelled to duel to the death for any insult or slight',
      strong: 'Issues formal challenges to resolve disputes and disagreements',
      fading: 'Occasional urge to respond physically to insults',
    },
    domainContributions: { iron: 1, heart: -1 },
    tags: ['combat', 'honor'],
  },
  {
    id: 'glory_seeking',
    name: 'Glory Seeking',
    description: 'Pursuit of legendary deeds and lasting renown',
    sourceTags: ['force'],
    strengthThresholds: {
      fanatical: 'Suicidal bravery in pursuit of legendary deeds; certain death for immortal fame',
      strong: 'Actively seeks dangerous quests and challenges for personal renown',
      fading: 'Tells exaggerated stories of past exploits and adventures',
    },
    domainContributions: { iron: 1, heart: 1 },
    tags: ['honor', 'social'],
  },
  {
    id: 'material_obsession',
    name: 'Material Obsession',
    description: 'Obsession with the quality and perfection of crafted goods',
    sourceTags: ['matter'],
    strengthThresholds: {
      fanatical: 'Cannot rest while imperfect or flawed works exist; destroys inferior creations',
      strong: 'Judges all things by their craftsmanship quality; refuses inferior work',
      fading: 'Appreciates fine workmanship and well-made items',
    },
    domainContributions: { stone: 1, gold: 1 },
    tags: ['craft', 'perfectionism'],
  },
  {
    id: 'craft_pride',
    name: 'Craft Pride',
    description: 'Deep pride in the maker\'s art and personal mastery',
    sourceTags: ['matter'],
    strengthThresholds: {
      fanatical: 'Destroys inferior work rather than let it exist; rage at failed creation',
      strong: 'Refuses to use or display poorly made goods; demands excellence',
      fading: 'Slight preference for handcrafted items over mass production',
    },
    domainContributions: { stone: 1, heart: 1 },
    tags: ['craft', 'honor'],
  },
  {
    id: 'restlessness',
    name: 'Restlessness',
    description: 'Deep inability to remain still or in one place',
    sourceTags: ['energy'],
    strengthThresholds: {
      fanatical: 'Cannot remain in one place for more than a day; physical anguish at stillness',
      strong: 'Constant need for physical activity, motion, and change of scenery',
      fading: 'Fidgets during long meetings; prefers walking meetings',
    },
    domainContributions: { flesh: 1, iron: 1 },
    tags: ['physical', 'mental'],
  },
  {
    id: 'thrill_seeking',
    name: 'Thrill Seeking',
    description: 'Addiction to danger, risk, and the rush of survival',
    sourceTags: ['energy'],
    strengthThresholds: {
      fanatical: 'Seeks mortal danger purely for the rush; cannot feel alive without risk',
      strong: 'Volunteers for dangerous missions with enthusiasm and recklessness',
      fading: 'Enjoys competitive games and mild risks over safe alternatives',
    },
    domainContributions: { iron: 1, flesh: 1 },
    tags: ['risk', 'survival'],
  },
  {
    id: 'birth_death_reverence',
    name: 'Birth-Death Reverence',
    description: 'Sacred reverence for the thresholds of life and death',
    sourceTags: ['life'],
    strengthThresholds: {
      fanatical: 'Every birth and death is a sacred ceremony lasting days; life stops for ritual',
      strong: 'Formal rituals mark all major life transitions and passages',
      fading: 'Quiet prayers and respects observed for births and deaths',
    },
    domainContributions: { heart: 2, veil: 1 },
    tags: ['spiritual', 'social'],
  },
  {
    id: 'nature_communion',
    name: 'Nature Communion',
    description: 'Deep spiritual connection and kinship with the natural world',
    sourceTags: ['life'],
    strengthThresholds: {
      fanatical: 'Refuses to harm any living thing, even for food; starvation before killing',
      strong: 'Deep spiritual connection to local ecosystem; fasts rather than hunt',
      fading: 'General respect and care for the natural world',
    },
    domainContributions: { heart: 1, veil: 1 },
    tags: ['spiritual', 'nature'],
  },
  {
    id: 'knowledge_hoarding',
    name: 'Knowledge Hoarding',
    description: 'Obsessive collection and guarding of rare knowledge',
    sourceTags: ['mind'],
    strengthThresholds: {
      fanatical: 'Will kill, betray, or steal to protect secrets and rare texts from others',
      strong: 'Maintains extensive personal libraries and guards them jealously from access',
      fading: 'Keeps detailed notes and records of interesting facts and discoveries',
    },
    domainContributions: { eye: 1, shadow: 1 },
    tags: ['knowledge', 'control'],
  },
  {
    id: 'debate_obsession',
    name: 'Debate Obsession',
    description: 'Compulsion to resolve all matters through intellectual argument',
    sourceTags: ['mind'],
    strengthThresholds: {
      fanatical: 'Every conversation becomes an argument to win; ignores social cost',
      strong: 'Formal debate is the primary and only acceptable social activity',
      fading: 'Enjoys intellectual discussions and friendly competitive debate',
    },
    domainContributions: { eye: 1, heart: 1 },
    tags: ['intellectual', 'social'],
  },
  {
    id: 'spirit_sensitivity',
    name: 'Spirit Sensitivity',
    description: 'Heightened sensitivity to spiritual presences and currents',
    sourceTags: ['spirit'],
    strengthThresholds: {
      fanatical: 'Constantly communes with spirits, often lost in trance states; barely present',
      strong: 'Regular spiritual practices; sensitivity to omens and spirit messages',
      fading: 'Occasional sense of spiritual presences or guidance',
    },
    domainContributions: { veil: 2, heart: 1 },
    tags: ['spiritual', 'perception'],
  },
  {
    id: 'ritual_devotion',
    name: 'Ritual Devotion',
    description: 'Life structured around sacred rituals and observances',
    sourceTags: ['spirit'],
    strengthThresholds: {
      fanatical: 'Life is entirely structured around rituals; cannot function without them',
      strong: 'Daily rituals observed without fail; disruption causes distress',
      fading: 'Participates in major religious ceremonies and seasonal rituals',
    },
    domainContributions: { veil: 1, heart: 1 },
    tags: ['spiritual', 'discipline'],
  },
  {
    id: 'patience_fatalism',
    name: 'Patience-Fatalism',
    description: 'Belief that action cannot change fate; preference for waiting',
    sourceTags: ['time'],
    strengthThresholds: {
      fanatical: 'Refuses to act hastily even in emergencies; "what will be, will be" absolutist',
      strong: 'Plans everything in multi-generational timeframes; very patient strategists',
      fading: 'Tends to wait and observe before taking action',
    },
    domainContributions: { star: 1, eye: 1 },
    tags: ['temporal', 'philosophy'],
  },
  {
    id: 'ancestor_reverence',
    name: 'Ancestor Reverence',
    description: 'Deep reverence for lineage and ancestral guidance',
    sourceTags: ['time'],
    strengthThresholds: {
      fanatical: 'Consults ancestors before every decision; lives more for past than present',
      strong: 'Maintains ancestor shrines; follows their guidance as law',
      fading: 'Respects family history; follows major ancestral traditions',
    },
    domainContributions: { heart: 1, veil: 1 },
    tags: ['spiritual', 'social'],
  },
  {
    id: 'death_acceptance',
    name: 'Death Acceptance',
    description: 'Philosophical or spiritual acceptance of death and endings',
    sourceTags: ['entropy'],
    strengthThresholds: {
      fanatical: 'Embraces decay as sacred beauty; finds life repulsive and death liberating',
      strong: 'Comfortable with death and decay; no fear of endings',
      fading: 'Philosophical acceptance of mortality and natural decline',
    },
    domainContributions: { veil: 1, heart: 1 },
    tags: ['spiritual', 'philosophy'],
  },
  {
    id: 'dissolution_fascination',
    name: 'Dissolution Fascination',
    description: 'Fascination with decay, ruin, and transformation through breaking down',
    sourceTags: ['entropy'],
    strengthThresholds: {
      fanatical: 'Actively speeds decay and dissolution as religious duty; desecrates intact things',
      strong: 'Studies decay patterns; creates art from ruins and broken objects',
      fading: 'Finds beauty in abandoned places and slowly decaying structures',
    },
    domainContributions: { eye: 1, veil: 1 },
    tags: ['spiritual', 'artistic'],
  },

  // Foundation-based (10)
  {
    id: 'tribal_loyalty',
    name: 'Tribal Loyalty',
    description: 'Fierce personal bonds and loyalty to inner circle',
    sourceTags: ['chaos'],
    strengthThresholds: {
      fanatical: 'Will betray law, honor, and allies for tribe members; tribe above all else',
      strong: 'Strong preference for tribal members in all dealings',
      fading: 'Loyalty to family and close companions',
    },
    domainContributions: { heart: 1 },
    tags: ['social', 'loyalty'],
  },
  {
    id: 'rule_following',
    name: 'Rule Following',
    description: 'Adherence to codified law and established rules',
    sourceTags: ['order'],
    strengthThresholds: {
      fanatical: 'Cannot violate rules even if just outcome requires it; law above morality',
      strong: 'Rules and laws are binding; deviations are punished severely',
      fading: 'Generally follows rules and respects authority',
    },
    domainContributions: { stone: 1 },
    tags: ['discipline', 'social'],
  },
  {
    id: 'communal_shame',
    name: 'Communal Shame',
    description: 'Group accountability where all share the shame of any member\'s transgression',
    sourceTags: ['light'],
    strengthThresholds: {
      fanatical: 'Personal shame at any community member\'s actions; self-punishment for others\' sins',
      strong: 'Strong community accountability; public shaming for transgressions',
      fading: 'General social pressure for conformity and good behavior',
    },
    domainContributions: { heart: 1 },
    tags: ['social', 'accountability'],
  },
  {
    id: 'secret_keeping',
    name: 'Secret Keeping',
    description: 'Inner circle loyalty where secrets are sacred trusts',
    sourceTags: ['darkness'],
    strengthThresholds: {
      fanatical: 'Will die before revealing secrets; betrayal is death sentence',
      strong: 'Secrets are sacred; breaking silence is the ultimate crime',
      fading: 'Respects private knowledge; reluctant to share secrets',
    },
    domainContributions: { shadow: 1 },
    tags: ['loyalty', 'control'],
  },
  {
    id: 'hospitality_code',
    name: 'Hospitality Code',
    description: 'Guest rights are sacred; violent breach of hospitality is unforgivable',
    sourceTags: ['chaos', 'light'],
    strengthThresholds: {
      fanatical: 'Will defend guest with own life; guest\'s crimes become host\'s responsibility',
      strong: 'Guests are sacred; attacking them is ultimate violation',
      fading: 'Treats guests with respect and courtesy',
    },
    domainContributions: { heart: 1 },
    tags: ['social', 'honor'],
  },
  {
    id: 'rigid_etiquette',
    name: 'Rigid Etiquette',
    description: 'Elaborate and unforgiving social protocols and formality',
    sourceTags: ['order'],
    strengthThresholds: {
      fanatical: 'Elaborate multi-hour rituals required for any interaction; impatient with shortcut',
      strong: 'Strict protocols govern all social interaction; violations are grave insults',
      fading: 'Follows established social conventions and courtesies',
    },
    domainContributions: { stone: 1, gold: 1 },
    tags: ['social', 'discipline'],
  },
  {
    id: 'public_confession',
    name: 'Public Confession',
    description: 'Sins and transgressions are aired openly before community',
    sourceTags: ['light'],
    strengthThresholds: {
      fanatical: 'Regular mandatory public confessions of all private thoughts and failings',
      strong: 'Transgressions must be publicly confessed; hiding sins is worse than crime',
      fading: 'Prefers honest admission of mistakes over hiding them',
    },
    domainContributions: { heart: 1 },
    tags: ['social', 'accountability'],
  },
  {
    id: 'conspiracy_thinking',
    name: 'Conspiracy Thinking',
    description: 'Seeing hidden plots and enemies everywhere',
    sourceTags: ['darkness'],
    strengthThresholds: {
      fanatical: 'Paranoid; all events are orchestrated by hidden enemies',
      strong: 'Sees patterns and hidden meanings in ordinary events',
      fading: 'Suspicious of motives; cautious of official narratives',
    },
    domainContributions: { shadow: 1 },
    tags: ['philosophy', 'caution'],
  },
  {
    id: 'hierarchy_respect',
    name: 'Hierarchy Respect',
    description: 'Absolute deference to rank and established authority',
    sourceTags: ['order'],
    strengthThresholds: {
      fanatical: 'Cannot question superiors; disobedience is unthinkable',
      strong: 'Strict deference to rank; challenges to authority are insulting',
      fading: 'Respects chain of command and established authority',
    },
    domainContributions: { stone: 1, iron: 1 },
    tags: ['discipline', 'social'],
  },
  {
    id: 'oath_binding',
    name: 'Oath Binding',
    description: 'Sworn words are unbreakable; oath violations are death-worthy',
    sourceTags: ['darkness', 'chaos'],
    strengthThresholds: {
      fanatical: 'Oaths are absolute; breaking oath deserves execution',
      strong: 'Sworn words are binding law; violations carry severe penalties',
      fading: 'Takes promises seriously; oath-breaking is shameful',
    },
    domainContributions: { veil: 1, heart: 1 },
    tags: ['honor', 'loyalty'],
  },

  // Biome-based (19)
  {
    id: 'water_discipline',
    name: 'Water Discipline',
    description: 'Careful rationing and reverence for fresh water',
    sourceTags: ['desert', 'steppe'],
    strengthThresholds: {
      fanatical: 'Water waste is death-penalty crime; bathing is forbidden',
      strong: 'Strict water rationing; communal sources are sacred',
      fading: 'Aware of water scarcity; uses it carefully',
    },
    domainContributions: { star: 1 },
    tags: ['survival', 'discipline'],
  },
  {
    id: 'communal_warmth',
    name: 'Communal Warmth',
    description: 'Sharing body heat and shelter as survival necessity turned social norm',
    sourceTags: ['tundra', 'glacier', 'boreal_forest'],
    strengthThresholds: {
      fanatical: 'Sleeping alone is abandonment; forced physical intimacy is norm',
      strong: 'Sleeping close in groups is expected; personal space is unknown',
      fading: 'Comfortable with close physical proximity; minimal personal space',
    },
    domainContributions: { heart: 1, flesh: 1 },
    tags: ['social', 'survival'],
  },
  {
    id: 'seasonal_migration',
    name: 'Seasonal Migration',
    description: 'Nomadic following of herds, seasons, and resources',
    sourceTags: ['grassland', 'steppe', 'savanna'],
    strengthThresholds: {
      fanatical: 'Cannot settle; constant movement is psychological need',
      strong: 'Regular seasonal migrations are fundamental to identity',
      fading: 'Comfortable with periodic relocation and wandering',
    },
    domainContributions: { star: 1 },
    tags: ['travel', 'survival'],
  },
  {
    id: 'flood_preparedness',
    name: 'Flood Preparedness',
    description: 'Always ready for rising waters; elevating structures as second nature',
    sourceTags: ['river', 'swamp'],
    strengthThresholds: {
      fanatical: 'All buildings on stilts; flood-readiness is obsession',
      strong: 'Constant preparation for floods; all goods kept high',
      fading: 'Familiar with seasonal flooding; takes precautions',
    },
    domainContributions: { star: 1, stone: 1 },
    tags: ['survival', 'preparation'],
  },
  {
    id: 'canopy_reverence',
    name: 'Canopy Reverence',
    description: 'Trees are sacred; the canopy is divine shelter',
    sourceTags: ['temperate_forest', 'dense_forest', 'jungle'],
    strengthThresholds: {
      fanatical: 'Cannot harm trees without ritual; lives in canopy not ground',
      strong: 'Trees are sacred; their use is restricted to necessary harvest',
      fading: 'Deep respect for forests and forestry practices',
    },
    domainContributions: { veil: 1, heart: 1 },
    tags: ['spiritual', 'nature'],
  },
  {
    id: 'stone_worship',
    name: 'Stone Worship',
    description: 'Mountains and rock formations are divine',
    sourceTags: ['mountains', 'hills'],
    strengthThresholds: {
      fanatical: 'Mountains are gods; mining is blasphemy; pilgrimages to peaks',
      strong: 'Mountains are sacred; quarrying requires ritual and apology',
      fading: 'Respectful of mountain peaks; views them as sacred places',
    },
    domainContributions: { veil: 1, star: 1 },
    tags: ['spiritual', 'nature'],
  },
  {
    id: 'horizon_yearning',
    name: 'Horizon Yearning',
    description: 'Drawn to distant horizons and the lands beyond',
    sourceTags: ['ocean', 'grassland', 'plateau'],
    strengthThresholds: {
      fanatical: 'Cannot be satisfied with current lands; constant wanderlust',
      strong: 'Always planning the next journey; restless in one place',
      fading: 'Dream of travel; attracted to exploration and distant places',
    },
    domainContributions: { star: 1 },
    tags: ['travel', 'psychology'],
  },
  {
    id: 'volcanic_sacrifice',
    name: 'Volcanic Sacrifice',
    description: 'Ritualistic appeasement of volcanic powers',
    sourceTags: ['volcano'],
    strengthThresholds: {
      fanatical: 'Regular human sacrifices required to appease the mountain',
      strong: 'Ritual sacrifices and offerings to prevent volcanic wrath',
      fading: 'Offerings and prayers to volcanic spirits',
    },
    domainContributions: { veil: 1, iron: 1 },
    tags: ['spiritual', 'ritual'],
  },
  {
    id: 'bog_memory',
    name: 'Bog Memory',
    description: 'Belief that the swamp remembers and judges all actions',
    sourceTags: ['marsh', 'swamp'],
    strengthThresholds: {
      fanatical: 'The bog judges souls; cannot lie or hide in wetlands',
      strong: 'Bog is sentient; secrets confessed to bog cannot be kept',
      fading: 'Respectful of wetlands; wary of angering them',
    },
    domainContributions: { veil: 1, heart: 1 },
    tags: ['spiritual', 'nature'],
  },
  {
    id: 'ice_patience',
    name: 'Ice Patience',
    description: 'Glacial pace of decision-making; changes measured in generations',
    sourceTags: ['glacier', 'tundra'],
    strengthThresholds: {
      fanatical: 'Cannot make decisions faster than glaciers move; glacial time-sense',
      strong: 'Decisions take years; ancient precedent must be examined',
      fading: 'Patient and deliberate in decision-making',
    },
    domainContributions: { star: 1 },
    tags: ['temporal', 'philosophy'],
  },
  {
    id: 'fire_dance',
    name: 'Fire Dance',
    description: 'Fire as celebration and spiritual expression',
    sourceTags: ['savanna', 'volcano'],
    strengthThresholds: {
      fanatical: 'Compelled to dance in fire; pain is pleasure',
      strong: 'Major festivals center on fire rituals and communal dances',
      fading: 'Fire celebrations are important cultural events',
    },
    domainContributions: { iron: 1, heart: 1 },
    tags: ['spiritual', 'social'],
  },
  {
    id: 'salt_rituals',
    name: 'Salt Rituals',
    description: 'Salt as purifier and sacred cleansing substance',
    sourceTags: ['ocean', 'coastal_shallows'],
    strengthThresholds: {
      fanatical: 'Salt purifies all; excessive salt rituals dominate daily life',
      strong: 'Regular salt purification rituals for cleansing and protection',
      fading: 'Uses salt in cleansing rituals and protective charms',
    },
    domainContributions: { veil: 1, heart: 1 },
    tags: ['spiritual', 'ritual'],
  },
  {
    id: 'root_binding',
    name: 'Root Binding',
    description: 'Community is rooted like trees; deep and permanent bonds',
    sourceTags: ['dense_forest', 'jungle'],
    strengthThresholds: {
      fanatical: 'Cannot leave community; leaving is death to soul',
      strong: 'Community bonds are unbreakable; migration impossible',
      fading: 'Strong attachments to home and community',
    },
    domainContributions: { heart: 2 },
    tags: ['social', 'nature'],
  },
  {
    id: 'wind_worship',
    name: 'Wind Worship',
    description: 'Wind is divine messenger and force',
    sourceTags: ['plateau', 'steppe'],
    strengthThresholds: {
      fanatical: 'Cannot defy wind; act only when wind is favorable',
      strong: 'Wind patterns are divine guidance; directions follow wind',
      fading: 'Respectful of wind; listens to what wind carries',
    },
    domainContributions: { veil: 1, star: 1 },
    tags: ['spiritual', 'nature'],
  },
  {
    id: 'cave_dwelling_reverence',
    name: 'Cave Dwelling Reverence',
    description: 'Underground chambers are sacred; caves are doorways to divine',
    sourceTags: ['mountains', 'badlands'],
    strengthThresholds: {
      fanatical: 'Cannot live above ground; caves are the only true homes',
      strong: 'Sacred caves are temple-cities; underground is natural state',
      fading: 'Drawn to caves; feel safe and at home in underground',
    },
    domainContributions: { star: 1, veil: 1 },
    tags: ['spiritual', 'survival'],
  },
  {
    id: 'harvest_gratitude',
    name: 'Harvest Gratitude',
    description: 'First fruits are sacred offerings to spirits and community',
    sourceTags: ['farmland'],
    strengthThresholds: {
      fanatical: 'First harvest must be burned as offering; only secondary harvest eaten',
      strong: 'First fruits offerings are required; lavish seasonal rituals',
      fading: 'Grateful for harvest; offerings made at season\'s start',
    },
    domainContributions: { heart: 1, veil: 1 },
    tags: ['spiritual', 'ritual'],
  },
  {
    id: 'tidal_timing',
    name: 'Tidal Timing',
    description: 'All decisions follow water patterns and tidal movements',
    sourceTags: ['coastal_shallows', 'river'],
    strengthThresholds: {
      fanatical: 'Cannot act against tides; life completely ordered by water cycles',
      strong: 'Major decisions only during favorable tides',
      fading: 'Prefer to act in harmony with tidal and river patterns',
    },
    domainContributions: { star: 1 },
    tags: ['temporal', 'nature'],
  },
  {
    id: 'permafrost_burial',
    name: 'Permafrost Burial',
    description: 'The frozen dead are preserved forever; ice is sacred tomb',
    sourceTags: ['tundra', 'glacier'],
    strengthThresholds: {
      fanatical: 'Cannot allow dead to thaw; eternal preservation in ice is highest honor',
      strong: 'Dead are preserved in ice; thawing is desecration',
      fading: 'Respectful of ice-preserved ancestors',
    },
    domainContributions: { veil: 1, star: 1 },
    tags: ['spiritual', 'death'],
  },
  {
    id: 'sulfur_purification',
    name: 'Sulfur Purification',
    description: 'Volcanic minerals are cleansing and protective',
    sourceTags: ['volcano'],
    strengthThresholds: {
      fanatical: 'Sulfur baths are constant; burning sulfur as protective barrier around homes',
      strong: 'Sulfur is used in all protective rituals and cleansing ceremonies',
      fading: 'Sulfur used in cleansing rituals and healing',
    },
    domainContributions: { veil: 1, heart: 1 },
    tags: ['spiritual', 'ritual'],
  },
];

// ─── Cultural Prose Palettes (12 sphere voices) ───────────────────

export const CULTURAL_PROSE_PALETTES: Record<string, CulturalProsePalette> = {
  // ─── Foundation Spheres (4) ───────────────────────────────────────
  chaos: {
    adjectives: ['wild', 'untamed', 'roiling', 'defiant', 'turbulent', 'feral', 'reckless', 'unbound'],
    verbs: ['ruptures', 'shatters', 'surges', 'erupts', 'claws', 'tears', 'storms', 'devours'],
    rhythms: ['staccato bursts', 'jagged and breathless', 'a thunder that refuses stillness'],
    greetings: ['Storm-kin, let the walls crack between us', 'Breach-walker, the fixed ways hold no grip'],
    oaths: ['By the unending rebellion', 'Let the settled world shatter if it be so'],
  },

  order: {
    adjectives: ['measured', 'precise', 'steadfast', 'rigid', 'deliberate', 'exacting', 'unwavering', 'crystalline'],
    verbs: ['inscribes', 'arranges', 'constructs', 'mandates', 'aligns', 'anchors', 'codifies', 'binds'],
    rhythms: ['rolling like seasons in their turning', 'a march neither hastened nor delayed', 'the beat of the turning wheel'],
    greetings: ['Structured soul, let us speak in order', 'Ledger-keeper, all debts recorded find their due'],
    oaths: ['By the eternal architecture', 'Let the pattern hold unbroken'],
  },

  light: {
    adjectives: ['blazing', 'revealing', 'radiant', 'piercing', 'luminous', 'searing', 'glowing', 'incandescent'],
    verbs: ['illuminates', 'sears', 'exposes', 'burns', 'kindles', 'ignites', 'blazes', 'radiates'],
    rhythms: ['swift as dawn breaking over shadow', 'a clarion call that brokers no darkness', 'bright and relentless'],
    greetings: ['Bright-bearer, let nothing hide between us', 'Sun-touched, your truth casts no shadow'],
    oaths: ['By the revealing flame', 'Let all darkness flee before this witness'],
  },

  darkness: {
    adjectives: ['veiled', 'hidden', 'secret', 'shadowed', 'obscure', 'silent', 'shrouded', 'mysterious'],
    verbs: ['conceals', 'whispers', 'shrouds', 'hides', 'dissolves', 'masks', 'enfolds', 'swallows'],
    rhythms: ['soft as breath in shadow', 'a silence that speaks volumes', 'muffled and profound'],
    greetings: ['Shadow-sister, speak low that ears beyond cannot hear', 'Night-child, what secrets bind your heart'],
    oaths: ['By the keeping dark', 'Let none know this but the void'],
  },

  // ─── Creation Spheres (8) ─────────────────────────────────────────
  force: {
    adjectives: ['violent', 'mighty', 'crushing', 'relentless', 'fierce', 'brutal', 'dominant', 'wrathful'],
    verbs: ['smashes', 'drives', 'forces', 'shatters', 'overwhelms', 'dominates', 'strikes', 'compels'],
    rhythms: ['hammer-blow cadence', 'the clash of iron on iron', 'a fist closing with finality'],
    greetings: ['Strong-armed, let us test our mettle', 'Warrior-born, your grip shapes the world'],
    oaths: ['By the unquenchable force', 'Let my will break all that stands'],
  },

  matter: {
    adjectives: ['solid', 'grounded', 'heavy', 'enduring', 'substantial', 'dense', 'weighty', 'immutable'],
    verbs: ['settles', 'anchors', 'grounds', 'solidifies', 'compacts', 'weighs', 'stands', 'roots'],
    rhythms: ['steady as stone centuries old', 'the slow accumulation of years', 'a weight that cannot be moved'],
    greetings: ['Stone-hearted, we meet on solid ground', 'Earth-keeper, your roots run deep and sure'],
    oaths: ['By the undying stone', 'Let me be as unmoved as bedrock'],
  },

  energy: {
    adjectives: ['crackling', 'kinetic', 'volatile', 'vibrant', 'electric', 'pulsing', 'rapid', 'tremulous'],
    verbs: ['crackles', 'sparks', 'surges', 'trembles', 'vibrates', 'electrifies', 'propels', 'ignites'],
    rhythms: ['rapid and scintillating', 'a tremor that will not settle', 'the hum of constant motion'],
    greetings: ['Bright-sparking, let our power entwine', 'Force-dancer, feel the hum between us'],
    oaths: ['By the ceaseless spark', 'Let energy flow through my every breath'],
  },

  life: {
    adjectives: ['growing', 'verdant', 'vital', 'fertile', 'thriving', 'lush', 'bleeding', 'wild-bright'],
    verbs: ['grows', 'blooms', 'sprouts', 'breeds', 'nourishes', 'flourishes', 'multiplies', 'unfolds'],
    rhythms: ['the endless surge of spring', 'a pulse that quickens all it touches', 'the ache of becoming'],
    greetings: ['Life-giver, let our roots entangle', 'Green-keeper, what grows within your heart'],
    oaths: ['By the eternal flourish', 'Let me nurture what would otherwise perish'],
  },

  mind: {
    adjectives: ['sharp', 'calculating', 'keen', 'precise', 'lucid', 'cutting', 'brilliant', 'cold'],
    verbs: ['calculates', 'dissects', 'penetrates', 'reasons', 'perceives', 'untangles', 'sees', 'knows'],
    rhythms: ['quick as thought branching', 'the turning of gears in sequence', 'a clarity that cuts'],
    greetings: ['Sharp-minded, let us reason together', 'Thought-weaver, your cunning honors mine'],
    oaths: ['By the keenest edge', 'Let my wits outlast my body'],
  },

  spirit: {
    adjectives: ['ethereal', 'transcendent', 'whispering', 'luminous', 'profound', 'sacred', 'unknowable', 'sublime'],
    verbs: ['ascends', 'illuminates', 'transcends', 'whispers', 'communes', 'sanctifies', 'transforms', 'pervades'],
    rhythms: ['soft as prayer at dusk', 'the silence between breaths', 'a voice from beyond the veil'],
    greetings: ['Spirit-touched, let the sacred pass between us', 'Holy-child, your essence echoes mine'],
    oaths: ['By the deathless spirit', 'Let my essence endure when flesh has fallen'],
  },

  time: {
    adjectives: ['ancient', 'inevitable', 'cyclical', 'endless', 'worn', 'patient', 'relentless', 'consuming'],
    verbs: ['erodes', 'cycles', 'accumulates', 'transforms', 'repeats', 'consumes', 'wears', 'remembers'],
    rhythms: ['the turning of great wheels', 'a heartbeat older than mountains', 'the patient unfolding of ages'],
    greetings: ['Ancient-hearted, we are but moments in your span', 'Cycle-keeper, what patterns do you read'],
    oaths: ['By the turning wheel', 'Let my name echo through the ages'],
  },

  entropy: {
    adjectives: ['decaying', 'dissolving', 'final', 'silent', 'cold', 'empty', 'vast', 'inevitable'],
    verbs: ['dissolves', 'decays', 'dissipates', 'crumbles', 'fades', 'silences', 'empties', 'ceases'],
    rhythms: ['a slow unraveling toward silence', 'the gentle drift into nothingness', 'the last breath before stillness'],
    greetings: ['Void-speaker, at last we meet as equals', 'Ending-walker, what does dissolution teach'],
    oaths: ['By the final dissolution', 'Let all striving cease when the time comes'],
  },
};

// ─── Cultural Tension Event Templates ────────────────────────────

/**
 * Narrative templates for cultural tension events (4 types × 3 variants).
 * Used by narrative context builder to generate prose when cultural tension is detected.
 *
 * Placeholders: {actor}, {culture}, {location}, {adj}
 * Tone: dark, literary, Threadbare aesthetic — tension feels like slow-building pressure,
 * not sudden explosion. Threads breaking, fractures in the cultural fabric.
 */
export const CULTURAL_TENSION_TEMPLATES: Record<string, string[]> = {
  mismatch: [
    '{actor} carries the threads of {culture} in their heart, yet {location} wears different colors now. The fracture deepens with each breath.',
    'The shadow of belonging weighs heavy on {actor} — they are {adj} with a culture that {location} has turned from. The threads strain.',
    '{actor} remembers the old ways of {culture}, but {location} has broken those threads. They wear their displacement like cold stone.',
  ],

  conquest: [
    '{location} bears the scars of conquest — {culture} once flourished here, but new masters have woven their own threads over the bones of what was.',
    'The ancient roots of {culture} run deep beneath {location}, but fresh threads of domination wind through the soil. The old names are fading.',
    'A {adj} silence falls when {culture} is spoken in {location}. The conquest is complete, yet the threads of the conquered will not fully dissolve.',
  ],

  dual: [
    '{actor} is caught between two threads — {culture} pulls at them with equal strength, and the fracture runs through their every choice.',
    'Two cultures war quietly within {actor}. Neither yields to the other, and the tension threads tighter with each passing season.',
    '{actor} speaks in the voices of two {adj} peoples, and the strain of holding both is written in the lines of their face. The threads will not weave.',
  ],

  fanaticism: [
    '{actor} clings to {culture} with a grip that turns white-knuckled. Their fervor is a thread pulled so tight it begins to break. {location} watches with wary eyes.',
    'The devotion of {actor} to {culture} burns with an intensity that {adj} threatens everyone near it. They see heresy in every shadow.',
    '{actor} sees {culture} as the only truth worth clinging to, and their zealotry carves deep grooves through {location}. The threads are about to snap.',
  ],
};

