/**
 * encounter-anomaly-content.ts — Encounter templates for anomaly discovery.
 *
 * Each anomaly type gets a unique encounter: Eye reach discovery step, then
 * themed reach extraction. Vault, cavern, and treasury get a 3rd extraction
 * complication step.
 *
 * Reward flow:
 *   - Success: rare resource seeded on location, anomaly revealed
 *   - Critical success: resource + unique signature artifact/trait/condition
 *
 * NFP #1: All difficulty values are named constants.
 * NFP #5: Narrative over mechanical — prose drives the experience.
 */

import type { EncounterTemplate } from '../types/encounter';

// ── Difficulty Constants ─────────────────────────────────────────────────────
// Anomaly encounters are exploration-focused — moderate difficulty, Eye primary.

/** Base difficulty for the Eye discovery step — achievable by mid-game agents. */
const DISCOVERY_DIFFICULTY = 12;

/** Difficulty step for extraction — themed reach test. */
const EXTRACTION_DIFFICULTY = 18;

/** Higher extraction for dangerous anomalies (vault, cavern, treasury). */
const DANGEROUS_EXTRACTION_DIFFICULTY = 22;

/** Complication step difficulty (3-step encounters only). */
const COMPLICATION_DIFFICULTY = 28;

// ── Encounter Templates ──────────────────────────────────────────────────────

export const ANOMALY_ENCOUNTER_TEMPLATES: EncounterTemplate[] = [
  // ── gem_deposit: "The Gleaming Vein" (2-step) ──────────────────────
  {
    id: 'encounter.anomaly.gleaming_vein',
    name: 'The Gleaming Vein',
    locationTypes: ['gem_deposit'],
    reachPrimary: 'eye',
    reachSecondary: 'stone',
    encounterType: 'explore',
    threatRating: 'easy',
    intrinsicTier: 'shaping',
    motivations: ['asceticism_extravagance', 'loyalty_ambition'],
    sphereAffinity: 'matter',
    steps: [
      {
        id: 'gleaming_vein.survey',
        name: 'The Survey',
        reach: 'eye',
        difficulty: DISCOVERY_DIFFICULTY,
        duration: 1,
        narrative: 'Something catches {actor}\'s eye — unusual striations in the hillside rock, glinting where the sun strikes at the right angle.',
        onSuccess: {
          narrative: '{actor} traces the striations with a {adj} hand. There — beneath the surface — a vein of precious stone, thick and unmistakable.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The glint was nothing — feldspar, perhaps, or wet mica. {actor} moves on, the {adj} promise unfulfilled.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'gleaming_vein.extraction',
        name: 'The Excavation',
        reach: 'stone',
        difficulty: EXTRACTION_DIFFICULTY,
        duration: 2,
        narrative: 'The vein runs deeper than expected. {actor} must cut carefully — one wrong strike and the deposit collapses into rubble.',
        onSuccess: {
          narrative: 'Stone parts for {actor} with {adj} precision. Gems spill from the opened rock like frozen tears — rubies, sapphires, stones that hold the light.',
          reputationDelta: 0.12,
          rewardPool: {
            categoryWeights: { possession: 0.6, bestowed_power: 0.3, condition: 0.1 },
            tagFilters: ['#gem'],
          },
        },
        onFailure: {
          narrative: 'The rock shifts and groans. {actor} retreats as the vein seals itself, the {adj} treasure locked behind tons of fallen stone.',
          reputationDelta: -0.05,
        },
      },
    ],
  },

  // ── crystal_cavern: "The Singing Dark" (3-step) ────────────────────
  {
    id: 'encounter.anomaly.singing_dark',
    name: 'The Singing Dark',
    locationTypes: ['crystal_cavern'],
    reachPrimary: 'eye',
    reachSecondary: 'veil',
    encounterType: 'explore',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ['courage_prudence', 'loyalty_ambition'],
    sphereAffinity: 'energy',
    steps: [
      {
        id: 'singing_dark.detection',
        name: 'The Detection',
        reach: 'eye',
        difficulty: DISCOVERY_DIFFICULTY + 3,
        duration: 1,
        narrative: 'A hum rises from the earth beneath {actor}\'s feet — not sound exactly, but something the bones hear. The ground is singing.',
        onSuccess: {
          narrative: '{actor} presses an ear to the stone and listens with {adj} patience. Below — a hollow space, resonating with crystal harmonics.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The hum fades as quickly as it came. {actor} is left with a {adj} sense of something missed, something close.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'singing_dark.navigation',
        name: 'The Resonant Chamber',
        reach: 'veil',
        difficulty: DANGEROUS_EXTRACTION_DIFFICULTY,
        duration: 2,
        narrative: 'The cavern opens into a cathedral of crystal. Every surface sings. One wrong vibration could shatter the whole formation.',
        onSuccess: {
          narrative: '{actor} moves through the crystal forest with {adj} grace, matching the frequency of each formation, passing without disturbing the chorus.',
          reputationDelta: 0.10,
        },
        onFailure: {
          narrative: 'A misstep. A single crystal cracks, and the harmonics cascade. {actor} covers their ears against the {adj} shriek and flees.',
          reputationDelta: -0.05,
        },
      },
      {
        id: 'singing_dark.crescendo',
        name: 'The Crescendo',
        reach: 'veil',
        difficulty: COMPLICATION_DIFFICULTY,
        duration: 2,
        narrative: 'The cavern\'s resonance builds — a crescendo of magical energy focused on {actor}. The crystals are reacting to their presence.',
        onSuccess: {
          narrative: '{actor} stands in the eye of the storm with {adj} composure, letting the energy wash through rather than resist. The crystals accept them.',
          reputationDelta: 0.15,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.5, possession: 0.3, condition: 0.2 },
            tagFilters: ['#crystal', '#arcane'],
          },
        },
        onFailure: {
          narrative: 'The resonance overwhelms {actor}. They stagger out, ears ringing, vision doubled — but alive. The cavern seals behind them.',
          reputationDelta: -0.08,
        },
      },
    ],
  },

  // ── golden_grove: "Sap of Ages" (2-step) ───────────────────────────
  {
    id: 'encounter.anomaly.sap_of_ages',
    name: 'Sap of Ages',
    locationTypes: ['golden_grove'],
    reachPrimary: 'eye',
    reachSecondary: 'heart',
    encounterType: 'explore',
    threatRating: 'easy',
    intrinsicTier: 'shaping',
    motivations: ['tradition_innovation', 'asceticism_extravagance'],
    sphereAffinity: 'life',
    steps: [
      {
        id: 'sap_of_ages.notice',
        name: 'The Golden Shimmer',
        reach: 'eye',
        difficulty: DISCOVERY_DIFFICULTY - 2,
        duration: 1,
        narrative: 'The bark of these trees has an unusual shimmer — golden, warm, as if the wood itself were bleeding sunlight.',
        onSuccess: {
          narrative: '{actor} touches the bark and golden resin clings to their {adj} fingers. The trees are weeping amber — slowly, generously.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'Ordinary sap. The golden cast was just the light playing tricks through the {adj} canopy.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'sap_of_ages.harvest',
        name: 'The Harvest',
        reach: 'heart',
        difficulty: EXTRACTION_DIFFICULTY - 3,
        duration: 2,
        narrative: 'The trees respond to intent. {actor} must approach with genuine respect — take only what is offered, harm nothing.',
        onSuccess: {
          narrative: 'The grove opens to {actor}. Sap flows freely into their vessels, thick and golden and warm with {adj} life.',
          reputationDelta: 0.10,
          rewardPool: {
            categoryWeights: { possession: 0.4, condition: 0.4, bestowed_power: 0.2 },
            tagFilters: ['#nature', '#healing'],
          },
        },
        onFailure: {
          narrative: 'The trees sense {actor}\'s {adj} impatience. The bark tightens, the sap retreats. The grove closes like a fist.',
          reputationDelta: -0.05,
        },
      },
    ],
  },

  // ── herb_garden: "The Wild Apothecary" (2-step) ────────────────────
  {
    id: 'encounter.anomaly.wild_apothecary',
    name: 'The Wild Apothecary',
    locationTypes: ['herb_garden'],
    reachPrimary: 'eye',
    reachSecondary: 'eye',
    encounterType: 'explore',
    threatRating: 'trivial',
    intrinsicTier: 'shaping',
    motivations: ['tradition_innovation', 'asceticism_extravagance'],
    sphereAffinity: 'life',
    steps: [
      {
        id: 'wild_apothecary.recognition',
        name: 'Recognition',
        reach: 'eye',
        difficulty: DISCOVERY_DIFFICULTY - 4,
        duration: 1,
        narrative: 'Among the common growth, {actor} notices species that shouldn\'t grow here — rare medicinal plants, thriving in impossible combination.',
        onSuccess: {
          narrative: '{actor}\'s {adj} eye catches what others would miss. Feverfew beside dreamroot, bloodmoss and starwort — a natural apothecary.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'Weeds. Just weeds. {actor}\'s {adj} hope of finding something rare was misplaced.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'wild_apothecary.catalogue',
        name: 'The Catalogue',
        reach: 'eye',
        difficulty: DISCOVERY_DIFFICULTY,
        duration: 1,
        narrative: 'The plants grow in a delicate symbiosis. {actor} must harvest without disrupting the root network that sustains them all.',
        onSuccess: {
          narrative: '{actor} works with {adj} patience, taking only what the garden can spare. The plants seem to lean toward them, offering.',
          reputationDelta: 0.08,
          rewardPool: {
            categoryWeights: { condition: 0.5, bestowed_power: 0.3, possession: 0.2 },
            tagFilters: ['#healing', '#herb'],
          },
        },
        onFailure: {
          narrative: 'A careless tug and the root network tears. The {adj} damage spreads — the plants wilt in sympathy.',
          reputationDelta: -0.03,
        },
      },
    ],
  },

  // ── ancient_vault: "The Sealed Chamber" (3-step) ───────────────────
  {
    id: 'encounter.anomaly.sealed_chamber',
    name: 'The Sealed Chamber',
    locationTypes: ['ancient_vault'],
    reachPrimary: 'eye',
    reachSecondary: 'veil',
    encounterType: 'explore',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ['courage_prudence', 'tradition_innovation'],
    sphereAffinity: 'time',
    steps: [
      {
        id: 'sealed_chamber.wards',
        name: 'The Ward-Marks',
        reach: 'eye',
        difficulty: DISCOVERY_DIFFICULTY + 6,
        duration: 1,
        narrative: 'Symbols carved into stone that should have weathered to nothing centuries ago. {actor} traces them — they\'re still sharp, still active.',
        onSuccess: {
          narrative: '{actor} reads the ward-marks with {adj} precision. A pattern emerges — not a warning, but a lock. One that can be opened.',
          reputationDelta: 0.08,
        },
        onFailure: {
          narrative: 'The symbols blur and shift under {actor}\'s {adj} gaze. The ancient builders hid their work well.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'sealed_chamber.bypass',
        name: 'The Protections',
        reach: 'veil',
        difficulty: DANGEROUS_EXTRACTION_DIFFICULTY + 3,
        duration: 2,
        narrative: 'The wards pulse with power that predates every living civilization. {actor} must bypass them without triggering the failsafe.',
        onSuccess: {
          narrative: 'The wards dim one by one as {actor} speaks the counter-phrase with {adj} authority. The seal breaks. Air rushes in from a world that has waited centuries.',
          reputationDelta: 0.12,
        },
        onFailure: {
          narrative: 'The wards flare. Pain lances through {actor}\'s {adj} hands. The vault resists — it was sealed for a reason.',
          reputationDelta: -0.08,
        },
      },
      {
        id: 'sealed_chamber.collapse',
        name: 'The Collapse',
        reach: 'stone',
        difficulty: COMPLICATION_DIFFICULTY + 2,
        duration: 2,
        narrative: 'The ceiling groans. Dust cascades in sheets. The vault has been open too long — it\'s sealing itself again, with {actor} inside.',
        onSuccess: {
          narrative: '{actor} grabs what they can and runs with {adj} purpose. Behind them, the vault closes forever — but the relics are out.',
          reputationDelta: 0.18,
          rewardPool: {
            categoryWeights: { possession: 0.5, bestowed_power: 0.3, condition: 0.2 },
            tagFilters: ['#ancient', '#relic'],
          },
        },
        onFailure: {
          narrative: 'The stone falls. {actor} barely escapes with their {adj} life — empty-handed, bruised, and haunted by what they glimpsed.',
          reputationDelta: -0.10,
        },
      },
    ],
  },

  // ── sunken_treasury: "The Drowned Hoard" (3-step) ──────────────────
  {
    id: 'encounter.anomaly.drowned_hoard',
    name: 'The Drowned Hoard',
    locationTypes: ['sunken_treasury'],
    reachPrimary: 'eye',
    reachSecondary: 'iron',
    encounterType: 'explore',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ['courage_prudence', 'asceticism_extravagance'],
    sphereAffinity: 'entropy',
    steps: [
      {
        id: 'drowned_hoard.locate',
        name: 'The Submerged Ruin',
        reach: 'eye',
        difficulty: DISCOVERY_DIFFICULTY + 2,
        duration: 1,
        narrative: 'Beneath the murky water, {actor} notices straight edges where nature makes only curves. Something built lies below.',
        onSuccess: {
          narrative: '{actor}\'s {adj} eye pierces the murk. A structure — walls, a doorway, the outline of a treasury that drowned with its kingdom.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'Shadows in the water, nothing more. {actor}\'s {adj} imagination made architecture from silt and weeds.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'drowned_hoard.dive',
        name: 'The Dive',
        reach: 'iron',
        difficulty: EXTRACTION_DIFFICULTY + 2,
        duration: 2,
        narrative: 'The water is cold and dark. {actor} dives toward the treasury door, lungs burning, aware that something stirs in the deep.',
        onSuccess: {
          narrative: '{actor} forces the corroded door with {adj} strength. Gold spills into the current — coins, ingots, jewelry dulled by water but rich with history.',
          reputationDelta: 0.12,
        },
        onFailure: {
          narrative: 'The current is too strong, the door too heavy. {actor} surfaces gasping, the {adj} treasure untouched below.',
          reputationDelta: -0.06,
        },
      },
      {
        id: 'drowned_hoard.undertow',
        name: 'The Undertow',
        reach: 'iron',
        difficulty: COMPLICATION_DIFFICULTY - 2,
        duration: 1,
        narrative: 'The current shifts. What was still water becomes a sucking vortex — the treasury draining into deeper channels, taking everything with it.',
        onSuccess: {
          narrative: '{actor} fights the undertow with {adj} determination, surfacing with the hoard clutched to their chest. The water closes behind them.',
          reputationDelta: 0.15,
          rewardPool: {
            categoryWeights: { possession: 0.6, condition: 0.3, bestowed_power: 0.1 },
            tagFilters: ['#gold', '#cursed'],
          },
        },
        onFailure: {
          narrative: 'The current wins. {actor} is swept to the shallows, {adj} and gasping, the treasure pulled into the deep.',
          reputationDelta: -0.08,
        },
      },
    ],
  },

  // ── fossil_bed: "Bones of the Old World" (2-step) ──────────────────
  {
    id: 'encounter.anomaly.bones_old_world',
    name: 'Bones of the Old World',
    locationTypes: ['fossil_bed'],
    reachPrimary: 'eye',
    reachSecondary: 'stone',
    encounterType: 'explore',
    threatRating: 'easy',
    intrinsicTier: 'shaping',
    motivations: ['tradition_innovation', 'courage_prudence'],
    sphereAffinity: 'time',
    steps: [
      {
        id: 'bones_old_world.notice',
        name: 'The Formations',
        reach: 'eye',
        difficulty: DISCOVERY_DIFFICULTY,
        duration: 1,
        narrative: 'Bone-white shapes in the rock face. Not natural stone — too regular, too ordered. Something died here, long ago, and the earth kept it.',
        onSuccess: {
          narrative: '{actor} brushes away the dust with {adj} reverence. Bones of creatures that have no name in any living tongue, preserved in amber and stone.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'Chalk deposits. Limestone. Nothing more than geology playing tricks on a {adj} mind.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'bones_old_world.extract',
        name: 'The Extraction',
        reach: 'stone',
        difficulty: EXTRACTION_DIFFICULTY - 2,
        duration: 2,
        narrative: 'The fossils are bound in a lattice of crystallized magic. Breaking them free requires skill — one fracture and the resonance shatters.',
        onSuccess: {
          narrative: '{actor} works the stone with {adj} precision, freeing amber-trapped specimens whose magic still hums after millennia of silence.',
          reputationDelta: 0.10,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.4, possession: 0.3, condition: 0.3 },
            tagFilters: ['#ancient', '#time'],
          },
        },
        onFailure: {
          narrative: 'The chisel slips. Cracks spider through the lattice and the {adj} resonance dies with a sound like a held breath released.',
          reputationDelta: -0.05,
        },
      },
    ],
  },

  // ── iron_seep: "The Fallen Star" (2-step) ──────────────────────────
  {
    id: 'encounter.anomaly.fallen_star',
    name: 'The Fallen Star',
    locationTypes: ['iron_seep'],
    reachPrimary: 'eye',
    reachSecondary: 'stone',
    encounterType: 'explore',
    threatRating: 'easy',
    intrinsicTier: 'shaping',
    motivations: ['courage_prudence', 'loyalty_ambition'],
    sphereAffinity: 'force',
    steps: [
      {
        id: 'fallen_star.trail',
        name: 'The Trail',
        reach: 'eye',
        difficulty: DISCOVERY_DIFFICULTY - 2,
        duration: 1,
        narrative: 'The water running from this hillside is rust-red, staining everything it touches. {actor} follows it uphill to a depression choked with strange dark moss.',
        onSuccess: {
          narrative: '{actor} scrapes away the moss with {adj} curiosity and finds dark metal — dense, cold despite the sun, and faintly humming. Not of this earth.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'Just iron-rich clay, leaching rust into the stream. {actor}\'s {adj} hope of something extraordinary fades.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'fallen_star.extraction',
        name: 'The Crater',
        reach: 'stone',
        difficulty: EXTRACTION_DIFFICULTY,
        duration: 2,
        narrative: 'The crater is deeper than it looks — the star metal is embedded in bedrock, fused by the heat of impact. Extracting it without tools is brutal work.',
        onSuccess: {
          narrative: '{actor} wrenches the dark metal free with {adj} effort. It\'s heavier than iron, colder than steel, and the air around it tastes of ozone and distant places.',
          reputationDelta: 0.10,
          rewardPool: {
            categoryWeights: { possession: 0.5, bestowed_power: 0.3, condition: 0.2 },
            tagFilters: ['#star_metal', '#fate'],
          },
        },
        onFailure: {
          narrative: 'The metal holds fast. {actor} breaks their tools against its {adj} stubbornness and retreats, hands bleeding.',
          reputationDelta: -0.05,
        },
      },
    ],
  },

  // ── pearl_shoal: "The Moon's Tears" (2-step) ──────────────────────
  {
    id: 'encounter.anomaly.moons_tears',
    name: "The Moon's Tears",
    locationTypes: ['pearl_shoal'],
    reachPrimary: 'eye',
    reachSecondary: 'star',
    encounterType: 'explore',
    threatRating: 'easy',
    intrinsicTier: 'shaping',
    motivations: ['tradition_innovation', 'asceticism_extravagance'],
    sphereAffinity: 'spirit',
    steps: [
      {
        id: 'moons_tears.tides',
        name: 'The Tidal Pattern',
        reach: 'eye',
        difficulty: DISCOVERY_DIFFICULTY,
        duration: 1,
        narrative: 'The shallows here are different — the water has a pearl-like sheen, and the tides follow a rhythm that doesn\'t match the moon.',
        onSuccess: {
          narrative: '{actor} reads the {adj} patterns in the water. The pearl beds lie below, revealed only at a specific tidal conjunction that most would never notice.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The water is just water. The {adj} sheen was sunlight and wishful thinking.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'moons_tears.dive',
        name: 'The Dive',
        reach: 'star',
        difficulty: EXTRACTION_DIFFICULTY,
        duration: 2,
        narrative: 'The tides align. For a brief window, the waters part enough to reach the pearl beds. {actor} must time the dive perfectly — the window closes quickly.',
        onSuccess: {
          narrative: '{actor} surfaces with {adj} triumph, hands full of pearls — moon-white, perfectly round, and warm to the touch. The sea gave its gift.',
          reputationDelta: 0.10,
          rewardPool: {
            categoryWeights: { possession: 0.4, bestowed_power: 0.3, condition: 0.3 },
            tagFilters: ['#pearl', '#spirit'],
          },
        },
        onFailure: {
          narrative: 'The window closes. The waters surge back, and {actor} retreats from the {adj} tide, empty-handed and salt-stung.',
          reputationDelta: -0.05,
        },
      },
    ],
  },

  // ── glowcap_hollow: "The Dreaming Light" (2-step) ─────────────────
  {
    id: 'encounter.anomaly.dreaming_light',
    name: 'The Dreaming Light',
    locationTypes: ['glowcap_hollow'],
    reachPrimary: 'eye',
    reachSecondary: 'veil',
    encounterType: 'explore',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ['courage_prudence', 'tradition_innovation'],
    sphereAffinity: 'mind',
    steps: [
      {
        id: 'dreaming_light.glow',
        name: 'The Glow',
        reach: 'eye',
        difficulty: DISCOVERY_DIFFICULTY + 2,
        duration: 1,
        narrative: 'In the deepest shadow, where no light should reach, something glows — soft, pulsing, organic. Not fire. Not magic. Something alive.',
        onSuccess: {
          narrative: '{actor}\'s {adj} eyes adjust to the glow. Fungi — vast colonies of bioluminescent caps, their light painting the dark in colors that have no name.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'Foxfire. Rotting wood. The {adj} promise of wonder dissolves into mundane phosphorescence.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'dreaming_light.harvest',
        name: 'The Harvest',
        reach: 'veil',
        difficulty: EXTRACTION_DIFFICULTY + 2,
        duration: 2,
        narrative: 'The spores drift like luminous snow. Beautiful — and potent. {actor} must harvest without breathing too deeply. The visions that follow an unguarded breath are not always survivable.',
        onSuccess: {
          narrative: '{actor} works with {adj} discipline, sealing the spores in vessels before the psychoactive cloud can take hold. A king\'s ransom in alchemical reagent.',
          reputationDelta: 0.12,
          rewardPool: {
            categoryWeights: { condition: 0.4, bestowed_power: 0.3, possession: 0.3 },
            tagFilters: ['#fungus', '#mind'],
          },
        },
        onFailure: {
          narrative: 'One breath too many. The world dissolves into {adj} color and sound and {actor} wakes hours later, empty-handed, with memories they can\'t quite hold.',
          reputationDelta: -0.06,
        },
      },
    ],
  },
];
