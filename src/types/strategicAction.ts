// src/types/strategicAction.ts
//
// Core types for the ambition-driven strategic action system.
// Strategic actions are proactive world-shaping steps generated from active ambitions,
// scored alongside encounter candidates in phaseAgentDecision.

import type { ReachDomain } from './traits';
import type { ValuePair } from './agent';

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

  // ─── Checkpoint authoring (THR-1292 §2, §5) ───────────────────────

  /**
   * Normalised 0–1 difficulty each checkpoint rolls against.
   *
   * Absent ⇒ `UNDERTAKING_DEFAULT_CHECKPOINT_DIFFICULTY`. Per-kind band tables are
   * plan doc 2's content; this field is the seam they write into.
   */
  readonly checkpointDifficulty?: number;

  /**
   * Whether the actor must be *at* the undertaking's stage for a checkpoint to
   * resolve (THR-1279 verdict 7). Absent ⇒ `true`.
   *
   * When it holds and the actor is elsewhere the checkpoint defers rather than
   * halting; `UNDERTAKING_ABSENCE_DEFERRAL_LIMIT` consecutive absences convert to
   * one halt. That is deliberately not movement AI — moving an actor *toward* its
   * stage is board/binder behaviour and belongs to docs 3/5.
   */
  readonly requiresLocation?: boolean;

  /**
   * Whether checkpoints may resolve while the actor is mid-encounter. Absent ⇒ `true`.
   *
   * A `false` here *reads* the busy set and never writes it — the busy gate is
   * untouched, and the contract test in slice 2 exists to keep it that way.
   */
  readonly canRunBeside?: boolean;

  // ─── Board authoring (THR-1292 §4) ────────────────────────────────

  /**
   * What completing this undertaking is worth, in the board's common currency.
   *
   * Absent ⇒ derived from the shared verb-impact table (`STRATEGIC_VERB_IMPACT`)
   * scaled by `UNDERTAKING_PAYOFF_SCALE`. **Unauthored on every template in v1**
   * and deliberately so: per-kind payoff rows are plan doc 2's content, and a
   * first-guess number hand-written onto 43 templates would be fiction wearing a
   * data field. The verb table is at least a value the legacy scorer already
   * ranks on, so the fallback is a real signal rather than a placeholder.
   */
  readonly payoffValue?: number;

  /**
   * Value pairs this undertaking appeals to — the desire term's input, in exactly
   * the vocabulary encounter `motivations` use, so one function weights both.
   *
   * Absent ⇒ the desire multiplier rests on the ambition boost alone, which is
   * live from day one. Doc 2 authors these per kind. Every entry must be a member
   * of `VALUE_PAIRS`; slice 1's schema test is what makes that binding rather than
   * aspirational (a non-member reads `undefined ?? 0` and contributes nothing,
   * silently, forever).
   */
  readonly motivations?: readonly ValuePair[];
}

// ─── Mutation Hints ─────────────────────────────────────────────────
// Data-driven execution descriptors so new packs don't need hardcoded switch cases.

export type StrategicMutationHint =
  | { type: 'record_intelligence'; intelligenceType: string }
  | { type: 'create_sublocation'; sublocationTypeId: string; nameTemplate: string }
  | { type: 'create_trade_route' }
  | { type: 'create_relation_edge'; edgeType: string; direction: 'actor_to_target' | 'target_to_actor'; properties?: Record<string, unknown> }
  | {
      type: 'modify_location_property';
      property: string;
      delta: number;
      clamp?: [number, number];
      /**
       * When set, the write also stamps `<property>ExpiresAtTick` and the boost is
       * cleared that many ticks later by `phaseStrategicProjects` (THR-1292 §3).
       *
       * This exists because the retired initiative pipeline owned the *only* expiry
       * for the festival boost. Making it a hint field rather than a special case
       * keeps the retirement additive: the sweep is driven by
       * `EXPIRING_LOCATION_PROPERTIES`, so a second timed boost is a data edit.
       */
      expiresAfterTicks?: number;
    }
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

  /** Origin anchor for completion-time mutations (THR-669) — see StrategicProjectRuntime.originLocationId. */
  readonly originLocationId?: string;

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
  /**
   * Where the project was undertaken (THR-669): the actor's resolved,
   * non-transient location at project start. Trade routes must anchor here —
   * the actor's completion-time location is often a transient transit hex
   * that gets garbage-collected, silently evaporating the route.
   */
  readonly originLocationId?: string;

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

  // ─── Checkpoint state (THR-1292 §2) ───────────────────────────────
  //
  // Every field below is optional so a world saved before checkpoints loads as a
  // fresh, un-checkpointed undertaking rather than throwing (NFP #6/#4). The
  // reader treats absent as the zero value in each case, and
  // `nextCheckpointTick` absent means "schedule one from now".

  /** Checkpoints resolved so far — the index carried on the trace */
  checkpointIndex?: number;
  /** Tick at or after which the next checkpoint fires */
  nextCheckpointTick?: number;
  /** Accumulated ratchet points; at `UNDERTAKING_HALT_RATCHET_N` the fork fires */
  halts?: number;
  /** Set once the fork chose to escalate. A second ratchet trip forces abandon. */
  escalated?: boolean;
  /**
   * Whether any moment on this undertaking ever reached the player as an
   * interrupt. This is the input to the §2.2 residue rule: a failure nobody
   * watched leaves a chronicle line, a failure they watched leaves a scar.
   */
  everInterrupted?: boolean;
  /** Gates repeat at-cost interrupts — only the *first* advance-at-cost interrupts */
  atCostMomentFired?: boolean;
  /** Consecutive absence deferrals; `UNDERTAKING_ABSENCE_DEFERRAL_LIMIT` of them convert to one halt */
  deferrals?: number;
  /**
   * Doc 3's re-binding seam. Set when an escalation asks for the undertaking to be
   * re-bound with complications; nothing consumes it yet, and that is deliberate —
   * the flag is the contract, the binder is doc 3.
   */
  rebindRequested?: boolean;
  /** Difficulty override accumulated by escalation, on top of the template's authored value */
  checkpointDifficultyDelta?: number;
  /** Why the undertaking failed, when it did */
  failureReason?: 'abandoned_after_halts' | 'actor_lost' | 'timeout';
  /** Telemetry from the most recent checkpoint — what the debug surfaces read */
  lastCheckpoint?: {
    readonly band: import('./unifiedAction').StepOutcome;
    readonly effect: UndertakingCheckpointEffect;
    readonly roll: number;
    readonly probability: number;
    readonly tick: number;
  };
}

/** What a checkpoint band does to an undertaking (THR-1292 §2). */
export type UndertakingCheckpointEffect = 'advance' | 'advance_at_cost' | 'halt';

/**
 * Moment classes emitted by checkpoint resolution and read by
 * `resolveMomentPresentation`. Doc 5 owns the surfaces; the vocabulary lives here
 * so the engine can stamp `everInterrupted` without waiting for them.
 */
export type UndertakingMomentClass =
  | 'started'
  | 'at_cost'
  | 'completion'
  | 'fork'
  | 'abandoned'
  | 'complication';

/** How a moment reaches the player. `'none'` means chronicle-only. */
export type UndertakingMomentPresentation = 'interrupt' | 'badge' | 'none';

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

// ─── Binding Ledger (THR-1296 doc 3 §3) ─────────────────────────────
//
// Why records and not a `bound_by` edge, addressed against the
// relationships-are-edges rule rather than skipped: an edge needs two graph
// endpoints, and the undertaking side of a binding is not a graph node. The
// ratified substrate verdict (THR-1280 addendum) put undertakings in the
// strategic runtime as `StrategicProjectRuntime` records — there is no `project`
// node type in `src/types/graph.ts` — so a `bound_by` edge would first require
// inventing a node type, which the no-new-node-types rule forbids and nothing in
// the binding ruling requests. The narrower ground holds too: that rule governs
// *entity-to-entity* relationships, and a binding is bookkeeping between an
// entity and a runtime record. The traversal-shaped query an edge would have
// served ("is this node bound?") is answered by the registry's runtime reverse
// index plus the `WorldGraph.removeNode` hook.

/** Why a binding stopped being live. */
export type UndertakingBindingBrokenCause =
  | 'node_removed'
  | 'deceased'
  | 'severed';

/**
 * One cast or stage slot of one undertaking, bound to one graph node.
 *
 * `status: 'broken'` is terminal and triggers a re-bind — it is never a value any
 * scorer reads. That is the THR-1286 lesson (dead records poison scorers) applied
 * by construction rather than by discipline.
 */
export interface UndertakingBindingRecord {
  readonly projectId: string;
  /** The cast-spec key this record fills (`'$anchor'`, an authored cast key, …). */
  readonly castKey: string;
  readonly nodeId: string;
  readonly kind: 'actor' | 'location';
  readonly persistence: import('./encounter').EncounterSupportPersistence;
  readonly boundAtTick: number;
  readonly stepIndex: number;
  status: 'live' | 'broken' | 'released';
  brokenCause?: UndertakingBindingBrokenCause;
  /** Tick at which status left `'live'` — inspection only. */
  endedAtTick?: number;
}

// ─── The mint queue (THR-1296 doc 3 §5) ─────────────────────────────
//
// A binder mint is never immediate. The request is queued here and drained by
// `phaseAgentLifecycle`'s births block through the same valve every other new
// mortal passes — at most `BINDER_MINT_BUDGET_PER_TICK` per tick, never on a
// death tick. That is the THR-814/THR-162 lesson made mechanical: an unmetered
// spawn path is how a large map ends up with a thousand agents by tick 72.
//
// Queue-before-valve also dissolves the phase-ordering problem: decision runs
// before lifecycle in the tick, so a request made at tick T is born at T or
// T+1, and the checkpoint simply binds when the mint exists.

/**
 * What a cast slot demands of a candidate's stated values.
 *
 * Defined here rather than in the binder so the mint request can carry it without
 * an engine→engine import from a types module — `binder.ts` re-exports it as
 * `BindingIdentityRequirement`, which is the name the scored board reads it under.
 * One definition, two names, no drift.
 *
 * The schema seam doc 2 ([THR-1297](https://linear.app/threadbare/issue/THR-1297))
 * authors values into; this plan ships the engine that honors it and deliberately
 * no authored rows of its own.
 */
export interface UndertakingIdentityRequirement {
  readonly axis: ValuePair;
  readonly pole: 'virtue' | 'vice';
  /** Distance from neutral (0.5 canonical) the candidate must clear, 0–0.5. */
  readonly minStrength: number;
}

/**
 * One queued birth, owed to one cast slot of one undertaking.
 *
 * The id the mint will take is `mint_<projectId>_<castKey>` — instance-unique by
 * construction (a project id already is) and seed-deterministic, so replaying a
 * seed produces the same person under the same name. Deliberately *not* the
 * encounter path's `enc_support_<templateId>_<locId>_<key>`, whose self-reuse
 * across every instance of a template is a feature there and would be a collision
 * here.
 */
export interface UndertakingMintRequest {
  readonly projectId: string;
  readonly castKey: string;
  readonly stepIndex: number;
  /** The role the newborn is born into — `NpcRole`, widened to string at the seam. */
  readonly role: string;
  /** Where they are born: the stage node, or the place tier that holds it. */
  readonly placementNodeId: string;
  readonly persistence: import('./encounter').EncounterSupportPersistence;
  /** Authored name wins when the spec provides one; otherwise culture-phonetic. */
  readonly spawnName?: string;
  readonly factionDefId?: string;
  /** Born to the requirement — the reason the mint row scores identity at 1. */
  readonly identityRequirement?: UndertakingIdentityRequirement;
  readonly requestedAtTick: number;
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
  /**
   * The binder's persistence ledger (THR-1296). Optional so a world saved before
   * the binder loads as one with no bindings rather than throwing (NFP #6/#4);
   * every reader treats absent as empty. The `Map<nodeId, recordIds>` reverse
   * index is a runtime-owned lazy derivation, deliberately not serialized.
   */
  bindings?: UndertakingBindingRecord[];
  /**
   * Births the binder owes but has not yet taken through the lifecycle valve
   * (THR-1296 §5). Optional for the same reason `bindings` is: a world saved
   * before the binder loads as one with nothing queued. Bounded by
   * `BINDER_MINT_QUEUE_MAX` — an overflowing queue refuses the bind and traces
   * it rather than growing without limit.
   */
  mintQueue?: UndertakingMintRequest[];
}
