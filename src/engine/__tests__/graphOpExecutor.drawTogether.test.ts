/**
 * draw_together graph-op tests (THR-74 — Draw Together).
 *
 * The op is the *writer* for the convergence read-site that shipped with this slice:
 * `encounterScoring.computeConvergenceBonus` boosts a mortal's candidate encounters toward
 * the anchor hex while `convergePullUntilTick` is open. Cast on a threaded anchor mortal,
 * the op stamps that window on the anchor and every living, ungrouped, threaded mortal
 * within DRAW_TOGETHER_RADIUS_HEXES of the anchor's hex. It routes through `executeGraphOps`
 * exactly as the action pipeline fires it; assertions read the stamped node properties.
 *
 * Fail-soft (NFP #4): a missing / non-mortal / unthreaded anchor errors rather than throws;
 * an anchor with no scattered companions still succeeds (the god spent the essence).
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { executeGraphOps, resetOpCounter } from '../graphOpExecutor';
import type { GraphOpContext, GraphOp } from '../../types/graphOp';
import {
  DRAW_TOGETHER_DURATION_TICKS,
} from '../../data/group-constants';

const ascendantId = 'asc.player';
const TICK = 100;

const ctx = (targetId: string): GraphOpContext => ({
  actorId: ascendantId,
  targetId,
  locationId: targetId,
  tick: TICK,
});

/**
 * Build a small world: one ascendant, three hex locations (center, adjacent, far), and a
 * cast of mortals — a threaded anchor at center, a nearby threaded mortal, a far threaded
 * mortal (beyond radius), a nearby *unthreaded* mortal, and a nearby threaded but *grouped*
 * mortal. Only the anchor + the nearby threaded ungrouped mortal should be pulled.
 */
function makeGraph(): WorldGraph {
  const graph = new WorldGraph();
  resetOpCounter();

  graph.addNode({ id: ascendantId, type: 'actor', name: 'The Warden', properties: { actorType: 'ascendant' } });

  // Locations. center↔near = 1 hex; center↔far = 15 hexes (> RADIUS 8).
  graph.addNode({ id: 'loc.center', type: 'location', name: 'Center', properties: { locationType: 'settlement', hexCol: 10, hexRow: 10 } });
  graph.addNode({ id: 'loc.near', type: 'location', name: 'Near', properties: { locationType: 'settlement', hexCol: 11, hexRow: 10 } });
  graph.addNode({ id: 'loc.far', type: 'location', name: 'Far', properties: { locationType: 'settlement', hexCol: 10, hexRow: 25 } });

  const mortal = (id: string, locId: string) => {
    graph.addNode({ id, type: 'actor', name: id, properties: { actorType: 'individual' } });
    graph.addEdge({ id: `at.${id}`, source: id, target: locId, type: 'located_at', properties: {} });
  };
  const thread = (id: string) =>
    graph.addEdge({ id: `t.${id}`, source: ascendantId, target: id, type: 'thread', properties: { tier: 1 } });

  mortal('a.anchor', 'loc.center'); thread('a.anchor');
  mortal('a.near', 'loc.near'); thread('a.near');
  mortal('a.far', 'loc.far'); thread('a.far');
  mortal('a.unthreaded', 'loc.near'); // nearby but not threaded to this ascendant
  mortal('a.grouped', 'loc.near'); thread('a.grouped');

  // Put a.grouped in an active company so isGrouped() is true.
  graph.addNode({ id: 'group.band', type: 'actor', name: 'The Band', properties: { actorType: 'group', groupType: 'party', cohesion: 0.6, groupStatus: 'active' } });
  graph.addEdge({ id: 'm.grouped', source: 'a.grouped', target: 'group.band', type: 'member_of', properties: { role: 'member', rank: 0, joinedTick: 0 } });

  return graph;
}

const draw = (nodeId: string): GraphOp[] => [{ op: 'draw_together', nodeId }];
const pullUntil = (graph: WorldGraph, id: string): number | undefined =>
  graph.getNode(id)?.properties.convergePullUntilTick as number | undefined;
const pullHex = (graph: WorldGraph, id: string): { col?: number; row?: number } => ({
  col: graph.getNode(id)?.properties.convergePullHexCol as number | undefined,
  row: graph.getNode(id)?.properties.convergePullHexRow as number | undefined,
});

describe('draw_together op', () => {
  it('stamps the anchor and nearby threaded ungrouped mortals toward the anchor hex', () => {
    const graph = makeGraph();
    const result = executeGraphOps(graph, draw('a.anchor'), ctx('a.anchor'));

    expect(result.allSucceeded).toBe(true);
    // Anchor + near are pulled toward the anchor's own hex (10,10).
    expect(pullUntil(graph, 'a.anchor')).toBe(TICK + DRAW_TOGETHER_DURATION_TICKS);
    expect(pullUntil(graph, 'a.near')).toBe(TICK + DRAW_TOGETHER_DURATION_TICKS);
    expect(pullHex(graph, 'a.near')).toEqual({ col: 10, row: 10 });
  });

  it('does not pull a mortal beyond DRAW_TOGETHER_RADIUS_HEXES', () => {
    const graph = makeGraph();
    executeGraphOps(graph, draw('a.anchor'), ctx('a.anchor'));
    expect(pullUntil(graph, 'a.far')).toBeUndefined();
  });

  it('does not pull an unthreaded mortal', () => {
    const graph = makeGraph();
    executeGraphOps(graph, draw('a.anchor'), ctx('a.anchor'));
    expect(pullUntil(graph, 'a.unthreaded')).toBeUndefined();
  });

  it('does not pull an already-grouped mortal (a new company gathers among the ungathered)', () => {
    const graph = makeGraph();
    executeGraphOps(graph, draw('a.anchor'), ctx('a.anchor'));
    expect(pullUntil(graph, 'a.grouped')).toBeUndefined();
  });

  it('fails soft on an unthreaded anchor rather than stamping anything', () => {
    const graph = makeGraph();
    const result = executeGraphOps(graph, draw('a.unthreaded'), ctx('a.unthreaded'));
    expect(result.allSucceeded).toBe(false);
    expect(pullUntil(graph, 'a.near')).toBeUndefined();
  });

  it('fails soft on a missing anchor rather than throwing', () => {
    const graph = makeGraph();
    const result = executeGraphOps(graph, draw('a.ghost'), ctx('a.ghost'));
    expect(result.allSucceeded).toBe(false);
  });

  it('succeeds (no refund) when the anchor has no scattered companions in range', () => {
    // Anchor alone at a far hex — no other threaded ungrouped mortal within radius.
    const graph = new WorldGraph();
    resetOpCounter();
    graph.addNode({ id: ascendantId, type: 'actor', name: 'The Warden', properties: { actorType: 'ascendant' } });
    graph.addNode({ id: 'loc.lonely', type: 'location', name: 'Lonely', properties: { locationType: 'settlement', hexCol: 0, hexRow: 0 } });
    graph.addNode({ id: 'a.solo', type: 'actor', name: 'Solo', properties: { actorType: 'individual' } });
    graph.addEdge({ id: 'at.solo', source: 'a.solo', target: 'loc.lonely', type: 'located_at', properties: {} });
    graph.addEdge({ id: 't.solo', source: ascendantId, target: 'a.solo', type: 'thread', properties: { tier: 1 } });

    const result = executeGraphOps(graph, draw('a.solo'), ctx('a.solo'));
    expect(result.allSucceeded).toBe(true);
    // The anchor itself still gets the window (it holds the ground).
    expect(pullUntil(graph, 'a.solo')).toBe(TICK + DRAW_TOGETHER_DURATION_TICKS);
  });
});

/**
 * Sphere flavor on the pull (THR-770).
 *
 * The company gathered by this verb takes its name flavor from the god who called it,
 * but the company does not exist yet when the op fires — `runFormationScan` mints it
 * later. So the caster's sphere rides on the *pulled mortals* and is read back off
 * whichever member the scan gathers. Before THR-770 nothing carried it at all, which
 * is why `GROUP_NAME_SPHERE_ADJECTIVES` was entirely dead for this verb regardless of
 * how its keys were spelled.
 */
describe('draw_together — sphere flavor for the gathered company', () => {
  const alignedGraph = (primary: string): WorldGraph => {
    const graph = makeGraph();
    graph.updateNode(ascendantId, { properties: { sphereAlignment: { primary } } });
    return graph;
  };
  const pullSphere = (graph: WorldGraph, id: string): unknown =>
    graph.getNode(id)?.properties.convergePullSphere;

  it("stamps the caster's primary sphere on every mortal it pulls", () => {
    const graph = alignedGraph('entropy');
    expect(executeGraphOps(graph, draw('a.anchor'), ctx('a.anchor')).allSucceeded).toBe(true);
    expect(pullSphere(graph, 'a.anchor')).toBe('entropy');
    expect(pullSphere(graph, 'a.near')).toBe('entropy');
  });

  it('stamps no sphere on mortals it did not pull', () => {
    const graph = alignedGraph('entropy');
    executeGraphOps(graph, draw('a.anchor'), ctx('a.anchor'));
    // Out of radius, and unthreaded — neither is gathered, so neither carries flavor.
    expect(pullSphere(graph, 'a.far')).toBeUndefined();
    expect(pullSphere(graph, 'a.unthreaded')).toBeUndefined();
  });

  it('fails soft on an unaligned caster — pull still lands, flavor is simply absent', () => {
    // makeGraph's ascendant has no sphereAlignment at all. The gathering must not
    // depend on flavor being available (NFP #4).
    const graph = makeGraph();
    expect(executeGraphOps(graph, draw('a.anchor'), ctx('a.anchor')).allSucceeded).toBe(true);
    expect(pullUntil(graph, 'a.near')).toBe(TICK + DRAW_TOGETHER_DURATION_TICKS);
    expect(pullSphere(graph, 'a.near')).toBeUndefined();
  });
});
