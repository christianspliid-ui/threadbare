/**
 * Ordeal Content Package — 10 ordeal templates with 30 encounters and cultural vocabulary overlays.
 *
 * ═══════════════════════════════════════════════════════════════════
 * CONTENT MANAGER: This is the file you edit to change ordeal templates,
 * encounter sequences, difficulty curves, and cultural prose variations.
 * ═══════════════════════════════════════════════════════════════════
 */

import type { OrdealDefinition } from '../types/ordeal';

// ─── Types ──────────────────────────────────────────────────────────

/**
 * Difficulty tier for an ordeal, including base multiplier and tone adjectives.
 */
export interface OrdealDifficultyTier {
  /** Multiplier applied to base difficulty (e.g., 0.8 for easier, 1.3 for harder) */
  difficultyMultiplier: number;
  /** Tone adjectives to flavor prose at this difficulty level */
  toneAdjectives: string[];
}

// ─── Tunable Constants ──────────────────────────────────────────

/** Difficulty progression within a template (escalates per encounter) */
const DIFFICULTY_BASE = 35;
const DIFFICULTY_STEP = 10;

// ─── 3 Difficulty Tiers ─────────────────────────────────────────

/**
 * Ordeal difficulty tiers determine how challenging an ordeal is and what tone it carries.
 * Used to flavor prose and adjust difficulty multipliers for ordeal encounters.
 */
export const ORDEAL_DIFFICULTY_TIERS: Record<string, OrdealDifficultyTier> = {
  early: {
    difficultyMultiplier: 0.8,
    toneAdjectives: ['uncertain', 'tentative', 'green', 'unsteady', 'fledgling'],
  },
  mid: {
    difficultyMultiplier: 1.0,
    toneAdjectives: ['determined', 'tested', 'hardened', 'resolute', 'seasoned'],
  },
  late: {
    difficultyMultiplier: 1.3,
    toneAdjectives: ['desperate', 'legendary', 'harrowed', 'transcendent', 'final'],
  },
};

// ─── 10 Ordeal Templates ───────────────────────────────────────

/**
 * The 10 ordeal archetypes cover all major domains and location types.
 * Each has 3 encounters with escalating difficulty (35 → 45 → 55).
 */
export const ORDEAL_TEMPLATES: OrdealDefinition[] = [
  {
    id: 'ordeal.deep_descent',
    name: 'The Deep Descent',
    locationTypes: ['dungeon', 'cavern'],
    reachPrimary: 'iron',
    reachSecondary: 'shadow',
    encounters: [
      {
        id: 'deep_descent.entrance',
        name: 'The Entrance',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE,
        narrative: 'The mouth of the deep yawns before {actor}. Darkness coils within, and the first step demands resolve.',
        onSuccess: {
          narrative: '{actor} descends with {adj} purpose, the weight of stone parting before their footfalls.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} falters at the threshold. The {adj} pull of the depths proves too much; they withdraw.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'deep_descent.labyrinth',
        name: 'The Labyrinth',
        reach: 'shadow',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        narrative: 'The passages twist and fork endlessly. {actor} navigates the {adj} maze, shadows shifting with every choice.',
        onSuccess: {
          narrative: '{actor} reads the stone\'s whisper, finding the true path through the labyrinth\'s heart.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'Lost in the dark, {actor} circles back upon {themselves}, the passage\'s {adj} logic defeating them.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'deep_descent.abyss',
        name: 'The Abyss',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        narrative: 'The descent ends at a chasm that {verb} with ancient hunger. {actor} stands at the precipice of ruin.',
        onSuccess: {
          narrative: '{actor} crosses the abyss with {adj} determination, claiming the artifact that rests in shadow below.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The abyss {verb} and {actor} is cast back, {adj} and broken, to the light above.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'ordeal.trial_of_flame',
    name: 'Trial of Flame',
    locationTypes: ['forge', 'mine', 'volcanic'],
    reachPrimary: 'iron',
    reachSecondary: 'stone',
    encounters: [
      {
        id: 'trial_of_flame.ignition',
        name: 'The Ignition',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE,
        narrative: 'The forge roars to life before {actor}, heat warping the air into {adj} shimmer. The first metal waits.',
        onSuccess: {
          narrative: '{actor} strikes the anvil with {adj} precision, shape flowing from {action}.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s hammer falters. The {adj} metal cracks under their inexact blow.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'trial_of_flame.tempering',
        name: 'The Tempering',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        narrative: 'The forge demands submission. {actor} must plunge the {adj} blade into ice, testing will against instinct.',
        onSuccess: {
          narrative: '{actor} emerges with a weapon tempered in wisdom, {adj} and true.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The steel shatters. {actor}\'s moment of doubt costs them a blade and a chance at mastery.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'trial_of_flame.transformation',
        name: 'The Transformation',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        narrative: 'The master smith arrives. {actor} must remake a legendary weapon from a {adj} ruin of metal and myth.',
        onSuccess: {
          narrative: '{actor} transforms base material into legend, and the master nods in {adj} approval.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The forge rejects {actor}\'s touch. The metal {verb}s away, and mastery recedes.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'ordeal.spirit_walk',
    name: 'The Spirit Walk',
    locationTypes: ['grove', 'monastery', 'temple'],
    reachPrimary: 'veil',
    reachSecondary: 'heart',
    encounters: [
      {
        id: 'spirit_walk.threshold',
        name: 'The Threshold',
        reach: 'veil',
        difficulty: DIFFICULTY_BASE,
        narrative: 'The veil thins here. {actor} feels {adj} presences gathering, watching from the other side.',
        onSuccess: {
          narrative: '{actor} centers their breath and {verb}s past the watchers into communion.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The presences {verb} and press, and {actor} is thrown back into the physical realm, shaken.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'spirit_walk.communion',
        name: 'The Communion',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        narrative: '{actor} meets a {adj} spirit — ancient, protective, testing the depth of their faith.',
        onSuccess: {
          narrative: '{actor} offers {their} heart to the spirit\'s knowing gaze and receives a {adj} blessing.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} flinches from the spirit\'s truth. The connection shatters, leaving them {adj} and alone.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'spirit_walk.transcendence',
        name: 'The Transcendence',
        reach: 'veil',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        narrative: 'The veil parts entirely. {actor} glimpses the unmaking and remaking of worlds in {adj} flux.',
        onSuccess: {
          narrative: '{actor} touches infinity and returns {adj}, forever changed, carrying the weight of eternity.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The vision overwhelms {actor}. They stumble back into flesh and breath, {adj} and diminished.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'ordeal.merchants_gambit',
    name: 'Merchant\'s Gambit',
    locationTypes: ['market', 'port', 'bazaar'],
    reachPrimary: 'gold',
    reachSecondary: 'eye',
    encounters: [
      {
        id: 'merchants_gambit.negotiation',
        name: 'The Negotiation',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE,
        narrative: 'The market roars with {adj} voices. {actor} must broker a deal between two {adj} merchants on the edge of violence.',
        onSuccess: {
          narrative: '{actor} finds the {adj} middle ground. Both parties walk away satisfied, grudging respect in their eyes.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s words ring hollow. The merchants {verb} in anger, and the deal collapses into acrimony.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'merchants_gambit.deception',
        name: 'The Deception',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        narrative: 'A {adj} buyer arrives with false goods. {actor} must detect the fraud and expose it without breaking trust.',
        onSuccess: {
          narrative: '{actor}\'s {adj} eye catches the flaw, and they expose it with grace. The buyer admits defeat {adj}ly.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s suspicion rings false. The merchant {verb}s in offense, and reputation suffers.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'merchants_gambit.fortune',
        name: 'The Fortune',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        narrative: 'A {adj} opportunity arrives: a shipment of contraband at {adj} prices. {actor} must decide between profit and principle.',
        onSuccess: {
          narrative: '{actor} refuses the gambit with {adj} rhetoric, earning the market\'s respect for integrity.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} accepts the deal. The cargo is seized, and scandal blackens their name.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'ordeal.shadow_hunt',
    name: 'The Shadow Hunt',
    locationTypes: ['dungeon', 'forest', 'ruin', 'city'],
    reachPrimary: 'shadow',
    reachSecondary: 'star',
    encounters: [
      {
        id: 'shadow_hunt.stalk',
        name: 'The Stalk',
        reach: 'shadow',
        difficulty: DIFFICULTY_BASE,
        narrative: '{actor} pursues {their} quarry through {adj} terrain, every step a whisper against discovery.',
        onSuccess: {
          narrative: '{actor} glides through shadow like water, {adj} and unseen, tracking the prey to ground.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'A twig snaps beneath {actor}. The quarry flees, and the hunt collapses into {adj} chaos.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'shadow_hunt.patience',
        name: 'The Patience',
        reach: 'star',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        narrative: '{actor} must wait in {adj} stillness while the target passes by. Hours compress into heartbeats.',
        onSuccess: {
          narrative: '{actor} remains {adj} as stone until the moment is right, then strikes with {adj} precision.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s nerve fails. {They} move too soon, and the prey escapes into the dark.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'shadow_hunt.convergence',
        name: 'The Convergence',
        reach: 'shadow',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        narrative: '{actor}\'s prey reaches a {adj} stronghold. {They} must infiltrate, strike, and vanish like smoke.',
        onSuccess: {
          narrative: '{actor} becomes shadow itself, {adj} and deadly, claiming {their} prize and leaving no trace.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The stronghold erupts. {actor} flees {adj} and wounded, the job left incomplete.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'ordeal.knowledge_test',
    name: 'The Knowledge Test',
    locationTypes: ['academy', 'archive', 'library', 'tower'],
    reachPrimary: 'eye',
    reachSecondary: 'veil',
    encounters: [
      {
        id: 'knowledge_test.archives',
        name: 'The Archives',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE,
        narrative: '{actor} stands before a {adj} library. {They} must find a single answer hidden in {adj} volumes.',
        onSuccess: {
          narrative: '{actor}\'s intellect {verb}s through the stacks, finding the truth in a {adj} margin.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} searches in vain. The answer remains hidden, and frustration echoes in the {adj} silence.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'knowledge_test.riddle',
        name: 'The Riddle',
        reach: 'veil',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        narrative: 'A {adj} scholar poses a riddle that has confounded seekers for ages. {actor} must solve it.',
        onSuccess: {
          narrative: '{actor} unravels the {adj} knot of language and meaning, and the scholar nods with {adj} respect.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s answer rings false. The scholar shakes {their} head, and the riddle remains {adj} and unsolved.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'knowledge_test.synthesis',
        name: 'The Synthesis',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        narrative: '{actor} must weave together {adj} theories into a coherent whole, creating new understanding from chaos.',
        onSuccess: {
          narrative: '{actor} achieves a {adj} insight that reshapes the academy\'s understanding of reality itself.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s synthesis collapses into {adj} contradiction. The academy rejects the work.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'ordeal.warlords_crucible',
    name: 'The Warlord\'s Crucible',
    locationTypes: ['fortress', 'battlefield', 'garrison'],
    reachPrimary: 'iron',
    reachSecondary: 'stone',
    encounters: [
      {
        id: 'warlords_crucible.duel',
        name: 'The Duel',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE,
        narrative: '{actor} faces a {adj} opponent in single combat. The fortress watches, breath held.',
        onSuccess: {
          narrative: '{actor} defeats {their} foe with {adj} skill, and the crowd erupts in {adj} acclaim.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} stumbles. {Their} opponent presses {their} advantage, and {actor} is forced to yield.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'warlords_crucible.command',
        name: 'The Command',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        narrative: '{actor} must lead a {adj} garrison against a {adj} siege. The fort\'s survival rests on {their} choices.',
        onSuccess: {
          narrative: '{actor} orchestrates a {adj} defense. The enemy breaks against walls, and morale soars.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s strategy {verb}s. The gates are breached, and {their} command shatters.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'warlords_crucible.ascension',
        name: 'The Ascension',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        narrative: 'The warlord arrives in {adj} fury. {actor} must defeat {them} to claim the fortress and title.',
        onSuccess: {
          narrative: '{actor} stands victorious over the {adj} warlord, the fortress now {their} own, {adj} and glorious.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} is cast down. The warlord {verb}s and they are cast into chains, {adj} and defeated.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'ordeal.healers_oath',
    name: 'The Healer\'s Oath',
    locationTypes: ['temple', 'monastery', 'sanctuary'],
    reachPrimary: 'flesh',
    reachSecondary: 'heart',
    encounters: [
      {
        id: 'healers_oath.diagnosis',
        name: 'The Diagnosis',
        reach: 'flesh',
        difficulty: DIFFICULTY_BASE,
        narrative: '{actor} examines a {adj} patient whose ailment is {adj} and obscure. The healing must begin with understanding.',
        onSuccess: {
          narrative: '{actor}\'s touch reveals the truth of the sickness, and a {adj} remedy becomes clear.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s examination yields nothing. The patient remains {adj}, and hope dims.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'healers_oath.remedy',
        name: 'The Remedy',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        narrative: '{actor} must craft a {adj} remedy from {adj} herbs and will, asking the patient\'s body to answer.',
        onSuccess: {
          narrative: '{actor} channels {adj} intention through {their} medicine, and the patient opens {their} eyes in gratitude.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s remedy fails. The patient {verb}s away, and {actor} is left with failure\'s weight.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'healers_oath.sacrifice',
        name: 'The Sacrifice',
        reach: 'flesh',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        narrative: 'A {adj} plague spreads. {actor} must tend {their} own wounds while {they} heal the {adj} masses.',
        onSuccess: {
          narrative: '{actor} stands {adj} at the end, having pulled the city back from the brink through {adj} devotion.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} falls to the plague {they} were fighting. {Their} sacrifice is remembered, but unfulfilled.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'ordeal.diplomats_maze',
    name: 'The Diplomat\'s Maze',
    locationTypes: ['throne_room', 'market', 'cathedral'],
    reachPrimary: 'heart',
    reachSecondary: 'gold',
    encounters: [
      {
        id: 'diplomats_maze.audience',
        name: 'The Audience',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE,
        narrative: '{actor} kneels before a {adj} ruler whose favor could reshape kingdoms. {They} must make a {adj} first impression.',
        onSuccess: {
          narrative: '{actor}\'s words {verb} through the throne room, and the ruler\'s eyes gleam with {adj} interest.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s words ring hollow. The ruler turns {their} gaze elsewhere, and the moment is lost.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'diplomats_maze.bargain',
        name: 'The Bargain',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        narrative: 'The ruler names {their} price. {actor} must negotiate a {adj} accord that satisfies both sides.',
        onSuccess: {
          narrative: '{actor} crafts an accord that {verb}s through both parties, {adj} and binding, sealing {their} triumph.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s bargain {verb}s apart. Neither side is satisfied, and {actor} is dismissed in {adj} disgrace.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'diplomats_maze.alliance',
        name: 'The Alliance',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        narrative: 'The ruler\'s enemies await. {actor} must forge an {adj} alliance that transforms {their} position.',
        onSuccess: {
          narrative: '{actor} unites the {adj} factions, and the ruler becomes {adj} with power, gratefully binding themselves to {actor}.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s alliance shatters before it can form. The ruler is left {adj} and {actor} is cast out.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'ordeal.starborn_vigil',
    name: 'The Starborn Vigil',
    locationTypes: ['hilltop', 'plain', 'tower', 'mountain'],
    reachPrimary: 'star',
    reachSecondary: 'veil',
    encounters: [
      {
        id: 'starborn_vigil.vigil',
        name: 'The Vigil',
        reach: 'star',
        difficulty: DIFFICULTY_BASE,
        narrative: '{actor} climbs to {adj} heights to witness the stars align. {They} must remain {adj} through the long night.',
        onSuccess: {
          narrative: '{actor}\'s patience is rewarded. The constellations {verb} and speak, and {actor} receives a {adj} sign.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s resolve falters. {They} descend before the alignment, and the moment is forever lost.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'starborn_vigil.revelation',
        name: 'The Revelation',
        reach: 'veil',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        narrative: 'The stars reveal {actor}\'s fate. {They} must confront a {adj} truth about {their} future.',
        onSuccess: {
          narrative: '{actor} accepts the {adj} revelation and {verb}s to fulfill the stars\' design with {adj} purpose.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} rejects the fate the stars have named. {They} descend {adj}, running from destiny.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'starborn_vigil.transcendence',
        name: 'The Transcendence',
        reach: 'star',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        narrative: 'The stars open a {adj} door. {actor} stands between worlds, and must choose which path to walk.',
        onSuccess: {
          narrative: '{actor} steps through the {adj} door, transformed and {adj}, bearing the stars\' blessing.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} falters in the liminal space. The door closes, and {they} return {adj} but incomplete.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
];

// ─── Cultural Ordeal Overlays ───────────────────────────────────

/**
 * 6 cultural vocabulary sets that modify encounter prose generation
 * without changing the underlying structure. Each covers foundation
 * sphere affinities (chaos, order, light, darkness) plus key creation
 * spheres (force, mind).
 */
export const CULTURAL_ORDEAL_OVERLAYS: Record<
  string,
  {
    adjectives: string[];
    verbs: string[];
    atmosphere: string;
  }
> = {
  chaos: {
    adjectives: ['wild', 'untamed', 'feverish', 'whirling', 'fractured'],
    verbs: ['tears', 'shatters', 'erupts', 'cascades', 'splinters'],
    atmosphere: 'Reality bends under forces too vast to control or predict.',
  },
  order: {
    adjectives: ['measured', 'pristine', 'exact', 'geometrical', 'immaculate'],
    verbs: ['aligns', 'crystallizes', 'locks', 'settles', 'resolves'],
    atmosphere: 'Every element falls into place with inexorable precision.',
  },
  light: {
    adjectives: ['radiant', 'luminous', 'blazing', 'pure', 'clear'],
    verbs: ['blazes', 'burns', 'illuminates', 'cleanses', 'reveals'],
    atmosphere: 'Truth and clarity cast all shadows into retreat.',
  },
  darkness: {
    adjectives: ['shrouded', 'murky', 'shadowed', 'hidden', 'obsidian'],
    verbs: ['conceals', 'devours', 'suffocates', 'corrupts', 'obscures'],
    atmosphere: 'Mystery and danger lurk in every crevice and silence.',
  },
  force: {
    adjectives: ['violent', 'crushing', 'relentless', 'thunderous', 'merciless'],
    verbs: ['smashes', 'crushes', 'obliterates', 'overwhelms', 'annihilates'],
    atmosphere: 'Raw power manifests without mercy or restraint.',
  },
  mind: {
    adjectives: ['subtle', 'intricate', 'labyrinthine', 'profound', 'arcane'],
    verbs: ['unravels', 'deciphers', 'perceives', 'comprehends', 'calculates'],
    atmosphere: 'Intellect and pattern recognition become the only weapons.',
  },
};

// ─── Ordeal Inspection Vignettes ────────────────────────────────
//
// Prose describing what a player/god observes when inspecting a location
// with active ordeal activity, completed success, or failed attempt.

export const ORDEAL_INSPECTION_VIGNETTES = {
  inProgress: [
    'The air thrums with barely-contained trial. A figure moves through the test, strain evident in every breath and gesture. The outcome hangs unresolved.',
    'Ritual markers glow faintly on the ground, pulsing with the cadence of the ordeal\'s progression. The candidate struggles forward, will against demand.',
    'The location crackles with sacred tension. An ordeal is underway—the veil between triumph and ruin paper-thin here.',
    'Threads of consequence shimmer around the ordeal. The outcome is not yet written; the candidate still pushes against their limit.',
    'The ground seems to hold its breath. An ordeal unfolds—a test older than kingdoms, demanding payment in will or blood.',
    'Unresolved power coils in this place. The ordeal is active; success is still possible, but the way is steep and uncertain.',
    'A figure stands at the threshold between trials, the ordeal\'s weight pressing down. The next moment will reshape them or break them.',
    'The location is thick with challenge and determination. An ordeal is being faced; the candidate is neither victor nor corpse—yet.',
    'Echoes of ancient tests linger here, now playing out again through a new candidate. The outcome remains suspended, waiting.',
    'The air smells of sweat and magic. An ordeal is underway—hope and despair both possible in the next heartbeat.',
  ],
  completed: [
    'The location is serene now, the ordeal\'s fire extinguished. A figure bears the marks of having passed through trial—scarred, changed, unmistakably stronger.',
    'This place remembers victory. The ordeal has been completed; remnants of challenge still linger, but the candidate walks freely, bearing the weight of their triumph.',
    'A glow of completion rests upon this location. The ordeal is finished; the candidate succeeded, and the land itself seems to acknowledge their new standing.',
    'The traces of trial have faded, leaving behind only the echo of a completed ordeal. The candidate moves with the certainty of having endured and prevailed.',
    'This location holds the silence of finished trials. The ordeal is complete; the candidate stands transformed, carrying proof of their passage in bearing and breath.',
  ],
  failed: [
    'The ground is scarred here, torn by an ordeal that ended in defeat. The candidate retreated or was cast back; failure clings to this place like ash.',
    'Something is broken here—not just in stone and structure, but in the air itself. An ordeal failed; the candidate was found wanting, and the trial\'s mercy is the only mercy they received.',
    'The location is hollow now, drained. An ordeal was attempted and did not end in victory. The candidate bears the invisible marks of trial that broke them.',
  ],
};

// ═══════════════════════════════════════════════════════════════════
// ORDEAL SYSTEM CONNECTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Connections between ordeals and other game systems: doom clock,
 * cultural forces, and rival god interference. These templates describe
 * how external forces shape or complicate an ordeal's outcome.
 */
export interface OrdealSystemConnection {
  id: string;
  trigger: string;
  prose: string;
}

export const ORDEAL_SYSTEM_CONNECTIONS: {
  doom: OrdealSystemConnection[];
  culture: OrdealSystemConnection[];
  rival: OrdealSystemConnection[];
} = {
  doom: [
    {
      id: 'doom_intensification',
      trigger: 'Rising doom clock (>60%) intensifies ordeal stakes',
      prose: 'The air thickens with dread. As doom rises, the ordeal\'s weight compounds—{location} itself seems to turn hostile, magic warping under pressure. {actor} must not merely pass the trial but do so before the world\'s collapse becomes complete.',
    },
    {
      id: 'doom_corruption',
      trigger: 'High doom (>80%) corrupts ordeal outcome',
      prose: 'The ordeal has been touched by the approaching unmaking. Reality flickers here; success feels possible, but fragile. Even if {actor} prevails, the victory tastes ashen—tainted by knowledge that the world itself might not survive to remember {their} triumph.',
    },
    {
      id: 'doom_acceleration',
      trigger: 'Ordeal completion (success or failure) accelerates doom by 5 ticks',
      prose: 'The {location} trembles as the ordeal concludes. Whether {actor} triumphed or fell, the trial\'s conclusion sends ripples outward—the doom clock ticks faster, as if the world must compress its reckoning into dwindling moments.',
    },
  ],
  culture: [
    {
      id: 'culture_facilitation',
      trigger: 'Ordeal\'s culture shares {actor}\'s cultural identity (>70% similarity)',
      prose: 'The ordeal speaks {actor}\'s language. The rituals, the methods, the values tested here align with {their} own culture\'s traditions. {They} move through the trial with native grace—threads of {their} people\'s wisdom guide each step, making the impossible merely difficult.',
    },
    {
      id: 'culture_opposition',
      trigger: 'Ordeal\'s culture opposes {actor}\'s cultural values (tension >0.6)',
      prose: 'The ordeal demands something {actor}\'s culture forbids. Each test feels like a betrayal of {their} own people. {They} must choose between honoring the tradition and passing the trial—a choice that will mark {them} forever in the eyes of {their} kind.',
    },
    {
      id: 'culture_transformation',
      trigger: 'Success in culturally opposed ordeal grants cultural trait',
      prose: 'By passing this ordeal on foreign terms, {actor} is reforged. The culture of the trial seeps into {their} bones—{they} carry back not just triumph but a piece of something alien, woven now into {their} identity. {They} are no longer purely what {they} were.',
    },
  ],
  rival: [
    {
      id: 'rival_interference',
      trigger: 'Rival god opposes {actor}\'s sphere (faction conflict)',
      prose: '{actor} is not alone in the ordeal. Phantom presence shadows every choice—a rival god, sensing vulnerability. The trial becomes a battleground; {actor} must overcome not just the ordeal\'s design but the subtle corruption that seeks to twist success into ruin.',
    },
    {
      id: 'rival_corruption',
      trigger: 'Rival agent stationed in ordeal location',
      prose: 'The ordeal has been corrupted from within. A servant of a rival god moves through the trial\'s spaces, ready to tip the scales. {actor} must not only face the test but navigate {their} presence—and decide whether to confront {them} directly or move unseen.',
    },
    {
      id: 'rival_escalation',
      trigger: 'Ordeal victory grants {rival god} 0.3 escalation in response',
      prose: 'As {actor} claims triumph, distant divine laughter echoes. A rival god recognizes the shift in power and rises to meet it. The victory is real—but {it} has been noticed, and the consequences ripple outward faster now. The game\'s stakes climb.',
    },
  ],
};

// ─── Lookup Functions ───────────────────────────────────────────

/**
 * Return all ordeals available at a given location type.
 */
export function getOrdealsByLocationType(locationType: string): OrdealDefinition[] {
  return ORDEAL_TEMPLATES.filter(ordeal =>
    ordeal.locationTypes.includes(locationType)
  );
}

/**
 * Retrieve a specific ordeal by ID.
 */
export function getOrdealById(id: string): OrdealDefinition | undefined {
  return ORDEAL_TEMPLATES.find(ordeal => ordeal.id === id);
}
