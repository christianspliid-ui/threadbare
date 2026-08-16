/**
 * Condition Decay — tick-based removal of transient conditions.
 *
 * Called once per tick. Decrements ticksRemaining on all has_trait edges
 * that have a numeric ticksRemaining. Removes edges that reach 0.
 *
 * Pure function over graph state. Returns removed conditions for tracing.
 *
 * ─── Carrier-agnostic by construction (THR-1143) ─────────────────
 * The loop walks `has_trait` **by edge type**, never by source node kind, so a
 * condition on a place expires through exactly this path and no second one — the
 * THR-761 invariant that there is one tick-driven expiry path. THR-1143 planned
 * a "widening" here and found none was needed; what it did change is the shape of
 * the result, which called every carrier `agentId` and so misreported a closed
 * pass as an agent. `carrierId` is the honest name and `agentId` is kept as a
 * deprecated alias so the existing readers are untouched.
 */

import type { WorldGraph } from './graph';

export interface RemovedCondition {
  edgeId: string;
  /**
   * The node the condition sat on — an agent, or (THR-1143) a location, faction
   * or sublocation. Prefer this over `agentId`.
   */
  carrierId: string;
  /** @deprecated Misnomer once places could carry conditions. Same value as `carrierId`. */
  agentId: string;
  traitId: string;
  traitName: string;
  tick: number;
}

/**
 * Decay all condition trait edges by one tick.
 * Returns list of conditions that expired and were removed.
 */
export function decayConditions(
  graph: WorldGraph,
  tick: number,
): RemovedCondition[] {
  const removed: RemovedCondition[] = [];
  const traitEdges = graph.getEdgesByType('has_trait');

  for (const edge of traitEdges) {
    const remaining = edge.properties.ticksRemaining;

    // Skip edges without tick-based decay
    if (remaining === undefined || remaining === null) continue;
    if (typeof remaining !== 'number') continue;

    const newRemaining = remaining - 1;

    if (newRemaining <= 0) {
      const traitNode = graph.getNode(edge.target);
      removed.push({
        edgeId: edge.id,
        carrierId: edge.source,
        agentId: edge.source,
        traitId: edge.target,
        traitName: traitNode?.name ?? edge.target,
        tick,
      });
      graph.removeEdge(edge.id);
    } else {
      graph.updateEdge(edge.id, {
        properties: { ...edge.properties, ticksRemaining: newRemaining },
      });
    }
  }

  return removed;
}
