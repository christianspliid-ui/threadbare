/**
 * Encounter Content Package — 115 encounter templates (76 location-specific + 18 universal + 21 gap-fill) with cultural vocabulary overlays.
 *
 * ═══════════════════════════════════════════════════════════════════
 * CONTENT MANAGER: This is the file you edit to change encounter templates,
 * step sequences, difficulty curves, and cultural prose variations.
 * ═══════════════════════════════════════════════════════════════════
 */

import type { EncounterTemplate } from '../types/encounter';
import { ENCOUNTER_TYPE_MOTIVATIONS } from '../types/encounter';
import type { LocationSubtype } from '../types/index';
import { getSocialEncounterById } from './social-encounter-content';
import { getFactionEncounterById } from './faction-encounter-content';
import { getMercenaryEncounterById } from './mercenary-encounter-content';
import { ANOMALY_ENCOUNTER_TEMPLATES } from './encounter-anomaly-content';
import { getArmyEncounterById } from './army-encounter-content';
import { getMonsterEncounterById } from './monster-encounter-content';
import { getBorderlandEncounterById, BORDERLAND_ENCOUNTER_TEMPLATES } from './borderland-encounter-content';

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

/** Difficulty progression within a template (escalates per step).
 * Easy tier: starting agents (cap ~0.05–0.15) can pass step 1 ~10–20% of the time.
 * Formula: prob = cap + mods - diff/100, clamped [0.05, 0.95].
 * Design goal: agents always progress slowly, reaching cap ~1.0 around tick 1000. */
const DIFFICULTY_BASE = 10;
const DIFFICULTY_STEP = 8;

/** Difficulty base for moderate encounters (mid-game agents, cap ~0.30–0.50) */
const MODERATE_DIFFICULTY_BASE = 25;
const MODERATE_DIFFICULTY_STEP = 8;
/** Difficulty base for hard encounters (experienced agents, cap ~0.50–0.75) */
const HARD_DIFFICULTY_BASE = 40;
const HARD_DIFFICULTY_STEP = 10;
/** Difficulty base for deadly encounters (master-tier agents, cap ~0.75+) */
const DEADLY_DIFFICULTY_BASE = 60;
const DEADLY_DIFFICULTY_STEP = 10;

/** Difficulty base for universal (fallback) encounters — accessible to all agents */
const UNIVERSAL_DIFFICULTY_BASE = 5;
/** Difficulty step between stages in universal encounters */
const UNIVERSAL_DIFFICULTY_STEP = 5;
/** Difficulty base for reach-agnostic encounters — near-guaranteed pass for any agent */
const AGNOSTIC_DIFFICULTY_BASE = 3;
/** Difficulty step for reach-agnostic encounters */
const AGNOSTIC_DIFFICULTY_STEP = 3;

/**
 * Every LocationSubtype value — used by universal encounters that should
 * appear at any settlement regardless of type.
 */
const ALL_LOCATION_SUBTYPES: LocationSubtype[] = [
  'hamlet', 'town', 'city', 'capital',
  'camp', 'farmland',
  'castle', 'fort', 'tower', 'shrine', 'temple',
  'mining', 'ruins', 'ruined_tower', 'ruined_city', 'ruined_village',
  'battleground', 'oasis', 'unexplored_poi',
  'wilderness',
];

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

// ─── Encounter Templates ──────────────────────────────────────

/**
 * 76 location-specific encounter archetypes + 18 universal fallbacks.
 * Location-specific: 3 steps with escalating difficulty (25 → 35 → 45).
 * Universal: 2 steps, lower difficulty (20 → 25), available at every location type.
 * Reach-agnostic: 2 steps, extra-low difficulty (15 → 20), near-guaranteed pass.
 */
export const ENCOUNTER_TEMPLATES: EncounterTemplate[] = [
  {
    id: 'encounter.deep_descent',
    name: 'The Deep Descent',
    locationTypes: ['ruins', 'ruined_tower', 'ruined_city', 'mining', 'unexplored_poi'],
    sublocationTypes: ['sublocation-type.dungeon'],
    reachPrimary: 'iron',
    reachSecondary: 'shadow',
    encounterType: 'explore',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
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
            tagFilters: ['#ancient'],
          },
        },
        onFailure: {
          narrative: 'The abyss {verb} and {actor} is cast back, {adj} and broken, to the light above.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { condition: 0.4, bestowed_power: 0.4, possession: 0.2 },
            tagFilters: ['#ancient'],
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
    intrinsicTier: 'shaping',
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
    intrinsicTier: 'shaping',
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
            tagFilters: ['#divine'],
          },
        },
        onFailure: {
          narrative: 'The vision overwhelms {actor}. They stumble back into flesh and breath, {adj} and diminished.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { condition: 0.4, bestowed_power: 0.4, possession: 0.2 },
            tagFilters: ['#divine'],
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
    intrinsicTier: 'shaping',
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
    intrinsicTier: 'shaping',
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
            tagFilters: ['#shadow'],
          },
        },
        onFailure: {
          narrative: 'The stronghold erupts. {actor} flees {adj} and wounded, the job left incomplete.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 0.7, condition: 0.3 },
            tagFilters: ['#shadow'],
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
    intrinsicTier: 'shaping',
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
    intrinsicTier: 'shaping',
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
    reachPrimary: 'gold',
    reachSecondary: 'heart',
    encounterType: 'assist',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ['courage_prudence', 'loyalty_ambition'],
    steps: [
      {
        id: 'healers_oath.diagnosis',
        name: 'The Diagnosis',
        reach: 'gold',
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
        reach: 'gold',
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
    intrinsicTier: 'shaping',
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
    intrinsicTier: 'shaping',
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
            tagFilters: ['#divine'],
          },
        },
        onFailure: {
          narrative: '{actor} falters in the liminal space. The door closes, and {they} return {adj} but incomplete.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { condition: 0.4, bestowed_power: 0.4, possession: 0.2 },
            tagFilters: ['#divine'],
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
    intrinsicTier: 'background',
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
    locationTypes: ['ruins', 'ruined_tower', 'ruined_city', 'unexplored_poi'],
    sublocationTypes: ['sublocation-type.dungeon', 'sublocation-type.library'],
    reachPrimary: 'eye',
    reachSecondary: 'shadow',
    encounterType: 'acquire',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
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
    locationTypes: ['farmland', 'hamlet', 'oasis', 'ruined_village'],
    reachPrimary: 'gold',
    reachSecondary: 'stone',
    encounterType: 'acquire',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.acquire,
    steps: [
      {
        id: 'harvest_bounty.gathering',
        name: 'The Gathering',
        reach: 'gold',
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
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 3,
        narrative: '{actor} discovers a {adj} surplus hidden in the fields—a fortune for those who claim it.',
        onSuccess: {
          narrative: '{actor} discovers and secures the {adj} surplus, blessing the settlement and {their} own wealth.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
            tagFilters: ['#survival'],
          },
        },
        onFailure: {
          narrative: '{actor} finds the surplus but cannot carry it. Rival claimants arrive, and the prize is {adj} lost.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
            tagFilters: ['#survival'],
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
    intrinsicTier: 'shaping',
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
    intrinsicTier: 'shaping',
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
    intrinsicTier: 'background',
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
    locationTypes: ['mining', 'camp', 'wilderness', 'unexplored_poi'],
    reachPrimary: 'stone',
    reachSecondary: 'gold',
    encounterType: 'acquire',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
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
            tagFilters: ['#survival'],
          },
        },
        onFailure: {
          narrative: 'Thieves or disaster strike. {actor} arrives with {adj} material or none at all, {their} profit {adj}.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
            tagFilters: ['#survival'],
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
    intrinsicTier: 'shaping',
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
    locationTypes: ['hamlet', 'shrine', 'camp', 'ruined_village'],
    reachPrimary: 'gold',
    reachSecondary: 'veil',
    encounterType: 'create',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.create,
    steps: [
      {
        id: 'brew_potion.gathering',
        name: 'The Gathering',
        reach: 'gold',
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
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 5,
        narrative: 'The potion must be distilled to {adj} potency. {actor} must refine it without losing the magic.',
        onSuccess: {
          narrative: '{actor} bottles a {adj} potion, {adj} and alive with power, a masterwork of the brewer\'s art.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#veil'],
          },
        },
        onFailure: {
          narrative: 'The potion {verb}s during distillation. {actor} is left with only {adj} residue.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#veil'],
          },
        },
      },
    ],
  },
  {
    id: 'encounter.inscribe_ward',
    name: 'The Inscribe Ward',
    locationTypes: ['tower', 'temple', 'ruins', 'ruined_tower'],
    reachPrimary: 'veil',
    reachSecondary: 'eye',
    encounterType: 'create',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
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
    intrinsicTier: 'background',
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
    locationTypes: ['shrine', 'camp', 'wilderness', 'unexplored_poi'],
    reachPrimary: 'veil',
    reachSecondary: 'veil',
    encounterType: 'create',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
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
            tagFilters: ['#arcane'],
          },
        },
        onFailure: {
          narrative: 'The binding {verb}s. The spirit flees, and {actor} is left with an {adj} husk.',
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
    id: 'encounter.raise_monument',
    name: 'The Raise Monument',
    locationTypes: ['capital', 'city', 'battleground'],
    reachPrimary: 'stone',
    reachSecondary: 'star',
    encounterType: 'create',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
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
    locationTypes: ['hamlet', 'town', 'farmland', 'ruined_village', 'battleground'],
    reachPrimary: 'heart',
    reachSecondary: 'iron',
    encounterType: 'hire',
    threatRating: 'easy',
    intrinsicTier: 'background',
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
    intrinsicTier: 'shaping',
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
    intrinsicTier: 'shaping',
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
    intrinsicTier: 'shaping',
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
    intrinsicTier: 'shaping',
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
    locationTypes: ['wilderness', 'oasis', 'camp', 'unexplored_poi'],
    reachPrimary: 'star',
    reachSecondary: 'gold',
    encounterType: 'hire',
    threatRating: 'trivial',
    intrinsicTier: 'background',
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
    locationTypes: ['town', 'hamlet', 'camp', 'ruined_village'],
    reachPrimary: 'iron',
    reachSecondary: 'gold',
    encounterType: 'duel',
    threatRating: 'easy',
    intrinsicTier: 'background',
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
        reach: 'gold',
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
    intrinsicTier: 'shaping',
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
    intrinsicTier: 'shaping',
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
    locationTypes: ['ruins', 'wilderness', 'camp', 'unexplored_poi'],
    reachPrimary: 'shadow',
    reachSecondary: 'iron',
    encounterType: 'duel',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
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
    intrinsicTier: 'story_beat',
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
    intrinsicTier: 'shaping',
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
    intrinsicTier: 'background',
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
    intrinsicTier: 'shaping',
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
    reachSecondary: 'gold',
    encounterType: 'steal',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
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
        reach: 'gold',
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
            tagFilters: ['#ancient'],
          },
        },
        onFailure: {
          narrative: '{actor} is caught by the curse. {They} flee {adj} and cursed, the treasures left behind.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 0.7, condition: 0.3 },
            tagFilters: ['#ancient'],
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
    intrinsicTier: 'shaping',
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
    intrinsicTier: 'shaping',
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
            tagFilters: ['#shadow'],
          },
        },
        onFailure: {
          narrative: '{actor}\'s escape {verb}s. Guards {verb} {them} and {they} are {adj} captured, the secrets lost.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 0.7, condition: 0.3 },
            tagFilters: ['#shadow'],
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
    intrinsicTier: 'background',
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
    intrinsicTier: 'shaping',
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
    intrinsicTier: 'shaping',
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
            tagFilters: ['#shadow'],
          },
        },
        onFailure: {
          narrative: '{actor}\'s pact {verb}s {adj}. The smuggler {verb}s {actor} and {verb}s into the night.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 0.9, condition: 0.1 },
            tagFilters: ['#shadow'],
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
    intrinsicTier: 'shaping',
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
    locationTypes: ['wilderness', 'hamlet', 'camp', 'ruined_village', 'oasis'],
    reachPrimary: 'gold',
    reachSecondary: 'gold',
    encounterType: 'trade',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    steps: [
      {
        id: 'barter_survival.hunt',
        name: 'The Hunt',
        reach: 'gold',
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
        reach: 'gold',
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
    intrinsicTier: 'shaping',
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
            tagFilters: ['#arcane'],
          },
        },
        onFailure: {
          narrative: '{actor}\'s {adj} blessings {verb} {adj}. {They} {verb} {adj} and {adj} cursed instead.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 0.9, condition: 0.1 },
            tagFilters: ['#arcane'],
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
    locationTypes: ['hamlet', 'town', 'ruined_village'],
    reachPrimary: 'heart',
    reachSecondary: 'gold',
    encounterType: 'assist',
    threatRating: 'easy',
    intrinsicTier: 'background',
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
        reach: 'gold',
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
    reachPrimary: 'gold',
    reachSecondary: 'heart',
    encounterType: 'assist',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
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
        reach: 'gold',
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
    intrinsicTier: 'shaping',
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
    intrinsicTier: 'background',
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
    intrinsicTier: 'shaping',
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
    intrinsicTier: 'shaping',
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
    intrinsicTier: 'shaping',
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
    intrinsicTier: 'shaping',
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
    intrinsicTier: 'background',
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
    intrinsicTier: 'shaping',
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
    intrinsicTier: 'shaping',
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
    intrinsicTier: 'shaping',
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
    intrinsicTier: 'background',
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
    intrinsicTier: 'story_beat',
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
    intrinsicTier: 'story_beat',
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
    intrinsicTier: 'background',
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
    intrinsicTier: 'shaping',
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
    intrinsicTier: 'shaping',
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
    intrinsicTier: 'background',
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
    intrinsicTier: 'background',
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
    intrinsicTier: 'shaping',
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
            tagFilters: ['#survival'],
          },
        },
        onFailure: {
          narrative: 'The shaft {verb}s with terrible finality. {actor} escapes, but the ore is buried and {they} carry a {adj} injury for their boldness.',
          reputationDelta: -0.10,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
            tagFilters: ['#survival'],
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
    intrinsicTier: 'background',
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
    intrinsicTier: 'shaping',
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
    intrinsicTier: 'shaping',
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
            tagFilters: ['#beast'],
          },
        },
        onFailure: {
          narrative: 'The {adj} second wave crashes over the defences. {actor} survives, but the raid leaves the harbor {adj} gutted.',
          reputationDelta: -0.12,
          rewardPool: {
            categoryWeights: { condition: 0.6, possession: 0.4 },
            tagFilters: ['#beast'],
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
    intrinsicTier: 'background',
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
    intrinsicTier: 'shaping',
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
    intrinsicTier: 'shaping',
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
            tagFilters: ['#shadow'],
          },
        },
        onFailure: {
          narrative: 'Something {verb}s wrong. The goods are seized, or {actor} is marked as a buyer. The {adj} exposure will cost more than coin.',
          reputationDelta: -0.10,
          rewardPool: {
            categoryWeights: { possession: 0.7, condition: 0.3 },
            tagFilters: ['#shadow'],
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
    intrinsicTier: 'background',
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
    intrinsicTier: 'background',
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
    intrinsicTier: 'shaping',
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

  // ─── Higher-Difficulty Location-Specific Templates (diff 40–90) ────
  //
  // 30+ templates for mid-game and late-game agents across all archetypes.
  // Difficulty tiers: moderate (40–50), hard (60–70), deadly (80–90).
  // Added in Phase 15 Plan 03 to extend progression beyond the early-game pool.

  // ── Settlement Types ──────────────────────────────────────────────

  {
    id: 'encounter.guild_initiation_trial',
    name: 'Guild Initiation Trial',
    locationTypes: ['hamlet', 'town', 'city'],
    reachPrimary: 'iron',
    reachSecondary: 'heart',
    encounterType: 'hire',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ['mercy_ruthlessness', 'loyalty_ambition'],
    steps: [
      {
        id: 'guild_initiation.challenge',
        name: 'The Opening Challenge',
        reach: 'iron',
        difficulty: MODERATE_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'The guild masters watch from the gallery as {actor} steps onto the trial floor. Every {adj} eye measures them for weakness.',
        onSuccess: {
          narrative: '{actor} meets the first challenge with {adj} composure. The gallery murmurs in approval.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s first move {verb}s under scrutiny. The masters make {adj} notes.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'guild_initiation.prove_worth',
        name: 'Prove Your Worth',
        reach: 'heart',
        difficulty: MODERATE_DIFFICULTY_BASE + MODERATE_DIFFICULTY_STEP,
        duration: 2,
        narrative: 'The final test is not skill — it is allegiance. {actor} must declare what {they} stand for before the assembled guild.',
        onSuccess: {
          narrative: '{actor}\'s words ring {adj} and true. The guild offers the oath of membership.',
          reputationDelta: 0.10,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The guild finds {actor}\'s declaration {adj} and hollow. Membership is withheld — for now.',
          reputationDelta: -0.05,
        },
      },
    ],
  },

  {
    id: 'encounter.master_craftsman_challenge',
    name: 'Master Craftsman Challenge',
    locationTypes: ['town', 'city', 'capital'],
    reachPrimary: 'stone',
    reachSecondary: 'gold',
    encounterType: 'create',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ['preservation_transformation', 'asceticism_extravagance'],
    steps: [
      {
        id: 'master_craftsman.design',
        name: 'The Commission',
        reach: 'stone',
        difficulty: HARD_DIFFICULTY_BASE,
        duration: 2,
        narrative: 'A wealthy patron offers a commission no other craftsman will accept. {actor} examines the {adj} design and feels something awaken in {their} hands.',
        onSuccess: {
          narrative: '{actor} grasps the commission\'s hidden logic and begins with {adj} certainty.',
          reputationDelta: 0.06,
        },
        onFailure: {
          narrative: 'The design defeats {actor} at first reading. {They} must rebuild {their} approach.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'master_craftsman.execution',
        name: 'The Execution',
        reach: 'gold',
        difficulty: HARD_DIFFICULTY_BASE + HARD_DIFFICULTY_STEP,
        duration: 3,
        narrative: 'Days of work, each piece {adj} and precise. The patron visits to inspect progress, asking questions that probe {actor}\'s every decision.',
        onSuccess: {
          narrative: 'The patron {verb}s with delight. {Actor} has produced something remarkable — a piece that will outlast them both.',
          reputationDelta: 0.14,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.6, bestowed_power: 0.4 },
            tagFilters: ['#craft'],
          },
        },
        onFailure: {
          narrative: 'The patron is unmoved. {Actor}\'s work is {adj} competent but not {adj} extraordinary. The commission is paid — and not renewed.',
          reputationDelta: -0.06,
          rewardPool: {
            categoryWeights: { possession: 0.6, bestowed_power: 0.4 },
            tagFilters: ['#craft'],
          },
        },
      },
    ],
  },

  {
    id: 'encounter.political_intrigue',
    name: 'Political Intrigue at Court',
    locationTypes: ['city', 'capital'],
    reachPrimary: 'heart',
    reachSecondary: 'shadow',
    encounterType: 'lead',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ['honesty_cunning', 'loyalty_ambition'],
    steps: [
      {
        id: 'political_intrigue.read_room',
        name: 'Read the Room',
        reach: 'eye',
        difficulty: HARD_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'The court is a {adj} maze of alliances and grievances. {actor} must map the currents before speaking a word.',
        onSuccess: {
          narrative: '{actor} reads the court like a {adj} text — every faction\'s hope and fear made plain.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: '{actor} misreads a key faction\'s intent. {They} proceed on {adj} false ground.',
          reputationDelta: -0.04,
        },
      },
      {
        id: 'political_intrigue.play_factions',
        name: 'Play the Factions',
        reach: 'shadow',
        difficulty: HARD_DIFFICULTY_BASE + HARD_DIFFICULTY_STEP,
        duration: 2,
        narrative: 'The {adj} moment comes to act. {actor} must balance three competing demands without revealing their true purpose.',
        onSuccess: {
          narrative: '{actor} weaves through the court\'s {adj} web. Two factions leave satisfied, one intrigued. The outcome is theirs.',
          reputationDelta: 0.12,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The court sees through {actor}\'s {adj} maneuvering. Old alliances {verb} and new enemies are made.',
          reputationDelta: -0.08,
        },
      },
      {
        id: 'political_intrigue.secure_outcome',
        name: 'Secure the Outcome',
        reach: 'heart',
        difficulty: HARD_DIFFICULTY_BASE + HARD_DIFFICULTY_STEP * 2,
        duration: 2,
        narrative: 'The final negotiation. {actor} sits across from the court\'s most {adj} power and must close the deal.',
        onSuccess: {
          narrative: '{actor} secures the outcome through {adj} appeal to what the power truly values. The agreement is sealed.',
          reputationDelta: 0.16,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The final deal {verb}s apart. {actor} leaves court with nothing but {adj} lessons in the cost of overreach.',
          reputationDelta: -0.10,
        },
      },
    ],
  },

  {
    id: 'encounter.trade_caravan_escort',
    name: 'Trade Caravan Escort',
    locationTypes: ['hamlet', 'town', 'city'],
    reachPrimary: 'iron',
    reachSecondary: 'gold',
    encounterType: 'assist',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ['mercy_ruthlessness', 'asceticism_extravagance'],
    steps: [
      {
        id: 'caravan_escort.depart',
        name: 'Departure',
        reach: 'iron',
        difficulty: MODERATE_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'The caravan master is nervous — two caravans lost this season. {actor} must hold the {adj} convoy together from the first hour.',
        onSuccess: {
          narrative: '{actor} sets a {adj} pace and a clear watch rotation. The caravan departs in good order.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: 'The convoy staggers at the first sign of trouble. {actor} spends the {adj} first day managing fear, not movement.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'caravan_escort.ambush',
        name: 'Ambush on the Road',
        reach: 'iron',
        difficulty: MODERATE_DIFFICULTY_BASE + MODERATE_DIFFICULTY_STEP,
        duration: 2,
        narrative: 'Shapes move in the {adj} treeline. {actor} has seconds to react before the caravan freezes.',
        onSuccess: {
          narrative: '{actor} drives the {adj} threat off with decisive force. The caravan passes safely.',
          reputationDelta: 0.10,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.7, condition: 0.3 },
            tagFilters: ['#combat'],
          },
        },
        onFailure: {
          narrative: 'The ambush costs them half the goods and one of the {adj} guards. The caravan limps on.',
          reputationDelta: -0.07,
          rewardPool: {
            categoryWeights: { possession: 0.7, condition: 0.3 },
            tagFilters: ['#combat'],
          },
        },
      },
    ],
  },

  {
    id: 'encounter.festival_of_spheres',
    name: 'Festival of the Spheres',
    locationTypes: ['town', 'city', 'capital'],
    reachPrimary: 'veil',
    reachSecondary: 'heart',
    encounterType: 'explore',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ['tradition_novelty', 'loyalty_ambition'],
    steps: [
      {
        id: 'festival_spheres.participate',
        name: 'Join the Rites',
        reach: 'veil',
        difficulty: MODERATE_DIFFICULTY_BASE - 5,
        duration: 1,
        narrative: 'The Festival draws pilgrims from every road. {actor} must navigate the {adj} ritual protocols without giving offense.',
        onSuccess: {
          narrative: '{actor} moves through the rites with {adj} grace, earning nods from the officiants.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'A {adj} misstep in the rites draws whispers. {actor} finishes the ceremony under {adj} scrutiny.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'festival_spheres.commune',
        name: 'The Communal Offering',
        reach: 'heart',
        difficulty: MODERATE_DIFFICULTY_BASE + MODERATE_DIFFICULTY_STEP - 5,
        duration: 2,
        narrative: 'The climax of the Festival: a communal offering where each participant gives something of genuine worth. {actor} must choose {their} offering.',
        onSuccess: {
          narrative: '{actor}\'s offering {verb}s from {their} heart and is received with {adj} reverence.',
          reputationDelta: 0.12,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.5, condition: 0.5 },
            tagFilters: ['#heart'],
          },
        },
        onFailure: {
          narrative: '{actor}\'s offering is received politely, but the {adj} moment passes without connection.',
          reputationDelta: -0.02,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.5, condition: 0.5 },
            tagFilters: ['#heart'],
          },
        },
      },
    ],
  },

  {
    id: 'encounter.plague_outbreak',
    name: 'Plague Outbreak',
    locationTypes: ['hamlet', 'town', 'city'],
    reachPrimary: 'eye',
    reachSecondary: 'heart',
    encounterType: 'assist',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ['mercy_ruthlessness', 'revelation_discretion'],
    steps: [
      {
        id: 'plague_outbreak.diagnose',
        name: 'Diagnose the Sickness',
        reach: 'eye',
        difficulty: HARD_DIFFICULTY_BASE,
        duration: 2,
        narrative: 'The sick fill the streets. {actor} must determine the {adj} nature of the illness before panic does more damage than the disease.',
        onSuccess: {
          narrative: '{actor} identifies the pathogen and its {adj} vector. Containment becomes possible.',
          reputationDelta: 0.06,
        },
        onFailure: {
          narrative: '{actor} cannot determine the cause. Treatment is {adj} guesswork and the disease spreads.',
          reputationDelta: -0.05,
        },
      },
      {
        id: 'plague_outbreak.contain',
        name: 'Contain the Spread',
        reach: 'heart',
        difficulty: HARD_DIFFICULTY_BASE + HARD_DIFFICULTY_STEP,
        duration: 3,
        narrative: 'Containment means separating families, closing markets, enforcing {adj} quarantine against a people already broken by fear.',
        onSuccess: {
          narrative: '{actor} holds the line with {adj} compassion and firm resolve. The outbreak peaks and begins to fade.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { condition: 0.4, bestowed_power: 0.4, possession: 0.2 },
            tagFilters: ['#healing'],
          },
        },
        onFailure: {
          narrative: 'The {adj} quarantine breaks. The disease escapes containment and the settlement darkens.',
          reputationDelta: -0.10,
          rewardPool: {
            categoryWeights: { condition: 0.4, bestowed_power: 0.4, possession: 0.2 },
            tagFilters: ['#healing'],
          },
        },
      },
    ],
  },

  // ── Fort/Castle Types ─────────────────────────────────────────────

  {
    id: 'encounter.siege_defense_planning',
    name: 'Siege Defense Planning',
    locationTypes: ['fort', 'castle'],
    reachPrimary: 'iron',
    reachSecondary: 'star',
    encounterType: 'build',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ['mercy_ruthlessness', 'preservation_transformation'],
    steps: [
      {
        id: 'siege_defense.assess',
        name: 'Assess the Fortifications',
        reach: 'eye',
        difficulty: HARD_DIFFICULTY_BASE,
        duration: 2,
        narrative: 'The enemy is days away. {actor} walks the walls and towers, cataloguing every {adj} weakness with brutal honesty.',
        onSuccess: {
          narrative: '{actor} produces a {adj} clear assessment. The garrison knows exactly where to spend their last reserves.',
          reputationDelta: 0.06,
        },
        onFailure: {
          narrative: '{actor} overestimates the walls\' strength. The {adj} flaws remain hidden until the worst moment.',
          reputationDelta: -0.05,
        },
      },
      {
        id: 'siege_defense.fortify',
        name: 'Reinforce and Rally',
        reach: 'iron',
        difficulty: HARD_DIFFICULTY_BASE + HARD_DIFFICULTY_STEP,
        duration: 3,
        narrative: 'Stone and mortar fly. {actor} drives the garrison through {adj} exhausting repairs while keeping their spirits from breaking.',
        onSuccess: {
          narrative: 'The walls hold. When the enemy arrives, they find a garrison {adj} and ready.',
          reputationDelta: 0.14,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The repairs are unfinished and the garrison {adj} demoralized. The fort will face the siege undermanned.',
          reputationDelta: -0.08,
        },
      },
    ],
  },

  {
    id: 'encounter.prisoner_interrogation',
    name: 'Prisoner Interrogation',
    locationTypes: ['fort', 'castle'],
    reachPrimary: 'shadow',
    reachSecondary: 'heart',
    encounterType: 'acquire',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ['honesty_cunning', 'mercy_ruthlessness'],
    steps: [
      {
        id: 'prisoner_interrogation.approach',
        name: 'Choose Your Approach',
        reach: 'eye',
        difficulty: HARD_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'The prisoner sits across the {adj} table — frightened, defiant, calculating. {actor} must read which before a word is spoken.',
        onSuccess: {
          narrative: '{actor} reads the prisoner accurately and prepares the {adj} right approach.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: '{actor} misreads the prisoner\'s mask. The {adj} opening exchange gives too much away.',
          reputationDelta: -0.04,
        },
      },
      {
        id: 'prisoner_interrogation.extract',
        name: 'Extract the Truth',
        reach: 'shadow',
        difficulty: HARD_DIFFICULTY_BASE + HARD_DIFFICULTY_STEP,
        duration: 2,
        narrative: 'The prisoner holds something vital. {actor} must {verb} the truth free without breaking what they need to keep.',
        onSuccess: {
          narrative: '{actor} finds the {adj} crack in the prisoner\'s story and works it open. The information flows.',
          reputationDelta: 0.12,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The prisoner{verb}s their secrets tight. {actor} leaves with nothing but a {adj} waste of time.',
          reputationDelta: -0.07,
        },
      },
    ],
  },

  {
    id: 'encounter.fortification_engineering',
    name: 'Fortification Engineering',
    locationTypes: ['fort', 'castle'],
    reachPrimary: 'stone',
    reachSecondary: 'iron',
    encounterType: 'build',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ['preservation_transformation', 'sacrifice_survival'],
    steps: [
      {
        id: 'fortification_engineering.design',
        name: 'Survey and Design',
        reach: 'stone',
        difficulty: HARD_DIFFICULTY_BASE,
        duration: 2,
        narrative: 'The castle\'s {adj} expansion is needed — but the terrain resists. {actor} must find a design that works with the land, not against it.',
        onSuccess: {
          narrative: '{actor} finds the {adj} elegant solution — the expansion flows from the existing structure perfectly.',
          reputationDelta: 0.07,
        },
        onFailure: {
          narrative: 'The terrain defeats {actor}\'s first three designs. They proceed with a {adj} compromise.',
          reputationDelta: -0.04,
        },
      },
      {
        id: 'fortification_engineering.build',
        name: 'Oversee Construction',
        reach: 'iron',
        difficulty: HARD_DIFFICULTY_BASE + HARD_DIFFICULTY_STEP,
        duration: 4,
        narrative: 'Weeks of {adj} hard labor under {actor}\'s direction. Stone, mortar, timber — and the endless need to keep the workforce motivated and safe.',
        onSuccess: {
          narrative: 'The expansion stands {adj} and true. The castle is stronger than it has ever been.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'A {adj} structural flaw emerges on the final day. The work must be partially redone — at cost.',
          reputationDelta: -0.08,
        },
      },
    ],
  },

  // ── Ruins Types (Pale Cairn / Grey Meadowguard content deserts) ───

  {
    id: 'encounter.delve_into_depths',
    name: 'Delve into the Depths',
    locationTypes: ['ruins', 'ruined_city', 'ruined_tower', 'ruined_village'],
    reachPrimary: 'eye',
    reachSecondary: 'iron',
    encounterType: 'explore',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ['courage_prudence', 'revelation_discretion'],
    steps: [
      {
        id: 'delve_depths.descend',
        name: 'Find the Way Down',
        reach: 'eye',
        difficulty: MODERATE_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'The ruin\'s surface level has been picked clean. {actor} searches for the {adj} lower levels — the untouched places where the past still breathes.',
        onSuccess: {
          narrative: '{actor} discovers a {adj} collapse-blocked stair and clears the debris. The depths open below.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'Every passage {actor} finds is blocked beyond clearing. The {adj} depths stay sealed.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'delve_depths.navigate',
        name: 'Navigate the Ruin',
        reach: 'eye',
        difficulty: MODERATE_DIFFICULTY_BASE + MODERATE_DIFFICULTY_STEP,
        duration: 2,
        narrative: 'The lower levels are {adj} treacherous — floors that crumble, chambers that have not breathed fresh air in centuries.',
        onSuccess: {
          narrative: '{actor} reads the ruin\'s {adj} logic and moves through it safely, mapping as {they} go.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The ruin {verb}s against {actor}\'s advance. A partial collapse nearly buries them.',
          reputationDelta: -0.05,
        },
      },
      {
        id: 'delve_depths.retrieve',
        name: 'Retrieve the Prize',
        reach: 'iron',
        difficulty: MODERATE_DIFFICULTY_BASE + MODERATE_DIFFICULTY_STEP * 2,
        duration: 2,
        narrative: 'Something waits at the lowest level — artifact, archive, or {adj} horror. {actor} must take what they came for and get out.',
        onSuccess: {
          narrative: '{actor} emerges into daylight carrying {adj} evidence of what once was. The ruin has given up one of its secrets.',
          reputationDelta: 0.14,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.4, bestowed_power: 0.4, condition: 0.2 },
            tagFilters: ['#ancient'],
          },
        },
        onFailure: {
          narrative: '{actor} retreats empty-handed, the {adj} ruin\'s deepest places still jealously kept.',
          reputationDelta: -0.07,
          rewardPool: {
            categoryWeights: { possession: 0.4, bestowed_power: 0.4, condition: 0.2 },
            tagFilters: ['#ancient'],
          },
        },
      },
    ],
  },

  {
    id: 'encounter.decipher_ancient_inscriptions',
    name: 'Decipher Ancient Inscriptions',
    locationTypes: ['ruins', 'ruined_city'],
    reachPrimary: 'eye',
    reachSecondary: 'veil',
    encounterType: 'explore',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ['revelation_discretion', 'tradition_novelty'],
    steps: [
      {
        id: 'decipher_inscriptions.locate',
        name: 'Locate the Text',
        reach: 'eye',
        difficulty: HARD_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'The {adj} inscriptions are everywhere — walls, floors, lintels. But only some carry meaning. {actor} must find the {adj} primary text.',
        onSuccess: {
          narrative: '{actor} isolates the {adj} main inscription beneath centuries of grime. The language is archaic but legible.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} wastes hours on secondary texts. The {adj} primary inscription eludes them.',
          reputationDelta: -0.04,
        },
      },
      {
        id: 'decipher_inscriptions.translate',
        name: 'Work the Translation',
        reach: 'veil',
        difficulty: HARD_DIFFICULTY_BASE + HARD_DIFFICULTY_STEP,
        duration: 3,
        narrative: 'Days of {adj} painstaking work. The language bends meaning around concepts that do not exist in living tongues.',
        onSuccess: {
          narrative: '{actor} breaks the {adj} code. The inscription reveals something about the civilization that built this place — something that rewrites history.',
          reputationDelta: 0.16,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.6, possession: 0.4 },
            tagFilters: ['#ancient', '#knowledge'],
          },
        },
        onFailure: {
          narrative: 'The translation {verb}s beyond {actor}\'s reach. {They} capture fragments — {adj} tantalizing, incomplete.',
          reputationDelta: -0.06,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.6, possession: 0.4 },
            tagFilters: ['#ancient', '#knowledge'],
          },
        },
      },
    ],
  },

  {
    id: 'encounter.restless_spirits',
    name: 'Restless Spirits',
    locationTypes: ['ruins', 'ruined_tower', 'ruined_village'],
    reachPrimary: 'veil',
    reachSecondary: 'heart',
    encounterType: 'assist',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ['mercy_ruthlessness', 'tradition_novelty'],
    steps: [
      {
        id: 'restless_spirits.commune',
        name: 'Make Contact',
        reach: 'veil',
        difficulty: HARD_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'The spirits cling to the ruin\'s {adj} bones — neither gone nor present, howling at what they cannot release. {actor} must reach them across the veil.',
        onSuccess: {
          narrative: '{actor} opens the {adj} channel and makes contact. The spirits are old, confused, but aware.',
          reputationDelta: 0.06,
        },
        onFailure: {
          narrative: 'The spirits {verb} at {actor}\'s approach. Contact is not made — only felt, like a {adj} wound.',
          reputationDelta: -0.04,
        },
      },
      {
        id: 'restless_spirits.resolve',
        name: 'Offer Resolution',
        reach: 'heart',
        difficulty: HARD_DIFFICULTY_BASE + HARD_DIFFICULTY_STEP,
        duration: 2,
        narrative: '{actor} must understand what holds the spirits here and offer them a {adj} reason to let go — not through force, but through compassion.',
        onSuccess: {
          narrative: 'One by one, the {adj} presences still. The ruin is quieter. Not empty — but no longer haunted.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.6, condition: 0.4 },
            tagFilters: ['#ancient'],
          },
        },
        onFailure: {
          narrative: 'The spirits cannot be reached. They {verb} at {actor}\'s offering and retreat deeper into the {adj} ruin.',
          reputationDelta: -0.07,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.6, condition: 0.4 },
            tagFilters: ['#ancient'],
          },
        },
      },
    ],
  },

  {
    id: 'encounter.salvage_operation',
    name: 'Salvage Operation',
    locationTypes: ['ruins', 'ruined_city', 'ruined_village'],
    reachPrimary: 'stone',
    reachSecondary: 'gold',
    encounterType: 'acquire',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ['preservation_transformation', 'asceticism_extravagance'],
    steps: [
      {
        id: 'salvage_operation.survey',
        name: 'Survey the Pickings',
        reach: 'eye',
        difficulty: MODERATE_DIFFICULTY_BASE - 5,
        duration: 1,
        narrative: 'The ruin offers {adj} plenty — but also hazard. {actor} must assess what can be safely removed and what must be left to gravity.',
        onSuccess: {
          narrative: '{actor} identifies {adj} high-value salvage that can be extracted without triggering further collapse.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: '{actor} misjudges the {adj} structural risks. The best pickings are too dangerous to approach.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'salvage_operation.extract',
        name: 'Extract the Goods',
        reach: 'stone',
        difficulty: MODERATE_DIFFICULTY_BASE + MODERATE_DIFFICULTY_STEP - 5,
        duration: 2,
        narrative: 'Beams, stonework, ironwork, timber — {actor} works the {adj} careful extraction while the ruin groans around them.',
        onSuccess: {
          narrative: '{actor} carries out {adj} considerable salvage. A profitable day\'s work from the bones of the old world.',
          reputationDelta: 0.10,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
            tagFilters: ['#ancient'],
          },
        },
        onFailure: {
          narrative: 'A {adj} partial collapse forces {actor} back. They escape with little to show.',
          reputationDelta: -0.05,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
            tagFilters: ['#ancient'],
          },
        },
      },
    ],
  },

  {
    id: 'encounter.seal_the_breach',
    name: 'Seal the Breach',
    locationTypes: ['ruins', 'ruined_city'],
    reachPrimary: 'veil',
    reachSecondary: 'iron',
    encounterType: 'build',
    threatRating: 'deadly',
    intrinsicTier: 'story_beat',
    motivations: ['courage_prudence', 'sacrifice_survival'],
    steps: [
      {
        id: 'seal_breach.locate',
        name: 'Find the Source',
        reach: 'eye',
        difficulty: DEADLY_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'Something {verb}s from the ruin\'s depths — not natural, not spiritual, but {adj} wrong. {actor} must locate the point of origin before it spreads.',
        onSuccess: {
          narrative: '{actor} traces the {adj} corruption to its source: a breach in something that should remain closed.',
          reputationDelta: 0.06,
        },
        onFailure: {
          narrative: 'The {adj} wrongness eludes tracking. {actor} feels it everywhere and nowhere at once.',
          reputationDelta: -0.05,
        },
      },
      {
        id: 'seal_breach.prepare',
        name: 'Prepare the Sealing',
        reach: 'veil',
        difficulty: DEADLY_DIFFICULTY_BASE + DEADLY_DIFFICULTY_STEP,
        duration: 2,
        narrative: 'The {adj} ritual must be performed perfectly. One error and the breach widens — and {actor} becomes part of what pours through.',
        onSuccess: {
          narrative: '{actor} holds the {adj} ritual together as the breach {verb}s and pushes back. Almost there.',
          reputationDelta: 0.10,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The ritual {verb}s and {actor} is thrown back, {adj} and spent. The breach is still open.',
          reputationDelta: -0.08,
        },
      },
      {
        id: 'seal_breach.close',
        name: 'Seal It Shut',
        reach: 'iron',
        difficulty: DEADLY_DIFFICULTY_BASE + DEADLY_DIFFICULTY_STEP * 2,
        duration: 3,
        narrative: 'The final act of will. {actor} must drive the {adj} seal home against everything the breach throws at them.',
        onSuccess: {
          narrative: 'The breach {verb}s closed with a sound like the world exhaling. {actor} stands, {adj} and triumphant, in a suddenly quiet ruin.',
          reputationDelta: 0.20,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The seal {verb}s and shatters. {actor} flees the ruin as it {adj} collapses around the breach\'s widening maw.',
          reputationDelta: -0.12,
        },
      },
    ],
  },

  // ── Wilderness/Camp/Mining ─────────────────────────────────────────

  {
    id: 'encounter.beast_hunt',
    name: 'Beast Hunt',
    locationTypes: ['wilderness', 'camp'],
    reachPrimary: 'iron',
    reachSecondary: 'eye',
    encounterType: 'acquire',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ['mercy_ruthlessness', 'courage_prudence'],
    steps: [
      {
        id: 'beast_hunt.track',
        name: 'Track the Beast',
        reach: 'eye',
        difficulty: MODERATE_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'The creature has been raiding the {adj} outlying camps for weeks. {actor} must find its trail before the next attack.',
        onSuccess: {
          narrative: '{actor} reads the {adj} signs correctly — a bent branch, a print in soft earth. The trail is clear.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: 'The creature {verb}s its tracks. {actor} circles back empty, the {adj} trail cold.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'beast_hunt.confront',
        name: 'The Confrontation',
        reach: 'iron',
        difficulty: MODERATE_DIFFICULTY_BASE + MODERATE_DIFFICULTY_STEP,
        duration: 2,
        narrative: 'The beast is {adj} larger than the rumors. {actor} faces it alone in the {adj} clearing where everything narrows to this moment.',
        onSuccess: {
          narrative: '{actor} ends the hunt with {adj} decisive force. The camps will be safe tonight.',
          reputationDelta: 0.12,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.5, condition: 0.5 },
            tagFilters: ['#combat'],
          },
        },
        onFailure: {
          narrative: 'The beast {verb}s into the {adj} trees. {actor} retreats with wounds and an unfinished hunt.',
          reputationDelta: -0.06,
          rewardPool: {
            categoryWeights: { possession: 0.5, condition: 0.5 },
            tagFilters: ['#combat'],
          },
        },
      },
    ],
  },

  {
    id: 'encounter.prospecting_expedition',
    name: 'Prospecting Expedition',
    locationTypes: ['wilderness', 'mining'],
    reachPrimary: 'eye',
    reachSecondary: 'stone',
    encounterType: 'explore',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ['revelation_discretion', 'asceticism_extravagance'],
    steps: [
      {
        id: 'prospecting.survey',
        name: 'Survey the Ground',
        reach: 'eye',
        difficulty: MODERATE_DIFFICULTY_BASE,
        duration: 2,
        narrative: 'The land holds wealth, but only for those who can read its {adj} signs. {actor} walks the ground for days, looking for what lies beneath.',
        onSuccess: {
          narrative: 'The {adj} geological signs align. {actor} marks a site worth developing.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The terrain {verb}s its secrets. {actor} finds only {adj} marginal deposits.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'prospecting.verify',
        name: 'Verify the Vein',
        reach: 'stone',
        difficulty: MODERATE_DIFFICULTY_BASE + MODERATE_DIFFICULTY_STEP,
        duration: 2,
        narrative: '{actor} drives test shafts into the {adj} promising sites. Each one is a gamble on instinct and experience.',
        onSuccess: {
          narrative: 'The vein is {adj} real and rich. {actor} has found something worth mining.',
          reputationDelta: 0.12,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.7, bestowed_power: 0.3 },
            tagFilters: ['#stone'],
          },
        },
        onFailure: {
          narrative: 'The test shafts find only {adj} dry rock. The expedition ends in expensive failure.',
          reputationDelta: -0.06,
          rewardPool: {
            categoryWeights: { possession: 0.7, bestowed_power: 0.3 },
            tagFilters: ['#stone'],
          },
        },
      },
    ],
  },

  {
    id: 'encounter.hermits_wisdom',
    name: "Hermit's Wisdom",
    locationTypes: ['wilderness'],
    reachPrimary: 'heart',
    reachSecondary: 'eye',
    encounterType: 'explore',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ['loyalty_ambition', 'revelation_discretion'],
    steps: [
      {
        id: 'hermits_wisdom.find',
        name: 'Find the Hermit',
        reach: 'eye',
        difficulty: MODERATE_DIFFICULTY_BASE - 5,
        duration: 1,
        narrative: 'The hermit has lived {adj} alone in the wilderness for years. Finding them requires knowing which {adj} silence to listen to.',
        onSuccess: {
          narrative: '{actor} follows the {adj} signs — an old campfire, a tended grave — and finds the hermit at last.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: 'The wilderness offers no {adj} trail. {actor} returns without finding the hermit.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'hermits_wisdom.earn_trust',
        name: 'Earn the Teaching',
        reach: 'heart',
        difficulty: MODERATE_DIFFICULTY_BASE + MODERATE_DIFFICULTY_STEP - 5,
        duration: 2,
        narrative: 'The hermit will not speak to just anyone. {actor} must show why {they} are {adj} worthy of what they seek.',
        onSuccess: {
          narrative: '{actor} sits with the hermit through a night of {adj} honest conversation and receives something that cannot be taught.',
          reputationDelta: 0.12,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.7, condition: 0.3 },
            tagFilters: ['#knowledge'],
          },
        },
        onFailure: {
          narrative: 'The hermit finds {actor} {adj} unprepared. They share nothing of value. Perhaps another time.',
          reputationDelta: -0.03,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.7, condition: 0.3 },
            tagFilters: ['#knowledge'],
          },
        },
      },
    ],
  },

  {
    id: 'encounter.bandit_ambush',
    name: 'Bandit Ambush',
    locationTypes: ['wilderness', 'camp'],
    reachPrimary: 'iron',
    reachSecondary: 'shadow',
    encounterType: 'duel',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ['courage_prudence', 'mercy_ruthlessness'],
    steps: [
      {
        id: 'bandit_ambush.react',
        name: 'Immediate Response',
        reach: 'iron',
        difficulty: HARD_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'The ambush is {adj} perfectly positioned — rocks above, trees on both sides, the road channeling {actor} into the kill zone.',
        onSuccess: {
          narrative: '{actor} breaks the killing ground immediately, {adj} instinct overriding the shock.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} hesitates a half-second too long. The {adj} bandits press their advantage.',
          reputationDelta: -0.05,
        },
      },
      {
        id: 'bandit_ambush.turn_tables',
        name: 'Turn the Tables',
        reach: 'shadow',
        difficulty: HARD_DIFFICULTY_BASE + HARD_DIFFICULTY_STEP,
        duration: 2,
        narrative: 'Outnumbered but not outmaneuvered. {actor} must use the terrain against the {adj} bandits who set it.',
        onSuccess: {
          narrative: '{actor} collapses the {adj} ambush from within — the ambushers become the ambushed.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.5, condition: 0.5 },
            tagFilters: ['#combat'],
          },
        },
        onFailure: {
          narrative: 'The bandits hold the {adj} ground. {actor} escapes, but not without cost.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 0.5, condition: 0.5 },
            tagFilters: ['#combat'],
          },
        },
      },
    ],
  },

  {
    id: 'encounter.mineral_vein_discovery',
    name: 'Mineral Vein Discovery',
    locationTypes: ['mining'],
    reachPrimary: 'stone',
    reachSecondary: 'gold',
    encounterType: 'explore',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ['preservation_transformation', 'asceticism_extravagance'],
    steps: [
      {
        id: 'mineral_vein.survey',
        name: 'Follow the Formation',
        reach: 'stone',
        difficulty: HARD_DIFFICULTY_BASE,
        duration: 2,
        narrative: 'The geological formation {verb}s deep into the {adj} mountain. {actor} must decide how far to follow it and when to stop.',
        onSuccess: {
          narrative: '{actor} reads the {adj} rock\'s story correctly. The formation deepens into something extraordinary.',
          reputationDelta: 0.07,
        },
        onFailure: {
          narrative: 'The formation {verb}s into barren rock. {actor} has followed a {adj} false lead into the mountain.',
          reputationDelta: -0.05,
        },
      },
      {
        id: 'mineral_vein.assess',
        name: 'Assess the Vein',
        reach: 'gold',
        difficulty: HARD_DIFFICULTY_BASE + HARD_DIFFICULTY_STEP,
        duration: 3,
        narrative: 'The vein is {adj} real. Now {actor} must assess its true extent — the difference between a {adj} fortune and a minor deposit.',
        onSuccess: {
          narrative: '{actor} maps the vein accurately. It is {adj} richer than anything found here in a generation.',
          reputationDelta: 0.16,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.6, bestowed_power: 0.4 },
            tagFilters: ['#stone'],
          },
        },
        onFailure: {
          narrative: 'The vein is {adj} smaller than first appeared. Worth developing, but not the {adj} treasure {actor} had hoped for.',
          reputationDelta: -0.06,
          rewardPool: {
            categoryWeights: { possession: 0.6, bestowed_power: 0.4 },
            tagFilters: ['#stone'],
          },
        },
      },
    ],
  },

  // ── Shrine/Temple Types ───────────────────────────────────────────

  {
    id: 'encounter.pilgrimage_trial',
    name: 'Pilgrimage Trial',
    locationTypes: ['shrine', 'temple'],
    reachPrimary: 'veil',
    reachSecondary: 'heart',
    encounterType: 'explore',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ['tradition_novelty', 'courage_prudence'],
    steps: [
      {
        id: 'pilgrimage_trial.journey',
        name: 'The Sacred Path',
        reach: 'heart',
        difficulty: MODERATE_DIFFICULTY_BASE,
        duration: 2,
        narrative: 'The pilgrimage demands {adj} genuine sacrifice — not just physical hardship, but something surrendered willingly. {actor} must decide what to offer.',
        onSuccess: {
          narrative: '{actor} makes the {adj} offering and feels the sacred path acknowledge them.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s offering {verb}s hollow against the {adj} demand of the sacred path.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'pilgrimage_trial.arrive',
        name: 'Arrival at the Shrine',
        reach: 'veil',
        difficulty: MODERATE_DIFFICULTY_BASE + MODERATE_DIFFICULTY_STEP,
        duration: 2,
        narrative: 'The final approach to the {adj} holy site. The veil is thin here. {actor} must be entirely present — no deception, no guard, no mask.',
        onSuccess: {
          narrative: 'The shrine {verb}s with quiet recognition. {actor} is received. Something has changed in them.',
          reputationDelta: 0.12,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.6, condition: 0.4 },
            tagFilters: ['#divine'],
          },
        },
        onFailure: {
          narrative: 'The shrine {verb}s silence. {actor} stands before it {adj} unrecognized, the pilgrimage incomplete.',
          reputationDelta: -0.05,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.6, condition: 0.4 },
            tagFilters: ['#divine'],
          },
        },
      },
    ],
  },

  {
    id: 'encounter.sacred_text_study',
    name: 'Sacred Text Study',
    locationTypes: ['shrine', 'temple'],
    reachPrimary: 'eye',
    reachSecondary: 'veil',
    encounterType: 'explore',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ['revelation_discretion', 'tradition_novelty'],
    steps: [
      {
        id: 'sacred_text.access',
        name: 'Gain Access',
        reach: 'heart',
        difficulty: HARD_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'The texts are {adj} sacred and guarded. {actor} must persuade the custodians that their purpose is worthy of access.',
        onSuccess: {
          narrative: 'The custodians grant {actor} access with {adj} cautious approval.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The custodians find {actor}\'s purpose {adj} insufficient. Access is refused.',
          reputationDelta: -0.04,
        },
      },
      {
        id: 'sacred_text.study',
        name: 'Study the Texts',
        reach: 'eye',
        difficulty: HARD_DIFFICULTY_BASE + HARD_DIFFICULTY_STEP,
        duration: 4,
        narrative: 'Days in the {adj} archive. The texts are layered — each reading {verb}s another meaning loose from the one before.',
        onSuccess: {
          narrative: '{actor} penetrates the {adj} outer doctrine and finds the deeper truth the texts were written to preserve.',
          reputationDelta: 0.14,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.7, condition: 0.3 },
            tagFilters: ['#knowledge'],
          },
        },
        onFailure: {
          narrative: 'The {adj} depth of the texts defeats {actor}. They leave knowing only the surface doctrine.',
          reputationDelta: -0.06,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.7, condition: 0.3 },
            tagFilters: ['#knowledge'],
          },
        },
      },
    ],
  },

  {
    id: 'encounter.mystical_vision_quest',
    name: 'Mystical Vision Quest',
    locationTypes: ['shrine', 'temple'],
    reachPrimary: 'veil',
    reachSecondary: 'eye',
    encounterType: 'explore',
    threatRating: 'deadly',
    intrinsicTier: 'story_beat',
    motivations: ['courage_prudence', 'tradition_novelty'],
    steps: [
      {
        id: 'vision_quest.enter',
        name: 'Enter the Vision',
        reach: 'veil',
        difficulty: DEADLY_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'The {adj} ritual potion is administered. The world {verb}s and {actor} steps across the threshold into something that cannot be prepared for.',
        onSuccess: {
          narrative: '{actor} passes through the {adj} dissolution of self and arrives in the vision fully intact.',
          reputationDelta: 0.06,
        },
        onFailure: {
          narrative: 'The vision {verb}s and tears. {actor} is caught between worlds, {adj} and screaming without sound.',
          reputationDelta: -0.06,
        },
      },
      {
        id: 'vision_quest.navigate',
        name: 'Navigate the Vision',
        reach: 'eye',
        difficulty: DEADLY_DIFFICULTY_BASE + DEADLY_DIFFICULTY_STEP,
        duration: 2,
        narrative: 'The vision is {adj} vast and hostile to rationality. {actor} must find the answer they came for without losing the thread back to themselves.',
        onSuccess: {
          narrative: '{actor} finds the {adj} answer and holds it while the vision {verb}s and twists around them.',
          reputationDelta: 0.10,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} loses the thread. The vision {verb}s around them, beautiful and {adj} incomprehensible.',
          reputationDelta: -0.08,
        },
      },
      {
        id: 'vision_quest.return',
        name: 'Return with the Gift',
        reach: 'veil',
        difficulty: DEADLY_DIFFICULTY_BASE + DEADLY_DIFFICULTY_STEP * 2,
        duration: 2,
        narrative: 'The hardest part: bringing back what was found. The {adj} knowledge wants to dissolve back into the vision as {actor} approaches the threshold.',
        onSuccess: {
          narrative: '{actor} {verb}s back into their body carrying something {adj} extraordinary. The priests do not need to ask — it is written in their eyes.',
          reputationDelta: 0.20,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.8, condition: 0.2 },
            tagFilters: ['#divine'],
          },
        },
        onFailure: {
          narrative: 'The knowledge {verb}s away as {actor} crosses back. They return from the vision {adj} empty-handed and changed.',
          reputationDelta: -0.10,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.8, condition: 0.2 },
            tagFilters: ['#divine'],
          },
        },
      },
    ],
  },

  // ── Deadly-Tier (diff 80–90) ──────────────────────────────────────

  {
    id: 'encounter.dragons_challenge',
    name: "Dragon's Challenge",
    locationTypes: ['wilderness', 'ruins'],
    reachPrimary: 'iron',
    reachSecondary: 'veil',
    encounterType: 'duel',
    threatRating: 'deadly',
    intrinsicTier: 'story_beat',
    motivations: ['courage_prudence', 'sacrifice_survival'],
    steps: [
      {
        id: 'dragons_challenge.approach',
        name: 'Approach the Dragon',
        reach: 'eye',
        difficulty: DEADLY_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'The {adj} creature waits. It has seen {adj} centuries. {actor} must approach with neither cowardice nor contempt — both are death.',
        onSuccess: {
          narrative: '{actor} approaches in the {adj} only way that works: as an equal. The dragon {verb}s with interest.',
          reputationDelta: 0.07,
        },
        onFailure: {
          narrative: 'The dragon {verb}s at {actor}\'s approach. The {adj} meeting has already gone wrong.',
          reputationDelta: -0.06,
        },
      },
      {
        id: 'dragons_challenge.contest',
        name: 'The Contest',
        reach: 'iron',
        difficulty: DEADLY_DIFFICULTY_BASE + DEADLY_DIFFICULTY_STEP,
        duration: 3,
        narrative: 'The dragon sets its {adj} terms: a contest of will, cunning, and endurance that few mortals survive. {actor} accepts.',
        onSuccess: {
          narrative: '{actor} endures the {adj} contest to its end. The dragon acknowledges them — and acknowledging is enough.',
          reputationDelta: 0.18,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.7, condition: 0.3 },
            tagFilters: ['#ancient'],
          },
        },
        onFailure: {
          narrative: '{actor} fails the contest but survives. The dragon is {adj} merciful — or merely amused.',
          reputationDelta: -0.10,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.7, condition: 0.3 },
            tagFilters: ['#ancient'],
          },
        },
      },
    ],
  },

  {
    id: 'encounter.arcane_cataclysm',
    name: 'Arcane Cataclysm',
    locationTypes: ['ruins', 'temple'],
    reachPrimary: 'veil',
    reachSecondary: 'eye',
    encounterType: 'build',
    threatRating: 'deadly',
    intrinsicTier: 'story_beat',
    motivations: ['courage_prudence', 'preservation_transformation'],
    steps: [
      {
        id: 'arcane_cataclysm.contain',
        name: 'Contain the Cascade',
        reach: 'veil',
        difficulty: DEADLY_DIFFICULTY_BASE,
        duration: 2,
        narrative: 'Ancient power {verb}s loose in the ruin — a cascade of unanchored {adj} energy that will consume everything it touches unless stopped.',
        onSuccess: {
          narrative: '{actor} finds the {adj} anchor points and binds the cascade\'s expansion. The worst is contained — for now.',
          reputationDelta: 0.07,
        },
        onFailure: {
          narrative: 'The cascade {verb}s through {actor}\'s first attempt. The {adj} energy expands.',
          reputationDelta: -0.07,
        },
      },
      {
        id: 'arcane_cataclysm.neutralize',
        name: 'Neutralize the Source',
        reach: 'eye',
        difficulty: DEADLY_DIFFICULTY_BASE + DEADLY_DIFFICULTY_STEP,
        duration: 3,
        narrative: 'The source of the {adj} cataclysm is at the center, and reaching it means passing through everything the cascade has already corrupted.',
        onSuccess: {
          narrative: '{actor} reaches the source and extinguishes it with {adj} precise understanding. The ruin goes quiet.',
          reputationDelta: 0.20,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} cannot reach the source through the {adj} corruption. The ruin is abandoned to the cataclysm.',
          reputationDelta: -0.12,
        },
      },
    ],
  },

  {
    id: 'encounter.grand_tournament',
    name: 'Grand Tournament',
    locationTypes: ['city', 'capital', 'castle'],
    reachPrimary: 'iron',
    reachSecondary: 'star',
    encounterType: 'duel',
    threatRating: 'deadly',
    intrinsicTier: 'story_beat',
    motivations: ['mercy_ruthlessness', 'sacrifice_survival'],
    steps: [
      {
        id: 'grand_tournament.qualify',
        name: 'The Qualifying Round',
        reach: 'iron',
        difficulty: DEADLY_DIFFICULTY_BASE - 5,
        duration: 1,
        narrative: 'Three hundred competitors. Only thirty advance. {actor} enters the {adj} qualifying round knowing the best are watching from the stands.',
        onSuccess: {
          narrative: '{actor} advances with a performance that draws {adj} comment from the gallery.',
          reputationDelta: 0.06,
        },
        onFailure: {
          narrative: '{actor} is eliminated in the {adj} qualifying round. The tournament ends before it begins.',
          reputationDelta: -0.05,
        },
      },
      {
        id: 'grand_tournament.semifinals',
        name: 'The Semifinals',
        reach: 'iron',
        difficulty: DEADLY_DIFFICULTY_BASE + DEADLY_DIFFICULTY_STEP - 5,
        duration: 2,
        narrative: 'The semifinal opponent is {adj} legendary. Every combatant who has faced them has learned something at great cost.',
        onSuccess: {
          narrative: '{actor} wins the semifinal with a move no one expected. The crowd {verb}s.',
          reputationDelta: 0.12,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The {adj} legendary opponent proves why they are legendary. {actor} falls before the final.',
          reputationDelta: -0.07,
        },
      },
      {
        id: 'grand_tournament.final',
        name: 'The Final',
        reach: 'star',
        difficulty: DEADLY_DIFFICULTY_BASE + DEADLY_DIFFICULTY_STEP,
        duration: 3,
        narrative: 'The tournament final. Every eye in the city watches. {actor} must be {adj} more than skilled — they must be an event.',
        onSuccess: {
          narrative: '{actor} wins the Grand Tournament. The name {verb}s through the crowd and out across the world.',
          reputationDelta: 0.22,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.5, possession: 0.3, condition: 0.2 },
            tagFilters: ['#combat'],
          },
        },
        onFailure: {
          narrative: '{actor} falls in the final round. Runner-up at the Grand Tournament — {adj} remarkable, and remembered.',
          reputationDelta: -0.05,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.5, possession: 0.3, condition: 0.2 },
            tagFilters: ['#combat'],
          },
        },
      },
    ],
  },

  // ─── 18 Universal Encounter Templates ───────────────────────────
  //
  // Available at every location type. Low difficulty, 2 steps, minimal
  // rewards. These exist to prevent content starvation at frontier
  // settlements that lack archetype-specific encounter templates.
  //
  // Coverage: 2 per canonical Reach (Iron, Gold, Shadow, Veil, Heart,
  // Eye, Stone, Star) + 2 reach-agnostic fallbacks with extra-low
  // difficulty. No Flesh reach — Flesh is now Quintessence (meta-property).

  // ── Iron (2) ──────────────────────────────────────────────────────

  {
    id: 'encounter.patrol_perimeter',
    name: 'Patrol the Perimeter',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'iron',
    reachSecondary: 'shadow',
    encounterType: 'lead',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ['courage_prudence', 'justice_mercy'],
    steps: [
      {
        id: 'patrol_perimeter.walk',
        name: 'Walk the Boundary',
        reach: 'iron',
        difficulty: UNIVERSAL_DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} traces the edge of the settlement, noting every gap in fence and wall. The {adj} routine of vigilance.',
        onSuccess: {
          narrative: 'Every approach mapped, every weak point catalogued. {actor} finishes the circuit with {adj} certainty.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'The perimeter is too large, the terrain too broken. {actor} covers half the ground and hopes it is enough.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'patrol_perimeter.secure',
        name: 'Secure the Weak Points',
        reach: 'shadow',
        difficulty: UNIVERSAL_DIFFICULTY_BASE + UNIVERSAL_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'A gap in the stones, a trampled section of hedge — {actor} must decide what to fix and what to watch.',
        onSuccess: {
          narrative: '{actor} shores up the worst of it and places markers where the rest need attention. The perimeter holds.',
          reputationDelta: 0.03,
        },
        onFailure: {
          narrative: 'There is too much to fix with too little. {actor} leaves the gaps as they are, uneasy.',
          reputationDelta: -0.01,
        },
      },
    ],
  },
  {
    id: 'encounter.sharpen_blades',
    name: 'Sharpen Blades',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'iron',
    reachSecondary: 'stone',
    encounterType: 'build',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['tradition_progress', 'courage_prudence'],
    steps: [
      {
        id: 'sharpen_blades.assess',
        name: 'Inspect the Edge',
        reach: 'iron',
        difficulty: UNIVERSAL_DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} draws blade across thumbnail, testing the edge. Nicks, rolls, and dullness all tell {their} own {adj} story.',
        onSuccess: {
          narrative: 'The flaws are clear. {actor} knows exactly where steel has failed and where it can be saved.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'Hard to tell good steel from bad in this light. {actor} guesses at the damage.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'sharpen_blades.grind',
        name: 'Work the Whetstone',
        reach: 'stone',
        difficulty: UNIVERSAL_DIFFICULTY_BASE + UNIVERSAL_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'The rhythm of stone on steel fills the silence. {actor} works with {adj} patience, stroke after stroke.',
        onSuccess: {
          narrative: 'The edge catches light like a thread of silver. Sharp enough. {actor} sheathes the blade with satisfaction.',
          reputationDelta: 0.03,
        },
        onFailure: {
          narrative: 'The whetstone slips, the angle wrong. {actor} manages a serviceable edge, but nothing more.',
          reputationDelta: -0.01,
        },
      },
    ],
  },

  // ── Gold (2) ──────────────────────────────────────────────────────

  {
    id: 'encounter.barter_supplies',
    name: 'Barter for Supplies',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'gold',
    reachSecondary: 'heart',
    encounterType: 'trade',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['loyalty_ambition', 'justice_mercy'],
    steps: [
      {
        id: 'barter_supplies.offer',
        name: 'Make an Offer',
        reach: 'gold',
        difficulty: UNIVERSAL_DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} approaches with something to trade — a skill, a trinket, a day of labor. The {adj} art of exchange begins.',
        onSuccess: {
          narrative: 'A nod, a handshake. {actor} gives something of value and receives something needed. Fair dealing.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'No deal. {actor}\'s offer falls flat — too little, too strange, too late in the day.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'barter_supplies.seal',
        name: 'Seal the Deal',
        reach: 'heart',
        difficulty: UNIVERSAL_DIFFICULTY_BASE + UNIVERSAL_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'Trust is the final currency. {actor} meets the trader\'s eyes, each measuring the other\'s {adj} intent.',
        onSuccess: {
          narrative: 'The exchange is done. Both parties walk away satisfied — a rare thing, and worth remembering.',
          reputationDelta: 0.03,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#gold'],
          },
        },
        onFailure: {
          narrative: 'Doubt creeps in at the last. The deal collapses, and {actor} leaves with what {they} came with.',
          reputationDelta: -0.01,
        },
      },
    ],
  },
  {
    id: 'encounter.assess_holdings',
    name: 'Take Stock of Holdings',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'gold',
    reachSecondary: 'eye',
    encounterType: 'trade',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['tradition_progress', 'loyalty_ambition'],
    steps: [
      {
        id: 'assess_holdings.count',
        name: 'Count What Remains',
        reach: 'gold',
        difficulty: UNIVERSAL_DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} lays out every coin, every scrap of value. The {adj} arithmetic of survival.',
        onSuccess: {
          narrative: 'The accounting is done. {actor} knows exactly what {they} have — and what it can buy.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'The numbers do not add up. Something was lost or miscounted, and {actor} cannot say what.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'assess_holdings.plan',
        name: 'Plan the Next Purchase',
        reach: 'eye',
        difficulty: UNIVERSAL_DIFFICULTY_BASE + UNIVERSAL_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'Knowing what you have matters less than knowing what you need. {actor} weighs priorities with {adj} care.',
        onSuccess: {
          narrative: 'A clear plan forms — what to buy, what to save, what to trade. {actor} is ready for the next exchange.',
          reputationDelta: 0.03,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#gold'],
          },
        },
        onFailure: {
          narrative: 'Too many needs, too few resources. {actor} sets the ledger aside, no clearer than before.',
          reputationDelta: -0.01,
        },
      },
    ],
  },

  // ── Shadow (2) ────────────────────────────────────────────────────

  {
    id: 'encounter.night_watch',
    name: 'Keep the Night Watch',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'shadow',
    reachSecondary: 'iron',
    encounterType: 'lead',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ['courage_prudence', 'justice_mercy'],
    steps: [
      {
        id: 'night_watch.vigil',
        name: 'Stand Vigil',
        reach: 'shadow',
        difficulty: UNIVERSAL_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'Darkness settles. {actor} takes the watch, eyes adjusting to the {adj} shapes that move beyond the firelight.',
        onSuccess: {
          narrative: '{actor} reads the night like a language — every sound placed, every shadow accounted for. Nothing slips past.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'Fatigue wins. {actor} nods off, jerking awake to find the fire low and the perimeter unchecked.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'night_watch.respond',
        name: 'Respond to a Disturbance',
        reach: 'iron',
        difficulty: UNIVERSAL_DIFFICULTY_BASE + UNIVERSAL_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'Something stirs at the edge of camp. {actor} rises, hand on weapon, the {adj} tension of the unknown in every muscle.',
        onSuccess: {
          narrative: 'A wild animal, a falling branch — nothing worse. {actor} handles it cleanly and the camp sleeps on.',
          reputationDelta: 0.03,
        },
        onFailure: {
          narrative: 'Too slow, too loud. The disturbance sends the camp into {adj} alarm before {actor} can contain it.',
          reputationDelta: -0.01,
        },
      },
    ],
  },
  {
    id: 'encounter.listen_for_rumors',
    name: 'Listen for Rumors',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'shadow',
    reachSecondary: 'eye',
    encounterType: 'explore',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ['tradition_progress', 'justice_mercy'],
    steps: [
      {
        id: 'listen_for_rumors.loiter',
        name: 'Loiter and Listen',
        reach: 'shadow',
        difficulty: UNIVERSAL_DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} lingers where voices gather — a well, a hearth, a crossroads. The {adj} art of seeming disinterested.',
        onSuccess: {
          narrative: 'Fragments reach {their} ears — a name dropped carelessly, a warning half-whispered. {actor} files it all away.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'The locals are tight-lipped, or the noise is too thick. {actor} hears nothing worth remembering.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'listen_for_rumors.sift',
        name: 'Sift Truth from Gossip',
        reach: 'eye',
        difficulty: UNIVERSAL_DIFFICULTY_BASE + UNIVERSAL_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'Rumor is a river of mud. {actor} pans for the {adj} glint of truth beneath the silt.',
        onSuccess: {
          narrative: 'One thread holds up. {actor} has learned something real — where to go, whom to trust, what to avoid.',
          reputationDelta: 0.03,
          rewardPool: {
            categoryWeights: { condition: 0.6, bestowed_power: 0.2, possession: 0.2 },
            tagFilters: ['#knowledge'],
          },
        },
        onFailure: {
          narrative: 'All gossip, no substance. {actor} walks away knowing only what everyone already knows.',
          reputationDelta: -0.01,
          rewardPool: {
            categoryWeights: { condition: 0.6, bestowed_power: 0.2, possession: 0.2 },
            tagFilters: ['#knowledge'],
          },
        },
      },
    ],
  },

  // ── Veil (2) ──────────────────────────────────────────────────────

  {
    id: 'encounter.ward_the_camp',
    name: 'Ward the Camp',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'veil',
    reachSecondary: 'star',
    encounterType: 'build',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ['tradition_progress', 'courage_prudence'],
    steps: [
      {
        id: 'ward_the_camp.trace',
        name: 'Trace the Boundary',
        reach: 'veil',
        difficulty: UNIVERSAL_DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} walks the edge of camp, fingers brushing stone and bark. The {adj} work of drawing a circle that means something.',
        onSuccess: {
          narrative: 'The ward settles — thin as cobweb, but present. {actor} feels the boundary hold against the dark.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'The energy dissipates before the circle closes. {actor} has drawn a line in sand, nothing more.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'ward_the_camp.anchor',
        name: 'Anchor the Ward',
        reach: 'star',
        difficulty: UNIVERSAL_DIFFICULTY_BASE + UNIVERSAL_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'A ward without an anchor fades by dawn. {actor} reaches for something deeper — faith, will, the {adj} pulse of the cosmos.',
        onSuccess: {
          narrative: 'The ward hums. Not strong, not lasting, but enough to turn away the small evils that creep by night.',
          reputationDelta: 0.03,
        },
        onFailure: {
          narrative: 'The anchor does not hold. The ward will fade before midnight, and {actor} knows it.',
          reputationDelta: -0.01,
        },
      },
    ],
  },
  {
    id: 'encounter.trace_ley_lines',
    name: 'Trace the Ley Lines',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'veil',
    reachSecondary: 'eye',
    encounterType: 'explore',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ['tradition_progress', 'justice_mercy'],
    steps: [
      {
        id: 'trace_ley_lines.sense',
        name: 'Sense the Current',
        reach: 'veil',
        difficulty: UNIVERSAL_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'Beneath the visible lies something older. {actor} opens {their} senses to the {adj} currents beneath the surface.',
        onSuccess: {
          narrative: 'There — a pull, faint but unmistakable. The land remembers its channels, and {actor} begins to read them.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'Nothing stirs. The {adj} silence holds, and {actor} learns only that some places guard their secrets well.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'trace_ley_lines.map',
        name: 'Map the Flow',
        reach: 'eye',
        difficulty: UNIVERSAL_DIFFICULTY_BASE + UNIVERSAL_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'Sensing a current is one thing. Understanding where it flows — and why — demands {adj} clarity of mind.',
        onSuccess: {
          narrative: 'The ley line resolves into a path {actor} can follow. Where it leads, the magic runs stronger.',
          reputationDelta: 0.03,
          rewardPool: {
            categoryWeights: { condition: 0.3, bestowed_power: 0.5, possession: 0.2 },
            tagFilters: ['#knowledge'],
          },
        },
        onFailure: {
          narrative: 'The pattern fractures under scrutiny. {actor} loses the thread, left with impressions but no map.',
          reputationDelta: -0.01,
          rewardPool: {
            categoryWeights: { condition: 0.3, bestowed_power: 0.5, possession: 0.2 },
            tagFilters: ['#knowledge'],
          },
        },
      },
    ],
  },

  // ── Heart (2) ─────────────────────────────────────────────────────

  {
    id: 'encounter.local_tales',
    name: 'Gather Local Tales',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'heart',
    reachSecondary: 'eye',
    encounterType: 'create',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ['tradition_progress', 'loyalty_ambition'],
    steps: [
      {
        id: 'local_tales.listen',
        name: 'Listen to the Locals',
        reach: 'heart',
        difficulty: UNIVERSAL_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'Every place has stories. {actor} sits among those who know this land and listens with {adj} attention.',
        onSuccess: {
          narrative: 'Words flow freely. {actor} earns a fragment of history — a name, a warning, a half-remembered song.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'Suspicion closes mouths. {actor} hears only silence and the {adj} rustle of turned backs.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'local_tales.record',
        name: 'Commit to Memory',
        reach: 'eye',
        difficulty: UNIVERSAL_DIFFICULTY_BASE + UNIVERSAL_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'Details fade fast. {actor} fixes the tales in mind — names, places, the shape of truth beneath the telling.',
        onSuccess: {
          narrative: 'The story takes root. {actor} carries something worth more than coin — knowledge of what came before.',
          reputationDelta: 0.03,
          rewardPool: {
            categoryWeights: { condition: 0.6, bestowed_power: 0.2, possession: 0.2 },
            tagFilters: ['#knowledge'],
          },
        },
        onFailure: {
          narrative: 'The {adj} details blur and tangle. {actor} remembers the shape of it, but not the substance.',
          reputationDelta: -0.01,
          rewardPool: {
            categoryWeights: { condition: 0.6, bestowed_power: 0.2, possession: 0.2 },
            tagFilters: ['#knowledge'],
          },
        },
      },
    ],
  },
  {
    id: 'encounter.tend_the_weary',
    name: 'Tend the Weary',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'heart',
    reachSecondary: 'star',
    encounterType: 'assist',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['justice_mercy', 'loyalty_ambition'],
    steps: [
      {
        id: 'tend_the_weary.approach',
        name: 'Offer Comfort',
        reach: 'heart',
        difficulty: UNIVERSAL_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'Someone nearby is struggling — exhaustion, grief, or the {adj} weight of days without rest. {actor} draws near.',
        onSuccess: {
          narrative: 'A word, a steady hand, a moment of presence. {actor} eases a burden that was not {their} own.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'The weary one flinches away. Some wounds are too raw for a stranger\'s touch.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'tend_the_weary.sustain',
        name: 'Share What You Have',
        reach: 'star',
        difficulty: UNIVERSAL_DIFFICULTY_BASE + UNIVERSAL_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'Comfort is not enough. {actor} offers something real — food, warmth, the {adj} gift of attention.',
        onSuccess: {
          narrative: 'Color returns to a drawn face. The weary one nods, once, and that is thanks enough.',
          reputationDelta: 0.03,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#heart'],
          },
        },
        onFailure: {
          narrative: '{actor} has too little to share. The gesture is kind but hollow, and both of {them} know it.',
          reputationDelta: -0.01,
        },
      },
    ],
  },

  // ── Eye (2) ───────────────────────────────────────────────────────

  {
    id: 'encounter.study_surroundings',
    name: 'Study the Surroundings',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'eye',
    reachSecondary: 'veil',
    encounterType: 'explore',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ['tradition_progress', 'justice_mercy'],
    steps: [
      {
        id: 'study_surroundings.observe',
        name: 'Observe the Terrain',
        reach: 'eye',
        difficulty: UNIVERSAL_DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} climbs to a vantage point and studies the lay of the land. Every path, every shadow, every {adj} detail.',
        onSuccess: {
          narrative: 'Patterns emerge — trade routes, game trails, places where the land folds inward. {actor} maps it all.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'Haze and distance defeat the eye. {actor} sees only what anyone could see — nothing of use.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'study_surroundings.sense',
        name: 'Read the Deeper Signs',
        reach: 'veil',
        difficulty: UNIVERSAL_DIFFICULTY_BASE + UNIVERSAL_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'The visible terrain tells one story. {actor} looks for what the land is hiding — the {adj} signs beneath.',
        onSuccess: {
          narrative: 'The land whispers back. {actor} feels the pull of ley and root — this place has secrets worth knowing.',
          reputationDelta: 0.03,
          rewardPool: {
            categoryWeights: { condition: 0.3, bestowed_power: 0.5, possession: 0.2 },
            tagFilters: ['#knowledge'],
          },
        },
        onFailure: {
          narrative: 'Nothing stirs. The {adj} silence holds, and {actor} learns only that some places guard their secrets well.',
          reputationDelta: -0.01,
          rewardPool: {
            categoryWeights: { condition: 0.3, bestowed_power: 0.5, possession: 0.2 },
            tagFilters: ['#knowledge'],
          },
        },
      },
    ],
  },
  {
    id: 'encounter.decipher_old_markings',
    name: 'Decipher Old Markings',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'eye',
    reachSecondary: 'gold',
    encounterType: 'explore',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ['tradition_progress', 'loyalty_ambition'],
    steps: [
      {
        id: 'decipher_old_markings.find',
        name: 'Find the Inscriptions',
        reach: 'eye',
        difficulty: UNIVERSAL_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'Old stones bear old marks — trade signs, boundary carvings, warnings worn {adj} by weather. {actor} searches for them.',
        onSuccess: {
          narrative: '{actor} finds what time almost erased — scratches in rock, paint faded to ghosts. Something was written here.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'If markings were ever here, the years have taken them. {actor} finds only weathered stone.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'decipher_old_markings.read',
        name: 'Interpret the Symbols',
        reach: 'gold',
        difficulty: UNIVERSAL_DIFFICULTY_BASE + UNIVERSAL_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'Letters are meaningless without context. {actor} pieces the symbols together, drawing on {adj} memory and intuition.',
        onSuccess: {
          narrative: 'The markings resolve — a trader\'s waypoint, a miner\'s claim, a warning from another age. Knowledge earned.',
          reputationDelta: 0.03,
          rewardPool: {
            categoryWeights: { condition: 0.5, bestowed_power: 0.2, possession: 0.3 },
            tagFilters: ['#knowledge'],
          },
        },
        onFailure: {
          narrative: 'The symbols resist interpretation. {actor} copies what {they} can and hopes someone else can read them.',
          reputationDelta: -0.01,
          rewardPool: {
            categoryWeights: { condition: 0.5, bestowed_power: 0.2, possession: 0.3 },
            tagFilters: ['#knowledge'],
          },
        },
      },
    ],
  },

  // ── Stone (2) ─────────────────────────────────────────────────────

  {
    id: 'encounter.mend_equipment',
    name: 'Mend Equipment',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'stone',
    reachSecondary: 'iron',
    encounterType: 'build',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['tradition_progress', 'courage_prudence'],
    steps: [
      {
        id: 'mend_equipment.assess',
        name: 'Assess the Damage',
        reach: 'stone',
        difficulty: UNIVERSAL_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'Gear frays and blunts with use. {actor} lays out {their} tools and takes stock of what needs fixing.',
        onSuccess: {
          narrative: '{actor} identifies the worst of it — a cracked haft, a loosened strap — and sets to work with {adj} purpose.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'The damage runs deeper than expected. {actor} lacks the materials for a proper repair.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'mend_equipment.repair',
        name: 'Make Repairs',
        reach: 'iron',
        difficulty: UNIVERSAL_DIFFICULTY_BASE + UNIVERSAL_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'Improvisation is its own craft. {actor} works with what the land provides, bending {adj} skill to necessity.',
        onSuccess: {
          narrative: 'Not perfect, but serviceable. {actor} tests the repair — it holds. Good enough for what lies ahead.',
          reputationDelta: 0.03,
        },
        onFailure: {
          narrative: 'The fix does not hold. {actor} packs the broken thing away, hoping for better tools elsewhere.',
          reputationDelta: -0.01,
        },
      },
    ],
  },
  {
    id: 'encounter.shore_up_shelter',
    name: 'Shore Up Shelter',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'stone',
    reachSecondary: 'gold',
    encounterType: 'build',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['tradition_progress', 'loyalty_ambition'],
    steps: [
      {
        id: 'shore_up_shelter.survey',
        name: 'Survey the Structure',
        reach: 'stone',
        difficulty: UNIVERSAL_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'Roof, wall, foundation — {actor} checks each in turn. The {adj} calculus of what will hold and what will not.',
        onSuccess: {
          narrative: 'The weak points are clear. A sagging beam here, a crumbling joint there. {actor} knows where to start.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'Everything looks equally fragile. {actor} cannot tell what is load-bearing and what is cosmetic.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'shore_up_shelter.reinforce',
        name: 'Reinforce What Matters',
        reach: 'gold',
        difficulty: UNIVERSAL_DIFFICULTY_BASE + UNIVERSAL_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'Salvaged timber, borrowed rope, stones wedged into gaps. {actor} makes do with {adj} resourcefulness.',
        onSuccess: {
          narrative: 'The shelter holds firmer now. Not beautiful, but solid. {actor} has earned a dry night.',
          reputationDelta: 0.03,
        },
        onFailure: {
          narrative: 'The materials give out before the work is done. The shelter is no worse, but no better either.',
          reputationDelta: -0.01,
        },
      },
    ],
  },

  // ── Star (2) ──────────────────────────────────────────────────────

  {
    id: 'encounter.commune_with_stars',
    name: 'Commune with the Stars',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'star',
    reachSecondary: 'veil',
    encounterType: 'create',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ['tradition_progress', 'loyalty_ambition'],
    steps: [
      {
        id: 'commune_with_stars.gaze',
        name: 'Read the Sky',
        reach: 'star',
        difficulty: UNIVERSAL_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'When the sky clears, {actor} turns {their} face upward. The constellations wheel in {adj} silence overhead.',
        onSuccess: {
          narrative: 'The stars speak to those who know how to listen. {actor} reads an omen — faint, but unmistakable.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'Clouds gather, or the mind wanders. {actor} sees only cold light, {adj} and indifferent.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'commune_with_stars.interpret',
        name: 'Interpret the Omen',
        reach: 'veil',
        difficulty: UNIVERSAL_DIFFICULTY_BASE + UNIVERSAL_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'An omen means nothing without understanding. {actor} reaches beyond the visible, seeking the {adj} meaning beneath.',
        onSuccess: {
          narrative: 'The pattern resolves. {actor} glimpses a thread of fate — where it leads, only time will tell.',
          reputationDelta: 0.03,
          rewardPool: {
            categoryWeights: { condition: 0.3, bestowed_power: 0.5, possession: 0.2 },
            tagFilters: ['#divine'],
          },
        },
        onFailure: {
          narrative: 'The meaning slips away like smoke. {actor} is left with questions and the {adj} weight of things unseen.',
          reputationDelta: -0.01,
          rewardPool: {
            categoryWeights: { condition: 0.3, bestowed_power: 0.5, possession: 0.2 },
            tagFilters: ['#divine'],
          },
        },
      },
    ],
  },
  {
    id: 'encounter.offer_small_prayer',
    name: 'Offer a Small Prayer',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'star',
    reachSecondary: 'heart',
    encounterType: 'assist',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['justice_mercy', 'tradition_progress'],
    steps: [
      {
        id: 'offer_small_prayer.kneel',
        name: 'Find a Quiet Place',
        reach: 'star',
        difficulty: UNIVERSAL_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'No temple needed. {actor} kneels where {they} stand, letting the noise of the world fall away to {adj} stillness.',
        onSuccess: {
          narrative: 'The silence opens. {actor} speaks — to the sky, to the earth, to whatever listens. The words come easily.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'The world intrudes. {actor} cannot find the quiet, and the prayer dies unspoken.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'offer_small_prayer.listen',
        name: 'Wait for an Answer',
        reach: 'heart',
        difficulty: UNIVERSAL_DIFFICULTY_BASE + UNIVERSAL_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'Prayer is half speaking, half listening. {actor} waits in {adj} silence, open to whatever comes.',
        onSuccess: {
          narrative: 'Something shifts — not a voice, not a vision, but a settling in the chest. {actor} rises with purpose renewed.',
          reputationDelta: 0.03,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#divine'],
          },
        },
        onFailure: {
          narrative: 'Only silence answers. {actor} rises no worse for the asking, but no better either.',
          reputationDelta: -0.01,
        },
      },
    ],
  },

  // ── Reach-Agnostic (2) ────────────────────────────────────────────
  //
  // These use common reaches but at extra-low difficulty (15 → 20)
  // so any agent passes regardless of capability. True fallbacks.

  {
    id: 'encounter.rest_and_recover',
    name: 'Rest and Recover',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'heart',
    reachSecondary: 'stone',
    encounterType: 'assist',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['courage_prudence', 'loyalty_ambition'],
    steps: [
      {
        id: 'rest_and_recover.settle',
        name: 'Find Shelter',
        reach: 'heart',
        difficulty: AGNOSTIC_DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} searches for a sheltered spot to rest. The land offers little comfort, but {adj} resolve finds a way.',
        onSuccess: {
          narrative: '{actor} settles into a {adj} stillness, letting the weight of the road lift from aching limbs.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'No shelter holds. {actor} {verb}s against the cold, unable to find true rest.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'rest_and_recover.sleep',
        name: 'Sleep It Off',
        reach: 'stone',
        difficulty: AGNOSTIC_DIFFICULTY_BASE + AGNOSTIC_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'Rest is its own kind of work. {actor} surrenders to the {adj} pull of exhaustion.',
        onSuccess: {
          narrative: 'Sleep comes deep and dreamless. {actor} wakes stiff but renewed, ready for what comes next.',
          reputationDelta: 0.03,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#heart'],
          },
        },
        onFailure: {
          narrative: 'The ground is hard, the noises too close. {actor} rises no more rested than when {they} lay down.',
          reputationDelta: -0.01,
        },
      },
    ],
  },
  {
    id: 'encounter.forage_provisions',
    name: 'Forage for Provisions',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'eye',
    reachSecondary: 'stone',
    encounterType: 'explore',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['loyalty_ambition', 'justice_mercy'],
    steps: [
      {
        id: 'forage_provisions.search',
        name: 'Search the Land',
        reach: 'eye',
        difficulty: AGNOSTIC_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'Hunger sharpens the eye. {actor} scans the terrain for anything edible, useful, or overlooked.',
        onSuccess: {
          narrative: '{actor} spots what others miss — a cluster of roots, a clean spring, something to sustain {them} another day.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'The land gives nothing. {actor} returns empty-handed, the {adj} search yielding only dust.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'forage_provisions.gather',
        name: 'Gather and Carry',
        reach: 'stone',
        difficulty: AGNOSTIC_DIFFICULTY_BASE + AGNOSTIC_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'What the eye found, the body must carry. {actor} bends to the {adj} work of gathering.',
        onSuccess: {
          narrative: 'Arms full, {actor} hauls {their} findings back. Not a feast — but enough. Always enough.',
          reputationDelta: 0.03,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#survival'],
          },
        },
        onFailure: {
          narrative: 'Too heavy, too far. {actor} drops half the haul on the way back, the {adj} effort wasted.',
          reputationDelta: -0.01,
        },
      },
    ],
  },

  // ─── Additional Universal Encounter Templates (Phase 15 Plan 03) ───
  //
  // 19 new universal templates spanning difficulty 15–70.
  // Use ALL_LOCATION_SUBTYPES to guarantee baseline content at every
  // location type including content deserts (ruins, unexplored_poi, etc.).
  // Narrative text is location-agnostic — {actor} placeholder only.

  // ── Low Difficulty (diff 15–30) — Early-Game ──────────────────────

  {
    id: 'encounter.forage_the_land',
    name: 'Forage the Land',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'stone',
    reachSecondary: 'eye',
    encounterType: 'explore',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['preservation_transformation', 'revelation_discretion'],
    steps: [
      {
        id: 'forage_land.look',
        name: 'Read the Terrain',
        reach: 'eye',
        difficulty: AGNOSTIC_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'Even the most {adj} exhausted land gives something to those who know where to look. {actor} reads the ground for what it offers.',
        onSuccess: {
          narrative: '{actor} reads the terrain correctly — water, roots, shelter material. The land is never entirely empty.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'The land gives {actor} nothing today. The {adj} search turns up only disappointment.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'forage_land.harvest',
        name: 'Harvest What Is Found',
        reach: 'stone',
        difficulty: AGNOSTIC_DIFFICULTY_BASE + AGNOSTIC_DIFFICULTY_STEP,
        duration: 1,
        narrative: '{actor} puts {their} back into the {adj} work of extraction — digging, cutting, hauling what the land gives up.',
        onSuccess: {
          narrative: '{actor} gathers more than expected. The {adj} physical work pays off.',
          reputationDelta: 0.03,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#survival'],
          },
        },
        onFailure: {
          narrative: 'The {adj} effort yields little. {actor} has not yet learned to work with this land.',
          reputationDelta: -0.01,
        },
      },
    ],
  },

  {
    id: 'encounter.rest_and_reflect',
    name: 'Rest and Reflect',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'heart',
    reachSecondary: 'eye',
    encounterType: 'explore',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['loyalty_ambition', 'courage_prudence'],
    steps: [
      {
        id: 'rest_reflect.rest',
        name: 'Allow the Rest',
        reach: 'heart',
        difficulty: AGNOSTIC_DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} has been moving too long. The {adj} need to stop is itself a kind of knowledge. {they} find a place to simply be.',
        onSuccess: {
          narrative: 'The rest comes {adj} easily. {actor} wakes lighter, the accumulation of distance processed overnight.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: '{actor} cannot let {themselves} stop. The {adj} rest is restless; they rise less recovered than before.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'rest_reflect.reflect',
        name: 'Sit with What Has Passed',
        reach: 'eye',
        difficulty: AGNOSTIC_DIFFICULTY_BASE + AGNOSTIC_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'What has {actor} actually been through? The {adj} pattern of events {verb}s into meaning when approached without urgency.',
        onSuccess: {
          narrative: '{actor} finds the {adj} thread running through what has happened. Something important becomes clear.',
          reputationDelta: 0.03,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#heart'],
          },
        },
        onFailure: {
          narrative: 'The {adj} reflection yields confusion, not clarity. Some things need more time.',
          reputationDelta: -0.01,
        },
      },
    ],
  },

  {
    id: 'encounter.local_gossip',
    name: 'Local Gossip',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'heart',
    reachSecondary: 'shadow',
    encounterType: 'explore',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['loyalty_ambition', 'honesty_cunning'],
    steps: [
      {
        id: 'local_gossip.listen',
        name: 'Find the Talkers',
        reach: 'heart',
        difficulty: AGNOSTIC_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'Every place has its gossips — the {adj} unofficial historians of the mundane. {actor} needs only find them and be worth talking to.',
        onSuccess: {
          narrative: '{actor} is {adj} warmly received. The gossips talk freely, the words coming faster than expected.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: '{actor} cannot find anyone {adj} willing to talk. The locals are close-mouthed today.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'local_gossip.sort',
        name: 'Sort the True from the Embellished',
        reach: 'shadow',
        difficulty: AGNOSTIC_DIFFICULTY_BASE + AGNOSTIC_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'Gossip is {adj} half-true at best. {actor} must parse what is real from what is wishful thinking or {adj} malicious invention.',
        onSuccess: {
          narrative: '{actor} finds the grain of {adj} truth in the grain of gossip. Something useful emerges.',
          reputationDelta: 0.03,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#heart'],
          },
        },
        onFailure: {
          narrative: 'The {adj} gossip is pure noise. {actor} leaves knowing only what people want to be true.',
          reputationDelta: -0.01,
        },
      },
    ],
  },

  {
    id: 'encounter.tend_to_wounds',
    name: 'Tend to Wounds',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'eye',
    reachSecondary: 'heart',
    encounterType: 'assist',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['mercy_ruthlessness', 'revelation_discretion'],
    steps: [
      {
        id: 'tend_wounds.assess',
        name: 'Assess the Injury',
        reach: 'eye',
        difficulty: AGNOSTIC_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'The injured arrive or {actor} finds them. Before anything else: how bad is it? The {adj} first assessment determines everything that follows.',
        onSuccess: {
          narrative: '{actor} reads the injury {adj} accurately. Triage is clear, and the path to treatment is known.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: '{actor} misjudges the severity. The {adj} subsequent treatment is less effective for it.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'tend_wounds.treat',
        name: 'Apply the Treatment',
        reach: 'heart',
        difficulty: AGNOSTIC_DIFFICULTY_BASE + AGNOSTIC_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'The treatment requires more than technique — it requires {adj} patience with pain, with fear, with the {adj} slow work of healing.',
        onSuccess: {
          narrative: '{actor} tends the wounds well. The injured will recover. The {adj} gratitude is genuine.',
          reputationDelta: 0.03,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#healing'],
          },
        },
        onFailure: {
          narrative: '{actor}\'s treatment is {adj} adequate but not enough. Recovery will be {adj} longer than it should.',
          reputationDelta: -0.01,
        },
      },
    ],
  },

  {
    id: 'encounter.scout_the_perimeter',
    name: 'Scout the Perimeter',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'eye',
    reachSecondary: 'iron',
    encounterType: 'explore',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ['revelation_discretion', 'courage_prudence'],
    steps: [
      {
        id: 'scout_perimeter.map',
        name: 'Map the Approaches',
        reach: 'eye',
        difficulty: UNIVERSAL_DIFFICULTY_BASE + 5,
        duration: 1,
        narrative: '{actor} moves around the {adj} outer edge of the location, tracking every approach, every covered position, every line of sight.',
        onSuccess: {
          narrative: '{actor} completes the circuit with a {adj} clear picture of the ground. No surprises now.',
          reputationDelta: 0.03,
        },
        onFailure: {
          narrative: 'The terrain {verb}s against a clean circuit. {actor} covers most of it, but the {adj} gaps remain.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'scout_perimeter.report',
        name: 'Act on What Was Found',
        reach: 'iron',
        difficulty: UNIVERSAL_DIFFICULTY_BASE + UNIVERSAL_DIFFICULTY_STEP + 5,
        duration: 1,
        narrative: 'Scouting without action is {adj} incomplete. {actor} must do something with what {they} found.',
        onSuccess: {
          narrative: '{actor} acts on the {adj} intelligence — covers the approach, prepares the position, removes the risk.',
          reputationDelta: 0.04,
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
            tagFilters: ['#combat'],
          },
        },
        onFailure: {
          narrative: 'The {adj} discovery is noted but not acted on in time. The opportunity passes.',
          reputationDelta: -0.02,
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#combat'],
          },
        },
      },
    ],
  },

  // ── Moderate Difficulty (diff 35–50) — Mid-Game Universal ─────────

  {
    id: 'encounter.barter_with_travelers',
    name: 'Barter with Travelers',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'gold',
    reachSecondary: 'heart',
    encounterType: 'trade',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ['asceticism_extravagance', 'loyalty_ambition'],
    steps: [
      {
        id: 'barter_travelers.meet',
        name: 'Make the Approach',
        reach: 'heart',
        difficulty: MODERATE_DIFFICULTY_BASE - 5,
        duration: 1,
        narrative: 'Travelers stop here, and travelers carry things worth wanting. {actor} must make an {adj} approach that does not read as threat or desperation.',
        onSuccess: {
          narrative: '{actor} opens the exchange with {adj} easy confidence. The travelers are interested.',
          reputationDelta: 0.03,
        },
        onFailure: {
          narrative: 'The travelers are {adj} wary. The exchange starts badly.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'barter_travelers.deal',
        name: 'Strike the Deal',
        reach: 'gold',
        difficulty: MODERATE_DIFFICULTY_BASE + MODERATE_DIFFICULTY_STEP - 5,
        duration: 1,
        narrative: 'Both parties have what the other wants. The {adj} question is who blinks first on the price.',
        onSuccess: {
          narrative: '{actor} closes the deal at {adj} favorable terms. Both parties leave satisfied.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
            tagFilters: ['#trade'],
          },
        },
        onFailure: {
          narrative: 'The {adj} deal falls through. Too far apart on price, too little trust. The travelers move on.',
          reputationDelta: -0.04,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
            tagFilters: ['#trade'],
          },
        },
      },
    ],
  },

  {
    id: 'encounter.defend_against_predators',
    name: 'Defend Against Predators',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'iron',
    reachSecondary: 'eye',
    encounterType: 'assist',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ['mercy_ruthlessness', 'courage_prudence'],
    steps: [
      {
        id: 'defend_predators.detect',
        name: 'Detect the Threat',
        reach: 'eye',
        difficulty: MODERATE_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'Something {adj} large is circling. {actor} reads the signs before it shows itself — behavior of animals, a smell, a pattern of silence.',
        onSuccess: {
          narrative: '{actor} detects the {adj} predator early. They are ready when it moves.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: '{actor} does not read the signs in time. The predator {verb}s before {they} are prepared.',
          reputationDelta: -0.04,
        },
      },
      {
        id: 'defend_predators.drive_off',
        name: 'Drive It Off',
        reach: 'iron',
        difficulty: MODERATE_DIFFICULTY_BASE + MODERATE_DIFFICULTY_STEP,
        duration: 2,
        narrative: 'The predator is {adj} not deterred by numbers or noise alone. {actor} must make it understand the cost of attacking.',
        onSuccess: {
          narrative: '{actor} drives the predator off with {adj} decisive force. It will not return today.',
          reputationDelta: 0.10,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The predator {verb}s its ground. {actor} drives it back but not away — the threat {adj} lingers.',
          reputationDelta: -0.05,
        },
      },
    ],
  },

  {
    id: 'encounter.investigate_anomaly',
    name: 'Investigate Anomaly',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'eye',
    reachSecondary: 'veil',
    encounterType: 'explore',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ['revelation_discretion', 'tradition_novelty'],
    steps: [
      {
        id: 'investigate_anomaly.observe',
        name: 'Observe the Anomaly',
        reach: 'eye',
        difficulty: MODERATE_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'Something is {adj} wrong here — not dangerously, not obviously, but persistently. {actor} traces the edges of what does not fit.',
        onSuccess: {
          narrative: '{actor} isolates the {adj} anomaly from the background. It is real, not imagined.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: 'The {adj} anomaly resists easy observation. {actor} is not sure what {they} are even looking at.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'investigate_anomaly.understand',
        name: 'Understand the Cause',
        reach: 'veil',
        difficulty: MODERATE_DIFFICULTY_BASE + MODERATE_DIFFICULTY_STEP,
        duration: 2,
        narrative: 'Understanding the {adj} anomaly means going beyond what the eye reports. {actor} must feel for the cause beneath the surface.',
        onSuccess: {
          narrative: '{actor} traces the anomaly to its {adj} root. Something unusual has passed through here — or is still present.',
          reputationDelta: 0.12,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.6, condition: 0.4 },
            tagFilters: ['#knowledge'],
          },
        },
        onFailure: {
          narrative: 'The {adj} cause remains opaque. {actor} knows something happened here, but not what.',
          reputationDelta: -0.05,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.6, condition: 0.4 },
            tagFilters: ['#knowledge'],
          },
        },
      },
    ],
  },

  {
    id: 'encounter.rally_the_locals',
    name: 'Rally the Locals',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'star',
    reachSecondary: 'heart',
    encounterType: 'lead',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ['sacrifice_survival', 'loyalty_ambition'],
    steps: [
      {
        id: 'rally_locals.assess_mood',
        name: 'Assess the Mood',
        reach: 'eye',
        difficulty: MODERATE_DIFFICULTY_BASE - 5,
        duration: 1,
        narrative: 'Before rallying anyone, {actor} must understand what has drained them. The {adj} specific complaint is not always the real one.',
        onSuccess: {
          narrative: '{actor} reads the {adj} underlying grievance accurately. The speech will address the real wound.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: '{actor} addresses the {adj} surface complaint. The real wound {verb}s unacknowledged.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'rally_locals.inspire',
        name: 'Inspire Action',
        reach: 'star',
        difficulty: MODERATE_DIFFICULTY_BASE + MODERATE_DIFFICULTY_STEP - 5,
        duration: 1,
        narrative: 'The {adj} moment arrives. {actor} stands before people who want a reason to hope and must provide one that is genuine.',
        onSuccess: {
          narrative: '{actor}\'s words {verb} through the crowd like warmth. People rise — not because they were told to, but because they chose to.',
          reputationDelta: 0.12,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s words fall {adj} flat. The crowd {verb}s away unchanged. Some things cannot be forced.',
          reputationDelta: -0.06,
        },
      },
    ],
  },

  {
    id: 'encounter.negotiate_dispute',
    name: 'Negotiate a Dispute',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'heart',
    reachSecondary: 'star',
    encounterType: 'lead',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ['mercy_ruthlessness', 'loyalty_ambition'],
    steps: [
      {
        id: 'negotiate_dispute.hear',
        name: 'Hear Both Sides',
        reach: 'heart',
        difficulty: MODERATE_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'Two parties arrive at {actor} with {adj} opposing accounts of the same injury. Both believe they are right. Both may be.',
        onSuccess: {
          narrative: '{actor} hears both accounts with {adj} genuine attention. The shape of the real dispute becomes clear.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: '{actor} {adj} favors one account over the other before hearing it fully. The mediation {verb}s before it begins.',
          reputationDelta: -0.04,
        },
      },
      {
        id: 'negotiate_dispute.resolve',
        name: 'Broker the Resolution',
        reach: 'star',
        difficulty: MODERATE_DIFFICULTY_BASE + MODERATE_DIFFICULTY_STEP,
        duration: 2,
        narrative: 'A resolution that both parties can accept requires finding what {adj} both actually value — not what they say they want.',
        onSuccess: {
          narrative: '{actor} finds the {adj} common ground. Both parties leave dissatisfied enough to accept it. That is enough.',
          reputationDelta: 0.10,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The {adj} dispute cannot be resolved today. {actor} separates the parties — but not the grievance.',
          reputationDelta: -0.05,
        },
      },
    ],
  },

  {
    id: 'encounter.shadow_in_the_night',
    name: 'Shadow in the Night',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'shadow',
    reachSecondary: 'eye',
    encounterType: 'steal',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ['honesty_cunning', 'courage_prudence'],
    steps: [
      {
        id: 'shadow_night.move',
        name: 'Move Unseen',
        reach: 'shadow',
        difficulty: MODERATE_DIFFICULTY_BASE + 5,
        duration: 1,
        narrative: 'The night offers cover, but cover cuts both ways. {actor} moves through the {adj} dark, using every available shadow.',
        onSuccess: {
          narrative: '{actor} passes through {adj} undetected. The night holds, the shadows cooperate.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: 'A {adj} misstep, a creak, a silhouette at the wrong moment. {actor} is almost seen.',
          reputationDelta: -0.04,
        },
      },
      {
        id: 'shadow_night.complete',
        name: 'Complete the Task',
        reach: 'eye',
        difficulty: MODERATE_DIFFICULTY_BASE + MODERATE_DIFFICULTY_STEP + 5,
        duration: 2,
        narrative: 'The objective is reached. {actor} must accomplish what {they} came for in the {adj} dark, with whatever time the shadows allow.',
        onSuccess: {
          narrative: '{actor} completes the task with {adj} clean efficiency. Gone before the sun rises.',
          reputationDelta: 0.12,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.6, condition: 0.4 },
            tagFilters: ['#stealth'],
          },
        },
        onFailure: {
          narrative: 'The {adj} objective proves beyond reach tonight. {actor} withdraws with the task unfinished.',
          reputationDelta: -0.06,
          rewardPool: {
            categoryWeights: { possession: 0.6, condition: 0.4 },
            tagFilters: ['#stealth'],
          },
        },
      },
    ],
  },

  // ── High Difficulty (diff 55–70) — Late-Game Universal ────────────

  {
    id: 'encounter.master_local_craft',
    name: 'Master the Local Craft',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'stone',
    reachSecondary: 'gold',
    encounterType: 'create',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ['preservation_transformation', 'asceticism_extravagance'],
    steps: [
      {
        id: 'master_craft.study',
        name: 'Study the Tradition',
        reach: 'eye',
        difficulty: HARD_DIFFICULTY_BASE,
        duration: 2,
        narrative: 'Every place has a {adj} craft tradition — a way of making things that carries local knowledge in its techniques. {actor} must learn it properly.',
        onSuccess: {
          narrative: '{actor} absorbs the {adj} tradition with respect and patience. The masters acknowledge a serious student.',
          reputationDelta: 0.06,
        },
        onFailure: {
          narrative: '{actor} skims the {adj} surface of the tradition. Real mastery requires more time than was given.',
          reputationDelta: -0.04,
        },
      },
      {
        id: 'master_craft.execute',
        name: 'Demonstrate Mastery',
        reach: 'stone',
        difficulty: HARD_DIFFICULTY_BASE + HARD_DIFFICULTY_STEP,
        duration: 3,
        narrative: 'The {adj} final test: produce something in the local tradition that the masters cannot dismiss.',
        onSuccess: {
          narrative: '{actor}\'s work {verb}s the masters. The craft tradition has a new practitioner — and a new direction.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.5, bestowed_power: 0.5 },
            tagFilters: ['#craft'],
          },
        },
        onFailure: {
          narrative: 'The work is {adj} competent but not mastered. The tradition still holds its deeper secrets.',
          reputationDelta: -0.07,
          rewardPool: {
            categoryWeights: { possession: 0.5, bestowed_power: 0.5 },
            tagFilters: ['#craft'],
          },
        },
      },
    ],
  },

  {
    id: 'encounter.confront_the_unknown',
    name: 'Confront the Unknown',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'iron',
    reachSecondary: 'veil',
    encounterType: 'duel',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ['courage_prudence', 'sacrifice_survival'],
    steps: [
      {
        id: 'confront_unknown.identify',
        name: 'Identify the Threat',
        reach: 'eye',
        difficulty: HARD_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'Something {verb}s here that should not. {actor} must determine what {they} are actually facing before committing to any course of action.',
        onSuccess: {
          narrative: '{actor} identifies the {adj} nature of the threat. It is still dangerous — but now known.',
          reputationDelta: 0.06,
        },
        onFailure: {
          narrative: 'The threat eludes {adj} classification. {actor} must act on incomplete understanding.',
          reputationDelta: -0.05,
        },
      },
      {
        id: 'confront_unknown.face',
        name: 'Face It Directly',
        reach: 'iron',
        difficulty: HARD_DIFFICULTY_BASE + HARD_DIFFICULTY_STEP,
        duration: 2,
        narrative: 'There is no clever approach. The {adj} thing requires direct confrontation — will against will, presence against presence.',
        onSuccess: {
          narrative: '{actor} does not flinch. The {adj} unknown meets someone it cannot unsettle and withdraws.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.6, condition: 0.4 },
            tagFilters: ['#combat'],
          },
        },
        onFailure: {
          narrative: 'The {adj} confrontation goes badly. {actor} survives but is marked by it.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.6, condition: 0.4 },
            tagFilters: ['#combat'],
          },
        },
      },
    ],
  },

  {
    id: 'encounter.weave_political_alliance',
    name: 'Weave a Political Alliance',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'star',
    reachSecondary: 'shadow',
    encounterType: 'lead',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ['loyalty_ambition', 'honesty_cunning'],
    steps: [
      {
        id: 'political_alliance.identify',
        name: 'Identify the Right Partners',
        reach: 'eye',
        difficulty: HARD_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'An alliance is only as {adj} valuable as the partners in it. {actor} must identify who actually has power and who merely has position.',
        onSuccess: {
          narrative: '{actor} maps the {adj} real power structure. The right partners are identified.',
          reputationDelta: 0.06,
        },
        onFailure: {
          narrative: '{actor} misjudges the {adj} power dynamics. The partners approached are weaker than they appeared.',
          reputationDelta: -0.05,
        },
      },
      {
        id: 'political_alliance.negotiate',
        name: 'Negotiate the Terms',
        reach: 'shadow',
        difficulty: HARD_DIFFICULTY_BASE + HARD_DIFFICULTY_STEP,
        duration: 2,
        narrative: 'Every partner wants something and will only say {adj} half of what they want directly. {actor} must read what remains unsaid.',
        onSuccess: {
          narrative: '{actor} navigates the {adj} unspoken requirements with skill. The alliance takes shape.',
          reputationDelta: 0.12,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'A {adj} key partner withdraws when their unspoken requirement goes unmet. The alliance {verb}s incomplete.',
          reputationDelta: -0.07,
        },
      },
      {
        id: 'political_alliance.seal',
        name: 'Seal the Alliance',
        reach: 'star',
        difficulty: HARD_DIFFICULTY_BASE + HARD_DIFFICULTY_STEP * 2,
        duration: 2,
        narrative: 'The final ceremony of commitment. {actor} must hold the {adj} alliance together through the moment when its full cost becomes clear to all parties.',
        onSuccess: {
          narrative: '{actor} seals the {adj} alliance with the kind of authority that makes everyone present believe it will hold.',
          reputationDelta: 0.18,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The {adj} alliance dissolves at the sealing. The partners {verb} in opposite directions, the work undone.',
          reputationDelta: -0.10,
        },
      },
    ],
  },

  {
    id: 'encounter.arcane_resonance_study',
    name: 'Arcane Resonance Study',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'veil',
    reachSecondary: 'eye',
    encounterType: 'explore',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ['tradition_novelty', 'revelation_discretion'],
    steps: [
      {
        id: 'arcane_resonance.attune',
        name: 'Attune to the Resonance',
        reach: 'veil',
        difficulty: HARD_DIFFICULTY_BASE,
        duration: 2,
        narrative: 'Every place carries a {adj} trace of what has occurred there — the residue of acts and intentions layered in the walls and ground. {actor} opens to it.',
        onSuccess: {
          narrative: '{actor} attunes to the {adj} resonance. A picture assembles itself from feeling and impression.',
          reputationDelta: 0.06,
        },
        onFailure: {
          narrative: 'The resonance {verb}s in fragments. {actor} receives impressions but cannot {adj} assemble them.',
          reputationDelta: -0.05,
        },
      },
      {
        id: 'arcane_resonance.interpret',
        name: 'Interpret What Was Felt',
        reach: 'eye',
        difficulty: HARD_DIFFICULTY_BASE + HARD_DIFFICULTY_STEP,
        duration: 2,
        narrative: 'The {adj} raw impression must be interpreted — turned from feeling into {adj} knowledge that can be acted upon.',
        onSuccess: {
          narrative: '{actor} makes the {adj} translation successfully. What was felt becomes known.',
          reputationDelta: 0.14,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.7, condition: 0.3 },
            tagFilters: ['#knowledge'],
          },
        },
        onFailure: {
          narrative: 'The {adj} interpretation {verb}s into confusion. The feeling was real — the meaning remains beyond reach.',
          reputationDelta: -0.06,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.7, condition: 0.3 },
            tagFilters: ['#knowledge'],
          },
        },
      },
    ],
  },

  // ─── Content Audit Gap-Fill (Phase: Variety Pass) ────────────────────
  // Fills coverage gaps identified in the trivial/easy content audit:
  // - Veil: zero trivials → 4 added; Star: thin → 4 added; Stone easy gap → 3 added
  // - Iron/Shadow trivials beyond generic → location-flavored added
  // - Castle/fort/tower/mining/shrine/ruins/wilderness specifics
  // - Encounter type diversity (hire, steal, create, duel at trivial)

  // ═══════════════════════════════════════════════════════════════════
  //  VEIL TRIVIALS & EASY (was: 0 trivials, 3 easy)
  // ═══════════════════════════════════════════════════════════════════

  {
    id: 'encounter.read_the_wards',
    name: 'Read the Wards',
    locationTypes: ['castle', 'fort', 'tower', 'temple'],
    reachPrimary: 'veil',
    reachSecondary: 'eye',
    encounterType: 'explore',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['revelation_discretion', 'tradition_progress'],
    steps: [
      {
        id: 'read_wards.sense',
        name: 'Sense the Weave',
        reach: 'veil',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: 'The stones here hum with old protections. {actor} places a palm flat against the wall and listens with senses beyond hearing.',
        onSuccess: {
          narrative: 'The ward-pattern blooms in {actor}\'s mind — layers of intention, each {adj} and deliberate. Someone cared enough to weave this well.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} feels the hum but cannot parse the pattern. The wards remain a {adj} murmur without meaning.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'read_wards.interpret',
        name: 'Interpret the Purpose',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'Understanding the ward\'s shape is one thing. Understanding what it {verb}s against — that requires a {adj} different kind of knowing.',
        onSuccess: {
          narrative: '{actor} traces the ward to its anchor and reads its intent: protection against something specific. Knowledge worth having.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The ward\'s purpose slips away like smoke. {actor} knows something is protected, but not from what.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'read_wards.catalogue',
        name: 'Catalogue the Defences',
        reach: 'veil',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 2,
        narrative: '{actor} attempts to map every ward, every {adj} binding, every sleeping glyph — a complete census of magical defence.',
        onSuccess: {
          narrative: 'The full ward-map settles into {actor}\'s memory like a diagram drawn in light. Every vulnerability, every strength, known.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#veil'],
          },
        },
        onFailure: {
          narrative: 'Too many layers. {actor}\'s survey is {adj} incomplete — good enough for caution, not for certainty.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.minor_cantrip',
    name: 'Practice a Minor Cantrip',
    locationTypes: ['shrine', 'temple', 'tower', 'ruins'],
    reachPrimary: 'veil',
    reachSecondary: 'star',
    encounterType: 'create',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['tradition_progress', 'revelation_discretion'],
    steps: [
      {
        id: 'minor_cantrip.focus',
        name: 'Draw the Focus',
        reach: 'veil',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: 'A quiet corner. A steady breath. {actor} traces a {adj} sigil in the air with one finger, willing the smallest thread of power into being.',
        onSuccess: {
          narrative: 'Light gathers at {actor}\'s fingertip — faint, trembling, but real. The sigil holds.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The sigil flickers and dissipates. {actor}\'s concentration wavers, and the thread escapes.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'minor_cantrip.sustain',
        name: 'Hold the Working',
        reach: 'star',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 1,
        narrative: 'Casting is easy. Holding is hard. The cantrip {verb}s against {actor}\'s will, wanting to unravel.',
        onSuccess: {
          narrative: 'Three heartbeats. Five. Ten. The cantrip persists, obedient and {adj}. Small magic, but magic nonetheless.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The working collapses after two breaths. {actor} lets it go with a {adj} sigh. Tomorrow, then.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'minor_cantrip.release',
        name: 'Shape the Release',
        reach: 'veil',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'The cantrip completes when released properly — not dropped, but placed, like setting a {adj} stone into mortar.',
        onSuccess: {
          narrative: 'The cantrip settles into the world with a soft click, like a key turning. {actor} feels the {adj} satisfaction of craft done right.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#veil'],
          },
        },
        onFailure: {
          narrative: 'The release is clumsy. The cantrip sputters away harmlessly — no damage done, but no craft achieved.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.hedge_remedy',
    name: 'Brew a Hedge Remedy',
    locationTypes: ['wilderness', 'oasis', 'farmland', 'hamlet'],
    reachPrimary: 'veil',
    reachSecondary: 'eye',
    encounterType: 'create',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['justice_mercy', 'tradition_progress'],
    steps: [
      {
        id: 'hedge_remedy.gather',
        name: 'Gather the Ingredients',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} combs the {adj} undergrowth for the right leaves, the right bark, the right fungus. Folk medicine begins with knowing where to look.',
        onSuccess: {
          narrative: 'Yarrow, willow bark, and something with no name that grows only in shadow. {actor} has what {they} need{they}.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'Wrong season, wrong soil. {actor} finds substitutes, but substitutes are never quite the same.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'hedge_remedy.prepare',
        name: 'Prepare the Poultice',
        reach: 'veil',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'The line between herbalism and magic blurs in the mortar. {actor} grinds with {adj} intent, whispering the old words.',
        onSuccess: {
          narrative: 'The poultice warms under {actor}\'s hands — not quite mundane, not quite magical. The {adj} remedy works.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The mixture turns {adj} and wrong. {actor} discards it before it does more harm than the wound.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'hedge_remedy.apply',
        name: 'Apply with Care',
        reach: 'veil',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'Healing is the gentlest magic and the most {adj} demanding. {actor} lays the remedy on flesh and wills it to take.',
        onSuccess: {
          narrative: 'The wound closes, the fever breaks, the cough eases. {actor} wipes {their} hands and says nothing — the remedy speaks.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#healing'],
          },
        },
        onFailure: {
          narrative: 'The remedy helps, but not enough. {actor} knows the limits of hedge magic and {adj} accepts them.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.test_the_seal',
    name: 'Test a Binding Seal',
    locationTypes: ['ruins', 'ruined_tower', 'ruined_city'],
    reachPrimary: 'veil',
    reachSecondary: 'iron',
    encounterType: 'explore',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ['revelation_discretion', 'courage_prudence'],
    steps: [
      {
        id: 'test_seal.approach',
        name: 'Approach the Seal',
        reach: 'veil',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: 'Something was sealed here — not by lock and key but by will and sigil. {actor} feels the {adj} pressure of it from ten paces.',
        onSuccess: {
          narrative: '{actor} identifies the seal\'s tradition — old, deliberate, and still {adj} angry at intrusion.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The seal\'s pressure pushes {actor} back a step. Its {adj} warning is clear enough without comprehension.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'test_seal.probe',
        name: 'Probe the Edges',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'Testing a seal means finding where it yields — if it yields. {actor} presses against its {adj} boundaries with careful force.',
        onSuccess: {
          narrative: 'A hairline weakness. The seal holds, but {actor} knows where it could be opened — or reinforced.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The seal {verb}s back. {actor} withdraws with singed fingers and a {adj} newfound respect.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'test_seal.record',
        name: 'Record the Findings',
        reach: 'veil',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 2,
        narrative: 'Knowledge of a seal — its strength, its age, its purpose — is valuable to those who know what to do with it.',
        onSuccess: {
          narrative: '{actor} commits the seal\'s full schema to memory: age, tradition, strength, and the {adj} thing it contains.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { condition: 0.5, bestowed_power: 0.5 },
            tagFilters: ['#ancient'],
          },
        },
        onFailure: {
          narrative: 'The details blur. {actor} remembers the seal exists but not what it guards. {adj} and frustrating.',
          reputationDelta: -0.08,
        },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  //  STAR TRIVIALS & EASY (was: 2 trivials, 1 easy)
  // ═══════════════════════════════════════════════════════════════════

  {
    id: 'encounter.shrine_offering',
    name: 'Leave a Shrine Offering',
    locationTypes: ['shrine', 'temple', 'ruins'],
    reachPrimary: 'star',
    reachSecondary: 'heart',
    encounterType: 'create',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['tradition_progress', 'justice_mercy'],
    steps: [
      {
        id: 'shrine_offering.select',
        name: 'Choose the Gift',
        reach: 'star',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: 'What do you give a god? {actor} considers what {they} carry, what {they} value, what {they} can afford to lose.',
        onSuccess: {
          narrative: '{actor} chooses well — something personal, something meant. The shrine\'s stones seem to lean {adj} closer.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} places something too cheap, too thoughtless. The air around the shrine does not change.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'shrine_offering.place',
        name: 'Place with Reverence',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 1,
        narrative: 'The offering must be placed, not dropped. Intent matters. {actor} kneels before the weathered {adj} stones.',
        onSuccess: {
          narrative: 'For a moment — just a moment — the air thickens with something old and vast and {adj}. The offering is accepted.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'Nothing happens. Perhaps the gods are elsewhere. {actor} rises with {adj} uncertainty.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'shrine_offering.listen',
        name: 'Listen for an Answer',
        reach: 'star',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 2,
        narrative: 'The truly faithful stay after the offering and listen. Most hear nothing. Some hear the {adj} wind. A few hear more.',
        onSuccess: {
          narrative: 'A tremor of certainty passes through {actor} — not a voice, not a vision, but a direction. The path ahead is {adj} clearer.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#divine'],
          },
        },
        onFailure: {
          narrative: 'Silence. {actor} waits until the cold drives {them} away. Faith is sometimes its own {adj} reward.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.read_the_stars',
    name: 'Read the Night Sky',
    locationTypes: ['wilderness', 'camp', 'oasis', 'battleground'],
    reachPrimary: 'star',
    reachSecondary: 'eye',
    encounterType: 'explore',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['revelation_discretion', 'tradition_progress'],
    steps: [
      {
        id: 'read_stars.observe',
        name: 'Chart the Constellations',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: 'Clear sky, no moon. {actor} lies back on cold ground and maps the {adj} familiar patterns — the Forge, the Wanderer, the Broken Crown.',
        onSuccess: {
          narrative: 'The stars are where they should be. {actor} marks the season, the direction, and the omens with {adj} precision.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'Cloud cover rolls in. {actor} catches half the sky before the {adj} darkness swallows the rest.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'read_stars.interpret',
        name: 'Read the Portents',
        reach: 'star',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'Stars tell time and direction to anyone. They tell fate only to those with the {adj} patience to listen.',
        onSuccess: {
          narrative: 'Something in the pattern speaks. {actor} cannot say exactly what, but {their} next three decisions carry a {adj} certainty they didn\'t before.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The stars are just stars tonight. {actor} rises, brushing dew from {their} back. Tomorrow may speak {adj} more clearly.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'read_stars.divine',
        name: 'Accept the Omen',
        reach: 'star',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'An omen is not a command. It is a {adj} weight on the scales of what might happen next.',
        onSuccess: {
          narrative: '{actor} carries the sky\'s message forward: a warning, a promise, or a {adj} question that demands answering.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#divine'],
          },
        },
        onFailure: {
          narrative: 'The omen slips away like a dream at dawn. {actor} knows something was offered and {adj} lost.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.tend_the_dead',
    name: 'Tend the Resting Dead',
    locationTypes: ['battleground', 'ruins', 'ruined_village', 'ruined_city'],
    reachPrimary: 'star',
    reachSecondary: 'heart',
    encounterType: 'assist',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ['justice_mercy', 'tradition_progress'],
    steps: [
      {
        id: 'tend_dead.find',
        name: 'Find the Unquiet',
        reach: 'star',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: 'Not all the dead rest well. {actor} walks the {adj} killing ground, listening for the whispers of those who linger.',
        onSuccess: {
          narrative: '{actor} finds them — not ghosts, not yet, but {adj} echoes of pain caught between world and whatever comes after.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The dead are silent. Perhaps they rest after all. Perhaps {actor} simply cannot {adj} hear them.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'tend_dead.rites',
        name: 'Speak the Words',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: '{actor} does not know the proper rites for every faith, every culture, every fallen soul. But grief is a {adj} universal language.',
        onSuccess: {
          narrative: 'The words are imperfect. The intent is not. Something in the {adj} air eases, and the ground feels lighter underfoot.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s words fall flat. The dead require something {they} cannot give — perhaps a name, a kin, a {adj} truth.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'tend_dead.mark',
        name: 'Mark the Place',
        reach: 'star',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 2,
        narrative: 'The last duty: mark the place so others know. A cairn. A carved stone. Something that says: here, people {adj} mattered.',
        onSuccess: {
          narrative: '{actor} raises a cairn that will outlast the season. Passers-by will know that someone cared enough to mark the {adj} spot.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
            tagFilters: ['#divine'],
          },
        },
        onFailure: {
          narrative: 'The cairn is rough and {adj}. It will not survive the winter. But the attempt was made.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#divine'],
          },
        },
      },
    ],
  },
  {
    id: 'encounter.blessing_of_passage',
    name: 'Bless the Road',
    locationTypes: ['camp', 'hamlet', 'oasis', 'farmland'],
    reachPrimary: 'star',
    reachSecondary: 'veil',
    encounterType: 'create',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ['tradition_progress', 'justice_mercy'],
    steps: [
      {
        id: 'bless_road.prepare',
        name: 'Prepare the Blessing',
        reach: 'star',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: 'Travelers deserve safe roads. {actor} gathers salt, water, and a {adj} word of protection from whatever faith {they} carry.',
        onSuccess: {
          narrative: 'The materials are simple and the faith is sincere. {actor} is ready to lay a {adj} blessing on the road ahead.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The faith falters before it reaches {actor}\'s hands. Doubt is the {adj} enemy of all blessing.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'bless_road.walk',
        name: 'Walk the Boundary',
        reach: 'veil',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: '{actor} walks the road\'s edge, scattering salt at crossroads, touching each boundary stone. The {adj} words come unbidden.',
        onSuccess: {
          narrative: 'The road feels different underfoot — lighter, {adj}, as if the earth itself relaxes beneath the blessing\'s weight.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The road absorbs the effort without change. {actor} cannot tell if the blessing took or merely {adj} evaporated.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'bless_road.seal',
        name: 'Seal with Conviction',
        reach: 'star',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'The final word is the hardest. It must carry enough {adj} conviction to last until the next traveler passes.',
        onSuccess: {
          narrative: 'Done. The road carries a blessing that travelers will feel without knowing — a {adj} lightness in their step, a lucky turn in the weather.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
            tagFilters: ['#divine'],
          },
        },
        onFailure: {
          narrative: 'The blessing is thin and {adj}. It will fade before the next rain. But for one day, the road was safer.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#divine'],
          },
        },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  //  STONE EASY & LOCATION-SPECIFIC (was: only 1 easy — temple_expansion)
  // ═══════════════════════════════════════════════════════════════════

  {
    id: 'encounter.patch_the_walls',
    name: 'Patch the Walls',
    locationTypes: ['castle', 'fort', 'tower', 'ruined_tower'],
    reachPrimary: 'stone',
    reachSecondary: 'iron',
    encounterType: 'build',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ['tradition_progress', 'courage_prudence'],
    steps: [
      {
        id: 'patch_walls.assess',
        name: 'Survey the Damage',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} runs a hand along the {adj} stonework, testing mortar joints with a thumbnail. Every fortress tells its age in cracks.',
        onSuccess: {
          narrative: 'The weak points are catalogued — here, where frost has pried; there, where a siege engine left its {adj} mark.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} misses the deeper cracks, the ones hidden behind moss and {adj} neglect.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'patch_walls.repair',
        name: 'Mix and Lay',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 3,
        narrative: 'Mortar, water, aggregate, patience. {actor} works with {adj} hands, pressing new life into old stone.',
        onSuccess: {
          narrative: 'The patch holds. Not elegant, but {adj} sound — the wall is whole again where it was failing.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The mortar cures wrong — too wet, too fast. {actor}\'s {adj} patch will need patching.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'patch_walls.reinforce',
        name: 'Brace the Foundation',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 3,
        narrative: 'The surface is repaired. But the foundation beneath the {adj} crack — that determines whether the wall stands through winter.',
        onSuccess: {
          narrative: '{actor} braces the foundation with cairn-stone and iron pins. This wall will stand another generation at {adj} least.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The foundation shifts under the repair. {actor}\'s work is {adj} adequate above ground but uncertain below.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.dig_a_well',
    name: 'Dig a Well',
    locationTypes: ['hamlet', 'farmland', 'camp', 'oasis'],
    reachPrimary: 'stone',
    reachSecondary: 'eye',
    encounterType: 'build',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ['justice_mercy', 'tradition_progress'],
    steps: [
      {
        id: 'dig_well.divine_water',
        name: 'Find the Water',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: 'Water is down there. The question is where, and how deep. {actor} reads the {adj} land — the way grass grows greener in one line, the way mud persists after rain.',
        onSuccess: {
          narrative: '{actor} drives a stake into the spot. Mud. Good {adj} mud. The water is close.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'Dry earth, then more dry earth. {actor} chose the {adj} wrong spot.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'dig_well.dig',
        name: 'Break the Ground',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 3,
        narrative: 'Spade, bucket, aching shoulders. {actor} digs with {adj} determination, one load at a time, deeper and deeper.',
        onSuccess: {
          narrative: 'Water seeps into the hole — clear, cold, {adj}. {actor} cups a palmful and drinks. The well is true.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The walls of the hole collapse inward. {actor} climbs out, covered in {adj} clay, and considers a different site.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'dig_well.line',
        name: 'Line and Cap',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 3,
        narrative: 'A hole is not a well. {actor} lines the shaft with {adj} stones, builds a rim, mounts a windlass. Craft transforms a pit into infrastructure.',
        onSuccess: {
          narrative: 'The well is finished. Clean water, close to where people live. {actor} leaves behind something that will {adj} outlast them.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The lining shifts. The well works, but it {adj} leaks — usable, not permanent. Someone else will have to finish it.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.clear_the_rubble',
    name: 'Clear the Rubble',
    locationTypes: ['ruins', 'ruined_village', 'ruined_city', 'ruined_tower', 'battleground'],
    reachPrimary: 'stone',
    reachSecondary: 'iron',
    encounterType: 'build',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['tradition_progress', 'courage_prudence'],
    steps: [
      {
        id: 'clear_rubble.sort',
        name: 'Sort What Can Be Saved',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} picks through the {adj} wreckage with care — good stone here, rotten timber there, a hinge that still works.',
        onSuccess: {
          narrative: 'A tidy pile of salvage grows. {actor} finds enough {adj} sound material to make the clearing worthwhile.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'Everything is cracked, warped, or {adj} ruined beyond saving. The rubble gives nothing back.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'clear_rubble.haul',
        name: 'Haul and Stack',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'The heavy work. {actor} lifts, drags, and stacks with {adj} endurance, turning chaos into cleared ground.',
        onSuccess: {
          narrative: 'The site is clear. For the first time in years, the ground beneath the {adj} ruin sees daylight. Something could be built here.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s strength gives out before the job is done. Half-cleared {adj} rubble is worse than untouched rubble.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'clear_rubble.discover',
        name: 'What Lies Beneath',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 2,
        narrative: 'Beneath the rubble, the {adj} original foundation appears — and sometimes, things that were buried with intent.',
        onSuccess: {
          narrative: '{actor} uncovers the foundation line, intact and {adj} true. And something else: a sealed compartment, still whole.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.6, condition: 0.4 },
            tagFilters: ['#ancient'],
          },
        },
        onFailure: {
          narrative: 'The foundation is too {adj} damaged to tell much. The rubble hid nothing but more rubble.',
          reputationDelta: -0.08,
        },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  //  IRON TRIVIALS — LOCATION-FLAVORED (was: only generic sharpen_blades)
  // ═══════════════════════════════════════════════════════════════════

  {
    id: 'encounter.drill_the_watch',
    name: 'Drill the Watch',
    locationTypes: ['castle', 'fort', 'camp', 'town'],
    reachPrimary: 'iron',
    reachSecondary: 'heart',
    encounterType: 'lead',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['courage_prudence', 'loyalty_ambition'],
    steps: [
      {
        id: 'drill_watch.assemble',
        name: 'Call the Muster',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} rings the bell and watches who comes running and who comes {adj} slowly. Discipline starts with the muster.',
        onSuccess: {
          narrative: 'Full turnout. The watch assembles with {adj} speed — not perfect, but present and willing.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'Half the watch is late. Two are drunk. {actor}\'s {adj} authority is not yet earned.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'drill_watch.run',
        name: 'Run the Drill',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'Posts, rotations, challenge-and-response. {actor} drills the {adj} basics until they become reflex.',
        onSuccess: {
          narrative: 'By the third repetition, the watch moves without thinking. {actor} nods with {adj} satisfaction — this will hold through the night.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'Confusion at the third post. The rotation collapses into {adj} argument. {actor} will need to try again tomorrow.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'drill_watch.test',
        name: 'Test with a Surprise',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: '{actor} stages a {adj} test — a simulated alarm, a false intruder — to see if the drill holds under pressure.',
        onSuccess: {
          narrative: 'The watch responds. Not perfectly, but the {adj} drill holds. When the real thing comes, they will be ready enough.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'Panic. The watch scatters. {actor} calls a halt and starts from {adj} scratch. Building warriors takes time.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.spar_with_a_stranger',
    name: 'Spar with a Stranger',
    locationTypes: ['town', 'city', 'camp', 'fort'],
    reachPrimary: 'iron',
    reachSecondary: 'eye',
    encounterType: 'duel',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['courage_prudence', 'loyalty_ambition'],
    steps: [
      {
        id: 'spar_stranger.size_up',
        name: 'Size Up the Opponent',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: 'A stranger in the yard. Good stance. Calm eyes. {actor} watches {them} move and reads the {adj} story their body tells.',
        onSuccess: {
          narrative: 'Left-handed, favors the riposte, drops the shoulder before striking. {actor} has the {adj} measure of them.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} misjudges the stranger\'s reach. The first exchange will be {adj} educational.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'spar_stranger.cross',
        name: 'Cross Blades',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'The first touch. Blunt steel rings in the {adj} morning air. {actor} tests, feints, and learns.',
        onSuccess: {
          narrative: 'Three exchanges, and {actor} finds the rhythm. The stranger grins — they\'ve found someone {adj} worth the practice.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The stranger is faster than expected. {actor} catches a {adj} bruising hit and adjusts. Learning hurts.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'spar_stranger.respect',
        name: 'Earn the Nod',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'A sparring match ends when someone {verb}s well enough to earn respect. {actor} presses for the {adj} final exchange.',
        onSuccess: {
          narrative: 'The stranger lowers their blade and offers a {adj} nod. No words needed — steel speaks its own language.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#combat'],
          },
        },
        onFailure: {
          narrative: 'The stranger wins the last exchange cleanly. {actor} bows, {adj} and bruised. There is always someone better.',
          reputationDelta: -0.08,
        },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  //  SHADOW TRIVIALS — LOCATION-FLAVORED (was: only pickpocket)
  // ═══════════════════════════════════════════════════════════════════

  {
    id: 'encounter.case_the_joint',
    name: 'Case the Joint',
    locationTypes: ['city', 'capital', 'town', 'castle'],
    reachPrimary: 'shadow',
    reachSecondary: 'eye',
    encounterType: 'explore',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['revelation_discretion', 'loyalty_ambition'],
    steps: [
      {
        id: 'case_joint.observe',
        name: 'Watch and Count',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} finds a shadow with a view and settles in. How many guards. What hours. Which door doesn\'t quite {adj} close.',
        onSuccess: {
          narrative: 'The pattern emerges: shift changes, blind spots, the {adj} servant who props the kitchen door open for a smoke.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} watches, but the picture stays {adj} incomplete. Too many variables, not enough patience.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'case_joint.map',
        name: 'Map the Approaches',
        reach: 'shadow',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'Knowing the layout is not enough. {actor} walks the approaches — alleys, rooftops, drainage — with {adj} professional interest.',
        onSuccess: {
          narrative: 'Three ways in, two ways out, one that nobody would think to watch. {actor} commits the {adj} map to memory.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'A watchman spots {actor} loitering. Time to leave and try from a {adj} different angle tomorrow.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'case_joint.assess',
        name: 'Judge the Risk',
        reach: 'shadow',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'Every job has a price in risk. {actor} weighs the {adj} odds: what\'s inside versus what it costs to get caught.',
        onSuccess: {
          narrative: '{actor} knows the place like they built it. The {adj} risk is calculated, the reward assessed. Decision time.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#shadow'],
          },
        },
        onFailure: {
          narrative: 'The risk is unclear. {actor} can\'t tell if the {adj} prize is worth the price. Uncertainty kills more thieves than guards.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.dead_drop',
    name: 'Service a Dead Drop',
    locationTypes: ['town', 'city', 'capital', 'camp'],
    reachPrimary: 'shadow',
    reachSecondary: 'heart',
    encounterType: 'trade',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['revelation_discretion', 'loyalty_ambition'],
    steps: [
      {
        id: 'dead_drop.approach',
        name: 'Walk the Route',
        reach: 'shadow',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} takes the long way. Double back at the fountain, pause at the baker\'s stall, check the {adj} reflection in a puddle. Clean approach.',
        onSuccess: {
          narrative: 'No tail. No watching eyes. {actor} reaches the drop site with {adj} confidence.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'A face appears twice in the crowd. Coincidence? {actor} aborts and walks {adj} away.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'dead_drop.exchange',
        name: 'Make the Exchange',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 1,
        narrative: 'The loose brick. The hollow tree. The gap beneath the third step. {actor}\'s hands work with {adj} practiced speed.',
        onSuccess: {
          narrative: 'Message left, message taken. {actor} walks away with something small and {adj} valuable — information, always information.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The drop is empty — already serviced, or the signal was wrong. {actor} leaves with {adj} nothing.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'dead_drop.vanish',
        name: 'Vanish into the Crowd',
        reach: 'shadow',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'The art is not in arriving or exchanging. The art is in {adj} disappearing afterward, as if you were never there.',
        onSuccess: {
          narrative: '{actor} melts into the crowd and becomes nobody. The {adj} drop is complete. Nobody knows.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#shadow'],
          },
        },
        onFailure: {
          narrative: 'Someone noticed. Nothing actionable, but a {adj} seed of suspicion planted. Sloppy.',
          reputationDelta: -0.08,
        },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  //  LOCATION-GAP FILLS (castle, fort, mining, tower, wilderness)
  // ═══════════════════════════════════════════════════════════════════

  {
    id: 'encounter.inspect_the_armoury',
    name: 'Inspect the Armoury',
    locationTypes: ['castle', 'fort'],
    reachPrimary: 'iron',
    reachSecondary: 'gold',
    encounterType: 'explore',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ['courage_prudence', 'tradition_progress'],
    steps: [
      {
        id: 'inspect_armoury.count',
        name: 'Count the Stock',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} walks the racks — swords, spears, shields, bows. How many fit for use. How many rusted past {adj} saving.',
        onSuccess: {
          narrative: 'The inventory is precise: forty-three serviceable blades, eleven shields, and a crossbow that needs {adj} restringing. Enough.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The count is interrupted. {actor} estimates — probably enough, probably — but {adj} estimates lose wars.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'inspect_armoury.test',
        name: 'Test the Quality',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: '{actor} draws a blade at random and tests the edge, the balance, the {adj} temper. The armoury tells the truth about a garrison.',
        onSuccess: {
          narrative: 'Good steel, properly oiled. Whoever runs this armoury takes {adj} pride in their work. The garrison can fight.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'Pitted blades, warped shields. The armoury is a {adj} disgrace. Someone hasn\'t been doing their job.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'inspect_armoury.report',
        name: 'File the Report',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'An inspection without a report is a {adj} walk through a weapons shed. {actor} commits the findings to record.',
        onSuccess: {
          narrative: 'The report is {adj} thorough and actionable: what to repair, what to replace, what to requisition. The garrison commander will know.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
            tagFilters: ['#combat'],
          },
        },
        onFailure: {
          narrative: 'The report is {adj} incomplete. Key details are missing — which rack, which smithy, which budget line. Not useful enough.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#combat'],
          },
        },
      },
    ],
  },
  {
    id: 'encounter.shore_up_the_mine',
    name: 'Shore Up the Mine',
    locationTypes: ['mining'],
    reachPrimary: 'stone',
    reachSecondary: 'eye',
    encounterType: 'build',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ['tradition_progress', 'courage_prudence'],
    steps: [
      {
        id: 'shore_mine.inspect',
        name: 'Inspect the Timbers',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} taps the support beams, listening. Good wood {verb}s differently from rot. The {adj} mine whispers its warnings.',
        onSuccess: {
          narrative: 'Three beams need replacing. One is critical. {actor} marks them with {adj} chalk and moves deeper.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s ear isn\'t tuned to timber. The mine keeps its {adj} secrets.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'shore_mine.brace',
        name: 'Cut and Brace',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 3,
        narrative: 'New timber against old stone. {actor} cuts, fits, and hammers with {adj} urgency — the ceiling groans.',
        onSuccess: {
          narrative: 'The new brace takes the weight. The groaning stops. {actor} wipes dust from {their} face and moves to the next beam.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The fit is wrong — too short, too green. {actor} braces it anyway and hopes the {adj} timber holds through winter.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'shore_mine.test',
        name: 'Test the Load',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 2,
        narrative: 'The real test: driving a cart through the shored section. If the {adj} timbers hold under load, the mine stays open.',
        onSuccess: {
          narrative: 'The cart passes. The timbers hold. The mine earns another season of life, and {actor} earns {adj} respect from miners.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'A timber cracks under load. Not catastrophic, but the {adj} section is restricted. More work tomorrow.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.map_the_passages',
    name: 'Map the Passages',
    locationTypes: ['ruins', 'ruined_tower', 'ruined_city', 'mining'],
    reachPrimary: 'eye',
    reachSecondary: 'stone',
    encounterType: 'explore',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['revelation_discretion', 'tradition_progress'],
    steps: [
      {
        id: 'map_passages.enter',
        name: 'Mark the Entrance',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} scratches a chalk mark at the entrance and begins. Left hand on the wall, {adj} counting paces.',
        onSuccess: {
          narrative: 'The first junction is mapped — three passages, two blind ends, one that {adj} descends. A good start.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} loses the count at the second turning. Chalk marks on {adj} damp stone smear and fade.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'map_passages.chart',
        name: 'Chart the Depths',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'Deeper now. {actor} reads the {adj} rock strata, the air currents, the way water runs. The underground has its own geography.',
        onSuccess: {
          narrative: 'A rough but {adj} accurate map takes shape — distances, elevations, and the all-important way out.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The passages loop. {actor}\'s map contradicts itself. The {adj} underground is more complex than expected.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'map_passages.complete',
        name: 'Complete the Survey',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 2,
        narrative: 'The final passages. {actor} pushes past fatigue to {adj} complete the chart — every dead end, every promising opening.',
        onSuccess: {
          narrative: 'The map is done. Not beautiful, but {adj} reliable. Anyone following this chart will find their way in and — more importantly — out.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#ancient'],
          },
        },
        onFailure: {
          narrative: 'Exhaustion wins. {actor} maps the {adj} upper levels but leaves the deepest passages as blank white space.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.catalogue_the_tower',
    name: 'Catalogue the Tower Library',
    locationTypes: ['tower'],
    reachPrimary: 'eye',
    reachSecondary: 'veil',
    encounterType: 'explore',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ['revelation_discretion', 'tradition_progress'],
    steps: [
      {
        id: 'catalogue_tower.inventory',
        name: 'Take Inventory',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: 'Dust, cobwebs, and the {adj} smell of old vellum. {actor} begins at the bottom shelf and works upward, counting spines.',
        onSuccess: {
          narrative: 'Two hundred and thirty texts, fourteen scrolls, and three {adj} sealed cases. {actor} has the scope of it.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The shelving system is {adj} chaotic. {actor} counts the same section twice and misses another entirely.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'catalogue_tower.classify',
        name: 'Classify the Contents',
        reach: 'veil',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 3,
        narrative: 'Not all texts are mundane. {actor} feels for the {adj} ones that hum — the ones with power woven into the binding.',
        onSuccess: {
          narrative: 'Seven are enchanted. Three are warded. One is warm to the touch. {actor} handles each with {adj} appropriate respect.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} cannot distinguish the {adj} mundane from the magical. The tower keeps its library\'s true value hidden.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'catalogue_tower.record',
        name: 'Record the Finds',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 2,
        narrative: 'A catalogue is only as good as its accuracy. {actor} records title, condition, subject, and {adj} magical signature for each text.',
        onSuccess: {
          narrative: 'The catalogue is {adj} complete. Future scholars will owe {actor} a debt they\'ll never know about.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
            tagFilters: ['#knowledge'],
          },
        },
        onFailure: {
          narrative: 'The catalogue is {adj} partial. Good enough to avoid duplicating effort, not good enough to find anything specific.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#knowledge'],
          },
        },
      },
    ],
  },
  {
    id: 'encounter.gather_firewood',
    name: 'Gather Firewood',
    locationTypes: ['wilderness', 'camp', 'farmland', 'ruins'],
    reachPrimary: 'eye',
    reachSecondary: 'stone',
    encounterType: 'acquire',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['tradition_progress', 'justice_mercy'],
    steps: [
      {
        id: 'gather_wood.find',
        name: 'Find the Good Wood',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: 'Not all wood burns clean. {actor} hunts for the {adj} dry stuff — standing deadwood, storm-fallen oak, anything with seasons of drying behind it.',
        onSuccess: {
          narrative: '{actor} finds a {adj} windfall — a dead oak, bark-stripped and bone-dry. Enough to burn hot for days.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'Green wood, wet wood, {adj} punky wood. {actor} collects what there is, knowing it\'ll smoke more than burn.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'gather_wood.carry',
        name: 'Bundle and Carry',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'Finding wood is easy. Carrying enough back is the {adj} work. {actor} bundles, ties, and shoulders the load.',
        onSuccess: {
          narrative: 'A full bundle, well-tied and {adj} balanced. The camp will eat warm tonight because {actor} did the carrying.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The bundle splits halfway back. {actor} arrives with half a load and {adj} aching shoulders.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'gather_wood.stack',
        name: 'Stack for the Season',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'A proper woodstack is engineering. Air flow, rain cover, {adj} seasoning order. {actor} stacks with care.',
        onSuccess: {
          narrative: 'The stack is tight, covered, and {adj} organized. Months of warmth, secured against weather and theft.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#survival'],
          },
        },
        onFailure: {
          narrative: 'The stack collapses twice. {actor} piles it {adj} roughly and hopes rain holds off.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.prospect_the_seam',
    name: 'Prospect the Seam',
    locationTypes: ['mining', 'wilderness', 'ruins'],
    reachPrimary: 'gold',
    reachSecondary: 'stone',
    encounterType: 'explore',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ['revelation_discretion', 'asceticism_extravagance'],
    steps: [
      {
        id: 'prospect_seam.sample',
        name: 'Take Samples',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} chips at the rock face with a {adj} geologist\'s hammer, examining the grain, the colour, the way the stone fractures.',
        onSuccess: {
          narrative: 'Promising. The {adj} vein structure runs deep and the mineral content is right. Worth digging further.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'Surface ore only. The {adj} seam pinches out a handspan beneath the face. Not worth a mine.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'prospect_seam.estimate',
        name: 'Estimate the Yield',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: '{actor} calculates: depth of seam, richness of ore, cost of extraction. The {adj} mathematics of whether it pays to dig.',
        onSuccess: {
          narrative: 'The numbers work. The seam could yield enough to justify the dig, the labour, the {adj} risk. It\'s a real find.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'Too thin, too deep, too much overburden. The {adj} economics don\'t support a mine here.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'prospect_seam.stake',
        name: 'Stake the Claim',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 2,
        narrative: 'A find is only a find if you hold it. {actor} marks the claim with {adj} cairns and cuts the trees to the boundary.',
        onSuccess: {
          narrative: 'The claim is staked, recorded, and {adj} defensible. {actor} owns a piece of the mountain now.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
            tagFilters: ['#stone'],
          },
        },
        onFailure: {
          narrative: 'A rival stake is already planted. {actor} arrived {adj} second. The seam belongs to someone else.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.wildcraft_shelter',
    name: 'Build a Wildcraft Shelter',
    locationTypes: ['wilderness', 'unexplored_poi', 'battleground'],
    reachPrimary: 'stone',
    reachSecondary: 'eye',
    encounterType: 'build',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['tradition_progress', 'courage_prudence'],
    steps: [
      {
        id: 'wildcraft_shelter.site',
        name: 'Choose the Site',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: 'Not too close to water, not too exposed to wind, not beneath anything that might fall. {actor} reads the {adj} terrain with a survivor\'s eye.',
        onSuccess: {
          narrative: 'Good ground: dry, sheltered from the prevailing wind, with a {adj} natural windbreak on two sides.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} picks a spot that looks right but drains poorly. Tomorrow\'s rain will {adj} prove the error.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'wildcraft_shelter.build',
        name: 'Raise the Shelter',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'Branches, bracken, bark. {actor} builds with what the {adj} land offers — no nails, no rope, just knowledge and effort.',
        onSuccess: {
          narrative: 'The shelter stands: snug, {adj}, and dry enough. Not comfortable, but alive. {actor} crawls inside with earned satisfaction.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The frame collapses when {actor} adds the roof layer. Back to {adj} basics.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'wildcraft_shelter.improve',
        name: 'Weatherproof',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 2,
        narrative: 'The difference between surviving the night and surviving the week is {adj} weatherproofing. {actor} layers, seals, and banks.',
        onSuccess: {
          narrative: 'Rain drums on the roof. Inside stays dry. {actor} watches the weather from {adj} comfort and allows a rare smile.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'Leaks in three places. {actor} spends the night repositioning pots and {adj} cursing the wind.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.negotiate_passage',
    name: 'Negotiate Safe Passage',
    locationTypes: ['wilderness', 'camp', 'fort', 'hamlet'],
    reachPrimary: 'heart',
    reachSecondary: 'gold',
    encounterType: 'trade',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ['justice_mercy', 'loyalty_ambition'],
    steps: [
      {
        id: 'negotiate_passage.approach',
        name: 'Make the Approach',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: 'Empty hands held high. {actor} approaches the {adj} checkpoint and asks to pass. The answer depends on who\'s asking.',
        onSuccess: {
          narrative: '{actor}\'s bearing says \'traveler, not threat.\' The guards lower their spears by a {adj} fraction.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'Suspicion. The guards don\'t lower anything. {actor}\'s approach reads as {adj} wrong.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'negotiate_passage.terms',
        name: 'Agree the Terms',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 1,
        narrative: 'Safe passage has a price. {actor} negotiates: a toll, a favour, a piece of information. The {adj} currency of the road.',
        onSuccess: {
          narrative: 'A price is named and paid. {actor} passes through with a {adj} nod — commerce, not conflict.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The price is too high. {actor} cannot or will not pay what\'s asked. The {adj} road remains closed.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'negotiate_passage.honour',
        name: 'Honour the Agreement',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'The deal is only as {adj} good as the honour behind it. {actor} keeps to the agreed terms, even when the other side watches for betrayal.',
        onSuccess: {
          narrative: 'Clean passage. {actor} crosses without incident and leaves behind a {adj} reputation for keeping their word.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
            tagFilters: ['#gold'],
          },
        },
        onFailure: {
          narrative: 'Something sours. The passage is grudging, the terms strained. {actor} crosses but leaves no {adj} goodwill behind.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#gold'],
          },
        },
      },
    ],
  },
  {
    id: 'encounter.garrison_gossip',
    name: 'Garrison Gossip',
    locationTypes: ['castle', 'fort', 'tower'],
    reachPrimary: 'heart',
    reachSecondary: 'shadow',
    encounterType: 'explore',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['revelation_discretion', 'loyalty_ambition'],
    steps: [
      {
        id: 'garrison_gossip.listen',
        name: 'Sit and Listen',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: 'The mess hall after dark. {actor} nurses a cup and listens to the {adj} soldiers talk — complaints, boasts, rumours.',
        onSuccess: {
          narrative: 'Between the grumbling and the lies, {actor} hears the {adj} truth: who commands respect, who commands fear, and what keeps the garrison awake.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The soldiers clam up when {actor} sits down. Outsider. {adj} Trust takes longer than one night.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'garrison_gossip.steer',
        name: 'Steer the Conversation',
        reach: 'shadow',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 1,
        narrative: 'A casual question, a {adj} sympathetic nod. {actor} nudges the talk toward what {they} actually want to know.',
        onSuccess: {
          narrative: 'Without realising it, the soldiers tell {actor} exactly what {they} need: troop strength, supply levels, the {adj} commander\'s weaknesses.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'Too obvious. Someone changes the subject. {actor} drinks {their} cup and {adj} lets the silence stretch.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'garrison_gossip.file',
        name: 'File It Away',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'Information is only as {adj} useful as the mind that holds it. {actor} organises what was overheard into patterns.',
        onSuccess: {
          narrative: '{actor} leaves the mess hall knowing more about this garrison than most of its {adj} officers. Knowledge is leverage.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#heart'],
          },
        },
        onFailure: {
          narrative: 'Too much noise, not enough signal. {actor} has {adj} gossip, not intelligence. There\'s a difference.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.mend_fishing_nets',
    name: 'Mend the Fishing Nets',
    locationTypes: ['hamlet', 'oasis', 'camp'],
    reachPrimary: 'gold',
    reachSecondary: 'heart',
    encounterType: 'assist',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['justice_mercy', 'tradition_progress'],
    steps: [
      {
        id: 'mend_nets.inspect',
        name: 'Find the Tears',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} spreads the nets across the {adj} ground and runs fingers along the mesh, feeling for gaps, for weakness, for the places where the catch escapes.',
        onSuccess: {
          narrative: 'Seven tears, two worn sections, and a knot that was never {adj} properly tied. {actor} has the full picture.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} misses the subtler damage — the {adj} stretched mesh that will split under the first heavy catch.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'mend_nets.repair',
        name: 'Tie the Knots',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'Net-mending is rhythmic, {adj} patient work. {actor}\'s fingers learn the pattern: loop, pull, tighten. Repeat.',
        onSuccess: {
          narrative: 'The nets are whole again. The fisher at the dock nods {adj} thanks — no words needed between people who understand useful work.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s knots are clumsy — too loose, or the wrong {adj} gauge. Serviceable, but a real net-mender would wince.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'mend_nets.deliver',
        name: 'Return to the Dock',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'Good work deserves {adj} fair payment. {actor} returns the mended nets and settles the account.',
        onSuccess: {
          narrative: 'A meal, a bed, and the {adj} quiet satisfaction of being useful. Sometimes that\'s enough.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#gold'],
          },
        },
        onFailure: {
          narrative: 'The fisher finds a flaw {actor} missed. Payment is {adj} docked. Fair enough.',
          reputationDelta: -0.08,
        },
      },
    ],
  },

  // ─── Borderland Encounters (easy/trivial combat for frontier agents) ───
  ...BORDERLAND_ENCOUNTER_TEMPLATES,

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

/** All templates including anomaly encounters — used by lookup functions. */
const ALL_ENCOUNTER_TEMPLATES: EncounterTemplate[] = [
  ...ENCOUNTER_TEMPLATES,
  ...ANOMALY_ENCOUNTER_TEMPLATES,
];

/**
 * Return all encounters available at a given location type.
 */
export function getEncountersByLocationType(locationType: string): EncounterTemplate[] {
  return ALL_ENCOUNTER_TEMPLATES.filter(encounter =>
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
  return ALL_ENCOUNTER_TEMPLATES.filter(t => {
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
    ?? ANOMALY_ENCOUNTER_TEMPLATES.find(encounter => encounter.id === id)
    ?? getSocialEncounterById(id)
    ?? getFactionEncounterById(id)
    ?? getMercenaryEncounterById(id)
    ?? getArmyEncounterById(id)
    ?? getMonsterEncounterById(id)
    ?? getBorderlandEncounterById(id);
}
