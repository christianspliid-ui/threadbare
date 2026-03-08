/**
 * Ascendant Stat Feedback — records intervention history on the ascendant.
 *
 * When the player executes an intervention, the ascendant gains one count
 * in the corresponding intervention type history. This persists across cycles
 * and shapes the ascendant's "identity" over time.
 *
 * Two channels (currently implemented: 1):
 * 1. Intervention history increment (tracks how many times each type was used)
 * 2. [Future] Sphere affinity shift (+0.02 on the intervention's sphere)
 */

import type { WorldGraph } from './graph';
import type { InterventionType } from '../types/dream';
import type { SphereName } from '../types';
import { emitTrace } from './traceBuffer';

/**
 * Apply positive feedback to the ascendant after a successful intervention.
 * Currently increments intervention history; in the future, sphere affinity may shift.
 */
export function applyAscendantFeedback(
  graph: WorldGraph,
  ascendantId: string,
  interventionType: InterventionType,
  sphere: SphereName,
  tick: number = 0,
): void {
  const node = graph.getNode(ascendantId);
  if (!node) return;

  // Increment intervention history
  const history = (node.properties?.interventionHistory as Record<string, number>) ?? {};
  history[interventionType] = (history[interventionType] ?? 0) + 1;

  graph.updateNode(ascendantId, {
    properties: { interventionHistory: history },
  });

  emitTrace({
    category: 'intervention_effect',
    tick,
    agentId: ascendantId,
    summary: `Ascendant identity: +1 ${interventionType}`,
    interventionType,
    targetAgentId: ascendantId,
    targetAgentName: 'Ascendant',
    sphere,
    effects: [`interventionHistory.${interventionType} → ${history[interventionType]}`],
    consequenceMessage: `Ascendant identity shifts: +1 ${interventionType}`,
  });
}
