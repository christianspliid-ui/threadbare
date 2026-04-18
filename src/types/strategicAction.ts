// src/types/strategicAction.ts
//
// Core types for the ambition-driven strategic action system.
// Strategic actions are proactive world-shaping steps generated from active ambitions,
// scored alongside encounter candidates in phaseAgentDecision.

import type { ReachDomain } from './traits';

// ─── Strategic Verbs ────────────────────────────────────────────────
// Five world-shaping verbs from the design — the execution language under ambitions.

export type StrategicVerb =
  | 'gather_info'
  | 'create'
  | 'change'
  | 'control'
  | 'destroy';

// ─── Execution Modes ────────────────────────────────────────────────

export type StrategicExecutionMode =
  | 'instant'            // Single-tick graph mutation
  | 'multi_tick_project' // Progress-tracked build/research/negotiation
  | 'seed_encounter'     // Plant a follow-up encounter seed
  | 'claim_control'      // Establish ongoing control stance
  | 'contest_control';   // Challenge existing control holder

// ─── Behavior Families ──────────────────────────────────────────────
// Broad archetypal families that group strategic templates.

export type BehaviorFamily =
  | 'merchant-expansion'
  | 'builder-civic'
  | 'scholar-seeker'
  | 'zealot-mission'
  | 'court-political'
  | 'underworld-network'
  | 'warlord-expansion'
  | 'caretaker-steward'
  | 'artist-crafter'
  | 'wanderer-explorer';

// ─── Decision Family ────────────────────────────────────────────────
// Used by the unified chooser to tag what kind of candidate won.

export type DecisionFamily =
  | 'encounter'
  | 'strategic_action'
  | 'initiative'
  | 'idle'
  | 'forced_travel';

// ─── Strategic Action Template ──────────────────────────────────────
// A reusable blueprint for a proactive world-shaping step.

export interface StrategicActionTemplate {
  readonly id: string;
  readonly displayName: string;
  readonly verb: StrategicVerb;
  readonly executionMode: StrategicExecutionMode;
  readonly behaviorFamily: BehaviorFamily;

  /** Which reaches this action aligns with (for role-fit scoring) */
  readonly reachProfile: Partial<Record<ReachDomain, number>>;

  /** Ticks required for multi_tick_project mode (ignored for instant) */
  readonly projectDuration?: number;

  /** Prose templates for activity description */
  readonly activityProse: readonly string[];

  /** Prose templates for completion */
  readonly completionProse: readonly string[];

  /** Encounter template IDs that can be seeded as catalyst follow-ups */
  readonly catalystEncounterIds?: readonly string[];

  /** Target validation: what kind of graph target this step needs */
  readonly targetRule: StrategicTargetRule;

  /** Resource heuristics — optional cost/affordability hints */
  readonly resourceHint?: {
    readonly wealthCost?: number;
    readonly reachFloor?: Partial<Record<ReachDomain, number>>;
  };

  /** Data-driven mutation descriptor — replaces hardcoded switch in lifecycle */
  readonly mutationHint?: StrategicMutationHint;
}

// ─── Mutation Hints ─────────────────────────────────────────────────
// Data-driven execution descriptors so new packs don't need hardcoded switch cases.

export type StrategicMutationHint =
  | { type: 'record_intelligence'; intelligenceType: string }
  | { type: 'create_sublocation'; sublocationTypeId: string; nameTemplate: string }
  | { type: 'create_trade_route' }
  | { type: 'create_relation_edge'; edgeType: string; direction: 'actor_to_target' | 'target_to_actor'; properties?: Record<string, unknown> }
  | { type: 'modify_location_property'; property: string; delta: number; clamp?: [number, number] }
  | { type: 'no_mutation' };

// ─── Target Rules ───────────────────────────────────────────────────

export type StrategicTargetRule =
  | { type: 'location_subtype'; subtypes: readonly string[] }
  | { type: 'any_location' }
  | { type: 'actor_with_trait'; trait: string }
  | { type: 'faction' }
  | { type: 'trade_route' }
  | { type: 'self' }          // No external target needed
  | { type: 'hex_region' }    // Targets a hex area
  | { type: 'sublocation_type'; subtypeIds: readonly string[] };

// ─── Strategic Action Candidate ─────────────────────────────────────
// A scored, concrete candidate generated from an ambition + world state.

export interface StrategicActionCandidate {
  readonly candidateId: string;
  readonly templateId: string;
  readonly ambitionId: string;
  readonly actorId: string;
  readonly verb: StrategicVerb;
  readonly executionMode: StrategicExecutionMode;
  readonly behaviorFamily: BehaviorFamily;
  readonly displayName: string;

  /** The graph node this action targets (location, actor, faction, etc.) */
  readonly targetNodeId?: string;
  readonly targetHex?: { col: number; row: number };

  /** Raw score components before normalization */
  readonly scoreComponents: StrategicScoreComponents;
  /** Final normalized score (0-1 range, comparable with encounter scores) */
  readonly finalScore: number;

  /** Why this candidate was generated */
  readonly generationReason: StrategicGenerationReason;
}

export type StrategicGenerationReason =
  | 'ambition_progression'  // Direct next step for the ambition
  | 'blocker_relief'        // Removes an obstacle to ambition progress
  | 'opportunity_pull'      // World state presents a favorable opening
  | 'control_obligation'    // Existing control needs maintenance
  | 'unfinished_work';      // Previously started project needs continuation

export interface StrategicScoreComponents {
  readonly ambitionAlignment: number;
  readonly blockerRelief: number;
  readonly worldImpact: number;
  readonly catalystValue: number;
  readonly roleFit: number;
  readonly controlPressure: number;
  readonly travelPenalty: number;
  readonly varietyPenalty: number;
}

// ─── Candidate Rejection ────────────────────────────────────────────

export interface StrategicCandidateRejection {
  readonly templateId: string;
  readonly reason: string;
}

// ─── Strategic Project Runtime ──────────────────────────────────────
// In-progress multi-tick project state, stored on GameState.

export interface StrategicProjectRuntime {
  readonly projectId: string;
  readonly actorId: string;
  readonly templateId: string;
  readonly ambitionId: string;
  readonly verb: StrategicVerb;
  readonly behaviorFamily: BehaviorFamily;
  readonly targetNodeId?: string;
  readonly targetHex?: { col: number; row: number };

  /** Ticks of work accumulated */
  progress: number;
  /** Ticks of work required to complete */
  readonly progressRequired: number;
  /** Tick when project was started */
  readonly startedTick: number;
  /** Tick of last progress advancement */
  lastProgressTick: number;

  status: 'active' | 'completed' | 'stalled' | 'failed';

  /** For control stances: ticks since last upkeep action */
  neglectTicks?: number;
}

// ─── Control State ──────────────────────────────────────────────────
// Ongoing control stance held by an actor over a graph target.

export interface StrategicControlState {
  readonly controlId: string;
  readonly actorId: string;
  readonly templateId: string;
  readonly ambitionId: string;
  readonly targetNodeId: string;
  readonly verb: 'control';
  readonly behaviorFamily: BehaviorFamily;

  /** Tick when control was established */
  readonly establishedTick: number;
  /** Ticks since last upkeep action */
  neglectTicks: number;
  /** Whether control is actively maintained */
  active: boolean;
  /** Degradation level (0 = healthy, 1 = about to collapse) */
  degradation: number;
}

// ─── Strategic History Entry ────────────────────────────────────────
// Record of a completed or failed strategic action for player/debug inspection.

export interface StrategicHistoryEntry {
  readonly tick: number;
  readonly actorId: string;
  readonly templateId: string;
  readonly ambitionId: string;
  readonly verb: StrategicVerb;
  readonly behaviorFamily: BehaviorFamily;
  readonly displayName: string;
  readonly targetNodeId?: string;
  readonly outcome: 'completed' | 'failed' | 'stalled';
  readonly graphOps: readonly string[];
  readonly catalystSeeded: boolean;
}

// ─── Ambition Strategic Profile ─────────────────────────────────────
// Optional metadata on AmbitionTemplate that bridges ambitions to strategic steps.

export interface AmbitionStrategicProfile {
  /** Which behavior family this ambition naturally produces */
  readonly behaviorFamily: BehaviorFamily;
  /** Preferred strategic verbs for this ambition (ordered by priority) */
  readonly preferredVerbs: readonly StrategicVerb[];
  /** Strategic template IDs that this ambition can generate */
  readonly templateIds: readonly string[];
  /** Reach domains this ambition's strategic steps emphasize */
  readonly reachEmphasis: Partial<Record<ReachDomain, number>>;
}

// ─── Strategic Runtime State ────────────────────────────────────────
// Aggregate runtime state stored on GameState for strategic actions.

export interface StrategicRuntimeState {
  /** Active multi-tick projects */
  readonly projects: StrategicProjectRuntime[];
  /** Active control stances */
  readonly controls: StrategicControlState[];
  /** Rolling history window for inspection */
  readonly history: StrategicHistoryEntry[];
}
