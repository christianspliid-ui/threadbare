/**
 * Phase: Trade Route Decay
 *
 * Routes that have not been traded on within TRADE_ROUTE_FRESHNESS_WINDOW ticks
 * lose TRADE_ROUTE_DECAY_RATE volume per tick. When volume reaches 0 the edge
 * is removed from the graph and a trade_route_dissolved summary trace is emitted.
 *
 * Design doc: Docs/plans/2026-03-17-gold-reach-economic-systems-design.md
 * System 2 — Trade Routes & Agreements
 * NFP priorities: Tunability, Inspectability, Determinism, Fail-soft
 */

import type { GameState } from '../types/gameState';
import {
  TRADE_ROUTE_DECAY_RATE,
  TRADE_ROUTE_FRESHNESS_WINDOW,
  readTradeRouteProps,
  isRouteStale,
} from './tradeRoute';
import { emitTrace } from './traceBuffer';

// ─── Phase function ───────────────────────────────────────────────────────

/**
 * Ticks all trades_with edges for staleness; decays and removes dead routes.
 *
 * For each trades_with edge:
 * 1. Read properties with fail-soft defaults (readTradeRouteProps)
 * 2. If route is stale (lastTraded + TRADE_ROUTE_FRESHNESS_WINDOW < currentTick):
 *    a. Subtract TRADE_ROUTE_DECAY_RATE from volume
 *    b. Emit trade_route_volume_change trace with cause='decayed'
 *    c. If new volume <= 0: remove edge, emit trade_route_dissolved trace
 *    d. Otherwise: update edge properties with new volume
 * 3. If route is fresh: no-op
 *
 * Fail-soft: missing edge node references → skip, no crash.
 */
export function phaseTradeRouteDecay(state: GameState): Partial<GameState> {
  const { graph, tick } = state;

  // Collect all trades_with edges
  const tradeEdges = graph.getEdgesByType('trades_with');

  for (const edge of tradeEdges) {
    // Fail-soft: verify both endpoints exist
    const sourceNode = graph.getNode(edge.source);
    const targetNode = graph.getNode(edge.target);
    if (!sourceNode || !targetNode) {
      // Edge references a removed node — skip, queue for cleanup via natural GC
      emitTrace({
        tick,
        category: 'trade_route_volume_change',
        summary: `Trade route ${edge.id}: endpoint missing — skipped`,
        edgeId: edge.id,
        sourceId: edge.source,
        targetId: edge.target,
        previousVolume: 0,
        newVolume: 0,
        cause: 'decayed',
      });
      continue;
    }

    const props = readTradeRouteProps(edge.properties as Record<string, unknown>);

    // Only decay stale routes
    if (!isRouteStale(props.lastTraded, tick)) {
      continue;
    }

    const previousVolume = props.volume;
    const newVolume = previousVolume - TRADE_ROUTE_DECAY_RATE;

    if (newVolume <= 0) {
      // Route dies — remove edge and emit dissolved trace
      const establishedTick = props.established;
      const totalTicksActive = tick - establishedTick;

      graph.removeEdge(edge.id);

      emitTrace({
        tick,
        category: 'trade_route_dissolved',
        summary: `Trade route ${edge.id} (${sourceNode.name} ↔ ${targetNode.name}) dissolved after ${totalTicksActive} ticks`,
        edgeId: edge.id,
        sourceId: edge.source,
        targetId: edge.target,
        establishedTick,
        peakVolume: previousVolume,
        totalTicksActive: Math.max(0, totalTicksActive),
        causeOfDeath: 'decay',
      });
    } else {
      // Decay volume — update properties in place
      (edge.properties as Record<string, unknown>).volume = newVolume;

      emitTrace({
        tick,
        category: 'trade_route_volume_change',
        summary: `Trade route ${edge.id}: volume ${previousVolume} → ${newVolume} (decayed)`,
        edgeId: edge.id,
        sourceId: edge.source,
        targetId: edge.target,
        previousVolume,
        newVolume,
        cause: 'decayed',
      });
    }
  }

  // No GameState fields mutated directly; graph is mutated in place
  return {};
}
