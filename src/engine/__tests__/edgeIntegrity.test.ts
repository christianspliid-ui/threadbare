// @vitest-lane heavy — builds a medium world and drives it 150 ticks (225 s on CI run 33653898091) (THR-1384)
/**
 * THR-1177 — edge integrity at the two generic writer chokepoints.
 *
 * The THR-1176 audit's finding was that every edge family is writable through two
 * paths that checked nothing: `graphOpExecutor.executeAddEdge` (content-authored
 * `add_edge` ops, endpoints from sentinel resolution) and
 * `strategicGraphOps.createRelationEdge` (which took any string as an edge type). One
 * validation at each covers all ~44 families, so these tests are the falsification of
 * that claim rather than a per-family sweep.
 *
 * The red cases are written as *behaviour under the guard*, not as assertions about
 * the guard's internals: each one builds the exact shape that used to be written
 * silently, pushes it through the real chokepoint, and asserts the edge does not exist
 * afterwards. Deleting the guard turns every one of them red — which is the property
 * that makes them worth having (a test that only asserts the refusal message would
 * still pass against a guard that refused and then wrote anyway).
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { WorldGraph } from '../graph';
import { executeGraphOps } from '../graphOpExecutor';
import { createRelationEdge, createTradeRoute } from '../strategicGraphOps';
import { getPlaceTierLocations } from '../sublocationShape';
import { isAutonomousDecisionActor } from '../strategicKindReachability';
import { getHighestFactionRank } from '../socialLeverage';
import { joinFaction } from '../factionMembership';
import { EDGE_SCHEMA, validateEdgeEndpoints } from '../../types/edgeSchema';
import { enableTracing, getTraces, clearTraces } from '../traceBuffer';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { runTick } from '../orchestrator';
import { createBalancedCosmology } from '../cosmology';
import { generateArchetypes } from '../ascendant';
import { createSimulationRuntime } from '../simulationRuntime';
import { matchesNodeType } from '../../types/edgeSchema';
import type { EdgeType } from '../../types/graph';
import type { GameState } from '../../types/gameState';

/** A world with one of everything the red cases need. */
function makeGraph(): WorldGraph {
  const g = new WorldGraph();
  g.addNode({ id: 'asc', type: 'actor', name: 'The Ascendant', properties: { actorType: 'ascendant' } });
  g.addNode({ id: 'agent', type: 'actor', name: 'Kael', properties: { actorType: 'individual' } });
  g.addNode({ id: 'agent2', type: 'actor', name: 'Bran', properties: { actorType: 'individual' } });
  g.addNode({ id: 'guild', type: 'actor', name: 'The Guild', properties: { actorType: 'faction' } });
  g.addNode({ id: 'town', type: 'location', name: 'Sacred Grove', properties: {} });
  return g;
}

const CTX = { actorId: 'agent', targetId: 'town', locationId: 'town', tick: 5 };

describe('THR-1177 — chokepoint 1: graphOpExecutor.executeAddEdge', () => {
  beforeAll(() => enableTracing());

  it('refuses the THR-1175 favour shape — a location cannot be a debtor', () => {
    const g = makeGraph();
    clearTraces();

    // Exactly the defect: `owes_favor` is declared actor→actor and every consumer is
    // person-shaped, but a cast sentinel bound the *location* as the action target, so
    // the town became the debtor. This op is what the content authored.
    const result = executeGraphOps(g, [{
      op: 'add_edge',
      edgeType: 'owes_favor',
      source: '$target',   // resolves to 'town' — a location
      target: '$actor',
      properties: { magnitude: 1, context: 'rescue', grantedTick: 5, redeemed: false, broken: false },
    }], CTX);

    expect(result.results[0].success).toBe(false);
    expect(result.results[0].error).toMatch(/owes_favor.*target must be|owes_favor.*source must be/);
    // The behaviour that matters: no edge exists.
    expect(g.getOutgoingEdges('town', 'owes_favor')).toHaveLength(0);
    expect(g.getAllEdges().filter(e => e.type === 'owes_favor')).toHaveLength(0);

    const traces = getTraces().filter(t => t.category === 'edge_schema_refused');
    expect(traces).toHaveLength(1);
    expect(traces[0]).toMatchObject({
      edgeType: 'owes_favor',
      chokepoint: 'graph_op_add_edge',
      reason: 'source_type',
      sourceNodeType: 'location',
    });
  });

  it('refuses an unregistered edge type outright', () => {
    const g = makeGraph();
    const result = executeGraphOps(g, [{
      op: 'add_edge', edgeType: 'not_a_real_family', source: '$actor', target: '$target', properties: {},
    }], CTX);

    expect(result.results[0].success).toBe(false);
    expect(result.results[0].error).toMatch(/not registered in EDGE_SCHEMA/);
    expect(g.getAllEdges()).toHaveLength(0);
  });

  it('refuses a thread whose source is a mortal, not the ascendant', () => {
    const g = makeGraph();
    const result = executeGraphOps(g, [{
      op: 'add_edge', edgeType: 'thread', source: 'agent', target: 'agent2', properties: {},
    }], CTX);

    expect(result.results[0].success).toBe(false);
    expect(result.results[0].error).toMatch(/source must be the ascendant/);
    expect(g.getAllEdges().filter(e => e.type === 'thread')).toHaveLength(0);
  });

  it('still writes every legal edge — the guard is not a blanket refusal', () => {
    const g = makeGraph();

    // A real thread from the ascendant, and a favour between two people.
    const ok = executeGraphOps(g, [
      { op: 'add_edge', edgeType: 'thread', source: 'asc', target: 'agent', properties: {} },
      {
        op: 'add_edge', edgeType: 'owes_favor', source: 'agent2', target: 'agent',
        properties: { magnitude: 1, context: 'rescue', grantedTick: 5, redeemed: false, broken: false },
      },
    ], CTX);

    expect(ok.results.every(r => r.success)).toBe(true);
    expect(g.getOutgoingEdges('asc', 'thread')).toHaveLength(1);
    expect(g.getOutgoingEdges('agent2', 'owes_favor')).toHaveLength(1);
  });

  it('accepts a located_at edge onto a sublocation-typed node (the widened row)', () => {
    const g = makeGraph();
    // The shape `strategicGraphOps.createSublocation` mints. Before the row was widened
    // this was a legal position edge the chokepoint would have refused.
    g.addNode({ id: 'subloc', type: 'sublocation', name: 'Warehouse', properties: { parentLocationId: 'town' } });

    const result = executeGraphOps(g, [{
      op: 'add_edge', edgeType: 'located_at', source: 'agent', target: 'subloc', properties: {},
    }], CTX);

    expect(result.results[0].success).toBe(true);
    expect(g.getOutgoingEdges('agent', 'located_at')).toHaveLength(1);
  });
});

describe('THR-1177 — chokepoint 2: strategicGraphOps.createRelationEdge', () => {
  it('refuses an unregistered edge type — the sacred_route route in', () => {
    const g = makeGraph();
    const result = createRelationEdge(g, 'agent', 'town', 'totally_unregistered', 7);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not registered in EDGE_SCHEMA/);
    expect(g.getAllEdges()).toHaveLength(0);
  });

  it('refuses a registered type with the wrong endpoint', () => {
    const g = makeGraph();
    // `sacred_route` is actor→location; aim it at an actor instead.
    const result = createRelationEdge(g, 'agent', 'agent2', 'sacred_route', 7);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/target must be/);
    expect(g.getAllEdges()).toHaveLength(0);
  });

  it('writes sacred_route now that it is registered — the shipped content still works', () => {
    const g = makeGraph();
    const result = createRelationEdge(g, 'agent', 'town', 'sacred_route', 7, { routeType: 'pilgrimage' });

    expect(result.success).toBe(true);
    const edges = g.getOutgoingEdges('agent', 'sacred_route');
    expect(edges).toHaveLength(1);
    expect(edges[0].properties.routeType).toBe('pilgrimage');
  });
});

describe('THR-1177 — member_of ratchet guards', () => {
  it('joinFaction refuses a target that is not a faction or group', () => {
    const g = makeGraph();
    const result = joinFaction(g, 'agent', 'agent2', 3);

    expect(result.changed).toBe(false);
    expect(g.getOutgoingEdges('agent', 'member_of')).toHaveLength(0);
  });

  it('joinFaction still admits to a real faction', () => {
    const g = makeGraph();
    const result = joinFaction(g, 'agent', 'guild', 3);

    expect(result.changed).toBe(true);
    expect(g.getOutgoingEdges('agent', 'member_of')).toHaveLength(1);
  });

  it('getHighestFactionRank ignores a rank on a non-faction member_of edge', () => {
    const g = makeGraph();
    // The latent defect named in the audit: a schema-legal individual→individual
    // member_of carrying a high rank used to win the max and inflate leverage.
    g.addEdge({
      id: 'bogus', source: 'agent', target: 'agent2', type: 'member_of',
      properties: { role: 'member', rank: 1, joinedTick: 0 },
    });
    expect(getHighestFactionRank(g, 'agent')).toBe(0);

    g.addEdge({
      id: 'real', source: 'agent', target: 'guild', type: 'member_of',
      properties: { role: 'member', rank: 0.4, joinedTick: 0 },
    });
    expect(getHighestFactionRank(g, 'agent')).toBeCloseTo(0.4);
  });
});

describe('THR-1177 — registry completeness', () => {
  it('registers every family that has a live writer', () => {
    for (const type of ['commissions', 'issues', 'sacred_route', 'knows_spell', 'embodies_spirit_of'] as EdgeType[]) {
      expect(EDGE_SCHEMA[type], `${type} missing from EDGE_SCHEMA`).toBeDefined();
      expect(EDGE_SCHEMA[type].type).toBe(type);
    }
  });

  it('validateEdgeEndpoints treats the widened rows as legal', () => {
    // The two drift corrections, asserted as the shapes their real writers produce.
    expect(validateEdgeEndpoints('belongs_to', 'region', 'actor')).toBeNull();
    expect(validateEdgeEndpoints('located_at', 'actor', 'sublocation')).toBeNull();
    expect(validateEdgeEndpoints('located_at', 'actor', 'location')).toBeNull();
    // ...and that widening did not turn the row into a wildcard.
    expect(validateEdgeEndpoints('located_at', 'actor', 'actor')).not.toBeNull();
    expect(validateEdgeEndpoints('belongs_to', 'event', 'actor')).not.toBeNull();
  });
});

/**
 * Window widened 120 → 150 ticks (THR-1321), and the reason belongs here rather than
 * in a commit message, because the number is now load-bearing.
 *
 * `trades_with` is a **rare** family: measured across seeds 42/99/7/13 at 120 ticks it
 * fires 1, 0, 0, 0 times on the pre-THR-1321 engine. This smoke passed on a population
 * of a handful from one seed — so any change that shifts world trajectory at all can
 * push the family's first occurrence past the window and read as a suppression.
 *
 * THR-1321 did exactly that, benignly. It stopped `strategicActionLifecycle` dropping
 * `mintQueue` and `bindings` from `strategicState` once per tick, so binder mints are
 * actually born; the extra people move the world. Undertaking completions rose on every
 * seed (395→442, 180→318, 256→472, 378→481 across 42/99/7/13), and trade routes still
 * fire — seed 42 writes 5 of them by tick 250. Only the 120-tick window went empty.
 *
 * 150 is the measured minimum that restores the family (2 routes). 180 was measured too
 * and yields the same 2 for ~50% more runtime, so the extra ticks buy no margin.
 *
 * **This widened the window, it did not weaken the assertion.** The claim is unchanged
 * and still falsifiable: the family must really have been written this run. If it goes
 * to 0 again, do not raise this number reflexively — measure whether routes still fire
 * at all (they did here, at 250 ticks) before deciding it is the window and not a real
 * suppression.
 */
describe('THR-1177 — 150-tick seeded smoke', () => {
  let state: GameState;
  /** Every `[GraphSchema]` line console.warn saw during the run (THR-830). */
  let schemaWarnings: string[];
  /** Edge types written during the run, counted at creation — including ones later removed. */
  let writtenByType: Map<string, number>;
  /**
   * The constructed route (THR-1349 slice 2): the real `trades_with` writer driven
   * once, after the organic run, between two place-tier endpoints the
   * `strategic_establish_trade_route` template targets, by a real spotlight mortal.
   * `null` when the construction found nothing to build with — asserted, never skipped.
   */
  let constructedRoute: { success: boolean; error?: string; reason: string } | null;

  beforeAll(() => {
    const runtime = createSimulationRuntime();
    const archetype = generateArchetypes(4, 42)[0];
    const preset = MAP_SIZE_PRESETS.medium;
    const { state: init } = initializeGameState(
      archetype, 'SmokeBot', createBalancedCosmology(), 42, preset.cols, preset.rows,
    );
    state = init;

    // THR-830: the final-graph assertion below cannot see an edge that was written and
    // later removed, which is precisely how `trades_with` escaped it (routes expire
    // before tick 120). So record both halves *during* the run: the warnings as they
    // fire, and a creation-time census that a later removal cannot erase.
    schemaWarnings = [];
    writtenByType = new Map();
    const realWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      const line = args.map(String).join(' ');
      if (line.includes('[GraphSchema]')) schemaWarnings.push(line);
      else realWarn(...args);
    };
    const graph = state.graph;
    const realAddEdge = graph.addEdge.bind(graph);
    (graph as unknown as { addEdge: typeof graph.addEdge }).addEdge = (edge) => {
      writtenByType.set(edge.type, (writtenByType.get(edge.type) ?? 0) + 1);
      return realAddEdge(edge);
    };

    try {
      for (let t = 0; t < 150; t++) state = runTick(state, [], runtime);

      // THR-1349 slice 2 — the route claim's supply is constructed, not organic.
      //
      // The assertion below used to depend on the seeded world happening to found a
      // trade route inside 150 ticks. THR-1329 measured that as one seed in twelve,
      // from a single mortal; under the live decision board it is zero on this seed
      // too (the mortal who founded them does not *want* to — THR-1349 pass 2), so
      // the guard had become a vacuity guard on one seed's luck. What the claim
      // actually needs is the REAL writer exercised on a generated world with the
      // hooks still installed: `createTradeRoute` is the payoff
      // `strategic_establish_trade_route` fires at completion (`mutationHint:
      // create_trade_route`), so driving it here between two endpoints that template
      // targets, by a mortal the decision loop runs, is the writer the organic run
      // was standing in for. Whether mortals *choose* to found routes is the census's
      // question (THR-1348 owns the route economy), not a schema question.
      const founder = graph.getNodesByType('actor').find(isAutonomousDecisionActor);
      const endpoints = getPlaceTierLocations(graph).filter((n) => {
        const subtype = n.properties?.locationSubtype as string | undefined;
        return subtype === 'town' || subtype === 'city' || subtype === 'market'
          || subtype === 'trading_post' || subtype === 'port';
      });
      const [a, b] = endpoints;
      if (!founder) {
        constructedRoute = { success: false, reason: 'no autonomous spotlight mortal in the generated world' };
      } else if (!a || !b) {
        constructedRoute = { success: false, reason: `only ${endpoints.length} route-capable endpoint(s) in the generated world` };
      } else {
        const result = createTradeRoute(graph, a.id, b.id, founder.id, state.tick);
        constructedRoute = { success: result.success, error: result.error, reason: `${a.id} → ${b.id} by ${founder.id}` };
      }
    } finally {
      console.warn = realWarn;
      (graph as unknown as { addEdge: typeof graph.addEdge }).addEdge = realAddEdge;
    }
  }, 600_000);

  /**
   * Scope note, so this is not read as more than it measures: it inspects the
   * **final** graph, so an edge written illegally and later removed escapes it. That
   * blind spot was not hypothetical — `trades_with` is written location→location, was
   * declared actor→actor, warned twice per route all run, and still appeared here as
   * neither a violation nor an edge, because its routes expire before tick 120. THR-830
   * corrected the row and closed the hole in this file's coverage: the sibling test
   * below reads the warnings recorded *during* the run, so a family that is created and
   * later removed can no longer pass by being absent at the end.
   *
   * The complementary evidence that the guards refuse nothing *legal* is that the total
   * edge count is unchanged across THR-1177: 5,299 before and after, same seed.
   */
  it('produces a world with zero schema violations', () => {
    const g = state.graph;
    const violations: string[] = [];

    for (const e of g.getAllEdges()) {
      const schema = EDGE_SCHEMA[e.type as EdgeType];
      if (!schema) {
        violations.push(`unregistered type "${e.type}" (edge ${e.id})`);
        continue;
      }
      const s = g.getNode(e.source);
      const t = g.getNode(e.target);
      if (s && !matchesNodeType(s.type, schema.sourceNodeType)) {
        violations.push(`${e.type}: source "${s.type}" not in ${JSON.stringify(schema.sourceNodeType)}`);
      }
      if (t && !matchesNodeType(t.type, schema.targetNodeType)) {
        violations.push(`${e.type}: target "${t.type}" not in ${JSON.stringify(schema.targetNodeType)}`);
      }
    }

    // Guard against a vacuous pass: a world that generated no edges would also report
    // zero violations. The measured run carries ~5,300.
    expect(g.getAllEdges().length).toBeGreaterThan(1000);
    expect(violations.slice(0, 20)).toEqual([]);
  });

  /**
   * THR-830. The three assertions are one claim in three parts, and each is here to
   * stop a specific way the other two could pass while saying nothing:
   *
   *  1. `trades_with` routes really were created with the hooks installed — otherwise
   *     "no warnings" is the trivially-true statement of a world that never exercised
   *     the family. Since THR-1349 slice 2 this is guaranteed by construction (the
   *     real writer is driven once after the organic run, see `beforeAll`) rather
   *     than by the seed's merchants happening to found one inside the window — a
   *     supply that was one seed in twelve (THR-1329) and zero under the live board.
   *  2. No `trades_with` warning fired at creation time, which is the actual
   *     Done-when. The final-graph test above cannot make this claim: organic routes
   *     are gone by tick 120.
   *  3. No *other* family started warning either, so a future row correction cannot
   *     be graded on the one family it was aimed at while breaking a neighbour.
   */
  it('writes trade routes without a single schema warning', () => {
    // The construction itself must have succeeded — an empty world is a defect in the
    // construction, never a pass (the constructed-assertion rule, THR-1349 plan
    // § Fail-soft). The reason names what was missing when it fails.
    expect(constructedRoute?.reason).toBeDefined();
    expect(constructedRoute?.error).toBeUndefined();
    expect(constructedRoute?.success).toBe(true);

    expect(writtenByType.get('trades_with') ?? 0).toBeGreaterThan(0);
    expect(schemaWarnings.filter((w) => w.includes('"trades_with"'))).toEqual([]);
    expect(schemaWarnings).toEqual([]);
  });

  /**
   * THR-830 pins the row itself, so a later edit cannot re-widen it back to the
   * `['actor','location']` union without this failing and having to say why. The union
   * was rejected on measured evidence: it would have silenced the warning while
   * admitting `actor -> location`, the shape the four `action.gold.*` trade ops write
   * (THR-1188) and the one `tradeRouteMarkers` cannot place on the map.
   */
  it('declares trades_with as location-to-location and nothing wider', () => {
    expect(EDGE_SCHEMA.trades_with.sourceNodeType).toBe('location');
    expect(EDGE_SCHEMA.trades_with.targetNodeType).toBe('location');
    expect(validateEdgeEndpoints('trades_with', 'location', 'location')).toBeNull();
    expect(validateEdgeEndpoints('trades_with', 'actor', 'actor')).not.toBeNull();
    expect(validateEdgeEndpoints('trades_with', 'actor', 'location')).not.toBeNull();
  });

  it('leaves worldgen and historical-culture seeding intact after the belongs_to widening', () => {
    const g = state.graph;
    const cultureEdges = g.getAllEdges().filter(e => e.type === 'belongs_to');
    const fromRegion = cultureEdges.filter(e => g.getNode(e.source)?.type === 'region');

    // The 18/315 the audit measured: these are the deliberate historical-culture edges.
    // If the widening had been done by narrowing the writer instead, this would be 0.
    expect(cultureEdges.length).toBeGreaterThan(100);
    expect(fromRegion.length).toBeGreaterThan(0);
  });
});
