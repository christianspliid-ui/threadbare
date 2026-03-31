/**
 * Monster Faction Definitions — one per creation sphere.
 *
 * Monster factions are lair-based entities. They do NOT spawn guild halls.
 * They do NOT recruit agents. Their "membership" is one-way: lairs are
 * controlled by monster factions, and players interact by clearing them.
 *
 * Each definition follows the FactionDefinition interface exactly so the
 * existing faction system can register them without special-casing.
 *
 * Design doc: .planning/phases/m2.5-monster-encounters/m2.5-CONTEXT.md
 * NFP #1 Tunability: all sphere-specific weights are inline constants here.
 * NFP #3 Determinism: no randomness in definitions.
 */

import type { FactionDefinition } from '../types/faction';

// ─── Monster Faction Definitions ─────────────────────────────────────────────

export const MONSTER_FACTION_DEFINITIONS: FactionDefinition[] = [
  // ── Force ─────────────────────────────────────────────────────────
  {
    id: 'monster_force',
    nameTemplate: 'The {adj} Beast Pack',
    description: 'Savage beasts driven by primal force, claiming territory through raw strength.',
    iconGlyph: '🐺',
    themeColor: '#8B0000',
    factionType: 'monster',
    isMonsterFaction: true,
    reachWeights: { iron: 0.9, force: 0.7 },
    locationTypes: ['lair'],
    rankTiers: [
      {
        id: 'brute',
        name: 'Brute',
        minReputation: 0,
        maxSlots: null,
        bonuses: [],
        encounterAccess: ['monster.hunt.minor'],
      },
      {
        id: 'alpha',
        name: 'Alpha',
        minReputation: 0.5,
        maxSlots: 1,
        bonuses: [],
        encounterAccess: ['monster.hunt.named_elite'],
      },
    ],
    reputationDecayPerTick: 0,
    joinEncounterTemplateId: 'monster.hunt.minor',
    promotionEncounterTemplateId: 'monster.hunt.named_elite',
    questTemplateIds: [],
    socialTemplateIds: [],
    expulsionConsequences: [],
    ambitionWeights: { territorial_expansion: 0.6, revenge: 0.4 },
  },

  // ── Matter ────────────────────────────────────────────────────────
  {
    id: 'monster_matter',
    nameTemplate: 'The {adj} Golem Cluster',
    description: 'Animated constructs of stone and metal, grinding across the land.',
    iconGlyph: '🗿',
    themeColor: '#696969',
    factionType: 'monster',
    isMonsterFaction: true,
    reachWeights: { stone: 0.9, iron: 0.5 },
    locationTypes: ['lair'],
    rankTiers: [
      {
        id: 'construct',
        name: 'Construct',
        minReputation: 0,
        maxSlots: null,
        bonuses: [],
        encounterAccess: ['monster.hunt.minor'],
      },
      {
        id: 'titan',
        name: 'Titan',
        minReputation: 0.5,
        maxSlots: 1,
        bonuses: [],
        encounterAccess: ['monster.hunt.named_elite'],
      },
    ],
    reputationDecayPerTick: 0,
    joinEncounterTemplateId: 'monster.hunt.minor',
    promotionEncounterTemplateId: 'monster.hunt.named_elite',
    questTemplateIds: [],
    socialTemplateIds: [],
    expulsionConsequences: [],
    ambitionWeights: { defensive_consolidation: 0.7, territorial_expansion: 0.3 },
  },

  // ── Energy ────────────────────────────────────────────────────────
  {
    id: 'monster_energy',
    nameTemplate: 'The {adj} Storm Flock',
    description: 'Creatures of lightning and wind, riding the currents of raw energy.',
    iconGlyph: '⚡',
    themeColor: '#FFD700',
    factionType: 'monster',
    isMonsterFaction: true,
    reachWeights: { force: 0.8, star: 0.6 },
    locationTypes: ['lair'],
    rankTiers: [
      {
        id: 'spark',
        name: 'Spark',
        minReputation: 0,
        maxSlots: null,
        bonuses: [],
        encounterAccess: ['monster.hunt.minor'],
      },
      {
        id: 'tempest',
        name: 'Tempest',
        minReputation: 0.5,
        maxSlots: 1,
        bonuses: [],
        encounterAccess: ['monster.hunt.named_elite'],
      },
    ],
    reputationDecayPerTick: 0,
    joinEncounterTemplateId: 'monster.hunt.minor',
    promotionEncounterTemplateId: 'monster.hunt.named_elite',
    questTemplateIds: [],
    socialTemplateIds: [],
    expulsionConsequences: [],
    ambitionWeights: { territorial_expansion: 0.5, revenge: 0.5 },
  },

  // ── Life ──────────────────────────────────────────────────────────
  {
    id: 'monster_life',
    nameTemplate: 'The {adj} Behemoth Herd',
    description: 'Massive living creatures that overwhelm through sheer biological mass.',
    iconGlyph: '🦎',
    themeColor: '#228B22',
    factionType: 'monster',
    isMonsterFaction: true,
    reachWeights: { flesh: 0.9, eye: 0.4 },
    locationTypes: ['lair'],
    rankTiers: [
      {
        id: 'beast',
        name: 'Beast',
        minReputation: 0,
        maxSlots: null,
        bonuses: [],
        encounterAccess: ['monster.hunt.minor'],
      },
      {
        id: 'ancient',
        name: 'Ancient',
        minReputation: 0.5,
        maxSlots: 1,
        bonuses: [],
        encounterAccess: ['monster.hunt.named_elite'],
      },
    ],
    reputationDecayPerTick: 0,
    joinEncounterTemplateId: 'monster.hunt.minor',
    promotionEncounterTemplateId: 'monster.hunt.named_elite',
    questTemplateIds: [],
    socialTemplateIds: [],
    expulsionConsequences: [],
    ambitionWeights: { defensive_consolidation: 0.5, territorial_expansion: 0.5 },
  },

  // ── Mind ──────────────────────────────────────────────────────────
  {
    id: 'monster_mind',
    nameTemplate: 'The {adj} Mind Swarm',
    description: 'Psychic entities that overwhelm through collective will and mental domination.',
    iconGlyph: '🧠',
    themeColor: '#9932CC',
    factionType: 'monster',
    isMonsterFaction: true,
    reachWeights: { veil: 0.9, eye: 0.7 },
    locationTypes: ['lair'],
    rankTiers: [
      {
        id: 'drone',
        name: 'Drone',
        minReputation: 0,
        maxSlots: null,
        bonuses: [],
        encounterAccess: ['monster.hunt.minor'],
      },
      {
        id: 'hivemind',
        name: 'Hivemind',
        minReputation: 0.5,
        maxSlots: 1,
        bonuses: [],
        encounterAccess: ['monster.hunt.named_elite'],
      },
    ],
    reputationDecayPerTick: 0,
    joinEncounterTemplateId: 'monster.hunt.minor',
    promotionEncounterTemplateId: 'monster.hunt.named_elite',
    questTemplateIds: [],
    socialTemplateIds: [],
    expulsionConsequences: [],
    ambitionWeights: { cultural_dominance: 0.6, territorial_expansion: 0.4 },
  },

  // ── Spirit ────────────────────────────────────────────────────────
  {
    id: 'monster_spirit',
    nameTemplate: 'The {adj} Wraith Host',
    description: 'Spectral entities lingering between worlds, feeding on the living.',
    iconGlyph: '👻',
    themeColor: '#708090',
    factionType: 'monster',
    isMonsterFaction: true,
    reachWeights: { veil: 0.8, shadow: 0.7 },
    locationTypes: ['lair'],
    rankTiers: [
      {
        id: 'shade',
        name: 'Shade',
        minReputation: 0,
        maxSlots: null,
        bonuses: [],
        encounterAccess: ['monster.hunt.minor'],
      },
      {
        id: 'revenant',
        name: 'Revenant',
        minReputation: 0.5,
        maxSlots: 1,
        bonuses: [],
        encounterAccess: ['monster.hunt.named_elite'],
      },
    ],
    reputationDecayPerTick: 0,
    joinEncounterTemplateId: 'monster.hunt.minor',
    promotionEncounterTemplateId: 'monster.hunt.named_elite',
    questTemplateIds: [],
    socialTemplateIds: [],
    expulsionConsequences: [],
    ambitionWeights: { revenge: 0.7, territorial_expansion: 0.3 },
  },

  // ── Time ──────────────────────────────────────────────────────────
  {
    id: 'monster_time',
    nameTemplate: 'The {adj} Echo Stalkers',
    description: 'Temporal anomalies that hunt across fractured timelines.',
    iconGlyph: '⏳',
    themeColor: '#B8860B',
    factionType: 'monster',
    isMonsterFaction: true,
    reachWeights: { star: 0.8, veil: 0.5 },
    locationTypes: ['lair'],
    rankTiers: [
      {
        id: 'echo',
        name: 'Echo',
        minReputation: 0,
        maxSlots: null,
        bonuses: [],
        encounterAccess: ['monster.hunt.minor'],
      },
      {
        id: 'paradox',
        name: 'Paradox',
        minReputation: 0.5,
        maxSlots: 1,
        bonuses: [],
        encounterAccess: ['monster.hunt.named_elite'],
      },
    ],
    reputationDecayPerTick: 0,
    joinEncounterTemplateId: 'monster.hunt.minor',
    promotionEncounterTemplateId: 'monster.hunt.named_elite',
    questTemplateIds: [],
    socialTemplateIds: [],
    expulsionConsequences: [],
    ambitionWeights: { defensive_consolidation: 0.6, revenge: 0.4 },
  },

  // ── Entropy ───────────────────────────────────────────────────────
  {
    id: 'monster_entropy',
    nameTemplate: 'The {adj} Plague Shamble',
    description: 'Rotting masses spreading decay and dissolution wherever they shamble.',
    iconGlyph: '☠',
    themeColor: '#556B2F',
    factionType: 'monster',
    isMonsterFaction: true,
    reachWeights: { shadow: 0.8, flesh: 0.5 },
    locationTypes: ['lair'],
    rankTiers: [
      {
        id: 'rot',
        name: 'Rot',
        minReputation: 0,
        maxSlots: null,
        bonuses: [],
        encounterAccess: ['monster.hunt.minor'],
      },
      {
        id: 'blightwarden',
        name: 'Blightwarden',
        minReputation: 0.5,
        maxSlots: 1,
        bonuses: [],
        encounterAccess: ['monster.hunt.named_elite'],
      },
    ],
    reputationDecayPerTick: 0,
    joinEncounterTemplateId: 'monster.hunt.minor',
    promotionEncounterTemplateId: 'monster.hunt.named_elite',
    questTemplateIds: [],
    socialTemplateIds: [],
    expulsionConsequences: [],
    ambitionWeights: { territorial_expansion: 0.7, revenge: 0.3 },
  },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Find a monster faction definition by sphere name.
 * Returns undefined if no faction exists for that sphere.
 */
export function getMonsterFactionBySphere(sphere: string): FactionDefinition | undefined {
  return MONSTER_FACTION_DEFINITIONS.find(d => d.id === `monster_${sphere}`);
}
