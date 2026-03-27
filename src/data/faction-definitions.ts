/**
 * Faction Definitions — data-driven faction templates.
 *
 * Each FactionDefinition describes a generalizable faction archetype.
 * The Adventuring Guild is the prototype; procedurally generated factions
 * (merchant guilds, mercenary bands, religious orders) will use the same shape.
 *
 * Design doc: Docs/plans/2026-03-27-faction-vertical-slice-design.md
 */

import type { FactionDefinition } from '../types/faction';

// ─── Constants ───────────────────────────────────────────────────────────

/** Base decay rate (overridable per faction definition) */
export const FACTION_REPUTATION_DECAY_PER_TICK = 0.003;

/** Reputation on joining (just above zero) */
export const FACTION_JOIN_STARTING_REPUTATION = 0.05;

/** Base reputation per completed quest step */
export const FACTION_QUEST_REPUTATION_GAIN = 0.04;

/** Bonus on full quest completion */
export const FACTION_QUEST_REPUTATION_BONUS_SUCCESS = 0.08;

/** Bonus reputation for passing promotion encounter */
export const FACTION_PROMOTION_REPUTATION_BOOST = 0.05;

/** Reputation at which membership becomes inert */
export const FACTION_EXPULSION_THRESHOLD = 0.0;

/** Minimum guild halls per faction instance */
export const FACTION_GUILD_HALL_COUNT_MIN = 3;

/** Maximum guild halls per faction instance */
export const FACTION_GUILD_HALL_COUNT_MAX = 5;

/** Reputation gain per completed quest step */
export const FACTION_REPUTATION_GAIN_PER_STEP = 0.04;

/** Extra reputation for completing all steps */
export const FACTION_REPUTATION_COMPLETION_BONUS = 0.08;

/** Minimum ticks between rank changes (prevents flicker at boundary) */
export const FACTION_RANK_CHANGE_COOLDOWN_TICKS = 5;

/** Roll margin for "promoted with complication" */
export const PROMOTION_PARTIAL_SUCCESS_MARGIN = 0.10;

/** Ticks before promotion encounter can reappear after failure */
export const PROMOTION_ENCOUNTER_COOLDOWN = 30;

/** Gold reward on promotion */
export const PROMOTION_REWARD_GOLD = 50;

/** AlertBar icon for faction events */
export const FACTION_ALERT_GLYPH = '⚜';

/** Amber/gold, Threadbare palette */
export const FACTION_ALERT_COLOR = '#D4A574';

// ─── Adventuring Guild Definition ────────────────────────────────────────

export const ADVENTURING_GUILD_DEFINITION: FactionDefinition = {
  id: 'adventuring_guild',
  nameTemplate: 'The Adventurers Guild',
  factionType: 'guild',
  reachWeights: {
    iron: 0.6,
    eye: 0.8,
    stone: 0.5,
    shadow: 0.3,
    heart: 0.2,
    gold: 0.3,
    flesh: 0.4,
    star: 0.1,
    veil: 0.2,
  },
  locationTypes: ['town', 'city', 'capital'],
  rankTiers: [
    {
      id: 'journeyman',
      name: 'Journeyman',
      minReputation: 0.0,
      maxSlots: null,
      bonuses: [],
      encounterAccess: ['ag.quest.'],
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
          description: '+15% quest rewards',
        },
      ],
      encounterAccess: ['ag.quest.', 'ag.senior.'],
    },
    {
      id: 'lieutenant',
      name: 'Lieutenant',
      minReputation: 0.6,
      maxSlots: null,
      bonuses: [
        {
          type: 'encounter_reward_multiplier',
          value: 1.30,
          description: '+30% quest rewards',
        },
        {
          type: 'reputation_walk_bonus',
          value: 0.15,
          description: '+0.15 trust via guild network',
        },
      ],
      encounterAccess: ['ag.quest.', 'ag.senior.', 'ag.elite.'],
    },
    {
      id: 'leader',
      name: 'Guild Master',
      minReputation: 0.85,
      maxSlots: 1,
      bonuses: [
        {
          type: 'encounter_reward_multiplier',
          value: 1.50,
          description: '+50% quest rewards',
        },
        {
          type: 'reputation_walk_bonus',
          value: 0.25,
          description: '+0.25 trust via guild network',
        },
        {
          type: 'scoring_boost',
          value: 0.2,
          description: '+0.2 scoring for all guild encounters',
        },
      ],
      encounterAccess: ['ag.quest.', 'ag.senior.', 'ag.elite.', 'ag.leadership.'],
    },
  ],
  reputationDecayPerTick: FACTION_REPUTATION_DECAY_PER_TICK,
  joinEncounterTemplateId: 'ag.join',
  promotionEncounterTemplateId: 'ag.promotion',
  questTemplateIds: [
    'ag.quest.ruin_delve', 'ag.quest.monster_hunt', 'ag.quest.wilderness_survey',
    'ag.quest.escort_caravan', 'ag.quest.recover_artifact',
    'ag.senior.deep_expedition', 'ag.senior.bounty_hunt', 'ag.senior.map_uncharted',
    'ag.elite.dragon_lair', 'ag.elite.lost_city',
  ],
  socialTemplateIds: [],    // populated in Phase 4 (TB-062)
  expulsionConsequences: [
    { type: 'remove_encounters', params: {} },
  ],
};

// ─── Registry ────────────────────────────────────────────────────────────

/**
 * All registered faction definitions, keyed by definition ID.
 * Extend this map when adding new faction types.
 */
export const FACTION_DEFINITIONS: ReadonlyMap<string, FactionDefinition> = new Map([
  [ADVENTURING_GUILD_DEFINITION.id, ADVENTURING_GUILD_DEFINITION],
]);
