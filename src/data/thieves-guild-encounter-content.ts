/**
 * Thieves Guild Encounter Content — TB-073 Phase 0.
 *
 * Quest, social, join, and promotion templates for the thieves guild.
 * Follows the same pattern as faction-encounter-content.ts.
 */

import type { EncounterTemplate } from '../types/encounter';
import { ENCOUNTER_TYPE_MOTIVATIONS } from '../types/encounter';
import type { FactionEncounterMeta } from '../types/faction';

// ─── Constants ───────────────────────────────────────────────────────────

const TG_DIFFICULTY_BASE = 25;
const TG_DIFFICULTY_STEP = 10;
const TG_SENIOR_BASE = 40;
const TG_ELITE_BASE = 55;
const TG_JOIN_DIFFICULTY = 20;
const TG_PROMOTION_DIFFICULTY = 35;

// ─── Faction Encounter Metadata Registry ─────────────────────────────────

export const THIEVES_GUILD_ENCOUNTER_META: ReadonlyMap<string, FactionEncounterMeta> = new Map([
  // Join & Promotion
  ['tg.join', { factionDefId: 'thieves_guild', minRank: 'pickpocket', reputationReward: 0.0, questType: 'standard' }],
  ['tg.promotion', { factionDefId: 'thieves_guild', minRank: 'pickpocket', reputationReward: 0.0, questType: 'standard' }],
  // Standard quests
  ['tg.quest.pocket_run', { factionDefId: 'thieves_guild', minRank: 'pickpocket', reputationReward: 0.04, questType: 'standard' }],
  ['tg.quest.fence_goods', { factionDefId: 'thieves_guild', minRank: 'pickpocket', reputationReward: 0.04, questType: 'standard' }],
  ['tg.quest.case_the_mark', { factionDefId: 'thieves_guild', minRank: 'pickpocket', reputationReward: 0.04, questType: 'standard' }],
  ['tg.quest.warehouse_raid', { factionDefId: 'thieves_guild', minRank: 'pickpocket', reputationReward: 0.05, questType: 'standard' }],
  ['tg.quest.blackmail_ledger', { factionDefId: 'thieves_guild', minRank: 'pickpocket', reputationReward: 0.05, questType: 'standard' }],
  // Senior quests
  ['tg.senior.jewel_heist', { factionDefId: 'thieves_guild', minRank: 'shadowblade', reputationReward: 0.06, questType: 'senior' }],
  ['tg.senior.smuggler_route', { factionDefId: 'thieves_guild', minRank: 'shadowblade', reputationReward: 0.06, questType: 'senior' }],
  ['tg.senior.noble_con', { factionDefId: 'thieves_guild', minRank: 'shadowblade', reputationReward: 0.06, questType: 'senior' }],
  // Elite quests
  ['tg.elite.vault_break', { factionDefId: 'thieves_guild', minRank: 'guildmaster', reputationReward: 0.08, questType: 'elite' }],
  ['tg.elite.shadow_war', { factionDefId: 'thieves_guild', minRank: 'guildmaster', reputationReward: 0.08, questType: 'elite' }],
  // Social encounters
  ['tg.social.dice_game', { factionDefId: 'thieves_guild', minRank: 'pickpocket', reputationReward: 0.02, questType: 'standard' }],
  ['tg.social.fence_deal', { factionDefId: 'thieves_guild', minRank: 'pickpocket', reputationReward: 0.02, questType: 'standard' }],
  ['tg.social.rumor_trade', { factionDefId: 'thieves_guild', minRank: 'pickpocket', reputationReward: 0.02, questType: 'standard' }],
]);

// ─── Templates ───────────────────────────────────────────────────────────

export const THIEVES_GUILD_ENCOUNTER_TEMPLATES: EncounterTemplate[] = [
  // ── Standard Quests (Pickpocket+) ──────────────────────────────────

  {
    id: 'tg.quest.pocket_run',
    name: 'Pocket Run',
    locationTypes: ['town', 'city', 'capital'],
    steps: [
      {
        id: 'tg.quest.pocket_run.1',
        name: 'Scout the Crowd',
        narrative: 'The guild assigns a busy market square. You study the flow of coin.',
        reach: 'eye',
        difficulty: TG_DIFFICULTY_BASE,
        duration: 1,
        onSuccess: { narrative: 'You spot several easy marks among the shoppers.' },
        onFailure: { narrative: 'The crowd is thin today. Slim pickings.' },
      },
      {
        id: 'tg.quest.pocket_run.2',
        name: 'Lift the Purses',
        narrative: 'Nimble fingers and a steady nerve. Time to work.',
        reach: 'shadow',
        difficulty: TG_DIFFICULTY_BASE + TG_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: {
          narrative: 'A good haul. The guild takes its cut and nods approval.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.60, condition: 0.25, bestowed_power: 0.15 },
            tagFilters: ['#gold'],
          },
        },
        onFailure: {
          narrative: 'A mark grabs your wrist. You twist free but the haul is lost.',
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
          },
        },
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
    id: 'tg.quest.fence_goods',
    name: 'Fence Stolen Goods',
    locationTypes: ['town', 'city', 'capital'],
    steps: [
      {
        id: 'tg.quest.fence_goods.1',
        name: 'Appraise the Take',
        narrative: 'A sack of stolen wares needs valuing before the fence will deal.',
        reach: 'gold',
        difficulty: TG_DIFFICULTY_BASE,
        duration: 1,
        onSuccess: { narrative: 'You know what each piece is worth. Good leverage.' },
        onFailure: { narrative: 'You misjudge the value. The fence will smell weakness.' },
      },
      {
        id: 'tg.quest.fence_goods.2',
        name: 'Negotiate the Price',
        narrative: 'The fence examines the goods. Every coin counts.',
        reach: 'gold',
        difficulty: TG_DIFFICULTY_BASE + TG_DIFFICULTY_STEP,
        duration: 1,
        onSuccess: {
          narrative: 'A fair split. The guild is pleased with your returns.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
            tagFilters: ['#gold'],
          },
        },
        onFailure: {
          narrative: 'The fence lowballs you. Thin coin for risky work.',
          rewardPool: {
            categoryWeights: { condition: 0.70, possession: 0.30 },
          },
        },
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
    id: 'tg.quest.case_the_mark',
    name: 'Case the Mark',
    locationTypes: ['town', 'city', 'capital'],
    steps: [
      {
        id: 'tg.quest.case_the_mark.1',
        name: 'Observe the Target',
        narrative: 'A wealthy merchant needs watching. Learn the routine.',
        reach: 'eye',
        difficulty: TG_DIFFICULTY_BASE,
        duration: 2,
        onSuccess: { narrative: 'You map the schedule. Every guard shift, every delivery.' },
        onFailure: { narrative: 'The target is erratic. No clear pattern emerges.' },
      },
      {
        id: 'tg.quest.case_the_mark.2',
        name: 'Chart the Entry',
        narrative: 'With the routine known, find the way in.',
        reach: 'shadow',
        difficulty: TG_DIFFICULTY_BASE + TG_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: {
          narrative: 'A back window, a bribed guard. The route is mapped.',
          tierPromotionEligible: true,
        },
        onFailure: { narrative: 'Every entry is watched. The job needs more planning.' },
      },
    ],
    reachPrimary: 'shadow',
    reachSecondary: 'eye',
    encounterType: 'steal',
    threatRating: 'moderate',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
    questPriority: 3.0,
  },

  {
    id: 'tg.quest.warehouse_raid',
    name: 'Warehouse Raid',
    locationTypes: ['city', 'capital'],
    steps: [
      {
        id: 'tg.quest.warehouse_raid.1',
        name: 'Disable the Locks',
        narrative: 'The warehouse is sealed tight. Picks and patience.',
        reach: 'shadow',
        difficulty: TG_DIFFICULTY_BASE + 5,
        duration: 2,
        onSuccess: { narrative: 'The lock clicks open. You slip inside.' },
        onFailure: { narrative: 'The lock resists. You need better tools.' },
      },
      {
        id: 'tg.quest.warehouse_raid.2',
        name: 'Grab and Go',
        narrative: 'Inside the warehouse. Take what you can carry and get out.',
        reach: 'shadow',
        difficulty: TG_DIFFICULTY_BASE + TG_DIFFICULTY_STEP + 5,
        duration: 2,
        onSuccess: {
          narrative: 'A clean job. The crates are lighter and nobody knows.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.60, condition: 0.20, bestowed_power: 0.20 },
            tagFilters: ['#shadow'],
          },
        },
        onFailure: {
          narrative: 'A watchman rounds the corner. You drop the goods and run.',
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
          },
        },
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
    id: 'tg.quest.blackmail_ledger',
    name: 'Blackmail Ledger',
    locationTypes: ['city', 'capital'],
    steps: [
      {
        id: 'tg.quest.blackmail_ledger.1',
        name: 'Infiltrate the Office',
        narrative: 'A noble keeps damaging records. The guild wants a copy.',
        reach: 'shadow',
        difficulty: TG_DIFFICULTY_BASE + 5,
        duration: 2,
        onSuccess: { narrative: 'You slip past the servants and find the study.' },
        onFailure: { narrative: 'A locked inner door blocks your path.' },
      },
      {
        id: 'tg.quest.blackmail_ledger.2',
        name: 'Copy the Ledger',
        narrative: 'The book is on the desk. Transcribe the key entries.',
        reach: 'eye',
        difficulty: TG_DIFFICULTY_BASE + TG_DIFFICULTY_STEP + 5,
        duration: 2,
        onSuccess: {
          narrative: 'Damning entries copied. The guild has leverage now.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.40, condition: 0.30, bestowed_power: 0.30 },
            tagFilters: ['#shadow'],
          },
        },
        onFailure: {
          narrative: 'Footsteps in the hall. You flee with only fragments.',
          rewardPool: {
            categoryWeights: { condition: 0.70, possession: 0.30 },
          },
        },
      },
    ],
    reachPrimary: 'shadow',
    reachSecondary: 'eye',
    encounterType: 'acquire',
    threatRating: 'moderate',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.acquire,
    questPriority: 3.0,
  },

  // ── Senior Quests (Shadowblade+) ─────────────────────────────────

  {
    id: 'tg.senior.jewel_heist',
    name: 'The Jewel Heist',
    locationTypes: ['city', 'capital'],
    steps: [
      {
        id: 'tg.senior.jewel_heist.1',
        name: 'Case the Jeweler',
        narrative: 'A master jeweler keeps a fortune behind wards and guards.',
        reach: 'eye',
        difficulty: TG_SENIOR_BASE,
        duration: 2,
        onSuccess: { narrative: 'You find the weak point. A window, a schedule gap.' },
        onFailure: { narrative: 'The security is tight. No obvious entry.' },
      },
      {
        id: 'tg.senior.jewel_heist.2',
        name: 'Bypass the Wards',
        narrative: 'Magical wards protect the display case. Finesse required.',
        reach: 'shadow',
        difficulty: TG_SENIOR_BASE + TG_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: { narrative: 'The wards flicker and die. The case is vulnerable.' },
        onFailure: { narrative: 'The ward triggers an alarm. Time is running out.' },
      },
      {
        id: 'tg.senior.jewel_heist.3',
        name: 'Extract the Gems',
        narrative: 'The jewels glitter in the dark. Take them and vanish.',
        reach: 'shadow',
        difficulty: TG_SENIOR_BASE + TG_DIFFICULTY_STEP * 2,
        duration: 1,
        onSuccess: {
          narrative: 'A perfect heist. The guild celebrates your craft.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.60, condition: 0.20, bestowed_power: 0.20 },
            tagFilters: ['#gold'],
          },
        },
        onFailure: {
          narrative: 'Guards close in. You escape but the gems stay behind.',
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
          },
        },
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
    id: 'tg.senior.smuggler_route',
    name: 'Establish Smuggler Route',
    locationTypes: ['town', 'city', 'capital'],
    steps: [
      {
        id: 'tg.senior.smuggler_route.1',
        name: 'Bribe the Officials',
        narrative: 'The guild needs a new route past the customs. Find the right palms to grease.',
        reach: 'gold',
        difficulty: TG_SENIOR_BASE,
        duration: 2,
        onSuccess: { narrative: 'A customs officer accepts the pouch. The gate is open.' },
        onFailure: { narrative: 'The official is incorruptible. Another way is needed.' },
      },
      {
        id: 'tg.senior.smuggler_route.2',
        name: 'Test the Route',
        narrative: 'Send a small shipment through to prove the path works.',
        reach: 'shadow',
        difficulty: TG_SENIOR_BASE + TG_DIFFICULTY_STEP,
        duration: 3,
        onSuccess: {
          narrative: 'The goods pass without inspection. Route established.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.30, bestowed_power: 0.20 },
            tagFilters: ['#gold'],
          },
        },
        onFailure: {
          narrative: 'The shipment is seized. The route is compromised.',
          rewardPool: {
            categoryWeights: { condition: 0.70, possession: 0.30 },
          },
        },
      },
    ],
    reachPrimary: 'shadow',
    reachSecondary: 'gold',
    encounterType: 'steal',
    threatRating: 'moderate',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
    questPriority: 5.0,
  },

  {
    id: 'tg.senior.noble_con',
    name: 'The Noble Con',
    locationTypes: ['city', 'capital'],
    steps: [
      {
        id: 'tg.senior.noble_con.1',
        name: 'Build the Identity',
        narrative: 'To con a noble, you must become one. Forge the documents.',
        reach: 'shadow',
        difficulty: TG_SENIOR_BASE,
        duration: 2,
        onSuccess: { narrative: 'Convincing papers. Even a herald would nod.' },
        onFailure: { narrative: 'The forgery is rough. It might not hold up.' },
      },
      {
        id: 'tg.senior.noble_con.2',
        name: 'Play the Part',
        narrative: 'Enter the noble court and extract what the guild needs.',
        reach: 'gold',
        difficulty: TG_SENIOR_BASE + TG_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: {
          narrative: 'The noble never suspects. You leave richer in coin and secrets.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.20, bestowed_power: 0.30 },
            tagFilters: ['#shadow'],
          },
        },
        onFailure: {
          narrative: 'A courtier sees through the act. You exit before guards arrive.',
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
          },
        },
      },
    ],
    reachPrimary: 'shadow',
    reachSecondary: 'gold',
    encounterType: 'steal',
    threatRating: 'hard',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
    questPriority: 5.0,
  },

  // ── Elite Quests (Guildmaster+) ────────────────────────────────────

  {
    id: 'tg.elite.vault_break',
    name: 'The Vault Break',
    locationTypes: ['capital'],
    steps: [
      {
        id: 'tg.elite.vault_break.1',
        name: 'Map the Defenses',
        narrative: 'The city vault holds a fortune. Study every guard, every ward, every lock.',
        reach: 'eye',
        difficulty: TG_ELITE_BASE,
        duration: 3,
        onSuccess: { narrative: 'Every defense catalogued. The plan takes shape.' },
        onFailure: { narrative: 'The vault security is deeper than anticipated.' },
      },
      {
        id: 'tg.elite.vault_break.2',
        name: 'Assemble the Crew',
        narrative: 'This job needs specialists. Gather the best the guild has.',
        reach: 'gold',
        difficulty: TG_ELITE_BASE + TG_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: { narrative: 'Lockpick, lookout, tunneler. The crew is ready.' },
        onFailure: { narrative: 'Key specialists refuse. The risk is too high.' },
      },
      {
        id: 'tg.elite.vault_break.3',
        name: 'Crack the Vault',
        narrative: 'Night falls. The crew moves. Everything rides on this.',
        reach: 'shadow',
        difficulty: TG_ELITE_BASE + TG_DIFFICULTY_STEP * 2,
        duration: 3,
        onSuccess: {
          narrative: 'The vault opens. A legend is born in the underworld.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.20, bestowed_power: 0.30 },
            tagFilters: ['#shadow'],
          },
        },
        onFailure: {
          narrative: 'Alarms sound. The crew scatters. A costly failure.',
          rewardPool: {
            categoryWeights: { condition: 0.70, possession: 0.30 },
          },
        },
      },
    ],
    reachPrimary: 'shadow',
    reachSecondary: 'gold',
    encounterType: 'steal',
    threatRating: 'deadly',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
    questPriority: 8.0,
  },

  {
    id: 'tg.elite.shadow_war',
    name: 'Shadow War',
    locationTypes: ['city', 'capital'],
    steps: [
      {
        id: 'tg.elite.shadow_war.1',
        name: 'Identify the Rival',
        narrative: 'A rival guild encroaches on territory. Find their leaders.',
        reach: 'eye',
        difficulty: TG_ELITE_BASE,
        duration: 2,
        onSuccess: { narrative: 'Their hideouts and lieutenants are mapped.' },
        onFailure: { narrative: 'The rivals are well hidden. More digging needed.' },
      },
      {
        id: 'tg.elite.shadow_war.2',
        name: 'Strike the Operations',
        narrative: 'Disrupt their smuggling, their fences, their safe houses.',
        reach: 'shadow',
        difficulty: TG_ELITE_BASE + TG_DIFFICULTY_STEP,
        duration: 3,
        onSuccess: { narrative: 'Their operations crumble. Revenue dries up.' },
        onFailure: { narrative: 'They anticipated the strike. Counter-attack incoming.' },
      },
      {
        id: 'tg.elite.shadow_war.3',
        name: 'Eliminate the Leadership',
        narrative: 'End the war decisively. The rival boss must fall.',
        reach: 'iron',
        difficulty: TG_ELITE_BASE + TG_DIFFICULTY_STEP * 2,
        duration: 2,
        onSuccess: {
          narrative: 'The rival guild collapses. Your territory is secure.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.40, condition: 0.30, bestowed_power: 0.30 },
            tagFilters: ['#shadow'],
          },
        },
        onFailure: {
          narrative: 'The rival boss escapes. The war drags on.',
          rewardPool: {
            categoryWeights: { condition: 0.70, possession: 0.30 },
          },
        },
      },
    ],
    reachPrimary: 'shadow',
    reachSecondary: 'iron',
    encounterType: 'duel',
    threatRating: 'hard',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    questPriority: 8.0,
  },
];

// ─── Social Encounters ──────────────────────────────────────────────────

export const THIEVES_GUILD_SOCIAL_TEMPLATES: EncounterTemplate[] = [
  {
    id: 'tg.social.dice_game',
    name: 'Back-Alley Dice',
    locationTypes: ['town', 'city', 'capital'],
    steps: [
      {
        id: 'tg.social.dice_game.1',
        name: 'Roll the Bones',
        narrative: 'A circle of thieves throw dice in a dim alley. Coin changes hands fast.',
        reach: 'shadow',
        difficulty: TG_DIFFICULTY_BASE - 5,
        duration: 1,
        onSuccess: {
          narrative: 'Lucky throws. You walk away with heavier pockets.',
          rewardPool: {
            categoryWeights: { possession: 0.80, condition: 0.20 },
            tagFilters: ['#gold'],
          },
        },
        onFailure: { narrative: 'The dice are cold. You lose your stake.' },
      },
    ],
    reachPrimary: 'shadow',
    reachSecondary: 'gold',
    encounterType: 'steal',
    threatRating: 'easy',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
  },

  {
    id: 'tg.social.fence_deal',
    name: 'Meet the Fence',
    locationTypes: ['town', 'city', 'capital'],
    steps: [
      {
        id: 'tg.social.fence_deal.1',
        name: 'Show the Goods',
        narrative: 'A fence evaluates your latest acquisitions in a smoky back room.',
        reach: 'gold',
        difficulty: TG_DIFFICULTY_BASE - 5,
        duration: 1,
        onSuccess: {
          narrative: 'Good prices. The fence offers a standing arrangement.',
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
            tagFilters: ['#gold'],
          },
        },
        onFailure: { narrative: 'The fence shakes their head. Not worth the risk.' },
      },
    ],
    reachPrimary: 'gold',
    reachSecondary: 'shadow',
    encounterType: 'trade',
    threatRating: 'easy',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
  },

  {
    id: 'tg.social.rumor_trade',
    name: 'Trade Rumors',
    locationTypes: ['town', 'city', 'capital'],
    steps: [
      {
        id: 'tg.social.rumor_trade.1',
        name: 'Exchange Whispers',
        narrative: 'Information is currency. Share what you know, learn what you need.',
        reach: 'shadow',
        difficulty: TG_DIFFICULTY_BASE - 5,
        duration: 1,
        onSuccess: {
          narrative: 'A tip about a wealthy traveler. Opportunity knocks.',
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#shadow'],
          },
        },
        onFailure: { narrative: 'Nothing useful. Stale gossip and old news.' },
      },
    ],
    reachPrimary: 'shadow',
    reachSecondary: 'eye',
    encounterType: 'steal',
    threatRating: 'easy',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
  },
];

// ─── Join & Promotion ───────────────────────────────────────────────────

export const TG_JOIN_TEMPLATE: EncounterTemplate = {
  id: 'tg.join',
  name: 'Join the Thieves Guild',
  locationTypes: ['town', 'city', 'capital'],
  steps: [
    {
      id: 'tg.join.1',
      name: 'Prove Your Fingers',
      narrative: 'The guild tests prospects by watching them lift a coin purse in the market.',
      reach: 'shadow',
      difficulty: TG_JOIN_DIFFICULTY,
      duration: 1,
      onSuccess: { narrative: 'Clean lift. The guild opens its doors to you.' },
      onFailure: { narrative: 'Clumsy hands. Come back when you can work a crowd.' },
    },
  ],
  reachPrimary: 'shadow',
  reachSecondary: 'gold',
  encounterType: 'steal',
  threatRating: 'easy',
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
  questPriority: 6.0,
};

export const TG_PROMOTION_TEMPLATE: EncounterTemplate = {
  id: 'tg.promotion',
  name: 'Shadow Advancement',
  locationTypes: ['town', 'city', 'capital'],
  steps: [
    {
      id: 'tg.promotion.1',
      name: 'The Test Job',
      narrative: 'Higher rank demands a harder mark. The guild assigns a challenge.',
      reach: 'shadow',
      difficulty: TG_PROMOTION_DIFFICULTY,
      duration: 2,
      onSuccess: { narrative: 'Clean work. Your new rank is whispered through the network.' },
      onFailure: { narrative: 'Sloppy. The guild respects ambition but demands skill.' },
    },
  ],
  reachPrimary: 'shadow',
  reachSecondary: 'gold',
  encounterType: 'steal',
  threatRating: 'moderate',
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
  questPriority: 7.0,
};

export const TG_LIFECYCLE_TEMPLATES: readonly EncounterTemplate[] = [
  TG_JOIN_TEMPLATE,
  TG_PROMOTION_TEMPLATE,
];

// ─── Lookup ─────────────────────────────────────────────────────────────

/**
 * Look up a thieves guild encounter template by ID.
 */
export function getThievesGuildEncounterById(id: string): EncounterTemplate | undefined {
  return THIEVES_GUILD_ENCOUNTER_TEMPLATES.find(t => t.id === id)
    ?? TG_LIFECYCLE_TEMPLATES.find(t => t.id === id)
    ?? THIEVES_GUILD_SOCIAL_TEMPLATES.find(t => t.id === id);
}
