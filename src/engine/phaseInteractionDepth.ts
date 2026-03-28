/**
 * Phase: Interaction Depth Accumulator (Phase 2.76)
 *
 * Runs each tick after Phase 2.75 (Familiarity Gain). Updates interactionDepth
 * and coLocationTicks for all agents relative to the ascendant's avatar.
 *
 * Two accumulation sources per tick:
 *   1. Co-location — agent is at the same hex as the avatar
 *   2. Faction ambient — agent shares a faction with the avatar
 *
 * Uses agentKnowledge map from GameState (lazily initialized via getOrCreateKnowledge).
 * Emits InteractionDepthTrace to the trace buffer for each agent updated.
 *
 * NFP #4 (Fail-soft): If avatar hex position cannot be determined, returns early
 * with no changes. Missing knowledge entries are created on first access.
 */

import type { GameState } from '../types/gameState';
import type { WorldGraph } from './graph';
import {
  DEPTH_COLOCATION_PER_TICK,
  DEPTH_FACTION_PER_TICK,
} from '../types/agentKnowledge';
import { getOrCreateKnowledge } from './revelationHooks';
import { emitTrace } from './traceBuffer';
import { getAvatarHexPosition } from './visibility';

// ─── Avatar Lookup ────────────────────────────────────────────────

/**
 * Get the avatar's agent ID from the ascendant's incoming avatar_of edges.
 * Returns undefined if no avatar is found (fail-soft).
 */
function getAvatarId(graph: WorldGraph, ascendantId: string): string | undefined {
  const avatarEdges = graph.getIncomingEdges(ascendantId, 'avatar_of');
  return avatarEdges.length > 0 ? avatarEdges[0].source : undefined;
}

/**
 * Get all faction IDs the given agent belongs to (via member_of edges).
 */
function getAgentFactionIds(graph: WorldGraph, agentId: string): Set<string> {
  const memberEdges = graph.getOutgoingEdges(agentId, 'member_of');
  const factionIds = new Set<string>();
  for (const edge of memberEdges) {
    factionIds.add(edge.target);
  }
  return factionIds;
}

// ─── Phase Function ───────────────────────────────────────────────

/**
 * Phase 2.76: Interaction Depth — accumulate interactionDepth and coLocationTicks.
 *
 * Mutates state.agentKnowledge in place (consistent with GameState mutation pattern
 * used by other knowledge map phases like phaseFamiliarityGain).
 *
 * @param state - Current game state (agentKnowledge mutated in place)
 */
export function phaseInteractionDepth(state: GameState): void {
  const { graph, ascendantId, agentKnowledge, tick } = state;

  // ── Find avatar position (fail-soft: skip if missing) ─────────────
  const avatarHex = getAvatarHexPosition(graph, ascendantId);
  if (!avatarHex) return;

  const avatarId = getAvatarId(graph, ascendantId);
  if (!avatarId) return;

  // ── Get avatar's faction memberships ──────────────────────────────
  const avatarFactions = getAgentFactionIds(graph, avatarId);

  // ── Process each individual actor (not the avatar itself) ─────────
  const actors = graph.getNodesByType('actor')
    .filter(a => a.properties?.actorType === 'individual' && a.id !== avatarId);

  for (const actor of actors) {
    // ── Co-location check ─────────────────────────────────────────
    const locEdges = graph.getOutgoingEdges(actor.id, 'located_at');
    let isCoLocated = false;

    if (locEdges.length > 0) {
      const locNode = graph.getNode(locEdges[0].target);
      const actorHexCol = locNode?.properties?.hexCol as number | undefined;
      const actorHexRow = locNode?.properties?.hexRow as number | undefined;
      isCoLocated = actorHexCol === avatarHex.col && actorHexRow === avatarHex.row;
    }

    // ── Faction ambient check ──────────────────────────────────────
    let sharesFacton = false;
    if (avatarFactions.size > 0) {
      const actorFactions = getAgentFactionIds(graph, actor.id);
      for (const factionId of actorFactions) {
        if (avatarFactions.has(factionId)) {
          sharesFacton = true;
          break;
        }
      }
    }

    // ── Apply depth accumulation ───────────────────────────────────
    if (isCoLocated) {
      const knowledge = getOrCreateKnowledge(agentKnowledge, actor.id);
      const depthBefore = knowledge.interactionDepth;

      knowledge.coLocationTicks += 1;
      knowledge.interactionDepth += DEPTH_COLOCATION_PER_TICK;

      emitTrace({
        tick,
        category: 'interaction_depth',
        agentId: actor.id,
        summary: `${actor.name} co-location depth: ${depthBefore.toFixed(3)} → ${knowledge.interactionDepth.toFixed(3)}`,
        source: 'co_location',
        depthBefore,
        depthAfter: knowledge.interactionDepth,
      });
    }

    if (sharesFacton) {
      const knowledge = getOrCreateKnowledge(agentKnowledge, actor.id);
      const depthBefore = knowledge.interactionDepth;

      knowledge.interactionDepth += DEPTH_FACTION_PER_TICK;

      emitTrace({
        tick,
        category: 'interaction_depth',
        agentId: actor.id,
        summary: `${actor.name} faction ambient depth: ${depthBefore.toFixed(3)} → ${knowledge.interactionDepth.toFixed(3)}`,
        source: 'faction_ambient',
        depthBefore,
        depthAfter: knowledge.interactionDepth,
      });
    }
  }
}
