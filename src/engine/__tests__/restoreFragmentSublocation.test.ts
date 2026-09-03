/**
 * THR-1193 — `hex.restore_fragment` mints a real sublocation, and the executor
 * resolves the `$created_N` refs its recipes have always spelled.
 *
 * Two defects, one cast: the recipe minted the retired `type: 'sublocation'` shape
 * with no parent, and the edge meant to attach it named `$created_0`, which nothing
 * resolved. The node therefore reached the graph orphaned — no parent, no edges — and
 * the action still reported success, because a failed op inside a fail-soft batch is a
 * per-op flag nobody read.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  resolveHexActionFull,
  RESTORE_FRAGMENT_NAME,
  RESTORE_FRAGMENT_SUBLOCATION_TYPE_ID,
} from '../hexActionBridge';
import { executeGraphOps } from '../graphOpExecutor';
import {
  isPlaceNode,
  getPlaceNodes,
  getLocationNodes,
  resolveToParentLocation,
  LEGACY_SUBLOCATION_NODE_TYPE,
} from '../sublocationShape';
import type { GraphOp, GraphOpContext } from '../../types/graphOp';

/** A hex action's context: `locationId` is the hex target id, NOT a graph node. */
function hexCtx(overrides: Partial<GraphOpContext> = {}): GraphOpContext {
  return { actorId: 'asc', targetId: 'hex_3_5', locationId: 'hex_3_5', tick: 10, ...overrides };
}

function worldWithRuin(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'asc', type: 'actor', name: 'Asc', properties: { actorType: 'ascendant' } });
  graph.addNode({
    id: 'loc_ruin',
    type: 'location',
    name: 'Wolf Remnant',
    properties: { hexCol: 3, hexRow: 5, locationSubtype: 'ruins' },
  });
  return graph;
}

function castRestoreFragment(graph: WorldGraph, col = 3, row = 5) {
  const result = resolveHexActionFull('hex.restore_fragment', col, row, 'success', 10, graph);
  const batch = executeGraphOps(graph, result.graphOps, hexCtx(), { tick: 10, emitTrace: false });
  return { ops: result.graphOps, batch };
}

describe('executeGraphOps — $created_N positional refs (THR-1193)', () => {
  it('resolves $created_0 to the id of the first node the batch minted', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'loc_a', type: 'location', name: 'A', properties: {} });

    const ops: GraphOp[] = [
      { op: 'add_node', nodeType: 'location', nodeName: 'Minted', properties: { parentLocationId: 'loc_a' } },
      { op: 'add_edge', edgeType: 'contains', source: 'loc_a', target: '$created_0' },
    ];
    const batch = executeGraphOps(graph, ops, hexCtx(), { emitTrace: false });

    expect(batch.allSucceeded).toBe(true);
    const mintedId = batch.results[0].createdId!;
    const edges = graph.getOutgoingEdges('loc_a', 'contains');
    expect(edges).toHaveLength(1);
    expect(edges[0].target).toBe(mintedId);
  });

  it('numbers $created_N positionally over node-creating ops, not over all ops', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'loc_a', type: 'location', name: 'A', properties: {} });

    const ops: GraphOp[] = [
      { op: 'add_node', nodeType: 'location', nodeName: 'First', properties: { parentLocationId: 'loc_a' } },
      // An edge op sits between the two mints: if the counter advanced per *op* rather
      // than per created node, `$created_1` below would miss the second node.
      { op: 'add_edge', edgeType: 'contains', source: 'loc_a', target: '$created_0' },
      { op: 'add_node', nodeType: 'location', nodeName: 'Second', properties: { parentLocationId: 'loc_a' } },
      { op: 'add_edge', edgeType: 'contains', source: 'loc_a', target: '$created_1' },
    ];
    const batch = executeGraphOps(graph, ops, hexCtx(), { emitTrace: false });

    expect(batch.allSucceeded).toBe(true);
    const targets = graph.getOutgoingEdges('loc_a', 'contains').map(e => e.target);
    expect(targets).toHaveLength(2);
    expect(targets).toContain(batch.results[0].createdId);
    expect(targets).toContain(batch.results[2].createdId);
    expect(batch.results[0].createdId).not.toBe(batch.results[2].createdId);
  });

  it('does not leak created refs back into the caller context', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'loc_a', type: 'location', name: 'A', properties: {} });
    const ctx = hexCtx();

    executeGraphOps(
      graph,
      [{ op: 'add_node', nodeType: 'location', nodeName: 'Minted', properties: { parentLocationId: 'loc_a' } }],
      ctx,
      { emitTrace: false },
    );

    // The batch refs die with the batch — a context reused for a later batch must not
    // inherit a `$created_0` pointing at some earlier batch's node.
    expect(ctx.extras?.['$created_0']).toBeUndefined();
  });

  it('leaves an out-of-range $created_N unresolved rather than binding the wrong node', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'loc_a', type: 'location', name: 'A', properties: {} });

    const batch = executeGraphOps(
      graph,
      [
        { op: 'add_node', nodeType: 'location', nodeName: 'Only', properties: { parentLocationId: 'loc_a' } },
        { op: 'add_edge', edgeType: 'contains', source: 'loc_a', target: '$created_7' },
      ],
      hexCtx(),
      { emitTrace: false },
    );

    expect(batch.results[0].success).toBe(true);
    expect(batch.results[1].success).toBe(false);
    expect(graph.getOutgoingEdges('loc_a', 'contains')).toHaveLength(0);
  });
});

describe('hex.restore_fragment — mints a sublocation (THR-1193)', () => {
  it('mints the canonical shape: type location, parentLocationId, persistence', () => {
    const graph = worldWithRuin();
    const { batch } = castRestoreFragment(graph);

    expect(batch.allSucceeded).toBe(true);
    const subs = getPlaceNodes(graph);
    expect(subs).toHaveLength(1);

    const fragment = subs[0];
    expect(fragment.type).toBe('location');
    expect(isPlaceNode(fragment)).toBe(true);
    expect(fragment.properties.parentLocationId).toBe('loc_ruin');
    expect(fragment.properties.sublocationTypeId).toBe(RESTORE_FRAGMENT_SUBLOCATION_TYPE_ID);
    // Required by SublocationProperties — omitting it is what crashed checkDissolutions
    // under THR-1183, and it is invisible until the node enters a location sweep.
    expect(fragment.properties.persistence).toEqual({ type: 'permanent' });
  });

  it('names the node, rather than leaving it as the generated id', () => {
    const graph = worldWithRuin();
    castRestoreFragment(graph);
    // `executeAddNode` falls back to the generated id for the top-level `name`, so a
    // properties-only name shows as `gen_location_1` everywhere `node.name` is read.
    expect(getPlaceNodes(graph)[0].name).toBe(RESTORE_FRAGMENT_NAME);
  });

  it('attaches by contains from the parent, the convention every other sublocation uses', () => {
    const graph = worldWithRuin();
    castRestoreFragment(graph);
    const fragment = getPlaceNodes(graph)[0];

    const contains = graph.getOutgoingEdges('loc_ruin', 'contains');
    expect(contains).toHaveLength(1);
    expect(contains[0].target).toBe(fragment.id);

    // The retired third convention: a `located_at` edge from the fragment outward.
    expect(graph.getOutgoingEdges(fragment.id, 'located_at')).toHaveLength(0);
  });

  it('produces a fragment whose parent resolves through the shared predicate', () => {
    const graph = worldWithRuin();
    castRestoreFragment(graph);
    const fragment = getPlaceNodes(graph)[0];
    // The failure this guards is a *dangling* parent — the shape a naive
    // `parentLocationId: '$location'` substitution would have written, since a hex
    // action's `$location` is `hex_3_5` and hexes are not graph nodes.
    expect(resolveToParentLocation(graph, fragment)?.id).toBe('loc_ruin');
  });

  it('mints no node carrying the retired sublocation type', () => {
    const graph = worldWithRuin();
    castRestoreFragment(graph);
    expect(graph.getNodesByType(LEGACY_SUBLOCATION_NODE_TYPE)).toHaveLength(0);
  });

  it('does not itself count as a place-tier location', () => {
    const graph = worldWithRuin();
    castRestoreFragment(graph);
    // A settlement sweep must not pick the fragment up as a settlement.
    expect(getLocationNodes(graph).map(n => n.id)).toEqual(['loc_ruin']);
  });

  it('prefers a ruins location over another place on the same hex', () => {
    const graph = worldWithRuin();
    graph.addNode({
      id: 'loc_town',
      type: 'location',
      name: 'Thornhold',
      properties: { hexCol: 3, hexRow: 5, locationSubtype: 'town' },
    });
    castRestoreFragment(graph);
    expect(getPlaceNodes(graph)[0].properties.parentLocationId).toBe('loc_ruin');
  });

  it('never parents the fragment to another sublocation', () => {
    // `getLocationsInHex` sweeps a bare `getNodesByType('location')` and so returns BOTH
    // tiers (the THR-1183 trap). An unfiltered pick could nest a sublocation inside one.
    const graph = new WorldGraph();
    graph.addNode({ id: 'asc', type: 'actor', name: 'Asc', properties: { actorType: 'ascendant' } });
    graph.addNode({
      id: 'loc_town',
      type: 'location',
      name: 'Thornhold',
      properties: { hexCol: 3, hexRow: 5, locationSubtype: 'town' },
    });
    // Carries 'ruin' in its subtype, so the ruins preference would take it if the
    // place-tier filter were dropped.
    graph.addNode({
      id: 'subloc_existing_ruin',
      type: 'location',
      name: 'Old Cellar',
      properties: {
        hexCol: 3,
        hexRow: 5,
        locationSubtype: 'ruins',
        parentLocationId: 'loc_town',
        sublocationTypeId: 'sublocation-type.ruins',
        persistence: { type: 'permanent' },
      },
    });

    castRestoreFragment(graph);
    const fragment = getPlaceNodes(graph).find(n => n.name === RESTORE_FRAGMENT_NAME)!;
    expect(fragment.properties.parentLocationId).toBe('loc_town');
  });

  it('emits no ops when the hex holds no place-tier location (fail-soft)', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'asc', type: 'actor', name: 'Asc', properties: { actorType: 'ascendant' } });
    const { ops, batch } = castRestoreFragment(graph, 9, 9);
    expect(ops).toEqual([]);
    expect(batch.allSucceeded).toBe(true);
    expect(getPlaceNodes(graph)).toHaveLength(0);
  });

  it('emits nothing on failure', () => {
    const graph = worldWithRuin();
    const result = resolveHexActionFull('hex.restore_fragment', 3, 5, 'failure', 10, graph);
    expect(result.graphOps).toEqual([]);
  });
});
