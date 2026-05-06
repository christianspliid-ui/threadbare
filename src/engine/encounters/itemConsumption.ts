import type { WorldGraph } from '../graph';
import type { ItemConsumedByChoiceTrace } from '../../types/traces/encounter-traces';

export interface ItemConsumptionContext {
  encounterId: string;
  beatIndex: number;
  tick: number;
}

export interface ItemConsumptionResult {
  consumed: boolean;
  trace: ItemConsumedByChoiceTrace | null;
}

/**
 * Atomically removes the `possesses` edge from agentId to itemId on choice resolution.
 * Fail-soft: if the edge is absent, logs a warning and returns consumed=false without throwing.
 *
 * Mutates the graph in place (matching the WorldGraph mutation model).
 */
export function consumeItemForChoice(
  graph: WorldGraph,
  agentId: string,
  itemId: string,
  ctx: ItemConsumptionContext,
): ItemConsumptionResult {
  const possessesEdges = graph.getOutgoingEdges(agentId, 'possesses');
  const edge = possessesEdges.find((e) => e.target === itemId);

  if (!edge) {
    console.warn(
      `[itemConsumption] Agent ${agentId} does not possess item ${itemId} at encounter ${ctx.encounterId} beat ${ctx.beatIndex} — skipping consumption.`,
    );
    return { consumed: false, trace: null };
  }

  graph.removeEdge(edge.id);

  const trace: ItemConsumedByChoiceTrace = {
    category: 'item_consumed_by_choice',
    tick: ctx.tick,
    encounterId: ctx.encounterId,
    beatIndex: ctx.beatIndex,
    agentId,
    itemId,
  };

  return { consumed: true, trace };
}
