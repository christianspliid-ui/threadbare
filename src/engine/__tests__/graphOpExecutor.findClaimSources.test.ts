/**
 * Find / Claim essence-source graph-op tests (THR-611 — Divine Economy, Slice 4).
 *
 * Covers the front half of the loop:
 *   find_source  — reveal latent (undiscovered) sources within hex range of a target
 *   claim_source — bind a discovered, uncontrolled source with a controls edge
 *
 * These run through `executeGraphOps` exactly as the action pipeline fires them.
 * Assertions read the mutated `essenceSource` bag + `controls` edges directly and
 * confirm the claimed (worldgen-typed) source's income actually flows.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { executeGraphOps, resetOpCounter } from '../graphOpExecutor';
import type { GraphOpContext, GraphOp } from '../../types/graphOp';
import type { EssenceSource } from '../../types/essenceSource';
import { readEssenceSource, computeSourceIncome } from '../essenceSources';
import { BASE_SOURCE_INCOME, SOURCE_DISCOVERY_RANGE_HOPS } from '../../data/essence-sources';

const ascendantId = 'asc.player';
const centerId = 'loc.center';

function latentSource(sphere: string): EssenceSource {
  return {
    kind: 'placeOfPower',
    sphereAffinity: sphere as EssenceSource['sphereAffinity'],
    sanctity: 0,
    tier: 'dormant',
    // discoveredBy intentionally undefined → latent.
    originTick: 0,
  };
}

/**
 * Build a graph with the ascendant + a center location + latent sources at given
 * hex offsets from the center. The center itself carries no source.
 */
function makeGraph(sources: Array<{ id: string; col: number; row: number; sphere: string }>): WorldGraph {
  const graph = new WorldGraph();
  resetOpCounter();
  graph.addNode({ id: ascendantId, type: 'actor', name: 'Player', properties: { actorType: 'ascendant' } });
  graph.addNode({
    id: centerId,
    type: 'location',
    name: 'Center',
    properties: { locationType: 'monument', hexCol: 10, hexRow: 10 },
  });
  for (const s of sources) {
    graph.addNode({
      id: s.id,
      type: 'location',
      name: s.id,
      properties: { locationType: 'grove', hexCol: s.col, hexRow: s.row, essenceSource: latentSource(s.sphere) },
    });
  }
  return graph;
}

const ctx = (targetId: string): GraphOpContext => ({
  actorId: ascendantId,
  targetId,
  locationId: targetId,
  tick: 5,
});

const srcOf = (graph: WorldGraph, id: string) => readEssenceSource(graph.getNode(id)?.properties);

describe('find_source op', () => {
  it('reveals latent sources within range and leaves out-of-range sources hidden', () => {
    const graph = makeGraph([
      { id: 'loc.near', col: 11, row: 10, sphere: 'force' }, // distance 1 → in range
      { id: 'loc.far', col: 10 + SOURCE_DISCOVERY_RANGE_HOPS + 2, row: 10, sphere: 'life' }, // out of range
    ]);
    const ops: GraphOp[] = [{ op: 'find_source', nodeId: '$target' }];
    const result = executeGraphOps(graph, ops, ctx(centerId));

    expect(result.allSucceeded).toBe(true);
    expect(srcOf(graph, 'loc.near')?.discoveredBy).toBe(ascendantId);
    expect(srcOf(graph, 'loc.far')?.discoveredBy).toBeUndefined();
  });

  it('honors an explicit discoveryRangeHops override', () => {
    const graph = makeGraph([{ id: 'loc.two', col: 12, row: 10, sphere: 'force' }]); // distance 2
    // Default range would reveal it; range 1 should not.
    executeGraphOps(graph, [{ op: 'find_source', nodeId: '$target', discoveryRangeHops: 1 }], ctx(centerId));
    expect(srcOf(graph, 'loc.two')?.discoveredBy).toBeUndefined();
  });

  it('is a no-op success when there is nothing latent in range', () => {
    const graph = makeGraph([]);
    const result = executeGraphOps(graph, [{ op: 'find_source', nodeId: '$target' }], ctx(centerId));
    expect(result.allSucceeded).toBe(true);
  });

  it('does not re-reveal an already-discovered source', () => {
    const graph = makeGraph([{ id: 'loc.near', col: 11, row: 10, sphere: 'force' }]);
    const host = graph.getNode('loc.near')!;
    graph.updateNode('loc.near', {
      properties: { ...host.properties, essenceSource: { ...latentSource('force'), discoveredBy: 'someone.else' } },
    });
    executeGraphOps(graph, [{ op: 'find_source', nodeId: '$target' }], ctx(centerId));
    // discoveredBy is left as the prior finder (already-discovered sources are skipped).
    expect(srcOf(graph, 'loc.near')?.discoveredBy).toBe('someone.else');
  });
});

describe('claim_source op', () => {
  it('binds a discovered source with a controls edge so its typed income flows', () => {
    const graph = makeGraph([{ id: 'loc.near', col: 11, row: 10, sphere: 'force' }]);
    // Discover it first (Find→Claim prerequisite).
    executeGraphOps(graph, [{ op: 'find_source', nodeId: '$target' }], ctx(centerId));

    const result = executeGraphOps(graph, [{ op: 'claim_source', nodeId: '$target' }], ctx('loc.near'));
    expect(result.allSucceeded).toBe(true);

    const controls = graph.getOutgoingEdges(ascendantId, 'controls');
    expect(controls.map((e) => e.target)).toContain('loc.near');

    // Worldgen-typed source pours its OWN locale sphere on claim (dormant = base).
    expect(computeSourceIncome(graph, ascendantId).force).toBeCloseTo(BASE_SOURCE_INCOME.placeOfPower, 10);
  });

  it('refuses to claim a source that has not been discovered', () => {
    const graph = makeGraph([{ id: 'loc.near', col: 11, row: 10, sphere: 'force' }]);
    const result = executeGraphOps(graph, [{ op: 'claim_source', nodeId: '$target' }], ctx('loc.near'));
    expect(result.allSucceeded).toBe(false);
    expect(graph.getOutgoingEdges(ascendantId, 'controls')).toHaveLength(0);
  });

  it('errors on a host with no essence source', () => {
    const graph = makeGraph([]);
    const result = executeGraphOps(graph, [{ op: 'claim_source', nodeId: '$target' }], ctx(centerId));
    expect(result.allSucceeded).toBe(false);
  });

  it('is idempotent: re-claiming an owned source does not add a second controls edge', () => {
    const graph = makeGraph([{ id: 'loc.near', col: 11, row: 10, sphere: 'force' }]);
    executeGraphOps(graph, [{ op: 'find_source', nodeId: '$target' }], ctx(centerId));
    executeGraphOps(graph, [{ op: 'claim_source', nodeId: '$target' }], ctx('loc.near'));
    executeGraphOps(graph, [{ op: 'claim_source', nodeId: '$target' }], ctx('loc.near'));
    expect(graph.getOutgoingEdges(ascendantId, 'controls').filter((e) => e.target === 'loc.near')).toHaveLength(1);
  });
});
