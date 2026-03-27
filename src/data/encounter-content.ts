/**
 * Encounter Content Package — 64 encounter templates with ~192 steps and cultural vocabulary overlays.
 *
 * ═══════════════════════════════════════════════════════════════════
 * CONTENT MANAGER: This is the file you edit to change encounter templates,
 * step sequences, difficulty curves, and cultural prose variations.
 * ═══════════════════════════════════════════════════════════════════
 */

import type { EncounterTemplate } from '../types/encounter';
import { ENCOUNTER_TYPE_MOTIVATIONS } from '../types/encounter';
import { getSocialEncounterById } from './social-encounter-content';
import { getFactionEncounterById } from './faction-encounter-content';

// ─── Types ──────────────────────────────────────────────────────────

/**
 * Difficulty tier for an encounter, including base multiplier and tone adjectives.
 */
export interface EncounterDifficultyTier {
  /** Multiplier applied to base difficulty (e.g., 0.8 for easier, 1.3 for harder) */
  difficultyMultiplier: number;
  /** Tone adjectives to flavor prose at this difficulty level */
  toneAdjectives: string[];
}

// ─── Tunable Constants ──────────────────────────────────────────

/** Difficulty progression within a template (escalates per step) */
const DIFFICULTY_BASE = 25;
const DIFFICULTY_STEP = 10;

// ─── System 6 Constants (Economic Encounters) ────────────────────────

/** Prosperity gain applied to the host settlement from Market Day Festival */
export const MARKET_FESTIVAL_PROSPERITY_BOOST = 5;

/**
 * PRNG probability of a new relates_to edge forming between each pair of
 * agents present at Market Day Festival. Seeded roll per pair per tick.
 */
export const MARKET_FESTIVAL_RELATIONSHIP_CHANCE = 0.3;

/** Resource quantity bonus on a successful Rich Vein discovery */
export const RICH_VEIN_RESOURCE_BONUS = 20;

/** Resource quantity penalty (and injury condition) on a Rich Vein collapse */
export const RICH_VEIN_COLLAPSE_PENALTY = 10;

// ─── 3 Difficulty Tiers ─────────────────────────────────────────

/**
 * Encounter difficulty tiers determine how challenging an encounter is and what tone it carries.
 * Used to flavor prose and adjust difficulty multipliers for encounter steps.
 */
export const ENCOUNTER_DIFFICULTY_TIERS: Record<string, EncounterDifficultyTier> = {
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

// ─── 10 Encounter Templates ───────────────────────────────────

/**
 * The 10 encounter archetypes cover all major domains and location types.
 * Each has 3 steps with escalating difficulty (35 → 45 → 55).
 */
export const ENCOUNTER_TEMPLATES: EncounterTemplate[] = [
  {
    id: 'encounter.deep_descent',
    name: 'The Deep Descent',
    locationTypes: ['ruins', 'ruined_tower', 'ruined_city', 'mining'],
    sublocationTypes: ['sublocation-type.dungeon'],
    reachPrimary: 'iron',
    reachSecondary: 'shadow',
    encounterType: 'explore',
    threatRating: 'moderate',
    motivations: ['courage_prudence', 'loyalty_ambition'],
    steps: [
      {
        id: 'deep_descent.entrance',
        name: 'The Entrance',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
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
        duration: 2,
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
        duration: 3,
        narrative: 'The descent ends at a chasm that {verb} with ancient hunger. {actor} stands at the precipice of ruin.',
        onSuccess: {
          narrative: '{actor} crosses the abyss with {adj} determination, claiming the artifact that rests in shadow below.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { condition: 0.4, bestowed_power: 0.4, possession: 0.2 },
            tagFilters: ['#ancient', '#underground'],
          },
        },
        onFailure: {
          narrative: 'The abyss {verb} and {actor} is cast back, {adj} and broken, to the light above.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { condition: 0.4, bestowed_power: 0.4, possession: 0.2 },
            tagFilters: ['#ancient', '#underground'],
          },
        },
      },
    ],
  },
  {
    id: 'encounter.trial_of_flame',
    name: 'Trial of Flame',
    locationTypes: ['mining', 'fort', 'camp'],
    sublocationTypes: ['sublocation-type.temple-quarter', 'sublocation-type.barracks'],
    reachPrimary: 'iron',
    reachSecondary: 'stone',
    encounterType: 'create',
    threatRating: 'moderate',
    motivations: ['courage_prudence', 'loyalty_ambition'],
    steps: [
      {
        id: 'trial_of_flame.ignition',
        name: 'The Ignition',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE,
        duration: 3,
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
        duration: 4,
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
        duration: 5,
        narrative: 'The master smith arrives. {actor} must remake a legendary weapon from a {adj} ruin of metal and myth.',
        onSuccess: {
          narrative: '{actor} transforms base material into legend, and the master nods in {adj} approval.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
          },
        },
        onFailure: {
          narrative: 'The forge rejects {actor}\'s touch. The metal {verb}s away, and mastery recedes.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.spirit_walk',
    name: 'The Spirit Walk',
    locationTypes: ['shrine', 'temple'],
    reachPrimary: 'veil',
    reachSecondary: 'heart',
    encounterType: 'explore',
    threatRating: 'moderate',
    motivations: ['courage_prudence', 'loyalty_ambition'],
    steps: [
      {
        id: 'spirit_walk.threshold',
        name: 'The Threshold',
        reach: 'veil',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
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
        duration: 2,
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
        duration: 3,
        narrative: 'The veil parts entirely. {actor} glimpses the unmaking and remaking of worlds in {adj} flux.',
        onSuccess: {
          narrative: '{actor} touches infinity and returns {adj}, forever changed, carrying the weight of eternity.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { condition: 0.4, bestowed_power: 0.4, possession: 0.2 },
            tagFilters: ['#spirit', '#mystic'],
          },
        },
        onFailure: {
          narrative: 'The vision overwhelms {actor}. They stumble back into flesh and breath, {adj} and diminished.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { condition: 0.4, bestowed_power: 0.4, possession: 0.2 },
            tagFilters: ['#spirit', '#mystic'],
          },
        },
      },
    ],
  },
  {
    id: 'encounter.merchants_gambit',
    name: 'Merchant\'s Gambit',
    locationTypes: ['town', 'city', 'capital', 'oasis'],
    reachPrimary: 'gold',
    reachSecondary: 'eye',
    encounterType: 'trade',
    threatRating: 'moderate',
    motivations: ['courage_prudence', 'loyalty_ambition'],
    steps: [
      {
        id: 'merchants_gambit.negotiation',
        name: 'The Negotiation',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
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
        duration: 2,
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
        duration: 1,
        narrative: 'A {adj} opportunity arrives: a shipment of contraband at {adj} prices. {actor} must decide between profit and principle.',
        onSuccess: {
          narrative: '{actor} refuses the gambit with {adj} rhetoric, earning the market\'s respect for integrity.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.9, condition: 0.1 },
          },
        },
        onFailure: {
          narrative: '{actor} accepts the deal. The cargo is seized, and scandal blackens their name.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 0.9, condition: 0.1 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.shadow_hunt',
    name: 'The Shadow Hunt',
    locationTypes: ['ruins', 'ruined_village', 'ruined_city', 'city'],
    reachPrimary: 'shadow',
    reachSecondary: 'star',
    encounterType: 'steal',
    threatRating: 'moderate',
    motivations: ['courage_prudence', 'loyalty_ambition'],
    steps: [
      {
        id: 'shadow_hunt.stalk',
        name: 'The Stalk',
        reach: 'shadow',
        difficulty: DIFFICULTY_BASE,
        duration: 2,
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
        duration: 1,
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
        duration: 1,
        narrative: '{actor}\'s prey reaches a {adj} stronghold. {They} must infiltrate, strike, and vanish like smoke.',
        onSuccess: {
          narrative: '{actor} becomes shadow itself, {adj} and deadly, claiming {their} prize and leaving no trace.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.7, condition: 0.3 },
            tagFilters: ['#shadow', '#stealth'],
          },
        },
        onFailure: {
          narrative: 'The stronghold erupts. {actor} flees {adj} and wounded, the job left incomplete.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 0.7, condition: 0.3 },
            tagFilters: ['#shadow', '#stealth'],
          },
        },
      },
    ],
  },
  {
    id: 'encounter.knowledge_test',
    name: 'The Knowledge Test',
    locationTypes: ['tower', 'temple', 'capital'],
    reachPrimary: 'eye',
    reachSecondary: 'veil',
    encounterType: 'explore',
    threatRating: 'moderate',
    motivations: ['courage_prudence', 'loyalty_ambition'],
    steps: [
      {
        id: 'knowledge_test.archives',
        name: 'The Archives',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
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
        duration: 2,
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
        duration: 3,
        narrative: '{actor} must weave together {adj} theories into a coherent whole, creating new understanding from chaos.',
        onSuccess: {
          narrative: '{actor} achieves a {adj} insight that reshapes the academy\'s understanding of reality itself.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { condition: 0.4, bestowed_power: 0.4, possession: 0.2 },
          },
        },
        onFailure: {
          narrative: '{actor}\'s synthesis collapses into {adj} contradiction. The academy rejects the work.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { condition: 0.4, bestowed_power: 0.4, possession: 0.2 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.warlords_crucible',
    name: 'The Warlord\'s Crucible',
    locationTypes: ['fort', 'castle', 'battleground'],
    reachPrimary: 'iron',
    reachSecondary: 'stone',
    encounterType: 'duel',
    threatRating: 'moderate',
    motivations: ['courage_prudence', 'loyalty_ambition'],
    steps: [
      {
        id: 'warlords_crucible.duel',
        name: 'The Duel',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
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
        duration: 1,
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
        duration: 1,
        narrative: 'The warlord arrives in {adj} fury. {actor} must defeat {them} to claim the fortress and title.',
        onSuccess: {
          narrative: '{actor} stands victorious over the {adj} warlord, the fortress now {their} own, {adj} and glorious.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { condition: 0.6, possession: 0.4 },
          },
        },
        onFailure: {
          narrative: '{actor} is cast down. The warlord {verb}s and they are cast into chains, {adj} and defeated.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { condition: 0.6, possession: 0.4 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.healers_oath',
    name: 'The Healer\'s Oath',
    locationTypes: ['temple', 'shrine'],
    sublocationTypes: ['sublocation-type.temple-quarter'],
    reachPrimary: 'flesh',
    reachSecondary: 'heart',
    encounterType: 'assist',
    threatRating: 'moderate',
    motivations: ['courage_prudence', 'loyalty_ambition'],
    steps: [
      {
        id: 'healers_oath.diagnosis',
        name: 'The Diagnosis',
        reach: 'flesh',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
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
        duration: 3,
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
        duration: 4,
        narrative: 'A {adj} plague spreads. {actor} must tend {their} own wounds while {they} heal the {adj} masses.',
        onSuccess: {
          narrative: '{actor} stands {adj} at the end, having pulled the city back from the brink through {adj} devotion.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { blessing: 0.6, condition: 0.4 },
          },
        },
        onFailure: {
          narrative: '{actor} falls to the plague {they} were fighting. {Their} sacrifice is remembered, but unfulfilled.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { blessing: 0.6, condition: 0.4 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.diplomats_maze',
    name: 'The Diplomat\'s Maze',
    locationTypes: ['capital', 'city', 'town'],
    sublocationTypes: ['sublocation-type.throne-room'],
    reachPrimary: 'heart',
    reachSecondary: 'gold',
    encounterType: 'lead',
    threatRating: 'moderate',
    motivations: ['courage_prudence', 'loyalty_ambition'],
    steps: [
      {
        id: 'diplomats_maze.audience',
        name: 'The Audience',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE,
        duration: 2,
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
        duration: 4,
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
        duration: 5,
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
    id: 'encounter.starborn_vigil',
    name: 'The Starborn Vigil',
    locationTypes: ['tower', 'fort', 'castle', 'camp'],
    sublocationTypes: ['sublocation-type.temple-quarter'],
    reachPrimary: 'star',
    reachSecondary: 'veil',
    encounterType: 'explore',
    threatRating: 'moderate',
    motivations: ['courage_prudence', 'loyalty_ambition'],
    steps: [
      {
        id: 'starborn_vigil.vigil',
        name: 'The Vigil',
        reach: 'star',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
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
        duration: 2,
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
        duration: 3,
        narrative: 'The stars open a {adj} door. {actor} stands between worlds, and must choose which path to walk.',
        onSuccess: {
          narrative: '{actor} steps through the {adj} door, transformed and {adj}, bearing the stars\' blessing.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { condition: 0.4, bestowed_power: 0.4, possession: 0.2 },
            tagFilters: ['#celestial', '#mystic'],
          },
        },
        onFailure: {
          narrative: '{actor} falters in the liminal space. The door closes, and {they} return {adj} but incomplete.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { condition: 0.4, bestowed_power: 0.4, possession: 0.2 },
            tagFilters: ['#celestial', '#mystic'],
          },
        },
      },
    ],
  },
  // ────────────────────────────────────────────────────────────────────
  // ACQUIRE (8 new templates)
  // ────────────────────────────────────────────────────────────────────
  {
    id: 'encounter.market_haggle',
    name: 'The Market Haggle',
    locationTypes: ['town', 'city', 'capital', 'oasis'],
    sublocationTypes: ['sublocation-type.market-district'],
    reachPrimary: 'gold',
    reachSecondary: 'heart',
    encounterType: 'acquire',
    threatRating: 'easy',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.acquire,
    steps: [
      {
        id: 'market_haggle.entrance',
        name: 'The Entrance',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: 'The marketplace seethes with {adj} commerce. {actor} spots a {adj} merchant with goods they desire.',
        onSuccess: {
          narrative: '{actor} approaches with {adj} confidence, catching the merchant\'s eye immediately.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s opening offer rings {adj}. The merchant dismisses {them} with a {adj} glance.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'market_haggle.exchange',
        name: 'The Exchange',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: '{actor} must navigate the {adj} dance of value and desire, matching the merchant\'s wit.',
        onSuccess: {
          narrative: '{actor} finds the {adj} middle ground—both parties smile, the deal sealed with {adj} satisfaction.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} overreaches or undershoots. The merchant\'s {adj} expression hardens, the negotiation {verb}s.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'market_haggle.closing',
        name: 'The Closing',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 3,
        narrative: 'A {adj} rival appears, offering more for the same goods. {actor} must secure the prize or lose all.',
        onSuccess: {
          narrative: '{actor} outbids {their} rival with a {adj} flourish. The merchant {verb}s the goods to {actor} with {adj} respect.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
          },
        },
        onFailure: {
          narrative: '{actor} is outmaneuvered. The rival claims the goods, and {actor} leaves the market {adj} and empty-handed.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.relic_hunt',
    name: 'The Relic Hunt',
    locationTypes: ['ruins', 'ruined_tower', 'ruined_city'],
    sublocationTypes: ['sublocation-type.dungeon', 'sublocation-type.library'],
    reachPrimary: 'eye',
    reachSecondary: 'shadow',
    encounterType: 'acquire',
    threatRating: 'moderate',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.acquire,
    steps: [
      {
        id: 'relic_hunt.discovery',
        name: 'The Discovery',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: 'Ancient ruins sprawl before {actor}. Somewhere in the {adj} depths lies a relic of {adj} power.',
        onSuccess: {
          narrative: '{actor}\'s {adj} gaze pierces through debris and shadow, spotting the relic\'s faint gleam.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} searches the rubble in vain. The relic remains hidden, mocking {their} {adj} efforts.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'relic_hunt.retrieval',
        name: 'The Retrieval',
        reach: 'shadow',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'The path to the relic is {adj} and perilous—guarded by ancient traps or {adj} spirits.',
        onSuccess: {
          narrative: '{actor} moves with {adj} stealth, unmaking traps and appeasing guardians. The relic is {their}s.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'A trap {verb}s as {actor} reaches for the relic. {They} flee the ruins {adj} and wounded.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'relic_hunt.escape',
        name: 'The Escape',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 3,
        narrative: 'The ruins are collapsing. {actor} clutches the relic and must navigate the {adj} chaos to escape.',
        onSuccess: {
          narrative: '{actor} races through the crumbling stone, the relic {adj} in {their} grasp, and emerges triumphant.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
          },
        },
        onFailure: {
          narrative: 'The relic slips from {actor}\'s hands into the chasm. {They} emerge from the ruins {adj}, {their} prize lost.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.harvest_bounty',
    name: 'The Harvest Bounty',
    locationTypes: ['farmland', 'hamlet', 'oasis'],
    reachPrimary: 'flesh',
    reachSecondary: 'stone',
    encounterType: 'acquire',
    threatRating: 'trivial',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.acquire,
    steps: [
      {
        id: 'harvest_bounty.gathering',
        name: 'The Gathering',
        reach: 'flesh',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} stands in a {adj} field heavy with ripe bounty. The harvest calls.',
        onSuccess: {
          narrative: '{actor} works the {adj} earth, gathering the finest fruits and grains with practiced ease.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s hands are {adj} and clumsy. Much of the harvest is spoiled by {their} carelessness.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'harvest_bounty.preservation',
        name: 'The Preservation',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: '{actor} must prepare the bounty for storage—a {adj} task requiring knowledge of seasons and preservation.',
        onSuccess: {
          narrative: '{actor} stores the harvest with {adj} wisdom, ensuring nothing is lost to rot or pest.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s methods are {adj}. Half the harvest {verb}s to decay before winter arrives.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'harvest_bounty.surplus',
        name: 'The Surplus',
        reach: 'flesh',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 3,
        narrative: '{actor} discovers a {adj} surplus hidden in the fields—a fortune for those who claim it.',
        onSuccess: {
          narrative: '{actor} discovers and secures the {adj} surplus, blessing the settlement and {their} own wealth.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
            tagFilters: ['#nature', '#survival'],
          },
        },
        onFailure: {
          narrative: '{actor} finds the surplus but cannot carry it. Rival claimants arrive, and the prize is {adj} lost.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
            tagFilters: ['#nature', '#survival'],
          },
        },
      },
    ],
  },
  {
    id: 'encounter.spell_bargain',
    name: 'The Spell Bargain',
    locationTypes: ['tower', 'temple', 'shrine'],
    reachPrimary: 'veil',
    reachSecondary: 'gold',
    encounterType: 'acquire',
    threatRating: 'moderate',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.acquire,
    steps: [
      {
        id: 'spell_bargain.petition',
        name: 'The Petition',
        reach: 'veil',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} seeks out a {adj} mage or priest, hoping to bargain for a spell of {adj} power.',
        onSuccess: {
          narrative: '{actor} makes a {adj} impression with {their} request. The mage leans forward with {adj} interest.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s plea falls flat. The mage dismisses {them} as {adj} and unworthy.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'spell_bargain.negotiation',
        name: 'The Negotiation',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'The mage names {their} price—{adj} and steep. {actor} must find a way to bridge the gap.',
        onSuccess: {
          narrative: '{actor} {verb}s a {adj} bargain, offering something the mage cannot refuse. The spell is {their}s.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s offer is {adj}. The mage rejects it, and the spell remains out of reach.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'spell_bargain.binding',
        name: 'The Binding',
        reach: 'veil',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 3,
        narrative: 'The mage begins the ritual, binding the spell to {actor}\'s will. {actor} must endure the {adj} flow of magic.',
        onSuccess: {
          narrative: '{actor} accepts the spell\'s power with {adj} grace. The binding completes, and {they} emerge {adj} transformed.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
          },
        },
        onFailure: {
          narrative: 'The magic {verb}s against {actor}\'s will. The binding fails, and {they} collapse {adj} and broken.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.war_trophy',
    name: 'The War Trophy',
    locationTypes: ['battleground', 'fort', 'castle'],
    sublocationTypes: ['sublocation-type.barracks'],
    reachPrimary: 'iron',
    reachSecondary: 'shadow',
    encounterType: 'acquire',
    threatRating: 'hard',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.acquire,
    steps: [
      {
        id: 'war_trophy.claim',
        name: 'The Claim',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} stands over the {adj} spoils of war. A legendary trophy lies within reach, but others covet it.',
        onSuccess: {
          narrative: '{actor} seizes the trophy with {adj} authority. Those present step back, acknowledging {their} claim.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s grasp is {adj}. A rival warrior contests {their} claim, and a struggle begins.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'war_trophy.contest',
        name: 'The Contest',
        reach: 'shadow',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'The rival will not yield. {actor} must outmaneuver {them} through {adj} tactics and cunning.',
        onSuccess: {
          narrative: '{actor} {verb}s the rival\'s defenses with {adj} precision, claiming victory and the trophy.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s tactics fail. The rival seizes the trophy and escapes with a {adj} laugh.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'war_trophy.possession',
        name: 'The Possession',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 3,
        narrative: 'The trophy is {adj} with ancient power. {actor} must hold it against those who would reclaim it.',
        onSuccess: {
          narrative: '{actor} stands {adj} with the trophy in {their} grip, all challengers cowed by {their} {adj} aura.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
          },
        },
        onFailure: {
          narrative: 'The trophy\'s power {verb}s from {actor}\'s grasp. It is lost to the chaos, and {actor} emerges {adj} and diminished.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.sacred_offering',
    name: 'The Sacred Offering',
    locationTypes: ['shrine', 'temple'],
    reachPrimary: 'veil',
    reachSecondary: 'heart',
    encounterType: 'acquire',
    threatRating: 'easy',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.acquire,
    steps: [
      {
        id: 'sacred_offering.preparation',
        name: 'The Preparation',
        reach: 'spirit',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} prepares an offering for a {adj} spirit or saint—something that reflects {their} devotion.',
        onSuccess: {
          narrative: '{actor} selects the {adj} offering with care and reverence. The spirit stirs, sensing {their} intent.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s offering is {adj} and thoughtless. The spirit\'s presence dims, {their} intent unheeded.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'sacred_offering.ritual',
        name: 'The Ritual',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: '{actor} must perform the {adj} ritual with {adj} sincerity, speaking words that matter.',
        onSuccess: {
          narrative: '{actor}\'s ritual {verb}s true. The spirit {verb}s down and accepts the offering with {adj} grace.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s words ring hollow. The ritual fails, and the spirit withdraws in {adj} silence.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'sacred_offering.blessing',
        name: 'The Blessing',
        reach: 'spirit',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 3,
        narrative: 'The spirit grants a {adj} blessing—but it comes with a price only {actor} can pay.',
        onSuccess: {
          narrative: '{actor} accepts the {adj} price with {adj} courage. The blessing flows through {them}, transforming {their} fate.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
          },
        },
        onFailure: {
          narrative: '{actor} cannot pay the price. The blessing {verb}s away, and {they} are left {adj} and cursed.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.rare_material',
    name: 'The Rare Material',
    locationTypes: ['mining', 'camp', 'wilderness'],
    reachPrimary: 'stone',
    reachSecondary: 'gold',
    encounterType: 'acquire',
    threatRating: 'moderate',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.acquire,
    steps: [
      {
        id: 'rare_material.search',
        name: 'The Search',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} hunts for {adj} ore or material in a {adj} location. Legend says it can be found here.',
        onSuccess: {
          narrative: '{actor}\'s search {verb}s true. {They} spot the {adj} glint of rare material among the stone.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} searches fruitlessly. The material remains hidden, and frustration mounts.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'rare_material.extraction',
        name: 'The Extraction',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'Extracting the material is {adj} and requires both {adj} technique and negotiation with {adj} locals.',
        onSuccess: {
          narrative: '{actor} {verb}s a {adj} deal with locals and extracts the material with {adj} skill.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s attempt {verb}s the material into fragments. {They} collect what {they} can, but {adj} much is lost.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'rare_material.transport',
        name: 'The Transport',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 3,
        narrative: '{actor} must transport the {adj} material through {adj} terrain without it being stolen or damaged.',
        onSuccess: {
          narrative: '{actor} {verb}s the material safely to market, claiming a {adj} fortune for {their} prize.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
            tagFilters: ['#nature', '#survival'],
          },
        },
        onFailure: {
          narrative: 'Thieves or disaster strike. {actor} arrives with {adj} material or none at all, {their} profit {adj}.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
            tagFilters: ['#nature', '#survival'],
          },
        },
      },
    ],
  },
  {
    id: 'encounter.forbidden_tome',
    name: 'The Forbidden Tome',
    locationTypes: ['tower', 'ruins', 'capital'],
    reachPrimary: 'eye',
    reachSecondary: 'veil',
    encounterType: 'acquire',
    threatRating: 'hard',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.acquire,
    steps: [
      {
        id: 'forbidden_tome.location',
        name: 'The Location',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} is hunting a {adj} tome said to hold {adj} secrets. {They} must find where it is kept.',
        onSuccess: {
          narrative: '{actor}\'s {adj} intellect uncovers the tome\'s location. The path is {adj}, but visible.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s search yields only {adj} clues. The tome\'s location remains obscured.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'forbidden_tome.infiltration',
        name: 'The Infiltration',
        reach: 'veil',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'The tome is guarded by {adj} magic and {adj} servants. {actor} must slip past {their} protections.',
        onSuccess: {
          narrative: '{actor} navigates the {adj} defenses with {adj} cunning, reaching the tome\'s resting place.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'A guardian {verb}s and catches {actor}. {They} flee, {adj} and empty-handed, alarms ringing behind {them}.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'forbidden_tome.claiming',
        name: 'The Claiming',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 3,
        narrative: 'The tome is {adj} and seems to resist being held. {actor} must claim it and escape before discovery.',
        onSuccess: {
          narrative: '{actor} {verb}s the tome\'s resistance and {verb}s free with the {adj} prize, knowledge itself now {their}s.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
            tagFilters: ['#ancient', '#arcane'],
          },
        },
        onFailure: {
          narrative: 'The tome\'s curse {verb}s at {actor}. {They} flee with {adj} wounds, the tome lost to the darkness.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
            tagFilters: ['#ancient', '#arcane'],
          },
        },
      },
    ],
  },
  // ────────────────────────────────────────────────────────────────────
  // CREATE (5 new templates; trial_of_flame is already in initial 10)
  // ────────────────────────────────────────────────────────────────────
  {
    id: 'encounter.brew_potion',
    name: 'The Brew Potion',
    locationTypes: ['hamlet', 'shrine', 'camp'],
    reachPrimary: 'flesh',
    reachSecondary: 'veil',
    encounterType: 'create',
    threatRating: 'easy',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.create,
    steps: [
      {
        id: 'brew_potion.gathering',
        name: 'The Gathering',
        reach: 'flesh',
        difficulty: DIFFICULTY_BASE,
        duration: 3,
        narrative: '{actor} must gather {adj} ingredients for a {adj} potion—herbs that only grow in {adj} places.',
        onSuccess: {
          narrative: '{actor} forages with {adj} skill, finding the {adj} ingredients needed.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s gathering is {adj}. Key ingredients are {adj} or missing.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'brew_potion.brewing',
        name: 'The Brewing',
        reach: 'veil',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 4,
        narrative: '{actor} must blend the ingredients with {adj} intent, asking the magic to answer {their} will.',
        onSuccess: {
          narrative: '{actor} stirs the cauldron with {adj} precision. The potion {verb}s with {adj} power.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s brewing fails. The mixture {verb}s into {adj} uselessness.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'brew_potion.distillation',
        name: 'The Distillation',
        reach: 'flesh',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 5,
        narrative: 'The potion must be distilled to {adj} potency. {actor} must refine it without losing the magic.',
        onSuccess: {
          narrative: '{actor} bottles a {adj} potion, {adj} and alive with power, a masterwork of the brewer\'s art.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#arcane', '#nature'],
          },
        },
        onFailure: {
          narrative: 'The potion {verb}s during distillation. {actor} is left with only {adj} residue.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#arcane', '#nature'],
          },
        },
      },
    ],
  },
  {
    id: 'encounter.inscribe_ward',
    name: 'The Inscribe Ward',
    locationTypes: ['tower', 'temple', 'ruins'],
    reachPrimary: 'veil',
    reachSecondary: 'eye',
    encounterType: 'create',
    threatRating: 'hard',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.create,
    steps: [
      {
        id: 'inscribe_ward.knowledge',
        name: 'The Knowledge',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE,
        duration: 3,
        narrative: '{actor} seeks to inscribe a {adj} protective ward. {They} must first learn its {adj} design from ancient texts.',
        onSuccess: {
          narrative: '{actor}\'s study {verb}s with {adj} revelation. The ward\'s design becomes {adj} clear.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s study yields only {adj} understanding. The design remains {adj} and incomplete.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'inscribe_ward.inscription',
        name: 'The Inscription',
        reach: 'veil',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 4,
        narrative: '{actor} must inscribe the ward with {adj} precision, every symbol {adj} and exact.',
        onSuccess: {
          narrative: '{actor}\'s hand {verb}s with {adj} control. The ward {verb}s to life, {adj} and complete.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s hand slips. A symbol {verb}s wrong, and the ward {verb}s inert.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'inscribe_ward.activation',
        name: 'The Activation',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 5,
        narrative: '{actor} must activate the {adj} ward with a {adj} ritual, binding it to the place\'s very essence.',
        onSuccess: {
          narrative: '{actor}\'s ritual {verb}s and the ward {verb}s {adj} and eternal, protection secured.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#arcane'],
          },
        },
        onFailure: {
          narrative: 'The activation {verb}s the ward\'s structure. {actor}\'s work {verb}s into {adj} ruin.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#arcane'],
          },
        },
      },
    ],
  },
  {
    id: 'encounter.compose_saga',
    name: 'The Compose Saga',
    locationTypes: ['town', 'city', 'capital'],
    reachPrimary: 'heart',
    reachSecondary: 'eye',
    encounterType: 'create',
    threatRating: 'easy',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.create,
    steps: [
      {
        id: 'compose_saga.inspiration',
        name: 'The Inspiration',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE,
        duration: 3,
        narrative: '{actor} seeks to compose a {adj} saga that will move hearts. First, {they} must find {adj} inspiration.',
        onSuccess: {
          narrative: '{actor}\'s heart {verb}s with {adj} inspiration. The story\'s shape becomes {adj} clear.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s inspiration remains {adj}. The story will not {verb}.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'compose_saga.composition',
        name: 'The Composition',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 4,
        narrative: '{actor} must weave the inspiration into a {adj} narrative, crafting every word with {adj} care.',
        onSuccess: {
          narrative: '{actor}\'s pen {verb}s across parchment, the saga {verb}s into {adj} being.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s words ring {adj}. The saga fails to capture the {adj} vision.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'compose_saga.performance',
        name: 'The Performance',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 5,
        narrative: '{actor} must perform the saga before a {adj} crowd. Can {their} words move hearts?',
        onSuccess: {
          narrative: '{actor}\'s voice {verb}s through the crowd. The saga becomes {adj} legend, and the people {verb} in tears.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
          },
        },
        onFailure: {
          narrative: '{actor}\'s performance is {adj}. The crowd grows {adj} and silent, the saga forgotten.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.craft_talisman',
    name: 'The Craft Talisman',
    locationTypes: ['shrine', 'camp', 'wilderness'],
    reachPrimary: 'veil',
    reachSecondary: 'veil',
    encounterType: 'create',
    threatRating: 'moderate',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.create,
    steps: [
      {
        id: 'craft_talisman.communion',
        name: 'The Communion',
        reach: 'spirit',
        difficulty: DIFFICULTY_BASE,
        duration: 3,
        narrative: '{actor} seeks to craft a {adj} talisman. First, {they} must commune with the spirit that will inhabit it.',
        onSuccess: {
          narrative: '{actor}\'s spirit {verb}s with the other. The communion is {adj} and true.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s communion is {adj}. The spirit refuses to answer.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'craft_talisman.creation',
        name: 'The Creation',
        reach: 'veil',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 4,
        narrative: '{actor} must shape the talisman\'s material form, binding the spirit into {adj} reality.',
        onSuccess: {
          narrative: '{actor}\'s hands {verb} with {adj} precision. The talisman takes shape, the spirit {adj} within.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s shaping is {adj}. The spirit grows {adj} and the talisman {verb}s apart.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'craft_talisman.binding',
        name: 'The Binding',
        reach: 'spirit',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 5,
        narrative: '{actor} must complete the binding, sealing the spirit into the talisman with a {adj} oath.',
        onSuccess: {
          narrative: '{actor}\'s oath {verb}s and the talisman becomes {adj} and alive, ready to serve.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#arcane', '#mystic'],
          },
        },
        onFailure: {
          narrative: 'The binding {verb}s. The spirit flees, and {actor} is left with an {adj} husk.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#arcane', '#mystic'],
          },
        },
      },
    ],
  },
  {
    id: 'encounter.raise_monument',
    name: 'The Raise Monument',
    locationTypes: ['capital', 'city', 'battleground'],
    reachPrimary: 'stone',
    reachSecondary: 'star',
    encounterType: 'create',
    threatRating: 'hard',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.create,
    steps: [
      {
        id: 'raise_monument.design',
        name: 'The Design',
        reach: 'star',
        difficulty: DIFFICULTY_BASE,
        duration: 3,
        narrative: '{actor} must design a {adj} monument to {adj} significance. The design must be {adj} and lasting.',
        onSuccess: {
          narrative: '{actor}\'s vision {verb}s {adj} and eternal. The design is {adj} and inspiring.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s design is {adj}. The vision lacks {adj} and power.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'raise_monument.construction',
        name: 'The Construction',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 4,
        narrative: '{actor} must oversee the construction, gathering {adj} workers and {adj} materials.',
        onSuccess: {
          narrative: '{actor}\'s leadership {verb}s {adj} completion. The monument {verb}s {adj} toward the sky.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s oversight is {adj}. The construction {verb}s into {adj} and the workers scatter.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'raise_monument.dedication',
        name: 'The Dedication',
        reach: 'star',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 5,
        narrative: '{actor} must dedicate the {adj} monument before a {adj} crowd, binding it to memory and myth.',
        onSuccess: {
          narrative: '{actor}\'s dedication {verb}s true. The monument becomes {adj} legend, standing against time itself.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
          },
        },
        onFailure: {
          narrative: '{actor}\'s dedication falls {adj}. The monument {verb}s under its own weight, incomplete.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
          },
        },
      },
    ],
  },
  // ────────────────────────────────────────────────────────────────────
  // HIRE (6 templates, all new)
  // ────────────────────────────────────────────────────────────────────
  {
    id: 'encounter.recruit_militia',
    name: 'The Recruit Militia',
    locationTypes: ['hamlet', 'town', 'farmland'],
    reachPrimary: 'heart',
    reachSecondary: 'iron',
    encounterType: 'hire',
    threatRating: 'easy',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.hire,
    steps: [
      {
        id: 'recruit_militia.selection',
        name: 'The Selection',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} seeks to recruit {adj} fighters for a militia. {They} must identify who has {adj} potential.',
        onSuccess: {
          narrative: '{actor} spots {adj} candidates with {adj} promise. The selection begins with {adj} enthusiasm.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s recruitment call falls {adj}. Few answer, and those who do seem {adj} and uncertain.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'recruit_militia.training',
        name: 'The Training',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: '{actor} must train the {adj} recruits into {adj} fighters, pushing them beyond {their} limits.',
        onSuccess: {
          narrative: '{actor}\'s training {verb}s the recruits into {adj} warriors. They move with {adj} discipline.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s methods are {adj}. The recruits {verb} away, and the militia {verb}s apart.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'recruit_militia.commitment',
        name: 'The Commitment',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: '{actor} must secure the militia\'s commitment to {adj} purpose. Will they follow unto {adj} battle?',
        onSuccess: {
          narrative: '{actor}\'s oath {verb}s {adj} and true. The militia kneel, {their} loyalty now {adj} and absolute.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s oath rings {adj}. The militia {verb}s and scatters, refusing to commit.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.sway_mercenary',
    name: 'The Sway Mercenary',
    locationTypes: ['camp', 'battleground', 'fort'],
    reachPrimary: 'gold',
    reachSecondary: 'iron',
    encounterType: 'hire',
    threatRating: 'moderate',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.hire,
    steps: [
      {
        id: 'sway_mercenary.approach',
        name: 'The Approach',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} seeks a {adj} mercenary band. {They} must approach with the {adj} offer.',
        onSuccess: {
          narrative: '{actor}\'s offer catches {their} interest. The captain leans forward with {adj} curiosity.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s offer is {adj}. The captain dismisses {them} with a {adj} laugh.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'sway_mercenary.negotiation',
        name: 'The Negotiation',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: '{actor} must negotiate with the {adj} captain, proving {their} worth and {their} cause.',
        onSuccess: {
          narrative: '{actor} {verb}s the captain\'s doubts. The mercenaries agree to serve, {adj} and willing.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s negotiation {verb}s into {adj} conflict. The mercenaries refuse and turn {their} blades.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'sway_mercenary.loyalty',
        name: 'The Loyalty',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: '{actor} must ensure the mercenaries\' loyalty will hold through {adj} trials. Will {they} betray?',
        onSuccess: {
          narrative: '{actor} seals the pact with {adj} payment and {adj} purpose. The mercenaries are {their}s, {adj} and true.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s loyalty falls {adj}. The mercenaries take the payment and {verb} into the night.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.court_noble',
    name: 'The Court Noble',
    locationTypes: ['capital', 'city', 'castle'],
    reachPrimary: 'heart',
    reachSecondary: 'gold',
    encounterType: 'hire',
    threatRating: 'hard',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.hire,
    steps: [
      {
        id: 'court_noble.presentation',
        name: 'The Presentation',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} must present {themselves} to a {adj} noble and make a {adj} first impression.',
        onSuccess: {
          narrative: '{actor}\'s presentation is {adj}. The noble\'s eyes glimmer with {adj} interest.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s presentation is {adj}. The noble\'s gaze turns to {adj} disinterest.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'court_noble.demonstration',
        name: 'The Demonstration',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: '{actor} must demonstrate {their} worth to the noble, {adj} and without doubt.',
        onSuccess: {
          narrative: '{actor}\'s demonstration {verb}s the noble\'s {adj} expectations. {They} nod with {adj} approval.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s demonstration is {adj}. The noble finds {them} {adj} and unworthy.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'court_noble.service',
        name: 'The Service',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'The noble offers {actor} a {adj} position, but at a {adj} price. Will {actor} accept {their} terms?',
        onSuccess: {
          narrative: '{actor} accepts the position with {adj} grace. The noble binds {them} to service, {adj} and honored.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} cannot accept the {adj} price. The noble {verb}s in rage, and {their} patron is forever lost.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.bind_spirit',
    name: 'The Bind Spirit',
    locationTypes: ['shrine', 'temple', 'tower'],
    reachPrimary: 'veil',
    reachSecondary: 'veil',
    encounterType: 'hire',
    threatRating: 'hard',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.hire,
    steps: [
      {
        id: 'bind_spirit.summoning',
        name: 'The Summoning',
        reach: 'spirit',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} seeks to summon a {adj} spirit and bind it to {their} service. The ritual begins.',
        onSuccess: {
          narrative: '{actor}\'s summoning {verb}s {adj} through the veil. A spirit answers, {adj} and present.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s summoning is {adj}. No spirit answers, and only {adj} silence replies.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'bind_spirit.negotiation',
        name: 'The Negotiation',
        reach: 'veil',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: '{actor} must negotiate with the {adj} spirit, offering what it desires in exchange for service.',
        onSuccess: {
          narrative: '{actor}\'s offer {verb}s the spirit\'s {adj} heart. It agrees to serve with {adj} binding words.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s offer is {adj}. The spirit laughs and {verb}s back through the veil.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'bind_spirit.binding',
        name: 'The Binding',
        reach: 'spirit',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: '{actor} must seal the binding with a {adj} oath, tying the spirit to {their} will.',
        onSuccess: {
          narrative: '{actor}\'s oath {verb}s eternal. The spirit is bound, {adj} and obedient, forever in {actor}\'s service.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The binding {verb}s. The spirit breaks free and flees, leaving {actor} {adj} and powerless.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.rally_faithful',
    name: 'The Rally Faithful',
    locationTypes: ['temple', 'shrine', 'town'],
    reachPrimary: 'veil',
    reachSecondary: 'heart',
    encounterType: 'hire',
    threatRating: 'moderate',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.hire,
    steps: [
      {
        id: 'rally_faithful.preaching',
        name: 'The Preaching',
        reach: 'spirit',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} preaches to the {adj} faithful, stirring {their} {adj} hearts.',
        onSuccess: {
          narrative: '{actor}\'s sermon {verb}s {adj} and true. The faithful rise, {their} faith {adj} and absolute.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s sermon rings {adj}. The faithful remain {adj}, unconvinced.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'rally_faithful.organization',
        name: 'The Organization',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: '{actor} must organize the faithful into {adj} followers, giving {their} fervor {adj} direction.',
        onSuccess: {
          narrative: '{actor}\'s organization {verb}s the faithful into {adj} unity. They move as one, {adj} and devoted.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s organization is {adj}. The faithful scatter, {their} fervor {verb}s into dissent.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'rally_faithful.mission',
        name: 'The Mission',
        reach: 'spirit',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: '{actor} must send the faithful on a {adj} mission. Will {they} follow unto {adj} trials?',
        onSuccess: {
          narrative: '{actor}\'s mission {verb}s {adj} devotion. The faithful march, {their} faith {adj} and unbreakable.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s mission asks too much. The faithful {verb} and scatter, {their} devotion {adj} and broken.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.hire_guide',
    name: 'The Hire Guide',
    locationTypes: ['wilderness', 'oasis', 'camp'],
    reachPrimary: 'star',
    reachSecondary: 'gold',
    encounterType: 'hire',
    threatRating: 'trivial',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.hire,
    steps: [
      {
        id: 'hire_guide.search',
        name: 'The Search',
        reach: 'star',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} seeks a {adj} guide who knows the {adj} terrain. {They} must find someone {adj} and trustworthy.',
        onSuccess: {
          narrative: '{actor} finds a {adj} guide with {adj} knowledge. {They} agree to meet.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s search yields only {adj} guides. Their knowledge is {adj} and unreliable.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'hire_guide.negotiation',
        name: 'The Negotiation',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: '{actor} must negotiate a {adj} price with the guide. Both parties must find {adj} terms.',
        onSuccess: {
          narrative: '{actor} negotiates {adj} deal. The guide agrees to serve with {adj} enthusiasm.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s negotiation is {adj}. The guide demands {adj} price or refuses to serve.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'hire_guide.journey',
        name: 'The Journey',
        reach: 'star',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: '{actor} travels with the guide through {adj} terrain. Will {they} stay the course?',
        onSuccess: {
          narrative: '{actor}\'s journey {verb}s {adj}. The guide proves {adj} and {their} knowledge {adj}.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s journey becomes {adj}. The guide {verb}s away or proves {adj} and unreliable.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  // ────────────────────────────────────────────────────────────────────
  // DUEL (6 new; warlords_crucible is already in initial 10)
  // ────────────────────────────────────────────────────────────────────
  {
    id: 'encounter.tavern_brawl',
    name: 'The Tavern Brawl',
    locationTypes: ['town', 'hamlet', 'camp'],
    reachPrimary: 'iron',
    reachSecondary: 'flesh',
    encounterType: 'duel',
    threatRating: 'easy',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        id: 'tavern_brawl.provocation',
        name: 'The Provocation',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: 'A {adj} drunk at the tavern insults {actor} with {adj} words. A fight looms.',
        onSuccess: {
          narrative: '{actor} stands with {adj} presence. The drunk shrinks back, {their} friends uncertain.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s response is {adj}. The drunk {verb}s in rage and throws the first punch.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'tavern_brawl.fighting',
        name: 'The Fighting',
        reach: 'flesh',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 1,
        narrative: '{actor} must fight the {adj} drunk and {their} {adj} friends in the tavern\'s {adj} chaos.',
        onSuccess: {
          narrative: '{actor}\'s fists {verb} {adj} and {adj}. {They} leave the drunk and friends on the floor, {adj} but victorious.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} is overwhelmed. {They} are thrown from the tavern {adj} and bleeding.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'tavern_brawl.aftermath',
        name: 'The Aftermath',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'The tavern keeper appears, {adj} with rage. {actor} must face {adj} consequences.',
        onSuccess: {
          narrative: '{actor} {verb}s the tavern keeper\'s anger with {adj} words. {They} pay for damages and leave {adj} and respected.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { condition: 0.6, possession: 0.4 },
          },
        },
        onFailure: {
          narrative: '{actor} cannot appease the keeper. {They} are thrown out, banned from the tavern {adj} and ashamed.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { condition: 0.6, possession: 0.4 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.arcane_duel',
    name: 'The Arcane Duel',
    locationTypes: ['tower', 'temple', 'ruins'],
    reachPrimary: 'veil',
    reachSecondary: 'eye',
    encounterType: 'duel',
    threatRating: 'hard',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        id: 'arcane_duel.challenge',
        name: 'The Challenge',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: 'A {adj} mage challenges {actor} to a {adj} duel of magic. {actor} must accept or lose face.',
        onSuccess: {
          narrative: '{actor} accepts the challenge with {adj} grace. The mage nods, seeing {adj} confidence.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s acceptance is {adj}. The mage laughs, sensing {adj} uncertainty.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'arcane_duel.casting',
        name: 'The Casting',
        reach: 'veil',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 1,
        narrative: '{actor} and the mage {verb} spells against each other. Each {adj} spell tests will and wit.',
        onSuccess: {
          narrative: '{actor}\'s spells {verb} {adj} and true. The mage {verb}s back, struggling against {actor}\'s {adj} power.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s spells are {adj}. The mage\'s power {verb}s through, and {actor} is forced to retreat.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'arcane_duel.victory',
        name: 'The Victory',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'One final spell will decide the duel. {actor} must cast {their} {adj} power against the mage\'s last defense.',
        onSuccess: {
          narrative: '{actor}\'s final spell {verb}s {adj} and unstoppable. The mage {verb}s defeated, acknowledging {actor}\'s {adj} mastery.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { condition: 0.6, possession: 0.4 },
            tagFilters: ['#arcane'],
          },
        },
        onFailure: {
          narrative: '{actor}\'s final spell {verb}s away. The mage\'s counterattack {verb}s true, and {actor} {verb}s defeated.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { condition: 0.6, possession: 0.4 },
            tagFilters: ['#arcane'],
          },
        },
      },
    ],
  },
  {
    id: 'encounter.arena_combat',
    name: 'The Arena Combat',
    locationTypes: ['city', 'capital', 'battleground'],
    reachPrimary: 'iron',
    reachSecondary: 'star',
    encounterType: 'duel',
    threatRating: 'hard',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        id: 'arena_combat.entry',
        name: 'The Entry',
        reach: 'star',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} enters the {adj} arena. A {adj} crowd watches, hungry for blood and glory.',
        onSuccess: {
          narrative: '{actor} strides in with {adj} bearing. The crowd {verb}s in approval, sensing {adj} destiny.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s entry is {adj}. The crowd {verb}s in mockery, and doubt whispers through the stands.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'arena_combat.combat',
        name: 'The Combat',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 1,
        narrative: '{actor} faces {adj} opponents in the {adj} arena. Victory must be {adj} and decisive.',
        onSuccess: {
          narrative: '{actor}\'s blades {verb} {adj} and true. Opponents {verb} {adj} before {their} might.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s combat is {adj}. The opponents {verb} {actor} back, and victory {verb}s away.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'arena_combat.triumph',
        name: 'The Triumph',
        reach: 'star',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: '{actor} stands alone, {adj} amid the arena\'s blood and dust. The crowd roars—will {they} celebrate or condemn?',
        onSuccess: {
          narrative: '{actor} raises {their} arms {adj} in victory. The crowd {verb}s in {adj} celebration—a legend is born.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { condition: 0.6, possession: 0.4 },
          },
        },
        onFailure: {
          narrative: '{actor}\'s {adj} collapse {verb}s the crowd\'s cheers. {They} drag {actor} {adj} from the arena.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { condition: 0.6, possession: 0.4 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.shadow_ambush',
    name: 'The Shadow Ambush',
    locationTypes: ['ruins', 'wilderness', 'camp'],
    reachPrimary: 'shadow',
    reachSecondary: 'iron',
    encounterType: 'duel',
    threatRating: 'moderate',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        id: 'shadow_ambush.detection',
        name: 'The Detection',
        reach: 'shadow',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} senses {adj} movement in the shadows. An assassin stalks {them} with {adj} intent.',
        onSuccess: {
          narrative: '{actor}\'s {adj} awareness {verb}s the killer\'s presence. {They} turn to face {their} foe.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} {verb}s {adj} and {their} ambusher {verb}s from darkness {adj} upon {them}.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'shadow_ambush.combat',
        name: 'The Combat',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 1,
        narrative: '{actor} duels the {adj} assassin in {adj} combat. {Their} blades {verb} in the shadows.',
        onSuccess: {
          narrative: '{actor}\'s {adj} blades {verb} true. The assassin {verb}s away {adj} and wounded.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s defense is {adj}. The assassin {verb}s and {actor} {verb}s {adj} and bleeding.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'shadow_ambush.pursuit',
        name: 'The Pursuit',
        reach: 'shadow',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: '{actor} pursues the {adj} assassin into {adj} shadows. Will {they} catch {their} foe?',
        onSuccess: {
          narrative: '{actor}\'s {adj} pursuit {verb}s the assassin {adj} to ground. {They} emerge {adj} and victorious.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { condition: 0.6, possession: 0.4 },
          },
        },
        onFailure: {
          narrative: '{actor}\'s pursuit {verb}s into {adj} darkness. The assassin {verb}s away {adj}, escaping into {adj} night.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { condition: 0.6, possession: 0.4 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.trial_by_combat',
    name: 'The Trial By Combat',
    locationTypes: ['castle', 'fort', 'capital'],
    reachPrimary: 'iron',
    reachSecondary: 'heart',
    encounterType: 'duel',
    threatRating: 'deadly',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        id: 'trial_by_combat.accusation',
        name: 'The Accusation',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} is accused of {adj} crime. Trial by combat is {their} only defense.',
        onSuccess: {
          narrative: '{actor}\'s {adj} response to the accusation {verb}s the court\'s {adj} attention.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s response is {adj}. The court {verb}s {their} guilt, and the trial begins {adj}.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'trial_by_combat.combat',
        name: 'The Combat',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 1,
        narrative: '{actor} faces {their} {adj} accuser in {adj} mortal combat. The court watches {adj}.',
        onSuccess: {
          narrative: '{actor}\'s {adj} skill {verb}s the accuser {adj} to the ground. Victory {verb}s {actor}\'s innocence.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s combat is {adj}. The accuser {verb}s {actor} {adj} and {actor} {verb}s {adj}.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'trial_by_combat.judgment',
        name: 'The Judgment',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'The court must {adj} rule on {actor}\'s fate. Is {their} {adj} victory enough?',
        onSuccess: {
          narrative: '{actor}\'s {adj} victory {verb}s the court\'s {adj} judgment. {They} are declared innocent and {adj} freed.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { condition: 0.6, possession: 0.4 },
          },
        },
        onFailure: {
          narrative: 'The court {verb}s {actor}\'s {adj} victory as {adj}. {They} {verb} a {adj} sentence for {their} crimes.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { condition: 0.6, possession: 0.4 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.honor_duel',
    name: 'The Honor Duel',
    locationTypes: ['castle', 'capital', 'fort'],
    reachPrimary: 'iron',
    reachSecondary: 'heart',
    encounterType: 'duel',
    threatRating: 'moderate',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        id: 'honor_duel.insult',
        name: 'The Insult',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: 'A {adj} noble insults {actor}\'s {adj} honor. A duel is {adj} demanded.',
        onSuccess: {
          narrative: '{actor}\'s {adj} response to the insult {verb}s the court {adj}. {They} accept the duel with {adj} dignity.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s response is {adj}. {Their} honor {verb}s {adj}, and the insult stands undefended.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'honor_duel.preparation',
        name: 'The Preparation',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 1,
        narrative: '{actor} prepares for the {adj} duel against the {adj} noble. {Their} seconds ensure {adj} readiness.',
        onSuccess: {
          narrative: '{actor} prepares with {adj} discipline. {Their} weapons are {adj} and {their} mind is {adj}.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s preparation is {adj}. {Their} doubts {verb}, and {their} readiness {verb}s {adj}.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'honor_duel.engagement',
        name: 'The Engagement',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: '{actor} and the {adj} noble {verb} in {adj} duel before {adj} witnesses. {Their} honor rests on {adj} outcome.',
        onSuccess: {
          narrative: '{actor}\'s {adj} skill {verb}s the noble {adj} down. {Their} honor is {adj} restored, and {the} court {verb}s in {adj} approval.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { condition: 0.6, possession: 0.4 },
          },
        },
        onFailure: {
          narrative: '{actor} is {adj} defeated. {Their} honor {verb}s even {adj}, and {they} {verb} {adj} and {adj} shamed.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { condition: 0.6, possession: 0.4 },
          },
        },
      },
    ],
  },
  // ────────────────────────────────────────────────────────────────────
  // STEAL (4 new; shadow_hunt is already in initial 10)
  // ────────────────────────────────────────────────────────────────────
  {
    id: 'encounter.pickpocket',
    name: 'The Pickpocket',
    locationTypes: ['town', 'city', 'capital'],
    reachPrimary: 'shadow',
    reachSecondary: 'gold',
    encounterType: 'steal',
    threatRating: 'trivial',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
    steps: [
      {
        id: 'pickpocket.selection',
        name: 'The Selection',
        reach: 'shadow',
        difficulty: DIFFICULTY_BASE,
        duration: 2,
        narrative: '{actor} hunts for a {adj} mark in the {adj} marketplace. Someone carries what {actor} needs.',
        onSuccess: {
          narrative: '{actor}\'s {adj} eye spots the {adj} target, laden with wealth and distracted.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s selection is {adj}. The mark is too {adj} or the crowd too thin.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'pickpocket.approach',
        name: 'The Approach',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 1,
        narrative: '{actor} must slip through the {adj} crowd and position {themselves} beside the {adj} mark.',
        onSuccess: {
          narrative: '{actor} {verb}s {adj} through the crowd, positioning {themselves} {adj} beside the mark.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s approach is {adj}. The mark shifts, and the opportunity {verb}s away.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'pickpocket.extraction',
        name: 'The Extraction',
        reach: 'shadow',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: '{actor} must extract the prize with {adj} fingers, leaving no trace of {their} presence.',
        onSuccess: {
          narrative: '{actor}\'s fingers {verb} {adj} and {adj}. The prize is {their}s, and the mark {verb}s nothing.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.7, condition: 0.3 },
          },
        },
        onFailure: {
          narrative: '{actor}\'s fingers slip. The mark feels {their} touch and {verb}s in anger.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 0.7, condition: 0.3 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.vault_heist',
    name: 'The Vault Heist',
    locationTypes: ['castle', 'capital', 'tower'],
    reachPrimary: 'shadow',
    reachSecondary: 'eye',
    encounterType: 'steal',
    threatRating: 'hard',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
    steps: [
      {
        id: 'vault_heist.planning',
        name: 'The Planning',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE,
        duration: 2,
        narrative: '{actor} must plan the {adj} heist of a heavily {adj} vault. Knowledge is the key.',
        onSuccess: {
          narrative: '{actor}\'s {adj} mind {verb}s the vault\'s secrets. A {adj} plan forms.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s planning is {adj}. Critical details remain {adj} and unknown.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'vault_heist.infiltration',
        name: 'The Infiltration',
        reach: 'shadow',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 1,
        narrative: '{actor} must slip past {adj} guards and {adj} wards to reach the vault\'s heart.',
        onSuccess: {
          narrative: '{actor} {verb}s the {adj} defenses with {adj} precision. The vault {verb}s before {them}.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s infiltration {verb}s. An alarm {verb}s, and {they} must flee.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'vault_heist.escape',
        name: 'The Escape',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: '{actor} claims the prize but must escape through {adj} territory with {adj} pursuers on {their} heels.',
        onSuccess: {
          narrative: '{actor} {verb}s the {adj} guards and {verb}s into the {adj} night with the prize {adj} in {their} hands.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.7, condition: 0.3 },
          },
        },
        onFailure: {
          narrative: '{actor}\'s escape {verb}s. The prize is reclaimed, and {they} barely escape with {their} life.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 0.7, condition: 0.3 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.grave_robbery',
    name: 'The Grave Robbery',
    locationTypes: ['ruins', 'ruined_village', 'battleground'],
    reachPrimary: 'shadow',
    reachSecondary: 'flesh',
    encounterType: 'steal',
    threatRating: 'moderate',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
    steps: [
      {
        id: 'grave_robbery.location',
        name: 'The Location',
        reach: 'shadow',
        difficulty: DIFFICULTY_BASE,
        duration: 2,
        narrative: '{actor} seeks a {adj} grave rumored to hold {adj} treasures. {They} must find it.',
        onSuccess: {
          narrative: '{actor}\'s {adj} search {verb}s the {adj} grave, hidden beneath {adj} earth and stone.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s search yields only {adj} graves and {adj} remains.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'grave_robbery.opening',
        name: 'The Opening',
        reach: 'flesh',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 1,
        narrative: '{actor} must open the {adj} grave without disturbing {adj} spirits that might guard it.',
        onSuccess: {
          narrative: '{actor} opens the grave with {adj} care. The spirits remain {adj} and placid.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s disturbance {verb}s the grave\'s guardian. A {adj} spirit {verb}s and {verb}s at {actor}.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'grave_robbery.claiming',
        name: 'The Claiming',
        reach: 'shadow',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: '{actor} must claim the treasures and flee before the grave\'s curse {verb}s them.',
        onSuccess: {
          narrative: '{actor} seizes the treasures and {verb}s from the grave {adj}, escaping {their} curses.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.7, condition: 0.3 },
            tagFilters: ['#ancient', '#underground'],
          },
        },
        onFailure: {
          narrative: '{actor} is caught by the curse. {They} flee {adj} and cursed, the treasures left behind.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 0.7, condition: 0.3 },
            tagFilters: ['#ancient', '#underground'],
          },
        },
      },
    ],
  },
  {
    id: 'encounter.smuggle_goods',
    name: 'The Smuggle Goods',
    locationTypes: ['town', 'city', 'oasis'],
    reachPrimary: 'shadow',
    reachSecondary: 'gold',
    encounterType: 'steal',
    threatRating: 'moderate',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
    steps: [
      {
        id: 'smuggle_goods.acquisition',
        name: 'The Acquisition',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE,
        duration: 2,
        narrative: '{actor} must acquire {adj} goods on the {adj} black market without alerting authorities.',
        onSuccess: {
          narrative: '{actor} finds {adj} goods at {adj} prices. A {adj} deal is struck.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s acquisition is {adj}. The goods are {adj} or the prices too steep.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'smuggle_goods.transportation',
        name: 'The Transportation',
        reach: 'shadow',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 1,
        narrative: '{actor} must transport the {adj} goods through {adj} checkpoints without discovery.',
        onSuccess: {
          narrative: '{actor} {verb}s the {adj} checkpoints with {adj} stealth. The goods remain {adj} hidden.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s transport is {adj}. Guards {verb} the contraband, and {actor} {verb}s.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'smuggle_goods.delivery',
        name: 'The Delivery',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: '{actor} must deliver the {adj} goods to the {adj} buyer without ambush or betrayal.',
        onSuccess: {
          narrative: '{actor} completes the {adj} delivery with {adj} precision. The payment is {adj} received.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.7, condition: 0.3 },
          },
        },
        onFailure: {
          narrative: '{actor}\'s delivery {verb}s into ambush. The buyer {verb}s or authorities {verb}, and {actor} flees {adj} empty.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 0.7, condition: 0.3 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.steal_secrets',
    name: 'The Steal Secrets',
    locationTypes: ['castle', 'tower', 'capital'],
    reachPrimary: 'shadow',
    reachSecondary: 'eye',
    encounterType: 'steal',
    threatRating: 'hard',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
    steps: [
      {
        id: 'steal_secrets.infiltration',
        name: 'The Infiltration',
        reach: 'shadow',
        difficulty: DIFFICULTY_BASE,
        duration: 2,
        narrative: '{actor} must slip into a {adj} palace or tower to steal {adj} secrets.',
        onSuccess: {
          narrative: '{actor} {verb}s inside with {adj} stealth. The palace\'s secrets lie within reach.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s infiltration is {adj}. Guards {verb} near, and {actor} must retreat.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'steal_secrets.discovery',
        name: 'The Discovery',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 1,
        narrative: '{actor} must find the {adj} chamber where secrets are kept and interpret {their} meaning.',
        onSuccess: {
          narrative: '{actor}\'s {adj} intellect uncovers the secret\'s {adj} hiding place. {They} memorize {their} contents.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s search is {adj}. The secrets remain {adj} and hidden.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'steal_secrets.exfiltration',
        name: 'The Exfiltration',
        reach: 'shadow',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: '{actor} must escape the {adj} palace with {adj} knowledge burning in {their} mind, pursued by {adj} guards.',
        onSuccess: {
          narrative: '{actor} {verb}s the palace {adj} and {adj}, the secrets {adj} in {their} grasp.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.7, condition: 0.3 },
            tagFilters: ['#arcane', '#shadow'],
          },
        },
        onFailure: {
          narrative: '{actor}\'s escape {verb}s. Guards {verb} {them} and {they} are {adj} captured, the secrets lost.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 0.7, condition: 0.3 },
            tagFilters: ['#arcane', '#shadow'],
          },
        },
      },
    ],
  },
  // ────────────────────────────────────────────────────────────────────
  // TRADE (5 new; merchants_gambit is already in initial 10)
  // ────────────────────────────────────────────────────────────────────
  {
    id: 'encounter.caravan_deal',
    name: 'The Caravan Deal',
    locationTypes: ['oasis', 'camp', 'town'],
    reachPrimary: 'gold',
    reachSecondary: 'star',
    encounterType: 'trade',
    threatRating: 'easy',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    steps: [
      {
        id: 'caravan_deal.meeting',
        name: 'The Meeting',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} encounters a {adj} caravan leader and proposes a {adj} trade arrangement.',
        onSuccess: {
          narrative: '{actor}\'s proposal catches the leader\'s {adj} attention. {They} agree to hear more.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s proposal is {adj}. The leader dismisses {them} and moves on.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'caravan_deal.negotiation',
        name: 'The Negotiation',
        reach: 'star',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: '{actor} must negotiate a {adj} deal that benefits both parties and honors {their} {adj} route.',
        onSuccess: {
          narrative: '{actor} {verb}s a {adj} arrangement. The caravan leader {verb}s with {adj} satisfaction.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s negotiation falls {adj}. The caravan leader {verb}s and drives on.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'caravan_deal.exchange',
        name: 'The Exchange',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: '{actor} and the caravan {verb} their trade. Goods {verb} hands, and trust is tested.',
        onSuccess: {
          narrative: '{actor}\'s {adj} exchange {verb}s flawlessly. Both parties benefit, and a {adj} partnership {verb}s.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.9, condition: 0.1 },
          },
        },
        onFailure: {
          narrative: '{actor}\'s exchange {verb}s into {adj} dispute. Goods are disputed, and {actor} loses {their} investment.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 0.9, condition: 0.1 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.guild_negotiation',
    name: 'The Guild Negotiation',
    locationTypes: ['city', 'capital', 'town'],
    reachPrimary: 'gold',
    reachSecondary: 'heart',
    encounterType: 'trade',
    threatRating: 'moderate',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    steps: [
      {
        id: 'guild_negotiation.audience',
        name: 'The Audience',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} seeks an audience with a {adj} guild master to {verb} a {adj} contract.',
        onSuccess: {
          narrative: '{actor} gains the {adj} audience. The guild master listens with {adj} interest.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s request is {adj}. The guild master refuses the audience.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'guild_negotiation.proposal',
        name: 'The Proposal',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: '{actor} must present a {adj} proposal that serves the guild\'s {adj} interests.',
        onSuccess: {
          narrative: '{actor}\'s proposal {verb}s the guild master {adj}. {They} nod with {adj} consideration.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s proposal is {adj}. The guild master {verb}s it as {adj} or {adj}.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'guild_negotiation.contract',
        name: 'The Contract',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: '{actor} must seal a {adj} contract that binds both parties to {their} {adj} terms.',
        onSuccess: {
          narrative: '{actor}\'s contract {verb}s {adj} and {adj}. The guild master {verb}s with {adj} respect.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.9, condition: 0.1 },
          },
        },
        onFailure: {
          narrative: '{actor}\'s contract {verb}s into {adj} dispute. The guild master {verb}s the deal.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 0.9, condition: 0.1 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.smuggler_pact',
    name: 'The Smuggler Pact',
    locationTypes: ['camp', 'town', 'ruins'],
    reachPrimary: 'gold',
    reachSecondary: 'shadow',
    encounterType: 'trade',
    threatRating: 'moderate',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    steps: [
      {
        id: 'smuggler_pact.contact',
        name: 'The Contact',
        reach: 'shadow',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} must contact a {adj} smuggler and {verb} {their} interest in {adj} trade.',
        onSuccess: {
          narrative: '{actor}\'s contact {verb}s {adj}. The smuggler emerges from the shadows {adj} and curious.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s contact is {adj}. No smuggler {verb}s, and {actor} is left waiting.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'smuggler_pact.negotiation',
        name: 'The Negotiation',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: '{actor} must negotiate {adj} terms with the {adj} smuggler, each testing the other\'s {adj} commitment.',
        onSuccess: {
          narrative: '{actor}\'s {adj} negotiation {verb}s the smuggler\'s trust. {They} {verb} {adj} terms.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s negotiation {verb}s {adj}. The smuggler {verb}s distrust, and no deal forms.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'smuggler_pact.binding',
        name: 'The Binding',
        reach: 'shadow',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: '{actor} must bind {their} {adj} pact with {adj} oaths that honor both {their} {adj} codes.',
        onSuccess: {
          narrative: '{actor}\'s pact {verb}s {adj} and eternal. The smuggler and {actor} are now {adj} partners.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.9, condition: 0.1 },
            tagFilters: ['#shadow', '#stealth'],
          },
        },
        onFailure: {
          narrative: '{actor}\'s pact {verb}s {adj}. The smuggler {verb}s {actor} and {verb}s into the night.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 0.9, condition: 0.1 },
            tagFilters: ['#shadow', '#stealth'],
          },
        },
      },
    ],
  },
  {
    id: 'encounter.tribute_exchange',
    name: 'The Tribute Exchange',
    locationTypes: ['capital', 'castle', 'temple'],
    reachPrimary: 'gold',
    reachSecondary: 'heart',
    encounterType: 'trade',
    threatRating: 'hard',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    steps: [
      {
        id: 'tribute_exchange.presentation',
        name: 'The Presentation',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} presents {adj} tribute to a {adj} ruler, hoping to strike a {adj} bargain.',
        onSuccess: {
          narrative: '{actor}\'s {adj} presentation {verb}s the ruler\'s {adj} gaze. {They} are impressed.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s {adj} tribute is {adj}. The ruler {verb}s {their} {adj} disdain.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'tribute_exchange.negotiation',
        name: 'The Negotiation',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: '{actor} must negotiate {adj} terms with a {adj} ruler whose {adj} demands are {adj} and steep.',
        onSuccess: {
          narrative: '{actor} {verb}s {adj} terms that both {can} accept. The ruler {verb}s with {adj} satisfaction.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s negotiation {verb}s {adj}. The ruler {verb}s {their} demands, and {actor} cannot meet them.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'tribute_exchange.commitment',
        name: 'The Commitment',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: '{actor} must seal {their} commitment to {adj} tribute payments or receive {adj} rewards.',
        onSuccess: {
          narrative: '{actor}\'s {adj} commitment {verb}s {adj} and {adj}. The ruler {verb}s {their} blessing {adj}.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.9, condition: 0.1 },
          },
        },
        onFailure: {
          narrative: '{actor}\'s {adj} commitment {verb}s {adj}. The ruler {verb}s {their} offer and {actor} {verb}s {adj} humiliated.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 0.9, condition: 0.1 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.barter_survival',
    name: 'The Barter Survival',
    locationTypes: ['wilderness', 'hamlet', 'camp'],
    reachPrimary: 'gold',
    reachSecondary: 'flesh',
    encounterType: 'trade',
    threatRating: 'trivial',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    steps: [
      {
        id: 'barter_survival.hunt',
        name: 'The Hunt',
        reach: 'flesh',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} hunts or gathers {adj} goods in the {adj} wilderness to barter for {their} survival.',
        onSuccess: {
          narrative: '{actor}\'s {adj} hunting {verb}s {adj} results. {Their} stores {verb} {adj} and full.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s hunt is {adj}. {Their} {adj} gains are sparse and {adj}.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'barter_survival.trade',
        name: 'The Trade',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: '{actor} must trade {their} {adj} goods for {adj} supplies needed for {their} {adj} journey.',
        onSuccess: {
          narrative: '{actor}\'s {adj} trade {verb}s {adj} and mutually {adj}. {Their} supplies {verb} {adj}.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s trade is {adj}. {They} {verb} {adj} supplies at {adj} cost.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'barter_survival.sustenance',
        name: 'The Sustenance',
        reach: 'flesh',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: '{actor} must eke out {adj} sustenance from {their} {adj} supplies to {verb} the {adj} wilderness.',
        onSuccess: {
          narrative: '{actor}\'s {adj} resourcefulness {verb}s {them} through. {They} emerge {adj} but {adj} alive.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.9, condition: 0.1 },
            tagFilters: ['#survival'],
          },
        },
        onFailure: {
          narrative: '{actor}\'s supplies {verb} out. {They} {verb} the wilderness {adj} and {adj}, barely {verb}ing.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 0.9, condition: 0.1 },
            tagFilters: ['#survival'],
          },
        },
      },
    ],
  },
  {
    id: 'encounter.mystic_trade',
    name: 'The Mystic Trade',
    locationTypes: ['shrine', 'tower', 'temple'],
    reachPrimary: 'gold',
    reachSecondary: 'veil',
    encounterType: 'trade',
    threatRating: 'moderate',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    steps: [
      {
        id: 'mystic_trade.offering',
        name: 'The Offering',
        reach: 'veil',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} brings {adj} offerings to a {adj} mystic, hoping to trade for {adj} blessings.',
        onSuccess: {
          narrative: '{actor}\'s {adj} offerings {verb} the mystic\'s {adj} gaze. {They} are {adj} accepted.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s {adj} offerings are {adj}. The mystic {verb}s {their} {adj} disdain.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'mystic_trade.negotiation',
        name: 'The Negotiation',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: '{actor} must {verb} {adj} terms with a {adj} mystic whose {adj} blessings are {adj} and {adj}.',
        onSuccess: {
          narrative: '{actor}\'s {adj} negotiation {verb}s the mystic\'s favor. {They} agree to {adj} terms.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s negotiation {verb}s {adj}. The mystic {verb}s {their} offer as {adj}.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'mystic_trade.blessing',
        name: 'The Blessing',
        reach: 'veil',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: '{actor} receives {adj} blessings from the {adj} mystic. {Their} power {verb}s {adj} and {adj}.',
        onSuccess: {
          narrative: '{actor}\'s {adj} blessings {verb} {them} {adj} and {adj}. {They} {verb} {adj} transformed.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.9, condition: 0.1 },
            tagFilters: ['#mystic', '#arcane'],
          },
        },
        onFailure: {
          narrative: '{actor}\'s {adj} blessings {verb} {adj}. {They} {verb} {adj} and {adj} cursed instead.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 0.9, condition: 0.1 },
            tagFilters: ['#mystic', '#arcane'],
          },
        },
      },
    ],
  },
  // ────────────────────────────────────────────────────────────────────
  // ASSIST (5 new; 1 already in initial 10)
  // ────────────────────────────────────────────────────────────────────
  {
    id: 'encounter.aid_refugees',
    name: 'The Refugee Aid',
    locationTypes: ['hamlet', 'town'],
    reachPrimary: 'heart',
    reachSecondary: 'flesh',
    encounterType: 'assist',
    threatRating: 'easy',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    steps: [
      {
        id: 'refugees.recognition',
        name: 'The Recognition',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} finds {adj} refugees seeking shelter. {They} are {adj} and desperate, their need {adj}.',
        onSuccess: {
          narrative: '{actor}\'s {adj} compassion sees their plight. {They} know they can {verb} aid here.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s heart {verb}s cold. {They} {verb} past, {adj} to {their} suffering.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'refugees.shelter',
        name: 'The Shelter',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 3,
        narrative: '{actor} must gather {adj} materials to build {adj} shelter before the {adj} night falls.',
        onSuccess: {
          narrative: '{actor}\'s {adj} ingenuity creates {adj} refuge. The refugees {verb} with gratitude.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s {adj} plans {verb}. The refugees {verb} unprotected against the {adj} cold.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'refugees.sustenance',
        name: 'The Sustenance',
        reach: 'flesh',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 4,
        narrative: '{actor} {verb}s {adj} food and water to {adj} refugees whose {adj} bodies {verb} from hunger.',
        onSuccess: {
          narrative: '{actor}\'s {adj} efforts {verb} the refugees {adj}. {They} {verb} renewed, {adj} grateful.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { blessing: 0.6, condition: 0.4 },
          },
        },
        onFailure: {
          narrative: '{actor}\'s stores {verb} {adj}. The refugees {verb} hungrier, {adj} and desperate.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { blessing: 0.6, condition: 0.4 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.healer_aid',
    name: 'The Healing Vigil',
    locationTypes: ['shrine', 'temple', 'tower'],
    reachPrimary: 'flesh',
    reachSecondary: 'heart',
    encounterType: 'assist',
    threatRating: 'moderate',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    steps: [
      {
        id: 'healer.diagnosis',
        name: 'The Diagnosis',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} tends to {adj} sick who {verb} from {adj} ailments. Understanding their {adj} suffering {verb}s the path forward.',
        onSuccess: {
          narrative: '{actor}\'s {adj} eye sees the {adj} sickness. {They} know how to {verb} aid.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s {adj} understanding {verb}s short. The sickness {verb}s {adj} and {adj} clear.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'healer.treatment',
        name: 'The Treatment',
        reach: 'flesh',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 3,
        narrative: '{actor} must apply {adj} medicines and {adj} remedies to {adj} patients seeking recovery.',
        onSuccess: {
          narrative: '{actor}\'s {adj} touch {verb}s {adj}. The sick {verb} {adj} and restored.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s remedies {verb} {adj}. The patients {verb} {adj} and worse.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'healer.recovery',
        name: 'The Recovery',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 4,
        narrative: '{actor} must maintain {adj} vigil as the {adj} patients fight for {adj} life. {Their} will to survive {verb}s {adj}.',
        onSuccess: {
          narrative: '{actor}\'s {adj} presence {verb}s the patients {adj} through. {They} {verb} alive, {adj} grateful.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { blessing: 0.6, condition: 0.4 },
          },
        },
        onFailure: {
          narrative: '{actor}\'s {adj} vigil {verb}s {adj}. The patients {verb} {adj} and lost.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { blessing: 0.6, condition: 0.4 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.militia_aid',
    name: 'The Militia Assistance',
    locationTypes: ['fort', 'castle', 'battleground'],
    reachPrimary: 'iron',
    reachSecondary: 'heart',
    encounterType: 'assist',
    threatRating: 'hard',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    steps: [
      {
        id: 'militia.assessment',
        name: 'The Assessment',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} surveys {adj} militia struggling against {adj} threats. Their need is {adj} and dire.',
        onSuccess: {
          narrative: '{actor}\'s {adj} eye assesses the situation. {They} see how to {verb} victory.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s {adj} assessment {verb}s {adj}. The militia\'s position grows {adj}.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'militia.coordination',
        name: 'The Coordination',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 3,
        narrative: '{actor} must organize {adj} militia forces into {adj} formations to meet {adj} opposition.',
        onSuccess: {
          narrative: '{actor}\'s {adj} commands {verb} the militia {adj}. {They} move as {adj} one.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s commands {verb} {adj}. The militia {verb} confused and {adj} uncoordinated.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'militia.battle',
        name: 'The Battle',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 4,
        narrative: '{actor} fights {adj} alongside the militia against {adj} enemies. Victory {verb}s uncertain and {adj}.',
        onSuccess: {
          narrative: '{actor}\'s {adj} valor {verb}s the militia {adj}. {They} {verb} the {adj} foe.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { blessing: 0.6, condition: 0.4 },
          },
        },
        onFailure: {
          narrative: '{actor}\'s {adj} efforts {verb} {adj}. The militia {verb} broken, {adj} defeated.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { blessing: 0.6, condition: 0.4 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.scholar_aid',
    name: 'The Academic Preservation',
    locationTypes: ['ruins', 'temple'],
    reachPrimary: 'eye',
    reachSecondary: 'heart',
    encounterType: 'assist',
    threatRating: 'trivial',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    steps: [
      {
        id: 'scholar.discovery',
        name: 'The Discovery',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} finds {adj} scholars seeking to preserve {adj} knowledge before {adj} destruction claims it.',
        onSuccess: {
          narrative: '{actor}\'s {adj} understanding sees the value. {They} know how to {verb} preservation.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s {adj} eye {verb}s blind. The precious knowledge {verb} {adj}.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'scholar.organization',
        name: 'The Organization',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 3,
        narrative: '{actor} must organize {adj} texts and {adj} documents into {adj} order before time {verb}s out.',
        onSuccess: {
          narrative: '{actor}\'s {adj} method {verb}s the scholars {adj}. Knowledge {verb} {adj} and safe.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s {adj} system {verb}s {adj}. The knowledge {verb} scattered and {adj} lost.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'scholar.transcription',
        name: 'The Transcription',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 4,
        narrative: '{actor} must transcribe {adj} knowledge to {adj} mediums before {adj} originals {verb} away.',
        onSuccess: {
          narrative: '{actor}\'s {adj} diligence {verb}s the knowledge {adj}. It {verb}s eternal, {adj} preserved.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { blessing: 0.6, condition: 0.4 },
          },
        },
        onFailure: {
          narrative: '{actor}\'s {adj} efforts {verb} {adj}. The knowledge {verb} lost to {adj} time.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { blessing: 0.6, condition: 0.4 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.guild_aid',
    name: 'The Guild Crisis',
    locationTypes: ['city', 'capital', 'town'],
    reachPrimary: 'gold',
    reachSecondary: 'heart',
    encounterType: 'assist',
    threatRating: 'moderate',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    steps: [
      {
        id: 'guild.crisis',
        name: 'The Crisis',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} discovers {adj} guild facing {adj} financial ruin. {Their} need is {adj} and urgent.',
        onSuccess: {
          narrative: '{actor}\'s {adj} eye sees the {adj} solution. {They} know how to {verb} aid.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s {adj} understanding {verb}s {adj}. The guild\'s plight {verb}s {adj}.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'guild.negotiation',
        name: 'The Negotiation',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 3,
        narrative: '{actor} must negotiate {adj} terms with {adj} creditors seeking {adj} payment from the {adj} guild.',
        onSuccess: {
          narrative: '{actor}\'s {adj} words {verb} the creditors {adj}. {They} agree to {adj} terms.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s {adj} negotiation {verb}s {adj}. The creditors {verb} {their} demands {adj}.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'guild.restoration',
        name: 'The Restoration',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 4,
        narrative: '{actor} must restore {adj} trade networks and {adj} reputation to save the {adj} guild.',
        onSuccess: {
          narrative: '{actor}\'s {adj} efforts {verb} the guild {adj}. {They} {verb} {adj} and thriving.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { blessing: 0.6, condition: 0.4 },
          },
        },
        onFailure: {
          narrative: '{actor}\'s {adj} restoration {verb}s {adj}. The guild {verb} {adj} and lost.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { blessing: 0.6, condition: 0.4 },
          },
        },
      },
    ],
  },
  // ────────────────────────────────────────────────────────────────────
  // BUILD (6 new)
  // ────────────────────────────────────────────────────────────────────
  {
    id: 'encounter.forge_construction',
    name: 'The Forge Construction',
    locationTypes: ['town', 'castle', 'fort'],
    reachPrimary: 'stone',
    reachSecondary: 'iron',
    encounterType: 'build',
    threatRating: 'moderate',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.build,
    steps: [
      {
        id: 'forge.design',
        name: 'The Design',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE,
        duration: 5,
        narrative: '{actor} must design {adj} forge capable of withstanding {adj} heat and {adj} work.',
        onSuccess: {
          narrative: '{actor}\'s {adj} design {verb}s the smiths {adj}. {They} see {adj} genius in the plan.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s {adj} design {verb}s {adj}. The smiths {verb} the plan as {adj}.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'forge.excavation',
        name: 'The Excavation',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 7,
        narrative: '{actor} must oversee {adj} excavation of {adj} foundation for the {adj} forge.',
        onSuccess: {
          narrative: '{actor}\'s {adj} supervision {verb}s the work {adj}. The foundation {verb}s {adj} and true.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s {adj} oversight {verb}s {adj}. The foundation {verb}s {adj} and unstable.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'forge.assembly',
        name: 'The Assembly',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 8,
        narrative: '{actor} must {verb} together {adj} stones and {adj} metals to {verb} the {adj} forge alive.',
        onSuccess: {
          narrative: '{actor}\'s {adj} work {verb}s the forge {adj}. It {verb}s alive, {adj} and {adj} perfect.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s {adj} assembly {verb}s {adj}. The forge {verb}s broken, {adj} useless.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.tower_restoration',
    name: 'The Tower Restoration',
    locationTypes: ['ruins', 'ruined_tower', 'ruined_city'],
    reachPrimary: 'stone',
    reachSecondary: 'eye',
    encounterType: 'build',
    threatRating: 'hard',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.build,
    steps: [
      {
        id: 'tower.assessment',
        name: 'The Assessment',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE,
        duration: 5,
        narrative: '{actor} surveys {adj} ruins of {adj} tower, its {adj} walls {verb}ing to {adj} decay.',
        onSuccess: {
          narrative: '{actor}\'s {adj} eye sees how to {verb} the tower. {They} know {adj} restoration is {adj}.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s {adj} assessment {verb}s {adj}. The tower\'s {adj} state {verb}s {adj}.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'tower.reconstruction',
        name: 'The Reconstruction',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 7,
        narrative: '{actor} must gather {adj} materials and direct {adj} workers to rebuild {adj} sections of the {adj} tower.',
        onSuccess: {
          narrative: '{actor}\'s {adj} efforts {verb} the tower {adj}. Its {adj} walls {verb} {adj} and restored.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s {adj} reconstruction {verb}s {adj}. The tower {verb}s further {adj}.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'tower.completion',
        name: 'The Completion',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 8,
        narrative: '{actor} must finish {adj} tower with {adj} craftsmanship, making it {adj} and {adj}.',
        onSuccess: {
          narrative: '{actor}\'s {adj} final touches {verb} the tower {adj}. It {verb}s {adj}, a {adj} monument.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s {adj} completion {verb}s {adj}. The tower {verb}s {adj}, still {adj}.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.bridge_engineering',
    name: 'The Bridge Engineering',
    locationTypes: ['wilderness', 'farmland', 'oasis'],
    reachPrimary: 'stone',
    reachSecondary: 'gold',
    encounterType: 'build',
    threatRating: 'moderate',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.build,
    steps: [
      {
        id: 'bridge.planning',
        name: 'The Planning',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE,
        duration: 5,
        narrative: '{actor} must plan {adj} bridge across {adj} chasm that {verb}s wide and {adj}.',
        onSuccess: {
          narrative: '{actor}\'s {adj} plan {verb}s {adj}. The engineers see it {verb}s {adj} and viable.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s {adj} plan {verb}s {adj}. The engineers doubt its {adj} integrity.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'bridge.construction',
        name: 'The Construction',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 7,
        narrative: '{actor} must oversee construction of {adj} supports and {adj} span for the {adj} bridge.',
        onSuccess: {
          narrative: '{actor}\'s {adj} oversight {verb}s the bridge {adj}. It {verb}s {adj} and {adj} strong.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s {adj} oversight {verb}s {adj}. The bridge {verb}s {adj} and {adj} weak.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'bridge.testing',
        name: 'The Testing',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 8,
        narrative: '{actor} must test the {adj} bridge against {adj} weights and {adj} storms.',
        onSuccess: {
          narrative: '{actor}\'s {adj} tests {verb} the bridge {adj}. It {verb}s {adj}, ready for {adj} travel.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s {adj} tests {verb} the bridge {adj}. It {verb}s, {adj} and {adj} unsafe.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.temple_expansion',
    name: 'The Temple Expansion',
    locationTypes: ['shrine', 'temple', 'city'],
    reachPrimary: 'stone',
    reachSecondary: 'veil',
    encounterType: 'build',
    threatRating: 'easy',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.build,
    steps: [
      {
        id: 'temple.consecration',
        name: 'The Consecration',
        reach: 'veil',
        difficulty: DIFFICULTY_BASE,
        duration: 5,
        narrative: '{actor} must consecrate {adj} ground where {adj} expansion will {verb}.',
        onSuccess: {
          narrative: '{actor}\'s {adj} ritual {verb}s the ground {adj}. The spirits {verb} {adj} approval.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s {adj} ritual {verb}s {adj}. The spirits {verb} {their} {adj} displeasure.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'temple.raising',
        name: 'The Raising',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 7,
        narrative: '{actor} must raise {adj} walls and {adj} pillars for the {adj} temple expansion.',
        onSuccess: {
          narrative: '{actor}\'s {adj} construction {verb}s the walls {adj}. {They} {verb} toward the {adj} sky.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s {adj} construction {verb}s {adj}. The walls {verb} crooked and {adj} weak.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'temple.sanctification',
        name: 'The Sanctification',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 8,
        narrative: '{actor} must sanctify {adj} temple with {adj} presence and {adj} devotion.',
        onSuccess: {
          narrative: '{actor}\'s {adj} devotion {verb}s the temple {adj}. It {verb}s {adj}, a {adj} sacred space.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s {adj} sanctification {verb}s {adj}. The temple {verb}s {adj} and {adj} hollow.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.harbor_construction',
    name: 'The Harbor Construction',
    locationTypes: ['city', 'capital', 'town'],
    reachPrimary: 'stone',
    reachSecondary: 'gold',
    encounterType: 'build',
    threatRating: 'hard',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.build,
    steps: [
      {
        id: 'harbor.survey',
        name: 'The Survey',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE,
        duration: 5,
        narrative: '{actor} must survey {adj} coastline to find {adj} location for {adj} harbor.',
        onSuccess: {
          narrative: '{actor}\'s {adj} eye finds {adj} perfect spot. The merchants {verb} in {adj} delight.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s {adj} survey {verb}s {adj}. The location {verb}s {adj} and {adj} wrong.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'harbor.dredging',
        name: 'The Dredging',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 7,
        narrative: '{actor} must oversee {adj} dredging to deepen {adj} waters for {adj} ships.',
        onSuccess: {
          narrative: '{actor}\'s {adj} oversight {verb}s the waters {adj}. Ships can now {verb} safely through.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s {adj} oversight {verb}s {adj}. The waters {verb} {adj} and {adj} shallow.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'harbor.wharves',
        name: 'The Wharves',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 8,
        narrative: '{actor} must build {adj} wharves and {adj} docks for {adj} mercantile trade.',
        onSuccess: {
          narrative: '{actor}\'s {adj} wharves {verb} {adj} and {adj}. Trade {verb}s, {adj} and profitable.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s {adj} wharves {verb} {adj}. Trade {verb}s stalled, {adj} and {adj} lost.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  // ────────────────────────────────────────────────────────────────────
  // LEAD (4 new; 1 already in initial 10)
  // ────────────────────────────────────────────────────────────────────
  {
    id: 'encounter.expedition_leadership',
    name: 'The Expedition Leadership',
    locationTypes: ['wilderness', 'unexplored_poi', 'ruined_city'],
    reachPrimary: 'heart',
    reachSecondary: 'heart',
    encounterType: 'lead',
    threatRating: 'hard',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
    steps: [
      {
        id: 'expedition.gathering',
        name: 'The Gathering',
        reach: 'dominance',
        difficulty: DIFFICULTY_BASE,
        duration: 2,
        narrative: '{actor} must gather {adj} companions for {adj} expedition into {adj} wilderness.',
        onSuccess: {
          narrative: '{actor}\'s {adj} presence {verb}s {adj} companions. {They} are {adj} eager to follow.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s {adj} call {verb}s {adj}. Companions {verb} {adj} interest.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'expedition.navigation',
        name: 'The Navigation',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 4,
        narrative: '{actor} must navigate {adj} paths through {adj} terrain toward {adj} objective.',
        onSuccess: {
          narrative: '{actor}\'s {adj} leadership {verb}s the group {adj}. {They} {verb} on the {adj} path.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s {adj} navigation {verb}s {adj}. The group {verb}s {adj} and lost.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'expedition.triumph',
        name: 'The Triumph',
        reach: 'dominance',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 5,
        narrative: '{actor} must lead {adj} companions through {adj} perils and {adj} challenges to {adj} victory.',
        onSuccess: {
          narrative: '{actor}\'s {adj} leadership {verb}s the group {adj}. {They} {verb} {adj} and {adj} triumphant.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s {adj} leadership {verb}s {adj}. The group {verb}s scattered, {adj} and {defeated}.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.council_mediation',
    name: 'The Council Mediation',
    locationTypes: ['capital', 'city', 'castle'],
    reachPrimary: 'heart',
    reachSecondary: 'heart',
    encounterType: 'lead',
    threatRating: 'moderate',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
    steps: [
      {
        id: 'council.assembly',
        name: 'The Assembly',
        reach: 'dominance',
        difficulty: DIFFICULTY_BASE,
        duration: 2,
        narrative: '{actor} must assemble {adj} council members to address {adj} disputes.',
        onSuccess: {
          narrative: '{actor}\'s {adj} presence {verb}s the council. {They} gather {adj} and attentive.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s {adj} call {verb}s {adj}. The council {verb}s {adj} and disinterested.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'council.hearing',
        name: 'The Hearing',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 4,
        narrative: '{actor} must hear {adj} grievances from {adj} factions seeking {adj} resolution.',
        onSuccess: {
          narrative: '{actor}\'s {adj} listening {verb}s the council {adj}. {They} find {adj} common ground.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s {adj} hearing {verb}s {adj}. The factions {verb} {adj} and {adj} divided.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'council.judgment',
        name: 'The Judgment',
        reach: 'dominance',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 5,
        narrative: '{actor} must render {adj} judgment that {verb}s {adj} and satisfies {adj} all.',
        onSuccess: {
          narrative: '{actor}\'s {adj} judgment {verb}s {adj}. All {verb} in {adj} acceptance.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s {adj} judgment {verb}s {adj}. The council {verb}s {adj} and {adj} outraged.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.merchant_caravan',
    name: 'The Merchant Caravan Leadership',
    locationTypes: ['town', 'city', 'farmland'],
    reachPrimary: 'gold',
    reachSecondary: 'gold',
    encounterType: 'lead',
    threatRating: 'easy',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
    steps: [
      {
        id: 'caravan.organization',
        name: 'The Organization',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE,
        duration: 2,
        narrative: '{actor} must organize {adj} merchants and {adj} goods for {adj} caravan journey.',
        onSuccess: {
          narrative: '{actor}\'s {adj} organization {verb}s the merchants {adj}. {They} are {adj} ready.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s {adj} organization {verb}s {adj}. The merchants {verb} {adj} and {adj} frustrated.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'caravan.route',
        name: 'The Route',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 4,
        narrative: '{actor} must chart {adj} route through {adj} lands to {adj} destinations.',
        onSuccess: {
          narrative: '{actor}\'s {adj} route {verb}s {adj} and {adj}. The caravan {verb}s safely.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s {adj} route {verb}s {adj}. The caravan {verb}s lost and {adj}.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'caravan.profit',
        name: 'The Profit',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 5,
        narrative: '{actor} must lead the caravan to {adj} markets and negotiate {adj} sales.',
        onSuccess: {
          narrative: '{actor}\'s {adj} leadership {verb}s the caravan {adj}. Profits {verb}, {adj} and {adj} abundant.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s {adj} leadership {verb}s {adj}. Profits {verb} {adj}, {adj} and {adj} lost.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.faction_unification',
    name: 'The Faction Unification',
    locationTypes: ['capital', 'castle', 'ruins'],
    reachPrimary: 'heart',
    reachSecondary: 'gold',
    encounterType: 'lead',
    threatRating: 'deadly',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
    steps: [
      {
        id: 'faction.coalition',
        name: 'The Coalition',
        reach: 'dominance',
        difficulty: DIFFICULTY_BASE,
        duration: 2,
        narrative: '{actor} must bring {adj} factions together against {adj} common threat.',
        onSuccess: {
          narrative: '{actor}\'s {adj} presence {verb}s the factions {adj}. {They} see {adj} unity is {adj}.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s {adj} call {verb}s {adj}. The factions {verb} {adj} and divided.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'faction.negotiation',
        name: 'The Negotiation',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 4,
        narrative: '{actor} must negotiate {adj} terms that satisfy {adj} all factions.',
        onSuccess: {
          narrative: '{actor}\'s {adj} negotiation {verb}s the factions {adj}. {They} agree to united action.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s {adj} negotiation {verb}s {adj}. The factions {verb} {adj} and {adj} opposed.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'faction.victory',
        name: 'The Victory',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 5,
        narrative: '{actor} must lead {adj} unified factions to {adj} victory against {adj} overwhelming odds.',
        onSuccess: {
          narrative: '{actor}\'s {adj} leadership {verb}s the factions {adj}. {They} {verb} {adj} and triumphant.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s {adj} leadership {verb}s {adj}. The factions {verb} scattered, {adj} and {adj} broken.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.sanctuary_construction',
    name: 'The Sanctuary Construction',
    locationTypes: ['mining', 'unexplored_poi'],
    reachPrimary: 'stone',
    reachSecondary: 'heart',
    encounterType: 'build',
    threatRating: 'deadly',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.build,
    steps: [
      {
        id: 'sanctuary.discovery',
        name: 'The Discovery',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE,
        duration: 5,
        narrative: '{actor} discovers {adj} cavern that {verb}s with {adj} potential.',
        onSuccess: {
          narrative: '{actor}\'s {adj} eye sees the {adj} sanctuary within. {They} know this place {verb}s {adj}.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s {adj} vision {verb}s {adj}. The cavern {verb}s just {adj} stone.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'sanctuary.carving',
        name: 'The Carving',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 7,
        narrative: '{actor} must carve {adj} chambers and {adj} halls from {adj} rock.',
        onSuccess: {
          narrative: '{actor}\'s {adj} carving {verb}s the chambers {adj}. {They} are {adj} and vast.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s {adj} carving {verb}s {adj}. The chambers {verb} {adj} and {adj} small.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'sanctuary.consecration',
        name: 'The Consecration',
        reach: 'veil',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 8,
        narrative: '{actor} must consecrate {adj} sanctuary as {adj} refuge from {adj} world.',
        onSuccess: {
          narrative: '{actor}\'s {adj} consecration {verb}s the sanctuary {adj}. It {verb}s {adj}, {adj} and safe.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s {adj} consecration {verb}s {adj}. The sanctuary {verb}s {adj} and {adj} profane.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.library_expansion',
    name: 'The Library Expansion',
    locationTypes: ['tower', 'ruins', 'city'],
    reachPrimary: 'eye',
    reachSecondary: 'stone',
    encounterType: 'build',
    threatRating: 'easy',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.build,
    steps: [
      {
        id: 'library.acquisition',
        name: 'The Acquisition',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE,
        duration: 5,
        narrative: '{actor} must acquire {adj} texts and {adj} scrolls for {adj} expanding library.',
        onSuccess: {
          narrative: '{actor}\'s {adj} gathering {verb}s {adj} knowledge. The texts {verb} {adj} and {adj} rare.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s {adj} search {verb}s {adj}. The texts {verb} {adj} and {adj} common.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'library.organization',
        name: 'The Organization',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 7,
        narrative: '{actor} must organize {adj} knowledge into {adj} system for {adj} scholars.',
        onSuccess: {
          narrative: '{actor}\'s {adj} system {verb}s the scholars {adj}. {They} find knowledge {adj} and {adj} swift.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s {adj} organization {verb}s {adj}. The scholars {verb} {adj} and lost.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'library.preservation',
        name: 'The Preservation',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 8,
        narrative: '{actor} must build {adj} archive and {adj} vaults to preserve {adj} knowledge.',
        onSuccess: {
          narrative: '{actor}\'s {adj} preservation {verb}s the knowledge {adj} and {adj} eternal. It {verb}s {adj} safe.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s {adj} archive {verb}s {adj}. The knowledge {verb}s {adj} and {adj} at risk.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.warband_training',
    name: 'The Warband Training',
    locationTypes: ['fort', 'camp', 'castle'],
    reachPrimary: 'iron',
    reachSecondary: 'gold',
    encounterType: 'lead',
    threatRating: 'moderate',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
    steps: [
      {
        id: 'warband.assembly',
        name: 'The Assembly',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE,
        duration: 2,
        narrative: '{actor} must assemble {adj} warband of {adj} fighters seeking {adj} purpose.',
        onSuccess: {
          narrative: '{actor}\'s {adj} presence {verb}s the fighters {adj}. {They} are {adj} eager.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s {adj} call {verb}s {adj}. The fighters {verb} {adj} and {adj} disinterested.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'warband.discipline',
        name: 'The Discipline',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 4,
        narrative: '{actor} must train {adj} fighters in {adj} discipline and {adj} tactics.',
        onSuccess: {
          narrative: '{actor}\'s {adj} training {verb}s the fighters {adj}. {They} become {adj} and {adj} deadly.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s {adj} training {verb}s {adj}. The fighters {verb} {adj} and {adj} sluggish.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'warband.campaign',
        name: 'The Campaign',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 5,
        narrative: '{actor} must lead {adj} warband on {adj} campaign against {adj} enemies.',
        onSuccess: {
          narrative: '{actor}\'s {adj} leadership {verb}s the warband {adj}. {They} {verb} {adj} and {adj} victorious.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s {adj} leadership {verb}s {adj}. The warband {verb} {adj}, {adj} and {adj} shattered.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.frontier_settlement',
    name: 'The Frontier Settlement',
    locationTypes: ['farmland', 'battleground', 'camp', 'mining', 'temple', 'unexplored_poi', 'ruined_tower', 'ruined_city', 'ruined_village', 'oasis'],
    reachPrimary: 'stone',
    reachSecondary: 'heart',
    encounterType: 'build',
    threatRating: 'hard',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.build,
    steps: [
      {
        id: 'settlement.survey',
        name: 'The Survey',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE,
        duration: 5,
        narrative: '{actor} surveys {adj} frontier lands to find {adj} location for {adj} settlement.',
        onSuccess: {
          narrative: '{actor}\'s {adj} eye finds {adj} perfect spot. The land {verb}s {adj} and {adj} promising.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s {adj} survey {verb}s {adj}. The land {verb}s {adj} and {adj} inhospitable.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'settlement.construction',
        name: 'The Construction',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 7,
        narrative: '{actor} must oversee {adj} construction of {adj} buildings and {adj} fortifications.',
        onSuccess: {
          narrative: '{actor}\'s {adj} oversight {verb}s the settlement {adj}. It {verb}s {adj} and {adj} strong.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s {adj} oversight {verb}s {adj}. The settlement {verb}s {adj} and {adj} weak.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'settlement.establishment',
        name: 'The Establishment',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 8,
        narrative: '{actor} must establish {adj} community bonds and {adj} governance to {verb} the settlement {adj}.',
        onSuccess: {
          narrative: '{actor}\'s {adj} leadership {verb}s the settlement {adj}. It {verb}s {adj}, {adj} and {adj} thriving.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s {adj} establishment {verb}s {adj}. The settlement {verb}s {adj}, {adj} and {adj} fragile.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  // ────────────────────────────────────────────────────────────────────
  // GOLD SUBLOCATION ENCOUNTERS (System 6 — 12 templates)
  // ────────────────────────────────────────────────────────────────────

  // ── Market District (2) ──────────────────────────────────────────
  {
    id: 'encounter.the_haggle',
    name: 'The Haggle',
    locationTypes: ['hamlet', 'town', 'city', 'capital'],
    sublocationTypes: ['sublocation-type.market-district'],
    reachPrimary: 'gold',
    reachSecondary: 'heart',
    encounterType: 'trade',
    threatRating: 'easy',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    steps: [
      {
        id: 'the_haggle.opening',
        name: 'The Opening Bid',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} squares off against a {adj} merchant in the market square. The first price named is a barb — too high by half, as any fool could see.',
        onSuccess: {
          narrative: '{actor} names a counter with {adj} precision. The merchant blinks, recalculates, and the dance begins in earnest.',
          reputationDelta: 0.03,
        },
        onFailure: {
          narrative: '{actor} hesitates a beat too long. The merchant {verb}s, scenting weakness, and doubles down on the {adj} price.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'the_haggle.pressure',
        name: 'The Pressure',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'Stalls around them fall quiet. {actor} must read the merchant\'s resolve — break it with words, or yield ground to save the deal.',
        onSuccess: {
          narrative: '{actor} finds the {adj} angle: a past debt, a future favour, a word that lands like a coin on stone. The merchant folds.',
          reputationDelta: 0.07,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s words {verb} past the merchant\'s guard. The deal stalls, and the crowd loses interest.',
          reputationDelta: -0.04,
        },
      },
      {
        id: 'the_haggle.close',
        name: 'The Close',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'One price remains between profit and insult. {actor} must close the gap without breaking what goodwill remains.',
        onSuccess: {
          narrative: 'Hands clasp. The deal is struck at {actor}\'s terms — not all of them, but enough. Both walk away {adj} richer for the sparring.',
          reputationDelta: 0.12,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.9, condition: 0.1 },
          },
        },
        onFailure: {
          narrative: 'The merchant pulls back at the last. {actor} leaves the stall {adj}-handed, the deal dead in the dust.',
          reputationDelta: -0.06,
          rewardPool: {
            categoryWeights: { possession: 0.9, condition: 0.1 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.market_day_festival',
    name: 'Market Day Festival',
    locationTypes: ['hamlet', 'town', 'city', 'capital'],
    sublocationTypes: ['sublocation-type.market-district'],
    reachPrimary: 'gold',
    reachSecondary: 'heart',
    encounterType: 'trade',
    threatRating: 'trivial',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    steps: [
      {
        id: 'market_day_festival.celebration',
        name: 'The Celebration',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: 'The whole settlement floods the market square. Banners fly, prices drop, and strangers share tables. {actor} moves through the {adj} crowd, coin and conversation flowing freely.',
        onSuccess: {
          narrative: '{actor} works the festival {adj}ly — a word here, a purchase there. By dusk, new faces have become familiar ones.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} misreads the {adj} mood, stepping on toes they didn\'t see. The festival carries on without them.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'market_day_festival.connections',
        name: 'The Connections',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'As the fires are lit and the crowd thins, {actor} has a chance to {verb} on the acquaintances the day has made — follow up, leave a mark, or let the moment pass.',
        onSuccess: {
          narrative: '{actor} {verb}s the right words at the right moment. A stranger becomes a contact; a contact becomes something more.',
          reputationDelta: 0.09,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.9, condition: 0.1 },
          },
        },
        onFailure: {
          narrative: '{actor} {verb}s too {adj}ly and the connection {verb}s into awkward silence. The festival ends without its promise kept.',
          reputationDelta: -0.03,
          rewardPool: {
            categoryWeights: { possession: 0.9, condition: 0.1 },
          },
        },
      },
    ],
  },

  // ── Mine (2) ────────────────────────────────────────────────────
  {
    id: 'encounter.the_rich_vein',
    name: 'The Rich Vein',
    locationTypes: ['mining', 'hamlet', 'town', 'city', 'capital'],
    sublocationTypes: ['sublocation-type.mine'],
    reachPrimary: 'gold',
    reachSecondary: 'stone',
    encounterType: 'acquire',
    threatRating: 'moderate',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.acquire,
    steps: [
      {
        id: 'the_rich_vein.survey',
        name: 'The Survey',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} descends into the shaft where a seam of ore {verb}s deep in the {adj} rock, far richer than the ledgers suggest.',
        onSuccess: {
          narrative: '{actor}\'s {adj} eye reads the stone correctly — the vein is real, running {adj} and wide. The foreman scratches his beard in {adj} disbelief.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: '{actor} misjudges the depth. The vein twists away into {adj} rock, unreachable with current tools.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'the_rich_vein.extraction',
        name: 'The Extraction',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: '{actor} must fund and organise the {adj} extraction effort before word spreads and rivals move in.',
        onSuccess: {
          narrative: '{actor}\'s {adj} organisation holds. Carts of ore roll out, and the settlement\'s resources swell.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s planning {verb}s under the weight of {adj} logistics. The opportunity slips by.',
          reputationDelta: -0.04,
        },
      },
      {
        id: 'the_rich_vein.collapse',
        name: 'The Risk',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 3,
        narrative: 'The shaft groans. {actor} must decide — press on into the {adj} unstable seam, or pull back and lose the haul.',
        onSuccess: {
          narrative: '{actor} reads the rock\'s {adj} warning and braces the shaft in time. The ore comes out, and everyone comes out with it.',
          reputationDelta: 0.14,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
            tagFilters: ['#underground', '#survival'],
          },
        },
        onFailure: {
          narrative: 'The shaft {verb}s with terrible finality. {actor} escapes, but the ore is buried and {they} carry a {adj} injury for their boldness.',
          reputationDelta: -0.10,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
            tagFilters: ['#underground', '#survival'],
          },
        },
      },
    ],
  },
  {
    id: 'encounter.labor_dispute',
    name: 'Labor Dispute',
    locationTypes: ['mining', 'hamlet', 'town', 'city', 'capital'],
    sublocationTypes: ['sublocation-type.mine'],
    reachPrimary: 'gold',
    reachSecondary: 'heart',
    encounterType: 'lead',
    threatRating: 'easy',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
    steps: [
      {
        id: 'labor_dispute.grievance',
        name: 'The Grievance',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE,
        duration: 2,
        narrative: 'The miners have downed tools. A {adj} foreman presents their list of grievances to {actor}, whose {adj} authority over the mine is now on trial.',
        onSuccess: {
          narrative: '{actor} listens without flinching. The miners\'s litany is {adj} — some of it fair, some of it {adj} embellishment. {actor} separates the two.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: '{actor}\'s attention {verb}s dismissively. The foreman\'s jaw tightens. This is going to cost more than it should.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'labor_dispute.resolution',
        name: 'The Resolution',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 4,
        narrative: '{actor} must choose: pay the miners fairly and accept the cost, or squeeze them and risk a harder fight later.',
        onSuccess: {
          narrative: '{actor} offers {adj} terms — not generous, but {adj} honest. The tools go back to work. Word spreads that {actor} is fair.',
          reputationDelta: 0.12,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} lowballs the settlement. The miners return to work {adj}ly, nursing {adj} resentment the mine will feel for seasons.',
          reputationDelta: -0.06,
        },
      },
    ],
  },

  // ── Harbor (2) ─────────────────────────────────────────────────
  {
    id: 'encounter.foreign_trader',
    name: 'Foreign Trader',
    locationTypes: ['town', 'city', 'capital'],
    sublocationTypes: ['sublocation-type.harbor'],
    reachPrimary: 'gold',
    reachSecondary: 'eye',
    encounterType: 'trade',
    threatRating: 'moderate',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    steps: [
      {
        id: 'foreign_trader.appraisal',
        name: 'The Appraisal',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: 'A foreign vessel has docked. The {adj} captain spreads exotic wares across the quay, and {actor} must determine what is genuinely rare and what is {adj} dockside theatre.',
        onSuccess: {
          narrative: '{actor}\'s {adj} eye cuts through the {adj} display. Two items are genuine; the rest is clever staging. {actor} knows which is which.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: '{actor}\'s appraisal {verb}s somewhere in the {adj} middle. The captain {verb}s, sensing opportunity.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'foreign_trader.negotiation',
        name: 'The Negotiation',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'The captain\'s price is {adj}. {actor} must negotiate across a language barrier and a {adj} cultural gulf.',
        onSuccess: {
          narrative: '{actor} bridges the {adj} gap with {adj} gold and a trader\'s instinct. The goods change hands at {adj} fair terms.',
          reputationDelta: 0.10,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.9, condition: 0.1 },
          },
        },
        onFailure: {
          narrative: 'Something {verb}s in translation. {actor} overpays, or misses what the captain was actually offering. The goods are {adj}, but the price is worse.',
          reputationDelta: -0.05,
          rewardPool: {
            categoryWeights: { possession: 0.9, condition: 0.1 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.pirate_raid',
    name: 'Pirate Raid',
    locationTypes: ['town', 'city', 'capital'],
    sublocationTypes: ['sublocation-type.harbor'],
    reachPrimary: 'iron',
    reachSecondary: 'gold',
    encounterType: 'duel',
    threatRating: 'hard',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        id: 'pirate_raid.warning',
        name: 'The Warning',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: 'Sails on the horizon, wrong colours. {actor} has minutes to rally the harbor guards and coordinate a {adj} defence before the raiders make land.',
        onSuccess: {
          narrative: '{actor}\'s {adj} organisation pays off — harbor chains drawn, archers in position. The raiders {verb} the {adj} wall of readiness.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s orders {verb} in the {adj} chaos. The docks are unprepared when the first hull scrapes stone.',
          reputationDelta: -0.04,
        },
      },
      {
        id: 'pirate_raid.repel',
        name: 'The Repel',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 1,
        narrative: 'Raiders pour across the gangplanks. {actor} is in the thick of it — defend the cargo sheds or let them burn.',
        onSuccess: {
          narrative: '{actor} holds the line with {adj} resolve. The raiders {verb}, taking too many losses for the prize. They pull back.',
          reputationDelta: 0.09,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} is pushed back. The sheds burn. Cargo is lost, and the harbor bears {adj} scars long after the ships depart.',
          reputationDelta: -0.07,
        },
      },
      {
        id: 'pirate_raid.aftermath',
        name: 'The Aftermath',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'The raiders are rallying for a second push. {actor} must lead the counterattack before they regroup.',
        onSuccess: {
          narrative: '{actor} drives them into the water with {adj} fury. The harbor will not be struck again this season.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { condition: 0.6, possession: 0.4 },
            tagFilters: ['#beast', '#survival'],
          },
        },
        onFailure: {
          narrative: 'The {adj} second wave crashes over the defences. {actor} survives, but the raid leaves the harbor {adj} gutted.',
          reputationDelta: -0.12,
          rewardPool: {
            categoryWeights: { condition: 0.6, possession: 0.4 },
            tagFilters: ['#beast', '#survival'],
          },
        },
      },
    ],
  },

  // ── Counting House (2) ─────────────────────────────────────────
  {
    id: 'encounter.the_loan',
    name: 'The Loan',
    locationTypes: ['town', 'city', 'capital'],
    sublocationTypes: ['sublocation-type.counting-house'],
    reachPrimary: 'gold',
    reachSecondary: 'heart',
    encounterType: 'assist',
    threatRating: 'easy',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    steps: [
      {
        id: 'the_loan.proposal',
        name: 'The Proposal',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: 'Across a {adj} ledger, a choice. {actor} can extend a loan to a desperate borrower — terms to be set, risk to be weighed. No sword needed. Only judgment.',
        onSuccess: {
          narrative: '{actor} draws up {adj} terms: fair interest, a {adj} schedule, and a clause that protects both parties. The borrower considers.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: '{actor}\'s terms {verb} too far in one direction. The borrower balks, or the house extends more than wisdom {verb}s. The ledger {verb}s {adj} exposed.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'the_loan.binding',
        name: 'The Binding',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 3,
        narrative: '{actor} must read the borrower\'s true intent before ink touches parchment. A {adj} lender and a {adj} debtor — the agreement must hold both.',
        onSuccess: {
          narrative: 'The agreement is struck. Both parties sign with {adj} purpose, and the debt is recorded as what it is: a {adj} obligation freely made.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { blessing: 0.6, condition: 0.4 },
          },
        },
        onFailure: {
          narrative: '{actor}\'s judgment {verb}s. The borrower signs, but the {adj} terms breed resentment before the ink is dry.',
          reputationDelta: -0.04,
          rewardPool: {
            categoryWeights: { blessing: 0.6, condition: 0.4 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.debt_collection',
    name: 'Debt Collection',
    locationTypes: ['town', 'city', 'capital'],
    sublocationTypes: ['sublocation-type.counting-house'],
    reachPrimary: 'gold',
    reachSecondary: 'iron',
    encounterType: 'hire',
    threatRating: 'moderate',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.hire,
    steps: [
      {
        id: 'debt_collection.demand',
        name: 'The Demand',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: 'The agreement is past due. {actor} presents the ledger to the debtor, who {verb}s a {adj} excuse and {adj} stalling. Every word is a delay.',
        onSuccess: {
          narrative: '{actor} lays out the terms without {adj} apology. The debtor {verb}s under the {adj} clarity and begins to negotiate in good faith.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: '{actor}\'s approach {verb}s too {adj}. The debtor takes it as weakness and {verb}s the debt further into dispute.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'debt_collection.enforcement',
        name: 'The Enforcement',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'Words have failed. {actor} must enforce the agreement — not with violence, but with the {adj} authority of consequence.',
        onSuccess: {
          narrative: '{actor}\'s {adj} resolve closes the matter. Payment arrives, and the agreement is honoured, if {adj}ly.',
          reputationDelta: 0.10,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The debtor walks. {actor} is left holding a {adj} broken agreement and a lesson in the limits of paper contracts.',
          reputationDelta: -0.08,
        },
      },
    ],
  },

  // ── Smuggler's Den (2) ─────────────────────────────────────────
  {
    id: 'encounter.black_market_deal',
    name: 'Black Market Deal',
    locationTypes: ['hamlet', 'town', 'city', 'capital'],
    sublocationTypes: ['sublocation-type.smugglers-den'],
    reachPrimary: 'gold',
    reachSecondary: 'shadow',
    encounterType: 'steal',
    threatRating: 'moderate',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
    steps: [
      {
        id: 'black_market_deal.contact',
        name: 'The Contact',
        reach: 'shadow',
        difficulty: DIFFICULTY_BASE,
        duration: 2,
        narrative: '{actor} follows {adj} directions to a {adj} room that smells of tallow and secrets. The broker is there. So, perhaps, is a watcher.',
        onSuccess: {
          narrative: '{actor} arrives {adj}ly, reads the room, and signals in the right way. The broker {verb}s the goods out from under the table.',
          reputationDelta: 0.03,
        },
        onFailure: {
          narrative: '{actor} {verb}s too {adj} conspicuously. Eyes {verb} in the room. The broker packs up and leaves without a word.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'black_market_deal.purchase',
        name: 'The Purchase',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 1,
        narrative: 'The goods are real. The risk is real. {actor} must buy quickly, pay without haggling, and leave before the situation {verb}s complicated.',
        onSuccess: {
          narrative: '{actor} completes the exchange with {adj} economy of movement. No names. No receipts. The goods are worth the {adj} risk.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.7, condition: 0.3 },
            tagFilters: ['#shadow', '#stealth'],
          },
        },
        onFailure: {
          narrative: 'Something {verb}s wrong. The goods are seized, or {actor} is marked as a buyer. The {adj} exposure will cost more than coin.',
          reputationDelta: -0.10,
          rewardPool: {
            categoryWeights: { possession: 0.7, condition: 0.3 },
            tagFilters: ['#shadow', '#stealth'],
          },
        },
      },
    ],
  },
  {
    id: 'encounter.the_fence',
    name: 'The Fence',
    locationTypes: ['hamlet', 'town', 'city', 'capital'],
    sublocationTypes: ['sublocation-type.smugglers-den'],
    reachPrimary: 'shadow',
    reachSecondary: 'gold',
    encounterType: 'steal',
    threatRating: 'easy',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
    steps: [
      {
        id: 'the_fence.transaction',
        name: 'The Transaction',
        reach: 'shadow',
        difficulty: DIFFICULTY_BASE,
        duration: 2,
        narrative: '{actor} has goods that cannot be sold honestly. The fence names a price — {adj}, naturally. {actor} must take it, or try {their} luck elsewhere in this {adj} quarter.',
        onSuccess: {
          narrative: 'The exchange is made in {adj} silence. {actor} walks out lighter and richer, no record left behind.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: 'The fence {verb}s the goods as {adj} too hot and waves {actor} off. Word {verb}s — the original owner is asking questions.',
          reputationDelta: -0.08,
        },
      },
      {
        id: 'the_fence.clean_exit',
        name: 'The Clean Exit',
        reach: 'shadow',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 1,
        narrative: 'Coin in hand, {actor} must leave the {adj} quarter without attracting the wrong kind of interest. The streets here {verb} with {adj} memory.',
        onSuccess: {
          narrative: '{actor} {verb}s {adj}ly through the {adj} alleys and back into the light. No footprints. No witnesses.',
          reputationDelta: 0.07,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.7, condition: 0.3 },
          },
        },
        onFailure: {
          narrative: '{actor}\'s departure {verb}s. A constable {verb}s a {adj} glance; a neighbour {verb}s {their} face. The coin was earned — the attention was not.',
          reputationDelta: -0.06,
          rewardPool: {
            categoryWeights: { possession: 0.7, condition: 0.3 },
          },
        },
      },
    ],
  },

  // ── Caravan Rest (2) ──────────────────────────────────────────
  {
    id: 'encounter.toll_bridge',
    name: 'Toll Bridge',
    locationTypes: ['hamlet', 'town', 'city', 'capital', 'camp'],
    sublocationTypes: ['sublocation-type.caravan-rest'],
    reachPrimary: 'gold',
    reachSecondary: 'heart',
    encounterType: 'lead',
    threatRating: 'easy',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
    steps: [
      {
        id: 'toll_bridge.control',
        name: 'The Control',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE,
        duration: 2,
        narrative: '{actor} holds the only crossing for a day\'s ride. Merchants must pass or go around. The toll — how much is {adj} enough? How much is {adj} too much?',
        onSuccess: {
          narrative: '{actor} sets a {adj} toll that merchants can bear without real complaint. Coin flows. Nobody loses a day.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: '{actor}\'s toll is {adj} too steep. One merchant turns back; another {verb}s a shortcut. The crossing earns {adj} less than it should.',
          reputationDelta: -0.04,
        },
      },
      {
        id: 'toll_bridge.reputation',
        name: 'The Reputation',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 4,
        narrative: 'Word of the toll {verb}s up and down the road. {actor} has a chance to shape what is said: {adj} fair tax, or {adj} bandit with a gate.',
        onSuccess: {
          narrative: 'Caravans speak of {actor}\'s toll as {adj} reasonable — expensive but {adj} honest. The road stays open and the coin keeps flowing.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The stories {verb} {adj} in the wrong direction. Merchants begin to find other routes, and the toll {verb}s less and less each week.',
          reputationDelta: -0.06,
        },
      },
    ],
  },
  {
    id: 'encounter.caravan_guard',
    name: 'Caravan Guard',
    locationTypes: ['hamlet', 'town', 'city', 'capital', 'camp'],
    sublocationTypes: ['sublocation-type.caravan-rest'],
    reachPrimary: 'iron',
    reachSecondary: 'gold',
    encounterType: 'hire',
    threatRating: 'moderate',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.hire,
    steps: [
      {
        id: 'caravan_guard.contract',
        name: 'The Contract',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: 'A merchant needs {adj} swords for a {adj} route known to attract attention. {actor} negotiates the rate and terms before the caravan leaves.',
        onSuccess: {
          narrative: '{actor} agrees {adj} terms: fair pay, clear expectations, and a bonus if the goods arrive {adj} intact. The merchant {verb}s with relief.',
          reputationDelta: 0.03,
        },
        onFailure: {
          narrative: '{actor}\'s terms {verb} badly. The merchant {verb}s away for cheaper swords, and the {adj} coin goes with them.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'caravan_guard.escort',
        name: 'The Escort',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'Three days on the road. On the second, riders {verb} on the horizon. {actor} must position the guards and read whether this is {adj} threat or {adj} coincidence.',
        onSuccess: {
          narrative: '{actor}\'s {adj} positioning {verb}s. The riders veer off, unwilling to test a {adj} prepared escort. The caravan arrives {adj} whole.',
          reputationDelta: 0.10,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s guard is {adj} caught flat. The ambush strips the caravan of a {adj} portion of its cargo. The merchant {verb}s in {adj} fury.',
          reputationDelta: -0.08,
        },
      },
      {
        id: 'caravan_guard.delivery',
        name: 'The Delivery',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'The road\'s last stretch is the {adj} hardest. Rumour of a second ambush {verb}s the merchants\' nerves. {actor} must hold the guard together.',
        onSuccess: {
          narrative: '{actor}\'s {adj} steadiness {verb} through to the gates. The bonus is paid; the merchant {verb}s a name worth remembering.',
          reputationDelta: 0.14,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The {adj} final stretch costs too much. Cargo lost, guards shaken. {actor} delivers what {they} can, but the contract {verb}s in failure.',
          reputationDelta: -0.10,
        },
      },
    ],
  },
];

// ─── Cultural Encounter Overlays ───────────────────────────────────

/**
 * 6 cultural vocabulary sets that modify step prose generation
 * without changing the underlying structure. Each covers foundation
 * sphere affinities (chaos, order, light, darkness) plus key creation
 * spheres (force, mind).
 */
export const CULTURAL_ENCOUNTER_OVERLAYS: Record<
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

// ─── Encounter Inspection Vignettes ────────────────────────────────
//
// Prose describing what a player/god observes when inspecting a location
// with active encounter activity, completed success, or failed attempt.

export const ENCOUNTER_INSPECTION_VIGNETTES = {
  inProgress: [
    'The air thrums with barely-contained trial. A figure moves through the test, strain evident in every breath and gesture. The outcome hangs unresolved.',
    'Ritual markers glow faintly on the ground, pulsing with the cadence of the encounter\'s progression. The candidate struggles forward, will against demand.',
    'The location crackles with sacred tension. An encounter is underway—the veil between triumph and ruin paper-thin here.',
    'Threads of consequence shimmer around the encounter. The outcome is not yet written; the candidate still pushes against their limit.',
    'The ground seems to hold its breath. An encounter unfolds—a test older than kingdoms, demanding payment in will or blood.',
    'Unresolved power coils in this place. The encounter is active; success is still possible, but the way is steep and uncertain.',
    'A figure stands at the threshold between trials, the encounter\'s weight pressing down. The next moment will reshape them or break them.',
    'The location is thick with challenge and determination. An encounter is being faced; the candidate is neither victor nor corpse—yet.',
    'Echoes of ancient tests linger here, now playing out again through a new candidate. The outcome remains suspended, waiting.',
    'The air smells of sweat and magic. An encounter is underway—hope and despair both possible in the next heartbeat.',
  ],
  completed: [
    'The location is serene now, the encounter\'s fire extinguished. A figure bears the marks of having passed through trial—scarred, changed, unmistakably stronger.',
    'This place remembers victory. The encounter has been completed; remnants of challenge still linger, but the candidate walks freely, bearing the weight of their triumph.',
    'A glow of completion rests upon this location. The encounter is finished; the candidate succeeded, and the land itself seems to acknowledge their new standing.',
    'The traces of trial have faded, leaving behind only the echo of a completed encounter. The candidate moves with the certainty of having endured and prevailed.',
    'This location holds the silence of finished trials. The encounter is complete; the candidate stands transformed, carrying proof of their passage in bearing and breath.',
  ],
  failed: [
    'The ground is scarred here, torn by an encounter that ended in defeat. The candidate retreated or was cast back; failure clings to this place like ash.',
    'Something is broken here—not just in stone and structure, but in the air itself. An encounter failed; the candidate was found wanting, and the trial\'s mercy is the only mercy they received.',
    'The location is hollow now, drained. An encounter was attempted and did not end in victory. The candidate bears the invisible marks of trial that broke them.',
  ],
};

// ═══════════════════════════════════════════════════════════════════
// ENCOUNTER SYSTEM CONNECTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Connections between encounters and other game systems: doom clock,
 * cultural forces, and rival god interference. These templates describe
 * how external forces shape or complicate an encounter's outcome.
 */
export interface EncounterSystemConnection {
  id: string;
  trigger: string;
  prose: string;
}

export const ENCOUNTER_SYSTEM_CONNECTIONS: {
  doom: EncounterSystemConnection[];
  culture: EncounterSystemConnection[];
  rival: EncounterSystemConnection[];
} = {
  doom: [
    {
      id: 'doom_intensification',
      trigger: 'Rising doom clock (>60%) intensifies encounter stakes',
      prose: 'The air thickens with dread. As doom rises, the encounter\'s weight compounds—{location} itself seems to turn hostile, magic warping under pressure. {actor} must not merely pass the trial but do so before the world\'s collapse becomes complete.',
    },
    {
      id: 'doom_corruption',
      trigger: 'High doom (>80%) corrupts encounter outcome',
      prose: 'The encounter has been touched by the approaching unmaking. Reality flickers here; success feels possible, but fragile. Even if {actor} prevails, the victory tastes ashen—tainted by knowledge that the world itself might not survive to remember {their} triumph.',
    },
    {
      id: 'doom_acceleration',
      trigger: 'Encounter completion (success or failure) accelerates doom by 5 ticks',
      prose: 'The {location} trembles as the encounter concludes. Whether {actor} triumphed or fell, the trial\'s conclusion sends ripples outward—the doom clock ticks faster, as if the world must compress its reckoning into dwindling moments.',
    },
  ],
  culture: [
    {
      id: 'culture_facilitation',
      trigger: 'Encounter\'s culture shares {actor}\'s cultural identity (>70% similarity)',
      prose: 'The encounter speaks {actor}\'s language. The rituals, the methods, the values tested here align with {their} own culture\'s traditions. {They} move through the trial with native grace—threads of {their} people\'s wisdom guide each step, making the impossible merely difficult.',
    },
    {
      id: 'culture_opposition',
      trigger: 'Encounter\'s culture opposes {actor}\'s cultural values (tension >0.6)',
      prose: 'The encounter demands something {actor}\'s culture forbids. Each test feels like a betrayal of {their} own people. {They} must choose between honoring the tradition and passing the trial—a choice that will mark {them} forever in the eyes of {their} kind.',
    },
    {
      id: 'culture_transformation',
      trigger: 'Success in culturally opposed encounter grants cultural trait',
      prose: 'By passing this encounter on foreign terms, {actor} is reforged. The culture of the trial seeps into {their} bones—{they} carry back not just triumph but a piece of something alien, woven now into {their} identity. {They} are no longer purely what {they} were.',
    },
  ],
  rival: [
    {
      id: 'rival_interference',
      trigger: 'Rival god opposes {actor}\'s sphere (faction conflict)',
      prose: '{actor} is not alone in the encounter. Phantom presence shadows every choice—a rival god, sensing vulnerability. The trial becomes a battleground; {actor} must overcome not just the encounter\'s design but the subtle corruption that seeks to twist success into ruin.',
    },
    {
      id: 'rival_corruption',
      trigger: 'Rival agent stationed in encounter location',
      prose: 'The encounter has been corrupted from within. A servant of a rival god moves through the trial\'s spaces, ready to tip the scales. {actor} must not only face the test but navigate {their} presence—and decide whether to confront {them} directly or move unseen.',
    },
    {
      id: 'rival_escalation',
      trigger: 'Encounter victory grants {rival god} 0.3 escalation in response',
      prose: 'As {actor} claims triumph, distant divine laughter echoes. A rival god recognizes the shift in power and rises to meet it. The victory is real—but {it} has been noticed, and the consequences ripple outward faster now. The game\'s stakes climb.',
    },
  ],
};

// ─── Encounter Verb/Action/Noun Pools ────────────────────────────

/** Verbs for encounter narratives (base form — 's' is appended for 3rd person) */
const ENCOUNTER_VERB_POOL = [
  'stir', 'pulse', 'howl', 'surge', 'seethe', 'coil', 'groan',
  'tremble', 'shift', 'crack', 'burn', 'ring', 'echo', 'flash',
  'waver', 'flicker', 'twist', 'shatter', 'bloom', 'fade',
];

/** Action phrases for {action} placeholder */
const ENCOUNTER_ACTION_POOL = [
  'practiced hands', 'iron will', 'careful deliberation',
  'raw instinct', 'patient skill', 'fierce focus',
  'quiet precision', 'desperate strength', 'steady rhythm',
];

/** Nouns for {noun} placeholder */
const ENCOUNTER_NOUN_POOL = [
  'purpose', 'strength', 'resolve', 'shadow', 'faith',
  'devotion', 'silence', 'defiance', 'memory', 'ruin',
  'ambition', 'cunning', 'valor', 'wisdom', 'fury',
];

// ─── Narrative Resolver ──────────────────────────────────────────

/**
 * Simple deterministic hash from a string seed → number.
 * Used to pick words consistently for the same encounter step.
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Resolve template placeholders in an encounter narrative string.
 *
 * Replaces {actor}, {adj}, {verb}, {verb}s, {themselves}, {their},
 * {them}, {They}, {they}, {action}, {noun}, {target}, {it}.
 *
 * Multiple occurrences of {adj} in the same string get different adjectives
 * by cycling through the pool with an incrementing offset.
 */
export function resolveEncounterNarrative(
  narrative: string,
  actorName: string,
  stepId: string,
  threatRating: string = 'moderate',
): string {
  const seed = simpleHash(stepId);

  // Pick adjective tier based on threat rating
  const tierKey =
    threatRating === 'trivial' || threatRating === 'easy' ? 'early'
    : threatRating === 'hard' || threatRating === 'deadly' ? 'late'
    : 'mid';
  const adjPool = ENCOUNTER_DIFFICULTY_TIERS[tierKey].toneAdjectives;

  let text = narrative;

  // Replace {actor} globally
  text = text.replace(/\{actor\}/g, actorName);

  // Replace pronouns
  text = text.replace(/\{themselves\}/g, 'themselves');
  text = text.replace(/\{their\}/g, 'their');
  text = text.replace(/\{them\}/g, 'them');
  text = text.replace(/\{They\}/g, 'They');
  text = text.replace(/\{they\}/g, 'they');
  text = text.replace(/\{it\}/g, 'it');

  // Replace {target} with generic (no target context in display)
  text = text.replace(/\{target\}/g, 'their opponent');

  // Replace {verb}s first (before {verb}) — base form + 's'
  let verbIdx = seed;
  text = text.replace(/\{verb\}s/g, () => {
    const verb = ENCOUNTER_VERB_POOL[verbIdx % ENCOUNTER_VERB_POOL.length];
    verbIdx++;
    return verb + 's';
  });
  // Replace remaining {verb} — also conjugated 3rd person
  text = text.replace(/\{verb\}/g, () => {
    const verb = ENCOUNTER_VERB_POOL[verbIdx % ENCOUNTER_VERB_POOL.length];
    verbIdx++;
    return verb + 's';
  });

  // Replace {adj} — cycle through pool for variety
  let adjIdx = seed;
  text = text.replace(/\{adj\}/g, () => {
    const adj = adjPool[adjIdx % adjPool.length];
    adjIdx++;
    return adj;
  });

  // Replace {action}
  text = text.replace(/\{action\}/g, () => {
    return ENCOUNTER_ACTION_POOL[seed % ENCOUNTER_ACTION_POOL.length];
  });

  // Replace {noun}
  let nounIdx = seed;
  text = text.replace(/\{noun\}/g, () => {
    const noun = ENCOUNTER_NOUN_POOL[nounIdx % ENCOUNTER_NOUN_POOL.length];
    nounIdx++;
    return noun;
  });

  return text;
}

// ─── Lookup Functions ───────────────────────────────────────────

/**
 * Return all encounters available at a given location type.
 */
export function getEncountersByLocationType(locationType: string): EncounterTemplate[] {
  return ENCOUNTER_TEMPLATES.filter(encounter =>
    encounter.locationTypes.includes(locationType)
  );
}

/**
 * Get encounter templates that match a sublocation's type.
 * Templates with `sublocationTypes` field are matched against the sublocation type ID.
 * Templates without `sublocationTypes` are included as fallback (matched via locationTypes).
 */
export function getEncountersBySublocationAndLocation(
  sublocationTypeId: string,
  locationType: string,
): EncounterTemplate[] {
  return ENCOUNTER_TEMPLATES.filter(t => {
    if (t.sublocationTypes && t.sublocationTypes.length > 0) {
      return t.sublocationTypes.includes(sublocationTypeId);
    }
    // Fallback: templates without sublocationTypes use locationTypes
    return t.locationTypes.includes(locationType);
  });
}

/**
 * Return all encounters available at a location, including those that target
 * sublocation types present at that location subtype.
 * Use this when building the full encounter list for a location view.
 */
export function getEncountersForLocation(
  locationType: string,
  sublocationTypeIds: string[],
): EncounterTemplate[] {
  return ENCOUNTER_TEMPLATES.filter(t => {
    if (t.sublocationTypes && t.sublocationTypes.length > 0) {
      return t.sublocationTypes.some(st => sublocationTypeIds.includes(st));
    }
    return t.locationTypes.includes(locationType);
  });
}

/**
 * Retrieve a specific encounter by ID (exploration templates only).
 */
export function getEncounterById(id: string): EncounterTemplate | undefined {
  return ENCOUNTER_TEMPLATES.find(encounter => encounter.id === id);
}

/**
 * Retrieve any encounter by ID — checks exploration templates first,
 * then social encounter templates. Use this everywhere an encounter
 * might be either type (resolution, advancement, display).
 */
export function getAnyEncounterById(id: string): EncounterTemplate | undefined {
  return ENCOUNTER_TEMPLATES.find(encounter => encounter.id === id)
    ?? getSocialEncounterById(id)
    ?? getFactionEncounterById(id);
}
