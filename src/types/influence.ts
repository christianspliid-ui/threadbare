/**
 * Influence & Ascendant type definitions.
 *
 * The player's Ascendant is a divine entity that accumulates sphere-typed
 * Influence Essence and spends it to manipulate actors in the world graph.
 */

import type { SphereName } from './index';
import type { AxiologicalProfile } from './agent';
import type { ReachDomain } from './traits';
import type { MeetingChoiceRecord } from './meetingEncounter';
import type { BeatOutcome, OrdealOutcome } from './journeyEngine';
import type { AscendantIdentity } from './remembrance';

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

/** Court position within the divine court spectrum. */
export type CourtPosition = 'the_first' | 'retinue' | 'watched' | 'dormant';

/** Campbellian journey phase for The First's hero arc. */
export type CampbellianPhase = 'call' | 'road_of_trials' | 'crisis' | 'ordeal' | 'return';

/**
 * Properties stored on 'thread' edges (ascendant → mortal).
 * The god reaches down; the mortal is the subject.
 *
 * Migrated from InfluenceRelationshipProperties (worships edge).
 * Direction flipped: was mortal→god, now god→mortal.
 */
export interface ThreadEdgeProperties {
  // ── Court position (Phase 1+) ───────────────────────────────
  /** Position in the divine court. null = thread exists but no named position. */
  courtPosition?: CourtPosition | null;

  // ── Investment depth (carried from InfluenceRelationshipProperties) ──
  tier: InfluenceTier;
  /** Ticks of continuous maintained influence at current tier. */
  ticksAtCurrentTier: number;
  /** Tick when this relationship was established. */
  establishedTick: number;
  /** Cumulative essence spent on this relationship. */
  totalEssenceSpent: number;
  /** Whether maintenance was paid this tick. */
  maintenanceCurrent: boolean;

  // ── Mortal's experience of the thread ───────────────────────
  /** How the mortal perceives the divine connection. */
  awareness?: 'unaware' | 'intuition' | 'faith' | 'communion';
  /** How many backstory tiers the player has read. Default 0. */
  readBackstoryTier: 0 | 1 | 2 | 3 | 4;

  // ── Attention mode (Phase 4+) ──────────────────────────────
  /** Determines vignette behavior: 'pause' = auto-interrupt, 'auto_resolve' = background. */
  attentionMode?: 'pause' | 'auto_resolve';

  // ── Journey state (Phase 2+, only for The First) ───────────
  /** Current Campbellian journey phase. */
  storyPhase?: CampbellianPhase;
  /** Ordeal beat outcome (Phase 3+). */
  ordealOutcome?: OrdealOutcome;
  /** Record of choices made during the meeting encounter (Phase 1+). */
  meetingChoiceRecord?: MeetingChoiceRecord;
  /** History of journey beat outcomes (Phase 2+). */
  beatHistory?: BeatOutcome[];

  // ── Intervention tracking (Phase 4+) ──────────────────────
  interventionTracking?: Record<string, unknown>;
}

/** @deprecated Use ThreadEdgeProperties instead. Alias for backward compatibility. */
export type InfluenceRelationshipProperties = ThreadEdgeProperties;

// ─── Aspect apex state (THR-479) ─────────────────────────────────────

/**
 * Properties stored on an `aspect_of` edge (ascendant → mortal).
 *
 * "Aspect" is the apex milestone *beyond* the five Influence tiers — a
 * mortal who has become a partial aspect of the god. It is a distinct
 * relationship, not a sixth tier, and is modelled as its own edge so it
 * can survive the mortal's death (the edge is never garbage-collected).
 */
export interface AspectEdgeProperties {
  /** Tick the Aspect was attained. */
  attainedTick: number;
  /** Encounter instance id of the apotheosis capstone that granted it. */
  originEncounterId: string;
  /** Influence tier at the moment of grant (always 4; recorded for audit). */
  sourceTier: InfluenceTier;
  /** Invariant marker: an Aspect is permanent and survives death. */
  survivesDeath: true;
  /**
   * Set true when the Aspect's mortal body dies. The relationship persists
   * as lasting myth; a mythic echo no longer channels essence.
   */
  mythicEcho?: boolean;
  /** Tick the mortal died and the Aspect became a mythic echo. */
  echoedTick?: number;
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
  /**
   * Reach affinities persisted at creation (THR-503). Fixed for the whole run —
   * the ascendant's primary + secondary reach. Read by the reach gate in
   * getTargetActionSlots() to hide cards requiring a reach this god lacks.
   */
  domainAffinities?: Partial<Record<ReachDomain, number>>;
  /** Identity drift tracking: running tally of intervention types used. */
  interventionHistory: Record<string, number>;
  /** Avatar node ID. */
  avatarId: string;
  /**
   * Home seat (throne) location id (THR-502). The location flagged as the
   * ascendant's seat — a named, higher-yield place of power. Set by a spine
   * beat (or the `setHomeSeat` debug helper). When it resolves to a live
   * location node, essence generation gains one `ESSENCE_PER_SEAT` term and
   * the hex map renders a seat signifier. Optional: a run without a seat omits it.
   */
  homeSeatLocationId?: string;
  /**
   * Fraction of the next non-self action's essence cost to refund (set by Recede).
   * Cleared after the discount is applied. 0.5 = 50% refund.
   */
  nextActionDiscount?: number;
  /**
   * Tier bonus applied to the next non-self action's capability roll (set by Focus).
   * Cleared after consumed. 1 = +1 effective tier.
   */
  nextActionTierBoost?: number;
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

// AscendantIdentity is defined in src/types/remembrance.ts (Task 1 Step 1).
export interface RemembranceCreationConfig {
  identity: AscendantIdentity;
  avatar: AvatarConfig;
}

// ─── Re-exports from influence-content ────────────────────────────

// Re-export content data for backward compatibility
export {
  BASE_ESSENCE_PER_TICK,
  ESSENCE_PER_THREAD,
  ESSENCE_PER_WORSHIPPER,
  ESSENCE_PER_PLACE_OF_POWER,
  ESSENCE_PER_SEAT,
  BASE_MAX_ESSENCE,
  MAX_ESSENCE_PER_THREAD,
  MAX_ESSENCE_PER_WORSHIPPER,
  TIER_NAMES,
  TIER_MAINTENANCE,
  TIER_PROMOTION_THRESHOLDS,
  RECRUIT_COST,
  DISCOVER_COST,
  OBSERVE_COST,
} from '../data/influence-content';
