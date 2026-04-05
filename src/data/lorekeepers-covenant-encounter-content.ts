/**
 * Lorekeepers Covenant Encounter Content — quest, social, join, and promotion templates.
 *
 * The Lorekeepers Covenant is a scholarly order dedicated to knowledge and discovery.
 * Primarily eye/veil reaches with explore/acquire/create encounter types.
 */

import type { EncounterTemplate } from '../types/encounter';
import { ENCOUNTER_TYPE_MOTIVATIONS } from '../types/encounter';
import type { FactionEncounterMeta } from '../types/faction';

// ─── Constants ───────────────────────────────────────────────────────────

const LK_DIFFICULTY_BASE = 25;
const LK_DIFFICULTY_STEP = 10;
const LK_SENIOR_BASE = 40;
const LK_ELITE_BASE = 55;
const LK_JOIN_DIFFICULTY = 20;
const LK_PROMOTION_DIFFICULTY = 35;

// ─── Faction Encounter Metadata Registry ─────────────────────────────────

export const LOREKEEPERS_COVENANT_ENCOUNTER_META: ReadonlyMap<string, FactionEncounterMeta> = new Map([
  // Join & Promotion
  ['lk.join', { factionDefId: 'lorekeepers_covenant', minRank: 'scribe', reputationReward: 0.0, questType: 'standard' }],
  ['lk.promotion', { factionDefId: 'lorekeepers_covenant', minRank: 'scribe', reputationReward: 0.0, questType: 'standard' }],
  // Standard quests
  ['lk.quest.catalogue_ruins', { factionDefId: 'lorekeepers_covenant', minRank: 'scribe', reputationReward: 0.04, questType: 'standard' }],
  ['lk.quest.translate_text', { factionDefId: 'lorekeepers_covenant', minRank: 'scribe', reputationReward: 0.04, questType: 'standard' }],
  ['lk.quest.recover_tome', { factionDefId: 'lorekeepers_covenant', minRank: 'scribe', reputationReward: 0.04, questType: 'standard' }],
  ['lk.quest.map_ley_lines', { factionDefId: 'lorekeepers_covenant', minRank: 'scribe', reputationReward: 0.05, questType: 'standard' }],
  ['lk.quest.interview_elder', { factionDefId: 'lorekeepers_covenant', minRank: 'scribe', reputationReward: 0.05, questType: 'standard' }],
  // Senior quests
  ['lk.senior.decipher_prophecy', { factionDefId: 'lorekeepers_covenant', minRank: 'scholar', reputationReward: 0.06, questType: 'senior' }],
  ['lk.senior.excavate_archive', { factionDefId: 'lorekeepers_covenant', minRank: 'scholar', reputationReward: 0.06, questType: 'senior' }],
  ['lk.senior.compose_treatise', { factionDefId: 'lorekeepers_covenant', minRank: 'scholar', reputationReward: 0.06, questType: 'senior' }],
  // Elite quests
  ['lk.elite.forbidden_library', { factionDefId: 'lorekeepers_covenant', minRank: 'sage', reputationReward: 0.08, questType: 'elite' }],
  ['lk.elite.cosmic_revelation', { factionDefId: 'lorekeepers_covenant', minRank: 'sage', reputationReward: 0.08, questType: 'elite' }],
  // Social encounters
  ['lk.social.lecture_hall', { factionDefId: 'lorekeepers_covenant', minRank: 'scribe', reputationReward: 0.02, questType: 'standard' }],
  ['lk.social.debate_forum', { factionDefId: 'lorekeepers_covenant', minRank: 'scribe', reputationReward: 0.02, questType: 'standard' }],
  ['lk.social.manuscript_exchange', { factionDefId: 'lorekeepers_covenant', minRank: 'scribe', reputationReward: 0.02, questType: 'standard' }],
]);

// ─── Templates ───────────────────────────────────────────────────────────

export const LOREKEEPERS_COVENANT_ENCOUNTER_TEMPLATES: EncounterTemplate[] = [
  // ── Standard Quests (Scribe+) ──────────────────────────────────

  {
    id: 'lk.quest.catalogue_ruins',
    name: 'Catalogue the Ruins',
    locationTypes: ['city', 'capital', 'tower'],
    steps: [
      {
        id: 'lk.quest.catalogue_ruins.1',
        name: 'Survey the Site',
        narrative: 'A newly discovered ruin needs cataloguing. Document everything.',
        reach: 'eye',
        difficulty: LK_DIFFICULTY_BASE,
        duration: 2,
        onSuccess: { narrative: 'Thorough documentation. Every inscription recorded.' },
        onFailure: { narrative: 'Hasty work. Key details missed.' },
      },
      {
        id: 'lk.quest.catalogue_ruins.2',
        name: 'Analyze the Findings',
        narrative: 'Cross-reference your notes with known historical records.',
        reach: 'eye',
        difficulty: LK_DIFFICULTY_BASE + LK_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: { narrative: 'Connections found. The ruins tell a story no one expected.' },
        onFailure: { narrative: 'The records are too fragmented. Inconclusive results.' },
      },
    ],
    reachPrimary: 'eye',
    reachSecondary: 'veil',
    encounterType: 'explore',
    threatRating: 'easy',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    questPriority: 3.0,
  },

  {
    id: 'lk.quest.translate_text',
    name: 'Translate Ancient Text',
    locationTypes: ['city', 'capital', 'tower'],
    steps: [
      {
        id: 'lk.quest.translate_text.1',
        name: 'Study the Script',
        narrative: 'A tablet in an unknown language arrives. Begin deciphering.',
        reach: 'eye',
        difficulty: LK_DIFFICULTY_BASE,
        duration: 2,
        onSuccess: { narrative: 'Root patterns identified. The language reveals its logic.' },
        onFailure: { narrative: 'No known parallels. The script resists interpretation.' },
      },
      {
        id: 'lk.quest.translate_text.2',
        name: 'Complete the Translation',
        narrative: 'Apply your understanding to produce a full translation.',
        reach: 'veil',
        difficulty: LK_DIFFICULTY_BASE + LK_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: { narrative: 'The text yields its secrets. Knowledge preserved.', tierPromotionEligible: true },
        onFailure: { narrative: 'Gaps remain. The translation is partial at best.' },
      },
    ],
    reachPrimary: 'eye',
    reachSecondary: 'veil',
    encounterType: 'explore',
    threatRating: 'easy',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    questPriority: 3.0,
  },

  {
    id: 'lk.quest.recover_tome',
    name: 'Recover a Lost Tome',
    locationTypes: ['city', 'capital', 'tower'],
    steps: [
      {
        id: 'lk.quest.recover_tome.1',
        name: 'Trace the Provenance',
        narrative: 'A rare book has surfaced in a private collection. Locate it.',
        reach: 'eye',
        difficulty: LK_DIFFICULTY_BASE + 5,
        duration: 2,
        onSuccess: { narrative: 'The tome is found. The collector is willing to negotiate.' },
        onFailure: { narrative: 'A dead end. The collector has moved on.' },
      },
      {
        id: 'lk.quest.recover_tome.2',
        name: 'Acquire the Tome',
        narrative: 'Negotiate, trade, or petition. The covenant must have this book.',
        reach: 'gold',
        difficulty: LK_DIFFICULTY_BASE + LK_DIFFICULTY_STEP,
        duration: 1,
        onSuccess: {
          narrative: 'The tome is secured for the covenant\'s archives.',
          rewardPool: {
            categoryWeights: { possession: 0.60, condition: 0.20, bestowed_power: 0.20 },
          },
        },
        onFailure: { narrative: 'The price is too high. The tome remains in private hands.' },
      },
    ],
    reachPrimary: 'eye',
    reachSecondary: 'gold',
    encounterType: 'acquire',
    threatRating: 'easy',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.acquire,
    questPriority: 3.0,
  },

  {
    id: 'lk.quest.map_ley_lines',
    name: 'Map Ley Lines',
    locationTypes: ['city', 'capital', 'tower'],
    steps: [
      {
        id: 'lk.quest.map_ley_lines.1',
        name: 'Sense the Currents',
        narrative: 'Magical currents flow beneath the earth. Detect and trace them.',
        reach: 'veil',
        difficulty: LK_DIFFICULTY_BASE + 5,
        duration: 2,
        onSuccess: { narrative: 'Ley lines detected. Their paths shimmer in your awareness.' },
        onFailure: { narrative: 'Too much interference. The currents blur together.' },
      },
      {
        id: 'lk.quest.map_ley_lines.2',
        name: 'Chart the Network',
        narrative: 'Record the ley line paths on the covenant\'s master map.',
        reach: 'eye',
        difficulty: LK_DIFFICULTY_BASE + LK_DIFFICULTY_STEP + 5,
        duration: 2,
        onSuccess: {
          narrative: 'New ley lines charted. The map grows more complete.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.40, condition: 0.30, bestowed_power: 0.30 },
          },
        },
        onFailure: { narrative: 'The measurements drift. Inaccurate readings recorded.' },
      },
    ],
    reachPrimary: 'veil',
    reachSecondary: 'eye',
    encounterType: 'explore',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    questPriority: 3.0,
  },

  {
    id: 'lk.quest.interview_elder',
    name: 'Interview a Village Elder',
    locationTypes: ['city', 'capital', 'tower'],
    steps: [
      {
        id: 'lk.quest.interview_elder.1',
        name: 'Gain Trust',
        narrative: 'An elder holds oral histories from before the written record. Earn their trust.',
        reach: 'heart',
        difficulty: LK_DIFFICULTY_BASE,
        duration: 2,
        onSuccess: { narrative: 'The elder agrees to speak. Tea is poured.' },
        onFailure: { narrative: 'The elder is suspicious of scholars. No stories today.' },
      },
      {
        id: 'lk.quest.interview_elder.2',
        name: 'Record the Stories',
        narrative: 'Listen carefully and transcribe. Every detail matters.',
        reach: 'eye',
        difficulty: LK_DIFFICULTY_BASE + LK_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: {
          narrative: 'Precious oral history preserved in writing.',
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.30, bestowed_power: 0.20 },
          },
        },
        onFailure: { narrative: 'The elder rambles. Hard to separate history from embellishment.' },
      },
    ],
    reachPrimary: 'eye',
    reachSecondary: 'heart',
    encounterType: 'acquire',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.acquire,
    questPriority: 3.0,
  },

  // ── Senior Quests (Scholar+) ──────────────────────────────────

  {
    id: 'lk.senior.decipher_prophecy',
    name: 'Decipher a Prophecy',
    locationTypes: ['city', 'capital', 'tower'],
    steps: [
      {
        id: 'lk.senior.decipher_prophecy.1',
        name: 'Gather the Fragments',
        narrative: 'An ancient prophecy exists in scattered pieces. Collect them all.',
        reach: 'eye',
        difficulty: LK_SENIOR_BASE,
        duration: 3,
        onSuccess: { narrative: 'All fragments assembled. The full text is before you.' },
        onFailure: { narrative: 'Key fragments are missing. The prophecy has gaps.' },
      },
      {
        id: 'lk.senior.decipher_prophecy.2',
        name: 'Interpret the Meaning',
        narrative: 'Prophecy speaks in riddles. Apply centuries of scholarship to decode it.',
        reach: 'veil',
        difficulty: LK_SENIOR_BASE + LK_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: {
          narrative: 'The prophecy reveals its meaning. The covenant is forewarned.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.30, condition: 0.30, bestowed_power: 0.40 },
          },
        },
        onFailure: { narrative: 'Multiple interpretations. The truth remains obscured.' },
      },
    ],
    reachPrimary: 'eye',
    reachSecondary: 'veil',
    encounterType: 'explore',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    questPriority: 5.0,
  },

  {
    id: 'lk.senior.excavate_archive',
    name: 'Excavate a Buried Archive',
    locationTypes: ['city', 'capital', 'tower'],
    steps: [
      {
        id: 'lk.senior.excavate_archive.1',
        name: 'Locate the Archive',
        narrative: 'Old maps suggest a sealed library beneath the city. Find the entrance.',
        reach: 'eye',
        difficulty: LK_SENIOR_BASE,
        duration: 3,
        onSuccess: { narrative: 'The entrance found behind a false wall. Dust and darkness await.' },
        onFailure: { narrative: 'The maps are inaccurate. More research needed.' },
      },
      {
        id: 'lk.senior.excavate_archive.2',
        name: 'Recover the Contents',
        narrative: 'Carefully extract the ancient documents. They crumble at a touch.',
        reach: 'veil',
        difficulty: LK_SENIOR_BASE + LK_DIFFICULTY_STEP,
        duration: 3,
        onSuccess: {
          narrative: 'Hundreds of documents recovered. A treasure trove of lost knowledge.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.20, bestowed_power: 0.30 },
          },
        },
        onFailure: { narrative: 'Water damage has ruined most of the contents. A few pages saved.' },
      },
    ],
    reachPrimary: 'eye',
    reachSecondary: 'veil',
    encounterType: 'explore',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    questPriority: 5.0,
  },

  {
    id: 'lk.senior.compose_treatise',
    name: 'Compose a Treatise',
    locationTypes: ['city', 'capital', 'tower'],
    steps: [
      {
        id: 'lk.senior.compose_treatise.1',
        name: 'Research the Subject',
        narrative: 'The covenant requests a definitive work on a topic. Begin your research.',
        reach: 'eye',
        difficulty: LK_SENIOR_BASE,
        duration: 3,
        onSuccess: { narrative: 'Comprehensive research completed. Original insights formed.' },
        onFailure: { narrative: 'The research reveals nothing new. The subject is well-trodden.' },
      },
      {
        id: 'lk.senior.compose_treatise.2',
        name: 'Write and Defend',
        narrative: 'Write the treatise and defend it before the covenant\'s senior scholars.',
        reach: 'veil',
        difficulty: LK_SENIOR_BASE + LK_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: {
          narrative: 'The treatise is accepted. Your name joins the canon.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.30, condition: 0.30, bestowed_power: 0.40 },
          },
        },
        onFailure: { narrative: 'The defense is rocky. Major revisions required.' },
      },
    ],
    reachPrimary: 'veil',
    reachSecondary: 'eye',
    encounterType: 'create',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.create,
    questPriority: 5.0,
  },

  // ── Elite Quests (Sage+) ──────────────────────────────────────

  {
    id: 'lk.elite.forbidden_library',
    name: 'Enter the Forbidden Library',
    locationTypes: ['capital', 'tower'],
    steps: [
      {
        id: 'lk.elite.forbidden_library.1',
        name: 'Break the Seals',
        narrative: 'The covenant\'s most dangerous knowledge is sealed away. Open it.',
        reach: 'veil',
        difficulty: LK_ELITE_BASE,
        duration: 3,
        onSuccess: { narrative: 'The seals yield. The forbidden section opens before you.' },
        onFailure: { narrative: 'The seals resist. Your knowledge is insufficient.' },
      },
      {
        id: 'lk.elite.forbidden_library.2',
        name: 'Navigate the Dangers',
        narrative: 'The library is trapped — physically and mentally. Proceed with care.',
        reach: 'eye',
        difficulty: LK_ELITE_BASE + LK_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: { narrative: 'Traps avoided. You reach the deepest stacks.' },
        onFailure: { narrative: 'A ward triggers. You retreat, shaken.' },
      },
      {
        id: 'lk.elite.forbidden_library.3',
        name: 'Comprehend the Text',
        narrative: 'The knowledge here was sealed for a reason. Read it and survive.',
        reach: 'veil',
        difficulty: LK_ELITE_BASE + LK_DIFFICULTY_STEP * 2,
        duration: 3,
        onSuccess: {
          narrative: 'Forbidden knowledge absorbed. Your mind expands to hold it.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.10, condition: 0.30, bestowed_power: 0.60 },
          },
        },
        onFailure: { narrative: 'The text overwhelms you. You forget as fast as you read.' },
      },
    ],
    reachPrimary: 'veil',
    reachSecondary: 'eye',
    encounterType: 'explore',
    threatRating: 'deadly',
    intrinsicTier: 'story_beat',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    questPriority: 8.0,
  },

  {
    id: 'lk.elite.cosmic_revelation',
    name: 'Cosmic Revelation',
    locationTypes: ['capital', 'tower'],
    steps: [
      {
        id: 'lk.elite.cosmic_revelation.1',
        name: 'Align the Instruments',
        narrative: 'The covenant\'s astral observatory must be calibrated for a rare conjunction.',
        reach: 'eye',
        difficulty: LK_ELITE_BASE,
        duration: 3,
        onSuccess: { narrative: 'Instruments aligned. The conjunction will be observable.' },
        onFailure: { narrative: 'Calibration drift. The window may be missed.' },
      },
      {
        id: 'lk.elite.cosmic_revelation.2',
        name: 'Observe the Conjunction',
        narrative: 'Stars align. What they reveal transcends mortal understanding.',
        reach: 'veil',
        difficulty: LK_ELITE_BASE + LK_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: { narrative: 'The conjunction reveals patterns beyond normal sight.' },
        onFailure: { narrative: 'Clouds obscure the view. Partial data only.' },
      },
      {
        id: 'lk.elite.cosmic_revelation.3',
        name: 'Record the Revelation',
        narrative: 'What you have seen must be written before it fades from mortal memory.',
        reach: 'veil',
        difficulty: LK_ELITE_BASE + LK_DIFFICULTY_STEP * 2,
        duration: 2,
        onSuccess: {
          narrative: 'A cosmic truth recorded. The covenant\'s understanding deepens.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.20, condition: 0.20, bestowed_power: 0.60 },
          },
        },
        onFailure: { narrative: 'The revelation slips away. Only fragments remain.' },
      },
    ],
    reachPrimary: 'eye',
    reachSecondary: 'veil',
    encounterType: 'create',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.create,
    questPriority: 8.0,
  },
];

// ─── Social Encounters ──────────────────────────────────────────────────

export const LOREKEEPERS_COVENANT_SOCIAL_TEMPLATES: EncounterTemplate[] = [
  {
    id: 'lk.social.lecture_hall',
    name: 'Lecture Hall',
    locationTypes: ['city', 'capital', 'tower'],
    steps: [
      {
        id: 'lk.social.lecture_hall.1',
        name: 'Attend a Lecture',
        narrative: 'A senior scholar presents new findings. Listen and learn.',
        reach: 'eye',
        difficulty: LK_DIFFICULTY_BASE - 5,
        duration: 1,
        onSuccess: {
          narrative: 'Fascinating subject. New perspectives gained.',
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
          },
        },
        onFailure: { narrative: 'The lecture is dry. You struggle to stay awake.' },
      },
    ],
    reachPrimary: 'eye',
    reachSecondary: 'veil',
    encounterType: 'explore',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
  },

  {
    id: 'lk.social.debate_forum',
    name: 'Debate Forum',
    locationTypes: ['city', 'capital', 'tower'],
    steps: [
      {
        id: 'lk.social.debate_forum.1',
        name: 'Enter the Debate',
        narrative: 'Scholars argue a contested interpretation. Take a position and defend it.',
        reach: 'eye',
        difficulty: LK_DIFFICULTY_BASE,
        duration: 1,
        onSuccess: {
          narrative: 'Your argument carries. Peers acknowledge your reasoning.',
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.50 },
          },
        },
        onFailure: { narrative: 'Your argument has holes. The opposition picks it apart.' },
      },
    ],
    reachPrimary: 'eye',
    reachSecondary: 'heart',
    encounterType: 'explore',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
  },

  {
    id: 'lk.social.manuscript_exchange',
    name: 'Manuscript Exchange',
    locationTypes: ['city', 'capital', 'tower'],
    steps: [
      {
        id: 'lk.social.manuscript_exchange.1',
        name: 'Trade Copies',
        narrative: 'Scholars exchange copies of rare manuscripts. Share what you have.',
        reach: 'eye',
        difficulty: LK_DIFFICULTY_BASE - 10,
        duration: 1,
        onSuccess: {
          narrative: 'Good exchange. Rare texts added to your collection.',
          rewardPool: {
            categoryWeights: { possession: 1.0 },
          },
        },
        onFailure: { narrative: 'Nothing new in the exchange. You already have these texts.' },
      },
    ],
    reachPrimary: 'eye',
    reachSecondary: 'veil',
    encounterType: 'explore',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
  },
];

// ─── Join & Promotion ───────────────────────────────────────────────────

export const LK_JOIN_TEMPLATE: EncounterTemplate = {
  id: 'lk.join',
  name: 'Apply to the Covenant',
  locationTypes: ['city', 'capital', 'tower'],
  steps: [
    {
      id: 'lk.join.1',
      name: 'Knowledge Test',
      narrative: 'The covenant tests your scholarly aptitude. Read, interpret, and recite.',
      reach: 'eye',
      difficulty: LK_JOIN_DIFFICULTY,
      duration: 1,
      onSuccess: { narrative: 'You pass the test. Welcome, scribe.' },
      onFailure: { narrative: 'Insufficient knowledge. Study more and return.' },
    },
  ],
  reachPrimary: 'eye',
  reachSecondary: 'veil',
  encounterType: 'explore',
  threatRating: 'easy',
  intrinsicTier: 'shaping',
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
  questPriority: 6.0,
};

export const LK_PROMOTION_TEMPLATE: EncounterTemplate = {
  id: 'lk.promotion',
  name: 'Covenant Advancement',
  locationTypes: ['city', 'capital', 'tower'],
  steps: [
    {
      id: 'lk.promotion.1',
      name: 'Thesis Defense',
      narrative: 'Higher rank requires presenting original scholarship to the council.',
      reach: 'eye',
      difficulty: LK_PROMOTION_DIFFICULTY,
      duration: 2,
      onSuccess: { narrative: 'Your thesis is accepted. New rank, new access to the archives.' },
      onFailure: { narrative: 'The council finds your work derivative. More research needed.' },
    },
  ],
  reachPrimary: 'eye',
  reachSecondary: 'veil',
  encounterType: 'explore',
  threatRating: 'moderate',
  intrinsicTier: 'shaping',
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
  questPriority: 7.0,
};

export const LK_LIFECYCLE_TEMPLATES: readonly EncounterTemplate[] = [
  LK_JOIN_TEMPLATE,
  LK_PROMOTION_TEMPLATE,
];

// ─── Lookup ─────────────────────────────────────────────────────────────

/**
 * Look up a lorekeepers covenant encounter template by ID.
 */
export function getLorekeeperCovenantEncounterById(id: string): EncounterTemplate | undefined {
  return LOREKEEPERS_COVENANT_ENCOUNTER_TEMPLATES.find(t => t.id === id)
    ?? LK_LIFECYCLE_TEMPLATES.find(t => t.id === id)
    ?? LOREKEEPERS_COVENANT_SOCIAL_TEMPLATES.find(t => t.id === id);
}
