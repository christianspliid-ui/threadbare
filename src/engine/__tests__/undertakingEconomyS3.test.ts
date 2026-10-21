/**
 * THR-1967 (undertakings in the economy S3) — a trade run pays the trader, and the trade,
 * founding and home ambitions can be met by their own work; a regional monopoly meets a
 * faction's resource_acquisition. Plan: Docs/plans/2026-10-17-thr-1937-undertakings-in-the-economy.md
 * § Engine 5–7, § Done when S3.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { getUndertakingObjectType } from '../../data/undertaking-objects';
import type { ObjectVerbContext, ObjectVerbSemantic } from '../../data/undertaking-objects';
import type { GraphOpResult } from '../strategicGraphOps';
import type { GameState } from '../../types/gameState';
import type { GraphCondition } from '../../types/ambition';
import { evaluateGraphCondition, heldLaneIds } from '../graphConditions';
import { isFactionAmbitionMet, tradeRunPay } from '../undertakingEconomy';
import { phaseFactionAmbitions, FACTION_AMBITION_EVALUATION_INTERVAL } from '../factionAmbitions';
import { findAmbitionTemplateById } from '../../data/ambition-templates';
import { MEANS_CELL_COST } from '../../data/mortal-means-constants';
import { ORIGIN_LOCATION_PROP } from '../agentResidence';
import { AMBITION_KIND_FACTION, AMBITION_KIND_KEY } from '../ambitionShape';
import {
  DOMINATE_TRADE_COMPLETION,
  MEANS_CELL_COST_GUILD,
  TRADE_RUN_LAST_PAID_PROPERTY,
  TRADE_RUN_PAY_BASE,
  TRADE_RUN_PAY_COOLDOWN_TICKS,
  TRADE_RUN_PAY_MAX,
  TRADE_RUN_PAY_PER_UNIT,
} from '../../data/undertaking-economy-constants';

const FOUNDER = 'kael';
const SITE = 'loc_ashford';

function asState(graph: WorldGraph, tick = 10): GameState {
  return {
    tick, seed: 42, graph, tickEvents: [], chronicleEntries: [],
    dynamicFactionDefinitions: {},
  } as unknown as GameState;
}

function town(graph: WorldGraph, id: string, name: string, col: number, row: number, subtype = 'town'): void {
  graph.addNode({ id, type: 'location', name, properties: { locationSubtype: subtype, locationType: subtype, hexCol: col, hexRow: row, prosperity: 40 } });
}

function world(): WorldGraph {
  const graph = new WorldGraph();
  town(graph, SITE, 'Ashford', 10, 10);
  town(graph, 'loc_wolfton', 'Wolfton', 14, 10);
  town(graph, 'loc_brindle', 'Brindle', 10, 14);
  graph.addNode({
    id: FOUNDER, type: 'actor', name: 'Kael Thornweaver',
    properties: { actorType: 'individual', wealth: 30, domainCapabilities: { gold: 60, stone: 40, iron: 10 } },
  });
  graph.addEdge({ id: `loc_${FOUNDER}`, source: FOUNDER, target: SITE, type: 'located_at', properties: {} });
  return graph;
}

function runVerb(graph: WorldGraph, objectType: string, verb: string, extra: Partial<ObjectVerbContext> = {}, tick = 10): GraphOpResult {
  const semantic = getUndertakingObjectType(objectType as never)!.verbs[verb as 'create'] as ObjectVerbSemantic;
  const ctx = {
    state: asState(graph, tick), graph, actorId: FOUNDER, tick, projectId: 'proj_1',
    targetNodeId: SITE, handle: { kind: 'node', nodeId: SITE },
    ...extra,
  } as unknown as ObjectVerbContext;
  return semantic(ctx) as GraphOpResult;
}

/** Open a lane from Ashford with the create × route cell; returns the Route node id. */
function openLane(graph: WorldGraph, toId: string): string {
  const result = runVerb(graph, 'route', 'create', {
    targetNodeId: toId, handle: { kind: 'node', nodeId: toId }, originLocationId: SITE,
  } as Partial<ObjectVerbContext>);
  expect(result.success).toBe(true);
  return result.createdId!;
}

/** Run the use × route cell (conduct trade) on a Route node at `tick`. */
function tradeRun(graph: WorldGraph, routeId: string, tick: number): GraphOpResult {
  return runVerb(graph, 'route', 'use', { targetNodeId: routeId, handle: { kind: 'node', nodeId: routeId } }, tick);
}

const wealthOf = (graph: WorldGraph) => graph.getNode(FOUNDER)!.properties.wealth as number;

function milestone(templateId: string, milestoneId: string): GraphCondition {
  const t = findAmbitionTemplateById(templateId)!;
  return t.milestones.find(m => m.id === milestoneId)!.condition;
}

// ─── A trade run pays ────────────────────────────────────────────────────────

describe('THR-1967 — a trade run pays the trader', () => {
  it('pays base plus per unit carried, capped', () => {
    expect(tradeRunPay(0)).toBe(TRADE_RUN_PAY_BASE);
    expect(tradeRunPay(2)).toBe(TRADE_RUN_PAY_BASE + 2 * TRADE_RUN_PAY_PER_UNIT);
    expect(tradeRunPay(100)).toBe(TRADE_RUN_PAY_MAX);
    expect(tradeRunPay(Number.NaN)).toBe(TRADE_RUN_PAY_BASE);
  });

  it('pays at most once per trader per day, on any lane', () => {
    const graph = world();
    const route = openLane(graph, 'loc_wolfton');
    const before = wealthOf(graph);

    expect(tradeRun(graph, route, 20).success).toBe(true);
    expect(wealthOf(graph)).toBe(before + TRADE_RUN_PAY_BASE);
    expect(graph.getNode(FOUNDER)!.properties[TRADE_RUN_LAST_PAID_PROPERTY]).toBe(20);

    // A second run inside the day still trades, and pays nothing.
    expect(tradeRun(graph, route, 20 + TRADE_RUN_PAY_COOLDOWN_TICKS - 1).success).toBe(true);
    expect(wealthOf(graph)).toBe(before + TRADE_RUN_PAY_BASE);

    // The next day pays again.
    tradeRun(graph, route, 20 + TRADE_RUN_PAY_COOLDOWN_TICKS);
    expect(wealthOf(graph)).toBe(before + 2 * TRADE_RUN_PAY_BASE);
    expect(graph.getNode(FOUNDER)!.properties.lastWealthReason).toBe('trade_success');
  });

  it('pays on the lane the run actually traded, by what it carried', () => {
    const graph = world();
    const route = openLane(graph, 'loc_wolfton');
    const edge = graph.getEdgesByType('trades_with')[0];
    graph.updateEdge(edge.id, { properties: { ...edge.properties, carriedPerDay: 3 } });
    const before = wealthOf(graph);
    tradeRun(graph, route, 20);
    expect(wealthOf(graph)).toBe(before + tradeRunPay(3));
  });
});

// ─── The ambitions their own work can meet ───────────────────────────────────

describe('THR-1967 — ambitions are met by the undertakings that serve them', () => {
  it('a mortal who founds a town meets Found Something New\'s seat; a town merely held does not', () => {
    const graph = world();
    const seat = milestone('ambition_found_anew', 'found_seat');
    expect(evaluateGraphCondition(seat, graph, FOUNDER)).toBe(false);

    // Held but not founded: no constructed_by edge back to the holder.
    graph.addEdge({ id: 'owns_kael_wolfton', source: FOUNDER, target: 'loc_wolfton', type: 'owns', properties: {} });
    expect(evaluateGraphCondition(seat, graph, FOUNDER)).toBe(false);
    // …which is still "a town of any size" for Rebuild from Ashes.
    expect(evaluateGraphCondition(milestone('ambition_rebuild_from_ashes', 'rebuild_ground'), graph, FOUNDER)).toBe(true);

    const founded = runVerb(graph, 'location', 'create');
    expect(founded.success).toBe(true);
    expect(evaluateGraphCondition(seat, graph, FOUNDER)).toBe(true);
  });

  it('a mortal who opens two lanes and reaches Wealthy meets Dominate Regional Trade\'s two new milestones', () => {
    const graph = world();
    const lanes = milestone('ambition_dominate_trade', 'trade_lanes');
    const means = milestone('ambition_dominate_trade', 'trade_means');

    openLane(graph, 'loc_wolfton');
    expect(evaluateGraphCondition(lanes, graph, FOUNDER)).toBe(false);
    openLane(graph, 'loc_brindle');
    // Founded, tolled and held each — still two lanes, counted once each.
    expect(heldLaneIds(graph, FOUNDER).size).toBe(2);
    expect(evaluateGraphCondition(lanes, graph, FOUNDER)).toBe(true);

    expect(evaluateGraphCondition(means, graph, FOUNDER)).toBe(false);
    graph.getNode(FOUNDER)!.properties.wealth = 60;
    expect(evaluateGraphCondition(means, graph, FOUNDER)).toBe(true);

    const template = findAmbitionTemplateById('ambition_dominate_trade')!;
    expect(template.completion).toEqual(DOMINATE_TRADE_COMPLETION);
    expect(template.milestones).toHaveLength(DOMINATE_TRADE_COMPLETION.of);
  });

  it('a lane whose edge decayed away no longer counts as held', () => {
    const graph = world();
    openLane(graph, 'loc_wolfton');
    openLane(graph, 'loc_brindle');
    graph.removeEdge(graph.getEdgesByType('trades_with')[0].id);
    expect(heldLaneIds(graph, FOUNDER).size).toBe(1);
  });

  it('Protect the Home is met by walls in the home town, not elsewhere', () => {
    const graph = world();
    const ward = milestone('ambition_protect_the_home', 'protect_ward');
    graph.getNode(FOUNDER)!.properties[ORIGIN_LOCATION_PROP] = SITE;
    graph.addNode({ id: 'walls_wolfton', type: 'location', name: 'Walls', properties: { sublocationTypeId: 'sublocation-type.city-walls', parentLocationId: 'loc_wolfton' } });
    graph.addEdge({ id: 'contains_wolfton_walls', source: 'loc_wolfton', target: 'walls_wolfton', type: 'contains', properties: {} });
    expect(evaluateGraphCondition(ward, graph, FOUNDER)).toBe(false);

    graph.addNode({ id: 'walls_ashford', type: 'location', name: 'Walls', properties: { sublocationTypeId: 'sublocation-type.city-walls', parentLocationId: SITE } });
    graph.addEdge({ id: 'contains_ashford_walls', source: SITE, target: 'walls_ashford', type: 'contains', properties: {} });
    expect(evaluateGraphCondition(ward, graph, FOUNDER)).toBe(true);
  });

  it('an agent with no home reads false, never true', () => {
    const graph = world();
    expect(evaluateGraphCondition({ type: 'agent_home_has_place', placeType: 'city-walls' }, graph, FOUNDER)).toBe(false);
    expect(evaluateGraphCondition({ type: 'agent_means_at_least', tier: 'Destitute' }, graph, 'nobody')).toBe(false);
  });

  it('the old milestone shapes are gone', () => {
    const conditions = ['ambition_dominate_trade', 'ambition_found_anew', 'ambition_rebuild_from_ashes', 'ambition_protect_the_home']
      .flatMap(id => findAmbitionTemplateById(id)!.milestones.map(m => m.condition));
    const literal = conditions
      .filter((c): c is Extract<GraphCondition, { type: 'agent_controls_location' }> => c.type === 'agent_controls_location')
      .map(c => c.locationType);
    for (const gone of ['estate', 'camp', 'castle']) {
      expect(literal.some(t => t === gone || (Array.isArray(t) && t.includes(gone)))).toBe(false);
    }
  });
});

// ─── The guild's founding cost ───────────────────────────────────────────────

describe('THR-1967 — the guild founding cost row', () => {
  it('mortal wealth\'s cost table carries create × faction', () => {
    expect(MEANS_CELL_COST['create×faction']).toBe(MEANS_CELL_COST_GUILD);
  });
});

// ─── A faction's resource_acquisition is met by a regional monopoly ──────────

describe('THR-1967 — a regional monopoly meets resource_acquisition', () => {
  const tick = FACTION_AMBITION_EVALUATION_INTERVAL;

  function factionWithAmbition(monopoly: boolean): WorldGraph {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'f1', type: 'actor', name: 'Saltmarch Guild',
      properties: {
        actorType: 'faction', factionDefId: 'mercenary_company',
        ...(monopoly ? { regionalMonopolies: [{ resourceId: 'salt', anchorLocationId: SITE, share: 0.8, placeIds: ['p1'], sinceTick: 0 }] } : {}),
      },
    });
    graph.addNode({ id: 'amb_f1', type: 'ambition', name: 'acquisition', properties: { [AMBITION_KIND_KEY]: AMBITION_KIND_FACTION, ambitionType: 'resource_acquisition', priority: 0.5, targetNodeId: null } });
    graph.addEdge({ id: 'e_pursues_f1_amb', source: 'f1', target: 'amb_f1', type: 'pursues', properties: { priority: 0.5, status: 'active', milestones: [] } });
    return graph;
  }

  const activeType = (graph: WorldGraph) =>
    graph.getNode(graph.getOutgoingEdges('f1', 'pursues')[0]?.target ?? '')?.properties.ambitionType;

  it('switches to defensive_consolidation on its next review', () => {
    const graph = factionWithAmbition(true);
    expect(isFactionAmbitionMet(graph, 'f1', 'resource_acquisition')).toBe(true);
    phaseFactionAmbitions({ tick, seed: 42, graph } as unknown as GameState);
    expect(graph.getNode('amb_f1')).toBeUndefined();
    expect(activeType(graph)).toBe('defensive_consolidation');
  });

  it('keeps pursuing it without a monopoly', () => {
    const graph = factionWithAmbition(false);
    phaseFactionAmbitions({ tick, seed: 42, graph } as unknown as GameState);
    expect(activeType(graph)).toBe('resource_acquisition');
  });

  it('meets no other ambition', () => {
    const graph = factionWithAmbition(true);
    expect(isFactionAmbitionMet(graph, 'f1', 'territorial_expansion')).toBe(false);
  });
});
