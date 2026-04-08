/**
 * Civic Guard Faction Definition.
 *
 * Town watch and law enforcement — the shield of civilization. Guards patrol
 * streets, enforce laws, and defend settlements against external threats.
 * Respected by the lawful, resented by the criminal.
 *
 * Reputation alignment: iron.positive (Feared Champion), stone.positive (Steadfast Builder)
 * Natural enemies: Thieves Guild, Underking's Court
 */

import type { FactionDefinition } from '../types/faction';
import { FACTION_REPUTATION_DECAY_PER_TICK } from './faction-constants';

export const CIVIC_GUARD_DEFINITION: FactionDefinition = {
  id: 'civic_guard',
  nameTemplate: 'The Civic Guard',
  description: 'Town watch and law enforcement who patrol streets, enforce laws, and defend settlements against threats within and without.',
  motto: 'Order endures where vigilance stands.',
  iconGlyph: '🛡',
  themeColor: '#4682B4',
  factionType: 'political',
  reachWeights: {
    iron: 0.8,
    stone: 0.6,
    heart: 0.5,
    eye: 0.4,
    gold: 0.2,
    shadow: 0.2,
    veil: 0.1,
    star: 0.1,
  },
  locationTypes: ['town', 'city', 'capital', 'fort', 'castle'],
  rankTiers: [
    {
      id: 'recruit',
      name: 'Recruit',
      minReputation: 0.0,
      maxSlots: null,
      bonuses: [],
      encounterAccess: ['cg.quest.'],
    },
    {
      id: 'sergeant',
      name: 'Sergeant',
      minReputation: 0.3,
      maxSlots: null,
      bonuses: [
        {
          type: 'encounter_reward_multiplier',
          value: 1.15,
          description: '+15% guard duty rewards',
        },
        {
          type: 'reputation_walk_bonus',
          value: 0.10,
          description: '+0.10 trust via guard authority',
        },
      ],
      encounterAccess: ['cg.quest.', 'cg.senior.'],
    },
    {
      id: 'captain',
      name: 'Captain',
      minReputation: 0.6,
      maxSlots: null,
      bonuses: [
        {
          type: 'encounter_reward_multiplier',
          value: 1.30,
          description: '+30% guard duty rewards',
        },
        {
          type: 'scoring_boost',
          value: 0.15,
          description: '+0.15 scoring for Iron encounters',
        },
        {
          type: 'reputation_walk_bonus',
          value: 0.20,
          description: '+0.20 trust via guard network',
        },
      ],
      encounterAccess: ['cg.quest.', 'cg.senior.', 'cg.elite.'],
    },
    {
      id: 'marshal',
      name: 'Marshal',
      minReputation: 0.85,
      maxSlots: 1,
      bonuses: [
        {
          type: 'encounter_reward_multiplier',
          value: 1.50,
          description: '+50% guard duty rewards',
        },
        {
          type: 'scoring_boost',
          value: 0.25,
          description: '+0.25 scoring for all guard encounters',
        },
        {
          type: 'reputation_walk_bonus',
          value: 0.25,
          description: '+0.25 trust via marshal authority',
        },
      ],
      encounterAccess: ['cg.quest.', 'cg.senior.', 'cg.elite.', 'cg.leadership.'],
    },
  ],
  reputationDecayPerTick: FACTION_REPUTATION_DECAY_PER_TICK * 0.8, // slower decay — institutional loyalty
  joinEncounterTemplateId: 'cg.join',
  promotionEncounterTemplateId: 'cg.promotion',
  questTemplateIds: [
    'cg.quest.street_patrol', 'cg.quest.investigate_crime', 'cg.quest.guard_gate',
    'cg.quest.arrest_criminal', 'cg.quest.escort_prisoner',
    'cg.senior.sting_operation', 'cg.senior.riot_control', 'cg.senior.criminal_manhunt',
    'cg.elite.crime_lord_takedown', 'cg.elite.defend_siege',
  ],
  socialTemplateIds: [
    'cg.social.guard_mess', 'cg.social.drill_practice', 'cg.social.law_discussion',
  ],
  expulsionConsequences: [
    { type: 'remove_encounters', params: {} },
  ],
  reputationAlignment: {
    iron: 'positive',
    stone: 'positive',
  },
  dispositions: {
    thieves_guild: -0.7,
    underking_court: -0.8,
    holy_order_dawn: 0.3,
    rangers_brotherhood: 0.2,
  },
  ambitionWeights: {
    defensive_consolidation: 0.5,
    territorial_expansion: 0.1,
    revenge: 0.2,
    resource_acquisition: 0.2,
  },
};
