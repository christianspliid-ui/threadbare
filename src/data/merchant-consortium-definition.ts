/**
 * Merchant Consortium Faction Definition.
 *
 * Economic powerhouse controlling trade routes, markets, and banking across
 * the civilized world. Wealth is their weapon and generosity their shield.
 * They build prosperity wherever they settle — and profit from every transaction.
 *
 * Reputation alignment: gold.positive (Generous Patron), heart.positive (Beloved)
 * Natural allies: Builders Fellowship
 */

import type { FactionDefinition } from '../types/faction';
import { FACTION_REPUTATION_DECAY_PER_TICK } from './faction-constants';

export const MERCHANT_CONSORTIUM_DEFINITION: FactionDefinition = {
  id: 'merchant_consortium',
  nameTemplate: 'The Merchant Consortium',
  description: 'A powerful alliance of traders, bankers, and caravan masters who control commerce across the civilized world.',
  motto: 'Prosperity shared is prosperity doubled.',
  themeColor: '#DAA520',
  factionType: 'guild',
  reachWeights: {
    gold: 0.9,
    heart: 0.6,
    eye: 0.5,
    shadow: 0.3,
    stone: 0.3,
    iron: 0.2,
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
      encounterAccess: ['mct.quest.'],
    },
    {
      id: 'factor',
      name: 'Factor',
      minReputation: 0.3,
      maxSlots: null,
      bonuses: [
        {
          type: 'encounter_reward_multiplier',
          value: 1.20,
          description: '+20% trade profits',
        },
      ],
      encounterAccess: ['mct.quest.', 'mct.senior.'],
    },
    {
      id: 'guildsman',
      name: 'Guildsman',
      minReputation: 0.6,
      maxSlots: null,
      bonuses: [
        {
          type: 'encounter_reward_multiplier',
          value: 1.35,
          description: '+35% trade profits',
        },
        {
          type: 'reputation_walk_bonus',
          value: 0.15,
          description: '+0.15 trust via trade network',
        },
      ],
      encounterAccess: ['mct.quest.', 'mct.senior.', 'mct.elite.'],
    },
    {
      id: 'trade_prince',
      name: 'Trade Prince',
      minReputation: 0.85,
      maxSlots: 1,
      bonuses: [
        {
          type: 'encounter_reward_multiplier',
          value: 1.50,
          description: '+50% trade profits',
        },
        {
          type: 'scoring_boost',
          value: 0.20,
          description: '+0.20 scoring for all consortium encounters',
        },
        {
          type: 'reputation_walk_bonus',
          value: 0.25,
          description: '+0.25 trust via consortium influence',
        },
      ],
      encounterAccess: ['mct.quest.', 'mct.senior.', 'mct.elite.', 'mct.leadership.'],
    },
  ],
  reputationDecayPerTick: FACTION_REPUTATION_DECAY_PER_TICK,
  joinEncounterTemplateId: 'mct.join',
  promotionEncounterTemplateId: 'mct.promotion',
  // THR-1955 — every id resolves to a template. trade_war and monopoly_bid map to
  // trade_monopoly, trade_empire to market_domination; escort_goods, appraise_cargo,
  // open_market, collect_debts and royal_charter had no template and are dropped (the
  // royal charter is the crown's to grant later).
  questTemplateIds: [
    'mct.quest.negotiate_contract',
    'mct.senior.trade_monopoly', 'mct.senior.foreign_deal',
    'mct.elite.market_domination',
  ],
  socialTemplateIds: [
    'mct.social.wine_tasting', 'mct.social.ledger_review', 'mct.social.guild_feast',
  ],
  expulsionConsequences: [
    { type: 'remove_encounters', params: {} },
  ],
  reputationAlignment: {
    gold: 'positive',
    heart: 'positive',
  },
  dispositions: {
    builders_fellowship: 0.4,
    thieves_guild: -0.3,
    underking_court: -0.2,
  },
  ambitionWeights: {
    resource_acquisition: 0.6,
    cultural_dominance: 0.2,
    defensive_consolidation: 0.1,
    territorial_expansion: 0.1,
  },
};
