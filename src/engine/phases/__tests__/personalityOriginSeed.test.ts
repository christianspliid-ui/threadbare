import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../../graph';
import type { GameState } from '../../../types/gameState';
import { clearTraces, getTraces, enableTracing } from '../../traceBuffer';
import { processPersonalityOriginSeed } from '../personalityOriginSeed';
import { assignTrait } from '../../traits';
import type { AxiologicalProfile } from '../../../types/agent';
import { REACH_VALUE_PAIR, VALUE_PAIRS } from '../../../types/agent';
import { getAxisByReach } from '../../../types/axisRegistry';
import type { TraitDefinitionProperties } from '../../../types/traits';

const ASCENDANT_ID = 'ascendant';

function makeActor(graph: WorldGraph, id: string, props: Record<string, unknown> = {}): void {
  graph.addNode({
    id,
    type: 'actor',
    name: id,
    properties: { actorType: 'individual', axiologicalProfile: {} as AxiologicalProfile, ...props },
  });
}

function makeState(graph: WorldGraph, tick = 1, seed = 42): GameState {
  return { graph, tick, seed, ascendantId: ASCENDANT_ID } as unknown as GameState;
}

function seededTraces() {
  return getTraces().filter(
    (t) => t.category === 'personality_origin_seeded' && (t as { details?: { kind?: string } }).details?.kind === 'seeded',
  );
}

function addTraitDef(graph: WorldGraph, id: string, axisContributions: Record<string, number>): void {
  const props: TraitDefinitionProperties = {
    subcategory: 'innate',
    description: '',
    importance: 0.5,
    maxLevel: 1,
    visibility: 'public',
    domainContributions: {},
    tags: [],
    flavorText: '',
    axisContributions,
  };
  graph.addNode({ id, type: 'trait', name: id, properties: props as unknown as Record<string, unknown> });
}

describe('processPersonalityOriginSeed — seeding', () => {
  let graph: WorldGraph;
  beforeEach(() => {
    graph = new WorldGraph();
    clearTraces();
    enableTracing();
  });

  it('seeds every mortal individual with vignette provenance + baseline updates', () => {
    makeActor(graph, 'a');
    makeActor(graph, 'b');
    const res = processPersonalityOriginSeed(makeState(graph));
    expect(res.seeded).toBe(2);
    for (const id of ['a', 'b']) {
      const props = graph.getNode(id)!.properties!;
      expect(props.originVignettesSeeded).toBe(true);
      expect(Array.isArray(props.originVignettes)).toBe(true);
      // Baseline updates only ever land on reach ValuePairs.
      const profile = props.axiologicalProfile as Record<string, number>;
      for (const key of Object.keys(profile)) {
        expect(VALUE_PAIRS).toContain(key);
      }
    }
  });

  it('skips the ascendant (personality is a mortal layer)', () => {
    graph.addNode({ id: ASCENDANT_ID, type: 'actor', name: 'god', properties: { actorType: 'individual' } });
    processPersonalityOriginSeed(makeState(graph));
    expect(graph.getNode(ASCENDANT_ID)!.properties!.originVignettesSeeded).toBeUndefined();
  });

  it('skips deceased actors', () => {
    makeActor(graph, 'dead', { deceased: true });
    const res = processPersonalityOriginSeed(makeState(graph));
    expect(res.seeded).toBe(0);
    expect(graph.getNode('dead')!.properties!.originVignettesSeeded).toBeUndefined();
  });

  it('is idempotent across ticks (never re-seeds a seeded agent)', () => {
    makeActor(graph, 'a');
    processPersonalityOriginSeed(makeState(graph, 1, 7));
    const first = { ...(graph.getNode('a')!.properties!.axiologicalProfile as Record<string, number>) };
    const vigFirst = [...(graph.getNode('a')!.properties!.originVignettes as string[])];

    const res2 = processPersonalityOriginSeed(makeState(graph, 2, 7));
    expect(res2.seeded).toBe(0);
    expect(graph.getNode('a')!.properties!.axiologicalProfile).toEqual(first);
    expect(graph.getNode('a')!.properties!.originVignettes).toEqual(vigFirst);
  });

  it('is deterministic for the same world seed', () => {
    makeActor(graph, 'a');
    processPersonalityOriginSeed(makeState(graph, 1, 7));
    const profile = graph.getNode('a')!.properties!.axiologicalProfile;
    const vignettes = graph.getNode('a')!.properties!.originVignettes;

    const g2 = new WorldGraph();
    makeActor(g2, 'a');
    processPersonalityOriginSeed(makeState(g2, 1, 7));
    expect(g2.getNode('a')!.properties!.axiologicalProfile).toEqual(profile);
    expect(g2.getNode('a')!.properties!.originVignettes).toEqual(vignettes);
  });

  it('lays vignettes ONTO the existing baseline, preserving unrelated pairs (additive)', () => {
    makeActor(graph, 'a', { axiologicalProfile: { courage_prudence: 0.9 } as AxiologicalProfile });
    processPersonalityOriginSeed(makeState(graph));
    const profile = graph.getNode('a')!.properties!.axiologicalProfile as Record<string, number>;
    // The meta pair (not a reach axis) is untouched by origin seeding.
    expect(profile.courage_prudence).toBe(0.9);
  });

  it('emits ONE aggregate seeded trace per tick, not one-per-agent', () => {
    makeActor(graph, 'a');
    makeActor(graph, 'b');
    makeActor(graph, 'c');
    processPersonalityOriginSeed(makeState(graph));
    const traces = seededTraces();
    expect(traces).toHaveLength(1);
    expect((traces[0] as { details?: { count?: number } }).details?.count).toBe(3);
  });

  it('emits no trace when there is nothing to seed', () => {
    processPersonalityOriginSeed(makeState(graph));
    expect(seededTraces()).toHaveLength(0);
  });
});

describe('processPersonalityOriginSeed — axisContributions folding', () => {
  let graph: WorldGraph;
  beforeEach(() => {
    graph = new WorldGraph();
    clearTraces();
    enableTracing();
  });

  it('folds a permanent trait axisContribution into the baseline (field consumed)', () => {
    addTraitDef(graph, 'trait.mark.iron', { [getAxisByReach('iron').axisId]: 5 });
    makeActor(graph, 'a');
    assignTrait(graph, 'a', 'trait.mark.iron', { tick: 1, source: 'test' });

    processPersonalityOriginSeed(makeState(graph));
    const profile = graph.getNode('a')!.properties!.axiologicalProfile as Record<string, number>;
    // +5 canonical saturates iron to virtue → signed +1 regardless of vignette draw.
    expect(profile[REACH_VALUE_PAIR.iron]).toBe(1);
  });

  it('emits an unknown_axis trace for a trait contribution keyed by an unknown axis', () => {
    addTraitDef(graph, 'trait.bad', { not_an_axis: 0.4 });
    makeActor(graph, 'a');
    assignTrait(graph, 'a', 'trait.bad', { tick: 1, source: 'test' });

    const res = processPersonalityOriginSeed(makeState(graph));
    expect(res.unknownAxes).toBeGreaterThanOrEqual(1);
    const unknown = getTraces().filter(
      (t) => t.category === 'personality_origin_seeded' && (t as { details?: { kind?: string } }).details?.kind === 'unknown_axis',
    );
    expect(unknown).toHaveLength(1);
  });
});
