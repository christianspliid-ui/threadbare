import type { SphereName } from './index';
import type { ReachDomain } from './traits';

// ─── Position Ranks ──────────────────────────────────────────────────

/** Court position rank hierarchy */
export type PositionRank = 'apex' | 'inner' | 'outer';

/** Position rank ordering (highest to lowest authority) */
export const POSITION_RANK_ORDER: PositionRank[] = ['apex', 'inner', 'outer'];

/** Minimum tier required to hold a position rank */
export const RANK_MIN_TIER: Record<PositionRank, number> = {
  apex: 3,
  inner: 2,
  outer: 1,
};

/** Essence cost to reassign an agent within a rank */
export const RANK_REASSIGNMENT_COST: Record<PositionRank, number> = {
  apex: 15,
  inner: 10,
  outer: 5,
};

/** Essence cost to demote an agent one rank down */
export const RANK_DEMOTION_COST: Record<PositionRank, number> = {
  apex: 20,
  inner: 15,
  outer: 10,
};

/** Multiplier applied to reassignment cost per previous reassignment in same position */
export const REASSIGNMENT_ESCALATION = 1.25;

/** Essence cost to restructure the entire court */
export const RESTRUCTURE_COST = 50;

// ─── Court Structure Types ──────────────────────────────────────────

/** Divine court structure archetype */
export type CourtStructureType = 'high_house' | 'circle' | 'web' | 'abyss';

/** Foundation sphere alignment for a court structure */
export type FoundationAffinity = 'order' | 'light' | 'chaos' | 'darkness';

// ─── Structure Bonuses ───────────────────────────────────────────────

/** A mechanical bonus conferred by a court structure type */
export interface StructureBonus {
  type: string;
  description: string;
  appliesTo: 'all_positions' | 'apex_only' | 'inner_outer' | 'specific_reach';
  value: number;
}

/** Complete definition of a court structure archetype */
export interface CourtStructureDefinition {
  id: CourtStructureType;
  structureType: CourtStructureType;
  foundationAffinity: FoundationAffinity;
  name: string;
  description: string;
  flavorText: string;
  positionCounts: {
    apex: number;
    inner: number;
    outer: number;
  };
  sacredSiteSlots: number;
  artifactSlots: number;
  structureBonus: StructureBonus;
}

// ─── Positions ───────────────────────────────────────────────────────

/** A slot in the court structure with optional agent assignment */
export interface Position {
  id: string;
  rank: PositionRank;
  slotIndex: number;
  archetype: string;
  assignedAgentId: string | null;
  activeTitle: string | null;
  locked: boolean;
}

// ─── Titles ──────────────────────────────────────────────────────────

/** Types of mechanical effects a title can have */
export type TitleEffectType =
  | 'essence_production'
  | 'influence_multiplier'
  | 'reach_domain_bonus'
  | 'trait_synergy'
  | 'detection_penalty'
  | 'narrative_override';

/** A single mechanical effect on a title */
export interface TitleEffect {
  type: TitleEffectType;
  target: string;
  value: number;
  description: string;
}

/** A divine title that can be assigned to a position */
export interface Title {
  id: string;
  name: string;
  rank: PositionRank;
  sphereAffinity: SphereName;
  domainAffinity: ReachDomain;
  bonuses: TitleEffect[];
  weaknesses: TitleEffect[];
  flavorText: string;
  generationSeed: number;
}

/** A title proposed for assignment to a position */
export interface TitleProposal {
  title: Title;
  rationale: string;
}

// ─── Sacred Sites ────────────────────────────────────────────────────

/** A consecrated location that enhances court power */
export interface SacredSite {
  slotIndex: number;
  locationId: string;
  locationName: string;
  consecrationCost: number;
  radiusSphereInfluence: SphereName;
  influenceStrength: number;
  bonusEssencePerTick: number;
}

// ─── Divine Artifacts ────────────────────────────────────────────────

/** A legendary artifact held by an agent in the court */
export interface DivineArtifact {
  slotIndex: number;
  artifactId: string;
  name: string;
  bearerId: string | null;
  bearerName: string | null;
  sphereAffinity: SphereName;
  effects: TitleEffect[];
  lossConsequence: string;
  creationCost: number;
}

// ─── Title Assignment Actions ────────────────────────────────────────

/** Action type for court position changes */
export type TitleAction = 'assign' | 'reassign' | 'demote' | 'restructure';

/** Record of a title assignment event */
export interface TitleAssignment {
  tick: number;
  positionId: string;
  agentId: string;
  titleId: string;
  action: TitleAction;
  essenceCost: number;
}

// ─── Scry State ──────────────────────────────────────────────────────

/** Complete state of the Divine Court (Scry) system */
export interface ScryState {
  courtStructureType: CourtStructureType;
  positions: Position[];
  sacredSites: SacredSite[];
  artifacts: DivineArtifact[];
  titleHistory: TitleAssignment[];
  totalReassignmentCount: number;
  initialized: boolean;
}
