/**
 * Yield — the active half of holding something (THR-1439).
 *
 * THR-1428 paid the passive half: a controlled Location tithes its holder every
 * `HOLDING_INCOME_INTERVAL_TICKS` whether anybody does anything or not, and the sheet
 * renders the result as the **Means** word. What was missing is the half a mortal
 * *does* — holding court, taxing a market, drawing a tithe by hand — and the merchant's
 * work that makes a lane carry more than it did.
 *
 * Two operations, both moving a quantity some phase already reads:
 *
 *   - `drawYield` moves a lump of a held Location's worth into the holder's wealth,
 *     through the same funnel the passive tithe uses (`bankWealth`), at a cost to the
 *     town's prosperity and to how the town sees its holder. **The costs are paid on
 *     every band, the lump only on the good ones** — that is what makes a harvest a
 *     risk rather than a button (NFP #5: greed with a price is the story).
 *   - `raiseRouteVolume` writes a lump of volume onto a lane's `trades_with` edge and
 *     restarts its decay clock, because expansion is activity. The toll a holder
 *     collects scales on volume, so raising it raises somebody's income the same day.
 *
 * Tunability (NFP #1): every number is a named constant in
 * `src/data/strategic-action-constants.ts`. Determinism (NFP #3): no draw — the band
 * came from the ladder that already rolled, and the rest is arithmetic. Fail-soft
 * (NFP #4): every path returns a `GraphOpResult`, never throws into a tick phase.
 */
import type { WorldGraph } from './graph';
import type { GraphOpResult } from './strategicGraphOps';
import type { WealthDeltaTrace, TradeRouteVolumeChangeTrace } from '../types/trace';
import { emitTrace } from './traceBuffer';
import { bankWealth } from './wealth';
import { applyReputationWithDelta } from './reputation';
import { titheMultiplier } from './holdingIncome';
import { getPlaceNodes } from './sublocationShape';
import { placeClassOf } from '../data/world-objects';
import { TRADE_ROUTE_MAX_VOLUME } from './tradeRoute';
import {
  YIELD_DRAW_BASE,
  YIELD_PLACE_MULTIPLIER,
  YIELD_DRAW_MAX_PLACES,
  YIELD_PRODUCTIVE_PLACE_CLASSES,
  YIELD_DRAW_PROSPERITY_COST,
  YIELD_DRAW_STANDING_COST,
  YIELD_DRAW_BAND_SCALE,
  ROUTE_RAISE_VOLUME_DELTA,
} from '../data/strategic-action-constants';

/** The property a Location stamps when it was last harvested — the cooldown's clock. */
export const LAST_YIELD_DRAW_PROPERTY = 'lastYieldDrawTick';

function num(props: Record<string, unknown> | undefined, key: string): number | null {
  const v = props?.[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

/**
 * How much the band multiplies the lump by. A band with no row scales to nothing, and
 * so does an *absent* band.
 *
 * **The absent arm is no longer how an instant cell arrives here (THR-1450).** It once
 * was, and that was the defect: `use × Location` is instant, its completion carried no
 * band, this scaled it to 0, and the harvest paid nothing in every live run while the
 * town still paid the prosperity cost and the holder still paid the standing. The
 * lifecycle's instant arm now stamps `INSTANT_COMPLETION_BAND` before any reader sees
 * the completion, so a worked hold reaches this function on the plain-success row.
 *
 * What still reaches the absent arm is a **checkpointed** cell whose band went
 * missing — a lost reading, not a terminal nothing could miss — and refusing to pay a
 * harvest on one of those is right.
 */
export function yieldBandScale(outcome: string | undefined): number {
  return outcome ? (YIELD_DRAW_BAND_SCALE[outcome] ?? 0) : 0;
}

/**
 * How many of a Location's Places multiply its harvest: the productive ones, capped.
 *
 * The cap is what keeps a capital with nine warehouses from being an arbitrage engine
 * — past four Places the town is already as rich as the harvest can read.
 */
export function productivePlaceCount(graph: WorldGraph, locationId: string): number {
  let productive = 0;
  try {
    for (const place of getPlaceNodes(graph)) {
      if (place.properties.parentLocationId !== locationId) continue;
      const typeId = place.properties.sublocationTypeId ?? place.properties.locationSubtype;
      const cls = placeClassOf(typeof typeId === 'string' ? typeId : undefined);
      if (cls && YIELD_PRODUCTIVE_PLACE_CLASSES.includes(cls)) productive += 1;
    }
  } catch {
    // Fail-soft: an unreadable Place layer means no multiplier, never a thrown tick.
    return 0;
  }
  return Math.min(productive, YIELD_DRAW_MAX_PLACES);
}

/** What a harvest of this Location would be worth on this band, before it is drawn. */
export function yieldLumpFor(graph: WorldGraph, locationId: string, outcome: string | undefined): number {
  const location = graph.getNode(locationId);
  if (!location) return 0;
  const prosperity = num(location.properties, 'prosperity') ?? 0;
  const productive = productivePlaceCount(graph, locationId);
  const raw = YIELD_DRAW_BASE
    * titheMultiplier(prosperity)
    * (1 + YIELD_PLACE_MULTIPLIER * productive)
    * yieldBandScale(outcome);
  return Math.round(raw);
}

/**
 * The active harvest of a held Location.
 *
 * The lump goes to the holder through `bankWealth` — the same funnel `holdingIncome`
 * banks the passive tithe through — so the sheet's Means tooltip and the economic
 * traits phase see one cause vocabulary rather than two. The town pays prosperity and
 * the holder pays standing *with the Location*, both **before** the band is consulted:
 * a failed harvest is a holder who leaned on a town and got nothing for it, which is
 * the story the cell is for.
 */
export function drawYield(
  graph: WorldGraph,
  holderId: string,
  locationId: string,
  tick: number,
  projectId?: string,
  outcome?: string,
): GraphOpResult {
  try {
    const holder = graph.getNode(holderId);
    const location = graph.getNode(locationId);
    if (!holder) return { success: false, op: 'draw_yield', error: 'holder_not_found' };
    if (!location) return { success: false, op: 'draw_yield', error: 'location_not_found' };

    const lump = yieldLumpFor(graph, locationId, outcome);

    // The costs, paid on every band. Prosperity floors at 0 — a town already at the
    // floor still resents being leaned on, which is the standing cost below.
    const prosperity = num(location.properties, 'prosperity') ?? 0;
    location.properties.prosperity = Math.max(0, prosperity - YIELD_DRAW_PROSPERITY_COST);
    location.properties[LAST_YIELD_DRAW_PROPERTY] = tick;
    applyReputationWithDelta(
      graph, holderId, locationId, -YIELD_DRAW_STANDING_COST, tick, projectId ?? 'draw_yield',
    );

    if (lump > 0) {
      const { previousWealth, newWealth } = bankWealth(holder.properties, lump, 'draw_yield');
      emitTrace({
        category: 'wealth_delta',
        tick,
        actorId: holderId,
        previousWealth,
        delta: newWealth - previousWealth,
        newWealth,
        reason: 'draw_yield',
        summary: `${holder.name ?? holderId} drew the yield of ${location.name ?? locationId}`,
        ...(projectId ? { sourceActionId: projectId } : {}),
      } as WealthDeltaTrace);
    }

    return { success: true, op: 'draw_yield', createdId: locationId };
  } catch (e) {
    return { success: false, op: 'draw_yield', error: String(e) };
  }
}

/**
 * A merchant's expansion work: a lump of volume onto the lane, and the decay clock
 * restarted, because a lane somebody is expanding is a lane somebody is using.
 *
 * The identity node is the object a Route *is* (THR-1436); the `trades_with` edge it
 * names is where the economy keeps the number. Fail-soft on a decayed lane: the
 * identity node's own collection is the decay phase's business, not this op's.
 */
export function raiseRouteVolume(
  graph: WorldGraph,
  routeNodeId: string,
  tick: number,
  outcome?: string,
): GraphOpResult {
  try {
    const node = graph.getNode(routeNodeId);
    if (!node) return { success: false, op: 'raise_route_volume', error: 'route_not_found' };
    const edgeId = node.properties.routeEdgeId;
    if (typeof edgeId !== 'string') return { success: false, op: 'raise_route_volume', error: 'no_route_edge' };
    const edge = graph.getEdge(edgeId);
    if (!edge) return { success: false, op: 'raise_route_volume', error: 'route_gone' };

    const previousVolume = num(edge.properties, 'volume') ?? 0;
    const delta = ROUTE_RAISE_VOLUME_DELTA * yieldBandScale(outcome);
    const newVolume = Math.min(TRADE_ROUTE_MAX_VOLUME, previousVolume + delta);

    graph.updateEdge(edgeId, {
      properties: { ...edge.properties, volume: newVolume, lastTraded: tick },
    });

    emitTrace({
      category: 'trade_route_volume_change',
      tick,
      edgeId,
      sourceId: edge.source,
      targetId: edge.target,
      previousVolume,
      newVolume,
      cause: 'expanded',
      summary: `${node.name ?? routeNodeId} carries more than it did`,
    } as TradeRouteVolumeChangeTrace);

    return { success: true, op: 'raise_route_volume', createdId: edgeId };
  } catch (e) {
    return { success: false, op: 'raise_route_volume', error: String(e) };
  }
}
