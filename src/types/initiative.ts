/**
 * Agent Initiatives — Type Definitions (THR-51)
 *
 * Initiatives are multi-tick autonomous projects that agents pursue to create
 * durable world changes (new factions, sublocations, relationships, encounters).
 * They compete with encounters in the agent decision pipeline.
 */

import type { ReachDomain } from './traits';
import type { ValuePair } from './agent';

// ─── Prerequisite Types ──────────────────────────────────────────

/** Axiological bias requirement for initiative eligibility. */
export interface AxiologicalBiasRequirement {
  axis: ValuePair;
  /** 'left' = negative side of axis, 'right' = positive side. */
  direction: 'left' | 'right';
  /** How far the agent must lean (0.0–1.0). */
  minStrength: number;
}

/** Location filter for initiative eligibility. */
export interface InitiativeLocationFilter {
  /** Settlement subtype minimum (e.g. 'town' means town, city, or capital). */
  requiredSubtype?: string;
  /** Minimum number of agents present at the location. */
  minPopulation?: number;
  /** Specific sublocation type required. */
  requiredSublocationTypeId?: string;
}

// ─── Failure Conditions ──────────────────────────────────────────

export type InitiativeFailureCondition =
  | { type: 'wealth_below'; threshold: number }
  | { type: 'agent_leaves_location' }
  | { type: 'agent_dies' }
  | { type: 'location_destroyed' }
  | { type: 'disrupted_by_encounter'; encounterTypes: string[] };

// ─── Outcomes ────────────────────────────────────────────────────

export type InitiativeOutcome =
  | { type: 'create_faction' }
  | { type: 'create_sublocation'; sublocationTypeId: string }
  | { type: 'create_bonds'; bondBasis: string; count: number; radius: number }
  | { type: 'temporary_location_boost'; property: string; value: number; duration: number }
  | { type: 'spawn_encounter'; templateId: string }
  | { type: 'create_edge'; edgeType: string; edgeBasis?: string; targetFilter: 'current_location' }
  | { type: 'record_intelligence'; intelligenceType: string };

// ─── Motivation (for candidate scoring) ─────────────────────────

export interface InitiativeMotivation {
  axis: ValuePair;
  /** Which side of the axis should score highly. */
  direction: 'left' | 'right';
  weight: number;
}

// ─── Template ────────────────────────────────────────────────────

export interface InitiativeTemplate {
  id: string;
  name: string;
  category: 'founding' | 'social' | 'religious' | 'espionage' | 'quest';
  description: string;

  // Prerequisites
  minWealth: number;
  wealthCost: number;
  requiredReaches?: Partial<Record<ReachDomain, number>>;
  requiredAxiologicalBias?: AxiologicalBiasRequirement;
  locationFilter?: InitiativeLocationFilter;

  // Execution
  baseDuration: number;
  durationVariance: number;
  checkInterval: number;
  failureConditions: InitiativeFailureCondition[];

  // Output
  outcomes: InitiativeOutcome[];

  // Scoring
  motivations: InitiativeMotivation[];

  // Optional sphere coloring for narrative prose
  sphereAffinity?: string;
}

// ─── Progress Tracking ───────────────────────────────────────────

export interface InitiativeCheckpointRecord {
  tick: number;
  passed: boolean;
  reason?: string;
}

export interface InitiativeProgress {
  templateId: string;
  initiativeId: string;
  actorId: string;
  locationId: string;
  startedTick: number;
  targetCompletionTick: number;
  occupiedUntilTick: number;
  status: 'active' | 'completed' | 'failed' | 'abandoned';
  wealthInvested: number;
  checkpoints: InitiativeCheckpointRecord[];
  sphereColoring?: string;
  /** Set by Sabotage Initiative divine action — triggers failure check next checkpoint. */
  sabotaged?: boolean;
}

// ─── Candidate (for agent decision pipeline) ────────────────────

export interface InitiativeCandidate {
  templateId: string;
  template: InitiativeTemplate;
  agentId: string;
  locationId: string;
  axiologicalScore: number;
  ambitionBonus: number;
  wealthSurplusBonus: number;
  inspireBonus: number;
  finalScore: number;
}
