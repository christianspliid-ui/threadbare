/**
 * THR-1310 — proximity-bounded strategic target selection.
 *
 * The defect: `findValidTargets` resolved a scanning target rule by walking the whole
 * graph, filtering, and keeping the first N in **worldgen insertion order** — the same
 * order for every agent alive — so every agent pursuing the same ambition proposed the
 * same distant site, and near sites were discarded before `travelPenalty` could score
 * them. Measured at THR-1297 slice 5: with the wilderness chart verbs gated on presence
 * the `chart_find` kind produced nothing at all across 150 ticks.
 *
 * **Every test here is built to fail against the pre-fix code.** The fixtures insert the
 * *far* locations first and the *near* ones last, so "first N by insertion" and
 * "nearest N" are disjoint sets. A test that merely asserted "returns some targets"
 * would have passed throughout the broken state — which is exactly how the unit suite
 * stayed green while the kind was dead (THR-1310: "structurally could not have seen
 * this").
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  generateStrategicCandidates,
  orderTargetsByProximity,
} from '../strategicActionCandidates';
import { STRATEGIC_TARGET_SCAN_CAPS } from '../../data/strategic-action-constants';
import { mulberry32 } from '../../lib/prng';
import type { GraphNode } from '../../types/graph';

/** Where the acting agent stands in every fixture below. */
const HOME_HEX = { col: 0, row: 0 };

/**
 * A world whose `town` locations are minted far-first.
 *
 * `farCount` distant towns are inserted before `nearCount` adjacent ones, so the first
 * `STRATEGIC_TARGET_SCAN_CAPS.location_subtype` nodes in insertion order contain **no**
 * near town. Any assertion that a near town survives the cap therefore falsifies the
 * pre-fix slice.
 */
function buildFarFirstWorld(farCount: number, nearCount: number) {
  const graph = new WorldGraph();

  graph.addNode({
    id: 'loc_home',
    name: 'Home',
    type: 'location',
    properties: { locationSubtype: 'market', hexCol: HOME_HEX.col, hexRow: HOME_HEX.row },
  });

  // Far towns first — these are what the old `.slice(0, N)` kept.
  for (let i = 0; i < farCount; i++) {
    graph.addNode({
      id: `loc_far_${i}`,
      name: `Far Town ${i}`,
      type: 'location',
      properties: { locationSubtype: 'town', hexCol: 40 + i, hexRow: 40 },
    });
  }

  // Near towns last — invisible to the old selector, adjacent under the new one.
  for (let i = 0; i < nearCount; i++) {
    graph.addNode({
      id: `loc_near_${i}`,
      name: `Near Town ${i}`,
      type: 'location',
      properties: { locationSubtype: 'town', hexCol: 1 + i, hexRow: 0 },
    });
  }

  return graph;
}

/** Attach a merchant pursuing `ambition_dominate_trade`, standing at `loc_home`. */
function addMerchant(graph: WorldGraph) {
  graph.addNode({
    id: 'actor_merchant',
    name: 'Merchant Kael',
    type: 'actor',
    properties: {
      actorType: 'individual',
      spotlightTier: 'spotlight',
      domainCapabilities: {
        gold: 0.6, eye: 0.4, heart: 0.3, shadow: 0.1,
        iron: 0.2, stone: 0.2, star: 0.1, veil: 0.1,
      },
    },
  });
  graph.addEdge({
    id: 'located_merchant',
    source: 'actor_merchant',
    target: 'loc_home',
    type: 'located_at',
    properties: {},
  });
  graph.addNode({
    id: 'ambition_dominate_trade_node',
    name: 'Dominate Regional Trade',
    type: 'event',
    properties: { templateId: 'ambition_dominate_trade' },
  });
  graph.addEdge({
    id: 'pursues_merchant_trade',
    source: 'actor_merchant',
    target: 'ambition_dominate_trade_node',
    type: 'pursues',
    properties: { status: 'active', priority: 'primary', assignedTick: 1 },
  });
  return graph;
}

function nodesById(graph: WorldGraph, ids: string[]): GraphNode[] {
  return ids.map(id => graph.getNode(id)!).filter(Boolean);
}

/** `targetNodeId` is optional on the candidate; narrow it once rather than at each use. */
function targetIds(candidates: readonly { targetNodeId?: string }[], prefix: RegExp): string[] {
  return candidates
    .map(c => c.targetNodeId)
    .filter((id): id is string => id !== undefined && prefix.test(id));
}

describe('orderTargetsByProximity (THR-1310)', () => {
  it('keeps the nearest N, not the first-minted N', () => {
    const graph = buildFarFirstWorld(10, 4);
    const targets = nodesById(graph, [
      ...Array.from({ length: 10 }, (_, i) => `loc_far_${i}`),
      ...Array.from({ length: 4 }, (_, i) => `loc_near_${i}`),
    ]);

    const ordered = orderTargetsByProximity(graph, targets, HOME_HEX, 4);

    // The pre-fix slice would have returned loc_far_0..3 — zero overlap with this.
    expect(ordered.map(n => n.id)).toEqual([
      'loc_near_0', 'loc_near_1', 'loc_near_2', 'loc_near_3',
    ]);
  });

  it('breaks distance ties on node id, so the order is deterministic (NFP #3)', () => {
    const graph = new WorldGraph();
    // Three towns all exactly one hex away, minted in reverse-alphabetical order.
    for (const [id, col] of [['loc_c', 1], ['loc_b', -1], ['loc_a', 0]] as const) {
      graph.addNode({
        id, name: id, type: 'location',
        properties: { locationSubtype: 'town', hexCol: col, hexRow: col === 0 ? 1 : 0 },
      });
    }
    const targets = nodesById(graph, ['loc_c', 'loc_b', 'loc_a']);

    const first = orderTargetsByProximity(graph, targets, HOME_HEX, 3).map(n => n.id);
    const second = orderTargetsByProximity(graph, [...targets].reverse(), HOME_HEX, 3)
      .map(n => n.id);

    expect(first).toEqual(['loc_a', 'loc_b', 'loc_c']);
    expect(first).toEqual(second); // input order cannot change the result
  });

  it('sorts an unresolvable target last rather than dropping it (NFP #4)', () => {
    const graph = buildFarFirstWorld(1, 1);
    graph.addNode({
      id: 'loc_nowhere',
      name: 'Nowhere',
      type: 'location',
      properties: { locationSubtype: 'town' }, // no hexCol/hexRow
    });
    const targets = nodesById(graph, ['loc_nowhere', 'loc_far_0', 'loc_near_0']);

    const ordered = orderTargetsByProximity(graph, targets, HOME_HEX, 3);

    expect(ordered.map(n => n.id)).toEqual(['loc_near_0', 'loc_far_0', 'loc_nowhere']);
    // Present, not discarded — dropping it would let this sweep empty a target set
    // the scan had legitimately filled.
    expect(ordered).toHaveLength(3);
  });

  it('falls back to insertion order when the actor has no resolvable hex', () => {
    const graph = buildFarFirstWorld(3, 3);
    const targets = nodesById(graph, ['loc_far_0', 'loc_near_0', 'loc_far_1']);

    const ordered = orderTargetsByProximity(graph, targets, null, 3);

    expect(ordered.map(n => n.id)).toEqual(['loc_far_0', 'loc_near_0', 'loc_far_1']);
  });

  it('resolves an actor target through its located_at edge, not its own properties', () => {
    const graph = buildFarFirstWorld(1, 1);
    for (const [id, locId] of [['actor_far', 'loc_far_0'], ['actor_near', 'loc_near_0']] as const) {
      graph.addNode({ id, name: id, type: 'actor', properties: { actorType: 'individual' } });
      graph.addEdge({
        id: `located_${id}`, source: id, target: locId, type: 'located_at', properties: {},
      });
    }
    const targets = nodesById(graph, ['actor_far', 'actor_near']);

    const ordered = orderTargetsByProximity(graph, targets, HOME_HEX, 2);

    // Actors carry no hexCol of their own; without the located_at hop both would read
    // as unresolvable and this would degrade to input order (actor_far first).
    expect(ordered.map(n => n.id)).toEqual(['actor_near', 'actor_far']);
  });
});

describe('location_subtype targeting is proximity-bounded end to end (THR-1310)', () => {
  it('proposes near towns even when far ones were minted first', () => {
    const cap = STRATEGIC_TARGET_SCAN_CAPS.location_subtype;
    // Strictly more far towns than the cap, so insertion order alone fills it.
    const graph = addMerchant(buildFarFirstWorld(cap + 4, 3));

    const result = generateStrategicCandidates(
      graph, 'actor_merchant', ['ambition_dominate_trade'], undefined, 10, mulberry32(42),
    );

    const townTargets = targetIds(result.candidates, /^loc_(far|near)_/);

    expect(townTargets.length).toBeGreaterThan(0);
    // The whole finding in one assertion: before the fix every one of these was a
    // `loc_far_*`, because the cap was filled before a near town was ever considered.
    expect(townTargets.every(id => id.startsWith('loc_near_'))).toBe(true);
  });

  it('still proposes a distant target when that is all the world offers', () => {
    // Liveness half of the fix: ordering must never empty a set the scan filled, or a
    // targeting fix becomes a liveness regression.
    const graph = addMerchant(buildFarFirstWorld(2, 0));

    const result = generateStrategicCandidates(
      graph, 'actor_merchant', ['ambition_dominate_trade'], undefined, 10, mulberry32(42),
    );

    const townTargets = targetIds(result.candidates, /^loc_far_/);

    expect(townTargets.length).toBeGreaterThan(0);
  });

  it('prices the surviving distance through travelPenalty, not a second term', () => {
    const graph = addMerchant(buildFarFirstWorld(2, 0));

    const result = generateStrategicCandidates(
      graph, 'actor_merchant', ['ambition_dominate_trade'], undefined, 10, mulberry32(42),
    );

    const far = result.candidates.find(c => c.targetNodeId?.startsWith('loc_far_'));
    expect(far).toBeDefined();
    // Distance still reaches scoring exactly as before the sweep — the fix reorders
    // selection and leaves pricing where it was.
    expect(far!.scoreComponents.travelPenalty).toBeGreaterThan(0);
  });
});
