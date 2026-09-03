/**
 * THR-1194 — every hex action that mints a node binds it to something real.
 *
 * Three recipes minted orphans. `hex.forge_seer_token` and `hex.forge_instrument`
 * spelled `possessed_by`, which is not a registered edge type and never was, pointing
 * artifact → actor when the registered `possesses` runs actor → artifact: wrong in the
 * name *and* the direction, so the schema chokepoint refused the op and the artifact
 * reached nobody. `hex.send_herald` (found in passing) attached its herald with
 * `located_at` to `$location`, which for a hex action resolves to the hex target id —
 * and hexes are not graph nodes, so that op failed on every cast too.
 *
 * All three reported success, because a failed op inside a fail-soft batch is a per-op
 * flag nobody reads (impediment #699). That is why these tests **execute the batch and
 * read the graph back** rather than asserting the op array: an op-shape assertion cannot
 * tell a working recipe from one whose refs and edge types resolve to nothing, which is
 * exactly how all three shipped green.
 */
import { describe, it, expect, vi } from 'vitest';
import { WorldGraph } from '../graph';
import {
  resolveHexActionFull,
  FORGE_SEER_TOKEN_NAME,
  FORGE_INSTRUMENT_NAME,
  SEND_HERALD_NAME,
} from '../hexActionBridge';
import { executeGraphOps } from '../graphOpExecutor';
import { EDGE_SCHEMA } from '../../types/edgeSchema';
import { getLocationNodes } from '../sublocationShape';
import type { GraphOpContext } from '../../types/graphOp';

const COL = 3;
const ROW = 5;

/** A hex action's context: `locationId` is the hex target id, NOT a graph node. */
function hexCtx(): GraphOpContext {
  return { actorId: 'asc', targetId: `hex_${COL}_${ROW}`, locationId: `hex_${COL}_${ROW}`, tick: 10 };
}

/** An ascendant and one place-tier location sitting on the hex under test. */
function worldWithPlace(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'asc', type: 'actor', name: 'Asc', properties: { actorType: 'ascendant' } });
  graph.addNode({
    id: 'loc_hold',
    type: 'location',
    name: 'The Hold',
    properties: { hexCol: COL, hexRow: ROW, locationSubtype: 'town' },
  });
  return graph;
}

/** An ascendant and a bare hex — no location of any tier. */
function worldWithNoPlace(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'asc', type: 'actor', name: 'Asc', properties: { actorType: 'ascendant' } });
  return graph;
}

function cast(graph: WorldGraph, templateId: string) {
  const result = resolveHexActionFull(templateId, COL, ROW, 'success', 10, graph);
  const batch = executeGraphOps(graph, result.graphOps, hexCtx(), { tick: 10, emitTrace: false });
  return { ops: result.graphOps, batch };
}

const FORGE_RECIPES = [
  { templateId: 'hex.forge_seer_token', name: FORGE_SEER_TOKEN_NAME, subtype: 'divination_focus' },
  { templateId: 'hex.forge_instrument', name: FORGE_INSTRUMENT_NAME, subtype: 'ritual_focus' },
] as const;

describe('hex forge actions bind their artifact to the actor (THR-1194)', () => {
  it.each(FORGE_RECIPES)('$templateId: every op succeeds', ({ templateId }) => {
    const graph = worldWithPlace();
    const { batch } = cast(graph, templateId);

    // The assertion the old tests never made. `allSucceeded` was false for both recipes
    // on every cast, and nothing read it.
    expect(batch.results.map(r => r.error ?? null)).toEqual(batch.results.map(() => null));
    expect(batch.allSucceeded).toBe(true);
  });

  it.each(FORGE_RECIPES)(
    '$templateId: the minted artifact is reachable from the actor via `possesses`',
    ({ templateId, subtype }) => {
      const graph = worldWithPlace();
      cast(graph, templateId);

      // Reachability from the actor, in the schema's direction — the property the
      // ticket names, and the one `agentAttachments` depends on.
      const possessed = graph.getOutgoingEdges('asc', 'possesses');
      expect(possessed).toHaveLength(1);

      const artifact = graph.getNode(possessed[0].target);
      expect(artifact?.type).toBe('artifact');
      expect(artifact?.properties?.subtype).toBe(subtype);
      expect(artifact?.properties?.tier).toBe('storied');
    },
  );

  it.each(FORGE_RECIPES)(
    '$templateId: the artifact carries its display name at the top level, not just in properties',
    ({ templateId, name }) => {
      const graph = worldWithPlace();
      cast(graph, templateId);

      const artifactId = graph.getOutgoingEdges('asc', 'possesses')[0].target;
      // `executeAddNode` reads the top-level `name` from `op.nodeName` and falls back to
      // the generated id, so a `properties.name` alone left this reading `gen_artifact_7`.
      expect(graph.getNode(artifactId)?.name).toBe(name);
    },
  );

  it.each(FORGE_RECIPES)(
    '$templateId: no artifact is left orphaned — every minted node has an edge',
    ({ templateId }) => {
      const graph = worldWithPlace();
      cast(graph, templateId);

      for (const artifact of graph.getNodesByType('artifact')) {
        const attached =
          graph.getIncomingEdges(artifact.id).length + graph.getOutgoingEdges(artifact.id).length;
        expect(attached).toBeGreaterThan(0);
      }
    },
  );
});

describe('hex.send_herald places its herald at a real location (THR-1194)', () => {
  it('every op succeeds', () => {
    const graph = worldWithPlace();
    const { batch } = cast(graph, 'hex.send_herald');

    expect(batch.results.map(r => r.error ?? null)).toEqual(batch.results.map(() => null));
    expect(batch.allSucceeded).toBe(true);
  });

  it('the herald is located at a place-tier location on the hex, and threaded to the actor', () => {
    const graph = worldWithPlace();
    cast(graph, 'hex.send_herald');

    const threads = graph.getOutgoingEdges('asc', 'thread');
    expect(threads).toHaveLength(1);
    const heraldId = threads[0].target;

    const located = graph.getOutgoingEdges(heraldId, 'located_at');
    expect(located).toHaveLength(1);
    // A literal location node id, never the hex target id the old recipe pointed at.
    expect(located[0].target).toBe('loc_hold');
    expect(located[0].target).not.toBe(`hex_${COL}_${ROW}`);

    const destination = graph.getNode(located[0].target);
    expect(getLocationNodes(graph).map(l => l.id)).toContain(destination?.id);
  });

  it('the herald carries its display name at the top level', () => {
    const graph = worldWithPlace();
    cast(graph, 'hex.send_herald');

    const heraldId = graph.getOutgoingEdges('asc', 'thread')[0].target;
    expect(graph.getNode(heraldId)?.name).toBe(SEND_HERALD_NAME);
  });

  it('mints nothing at all on a hex with no place-tier location, rather than an orphan', () => {
    const graph = worldWithNoPlace();
    const before = graph.getAllNodes().length;
    const { ops, batch } = cast(graph, 'hex.send_herald');

    // Fail-soft (NFP #4): refusing beats minting a herald located nowhere, which is the
    // orphan this ticket exists to stop.
    expect(ops).toEqual([]);
    expect(batch.allSucceeded).toBe(true);
    expect(graph.getAllNodes()).toHaveLength(before);
  });
});

describe('hex.spark_encounter stamps its occurred_at edge with the tick (THR-1196)', () => {
  it('the landed edge carries the tick, not just the event node', () => {
    const graph = worldWithPlace();
    const { batch } = cast(graph, 'hex.spark_encounter');

    expect(batch.allSucceeded).toBe(true);

    const events = graph.getNodesByType('event');
    expect(events).toHaveLength(1);
    expect(events[0].properties?.eventType).toBe('divine_spark');

    // Read back from the graph rather than the op array: the op-level guard below
    // proves the recipe *asks* for the property, this proves it survives execution.
    const occurred = graph.getOutgoingEdges(events[0].id, 'occurred_at');
    expect(occurred).toHaveLength(1);
    expect(occurred[0].target).toBe('loc_hold');
    expect(occurred[0].properties?.tick).toBe(10);
  });

  it('fires without a [GraphSchema] warning', () => {
    const graph = worldWithPlace();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      cast(graph, 'hex.spark_encounter');
      const schemaWarnings = warn.mock.calls
        .map(args => args.map(String).join(' '))
        .filter(line => line.includes('[GraphSchema]'));
      expect(schemaWarnings).toEqual([]);
    } finally {
      warn.mockRestore();
    }
  });
});

describe('no hex action recipe names an unregistered edge type (THR-1194)', () => {
  // The ticket's membership predicate, as a standing guard: every `add_edge` a hex
  // action emits must name a type the schema knows. `possessed_by` passed review twice
  // because nothing checked, and it is only visible at execution time.
  const TEMPLATE_IDS = [
    'hex.forge_seer_token',
    'hex.forge_instrument',
    'hex.send_herald',
    'hex.restore_fragment',
    'hex.spark_encounter',
    'hex.rewrite_history',
  ];

  it.each(TEMPLATE_IDS)('%s emits only registered edge types', templateId => {
    const graph = worldWithPlace();
    // A ruin as well, so `hex.restore_fragment` has its preferred parent available.
    graph.addNode({
      id: 'loc_ruin',
      type: 'location',
      name: 'Wolf Remnant',
      properties: { hexCol: COL, hexRow: ROW, locationSubtype: 'ruins' },
    });

    const { ops } = cast(graph, templateId);
    const edgeTypes = ops.filter(op => op.op === 'add_edge').map(op => op.edgeType!);

    for (const edgeType of edgeTypes) {
      expect(Object.keys(EDGE_SCHEMA)).toContain(edgeType);
    }
  });

  // THR-1196: the type check above is only the outer layer. `hex.spark_encounter`
  // passed it — `occurred_at` is registered — and then tripped `requiredProperties`
  // one layer down, emitting the edge with no `tick`. Unlike THR-1194's `possessed_by`
  // this is a *warning*, not a refusal, so the edge reached the graph half-formed and
  // nothing failed. Widened to the full schema row so the predicate is covered rather
  // than the one member that happened to be noticed.
  it.each(TEMPLATE_IDS)('%s emits every property its edge schema requires', templateId => {
    const graph = worldWithPlace();
    graph.addNode({
      id: 'loc_ruin',
      type: 'location',
      name: 'Wolf Remnant',
      properties: { hexCol: COL, hexRow: ROW, locationSubtype: 'ruins' },
    });

    const { ops } = cast(graph, templateId);

    for (const op of ops.filter(o => o.op === 'add_edge')) {
      const required = EDGE_SCHEMA[op.edgeType!]?.requiredProperties ?? [];
      const carried = Object.keys(op.properties ?? {});
      // Reported as a labelled object rather than a bare property list, so a failure
      // names the recipe and the edge type instead of leaving two bags to diff by eye.
      expect({
        recipe: templateId,
        edgeType: op.edgeType,
        missing: required.filter(property => !carried.includes(property)),
      }).toEqual({ recipe: templateId, edgeType: op.edgeType, missing: [] });
    }
  });
});
