/**
 * Faction Definition Types — data-driven faction system.
 *
 * FactionDefinition describes what a faction IS: its structure, encounters,
 * hierarchy, and behavior. All factions (guilds, military orders, religious
 * sects) share this shape. Instance data lives on graph nodes; this is the
 * template that drives behavior.
 *
 * Design doc: Docs/plans/2026-03-27-faction-vertical-slice-design.md
 * NFP: Tunability (all thresholds are named fields), Inspectability (trace types defined),
 *       Determinism (no runtime randomness in definitions), Fail-soft (fallback constants).
 */

import type { ReachDomain } from './traits';
import type { LocationSubtype } from './index';

// ─── Rank Bonuses ────────────────────────────────────────────────────────

export type FactionRankBonusType =
  | 'scoring_boost'
  | 'reputation_walk_bonus'
  | 'encounter_reward_multiplier';

export interface FactionRankBonus {
  type: FactionRankBonusType;
  /** Numeric value of the bonus (multiplier or additive, context-dependent) */
  value: number;
  /** Human-readable description for UI display */
  description: string;
}

// ─── Rank Tiers ──────────────────────────────────────────────────────────

export interface FactionRankTier {
  /** Unique tier ID within the faction, e.g. 'journeyman', 'sergeant' */
  id: string;
  /** Display name: "Journeyman", "Sergeant", etc. */
  name: string;
  /** Reputation threshold to hold this rank (0.0–1.0) */
  minReputation: number;
  /** null = unlimited slots, number = competitive (e.g. only 1 leader) */
  maxSlots: number | null;
  /** Bonuses granted at this rank */
  bonuses: FactionRankBonus[];
  /** Template ID prefixes unlocked at this rank */
  encounterAccess: string[];
}

// ─── Expulsion ───────────────────────────────────────────────────────────

export type ExpulsionConsequenceType =
  | 'remove_encounters'
  | 'add_encounter'
  | 'reputation_penalty'
  | 'trait_grant';

export interface ExpulsionConsequence {
  type: ExpulsionConsequenceType;
  params: Record<string, unknown>;
}

// ─── Faction Encounter Metadata ──────────────────────────────────────────

/**
 * Extension metadata for faction-specific encounter templates.
 * Stored alongside standard EncounterTemplate data.
 */
export interface FactionEncounterMeta {
  /** Which faction definition this belongs to */
  factionDefId: string;
  /** Rank tier ID required ('journeyman', 'sergeant', etc.) */
  minRank: string;
  /** Faction reputation gained on completion */
  reputationReward: number;
  /** Quest difficulty tier */
  questType: 'standard' | 'senior' | 'elite' | 'leadership';
}

// ─── Faction Definition ──────────────────────────────────────────────────

export type FactionType =
  | 'guild'
  | 'military'
  | 'religious'
  | 'political'
  | 'criminal';

export interface FactionDefinition {
  /** Unique identifier, e.g. 'adventuring_guild' */
  id: string;
  /** Name template: "The {adj} Adventurers Guild" */
  nameTemplate: string;
  /** Faction archetype */
  factionType: FactionType;
  /** Template pool weighting per reach domain (0.0–1.0) */
  reachWeights: Partial<Record<ReachDomain, number>>;
  /** Settlement types where guild halls can appear */
  locationTypes: LocationSubtype[];
  /** Rank tiers ordered lowest → highest */
  rankTiers: FactionRankTier[];
  /** How fast reputation fades per tick (subtracted from reputation each tick) */
  reputationDecayPerTick: number;
  /** Which encounter template ID handles joining */
  joinEncounterTemplateId: string;
  /** Which encounter template ID handles promotion */
  promotionEncounterTemplateId: string;
  /** Available quest template IDs */
  questTemplateIds: string[];
  /** Faction-scoped social template IDs */
  socialTemplateIds: string[];
  /** What happens when reputation hits 0 */
  expulsionConsequences: ExpulsionConsequence[];
  /** Ambition type weighting for faction-level ambition selection (TB-073) */
  ambitionWeights?: Partial<Record<FactionAmbitionType, number>>;
  /** Number of instances to seed (defaults to 1). Used for factions with multiple competing instances. */
  instanceCount?: number;
  /** When true and instanceCount > 1, place instances at maximum hex distance from each other. */
  distanceConstrained?: boolean;
}

// ─── Faction Ambitions (TB-073) ─────────────────────────────────────────

export type FactionAmbitionType =
  | 'territorial_expansion'    // Conquest-driven — high conflict potential
  | 'resource_acquisition'     // Economic — can escalate to conflict
  | 'defensive_consolidation'  // Fortification — low-medium conflict
  | 'cultural_dominance'       // Sphere influence spread — friction builds
  | 'revenge'                  // Retaliation for past grievances — high, emotional
  | 'divine_mandate';          // Carry out ascendant's will (strongly threaded factions)

export interface FactionAmbition {
  type: FactionAmbitionType;
  /** 0–1 urgency */
  priority: number;
  /** Target settlement/faction/hex node ID */
  targetNodeId: string | null;
  /** For revenge: who wronged us */
  grievanceSourceId?: string;
  /** How fast grudge fades (per tick) */
  grievanceDecay: number;
  /** Tick this ambition was created */
  createdTick: number;
}

/** Ambition types that require military force (armies) */
export const MILITARY_AMBITION_TYPES: readonly FactionAmbitionType[] = [
  'territorial_expansion',
  'revenge',
];

/** Check if an ambition type requires military force */
export function requiresMilitaryForce(ambitionType: FactionAmbitionType): boolean {
  return (MILITARY_AMBITION_TYPES as readonly string[]).includes(ambitionType);
}

// ─── Trace Types ─────────────────────────────────────────────────────────

export interface FactionSeedTrace {
  tick: 0;
  category: 'faction_seed';
  factionId: string;
  definitionId: string;
  guildHallCount: number;
  locationIds: string[];
  summary: string;
}

export interface FactionReputationTrace {
  tick: number;
  category: 'faction_reputation';
  agentId: string;
  factionId: string;
  oldReputation: number;
  newReputation: number;
  cause: 'quest_step' | 'quest_complete' | 'decay' | 'promotion';
  rankChanged: boolean;
  oldRank: string;
  newRank: string;
  summary: string;
}

export interface FactionPromotionTrace {
  tick: number;
  category: 'faction_promotion';
  agentId: string;
  factionId: string;
  fromRank: string;
  toRank: string;
  outcome: 'full_success' | 'partial_success' | 'failure';
  complication?: string;
  summary: string;
}

export interface FactionAmbitionTrace {
  tick: number;
  category: 'faction_ambition';
  factionId: string;
  ambitionType: FactionAmbitionType;
  event: 'created' | 'prioritized' | 'progressed' | 'completed' | 'abandoned';
  reason: string;
  summary: string;
}

export interface FactionBonusTrace {
  tick: number;
  category: 'faction_bonus';
  agentId: string;
  factionId: string;
  bonusType: string;
  value: number;
  context: string;
  summary: string;
}

// ─── Helper ──────────────────────────────────────────────────────────────

/**
 * Compute the highest rank tier an agent qualifies for based on reputation.
 * Returns the lowest tier if reputation is below all thresholds.
 */
export function computeRankFromReputation(
  reputation: number,
  definition: FactionDefinition,
): FactionRankTier {
  const tiers = definition.rankTiers;
  if (tiers.length === 0) {
    throw new Error(`FactionDefinition '${definition.id}' has no rank tiers`);
  }

  // Walk tiers highest → lowest, return first that qualifies
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (reputation >= tiers[i].minReputation) {
      return tiers[i];
    }
  }

  // Fallback: lowest tier (should always match since minReputation=0 for entry tier)
  return tiers[0];
}
