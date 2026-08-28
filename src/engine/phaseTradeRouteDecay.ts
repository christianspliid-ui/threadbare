/**
 * Phase: Trade Route Decay
 *
 * Routes that have not been traded on within TRADE_ROUTE_FRESHNESS_WINDOW ticks
 * lose TRADE_ROUTE_DECAY_RATE volume per tick. When volume reaches 0 the edge
 * is removed from the graph and a trade_route_dissolved summary trace is emitted.
 *
 * A **founded** route (one carrying an `establishedBy` stamp) is exempt from that
 * rule for its first TRADE_ROUTE_FOUNDING_GRACE_WINDOW ticks — see THR-1320 and the
 * constant's own note. After the window lapses it decays on exactly the old terms.
 *
 * Design doc: Docs/plans/2026-03-17-gold-reach-economic-systems-design.md
 * System 2 — Trade Routes & Agreements
 * NFP priorities: Tunability, Inspectability, Determinism, Fail-soft
 */

import type { GameState, TickEvent, ProsperityShock } from '../types/gameState';
import {
  TRADE_ROUTE_DECAY_RATE,
  TRADE_ROUTE_FRESHNESS_WINDOW,
  readTradeRouteProps,
  isRouteStale,
  isRouteUnderFoundersGrace,
} from './tradeRoute';
import { SHOCK_TRADE_ROUTE_LOST } from './phaseProsperity';
import { emitTrace } from './traceBuffer';
import { resolveEconomicChronicle, chronicleSeed } from './economicChronicle';

// ─── Phase function ───────────────────────────────────────────────────────

/**
 * Ticks all trades_with edges for staleness; decays and removes dead routes.
 *
 * For each trades_with edge:
 * 1. Read properties with fail-soft defaults (readTradeRouteProps)
 * 1b. If the route is inside its founder's grace window: no-op (THR-1320)
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
  const { graph, tick, seed } = state;
  const events: TickEvent[] = [];
  const chronicleEntries: typeof state.chronicleEntries = [];
  const prosperityShocks: ProsperityShock[] = [];

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

    // A founded route stands out its founder's warranty before the freshness rule
    // applies to it at all (THR-1320). Nothing in the strategic path refreshes
    // `lastTraded`, so without this a route minted by a six-tick undertaking was
    // stale at +6, hit volume 0 on that same tick and was removed — and the
    // `trade_route` kind's counter-play could never land on anything.
    //
    // Not traced: the decision is a pure function of `establishedBy` + `established`,
    // both already on the edge and readable from any inspector, and a per-route
    // per-tick trace would swamp the buffer for a phase that is otherwise silent
    // when nothing changes.
    if (isRouteUnderFoundersGrace(props, tick)) {
      continue;
    }

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

      // Push prosperity shocks to settlements at both endpoints
      for (const actorId of [edge.source, edge.target]) {
        const locEdges = graph.getOutgoingEdges(actorId, 'located_at');
        for (const locEdge of locEdges) {
          prosperityShocks.push({
            locationId: locEdge.target,
            delta: SHOCK_TRADE_ROUTE_LOST,
            causeType: 'trade_route_lost',
            causeId: edge.id,
            description: `Trade route dissolved: ${sourceNode.name} ↔ ${targetNode.name}`,
          });
        }
      }

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

      // Generate chronicle entry for trade route death
      const routeDeathEntry = resolveEconomicChronicle(
        'trade_route_died',
        {
          actor: sourceNode.name,
          actorId: sourceNode.id,
          target: targetNode.name,
          targetId: targetNode.id,
          ticksAgo: Math.max(0, totalTicksActive),
        },
        tick,
        chronicleSeed(seed, edge.id),
      );

      if (routeDeathEntry) {
        events.push(routeDeathEntry.tickEvent);
        chronicleEntries.push({
          id: routeDeathEntry.chronicleChapter.id,
          tier: 'chronicle',
          title: routeDeathEntry.chronicleChapter.title,
          prose: routeDeathEntry.chronicleChapter.prose,
          promptContext: {
            actors: routeDeathEntry.chronicleChapter.actorIds,
            location: '',
            sphere: 'gold',
            mood: 'economic',
          },
          tick,
        });
      }
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

  // Return accumulated events, chronicle entries, and prosperity shocks
  return {
    ...(events.length > 0 ? { tickEvents: [...state.tickEvents, ...events] } : {}),
    ...(chronicleEntries.length > 0 ? { chronicleEntries: [...state.chronicleEntries, ...chronicleEntries] } : {}),
    ...(prosperityShocks.length > 0 ? { prosperityShocks: [...(state.prosperityShocks ?? []), ...prosperityShocks] } : {}),
  };
}
