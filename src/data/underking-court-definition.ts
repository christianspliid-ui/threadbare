/**
 * Underking's Court Faction Definition.
 *
 * Organized crime syndicate operating through intimidation, extortion, and
 * corruption. Where the Thieves Guild steals, the Underking's Court rules.
 * They buy what they cannot steal and break what they cannot buy.
 *
 * Reputation alignment: shadow.negative (Infamous), heart.negative (Manipulator)
 * Natural enemies: Civic Guard, Holy Order of the Dawn
 * Turf rivals: Thieves Guild
 */

import type { FactionDefinition } from '../types/faction';
import { FACTION_REPUTATION_DECAY_PER_TICK } from './faction-definitions';

export const UNDERKING_COURT_DEFINITION: FactionDefinition = {
  id: 'underking_court',
  nameTemplate: "The Underking's Court",
  description: 'An organized crime syndicate ruling through intimidation, extortion, and corruption — a shadow government beneath the surface.',
  motto: 'Every throne casts a shadow. Ours is the deeper.',
  iconGlyph: '👑',
  themeColor: '#2F2F4F',
  factionType: 'criminal',
  reachWeights: {
    shadow: 0.8,
    gold: 0.6,
    heart: 0.6,
    iron: 0.4,
    eye: 0.3,
    stone: 0.2,
    veil: 0.1,
    star: 0.0,
  },
  locationTypes: ['city', 'capital'],
  rankTiers: [
    {
      id: 'pawn',
      name: 'Pawn',
      minReputation: 0.0,
      maxSlots: null,
      bonuses: [],
      encounterAccess: ['uk.quest.'],
    },
    {
      id: 'enforcer',
      name: 'Enforcer',
      minReputation: 0.3,
      maxSlots: null,
      bonuses: [
        {
          type: 'encounter_reward_multiplier',
          value: 1.20,
          description: '+20% racket profits',
        },
        {
          type: 'scoring_boost',
          value: 0.10,
          description: '+0.10 scoring for Shadow encounters',
        },
      ],
      encounterAccess: ['uk.quest.', 'uk.senior.'],
    },
    {
      id: 'underboss',
      name: 'Underboss',
      minReputation: 0.6,
      maxSlots: null,
      bonuses: [
        {
          type: 'encounter_reward_multiplier',
          value: 1.40,
          description: '+40% racket profits',
        },
        {
          type: 'scoring_boost',
          value: 0.20,
          description: '+0.20 scoring for Heart encounters',
        },
        {
          type: 'reputation_walk_bonus',
          value: 0.20,
          description: '+0.20 trust via underworld network',
        },
      ],
      encounterAccess: ['uk.quest.', 'uk.senior.', 'uk.elite.'],
    },
    {
      id: 'underking',
      name: 'Underking',
      minReputation: 0.85,
      maxSlots: 1,
      bonuses: [
        {
          type: 'encounter_reward_multiplier',
          value: 1.50,
          description: '+50% racket profits',
        },
        {
          type: 'scoring_boost',
          value: 0.25,
          description: '+0.25 scoring for all court encounters',
        },
        {
          type: 'reputation_walk_bonus',
          value: 0.25,
          description: '+0.25 trust via absolute criminal authority',
        },
      ],
      encounterAccess: ['uk.quest.', 'uk.senior.', 'uk.elite.', 'uk.leadership.'],
    },
  ],
  reputationDecayPerTick: FACTION_REPUTATION_DECAY_PER_TICK * 1.2, // faster decay — loyalty bought, not earned
  joinEncounterTemplateId: 'uk.join',
  promotionEncounterTemplateId: 'uk.promotion',
  questTemplateIds: [
    'uk.quest.collect_protection', 'uk.quest.intimidate_merchant', 'uk.quest.smuggle_contraband',
    'uk.quest.bribe_official', 'uk.quest.rough_up_debtor',
    'uk.senior.orchestrate_heist', 'uk.senior.corrupt_guard', 'uk.senior.turf_war',
    'uk.elite.seize_territory', 'uk.elite.puppet_ruler',
  ],
  socialTemplateIds: [
    'uk.social.back_room_deal', 'uk.social.loyalty_test', 'uk.social.feast_of_spoils',
  ],
  expulsionConsequences: [
    { type: 'remove_encounters', params: {} },
    { type: 'reputation_penalty', params: { amount: 0.3 } },
  ],
  joinPrerequisites: { shadow: 15 },
  reputationAlignment: {
    shadow: 'negative',
    heart: 'negative',
  },
  dispositions: {
    civic_guard: -0.8,
    holy_order_dawn: -0.6,
    temple_of_spheres: -0.4,
    thieves_guild: -0.3,
  },
  ambitionWeights: {
    territorial_expansion: 0.3,
    resource_acquisition: 0.3,
    revenge: 0.3,
    defensive_consolidation: 0.1,
  },
};
