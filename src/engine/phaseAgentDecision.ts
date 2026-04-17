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
import { getDistance } from './distanceMatrix';
import type { EncounterProgress } from '../types/encounter';
import type { UnifiedAction } from '../types/unifiedAction';
import {
  ENCOUNTER_ABANDON_COOLDOWN,
  ENCOUNTER_COMPLETION_COOLDOWN,
} from '../types/encounter';
import { runFilterPipeline } from './encounterFilterPipeline';
import { scoreAndSelect, type FamiliarityRecord, type ScoredCandidate } from './encounterScoring';
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
import { emitTrace } from './traceBuffer';
import type { TraceEntry, IdleDecisionTrace } from '../types/trace';
import { IDLE_SCORE_THRESHOLD, COOLDOWN_FULL_POOL_SIZE, COOLDOWN_MINIMUM, MAX_COMPLETIONS_PER_TEMPLATE, IDLE_FORCED_TRAVEL_THRESHOLD } from '../data/agent-behavior-constants';
import { REROUTE_SCORE_MULTIPLIER, DECISION_REEVALUATION_TICKS } from '../data/movement-content';
import type { MovementState } from '../types/movement';
import type { AgentRerouteTrace } from '../types/trace';
import { getAgentLocationId, getAvatarsOf } from './graphQueries';
import { appendEvent } from './encounterTimeline';
import { resolveLocationToHex } from './encounterAwareness';
import { hexDistance } from '../lib/hexMath';
import { MAX_AWARENESS_HOPS, EDGE_HEX_AWARENESS_BONUS } from '../data/agent-behavior-constants';
import type { SimulationRuntime } from './simulationRuntime';
import { recordBalanceEvent } from './balanceTelemetry';
import { prepareEncounterSupportBundle } from './encounterSupportBundle';
import { initializeClearanceGates } from './clearanceGate';
import { createUnifiedAction } from './unifiedActionLifecycle';
import { isCompulsionEligible, buildCompulsionEvent } from './premonitionCompulsion';
import type { PremonitionEvent } from '../types/premonition';
import { resolveEffectiveTier } from './attentionTier';
import type { BalanceEncounterPoolCandidate } from '../types/balanceEval';
import { deriveOmenEncounterBias } from './phaseOmenAgenda';
import { IDENTITY_ENCOUNTER_BIAS_CAP } from '../types/doomIdentity';
import { ENABLE_STRATEGIC_ACTIONS } from '../data/strategic-action-constants';
import { generateStrategicCandidates } from './strategicActionCandidates';
import { scoreStrategicCandidates } from './strategicActionScoring';
import { executeStrategicAction } from './strategicActionLifecycle';
import type { StrategicCandidateBoardTrace, StrategicActionStartedTrace } from '../types/trace';
import type { DecisionFamily } from '../types/strategicAction';

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
  const newEvents: TickEvent[] = [];
  const newEncounterProgress: EncounterProgress[] = [];
  const newUnifiedActions: UnifiedAction[] = [];
  const newPremonitions: PremonitionEvent[] = [];
  let nextClearanceGateStates = state.clearanceGateStates
    ? new Map(state.clearanceGateStates)
    : undefined;
  let accumulatedStrategicState = state.strategicState;

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
  const actors = graph.getNodesByType('actor').filter(
    (n) => n.properties.actorType === 'individual'
      && (n.properties.spotlightTier ?? 'spotlight') === 'spotlight'
      && !avatarNodeIds.has(n.id),
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
            const rerouteEntries = movingHex
              ? encounterCache.getEntriesNearHex(movingHex.col, movingHex.row, spatialQueryRange)
              : encounterCache.getAllEntries();
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
      const nearbyEntries = agentHex
        ? encounterCache.getEntriesNearHex(agentHex.col, agentHex.row, spatialQueryRange)
        : encounterCache.getAllEntries();

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
      const combinedBias: Partial<Record<string, number>> = {};
      const allTypes = new Set([...Object.keys(identityBias), ...Object.keys(omenBias)]);
      for (const t of allTypes) {
        const id = Math.max(-IDENTITY_ENCOUNTER_BIAS_CAP, Math.min(IDENTITY_ENCOUNTER_BIAS_CAP, identityBias[t] ?? 0));
        const om = Math.max(-IDENTITY_ENCOUNTER_BIAS_CAP, Math.min(IDENTITY_ENCOUNTER_BIAS_CAP, omenBias[t] ?? 0));
        combinedBias[t] = id + om;
      }

      // Score and select (hex-distance travel cost, no distance matrix)
      const agentHiddenMarks = (state.hiddenMarks ?? []).filter(m => m.targetAgentId === agentId);
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
      );

      // Emit scoring trace
      emitTrace(decision.trace as TraceEntry);

      // ── Strategic Candidate Integration ─────────────────────────────
      // When enabled, generate strategic candidates from active ambitions
      // and compare them with the encounter board. If the best strategic
      // candidate beats the best encounter candidate, override the selection.
      let decisionFamily: DecisionFamily = decision.selected ? 'encounter' : 'idle';
      let strategicWinner: ReturnType<typeof scoreStrategicCandidates>[number] | null = null;

      if (ENABLE_STRATEGIC_ACTIONS) {
        try {
          // Find active ambition template IDs via pursues edges
          const pursuesEdges = graph.getOutgoingEdges(agentId, 'pursues');
          const activeAmbitionTemplateIds: string[] = [];
          for (const edge of pursuesEdges) {
            const props = edge.properties as Record<string, unknown> | undefined;
            if (props?.status === 'active') {
              const ambitionNode = graph.getNode(edge.target);
              const templateId = ambitionNode?.properties?.templateId as string | undefined;
              if (templateId) activeAmbitionTemplateIds.push(templateId);
            }
          }

          if (activeAmbitionTemplateIds.length > 0) {
            const stratResult = generateStrategicCandidates(
              graph, agentId, activeAmbitionTemplateIds, accumulatedStrategicState, state.tick, rng,
            );
            const scored = scoreStrategicCandidates(
              stratResult.candidates, accumulatedStrategicState, state.tick, rng,
            );

            // Compare best strategic score against best encounter score
            const bestStrategicScore = scored.length > 0 ? scored[0].finalScore : 0;
            const bestEncounterScore = decision.topCandidates.length > 0
              ? decision.topCandidates[0].finalScore
              : 0;

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
              summary: `Strategic board: ${stratResult.candidates.length} generated, ${stratResult.rejections.length} rejected, top=${scored[0]?.finalScore.toFixed(3) ?? 'none'}`,
            } as StrategicCandidateBoardTrace & { summary: string });

            if (bestStrategicScore > bestEncounterScore && scored.length > 0) {
              strategicWinner = scored[0];
              decisionFamily = 'strategic_action';
            }
          }
        } catch {
          // Fail-soft: strategic generation failure → fall through to encounter path
        }
      }

      // ── Compulsion Check ──────────────────────────────────────────
      // Before committing, check if this agent is eligible for a Compulsion
      // premonition. If so, emit the event to the queue. The agent's decision
      // will be influenced by compulsionTargetTemplateId if the player acts.
      if (decision.selected && decision.topCandidates.length > 1) {
        try {
          if (isCompulsionEligible(graph, state.ascendantId, agentId)) {
            const compulsionEvent = buildCompulsionEvent(
              state, agentId, actor.name, decision.topCandidates, rng,
            );
            if (compulsionEvent) {
              newPremonitions.push(compulsionEvent);
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
          const stratResult = executeStrategicAction(
            state, graph, strategicWinner, state.tick, rng,
          );

          // Accumulate strategic state for return + downstream agents
          if (stratResult.strategicState) {
            accumulatedStrategicState = stratResult.strategicState;
          }

          emitTrace({
            category: 'strategic_action_started',
            tick: state.tick,
            agentId,
            candidateId: strategicWinner.candidateId,
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

      if (decision.selected) {
        const sel = decision.selected;

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
          if (template) {
            const unifiedTemplate = getUnifiedTemplateById(sel.entry.templateId);
            if (unifiedTemplate) {
              const supportBindings = prepareEncounterSupportBundle(
                state,
                unifiedTemplate,
                sel.entry.targetAgentId ?? sel.entry.locationId,
                sel.entry.locationId,
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
                }),
                effectiveTier: uaEffectiveTier,
              };
              newUnifiedActions.push(action);
            } else {
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
              }
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
    ...(accumulatedStrategicState ? { strategicState: accumulatedStrategicState } : {}),
  };
}
