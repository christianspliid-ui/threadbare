/**
 * Thieves Guild Faction Definition.
 *
 * Criminal underground network of pickpockets, burglars, fences, and information
 * brokers. Operates from the shadows of every major settlement — tolerated by
 * some, hunted by others. Values cunning and profit over brute force.
 *
 * Reputation alignment: shadow.negative (Infamous), gold.negative (Ruthless Profiteer)
 * Natural enemies: Civic Guard, Holy Order of the Dawn
 */

import type { FactionDefinition } from '../types/faction';
import { FACTION_REPUTATION_DECAY_PER_TICK } from './faction-definitions';

export const THIEVES_GUILD_DEFINITION: FactionDefinition = {
  id: 'thieves_guild',
  nameTemplate: 'The Thieves Guild',
  description: 'A criminal network of pickpockets, burglars, and fences operating from the shadows of every major settlement.',
  motto: 'What the eye does not see, the heart does not grieve.',
  iconGlyph: '🗝',
  themeColor: '#4A4A4A',
  factionType: 'criminal',
  reachWeights: {
    shadow: 0.9,
    gold: 0.7,
    eye: 0.5,
    heart: 0.3,
    iron: 0.2,
    veil: 0.1,
    stone: 0.1,
    star: 0.0,
  },
  locationTypes: ['town', 'city', 'capital'],
  rankTiers: [
    {
      id: 'pickpocket',
      name: 'Pickpocket',
      minReputation: 0.0,
      maxSlots: null,
      bonuses: [],
      encounterAccess: ['tg.quest.'],
    },
    {
      id: 'footpad',
      name: 'Footpad',
      minReputation: 0.3,
      maxSlots: null,
      bonuses: [
        {
          type: 'encounter_reward_multiplier',
          value: 1.20,
          description: '+20% heist rewards',
        },
      ],
      encounterAccess: ['tg.quest.', 'tg.senior.'],
    },
    {
      id: 'shadowblade',
      name: 'Shadowblade',
      minReputation: 0.6,
      maxSlots: null,
      bonuses: [
        {
          type: 'encounter_reward_multiplier',
          value: 1.35,
          description: '+35% heist rewards',
        },
        {
          type: 'scoring_boost',
          value: 0.15,
          description: '+0.15 scoring for Shadow encounters',
        },
      ],
      encounterAccess: ['tg.quest.', 'tg.senior.', 'tg.elite.'],
    },
    {
      id: 'guildmaster',
      name: 'Guildmaster',
      minReputation: 0.85,
      maxSlots: 1,
      bonuses: [
        {
          type: 'encounter_reward_multiplier',
          value: 1.50,
          description: '+50% heist rewards',
        },
        {
          type: 'scoring_boost',
          value: 0.25,
          description: '+0.25 scoring for all guild encounters',
        },
        {
          type: 'reputation_walk_bonus',
          value: 0.20,
          description: '+0.20 trust via underworld network',
        },
      ],
      encounterAccess: ['tg.quest.', 'tg.senior.', 'tg.elite.', 'tg.leadership.'],
    },
  ],
  reputationDecayPerTick: FACTION_REPUTATION_DECAY_PER_TICK,
  joinEncounterTemplateId: 'tg.join',
  promotionEncounterTemplateId: 'tg.promotion',
  questTemplateIds: [
    'tg.quest.pickpocket_mark', 'tg.quest.burglary', 'tg.quest.fence_goods',
    'tg.quest.gather_intel', 'tg.quest.smuggle_cargo',
    'tg.senior.heist', 'tg.senior.blackmail', 'tg.senior.sabotage',
    'tg.elite.grand_heist', 'tg.elite.guild_war',
  ],
  socialTemplateIds: [
    'tg.social.dice_game', 'tg.social.trade_rumors', 'tg.social.plan_job',
  ],
  expulsionConsequences: [
    { type: 'remove_encounters', params: {} },
  ],
  joinPrerequisites: { shadow: 20 },
  reputationAlignment: {
    shadow: 'negative',
    gold: 'negative',
  },
  dispositions: {
    civic_guard: -0.7,
    holy_order_dawn: -0.4,
    underking_court: -0.3,
    merchant_consortium: -0.3,
  },
  ambitionWeights: {
    resource_acquisition: 0.5,
    territorial_expansion: 0.1,
    revenge: 0.2,
    defensive_consolidation: 0.2,
  },
};
