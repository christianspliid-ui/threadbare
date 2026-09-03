/**
 * Phase Movement — Goal-Directed Agent Pathfinding
 *
 * Each tick, agents with existing movement queues advance along their paths.
 * Agents that have arrived re-evaluate their destination by scoring movement candidates
 * against their axiological profiles.
 */

import type { GameState, TickEvent } from '../types/gameState';
import type { MovementState } from '../types/movement';
import { DECISION_REEVALUATION_TICKS } from '../types/movement';
import { tickMovement } from './movementExecution';
import { generateMovementCandidates, scoreMovementCandidate } from './movementCandidates';
import { findShortestPath } from './pathfinding';
import { MOVEMENT_SCORE_THRESHOLD, MOVEMENT_EVENT_SIGNIFICANCE } from '../data/movement-content';
import type { AxiologicalProfile } from '../types/agent';
import { emitTrace } from './traceBuffer';
import type { TraceEntry, RoadHexTransitionTrace } from '../types/trace';
import { getAvatarAscendant, getAgentLocationId } from './graphQueries';
import { appendEvent } from './encounterTimeline';
import type { ExplorationRecord } from './encounterScoring';
import { checkAndFireActionTriggers, type ActionTriggerContext } from './effects/actionTrigger';
import { applyActionTriggerPayloads } from './effects/actionTriggerPayloads';
import { collectAttachmentEffects } from './effects/effectWalker';
import { getRevealRanges } from './effects/effectQueries';
import { raiseEffectEvent } from './effects/effectEventDispatch';
import { getLocationNodes } from './sublocationShape';
import { hexDistance } from '../lib/hexMath';
import { mulberry32 } from '../lib/prng';
import { hashString } from './factionAmbitions';
import type { EffectRuntimeState } from '../types/effects';

// ─── ID Generator (local) ─────────────────────────────────────────

let eventCounterPhaseMovement = 0;

function nextEventId(tick: number): string {
  return `evt_movement_${tick}_${++eventCounterPhaseMovement}`;
}

/**
 * Reset event counter for test isolation.
 * Call this in test beforeEach blocks.
 */
export function resetMovementEventCounter(): void {
  eventCounterPhaseMovement = 0;
}

// ─── Phase Function ──────────────────────────────────────────────────

/**
 * Phase Movement: Process goal-directed pathfinding for all agents.
 *
 * For each individual agent:
 * 1. If they have an active movement queue, tick their movement and emit event on transition
 * 2. If they've arrived or have no queue, re-evaluate their destination using axiological scoring
 * 3. If best candidate score >= threshold, initiate new movement
 * 4. Otherwise, update lastDecisionTick to avoid re-evaluating every single tick
 */
export function phaseMovement(state: GameState): Partial<GameState> {
  const events: TickEvent[] = [];

  // Get all individual spotlight agents (includes avatar — avatar player-initiated movement must still tick).
  // Ambient/notable NPCs are excluded from the movement phase.
  // Legacy nodes without spotlightTier default to 'spotlight' for backward compatibility.
  const agents = state.graph.getNodesByType('actor')
    .filter(actor => actor.properties?.actorType === 'individual'
      && (actor.properties.spotlightTier ?? 'spotlight') === 'spotlight');

  for (const actor of agents) {
   try {
    const actorId = actor.id;

    // Detect if this actor is the player's avatar (has outgoing avatar_of edge)
    const isAvatar = getAvatarAscendant(state.graph, actorId) != null;

    // Get current movement state (or undefined if not started)
    const movementState = actor.properties?.movementState as MovementState | undefined;

    // --- Case 1: Agent has active movement queue ---
    if (movementState && movementState.movementQueue.length > 0) {
      const result = tickMovement(state.graph, actorId, movementState, state.tick);

      // Update actor's movement state
      state.graph.updateNode(actorId, {
        properties: { ...actor.properties, movementState: result.updatedState },
      });

      // Emit road hex transition trace (if applicable)
      if (result.roadHexTransition) {
        emitTrace({
          category: 'road_hex_transition',
          tick: state.tick,
          agentId: actorId,
          agentName: actor.name,
          fromHex: result.roadHexTransition.fromHex,
          toHex: result.roadHexTransition.toHex,
          roadType: result.roadHexTransition.roadType,
          hexProgress: result.roadHexTransition.hexProgress,
          hexTotal: result.roadHexTransition.hexTotal,
          ticksAccumulated: 1,
          hexCost: result.updatedState.roadHexCost ?? 0,
          summary: `${actor.name} walks ${result.roadHexTransition.roadType} road (${result.roadHexTransition.hexProgress}/${result.roadHexTransition.hexTotal})`,
        } as RoadHexTransitionTrace & { summary: string });

        // Timeline: MOVE event (road hex transition)
        appendEvent(actorId, {
          phase: 'MOVE',
          tick: state.tick,
          fromHex: [result.roadHexTransition.fromHex.col, result.roadHexTransition.fromHex.row],
          toHex: [result.roadHexTransition.toHex.col, result.roadHexTransition.toHex.row],
          cost: `${result.roadHexTransition.hexProgress}/${result.roadHexTransition.hexTotal}`,
          road: result.roadHexTransition.roadType,
        });
      }

      // Emit event on movement transition (skip for avatar — player controls avatar)
      if (result.moved && !isAvatar) {
        const destNode = state.graph.getNode(result.newLocationId!);
        const finalDestNode = state.graph.getNode(result.updatedState.destinationId);
        events.push({
          id: nextEventId(state.tick),
          tick: state.tick,
          type: 'agent_movement',
          message: `${actor.name} moves to ${destNode?.name ?? 'a location'}.`,
          significance: MOVEMENT_EVENT_SIGNIFICANCE,
          actorId: actorId,
          hexCoords: destNode?.properties?.hexCol != null
            ? { col: destNode.properties.hexCol as number, row: destNode.properties.hexRow as number }
            : undefined,
        });

        // Trace: movement step
        emitTrace({
          category: 'movement',
          tick: state.tick,
          agentId: actorId,
          agentName: actor.name,
          event: result.arrivedAtDestination ? 'arrive' : 'step',
          toLocationId: result.newLocationId!,
          toLocationName: destNode?.name ?? '?',
          destinationId: result.updatedState.destinationId,
          destinationName: finalDestNode?.name ?? '?',
          queueLength: result.updatedState.movementQueue.length,
          encounterId: result.updatedState.targetEncounterId,
          sublocationId: result.updatedState.targetSublocationId,
          summary: result.arrivedAtDestination
            ? `${actor.name} arrives at ${destNode?.name ?? '?'}`
            : `${actor.name} moves to ${destNode?.name ?? '?'} (${result.updatedState.movementQueue.length} hops left)`,
        } as TraceEntry);

        // Timeline: ARRIVE event
        if (result.arrivedAtDestination) {
          const arrHexCol = (destNode?.properties?.hexCol as number) ?? 0;
          const arrHexRow = (destNode?.properties?.hexRow as number) ?? 0;
          appendEvent(actorId, {
            phase: 'ARRIVE',
            tick: state.tick,
            location: destNode?.name ?? '?',
            hex: [arrHexCol, arrHexRow],
          });

          // ── Effect event: entered_hex (THR-1239) ──
          //
          // The `entered_hex` reactive trigger has existed in the mapping since
          // the primitive architecture landed; nothing ever raised the event, so
          // every reactive spell keyed on relocation was inert. This is that raise.
          //
          // FINAL ARRIVAL ONLY — not per hex step, and not on sublocation moves
          // within the same hex. A reactive keyed on relocation means "I got
          // somewhere", and per-step firing multiplies event volume roughly 4×
          // (the mean queue length) for no design gain.
          //
          // NFP #3: reuses the same seeded stream the action-trigger block below
          // derives, so an arrival's rolls are reproducible from (seed, tick, agent).
          raiseEffectEvent(
            state,
            actorId,
            { type: 'entered_hex', hex: { col: arrHexCol, row: arrHexRow } },
            {
              site: 'movement_arrival',
              rng: mulberry32(state.seed + state.tick * 47 + hashString(actorId)),
            },
          );

          // B.2: Track exploration — record first visit tick for this location
          const arrivalLocId = result.newLocationId!;
          // Re-read node to get latest properties (movementState was just updated above)
          const currentActorNode = state.graph.getNode(actorId);
          const existingExploration = (currentActorNode?.properties?.explorationRecord as ExplorationRecord | undefined) ?? { visitedLocations: {} };

          // ── Effect: reveal (THR-1242) ──
          //
          // `reveal` shipped on 17 content refs with no consumer of any kind, so
          // a lantern that "reveals hexes within 2" lit nothing. This is the fog
          // half of its wiring (the `encounters` half is in `encounterAwareness`):
          // on arrival, every location within the reveal radius is stamped into
          // the bearer's exploration record as if they had walked it.
          //
          // Stamped at the ARRIVAL tick, not the tick each place was first seen,
          // because that is what the record means — "known to this agent since".
          // Recorded only for places not already visited, so a reveal can never
          // rewrite an earlier, truer first-visit tick.
          //
          // At arrival only, matching `entered_hex` above: a reveal is a property
          // of where you now stand, and re-running the radius scan per movement
          // step would multiply an O(locations) walk by the queue length for a
          // horizon that has barely moved (NFP #7).
          const revealHexRange = getRevealRanges(state.graph, actorId, state.effectStates).hexes;
          const revealed: Record<string, number> = {};
          if (revealHexRange > 0) {
            const originHex = { col: arrHexCol, row: arrHexRow };
            for (const loc of getLocationNodes(state.graph)) {
              if (existingExploration.visitedLocations[loc.id] !== undefined) continue;
              const col = loc.properties?.hexCol as number | undefined;
              const row = loc.properties?.hexRow as number | undefined;
              if (typeof col !== 'number' || typeof row !== 'number') continue;
              if (hexDistance(originHex, { col, row }) > revealHexRange) continue;
              revealed[loc.id] = state.tick;
            }
          }

          const firstVisit = existingExploration.visitedLocations[arrivalLocId] === undefined;
          if (firstVisit || Object.keys(revealed).length > 0) {
            const updatedExploration: ExplorationRecord = {
              visitedLocations: {
                ...existingExploration.visitedLocations,
                ...revealed,
                ...(firstVisit ? { [arrivalLocId]: state.tick } : {}),
              },
            };
            state.graph.updateNode(actorId, {
              properties: { ...currentActorNode!.properties, explorationRecord: updatedExploration },
            });
            if (Object.keys(revealed).length > 0) {
              emitTrace({
                category: 'effect.revealed',
                tick: state.tick,
                agentId: actorId,
                range: revealHexRange,
                revealedCount: Object.keys(revealed).length,
                summary: `${actor.name} reveals ${Object.keys(revealed).length} location(s) within ${revealHexRange} hexes`,
              });
            }
          }

          // ── Action trigger: movement_complete (TB-104 Phase 1B) ──
          const triggerActorNode = state.graph.getNode(actorId);
          if (triggerActorNode) {
            const tProps = triggerActorNode.properties as Record<string, unknown>;
            const triggerCtx: ActionTriggerContext = {
              agentId: actorId,
              tick: state.tick,
              agentResources: {
                essence: (tProps.essence as number) ?? 0,
                quintessence: (tProps.quintessence as number) ?? 0,
                quintessenceMax: (tProps.quintessenceMax as number) ?? Infinity,
                doom: (tProps.doom as number) ?? 0,
                doomThreshold: (tProps.doomThreshold as number) ?? 100,
              },
            };
            const effectStates = state.effectStates ?? new Map<string, EffectRuntimeState>();
            const attachedEffects = collectAttachmentEffects(state.graph, actorId, effectStates);
            // THR-719: seeded roll for probability guards + name for narrative tokens.
            triggerCtx.nextRoll = mulberry32(
              state.seed + state.tick * 47 + hashString(actorId),
            );
            triggerCtx.actorName = state.graph.getNode(actorId)?.name;
            const triggerResult = checkAndFireActionTriggers(
              attachedEffects,
              'movement_complete',
              triggerCtx,
              effectStates,
            );
            if (triggerResult.firedCount > 0) {
              for (const delta of triggerResult.resourceDeltas) {
                (tProps as Record<string, number>)[delta.resource] = delta.after;
              }
              if (triggerResult.resourceDeltas.length > 0) {
                state.graph.updateNode(actorId, { properties: tProps });
              }
              for (const trace of triggerResult.traces) {
                emitTrace({ category: 'effect_reaction', tick: state.tick, event: 'action_trigger_fired', ...trace } as unknown as TraceEntry);
              }
              // Applied before the payloads so a THR-1257 `damaged` / `healed` raise
              // builds on this trigger's own cooldown writes. This site does not
              // thread its own map, so the raise writes `state.effectStates` directly.
              if (!state.effectStates) state.effectStates = new Map();
              for (const [k, v] of triggerResult.updatedStates) {
                state.effectStates.set(k, v);
              }
              if (triggerResult.payloadIntents.length > 0) {
                applyActionTriggerPayloads(
                  state,
                  actorId,
                  triggerResult.payloadIntents,
                  state.tick,
                );
              }
            }
          }
        }
      }

      // --- Avatar arrival event (auto-pause signal for UI) ---
      if (isAvatar && result.arrivedAtDestination && result.moved) {
        const destNode = state.graph.getNode(result.newLocationId!);
        events.push({
          id: nextEventId(state.tick),
          tick: state.tick,
          type: 'avatar_arrival',
          message: `Your ascendant has arrived at ${destNode?.name ?? 'their destination'}.`,
          significance: 0.6,
          actorId: actorId,
          hexCoords: destNode?.properties?.hexCol != null
            ? { col: destNode.properties.hexCol as number, row: destNode.properties.hexRow as number }
            : undefined,
        });
      }

      // --- Sublocation entry on arrival ---
      if (result.arrivedAtDestination && result.updatedState.targetSublocationId) {
        const sublocationId = result.updatedState.targetSublocationId;
        const sublocation = state.graph.getNode(sublocationId);
        // Verify sublocation still exists and belongs to the destination
        if (sublocation && sublocation.type === 'location') {
          const subProps = sublocation.properties as Record<string, unknown>;
          if (subProps.parentLocationId === result.updatedState.destinationId) {
            // Move agent's located_at to the sublocation
            const oldEdges = state.graph.getOutgoingEdges(actorId, 'located_at');
            for (const edge of oldEdges) {
              state.graph.removeEdge(edge.id);
            }
            state.graph.addEdge({
              id: `${actorId}_located_at_${sublocationId}`,
              source: actorId,
              target: sublocationId,
              type: 'located_at',
              properties: {},
            });

            // Trace: sublocation entry
            emitTrace({
              category: 'movement',
              tick: state.tick,
              agentId: actorId,
              agentName: actor.name,
              event: 'sublocation_enter',
              toLocationId: sublocationId,
              toLocationName: sublocation.name,
              destinationId: result.updatedState.destinationId,
              encounterId: result.updatedState.targetEncounterId,
              sublocationId,
              sublocationName: sublocation.name,
              summary: `${actor.name} enters ${sublocation.name}`,
            } as TraceEntry);
          }
        }
        // Clear targetSublocationId regardless (fail-soft: if sublocation dissolved, stay at parent)
        result.updatedState.targetSublocationId = undefined;
      }

      // --- Mid-path re-evaluation (skip for avatar — player controls destination) ---
      if (!isAvatar &&
          result.updatedState.movementQueue.length > 0 &&
          (state.tick - (result.updatedState.lastDecisionTick ?? 0) >= DECISION_REEVALUATION_TICKS)) {
        // Get current location for re-evaluation
        const currentLocId = getAgentLocationId(state.graph, actorId);
        if (currentLocId) {
          const profile = (actor.properties?.axiologicalProfile as AxiologicalProfile) || {
            mercy_ruthlessness: 0,
            asceticism_extravagance: 0,
            honesty_cunning: 0,
            tradition_novelty: 0,
            loyalty_ambition: 0,
            revelation_discretion: 0,
            preservation_transformation: 0,
            sacrifice_survival: 0,
            courage_prudence: 0,
          };
          const newCandidates = generateMovementCandidates(state.graph, actorId, currentLocId, profile);

          if (newCandidates.length > 0 && newCandidates[0].destinationId !== result.updatedState.destinationId) {
            // Compare: only switch if new candidate is significantly better (2x)
            const currentRemainingScore = scoreMovementCandidate(
              result.updatedState.motivationPull ?? newCandidates[0].motivationPull,
              result.updatedState.movementQueue.length,
            );

            if (newCandidates[0].score > currentRemainingScore * 2) {
              // Switch to new destination — pathfind from the NEXT graph node
              // (movementQueue[0]), not currentLocId which is the stale located_at.
              // Using located_at would teleport the agent back to their origin.
              const rerouteFromId = result.updatedState.movementQueue[0] ?? currentLocId;
              const graphPath = findShortestPath(state.graph, actorId, rerouteFromId, newCandidates[0].destinationId);

              if (graphPath) {
                // Build new movement state preserving current road hex progress.
                // Agent stays at their current hex and continues walking the
                // current road segment — only the downstream queue changes.
                const switchedState: MovementState = {
                  destinationId: newCandidates[0].destinationId,
                  movementQueue: [rerouteFromId, ...graphPath.path],
                  ticksAccumulated: result.updatedState.ticksAccumulated,
                  currentEdgeCost: result.updatedState.currentEdgeCost,
                  lastDecisionTick: state.tick,
                  movementHistory: result.updatedState.movementHistory,
                  motivationPull: newCandidates[0].motivationPull,
                  // Preserve current road traversal state
                  currentHexPosition: result.updatedState.currentHexPosition,
                  roadHexQueue: result.updatedState.roadHexQueue,
                  roadHexCost: result.updatedState.roadHexCost,
                  currentRoadType: result.updatedState.currentRoadType,
                  // Merge road segments: current + new path segments
                  roadSegments: [
                    ...(result.updatedState.roadSegments ?? []),
                    ...(graphPath.roadSegments ?? []).map(s => ({
                      fromId: s.fromId,
                      toId: s.toId,
                      roadType: s.roadType,
                      hexPath: s.hexPath.map(h => ({ col: h.col, row: h.row })),
                      discountedCost: s.discountedCost,
                    })),
                  ],
                };

                // Trace: reroute
                const oldDest = state.graph.getNode(result.updatedState.destinationId);
                const newDest = state.graph.getNode(newCandidates[0].destinationId);
                emitTrace({
                  category: 'movement',
                  tick: state.tick,
                  agentId: actorId,
                  agentName: actor.name,
                  event: 'reroute',
                  oldDestinationId: result.updatedState.destinationId,
                  oldDestinationName: oldDest?.name ?? '?',
                  destinationId: newCandidates[0].destinationId,
                  destinationName: newDest?.name ?? '?',
                  queueLength: switchedState.movementQueue.length,
                  summary: `${actor.name} reroutes from ${oldDest?.name ?? '?'} to ${newDest?.name ?? '?'}`,
                } as TraceEntry);

                // Timeline: REROUTE event (mid-path)
                appendEvent(actorId, {
                  phase: 'REROUTE',
                  tick: state.tick,
                  oldTarget: oldDest?.name ?? result.updatedState.destinationId,
                  newTarget: newDest?.name ?? newCandidates[0].destinationId,
                  reason: 'movement_reroute',
                });

                state.graph.updateNode(actorId, {
                  properties: { ...actor.properties, movementState: switchedState },
                });
                continue; // Skip the normal update below
              }
            }
          }

          // Update lastDecisionTick regardless of whether we switched
          result.updatedState.lastDecisionTick = state.tick;
          // Track motivation pull for future re-evaluations
          if (result.updatedState.motivationPull === undefined && newCandidates.length > 0) {
            result.updatedState.motivationPull = newCandidates[0].motivationPull;
          }
        }
      }

      continue; // Skip re-evaluation this tick
    }

    // --- Case 2: Agent arrived or has no movement yet ---
    // @deprecated — destination-picking is now handled by phaseAgentDecision.
    // This phase only executes existing movement queues (Case 1 above).
    // Skip agents with no active movement queue.
    {
      continue;
    }

    // Legacy destination-picking (generateMovementCandidates + computeBasePull)
    // removed — replaced by encounter-driven scoring in phaseAgentDecision.
   } catch (err) {
    events.push({
      id: nextEventId(state.tick),
      tick: state.tick,
      type: 'phase_error' as any,
      message: `Movement phase failed for ${actor.id}: ${err}`,
      significance: 0.8,
    });
    // Continue to next agent — don't crash the loop
   }
  }

  return {
    tickEvents: [...state.tickEvents, ...events],
  };
}
