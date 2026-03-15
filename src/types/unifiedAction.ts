// src/types/unifiedAction.ts
import type { ReachDomain } from './traits';
import type { SphereName } from './index';
import type { ActorType } from './graph';
import type { ValuePair } from './agent';
import type { GraphOp } from './graphOp';

export type ActionScale = 'cosmic' | 'regional' | 'local' | 'personal';
export type ActionSource = 'agent' | 'player' | 'system';
export type StepFailBehavior = 'fail_action' | 'continue_weakened';

export interface ActionStep {
  readonly reach: ReachDomain;
  readonly duration: { readonly min: number; readonly max: number };
  readonly difficulty: number; // 0-1
  readonly onSuccess: readonly GraphOp[];
  readonly onFailure: readonly GraphOp[];
  readonly failBehavior: StepFailBehavior;
  readonly narrativeTemplate?: string;
}

export interface UnifiedActionTemplate {
  // Identity
  readonly id: string;
  readonly name: string;
  readonly reach: ReachDomain;
  readonly crudType: 'create' | 'read' | 'update' | 'delete';

  // Scale & Priority
  readonly scale: ActionScale;

  // Steps (1 = simple, 2+ = encounter-like)
  readonly steps: readonly ActionStep[];

  // Costs
  readonly apCost: number; // typically 1
  readonly essenceCost?: number; // divine actions only

  // Filtering
  readonly actorAffinities: readonly ActorType[];
  readonly locationSubtypes?: readonly string[];
  readonly sphereAffinity?: SphereName;

  // Contestation
  readonly contestsWith?: readonly string[];

  // Selection
  readonly motivations: readonly ValuePair[];

  // Narrative
  readonly narrativeTemplates: {
    readonly initiation: string;
    readonly success: string;
    readonly failure: string;
    readonly contested?: string;
  };
}

// Scale priority for tick resolution ordering (lower = resolves first)
export const SCALE_PRIORITY: Record<ActionScale, number> = {
  cosmic: 0,
  regional: 1,
  local: 2,
  personal: 3,
};

// Runtime action instance
export type UnifiedActionOutcome =
  | 'success'
  | 'failure'
  | 'contested_won'
  | 'contested_lost'
  | 'critical_success'
  | 'critical_failure';

export type StepOutcome = 'success' | 'failure';

export interface UnifiedAction {
  readonly actionId: string;
  readonly actorId: string;
  readonly templateId: string;
  readonly targetId: string;

  // Priority
  readonly scale: ActionScale;
  readonly source: ActionSource;
  readonly startTick: number;

  // Step progression
  readonly currentStep: number; // 0-indexed
  readonly stepProgress: number; // ticks completed on current step
  readonly stepDuration: number; // total ticks for current step

  // Resources (already deducted on creation)
  readonly essencePaid?: number;

  // Contestation
  readonly contestedWith?: string; // actionId of opposing action

  // Resolution
  readonly resolved: boolean;
  readonly outcome?: UnifiedActionOutcome;
  readonly stepOutcomes: readonly StepOutcome[]; // per-step results
}
