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
import { createRelationEdge } from '../strategicGraphOps';
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

describe('THR-1177 — 120-tick seeded smoke', () => {
  let state: GameState;

  beforeAll(() => {
    const runtime = createSimulationRuntime();
    const archetype = generateArchetypes(4, 42)[0];
    const preset = MAP_SIZE_PRESETS.medium;
    const { state: init } = initializeGameState(
      archetype, 'SmokeBot', createBalancedCosmology(), 42, preset.cols, preset.rows,
    );
    state = init;
    for (let t = 0; t < 120; t++) state = runTick(state, [], runtime);
  }, 600_000);

  /**
   * Scope note, so this is not read as more than it measures: it inspects the
   * **final** graph, so an edge written illegally and later removed would escape it.
   * That is not hypothetical — `trades_with` is written location→location against an
   * actor→actor row and warns during the run, but its routes expire before tick 120, so
   * it appears here as neither a violation nor an edge. That family is a genuine,
   * separately-ticketed drift (THR-830) on `createTradeRoute`, which writes via
   * `graph.addEdge` directly and so passes through neither chokepoint — out of scope
   * here, and deliberately not "fixed" by widening a row to make a warning go away.
   *
   * The complementary evidence that the guards refuse nothing *legal* is that the total
   * edge count is unchanged across this change: 5,299 before and after, same seed.
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
