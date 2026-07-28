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
  /**
   * The pursuing agent is dead (THR-808).
   *
   * Self-referential twin of `target_agent_eliminated`, and the honest shape for the
   * "abandon when the agent dies" beat that content previously wrote as
   * `agent_lacks_trait: 'living'` — aliveness is engine state, not a trait, and no
   * producer has ever minted a `living` trait, so that gate was permanently false.
   */
  | { type: 'agent_deceased' }
  /**
   * The agent has held one position for `minTicks`, counted from the later of its
   * arrival and the evaluation window's start (THR-822).
   *
   * The window is what makes this safe as an abandonment trigger. Passed the pursuing
   * ambition's `assignedTick`, the condition cannot hold before `assignedTick +
   * minTicks` however long the agent had already been sitting still — so "they set out,
   * and then they stopped" is measured rather than assumed. Without a window (or
   * without a clock in the evaluation context) it fails soft to `false`.
   *
   * Residence is *observed*, not written by movement code — see `agentResidence.ts`.
   */
  | { type: 'agent_settled_since'; minTicks: number }
  /**
   * The agent is settled somewhere that is not where it originated, for `minTicks`
   * under the same window rule as `agent_settled_since` (THR-822).
   *
   * "Rooted, and not at home." Distinct from `agent_not_in_region`, which reads a
   * region literal an author has to know in advance; this reads the agent's own
   * first-observed position, so it works for any agent in any world.
   */
  | { type: 'agent_away_from_origin'; minTicks: number }
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
  /** Present when the world minted this ambition from an event node (THR-726). */
  readonly mintedByEventId?: string;
  /** Prose stem naming the minting event, for motive-receipt provenance (THR-726). */
  readonly mintedByLabel?: string;
}
