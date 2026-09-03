/**
 * Phase Agent Decision — unified encounter-driven decision pipeline.
 *
 * Replaces phaseIdleSelection as Phase 2b. For each idle individual agent,
 * runs the filter pipeline → scoring → action selection (start_local,
 * queue_movement, attempt_remote) or falls back to idle behavior (drift/stay).
 *
 * ─── Fail-soft ──────────────────────────────────────────────────
 * | Failure case                    | Fallback                              |
 * |---------------------------------|---------------------------------------|
 * | Agent has no location           | Skip agent, continue loop             |
 * | Filter pipeline throws          | Caught per-agent, agent stays idle    |
 * | Scoring throws                  | Caught per-agent, agent stays idle    |
 * | Pathfinding returns null        | Skip movement, agent stays            |
 * | initiateEncounter throws        | Caught per-agent, continue            |
 */

import type { GameState, TickEvent } from '../types/gameState';
import type { EncounterCacheManager } from './encounterCache';
import type { EncounterCacheEntry } from './encounterCache';
import type { DistanceMatrix } from './distanceMatrix';
import type { EncounterProgress } from '../types/encounter';
import type { UnifiedAction } from '../types/unifiedAction';
import {
  ENCOUNTER_ABANDON_COOLDOWN,
  ENCOUNTER_COMPLETION_COOLDOWN,
} from '../types/encounter';
import { runFilterPipeline } from './encounterFilterPipeline';
import { scoreAndSelect, NOVELTY_CATEGORY_WINDOW_TICKS, type FamiliarityRecord, type ScoredCandidate, type EncounterNoveltyRecord } from './encounterScoring';
import { findActionableIntelligence } from './intelligence';
import { buildMotiveReceipt, resolveMintedAmbitionProvenance } from './foreshadowing/motiveReceipt';
import { resolveIdleBehavior } from './idleBehavior';
import { isEncounterOccupied } from './encounter';
import { getAnyEncounterById } from '../data/encounter-content';
import { getUnifiedTemplateById } from '../data/unified-action-templates';
import { generateSocialCandidates } from './socialEncounterGeneration';
import { generateFactionQuestCandidates, generateFactionLifecycleCandidates } from './factionQuestGeneration';
import { initMovementState } from './movementExecution';
import { buildHexMovementPath } from './hexMovementPath';
import { findShortestPath } from './pathfinding';
import { computeEdgeCost } from './movementCost';
import { emitTrace, emitPhaseTiming, isProfilingEnabled } from './traceBuffer';
import type { TraceEntry, IdleDecisionTrace } from '../types/trace';
import { IDLE_SCORE_THRESHOLD, COOLDOWN_FULL_POOL_SIZE, COOLDOWN_MINIMUM, MAX_COMPLETIONS_PER_TEMPLATE, IDLE_FORCED_TRAVEL_THRESHOLD, NOVELTY_EMA_DECAY } from '../data/agent-behavior-constants';
import { REROUTE_SCORE_MULTIPLIER, DECISION_REEVALUATION_TICKS } from '../data/movement-content';
import type { MovementState } from '../types/movement';
import type { AgentRerouteTrace } from '../types/trace';
import { getAgentLocationId, getAvatarsOf } from './graphQueries';
import { appendEvent } from './encounterTimeline';
import { resolveLocationToHex } from './encounterAwareness';
import { hexDistance } from '../lib/hexMath';
import { MAX_AWARENESS_HOPS, EDGE_HEX_AWARENESS_BONUS } from '../data/agent-behavior-constants';
import type { SimulationRuntime } from './simulationRuntime';
import { touchWorld, applyEncounterCacheUpdate } from './simulationRuntime';
import { buildEncounterBinderContext } from './binding/encounterBinderContext';
import { resolveRelocationIntentForAgent } from './relocationIntent';
import { observeResidence } from './agentResidence';
import { recordBalanceEvent } from './balanceTelemetry';
import { prepareEncounterSupportBundle } from './encounterSupportBundle';
import { initializeClearanceGates } from './clearanceGate';
import { createUnifiedAction } from './unifiedActionLifecycle';
import { isCompulsionEligible, buildCompulsionEvent, shouldEmitCompulsion } from './premonitionCompulsion';
import type { PremonitionEvent } from '../types/premonition';
import { resolveEffectiveTier } from './attentionTier';
import type { BalanceEncounterPoolCandidate } from '../types/balanceEval';
import { deriveOmenEncounterBias, deriveEmittedOmenEncounterBias } from './phaseOmenAgenda';
import { derivePlantedCompulsionEncounterBias } from './plantedCompulsion';
import { IDENTITY_ENCOUNTER_BIAS_CAP } from '../types/doomIdentity';
import { ENABLE_STRATEGIC_ACTIONS, STRATEGIC_BOARD_TRACE_REFUSAL_CAP } from '../data/strategic-action-constants';
import { generateStrategicCandidates } from './strategicActionCandidates';
import { recordCovetRefusals } from './grievance/covetRivalry';
import {
  AMBITION_KIND_FACTION,
  AMBITION_KIND_TEMPLATE,
  getAmbitionKind,
  getAmbitionTemplateId,
  traceUnevaluableAmbition,
} from './ambitionShape';
import { isAutonomousDecisionActor } from './strategicKindReachability';
import { scoreStrategicCandidates } from './strategicActionScoring';
import { executeStrategicAction } from './strategicActionLifecycle';
import { enqueueUndertakingMoments } from './undertakingMoments';
import type { StrategicCandidateBoardTrace, StrategicActionStartedTrace } from '../types/trace';
import type { DecisionFamily, UndertakingMomentRecord } from '../types/strategicAction';
import type { BalanceEvent } from '../types/balanceEval';
import { scoreUnifiedBoard } from './decisionBoard';
import { UNIFIED_DECISION_BOARD_MODE, BOARD_SCORE_FLOOR } from '../data/strategic-action-constants';
import { computeSurfaceKey } from './encounterSurface';
import { resolveTemplateFragments } from './fragmentResolution';
import { getLocationType } from './encounterCache';
import { settingClassForSubtype } from '../data/settingClasses';

/**
 * Compute effective cooldown scaled by available template pool size.
 * Large pools use full cooldown; small pools get shorter cooldowns
 * to prevent agents from hitting `all_on_cooldown` repeatedly.
 */
function getEffectiveCooldown(baseCooldown: number, availableTemplateCount: number): number {
  if (availableTemplateCount >= COOLDOWN_FULL_POOL_SIZE) return baseCooldown;
  const scale = availableTemplateCount / COOLDOWN_FULL_POOL_SIZE;
  return Math.max(COOLDOWN_MINIMUM, Math.round(baseCooldown * scale));
}

/**
 * Filter out candidates whose encounter template is on cooldown for this agent.
 * An encounter is on cooldown if the agent has an abandoned or completed progress
 * record whose last history tick is within the cooldown window.
 * Cooldown duration scales with the available template pool size.
 */
function filterByCooldown(
  candidates: EncounterCacheEntry[],
  agentId: string,
  encounterProgress: readonly EncounterProgress[],
  unifiedActions: readonly UnifiedAction[],
  tick: number,
  availableTemplateCount: number,
): EncounterCacheEntry[] {
  const effectiveAbandon = getEffectiveCooldown(ENCOUNTER_ABANDON_COOLDOWN, availableTemplateCount);
  const effectiveComplete = getEffectiveCooldown(ENCOUNTER_COMPLETION_COOLDOWN, availableTemplateCount);

  // Collect cooldown end ticks per template for this agent
  const cooldownEnd = new Map<string, number>();
  for (const p of encounterProgress) {
    if (p.actorId !== agentId) continue;
    if (p.status === 'abandoned') {
      const lastStep = p.history[p.history.length - 1];
      const abandonedAt = lastStep?.tick ?? p.startedTick;
      cooldownEnd.set(p.encounterId, abandonedAt + effectiveAbandon);
    } else if (p.status === 'completed') {
      const lastStep = p.history[p.history.length - 1];
      const completedAt = lastStep?.tick ?? p.startedTick;
      cooldownEnd.set(p.encounterId, completedAt + effectiveComplete);
    }
  }

  for (const action of unifiedActions) {
    if (action.actorId !== agentId || !action.resolved) continue;
    const completedAt = action.completedAtTick ?? action.startTick;
    cooldownEnd.set(action.templateId, completedAt + effectiveComplete);
  }

  if (cooldownEnd.size === 0) return candidates;

  return candidates.filter(c => {
    const end = cooldownEnd.get(c.templateId);
    return end === undefined || tick > end;
  });
}

function getDecisionLocationSubtype(
  graph: GameState['graph'],
  locationId: string,
): string {
  const node = graph.getNode(locationId);
  if (!node) return 'unknown';
  const props = node.properties as Record<string, unknown>;
  const locationType = props.locationType;
  const locationSubtype = props.locationSubtype;
  if (typeof locationType === 'string' && locationType.length > 0 && locationType !== 'location') {
    return locationType;
  }
  if (typeof locationSubtype === 'string' && locationSubtype.length > 0) {
    return locationSubtype;
  }
  return 'unknown';
}

function getThreadContext(
  graph: GameState['graph'],
  ascendantId: string | null,
  agentId: string,
): { threaded: boolean; courtPosition?: string } {
  if (!ascendantId) return { threaded: false };
  const threadEdge = graph.getOutgoingEdges(ascendantId, 'thread').find(e => e.target === agentId);
  const courtPosition = typeof threadEdge?.properties?.courtPosition === 'string'
    ? threadEdge.properties.courtPosition
    : undefined;
  return {
    threaded: Boolean(threadEdge),
    ...(courtPosition ? { courtPosition } : {}),
  };
}

function isSelectedPoolCandidate(
  candidate: ScoredCandidate,
  selected: ScoredCandidate | null,
): boolean {
  if (!selected) return false;
  return candidate.entry.templateId === selected.entry.templateId
    && candidate.entry.locationId === selected.entry.locationId
    && candidate.entry.sublocationId === selected.entry.sublocationId
    && candidate.entry.targetAgentId === selected.entry.targetAgentId;
}

function buildEncounterPoolSnapshot(
  graph: GameState['graph'],
  rankedCandidates: readonly ScoredCandidate[],
  selected: ScoredCandidate | null,
): BalanceEncounterPoolCandidate[] {
  return rankedCandidates.map((candidate, index) => {
    const templateName = getAnyEncounterById(candidate.entry.templateId)?.name
      ?? getUnifiedTemplateById(candidate.entry.templateId)?.name
      ?? candidate.entry.templateId;
    const locationNode = graph.getNode(candidate.entry.locationId);
    const sublocationNode = candidate.entry.sublocationId
      ? graph.getNode(candidate.entry.sublocationId)
      : null;

    return {
      rank: index + 1,
      templateId: candidate.entry.templateId,
      templateName,
      locationId: candidate.entry.locationId,
      locationName: locationNode?.name ?? candidate.entry.locationId,
      ...(candidate.entry.sublocationId ? { sublocationId: candidate.entry.sublocationId } : {}),
      ...(sublocationNode?.name ? { sublocationName: sublocationNode.name } : {}),
      action: candidate.action,
      reachPrimary: candidate.entry.reachPrimary,
      reachSecondary: candidate.entry.reachSecondary,
      encounterType: candidate.entry.encounterType,
      threatBand: candidate.entry.threatRating,
      stepCount: candidate.entry.stepCount,
      totalTickCost: candidate.entry.totalTickCost,
      rewardEstimate: candidate.entry.successRewardEstimate,
      completionProb: candidate.completionProb,
      travelCost: candidate.travelCost,
      finalScore: candidate.finalScore,
      selected: isSelectedPoolCandidate(candidate, selected),
    };
  });
}

export function phaseAgentDecision(
  state: GameState,
  encounterCache: EncounterCacheManager,
  distanceMatrix: DistanceMatrix,
  rng: () => number,
  runtime?: SimulationRuntime,
): Partial<GameState> {
  const graph = state.graph;
  // Max spatial query range: MAX_AWARENESS_HOPS + edge hex bonus + 1 (safety margin for effects)
  const spatialQueryRange = MAX_AWARENESS_HOPS + EDGE_HEX_AWARENESS_BONUS + 1;
  // THR-581: accumulate the per-tick encounter-awareness pre-filter cost so the
  // neighborhood-probe optimization is measured, not assumed (NFP #2/#7). Gated on
  // profiling → zero cost when off; emitted ONCE per tick (never per-agent, which
  // would flood the timing ring — see reference_trace_buffer_per_tick_volume).
  const profiling = isProfilingEnabled();
  let awarenessMs = 0;
  const newEvents: TickEvent[] = [];
  const newEncounterProgress: EncounterProgress[] = [];
  const newUnifiedActions: UnifiedAction[] = [];
  const newPremonitions: PremonitionEvent[] = [];
  let nextClearanceGateStates = state.clearanceGateStates
    ? new Map(state.clearanceGateStates)
    : undefined;
  let accumulatedStrategicState = state.strategicState;
  // Founding moments minted by project starts this tick (THR-1299 slice 2).
  const newMoments: UndertakingMomentRecord[] = [];

  // Mutable novelty record for this tick — updated as agents commit to encounters (THR-453).
  // Clone shallowly so we don't mutate the previous state's object.
  const noveltyRecord: EncounterNoveltyRecord = state.encounterNoveltyRecord
    ? {
        globalLastSelected: { ...state.encounterNoveltyRecord.globalLastSelected },
        categoryWindowCounts: { ...state.encounterNoveltyRecord.categoryWindowCounts },
        templateWindowCounts: { ...(state.encounterNoveltyRecord.templateWindowCounts ?? {}) },
        categoryWindowTotal: state.encounterNoveltyRecord.categoryWindowTotal,
        categoryWindowStart: state.encounterNoveltyRecord.categoryWindowStart,
        selectionEMA: { ...(state.encounterNoveltyRecord.selectionEMA ?? {}) },
      }
    : {
        globalLastSelected: {},
        categoryWindowCounts: {},
        templateWindowCounts: {},
        categoryWindowTotal: 0,
        categoryWindowStart: state.tick,
        selectionEMA: {},
      };

  // Derive map dimensions for edge hex awareness bonus
  let mapCols = 0;
  let mapRows = 0;
  for (const tile of state.tiles) {
    if (tile.coord.col >= mapCols) mapCols = tile.coord.col + 1;
    if (tile.coord.row >= mapRows) mapRows = tile.coord.row + 1;
  }

  // Build set of avatar IDs to exclude from autonomous decision-making
  const avatarNodeIds = new Set<string>();
  if (state.ascendantId) {
    for (const a of getAvatarsOf(graph, state.ascendantId)) {
      avatarNodeIds.add(a.id);
    }
  }

  // Get all individual spotlight actors, excluding the player's avatar.
  // Ambient/notable NPCs are excluded — they don't participate in autonomous decision-making.
  // Legacy nodes without spotlightTier default to 'spotlight' for backward compatibility.
  //
  // THR-1329: the tier test itself now lives in `strategicKindReachability`, so the
  // reachability instrument measures the population this loop actually runs rather
  // than a copy of it that can drift. The avatar exclusion stays here — the player
  // drives that agent, which is not a statement about the tier.
  const actors = graph.getNodesByType('actor').filter(
    (n) => isAutonomousDecisionActor(n) && !avatarNodeIds.has(n.id),
  );

  // Pre-compute set of agents with active (unresolved) unified actions — O(actions) once
  // instead of O(actors × actions) per-agent .some() scan.
  const busyAgentIds = new Set<string>();
  for (const a of state.unifiedActions) {
    if (!a.resolved) busyAgentIds.add(a.actorId);
  }

  for (const actor of actors) {
    const agentId = actor.id;

    try {
      // ── Relocation intent resolution (THR-1142) ──────────────────────────
      // Runs BEFORE every skip below, deliberately: an agent mid-journey is
      // skipped by the movement guard, and that is exactly the agent most likely
      // to be arriving. Placing this after the skips would mean an intent could
      // only ever resolve on a tick the mortal happened to be idle.
      //
      // This is the whole of the intent lifecycle — no new phase, no second
      // movement path. The *pull* lives in `computeRelocationIntentBonus`, read
      // inside `scoreAndSelect` further down; here we only retire an intent that
      // has been fulfilled or has run out of time, so nobody walks forever.
      {
        const reloc = resolveRelocationIntentForAgent(state, agentId, state.tick);
        if (reloc.outcome === 'arrived' || reloc.outcome === 'expired') {
          const intent = reloc.intent!;
          if (reloc.outcome === 'arrived' && intent.stampResidenceOnArrival) {
            // THR-822 shape: residence is observed where the agent actually
            // stands, not stamped from the authored destination.
            observeResidence(graph, agentId, state.tick);
          }
          if (runtime) touchWorld(runtime);
          emitTrace({
            category: reloc.outcome === 'arrived' ? 'relocation_arrived' : 'relocation_expired',
            tick: state.tick,
            agentId,
            agentName: actor.name,
            destination: intent.destinationNodeId ?? `hex ${intent.destinationHex.col},${intent.destinationHex.row}`,
            destinationHex: intent.destinationHex,
            ticksTaken: state.tick - intent.setAtTick,
            templateId: intent.templateId,
            summary: reloc.outcome === 'arrived'
              ? `${actor.name} reaches ${intent.destinationNodeId ?? 'their destination'} after ${state.tick - intent.setAtTick} ticks`
              : `${actor.name} gives up on reaching ${intent.destinationNodeId ?? 'their destination'} after ${state.tick - intent.setAtTick} ticks`,
          });
        }
      }

      // Skip if already active (unified action)
      if (
        busyAgentIds.has(agentId)
        || newUnifiedActions.some((a) => a.actorId === agentId && !a.resolved)
      ) {
        continue;
      }

      // Skip if occupied in encounter (check both existing and newly started)
      const activeEncounter = state.encounterProgress.find(
        (ep) => ep.actorId === agentId && ep.status === 'active',
      ) ?? newEncounterProgress.find(
        (ep) => ep.actorId === agentId && ep.status === 'active',
      );
      if (activeEncounter && isEncounterOccupied(activeEncounter, state.tick)) {
        continue;
      }
      // Also skip if agent already has ANY active encounter (not just occupied ones)
      if (activeEncounter) continue;

      // Gated re-evaluation for moving agents (replaces blanket skip).
      // Moving agents do NOT enter the full decision pipeline. They only check:
      // "is my current destination still the best heading?"
      const movementState = actor.properties?.movementState as MovementState | undefined;
      if (movementState?.movementQueue && movementState.movementQueue.length > 0) {
        // GUARD 1: Tick gating — only re-evaluate every DECISION_REEVALUATION_TICKS
        if (state.tick - (movementState.lastDecisionTick ?? 0) < DECISION_REEVALUATION_TICKS) {
          continue;
        }

        // GUARD 5: Target invalidation — check if current target encounter still exists
        const currentTargetId = movementState.targetEncounterId;
        const currentTargetValid = currentTargetId
          ? !!getAnyEncounterById(currentTargetId)
          : true; // No target encounter → just traveling (drift), always "valid"

        if (currentTargetValid) {
          // Quick scan: does any encounter cache entry for a DIFFERENT location score
          // dramatically better? We don't run the full pipeline — just check the cache.
          const currentScore = movementState.motivationPull ?? 0;

          // Get agent location for distance calculation
          const agentLocId = getAgentLocationId(graph, agentId);

          if (agentLocId) {
            // Spatial pre-filter for reroute check
            const movingHex = resolveLocationToHex(graph, agentLocId);
            const awStart1 = profiling ? performance.now() : 0;
            const rerouteEntries = movingHex
              ? encounterCache.getEntriesNearHex(movingHex.col, movingHex.row, spatialQueryRange)
              : encounterCache.getAllEntries();
            if (profiling) awarenessMs += performance.now() - awStart1;
            let bestAltScore = 0;
            let bestAltLocationId: string | null = null;

            for (const entry of rerouteEntries) {
              if (entry.locationId === movementState.destinationId) continue; // Skip current destination
              // Simple heuristic: questPriority as rough score proxy
              const entryScore = entry.questPriority ?? 1.0;
              if (entryScore > bestAltScore) {
                bestAltScore = entryScore;
                bestAltLocationId = entry.locationId;
              }
            }

            // GUARD 3: Reroute threshold — alternative must be dramatically better
            if (bestAltScore >= currentScore * REROUTE_SCORE_MULTIPLIER && bestAltLocationId) {
              // GUARD 4: Only allow queue_movement (moving agents can't start local/remote)
              // Pathfind from the NEXT graph node (movementQueue[0]), not agentLocId.
              // agentLocId is the located_at edge which is stale mid-road — using it
              // would teleport the agent back to their origin.
              const rerouteFromId = movementState.movementQueue[0] ?? agentLocId;
              const graphPath = findShortestPath(graph, agentId, rerouteFromId, bestAltLocationId);
              if (graphPath) {
                // Reroute: emit trace, create new movement state
                const oldDestId = movementState.destinationId;
                const currentHexPos = movementState.currentHexPosition ?? { col: 0, row: 0 };

                emitTrace({
                  category: 'agent_reroute',
                  tick: state.tick,
                  agentId,
                  agentName: actor.name,
                  oldDestinationId: oldDestId,
                  newDestinationId: bestAltLocationId,
                  currentHexPosition: currentHexPos,
                  reason: 'better_encounter',
                  oldScore: currentScore,
                  newScore: bestAltScore,
                  summary: `${actor.name} reroutes from ${graph.getNode(oldDestId)?.name ?? '?'} to ${graph.getNode(bestAltLocationId)?.name ?? '?'}`,
                } as AgentRerouteTrace & { agentName: string; summary: string });

                // Timeline: REROUTE event
                appendEvent(agentId, {
                  phase: 'REROUTE',
                  tick: state.tick,
                  oldTarget: graph.getNode(oldDestId)?.name ?? oldDestId,
                  newTarget: graph.getNode(bestAltLocationId)?.name ?? bestAltLocationId,
                  reason: 'better_encounter',
                });

                // Build new movement state preserving current road hex progress.
                // The agent stays at their current hex position and continues walking
                // their current road segment — only the downstream queue changes.
                const newMovState: MovementState = {
                  destinationId: bestAltLocationId,
                  movementQueue: [rerouteFromId, ...graphPath.path],
                  ticksAccumulated: movementState.ticksAccumulated,
                  currentEdgeCost: movementState.currentEdgeCost,
                  lastDecisionTick: state.tick,
                  movementHistory: movementState.movementHistory,
                  motivationPull: bestAltScore,
                  // Preserve current road traversal state — agent keeps walking
                  currentHexPosition: movementState.currentHexPosition,
                  roadHexQueue: movementState.roadHexQueue,
                  roadHexCost: movementState.roadHexCost,
                  currentRoadType: movementState.currentRoadType,
                  // Merge road segments: current + new path segments
                  roadSegments: [
                    ...(movementState.roadSegments ?? []),
                    ...(graphPath.roadSegments ?? []).map(s => ({
                      fromId: s.fromId,
                      toId: s.toId,
                      roadType: s.roadType,
                      hexPath: s.hexPath.map(h => ({ col: h.col, row: h.row })),
                      discountedCost: s.discountedCost,
                    })),
                  ],
                };

                graph.updateNode(agentId, {
                  properties: { ...actor.properties, movementState: newMovState },
                });
                continue;
              }
            }
          }
        } else {
          // Target invalid — reroute unconditionally to any available destination
          const agentLocId = getAgentLocationId(graph, agentId);

          if (agentLocId) {
            const currentHexPos = movementState.currentHexPosition ?? { col: 0, row: 0 };

            emitTrace({
              category: 'agent_reroute',
              tick: state.tick,
              agentId,
              agentName: actor.name,
              oldDestinationId: movementState.destinationId,
              newDestinationId: agentLocId, // Will idle at current location
              currentHexPosition: currentHexPos,
              reason: 'target_invalid',
              oldScore: movementState.motivationPull ?? 0,
              newScore: 0,
              summary: `${actor.name} abandons invalid target, will idle on arrival`,
            } as AgentRerouteTrace & { agentName: string; summary: string });

            // Timeline: REROUTE (target invalid)
            appendEvent(agentId, {
              phase: 'REROUTE',
              tick: state.tick,
              oldTarget: graph.getNode(movementState.destinationId)?.name ?? movementState.destinationId,
              newTarget: graph.getNode(agentLocId)?.name ?? agentLocId,
              reason: 'target_invalid',
            });

            // Clear target encounter — agent will pick a new one on arrival
            const updatedState: MovementState = {
              ...movementState,
              targetEncounterId: undefined,
              targetSublocationId: undefined,
              lastDecisionTick: state.tick,
            };
            graph.updateNode(agentId, {
              properties: { ...actor.properties, movementState: updatedState },
            });
          }
        }

        // Update lastDecisionTick to prevent re-evaluation next tick
        const updatedMs: MovementState = {
          ...movementState,
          lastDecisionTick: state.tick,
        };
        graph.updateNode(agentId, {
          properties: { ...actor.properties, movementState: updatedMs },
        });
        continue;
      }

      // Get agent location — check located_at outgoing, then contains outgoing
      // (worldSeed uses contains: source=agent, target=location — legacy fallback)
      let locationId = getAgentLocationId(graph, agentId);
      if (!locationId) {
        const outContains = graph.getOutgoingEdges(agentId, 'contains');
        if (outContains.length > 0) locationId = outContains[0].target;
      }

      if (!locationId) continue;

      const originLocationSubtype = getDecisionLocationSubtype(graph, locationId);
      const threadContext = getThreadContext(graph, state.ascendantId, agentId);

      // Generate social encounter candidates (agent-to-agent)
      const socialEntries = generateSocialCandidates(
        graph,
        agentId,
        locationId,
        distanceMatrix,
      );

      // Generate faction quest candidates (TB-060)
      const factionEntries = generateFactionQuestCandidates(
        graph,
        agentId,
        locationId,
        state.tick,
      );

      // Generate faction lifecycle candidates: join & promotion (TB-061)
      const lifecycleEntries = generateFactionLifecycleCandidates(
        graph,
        agentId,
        locationId,
      );

      // Spatial pre-filter: only fetch cache entries near the agent's hex
      const agentHex = resolveLocationToHex(graph, locationId);
      const awStart2 = profiling ? performance.now() : 0;
      const nearbyEntries = agentHex
        ? encounterCache.getEntriesNearHex(agentHex.col, agentHex.row, spatialQueryRange)
        : encounterCache.getAllEntries();
      if (profiling) awarenessMs += performance.now() - awStart2;

      // Merge static cache entries with dynamic social + faction + lifecycle entries
      const dynamicEntries = [...socialEntries, ...factionEntries, ...lifecycleEntries];
      const mergedEntries = dynamicEntries.length > 0
        ? [...nearbyEntries, ...dynamicEntries]
        : nearbyEntries;

      // Run filter pipeline (hex-distance awareness with edge hex bonus)
      const filterResult = runFilterPipeline(
        mergedEntries,
        agentId,
        locationId,
        graph,
        state.tick,
        mapCols,
        mapRows,
        runtime,
      );
      const rawCandidates = filterResult.candidates;

      // Emit filter pipeline trace
      emitTrace(filterResult.trace as TraceEntry);

      // Filter out encounters on cooldown (abandoned/completed recently)
      // Pool size for dynamic cooldown = raw candidates after filter pipeline
      const cooldownCandidates = filterByCooldown(
        rawCandidates,
        agentId,
        state.encounterProgress,
        state.unifiedActions,
        state.tick,
        rawCandidates.length,
      );

      // C.1: Max completions retirement — permanently exclude templates the agent has exhausted
      const familiarityRecord = (actor.properties?.familiarityRecord as FamiliarityRecord | undefined) ?? { attemptCount: {} };
      const candidates = cooldownCandidates.filter(c => {
        const completions = familiarityRecord.attemptCount[c.templateId] ?? 0;
        return completions < MAX_COMPLETIONS_PER_TEMPLATE;
      });

      // Combine doom identity + omen encounter biases (additive; each capped at ±IDENTITY_ENCOUNTER_BIAS_CAP)
      const identityBias = state.doomIdentityMatrix?.encounterPoolBias ?? {};
      const omenBias = state.omenState ? deriveOmenEncounterBias(state.omenState) : {};
      const emittedOmenBias = (state.emittedOmens && agentHex)
        ? deriveEmittedOmenEncounterBias(state.emittedOmens, agentHex.col, agentHex.row)
        : {};
      // The Compulsion (THR-886) — a per-agent urge joins here rather than in a second
      // reader, so the god's whisper and the world's weather are weighed together once.
      // It carries its own cap (COMPULSION_BIAS_CAP, applied at derive) because it is
      // aimed at one mortal and is meant to be felt more than ambient weather.
      const compulsionBias = derivePlantedCompulsionEncounterBias(
        state.plantedCompulsions,
        agentId,
        state.tick,
      );
      const combinedBias: Partial<Record<string, number>> = {};
      const allTypes = new Set([
        ...Object.keys(identityBias),
        ...Object.keys(omenBias),
        ...Object.keys(emittedOmenBias),
        ...Object.keys(compulsionBias),
      ]);
      for (const t of allTypes) {
        const id = Math.max(-IDENTITY_ENCOUNTER_BIAS_CAP, Math.min(IDENTITY_ENCOUNTER_BIAS_CAP, identityBias[t] ?? 0));
        const om = Math.max(-IDENTITY_ENCOUNTER_BIAS_CAP, Math.min(IDENTITY_ENCOUNTER_BIAS_CAP, omenBias[t] ?? 0));
        const eo = Math.max(-IDENTITY_ENCOUNTER_BIAS_CAP, Math.min(IDENTITY_ENCOUNTER_BIAS_CAP, emittedOmenBias[t] ?? 0));
        combinedBias[t] = id + om + eo + (compulsionBias[t] ?? 0);
      }

      // Score and select (hex-distance travel cost, no distance matrix)
      const agentHiddenMarks = (state.hiddenMarks ?? []).filter(m => m.targetAgentId === agentId);
      const agentIntelligence = (state.intelligenceRecords ?? []).filter(r => r.agentId === agentId);
      const decision = scoreAndSelect(
        candidates,
        agentId,
        locationId,
        graph,
        state.tick,
        state.worldSoul?.fundament,
        state.tiles,
        undefined,
        combinedBias,
        agentHiddenMarks,
        agentIntelligence,
        runtime,
        noveltyRecord,
      );

      // Emit scoring trace
      emitTrace(decision.trace as TraceEntry);

      // ── Strategic Candidate Integration ─────────────────────────────
      // When enabled, generate strategic candidates from active ambitions
      // and compare them with the encounter board. If the best strategic
      // candidate beats the best encounter candidate, override the selection.
      let decisionFamily: DecisionFamily = decision.selected ? 'encounter' : 'idle';
      let strategicWinner: ReturnType<typeof scoreStrategicCandidates>[number] | null = null;
      // Hoisted out of the try below so the shadow board can read the same ranked
      // candidates the legacy contest just compared, rather than regenerating them
      // (which would double the generation cost and could disagree on rng draws).
      let scoredStrategic: ReturnType<typeof scoreStrategicCandidates> = [];

      if (ENABLE_STRATEGIC_ACTIONS) {
        try {
          // Find active ambition template IDs via pursues edges
          const pursuesEdges = graph.getOutgoingEdges(agentId, 'pursues');
          const activeAmbitionTemplateIds: string[] = [];
          for (const edge of pursuesEdges) {
            const props = edge.properties as Record<string, unknown> | undefined;
            if (props?.status === 'active') {
              const ambitionNode = graph.getNode(edge.target);
              // THR-1285: same shape question as ambitionTick, same tripwire. Asking
              // the module rather than `properties.templateId` keeps "wrong vocabulary"
              // distinguishable from "corrupt template ambition" — silently dropping
              // both was what let the class stay invisible.
              const templateId = getAmbitionTemplateId(ambitionNode);
              if (templateId) {
                activeAmbitionTemplateIds.push(templateId);
              } else if (ambitionNode) {
                const kind = getAmbitionKind(ambitionNode);
                traceUnevaluableAmbition(
                  state.tick, agentId, actor.name || agentId, ambitionNode.id,
                  kind === AMBITION_KIND_FACTION ? 'faction_kind_ambition'
                    : kind === AMBITION_KIND_TEMPLATE ? 'missing_template_id'
                      : 'unclassifiable_ambition',
                );
              }
              // A missing target node is not traced — see the note in ambitionTick:
              // the graph API cannot produce a dangling `pursues` edge.
            }
          }

          if (activeAmbitionTemplateIds.length > 0) {
            const stratResult = generateStrategicCandidates(
              graph, agentId, activeAmbitionTemplateIds, accumulatedStrategicState, state.tick, rng,
            );
            const scored = scoreStrategicCandidates(
              stratResult.candidates, accumulatedStrategicState, state.tick, rng,
            );
            scoredStrategic = scored;

            // The strategic-vs-encounter contest (THR-1292 §4's contest B) stood
            // here until THR-1349 slice 3: `bestStrategicScore > bestEncounterScore`,
            // comparing a score clamped into `[0.08, 0.851]` by
            // `STRATEGIC_ENCOUNTER_SCORE_BRIDGE` against an unbounded encounter score.
            // It chose an undertaking on 42–46% of spotlight decisions and let one
            // mortal stack eight to eleven of them, because the clamp put most
            // undertakings above most encounters. The board below is the one
            // selector now; this block only generates, scores and traces the family.

            // Emit strategic candidate board trace
            emitTrace({
              category: 'strategic_candidate_board',
              tick: state.tick,
              agentId,
              ambitionIds: activeAmbitionTemplateIds,
              candidatesGenerated: stratResult.candidates.length,
              candidatesRejected: stratResult.rejections.length,
              topCandidateIds: scored.slice(0, 3).map(c => c.candidateId),
              chosenCandidateId: null, // Updated below if strategic wins
              featureEnabled: true,
              // THR-1297 §2: the count alone made every generation gate invisible.
              // Capped detail, exact count — the `BindingDecisionTrace.rows` idiom.
              refusals: stratResult.rejections
                .slice(0, STRATEGIC_BOARD_TRACE_REFUSAL_CAP)
                .map(r => ({ templateId: r.templateId, reason: r.reason })),
              summary: `Strategic board: ${stratResult.candidates.length} generated, ${stratResult.rejections.length} rejected, top=${scored[0]?.finalScore.toFixed(3) ?? 'none'}`,
            } as StrategicCandidateBoardTrace & { summary: string });
            // THR-1388 — the covet rivalry: the refusals already in hand feed the counter;
            // at the threshold the world writes the quarrel the motive gate was asking for.
            recordCovetRefusals(graph, agentId, stratResult.rejections, activeAmbitionTemplateIds, state.tick, state.ascendantId);
          }
        } catch {
          // Fail-soft: strategic generation failure → fall through to encounter path
        }
      }

      // ── The one prioritization board (THR-1292 §4; live since THR-1301) ─────
      //
      // In `'live'` this **is** the decision: it ranks both families in one
      // currency and its winner becomes `decisionFamily`, the strategic winner and
      // the selected encounter alike. In `'shadow'` it changes nothing and only
      // records — the mode is kept rather than deleted because the shadow channel
      // is how the cutover envelope is re-measured whenever the scorers are
      // retuned, and the census script re-runs the same comparison.
      //
      // `agreement` compares the winning *family* against what legacy would have
      // said, read here rather than at the balance-event sites below because this
      // is the point where scoring has finished and nothing downstream can still
      // move a decision between families — compulsion redirects *which* encounter,
      // never whether one happens.
      let shadowFields: Pick<
        BalanceEvent, 'shadowWinnerFamily' | 'shadowWinnerId' | 'shadowAgreement'
      > = {};

      if (UNIFIED_DECISION_BOARD_MODE !== 'off') {
        try {
          const board = scoreUnifiedBoard({
            graph,
            agentId,
            tick: state.tick,
            encounterCandidates: decision.topCandidates,
            strategicCandidates: scoredStrategic,
            fundament: state.worldSoul?.fundament,
          });

          // An empty board is a real verdict, not a missing one: it is what the
          // live mode reads as idle. Recording it as `'idle'` keeps the idle share
          // the cutover gate reads honest — dropping the row would make the ceiling
          // trivially passable by a board that finds nothing to do.
          //
          // **A below-floor winner is the same verdict and must count the same
          // way.** This line read `board.winner?.family ?? 'idle'` and so counted
          // idle only when the board was *empty*, never when its winner failed the
          // floor — while the live branch below idles on both. The gate and the
          // behaviour therefore disagreed about what idle means, and the gate was
          // the blind one: at the mis-scaled `BOARD_SCORE_FLOOR = 0.08` the census
          // reported **idle 0.0%, PASS** on a seed where 2646 of 2882 decisions
          // (91.8%) actually idled. Every criterion passed on both seeds and the
          // world had stopped moving.
          //
          // So the floor is applied once, here, and both the telemetry and the
          // cutover read the same resolved winner. A gate that cannot observe the
          // failure mode it exists to catch is not a weak gate, it is a vacuous
          // one, and this was the shape of it.
          const boardWinner = board.winner && board.winner.score >= BOARD_SCORE_FLOOR
            ? board.winner
            : null;
          const boardFamily: DecisionFamily = boardWinner?.family ?? 'idle';

          // With contest B gone (THR-1349 slice 3), the "legacy" side of the
          // comparison is the encounter scorer's own pick — `'encounter'` with its
          // selected template, or `'idle'` when `scoreAndSelect` declined. That is
          // the one legacy contest left, and `agreement` is now the drift between
          // it and the board: reported by the census, never gated.
          const legacyScore = decision.topCandidates.length > 0 ? decision.topCandidates[0].finalScore : 0;
          const legacyId = decision.selected?.entry.templateId ?? null;

          // Read *before* the live branch below mutates `decisionFamily`, which is
          // what keeps the encounter scorer's baseline a baseline rather than a
          // comparison of the board against itself.
          const agreement = boardFamily === decisionFamily;

          shadowFields = {
            shadowWinnerFamily: boardFamily,
            shadowWinnerId: board.winner?.id ?? null,
            shadowAgreement: agreement,
          };

          emitTrace({
            category: 'decision_board_comparison',
            tick: state.tick,
            agentId,
            mode: UNIFIED_DECISION_BOARD_MODE,
            legacyWinner: { family: decisionFamily, id: legacyId, score: legacyScore },
            // `advanceProbability` is spread conditionally rather than written as
            // `advanceProbability: e.advanceProbability`: an encounter entry has
            // none, and under `exactOptionalPropertyTypes` an explicit `undefined`
            // is not the same as an absent key. Absent is also the honest reading
            // — an encounter has no checkpoint to forecast, it does not have a
            // forecast of unknown value.
            boardTop: board.top.map(e => ({
              family: e.family,
              id: e.id,
              score: e.score,
              evt: e.evt,
              desireMultiplier: e.desireMultiplier,
              temperamentWeight: e.temperamentWeight,
              ...(e.advanceProbability !== undefined
                ? { advanceProbability: e.advanceProbability }
                : {}),
              ...(e.ambitionBoost !== undefined
                ? { ambitionBoost: e.ambitionBoost }
                : {}),
            })),
            agreement,
            boardFamily,
            encounterCandidates: decision.topCandidates.length,
            undertakingCandidates: scoredStrategic.length,
            summary: `Board (${UNIFIED_DECISION_BOARD_MODE}): legacy=${decisionFamily}, board=${boardFamily}${agreement ? '' : ' [DIVERGED]'}, top=${board.winner?.score.toFixed(3) ?? 'none'}`,
          });

          // ── The cutover branch (THR-1301; live since THR-1349 slice 3) ──
          //
          // Everything above is measurement and runs in both modes. Below is the
          // only place the board's ranking touches behaviour, and it does three
          // things the legacy contests did between them. It shipped inert under
          // `'shadow'` for a week and flipped once the census gates were re-derived
          // from the design rather than from the contest it replaces — the story is
          // on `UNIFIED_DECISION_BOARD_MODE`'s docblock.
          //
          // 1. **Idle is re-keyed to the board.** The legacy idle branch is
          //    encounter-only — a strategic winner `continue`s past it, so idle
          //    meant "no *encounter* worth doing" while an undertaking may have
          //    been available all along. Live idle is "the board is empty, or its
          //    best entry is below `BOARD_SCORE_FLOOR`" — one floor over both
          //    families, in EVT currency. (An earlier version of this note said
          //    that floor was pinned equal to `STRATEGIC_SCORE_FLOOR`; it never was
          //    — `1e-6` against `0.08` — and they gate different quantities. See
          //    `STRATEGIC_SCORE_FLOOR`'s docblock.)
          // 2. **The winner resolves by index, never by id.** `candidateIndex`
          //    exists for this line; see its contract note on `BoardEntry`.
          // 3. **The legacy encounter selection is overridden, not consulted.**
          //    `scoreAndSelect` applies its own threshold to pick `selected`, and
          //    in live mode that threshold is not the one that decides — the
          //    board's floor is. So a board-chosen encounter is selected even
          //    where legacy declined to, and a board that chooses an undertaking
          //    leaves `decision.selected` in place *deliberately*: the strategic
          //    execution path below fails soft onto it.
          if (UNIFIED_DECISION_BOARD_MODE === 'live') {
            if (!boardWinner) {
              decisionFamily = 'idle';
              strategicWinner = null;
              decision.selected = null;
            } else if (boardWinner.family === 'strategic_action') {
              const chosen = scoredStrategic[boardWinner.candidateIndex];
              if (chosen) {
                strategicWinner = chosen;
                decisionFamily = 'strategic_action';
              }
            } else {
              const chosen = decision.topCandidates[boardWinner.candidateIndex];
              if (chosen) {
                strategicWinner = null;
                decisionFamily = 'encounter';
                decision.selected = chosen;
              }
            }
          }
        } catch (err) {
          // Deliberately NOT the empty catch the legacy path above degrades
          // through. A shadow period that swallowed board throws would report
          // perfect agreement while having measured nothing at all, and the
          // cutover gate would then be evaluated against a board that never ran.
          // `shadowFields` stays empty, so this decision is absent from the
          // denominator rather than counted as agreement (NFP #2, NFP #4).
          emitTrace({
            category: 'decision_board_error',
            tick: state.tick,
            agentId,
            mode: UNIFIED_DECISION_BOARD_MODE,
            message: err instanceof Error ? err.message : String(err),
            summary: `Board scoring threw for ${actor.name}: ${err instanceof Error ? err.message : String(err)}`,
          });
        }
      }

      // ── Compulsion Check ──────────────────────────────────────────
      // Before committing, check if this agent is eligible for a Compulsion
      // premonition. If so, emit the event to the queue. The agent's decision
      // will be influenced by compulsionTargetTemplateId if the player acts.
      if (decision.selected && decision.topCandidates.length > 1) {
        try {
          const compulsionActor = graph.getNode(agentId);
          if (
            compulsionActor
            && isCompulsionEligible(graph, state.ascendantId, agentId)
            && shouldEmitCompulsion(
              compulsionActor, state.tick, state.premonitionQueue ?? [], newPremonitions,
            )
          ) {
            const compulsionEvent = buildCompulsionEvent(
              state, agentId, actor.name, decision.topCandidates, rng,
            );
            if (compulsionEvent) {
              newPremonitions.push(compulsionEvent);
              // Stamp at emission, not at resolution — one write covers all three
              // endings (chosen, dismissed, expired). Direct property write, not
              // spread: updateNode replaces the handle.
              const freshForStamp = graph.getNode(agentId);
              if (freshForStamp) freshForStamp.properties.lastCompulsionTick = state.tick;
            }
          }
        } catch {
          // Fail-soft: if compulsion module fails, proceed normally
        }
      }

      // ── Compulsion Override ────────────────────────────────────────
      // If the player previously chose a compulsion target, override the selection.
      const compulsionTargetId = actor.properties?.compulsionTargetTemplateId as string | undefined;
      const compulsionTick = (actor.properties?.compulsionTick as number | undefined) ?? 0;
      if (decision.selected && compulsionTargetId && (state.tick - compulsionTick) <= 3) {
        // Find the compulsion target in candidates
        const compulsionCandidate = decision.topCandidates.find(
          c => c.entry.templateId === compulsionTargetId,
        );
        if (compulsionCandidate) {
          decision.selected = compulsionCandidate;
        }
        // Clear the compulsion target — direct property write, not spread.
        const freshForClear = graph.getNode(agentId);
        if (freshForClear) {
          freshForClear.properties.compulsionTargetTemplateId = undefined;
          freshForClear.properties.compulsionTick = undefined;
        }
      }

      const ft = filterResult.trace;
      const topScore = decision.topCandidates.length > 0
        ? decision.topCandidates[0].finalScore
        : undefined;
      const rankedEncounterPool = buildEncounterPoolSnapshot(
        graph,
        decision.rankedCandidates,
        decision.selected,
      );

      // ── Strategic Action Execution ──────────────────────────────────
      // If a strategic candidate beat all encounter candidates, execute it
      // and skip the encounter path entirely.
      if (strategicWinner && decisionFamily === 'strategic_action') {
        try {
          // Execute against the ACCUMULATED strategic state, not the tick-start
          // snapshot — reading `state.strategicState` here silently dropped every
          // project started by an earlier agent in the same tick (last-writer-wins;
          // the reason no trade route ever survived to completion — THR-669).
          const stratResult = executeStrategicAction(
            accumulatedStrategicState && accumulatedStrategicState !== state.strategicState
              ? ({ ...state, strategicState: accumulatedStrategicState } as GameState)
              : state,
            graph, strategicWinner, state.tick, rng,
          );

          // Accumulate strategic state for return + downstream agents
          if (stratResult.strategicState) {
            accumulatedStrategicState = stratResult.strategicState;
          }
          if (stratResult.moments?.length) newMoments.push(...stratResult.moments);

          // THR-1184: an instant mutation can mint an edge that changes what a location
          // can host. Refresh that location's encounter pool now, or it waits for an
          // unrelated structural invalidation. (The eight-tick sacred-route project
          // completes on the phaseStrategicProjects path, which does the same.)
          if (runtime && stratResult.poolInvalidatedLocationIds?.length) {
            for (const locationId of stratResult.poolInvalidatedLocationIds) {
              applyEncounterCacheUpdate(runtime, cache => cache.onLocationTypeChanged(graph, locationId));
            }
          }

          emitTrace({
            category: 'strategic_action_started',
            tick: state.tick,
            agentId,
            candidateId: strategicWinner.candidateId,
            templateId: strategicWinner.templateId,
            behaviorFamily: strategicWinner.behaviorFamily,
            verb: strategicWinner.verb,
            targetNodeId: strategicWinner.targetNodeId,
            targetHex: strategicWinner.targetHex,
            executionMode: strategicWinner.executionMode,
            summary: `${actor.name} begins strategic action: ${strategicWinner.displayName}`,
          } as StrategicActionStartedTrace & { summary: string });

          newEvents.push({
            id: `decision_strategic_${agentId}_${state.tick}`,
            tick: state.tick,
            type: 'agent_action',
            message: `${actor.name} ${strategicWinner.displayName.toLowerCase()}`,
            significance: 0.5,
            actorId: agentId,
          });

          // Reset idle counter
          const freshForStrat = graph.getNode(agentId);
          if (freshForStrat) freshForStrat.properties.consecutiveIdleTicks = 0;

          if (runtime) {
            recordBalanceEvent(runtime, {
              tick: state.tick,
              kind: 'encounter_decision',
              agentId,
              ...shadowFields,
              sourceSystem: 'strategic',
              decisionType: strategicWinner.executionMode === 'instant'
                ? 'strategic_instant'
                : strategicWinner.executionMode === 'claim_control'
                  ? 'strategic_control'
                  : 'strategic_project',
              templateId: strategicWinner.templateId,
              locationId,
              locationSubtype: originLocationSubtype,
              targetLocationId: strategicWinner.targetNodeId,
              threaded: threadContext.threaded,
              courtPosition: threadContext.courtPosition,
            });
          }

          continue; // Skip encounter execution path
        } catch {
          // Fail-soft: strategic execution failure → fall through to encounter path
          decisionFamily = 'encounter';
          strategicWinner = null;
        }
      }

      // The initiative contest block lived here (THR-1292 §3). It was the *third*
      // competitor in this loop — encounters, strategic actions and initiatives all
      // bidding on one agent-tick — and its whole job was to start a parallel
      // multi-tick project system. Undertakings are that system now, so the contest
      // collapses to two: what the strategic path wins, it wins outright.

      if (decision.selected) {
        const sel = decision.selected;

        // THR-631 Phase B: emit the Motive Receipt — the real decision causality
        // the scorer computed for the winning candidate, kept instead of thrown
        // away. Stored on the agent node (internal decision data → property, not
        // an edge) for foreshadowing prose, trace, and DebugPanel. Fresh node ref
        // avoids clobbering earlier same-tick writes (same pattern as familiarity).
        try {
          const locNodeForReceipt = graph.getNode(sel.entry.locationId);
          const receiptRegion =
            typeof locNodeForReceipt?.properties?.region === 'string'
              ? (locNodeForReceipt.properties.region as string)
              : typeof locNodeForReceipt?.properties?.regionId === 'string'
                ? (locNodeForReceipt.properties.regionId as string)
                : undefined;
          const intelMatch = sel.intelBonus > 0 && agentIntelligence.length > 0
            ? findActionableIntelligence(agentIntelligence, agentId, {
                templateId: sel.entry.templateId,
                locationId: sel.entry.locationId,
                targetAgentId: sel.entry.targetAgentId,
                region: receiptRegion,
              })
            : undefined;
          // A minted want names its origin in the receipt (THR-726).
          const mintedProvenance = resolveMintedAmbitionProvenance(
            graph, agentId, sel.entry.reachPrimary,
          );
          const receipt = buildMotiveReceipt(
            sel,
            intelMatch?.reliability ?? null,
            intelMatch?.recordId ?? null,
            state.tick,
            mintedProvenance,
          );
          const freshForReceipt = graph.getNode(agentId);
          if (freshForReceipt) {
            freshForReceipt.properties.motiveReceipt = receipt;
          }
        } catch {
          // Fail-soft: receipt is a presentation/inspectability layer — never
          // block the decision phase if it fails.
        }

        // Phase 4: Record forecast at decision time for drift tracking
        if (runtime) {
          recordBalanceEvent(runtime, {
            tick: state.tick,
            kind: 'forecast_recorded',
            agentId,
            sourceSystem: 'planner',
            templateId: sel.entry.templateId,
            forecastedUtility: sel.expectedUtility,
            forecastedCompletionProb: sel.completionProb,
            forecastedPushBenefit: sel.pushBenefit,
            forecastedResistBenefit: sel.resistBenefit,
          });
        }

        // Timeline: DECIDE event
        const selCandidate = decision.topCandidates.find(c => c.entry.templateId === sel.entry.templateId);
        const targetLocNode = graph.getNode(sel.entry.locationId);
        const targetHexCol = (targetLocNode?.properties?.hexCol as number) ?? 0;
        const targetHexRow = (targetLocNode?.properties?.hexRow as number) ?? 0;
        const targetLocationSubtype = getDecisionLocationSubtype(graph, sel.entry.locationId);
        appendEvent(agentId, {
          phase: 'DECIDE',
          tick: state.tick,
          targetEncounter: sel.entry.templateId,
          targetLocation: targetLocNode?.name ?? sel.entry.locationId,
          targetHex: [targetHexCol, targetHexRow],
          score: selCandidate?.finalScore ?? 0,
          travelCost: selCandidate?.travelCost ?? 0,
          completionProb: selCandidate?.completionProb ?? 0,
          desireMultiplier: selCandidate?.desireMultiplier,
        });

        if (sel.action === 'start_local' || sel.action === 'attempt_remote') {
          const template = getAnyEncounterById(sel.entry.templateId);
          const unifiedTemplate = getUnifiedTemplateById(sel.entry.templateId);
          if (template || unifiedTemplate) {
            if (unifiedTemplate) {
              const supportBindings = prepareEncounterSupportBundle(
                state,
                unifiedTemplate,
                sel.entry.targetAgentId ?? sel.entry.locationId,
                sel.entry.locationId,
                // The scored-binder route (THR-1296 §7). The assembler owns the
                // both-must-exist rule and returns undefined when this session cannot
                // ledger, which routes the template to the legacy path rather than
                // binding un-ledgered (THR-1305 moved it out of here so the debug
                // tools and the CLI share one copy of that rule).
                buildEncounterBinderContext(runtime, state, agentId),
              );
              const gateInit = initializeClearanceGates(
                nextClearanceGateStates,
                unifiedTemplate,
                supportBindings,
                sel.entry.locationId,
                state.tick,
              );
              nextClearanceGateStates = gateInit.clearanceGateStates;
              // Resolve effectiveTier for unified action — same court position logic.
              const uaThreadEdges = state.ascendantId
                ? state.graph.getOutgoingEdges(state.ascendantId, 'thread')
                : [];
              const uaPrimaryThread = uaThreadEdges.find(e => e.target === agentId);
              const uaPrimaryPos = (uaPrimaryThread?.properties?.courtPosition as import('../types/influence').CourtPosition | undefined) ?? null;
              let uaCourtPos = uaPrimaryPos;
              if (sel.entry.targetAgentId) {
                const uaTargetThread = uaThreadEdges.find(e => e.target === sel.entry.targetAgentId);
                const uaTargetPos = (uaTargetThread?.properties?.courtPosition as import('../types/influence').CourtPosition | undefined) ?? null;
                const UA_COURT_RANK: Record<string, number> = { the_first: 3, retinue: 2, watched: 1, dormant: 0 };
                const uaPrimaryRank = uaPrimaryPos ? (UA_COURT_RANK[uaPrimaryPos] ?? -1) : -1;
                const uaTargetRank = uaTargetPos ? (UA_COURT_RANK[uaTargetPos] ?? -1) : -1;
                if (uaTargetRank > uaPrimaryRank) uaCourtPos = uaTargetPos;
              }
              const uaEffectiveTier = resolveEffectiveTier(
                unifiedTemplate.intrinsicTier ?? 'background',
                uaCourtPos,
              );

              const action = {
                ...createUnifiedAction({
                  actorId: agentId,
                  templateId: unifiedTemplate.id,
                  targetId: sel.entry.targetAgentId ?? sel.entry.locationId,
                  scale: unifiedTemplate.scale,
                  source: 'agent',
                  tick: state.tick,
                  template: unifiedTemplate,
                  rng,
                  supportBindings,
                  clearanceGateIds: gateInit.gateIds,
                  // THR-1100: target-derived step duration for tier-scaled templates.
                  targetProperties: state.graph.getNode(
                    sel.entry.targetAgentId ?? sel.entry.locationId,
                  )?.properties,
                }),
                effectiveTier: uaEffectiveTier,
              };
              newUnifiedActions.push(action);
            } else if (template) {
              const firstStepDuration = template.steps[0]?.duration ?? 1;

              // Resolve effectiveTier at creation time.
              // Use HIGHEST court position among participants (primary + target agent).
              const COURT_RANK: Record<string, number> = {
                the_first: 3, retinue: 2, watched: 1, dormant: 0,
              };
              const threadEdges = state.ascendantId
                ? state.graph.getOutgoingEdges(state.ascendantId, 'thread')
                : [];
              const primaryThread = threadEdges.find(e => e.target === agentId);
              const primaryPos = (primaryThread?.properties?.courtPosition as import('../types/influence').CourtPosition | undefined) ?? null;
              let courtPos = primaryPos;
              if (sel.entry.targetAgentId) {
                const targetThread = threadEdges.find(e => e.target === sel.entry.targetAgentId);
                const targetPos = (targetThread?.properties?.courtPosition as import('../types/influence').CourtPosition | undefined) ?? null;
                const primaryRank = primaryPos ? (COURT_RANK[primaryPos] ?? -1) : -1;
                const targetRank = targetPos ? (COURT_RANK[targetPos] ?? -1) : -1;
                if (targetRank > primaryRank) courtPos = targetPos;
              }
              const effectiveTier = resolveEffectiveTier(
                template.intrinsicTier ?? 'background',
                courtPos,
              );

              const progress: EncounterProgress = {
                encounterId: sel.entry.templateId,
                actorId: agentId,
                ...(sel.entry.targetAgentId ? { targetAgentId: sel.entry.targetAgentId } : {}),
                currentEncounterIndex: 0,
                history: [],
                status: 'active',
                startedTick: state.tick,
                occupiedUntilTick: state.tick + firstStepDuration,
                effectiveTier,
              };
              newEncounterProgress.push(progress);

              // THR-573 — one aggregate fragment-binding trace per encounter
              // instantiation (never per step render, never per agent-tick). Skipped
              // entirely for templates that declare no fragments, so the trace volume
              // scales with authored Tier-2 content rather than with tick count.
              if (template.contextFragments && template.contextFragments.length > 0) {
                const bindings = resolveTemplateFragments(
                  template.contextFragments,
                  {
                    place: sel.entry.sublocationTypeId,
                    counterpartRole: sel.entry.targetAgentRole,
                    // THR-884 — same `locationType`-then-`locationSubtype` precedence
                    // the cache used to register this entry (`getLocationType`), so the
                    // trace reports the class the prose path will bind.
                    setting: settingClassForSubtype(getLocationType(state.graph, sel.entry.locationId)) ?? null,
                  },
                  template.id,
                );
                if (bindings.length > 0) {
                  emitTrace({
                    category: 'surface_fragments_bound',
                    tick: state.tick,
                    agentId,
                    templateId: template.id,
                    surfaceKey: computeSurfaceKey(sel.entry),
                    bindings: bindings.map(b => ({
                      slot: b.slot,
                      axis: b.axis,
                      value: b.value,
                      usedDefault: b.usedDefault,
                    })),
                    summary: `surface_fragments_bound: ${template.id} ${bindings.map(b => `${b.slot}=${b.value}`).join(' ')}`,
                  } as any);
                }
              }
            }

            // B.1: Track familiarity — direct property write, not spread.
            // Using a fresh node ref avoids clobbering updates made by earlier phases
            // in the same tick (same pattern as the whisperAvailable fix below).
            {
              const freshForFamiliarity = graph.getNode(agentId);
              if (freshForFamiliarity) {
                const existingFamiliarity = (freshForFamiliarity.properties?.familiarityRecord as FamiliarityRecord | undefined) ?? { attemptCount: {} };
                freshForFamiliarity.properties.familiarityRecord = {
                  attemptCount: {
                    ...existingFamiliarity.attemptCount,
                    [sel.entry.templateId]: (existingFamiliarity.attemptCount[sel.entry.templateId] ?? 0) + 1,
                  },
                };
                freshForFamiliarity.properties.consecutiveIdleTicks = 0;

                // THR-453: Track per-agent novelty — which surfaces this agent recently selected. (Re-keyed to surfaceKey, THR-475.)
                const existingAgentNovelty = (freshForFamiliarity.properties?.agentNoveltyLastSelected as Record<string, number> | undefined) ?? {};
                freshForFamiliarity.properties.agentNoveltyLastSelected = {
                  ...existingAgentNovelty,
                  [computeSurfaceKey(sel.entry)]: state.tick,
                };
              }
            }

            // THR-453: Update global novelty record — tracks recency and category quotas.
            {
              // Roll category window forward if it has expired.
              if (state.tick - noveltyRecord.categoryWindowStart >= NOVELTY_CATEGORY_WINDOW_TICKS) {
                noveltyRecord.categoryWindowCounts = {};
                noveltyRecord.templateWindowCounts = {};
                noveltyRecord.categoryWindowTotal = 0;
                noveltyRecord.categoryWindowStart = state.tick;
              }
              noveltyRecord.globalLastSelected[computeSurfaceKey(sel.entry)] = state.tick;
              const cat = sel.entry.reachPrimary;
              noveltyRecord.categoryWindowCounts[cat] = (noveltyRecord.categoryWindowCounts[cat] ?? 0) + 1;
              noveltyRecord.templateWindowCounts[sel.entry.templateId] = (noveltyRecord.templateWindowCounts[sel.entry.templateId] ?? 0) + 1;
              noveltyRecord.categoryWindowTotal += 1;
              // THR-464 rung 5: Update per-template EMA frequency signal.
              const prevEntry = noveltyRecord.selectionEMA[sel.entry.templateId];
              const prevEMA = prevEntry ? prevEntry.ema * Math.pow(NOVELTY_EMA_DECAY, Math.max(0, state.tick - prevEntry.lastTick)) : 0;
              noveltyRecord.selectionEMA[sel.entry.templateId] = { ema: prevEMA + 1, lastTick: state.tick };
              if (runtime) touchWorld(runtime);
            }
            // Reset whisperAvailable — non-generic encounters consume the Whisper.
            // Generic encounters (questPriority <= 1.0) do NOT reset the flag.
            // Direct property write to avoid stale-snapshot issues.
            const isGenericEncounter = (sel.entry.questPriority ?? 1.0) <= 1.0;
            if (!isGenericEncounter) {
              const freshAfterCommit = graph.getNode(agentId);
              if (freshAfterCommit) freshAfterCommit.properties.whisperAvailable = false;
            }

            const prefix = sel.action === 'attempt_remote' ? 'remotely begins' : 'begins';
            newEvents.push({
              id: `decision_${agentId}_${state.tick}`,
              tick: state.tick,
              type: 'agent_encounter',
              message: `${actor.name} ${prefix} ${template.name}`,
              significance: 0.4,
            });

            if (runtime) {
              recordBalanceEvent(runtime, {
                tick: state.tick,
                kind: 'encounter_decision',
                agentId,
                ...shadowFields,
                sourceSystem: 'planner',
                decisionType: sel.action,
                templateId: sel.entry.templateId,
                forecastedUtility: sel.expectedUtility,
                forecastedCompletionProb: sel.completionProb,
                locationId,
                locationSubtype: originLocationSubtype,
                targetLocationId: sel.entry.locationId,
                targetLocationSubtype: targetLocationSubtype,
                filterCacheSize: ft.cacheSize,
                filterAfterAwareness: ft.afterAwareness,
                filterAfterVisibility: ft.afterVisibility,
                filterAfterPrerequisites: ft.afterPrerequisites,
                filterAfterThreat: ft.afterThreat,
                filterAfterCap: ft.afterCap,
                candidatesBeforeCooldown: rawCandidates.length,
                candidatesAfterCooldown: candidates.length,
                rankedEncounterPool,
                bestScore: topScore,
                travelCost: selCandidate?.travelCost ?? 0,
                threaded: threadContext.threaded,
                courtPosition: threadContext.courtPosition,
              });
            }
          }
        } else if (sel.action === 'queue_movement') {
          // Queue movement toward the encounter's location.
          // Try graph-level pathfinding first (road-aware), fall back to hex A*.
          let movState: ReturnType<typeof initMovementState> | null = null;
          let queueLength = 0;

          const graphPath = findShortestPath(graph, agentId, locationId, sel.entry.locationId);
          if (graphPath && graphPath.roadSegments && graphPath.roadSegments.length > 0 && graphPath.path.length > 0) {
            // Road-aware path: use graph-level path with road segments
            // Find the road segment that matches the FIRST leg (start → path[0]),
            // not just roadSegments[0] which may be for a later leg.
            const firstSeg = graphPath.roadSegments.find(
              seg => (seg.fromId === locationId && seg.toId === graphPath.path[0]) ||
                     (seg.toId === locationId && seg.fromId === graphPath.path[0]),
            );
            const firstEdgeCost = firstSeg
              ? firstSeg.discountedCost / Math.max(1, firstSeg.hexPath.length - 1)
              : computeEdgeCost(graph, agentId, locationId, graphPath.path[0]).totalCost;
            movState = initMovementState(
              sel.entry.locationId,
              graphPath.path,
              firstEdgeCost,
              state.tick,
              graphPath.roadSegments,
              locationId,
            );
            queueLength = graphPath.path.length;
          } else {
            // Fall back to hex-by-hex A* (no road segments)
            const hexPath = buildHexMovementPath(
              graph,
              locationId,
              sel.entry.locationId,
              state.tiles,
            );
            if (hexPath) {
              movState = initMovementState(
                hexPath.destinationId,
                hexPath.locationIds,
                hexPath.firstEdgeCost,
                state.tick,
              );
              queueLength = hexPath.locationIds.length;
            }
          }

          if (movState) {
            // Attach encounter targeting fields
            movState.targetSublocationId = sel.entry.sublocationId ?? undefined;
            movState.targetEncounterId = sel.entry.templateId;

            // Reset idle counter on any non-idle decision (queue_movement)
            graph.updateNode(agentId, {
              properties: {
                ...actor.properties,
                movementState: movState,
                consecutiveIdleTicks: 0,
              },
            });
            // Get location name for better message
            const destNode = graph.getNode(sel.entry.locationId);
            const destName = destNode?.name ?? sel.entry.locationId;
            newEvents.push({
              id: `decision_move_${agentId}_${state.tick}`,
              tick: state.tick,
              type: 'agent_movement',
              message: `${actor.name} sets out toward ${destName}`,
              significance: 0.3,
            });

            // Trace: depart toward encounter
            const sublocNode = sel.entry.sublocationId ? graph.getNode(sel.entry.sublocationId) : null;
            emitTrace({
              category: 'movement',
              tick: state.tick,
              agentId,
              agentName: actor.name,
              event: 'depart',
              fromLocationId: locationId,
              fromLocationName: graph.getNode(locationId)?.name ?? '?',
              destinationId: sel.entry.locationId,
              destinationName: destName,
              sublocationId: sel.entry.sublocationId ?? undefined,
              sublocationName: sublocNode?.name ?? undefined,
              encounterId: sel.entry.templateId,
              queueLength,
              summary: `${actor.name} departs for ${destName} (${queueLength} hops, encounter: ${sel.entry.templateId})`,
            } as TraceEntry);

            if (runtime) {
              recordBalanceEvent(runtime, {
                tick: state.tick,
                kind: 'encounter_decision',
                agentId,
                ...shadowFields,
                sourceSystem: 'planner',
                decisionType: 'queue_movement',
                templateId: sel.entry.templateId,
                forecastedUtility: sel.expectedUtility,
                forecastedCompletionProb: sel.completionProb,
                locationId,
                locationSubtype: originLocationSubtype,
                targetLocationId: sel.entry.locationId,
                targetLocationSubtype: getDecisionLocationSubtype(graph, sel.entry.locationId),
                filterCacheSize: ft.cacheSize,
                filterAfterAwareness: ft.afterAwareness,
                filterAfterVisibility: ft.afterVisibility,
                filterAfterPrerequisites: ft.afterPrerequisites,
                filterAfterThreat: ft.afterThreat,
                filterAfterCap: ft.afterCap,
                candidatesBeforeCooldown: rawCandidates.length,
                candidatesAfterCooldown: candidates.length,
                rankedEncounterPool,
                bestScore: topScore,
                travelCost: selCandidate?.travelCost ?? 0,
                threaded: threadContext.threaded,
                courtPosition: threadContext.courtPosition,
              });
            }

          }

          // THR-464: Update novelty for queue_movement regardless of pathfinding outcome.
          // The KPI funnel counts scoreAndSelect winners (including failed-path attempts), so
          // novelty must update here too — otherwise agents for whom pathfinding fails keep
          // re-selecting the same template every tick with zero recency penalty, inflating
          // concentration without bound.  Updating even on movState=null also penalises the
          // agent so subsequent ticks explore other options.
          {
            const freshForNovelty = graph.getNode(agentId);
            if (freshForNovelty) {
              const existingAgentNovelty = (freshForNovelty.properties?.agentNoveltyLastSelected as Record<string, number> | undefined) ?? {};
              freshForNovelty.properties.agentNoveltyLastSelected = {
                ...existingAgentNovelty,
                [sel.entry.templateId]: state.tick,
              };
            }
          }
          if (state.tick - noveltyRecord.categoryWindowStart >= NOVELTY_CATEGORY_WINDOW_TICKS) {
            noveltyRecord.categoryWindowCounts = {};
            noveltyRecord.templateWindowCounts = {};
            noveltyRecord.categoryWindowTotal = 0;
            noveltyRecord.categoryWindowStart = state.tick;
          }
          noveltyRecord.globalLastSelected[sel.entry.templateId] = state.tick;
          {
            const cat = sel.entry.reachPrimary;
            noveltyRecord.categoryWindowCounts[cat] = (noveltyRecord.categoryWindowCounts[cat] ?? 0) + 1;
            noveltyRecord.templateWindowCounts[sel.entry.templateId] = (noveltyRecord.templateWindowCounts[sel.entry.templateId] ?? 0) + 1;
            noveltyRecord.categoryWindowTotal += 1;
            // THR-464 rung 5: Update per-template EMA frequency signal.
            const prevEntryQM = noveltyRecord.selectionEMA[sel.entry.templateId];
            const prevEMAQM = prevEntryQM ? prevEntryQM.ema * Math.pow(NOVELTY_EMA_DECAY, Math.max(0, state.tick - prevEntryQM.lastTick)) : 0;
            noveltyRecord.selectionEMA[sel.entry.templateId] = { ema: prevEMAQM + 1, lastTick: state.tick };
          }
        }
      } else {
        // Agent is idle — mark whisperAvailable for next Whisper phase.
        // Direct property write — do NOT spread actor.properties (stale snapshot).
        {
          const freshNode = graph.getNode(agentId);
          if (freshNode && !(freshNode.properties?.whisperAvailable as boolean | undefined)) {
            freshNode.properties.whisperAvailable = true;
          }
        }

        // Idle behavior — determine reason for idling
        let idleReason: IdleDecisionTrace['reason'];
        if (filterResult.candidates.length === 0) {
          idleReason = 'no_candidates_after_filter';
        } else if (candidates.length === 0) {
          idleReason = 'no_candidates_after_cooldown';
        } else {
          idleReason = 'below_score_threshold';
        }

        const localEntries = encounterCache.getEntriesForLocation(locationId);
        const idle = resolveIdleBehavior(
          agentId,
          locationId,
          graph,
          distanceMatrix,
          localEntries,
          rng,
        );

        // Emit idle decision trace
        const bestScore = topScore ?? null;
        const driftTargetNode = idle.targetLocationId ? graph.getNode(idle.targetLocationId) : null;

        const effectiveCd = getEffectiveCooldown(ENCOUNTER_ABANDON_COOLDOWN, rawCandidates.length);
        emitTrace({
          category: 'idle_decision',
          tick: state.tick,
          agentId,
          agentName: actor.name,
          locationId,
          reason: idleReason,
          filterPipeline: {
            cacheSize: ft.cacheSize,
            afterAwareness: ft.afterAwareness,
            afterVisibility: ft.afterVisibility,
            afterPrerequisites: ft.afterPrerequisites,
            afterThreat: ft.afterThreat,
            afterCap: ft.afterCap,
          },
          candidatesBeforeCooldown: rawCandidates.length,
          candidatesAfterCooldown: candidates.length,
          effectiveCooldown: effectiveCd,
          bestScore,
          scoreThreshold: IDLE_SCORE_THRESHOLD,
          idleAction: idle.action,
          driftTargetId: idle.targetLocationId,
          driftTargetName: driftTargetNode?.name ?? undefined,
          summary: `${actor.name} idles (${idleReason}): ${idle.action}${idle.targetLocationId ? ` → ${driftTargetNode?.name ?? idle.targetLocationId}` : ''}${bestScore !== null ? ` [best=${bestScore.toFixed(3)}, threshold=${IDLE_SCORE_THRESHOLD}]` : ''} [cd=${effectiveCd}]`,
        } as TraceEntry);

        // Timeline: IDLE event (include filter pipeline stage counts for diagnostics)
        const pipelineStr = `${ft.cacheSize}>${ft.afterAwareness}>${ft.afterVisibility}>${ft.afterPrerequisites}>${ft.afterThreat}>${ft.afterCap}`;
        appendEvent(agentId, {
          phase: 'IDLE',
          tick: state.tick,
          reason: idleReason,
          idleAction: idle.action,
          driftTarget: driftTargetNode?.name ?? idle.targetLocationId ?? undefined,
          pipeline: pipelineStr,
        });

        if (runtime) {
          recordBalanceEvent(runtime, {
            tick: state.tick,
            kind: 'encounter_decision',
            agentId,
            ...shadowFields,
            sourceSystem: 'planner',
            decisionType: 'idle',
            idleReason,
            idleAction: idle.action,
            locationId,
            locationSubtype: originLocationSubtype,
            filterCacheSize: ft.cacheSize,
            filterAfterAwareness: ft.afterAwareness,
            filterAfterVisibility: ft.afterVisibility,
            filterAfterPrerequisites: ft.afterPrerequisites,
            filterAfterThreat: ft.afterThreat,
            filterAfterCap: ft.afterCap,
            candidatesBeforeCooldown: rawCandidates.length,
            candidatesAfterCooldown: candidates.length,
            rankedEncounterPool,
            bestScore: bestScore ?? undefined,
            threaded: threadContext.threaded,
            courtPosition: threadContext.courtPosition,
          });
        }

        if (idle.action === 'drift' && idle.targetLocationId) {
          // Hex-by-hex A* pathfinding for idle drift (same as encounter movement)
          const hexPath = buildHexMovementPath(
            graph,
            locationId,
            idle.targetLocationId,
            state.tiles,
          );
          if (hexPath) {
            const driftState = initMovementState(
              hexPath.destinationId,
              hexPath.locationIds,
              hexPath.firstEdgeCost,
              state.tick,
            );
            graph.updateNode(agentId, {
              properties: {
                ...actor.properties,
                movementState: driftState,
              },
            });
          }
        }

        // Track consecutive idle ticks for forced travel fallback
        const prevIdleTicks = ((actor.properties?.consecutiveIdleTicks as number | undefined) ?? 0);
        const idleTicks = prevIdleTicks + 1;
        graph.updateNode(agentId, {
          properties: { ...actor.properties, consecutiveIdleTicks: idleTicks },
        });

        // Forced travel fallback — break content desert or cooldown exhaustion after threshold
        if ((idleReason === 'no_candidates_after_filter' || idleReason === 'no_candidates_after_cooldown') && idleTicks >= IDLE_FORCED_TRAVEL_THRESHOLD) {
          // Find nearest location with available encounter entries (using hex distance)
          const agentHex = resolveLocationToHex(graph, locationId);
          let nearestContentLocId: string | null = null;
          let nearestDist = Infinity;
          for (const entry of encounterCache.getAllEntries()) {
            if (entry.locationId === locationId) continue;
            const entryHex = resolveLocationToHex(graph, entry.locationId);
            if (!agentHex || !entryHex) continue;
            const dist = hexDistance(agentHex, entryHex);
            if (dist < nearestDist) {
              nearestDist = dist;
              nearestContentLocId = entry.locationId;
            }
          }

          if (nearestContentLocId) {
            // Try graph-based pathfinding first (uses roads), fall back to hex A* (raw terrain)
            const graphPath = findShortestPath(graph, agentId, locationId, nearestContentLocId);
            let didMove = false;
            if (graphPath && graphPath.path.length > 0) {
              const firstSeg = graphPath.roadSegments?.find(
                seg => (seg.fromId === locationId && seg.toId === graphPath.path[0]) ||
                       (seg.toId === locationId && seg.fromId === graphPath.path[0]),
              );
              const firstEdgeCost = firstSeg
                ? firstSeg.discountedCost / Math.max(1, firstSeg.hexPath.length - 1)
                : computeEdgeCost(graph, agentId, locationId, graphPath.path[0]).totalCost;
              const forcedMovState = initMovementState(
                nearestContentLocId,
                graphPath.path,
                firstEdgeCost,
                state.tick,
                graphPath.roadSegments ?? undefined,
                locationId,
              );
              graph.updateNode(agentId, {
                properties: { ...actor.properties, movementState: forcedMovState, consecutiveIdleTicks: 0 },
              });
              didMove = true;
            } else {
              // Graph pathfinding failed (no adjacent edges) — fall back to hex-based A*
              const hexPath = buildHexMovementPath(graph, locationId, nearestContentLocId, state.tiles);
              if (hexPath) {
                const forcedMovState = initMovementState(
                  hexPath.destinationId,
                  hexPath.locationIds,
                  hexPath.firstEdgeCost,
                  state.tick,
                );
                graph.updateNode(agentId, {
                  properties: { ...actor.properties, movementState: forcedMovState, consecutiveIdleTicks: 0 },
                });
                didMove = true;
              }
            }

            if (didMove) {
              const destNode = graph.getNode(nearestContentLocId);
              newEvents.push({
                id: `decision_forced_travel_${agentId}_${state.tick}`,
                tick: state.tick,
                type: 'agent_movement',
                message: `${actor.name} grows restless and sets out for ${destNode?.name ?? nearestContentLocId}`,
                significance: 0.3,
              });

              // Timeline: FORCED_TRAVEL event
              appendEvent(agentId, {
                phase: 'IDLE',
                tick: state.tick,
                reason: 'forced_travel',
                idleAction: 'forced_travel',
                driftTarget: destNode?.name ?? nearestContentLocId,
              });

              if (runtime) {
                recordBalanceEvent(runtime, {
                  tick: state.tick,
                  kind: 'encounter_decision',
                  agentId,
                  ...shadowFields,
                  sourceSystem: 'planner',
                  decisionType: 'forced_travel',
                  idleReason,
                  idleAction: 'forced_travel',
                  locationId,
                  locationSubtype: originLocationSubtype,
                  targetLocationId: nearestContentLocId,
                  targetLocationSubtype: getDecisionLocationSubtype(graph, nearestContentLocId),
                  filterCacheSize: ft.cacheSize,
                  filterAfterAwareness: ft.afterAwareness,
                  filterAfterVisibility: ft.afterVisibility,
                  filterAfterPrerequisites: ft.afterPrerequisites,
                  filterAfterThreat: ft.afterThreat,
                  filterAfterCap: ft.afterCap,
                  candidatesBeforeCooldown: rawCandidates.length,
                  candidatesAfterCooldown: candidates.length,
                  rankedEncounterPool,
                  bestScore: topScore,
                  threaded: threadContext.threaded,
                  courtPosition: threadContext.courtPosition,
                });
              }
            }
          }
          // If no reachable content location → agent stays idle (fail-soft)
        }
      }
    } catch {
      // Fail-soft: per-agent error → skip this agent, continue loop
      continue;
    }
  }

  // THR-581: emit the aggregated awareness timing once per tick. Surfaces in the
  // `profile` table / DebugPanel Phases tab as a sub-row of `agent_decision`, so the
  // neighborhood-probe win is attributable to the pre-filter (NFP #2).
  if (profiling) {
    emitPhaseTiming({
      tick: state.tick,
      phase: 'agent_decision_awareness',
      durationMs: awarenessMs,
      summary: `agent_decision_awareness: ${awarenessMs.toFixed(2)}ms across ${actors.length} actors`,
    });
  }

  // Merge premonitions into existing queue (discard stale entries)
  const existingPremonitions = (state.premonitionQueue ?? []).filter(
    p => p.eligibleUntilTick > state.tick,
  );

  return {
    tickEvents: [...state.tickEvents, ...newEvents],
    encounterProgress: [...state.encounterProgress, ...newEncounterProgress],
    unifiedActions: [...state.unifiedActions, ...newUnifiedActions],
    clearanceGateStates: nextClearanceGateStates ?? state.clearanceGateStates,
    premonitionQueue: [...existingPremonitions, ...newPremonitions],
    encounterNoveltyRecord: noveltyRecord,
    ...(accumulatedStrategicState ? { strategicState: accumulatedStrategicState } : {}),
    ...(newMoments.length > 0
      ? { pendingUndertakingMoments: enqueueUndertakingMoments(state.pendingUndertakingMoments, newMoments, state.tick) }
      : {}),
  };
}
