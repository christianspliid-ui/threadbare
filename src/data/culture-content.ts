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
      '{actor} faced the elemental ordeal, flames licking at their resolve.',
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
    id: 'initiation_ordeal',
    name: 'Initiation Ordeal',
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
  grantedByTags: string[];
  culturalVariantDescriptors: string[];
  description: string;
}

// ─── Sub-Location Templates (18 entries) ─────────────────────────

export const SUB_LOCATION_TEMPLATES: SubLocationTemplate[] = [
  {
    id: 'bazaar',
    name: 'Bazaar',
    grantedByTags: ['gold', 'trade'],
    culturalVariantDescriptors: ['silk-draped stalls', 'spice-heavy arcade', 'copper-lamp market'],
    description: 'A bustling marketplace reflecting cultural trade traditions',
  },
  {
    id: 'shrine',
    name: 'Shrine',
    grantedByTags: ['spirit', 'veil'],
    culturalVariantDescriptors: ['incense-clouded altar', 'crystal-adorned sanctuary', 'spirit-carved grotto'],
    description: 'A sacred space for spiritual observance',
  },
  {
    id: 'arena',
    name: 'Arena',
    grantedByTags: ['force', 'iron'],
    culturalVariantDescriptors: ['blood-stained pit', 'honor ring', 'bone-flagged coliseum'],
    description: 'A place of combat and proving',
  },
  {
    id: 'library',
    name: 'Library',
    grantedByTags: ['mind', 'eye'],
    culturalVariantDescriptors: ['scroll-tower archive', 'crystal-indexed repository', 'ink-stained scriptorium'],
    description: 'A repository of recorded knowledge',
  },
  {
    id: 'forge',
    name: 'Forge',
    grantedByTags: ['matter', 'stone'],
    culturalVariantDescriptors: ['rune-marked smithy', 'crystal furnace', 'ancestral anvil hall'],
    description: 'A workshop for shaping materials',
  },
  {
    id: 'temple',
    name: 'Temple',
    grantedByTags: ['spirit', 'heart'],
    culturalVariantDescriptors: ['star-domed cathedral', 'root-woven sanctuary', 'bone-arch cathedral'],
    description: 'A major place of worship',
  },
  {
    id: 'guild_hall',
    name: 'Guild Hall',
    grantedByTags: ['matter', 'gold'],
    culturalVariantDescriptors: ['craft-bannered lodge', 'copper-sealed chamber', 'master\'s gallery'],
    description: 'A gathering place for skilled artisans',
  },
  {
    id: 'watchtower',
    name: 'Watchtower',
    grantedByTags: ['force', 'star'],
    culturalVariantDescriptors: ['eagle-perch spire', 'flame-signal tower', 'far-sight pinnacle'],
    description: 'A defensive observation post',
  },
  {
    id: 'garden',
    name: 'Garden',
    grantedByTags: ['life', 'heart'],
    culturalVariantDescriptors: ['moon-bloom terrace', 'herb-spiral sanctuary', 'living-wall courtyard'],
    description: 'A cultivated space of growth',
  },
  {
    id: 'tomb',
    name: 'Tomb',
    grantedByTags: ['entropy', 'veil'],
    culturalVariantDescriptors: ['echo-carved crypt', 'bone-lattice mausoleum', 'silence-sealed barrow'],
    description: 'A resting place for the honored dead',
  },
  {
    id: 'observatory',
    name: 'Observatory',
    grantedByTags: ['time', 'star'],
    culturalVariantDescriptors: ['star-map dome', 'celestial wheel chamber', 'moon-dial platform'],
    description: 'A place for reading the heavens',
  },
  {
    id: 'barracks',
    name: 'Barracks',
    grantedByTags: ['force', 'iron'],
    culturalVariantDescriptors: ['trophy-hung dormitory', 'war-drum hall', 'weapon-rack longhouse'],
    description: 'Housing and training grounds for warriors',
  },
  {
    id: 'market_square',
    name: 'Market Square',
    grantedByTags: ['gold', 'heart'],
    culturalVariantDescriptors: ['festival-ready plaza', 'barter-stone courtyard', 'lamp-lit commons'],
    description: 'An open gathering space for trade and socializing',
  },
  {
    id: 'council_chamber',
    name: 'Council Chamber',
    grantedByTags: ['mind', 'order'],
    culturalVariantDescriptors: ['truth-stone hall', 'ancestor-carved rotunda', 'judgment seat chamber'],
    description: 'A place where decisions are made',
  },
  {
    id: 'ritual_ground',
    name: 'Ritual Ground',
    grantedByTags: ['spirit', 'entropy'],
    culturalVariantDescriptors: ['blood-circle clearing', 'spirit-door meadow', 'bone-dust amphitheater'],
    description: 'Open space for major cultural ceremonies',
  },
  {
    id: 'archive',
    name: 'Archive',
    grantedByTags: ['mind', 'time'],
    culturalVariantDescriptors: ['memory-crystal vault', 'clay-tablet labyrinth', 'moth-proof sanctum'],
    description: 'Deep storage of cultural records and artifacts',
  },
  {
    id: 'harbor',
    name: 'Harbor',
    grantedByTags: ['ocean'],
    culturalVariantDescriptors: ['tide-gate wharf', 'shell-crusted dock', 'storm-sheltered anchorage'],
    description: 'A waterfront for maritime activities',
  },
  {
    id: 'underground_passage',
    name: 'Underground Passage',
    grantedByTags: ['darkness', 'shadow'],
    culturalVariantDescriptors: ['whisper-tunnel network', 'shadow-mapped labyrinth', 'secret-sealed undercroft'],
    description: 'Hidden routes beneath the settlement',
  },
];

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
    sourceTags: ['deciduous_forest', 'jungle'],
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
    sourceTags: ['taiga', 'tundra', 'glacier'],
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
    sourceTags: ['swamp', 'bog'],
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
    sourceTags: ['volcanic'],
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
    sourceTags: ['tundra', 'glacier', 'taiga'],
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
    sourceTags: ['deciduous_forest', 'dense_forest', 'jungle'],
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
    sourceTags: ['volcanic'],
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
    sourceTags: ['bog', 'swamp'],
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
    sourceTags: ['savanna', 'volcanic'],
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
    sourceTags: ['volcanic'],
    strengthThresholds: {
      fanatical: 'Sulfur baths are constant; burning sulfur as protective barrier around homes',
      strong: 'Sulfur is used in all protective rituals and cleansing ceremonies',
      fading: 'Sulfur used in cleansing rituals and healing',
    },
    domainContributions: { veil: 1, heart: 1 },
    tags: ['spiritual', 'ritual'],
  },
];
