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
import { MERCENARY_COMPANY_DEFINITION } from './mercenary-company-definition';
import { THIEVES_GUILD_DEFINITION } from './thieves-guild-definition';
import { MERCHANT_CONSORTIUM_DEFINITION } from './merchant-consortium-definition';
import { TEMPLE_OF_SPHERES_DEFINITION } from './temple-of-spheres-definition';
import { ARCANE_CIRCLE_DEFINITION } from './arcane-circle-definition';
import { RANGERS_BROTHERHOOD_DEFINITION } from './rangers-brotherhood-definition';
import { CIVIC_GUARD_DEFINITION } from './civic-guard-definition';
import { UNDERKING_COURT_DEFINITION } from './underking-court-definition';
import { HOLY_ORDER_DAWN_DEFINITION } from './holy-order-dawn-definition';
import { BUILDERS_FELLOWSHIP_DEFINITION } from './builders-fellowship-definition';
import { LOREKEEPERS_COVENANT_DEFINITION } from './lorekeepers-covenant-definition';

// Import constants for local use (e.g. ADVENTURING_GUILD_DEFINITION below) and
// re-export so existing callers of faction-definitions.ts keep working.
export {
  FACTION_REPUTATION_DECAY_PER_TICK,
  FACTION_REPUTATION_INACTIVITY_GRACE_TICKS,
  FACTION_REPUTATION_MAINTENANCE_PRIORITY_BOOST,
  FACTION_REPUTATION_MAINTENANCE_THRESHOLD,
  FACTION_REPUTATION_PROMOTION_URGENCY_GAP,
  FACTION_JOIN_STARTING_REPUTATION,
  FACTION_QUEST_REPUTATION_GAIN,
  FACTION_QUEST_REPUTATION_BONUS_SUCCESS,
  FACTION_PROMOTION_REPUTATION_BOOST,
  FACTION_EXPULSION_THRESHOLD,
  FACTION_GUILD_HALL_COUNT_MIN,
  FACTION_GUILD_HALL_COUNT_MAX,
  FACTION_REPUTATION_GAIN_PER_STEP,
  FACTION_REPUTATION_COMPLETION_BONUS,
  FACTION_RANK_CHANGE_COOLDOWN_TICKS,
  PROMOTION_PARTIAL_SUCCESS_MARGIN,
  PROMOTION_ENCOUNTER_COOLDOWN,
  PROMOTION_REWARD_GOLD,
  FACTION_ALERT_GLYPH,
  FACTION_ALERT_COLOR,
} from './faction-constants';
import { FACTION_REPUTATION_DECAY_PER_TICK } from './faction-constants';

// ─── Adventuring Guild Definition ────────────────────────────────────────

export const ADVENTURING_GUILD_DEFINITION: FactionDefinition = {
  id: 'adventuring_guild',
  nameTemplate: 'The Adventurers Guild',
  description: 'A fellowship of explorers, monster hunters, and treasure seekers who take on dangerous contracts for coin and glory.',
  motto: 'Fortune favors the bold.',
  iconGlyph: '⚔',
  themeColor: '#D4A574',
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
    // Monster hunt quests (m2.5) — targets lair and wilderness hexes
    'monster.hunt.minor', 'monster.hunt.named_elite',
  ],
  socialTemplateIds: [
    'ag.social.sparring', 'ag.social.tavern_tales', 'ag.social.mentor',
    'ag.social.bounty_plan', 'ag.social.share_maps', 'ag.social.rivalry',
  ],
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
  [MERCENARY_COMPANY_DEFINITION.id, MERCENARY_COMPANY_DEFINITION],
  [THIEVES_GUILD_DEFINITION.id, THIEVES_GUILD_DEFINITION],
  [MERCHANT_CONSORTIUM_DEFINITION.id, MERCHANT_CONSORTIUM_DEFINITION],
  [TEMPLE_OF_SPHERES_DEFINITION.id, TEMPLE_OF_SPHERES_DEFINITION],
  [ARCANE_CIRCLE_DEFINITION.id, ARCANE_CIRCLE_DEFINITION],
  [RANGERS_BROTHERHOOD_DEFINITION.id, RANGERS_BROTHERHOOD_DEFINITION],
  [CIVIC_GUARD_DEFINITION.id, CIVIC_GUARD_DEFINITION],
  [UNDERKING_COURT_DEFINITION.id, UNDERKING_COURT_DEFINITION],
  [HOLY_ORDER_DAWN_DEFINITION.id, HOLY_ORDER_DAWN_DEFINITION],
  [BUILDERS_FELLOWSHIP_DEFINITION.id, BUILDERS_FELLOWSHIP_DEFINITION],
  [LOREKEEPERS_COVENANT_DEFINITION.id, LOREKEEPERS_COVENANT_DEFINITION],
]);
