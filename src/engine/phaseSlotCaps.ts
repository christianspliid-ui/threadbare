/**
 * Phase: Slot Cap Enforcement.
 *
 * Runs after reward-granting phases and before systems that should
 * observe the post-enforcement active set. Iterates all spotlight actors,
 * enforces possession slot caps (deactivating overflow), then handles
 * condition overflow consequences.
 *
 * Includes a fixed-point loop for cascade deactivation: if deactivating
 * a slot-expanding item shrinks another slot's cap, re-evaluate.
 *
 * Design doc: Docs/plans/2026-04-06-attachment-slot-system-design.md
 */

import type { GameState } from '../types/gameState';
import type { WorldGraph } from './graph';
import {
  collectAgentAttachmentInventory,
  computeEffectiveSlotCaps,
  enforcePossessionSlotCaps,
  findConditionOverflows,
} from './attachmentSlotResolver';
import { resolveConditionOverflow } from './conditionOverflow';
import { MAX_DEACTIVATION_CASCADES, OVERFLOW_DISPOSAL_TIMEOUT_TICKS } from '../data/attachment-slot-constants';
import { emitTrace } from './traceBuffer';
import { mulberry32 } from '../lib/prng';

/**
 * Enforce slot caps for all spotlight actors.
 * Mutates the graph (sets active: false on overflowing edges).
 * Emits slot_overflow, condition_overflow, and slot_expansion traces.
 */
export function phaseSlotCaps(state: GameState): void {
  const { graph, tick, seed } = state;
  const effectStates = state.effectStates;

  // Get all individual spotlight actors
  const actors = graph.getNodesByType('actor').filter(
    (n) => n.properties.actorType === 'individual'
      && (n.properties.spotlightTier ?? 'spotlight') === 'spotlight',
  );

  const rng = mulberry32(seed * 7919 + tick * 131);

  for (const actor of actors) {
    enforceSlotCapsForAgent(graph, actor.id, tick, effectStates, rng);
  }
}

function enforceSlotCapsForAgent(
  graph: WorldGraph,
  agentId: string,
  tick: number,
  effectStates: Map<string, import('../types/effects').EffectRuntimeState> | undefined,
  rng: () => number,
): void {
  let cascadeCount = 0;
  let hadOverflow = true;

  // Fixed-point loop: deactivating a slot-expander may shrink another slot's cap
  while (hadOverflow && cascadeCount < MAX_DEACTIVATION_CASCADES) {
    hadOverflow = false;
    cascadeCount++;

    const inventory = collectAgentAttachmentInventory(graph, agentId);
    const effectiveCaps = computeEffectiveSlotCaps(graph, agentId, effectStates);

    // ─── Possession/agreement slot enforcement ───
    const patches = enforcePossessionSlotCaps(inventory, effectiveCaps, Math.floor(rng() * 0x7FFFFFFF));

    for (const patch of patches) {
      hadOverflow = true;

      // Apply deactivation to the graph edge
      graph.updateEdge(patch.edgeId, {
        properties: {
          active: false,
          inactiveReason: 'slot_overflow',
          overflowTick: tick,
        },
      });

      // Emit trace
      const activeCount = inventory.filter(
        i => i.slotTag === patch.slotTag && i.active && !i.isPinned && i.kind !== 'condition',
      ).length;

      emitTrace({
        tick,
        category: 'slot_overflow',
        agentId,
        summary: `Deactivated ${patch.name} — ${patch.reason}`,
        slotTag: patch.slotTag,
        currentCount: activeCount,
        effectiveCap: effectiveCaps[patch.slotTag] ?? 0,
        deactivatedItemId: patch.attachmentId,
        deactivatedItemName: patch.name,
      });
    }
  }

  // ─── Condition overflow handling ───
  const inventory = collectAgentAttachmentInventory(graph, agentId);
  const effectiveCaps = computeEffectiveSlotCaps(graph, agentId, effectStates);
  const condOverflows = findConditionOverflows(inventory, effectiveCaps);

  for (const overflow of condOverflows) {
    const roll = rng();
    const result = resolveConditionOverflow(
      overflow.slotTag,
      overflow.count,
      overflow.cap,
      overflow.items,
      agentId,
      roll,
    );

    if (!result) continue;

    // If the overflow result says to remove an edge (e.g. oldest blessing fades)
    if (result.removeEdgeId) {
      try {
        graph.updateEdge(result.removeEdgeId, {
          properties: {
            active: false,
            inactiveReason: `condition_overflow_${result.event}`,
            overflowTick: tick,
          },
        });
      } catch {
        // Edge may not exist — fail soft
      }
    }

    emitTrace({
      tick,
      category: 'condition_overflow',
      agentId,
      summary: `${overflow.slotTag} overflow — ${result.event}: ${result.outcome}`,
      conditionSlot: overflow.slotTag,
      currentCount: overflow.count,
      cap: overflow.cap,
      overflowEvent: result.event,
      outcome: result.outcome,
      consequenceTraitId: result.consequenceTraitId,
    });
  }
}

/**
 * Check for items that have been inactive beyond the disposal timeout
 * and drop them (remove the edge). Called from the enforcement phase.
 */
export function phaseDisposalTimeout(state: GameState): void {
  const { graph, tick } = state;

  const actors = graph.getNodesByType('actor').filter(
    (n) => n.properties.actorType === 'individual'
      && (n.properties.spotlightTier ?? 'spotlight') === 'spotlight',
  );

  for (const actor of actors) {
    const inventory = collectAgentAttachmentInventory(graph, actor.id);

    for (const item of inventory) {
      if (item.active) continue;
      if (item.kind === 'condition') continue; // conditions don't get dropped
      if (item.isPinned) continue;

      const overflowTick = item.overflowTick ?? 0;
      if (tick - overflowTick >= OVERFLOW_DISPOSAL_TIMEOUT_TICKS) {
        // Drop the item
        try {
          graph.removeEdge(item.edgeId);
        } catch {
          // Edge already removed — fail soft
        }

        emitTrace({
          tick,
          category: 'slot_disposal',
          agentId: actor.id,
          summary: `Dropped ${item.name} — overflow timeout`,
          slotTag: item.slotTag,
          itemId: item.attachmentId,
          itemName: item.name,
          method: 'drop' as const,
        });
      }
    }
  }
}
