/**
 * artifact-ward graph-op tests (THR-605 — six no-op ascendant actions, Slice 2).
 *
 * The artifact trio — `artifact.attune` (spell "Sphere Resonance"),
 * `artifact.curse` ("Malediction Bound"), and `artifact.nullify` ("Void
 * Unraveling") — all write the same `properties.effects: AttachmentEffect[]`
 * array that `collectAttachmentEffects` (effectWalker.ts) reads off any
 * possessed/bonded artifact, so each is genuinely consumed. The ops route through
 * `executeGraphOps` exactly as the action pipeline fires them (resolution
 * forwards them via `graphOnlyOps`). Assertions read the mutated `effects` array
 * and stamp/flag properties directly.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { executeGraphOps, resetOpCounter } from '../graphOpExecutor';
import type { GraphOpContext, GraphOp } from '../../types/graphOp';
import type { AttachmentEffect } from '../../types/effects';
import { SPHERE_EFFECT_TABLE } from '../ascendantPrimitives';
import { CURSE_QUINTESSENCE_DRAIN } from '../../data/ascendant-expression-constants';

const ascendantId = 'asc.player';
const artifactId = 'art.blade';

const ctx: GraphOpContext = {
  actorId: ascendantId,
  targetId: artifactId,
  locationId: artifactId,
  tick: 42,
};

/** Build a graph with an ascendant (optionally sphere-aligned) and a plain artifact. */
function makeGraph(primarySphere?: string): WorldGraph {
  const graph = new WorldGraph();
  resetOpCounter();
  graph.addNode({
    id: ascendantId,
    type: 'actor',
    name: 'The Warden',
    properties: {
      actorType: 'ascendant',
      ...(primarySphere ? { sphereAlignment: { primary: primarySphere } } : {}),
    },
  });
  graph.addNode({ id: artifactId, type: 'artifact', name: 'Grey Blade', properties: {} });
  return graph;
}

const effectsOf = (graph: WorldGraph): AttachmentEffect[] =>
  (graph.getNode(artifactId)?.properties.effects as AttachmentEffect[] | undefined) ?? [];
const propOf = (graph: WorldGraph, key: string): unknown =>
  graph.getNode(artifactId)?.properties[key];

const attune: GraphOp[] = [{ op: 'attune_artifact', nodeId: '$target' }];
const curse: GraphOp[] = [{ op: 'curse_artifact', nodeId: '$target' }];
const nullify: GraphOp[] = [{ op: 'nullify_artifact', nodeId: '$target' }];

describe('attune_artifact op', () => {
  it('appends the ascendant\'s-sphere positive effect and stamps attunedSphere', () => {
    const graph = makeGraph('force');
    const result = executeGraphOps(graph, attune, ctx);

    expect(result.allSucceeded).toBe(true);
    expect(effectsOf(graph)).toEqual([SPHERE_EFFECT_TABLE.force![0]]);
    expect(propOf(graph, 'attunedSphere')).toBe('force');
  });

  it('appends onto existing effects (does not clobber prior powers)', () => {
    const graph = makeGraph('life');
    const prior: AttachmentEffect = { type: 'passive', reach: 'stone', value: 3 };
    graph.updateNode(artifactId, { properties: { effects: [prior] } });
    executeGraphOps(graph, attune, ctx);

    expect(effectsOf(graph)).toEqual([prior, SPHERE_EFFECT_TABLE.life![0]]);
  });

  it('fail-softs to a no-op success when the ascendant has no sphere alignment', () => {
    const graph = makeGraph(undefined);
    const result = executeGraphOps(graph, attune, ctx);

    expect(result.allSucceeded).toBe(true);
    expect(effectsOf(graph)).toEqual([]);
    expect(propOf(graph, 'attunedSphere')).toBeUndefined();
  });

  it('fails (no throw) when the target is missing or not an artifact', () => {
    const graph = makeGraph('force');
    graph.addNode({ id: 'not.art', type: 'actor', name: 'A Person', properties: {} });
    const missing = executeGraphOps(graph, [{ op: 'attune_artifact', nodeId: 'nope' }], ctx);
    const wrongType = executeGraphOps(graph, [{ op: 'attune_artifact', nodeId: 'not.art' }], ctx);

    expect(missing.allSucceeded).toBe(false);
    expect(missing.results[0].error).toContain('attune_artifact');
    expect(wrongType.allSucceeded).toBe(false);
    expect(wrongType.results[0].error).toContain('not an artifact');
  });
});

describe('curse_artifact op', () => {
  it('appends a concealed per-tick quintessence drain and sets the curse flags', () => {
    const graph = makeGraph('darkness');
    const result = executeGraphOps(graph, curse, ctx);

    expect(result.allSucceeded).toBe(true);
    expect(effectsOf(graph)).toEqual([
      { type: 'resource_manipulate', resource: 'quintessence', target: 'self', amount: -CURSE_QUINTESSENCE_DRAIN, mode: 'per_tick' },
    ]);
    expect(propOf(graph, 'cursed')).toBe(true);
    expect(propOf(graph, 'curseConcealed')).toBe(true);
  });

  it('does not require an ascendant sphere (curse is sphere-independent)', () => {
    const graph = makeGraph(undefined);
    const result = executeGraphOps(graph, curse, ctx);

    expect(result.allSucceeded).toBe(true);
    expect(effectsOf(graph)).toHaveLength(1);
    expect(propOf(graph, 'cursed')).toBe(true);
  });

  it('fails (no throw) when the target is missing', () => {
    const graph = makeGraph('darkness');
    const result = executeGraphOps(graph, [{ op: 'curse_artifact', nodeId: 'nope' }], ctx);

    expect(result.allSucceeded).toBe(false);
    expect(result.results[0].error).toContain('curse_artifact');
  });
});

describe('nullify_artifact op', () => {
  it('strips every effect and resets the attune/curse flags to inert', () => {
    const graph = makeGraph('force');
    // Attune then curse to accumulate state, then nullify it all.
    executeGraphOps(graph, attune, ctx);
    executeGraphOps(graph, curse, ctx);
    expect(effectsOf(graph).length).toBeGreaterThan(0);

    const result = executeGraphOps(graph, nullify, ctx);

    expect(result.allSucceeded).toBe(true);
    expect(effectsOf(graph)).toEqual([]);
    expect(propOf(graph, 'attunedSphere')).toBeUndefined();
    expect(propOf(graph, 'cursed')).toBe(false);
    expect(propOf(graph, 'curseConcealed')).toBe(false);
  });

  it('is fail-soft on an already-inert artifact (clears nothing, still succeeds)', () => {
    const graph = makeGraph('force');
    const result = executeGraphOps(graph, nullify, ctx);

    expect(result.allSucceeded).toBe(true);
    expect(effectsOf(graph)).toEqual([]);
  });

  it('fails (no throw) when the target is missing', () => {
    const graph = makeGraph('force');
    const result = executeGraphOps(graph, [{ op: 'nullify_artifact', nodeId: 'nope' }], ctx);

    expect(result.allSucceeded).toBe(false);
    expect(result.results[0].error).toContain('nullify_artifact');
  });
});
