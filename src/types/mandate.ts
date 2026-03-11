import type { SphereName } from './index';

// ─── Mandate Types ───────────────────────────────────────────────

/** The four mandate categories */
export type MandateType =
  | 'graph_state'             // achieve specific world configuration
  | 'narrative'               // trigger specific story beats
  | 'sphere_dominance'        // establish cosmic supremacy
  | 'simulation_achievable';  // emergent simulation milestones

/** The universal 3-stage structure */
export type MandateStage = 'setup' | 'escalation' | 'culmination';

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
  /** For sphere_dominance: which sphere must dominate */
  targetSphere?: SphereName;
  /** How many ticks before this mandate expires (optional time pressure) */
  tickLimit?: number;
}

/** Runtime state tracking for an active mandate */
export interface MandateState {
  mandateId: string;
  currentStage: MandateStage;
  progress: number;          // 0.0 - 1.0 within current stage
  completed: boolean;
  failed: boolean;
  /** Tick when the mandate was assigned */
  assignedTick?: number;
  /** Per-stage completion ticks */
  stageCompletedTicks?: Partial<Record<MandateStage, number>>;
}
