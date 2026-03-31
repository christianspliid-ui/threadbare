/**
 * Holy Order of the Dawn Faction Definition.
 *
 * Militant religious order combining martial prowess with divine devotion.
 * Their knight-templars crusade against corruption, undeath, and demonic
 * influence. Zealous, disciplined, and uncompromising.
 *
 * Reputation alignment: star.positive (Blessed), iron.positive (Feared Champion)
 * Natural allies: Temple of the Spheres, Civic Guard
 * Natural enemies: criminal factions
 */

import type { FactionDefinition } from '../types/faction';
import { FACTION_REPUTATION_DECAY_PER_TICK } from './faction-constants';

export const HOLY_ORDER_DAWN_DEFINITION: FactionDefinition = {
  id: 'holy_order_dawn',
  nameTemplate: 'The Holy Order of the Dawn',
  description: 'A militant religious order of knight-templars who crusade against corruption, undeath, and demonic influence.',
  motto: 'By blade and prayer, darkness is undone.',
  iconGlyph: '☀',
  themeColor: '#FFD700',
  factionType: 'military',
  reachWeights: {
    star: 0.8,
    iron: 0.8,
    heart: 0.5,
    stone: 0.4,
    eye: 0.3,
    veil: 0.2,
    gold: 0.1,
    shadow: 0.0,
  },
  locationTypes: ['temple', 'city', 'capital'],
  rankTiers: [
    {
      id: 'squire',
      name: 'Squire',
      minReputation: 0.0,
      maxSlots: null,
      bonuses: [],
      encounterAccess: ['hod.quest.'],
    },
    {
      id: 'knight',
      name: 'Knight',
      minReputation: 0.3,
      maxSlots: null,
      bonuses: [
        {
          type: 'encounter_reward_multiplier',
          value: 1.20,
          description: '+20% crusade rewards',
        },
        {
          type: 'scoring_boost',
          value: 0.10,
          description: '+0.10 scoring for Star encounters',
        },
      ],
      encounterAccess: ['hod.quest.', 'hod.senior.'],
    },
    {
      id: 'knight_commander',
      name: 'Knight-Commander',
      minReputation: 0.6,
      maxSlots: null,
      bonuses: [
        {
          type: 'encounter_reward_multiplier',
          value: 1.35,
          description: '+35% crusade rewards',
        },
        {
          type: 'scoring_boost',
          value: 0.20,
          description: '+0.20 scoring for Iron and Star encounters',
        },
        {
          type: 'reputation_walk_bonus',
          value: 0.20,
          description: '+0.20 trust via holy authority',
        },
      ],
      encounterAccess: ['hod.quest.', 'hod.senior.', 'hod.elite.'],
    },
    {
      id: 'grand_master',
      name: 'Grand Master',
      minReputation: 0.85,
      maxSlots: 1,
      bonuses: [
        {
          type: 'encounter_reward_multiplier',
          value: 1.50,
          description: '+50% crusade rewards',
        },
        {
          type: 'scoring_boost',
          value: 0.25,
          description: '+0.25 scoring for all order encounters',
        },
        {
          type: 'reputation_walk_bonus',
          value: 0.25,
          description: '+0.25 trust via divine mandate',
        },
      ],
      encounterAccess: ['hod.quest.', 'hod.senior.', 'hod.elite.', 'hod.leadership.'],
    },
  ],
  reputationDecayPerTick: FACTION_REPUTATION_DECAY_PER_TICK * 0.7, // slow decay — oaths are binding
  joinEncounterTemplateId: 'hod.join',
  promotionEncounterTemplateId: 'hod.promotion',
  questTemplateIds: [
    'hod.quest.patrol_holy_site', 'hod.quest.purge_undead', 'hod.quest.defend_pilgrim',
    'hod.quest.consecrate_battlefield', 'hod.quest.investigate_heresy',
    'hod.senior.crusade_march', 'hod.senior.demon_hunt', 'hod.senior.inquisition',
    'hod.elite.divine_crusade', 'hod.elite.cleanse_corruption',
  ],
  socialTemplateIds: [
    'hod.social.vigil', 'hod.social.oath_ceremony', 'hod.social.war_council',
  ],
  expulsionConsequences: [
    { type: 'remove_encounters', params: {} },
  ],
  joinPrerequisites: { star: 15, iron: 15 },
  reputationAlignment: {
    star: 'positive',
    iron: 'positive',
  },
  dispositions: {
    temple_of_spheres: 0.5,
    civic_guard: 0.3,
    underking_court: -0.6,
    thieves_guild: -0.4,
  },
  ambitionWeights: {
    divine_mandate: 0.3,
    territorial_expansion: 0.2,
    defensive_consolidation: 0.2,
    revenge: 0.2,
    cultural_dominance: 0.1,
  },
};
