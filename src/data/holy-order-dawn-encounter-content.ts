/**
 * Holy Order of the Dawn Encounter Content — quest, social, join, and promotion templates.
 *
 * The Holy Order of the Dawn is a militant religious order devoted to righteousness.
 * Primarily star/iron reaches with duel/assist/lead encounter types.
 */

import type { EncounterTemplate } from '../types/encounter';
import { ENCOUNTER_TYPE_MOTIVATIONS } from '../types/encounter';
import type { FactionEncounterMeta } from '../types/faction';

// ─── Constants ───────────────────────────────────────────────────────────

const HOD_DIFFICULTY_BASE = 25;
const HOD_DIFFICULTY_STEP = 10;
const HOD_SENIOR_BASE = 40;
const HOD_ELITE_BASE = 55;
const HOD_JOIN_DIFFICULTY = 20;
const HOD_PROMOTION_DIFFICULTY = 35;

// ─── Faction Encounter Metadata Registry ─────────────────────────────────

export const HOLY_ORDER_DAWN_ENCOUNTER_META: ReadonlyMap<string, FactionEncounterMeta> = new Map([
  // Join & Promotion
  ['hod.join', { factionDefId: 'holy_order_dawn', minRank: 'squire', reputationReward: 0.0, questType: 'standard' }],
  ['hod.promotion', { factionDefId: 'holy_order_dawn', minRank: 'squire', reputationReward: 0.0, questType: 'standard' }],
  // Standard quests
  ['hod.quest.temple_vigil', { factionDefId: 'holy_order_dawn', minRank: 'squire', reputationReward: 0.04, questType: 'standard' }],
  ['hod.quest.purify_shrine', { factionDefId: 'holy_order_dawn', minRank: 'squire', reputationReward: 0.04, questType: 'standard' }],
  ['hod.quest.escort_pilgrims', { factionDefId: 'holy_order_dawn', minRank: 'squire', reputationReward: 0.04, questType: 'standard' }],
  ['hod.quest.slay_abomination', { factionDefId: 'holy_order_dawn', minRank: 'squire', reputationReward: 0.05, questType: 'standard' }],
  ['hod.quest.deliver_judgment', { factionDefId: 'holy_order_dawn', minRank: 'squire', reputationReward: 0.05, questType: 'standard' }],
  // Senior quests
  ['hod.senior.cleanse_corruption', { factionDefId: 'holy_order_dawn', minRank: 'knight', reputationReward: 0.06, questType: 'senior' }],
  ['hod.senior.lead_crusade', { factionDefId: 'holy_order_dawn', minRank: 'knight', reputationReward: 0.06, questType: 'senior' }],
  ['hod.senior.inquisition', { factionDefId: 'holy_order_dawn', minRank: 'knight', reputationReward: 0.06, questType: 'senior' }],
  // Elite quests
  ['hod.elite.holy_war', { factionDefId: 'holy_order_dawn', minRank: 'knight_commander', reputationReward: 0.08, questType: 'elite' }],
  ['hod.elite.divine_trial', { factionDefId: 'holy_order_dawn', minRank: 'knight_commander', reputationReward: 0.08, questType: 'elite' }],
  // Social encounters
  ['hod.social.dawn_prayer', { factionDefId: 'holy_order_dawn', minRank: 'squire', reputationReward: 0.02, questType: 'standard' }],
  ['hod.social.blessing_ceremony', { factionDefId: 'holy_order_dawn', minRank: 'squire', reputationReward: 0.02, questType: 'standard' }],
  ['hod.social.tend_wounded', { factionDefId: 'holy_order_dawn', minRank: 'squire', reputationReward: 0.02, questType: 'standard' }],
]);

// ─── Templates ───────────────────────────────────────────────────────────

export const HOLY_ORDER_DAWN_ENCOUNTER_TEMPLATES: EncounterTemplate[] = [
  // ── Standard Quests (Squire+) ──────────────────────────────────

  {
    id: 'hod.quest.temple_vigil',
    name: 'Temple Vigil',
    locationTypes: ['temple', 'city', 'capital'],
    steps: [
      {
        id: 'hod.quest.temple_vigil.1',
        name: 'Stand Watch',
        narrative: 'The temple requires a night vigil. Stand guard against desecration.',
        reach: 'star',
        difficulty: HOD_DIFFICULTY_BASE,
        duration: 2,
        onSuccess: { narrative: 'The vigil passes peacefully. Your faith holds.' },
        onFailure: { narrative: 'You doze off. The temple master is disappointed.' },
      },
      {
        id: 'hod.quest.temple_vigil.2',
        name: 'Repel Intruders',
        narrative: 'Shadows move in the sanctum. Someone defiles the holy ground.',
        reach: 'iron',
        difficulty: HOD_DIFFICULTY_BASE + HOD_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: { narrative: 'Intruders driven off. The temple remains pure.' },
        onFailure: { narrative: 'They escape with a relic. The order is shamed.' },
      },
    ],
    reachPrimary: 'star',
    reachSecondary: 'iron',
    encounterType: 'duel',
    threatRating: 'easy',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    questPriority: 3.0,
  },

  {
    id: 'hod.quest.purify_shrine',
    name: 'Purify a Shrine',
    locationTypes: ['temple', 'city', 'capital'],
    steps: [
      {
        id: 'hod.quest.purify_shrine.1',
        name: 'Locate the Corruption',
        narrative: 'A roadside shrine radiates wrong. Find the source.',
        reach: 'star',
        difficulty: HOD_DIFFICULTY_BASE,
        duration: 2,
        onSuccess: { narrative: 'The corruption is found. Dark influence buried beneath.' },
        onFailure: { narrative: 'The source eludes you. The shrine remains tainted.' },
      },
      {
        id: 'hod.quest.purify_shrine.2',
        name: 'Perform the Rite',
        narrative: 'Channel the light of dawn to cleanse the corruption.',
        reach: 'star',
        difficulty: HOD_DIFFICULTY_BASE + HOD_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: { narrative: 'Light returns to the shrine. The corruption burns away.', tierPromotionEligible: true },
        onFailure: { narrative: 'The darkness resists. More power is needed.' },
      },
    ],
    reachPrimary: 'star',
    reachSecondary: 'iron',
    encounterType: 'assist',
    threatRating: 'easy',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    questPriority: 3.0,
  },

  {
    id: 'hod.quest.escort_pilgrims',
    name: 'Escort Pilgrims',
    locationTypes: ['temple', 'city', 'capital'],
    steps: [
      {
        id: 'hod.quest.escort_pilgrims.1',
        name: 'Gather the Faithful',
        narrative: 'Pilgrims need safe passage to the high temple. Organize the journey.',
        reach: 'heart',
        difficulty: HOD_DIFFICULTY_BASE,
        duration: 2,
        onSuccess: { narrative: 'Pilgrims assembled and ready. Morale is high.' },
        onFailure: { narrative: 'Stragglers and complainers slow the departure.' },
      },
      {
        id: 'hod.quest.escort_pilgrims.2',
        name: 'Defend the Road',
        narrative: 'Bandits target the pilgrims. Steel and faith must protect them.',
        reach: 'iron',
        difficulty: HOD_DIFFICULTY_BASE + HOD_DIFFICULTY_STEP,
        duration: 3,
        onSuccess: {
          narrative: 'Pilgrims delivered safely. Blessings earned.',
          rewardPool: {
            categoryWeights: { possession: 0.40, condition: 0.30, bestowed_power: 0.30 },
          },
        },
        onFailure: { narrative: 'Losses among the faithful. A somber arrival.' },
      },
    ],
    reachPrimary: 'iron',
    reachSecondary: 'star',
    encounterType: 'assist',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    questPriority: 3.0,
  },

  {
    id: 'hod.quest.slay_abomination',
    name: 'Slay the Abomination',
    locationTypes: ['temple', 'city', 'capital'],
    steps: [
      {
        id: 'hod.quest.slay_abomination.1',
        name: 'Track the Beast',
        narrative: 'Reports of an unnatural creature. The order sends you hunting.',
        reach: 'eye',
        difficulty: HOD_DIFFICULTY_BASE + 5,
        duration: 2,
        onSuccess: { narrative: 'Its lair found. The stench of corruption is unmistakable.' },
        onFailure: { narrative: 'The creature is elusive. It strikes and vanishes.' },
      },
      {
        id: 'hod.quest.slay_abomination.2',
        name: 'Strike it Down',
        narrative: 'Confront the abomination. Dawn\'s light against darkness made flesh.',
        reach: 'iron',
        difficulty: HOD_DIFFICULTY_BASE + HOD_DIFFICULTY_STEP + 5,
        duration: 2,
        onSuccess: {
          narrative: 'The creature falls. Its corruption fades with its last breath.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.30, condition: 0.30, bestowed_power: 0.40 },
          },
        },
        onFailure: { narrative: 'The beast is too strong. You retreat, wounded.' },
      },
    ],
    reachPrimary: 'iron',
    reachSecondary: 'star',
    encounterType: 'duel',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    questPriority: 3.0,
  },

  {
    id: 'hod.quest.deliver_judgment',
    name: 'Deliver Judgment',
    locationTypes: ['temple', 'city', 'capital'],
    steps: [
      {
        id: 'hod.quest.deliver_judgment.1',
        name: 'Investigate the Accused',
        narrative: 'A heresy charge is brought. Determine the truth.',
        reach: 'eye',
        difficulty: HOD_DIFFICULTY_BASE + 5,
        duration: 2,
        onSuccess: { narrative: 'Evidence gathered. The truth is clear.' },
        onFailure: { narrative: 'Contradictory testimony. The truth remains murky.' },
      },
      {
        id: 'hod.quest.deliver_judgment.2',
        name: 'Pronounce the Verdict',
        narrative: 'Stand before the assembled and deliver the order\'s judgment.',
        reach: 'star',
        difficulty: HOD_DIFFICULTY_BASE + HOD_DIFFICULTY_STEP,
        duration: 1,
        onSuccess: {
          narrative: 'Justice served. The faithful are reassured.',
          rewardPool: {
            categoryWeights: { possession: 0.30, condition: 0.40, bestowed_power: 0.30 },
          },
        },
        onFailure: { narrative: 'The verdict is questioned. Doubt lingers.' },
      },
    ],
    reachPrimary: 'star',
    reachSecondary: 'eye',
    encounterType: 'duel',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    questPriority: 3.0,
  },

  // ── Senior Quests (Knight+) ───────────────────────────────────

  {
    id: 'hod.senior.cleanse_corruption',
    name: 'Cleanse Deep Corruption',
    locationTypes: ['temple', 'city', 'capital'],
    steps: [
      {
        id: 'hod.senior.cleanse_corruption.1',
        name: 'Descend into Darkness',
        narrative: 'An ancient evil stirs beneath a temple. Descend and face it.',
        reach: 'star',
        difficulty: HOD_SENIOR_BASE,
        duration: 3,
        onSuccess: { narrative: 'You reach the heart of the corruption. It pulses with malice.' },
        onFailure: { narrative: 'The darkness is disorienting. You lose your way.' },
      },
      {
        id: 'hod.senior.cleanse_corruption.2',
        name: 'Purge the Source',
        narrative: 'Channel everything you have. Burn the corruption to its root.',
        reach: 'iron',
        difficulty: HOD_SENIOR_BASE + HOD_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: {
          narrative: 'The corruption is destroyed. Light fills the underground.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.30, condition: 0.30, bestowed_power: 0.40 },
          },
        },
        onFailure: { narrative: 'The evil endures. You retreat to plan anew.' },
      },
    ],
    reachPrimary: 'star',
    reachSecondary: 'iron',
    encounterType: 'duel',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    questPriority: 5.0,
  },

  {
    id: 'hod.senior.lead_crusade',
    name: 'Lead a Crusade',
    locationTypes: ['city', 'capital'],
    steps: [
      {
        id: 'hod.senior.lead_crusade.1',
        name: 'Rally the Knights',
        narrative: 'A threat to the faith demands a military response. Gather the order.',
        reach: 'heart',
        difficulty: HOD_SENIOR_BASE,
        duration: 2,
        onSuccess: { narrative: 'Knights assembled. The order rides with purpose.' },
        onFailure: { narrative: 'Few answer the call. The crusade is undermanned.' },
      },
      {
        id: 'hod.senior.lead_crusade.2',
        name: 'Storm the Stronghold',
        narrative: 'The enemy waits in their fortress. Lead the assault.',
        reach: 'iron',
        difficulty: HOD_SENIOR_BASE + HOD_DIFFICULTY_STEP,
        duration: 3,
        onSuccess: {
          narrative: 'The stronghold falls. The order\'s banner flies from the walls.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.40, condition: 0.20, bestowed_power: 0.40 },
          },
        },
        onFailure: { narrative: 'The assault is repelled. Heavy losses among the faithful.' },
      },
    ],
    reachPrimary: 'iron',
    reachSecondary: 'star',
    encounterType: 'lead',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
    questPriority: 5.0,
  },

  {
    id: 'hod.senior.inquisition',
    name: 'Conduct Inquisition',
    locationTypes: ['temple', 'city', 'capital'],
    steps: [
      {
        id: 'hod.senior.inquisition.1',
        name: 'Root Out Heresy',
        narrative: 'Dark cults spread in the city. Investigate and expose them.',
        reach: 'eye',
        difficulty: HOD_SENIOR_BASE,
        duration: 3,
        onSuccess: { narrative: 'The cult\'s network is mapped. Leaders identified.' },
        onFailure: { narrative: 'They cover their tracks well. Only fragments found.' },
      },
      {
        id: 'hod.senior.inquisition.2',
        name: 'Break the Cult',
        narrative: 'Strike simultaneously. Destroy the cult before they can scatter.',
        reach: 'iron',
        difficulty: HOD_SENIOR_BASE + HOD_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: { narrative: 'The cult is broken. Its leaders face judgment.', tierPromotionEligible: true },
        onFailure: { narrative: 'Many escape. The cult will reform elsewhere.' },
      },
    ],
    reachPrimary: 'star',
    reachSecondary: 'iron',
    encounterType: 'duel',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    questPriority: 5.0,
  },

  // ── Elite Quests (Knight Commander+) ──────────────────────────

  {
    id: 'hod.elite.holy_war',
    name: 'Holy War',
    locationTypes: ['city', 'capital'],
    steps: [
      {
        id: 'hod.elite.holy_war.1',
        name: 'Consecrate the Campaign',
        narrative: 'The Grand Master declares holy war. Prepare the order for total commitment.',
        reach: 'star',
        difficulty: HOD_ELITE_BASE,
        duration: 3,
        onSuccess: { narrative: 'The order is united. Divine purpose fills every knight.' },
        onFailure: { narrative: 'Dissent among the ranks. Not all believe in the cause.' },
      },
      {
        id: 'hod.elite.holy_war.2',
        name: 'Command the Vanguard',
        narrative: 'Lead the first wave against the enemy of the faith.',
        reach: 'iron',
        difficulty: HOD_ELITE_BASE + HOD_DIFFICULTY_STEP,
        duration: 3,
        onSuccess: { narrative: 'The vanguard breaks through. The enemy falters.' },
        onFailure: { narrative: 'The vanguard is stalled. Casualties mount.' },
      },
      {
        id: 'hod.elite.holy_war.3',
        name: 'Win the Final Battle',
        narrative: 'Everything depends on this moment. Lead the decisive charge.',
        reach: 'iron',
        difficulty: HOD_ELITE_BASE + HOD_DIFFICULTY_STEP * 2,
        duration: 3,
        onSuccess: {
          narrative: 'Victory. The enemy is vanquished and the faith vindicated.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.20, condition: 0.30, bestowed_power: 0.50 },
          },
        },
        onFailure: { narrative: 'Defeat. The order retreats to lick its wounds.' },
      },
    ],
    reachPrimary: 'iron',
    reachSecondary: 'star',
    encounterType: 'lead',
    threatRating: 'deadly',
    intrinsicTier: 'story_beat',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
    questPriority: 8.0,
  },

  {
    id: 'hod.elite.divine_trial',
    name: 'Divine Trial',
    locationTypes: ['temple', 'capital'],
    steps: [
      {
        id: 'hod.elite.divine_trial.1',
        name: 'Enter the Sanctum',
        narrative: 'The inner sanctum tests faith itself. Enter and face judgment.',
        reach: 'star',
        difficulty: HOD_ELITE_BASE,
        duration: 2,
        onSuccess: { narrative: 'The sanctum accepts you. Visions of purpose fill your mind.' },
        onFailure: { narrative: 'The sanctum resists. Your faith wavers.' },
      },
      {
        id: 'hod.elite.divine_trial.2',
        name: 'Face the Ordeal',
        narrative: 'Each knight faces a trial unique to their soul. Endure it.',
        reach: 'star',
        difficulty: HOD_ELITE_BASE + HOD_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: { narrative: 'The ordeal is survived. You emerge stronger.' },
        onFailure: { narrative: 'The trial breaks something inside. Recovery will be slow.' },
      },
      {
        id: 'hod.elite.divine_trial.3',
        name: 'Receive the Mandate',
        narrative: 'If worthy, the light of dawn bestows its charge upon you.',
        reach: 'star',
        difficulty: HOD_ELITE_BASE + HOD_DIFFICULTY_STEP * 2,
        duration: 2,
        onSuccess: {
          narrative: 'The mandate is received. You are chosen among the chosen.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.10, condition: 0.30, bestowed_power: 0.60 },
          },
        },
        onFailure: { narrative: 'Silence. The light does not answer. Not yet.' },
      },
    ],
    reachPrimary: 'star',
    reachSecondary: 'iron',
    encounterType: 'duel',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    questPriority: 8.0,
  },
];

// ─── Social Encounters ──────────────────────────────────────────────────

export const HOLY_ORDER_DAWN_SOCIAL_TEMPLATES: EncounterTemplate[] = [
  {
    id: 'hod.social.dawn_prayer',
    name: 'Dawn Prayer',
    locationTypes: ['temple', 'city', 'capital'],
    steps: [
      {
        id: 'hod.social.dawn_prayer.1',
        name: 'Join the Prayer',
        narrative: 'The order gathers at first light. Join your voice to theirs.',
        reach: 'star',
        difficulty: HOD_DIFFICULTY_BASE - 10,
        duration: 1,
        onSuccess: {
          narrative: 'Peace fills you. The day begins with purpose.',
          rewardPool: {
            categoryWeights: { possession: 1.0 },
          },
        },
        onFailure: { narrative: 'Your mind wanders. The prayer feels hollow today.' },
      },
    ],
    reachPrimary: 'star',
    reachSecondary: 'heart',
    encounterType: 'assist',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
  },

  {
    id: 'hod.social.blessing_ceremony',
    name: 'Blessing Ceremony',
    locationTypes: ['temple', 'city', 'capital'],
    steps: [
      {
        id: 'hod.social.blessing_ceremony.1',
        name: 'Bestow the Blessing',
        narrative: 'Citizens seek the order\'s blessing. Lay hands and speak the words.',
        reach: 'star',
        difficulty: HOD_DIFFICULTY_BASE - 5,
        duration: 1,
        onSuccess: {
          narrative: 'The faithful leave strengthened. Your reputation grows.',
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.50 },
          },
        },
        onFailure: { narrative: 'The words feel rote. No one is moved.' },
      },
    ],
    reachPrimary: 'star',
    reachSecondary: 'heart',
    encounterType: 'assist',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
  },

  {
    id: 'hod.social.tend_wounded',
    name: 'Tend the Wounded',
    locationTypes: ['temple', 'city', 'capital'],
    steps: [
      {
        id: 'hod.social.tend_wounded.1',
        name: 'Heal the Sick',
        narrative: 'The temple hospice needs hands. Tend to those in pain.',
        reach: 'heart',
        difficulty: HOD_DIFFICULTY_BASE,
        duration: 1,
        onSuccess: {
          narrative: 'Lives eased. The wounded thank you with grateful eyes.',
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
          },
        },
        onFailure: { narrative: 'Some wounds are beyond your skill. You do what you can.' },
      },
    ],
    reachPrimary: 'heart',
    reachSecondary: 'star',
    encounterType: 'assist',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
  },
];

// ─── Join & Promotion ───────────────────────────────────────────────────

export const HOD_JOIN_TEMPLATE: EncounterTemplate = {
  id: 'hod.join',
  name: 'Take the Oath of Dawn',
  locationTypes: ['temple', 'city', 'capital'],
  steps: [
    {
      id: 'hod.join.1',
      name: 'The Oath',
      narrative: 'Kneel before the altar and swear to uphold the light.',
      reach: 'star',
      difficulty: HOD_JOIN_DIFFICULTY,
      duration: 1,
      onSuccess: { narrative: 'The light accepts you. You are a squire of the dawn.' },
      onFailure: { narrative: 'Your heart is not ready. Return when faith is true.' },
    },
  ],
  reachPrimary: 'star',
  reachSecondary: 'iron',
  encounterType: 'assist',
  threatRating: 'easy',
  intrinsicTier: 'shaping',
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
  questPriority: 6.0,
};

export const HOD_PROMOTION_TEMPLATE: EncounterTemplate = {
  id: 'hod.promotion',
  name: 'Rite of Ascension',
  locationTypes: ['temple', 'city', 'capital'],
  steps: [
    {
      id: 'hod.promotion.1',
      name: 'The Trial of Faith',
      narrative: 'Higher rank demands deeper devotion. Prove your worthiness.',
      reach: 'star',
      difficulty: HOD_PROMOTION_DIFFICULTY,
      duration: 2,
      onSuccess: { narrative: 'You ascend. The order recognizes your devotion.' },
      onFailure: { narrative: 'The trial reveals doubt. Meditate and return.' },
    },
  ],
  reachPrimary: 'star',
  reachSecondary: 'iron',
  encounterType: 'duel',
  threatRating: 'moderate',
  intrinsicTier: 'shaping',
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
  questPriority: 7.0,
};

export const HOD_LIFECYCLE_TEMPLATES: readonly EncounterTemplate[] = [
  HOD_JOIN_TEMPLATE,
  HOD_PROMOTION_TEMPLATE,
];

// ─── Lookup ─────────────────────────────────────────────────────────────

/**
 * Look up a holy order encounter template by ID.
 */
export function getHolyOrderDawnEncounterById(id: string): EncounterTemplate | undefined {
  return HOLY_ORDER_DAWN_ENCOUNTER_TEMPLATES.find(t => t.id === id)
    ?? HOD_LIFECYCLE_TEMPLATES.find(t => t.id === id)
    ?? HOLY_ORDER_DAWN_SOCIAL_TEMPLATES.find(t => t.id === id);
}
