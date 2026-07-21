/**
 * Harvest-verb graph-op tests (THR-616 P2 — Mortal Economy, first divine verbs).
 *
 * Covers the two ops behind Bless the Harvest and Blight, which move the P1
 * resource stock substrate (`resourceEconomy.ts`) rather than only the prosperity
 * scalar:
 *   bless_harvest  — raise every staple resource's quantity toward Glut
 *   blight_harvest — lower every staple resource's quantity toward Famine
 *
 * These ops route through `executeGraphOps` exactly as the action pipeline fires
 * them (resolution forwards them via `graphOnlyOps`). Assertions read the mutated
 * `resources` bag directly and confirm the stock-tier derivation moves with it.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { executeGraphOps, resetOpCounter } from '../graphOpExecutor';
import type { GraphOpContext, GraphOp } from '../../types/graphOp';
import type { ResourceInstance } from '../../types/resource';
import { readResources, deriveLocationStockTiers } from '../resourceEconomy';
import {
  LOC_BLESS_HARVEST_STOCK_DELTA,
  LOC_BLIGHT_STOCK_DELTA,
} from '../../data/location-action-constants';

const ascendantId = 'asc.player';
const hostId = 'loc.town';

const ctx: GraphOpContext = {
  actorId: ascendantId,
  targetId: hostId,
  locationId: hostId,
  tick: 10,
};

/** grain = staple, ore = strategic, gemstones = luxury (see resource-classes.ts). */
function makeGraph(resources: Record<string, ResourceInstance>): WorldGraph {
  const graph = new WorldGraph();
  resetOpCounter();
  graph.addNode({ id: ascendantId, type: 'actor', name: 'The Green One', properties: { actorType: 'ascendant' } });
  graph.addNode({
    id: hostId,
    type: 'location',
    name: 'Millbrook',
    properties: { locationType: 'location', prosperity: 40, resources },
  });
  return graph;
}

const instance = (quantity: number): ResourceInstance => ({ quantity, renewable: true, renewalRate: 0.05 });

describe('bless_harvest op', () => {
  it('raises staple quantities by the delta and leaves non-staples untouched', () => {
    const graph = makeGraph({
      grain: instance(40),      // staple → bumped
      ore: instance(40),        // strategic → untouched
      gemstones: instance(40),  // luxury → untouched
    });
    const ops: GraphOp[] = [{ op: 'bless_harvest', nodeId: '$target' }];
    const result = executeGraphOps(graph, ops, ctx);

    expect(result.allSucceeded).toBe(true);
    const after = readResources(graph.getNode(hostId)!.properties);
    expect(after.grain.quantity).toBe(40 + LOC_BLESS_HARVEST_STOCK_DELTA);
    expect(after.ore.quantity).toBe(40);
    expect(after.gemstones.quantity).toBe(40);
  });

  it('clamps a near-full staple at 100', () => {
    const graph = makeGraph({ grain: instance(90) });
    executeGraphOps(graph, [{ op: 'bless_harvest', nodeId: '$target' }], ctx);
    expect(readResources(graph.getNode(hostId)!.properties).grain.quantity).toBe(100);
  });

  it('lifts the derived stock tier upward after blessing', () => {
    const graph = makeGraph({ grain: instance(20) });
    const before = deriveLocationStockTiers(graph.getNode(hostId)!.properties, 0).perResource.grain.balance;
    executeGraphOps(graph, [{ op: 'bless_harvest', nodeId: '$target' }], ctx);
    const after = deriveLocationStockTiers(graph.getNode(hostId)!.properties, 0).perResource.grain.balance;
    expect(after).toBeGreaterThan(before);
  });
});

describe('blight_harvest op', () => {
  it('lowers staple quantities by the delta and leaves non-staples untouched', () => {
    const graph = makeGraph({
      grain: instance(60),
      ore: instance(60),
    });
    const result = executeGraphOps(graph, [{ op: 'blight_harvest', nodeId: '$target' }], ctx);

    expect(result.allSucceeded).toBe(true);
    const after = readResources(graph.getNode(hostId)!.properties);
    expect(after.grain.quantity).toBe(60 - LOC_BLIGHT_STOCK_DELTA);
    expect(after.ore.quantity).toBe(60);
  });

  it('clamps a near-empty staple at 0 (never negative)', () => {
    const graph = makeGraph({ grain: instance(10) });
    executeGraphOps(graph, [{ op: 'blight_harvest', nodeId: '$target' }], ctx);
    expect(readResources(graph.getNode(hostId)!.properties).grain.quantity).toBe(0);
  });
});

describe('harvest-verb fail-soft', () => {
  it('a location with no staple resources is a no-op success', () => {
    const graph = makeGraph({ ore: instance(50), gemstones: instance(50) });
    const result = executeGraphOps(graph, [{ op: 'bless_harvest', nodeId: '$target' }], ctx);
    expect(result.allSucceeded).toBe(true);
    const after = readResources(graph.getNode(hostId)!.properties);
    expect(after.ore.quantity).toBe(50);
    expect(after.gemstones.quantity).toBe(50);
  });

  it('a missing location returns an unsuccessful op result', () => {
    const graph = makeGraph({ grain: instance(50) });
    const result = executeGraphOps(graph, [{ op: 'blight_harvest', nodeId: 'loc.nowhere' }], {
      ...ctx,
      targetId: 'loc.nowhere',
      locationId: 'loc.nowhere',
    });
    expect(result.allSucceeded).toBe(false);
    // The real staple is untouched — the op targeted a node that does not exist.
    expect(readResources(graph.getNode(hostId)!.properties).grain.quantity).toBe(50);
  });
});
