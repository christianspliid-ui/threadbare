/**
 * Influence & Ascendant type definitions.
 *
 * The player's Ascendant is a divine entity that accumulates sphere-typed
 * Influence Essence and spends it to manipulate actors in the world graph.
 */

import type { SphereName } from './index';
import type { AxiologicalProfile } from './agent';
import type { ReachDomain } from './traits';

// ─── Influence Essence ───────────────────────────────────────────────

/** Sphere-typed essence pool. Each sphere has its own balance. */
export type EssencePool = Record<SphereName, number>;

/** Per-tick generation rates by sphere. */
export type EssenceGeneration = Record<SphereName, number>;

/** How essence generation is distributed based on sphere alignment. */
export interface EssenceDistribution {
  /** Primary sphere gets this fraction (e.g., 0.35) */
  primaryFraction: number;
  /** Secondary sphere gets this fraction (e.g., 0.25) */
  secondaryFraction: number;
  /** Remaining 6 spheres split the rest equally */
}

// ─── Influence Tiers ─────────────────────────────────────────────────

/** Influence tier levels (0-4). Higher = deeper divine connection. */
export type InfluenceTier = 0 | 1 | 2 | 3 | 4;

// ─── Influence Relationship Properties ───────────────────────────────

/**
 * Properties stored on 'worships' edges between actor → ascendant.
 * Tracks the influence relationship state.
 */
export interface InfluenceRelationshipProperties {
  tier: InfluenceTier;
  /** Ticks of continuous maintained influence at current tier. */
  ticksAtCurrentTier: number;
  /** Tick when this relationship was established. */
  establishedTick: number;
  /** Cumulative essence spent on this relationship. */
  totalEssenceSpent: number;
  /** Whether maintenance was paid this tick. */
  maintenanceCurrent: boolean;
}

// ─── Ascendant ───────────────────────────────────────────────────────

/** Sphere alignment for an Ascendant — primary and secondary. */
export interface SphereAlignment {
  primary: SphereName;
  secondary: SphereName;
}

/**
 * Properties stored on the Ascendant actor node (in node.properties).
 */
export interface AscendantProperties {
  actorType: 'ascendant';
  /** Primary and secondary sphere alignment. */
  sphereAlignment: SphereAlignment;
  /** Current essence pool. */
  essencePool: EssencePool;
  /** Maximum essence pool size (computed, cached). */
  maxEssence: number;
  /** The archetype chosen at creation. */
  archetypeId: string;
  /** Identity drift tracking: running tally of intervention types used. */
  interventionHistory: Record<string, number>;
  /** Avatar node ID. */
  avatarId: string;
}

/**
 * An Ascendant archetype offered during creation.
 * Generated from World-Soul state; player picks one.
 */
export interface AscendantArchetype {
  id: string;
  name: string;
  title: string;
  description: string;
  sphereAlignment: SphereAlignment;
  /** Starting domain affinities (which Reaches this god is good at). */
  startingDomainAffinities: Partial<Record<ReachDomain, number>>;
  /** Personality seed — initial axiological profile. */
  personalitySeed: AxiologicalProfile;
  /** Flavor text for the archetype. */
  flavorText: string;
}

/**
 * Avatar creation config.
 */
export interface AvatarConfig {
  name: string;
  /** Starting location node ID. */
  startLocationId: string;
  /** Avatar form flavor (e.g., "old wizard", "wandering shaman"). */
  formDescription: string;
}

/**
 * Full creation config passed to createAscendant().
 */
export interface AscendantCreationConfig {
  archetype: AscendantArchetype;
  avatar: AvatarConfig;
}

// ─── Re-exports from influence-content ────────────────────────────

// Re-export content data for backward compatibility
export {
  BASE_ESSENCE_PER_TICK,
  ESSENCE_PER_WORSHIPPER,
  ESSENCE_PER_PLACE_OF_POWER,
  BASE_MAX_ESSENCE,
  MAX_ESSENCE_PER_WORSHIPPER,
  TIER_NAMES,
  TIER_MAINTENANCE,
  TIER_PROMOTION_THRESHOLDS,
  RECRUIT_COST,
  DISCOVER_COST,
  OBSERVE_COST,
} from '../data/influence-content';
