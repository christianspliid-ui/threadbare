/**
 * fortify_location graph-op tests (THR-605 — six no-op ascendant actions, Slice 1).
 *
 * `loc.fortify` (spell "Iron Bulwark") raises a location's `fortificationMultiplier`
 * — a property `siegeResolution.ts` reads at both siege-setup (initial defender
 * momentum) and breach time. The op routes through `executeGraphOps` exactly as the
 * action pipeline fires it (resolution forwards it via `graphOnlyOps`). Assertions
 * read the mutated property directly and confirm the seed-from-subtype-base,
 * additive-bump, and grand-fortress cap behavior.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { executeGraphOps, resetOpCounter } from '../graphOpExecutor';
import type { GraphOpContext, GraphOp } from '../../types/graphOp';
import { getFortificationModifier } from '../siegeResolution';
import { FORTIFY_MULTIPLIER_BONUS, FORTIFY_MULTIPLIER_MAX } from '../../types/battle';

const ascendantId = 'asc.player';
const keepId = 'loc.keep';

const ctx: GraphOpContext = {
  actorId: ascendantId,
  targetId: keepId,
  locationId: keepId,
  tick: 42,
};

function makeGraph(subtype: string | undefined): WorldGraph {
  const graph = new WorldGraph();
  resetOpCounter();
  graph.addNode({ id: ascendantId, type: 'actor', name: 'The Warden', properties: { actorType: 'ascendant' } });
  graph.addNode({
    id: keepId,
    type: 'location',
    name: 'Grey Keep',
    properties: { locationType: 'location', locationSubtype: subtype },
  });
  return graph;
}

const fortification = (graph: WorldGraph): number | undefined =>
  graph.getNode(keepId)?.properties.fortificationMultiplier as number | undefined;

const fortify: GraphOp[] = [{ op: 'fortify_location', nodeId: '$target' }];

describe('fortify_location op', () => {
  it('seeds from the subtype base then adds one wall tier on the first cast', () => {
    // A keep is not in getFortificationModifier's switch → base 1 (unfortified default).
    const graph = makeGraph('keep');
    const result = executeGraphOps(graph, fortify, ctx);

    expect(result.allSucceeded).toBe(true);
    expect(fortification(graph)).toBe(getFortificationModifier('keep') + FORTIFY_MULTIPLIER_BONUS);
  });

  it('adds the bonus onto an already-fortified value across repeated casts', () => {
    const graph = makeGraph('keep');
    executeGraphOps(graph, fortify, ctx);
    const afterFirst = fortification(graph)!;
    executeGraphOps(graph, fortify, ctx);

    expect(fortification(graph)).toBe(Math.min(FORTIFY_MULTIPLIER_MAX, afterFirst + FORTIFY_MULTIPLIER_BONUS));
  });

  it('clamps at the grand-fortress cap and never exceeds it', () => {
    const graph = makeGraph('keep');
    // Cast enough times to blow well past the cap.
    for (let i = 0; i < 10; i++) executeGraphOps(graph, fortify, ctx);

    expect(fortification(graph)).toBe(FORTIFY_MULTIPLIER_MAX);
  });

  it('fail-softs (op fails, no throw) when the target location is missing', () => {
    const graph = makeGraph('keep');
    const missingCtx: GraphOpContext = { ...ctx, targetId: 'loc.nowhere' };
    const result = executeGraphOps(graph, [{ op: 'fortify_location', nodeId: '$target' }], missingCtx);

    expect(result.allSucceeded).toBe(false);
    expect(result.results[0].error).toContain('fortify_location');
  });
});
