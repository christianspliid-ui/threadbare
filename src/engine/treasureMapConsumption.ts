/**
 * Treasure Map Consumption — removes consumable possessions when their
 * trigger event fires.
 *
 * When a hidden site is discovered, agents at the hex who hold possessions
 * with `consumeOnEvent: 'hidden_site_discovered'` have those possessions
 * consumed (removed from graph). Only the first matching possession per
 * agent is consumed per discovery.
 *
 * NFP compliance:
 *   #1 Tunability: consumeOnEvent is data-driven on PossessionNodeProperties
 *   #2 Inspectability: emits trace per consumption + player-facing TickEvent
 *   #3 Determinism: iterates agents in graph order, consumes first match
 *   #4 Fail-soft: missing nodes/edges → skip silently
 */
import type { WorldGraph } from './graph';
import type { TickEvent } from '../types/gameState';
import { emitTrace } from './traceBuffer';

/**
 * Find and consume treasure maps (or similar consumable possessions) at a hex.
 *
 * @param graph WorldGraph (mutated — edges and nodes removed)
 * @param col Hex column
 * @param row Hex row
 * @param tick Current tick
 * @param eventType The event type that triggers consumption
 * @returns TickEvents for each consumed item
 */
export function consumeTreasureMapsAtHex(
  graph: WorldGraph,
  col: number,
  row: number,
  tick: number,
  eventType: string,
): TickEvent[] {
  const events: TickEvent[] = [];

  // Find agents at this hex (via locations at hex → agents at locations)
  const locations = graph.getNodesByType('location').filter(n =>
    n.properties.hexCol === col && n.properties.hexRow === row,
  );

  const agentIds = new Set<string>();
  for (const loc of locations) {
    const locatedEdges = graph.getIncomingEdges(loc.id, 'located_at');
    for (const edge of locatedEdges) {
      const node = graph.getNode(edge.source);
      if (node?.type === 'agent') agentIds.add(node.id);
    }
    // Also check sublocations
    const containsEdges = graph.getOutgoingEdges(loc.id, 'contains');
    for (const cEdge of containsEdges) {
      const subLocEdges = graph.getIncomingEdges(cEdge.target, 'located_at');
      for (const slEdge of subLocEdges) {
        const node = graph.getNode(slEdge.source);
        if (node?.type === 'agent') agentIds.add(node.id);
      }
    }
  }

  // For each agent, find first consumable possession matching eventType
  for (const agentId of agentIds) {
    const possEdges = graph.getOutgoingEdges(agentId, 'possesses');
    for (const edge of possEdges) {
      const item = graph.getNode(edge.target);
      if (!item) continue;
      if (item.properties?.consumeOnEvent !== eventType) continue;

      const agentNode = graph.getNode(agentId);
      const agentName = agentNode?.name ?? 'An agent';
      const itemName = item.name;

      // Consume: remove the possession edge and the item node
      try {
        graph.removeEdge(edge.id);
        graph.removeNode(item.id);
      } catch {
        // Fail-soft: skip if removal fails
        continue;
      }

      emitTrace({
        tick,
        category: 'revelation',
        type: 'treasure_map_consumed',
        summary: `${agentName}'s ${itemName} consumed after hidden site discovery at (${col},${row})`,
        agentId,
        itemId: item.id,
        itemName,
      } as any);

      events.push({
        id: `evt_map_consumed_${agentId}_${tick}`,
        tick,
        type: 'hidden_site_discovered',
        message: `${agentName}'s ${itemName} crumbles to dust — its purpose fulfilled`,
        significance: 0.4,
        hexCoords: { col, row },
        actorId: agentId,
        notification: {
          channel: 'toast',
          icon: 'discovery',
        },
      });

      break; // Only consume one map per agent per discovery
    }
  }

  return events;
}
