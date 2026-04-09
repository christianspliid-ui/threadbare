// src/types/ambition.ts
import type { ReachDomain } from './traits';
import type { SphereName } from './index';
import type { AmbitionStrategicProfile } from './strategicAction';

// ─── Ambition Categories ─────────────────────────────────────────
export type AmbitionCategory =
  | 'dominion'
  | 'mastery'
  | 'vengeance'
  | 'legacy'
  | 'survival'
  | 'discovery'
  | 'devotion';

// ─── Graph Conditions (milestone & abandonment checks) ──────────
export type GraphCondition =
  | { type: 'agent_reach_above'; reach: ReachDomain; threshold: number }
  | { type: 'agent_reach_below'; reach: ReachDomain; threshold: number }
  | { type: 'agent_has_bonds'; minCount: number; basis: string }
  | { type: 'agent_controls_location'; locationType: string }
  | { type: 'agent_has_trait'; trait: string }
  | { type: 'agent_lacks_trait'; trait: string }
  | { type: 'target_agent_eliminated'; targetRef: string }
  | { type: 'agent_in_region'; region: string }
  | { type: 'agent_not_in_region'; region: string };

// ─── Milestone ──────────────────────────────────────────────────
export interface Milestone {
  readonly id: string;
  readonly condition: GraphCondition;
  readonly prose: readonly string[];
}

// ─── Completion & Abandonment ───────────────────────────────────
export interface CompletionRule {
  readonly requires: number;
  readonly of: number;
}

export interface AbandonmentTrigger {
  readonly condition: GraphCondition;
  readonly prose: readonly string[];
}

export interface BondModifier {
  readonly bondType: string;
  readonly modifier: number;
}

// ─── Ambition Template ──────────────────────────────────────────
export interface AmbitionTemplate {
  readonly id: string;
  readonly displayName: string;
  readonly category: AmbitionCategory;

  // Filter 1 — Can I?
  readonly reachFloors: Partial<Record<ReachDomain, number>>;
  readonly requiredTraits: readonly string[];
  readonly blockingTraits: readonly string[];

  // Filter 2 — Should I?
  readonly sphereAffinities: readonly SphereName[];
  readonly bondModifiers: readonly BondModifier[];
  readonly boostingTraits: readonly string[];

  // Behavior — biases action selection
  readonly reachAffinity: Partial<Record<ReachDomain, number>>;

  // Progress
  readonly milestones: readonly Milestone[];
  readonly completion: CompletionRule;
  readonly abandonmentTriggers: readonly AbandonmentTrigger[];
  readonly abandonmentCooldown: number;

  // Strategic profile (optional — ambitions without this skip strategic candidate generation)
  readonly strategicProfile?: AmbitionStrategicProfile;

  // Prose
  readonly selectionProse: readonly string[];
  readonly milestoneProse: Record<string, readonly string[]>;
  readonly completionProse: readonly string[];
  readonly abandonmentProse: readonly string[];
}

// ─── Reactive Ambition Template ─────────────────────────────────
export type ReactiveEventType =
  | 'betrayal'
  | 'loss_of_home'
  | 'death_of_bond_partner'
  | 'scar_acquired'
  | 'destiny_assigned'
  | 'divine_intervention';

export interface ReactiveAmbitionTemplate extends AmbitionTemplate {
  readonly triggerEvent: ReactiveEventType;
  readonly skipFilters: boolean;
}

// ─── Active Ambition (on an agent) ──────────────────────────────
export type AmbitionPriority = 'primary' | 'secondary';
export type AmbitionStatus = 'active' | 'completed' | 'abandoned';

export interface ActiveAmbition {
  readonly templateId: string;
  readonly priority: AmbitionPriority;
  readonly status: AmbitionStatus;
  readonly assignedTick: number;
  readonly completedMilestones: readonly string[];
  readonly resolvedTick?: number;
}

// ─── Edge properties for 'pursues' edge ─────────────────────────
export interface PursuesEdgeProperties {
  readonly priority: AmbitionPriority;
  readonly status: AmbitionStatus;
  readonly assignedTick: number;
  readonly completedMilestones: string[];
  readonly resolvedTick?: number;
}
