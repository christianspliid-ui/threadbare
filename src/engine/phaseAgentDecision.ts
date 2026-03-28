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
import {
  ENCOUNTER_ABANDON_COOLDOWN,
  ENCOUNTER_COMPLETION_COOLDOWN,
} from '../types/encounter';
import { runFilterPipeline } from './encounterFilterPipeline';
import { scoreAndSelect } from './encounterScoring';
import { resolveIdleBehavior } from './idleBehavior';
import { isEncounterOccupied } from './encounter';
import { getAnyEncounterById } from '../data/encounter-content';
import { generateSocialCandidates } from './socialEncounterGeneration';
import { generateFactionQuestCandidates, generateFactionLifecycleCandidates } from './factionQuestGeneration';
import { initMovementState } from './movementExecution';
import { buildHexMovementPath } from './hexMovementPath';
import { findShortestPath } from './pathfinding';
import { computeEdgeCost } from './movementCost';
import { emitTrace } from './traceBuffer';
import type { TraceEntry, IdleDecisionTrace } from '../types/trace';
import { IDLE_SCORE_THRESHOLD } from '../data/agent-behavior-constants';
import { REROUTE_SCORE_MULTIPLIER, DECISION_REEVALUATION_TICKS } from '../data/movement-content';
import type { MovementState } from '../types/movement';
import type { AgentRerouteTrace } from '../types/trace';
import { getAgentLocationId, getAvatarsOf } from './graphQueries';
import { appendEvent } from './encounterTimeline';

/**
 * Filter out candidates whose encounter template is on cooldown for this agent.
 * An encounter is on cooldown if the agent has an abandoned or completed progress
 * record whose last history tick is within the cooldown window.
 */
function filterByCooldown(
  candidates: EncounterCacheEntry[],
  agentId: string,
  encounterProgress: readonly EncounterProgress[],
  tick: number,
): EncounterCacheEntry[] {
  // Collect cooldown end ticks per template for this agent
  const cooldownEnd = new Map<string, number>();
  for (const p of encounterProgress) {
    if (p.actorId !== agentId) continue;
    if (p.status === 'abandoned') {
      const lastStep = p.history[p.history.length - 1];
      const abandonedAt = lastStep?.tick ?? p.startedTick;
      cooldownEnd.set(p.encounterId, abandonedAt + ENCOUNTER_ABANDON_COOLDOWN);
    } else if (p.status === 'completed') {
      const lastStep = p.history[p.history.length - 1];
      const completedAt = lastStep?.tick ?? p.startedTick;
      cooldownEnd.set(p.encounterId, completedAt + ENCOUNTER_COMPLETION_COOLDOWN);
    }
  }

  if (cooldownEnd.size === 0) return candidates;

  return candidates.filter(c => {
    const end = cooldownEnd.get(c.templateId);
    return end === undefined || tick > end;
  });
}

export function phaseAgentDecision(
  state: GameState,
  encounterCache: EncounterCacheManager,
  distanceMatrix: DistanceMatrix,
  rng: () => number,
): Partial<GameState> {
  const graph = state.graph;
  const allEntries = encounterCache.getAllEntries();
  const newEvents: TickEvent[] = [];
  const newEncounterProgress: EncounterProgress[] = [];

  // Build set of avatar IDs to exclude from autonomous decision-making
  const avatarNodeIds = new Set<string>();
  if (state.ascendantId) {
    for (const a of getAvatarsOf(graph, state.ascendantId)) {
      avatarNodeIds.add(a.id);
    }
  }

  // Get all individual actors, excluding the player's avatar
  const actors = graph.getNodesByType('actor').filter(
    (n) => n.properties.actorType === 'individual' && !avatarNodeIds.has(n.id),
  );

  for (const actor of actors) {
    const agentId = actor.id;

    try {
      // Skip if already active (unified action)
      if (state.unifiedActions.some((a) => a.actorId === agentId && !a.resolved)) {
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
            const allEntries = encounterCache.getAllEntries();
            let bestAltScore = 0;
            let bestAltLocationId: string | null = null;

            for (const entry of allEntries) {
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

      // Merge static cache entries with dynamic social + faction + lifecycle entries
      const dynamicEntries = [...socialEntries, ...factionEntries, ...lifecycleEntries];
      const mergedEntries = dynamicEntries.length > 0
        ? [...allEntries, ...dynamicEntries]
        : allEntries;

      // Run filter pipeline
      const filterResult = runFilterPipeline(
        mergedEntries,
        agentId,
        locationId,
        graph,
        distanceMatrix,
        state.tick,
      );
      const rawCandidates = filterResult.candidates;

      // Emit filter pipeline trace
      emitTrace(filterResult.trace as TraceEntry);

      // Filter out encounters on cooldown (abandoned/completed recently)
      const candidates = filterByCooldown(
        rawCandidates,
        agentId,
        state.encounterProgress,
        state.tick,
      );

      // Score and select
      const decision = scoreAndSelect(
        candidates,
        agentId,
        locationId,
        graph,
        distanceMatrix,
        state.tick,
        state.worldSoul?.fundament,
      );

      // Emit scoring trace
      emitTrace(decision.trace as TraceEntry);

      if (decision.selected) {
        const sel = decision.selected;
        // Timeline: DECIDE event
        const selCandidate = decision.topCandidates.find(c => c.templateId === sel.entry.templateId);
        const targetLocNode = graph.getNode(sel.entry.locationId);
        const targetHexCol = (targetLocNode?.properties?.hexCol as number) ?? 0;
        const targetHexRow = (targetLocNode?.properties?.hexRow as number) ?? 0;
        appendEvent(agentId, {
          phase: 'DECIDE',
          tick: state.tick,
          targetEncounter: sel.entry.templateId,
          targetLocation: targetLocNode?.name ?? sel.entry.locationId,
          targetHex: [targetHexCol, targetHexRow],
          score: selCandidate?.finalScore ?? 0,
          travelCost: selCandidate?.travelCost ?? 0,
          completionProb: selCandidate?.completionProb ?? 0,
        });

        if (sel.action === 'start_local' || sel.action === 'attempt_remote') {
          // Start the encounter — create EncounterProgress
          const template = getAnyEncounterById(sel.entry.templateId);
          if (template) {
            const firstStepDuration = template.steps[0]?.duration ?? 1;
            const progress: EncounterProgress = {
              encounterId: sel.entry.templateId,
              actorId: agentId,
              ...(sel.entry.targetAgentId ? { targetAgentId: sel.entry.targetAgentId } : {}),
              currentEncounterIndex: 0,
              history: [],
              status: 'active',
              startedTick: state.tick,
              occupiedUntilTick: state.tick + firstStepDuration,
            };
            newEncounterProgress.push(progress);

            const prefix = sel.action === 'attempt_remote' ? 'remotely begins' : 'begins';
            newEvents.push({
              id: `decision_${agentId}_${state.tick}`,
              tick: state.tick,
              type: 'agent_encounter',
              message: `${actor.name} ${prefix} ${template.name}`,
              significance: 0.4,
            });
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

            graph.updateNode(agentId, {
              properties: {
                ...actor.properties,
                movementState: movState,
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
          }
        }
      } else {
        // Idle behavior — determine reason for idling
        let idleReason: IdleDecisionTrace['reason'];
        if (filterResult.candidates.length === 0) {
          idleReason = 'no_candidates_after_filter';
        } else if (candidates.length === 0) {
          idleReason = 'no_candidates_after_cooldown';
        } else {
          idleReason = 'below_score_threshold';
        }

        const localEntries = allEntries.filter((e) => e.locationId === locationId);
        const idle = resolveIdleBehavior(
          agentId,
          locationId,
          graph,
          distanceMatrix,
          localEntries,
          rng,
        );

        // Emit idle decision trace
        const ft = filterResult.trace;
        const bestScore = decision.topCandidates.length > 0
          ? decision.topCandidates[0].finalScore
          : null;
        const driftTargetNode = idle.targetLocationId ? graph.getNode(idle.targetLocationId) : null;

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
          bestScore,
          scoreThreshold: IDLE_SCORE_THRESHOLD,
          idleAction: idle.action,
          driftTargetId: idle.targetLocationId,
          driftTargetName: driftTargetNode?.name ?? undefined,
          summary: `${actor.name} idles (${idleReason}): ${idle.action}${idle.targetLocationId ? ` → ${driftTargetNode?.name ?? idle.targetLocationId}` : ''}${bestScore !== null ? ` [best=${bestScore.toFixed(3)}, threshold=${IDLE_SCORE_THRESHOLD}]` : ''}`,
        } as TraceEntry);

        // Timeline: IDLE event
        appendEvent(agentId, {
          phase: 'IDLE',
          tick: state.tick,
          reason: idleReason,
          idleAction: idle.action,
          driftTarget: driftTargetNode?.name ?? idle.targetLocationId ?? undefined,
        });

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
      }
    } catch {
      // Fail-soft: per-agent error → skip this agent, continue loop
      continue;
    }
  }

  return {
    tickEvents: [...state.tickEvents, ...newEvents],
    encounterProgress: [...state.encounterProgress, ...newEncounterProgress],
  };
}
