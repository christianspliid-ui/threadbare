/**
 * Builders Fellowship Faction Definition.
 *
 * Master craftsmen, stonemasons, architects, and engineers who build the
 * physical foundations of civilization. Their works outlast the people who
 * commissioned them. Steady, reliable, and proud of their trade.
 *
 * Reputation alignment: stone.positive (Steadfast Builder), gold.positive (Generous Patron)
 * Natural allies: Merchant Consortium
 */

import type { FactionDefinition } from '../types/faction';
import { FACTION_REPUTATION_DECAY_PER_TICK } from './faction-constants';

export const BUILDERS_FELLOWSHIP_DEFINITION: FactionDefinition = {
  id: 'builders_fellowship',
  nameTemplate: 'The Builders Fellowship',
  description: 'Master craftsmen, stonemasons, and architects who build the physical foundations of civilization.',
  motto: 'What we raise endures.',
  iconGlyph: '🔨',
  themeColor: '#A0522D',
  factionType: 'guild',
  reachWeights: {
    stone: 0.9,
    gold: 0.6,
    iron: 0.5,
    heart: 0.3,
    eye: 0.2,
    shadow: 0.1,
    veil: 0.1,
    star: 0.1,
  },
  locationTypes: ['town', 'city', 'capital'],
  rankTiers: [
    {
      id: 'apprentice',
      name: 'Apprentice',
      minReputation: 0.0,
      maxSlots: null,
      bonuses: [],
      encounterAccess: ['bf.quest.'],
    },
    {
      id: 'journeyman',
      name: 'Journeyman',
      minReputation: 0.3,
      maxSlots: null,
      bonuses: [
        {
          type: 'encounter_reward_multiplier',
          value: 1.15,
          description: '+15% crafting rewards',
        },
      ],
      encounterAccess: ['bf.quest.', 'bf.senior.'],
    },
    {
      id: 'master_builder',
      name: 'Master Builder',
      minReputation: 0.6,
      maxSlots: null,
      bonuses: [
        {
          type: 'encounter_reward_multiplier',
          value: 1.30,
          description: '+30% crafting rewards',
        },
        {
          type: 'scoring_boost',
          value: 0.15,
          description: '+0.15 scoring for Stone encounters',
        },
        {
          type: 'reputation_walk_bonus',
          value: 0.15,
          description: '+0.15 trust via builder network',
        },
      ],
      encounterAccess: ['bf.quest.', 'bf.senior.', 'bf.elite.'],
    },
    {
      id: 'grand_architect',
      name: 'Grand Architect',
      minReputation: 0.85,
      maxSlots: 1,
      bonuses: [
        {
          type: 'encounter_reward_multiplier',
          value: 1.50,
          description: '+50% crafting rewards',
        },
        {
          type: 'scoring_boost',
          value: 0.25,
          description: '+0.25 scoring for all fellowship encounters',
        },
        {
          type: 'reputation_walk_bonus',
          value: 0.25,
          description: '+0.25 trust via architectural renown',
        },
      ],
      encounterAccess: ['bf.quest.', 'bf.senior.', 'bf.elite.', 'bf.leadership.'],
    },
  ],
  reputationDecayPerTick: FACTION_REPUTATION_DECAY_PER_TICK * 0.8, // slower — craft reputation persists
  joinEncounterTemplateId: 'bf.join',
  promotionEncounterTemplateId: 'bf.promotion',
  questTemplateIds: [
    'bf.quest.repair_wall', 'bf.quest.build_bridge', 'bf.quest.quarry_stone',
    'bf.quest.forge_tools', 'bf.quest.survey_foundations',
    'bf.senior.design_fortification', 'bf.senior.restore_monument', 'bf.senior.engineer_siege_engine',
    'bf.elite.build_wonder', 'bf.elite.master_project',
  ],
  socialTemplateIds: [
    'bf.social.workshop_tour', 'bf.social.craft_competition', 'bf.social.blueprint_review',
  ],
  expulsionConsequences: [
    { type: 'remove_encounters', params: {} },
  ],
  reputationAlignment: {
    stone: 'positive',
    gold: 'positive',
  },
  dispositions: {
    merchant_consortium: 0.4,
    civic_guard: 0.2,
  },
  ambitionWeights: {
    resource_acquisition: 0.4,
    defensive_consolidation: 0.3,
    territorial_expansion: 0.2,
    cultural_dominance: 0.1,
  },
};
