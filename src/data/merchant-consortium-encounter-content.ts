/**
 * Merchant Consortium Encounter Content — TB-073 Phase 0.
 *
 * Quest, social, join, and promotion templates for the merchant consortium.
 * Follows the same pattern as faction-encounter-content.ts.
 */

import type { EncounterTemplate } from '../types/encounter';
import { ENCOUNTER_TYPE_MOTIVATIONS } from '../types/encounter';
import type { FactionEncounterMeta } from '../types/faction';

// ─── Constants ───────────────────────────────────────────────────────────

const MCT_DIFFICULTY_BASE = 25;
const MCT_DIFFICULTY_STEP = 10;
const MCT_SENIOR_BASE = 40;
const MCT_ELITE_BASE = 55;
const MCT_JOIN_DIFFICULTY = 20;
const MCT_PROMOTION_DIFFICULTY = 35;

// ─── Faction Encounter Metadata Registry ─────────────────────────────────

export const MERCHANT_CONSORTIUM_ENCOUNTER_META: ReadonlyMap<string, FactionEncounterMeta> = new Map([
  // Join & Promotion
  ['mct.join', { factionDefId: 'merchant_consortium', minRank: 'apprentice', reputationReward: 0.0, questType: 'standard' }],
  ['mct.promotion', { factionDefId: 'merchant_consortium', minRank: 'apprentice', reputationReward: 0.0, questType: 'standard' }],
  // Standard quests
  ['mct.quest.market_survey', { factionDefId: 'merchant_consortium', minRank: 'apprentice', reputationReward: 0.04, questType: 'standard' }],
  ['mct.quest.negotiate_contract', { factionDefId: 'merchant_consortium', minRank: 'apprentice', reputationReward: 0.04, questType: 'standard' }],
  ['mct.quest.caravan_escort', { factionDefId: 'merchant_consortium', minRank: 'apprentice', reputationReward: 0.04, questType: 'standard' }],
  ['mct.quest.settle_dispute', { factionDefId: 'merchant_consortium', minRank: 'apprentice', reputationReward: 0.05, questType: 'standard' }],
  ['mct.quest.appraise_goods', { factionDefId: 'merchant_consortium', minRank: 'apprentice', reputationReward: 0.05, questType: 'standard' }],
  // Senior quests
  ['mct.senior.trade_monopoly', { factionDefId: 'merchant_consortium', minRank: 'guildsman', reputationReward: 0.06, questType: 'senior' }],
  ['mct.senior.foreign_deal', { factionDefId: 'merchant_consortium', minRank: 'guildsman', reputationReward: 0.06, questType: 'senior' }],
  ['mct.senior.acquire_warehouse', { factionDefId: 'merchant_consortium', minRank: 'guildsman', reputationReward: 0.06, questType: 'senior' }],
  // Elite quests
  ['mct.elite.trade_summit', { factionDefId: 'merchant_consortium', minRank: 'trade_prince', reputationReward: 0.08, questType: 'elite' }],
  ['mct.elite.market_domination', { factionDefId: 'merchant_consortium', minRank: 'trade_prince', reputationReward: 0.08, questType: 'elite' }],
  // Social encounters
  ['mct.social.wine_tasting', { factionDefId: 'merchant_consortium', minRank: 'apprentice', reputationReward: 0.02, questType: 'standard' }],
  ['mct.social.ledger_review', { factionDefId: 'merchant_consortium', minRank: 'apprentice', reputationReward: 0.02, questType: 'standard' }],
  ['mct.social.guild_feast', { factionDefId: 'merchant_consortium', minRank: 'apprentice', reputationReward: 0.02, questType: 'standard' }],
]);

// ─── Templates ───────────────────────────────────────────────────────────

export const MERCHANT_CONSORTIUM_ENCOUNTER_TEMPLATES: EncounterTemplate[] = [
  // ── Standard Quests (Apprentice+) ──────────────────────────────────

  {
    id: 'mct.quest.market_survey',
    name: 'Market Survey',
    locationTypes: ['town', 'city', 'capital'],
    steps: [
      {
        id: 'mct.quest.market_survey.1',
        name: 'Canvas the Stalls',
        narrative: 'The consortium needs price data. Walk the market and take notes.',
        reach: 'eye',
        difficulty: MCT_DIFFICULTY_BASE,
        duration: 2,
        onSuccess: { narrative: 'Detailed price lists compiled. The consortium is pleased.' },
        onFailure: { narrative: 'Incomplete data. Several merchants refused to share prices.' },
      },
      {
        id: 'mct.quest.market_survey.2',
        name: 'Analyze Trends',
        narrative: 'The numbers tell a story. Identify the profitable gaps.',
        reach: 'gold',
        difficulty: MCT_DIFFICULTY_BASE + MCT_DIFFICULTY_STEP,
        duration: 1,
        onSuccess: {
          narrative: 'A clear opportunity identified. The consortium will move quickly.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.60, condition: 0.30, bestowed_power: 0.10 },
            tagFilters: ['#gold'],
          },
        },
        onFailure: {
          narrative: 'The analysis is inconclusive. No clear trend emerges.',
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
          },
        },
      },
    ],
    reachPrimary: 'gold',
    reachSecondary: 'eye',
    encounterType: 'trade',
    threatRating: 'easy',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    questPriority: 3.0,
  },

  {
    id: 'mct.quest.negotiate_contract',
    name: 'Negotiate a Contract',
    locationTypes: ['town', 'city', 'capital'],
    steps: [
      {
        id: 'mct.quest.negotiate_contract.1',
        name: 'Read the Counterparty',
        narrative: 'A supplier offers terms. Understand what they really want.',
        reach: 'heart',
        difficulty: MCT_DIFFICULTY_BASE,
        duration: 1,
        onSuccess: { narrative: 'You read their priorities. Leverage identified.' },
        onFailure: { narrative: 'Their poker face holds. No advantage gained.' },
      },
      {
        id: 'mct.quest.negotiate_contract.2',
        name: 'Close the Deal',
        narrative: 'Put ink to paper. Secure favorable terms for the consortium.',
        reach: 'gold',
        difficulty: MCT_DIFFICULTY_BASE + MCT_DIFFICULTY_STEP,
        duration: 1,
        onSuccess: {
          narrative: 'Excellent terms secured. The consortium profits.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
            tagFilters: ['#gold'],
          },
        },
        onFailure: {
          narrative: 'Standard terms only. The consortium expected better.',
          rewardPool: {
            categoryWeights: { condition: 0.70, possession: 0.30 },
          },
        },
      },
    ],
    reachPrimary: 'gold',
    reachSecondary: 'heart',
    encounterType: 'trade',
    threatRating: 'easy',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    questPriority: 3.0,
  },

  {
    id: 'mct.quest.caravan_escort',
    name: 'Manage the Caravan',
    locationTypes: ['town', 'city', 'capital'],
    steps: [
      {
        id: 'mct.quest.caravan_escort.1',
        name: 'Organize the Wagons',
        narrative: 'A trade caravan departs soon. Ensure goods are loaded and guards hired.',
        reach: 'gold',
        difficulty: MCT_DIFFICULTY_BASE,
        duration: 2,
        onSuccess: { narrative: 'Well-organized. The caravan departs on schedule.' },
        onFailure: { narrative: 'Delays in loading. The caravan sets out late.' },
      },
      {
        id: 'mct.quest.caravan_escort.2',
        name: 'Deliver the Goods',
        narrative: 'The road is long. Keep the caravan moving and the goods intact.',
        reach: 'heart',
        difficulty: MCT_DIFFICULTY_BASE + MCT_DIFFICULTY_STEP,
        duration: 3,
        onSuccess: {
          narrative: 'All goods delivered intact. A profitable run.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.30, bestowed_power: 0.20 },
            tagFilters: ['#gold'],
          },
        },
        onFailure: {
          narrative: 'Spoilage and losses on the road. Thin margins.',
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
          },
        },
      },
    ],
    reachPrimary: 'gold',
    reachSecondary: 'heart',
    encounterType: 'trade',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    questPriority: 3.0,
  },

  {
    id: 'mct.quest.settle_dispute',
    name: 'Settle a Trade Dispute',
    locationTypes: ['city', 'capital'],
    steps: [
      {
        id: 'mct.quest.settle_dispute.1',
        name: 'Hear Both Sides',
        narrative: 'Two merchants claim the same shipment. The consortium arbitrates.',
        reach: 'heart',
        difficulty: MCT_DIFFICULTY_BASE + 5,
        duration: 2,
        onSuccess: { narrative: 'You understand the nuances. A fair ruling takes shape.' },
        onFailure: { narrative: 'Both sides are stubborn. No common ground yet.' },
      },
      {
        id: 'mct.quest.settle_dispute.2',
        name: 'Broker the Agreement',
        narrative: 'Craft a compromise that both parties can accept.',
        reach: 'gold',
        difficulty: MCT_DIFFICULTY_BASE + MCT_DIFFICULTY_STEP + 5,
        duration: 1,
        onSuccess: {
          narrative: 'Both parties sign. Commerce resumes smoothly.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.30, bestowed_power: 0.20 },
            tagFilters: ['#heart'],
          },
        },
        onFailure: {
          narrative: 'The dispute festers. The consortium notes your failure.',
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
          },
        },
      },
    ],
    reachPrimary: 'heart',
    reachSecondary: 'gold',
    encounterType: 'trade',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    questPriority: 3.0,
  },

  {
    id: 'mct.quest.appraise_goods',
    name: 'Appraise Rare Goods',
    locationTypes: ['town', 'city', 'capital'],
    steps: [
      {
        id: 'mct.quest.appraise_goods.1',
        name: 'Examine the Merchandise',
        narrative: 'A shipment of unusual goods arrives. Determine their true value.',
        reach: 'eye',
        difficulty: MCT_DIFFICULTY_BASE + 5,
        duration: 1,
        onSuccess: { narrative: 'You spot the genuine articles among the fakes.' },
        onFailure: { narrative: 'The goods are unfamiliar. Your estimate is uncertain.' },
      },
      {
        id: 'mct.quest.appraise_goods.2',
        name: 'Set the Price',
        narrative: 'Name your valuation. The consortium will trade on your word.',
        reach: 'gold',
        difficulty: MCT_DIFFICULTY_BASE + MCT_DIFFICULTY_STEP + 5,
        duration: 1,
        onSuccess: {
          narrative: 'Accurate appraisal. The consortium trades at profit.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.60, condition: 0.20, bestowed_power: 0.20 },
            tagFilters: ['#gold'],
          },
        },
        onFailure: {
          narrative: 'Your valuation was off. The consortium takes a loss.',
          rewardPool: {
            categoryWeights: { condition: 0.70, possession: 0.30 },
          },
        },
      },
    ],
    reachPrimary: 'gold',
    reachSecondary: 'eye',
    encounterType: 'acquire',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.acquire,
    questPriority: 3.0,
  },

  // ── Senior Quests (Guildsman+) ─────────────────────────────────

  {
    id: 'mct.senior.trade_monopoly',
    name: 'Establish Trade Monopoly',
    locationTypes: ['city', 'capital'],
    steps: [
      {
        id: 'mct.senior.trade_monopoly.1',
        name: 'Undercut Competitors',
        narrative: 'The consortium targets a specific commodity. Drive prices down.',
        reach: 'gold',
        difficulty: MCT_SENIOR_BASE,
        duration: 2,
        onSuccess: { narrative: 'Competitors struggle. Market share shifts your way.' },
        onFailure: { narrative: 'The competitors match your prices. A war of attrition.' },
      },
      {
        id: 'mct.senior.trade_monopoly.2',
        name: 'Lock In Suppliers',
        narrative: 'Secure exclusive contracts with key suppliers.',
        reach: 'heart',
        difficulty: MCT_SENIOR_BASE + MCT_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: {
          narrative: 'Exclusive rights secured. The consortium controls the supply.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.20, bestowed_power: 0.30 },
            tagFilters: ['#gold'],
          },
        },
        onFailure: {
          narrative: 'Suppliers demand too much. The monopoly plan stalls.',
          rewardPool: {
            categoryWeights: { condition: 0.70, possession: 0.30 },
          },
        },
      },
    ],
    reachPrimary: 'gold',
    reachSecondary: 'heart',
    encounterType: 'trade',
    reputationPolarity: 'negative', // predatory monopoly — undercut competitors and lock suppliers (2b)
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    questPriority: 5.0,
  },

  {
    id: 'mct.senior.foreign_deal',
    name: 'Foreign Trade Deal',
    locationTypes: ['city', 'capital'],
    steps: [
      {
        id: 'mct.senior.foreign_deal.1',
        name: 'Learn the Customs',
        narrative: 'Foreign merchants arrive with exotic goods. Understand their ways.',
        reach: 'heart',
        difficulty: MCT_SENIOR_BASE,
        duration: 2,
        onSuccess: { narrative: 'Cultural barriers navigated. Trust begins to build.' },
        onFailure: { narrative: 'A faux pas offends the delegation. Relations cool.' },
      },
      {
        id: 'mct.senior.foreign_deal.2',
        name: 'Seal the Pact',
        narrative: 'Propose terms that benefit both sides. Long-term trade routes at stake.',
        reach: 'gold',
        difficulty: MCT_SENIOR_BASE + MCT_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: {
          narrative: 'A new trade route opens. Exotic goods flow into the market.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.60, condition: 0.20, bestowed_power: 0.20 },
            tagFilters: ['#gold'],
          },
        },
        onFailure: {
          narrative: 'The foreigners walk away. The opportunity is lost.',
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
          },
        },
      },
    ],
    reachPrimary: 'gold',
    reachSecondary: 'heart',
    encounterType: 'trade',
    reputationPolarity: 'positive', // diplomatic fair trade with foreign delegation (2a)
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    questPriority: 5.0,
  },

  {
    id: 'mct.senior.acquire_warehouse',
    name: 'Acquire a Warehouse',
    locationTypes: ['city', 'capital'],
    steps: [
      {
        id: 'mct.senior.acquire_warehouse.1',
        name: 'Survey Available Properties',
        narrative: 'The consortium needs more storage. Find the right building.',
        reach: 'eye',
        difficulty: MCT_SENIOR_BASE,
        duration: 2,
        onSuccess: { narrative: 'A suitable warehouse identified near the docks.' },
        onFailure: { narrative: 'Nothing available in the right location.' },
      },
      {
        id: 'mct.senior.acquire_warehouse.2',
        name: 'Negotiate the Purchase',
        narrative: 'The owner names a price. Haggle it down.',
        reach: 'gold',
        difficulty: MCT_SENIOR_BASE + MCT_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: {
          narrative: 'Keys in hand. The consortium expands its storage.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.30, bestowed_power: 0.20 },
            tagFilters: ['#gold'],
          },
        },
        onFailure: {
          narrative: 'The price is too high. The deal falls through.',
          rewardPool: {
            categoryWeights: { condition: 0.70, possession: 0.30 },
          },
        },
      },
    ],
    reachPrimary: 'gold',
    reachSecondary: 'eye',
    encounterType: 'acquire',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.acquire,
    questPriority: 5.0,
  },

  // ── Elite Quests (Trade Prince+) ────────────────────────────────────

  {
    id: 'mct.elite.trade_summit',
    name: 'Trade Summit',
    locationTypes: ['capital'],
    steps: [
      {
        id: 'mct.elite.trade_summit.1',
        name: 'Organize the Summit',
        narrative: 'Gather the most powerful merchants for a regional trade summit.',
        reach: 'heart',
        difficulty: MCT_ELITE_BASE,
        duration: 2,
        onSuccess: { narrative: 'All major factions send representatives. The summit convenes.' },
        onFailure: { narrative: 'Key players decline. The summit lacks weight.' },
      },
      {
        id: 'mct.elite.trade_summit.2',
        name: 'Propose the Charter',
        narrative: 'Present a unified trade charter that cements consortium dominance.',
        reach: 'gold',
        difficulty: MCT_ELITE_BASE + MCT_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: { narrative: 'The charter finds support. Signatures begin to flow.' },
        onFailure: { narrative: 'Opposition blocks key clauses. Deadlock.' },
      },
      {
        id: 'mct.elite.trade_summit.3',
        name: 'Seal the Accord',
        narrative: 'Final negotiations. Shape the future of trade in the region.',
        reach: 'heart',
        difficulty: MCT_ELITE_BASE + MCT_DIFFICULTY_STEP * 2,
        duration: 2,
        onSuccess: {
          narrative: 'The accord is signed. The consortium shapes regional commerce.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.40, condition: 0.20, bestowed_power: 0.40 },
            tagFilters: ['#gold'],
          },
        },
        onFailure: {
          narrative: 'The summit collapses. Rival factions grow bolder.',
          rewardPool: {
            categoryWeights: { condition: 0.70, possession: 0.30 },
          },
        },
      },
    ],
    reachPrimary: 'gold',
    reachSecondary: 'heart',
    encounterType: 'lead',
    threatRating: 'deadly',
    intrinsicTier: 'story_beat',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
    questPriority: 8.0,
  },

  {
    id: 'mct.elite.market_domination',
    name: 'Market Domination',
    locationTypes: ['city', 'capital'],
    steps: [
      {
        id: 'mct.elite.market_domination.1',
        name: 'Map the Competition',
        narrative: 'Identify every rival merchant operation in the region.',
        reach: 'eye',
        difficulty: MCT_ELITE_BASE,
        duration: 2,
        onSuccess: { narrative: 'Every competitor catalogued. Weaknesses noted.' },
        onFailure: { narrative: 'Some operations are hidden well. Incomplete picture.' },
      },
      {
        id: 'mct.elite.market_domination.2',
        name: 'Execute the Strategy',
        narrative: 'Undercut, buy out, or ally with every competitor simultaneously.',
        reach: 'gold',
        difficulty: MCT_ELITE_BASE + MCT_DIFFICULTY_STEP,
        duration: 3,
        onSuccess: { narrative: 'Competitors fall in line. The consortium leads.' },
        onFailure: { narrative: 'A coalition forms against you. The market resists.' },
      },
      {
        id: 'mct.elite.market_domination.3',
        name: 'Consolidate Power',
        narrative: 'With competitors weakened, cement total market control.',
        reach: 'gold',
        difficulty: MCT_ELITE_BASE + MCT_DIFFICULTY_STEP * 2,
        duration: 2,
        onSuccess: {
          narrative: 'The market bends to the consortium. Trade flows through you.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.20, bestowed_power: 0.30 },
            tagFilters: ['#gold'],
          },
        },
        onFailure: {
          narrative: 'Overextended. The consortium retreats to core holdings.',
          rewardPool: {
            categoryWeights: { condition: 0.70, possession: 0.30 },
          },
        },
      },
    ],
    reachPrimary: 'gold',
    reachSecondary: 'eye',
    encounterType: 'trade',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    questPriority: 8.0,
  },
];

// ─── Social Encounters ──────────────────────────────────────────────────

export const MERCHANT_CONSORTIUM_SOCIAL_TEMPLATES: EncounterTemplate[] = [
  {
    id: 'mct.social.wine_tasting',
    name: 'Wine Tasting Evening',
    locationTypes: ['city', 'capital'],
    steps: [
      {
        id: 'mct.social.wine_tasting.1',
        name: 'Sample the Vintages',
        narrative: 'The consortium hosts a tasting of imported wines. Connections are made over cups.',
        reach: 'heart',
        difficulty: MCT_DIFFICULTY_BASE - 5,
        duration: 1,
        onSuccess: {
          narrative: 'You charm the right people. New contacts added to your ledger.',
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
            tagFilters: ['#heart'],
          },
        },
        onFailure: { narrative: 'An awkward spill. You leave before the embarrassment deepens.' },
      },
    ],
    reachPrimary: 'heart',
    reachSecondary: 'gold',
    encounterType: 'trade',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
  },

  {
    id: 'mct.social.ledger_review',
    name: 'Quarterly Ledger Review',
    locationTypes: ['town', 'city', 'capital'],
    steps: [
      {
        id: 'mct.social.ledger_review.1',
        name: 'Present the Numbers',
        narrative: 'The consortium meets to review quarterly accounts. Show your work.',
        reach: 'gold',
        difficulty: MCT_DIFFICULTY_BASE - 5,
        duration: 1,
        onSuccess: {
          narrative: 'Clean books. The factors nod approval.',
          rewardPool: {
            categoryWeights: { possession: 0.80, condition: 0.20 },
            tagFilters: ['#gold'],
          },
        },
        onFailure: { narrative: 'Discrepancies in the ledger. Uncomfortable questions follow.' },
      },
    ],
    reachPrimary: 'gold',
    reachSecondary: 'eye',
    encounterType: 'trade',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
  },

  {
    id: 'mct.social.guild_feast',
    name: 'Consortium Feast',
    locationTypes: ['city', 'capital'],
    steps: [
      {
        id: 'mct.social.guild_feast.1',
        name: 'Work the Room',
        narrative: 'The annual feast brings every consortium member together. Network and deal.',
        reach: 'heart',
        difficulty: MCT_DIFFICULTY_BASE - 5,
        duration: 1,
        onSuccess: {
          narrative: 'Handshakes and promises. Your standing in the consortium grows.',
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#heart'],
          },
        },
        onFailure: { narrative: 'You fail to make an impression. A forgettable evening.' },
      },
    ],
    reachPrimary: 'heart',
    reachSecondary: 'gold',
    encounterType: 'trade',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
  },
];

// ─── Join & Promotion ───────────────────────────────────────────────────

export const MCT_JOIN_TEMPLATE: EncounterTemplate = {
  id: 'mct.join',
  name: 'Join the Merchant Consortium',
  locationTypes: ['town', 'city', 'capital'],
  steps: [
    {
      id: 'mct.join.1',
      name: 'The Entrance Examination',
      narrative: 'The consortium tests your commercial acumen. Solve a trade problem.',
      reach: 'gold',
      difficulty: MCT_JOIN_DIFFICULTY,
      duration: 1,
      onSuccess: { narrative: 'Sound reasoning. The consortium accepts your application.' },
      onFailure: { narrative: 'Your grasp of commerce is lacking. Study and return.' },
    },
  ],
  reachPrimary: 'gold',
  reachSecondary: 'heart',
  encounterType: 'trade',
  threatRating: 'easy',
  intrinsicTier: 'shaping',
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
  questPriority: 6.0,
};

export const MCT_PROMOTION_TEMPLATE: EncounterTemplate = {
  id: 'mct.promotion',
  name: 'Consortium Advancement',
  locationTypes: ['town', 'city', 'capital'],
  steps: [
    {
      id: 'mct.promotion.1',
      name: 'The Profit Test',
      narrative: 'Higher rank requires demonstrated profit. Present your portfolio.',
      reach: 'gold',
      difficulty: MCT_PROMOTION_DIFFICULTY,
      duration: 2,
      onSuccess: { narrative: 'Impressive returns. Your new title is announced at the next assembly.' },
      onFailure: { narrative: 'The numbers fall short. The consortium expects more.' },
    },
  ],
  reachPrimary: 'gold',
  reachSecondary: 'heart',
  encounterType: 'trade',
  threatRating: 'moderate',
  intrinsicTier: 'shaping',
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
  questPriority: 7.0,
};

export const MCT_LIFECYCLE_TEMPLATES: readonly EncounterTemplate[] = [
  MCT_JOIN_TEMPLATE,
  MCT_PROMOTION_TEMPLATE,
];

// ─── Lookup ─────────────────────────────────────────────────────────────

/**
 * Look up a merchant consortium encounter template by ID.
 */
export function getMerchantConsortiumEncounterById(id: string): EncounterTemplate | undefined {
  return MERCHANT_CONSORTIUM_ENCOUNTER_TEMPLATES.find(t => t.id === id)
    ?? MCT_LIFECYCLE_TEMPLATES.find(t => t.id === id)
    ?? MERCHANT_CONSORTIUM_SOCIAL_TEMPLATES.find(t => t.id === id);
}
