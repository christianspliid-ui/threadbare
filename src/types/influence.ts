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

/** Base generation rate: 1 essence per tick. */
export const BASE_ESSENCE_PER_TICK = 1.0;

/** Essence per worshipper per tick. */
export const ESSENCE_PER_WORSHIPPER = 0.1;

/** Essence bonus per controlled place of power per tick. */
export const ESSENCE_PER_PLACE_OF_POWER = 0.5;

/** Maximum essence pool scales with total influence level. */
export const BASE_MAX_ESSENCE = 50;
export const MAX_ESSENCE_PER_WORSHIPPER = 5;

// ─── Influence Tiers ─────────────────────────────────────────────────

/** Influence tier levels (0-4). Higher = deeper divine connection. */
export type InfluenceTier = 0 | 1 | 2 | 3 | 4;

/** Working names for each tier. */
export const TIER_NAMES: Record<InfluenceTier, string> = {
  0: 'Unaware',
  1: 'Touched',
  2: 'Devoted',
  3: 'Champion',
  4: 'Aspect',
};

/** Maintenance cost per tick per tier. */
export const TIER_MAINTENANCE: Record<InfluenceTier, number> = {
  0: 0,
  1: 0.5,
  2: 1.0,
  3: 2.0,
  4: 4.0,
};

/** Ticks of maintained influence needed to promote to each tier. */
export const TIER_PROMOTION_THRESHOLDS: Record<InfluenceTier, number> = {
  0: 0,    // automatic
  1: 0,    // immediate on recruitment (costs 5 essence)
  2: 30,   // ~1 month of maintained influence
  3: 90,   // ~1 season
  4: 180,  // ~2 seasons
};

/** Cost to recruit a new actor (establish Tier 1 influence). */
export const RECRUIT_COST = 5;

/** Cost to discover actors at current location. */
export const DISCOVER_COST = 1;

/** Cost to observe (reveal hidden properties). */
export const OBSERVE_COST = 0.5;

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
