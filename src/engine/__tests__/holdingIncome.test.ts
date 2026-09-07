/**
 * Holding income — THR-1428 R3.
 *
 * Three sources, one interval, and one exclusion that is the whole reason the pass
 * exists as its own phase: it pays **mortals**, never faction treasuries. Each guard
 * is falsified rather than merely exercised — the faction arm asserts that a faction
 * controlling the *same* settlement receives nothing while a mortal controlling one
 * receives something, so a pass that paid everybody would fail here rather than pass
 * on an empty faction population.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { payHoldingIncome, collectHoldingPayments, titheMultiplier } from '../holdingIncome';
import type { GameState } from '../../types/gameState';
import { readWealth, WEALTH_SUBLOCATION_INCOME } from '../wealth';
import {
  HOLDING_INCOME_INTERVAL_TICKS,
  HOLDING_TITHE_PROSPERITY_THRESHOLDS,
  HOLDING_TITHE_PROSPERITY_MULTIPLIER,
  WEALTH_CONTROLLED_LOCATION_TITHE,
} from '../../data/strategic-action-constants';

const MORTAL = 'actor_holder';
const FACTION = 'actor_guild';
const TOWN = 'loc_town';
const OTHER_TOWN = 'loc_other';
const PLACE = 'loc_warehouse';
const ROUTE_A = 'loc_a';
const ROUTE_B = 'loc_b';

function world(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: MORTAL, name: 'Sila Vane', type: 'actor', properties: { actorType: 'individual', wealth: 10 } });
  graph.addNode({ id: FACTION, name: 'The Ledger', type: 'actor', properties: { actorType: 'faction', wealth: 10 } });
  graph.addNode({ id: TOWN, name: 'Wickford', type: 'location', properties: { locationSubtype: 'town', prosperity: 0.6 } });
  graph.addNode({ id: OTHER_TOWN, name: 'Harrow', type: 'location', properties: { locationSubtype: 'town', prosperity: 0.6 } });
  graph.addNode({
    id: PLACE, name: 'The Counting House', type: 'location',
    properties: { sublocationTypeId: 'warehouse', parentLocationId: TOWN },
  });
  graph.addNode({ id: ROUTE_A, name: 'Alder', type: 'location', properties: { locationSubtype: 'town', prosperity: 0.5 } });
  graph.addNode({ id: ROUTE_B, name: 'Bramm', type: 'location', properties: { locationSubtype: 'town', prosperity: 0.5 } });
  return graph;
}

function stateAt(graph: WorldGraph, tick: number): GameState {
  return { graph, tick, seed: 42, chronicleEntries: [] } as unknown as GameState;
}

/** A seized route: `controlledBy` is the seize verb's own write. */
function seizeRoute(graph: WorldGraph, holderId: string, volume = 4, taxRate = 0.5, threatened = false) {
  graph.addEdge({
    id: 'e_route', source: ROUTE_A, target: ROUTE_B, type: 'trades_with',
    properties: { volume, taxRate, controlledBy: holderId, threatened, goodsType: 'grain' },
  });
}

describe('what a mortal holds yields', () => {
  it('pays a seized route, a freehold and a controlled Location on the interval', () => {
    const graph = world();
    seizeRoute(graph, MORTAL);
    graph.addEdge({ id: 'e_owns', source: MORTAL, target: PLACE, type: 'owns', properties: { acquiredTick: 0, via: 'undertaking' } });
    graph.addEdge({
      id: 'e_controls', source: MORTAL, target: TOWN, type: 'controls',
      properties: { controlType: 'strategic' },
    });

    const before = readWealth(graph.getNode(MORTAL)!.properties);
    const result = payHoldingIncome(stateAt(graph, HOLDING_INCOME_INTERVAL_TICKS));

    expect(result.payments.map(p => p.reason).sort())
      .toEqual(['location_tithe', 'route_control', 'sublocation_income']);
    expect(readWealth(graph.getNode(MORTAL)!.properties)).toBeGreaterThan(before);
  });

  it('pays nothing on a tick that is not a payment boundary', () => {
    const graph = world();
    graph.addEdge({ id: 'e_owns', source: MORTAL, target: PLACE, type: 'owns', properties: { acquiredTick: 0, via: 'undertaking' } });

    const offBoundary = HOLDING_INCOME_INTERVAL_TICKS + 1;
    expect(offBoundary % HOLDING_INCOME_INTERVAL_TICKS).not.toBe(0);
    const result = payHoldingIncome(stateAt(graph, offBoundary));

    expect(result.payments).toHaveLength(0);
    expect(readWealth(graph.getNode(MORTAL)!.properties)).toBe(10);
  });

  it('pays a mortal claimant and NOT a faction controlling an identical settlement', () => {
    // Both arms in one world: a pass that paid everybody fails here. A test with only
    // the faction arm would pass on a pass that paid nobody at all.
    const graph = world();
    graph.addEdge({
      id: 'e_mortal_controls', source: MORTAL, target: TOWN, type: 'controls',
      properties: { controlType: 'strategic' },
    });
    graph.addEdge({
      id: 'e_faction_controls', source: FACTION, target: OTHER_TOWN, type: 'controls',
      properties: { controlType: 'strategic' },
    });

    const payments = collectHoldingPayments(graph);
    expect(payments.map(p => p.holderId)).toEqual([MORTAL]);
  });

  it('collects nothing from a threatened route — control you cannot enforce collects nothing', () => {
    const held = world();
    seizeRoute(held, MORTAL, 4, 0.5, false);
    expect(collectHoldingPayments(held).some(p => p.reason === 'route_control')).toBe(true);

    const threatened = world();
    seizeRoute(threatened, MORTAL, 4, 0.5, true);
    expect(collectHoldingPayments(threatened).some(p => p.reason === 'route_control')).toBe(false);
  });

  it('collects no tithe from a ruin', () => {
    const graph = world();
    graph.getNode(TOWN)!.properties.locationSubtype = 'ruins';
    graph.addEdge({
      id: 'e_controls', source: MORTAL, target: TOWN, type: 'controls',
      properties: { controlType: 'strategic' },
    });
    expect(collectHoldingPayments(graph).some(p => p.reason === 'location_tithe')).toBe(false);
  });

  it('ignores a `controls` edge that is not strategic control', () => {
    const graph = world();
    graph.addEdge({
      id: 'e_controls', source: MORTAL, target: TOWN, type: 'controls',
      properties: { controlType: 'military' },
    });
    expect(collectHoldingPayments(graph)).toHaveLength(0);
  });

  it('pays a freehold at the constant, once per holding', () => {
    const graph = world();
    graph.addEdge({ id: 'e_owns', source: MORTAL, target: PLACE, type: 'owns', properties: { acquiredTick: 0, via: 'undertaking' } });
    const payments = collectHoldingPayments(graph);
    expect(payments).toHaveLength(1);
    expect(payments[0].amount).toBe(WEALTH_SUBLOCATION_INCOME);
  });

  it('makes a rich town tithe more than a poor one, at the banded steps', () => {
    const [low, mid, high] = HOLDING_TITHE_PROSPERITY_THRESHOLDS;
    expect(titheMultiplier(low - 0.01)).toBe(0);
    expect(titheMultiplier(low)).toBe(HOLDING_TITHE_PROSPERITY_MULTIPLIER[0]);
    expect(titheMultiplier(mid)).toBe(HOLDING_TITHE_PROSPERITY_MULTIPLIER[1]);
    expect(titheMultiplier(high)).toBe(HOLDING_TITHE_PROSPERITY_MULTIPLIER[2]);
    // The ordering is the design, not the numbers: a step table that flattened would
    // pass every equality above only if the constants themselves changed.
    expect(HOLDING_TITHE_PROSPERITY_MULTIPLIER[2])
      .toBeGreaterThan(HOLDING_TITHE_PROSPERITY_MULTIPLIER[0]);
  });

  it('scales the tithe by the town it is taken from', () => {
    const rich = world();
    rich.getNode(TOWN)!.properties.prosperity = HOLDING_TITHE_PROSPERITY_THRESHOLDS[2];
    rich.addEdge({
      id: 'e_controls', source: MORTAL, target: TOWN, type: 'controls',
      properties: { controlType: 'strategic' },
    });

    const poor = world();
    poor.getNode(TOWN)!.properties.prosperity = HOLDING_TITHE_PROSPERITY_THRESHOLDS[0];
    poor.addEdge({
      id: 'e_controls', source: MORTAL, target: TOWN, type: 'controls',
      properties: { controlType: 'strategic' },
    });

    const richAmount = collectHoldingPayments(rich)[0].amount;
    const poorAmount = collectHoldingPayments(poor)[0].amount;
    expect(richAmount).toBeGreaterThan(poorAmount);
    expect(richAmount).toBe(WEALTH_CONTROLLED_LOCATION_TITHE * HOLDING_TITHE_PROSPERITY_MULTIPLIER[2]);
  });

  it('survives a holding whose node the world has since removed', () => {
    // The graph refuses a dangling edge at write time, so the only way to reach this
    // state is the way the world reaches it: hold something, then have it razed.
    const graph = world();
    graph.addEdge({ id: 'e_owns', source: MORTAL, target: PLACE, type: 'owns', properties: { acquiredTick: 0, via: 'undertaking' } });
    expect(collectHoldingPayments(graph)).toHaveLength(1);

    graph.removeNode(PLACE);
    expect(() => payHoldingIncome(stateAt(graph, HOLDING_INCOME_INTERVAL_TICKS))).not.toThrow();
    expect(collectHoldingPayments(graph)).toHaveLength(0);
  });
});
