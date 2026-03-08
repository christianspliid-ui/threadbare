/**
 * Ordeal Content Package — 10 ordeal templates with 30 encounters and cultural vocabulary overlays.
 *
 * ═══════════════════════════════════════════════════════════════════
 * CONTENT MANAGER: This is the file you edit to change ordeal templates,
 * encounter sequences, difficulty curves, and cultural prose variations.
 * ═══════════════════════════════════════════════════════════════════
 */

import type { OrdealDefinition } from '../types/ordeal';

// ─── Tunable Constants ──────────────────────────────────────────

/** Difficulty progression within a template (escalates per encounter) */
const DIFFICULTY_BASE = 35;
const DIFFICULTY_STEP = 10;

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
