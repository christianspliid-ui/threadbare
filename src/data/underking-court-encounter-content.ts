/**
 * Underking Court Encounter Content — quest, social, join, and promotion templates.
 *
 * The Underking Court controls the criminal underworld, running rackets and black markets.
 * Primarily shadow/gold reaches with steal/trade/lead encounter types.
 */

import type { EncounterTemplate } from '../types/encounter';
import { ENCOUNTER_TYPE_MOTIVATIONS } from '../types/encounter';
import type { FactionEncounterMeta } from '../types/faction';

// ─── Constants ───────────────────────────────────────────────────────────

const UK_DIFFICULTY_BASE = 25;
const UK_DIFFICULTY_STEP = 10;
const UK_SENIOR_BASE = 40;
const UK_ELITE_BASE = 55;
const UK_JOIN_DIFFICULTY = 20;
const UK_PROMOTION_DIFFICULTY = 35;

// ─── Faction Encounter Metadata Registry ─────────────────────────────────

export const UNDERKING_COURT_ENCOUNTER_META: ReadonlyMap<string, FactionEncounterMeta> = new Map([
  // Join & Promotion
  ['uk.join', { factionDefId: 'underking_court', minRank: 'pawn', reputationReward: 0.0, questType: 'standard' }],
  ['uk.promotion', { factionDefId: 'underking_court', minRank: 'pawn', reputationReward: 0.0, questType: 'standard' }],
  // Standard quests
  ['uk.quest.pickpocket_run', { factionDefId: 'underking_court', minRank: 'pawn', reputationReward: 0.04, questType: 'standard' }],
  ['uk.quest.fence_goods', { factionDefId: 'underking_court', minRank: 'pawn', reputationReward: 0.04, questType: 'standard' }],
  ['uk.quest.protection_racket', { factionDefId: 'underking_court', minRank: 'pawn', reputationReward: 0.04, questType: 'standard' }],
  ['uk.quest.smuggle_cargo', { factionDefId: 'underking_court', minRank: 'pawn', reputationReward: 0.05, questType: 'standard' }],
  ['uk.quest.blackmail_mark', { factionDefId: 'underking_court', minRank: 'pawn', reputationReward: 0.05, questType: 'standard' }],
  // Senior quests
  ['uk.senior.heist_planning', { factionDefId: 'underking_court', minRank: 'enforcer', reputationReward: 0.06, questType: 'senior' }],
  ['uk.senior.eliminate_rival', { factionDefId: 'underking_court', minRank: 'enforcer', reputationReward: 0.06, questType: 'senior' }],
  ['uk.senior.corrupt_official', { factionDefId: 'underking_court', minRank: 'enforcer', reputationReward: 0.06, questType: 'senior' }],
  // Elite quests
  ['uk.elite.seize_territory', { factionDefId: 'underking_court', minRank: 'underboss', reputationReward: 0.08, questType: 'elite' }],
  ['uk.elite.shadow_coup', { factionDefId: 'underking_court', minRank: 'underboss', reputationReward: 0.08, questType: 'elite' }],
  // Social encounters
  ['uk.social.gambling_den', { factionDefId: 'underking_court', minRank: 'pawn', reputationReward: 0.02, questType: 'standard' }],
  ['uk.social.black_market', { factionDefId: 'underking_court', minRank: 'pawn', reputationReward: 0.02, questType: 'standard' }],
  ['uk.social.whisper_network', { factionDefId: 'underking_court', minRank: 'pawn', reputationReward: 0.02, questType: 'standard' }],
]);

// ─── Templates ───────────────────────────────────────────────────────────

export const UNDERKING_COURT_ENCOUNTER_TEMPLATES: EncounterTemplate[] = [
  // ── Standard Quests (Pawn+) ──────────────────────────────────

  {
    id: 'uk.quest.pickpocket_run',
    name: 'Pickpocket Run',
    locationTypes: ['city', 'capital'],
    steps: [
      {
        id: 'uk.quest.pickpocket_run.1',
        name: 'Case the Crowd',
        narrative: 'A market day crowd. Pick your targets carefully.',
        reach: 'eye',
        difficulty: UK_DIFFICULTY_BASE,
        duration: 1,
        onSuccess: { narrative: 'Easy marks identified. Wealthy and distracted.' },
        onFailure: { narrative: 'Too many watchful eyes. Poor hunting ground.' },
      },
      {
        id: 'uk.quest.pickpocket_run.2',
        name: 'Lift the Purses',
        narrative: 'Quick fingers, steady nerve. Take what you can.',
        reach: 'shadow',
        difficulty: UK_DIFFICULTY_BASE + UK_DIFFICULTY_STEP,
        duration: 1,
        onSuccess: { narrative: 'Heavy purses, clean getaway. The court is pleased.' },
        onFailure: { narrative: 'Caught reaching. You flee empty-handed.' },
      },
    ],
    reachPrimary: 'shadow',
    reachSecondary: 'eye',
    encounterType: 'steal',
    threatRating: 'easy',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
    questPriority: 3.0,
  },

  {
    id: 'uk.quest.fence_goods',
    name: 'Fence Stolen Goods',
    locationTypes: ['city', 'capital'],
    steps: [
      {
        id: 'uk.quest.fence_goods.1',
        name: 'Appraise the Haul',
        narrative: 'Stolen goods need a buyer. Assess what you have.',
        reach: 'gold',
        difficulty: UK_DIFFICULTY_BASE,
        duration: 1,
        onSuccess: { narrative: 'The goods are valuable. Buyers will compete.' },
        onFailure: { narrative: 'Mostly junk. Slim pickings.' },
      },
      {
        id: 'uk.quest.fence_goods.2',
        name: 'Make the Deal',
        narrative: 'Meet the fence in the back alley. Negotiate your cut.',
        reach: 'gold',
        difficulty: UK_DIFFICULTY_BASE + UK_DIFFICULTY_STEP,
        duration: 1,
        onSuccess: {
          narrative: 'Good price. The court takes its share and you keep the rest.',
          rewardPool: {
            categoryWeights: { possession: 0.60, condition: 0.20, bestowed_power: 0.20 },
          },
        },
        onFailure: { narrative: 'The fence lowballs you. Take it or leave it.' },
      },
    ],
    reachPrimary: 'gold',
    reachSecondary: 'shadow',
    encounterType: 'trade',
    threatRating: 'easy',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    questPriority: 3.0,
  },

  {
    id: 'uk.quest.protection_racket',
    name: 'Run the Racket',
    locationTypes: ['city', 'capital'],
    steps: [
      {
        id: 'uk.quest.protection_racket.1',
        name: 'Visit the Shops',
        narrative: 'Collection day. Visit the merchants who pay for protection.',
        reach: 'gold',
        difficulty: UK_DIFFICULTY_BASE,
        duration: 2,
        onSuccess: { narrative: 'Everyone pays. No trouble today.' },
        onFailure: { narrative: 'A shopkeeper refuses. This requires escalation.' },
      },
      {
        id: 'uk.quest.protection_racket.2',
        name: 'Enforce Compliance',
        narrative: 'The holdout needs convincing. Words or fists, your choice.',
        reach: 'shadow',
        difficulty: UK_DIFFICULTY_BASE + UK_DIFFICULTY_STEP,
        duration: 1,
        onSuccess: { narrative: 'The merchant reconsiders. Payment received.', tierPromotionEligible: true },
        onFailure: { narrative: 'The merchant calls the guard. Time to disappear.' },
      },
    ],
    reachPrimary: 'gold',
    reachSecondary: 'shadow',
    encounterType: 'steal',
    threatRating: 'easy',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
    questPriority: 3.0,
  },

  {
    id: 'uk.quest.smuggle_cargo',
    name: 'Smuggle Cargo',
    locationTypes: ['city', 'capital'],
    steps: [
      {
        id: 'uk.quest.smuggle_cargo.1',
        name: 'Prepare the Route',
        narrative: 'Contraband needs moving past the gate watch. Plan the route.',
        reach: 'shadow',
        difficulty: UK_DIFFICULTY_BASE + 5,
        duration: 2,
        onSuccess: { narrative: 'A gap in the patrol schedule. Perfect timing.' },
        onFailure: { narrative: 'The watch has doubled. Risky business.' },
      },
      {
        id: 'uk.quest.smuggle_cargo.2',
        name: 'Move the Goods',
        narrative: 'Through the sewers, over the wall, or in a false-bottomed cart.',
        reach: 'shadow',
        difficulty: UK_DIFFICULTY_BASE + UK_DIFFICULTY_STEP + 5,
        duration: 2,
        onSuccess: {
          narrative: 'Cargo delivered. The court profits.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.30, bestowed_power: 0.20 },
          },
        },
        onFailure: { narrative: 'Intercepted. The cargo is lost and the guard has questions.' },
      },
    ],
    reachPrimary: 'shadow',
    reachSecondary: 'gold',
    encounterType: 'steal',
    threatRating: 'moderate',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
    questPriority: 3.0,
  },

  {
    id: 'uk.quest.blackmail_mark',
    name: 'Blackmail a Mark',
    locationTypes: ['city', 'capital'],
    steps: [
      {
        id: 'uk.quest.blackmail_mark.1',
        name: 'Gather Dirt',
        narrative: 'Every notable has secrets. Find something useful.',
        reach: 'shadow',
        difficulty: UK_DIFFICULTY_BASE + 5,
        duration: 2,
        onSuccess: { narrative: 'A scandal uncovered. Leverage acquired.' },
        onFailure: { narrative: 'Clean as a whistle, or better at hiding it than you.' },
      },
      {
        id: 'uk.quest.blackmail_mark.2',
        name: 'Apply Pressure',
        narrative: 'Deliver the ultimatum. Pay or be exposed.',
        reach: 'gold',
        difficulty: UK_DIFFICULTY_BASE + UK_DIFFICULTY_STEP,
        duration: 1,
        onSuccess: {
          narrative: 'The mark pays. A reliable income stream is born.',
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.30, bestowed_power: 0.20 },
          },
        },
        onFailure: { narrative: 'The mark calls your bluff. The dirt wasn\'t dirty enough.' },
      },
    ],
    reachPrimary: 'shadow',
    reachSecondary: 'gold',
    encounterType: 'trade',
    threatRating: 'moderate',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    questPriority: 3.0,
  },

  // ── Senior Quests (Enforcer+) ─────────────────────────────────

  {
    id: 'uk.senior.heist_planning',
    name: 'Plan the Heist',
    locationTypes: ['city', 'capital'],
    steps: [
      {
        id: 'uk.senior.heist_planning.1',
        name: 'Case the Target',
        narrative: 'A wealthy estate holds something the court wants. Study the defenses.',
        reach: 'eye',
        difficulty: UK_SENIOR_BASE,
        duration: 3,
        onSuccess: { narrative: 'Guard rotations mapped. Entry points identified.' },
        onFailure: { narrative: 'The estate is better guarded than expected.' },
      },
      {
        id: 'uk.senior.heist_planning.2',
        name: 'Execute the Job',
        narrative: 'In through the window, past the guards, into the vault.',
        reach: 'shadow',
        difficulty: UK_SENIOR_BASE + UK_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: {
          narrative: 'Clean job. The prize is yours and no one saw a thing.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.60, condition: 0.20, bestowed_power: 0.20 },
          },
        },
        onFailure: { narrative: 'Alarms triggered. You escape but the prize stays behind.' },
      },
    ],
    reachPrimary: 'shadow',
    reachSecondary: 'eye',
    encounterType: 'steal',
    threatRating: 'hard',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
    questPriority: 5.0,
  },

  {
    id: 'uk.senior.eliminate_rival',
    name: 'Eliminate a Rival',
    locationTypes: ['city', 'capital'],
    steps: [
      {
        id: 'uk.senior.eliminate_rival.1',
        name: 'Track the Target',
        narrative: 'A rival operator encroaches on court territory. Find them.',
        reach: 'shadow',
        difficulty: UK_SENIOR_BASE,
        duration: 2,
        onSuccess: { narrative: 'Target located. Vulnerable at their safe house.' },
        onFailure: { narrative: 'The rival is cautious. Hard to pin down.' },
      },
      {
        id: 'uk.senior.eliminate_rival.2',
        name: 'Send the Message',
        narrative: 'Remove the rival from the equation. The court\'s will is absolute.',
        reach: 'shadow',
        difficulty: UK_SENIOR_BASE + UK_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: {
          narrative: 'The rival is gone. Their operations fold into the court\'s.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.40, condition: 0.30, bestowed_power: 0.30 },
          },
        },
        onFailure: { narrative: 'The rival escapes. Now they know you\'re coming.' },
      },
    ],
    reachPrimary: 'shadow',
    reachSecondary: 'gold',
    encounterType: 'lead',
    threatRating: 'hard',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
    questPriority: 5.0,
  },

  {
    id: 'uk.senior.corrupt_official',
    name: 'Corrupt an Official',
    locationTypes: ['city', 'capital'],
    steps: [
      {
        id: 'uk.senior.corrupt_official.1',
        name: 'Identify Weakness',
        narrative: 'Find a city official with debts, vices, or ambition. Everyone has a price.',
        reach: 'eye',
        difficulty: UK_SENIOR_BASE,
        duration: 2,
        onSuccess: { narrative: 'A vulnerable official found. Debts piling up.' },
        onFailure: { narrative: 'This batch of officials is annoyingly honest.' },
      },
      {
        id: 'uk.senior.corrupt_official.2',
        name: 'Make the Offer',
        narrative: 'Gold, favors, or threats. Bring them into the fold.',
        reach: 'gold',
        difficulty: UK_SENIOR_BASE + UK_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: { narrative: 'The official accepts. A useful asset in the city hall.', tierPromotionEligible: true },
        onFailure: { narrative: 'They refuse and threaten to report you. Time to vanish.' },
      },
    ],
    reachPrimary: 'gold',
    reachSecondary: 'shadow',
    encounterType: 'steal',
    threatRating: 'moderate',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
    questPriority: 5.0,
  },

  // ── Elite Quests (Underboss+) ─────────────────────────────────

  {
    id: 'uk.elite.seize_territory',
    name: 'Seize Territory',
    locationTypes: ['city', 'capital'],
    steps: [
      {
        id: 'uk.elite.seize_territory.1',
        name: 'Weaken the Competition',
        narrative: 'An entire district must fall under court control. Undermine the current bosses.',
        reach: 'shadow',
        difficulty: UK_ELITE_BASE,
        duration: 3,
        onSuccess: { narrative: 'Their operations disrupted. Lieutenants bought off.' },
        onFailure: { narrative: 'The competition pushes back hard.' },
      },
      {
        id: 'uk.elite.seize_territory.2',
        name: 'Install Operations',
        narrative: 'Move your people in. Establish the rackets.',
        reach: 'gold',
        difficulty: UK_ELITE_BASE + UK_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: { narrative: 'New territory secured. Revenue flows.' },
        onFailure: { narrative: 'The district resists. Local loyalty runs deep.' },
      },
      {
        id: 'uk.elite.seize_territory.3',
        name: 'Consolidate Power',
        narrative: 'Hold what you\'ve taken. Reward the loyal, punish the defiant.',
        reach: 'shadow',
        difficulty: UK_ELITE_BASE + UK_DIFFICULTY_STEP * 2,
        duration: 3,
        onSuccess: {
          narrative: 'The district is yours. The Underking approves.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.30, condition: 0.30, bestowed_power: 0.40 },
          },
        },
        onFailure: { narrative: 'Cracks form. Holding territory is harder than taking it.' },
      },
    ],
    reachPrimary: 'shadow',
    reachSecondary: 'gold',
    encounterType: 'lead',
    threatRating: 'deadly',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
    questPriority: 8.0,
  },

  {
    id: 'uk.elite.shadow_coup',
    name: 'Shadow Coup',
    locationTypes: ['capital'],
    steps: [
      {
        id: 'uk.elite.shadow_coup.1',
        name: 'Build the Network',
        narrative: 'Place agents in key positions throughout the city\'s power structure.',
        reach: 'shadow',
        difficulty: UK_ELITE_BASE,
        duration: 3,
        onSuccess: { narrative: 'Agents in place. The web is woven.' },
        onFailure: { narrative: 'A double agent compromises the network.' },
      },
      {
        id: 'uk.elite.shadow_coup.2',
        name: 'Pull the Strings',
        narrative: 'Activate your assets. Manipulate the city\'s leadership from the shadows.',
        reach: 'gold',
        difficulty: UK_ELITE_BASE + UK_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: { narrative: 'Key decisions now flow through the court.' },
        onFailure: { narrative: 'Counter-intelligence exposes some agents.' },
      },
      {
        id: 'uk.elite.shadow_coup.3',
        name: 'Claim the Throne',
        narrative: 'The Underking demands total control. Make it happen.',
        reach: 'shadow',
        difficulty: UK_ELITE_BASE + UK_DIFFICULTY_STEP * 2,
        duration: 3,
        onSuccess: {
          narrative: 'The city belongs to the court. None are the wiser.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.20, condition: 0.30, bestowed_power: 0.50 },
          },
        },
        onFailure: { narrative: 'The coup unravels. Scapegoats are needed.' },
      },
    ],
    reachPrimary: 'shadow',
    reachSecondary: 'gold',
    encounterType: 'steal',
    threatRating: 'deadly',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
    questPriority: 8.0,
  },
];

// ─── Social Encounters ──────────────────────────────────────────────────

export const UNDERKING_COURT_SOCIAL_TEMPLATES: EncounterTemplate[] = [
  {
    id: 'uk.social.gambling_den',
    name: 'The Gambling Den',
    locationTypes: ['city', 'capital'],
    steps: [
      {
        id: 'uk.social.gambling_den.1',
        name: 'Play the Tables',
        narrative: 'Dice and cards in a smoke-filled room. Win or lose, connections are made.',
        reach: 'gold',
        difficulty: UK_DIFFICULTY_BASE,
        duration: 1,
        onSuccess: {
          narrative: 'Lucky night. You leave with heavier pockets and new contacts.',
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
          },
        },
        onFailure: { narrative: 'Bad luck. Lighter pockets but you learn who cheats.' },
      },
    ],
    reachPrimary: 'gold',
    reachSecondary: 'shadow',
    encounterType: 'trade',
    threatRating: 'easy',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
  },

  {
    id: 'uk.social.black_market',
    name: 'Black Market Browse',
    locationTypes: ['city', 'capital'],
    steps: [
      {
        id: 'uk.social.black_market.1',
        name: 'Browse the Wares',
        narrative: 'The underground market sells what no legitimate shop will. Browse carefully.',
        reach: 'gold',
        difficulty: UK_DIFFICULTY_BASE - 5,
        duration: 1,
        onSuccess: {
          narrative: 'A rare find at a reasonable price. Good deal.',
          rewardPool: {
            categoryWeights: { possession: 1.0 },
          },
        },
        onFailure: { narrative: 'Nothing worth buying today. The good stuff is gone.' },
      },
    ],
    reachPrimary: 'gold',
    reachSecondary: 'eye',
    encounterType: 'trade',
    threatRating: 'easy',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
  },

  {
    id: 'uk.social.whisper_network',
    name: 'Whisper Network',
    locationTypes: ['city', 'capital'],
    steps: [
      {
        id: 'uk.social.whisper_network.1',
        name: 'Trade Secrets',
        narrative: 'Information is currency in the court. Share a rumor, hear two.',
        reach: 'shadow',
        difficulty: UK_DIFFICULTY_BASE - 5,
        duration: 1,
        onSuccess: {
          narrative: 'Useful intelligence gained. Someone owes you a favor.',
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.50 },
          },
        },
        onFailure: { narrative: 'You gave more than you got. Poor trade.' },
      },
    ],
    reachPrimary: 'shadow',
    reachSecondary: 'gold',
    encounterType: 'trade',
    threatRating: 'easy',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
  },
];

// ─── Join & Promotion ───────────────────────────────────────────────────

export const UK_JOIN_TEMPLATE: EncounterTemplate = {
  id: 'uk.join',
  name: 'Prove Your Worth to the Court',
  locationTypes: ['city', 'capital'],
  steps: [
    {
      id: 'uk.join.1',
      name: 'The Test',
      narrative: 'The court demands proof of skill. Steal something valuable without being caught.',
      reach: 'shadow',
      difficulty: UK_JOIN_DIFFICULTY,
      duration: 1,
      onSuccess: { narrative: 'Clean work. You are a pawn of the court now.' },
      onFailure: { narrative: 'Too clumsy. The court has no use for amateurs.' },
    },
  ],
  reachPrimary: 'shadow',
  reachSecondary: 'gold',
  encounterType: 'steal',
  threatRating: 'easy',
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
  questPriority: 6.0,
};

export const UK_PROMOTION_TEMPLATE: EncounterTemplate = {
  id: 'uk.promotion',
  name: 'Court Advancement',
  locationTypes: ['city', 'capital'],
  steps: [
    {
      id: 'uk.promotion.1',
      name: 'The Proving',
      narrative: 'Higher rank requires a demonstration of cunning and ruthlessness.',
      reach: 'shadow',
      difficulty: UK_PROMOTION_DIFFICULTY,
      duration: 2,
      onSuccess: { narrative: 'The court elevates you. More power, more expectations.' },
      onFailure: { narrative: 'Not cunning enough. Remain where you are.' },
    },
  ],
  reachPrimary: 'shadow',
  reachSecondary: 'gold',
  encounterType: 'steal',
  threatRating: 'moderate',
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
  questPriority: 7.0,
};

export const UK_LIFECYCLE_TEMPLATES: readonly EncounterTemplate[] = [
  UK_JOIN_TEMPLATE,
  UK_PROMOTION_TEMPLATE,
];

// ─── Lookup ─────────────────────────────────────────────────────────────

/**
 * Look up an underking court encounter template by ID.
 */
export function getUnderkingCourtEncounterById(id: string): EncounterTemplate | undefined {
  return UNDERKING_COURT_ENCOUNTER_TEMPLATES.find(t => t.id === id)
    ?? UK_LIFECYCLE_TEMPLATES.find(t => t.id === id)
    ?? UNDERKING_COURT_SOCIAL_TEMPLATES.find(t => t.id === id);
}
