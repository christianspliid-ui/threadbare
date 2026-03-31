/**
 * Rangers Brotherhood Faction Definition.
 *
 * Wilderness scouts, trackers, and monster hunters who patrol the borders
 * between civilized lands and the wild. They map the unmapped, guard the
 * frontier, and know every trail and hidden path.
 *
 * Reputation alignment: eye.positive (Oracle), iron.positive (Feared Champion)
 * Natural allies: Adventuring Guild
 */

import type { FactionDefinition } from '../types/faction';
import { FACTION_REPUTATION_DECAY_PER_TICK } from './faction-constants';

export const RANGERS_BROTHERHOOD_DEFINITION: FactionDefinition = {
  id: 'rangers_brotherhood',
  nameTemplate: 'The Rangers Brotherhood',
  description: 'Wilderness scouts and monster hunters who patrol the frontier between civilized lands and the untamed wild.',
  motto: 'We walk so others need not.',
  iconGlyph: '🏹',
  themeColor: '#2E8B57',
  factionType: 'guild',
  reachWeights: {
    eye: 0.8,
    iron: 0.7,
    stone: 0.5,
    shadow: 0.4,
    heart: 0.3,
    gold: 0.1,
    veil: 0.1,
    star: 0.1,
  },
  locationTypes: ['town', 'camp', 'fort'],
  rankTiers: [
    {
      id: 'scout',
      name: 'Scout',
      minReputation: 0.0,
      maxSlots: null,
      bonuses: [],
      encounterAccess: ['rb.quest.'],
    },
    {
      id: 'warden',
      name: 'Warden',
      minReputation: 0.3,
      maxSlots: null,
      bonuses: [
        {
          type: 'encounter_reward_multiplier',
          value: 1.15,
          description: '+15% patrol rewards',
        },
        {
          type: 'scoring_boost',
          value: 0.10,
          description: '+0.10 scoring for Eye encounters',
        },
      ],
      encounterAccess: ['rb.quest.', 'rb.senior.'],
    },
    {
      id: 'ranger_captain',
      name: 'Ranger-Captain',
      minReputation: 0.6,
      maxSlots: null,
      bonuses: [
        {
          type: 'encounter_reward_multiplier',
          value: 1.30,
          description: '+30% patrol rewards',
        },
        {
          type: 'scoring_boost',
          value: 0.15,
          description: '+0.15 scoring for wilderness encounters',
        },
        {
          type: 'reputation_walk_bonus',
          value: 0.15,
          description: '+0.15 trust via ranger network',
        },
      ],
      encounterAccess: ['rb.quest.', 'rb.senior.', 'rb.elite.'],
    },
    {
      id: 'lord_ranger',
      name: 'Lord Ranger',
      minReputation: 0.85,
      maxSlots: 1,
      bonuses: [
        {
          type: 'encounter_reward_multiplier',
          value: 1.50,
          description: '+50% patrol rewards',
        },
        {
          type: 'scoring_boost',
          value: 0.25,
          description: '+0.25 scoring for all brotherhood encounters',
        },
        {
          type: 'reputation_walk_bonus',
          value: 0.25,
          description: '+0.25 trust via ranger authority',
        },
      ],
      encounterAccess: ['rb.quest.', 'rb.senior.', 'rb.elite.', 'rb.leadership.'],
    },
  ],
  reputationDecayPerTick: FACTION_REPUTATION_DECAY_PER_TICK,
  joinEncounterTemplateId: 'rb.join',
  promotionEncounterTemplateId: 'rb.promotion',
  questTemplateIds: [
    'rb.quest.patrol_frontier', 'rb.quest.track_beast', 'rb.quest.map_wilds',
    'rb.quest.clear_road', 'rb.quest.escort_settlers',
    'rb.senior.monster_extermination', 'rb.senior.deep_wilderness', 'rb.senior.frontier_crisis',
    'rb.elite.legendary_hunt', 'rb.elite.wilderness_stronghold',
  ],
  socialTemplateIds: [
    'rb.social.campfire_tales', 'rb.social.tracking_lessons', 'rb.social.survival_training',
  ],
  expulsionConsequences: [
    { type: 'remove_encounters', params: {} },
  ],
  reputationAlignment: {
    eye: 'positive',
    iron: 'positive',
  },
  dispositions: {
    adventuring_guild: 0.4,
    civic_guard: 0.2,
  },
  ambitionWeights: {
    defensive_consolidation: 0.4,
    territorial_expansion: 0.2,
    resource_acquisition: 0.2,
    revenge: 0.2,
  },
};
