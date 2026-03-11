/**
 * Condition Decay — tick-based removal of transient conditions.
 *
 * Called once per tick. Decrements ticksRemaining on all has_trait edges
 * that have a numeric ticksRemaining. Removes edges that reach 0.
 *
 * Pure function over graph state. Returns removed conditions for tracing.
 */

import type { WorldGraph } from './graph';

export interface RemovedCondition {
  edgeId: string;
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
