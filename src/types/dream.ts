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

export const MANIPULATION_DEFINITIONS: Record<ManipulationType, ManipulationDefinition> = {
  whisper: {
    type: 'whisper',
    minTier: 1,
    baseCost: 1,
    probabilityEffect: 'boost_small',
    riskLevel: 0.0,
    description: 'Nudge probability of an existing intention (+10-15%)',
  },
  inspire: {
    type: 'inspire',
    minTier: 2,
    baseCost: 2,
    probabilityEffect: 'boost_large',
    riskLevel: 0.1,
    description: 'Boost an intention significantly (+25-30%)',
  },
  suppress: {
    type: 'suppress',
    minTier: 2,
    baseCost: 2,
    probabilityEffect: 'reduce',
    riskLevel: 0.1,
    description: 'Reduce probability of an intention (-20%)',
  },
  reshape: {
    type: 'reshape',
    minTier: 3,
    baseCost: 3,
    probabilityEffect: 'replace',
    riskLevel: 0.3,
    description: 'Morph an intention into a variation',
  },
  implant: {
    type: 'implant',
    minTier: 3,
    baseCost: 5,
    probabilityEffect: 'inject',
    riskLevel: 0.5,
    description: 'Insert a new intention the actor was not considering',
  },
  command: {
    type: 'command',
    minTier: 4,
    baseCost: 8,
    probabilityEffect: 'override',
    riskLevel: 0.8,
    description: 'Force a specific action regardless of motivation',
  },
};

export const INTERVENTION_DEFINITIONS: Record<InterventionType, InterventionDefinition> = {
  dream: {
    type: 'dream',
    sphereAffinities: ['mind', 'spirit'],
    baseCost: 1,
    detectionRisk: 0.1,
    minTier: 1,
    description: 'Manipulate selection probabilities during sleep',
    pipelineStep: 'probability',
    deliveryMode: 'astral',
  },
  persuade: {
    type: 'persuade',
    sphereAffinities: ['spirit', 'mind'],
    baseCost: 2,
    detectionRisk: 0.2,
    minTier: 1,
    description: 'Add temporary goal alignment toward desired action',
    pipelineStep: 'scoring',
    deliveryMode: 'local',
  },
  deceive: {
    type: 'deceive',
    sphereAffinities: ['mind', 'entropy'],
    baseCost: 2,
    detectionRisk: 0.3,
    minTier: 2,
    description: 'Inject false information into world-model',
    pipelineStep: 'scoring',
    deliveryMode: 'regional',
  },
  intimidate: {
    type: 'intimidate',
    sphereAffinities: ['force', 'entropy'],
    baseCost: 2,
    detectionRisk: 0.3,
    minTier: 2,
    description: 'Amplify survival instinct toward/away from action',
    pipelineStep: 'topN',
    deliveryMode: 'regional',
  },
  inspire_intervention: {
    type: 'inspire_intervention',
    sphereAffinities: ['life', 'spirit'],
    baseCost: 2,
    detectionRisk: 0.1,
    minTier: 1,
    description: 'Boost personality weight for specific trait expressions',
    pipelineStep: 'personality',
    deliveryMode: 'regional',
  },
  coincidence: {
    type: 'coincidence',
    sphereAffinities: ['time', 'entropy'],
    baseCost: 4,
    detectionRisk: 0.6,
    minTier: 3,
    description: 'Alter environmental prerequisites',
    pipelineStep: 'environment',
    deliveryMode: 'remote',
  },
  omen: {
    type: 'omen',
    sphereAffinities: ['spirit', 'time'],
    baseCost: 2,
    detectionRisk: 0.2,
    minTier: 2,
    description: 'Plant symbolic event biasing actor interpretation',
    pipelineStep: 'personality',
    deliveryMode: 'remote',
  },
  afflict_bless: {
    type: 'afflict_bless',
    sphereAffinities: ['life', 'energy'],
    baseCost: 3,
    detectionRisk: 0.5,
    minTier: 2,
    description: 'Apply temporary condition trait',
    pipelineStep: 'condition',
    deliveryMode: 'local',
  },
};

export const TIER_MODIFIERS: TierModifier = {
  individual: 1.0,
  group: 1.5,
  faction: 2.0,
  culture: 3.0,
  god: 10.0,
};

/** Intervention delivery range constants (in hexes from avatar position) */
export const DELIVERY_RANGE = {
  deceive: 3,
  intimidate: 3,
  inspire: 5,
} as const;

/** Local encounter modifiers */
export const LOCAL_ENCOUNTER = {
  visitImpactBonus: 1.15,
  summonEssenceCost: 1,
  summonDetectionPenalty: 0.10,
  summonImpactBonus: 1.05,
} as const;
