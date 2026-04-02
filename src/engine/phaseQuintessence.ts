/**
 * Quintessence tick phase — processes accumulated erosion/recovery events,
 * applies passive regeneration, and handles zero-state dissolution.
 *
 * Orchestrator position: after phaseSpherePressure (~9.7), before phaseSphereAggregation.
 *
 * Design: Docs/plans/2026-03-28-cosmological-symmetry-refactor.md (TB-075)
 * Implemented: Phase 12, Plan 03
 */

import type { GameState, TickEvent } from '../types/gameState';
import {
  QUINTESSENCE_PASSIVE_REGEN,
  QUINTESSENCE_DEFAULT,
  QUINTESSENCE_MAX_DEFAULT,
  QUINTESSENCE_THRESHOLDS,
  ZERO_STATE_RULES,
  getQuintessenceThresholdState,
} from '../types/quintessence';
import type { QuintessenceThresholdState } from '../types/resolution';
import type { NodeType } from '../types/graph';
import type { SimulationRuntime } from './simulationRuntime';
import { recordBalanceEvent } from './balanceTelemetry';

/**
 * Node types that can carry quintessence.
 * Only actor and location nodes are initialized with quintessence in gameInit.ts.
 */
const QUINTESSENCE_NODE_TYPES: NodeType[] = ['actor', 'location'];

/**
 * Consume all pending QuintessenceEvents, apply passive regen, and check for dissolution.
 *
 * Steps:
 * 1. Accumulate deltas per target from pendingQuintessenceEvents
 * 2. Apply accumulated deltas (clamped 0-1)
 * 3. Passive regeneration for all entities with quintessence in (0, 1.0)
 * 4. Zero-state dissolution check — emit dissolution_event TickEvent
 * 5. Clear pendingQuintessenceEvents
 *
 * Fail-soft: missing quintessence defaults to 1.0; unknown node IDs are skipped.
 * Graph nodes are mutated via updateNode following the established pattern in this codebase.
 */
export function phaseQuintessence(state: GameState, runtime?: SimulationRuntime): Partial<GameState> {
  const events = state.pendingQuintessenceEvents ?? [];
  const newTickEvents: TickEvent[] = [...state.tickEvents];
  const graph = state.graph;

  // ── Step 1: Accumulate deltas per target ─────────────────────────────
  const deltaMap = new Map<string, number>();
  for (const evt of events) {
    deltaMap.set(evt.targetNodeId, (deltaMap.get(evt.targetNodeId) ?? 0) + evt.delta);
  }

  // ── Step 2: Apply accumulated deltas ─────────────────────────────────
  for (const [nodeId, totalDelta] of deltaMap) {
    const node = graph.getNode(nodeId);
    if (!node) continue; // fail-soft: unknown node

    const current = (node.properties.quintessence ?? QUINTESSENCE_DEFAULT) as number;
    const max = (node.properties.quintessenceMax ?? QUINTESSENCE_MAX_DEFAULT) as number;
    const updated = Math.max(0, Math.min(max, current + totalDelta));

    // Phase 2: Capture threshold state before and after for transition detection
    const stateBefore = getQuintessenceThresholdState(node);
    graph.updateNode(nodeId, { properties: { quintessence: updated } });
    const nodeAfter = graph.getNode(nodeId);
    const stateAfter = nodeAfter ? getQuintessenceThresholdState(nodeAfter) : stateBefore;

    // Balance telemetry: quintessence_changed (from pending events — player/encounter driven)
    if (runtime && totalDelta !== 0) {
      recordBalanceEvent(runtime, {
        tick: state.tick,
        kind: 'quintessence_changed',
        agentId: nodeId,
        sourceSystem: 'quintessence',
        quintessenceBefore: current,
        quintessenceAfter: updated,
        quintessenceDelta: updated - current,
        quintessenceReason: 'pending_event',
      });
    }

    // Phase 2: Emit threshold transition telemetry when state changes
    if (runtime && stateAfter !== stateBefore) {
      recordBalanceEvent(runtime, {
        tick: state.tick,
        kind: 'state_transition',
        agentId: nodeId,
        sourceSystem: 'quintessence',
        transitionType: `threshold_${stateBefore}_to_${stateAfter}`,
        quintessenceAfter: updated,
      });
    }
  }

  // ── Step 3 & 4: Passive regen + dissolution check ────────────────────
  // Iterate all quintessence-bearing node types (actor, location)
  for (const nodeType of QUINTESSENCE_NODE_TYPES) {
    const nodes = graph.getNodesByType(nodeType);
    for (const node of nodes) {
      // Only process nodes that have quintessence set (initialized entities)
      if (node.properties.quintessence == null) continue;

      let q = node.properties.quintessence as number;
      const max = (node.properties.quintessenceMax ?? QUINTESSENCE_MAX_DEFAULT) as number;

      // Phase 2: Passive regen toward quintessenceMax (not fixed 1.0)
      if (q > QUINTESSENCE_THRESHOLDS.DISSOLUTION && q < max) {
        const qBefore = q;
        q = Math.min(max, q + QUINTESSENCE_PASSIVE_REGEN);
        graph.updateNode(node.id, { properties: { quintessence: q } });

        // Phase 2 fix: Emit telemetry for passive regen so recovery metrics are accurate.
        // Without this, quintessence_recovery_per_100_ticks only counts event-driven gains.
        if (runtime && q !== qBefore) {
          recordBalanceEvent(runtime, {
            tick: state.tick,
            kind: 'quintessence_changed',
            agentId: node.id,
            sourceSystem: 'quintessence',
            quintessenceBefore: qBefore,
            quintessenceAfter: q,
            quintessenceDelta: q - qBefore,
            quintessenceReason: 'passive_regen',
          });
        }
      }

      // Dissolution check (after regen — regen does not rescue entities already at 0)
      if (q <= QUINTESSENCE_THRESHOLDS.DISSOLUTION) {
        // Re-read from graph after potential regen update
        const updatedNode = graph.getNode(node.id)!;
        const finalQ = updatedNode.properties.quintessence as number;
        if (finalQ <= QUINTESSENCE_THRESHOLDS.DISSOLUTION) {
          const category = (node.type as string) ?? 'default';
          const rule = ZERO_STATE_RULES[category] ?? ZERO_STATE_RULES['default'];
          const nodeName = (node.name ?? node.id) as string;
          newTickEvents.push({
            id: `dissolution_${node.id}_t${state.tick}`,
            type: 'dissolution_event',
            tick: state.tick,
            message: `${nodeName} has dissolved. Rule: ${rule}`,
            significance: 1.0,
          });
          // Mark as dissolved — do not remove from graph (fail-soft: let downstream handle)
          graph.updateNode(node.id, { properties: { dissolved: true } });

          // Balance telemetry: state_transition (dissolution)
          if (runtime) {
            recordBalanceEvent(runtime, {
              tick: state.tick,
              kind: 'state_transition',
              agentId: node.id,
              sourceSystem: 'quintessence',
              transitionType: 'dissolved',
              quintessenceAfter: finalQ,
            });
          }
        }
      }
    }
  }

  return {
    tickEvents: newTickEvents,
    pendingQuintessenceEvents: [],
  };
}
