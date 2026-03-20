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
import { findShortestPath } from './pathfinding';
import { initMovementState } from './movementExecution';
import { computeEdgeCost } from './movementCost';
import { emitTrace } from './traceBuffer';
import type { TraceEntry } from '../types/trace';

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

  // Get all individual actors
  const actors = graph.getNodesByType('actor').filter(
    (n) => n.properties.actorType === 'individual',
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

      // Skip if moving
      const movementState = actor.properties?.movementState as
        | { movementQueue?: string[] }
        | undefined;
      if (movementState?.movementQueue && movementState.movementQueue.length > 0) {
        continue;
      }

      // Get agent location — check located_at outgoing, then contains outgoing
      // (worldSeed uses contains: source=agent, target=location)
      const locEdges = graph.getOutgoingEdges(agentId, 'located_at');
      const outContains = graph.getOutgoingEdges(agentId, 'contains');

      let locationId: string | undefined;
      if (locEdges.length > 0) locationId = locEdges[0].target;
      else if (outContains.length > 0) locationId = outContains[0].target;

      if (!locationId) continue;

      // Generate social encounter candidates (agent-to-agent)
      const socialEntries = generateSocialCandidates(
        graph,
        agentId,
        locationId,
        distanceMatrix,
      );

      // Merge static cache entries with dynamic social entries
      const mergedEntries = socialEntries.length > 0
        ? [...allEntries, ...socialEntries]
        : allEntries;

      // Run filter pipeline
      const { candidates: rawCandidates } = runFilterPipeline(
        mergedEntries,
        agentId,
        locationId,
        graph,
        distanceMatrix,
        state.tick,
      );

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
      );

      if (decision.selected) {
        const sel = decision.selected;

        if (sel.action === 'start_local' || sel.action === 'attempt_remote') {
          // Start the encounter — create EncounterProgress
          const template = getAnyEncounterById(sel.entry.templateId);
          if (template) {
            const firstStepDuration = template.steps[0]?.duration ?? 1;
            const progress: EncounterProgress = {
              encounterId: sel.entry.templateId,
              actorId: agentId,
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
          // Queue movement toward the encounter's location
          const pathResult = findShortestPath(
            graph,
            agentId,
            locationId,
            sel.entry.locationId,
          );
          if (pathResult && pathResult.path.length > 0) {
            const firstEdgeCost = computeEdgeCost(graph, agentId, locationId, pathResult.path[0]).totalCost;
            const movState = initMovementState(
              sel.entry.locationId,
              pathResult.path,
              firstEdgeCost,
              state.tick,
            );
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
              queueLength: pathResult.path.length,
              summary: `${actor.name} departs for ${destName} (${pathResult.path.length} hops, encounter: ${sel.entry.templateId})`,
            } as TraceEntry);
          }
        }
      } else {
        // Idle behavior
        const localEntries = allEntries.filter((e) => e.locationId === locationId);
        const idle = resolveIdleBehavior(
          agentId,
          locationId,
          graph,
          distanceMatrix,
          localEntries,
          rng,
        );

        if (idle.action === 'drift' && idle.targetLocationId) {
          const pathResult = findShortestPath(
            graph,
            agentId,
            locationId,
            idle.targetLocationId,
          );
          if (pathResult && pathResult.path.length > 0) {
            const firstEdgeCost = computeEdgeCost(graph, agentId, locationId, pathResult.path[0]).totalCost;
            const driftState = initMovementState(
              idle.targetLocationId,
              pathResult.path,
              firstEdgeCost,
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
