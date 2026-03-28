/**
 * Revelation Emitter — hooks that fire revelation events from engine phases.
 *
 * Three exported functions connect the revelation hook system (revelationHooks.ts)
 * to real game events: encounter observations, dilemma witnesses, and first-sighting
 * colocation reveals.
 *
 * All functions are fail-soft: errors are caught and logged via console.warn.
 * Revelation failures must never crash the tick loop (NFP #4).
 */

import type { GameState, TickEvent } from '../types/gameState';
import type { RevelationTrace, InteractionDepthTrace, TraceEntry } from '../types/trace';
import {
  DEPTH_ENCOUNTER_OBSERVED,
  DEPTH_DILEMMA,
  DEPTH_DIVINE_ACTION,
  DISPOSITION_DILEMMA_THRESHOLD,
} from '../types/agentKnowledge';
import {
  getOrCreateKnowledge,
  revealDomain,
  revealValue,
  revealDisposition,
  revealPossession,
  revealBond,
  revealAmbition,
  revealThreat,
} from './revelationHooks';
import { getAnyEncounterById } from '../data/encounter-content';
import { emitTrace } from './traceBuffer';

// ─── ID Generator ──────────────────────────────────────────────────

let revEventCounter = 0;
function nextRevEventId(): string {
  return `rev_evt_${++revEventCounter}`;
}

// ─── Constants ─────────────────────────────────────────────────────

/**
 * Maps reach domain to its primary axiological pair (for encounter value reveals).
 * NFP #1 Tunability: named constant, not inline strings.
 */
export const REACH_TO_VALUE_MAP: Record<string, string> = {
  iron:   'courage_prudence',
  gold:   'honesty_cunning',
  shadow: 'honesty_cunning',
  veil:   'mercy_ruthlessness',
  heart:  'mercy_ruthlessness',
  eye:    'honesty_cunning',
  stone:  'courage_prudence',
  star:   'mercy_ruthlessness',
  flesh:  'mercy_ruthlessness',
};

/** Significance for domain_revealed TickEvents */
const REVELATION_EVENT_SIGNIFICANCE = 0.3;

// ─── Avatar Location Helper ────────────────────────────────────────

/**
 * Find the avatar node for the given ascendantId.
 * Returns the avatar node ID, or undefined if none found.
 */
function getAvatarId(state: GameState): string | undefined {
  // Avatar is the actor node that has an 'avatar_of' edge pointing to the ascendant
  const allActors = state.graph.getNodesByType('actor')
    .filter(a => a.properties?.actorType === 'individual');

  for (const actor of allActors) {
    const avatarEdges = state.graph.getOutgoingEdges(actor.id, 'avatar_of');
    if (avatarEdges.some(e => e.target === state.ascendantId)) {
      return actor.id;
    }
  }
  return undefined;
}

/**
 * Get the location node ID of the actor (via located_at edge).
 */
function getActorLocationId(state: GameState, actorId: string): string | undefined {
  const locEdges = state.graph.getOutgoingEdges(actorId, 'located_at');
  return locEdges[0]?.target;
}

/**
 * Check if two actors are co-located (share the same location node).
 */
function areCoLocated(state: GameState, actorId: string, avatarId: string): boolean {
  const actorLocId = getActorLocationId(state, actorId);
  const avatarLocId = getActorLocationId(state, avatarId);
  if (!actorLocId || !avatarLocId) return false;
  return actorLocId === avatarLocId;
}

// ─── Emitter 1: Encounter Revelations ─────────────────────────────

/**
 * Called after encounter resolution in orchestrator.
 *
 * For each active encounter whose actor is co-located with the avatar:
 * - Reveals the encounter's reach domain on the agent's knowledge record
 * - Reveals the axiological value pair mapped from that reach
 * - Emits a 'domain_revealed' TickEvent for notification display
 * - Pushes RevelationTrace to traceBuffer
 * - Increments interactionDepth by DEPTH_ENCOUNTER_OBSERVED
 *
 * Fail-soft: errors caught and logged, never crash the tick loop.
 */
export function emitEncounterRevelations(state: GameState): void {
  try {
    if (!state.agentKnowledge) return;

    const avatarId = getAvatarId(state);
    if (!avatarId) return;

    const activeEncounters = state.encounterProgress.filter(p => p.status === 'active');

    for (const progress of activeEncounters) {
      try {
        const { actorId, encounterId } = progress;

        // Only process agents co-located with the avatar
        if (!areCoLocated(state, actorId, avatarId)) continue;

        // Find the reach domain for this encounter
        const encounterTemplate = getAnyEncounterById(encounterId);
        let reach = encounterTemplate?.reachPrimary;

        // Fallback: check if encounter ID contains a known reach domain name
        if (!reach) {
          const knownReaches = Object.keys(REACH_TO_VALUE_MAP);
          reach = knownReaches.find(r => encounterId.includes(r));
        }

        if (!reach) continue; // No reach info — skip

        const knowledge = getOrCreateKnowledge(state.agentKnowledge, actorId);
        const depthBefore = knowledge.interactionDepth;

        // Reveal domain
        const domainNewlyRevealed = revealDomain(knowledge, reach);

        // Reveal value pair mapped from reach
        const valuePairId = REACH_TO_VALUE_MAP[reach];
        const valueNewlyRevealed = valuePairId ? revealValue(knowledge, valuePairId) : false;

        // Increment interaction depth
        knowledge.interactionDepth += DEPTH_ENCOUNTER_OBSERVED;
        const depthAfter = knowledge.interactionDepth;

        // Emit TickEvent for newly revealed domain
        if (domainNewlyRevealed) {
          const agentNode = state.graph.getNode(actorId);
          const agentName = agentNode?.name ?? actorId;

          state.tickEvents.push({
            id: nextRevEventId(),
            tick: state.tick,
            type: 'domain_revealed' as TickEvent['type'],
            message: `${agentName}'s skill in ${reach} becomes apparent`,
            significance: REVELATION_EVENT_SIGNIFICANCE,
            actorId,
          });

          // Push RevelationTrace for domain reveal
          emitTrace({
            category: 'agent_revelation',
            tick: state.tick,
            agentId: actorId,
            facetType: 'domain',
            facetId: reach,
            source: 'encounter_observation',
            interactionDepthBefore: depthBefore,
            interactionDepthAfter: depthAfter,
            summary: `${agentName}: domain '${reach}' revealed via encounter observation`,
          } as Omit<RevelationTrace, 'id' | 'timestamp'>);
        }

        // Push RevelationTrace for value reveal (if newly revealed)
        if (valueNewlyRevealed && valuePairId) {
          const agentNode = state.graph.getNode(actorId);
          const agentName = agentNode?.name ?? actorId;

          emitTrace({
            category: 'agent_revelation',
            tick: state.tick,
            agentId: actorId,
            facetType: 'value',
            facetId: valuePairId,
            source: 'encounter_observation',
            interactionDepthBefore: depthBefore,
            interactionDepthAfter: depthAfter,
            summary: `${agentName}: value '${valuePairId}' revealed via encounter observation`,
          } as Omit<RevelationTrace, 'id' | 'timestamp'>);
        }

        // Push InteractionDepthTrace
        emitTrace({
          category: 'interaction_depth',
          tick: state.tick,
          agentId: actorId,
          source: 'encounter_observed',
          depthBefore,
          depthAfter,
          summary: `${actorId}: depth ${depthBefore.toFixed(2)} → ${depthAfter.toFixed(2)} (encounter observed)`,
        } as Omit<InteractionDepthTrace, 'id' | 'timestamp'>);

      } catch (innerErr) {
        console.warn('[revelationEmitter] emitEncounterRevelations inner error:', innerErr);
      }
    }
  } catch (err) {
    console.warn('[revelationEmitter] emitEncounterRevelations error:', err);
  }
}

// ─── Emitter 2: Dilemma Revelations ───────────────────────────────

/**
 * Called after dilemma detection in orchestrator.
 *
 * For each dilemma_resolved event this tick whose involved agents are
 * co-located with the avatar:
 * - Increments interactionDepth by DEPTH_DILEMMA
 * - Records a chronicle event (dilemma witness)
 * - If witnessed dilemma count >= DISPOSITION_DILEMMA_THRESHOLD, reveals disposition
 * - Pushes InteractionDepthTrace to traceBuffer
 *
 * Fail-soft: errors caught and logged, never crash the tick loop.
 */
export function emitDilemmaRevelations(state: GameState): void {
  try {
    if (!state.agentKnowledge) return;

    const avatarId = getAvatarId(state);
    if (!avatarId) return;

    // Find all dilemma_resolved events this tick
    const dilemmaEvents = state.tickEvents.filter(e => e.type === 'dilemma_resolved');
    if (dilemmaEvents.length === 0) return;

    // Get agents co-located with the avatar
    const avatarLocId = getActorLocationId(state, avatarId);
    if (!avatarLocId) return;

    const coLocatedAgentIds = new Set<string>();
    const allActors = state.graph.getNodesByType('actor')
      .filter(a => a.properties?.actorType === 'individual' && a.id !== avatarId);

    for (const actor of allActors) {
      const actorLocId = getActorLocationId(state, actor.id);
      if (actorLocId === avatarLocId) {
        coLocatedAgentIds.add(actor.id);
      }
    }

    if (coLocatedAgentIds.size === 0) return;

    for (const dilemmaEvent of dilemmaEvents) {
      try {
        const eventMessage = dilemmaEvent.message ?? '';

        // Find co-located agents mentioned in the dilemma event message
        for (const agentId of coLocatedAgentIds) {
          const agentNode = state.graph.getNode(agentId);
          if (!agentNode) continue;

          // Check if this agent is involved in the dilemma (name appears in message)
          if (!eventMessage.includes(agentNode.name)) continue;

          const knowledge = getOrCreateKnowledge(state.agentKnowledge, agentId);
          const depthBefore = knowledge.interactionDepth;

          // Record this dilemma as a witnessed event
          const dilemmaEventId = `dilemma_${dilemmaEvent.id}`;
          knowledge.knownEvents.add(dilemmaEventId);

          // Increment interaction depth
          knowledge.interactionDepth += DEPTH_DILEMMA;
          const depthAfter = knowledge.interactionDepth;

          // Count all witnessed dilemmas for this agent
          const witnessedDilemmaCount = Array.from(knowledge.knownEvents)
            .filter(id => id.startsWith('dilemma_')).length;

          // Reveal disposition if threshold reached
          if (witnessedDilemmaCount >= DISPOSITION_DILEMMA_THRESHOLD) {
            revealDisposition(knowledge);
          }

          // Push InteractionDepthTrace
          emitTrace({
            category: 'interaction_depth',
            tick: state.tick,
            agentId,
            source: 'dilemma',
            depthBefore,
            depthAfter,
            summary: `${agentId}: depth ${depthBefore.toFixed(2)} → ${depthAfter.toFixed(2)} (dilemma witnessed)`,
          } as Omit<InteractionDepthTrace, 'id' | 'timestamp'>);
        }
      } catch (innerErr) {
        console.warn('[revelationEmitter] emitDilemmaRevelations inner error:', innerErr);
      }
    }
  } catch (err) {
    console.warn('[revelationEmitter] emitDilemmaRevelations error:', err);
  }
}

// ─── Emitter 4: Divine Action Revelations ─────────────────────────

/**
 * Resolve a divine revelation action against the target agent.
 *
 * Called by phaseUnifiedActionProgress when a completed action has a
 * `revelationAction` metadata field. Dispatches to the correct revelation
 * behavior based on the action type string.
 *
 * Action types:
 * - 'observe': reveals the first unrevealed domain (fixed order), emits domain_revealed
 * - 'scry': reveals all 9 domains + all bonds (relates_to edges) + all possessions
 * - 'whisper_insight': reveals one value (by axiological weight) + sets dispositionRevealed
 * - 'dream_sending': reveals first pursues-edge ambition + sets threatRevealed
 *
 * All actions increment interactionDepth by DEPTH_DIVINE_ACTION and emit
 * RevelationTrace entries for each newly revealed facet.
 *
 * Fail-soft: errors caught and logged, never crash the tick loop (NFP #4).
 */
export function resolveRevelationAction(
  actionType: string,
  state: GameState,
  targetAgentId: string,
): void {
  try {
    if (!state.agentKnowledge) return;

    const knowledge = getOrCreateKnowledge(state.agentKnowledge, targetAgentId);
    const agentNode = state.graph.getNode(targetAgentId);
    const agentName = agentNode?.name ?? targetAgentId;
    const depthBefore = knowledge.interactionDepth;

    switch (actionType) {
      case 'observe': {
        // Reveal the first domain in canonical order that isn't yet revealed
        const DOMAIN_ORDER = ['iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star', 'flesh'];
        const unrevealed = DOMAIN_ORDER.find(d => !knowledge.revealedDomains.has(d));

        if (unrevealed) {
          revealDomain(knowledge, unrevealed);

          state.tickEvents.push({
            id: nextRevEventId(),
            tick: state.tick,
            type: 'domain_revealed' as TickEvent['type'],
            message: `${agentName}'s skill in ${unrevealed} becomes apparent through divine sight`,
            significance: REVELATION_EVENT_SIGNIFICANCE,
            actorId: targetAgentId,
          });

          emitTrace({
            category: 'agent_revelation',
            tick: state.tick,
            agentId: targetAgentId,
            facetType: 'domain',
            facetId: unrevealed,
            source: 'divine_action',
            interactionDepthBefore: depthBefore,
            interactionDepthAfter: knowledge.interactionDepth,
            summary: `${agentName}: domain '${unrevealed}' revealed via divine observe action`,
          } as Omit<RevelationTrace, 'id' | 'timestamp'>);
        }

        knowledge.interactionDepth += DEPTH_DIVINE_ACTION;

        emitTrace({
          category: 'interaction_depth',
          tick: state.tick,
          agentId: targetAgentId,
          source: 'divine_action',
          depthBefore,
          depthAfter: knowledge.interactionDepth,
          summary: `${targetAgentId}: depth ${depthBefore.toFixed(2)} → ${knowledge.interactionDepth.toFixed(2)} (observe divine action)`,
        } as Omit<InteractionDepthTrace, 'id' | 'timestamp'>);
        break;
      }

      case 'scry': {
        // Reveal ALL 9 domains
        const ALL_DOMAINS = ['iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star', 'flesh'];
        for (const domain of ALL_DOMAINS) {
          const newlyRevealed = revealDomain(knowledge, domain);
          if (newlyRevealed) {
            emitTrace({
              category: 'agent_revelation',
              tick: state.tick,
              agentId: targetAgentId,
              facetType: 'domain',
              facetId: domain,
              source: 'divine_action',
              interactionDepthBefore: depthBefore,
              interactionDepthAfter: knowledge.interactionDepth,
              summary: `${agentName}: domain '${domain}' revealed via scry`,
            } as Omit<RevelationTrace, 'id' | 'timestamp'>);
          }
        }

        // Reveal ALL bonds (relates_to edges)
        const bondEdges = state.graph.getOutgoingEdges(targetAgentId, 'relates_to');
        for (const edge of bondEdges) {
          try {
            const newlyRevealed = revealBond(knowledge, edge.target, 'divine');
            if (newlyRevealed) {
              emitTrace({
                category: 'agent_revelation',
                tick: state.tick,
                agentId: targetAgentId,
                facetType: 'bond',
                facetId: edge.target,
                source: 'divine_action',
                interactionDepthBefore: depthBefore,
                interactionDepthAfter: knowledge.interactionDepth,
                summary: `${agentName}: bond to '${edge.target}' revealed via scry`,
              } as Omit<RevelationTrace, 'id' | 'timestamp'>);
            }
          } catch (bondErr) {
            console.warn('[revelationEmitter] scry bond reveal error:', bondErr);
          }
        }

        // Reveal all hidden possessions (possesses edges)
        const possessionEdges = state.graph.getOutgoingEdges(targetAgentId, 'possesses');
        for (const edge of possessionEdges) {
          try {
            const newlyRevealed = revealPossession(knowledge, edge.target);
            if (newlyRevealed) {
              emitTrace({
                category: 'agent_revelation',
                tick: state.tick,
                agentId: targetAgentId,
                facetType: 'possession',
                facetId: edge.target,
                source: 'divine_action',
                interactionDepthBefore: depthBefore,
                interactionDepthAfter: knowledge.interactionDepth,
                summary: `${agentName}: possession '${edge.target}' revealed via scry`,
              } as Omit<RevelationTrace, 'id' | 'timestamp'>);
            }
          } catch (posErr) {
            console.warn('[revelationEmitter] scry possession reveal error:', posErr);
          }
        }

        state.tickEvents.push({
          id: nextRevEventId(),
          tick: state.tick,
          type: 'domain_revealed' as TickEvent['type'],
          message: `Divine sight pierces the veil around ${agentName}, revealing all`,
          significance: REVELATION_EVENT_SIGNIFICANCE,
          actorId: targetAgentId,
        });

        knowledge.interactionDepth += DEPTH_DIVINE_ACTION;

        emitTrace({
          category: 'interaction_depth',
          tick: state.tick,
          agentId: targetAgentId,
          source: 'divine_action',
          depthBefore,
          depthAfter: knowledge.interactionDepth,
          summary: `${targetAgentId}: depth ${depthBefore.toFixed(2)} → ${knowledge.interactionDepth.toFixed(2)} (scry divine action)`,
        } as Omit<InteractionDepthTrace, 'id' | 'timestamp'>);
        break;
      }

      case 'whisper_insight': {
        // Reveal one unrevealed value — pick the highest-weighted pair not yet revealed
        const axProfile = (agentNode?.properties?.axiologicalProfile ?? {}) as Record<string, number>;
        const unrevealedPairs = Object.entries(axProfile)
          .filter(([pairId]) => !knowledge.revealedValues.has(pairId))
          .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a)); // highest absolute weight first

        if (unrevealedPairs.length > 0) {
          const [pairId] = unrevealedPairs[0];
          revealValue(knowledge, pairId);

          state.tickEvents.push({
            id: nextRevEventId(),
            tick: state.tick,
            type: 'domain_revealed' as TickEvent['type'],
            message: `${agentName}'s ${pairId} nature whispers through the divine connection`,
            significance: REVELATION_EVENT_SIGNIFICANCE,
            actorId: targetAgentId,
          });

          emitTrace({
            category: 'agent_revelation',
            tick: state.tick,
            agentId: targetAgentId,
            facetType: 'value',
            facetId: pairId,
            source: 'divine_action',
            interactionDepthBefore: depthBefore,
            interactionDepthAfter: knowledge.interactionDepth,
            summary: `${agentName}: value '${pairId}' revealed via whisper insight`,
          } as Omit<RevelationTrace, 'id' | 'timestamp'>);
        }

        // Always reveal disposition
        revealDisposition(knowledge);

        knowledge.interactionDepth += DEPTH_DIVINE_ACTION;

        emitTrace({
          category: 'interaction_depth',
          tick: state.tick,
          agentId: targetAgentId,
          source: 'divine_action',
          depthBefore,
          depthAfter: knowledge.interactionDepth,
          summary: `${targetAgentId}: depth ${depthBefore.toFixed(2)} → ${knowledge.interactionDepth.toFixed(2)} (whisper insight divine action)`,
        } as Omit<InteractionDepthTrace, 'id' | 'timestamp'>);
        break;
      }

      case 'dream_sending': {
        // Reveal first ambition from pursues edges
        const pursuesEdges = state.graph.getOutgoingEdges(targetAgentId, 'pursues');
        if (pursuesEdges.length > 0) {
          const firstAmbitionId = pursuesEdges[0].target;
          const newlyRevealed = revealAmbition(knowledge, firstAmbitionId);

          if (newlyRevealed) {
            state.tickEvents.push({
              id: nextRevEventId(),
              tick: state.tick,
              type: 'domain_revealed' as TickEvent['type'],
              message: `${agentName} reveals their driving ambition in a divine dream`,
              significance: REVELATION_EVENT_SIGNIFICANCE,
              actorId: targetAgentId,
            });

            emitTrace({
              category: 'agent_revelation',
              tick: state.tick,
              agentId: targetAgentId,
              facetType: 'ambition',
              facetId: firstAmbitionId,
              source: 'divine_action',
              interactionDepthBefore: depthBefore,
              interactionDepthAfter: knowledge.interactionDepth,
              summary: `${agentName}: ambition '${firstAmbitionId}' revealed via dream sending`,
            } as Omit<RevelationTrace, 'id' | 'timestamp'>);
          }
        }

        // Always reveal threat status
        const threatNewlyRevealed = revealThreat(knowledge);
        if (threatNewlyRevealed) {
          state.tickEvents.push({
            id: nextRevEventId(),
            tick: state.tick,
            type: 'domain_revealed' as TickEvent['type'],
            message: `Through dreams, you glimpse what ${agentName} fears`,
            significance: REVELATION_EVENT_SIGNIFICANCE,
            actorId: targetAgentId,
          });
        }

        knowledge.interactionDepth += DEPTH_DIVINE_ACTION;

        emitTrace({
          category: 'interaction_depth',
          tick: state.tick,
          agentId: targetAgentId,
          source: 'divine_action',
          depthBefore,
          depthAfter: knowledge.interactionDepth,
          summary: `${targetAgentId}: depth ${depthBefore.toFixed(2)} → ${knowledge.interactionDepth.toFixed(2)} (dream sending divine action)`,
        } as Omit<InteractionDepthTrace, 'id' | 'timestamp'>);
        break;
      }

      default:
        console.warn(`[revelationEmitter] resolveRevelationAction: unknown actionType '${actionType}'`);
        break;
    }

  } catch (err) {
    console.warn('[revelationEmitter] resolveRevelationAction error:', err);
  }
}

// ─── Emitter 3: Colocation Revelations ────────────────────────────

/**
 * Called after colocation detection.
 *
 * For each agent co-located with the avatar for the first time (or still present):
 * - On first sighting: auto-reveal visible possession subcategories
 *   (arms, vestments, mounts_beasts)
 * - Auto-reveal faction bonds for agents sharing a faction with the avatar
 * - Pushes RevelationTrace for each newly revealed facet
 *
 * Fail-soft: errors caught and logged, never crash the tick loop.
 */
export function emitColocationRevelations(state: GameState): void {
  try {
    if (!state.agentKnowledge) return;

    const avatarId = getAvatarId(state);
    if (!avatarId) return;

    const avatarLocId = getActorLocationId(state, avatarId);
    if (!avatarLocId) return;

    // Get all actors co-located with avatar
    const allActors = state.graph.getNodesByType('actor')
      .filter(a => a.properties?.actorType === 'individual' && a.id !== avatarId);

    // Get avatar's faction memberships
    const avatarFactionIds = new Set(
      state.graph.getOutgoingEdges(avatarId, 'member_of').map(e => e.target),
    );

    for (const actor of allActors) {
      try {
        const actorLocId = getActorLocationId(state, actor.id);
        if (actorLocId !== avatarLocId) continue;

        const knowledge = getOrCreateKnowledge(state.agentKnowledge, actor.id);

        // ── Visible Possessions (arms, vestments, mounts_beasts) ──────────
        // Look for items carried by this actor via 'possesses' edges
        const carryEdges = state.graph.getOutgoingEdges(actor.id, 'possesses');
        for (const edge of carryEdges) {
          const itemNode = state.graph.getNode(edge.target);
          if (!itemNode) continue;

          const subcategory = itemNode.properties?.subcategory as string | undefined;
          if (!subcategory) continue;

          // Only auto-reveal visible subcategories
          if (!['arms', 'vestments', 'mounts_beasts'].includes(subcategory)) continue;

          const depthBefore = knowledge.interactionDepth;
          const newlyRevealed = revealPossession(knowledge, itemNode.id);

          if (newlyRevealed) {
            emitTrace({
              category: 'agent_revelation',
              tick: state.tick,
              agentId: actor.id,
              facetType: 'possession',
              facetId: itemNode.id,
              source: 'first_sighting',
              interactionDepthBefore: depthBefore,
              interactionDepthAfter: knowledge.interactionDepth,
              summary: `${actor.name}: possession '${itemNode.name ?? itemNode.id}' (${subcategory}) revealed on first sighting`,
            } as Omit<RevelationTrace, 'id' | 'timestamp'>);
          }
        }

        // ── Faction Bond Auto-Reveal ───────────────────────────────────────
        if (avatarFactionIds.size > 0) {
          const actorFactionEdges = state.graph.getOutgoingEdges(actor.id, 'member_of');

          for (const factionEdge of actorFactionEdges) {
            if (!avatarFactionIds.has(factionEdge.target)) continue;

            // Find faction co-members to reveal as bonds
            const factionMembers = state.graph
              .getIncomingEdges(factionEdge.target, 'member_of')
              .map(e => e.source)
              .filter(memberId => memberId !== actor.id && memberId !== avatarId);

            for (const coMemberId of factionMembers) {
              try {
                const depthBefore = knowledge.interactionDepth;
                const newlyRevealed = revealBond(knowledge, coMemberId, 'faction');

                if (newlyRevealed) {
                  emitTrace({
                    category: 'agent_revelation',
                    tick: state.tick,
                    agentId: actor.id,
                    facetType: 'bond',
                    facetId: coMemberId,
                    source: 'co_location',
                    interactionDepthBefore: depthBefore,
                    interactionDepthAfter: knowledge.interactionDepth,
                    summary: `${actor.name}: faction bond to '${coMemberId}' revealed via co-location`,
                  } as Omit<RevelationTrace, 'id' | 'timestamp'>);
                }
              } catch (bondErr) {
                console.warn('[revelationEmitter] bond reveal error:', bondErr);
              }
            }
          }
        }

      } catch (actorErr) {
        console.warn('[revelationEmitter] emitColocationRevelations actor error:', actorErr);
      }
    }
  } catch (err) {
    console.warn('[revelationEmitter] emitColocationRevelations error:', err);
  }
}
