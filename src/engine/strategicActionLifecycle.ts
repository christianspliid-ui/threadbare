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
  STRATEGIC_PROJECT_PROGRESS_PER_TICK,
  STRATEGIC_DEFAULT_PROJECT_TIMEOUT_TICKS,
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
  recordIntelligence,
  modifyLocationProperty,
  createRelationEdge,
  type GraphOpResult,
} from './strategicGraphOps';
import { resolveDurableActorLocation } from './tradeRouteOps';
import { getStrategicTemplate } from './strategicActionCandidates';
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
      const duration = template?.projectDuration ?? STRATEGIC_DEFAULT_PROJECT_TIMEOUT_TICKS;

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
): {
  strategicState: StrategicRuntimeState;
  events: import('../types/gameState').TickEvent[];
  /** Locations whose encounter pool a completing project changed (THR-1184). */
  poolInvalidatedLocationIds: string[];
} {
  const currentState = state.strategicState ?? { projects: [], controls: [], history: [] };
  const updatedProjects: StrategicProjectRuntime[] = [];
  const completedOps: GraphOpResult[] = [];
  const poolInvalidatedLocationIds: string[] = [];
  const newHistory: StrategicHistoryEntry[] = [];
  const events: import('../types/gameState').TickEvent[] = [];

  for (const project of currentState.projects) {
    if (project.status !== 'active') {
      updatedProjects.push(project);
      continue;
    }

    // Timeout check
    if (tick - project.startedTick > STRATEGIC_DEFAULT_PROJECT_TIMEOUT_TICKS) {
      updatedProjects.push({ ...project, status: 'failed' });
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

    // Advance progress
    const newProgress = project.progress + STRATEGIC_PROJECT_PROGRESS_PER_TICK;

    if (newProgress >= project.progressRequired) {
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

      updatedProjects.push({ ...project, progress: newProgress, status: 'completed', lastProgressTick: tick });
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
    } else {
      updatedProjects.push({ ...project, progress: newProgress, lastProgressTick: tick });

      emitTrace({
        category: 'strategic_project_progress',
        tick,
        actorId: project.actorId,
        projectId: project.projectId,
        progress: newProgress,
        progressRequired: project.progressRequired,
        status: 'active',
        summary: `Project ${project.templateId} progress: ${newProgress}/${project.progressRequired}`,
      } as TraceEntry);
    }
  }

  // Update controls — tick neglect and degradation
  const updatedControls: StrategicControlState[] = [];
  for (const control of currentState.controls) {
    if (!control.active) {
      updatedControls.push(control);
      continue;
    }

    const newNeglect = control.neglectTicks + 1;

    if (newNeglect > STRATEGIC_CONTROL_NEGLECT_GRACE_TICKS) {
      const newDegradation = Math.min(1, control.degradation + STRATEGIC_CONTROL_DEGRADATION_RATE);
      if (newDegradation >= 1) {
        // Control collapses
        updatedControls.push({ ...control, active: false, neglectTicks: newNeglect, degradation: 1 });

        const actorNode = graph.getNode(control.actorId);
        events.push({
          id: `strategic_control_lost_${control.controlId}_${tick}`,
          tick,
          type: 'agent_action',
          message: `${actorNode?.name ?? control.actorId} loses control: ${getStrategicTemplate(control.templateId)?.displayName ?? control.templateId}`,
          significance: 0.5,
          actorId: control.actorId,
        });
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
  };
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
