/**
 * Arcane Circle Faction Definition.
 *
 * Scholarly mage guild dedicated to the study, practice, and regulation of
 * magic. Their towers rise above cities as beacons of knowledge and warnings
 * both. Membership requires proven magical aptitude.
 *
 * Reputation alignment: veil.positive (Arcane Sage), eye.positive (Oracle)
 * Natural allies: Lorekeepers Covenant
 */

import type { FactionDefinition } from '../types/faction';
import { FACTION_REPUTATION_DECAY_PER_TICK } from './faction-definitions';

export const ARCANE_CIRCLE_DEFINITION: FactionDefinition = {
  id: 'arcane_circle',
  nameTemplate: 'The Arcane Circle',
  description: 'A scholarly mage guild dedicated to the study, practice, and regulation of magic in all its forms.',
  motto: 'Knowledge is the only true power.',
  iconGlyph: '✦',
  themeColor: '#6A5ACD',
  factionType: 'guild',
  reachWeights: {
    veil: 0.9,
    eye: 0.7,
    star: 0.4,
    shadow: 0.3,
    heart: 0.2,
    gold: 0.2,
    stone: 0.1,
    iron: 0.1,
  },
  locationTypes: ['city', 'capital', 'tower'],
  rankTiers: [
    {
      id: 'apprentice',
      name: 'Apprentice',
      minReputation: 0.0,
      maxSlots: null,
      bonuses: [],
      encounterAccess: ['ac.quest.'],
    },
    {
      id: 'adept',
      name: 'Adept',
      minReputation: 0.3,
      maxSlots: null,
      bonuses: [
        {
          type: 'encounter_reward_multiplier',
          value: 1.20,
          description: '+20% arcane research rewards',
        },
      ],
      encounterAccess: ['ac.quest.', 'ac.senior.'],
    },
    {
      id: 'magister',
      name: 'Magister',
      minReputation: 0.6,
      maxSlots: null,
      bonuses: [
        {
          type: 'encounter_reward_multiplier',
          value: 1.35,
          description: '+35% arcane research rewards',
        },
        {
          type: 'scoring_boost',
          value: 0.20,
          description: '+0.20 scoring for Veil encounters',
        },
      ],
      encounterAccess: ['ac.quest.', 'ac.senior.', 'ac.elite.'],
    },
    {
      id: 'archmage',
      name: 'Archmage',
      minReputation: 0.85,
      maxSlots: 1,
      bonuses: [
        {
          type: 'encounter_reward_multiplier',
          value: 1.50,
          description: '+50% arcane research rewards',
        },
        {
          type: 'scoring_boost',
          value: 0.25,
          description: '+0.25 scoring for all circle encounters',
        },
        {
          type: 'reputation_walk_bonus',
          value: 0.20,
          description: '+0.20 trust via arcane authority',
        },
      ],
      encounterAccess: ['ac.quest.', 'ac.senior.', 'ac.elite.', 'ac.leadership.'],
    },
  ],
  reputationDecayPerTick: FACTION_REPUTATION_DECAY_PER_TICK * 0.9, // slightly slower — knowledge persists
  joinEncounterTemplateId: 'ac.join',
  promotionEncounterTemplateId: 'ac.promotion',
  questTemplateIds: [
    'ac.quest.study_tome', 'ac.quest.gather_reagents', 'ac.quest.ward_settlement',
    'ac.quest.identify_artifact', 'ac.quest.investigate_anomaly',
    'ac.senior.enchantment_project', 'ac.senior.planar_research', 'ac.senior.spell_duel',
    'ac.elite.arcane_discovery', 'ac.elite.seal_rift',
  ],
  socialTemplateIds: [
    'ac.social.lecture', 'ac.social.magical_debate', 'ac.social.shared_research',
  ],
  expulsionConsequences: [
    { type: 'remove_encounters', params: {} },
  ],
  joinPrerequisites: { veil: 25 },
  reputationAlignment: {
    veil: 'positive',
    eye: 'positive',
  },
  dispositions: {
    lorekeepers_covenant: 0.5,
    temple_of_spheres: 0.1,
  },
  ambitionWeights: {
    cultural_dominance: 0.4,
    resource_acquisition: 0.3,
    defensive_consolidation: 0.2,
    divine_mandate: 0.1,
  },
};
