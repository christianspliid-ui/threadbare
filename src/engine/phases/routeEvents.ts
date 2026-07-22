/**
 * Phase: Route Events (THR-669) — Mortal Economy P2b.
 *
 * Cargo manifests materialize into encounters: rich cargo draws banditry,
 * hostile endpoint controllers breed toll disputes, staple lifelines into
 * scarcity build embargo pressure. Caravans are route STATE, not agents
 * (NFP #7): nothing is simulated per-caravan — a route crossing a threshold
 * plants a `PendingEncounterSeed` for a mortal at one of its endpoints, and
 * the shipped seed system spawns the encounter where the attention is.
 *
 * Runs in the `post-economy` slot so it reads the tick's fresh stock tiers
 * (`resourceBalance`) and manifests.
 *
 * NFP compliance:
 * - Tunability: every threshold/chance/cap in `route-event-config.ts`.
 * - Inspectability: one aggregate `route_event_scan` trace per scan tick plus
 *   one `route_event_seeded` per planted seed (bounded by the per-scan cap).
 * - Determinism: seeded `mulberry32(seed + tick * 61)`; routes walked in
 *   stable edge-id order.
 * - Fail-soft: missing endpoints/props/agents → the route is skipped, never
 *   thrown; the ambush `threatened` flag auto-clears after a named horizon.
 */

import type { GameState } from '../../types/gameState';
import type { GraphEdge } from '../../types/graph';
import type { PendingEncounterSeed } from '../../types/unifiedAction';
import type { EnginePhase, PhaseContext, PhaseResult } from '../phaseRegistry';
import { emitTrace } from '../traceBuffer';
import type { TraceEntry, RouteEventScanTrace, RouteEventSeededTrace } from '../../types/trace';
import { mulberry32 } from '../../lib/prng';
import { readTradeRouteProps } from '../tradeRoute';
import { readLocationResourceBalance } from '../resourceEconomy';
import {
  ROUTE_EVENT_SCAN_INTERVAL_TICKS,
  ROUTE_AMBUSH_RICHNESS_MIN,
  ROUTE_AMBUSH_CHANCE,
  ROUTE_TOLL_CHANCE,
  ROUTE_EMBARGO_CHANCE,
  ROUTE_EVENT_SEED_DELAY_TICKS,
  ROUTE_EVENT_SEED_PRIORITY,
  ROUTE_EVENT_MAX_SEEDS_PER_SCAN,
  ROUTE_THREATENED_CLEAR_TICKS,
  ROUTE_AMBUSH_TEMPLATE_ID,
  ROUTE_TOLL_TEMPLATE_ID,
  ROUTE_EMBARGO_TEMPLATE_ID,
} from '../../data/route-event-config';

type RouteEventKind = 'ambush' | 'toll' | 'embargo';

/** emitTrace's Omit collapses the union — per-member helper, one cast (house pattern). */
function emitRouteTrace(
  trace:
    | Omit<RouteEventScanTrace, 'id' | 'timestamp'>
    | Omit<RouteEventSeededTrace, 'id' | 'timestamp'>,
): void {
  emitTrace(trace as unknown as Omit<TraceEntry, 'id' | 'timestamp'>);
}

/** Controlling faction of a location (incoming `controls`), or undefined. */
function controllerOf(state: GameState, locationId: string): string | undefined {
  return state.graph.getIncomingEdges(locationId, 'controls')[0]?.source;
}

/** True when the two factions carry a `hostile_to` edge in either direction. */
function factionsHostile(state: GameState, a: string, b: string): boolean {
  return (
    state.graph.getOutgoingEdges(a, 'hostile_to').some((e) => e.target === b) ||
    state.graph.getOutgoingEdges(b, 'hostile_to').some((e) => e.target === a)
  );
}

/**
 * Deterministic target pick: the lowest-id living individual standing at
 * either endpoint. Route events land on whoever is actually there (fail-soft:
 * no one there → the route sits this scan out).
 */
function pickTargetAgent(state: GameState, endpointIds: readonly string[]): string | undefined {
  const graph = state.graph;
  const candidates: string[] = [];
  const visited = new Set<string>();
  const collectAt = (locId: string): void => {
    if (visited.has(locId)) return;
    visited.add(locId);
    for (const e of graph.getIncomingEdges(locId, 'located_at')) {
      const node = graph.getNode(e.source);
      if (node?.type === 'actor') {
        if (node.properties.actorType === 'individual' && node.properties.armyState == null) {
          candidates.push(node.id);
        }
        continue;
      }
      // Three-tier model: settlement occupants usually stand in sublocations.
      if (node?.type === 'location' && node.properties.parentLocationId === locId) {
        collectAt(node.id);
      }
    }
    // Sublocations also hang off `contains` edges in some seeds — cover both.
    for (const e of graph.getOutgoingEdges(locId, 'contains')) {
      const child = graph.getNode(e.target);
      if (child?.type === 'location') collectAt(e.target);
    }
  };
  for (const locId of endpointIds) collectAt(locId);
  candidates.sort((a, b) => a.localeCompare(b));
  return candidates[0];
}

interface EligibleEvent {
  edge: GraphEdge;
  kind: RouteEventKind;
  templateId: string;
  chance: number;
  label: string;
}

export function phaseRouteEvents(state: GameState, _ctx: PhaseContext): PhaseResult {
  const graph = state.graph;
  const tick = state.tick;

  // ── Threatened-flag hygiene runs every tick's scan cadence, before rolls ──
  if (tick === 0 || tick % ROUTE_EVENT_SCAN_INTERVAL_TICKS !== 0) {
    return {};
  }

  const routes = graph
    .getEdgesByType('trades_with')
    .filter((e) => graph.getNode(e.source)?.type === 'location' && graph.getNode(e.target)?.type === 'location')
    .sort((a, b) => a.id.localeCompare(b.id));

  const rng = mulberry32(state.seed + tick * 61);
  const pending = state.pendingEncounterSeeds ?? [];
  const newSeeds: PendingEncounterSeed[] = [];
  let eligibleCount = 0;

  for (const route of routes) {
    // Auto-clear a stale ambush mark (fail-soft hygiene, no event).
    const threatenedSince = route.properties.threatenedSinceTick;
    if (
      route.properties.threatened === true &&
      typeof threatenedSince === 'number' &&
      tick - threatenedSince >= ROUTE_THREATENED_CLEAR_TICKS
    ) {
      graph.updateEdge(route.id, {
        properties: { ...route.properties, threatened: false, threatenedSinceTick: undefined },
      });
    }
  }

  for (const route of routes) {
    if (newSeeds.length >= ROUTE_EVENT_MAX_SEEDS_PER_SCAN) break;

    // One live route-event seed per route at a time.
    const seedPrefix = `route_event_${route.id}_`;
    if (pending.some((s) => s.seedId.startsWith(seedPrefix)) || newSeeds.some((s) => s.seedId.startsWith(seedPrefix))) {
      continue;
    }

    const props = readTradeRouteProps(route.properties);
    const manifest = props.manifest;
    const sourceNode = graph.getNode(route.source);
    const targetNode = graph.getNode(route.target);
    if (!sourceNode || !targetNode) continue;

    // Eligibility in fixed precedence: ambush > embargo > toll (one event per
    // route per scan — the loudest story wins).
    const events: EligibleEvent[] = [];
    if (manifest.totalValue >= ROUTE_AMBUSH_RICHNESS_MIN && route.properties.threatened !== true) {
      events.push({
        edge: route, kind: 'ambush', templateId: ROUTE_AMBUSH_TEMPLATE_ID,
        chance: ROUTE_AMBUSH_CHANCE,
        label: `Rich cargo on ${sourceNode.name} — ${targetNode.name} draws an ambush`,
      });
    }
    if (
      manifest.carriesStaple &&
      (readLocationResourceBalance(sourceNode.properties) < 0 ||
        readLocationResourceBalance(targetNode.properties) < 0)
    ) {
      events.push({
        edge: route, kind: 'embargo', templateId: ROUTE_EMBARGO_TEMPLATE_ID,
        chance: ROUTE_EMBARGO_CHANCE,
        label: `The staple lifeline into ${targetNode.name} is squeezed`,
      });
    }
    const srcFaction = controllerOf(state, route.source);
    const tgtFaction = controllerOf(state, route.target);
    if (srcFaction && tgtFaction && srcFaction !== tgtFaction && factionsHostile(state, srcFaction, tgtFaction)) {
      events.push({
        edge: route, kind: 'toll', templateId: ROUTE_TOLL_TEMPLATE_ID,
        chance: ROUTE_TOLL_CHANCE,
        label: `Toll dispute on the ${sourceNode.name} — ${targetNode.name} road`,
      });
    }
    if (events.length === 0) continue;
    eligibleCount++;

    const event = events[0];
    if (rng() >= event.chance) continue;

    const targetAgentId = pickTargetAgent(state, [route.source, route.target]);
    if (!targetAgentId) continue;

    newSeeds.push({
      seedId: `route_event_${route.id}_${tick}`,
      sourceEncounterId: 'route_event_phase',
      sourceReactionId: event.kind,
      templateId: event.templateId,
      targetAgentId,
      eligibleAfterTick: tick + ROUTE_EVENT_SEED_DELAY_TICKS,
      priority: ROUTE_EVENT_SEED_PRIORITY,
      seedLabel: event.label,
      plantedTick: tick,
    });

    if (event.kind === 'ambush') {
      graph.updateEdge(route.id, {
        properties: { ...route.properties, threatened: true, threatenedSinceTick: tick },
      });
    }

    emitRouteTrace({
      category: 'route_event_seeded' as const,
      tick,
      summary: event.label,
      routeEdgeId: route.id,
      eventKind: event.kind,
      templateId: event.templateId,
      targetAgentId,
    });
  }

  emitRouteTrace({
    category: 'route_event_scan' as const,
    tick,
    summary: `route-event scan: ${routes.length} routes, ${eligibleCount} eligible, ${newSeeds.length} seeded`,
    routesScanned: routes.length,
    eligibleRoutes: eligibleCount,
    seedsPlanted: newSeeds.length,
  });

  if (newSeeds.length === 0) return {};
  return { pendingEncounterSeeds: [...pending, ...newSeeds] };
}

export const routeEventsPhase: EnginePhase = {
  id: 'route_events',
  slot: 'post-economy',
  label: 'Route Events',
  run: (state, ctx) => phaseRouteEvents(state, ctx),
};
