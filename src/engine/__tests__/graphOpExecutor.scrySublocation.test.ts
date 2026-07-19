/**
 * scry_sublocation graph-op tests (THR-605 — six no-op ascendant actions, Slice 3).
 *
 * `sub.vision` (spell "Place Memory") is a read action whose world change is a
 * reveal: it flips every concealed `knows_secret_of` edge held by any actor on the
 * target sublocation's hex to `revealed: true`. That flip is genuinely consumed —
 * `agentDetail.ts` lists only unrevealed secrets, and `phaseSecretsFavors.ts`
 * exempts revealed secrets from decay. Awareness is hex-granular: the sublocation
 * resolves up to its hex and every actor on that hex is scanned. The op routes
 * through `executeGraphOps` exactly as the action pipeline fires it (resolution
 * forwards it via `graphOnlyOps`). Assertions read the mutated edge properties
 * directly.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { executeGraphOps, resetOpCounter } from '../graphOpExecutor';
import type { GraphOpContext, GraphOp } from '../../types/graphOp';

const ascendantId = 'asc.player';
const locId = 'loc.crypt';
const subId = 'sub.altar';

const ctx: GraphOpContext = {
  actorId: ascendantId,
  targetId: subId,
  locationId: subId,
  tick: 42,
};

const scry: GraphOp[] = [{ op: 'scry_sublocation', nodeId: '$target' }];

/**
 * A crypt at hex (3,4) with an inner altar sublocation. Two agents stand at the
 * altar, each holding one unrevealed secret; a third agent stands on a different
 * hex holding an unrevealed secret it must NOT touch.
 */
function makeGraph(): WorldGraph {
  const graph = new WorldGraph();
  resetOpCounter();

  graph.addNode({ id: ascendantId, type: 'actor', name: 'The Seer', properties: { actorType: 'ascendant' } });
  graph.addNode({
    id: locId,
    type: 'location',
    name: 'Sunken Crypt',
    properties: { locationType: 'location', hexCol: 3, hexRow: 4 },
  });
  graph.addNode({
    id: subId,
    type: 'location',
    name: 'Inner Altar',
    properties: { locationType: 'sublocation', parentLocationId: locId },
  });

  // Two agents at the altar (on the crypt's hex), each with one concealed secret.
  for (const name of ['A', 'B']) {
    const agentId = `agent.${name}`;
    graph.addNode({ id: agentId, type: 'actor', name, properties: { actorType: 'individual' } });
    graph.addEdge({ id: `loc_${name}`, source: agentId, target: subId, type: 'located_at', properties: {} });
    graph.addEdge({
      id: `secret_${name}`,
      source: agentId,
      target: ascendantId,
      type: 'knows_secret_of',
      properties: { secretType: 'divine_mark', magnitude: 0.6, discoveredTick: 1, source: 'divine_revelation', revealed: false },
    });
  }

  // Off-hex agent whose secret must stay concealed.
  graph.addNode({ id: 'agent.far', type: 'actor', name: 'Far', properties: { actorType: 'individual' } });
  graph.addNode({
    id: 'loc.tower',
    type: 'location',
    name: 'Lonely Tower',
    properties: { locationType: 'location', hexCol: 9, hexRow: 9 },
  });
  graph.addEdge({ id: 'loc_far', source: 'agent.far', target: 'loc.tower', type: 'located_at', properties: {} });
  graph.addEdge({
    id: 'secret_far',
    source: 'agent.far',
    target: ascendantId,
    type: 'knows_secret_of',
    properties: { secretType: 'affair', magnitude: 0.4, discoveredTick: 1, source: 'social_gossip', revealed: false },
  });

  return graph;
}

const isRevealed = (graph: WorldGraph, edgeId: string): boolean =>
  graph.getEdge(edgeId)?.properties.revealed as boolean;

describe('scry_sublocation op', () => {
  it('reveals every concealed secret held by actors on the sublocation\'s hex', () => {
    const graph = makeGraph();
    const result = executeGraphOps(graph, scry, ctx);

    expect(result.allSucceeded).toBe(true);
    expect(isRevealed(graph, 'secret_A')).toBe(true);
    expect(isRevealed(graph, 'secret_B')).toBe(true);
  });

  it('leaves secrets on other hexes concealed (hex-granular awareness)', () => {
    const graph = makeGraph();
    executeGraphOps(graph, scry, ctx);

    expect(isRevealed(graph, 'secret_far')).toBe(false);
  });

  it('does not re-flip an already-revealed secret and still succeeds', () => {
    const graph = makeGraph();
    graph.updateEdge('secret_A', { properties: { ...graph.getEdge('secret_A')!.properties, revealed: true } });
    const result = executeGraphOps(graph, scry, ctx);

    expect(result.allSucceeded).toBe(true);
    expect(isRevealed(graph, 'secret_A')).toBe(true);
    expect(isRevealed(graph, 'secret_B')).toBe(true);
  });

  it('fail-softs to success when the hex has nothing concealed', () => {
    const graph = makeGraph();
    // Reveal everything up front, then scry finds nothing left to flip.
    for (const id of ['secret_A', 'secret_B']) {
      graph.updateEdge(id, { properties: { ...graph.getEdge(id)!.properties, revealed: true } });
    }
    const result = executeGraphOps(graph, scry, ctx);

    expect(result.allSucceeded).toBe(true);
  });

  it('fail-softs (op fails, no throw) when the target node is missing', () => {
    const graph = makeGraph();
    const missingCtx: GraphOpContext = { ...ctx, targetId: 'sub.nowhere' };
    const result = executeGraphOps(graph, [{ op: 'scry_sublocation', nodeId: '$target' }], missingCtx);

    expect(result.allSucceeded).toBe(false);
    expect(result.results[0].error).toContain('scry_sublocation');
  });

  it('fail-softs to success when the target has no hex (unplaced)', () => {
    const graph = makeGraph();
    // A floating sublocation whose parent has no hex coordinates.
    graph.addNode({ id: 'loc.void', type: 'location', name: 'Void', properties: { locationType: 'location' } });
    graph.addNode({
      id: 'sub.floating',
      type: 'location',
      name: 'Floating',
      properties: { locationType: 'sublocation', parentLocationId: 'loc.void' },
    });
    const result = executeGraphOps(graph, [{ op: 'scry_sublocation', nodeId: '$target' }], { ...ctx, targetId: 'sub.floating' });

    expect(result.allSucceeded).toBe(true);
  });
});
