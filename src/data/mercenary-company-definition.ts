/**
 * Mercenary Company Faction Definition — TB-073 Phase 0.
 *
 * The second faction vertical slice (after Adventuring Guild). Inherently
 * military — its core business is fighting, making it the ideal test bed
 * for the army/conflict pipeline.
 *
 * Evolving autonomy model:
 *  - Early: hired tool — ambitions are reactive (resource_acquisition)
 *  - Mid: autonomous warlord — gains territorial_expansion/revenge
 *  - Late: political force — full ambition range
 *
 * Design doc: Docs/plans/2026-03-29-conflict-and-destruction-design.md
 */

import type { FactionDefinition } from '../types/faction';

// ─── Constants ───────────────────────────────────────────────────────────

/** Faster decay than guild — mercs are transactional */
export const MC_REPUTATION_DECAY_PER_TICK = 0.004;

/** Named company names — two instances seeded at world init, placed at maximum distance */
export const MC_COMPANY_NAMES: readonly string[] = ['The Iron Wolves', 'The Scarlet Company'];

/** Minimum merc company halls per faction instance */
export const MC_HALL_COUNT_MIN = 2;

/** Maximum merc company halls per faction instance */
export const MC_HALL_COUNT_MAX = 4;

// ─── Definition ─────────────────────────────────────────────────────────

export const MERCENARY_COMPANY_DEFINITION: FactionDefinition = {
  id: 'mercenary_company',
  nameTemplate: 'The Free Company',
  description: 'Professional soldiers for hire — loyalty lasts as long as the contract, but their blades are sharp and their discipline unmatched.',
  motto: 'Steel speaks louder than oaths.',
  iconGlyph: '🗡',
  themeColor: '#8B4513',
  factionType: 'military',
  reachWeights: {
    iron: 0.9,
    gold: 0.7,
    shadow: 0.4,
    heart: 0.3,
    stone: 0.3,
    eye: 0.2,
    star: 0.1,
    veil: 0.1,
  },
  instanceCount: 2,
  distanceConstrained: true,
  locationTypes: ['town', 'city', 'capital', 'fort', 'castle'],
  rankTiers: [
    {
      id: 'sellsword',
      name: 'Sellsword',
      minReputation: 0.0,
      maxSlots: null,
      bonuses: [],
      encounterAccess: ['mc.quest.'],
    },
    {
      id: 'sergeant_at_arms',
      name: 'Sergeant-at-Arms',
      minReputation: 0.3,
      maxSlots: null,
      bonuses: [
        {
          type: 'encounter_reward_multiplier',
          value: 1.20,
          description: '+20% contract rewards',
        },
      ],
      encounterAccess: ['mc.quest.', 'mc.senior.'],
    },
    {
      id: 'captain',
      name: 'Captain',
      minReputation: 0.6,
      maxSlots: null,
      bonuses: [
        {
          type: 'encounter_reward_multiplier',
          value: 1.35,
          description: '+35% contract rewards',
        },
        {
          type: 'scoring_boost',
          value: 0.15,
          description: '+0.15 scoring for Iron encounters',
        },
      ],
      encounterAccess: ['mc.quest.', 'mc.senior.', 'mc.elite.'],
    },
    {
      id: 'war_chief',
      name: 'War Chief',
      minReputation: 0.85,
      maxSlots: 1,
      bonuses: [
        {
          type: 'encounter_reward_multiplier',
          value: 1.50,
          description: '+50% contract rewards',
        },
        {
          type: 'scoring_boost',
          value: 0.25,
          description: '+0.25 scoring for all company encounters',
        },
        {
          type: 'reputation_walk_bonus',
          value: 0.20,
          description: '+0.20 trust via company network',
        },
      ],
      encounterAccess: ['mc.quest.', 'mc.senior.', 'mc.elite.', 'mc.leadership.'],
    },
  ],
  reputationDecayPerTick: MC_REPUTATION_DECAY_PER_TICK,
  joinEncounterTemplateId: 'mc.join',
  promotionEncounterTemplateId: 'mc.promotion',
  questTemplateIds: [
    'mc.quest.patrol', 'mc.quest.guard_caravan', 'mc.quest.collect_bounty',
    'mc.quest.siege_work',
    'mc.senior.field_command', 'mc.senior.hostile_negotiation',
    'mc.elite.war_council',
  ],
  socialTemplateIds: [
    'mc.social.sparring_ring', 'mc.social.war_stories', 'mc.social.contract_negotiation',
  ],
  expulsionConsequences: [
    { type: 'remove_encounters', params: {} },
  ],
  ambitionWeights: {
    resource_acquisition: 0.5,
    defensive_consolidation: 0.2,
    territorial_expansion: 0.15,
    revenge: 0.15,
  },
};
