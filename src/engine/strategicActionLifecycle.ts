// src/engine/strategicActionLifecycle.ts
//
// Start, advance, complete, fail, and manage multi-tick strategic projects
// and control stances. Handles instant execution and catalyst seeding.
//
// NFP #3 (Determinism): Uses seeded PRNG for catalyst seeding.
// NFP #4 (Fail-soft): Invalid targets → failure trace, no crash.

import type { GameState } from '../types/gameState';
import type { WorldGraph } from './graph';
import type {
  StrategicActionCandidate,
  StrategicProjectRuntime,
  StrategicControlState,
  StrategicHistoryEntry,
  StrategicRuntimeState,
} from '../types/strategicAction';
import type { PendingEncounterSeed } from '../types/unifiedAction';
import {
  LOCATION_BOOST_EXPIRY_SUFFIX,
  UNDERTAKING_TIMEOUT_TICKS,
  STRATEGIC_DEFAULT_PROJECT_WORK_TICKS,
  STRATEGIC_CATALYST_SEED_CHANCE,
  STRATEGIC_CATALYST_SEED_DELAY_TICKS,
  STRATEGIC_CATALYST_SEED_PRIORITY,
  STRATEGIC_CONTROL_NEGLECT_GRACE_TICKS,
  STRATEGIC_CONTROL_DEGRADATION_RATE,
  STRATEGIC_HISTORY_WINDOW_TICKS,
  ENCOUNTER_POOL_INVALIDATING_EDGE_TYPES,
} from '../data/strategic-action-constants';
import {
  createTradeRoute,
  createSublocation,
  claimControl,
  releaseControl,
  recordIntelligence,
  modifyLocationProperty,
  createRelationEdge,
  type GraphOpResult,
} from './strategicGraphOps';
import { resolveDurableActorLocation } from './tradeRouteOps';
import { getStrategicTemplate } from './strategicActionCandidates';
import {
  resolveUndertakingCheckpoint,
  buildResidueEvent,
  buildAbandonMintEvent,
  type CheckpointBindingInput,
} from './undertakingCheckpoints';
import { runBindPass } from './binding/undertakingBindPass';
import { applyCreationEffects } from './binding/creationEffects';
import { releaseBindingsForProject } from './binding/bindingRegistry';
import { ensureRoleCensus, type SimulationRuntime } from './simulationRuntime';
import {
  MENTORSHIP_TEMPLATE_ID,
  isMentorshipEnabled,
  applyPendingMentorshipSevers,
  bootstrapMentorship,
  advanceMentorshipCheckpoint,
  resolveMentorshipUndertaking,
} from './mentorshipUndertaking';
import { emitTrace } from './traceBuffer';
import type { TraceEntry } from '../types/trace';

// ─── Execute a Chosen Strategic Action ──────────────────────────────

export interface StrategicExecutionResult {
  strategicState: StrategicRuntimeState;
  graphOps: GraphOpResult[];
  catalystSeeded: boolean;
  /**
   * Locations whose encounter pool changed because this execution minted a
   * pool-invalidating edge (THR-1184). The caller owns the refresh — it holds the
   * `SimulationRuntime`, which this module deliberately does not.
   *
   * Optional and absent on every path that mints no such edge, so existing callers
   * are unaffected.
   */
  poolInvalidatedLocationIds?: string[];
}

/**
 * Result of a hint-driven mutation: the graph ops, plus any location whose encounter
 * pool the mutation changed (THR-1184).
 */
interface InstantMutationResult {
  ops: GraphOpResult[];
  poolInvalidatedLocationIds: string[];
}

/**
 * Execute a strategic action candidate chosen by the unified decision pipeline.
 * Handles instant mutations, project starts, and control claims.
 */
export function executeStrategicAction(
  state: GameState,
  graph: WorldGraph,
  candidate: StrategicActionCandidate,
  tick: number,
  rng: () => number,
): StrategicExecutionResult {
  const currentState = state.strategicState ?? { projects: [], controls: [], history: [] };
  const graphOps: GraphOpResult[] = [];
  let catalystSeeded = false;

  switch (candidate.executionMode) {
    case 'instant': {
      // Execute the graph mutation immediately
      const { ops, poolInvalidatedLocationIds } = executeInstantMutation(graph, candidate, tick);
      graphOps.push(...ops);

      // Check for catalyst seeding
      catalystSeeded = maybeSeedCatalyst(state, candidate, tick, rng);

      // Record history
      const historyEntry = createHistoryEntry(candidate, tick, ops, catalystSeeded);
      const updatedHistory = pruneHistory([...currentState.history, historyEntry], tick);

      return {
        strategicState: { ...currentState, history: updatedHistory },
        graphOps,
        catalystSeeded,
        poolInvalidatedLocationIds,
      };
    }

    case 'multi_tick_project': {
      const template = getStrategicTemplate(candidate.templateId);
      const duration = template?.projectDuration ?? STRATEGIC_DEFAULT_PROJECT_WORK_TICKS;

      const project: StrategicProjectRuntime = {
        projectId: `proj_${candidate.templateId}_${candidate.actorId}_${tick}`,
        originLocationId: resolveDurableActorLocation(graph, candidate.actorId),
        actorId: candidate.actorId,
        templateId: candidate.templateId,
        ambitionId: candidate.ambitionId,
        verb: candidate.verb,
        behaviorFamily: candidate.behaviorFamily,
        targetNodeId: candidate.targetNodeId,
        targetHex: candidate.targetHex,
        // Carried from the gate that approved this candidate (THR-1296 §6). Absent on
        // every local undertaking; the bind pass binds it as `$anchor` when set.
        anchorNodeId: candidate.anchorNodeId,
        progress: 0,
        progressRequired: duration,
        startedTick: tick,
        lastProgressTick: tick,
        status: 'active',
      };

      return {
        strategicState: {
          ...currentState,
          projects: [...currentState.projects, project],
        },
        graphOps,
        catalystSeeded: false,
      };
    }

    case 'claim_control': {
      if (!candidate.targetNodeId) {
        return { strategicState: currentState, graphOps, catalystSeeded: false };
      }

      const controlResult = claimControl(graph, candidate.actorId, candidate.targetNodeId, tick);
      graphOps.push(controlResult);

      if (controlResult.success) {
        const control: StrategicControlState = {
          controlId: `ctrl_${candidate.templateId}_${candidate.actorId}_${tick}`,
          actorId: candidate.actorId,
          templateId: candidate.templateId,
          ambitionId: candidate.ambitionId,
          targetNodeId: candidate.targetNodeId,
          verb: 'control',
          behaviorFamily: candidate.behaviorFamily,
          establishedTick: tick,
          neglectTicks: 0,
          active: true,
          degradation: 0,
        };

        return {
          strategicState: {
            ...currentState,
            controls: [...currentState.controls, control],
          },
          graphOps,
          catalystSeeded: false,
        };
      }

      return { strategicState: currentState, graphOps, catalystSeeded: false };
    }

    case 'seed_encounter': {
      catalystSeeded = maybeSeedCatalyst(state, candidate, tick, rng);
      const historyEntry = createHistoryEntry(candidate, tick, [], catalystSeeded);
      const updatedHistory = pruneHistory([...currentState.history, historyEntry], tick);

      return {
        strategicState: { ...currentState, history: updatedHistory },
        graphOps,
        catalystSeeded,
      };
    }

    case 'contest_control': {
      // v1: contest simply degrades existing control
      // Full contest mechanics can be expanded later
      return { strategicState: currentState, graphOps, catalystSeeded: false };
    }

    default:
      return { strategicState: currentState, graphOps, catalystSeeded: false };
  }
}

/**
 * Let go of every node an undertaking held (THR-1296 §4).
 *
 * Released, never broken: nothing went wrong, the undertaking is simply over. The
 * distinction is load-bearing — `broken` triggers a re-bind and a complication, and
 * a completing undertaking that marked its cast broken would fire a "loses X" moment
 * on the way out of the world.
 *
 * Called on every exit from `active`, which is what stops a bound stage from being
 * held against housekeeping forever by an undertaking that ended twenty ticks ago.
 */
function releaseUndertakingBindings(state: GameState, projectId: string, tick: number): void {
  const bindings = state.strategicState?.bindings;
  if (!bindings || bindings.length === 0) return;
  releaseBindingsForProject(bindings, projectId, tick);
}

// ─── Advance Active Projects ────────────────────────────────────────

/**
 * Advance all active strategic projects by one tick.
 * Called from phaseStrategicProjects in the orchestrator.
 */
export function advanceStrategicProjects(
  state: GameState,
  graph: WorldGraph,
  tick: number,
  rng: () => number,
  /**
   * Session-owned caches the bind pass needs (THR-1296 §3): the reverse binding
   * index and the role census. Optional — absent, the bind pass is skipped entirely
   * and undertakings resolve uncast exactly as they do today, which is what keeps
   * every existing caller and test unchanged.
   */
  runtime?: SimulationRuntime,
): {
  strategicState: StrategicRuntimeState;
  events: import('../types/gameState').TickEvent[];
  /** Locations whose encounter pool a completing project changed (THR-1184). */
  poolInvalidatedLocationIds: string[];
  /**
   * Encounter seeds planted by an undertaking's own arc (THR-1292 §3). Today the
   * mentorship fold is the only producer — its offer, three milestones and terminal
   * seeds used to be planted by the retired phase 2.33.
   */
  pendingEncounterSeeds: PendingEncounterSeed[];
} {
  const currentState = state.strategicState ?? { projects: [], controls: [], history: [] };
  const updatedProjects: StrategicProjectRuntime[] = [];
  const completedOps: GraphOpResult[] = [];
  const poolInvalidatedLocationIds: string[] = [];
  const newHistory: StrategicHistoryEntry[] = [];
  const events: import('../types/gameState').TickEvent[] = [];
  const pendingEncounterSeeds: PendingEncounterSeed[] = [];

  // Divine `Sever the Bond` sets a flag on an agent; translating it onto the edge is
  // a once-per-tick sweep, not per-project work (rehomed from phase 2.33).
  if (isMentorshipEnabled()) applyPendingMentorshipSevers(graph);

  for (const project of currentState.projects) {
    if (project.status !== 'active') {
      updatedProjects.push(project);
      continue;
    }

    // ─── Mentorship bootstrap (THR-1292 §3) ───────────────────────────
    // Lazy rather than at start: the edge needs an apprentice who is present *now*,
    // and the pairing gate already refused the proposal when nobody was.
    const isMentorship = project.templateId === MENTORSHIP_TEMPLATE_ID;
    if (isMentorship && isMentorshipEnabled() && !hasMentorshipEdge(graph, project)) {
      const boot = bootstrapMentorship(graph, project, tick, rng);
      if (!boot) {
        // Nobody left to teach. End it cleanly — no status limbo, which is the
        // deadlock the retired `markInitiativeFailed` created (THR-1292 §3).
        releaseUndertakingBindings(state, project.projectId, tick);
        updatedProjects.push({ ...project, status: 'failed', failureReason: 'actor_lost' });
        newHistory.push(buildFailureHistory(project, tick, 'failed'));
        continue;
      }
      events.push(...boot.events);
      pendingEncounterSeeds.push(...boot.seeds);
    }

    // Timeout check — a fail-safe backstop only (THR-1292 §2). Halts now legitimately
    // extend an undertaking and the ratchet is the designed exit, so this catches
    // only the shapes the ratchet never reaches (a permanently absent actor, a
    // deferral loop). Tuned to `UNDERTAKING_TIMEOUT_TICKS`, not the old passive cadence.
    if (tick - project.startedTick > UNDERTAKING_TIMEOUT_TICKS) {
      releaseUndertakingBindings(state, project.projectId, tick);
      updatedProjects.push({ ...project, status: 'failed', failureReason: 'timeout' });
      newHistory.push({
        tick,
        actorId: project.actorId,
        templateId: project.templateId,
        ambitionId: project.ambitionId,
        verb: project.verb,
        behaviorFamily: project.behaviorFamily,
        displayName: getStrategicTemplate(project.templateId)?.displayName ?? project.templateId,
        targetNodeId: project.targetNodeId,
        outcome: 'failed',
        graphOps: [],
        catalystSeeded: false,
      });

      emitTrace({
        category: 'strategic_project_progress',
        tick,
        actorId: project.actorId,
        projectId: project.projectId,
        progress: project.progress,
        progressRequired: project.progressRequired,
        status: 'failed',
        summary: `Project ${project.templateId} timed out after ${tick - project.startedTick} ticks`,
      } as TraceEntry);

      continue;
    }

    // ─── The bind pass (THR-1296 §3) ──────────────────────────────────
    // Runs immediately before the checkpoint, in the same slot and shape as the
    // mentorship bootstrap above: decide in the binder, apply here. It returns the
    // project with `rebindRequested` consumed plus what the checkpoint needs to know
    // about the cast — a must-persist loss to name, or a mint still in the queue.
    //
    // Costs nothing on a template with no `cast` (every shipped template in v1): the
    // pass returns before it touches the registry, the census or the graph.
    let bindingInput: CheckpointBindingInput | undefined;
    let boundProject = project;
    if (runtime && state.strategicState) {
      const pass = runBindPass({
        graph,
        strategicState: state.strategicState,
        index: runtime.bindingIndex,
        census: ensureRoleCensus(runtime, graph),
        project,
        template: getStrategicTemplate(project.templateId),
        tick,
      });
      boundProject = pass.project;
      if (pass.loss || pass.awaitingMint) {
        bindingInput = { loss: pass.loss, awaitingMint: pass.awaitingMint };
      }
    }

    // ─── Checkpoint (THR-1292 §2) ─────────────────────────────────────
    // Progress is no longer a function of elapsed ticks. The checkpoint decides
    // whether this undertaking advances at all, and the record it returns carries
    // the halts, the deferrals and the fork state.
    const checkpoint = resolveUndertakingCheckpoint(state, graph, boundProject, tick, bindingInput);
    events.push(...checkpoint.events);
    const checked = checkpoint.project;

    // ─── Mentorship arc, driven by the band this checkpoint produced ──
    // The retired phase read a checkpoint array for a record stamped with the
    // current tick — a same-tick ordering contract between two phases. The effect
    // is read straight off the record here instead.
    // ─── Banded creation effects (THR-1296 §3, slice 5) ───────────────
    // What this checkpoint *made*. Fires on the band the checkpoint actually landed
    // on, once, only when the checkpoint resolved this tick — so a `not_due` pass and
    // a re-read of `lastCheckpoint` on a later tick both create nothing. Costs nothing
    // on a template with no `creationEffects`, which is every shipped template in v1.
    if (checked.lastCheckpoint?.tick === tick) {
      applyCreationEffects({
        state,
        graph,
        project: checked,
        template: getStrategicTemplate(checked.templateId),
        band: checked.lastCheckpoint.band,
        effect: checked.lastCheckpoint.effect,
        tick,
      });
    }

    let mentorshipForcedFailure = false;
    if (isMentorship && isMentorshipEnabled()) {
      const resolvedThisTick = checked.lastCheckpoint?.tick === tick;
      if (resolvedThisTick && checked.lastCheckpoint) {
        const arc = advanceMentorshipCheckpoint(graph, checked, checked.lastCheckpoint.effect, tick);
        events.push(...arc.events);
        pendingEncounterSeeds.push(...arc.seeds);
        if (arc.forceFailReason) {
          // Separation, a divine sever or a lost participant ends the undertaking.
          // The terminal arc runs on this *explicit* signal — never on absence.
          const terminal = resolveMentorshipUndertaking(graph, checked, 'failed', tick);
          events.push(...terminal.events);
          pendingEncounterSeeds.push(...terminal.seeds);
          releaseUndertakingBindings(state, checked.projectId, tick);
          updatedProjects.push({ ...checked, status: 'failed', failureReason: 'actor_lost' });
          newHistory.push(buildFailureHistory(checked, tick, 'failed'));
          mentorshipForcedFailure = true;
        }
      }
      if (!mentorshipForcedFailure
        && (checkpoint.verdict === 'ended' || checkpoint.verdict === 'completed')) {
        const terminal = resolveMentorshipUndertaking(
          graph, checked, checkpoint.verdict === 'completed' ? 'completed' : 'failed', tick,
        );
        events.push(...terminal.events);
        pendingEncounterSeeds.push(...terminal.seeds);
      }
    }
    if (mentorshipForcedFailure) continue;

    if (checkpoint.verdict === 'not_due' || checkpoint.verdict === 'deferred' || checkpoint.verdict === 'continues') {
      updatedProjects.push(checked);
      continue;
    }

    if (checkpoint.verdict === 'ended') {
      releaseUndertakingBindings(state, checked.projectId, tick);
      // Abandoned at the ratchet, or the actor is gone. The residue class follows
      // visibility (§2.2): what the player watched leaves something behind, what
      // they never saw leaves a chronicle line.
      const displayName = getStrategicTemplate(checked.templateId)?.displayName ?? checked.templateId;
      updatedProjects.push(checked);
      events.push(buildResidueEvent(graph, checked, tick, displayName));
      if (checked.failureReason === 'abandoned_after_halts') {
        // The THR-726 lane's candidate mint. Doc 4 authors the minting rule; this
        // doc guarantees only that the event fires with owner + undertaking identity.
        events.push(buildAbandonMintEvent(graph, checked, tick, displayName));
      }
      newHistory.push({
        tick,
        actorId: checked.actorId,
        templateId: checked.templateId,
        ambitionId: checked.ambitionId,
        verb: checked.verb,
        behaviorFamily: checked.behaviorFamily,
        displayName,
        targetNodeId: checked.targetNodeId,
        outcome: 'failed',
        graphOps: [],
        catalystSeeded: false,
      });
      continue;
    }

    // verdict === 'completed'
    const newProgress = checked.progress;

    {
      // Project complete — execute the world mutation
      const candidate: StrategicActionCandidate = {
        candidateId: project.projectId,
        templateId: project.templateId,
        ambitionId: project.ambitionId,
        actorId: project.actorId,
        verb: project.verb,
        executionMode: 'multi_tick_project',
        behaviorFamily: project.behaviorFamily,
        displayName: getStrategicTemplate(project.templateId)?.displayName ?? project.templateId,
        originLocationId: project.originLocationId,
        targetNodeId: project.targetNodeId,
        targetHex: project.targetHex,
        scoreComponents: {
          ambitionAlignment: 0, blockerRelief: 0, worldImpact: 0,
          catalystValue: 0, roleFit: 0, controlPressure: 0,
          travelPenalty: 0, varietyPenalty: 0,
        },
        finalScore: 0,
        generationReason: 'ambition_progression',
      };

      const mutation = executeInstantMutation(graph, candidate, tick);
      const ops = mutation.ops;
      completedOps.push(...ops);
      poolInvalidatedLocationIds.push(...mutation.poolInvalidatedLocationIds);

      const catalystSeeded = maybeSeedCatalyst(state, candidate, tick, rng);

      releaseUndertakingBindings(state, checked.projectId, tick);
      updatedProjects.push({ ...checked, progress: newProgress, status: 'completed', lastProgressTick: tick });
      newHistory.push(createHistoryEntry(candidate, tick, ops, catalystSeeded));

      const actorNode = graph.getNode(project.actorId);
      events.push({
        id: `strategic_complete_${project.projectId}_${tick}`,
        tick,
        type: 'agent_action',
        message: `${actorNode?.name ?? project.actorId} completes: ${candidate.displayName}`,
        significance: 0.6,
        actorId: project.actorId,
      });

      emitTrace({
        category: 'strategic_project_progress',
        tick,
        actorId: project.actorId,
        projectId: project.projectId,
        progress: newProgress,
        progressRequired: project.progressRequired,
        status: 'completed',
        summary: `Project ${project.templateId} completed`,
      } as TraceEntry);
    }
  }

  // Update controls — tick neglect and degradation
  const updatedControls: StrategicControlState[] = [];
  for (const control of currentState.controls) {
    // A collapsed stance is retired, never carried (THR-1286). Records used to
    // accumulate here forever at `active: false, degradation: 1`, and a dead record
    // is not inert: `computeControlPressure` reads its frozen `neglectTicks` and pins
    // the re-claim score at maximum. This branch also drains dead records loaded from
    // a world saved before the fix.
    if (!control.active) {
      retireControl(graph, control, tick, newHistory, events);
      continue;
    }

    // A stance cannot outlive what it controls. Removing a node takes its edges with
    // it, so a deleted target leaves a live record with no edge — the one shape that
    // still broke "live `controls` edges equal active stances" after the retirement
    // work above (seed 99 at tick 150: one stance on `loc_2`, a location deleted after
    // the stance was established). Retiring it now rather than waiting out ~30 ticks of
    // neglect keeps the invariant exact and costs one lookup per live stance.
    if (!graph.getNode(control.targetNodeId)) {
      retireControl(graph, control, tick, newHistory, events);
      continue;
    }

    const newNeglect = control.neglectTicks + 1;

    if (newNeglect > STRATEGIC_CONTROL_NEGLECT_GRACE_TICKS) {
      const newDegradation = Math.min(1, control.degradation + STRATEGIC_CONTROL_DEGRADATION_RATE);
      if (newDegradation >= 1) {
        // Control collapses — retired rather than kept as a dead record
        retireControl(graph, { ...control, neglectTicks: newNeglect, degradation: 1 }, tick, newHistory, events);
      } else {
        updatedControls.push({ ...control, neglectTicks: newNeglect, degradation: newDegradation });
      }
    } else {
      updatedControls.push({ ...control, neglectTicks: newNeglect });
    }
  }

  const updatedHistoryFull = pruneHistory([...currentState.history, ...newHistory], tick);

  return {
    strategicState: {
      projects: updatedProjects,
      controls: updatedControls,
      history: updatedHistoryFull,
    },
    events,
    poolInvalidatedLocationIds,
    pendingEncounterSeeds,
  };
}

// ─── Mentorship fold helpers (THR-1292 §3) ──────────────────────────

/** Whether this mentorship undertaking has already minted its `mentors` edge. */
function hasMentorshipEdge(graph: WorldGraph, project: StrategicProjectRuntime): boolean {
  return graph.getOutgoingEdges(project.actorId, 'mentors')
    .some(e => (e.properties.undertakingId as string | undefined) === project.projectId);
}

/** History row for an undertaking that ended without completing. */
function buildFailureHistory(
  project: StrategicProjectRuntime,
  tick: number,
  outcome: 'failed',
): StrategicHistoryEntry {
  return {
    tick,
    actorId: project.actorId,
    templateId: project.templateId,
    ambitionId: project.ambitionId,
    verb: project.verb,
    behaviorFamily: project.behaviorFamily,
    displayName: getStrategicTemplate(project.templateId)?.displayName ?? project.templateId,
    targetNodeId: project.targetNodeId,
    outcome,
    graphOps: [],
    catalystSeeded: false,
  };
}

// ─── Control Retirement ─────────────────────────────────────────────

/**
 * Retire a collapsed control stance (THR-1286): drop its `controls` edge, write the
 * collapse into history, announce it, and trace it.
 *
 * The history entry is the load-bearing part — it is what the re-claim cooldown in
 * `strategicActionCandidates` reads once the record itself is gone. `claim_control` is
 * the one strategic verb that never wrote history, which is why the existing
 * recent-duplicate variety guard was blind to control claims and the same target could
 * be re-proposed every tick (0 control history entries across a 150-tick seed-42 run).
 *
 * Mutates `history` and `events` in place — both are the caller's accumulators for this
 * tick, and the caller owns merging and pruning them.
 */
function retireControl(
  graph: WorldGraph,
  control: StrategicControlState,
  tick: number,
  history: StrategicHistoryEntry[],
  events: import('../types/gameState').TickEvent[],
): void {
  const released = releaseControl(graph, control.actorId, control.targetNodeId);
  const displayName = getStrategicTemplate(control.templateId)?.displayName ?? control.templateId;

  history.push({
    tick,
    actorId: control.actorId,
    templateId: control.templateId,
    ambitionId: control.ambitionId,
    verb: 'control',
    behaviorFamily: control.behaviorFamily,
    displayName,
    targetNodeId: control.targetNodeId,
    outcome: 'failed',
    graphOps: ['release_control'],
    catalystSeeded: false,
  });

  const actorNode = graph.getNode(control.actorId);
  events.push({
    id: `strategic_control_lost_${control.controlId}_${tick}`,
    tick,
    type: 'agent_action',
    message: `${actorNode?.name ?? control.actorId} loses control: ${displayName}`,
    significance: 0.5,
    actorId: control.actorId,
  });

  emitTrace({
    category: 'strategic_control_lifecycle',
    tick,
    actorId: control.actorId,
    targetNodeId: control.targetNodeId,
    event: 'collapsed',
    edgeReleased: released.success && released.createdId !== undefined,
    summary: `Control collapsed: ${displayName} (${control.actorId} → ${control.targetNodeId})`,
  } as TraceEntry);
}

// ─── Instant Mutation Dispatch ──────────────────────────────────────

// `resolveDurableActorLocation` moved to `tradeRouteOps.ts` (THR-1188) so the
// catalog trade verbs and this strategic pack cannot drift apart on what counts
// as a durable route endpoint. Behaviour is unchanged.

function executeInstantMutation(
  graph: WorldGraph,
  candidate: StrategicActionCandidate,
  tick: number,
): InstantMutationResult {
  const ops: GraphOpResult[] = [];
  const poolInvalidatedLocationIds: string[] = [];
  const targetId = candidate.targetNodeId;

  // ── Hint-driven dispatch: templates declare their mutation via mutationHint ──
  const template = getStrategicTemplate(candidate.templateId);
  const hint = template?.mutationHint;

  if (hint) {
    switch (hint.type) {
      case 'record_intelligence': {
        if (targetId) {
          ops.push(recordIntelligence(graph, candidate.actorId, targetId, hint.intelligenceType, tick));
        }
        break;
      }

      case 'create_sublocation': {
        if (targetId) {
          const actorNode = graph.getNode(candidate.actorId);
          const locNode = graph.getNode(targetId);
          const name = hint.nameTemplate
            .replace('{actor}', actorNode?.name ?? 'Unknown')
            .replace('{location}', locNode?.name ?? 'Unknown');
          ops.push(createSublocation(graph, targetId, candidate.actorId, name, hint.sublocationTypeId, tick));
        }
        break;
      }

      case 'create_trade_route': {
        if (targetId) {
          // Anchor at the project's origin settlement when we have one — the
          // actor's completion-time location is often a transient transit hex
          // whose GC evaporates the route (THR-669).
          const sourceLocId =
            candidate.originLocationId ?? resolveDurableActorLocation(graph, candidate.actorId);
          if (!sourceLocId) {
            ops.push({ success: false, op: 'create_trade_route', error: 'no_durable_source_location' });
          } else if (sourceLocId !== targetId) {
            ops.push(createTradeRoute(graph, sourceLocId, targetId, candidate.actorId, tick));
          }
        }
        break;
      }

      case 'create_relation_edge': {
        if (targetId) {
          const [source, target] = hint.direction === 'actor_to_target'
            ? [candidate.actorId, targetId]
            : [targetId, candidate.actorId];
          const result = createRelationEdge(graph, source, target, hint.edgeType, tick, hint.properties);
          ops.push(result);
          // THR-1184: a minted `sacred_route` changes what its destination can host, and
          // the encounter cache is only rebuilt on structural invalidation — so without
          // this the new pool waits for an unrelated system to notice. Report the
          // location; the caller (which owns the runtime) does the refresh.
          if (result.success && ENCOUNTER_POOL_INVALIDATING_EDGE_TYPES.has(hint.edgeType)) {
            const destination = graph.getNode(target);
            if (destination?.type === 'location') poolInvalidatedLocationIds.push(target);
          }
        }
        break;
      }

      case 'modify_location_property': {
        if (targetId) {
          ops.push(modifyLocationProperty(graph, targetId, hint.property, hint.delta, hint.clamp));
          // A timed boost stamps its own expiry; `phaseStrategicProjects` sweeps it
          // (THR-1292 §3 — rehomed from the retired `phaseInitiativeProgress`).
          if (hint.expiresAfterTicks != null) {
            const locNode = graph.getNode(targetId);
            if (locNode) {
              locNode.properties[`${hint.property}${LOCATION_BOOST_EXPIRY_SUFFIX}`] =
                tick + hint.expiresAfterTicks;
            }
          }
        }
        break;
      }

      case 'no_mutation':
        // Intentional no-op (control stances, seed_encounter modes)
        break;
    }
  } else {
    // ── Legacy fallback for templates without mutationHint ──
    // (Kept temporarily for backward compatibility — remove once all templates have hints)
    switch (candidate.templateId) {
      case 'strategic_survey_market':
        if (targetId) ops.push(recordIntelligence(graph, candidate.actorId, targetId, 'market_survey', tick));
        break;
      case 'strategic_negotiate_storage':
        if (targetId) ops.push(recordIntelligence(graph, candidate.actorId, targetId, 'storage_rights', tick));
        break;
      case 'strategic_establish_trade_route': {
        if (targetId) {
          const actorEdges = graph.getOutgoingEdges(candidate.actorId, 'located_at');
          const actorLocId = actorEdges[0]?.target;
          if (actorLocId && actorLocId !== targetId) {
            ops.push(createTradeRoute(graph, actorLocId, targetId, candidate.actorId, tick));
          }
        }
        break;
      }
      case 'strategic_build_warehouse': {
        if (targetId) {
          const actorNode = graph.getNode(candidate.actorId);
          const locNode = graph.getNode(targetId);
          ops.push(createSublocation(graph, targetId, candidate.actorId, `${actorNode?.name ?? 'Unknown'}'s Warehouse at ${locNode?.name ?? 'Unknown'}`, 'warehouse', tick));
        }
        break;
      }
      case 'strategic_found_guild_chapter': {
        if (targetId) {
          const actorNode = graph.getNode(candidate.actorId);
          const locNode = graph.getNode(targetId);
          ops.push(createSublocation(graph, targetId, candidate.actorId, `${actorNode?.name ?? 'Unknown'}'s Guild Chapter at ${locNode?.name ?? 'Unknown'}`, 'guild_chapter', tick));
        }
        break;
      }
      default:
        break;
    }
  }

  if (ops.length > 0) {
    emitTrace({
      category: 'strategic_world_change',
      tick,
      actorId: candidate.actorId,
      verb: candidate.verb,
      graphOps: ops.map(o => `${o.op}:${o.success ? 'ok' : o.error}`),
      catalystSeeded: false,
      affectedNodeIds: ops.filter(o => o.createdId).map(o => o.createdId!),
      summary: `Strategic world change: ${ops.length} ops (${ops.filter(o => o.success).length} succeeded)`,
    } as TraceEntry);
  }

  return { ops, poolInvalidatedLocationIds };
}

// ─── Catalyst Seeding ───────────────────────────────────────────────

function maybeSeedCatalyst(
  state: GameState,
  candidate: StrategicActionCandidate,
  tick: number,
  rng: () => number,
): boolean {
  const template = getStrategicTemplate(candidate.templateId);
  if (!template?.catalystEncounterIds?.length) return false;

  if (rng() > STRATEGIC_CATALYST_SEED_CHANCE) return false;

  // Pick a random catalyst encounter from the template's list
  const catalystId = template.catalystEncounterIds[
    Math.floor(rng() * template.catalystEncounterIds.length)
  ];

  // Seed it through the existing pending encounter seed mechanism.
  //
  // THR-992: this literal used to write `id` / `sourceActionId` and omit five
  // required fields — a shape that is not a `PendingEncounterSeed` at all, and
  // which the red typecheck baseline (THR-489) hid. It reached the shared pool
  // live: seed 42 / medium held two such entries at tick 132. Every consumer
  // that reads `.seedId` inherited the hazard (`phaseRouteEvents` threw its
  // whole phase on one), and the seeds that did spawn carried `undefined` into
  // every trace and player-facing label. The actor is part of the id because
  // two agents can complete the same strategic template on the same tick.
  const seed: PendingEncounterSeed = {
    seedId: `catalyst_${candidate.templateId}_${candidate.actorId}_${tick}`,
    // The candidate id is what `sourceActionId` was carrying — kept, in the
    // field the shared shape actually defines for provenance.
    sourceEncounterId: candidate.candidateId,
    sourceReactionId: 'strategic_catalyst',
    templateId: catalystId,
    targetAgentId: candidate.actorId,
    eligibleAfterTick: tick + STRATEGIC_CATALYST_SEED_DELAY_TICKS,
    priority: STRATEGIC_CATALYST_SEED_PRIORITY,
    seedLabel: `the wake of ${candidate.displayName}`,
    plantedTick: tick,
  };

  // Append to pending seeds (mutable state update — consistent with existing pattern)
  const existingSeeds = state.pendingEncounterSeeds ?? [];
  state.pendingEncounterSeeds = [...existingSeeds, seed];

  return true;
}

// ─── History Helpers ────────────────────────────────────────────────

function createHistoryEntry(
  candidate: StrategicActionCandidate,
  tick: number,
  ops: GraphOpResult[],
  catalystSeeded: boolean,
): StrategicHistoryEntry {
  return {
    tick,
    actorId: candidate.actorId,
    templateId: candidate.templateId,
    ambitionId: candidate.ambitionId,
    verb: candidate.verb,
    behaviorFamily: candidate.behaviorFamily,
    displayName: candidate.displayName,
    targetNodeId: candidate.targetNodeId,
    outcome: 'completed',
    graphOps: ops.map(o => `${o.op}:${o.success ? 'ok' : o.error}`),
    catalystSeeded,
  };
}

function pruneHistory(
  history: StrategicHistoryEntry[],
  tick: number,
): StrategicHistoryEntry[] {
  const windowStart = tick - STRATEGIC_HISTORY_WINDOW_TICKS;
  return history.filter(h => h.tick >= windowStart);
}
