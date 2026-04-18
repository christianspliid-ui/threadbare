/**
 * Complication Effects — THR-20
 *
 * Applies ComplicationEffect[] to GameState after complication selection.
 * Each effect kind is handled independently with fail-soft semantics.
 *
 * ─── Fail-soft ──────────────────────────────────────────────────────
 * | Failure case                          | Fallback                              |
 * |---------------------------------------|---------------------------------------|
 * | Actor node missing                    | Skip effect, continue                 |
 * | Location node missing                 | Skip location effects, continue       |
 * | Witness/faction target not found      | Skip edge/trust effects, continue     |
 * | Attachment template not found         | Skip attachment effect, continue      |
 * | doom state absent                     | Skip doom_micro_tick, continue        |
 * | Partial progress > 1                  | Clamp to 1.0                          |
 */

import type { ComplicationEffect, ComplicationContext } from '../types/complication';
import type { GameState, TickEvent } from '../types/gameState';

// ─── Effect application ───────────────────────────────────────────────────────

/**
 * Apply all complication effects from a selected ComplicationResult.
 * Mutates `state` in-place (matching the engine's mutation-in-place pattern).
 * Returns any TickEvents that should be appended to the event stream.
 */
export function applyComplicationEffects(
  effects: readonly ComplicationEffect[],
  ctx: ComplicationContext,
  state: GameState,
  tick: number,
  complicationName: string,
): TickEvent[] {
  const events: TickEvent[] = [];

  for (const effect of effects) {
    try {
      applyEffect(effect, ctx, state, tick, complicationName, events);
    } catch {
      // Fail-soft: each effect is independent; one failure doesn't block others
    }
  }

  return events;
}

function applyEffect(
  effect: ComplicationEffect,
  ctx: ComplicationContext,
  state: GameState,
  tick: number,
  complicationName: string,
  events: TickEvent[],
): void {
  // Actor-independent effects first — these must not be gated by actorNode presence
  if (effect.type === 'sphere_pressure') {
    if (!state.worldSoul) return;
    const current = state.worldSoul.spherePressures?.[effect.sphere] ?? 0;
    state.worldSoul.spherePressures = {
      ...state.worldSoul.spherePressures,
      [effect.sphere]: current + effect.magnitude,
    };
    return;
  }
  if (effect.type === 'rival_awareness') {
    for (const rivalState of state.rivalStates) {
      const current = (rivalState.agentAwareness ?? {})[ctx.action.actorId] ?? 0;
      rivalState.agentAwareness = {
        ...rivalState.agentAwareness,
        [ctx.action.actorId]: Math.min(1, current + effect.delta),
      };
    }
    return;
  }
  if (effect.type === 'partial_progress') return;

  const actorNode = state.graph.getNode(ctx.action.actorId);
  if (!actorNode) return;

  switch (effect.type) {
    case 'attachment': {
      // Attach a condition to the actor — similar to existing attachment creation
      // Store as a condition property on the actor node for engine lookup
      const attachments = (actorNode.properties.activeAttachmentIds as string[] | undefined) ?? [];
      if (!attachments.includes(effect.templateId)) {
        actorNode.properties.activeAttachmentIds = [...attachments, effect.templateId];
        actorNode.properties[`attachment_${effect.templateId}_expiresAt`] = tick + effect.duration;
      }
      break;
    }

    case 'trust_decay': {
      let targetId: string | undefined;
      if (effect.target === 'random_present' && ctx.presentAgentIds.length > 0) {
        const idx = Math.floor(ctx.rng() * ctx.presentAgentIds.length);
        targetId = ctx.presentAgentIds[idx];
      } else if (effect.target === 'faction_leader' && ctx.factionIds.length > 0) {
        // Find the highest-ranked faction node
        const factionEdges = state.graph.getOutgoingEdges(ctx.action.actorId, 'member_of');
        if (factionEdges.length > 0) {
          const memberEdges = state.graph.getIncomingEdges(factionEdges[0].target, 'member_of');
          // Pick edge with highest rank
          let bestRank = -1;
          for (const e of memberEdges) {
            const rank = (e.properties?.rank as number) ?? 0;
            if (rank > bestRank) {
              bestRank = rank;
              targetId = e.source;
            }
          }
        }
      }
      if (!targetId || targetId === ctx.action.actorId) break;

      // Find existing relates_to edge
      const relEdges = state.graph.getOutgoingEdges(ctx.action.actorId, 'relates_to')
        .filter(e => e.target === targetId);
      if (relEdges.length > 0) {
        const current = typeof relEdges[0].properties?.trust === 'number'
          ? relEdges[0].properties.trust : 0.5;
        relEdges[0].properties = {
          ...relEdges[0].properties,
          trust: Math.max(0, current - effect.magnitude),
        };
      }
      break;
    }

    case 'reputation_delta': {
      const current = typeof actorNode.properties.reputationScore === 'number'
        ? actorNode.properties.reputationScore : 0;
      actorNode.properties.reputationScore = Math.max(0, Math.min(1, current + effect.delta));
      break;
    }

    case 'unrest_delta': {
      if (!ctx.locationId) break;
      const locationNode = state.graph.getNode(ctx.locationId);
      if (!locationNode) break;
      const current = typeof locationNode.properties.unrest === 'number'
        ? locationNode.properties.unrest : 0;
      locationNode.properties.unrest = Math.max(0, Math.min(100, current + effect.delta));
      break;
    }

    case 'prosperity_delta': {
      if (!ctx.locationId) break;
      const locationNode = state.graph.getNode(ctx.locationId);
      if (!locationNode) break;
      const current = typeof locationNode.properties.prosperity === 'number'
        ? locationNode.properties.prosperity : 50;
      locationNode.properties.prosperity = Math.max(0, Math.min(100, current + effect.delta));
      break;
    }

    case 'doom_micro_tick': {
      if (!state.doomClock) break;
      // Advance doom clock by a fractional tick amount
      state.doomClock = {
        ...state.doomClock,
        currentTick: state.doomClock.currentTick + effect.magnitude,
      };
      break;
    }

    case 'relates_to_create': {
      let targetId: string | undefined;
      if (effect.targetSelection === 'random_present' && ctx.presentAgentIds.length > 0) {
        const idx = Math.floor(ctx.rng() * ctx.presentAgentIds.length);
        targetId = ctx.presentAgentIds[idx];
      } else if (effect.targetSelection === 'faction' && ctx.factionIds.length > 0) {
        // Link to faction leader (first member with highest rank)
        const factionEdges = state.graph.getOutgoingEdges(ctx.action.actorId, 'member_of');
        if (factionEdges.length > 0) {
          const memberEdges = state.graph.getIncomingEdges(factionEdges[0].target, 'member_of');
          let bestRank = -1;
          for (const e of memberEdges) {
            const rank = (e.properties?.rank as number) ?? 0;
            if (rank > bestRank && e.source !== ctx.action.actorId) {
              bestRank = rank;
              targetId = e.source;
            }
          }
        }
      }
      if (!targetId || targetId === ctx.action.actorId) break;

      // Check if edge already exists; create only if absent
      const existingEdge = state.graph.getOutgoingEdges(ctx.action.actorId, 'relates_to')
        .find(e => e.target === targetId);
      if (!existingEdge) {
        state.graph.addEdge({
          source: ctx.action.actorId,
          target: targetId,
          type: 'relates_to',
          properties: { basis: effect.basis, createdAtTick: tick, origin: 'complication' },
        });
      }
      break;
    }

    case 'quintessence_delta': {
      if (state.pendingQuintessenceEvents) {
        state.pendingQuintessenceEvents.push({
          targetNodeId: ctx.action.actorId,
          delta: effect.delta,
          source: 'complication',
          tick,
        });
      }
      break;
    }

    case 'discovery': {
      // Plant a simple information discovery tick event
      events.push({
        id: `complication_discovery_${tick}_${ctx.action.actorId}`,
        tick,
        type: 'complication',
        message: `${actorNode.name ?? 'An agent'} discovered something unexpected.`,
        significance: 0.4,
        actorId: ctx.action.actorId,
        hexCoords: undefined,
      });
      break;
    }
  }
}
