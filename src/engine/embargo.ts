/**
 * embargo.ts — the `embargo` faction action (THR-1955, war aims S2 § Engine 9).
 *
 * A faction holding a regional monopoly shuts that region's roads to one enemy: the enemy
 * (by `isEnemyFaction`) whose settlements inside the region carry the most of the good
 * (count of those settlements; ties by monopoly order, then target id). For
 * `EMBARGO_DAYS` the holder carries one `activeEmbargo` record. The towns and lanes it
 * cuts are derived (`embargoedTownsOf` / `embargoedLanesOf`); the stock pass cuts their
 * balance on the good by `EMBARGO_BALANCE_CUT`. One `encounter_route_embargo` seed goes
 * on the busiest embargoed lane through the existing route-event seed shape. The
 * economic-power phase lifts it when the term ends or the monopoly is lost.
 *
 * Pure planning (`planEmbargo`) is separate from the write (`executeEmbargo`) so the
 * prerequisite and the executor read the same answer.
 *
 * NFP #3: no random draw — argmax with id ties. NFP #4: no plan → null, nothing written.
 */

import type { GameState } from '../types/gameState';
import type { GraphNode } from '../types/graph';
import type { ChronicleEntry } from '../types/narrative';
import type { PendingEncounterSeed } from '../types/unifiedAction';
import type { FactionActionRecord } from '../types/factionAction';
import { hexDistance } from '../lib/hexMath';
import { getLocationNodes } from './sublocationShape';
import { readResources } from './resourceEconomy';
import { readTradeRouteProps } from './tradeRoute';
import { taxHolderOf, isSettlement } from './factionPurse/income';
import { hexOfLocation } from './warAims/context';
import { isEnemyFaction } from './warAims/enemy';
import {
  readRegionalMonopolies,
  readActiveEmbargo,
  hexOfLocationId,
  embargoedTownsOf,
  embargoedLanesOf,
  type ActiveEmbargo,
} from './regionalMonopoly';
import { traceEmbargo, regionTownName, resourceWord } from './phases/regionalMonopolies';
import { pickTargetAgent } from './phases/routeEvents';
import { resolveEconomicChronicle, chronicleSeed } from './economicChronicle';
import { TICKS_PER_DAY } from '../data/attention-constants';
import {
  ROUTE_EMBARGO_TEMPLATE_ID,
  ROUTE_EVENT_SEED_DELAY_TICKS,
  ROUTE_EVENT_SEED_PRIORITY,
} from '../data/route-event-config';
import {
  REGIONAL_MONOPOLY_ENABLED,
  MONOPOLY_REGION_RADIUS_HEXES,
  EMBARGO_DAYS,
} from '../data/regional-monopoly-constants';

const NO_REALM_MAP: ReadonlyMap<string, string> = new Map();

/** Today's best embargo for `holderId`, or null when it has none to lay. */
export function planEmbargo(state: GameState, holderId: string): ActiveEmbargo | null {
  if (!REGIONAL_MONOPOLY_ENABLED) return null;
  const graph = state.graph;
  const holder = graph.getNode(holderId);
  if (!holder || readActiveEmbargo(holder.properties)) return null;
  const monopolies = readRegionalMonopolies(holder.properties)
    .slice()
    .sort((a, b) => (a.resourceId < b.resourceId ? -1 : a.resourceId > b.resourceId ? 1
      : a.anchorLocationId < b.anchorLocationId ? -1 : a.anchorLocationId > b.anchorLocationId ? 1 : 0));
  if (monopolies.length === 0) return null;

  const settlements = getLocationNodes(graph).filter(isSettlement)
    .map(node => ({ node, hex: hexOfLocation(graph, node), holder: taxHolderOf(graph, node.id, NO_REALM_MAP) }))
    .filter((t): t is { node: GraphNode; hex: NonNullable<typeof t.hex>; holder: string | null } => t.hex !== null);

  let best: { record: ActiveEmbargo; count: number } | null = null;
  for (const m of monopolies) {
    const anchor = hexOfLocationId(graph, m.anchorLocationId);
    if (!anchor) continue;
    const byTarget = new Map<string, number>();
    for (const t of settlements) {
      if (!t.holder || t.holder === holderId) continue;
      if (hexDistance(t.hex, anchor) > MONOPOLY_REGION_RADIUS_HEXES) continue;
      const inst = readResources(t.node.properties)[m.resourceId] as { quantity?: unknown } | undefined;
      if (!inst || typeof inst.quantity !== 'number') continue;
      if (!isEnemyFaction(graph, holderId, t.holder)) continue;
      byTarget.set(t.holder, (byTarget.get(t.holder) ?? 0) + 1);
    }
    for (const target of [...byTarget.keys()].sort()) {
      const count = byTarget.get(target)!;
      if (best && count <= best.count) continue;
      best = {
        count,
        record: {
          targetFactionId: target,
          resourceId: m.resourceId,
          anchorLocationId: m.anchorLocationId,
          untilTick: state.tick + EMBARGO_DAYS * TICKS_PER_DAY,
        },
      };
    }
  }
  return best?.record ?? null;
}

export interface EmbargoResult {
  record: FactionActionRecord;
  chronicle: ChronicleEntry[];
  seeds: PendingEncounterSeed[];
}

/** Lay the planned embargo: write the record, chronicle it, seed its scene, trace it. */
export function executeEmbargo(
  state: GameState,
  holder: GraphNode,
  pendingSeeds: readonly PendingEncounterSeed[] = [],
): EmbargoResult | null {
  const plan = planEmbargo(state, holder.id);
  if (!plan) return null;
  const graph = state.graph;
  (holder.properties as Record<string, unknown>).activeEmbargo = plan;

  const target = graph.getNode(plan.targetFactionId);
  const town = regionTownName(graph, plan.anchorLocationId);
  const chronicle: ChronicleEntry[] = [];
  const line = resolveEconomicChronicle(
    'embargo_laid',
    {
      actor: holder.name, actorId: holder.id,
      target: target?.name ?? 'its enemies', targetId: plan.targetFactionId,
      resource: resourceWord(plan.resourceId), settlement: town,
    },
    state.tick,
    chronicleSeed(state.seed, `${holder.id}_embargo_${plan.untilTick}`),
  );
  if (line) {
    chronicle.push({
      id: line.chronicleChapter.id,
      tier: 'chronicle',
      title: line.chronicleChapter.title,
      prose: line.chronicleChapter.prose,
      promptContext: { actors: line.chronicleChapter.actorIds, location: town, sphere: 'matter', mood: 'economic' },
      tick: state.tick,
    });
  }

  // The scene: one route-embargo seed on the busiest embargoed lane (volume, then id).
  const seeds: PendingEncounterSeed[] = [];
  const lanes = embargoedLanesOf(graph, plan)
    .map(e => ({ e, volume: readTradeRouteProps(e.properties as Record<string, unknown>).volume }))
    .sort((a, b) => b.volume - a.volume || (a.e.id < b.e.id ? -1 : a.e.id > b.e.id ? 1 : 0));
  const lane = lanes[0]?.e;
  if (lane) {
    const prefix = `route_event_${lane.id}_`;
    const live = pendingSeeds.some(s => typeof s.seedId === 'string' && s.seedId.startsWith(prefix));
    const agent = live ? undefined : pickTargetAgent(state, [lane.source, lane.target]);
    if (agent) {
      seeds.push({
        seedId: `${prefix}${state.tick}`,
        sourceEncounterId: 'faction_embargo',
        sourceReactionId: 'embargo',
        templateId: ROUTE_EMBARGO_TEMPLATE_ID,
        targetAgentId: agent,
        eligibleAfterTick: state.tick + ROUTE_EVENT_SEED_DELAY_TICKS,
        priority: ROUTE_EVENT_SEED_PRIORITY,
        seedLabel: `${holder.name} shuts the ${resourceWord(plan.resourceId)} roads around ${town} to ${target?.name ?? 'its enemies'}`,
        plantedTick: state.tick,
      });
    }
  }

  traceEmbargo(graph, state.tick, holder, plan, 'faction.embargo.laid');

  return {
    record: {
      actionType: 'embargo',
      executedTick: state.tick,
      targetId: plan.targetFactionId,
      targetName: target?.name,
      outcome: 'success',
      details: {
        resourceId: plan.resourceId,
        anchorLocationId: plan.anchorLocationId,
        untilTick: plan.untilTick,
        towns: embargoedTownsOf(graph, plan).map(t => t.id),
        seededLaneId: seeds.length > 0 ? lane?.id : undefined,
      },
    },
    chronicle,
    seeds,
  };
}
