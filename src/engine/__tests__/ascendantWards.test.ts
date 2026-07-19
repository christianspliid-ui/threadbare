/**
 * Ascendant ward-op tests (THR-605 — six no-op ascendant actions, Slices 1–2).
 *
 * Covers the four graph-only composed ops that give previously-narrated-only
 * ascendant verbs a real, consumed world-state effect:
 *   attune_artifact  — append a deterministic sphere-flavored effect + stamp
 *   curse_artifact   — append a concealed per-tick quintessence-drain effect
 *   nullify_artifact — strip effects + attune/curse/enchant state
 *   fortify_location — raise fortificationMultiplier toward a cap
 *
 * They route through `executeGraphOps` exactly as the action pipeline fires them
 * (resolution forwards them via `graphOnlyOps`). Assertions read the mutated
 * `properties` directly.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { executeGraphOps, resetOpCounter } from '../graphOpExecutor';
import type { GraphOpContext, GraphOp } from '../../types/graphOp';
import type { AttachmentEffect } from '../../types/effects';
import type { SphereAlignment } from '../../types/influence';
import {
  FORTIFY_MULTIPLIER_BONUS,
  FORTIFY_MULTIPLIER_MAX,
  CURSE_QUINTESSENCE_DRAIN,
} from '../ascendantWards';
import { getFortificationModifier } from '../siegeResolution';

const ascendantId = 'asc.player';
const artifactId = 'art.blade';
const locationId = 'loc.keep';

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
  return graph;
}

function addArtifact(graph: WorldGraph, props: Record<string, unknown> = {}): void {
  graph.addNode({ id: artifactId, type: 'artifact', name: 'Ash Blade', properties: props });
}

function addLocation(graph: WorldGraph, props: Record<string, unknown> = {}): void {
  graph.addNode({ id: locationId, type: 'location', name: 'Grey Keep', properties: props });
}

const ctx = (target: string): GraphOpContext => ({
  actorId: ascendantId,
  targetId: target,
  locationId: target,
  tick: 42,
});

const effectsOf = (graph: WorldGraph): AttachmentEffect[] =>
  (graph.getNode(artifactId)?.properties.effects as AttachmentEffect[] | undefined) ?? [];

// ─── attune_artifact ────────────────────────────────────────────────────────

describe('attune_artifact op', () => {
  it('appends the ascendant sphere-flavored passive effect and stamps attunedSphere', () => {
    const graph = makeGraph();
    addArtifact(graph);
    const ops: GraphOp[] = [{ op: 'attune_artifact', nodeId: '$target' }];
    const result = executeGraphOps(graph, ops, ctx(artifactId));

    expect(result.allSucceeded).toBe(true);
    const effects = effectsOf(graph);
    expect(effects).toHaveLength(1);
    // 'life' → passive heart bonus (SPHERE_EFFECT_TABLE)
    expect(effects[0]).toMatchObject({ type: 'passive', reach: 'heart' });
    expect(graph.getNode(artifactId)?.properties.attunedSphere).toBe('life');
  });

  it('is deterministic — attuning twice appends the same effect (RNG-free)', () => {
    const graph = makeGraph();
    addArtifact(graph);
    executeGraphOps(graph, [{ op: 'attune_artifact', nodeId: '$target' }], ctx(artifactId));
    executeGraphOps(graph, [{ op: 'attune_artifact', nodeId: '$target' }], ctx(artifactId));
    const effects = effectsOf(graph);
    expect(effects).toHaveLength(2);
    expect(effects[0]).toEqual(effects[1]);
  });

  it('preserves pre-existing effects (additive append)', () => {
    const graph = makeGraph();
    const seed: AttachmentEffect = { type: 'passive', reach: 'iron', value: 3 };
    addArtifact(graph, { effects: [seed] });
    executeGraphOps(graph, [{ op: 'attune_artifact', nodeId: '$target' }], ctx(artifactId));
    const effects = effectsOf(graph);
    expect(effects).toHaveLength(2);
    expect(effects[0]).toEqual(seed);
  });

  it('fail-soft: non-artifact target is a no-op success, no properties written', () => {
    const graph = makeGraph();
    addLocation(graph);
    const result = executeGraphOps(graph, [{ op: 'attune_artifact', nodeId: '$target' }], ctx(locationId));
    expect(result.allSucceeded).toBe(true);
    expect(graph.getNode(locationId)?.properties.effects).toBeUndefined();
    expect(graph.getNode(locationId)?.properties.attunedSphere).toBeUndefined();
  });
});

// ─── curse_artifact ─────────────────────────────────────────────────────────

describe('curse_artifact op', () => {
  it('appends a concealed per-tick quintessence-drain effect and sets cursed flags', () => {
    const graph = makeGraph();
    addArtifact(graph);
    const result = executeGraphOps(graph, [{ op: 'curse_artifact', nodeId: '$target' }], ctx(artifactId));

    expect(result.allSucceeded).toBe(true);
    const effects = effectsOf(graph);
    expect(effects).toHaveLength(1);
    expect(effects[0]).toEqual({
      type: 'resource_manipulate',
      resource: 'quintessence',
      target: 'self',
      amount: -CURSE_QUINTESSENCE_DRAIN,
      mode: 'per_tick',
    });
    expect(graph.getNode(artifactId)?.properties.cursed).toBe(true);
    expect(graph.getNode(artifactId)?.properties.curseConcealed).toBe(true);
  });

  it('fail-soft: non-artifact target is a no-op success', () => {
    const graph = makeGraph();
    addLocation(graph);
    const result = executeGraphOps(graph, [{ op: 'curse_artifact', nodeId: '$target' }], ctx(locationId));
    expect(result.allSucceeded).toBe(true);
    expect(graph.getNode(locationId)?.properties.cursed).toBeUndefined();
  });
});

// ─── nullify_artifact ───────────────────────────────────────────────────────

describe('nullify_artifact op', () => {
  it('strips effects and clears attune/curse/enchant state', () => {
    const graph = makeGraph();
    addArtifact(graph, {
      effects: [{ type: 'passive', reach: 'heart', value: 2 }],
      attunedSphere: 'life',
      cursed: true,
      curseConcealed: true,
      attachmentTier: 3,
    });
    const result = executeGraphOps(graph, [{ op: 'nullify_artifact', nodeId: '$target' }], ctx(artifactId));

    expect(result.allSucceeded).toBe(true);
    const props = graph.getNode(artifactId)?.properties as Record<string, unknown>;
    expect(props.effects).toEqual([]);
    expect(props.attunedSphere).toBeUndefined();
    expect(props.cursed).toBeUndefined();
    expect(props.curseConcealed).toBeUndefined();
    expect(props.attachmentTier).toBeUndefined();
  });

  it('is the inverse of attune then nullify (bearer loses everything)', () => {
    const graph = makeGraph();
    addArtifact(graph);
    executeGraphOps(graph, [{ op: 'attune_artifact', nodeId: '$target' }], ctx(artifactId));
    expect(effectsOf(graph)).toHaveLength(1);
    executeGraphOps(graph, [{ op: 'nullify_artifact', nodeId: '$target' }], ctx(artifactId));
    expect(effectsOf(graph)).toEqual([]);
    expect(graph.getNode(artifactId)?.properties.attunedSphere).toBeUndefined();
  });

  it('fail-soft: already-inert artifact clears nothing and still succeeds', () => {
    const graph = makeGraph();
    addArtifact(graph);
    const result = executeGraphOps(graph, [{ op: 'nullify_artifact', nodeId: '$target' }], ctx(artifactId));
    expect(result.allSucceeded).toBe(true);
    expect(effectsOf(graph)).toEqual([]);
  });
});

// ─── fortify_location ───────────────────────────────────────────────────────

describe('fortify_location op', () => {
  it('raises an unset multiplier from the siege fallback base by the bonus', () => {
    const graph = makeGraph();
    addLocation(graph); // no locationSubtype → getFortificationModifier(undefined) === 1
    const result = executeGraphOps(graph, [{ op: 'fortify_location', nodeId: '$target' }], ctx(locationId));

    expect(result.allSucceeded).toBe(true);
    const expected = getFortificationModifier(undefined) + FORTIFY_MULTIPLIER_BONUS;
    expect(graph.getNode(locationId)?.properties.fortificationMultiplier).toBeCloseTo(expected, 10);
  });

  it('builds on an existing multiplier and clamps to the cap', () => {
    const graph = makeGraph();
    addLocation(graph, { fortificationMultiplier: FORTIFY_MULTIPLIER_MAX - 0.1 });
    executeGraphOps(graph, [{ op: 'fortify_location', nodeId: '$target' }], ctx(locationId));
    expect(graph.getNode(locationId)?.properties.fortificationMultiplier).toBeCloseTo(FORTIFY_MULTIPLIER_MAX, 10);
  });

  it('seeds from the subtype fallback for a fortifiable site', () => {
    const graph = makeGraph();
    addLocation(graph, { locationSubtype: 'city' });
    executeGraphOps(graph, [{ op: 'fortify_location', nodeId: '$target' }], ctx(locationId));
    const expected = Math.min(FORTIFY_MULTIPLIER_MAX, getFortificationModifier('city') + FORTIFY_MULTIPLIER_BONUS);
    expect(graph.getNode(locationId)?.properties.fortificationMultiplier).toBeCloseTo(expected, 10);
  });

  it('fail-soft: missing target node is a no-op success', () => {
    const graph = makeGraph();
    const result = executeGraphOps(graph, [{ op: 'fortify_location', nodeId: 'loc.ghost' }], ctx('loc.ghost'));
    expect(result.allSucceeded).toBe(true);
  });
});
