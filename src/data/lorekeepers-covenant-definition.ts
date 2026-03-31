/**
 * Lorekeepers Covenant Faction Definition.
 *
 * Scholars, historians, cartographers, and archivists dedicated to preserving
 * and spreading knowledge. They maintain libraries, chronicle world events,
 * and seek lost wisdom wherever it hides.
 *
 * Reputation alignment: eye.positive (Oracle), veil.positive (Arcane Sage)
 * Natural allies: Arcane Circle
 */

import type { FactionDefinition } from '../types/faction';
import { FACTION_REPUTATION_DECAY_PER_TICK } from './faction-constants';

export const LOREKEEPERS_COVENANT_DEFINITION: FactionDefinition = {
  id: 'lorekeepers_covenant',
  nameTemplate: 'The Lorekeepers Covenant',
  description: 'Scholars, historians, and archivists dedicated to preserving knowledge and chronicling the world.',
  motto: 'To forget is to lose. To record is to endure.',
  iconGlyph: '📜',
  themeColor: '#8B7355',
  factionType: 'guild',
  reachWeights: {
    eye: 0.9,
    veil: 0.6,
    heart: 0.4,
    stone: 0.3,
    gold: 0.2,
    shadow: 0.2,
    star: 0.2,
    iron: 0.1,
  },
  locationTypes: ['city', 'capital', 'tower'],
  rankTiers: [
    {
      id: 'scribe',
      name: 'Scribe',
      minReputation: 0.0,
      maxSlots: null,
      bonuses: [],
      encounterAccess: ['lk.quest.'],
    },
    {
      id: 'scholar',
      name: 'Scholar',
      minReputation: 0.3,
      maxSlots: null,
      bonuses: [
        {
          type: 'encounter_reward_multiplier',
          value: 1.15,
          description: '+15% research rewards',
        },
        {
          type: 'scoring_boost',
          value: 0.10,
          description: '+0.10 scoring for Eye encounters',
        },
      ],
      encounterAccess: ['lk.quest.', 'lk.senior.'],
    },
    {
      id: 'sage',
      name: 'Sage',
      minReputation: 0.6,
      maxSlots: null,
      bonuses: [
        {
          type: 'encounter_reward_multiplier',
          value: 1.30,
          description: '+30% research rewards',
        },
        {
          type: 'scoring_boost',
          value: 0.20,
          description: '+0.20 scoring for knowledge encounters',
        },
        {
          type: 'reputation_walk_bonus',
          value: 0.15,
          description: '+0.15 trust via scholarly network',
        },
      ],
      encounterAccess: ['lk.quest.', 'lk.senior.', 'lk.elite.'],
    },
    {
      id: 'loremaster',
      name: 'Loremaster',
      minReputation: 0.85,
      maxSlots: 1,
      bonuses: [
        {
          type: 'encounter_reward_multiplier',
          value: 1.50,
          description: '+50% research rewards',
        },
        {
          type: 'scoring_boost',
          value: 0.25,
          description: '+0.25 scoring for all covenant encounters',
        },
        {
          type: 'reputation_walk_bonus',
          value: 0.25,
          description: '+0.25 trust via lore authority',
        },
      ],
      encounterAccess: ['lk.quest.', 'lk.senior.', 'lk.elite.', 'lk.leadership.'],
    },
  ],
  reputationDecayPerTick: FACTION_REPUTATION_DECAY_PER_TICK * 0.7, // slow decay — knowledge endures
  joinEncounterTemplateId: 'lk.join',
  promotionEncounterTemplateId: 'lk.promotion',
  questTemplateIds: [
    'lk.quest.catalogue_ruins', 'lk.quest.translate_text', 'lk.quest.map_territory',
    'lk.quest.interview_elder', 'lk.quest.recover_manuscript',
    'lk.senior.lost_library', 'lk.senior.decipher_prophecy', 'lk.senior.chronicle_war',
    'lk.elite.forbidden_archive', 'lk.elite.ancient_truth',
  ],
  socialTemplateIds: [
    'lk.social.reading_circle', 'lk.social.academic_debate', 'lk.social.knowledge_exchange',
  ],
  expulsionConsequences: [
    { type: 'remove_encounters', params: {} },
  ],
  reputationAlignment: {
    eye: 'positive',
    veil: 'positive',
  },
  dispositions: {
    arcane_circle: 0.5,
    temple_of_spheres: 0.2,
    rangers_brotherhood: 0.2,
  },
  ambitionWeights: {
    cultural_dominance: 0.5,
    resource_acquisition: 0.3,
    defensive_consolidation: 0.2,
  },
};
