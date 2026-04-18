/**
 * Tavern Encounter Content — 10 tavern-exclusive encounter templates.
 *
 * These templates only fire when the acting agent is at a tavern sublocation
 * (sublocationTypes: ['sublocation-type.tavern']). They model the distinct
 * social dynamics of a gathering place: brawls, rumors, drinking contests,
 * bardic performances, and back-room deals.
 *
 * ═══════════════════════════════════════════════════════════════════
 * CONTENT MANAGER: Edit this file to change tavern encounter templates,
 * step sequences, difficulty curves, and narrative prose.
 * ═══════════════════════════════════════════════════════════════════
 */

import type { EncounterTemplate } from '../types/encounter';
import { ENCOUNTER_TYPE_MOTIVATIONS } from '../types/encounter';

// ─── Tavern Sublocation Filter ────────────────────────────────

const TAVERN_SUBLOCATION = ['sublocation-type.tavern'];

// ─── Settlement Location Types ────────────────────────────────

const SETTLEMENT_LOCATIONS = ['hamlet', 'town', 'city', 'capital'] as const;

// ─── Difficulty Constants ─────────────────────────────────────

const D_EASY = 30;
const D_MOD = 45;
const D_HARD = 60;

// ─── 10 Tavern Encounter Templates ───────────────────────────

export const TAVERN_ENCOUNTER_TEMPLATES: EncounterTemplate[] = [
  // 1. Tavern Brawl
  {
    id: 'tavern.brawl',
    name: 'Tavern Brawl',
    locationTypes: [...SETTLEMENT_LOCATIONS],
    sublocationTypes: TAVERN_SUBLOCATION,
    reachPrimary: 'iron',
    reachSecondary: 'flesh',
    encounterType: 'duel',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        id: 'brawl.provocation',
        name: 'The Provocation',
        reach: 'iron',
        difficulty: D_EASY,
        duration: 1,
        narrative: 'A drunk {actor} catches a shoulder — then a sneer. The common room goes quiet.',
        onSuccess: {
          narrative: '{actor} plants a fist before the other can act. The crowd parts.',
          reputationDelta: 0.03,
        },
        onFailure: {
          narrative: 'The first blow lands on {actor}. Ale and blood hit the floorboards.',
          reputationDelta: -0.02,
          appliesWound: true,
        },
      },
      {
        id: 'brawl.standing',
        name: 'Last One Standing',
        reach: 'flesh',
        difficulty: D_MOD,
        duration: 1,
        narrative: '{actor} presses the advantage, bodies crashing into tables.',
        onSuccess: {
          narrative: 'The brawl ends with {actor} {adj} upright, breathing hard. The crowd roars.',
          reputationDelta: 0.06,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.30, condition: 0.40, mastery: 0.30 },
            tagFilters: ['#iron', '#flesh'],
          },
        },
        onFailure: {
          narrative: '{actor} goes down under a rain of blows. A barmaid drags them outside.',
          reputationDelta: -0.04,
          appliesWound: true,
          rewardPool: {
            categoryWeights: { condition: 0.90, possession: 0.10 },
            tagFilters: ['#iron'],
          },
        },
      },
    ],
  },

  // 2. Overheard Rumor
  {
    id: 'tavern.overheard_rumor',
    name: 'Overheard Rumor',
    locationTypes: [...SETTLEMENT_LOCATIONS],
    sublocationTypes: TAVERN_SUBLOCATION,
    reachPrimary: 'eye',
    reachSecondary: 'shadow',
    encounterType: 'explore',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    steps: [
      {
        id: 'rumor.listen',
        name: 'Ears Open',
        reach: 'eye',
        difficulty: D_EASY,
        duration: 1,
        narrative: '{actor} nurses a drink, listening to the loose talk around them.',
        onSuccess: {
          narrative: 'A {adj} scrap of intelligence surfaces — names, routes, or a hidden cache.',
          reputationDelta: 0.02,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.50, bestowed_power: 0.30, condition: 0.20 },
            tagFilters: ['#eye', '#shadow'],
          },
        },
        onFailure: {
          narrative: 'The drunk next to {actor} rambles about nothing. An evening wasted.',
          reputationDelta: 0,
        },
      },
    ],
  },

  // 3. Drinking Contest
  {
    id: 'tavern.drinking_contest',
    name: 'Drinking Contest',
    locationTypes: [...SETTLEMENT_LOCATIONS],
    sublocationTypes: TAVERN_SUBLOCATION,
    reachPrimary: 'flesh',
    reachSecondary: 'heart',
    encounterType: 'duel',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        id: 'drinking.opening_round',
        name: 'Opening Round',
        reach: 'flesh',
        difficulty: D_EASY,
        duration: 1,
        narrative: 'Cups slam down. {actor} meets the challenge with {adj} confidence.',
        onSuccess: {
          narrative: 'The first round goes to {actor}. The crowd cheers.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: '{actor} already feels the room tilt.',
          reputationDelta: 0,
        },
      },
      {
        id: 'drinking.last_drop',
        name: 'The Last Drop',
        reach: 'flesh',
        difficulty: D_MOD,
        duration: 1,
        narrative: 'The final round. Every eye in the tavern is on {actor}.',
        onSuccess: {
          narrative: '{actor} slams down the empty cup. The cheering shakes the rafters.',
          reputationDelta: 0.06,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.60, condition: 0.20, mastery: 0.20 },
            tagFilters: ['#flesh', '#heart'],
          },
        },
        onFailure: {
          narrative: '{actor} slides off the stool. Someone carries them to a corner.',
          reputationDelta: -0.03,
          appliesWound: true,
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#flesh'],
          },
        },
      },
    ],
  },

  // 4. Bardic Performance
  {
    id: 'tavern.bardic_performance',
    name: 'Bardic Performance',
    locationTypes: [...SETTLEMENT_LOCATIONS],
    sublocationTypes: TAVERN_SUBLOCATION,
    reachPrimary: 'heart',
    reachSecondary: 'eye',
    encounterType: 'assist',
    threatRating: 'easy',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    favorGeneration: { onSuccess: true, magnitudeRange: [0.1, 0.25], context: 'performed a kindness' },
    steps: [
      {
        id: 'bard.tuning',
        name: 'Tuning Up',
        reach: 'heart',
        difficulty: D_EASY,
        duration: 1,
        narrative: '{actor} takes the corner stool and begins to play. Conversations dim.',
        onSuccess: {
          narrative: 'The first notes settle the room. Faces turn toward {actor}.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'The crowd ignores the opening bars. {actor} plays to an empty wall.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'bard.climax',
        name: 'The Final Verse',
        reach: 'eye',
        difficulty: D_MOD,
        duration: 2,
        narrative: 'The {adj} story reaches its heart — the tale of loss, or courage, or love.',
        onSuccess: {
          narrative: 'The tavern is silent, then erupts. Coins rain down. {actor} has made a friend of this room.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { condition: 0.40, possession: 0.30, bestowed_power: 0.30 },
            tagFilters: ['#heart', '#eye'],
          },
        },
        onFailure: {
          narrative: '{actor} loses the thread. The room drifts back to its own conversations.',
          reputationDelta: -0.02,
        },
      },
    ],
  },

  // 5. Shady Deal
  {
    id: 'tavern.shady_deal',
    name: 'Shady Deal',
    locationTypes: [...SETTLEMENT_LOCATIONS],
    sublocationTypes: TAVERN_SUBLOCATION,
    reachPrimary: 'shadow',
    reachSecondary: 'gold',
    encounterType: 'steal',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
    steps: [
      {
        id: 'shady.contact',
        name: 'Making Contact',
        reach: 'shadow',
        difficulty: D_EASY,
        duration: 1,
        narrative: '{actor} slides into the booth. Across the table: a hooded stranger with {adj} eyes.',
        onSuccess: {
          narrative: 'The contact relaxes. The meeting is on.',
          reputationDelta: 0.01,
        },
        onFailure: {
          narrative: 'The contact spots something wrong. They leave without a word.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'shady.exchange',
        name: 'The Exchange',
        reach: 'shadow',
        difficulty: D_MOD,
        duration: 1,
        narrative: 'Under the table: a package changes hands. Eyes scan the room.',
        onSuccess: {
          narrative: 'The transaction is clean. {actor} leaves with the {adj} parcel and a lighter conscience.',
          reputationDelta: 0.05,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.60, bestowed_power: 0.20, condition: 0.20 },
            tagFilters: ['#shadow', '#gold'],
          },
        },
        onFailure: {
          narrative: 'The deal goes sour — the contact takes the coin and vanishes. {actor} has been played.',
          reputationDelta: -0.04,
          rewardPool: {
            categoryWeights: { condition: 0.70, possession: 0.30 },
            tagFilters: ['#shadow'],
          },
        },
      },
      {
        id: 'shady.clean_exit',
        name: 'Clean Exit',
        reach: 'gold',
        difficulty: D_EASY,
        duration: 1,
        narrative: '{actor} needs to leave before anyone notices the exchange.',
        onSuccess: {
          narrative: '{actor} drifts out through the crowd, unseen and unquestioned.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'A guard at the door gives {actor} a long, hard look. They remember that face.',
          reputationDelta: -0.03,
        },
      },
    ],
  },

  // 6. Recruiting Drive
  {
    id: 'tavern.recruiting_drive',
    name: 'Recruiting Drive',
    locationTypes: [...SETTLEMENT_LOCATIONS],
    sublocationTypes: TAVERN_SUBLOCATION,
    reachPrimary: 'heart',
    reachSecondary: 'gold',
    encounterType: 'hire',
    threatRating: 'easy',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.hire,
    steps: [
      {
        id: 'recruit.pitch',
        name: 'The Pitch',
        reach: 'heart',
        difficulty: D_EASY,
        duration: 1,
        narrative: '{actor} buys a round and starts talking. Purpose, coin, glory — pick your bait.',
        onSuccess: {
          narrative: 'Heads nod. Cups are raised. {actor} has an audience.',
          reputationDelta: 0.03,
        },
        onFailure: {
          narrative: 'The offer lands flat. The drinkers go back to their conversations.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'recruit.seal',
        name: 'Sealing the Compact',
        reach: 'gold',
        difficulty: D_MOD,
        duration: 2,
        narrative: 'One {adj} face hasn\'t looked away. {actor} names the terms.',
        onSuccess: {
          narrative: 'Hands are shaken. A new companion joins {actor}\'s cause.',
          reputationDelta: 0.06,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.40, bestowed_power: 0.40, condition: 0.20 },
            tagFilters: ['#heart', '#gold'],
          },
        },
        onFailure: {
          narrative: 'Too little coin, or too much danger. The prospect walks.',
          reputationDelta: -0.02,
        },
      },
    ],
  },

  // 7. The Challenge
  {
    id: 'tavern.the_challenge',
    name: 'The Challenge',
    locationTypes: [...SETTLEMENT_LOCATIONS],
    sublocationTypes: TAVERN_SUBLOCATION,
    reachPrimary: 'iron',
    reachSecondary: 'shadow',
    encounterType: 'duel',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        id: 'challenge.thrown_gauntlet',
        name: 'Thrown Gauntlet',
        reach: 'shadow',
        difficulty: D_EASY,
        duration: 1,
        narrative: 'A voice cuts across the noise: "I hear you\'re {adj}. Prove it."',
        onSuccess: {
          narrative: '{actor} meets the gaze without blinking. The crowd holds its breath.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: '{actor} hesitates too long. The crowd reads it as doubt.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'challenge.contest',
        name: 'The Contest',
        reach: 'iron',
        difficulty: D_HARD,
        duration: 2,
        narrative: 'Steel is drawn for a testing match — first blood or first yield.',
        onSuccess: {
          narrative: '{actor} wins cleanly. The challenger extends a hand. Reputation travels far.',
          reputationDelta: 0.09,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { mastery: 0.50, possession: 0.30, condition: 0.20 },
            tagFilters: ['#iron'],
          },
        },
        onFailure: {
          narrative: 'The challenger is better. {actor} yields and sheathes their blade.',
          reputationDelta: -0.05,
          appliesWound: true,
          rewardPool: {
            categoryWeights: { condition: 0.60, mastery: 0.40 },
            tagFilters: ['#iron'],
          },
        },
      },
    ],
  },

  // 8. Confession Over Drinks
  {
    id: 'tavern.confession_over_drinks',
    name: 'Confession Over Drinks',
    locationTypes: [...SETTLEMENT_LOCATIONS],
    sublocationTypes: TAVERN_SUBLOCATION,
    reachPrimary: 'heart',
    reachSecondary: 'eye',
    encounterType: 'assist',
    threatRating: 'easy',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    favorGeneration: { onSuccess: true, magnitudeRange: [0.15, 0.30], context: 'listened to their confession' },
    steps: [
      {
        id: 'confession.opening',
        name: 'A Heavy Burden',
        reach: 'heart',
        difficulty: D_EASY,
        duration: 1,
        narrative: 'A stranger at the bar is {adj} with drink and guilt. {actor} slides into the seat beside them.',
        onSuccess: {
          narrative: 'The words come slowly, then all at once. The stranger trusts this face.',
          reputationDelta: 0.03,
        },
        onFailure: {
          narrative: 'The stranger clams up. They didn\'t ask for company.',
          reputationDelta: 0,
        },
      },
      {
        id: 'confession.revelation',
        name: 'What They Carry',
        reach: 'eye',
        difficulty: D_MOD,
        duration: 2,
        narrative: 'The truth spills out — a name, a deed, a secret {actor} was not meant to hear.',
        onSuccess: {
          narrative: '{actor} listens with {adj} attention. The confession ends. The stranger looks lighter.',
          reputationDelta: 0.07,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.50, condition: 0.30, possession: 0.20 },
            tagFilters: ['#heart', '#eye', '#shadow'],
          },
        },
        onFailure: {
          narrative: '{actor} presses too hard. The stranger goes silent and leaves.',
          reputationDelta: -0.02,
        },
      },
    ],
  },

  // 9. Merchant's Pitch
  {
    id: 'tavern.merchants_pitch',
    name: "Merchant's Pitch",
    locationTypes: [...SETTLEMENT_LOCATIONS],
    sublocationTypes: TAVERN_SUBLOCATION,
    reachPrimary: 'gold',
    reachSecondary: 'heart',
    encounterType: 'trade',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    steps: [
      {
        id: 'pitch.display',
        name: 'Spreading the Wares',
        reach: 'gold',
        difficulty: D_EASY,
        duration: 1,
        narrative: 'A merchant unfolds velvet on the bar. Whatever {actor} came here for, this might be better.',
        onSuccess: {
          narrative: 'The wares are genuine and the price is negotiable. A {adj} opportunity.',
          reputationDelta: 0.01,
        },
        onFailure: {
          narrative: 'The merchant\'s prices are insulting or their goods are suspect.',
          reputationDelta: 0,
        },
      },
      {
        id: 'pitch.deal',
        name: 'Closing the Deal',
        reach: 'heart',
        difficulty: D_MOD,
        duration: 1,
        narrative: '{actor} names a counter-offer. The merchant\'s eyes narrow.',
        onSuccess: {
          narrative: 'A {adj} bargain is struck. The merchant rolls up their velvet, satisfied.',
          reputationDelta: 0.04,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.70, bestowed_power: 0.20, condition: 0.10 },
            tagFilters: ['#gold'],
          },
        },
        onFailure: {
          narrative: 'No deal. The merchant packs up and moves to the next table.',
          reputationDelta: -0.01,
        },
      },
    ],
  },

  // 10. The Warning
  {
    id: 'tavern.the_warning',
    name: 'The Warning',
    locationTypes: [...SETTLEMENT_LOCATIONS],
    sublocationTypes: TAVERN_SUBLOCATION,
    reachPrimary: 'eye',
    reachSecondary: 'heart',
    encounterType: 'assist',
    threatRating: 'easy',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    favorGeneration: { onSuccess: true, magnitudeRange: [0.10, 0.20], context: 'passed them a warning' },
    steps: [
      {
        id: 'warning.approach',
        name: 'A Quiet Word',
        reach: 'eye',
        difficulty: D_EASY,
        duration: 1,
        narrative: 'Someone has been watching {actor} all evening. Now they approach.',
        onSuccess: {
          narrative: '{actor} reads the intent correctly — not a threat. A warning.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: '{actor} misreads the signals. The moment passes and the stranger leaves.',
          reputationDelta: 0,
        },
      },
      {
        id: 'warning.heed',
        name: 'Heeding It',
        reach: 'heart',
        difficulty: D_MOD,
        duration: 1,
        narrative: 'The stranger\'s words are {adj}: someone powerful is watching. Take care.',
        onSuccess: {
          narrative: '{actor} receives the intelligence and thanks the stranger with {adj} discretion.',
          reputationDelta: 0.05,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.50, condition: 0.30, possession: 0.20 },
            tagFilters: ['#eye', '#shadow'],
          },
        },
        onFailure: {
          narrative: '{actor} dismisses it. The stranger shakes their head and walks away.',
          reputationDelta: -0.01,
        },
      },
    ],
  },
];
