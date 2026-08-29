/**
 * Catalog trade-verb graph-op tests (THR-1188).
 *
 * The four `action.gold.*` trade verbs used to carry generic edge ops bound
 * `$actor` → `$target`. Because `unifiedCandidates` sets `targetId` to the
 * caster's own location, every one resolved to `actor → location` — a shape the
 * narrowed `trades_with` EDGE_SCHEMA row (THR-830) refuses and no consumer reads.
 * These four typed ops resolve a real `location → location` pair instead.
 *
 * The ops route through `executeGraphOps` exactly as the action pipeline fires
 * them (resolution forwards them via `graphOnlyOps`). Assertions read the graph
 * directly: the edge that was written, its endpoints' node types, and the
 * properties the route consumers actually look for.
 *
 * The negative assertions matter as much as the positive ones — the whole defect
 * was an op that *appeared* to fire while landing nothing, so several tests
 * falsify the fix rather than confirm it (no actor endpoint ever; a refused op on
 * an empty world; the pre-fix binding still refused by the schema).
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { enableTracing, getTraces, clearTraces } from '../traceBuffer';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { runTick } from '../orchestrator';
import { createBalancedCosmology } from '../cosmology';
import { generateArchetypes } from '../ascendant';
import { createSimulationRuntime } from '../simulationRuntime';
import type { GameState } from '../../types/gameState';
import { WorldGraph } from '../graph';
import { executeGraphOps, resetOpCounter } from '../graphOpExecutor';
import type { GraphOp, GraphOpContext } from '../../types/graphOp';
import { validateEdgeEndpoints } from '../../types/edgeSchema';
import { isPlaceTierLocation } from '../sublocationShape';
import { ACTION_TEMPLATES, getActionTemplateById } from '../../data/action-template-content';
import {
  readTradeRouteProps,
  TRADE_ROUTE_MAX_VOLUME,
  TRADE_ROUTE_DEFAULT_TAX_RATE,
  TRADE_PARTNER_MAX_HEX_RANGE,
} from '../tradeRoute';

const actorId = 'actor.merchant';
const homeId = 'loc.home';
const partnerId = 'loc.partner';
const farId = 'loc.far';

const TICK = 42;

const ctx: GraphOpContext = {
  actorId,
  // Exactly what `unifiedCandidates` produces: target IS the caster's location.
  targetId: homeId,
  locationId: homeId,
  tick: TICK,
};

/**
 * A caster standing in `loc.home`, with `loc.partner` two hexes away holding a
 * surplus of what home wants, and `loc.far` outside partner range.
 */
function makeGraph(): WorldGraph {
  const graph = new WorldGraph();
  resetOpCounter();
  graph.addNode({ id: actorId, type: 'actor', name: 'Vela Cross', properties: { actorType: 'agent' } });
  graph.addNode({
    id: homeId,
    type: 'location',
    name: 'Hearthfall',
    properties: { locationType: 'location', locationSubtype: 'town', hexCol: 5, hexRow: 5 },
  });
  graph.addNode({
    id: partnerId,
    type: 'location',
    name: 'Saltmarch',
    properties: { locationType: 'location', locationSubtype: 'town', hexCol: 7, hexRow: 5 },
  });
  graph.addNode({
    id: farId,
    type: 'location',
    name: 'Longreach',
    properties: {
      locationType: 'location',
      locationSubtype: 'town',
      hexCol: 5 + TRADE_PARTNER_MAX_HEX_RANGE + 4,
      hexRow: 5,
    },
  });
  graph.addEdge({ id: 'e.at', source: actorId, target: homeId, type: 'located_at', properties: {} });
  return graph;
}

/** Seed a live route the update/delete/tax verbs can act on. */
function addRoute(
  graph: WorldGraph,
  id: string,
  source: string,
  target: string,
  props: Record<string, unknown>,
): void {
  graph.addEdge({ id, source, target, type: 'trades_with', properties: { volume: 1, lastTraded: TICK, ...props } });
}

const routes = (graph: WorldGraph) =>
  graph.getOutgoingEdges(homeId, 'trades_with').concat(graph.getIncomingEdges(homeId, 'trades_with'));

describe('establish_trade_route', () => {
  const op: GraphOp[] = [{ op: 'establish_trade_route' }];

  it('writes a location → location edge, never the actor → location shape that was refused', () => {
    const graph = makeGraph();
    const result = executeGraphOps(graph, op, ctx);

    expect(result.allSucceeded).toBe(true);
    const written = routes(graph);
    expect(written).toHaveLength(1);

    // The defect in one assertion: neither endpoint may be the caster.
    expect(written[0].source).not.toBe(actorId);
    expect(written[0].target).not.toBe(actorId);
    expect(graph.getNode(written[0].source)?.type).toBe('location');
    expect(graph.getNode(written[0].target)?.type).toBe('location');
  });

  it('writes an edge the narrowed EDGE_SCHEMA row accepts', () => {
    const graph = makeGraph();
    executeGraphOps(graph, op, ctx);
    const written = routes(graph)[0];

    expect(
      validateEdgeEndpoints(
        'trades_with',
        graph.getNode(written.source)!.type,
        graph.getNode(written.target)!.type,
      ),
    ).toBeNull();
  });

  it('anchors on the caster settlement and picks a partner inside the hex range', () => {
    const graph = makeGraph();
    executeGraphOps(graph, op, ctx);
    const written = routes(graph)[0];

    const endpoints = [written.source, written.target];
    expect(endpoints).toContain(homeId);
    expect(endpoints).toContain(partnerId);
    // `loc.far` sits outside TRADE_PARTNER_MAX_HEX_RANGE and must never be chosen.
    expect(endpoints).not.toContain(farId);
  });

  it('stamps lastTraded at birth so the decay phase does not dissolve the route immediately', () => {
    const graph = makeGraph();
    executeGraphOps(graph, op, ctx);

    expect(readTradeRouteProps(routes(graph)[0].properties as Record<string, unknown>).lastTraded).toBe(TICK);
  });

  it('is deterministic — the same graph and tick pick the same partner', () => {
    const a = makeGraph();
    const b = makeGraph();
    executeGraphOps(a, op, ctx);
    executeGraphOps(b, op, ctx);

    expect(routes(a)[0].target).toBe(routes(b)[0].target);
  });

  it('fails soft with no eligible partner rather than throwing or writing a bad edge', () => {
    const graph = new WorldGraph();
    resetOpCounter();
    graph.addNode({ id: actorId, type: 'actor', name: 'Vela Cross', properties: { actorType: 'agent' } });
    graph.addNode({
      id: homeId,
      type: 'location',
      name: 'Hearthfall',
      properties: { locationType: 'location', hexCol: 5, hexRow: 5 },
    });
    graph.addEdge({ id: 'e.at', source: actorId, target: homeId, type: 'located_at', properties: {} });

    const result = executeGraphOps(graph, op, ctx);
    expect(result.allSucceeded).toBe(false);
    expect(routes(graph)).toHaveLength(0);
  });

  it('does not open a second route to a partner it already trades with', () => {
    const graph = makeGraph();
    addRoute(graph, 'e.existing', homeId, partnerId, {});
    executeGraphOps(graph, op, ctx);

    // Only `loc.far` remains, and it is out of range — so nothing new is written.
    expect(routes(graph)).toHaveLength(1);
  });
});

describe('conduct_trade', () => {
  const op: GraphOp[] = [{ op: 'conduct_trade' }];

  it('bumps volume and refreshes lastTraded on a real route', () => {
    const graph = makeGraph();
    addRoute(graph, 'e.route', homeId, partnerId, { volume: 3, lastTraded: 10 });

    expect(executeGraphOps(graph, op, ctx).allSucceeded).toBe(true);
    const props = readTradeRouteProps(routes(graph)[0].properties as Record<string, unknown>);
    expect(props.volume).toBe(4);
    expect(props.lastTraded).toBe(TICK);
  });

  it('picks the stalest route — the one the decay phase is about to take', () => {
    const graph = makeGraph();
    addRoute(graph, 'e.fresh', homeId, partnerId, { volume: 1, lastTraded: 40 });
    addRoute(graph, 'e.stale', homeId, farId, { volume: 1, lastTraded: 3 });

    executeGraphOps(graph, op, ctx);
    const byId = Object.fromEntries(routes(graph).map(e => [e.id, e.properties as Record<string, unknown>]));
    expect(readTradeRouteProps(byId['e.stale']).volume).toBe(2);
    expect(readTradeRouteProps(byId['e.fresh']).volume).toBe(1);
  });

  it('holds volume at the cap rather than growing without bound', () => {
    const graph = makeGraph();
    addRoute(graph, 'e.route', homeId, partnerId, { volume: TRADE_ROUTE_MAX_VOLUME });

    executeGraphOps(graph, op, ctx);
    expect(readTradeRouteProps(routes(graph)[0].properties as Record<string, unknown>).volume)
      .toBe(TRADE_ROUTE_MAX_VOLUME);
  });

  it('fails soft when the anchor has no route', () => {
    const graph = makeGraph();
    expect(executeGraphOps(graph, op, ctx).allSucceeded).toBe(false);
  });
});

describe('disrupt_trade_route', () => {
  const op: GraphOp[] = [{ op: 'disrupt_trade_route' }];

  it('severs the busiest route at the anchor', () => {
    const graph = makeGraph();
    addRoute(graph, 'e.minor', homeId, partnerId, { volume: 2 });
    addRoute(graph, 'e.major', homeId, farId, { volume: 9 });

    expect(executeGraphOps(graph, op, ctx).allSucceeded).toBe(true);
    const remaining = routes(graph);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe('e.minor');
  });

  it('removes an inbound route too — the anchor may be either endpoint', () => {
    const graph = makeGraph();
    addRoute(graph, 'e.inbound', partnerId, homeId, { volume: 5 });

    executeGraphOps(graph, op, ctx);
    expect(routes(graph)).toHaveLength(0);
  });

  it('fails soft when the anchor has no route', () => {
    const graph = makeGraph();
    expect(executeGraphOps(graph, op, ctx).allSucceeded).toBe(false);
  });
});

describe('tax_trade_route', () => {
  const op: GraphOp[] = [{ op: 'tax_trade_route' }];

  it('stamps controlledBy and taxRate on a real route', () => {
    const graph = makeGraph();
    addRoute(graph, 'e.route', homeId, partnerId, { volume: 4 });

    expect(executeGraphOps(graph, op, ctx).allSucceeded).toBe(true);
    const props = readTradeRouteProps(routes(graph)[0].properties as Record<string, unknown>);
    expect(props.controlledBy).toBe(actorId);
    expect(props.taxRate).toBe(TRADE_ROUTE_DEFAULT_TAX_RATE);
  });

  it('prefers an untolled route over a busier one already controlled', () => {
    const graph = makeGraph();
    addRoute(graph, 'e.taxed', homeId, farId, { volume: 9, controlledBy: 'actor.rival' });
    addRoute(graph, 'e.free', homeId, partnerId, { volume: 2 });

    executeGraphOps(graph, op, ctx);
    const byId = Object.fromEntries(routes(graph).map(e => [e.id, e.properties as Record<string, unknown>]));
    expect(readTradeRouteProps(byId['e.free']).controlledBy).toBe(actorId);
    expect(readTradeRouteProps(byId['e.taxed']).controlledBy).toBe('actor.rival');
  });

  it('fails soft when the anchor has no route', () => {
    const graph = makeGraph();
    expect(executeGraphOps(graph, op, ctx).allSucceeded).toBe(false);
  });
});

describe('the pre-fix binding, kept as a red baseline', () => {
  it('actor → location is still refused by the schema, so the old ops could not have worked', () => {
    // This is the shape the four templates carried before THR-1188. If this ever
    // starts passing, the trades_with row has been widened back and the fix above
    // has quietly become optional — which is exactly what THR-830 forbade.
    expect(validateEdgeEndpoints('trades_with', 'actor', 'location')?.reason).toBe('source_type');
  });
});

describe('taxRate parity with the retired template literal', () => {
  it('stamps the same 0.1 the content author wrote, so only the endpoints changed', () => {
    expect(TRADE_ROUTE_DEFAULT_TAX_RATE).toBe(0.1);
  });
});

describe('the four catalog templates are bound to the typed ops', () => {
  // The engine half above is only half the fix — the defect lived in the content
  // file. This closes the loop: if anyone rebinds a trade verb back to a generic
  // `trades_with` edge op, it resolves to `actor → location` again and is refused
  // again, and these assertions are what notices.
  const EXPECTED: Record<string, string> = {
    'action.gold.establish-trade': 'establish_trade_route',
    'action.gold.trade': 'conduct_trade',
    'action.gold.disrupt-trade': 'disrupt_trade_route',
    'action.gold.tax-trade-route': 'tax_trade_route',
  };

  for (const [templateId, expectedOp] of Object.entries(EXPECTED)) {
    it(`${templateId} carries ${expectedOp}, not a generic trades_with op`, () => {
      const template = getActionTemplateById(templateId);
      expect(template, `${templateId} must exist in the catalog`).toBeDefined();

      const ops = template!.onSuccess ?? [];
      expect(ops.map(o => o.op)).toContain(expectedOp);
      // No generic edge op may name trades_with — that binding is the defect.
      expect(ops.filter(o => o.edgeType === 'trades_with')).toHaveLength(0);
    });
  }

  it('no action template anywhere still binds a generic trades_with edge op', () => {
    const offenders = ACTION_TEMPLATES.flatMap(t =>
      [...(t.onSuccess ?? []), ...(t.onFailure ?? [])]
        .filter(o => o.edgeType === 'trades_with')
        .map(o => `${t.id}:${o.op}`),
    );
    expect(offenders).toEqual([]);
  });
});

/**
 * Live-world proof (THR-1188 Done-when 3).
 *
 * Everything above runs against a hand-built graph, which is enough to pin the
 * op's contract and not enough to prove the verb works in the world the player
 * gets. It also cannot discharge the ticket's actual evidence ask, because a
 * seeded run forms no `trades_with` route on its own inside 120 ticks — so
 * "zero `edge_schema_refused` traces naming trades_with" is vacuously true there
 * whether the fix landed or not (an empty population passes any predicate).
 *
 * This block closes that: it boots the real `initializeGameState` → `runTick`
 * pipeline, finds a real agent standing at a real settlement, fires the op the
 * template now carries, and asserts a real route appeared between two real
 * location nodes with no refusal trace. The refusal count is then meaningful,
 * because the op demonstrably ran.
 */
describe('establish_trade_route against a real seeded world', () => {
  let state: GameState;

  beforeAll(() => {
    const runtime = createSimulationRuntime();
    const archetype = generateArchetypes(4, 42)[0];
    const preset = MAP_SIZE_PRESETS.medium;
    const { state: init } = initializeGameState(
      archetype, 'TradeBot', createBalancedCosmology(), 42, preset.cols, preset.rows,
    );
    state = init;
    for (let t = 0; t < 30; t++) state = runTick(state, [], runtime);
    enableTracing();
  }, 600_000);

  it('writes a real location → location route on the live graph, with no refusal trace', () => {
    const graph = state.graph;

    // A real agent standing at a real, durable settlement — not a fixture.
    //
    // `isPlaceTierLocation`, not a bare `type === 'location'` test: since THR-1183
    // a sublocation IS a `location` node (discriminated by `parentLocationId`), so
    // the bare test also matches an agent standing in an inn. This assertion then
    // requires the anchor to be a route endpoint, and the verb correctly resolves a
    // sublocation *up to its parent* before laying the route — so a sublocation
    // anchor fails an assertion about the verb, for a reason that is entirely about
    // the fixture. It passed only because the first matching agent happened to be
    // place-tier; any change to what agents do moves that. Asking through the
    // shape module is the rule CLAUDE.md states, and it is what makes this test
    // measure the verb rather than the seating plan.
    const caster = graph.getNodesByType('actor').find(a => {
      const locId = graph.getOutgoingEdges(a.id, 'located_at')[0]?.target;
      if (!locId || locId.startsWith('loc.transient.')) return false;
      const loc = graph.getNode(locId);
      return isPlaceTierLocation(loc) && typeof loc?.properties.hexCol === 'number';
    });
    expect(caster, 'seeded world must contain an agent at a durable location').toBeDefined();

    const anchorId = graph.getOutgoingEdges(caster!.id, 'located_at')[0].target;
    const before = new Set(graph.getEdgesByType('trades_with').map(e => e.id));

    clearTraces();
    const result = executeGraphOps(
      graph,
      [{ op: 'establish_trade_route' }],
      { actorId: caster!.id, targetId: anchorId, locationId: anchorId, tick: state.tick },
    );

    expect(result.allSucceeded).toBe(true);

    const added = graph.getEdgesByType('trades_with').filter(e => !before.has(e.id));
    expect(added, 'the op must add exactly one route').toHaveLength(1);

    // The whole defect, asserted against the real world: both endpoints are
    // locations, and neither is the caster.
    const [route] = added;
    expect(graph.getNode(route.source)?.type).toBe('location');
    expect(graph.getNode(route.target)?.type).toBe('location');
    expect([route.source, route.target]).not.toContain(caster!.id);
    expect([route.source, route.target]).toContain(anchorId);

    // And the refusal that used to be this verb's only mechanical effect is absent —
    // meaningful here precisely because the op above demonstrably ran.
    const refusals = getTraces().filter(
      t => t.category === 'edge_schema_refused'
        && (t as unknown as { edgeType?: string }).edgeType === 'trades_with',
    );
    expect(refusals).toEqual([]);
  });
});
