/**
 * Phase Agent Decision — unified encounter-driven decision pipeline.
 *
 * Replaces phaseIdleSelection as Phase 2b. For each idle individual agent,
 * runs the filter pipeline → scoring → action selection (start_local,
 * queue_movement, attempt_remote) or falls back to idle behavior (drift/stay).
 *
 * ─── Constants ──────────────────────────────────────────────────
 * | Name                       | Default | Purpose                                       |
 * |----------------------------|---------|-----------------------------------------------|
 * | (none — delegates to sub-modules for all tunable values)      |
 *
 * ─── Tracing ────────────────────────────────────────────────────
 * Delegates to encounterFilterPipeline (FilterPipelineTrace) and
 * encounterScoring (ScoringTrace). This phase itself emits TickEvents
 * for UI display of agent decisions.
 *
 * ─── Fail-soft ──────────────────────────────────────────────────
 * | Failure case                    | Fallback                              |
 * |---------------------------------|---------------------------------------|
 * | Agent has no location           | Skip agent, continue loop             |
 * | Filter pipeline throws          | Caught per-agent, agent stays idle    |
 * | Scoring throws                  | Caught per-agent, agent stays idle    |
 * | Pathfinding returns null        | Skip movement, agent stays            |
 * | Graph.updateNode throws         | Caught per-agent, continue            |
 *
 * ─── PRNG ───────────────────────────────────────────────────────
 * `rng` parameter passed to resolveIdleBehavior for tie-breaking.
 */

import type { GameState, TickEvent } from '../types/gameState';
import type { EncounterCacheManager } from './encounterCache';
import type { DistanceMatrix } from './distanceMatrix';
import { runFilterPipeline } from './encounterFilterPipeline';
import { scoreAndSelect } from './encounterScoring';
import { resolveIdleBehavior } from './idleBehavior';
import { isEncounterOccupied } from './encounter';
import { findShortestPath } from './pathfinding';

export function phaseAgentDecision(
  state: GameState,
  encounterCache: EncounterCacheManager,
  distanceMatrix: DistanceMatrix,
  rng: () => number,
): Partial<GameState> {
  const graph = state.graph;
  const allEntries = encounterCache.getAllEntries();
  const newEvents: TickEvent[] = [];
  const encounterProgress = [...state.encounterProgress];

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

      // Skip if occupied in encounter
      const activeEncounter = encounterProgress.find(
        (ep) => ep.actorId === agentId && ep.status === 'active',
      );
      if (activeEncounter && isEncounterOccupied(activeEncounter, state.tick)) {
        continue;
      }

      // Skip if moving
      const movementState = actor.properties?.movementState as
        | { movementQueue?: string[] }
        | undefined;
      if (movementState?.movementQueue && movementState.movementQueue.length > 0) {
        continue;
      }

      // Get agent location — check both located_at outgoing and contains incoming
      const locEdges = graph.getOutgoingEdges(agentId, 'located_at');
      const inContains = graph.getIncomingEdges(agentId, 'contains');

      let locationId: string | undefined;
      if (locEdges.length > 0) locationId = locEdges[0].target;
      else if (inContains.length > 0) locationId = inContains[0].source;

      if (!locationId) continue; // no location, skip

      // Run filter pipeline
      const { candidates } = runFilterPipeline(
        allEntries,
        agentId,
        locationId,
        graph,
        distanceMatrix,
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

        if (sel.action === 'start_local') {
          // Start local encounter
          newEvents.push({
            id: `decision_${agentId}_${state.tick}`,
            tick: state.tick,
            type: 'agent_encounter',
            message: `${actor.name} begins ${sel.entry.templateId.replace('encounter.', '')}`,
            significance: 0.4,
          });
        } else if (sel.action === 'queue_movement') {
          // Queue movement toward the encounter's location
          const pathResult = findShortestPath(
            graph,
            agentId,
            locationId,
            sel.entry.locationId,
          );
          if (pathResult) {
            graph.updateNode(agentId, {
              properties: {
                ...actor.properties,
                movementState: {
                  movementQueue: pathResult.path,
                  destinationId: sel.entry.locationId,
                  targetEncounterId: sel.entry.templateId,
                  lastDecisionTick: state.tick,
                },
              },
            });
            newEvents.push({
              id: `decision_move_${agentId}_${state.tick}`,
              tick: state.tick,
              type: 'agent_movement',
              message: `${actor.name} sets out toward ${sel.entry.locationId}`,
              significance: 0.3,
            });
          }
        } else if (sel.action === 'attempt_remote') {
          newEvents.push({
            id: `decision_remote_${agentId}_${state.tick}`,
            tick: state.tick,
            type: 'agent_encounter',
            message: `${actor.name} remotely attempts ${sel.entry.templateId.replace('encounter.', '')}`,
            significance: 0.4,
          });
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
          if (pathResult) {
            graph.updateNode(agentId, {
              properties: {
                ...actor.properties,
                movementState: {
                  movementQueue: pathResult.path,
                  destinationId: idle.targetLocationId,
                  lastDecisionTick: state.tick,
                },
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
    encounterProgress,
  };
}
