import type { SphereName } from './index';
import type { ActionCandidate } from './agent';
import type { InfluenceTier } from './influence';
import type { ActorType } from './graph';

// ─── Dream Interface: Manipulation Types ─────────────────────────

/** The 6 ways a player can manipulate an actor's intention probabilities */
export type ManipulationType =
  | 'whisper'    // +10-15% to existing intention
  | 'inspire'    // +25-30% to existing intention
  | 'suppress'   // -20% to existing intention
  | 'reshape'    // morph intention into a variant
  | 'implant'    // insert new intention from valid pool
  | 'command';   // force specific action

/** How the manipulation affects probabilities */
export type ProbabilityEffect =
  | 'boost_small'    // whisper: +0.10 to +0.15
  | 'boost_large'    // inspire: +0.25 to +0.30
  | 'reduce'         // suppress: -0.20
  | 'replace'        // reshape: swap target for variant
  | 'inject'         // implant: add candidate at 0.30
  | 'override';      // command: set to 1.0

export interface ManipulationDefinition {
  type: ManipulationType;
  minTier: InfluenceTier;
  baseCost: number;
  probabilityEffect: ProbabilityEffect;
  riskLevel: number;
  description: string;
}

/** A player-issued manipulation targeting a specific candidate */
export interface DreamManipulation {
  type: ManipulationType;
  targetCandidateIndex: number;
  sphereCost: SphereName;
  reshapeTo?: ActionCandidate;
  implantCandidate?: ActionCandidate;
}

// ─── Divine Toolkit: Intervention Types ──────────────────────────

export type InterventionType =
  | 'dream'
  | 'persuade'
  | 'deceive'
  | 'intimidate'
  | 'inspire_intervention'
  | 'coincidence'
  | 'omen'
  | 'afflict_bless';

/** How an intervention reaches its target */
export type DeliveryMode = 'astral' | 'regional' | 'remote' | 'local';

/** How a local encounter is initiated */
export type LocalEncounterMode = 'visit' | 'summon';

export interface InterventionDefinition {
  type: InterventionType;
  sphereAffinities: SphereName[];
  baseCost: number;
  detectionRisk: number;
  minTier: InfluenceTier;
  description: string;
  pipelineStep: 'scoring' | 'personality' | 'topN' | 'probability' | 'environment' | 'condition';
  deliveryMode: DeliveryMode;
}

// ─── Cost Calculation Types ──────────────────────────────────────

export type AlignmentFactor = {
  value: number;
  label: 'aligned' | 'neutral' | 'against';
};

export type TierModifier = Record<Exclude<ActorType, 'ascendant'>, number>;

export interface InterventionCost {
  baseCost: number;
  alignmentFactor: number;
  tierModifier: number;
  finalCost: number;
  sphere: SphereName;
  affordable: boolean;
}

export interface InterventionResult {
  success: boolean;
  essenceSpent: Record<SphereName, number>;
  detected: boolean;
  detectedBy: 'mortal' | 'rival' | 'both' | 'none';
  narrativeHook?: string;
}

// ─── Integration with Agent Selection ────────────────────────────

export interface DivineInfluence {
  manipulations: DreamManipulation[];
  interventionHistory: Array<{
    type: InterventionType;
    tick: number;
    detected: boolean;
  }>;
}

// ─── Constants ───────────────────────────────────────────────────

// Re-export content data for backward compatibility
export {
  MANIPULATION_DEFINITIONS,
  INTERVENTION_DEFINITIONS,
  TIER_MODIFIERS,
  DELIVERY_RANGE,
  LOCAL_ENCOUNTER,
} from '../data/dream-content';
