/**
 * Essence-source graph-op tests (THR-611 — Divine Economy, Slice 2).
 *
 * Covers the three player-verb ops that drive the Build → Defend loop:
 *   consecrate_source — type a host into a source (+ ensure a controls edge)
 *   sanctify_source   — raise a typed source's sanctity toward flowering
 *   defend_source     — clear contestation / desecration and restore sanctity
 *
 * These ops route through `executeGraphOps` exactly as the action pipeline fires
 * them (resolution forwards them via `graphOnlyOps`). The assertions read the
 * mutated `essenceSource` bag + `controls` edges directly, and confirm the typed
 * income term (`computeSourceIncome`) actually picks up a consecrated source.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { executeGraphOps, resetOpCounter } from '../graphOpExecutor';
import type { GraphOpContext, GraphOp } from '../../types/graphOp';
import type { EssenceSource } from '../../types/essenceSource';
import type { SphereAlignment } from '../../types/influence';
import { readEssenceSource, computeSourceIncome } from '../essenceSources';
import {
  BASE_SOURCE_INCOME,
  SANCTITY_BUILD_PER_ACTION,
  SANCTITY_DEFEND_RESTORE,
  SANCTITY_FLOWERING_THRESHOLD,
  SOURCE_FLOWERING_MULTIPLIER,
} from '../../data/essence-sources';

const ascendantId = 'asc.player';
const hostId = 'loc.peak';

const ctx: GraphOpContext = {
  actorId: ascendantId,
  targetId: hostId,
  locationId: hostId,
  tick: 42,
};

function makeGraph(): WorldGraph {
  const graph = new WorldGraph();
  resetOpCounter();
  graph.addNode({
    id: ascendantId,
    type: 'actor',
    name: 'The Verdant One',
    properties: {
      actorType: 'ascendant',
      sphereAlignment: { primary: 'life', secondary: 'spirit' } as SphereAlignment,
    },
  });
  graph.addNode({ id: hostId, type: 'location', name: 'Sky-Peak', properties: { locationType: 'location' } });
  return graph;
}

const source = (graph: WorldGraph): EssenceSource | undefined =>
  readEssenceSource(graph.getNode(hostId)?.properties);

describe('consecrate_source op', () => {
  it('types the host to the ascendant primary sphere and binds it with a controls edge', () => {
    const graph = makeGraph();
    const ops: GraphOp[] = [{ op: 'consecrate_source', nodeId: '$target' }];
    const result = executeGraphOps(graph, ops, ctx);

    expect(result.allSucceeded).toBe(true);
    const src = source(graph);
    expect(src?.kind).toBe('shrine'); // default kind
    expect(src?.sphereAffinity).toBe('life'); // actor's primary
    expect(src?.tier).toBe('dormant'); // starts unbuilt
    expect(src?.discoveredBy).toBe(ascendantId);
    expect(src?.originTick).toBe(42);

    // controls edge created → income term sees it.
    const controls = graph.getOutgoingEdges(ascendantId, 'controls');
    expect(controls.map((e) => e.target)).toContain(hostId);

    // Typed dormant source contributes base income to its own sphere.
    expect(computeSourceIncome(graph, ascendantId).life).toBeCloseTo(BASE_SOURCE_INCOME.shrine, 10);
  });

  it('honors an explicit sourceSphere / sourceKind override', () => {
    const graph = makeGraph();
    const ops: GraphOp[] = [{ op: 'consecrate_source', nodeId: '$target', sourceSphere: 'force', sourceKind: 'rite' }];
    executeGraphOps(graph, ops, ctx);
    const src = source(graph);
    expect(src?.sphereAffinity).toBe('force');
    expect(src?.kind).toBe('rite');
  });

  it('is idempotent: re-consecrating a typed source does not clobber built sanctity', () => {
    const graph = makeGraph();
    executeGraphOps(graph, [{ op: 'consecrate_source', nodeId: '$target' }], ctx);
    executeGraphOps(graph, [{ op: 'sanctify_source', nodeId: '$target' }], ctx);
    const built = source(graph)?.sanctity ?? 0;
    // Re-consecrate — should be a no-op success, sanctity preserved.
    const result = executeGraphOps(graph, [{ op: 'consecrate_source', nodeId: '$target' }], ctx);
    expect(result.allSucceeded).toBe(true);
    expect(source(graph)?.sanctity).toBe(built);
  });

  it('upgrades a migrated untyped place of power in place (preserves sanctity)', () => {
    const graph = makeGraph();
    const untyped: EssenceSource = { kind: 'placeOfPower', sanctity: 0.4, tier: 'dormant' };
    graph.updateNode(hostId, { properties: { ...graph.getNode(hostId)!.properties, isPlaceOfPower: true, essenceSource: untyped } });
    executeGraphOps(graph, [{ op: 'consecrate_source', nodeId: '$target', sourceSphere: 'spirit' }], ctx);
    const src = source(graph);
    expect(src?.sphereAffinity).toBe('spirit');
    expect(src?.sanctity).toBe(0.4); // preserved
  });

  it('does not create a duplicate controls edge when one already exists', () => {
    const graph = makeGraph();
    graph.addEdge({ id: 'edge.pre', source: ascendantId, target: hostId, type: 'controls', properties: {} });
    executeGraphOps(graph, [{ op: 'consecrate_source', nodeId: '$target' }], ctx);
    expect(graph.getOutgoingEdges(ascendantId, 'controls').filter((e) => e.target === hostId)).toHaveLength(1);
  });

  it('fail-soft: missing host node → success:false, no throw', () => {
    const graph = makeGraph();
    const result = executeGraphOps(graph, [{ op: 'consecrate_source', nodeId: 'loc.ghost' }], { ...ctx, targetId: 'loc.ghost' });
    expect(result.allSucceeded).toBe(false);
    expect(result.results[0].error).toMatch(/not found/);
  });
});

describe('sanctify_source op', () => {
  it('raises sanctity and flips dormant → flowering after enough builds', () => {
    const graph = makeGraph();
    executeGraphOps(graph, [{ op: 'consecrate_source', nodeId: '$target' }], ctx);

    const buildsToFlower = Math.ceil(SANCTITY_FLOWERING_THRESHOLD / SANCTITY_BUILD_PER_ACTION);
    for (let i = 0; i < buildsToFlower; i++) {
      executeGraphOps(graph, [{ op: 'sanctify_source', nodeId: '$target' }], ctx);
    }
    const src = source(graph);
    expect(src?.tier).toBe('flowering');
    // Flowering income = base × flowering multiplier, to the source's sphere.
    expect(computeSourceIncome(graph, ascendantId).life).toBeCloseTo(
      BASE_SOURCE_INCOME.shrine * SOURCE_FLOWERING_MULTIPLIER,
      10,
    );
  });

  it('caps sanctity at 1', () => {
    const graph = makeGraph();
    executeGraphOps(graph, [{ op: 'consecrate_source', nodeId: '$target' }], ctx);
    for (let i = 0; i < 20; i++) {
      executeGraphOps(graph, [{ op: 'sanctify_source', nodeId: '$target' }], ctx);
    }
    expect(source(graph)?.sanctity).toBe(1);
  });

  it('fail-soft: refuses to sanctify an untyped source (guidance to consecrate first)', () => {
    const graph = makeGraph();
    const untyped: EssenceSource = { kind: 'placeOfPower', sanctity: 0, tier: 'dormant' };
    graph.updateNode(hostId, { properties: { ...graph.getNode(hostId)!.properties, essenceSource: untyped } });
    const result = executeGraphOps(graph, [{ op: 'sanctify_source', nodeId: '$target' }], ctx);
    expect(result.allSucceeded).toBe(false);
    expect(result.results[0].error).toMatch(/untyped/);
  });

  it('fail-soft: no source on host → success:false, no throw', () => {
    const graph = makeGraph();
    const result = executeGraphOps(graph, [{ op: 'sanctify_source', nodeId: '$target' }], ctx);
    expect(result.allSucceeded).toBe(false);
  });
});

describe('defend_source op', () => {
  it('clears contestation + desecration and restores sanctity, returning to an uncontested tier', () => {
    const graph = makeGraph();
    const contested: EssenceSource = {
      kind: 'shrine',
      sphereAffinity: 'life',
      sanctity: 0.5,
      tier: 'contested',
      contestedBy: 'rival.ashen',
    };
    graph.addEdge({ id: 'edge.ctrl', source: ascendantId, target: hostId, type: 'controls', properties: {} });
    graph.updateNode(hostId, { properties: { ...graph.getNode(hostId)!.properties, essenceSource: contested } });

    // While contested, income leaks (contested multiplier < 1).
    const contestedIncome = computeSourceIncome(graph, ascendantId).life ?? 0;

    const result = executeGraphOps(graph, [{ op: 'defend_source', nodeId: '$target' }], ctx);
    expect(result.allSucceeded).toBe(true);

    const src = source(graph);
    expect(src?.contestedBy).toBeUndefined();
    expect(src?.desecrated).toBe(false);
    expect(src?.sanctity).toBeCloseTo(0.5 + SANCTITY_DEFEND_RESTORE, 10);
    expect(src?.tier).not.toBe('contested');

    // Defended income strictly exceeds the leaking contested income.
    const defendedIncome = computeSourceIncome(graph, ascendantId).life ?? 0;
    expect(defendedIncome).toBeGreaterThan(contestedIncome);
  });

  it('reclaims a desecrated source (tier leaves desecrated, income resumes)', () => {
    const graph = makeGraph();
    const desecrated: EssenceSource = {
      kind: 'shrine',
      sphereAffinity: 'force',
      sanctity: 0,
      tier: 'desecrated',
      desecrated: true,
      contestedBy: 'rival.ashen',
    };
    graph.addEdge({ id: 'edge.ctrl', source: ascendantId, target: hostId, type: 'controls', properties: {} });
    graph.updateNode(hostId, { properties: { ...graph.getNode(hostId)!.properties, essenceSource: desecrated } });
    expect(computeSourceIncome(graph, ascendantId).force ?? 0).toBe(0); // desecrated yields nothing

    executeGraphOps(graph, [{ op: 'defend_source', nodeId: '$target' }], ctx);
    const src = source(graph);
    expect(src?.desecrated).toBe(false);
    expect(src?.tier).not.toBe('desecrated');
    expect(computeSourceIncome(graph, ascendantId).force ?? 0).toBeGreaterThan(0);
  });

  it('fail-soft: no source on host → success:false, no throw', () => {
    const graph = makeGraph();
    const result = executeGraphOps(graph, [{ op: 'defend_source', nodeId: '$target' }], ctx);
    expect(result.allSucceeded).toBe(false);
  });
});
