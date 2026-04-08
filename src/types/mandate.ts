import type { SphereName } from './index';

// ─── Mandate Types ───────────────────────────────────────────────

export type MandateCourtType = 'high_house' | 'circle' | 'web' | 'abyss';

/** The four mandate categories */
export type MandateType =
  | 'graph_state'             // achieve specific world configuration
  | 'narrative'               // trigger specific story beats
  | 'sphere_dominance'        // establish cosmic supremacy
  | 'simulation_achievable';  // emergent simulation milestones

/** The universal 3-stage structure */
export type MandateStage = 'setup' | 'escalation' | 'culmination';

/** Runtime mandate model — legacy graph conditions or remembrance-driven sphere growth. */
export type MandateRuntimeKind = 'legacy' | 'sphere_growth';

/** Court-shaped side objective for the remembrance-driven mandate. */
export type MandateSecondaryObjectiveType =
  | 'web_relationships'
  | 'circle_retinue'
  | 'high_house_settlements'
  | 'abyss_anomalies';

export interface MandateCheckpointDefinition {
  index: number;
  doomProgressThreshold: number;
  label: string;
  description: string;
  requiredPrimaryDelta: number;
  requiredSecondaryDelta: number;
}

export interface MandateSecondaryObjectiveDefinition {
  type: MandateSecondaryObjectiveType;
  label: string;
  description: string;
  target: number;
}

/** A single condition that must be met */
export interface MandateCondition {
  type: 'node_count' | 'edge_count' | 'sphere_weight' | 'actor_tier' | 'custom';
  /** Human-readable description */
  description: string;
  /** Query parameters for graph evaluation */
  params: Record<string, unknown>;
  /** Is this condition currently met? (computed at evaluation time) */
  met?: boolean;
}

/** Stage definition within a mandate */
export interface MandateStageDefinition {
  stage: MandateStage;
  description: string;
  conditions: MandateCondition[];
}

/** Full mandate definition */
export interface MandateDefinition {
  id: string;
  type: MandateType;
  name: string;
  description: string;
  stages: [MandateStageDefinition, MandateStageDefinition, MandateStageDefinition];
  /** Which runtime evaluator this mandate expects. */
  runtimeKind?: MandateRuntimeKind;
  /** For sphere_dominance: which sphere must dominate */
  targetSphere?: SphereName;
  /** How many ticks before this mandate expires (optional time pressure) */
  tickLimit?: number;
  /** Remembrance-shaped primary sphere objective. */
  primarySphere?: SphereName;
  /** Supporting remembrance sphere objective. */
  secondarySphere?: SphereName;
  /** Run-start aggregate baseline for the primary sphere. */
  primaryBaseline?: number;
  /** Run-start aggregate baseline for the secondary sphere. */
  secondaryBaseline?: number;
  /** Required percentage increase over the primary baseline. */
  primaryTargetDelta?: number;
  /** Supporting percentage increase over the secondary baseline. */
  secondaryTargetDelta?: number;
  /** Optional remembrance court shape that authored this mandate. */
  courtType?: MandateCourtType;
  /** One-line remembrance-derived intent text. */
  mandateDirection?: string;
  /** Doom checkpoints that feed back into future doom beats. */
  checkpoints?: MandateCheckpointDefinition[];
  /** Optional court-shaped side objective. */
  secondaryObjective?: MandateSecondaryObjectiveDefinition;
}

/** Runtime state tracking for an active mandate */
export interface MandateState {
  mandateId: string;
  currentStage: MandateStage;
  progress: number;          // 0.0 - 1.0 overall mandate completion
  completed: boolean;
  failed: boolean;
  /** Tick when the mandate was assigned */
  assignedTick?: number;
  /** Per-stage completion ticks */
  stageCompletedTicks?: Partial<Record<MandateStage, number>>;
  /** Current aggregate totals for remembrance-driven mandates. */
  primaryCurrent?: number;
  secondaryCurrent?: number;
  /** Percentage increase over the stored baseline. */
  primaryDelta?: number;
  secondaryDelta?: number;
  /** Court-shaped side objective progress. */
  secondaryObjectiveCurrent?: number;
  secondaryObjectiveCompleted?: boolean;
  /** Per-checkpoint evaluation results. */
  checkpointResults?: Array<{
    index: number;
    doomProgressThreshold: number;
    passed: boolean;
    exceeded: boolean;
    evaluatedTick: number;
    requiredPrimaryDelta: number;
    observedPrimaryDelta: number;
  }>;
  /** Accumulated rewards and penalties handed to the doom clock. */
  counterOmensEarned?: number;
  doomSeverityPenalties?: number;
}
