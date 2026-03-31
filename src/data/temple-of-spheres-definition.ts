/**
 * Temple of the Spheres Faction Definition.
 *
 * Multi-sphere religious order serving as spiritual backbone of civilized
 * settlements. Priests minister to the faithful, tend shrines, and channel
 * divine will. Their authority flows from devotion, not steel.
 *
 * Reputation alignment: star.positive (Blessed), heart.positive (Beloved)
 * Natural allies: Holy Order of the Dawn
 */

import type { FactionDefinition } from '../types/faction';
import { FACTION_REPUTATION_DECAY_PER_TICK } from './faction-definitions';

export const TEMPLE_OF_SPHERES_DEFINITION: FactionDefinition = {
  id: 'temple_of_spheres',
  nameTemplate: 'The Temple of the Spheres',
  description: 'A multi-sphere religious order whose priests minister to the faithful, tend shrines, and interpret divine will.',
  motto: 'In devotion, all spheres are one.',
  iconGlyph: '⛪',
  themeColor: '#E8D5B7',
  factionType: 'religious',
  reachWeights: {
    star: 0.9,
    heart: 0.7,
    veil: 0.5,
    eye: 0.4,
    stone: 0.3,
    gold: 0.2,
    iron: 0.1,
    shadow: 0.0,
  },
  locationTypes: ['town', 'city', 'capital', 'temple', 'shrine'],
  rankTiers: [
    {
      id: 'acolyte',
      name: 'Acolyte',
      minReputation: 0.0,
      maxSlots: null,
      bonuses: [],
      encounterAccess: ['ts.quest.'],
    },
    {
      id: 'priest',
      name: 'Priest',
      minReputation: 0.3,
      maxSlots: null,
      bonuses: [
        {
          type: 'encounter_reward_multiplier',
          value: 1.15,
          description: '+15% devotional rewards',
        },
        {
          type: 'reputation_walk_bonus',
          value: 0.10,
          description: '+0.10 trust via temple network',
        },
      ],
      encounterAccess: ['ts.quest.', 'ts.senior.'],
    },
    {
      id: 'high_priest',
      name: 'High Priest',
      minReputation: 0.6,
      maxSlots: null,
      bonuses: [
        {
          type: 'encounter_reward_multiplier',
          value: 1.30,
          description: '+30% devotional rewards',
        },
        {
          type: 'scoring_boost',
          value: 0.15,
          description: '+0.15 scoring for Star encounters',
        },
        {
          type: 'reputation_walk_bonus',
          value: 0.20,
          description: '+0.20 trust via temple authority',
        },
      ],
      encounterAccess: ['ts.quest.', 'ts.senior.', 'ts.elite.'],
    },
    {
      id: 'pontifex',
      name: 'Pontifex',
      minReputation: 0.85,
      maxSlots: 1,
      bonuses: [
        {
          type: 'encounter_reward_multiplier',
          value: 1.50,
          description: '+50% devotional rewards',
        },
        {
          type: 'scoring_boost',
          value: 0.25,
          description: '+0.25 scoring for all temple encounters',
        },
        {
          type: 'reputation_walk_bonus',
          value: 0.25,
          description: '+0.25 trust via divine authority',
        },
      ],
      encounterAccess: ['ts.quest.', 'ts.senior.', 'ts.elite.', 'ts.leadership.'],
    },
  ],
  reputationDecayPerTick: FACTION_REPUTATION_DECAY_PER_TICK * 0.8, // slower decay — faith endures
  joinEncounterTemplateId: 'ts.join',
  promotionEncounterTemplateId: 'ts.promotion',
  questTemplateIds: [
    'ts.quest.tend_shrine', 'ts.quest.bless_harvest', 'ts.quest.heal_afflicted',
    'ts.quest.consecrate_ground', 'ts.quest.pilgrim_escort',
    'ts.senior.exorcism', 'ts.senior.sphere_ritual', 'ts.senior.holy_inquest',
    'ts.elite.divine_revelation', 'ts.elite.miracle_working',
  ],
  socialTemplateIds: [
    'ts.social.prayer_circle', 'ts.social.theological_debate', 'ts.social.alms_giving',
  ],
  expulsionConsequences: [
    { type: 'remove_encounters', params: {} },
  ],
  joinPrerequisites: { star: 15 },
  reputationAlignment: {
    star: 'positive',
    heart: 'positive',
  },
  dispositions: {
    holy_order_dawn: 0.5,
    underking_court: -0.4,
    arcane_circle: 0.1,
  },
  ambitionWeights: {
    cultural_dominance: 0.5,
    defensive_consolidation: 0.3,
    divine_mandate: 0.2,
  },
};
