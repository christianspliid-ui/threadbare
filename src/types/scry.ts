/**
 * Ascendant Scry — Type definitions for the divine court system.
 *
 * The Scry is a metaphysical overlay showing the player's divine court:
 * agent positions with titles, sacred site slots, and artifact slots.
 */

import type { SphereName } from './index';
import type { ReachDomain } from './traits';

// ─── Position Ranks ─────────────────────────────────────────────

export type PositionRank = 'apex' | 'inner' | 'outer';

export const POSITION_RANK_ORDER: PositionRank[] = ['apex', 'inner', 'outer'];

/** Minimum influence tier required to fill a position of this rank */
export const RANK_MIN_TIER: Record<PositionRank, number> = {
  apex: 3,   // Devoted+
  inner: 2,  // Aligned+
  outer: 1,  // Touched+
};

/** Base essence cost to reassign a position of this rank */
export const RANK_REASSIGNMENT_COST: Record<PositionRank, number> = {
  apex: 30,
  inner: 15,
  outer: 5,
};

/** Demotion costs half of reassignment */
export const RANK_DEMOTION_COST: Record<PositionRank, number> = {
  apex: 15,
  inner: 8,
  outer: 3,
};

/** Each subsequent reassignment increases cost by this factor */
export const REASSIGNMENT_ESCALATION = 1.25;

/** Essence cost to restructure the entire court */
export const RESTRUCTURE_COST = 50;

// ─── Court Structures ───────────────────────────────────────────

export type CourtStructureType = 'high_house' | 'circle' | 'web' | 'abyss';

export type FoundationAffinity = 'order' | 'light' | 'chaos' | 'darkness';

export interface StructureBonus {
  type: 'tier_cost' | 'sphere_influence' | 'domain_bonus' | 'weakness_reduction';
  description: string;
  /** Which positions this bonus applies to ('all' or specific ranks) */
  appliesTo: 'all' | PositionRank;
  value: number;
}

export interface CourtStructureDefinition {
  id: string;
  structureType: CourtStructureType;
  foundationAffinity: FoundationAffinity;
  name: string;
  description: string;
  flavorText: string;
  positionCounts: Record<PositionRank, number>;
  sacredSiteSlots: number;
  artifactSlots: number;
  structureBonus: StructureBonus;
}

// ─── Positions ──────────────────────────────────────────────────

export interface Position {
  id: string;
  rank: PositionRank;
  slotIndex: number;
  /** Position archetype — thematic label guiding title generation */
  archetype: string;
  assignedAgentId: string | null;
  activeTitle: Title | null;
  /** Expansion hook: sealed positions can be unlocked later */
  locked: boolean;
}

// ─── Titles ─────────────────────────────────────────────────────

export type TitleEffectType =
  | 'domain_bonus'
  | 'tier_cost'
  | 'detection_risk'
  | 'essence_gen'
  | 'sphere_influence'
  | 'custom';

export interface TitleEffect {
  type: TitleEffectType;
  target: string;
  value: number;
  description: string;
}

export interface Title {
  id: string;
  name: string;
  rank: PositionRank;
  sphereAffinity: SphereName;
  domainAffinity: ReachDomain;
  bonuses: TitleEffect[];
  weaknesses: TitleEffect[];
  flavorText: string;
  /** Params used to generate this title (for reproducibility) */
  generationSeed: Record<string, unknown>;
}

/** A title option presented to the player during assignment */
export interface TitleProposal {
  title: Title;
  /** Why this title fits the agent (for UI tooltip) */
  rationale: string;
}

// ─── Holdings: Sacred Sites ─────────────────────────────────────

export interface SacredSite {
  slotIndex: number;
  locationId: string | null;
  locationName: string | null;
  consecrationCost: number;
  radiusSphereInfluence: SphereName | null;
  influenceStrength: number;
  bonusEssencePerTick: number;
}

// ─── Holdings: Divine Artifacts ─────────────────────────────────

export interface DivineArtifact {
  slotIndex: number;
  artifactId: string | null;
  name: string | null;
  bearerId: string | null;
  bearerName: string | null;
  sphereAffinity: SphereName | null;
  effects: TitleEffect[];
  lossConsequence: string | null;
  creationCost: number;
}

// ─── Scry State ─────────────────────────────────────────────────

export type TitleAction = 'assign' | 'reassign' | 'demote' | 'restructure';

export interface TitleAssignment {
  tick: number;
  positionId: string;
  agentId: string;
  titleId: string;
  action: TitleAction;
  essenceCost: number;
}

export interface ScryState {
  /** Which court structure the player chose */
  courtStructureType: CourtStructureType;
  /** Instantiated positions with assignments */
  positions: Position[];
  /** Sacred site holdings */
  sacredSites: SacredSite[];
  /** Artifact holdings */
  artifacts: DivineArtifact[];
  /** Audit trail of all title changes */
  titleHistory: TitleAssignment[];
  /** Running count of reassignments (for cost escalation) */
  totalReassignmentCount: number;
  /** Title IDs that have been assigned at least once — cannot be reused */
  usedTitleIds: string[];
  /** Whether the scry has been initialized (player has chosen a structure) */
  initialized: boolean;
}
