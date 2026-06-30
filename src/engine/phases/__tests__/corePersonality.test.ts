import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../../graph';
import type { GameState } from '../../../types/gameState';
import { enableTracing, disableTracing, clearTraces, getTraces } from '../../traceBuffer';
import { processCorePersonality } from '../corePersonality';
import { CORE_CONTINUUM_IDS } from '../../../types/coreRegistry';

const ASCENDANT_ID = 'ascendant';

function makeActor(graph: WorldGraph, id: string, props: Record<string, unknown> = {}): void {
  graph.addNode({
    id,
    type: 'actor',
    name: id,
    properties: {
      actorType: 'individual',
      axiologicalProfile: { mercy_ruthlessness: 0.4 },
      domainCapabilities: { iron: 0.3 },
      ...props,
    },
  });
}

function makeState(graph: WorldGraph, tick = 1, seed = 42): GameState {
  return { graph, tick, seed, ascendantId: ASCENDANT_ID } as unknown as GameState;
}

describe('processCorePersonality — seeding', () => {
  let graph: WorldGraph;
  beforeEach(() => {
    graph = new WorldGraph();
    clearTraces();
  });

  it('seeds every mortal individual with a 5-continuum coreProfile in [0,1]', () => {
    makeActor(graph, 'a');
    makeActor(graph, 'b');
    const res = processCorePersonality(makeState(graph));
    expect(res.seeded).toBe(2);
    for (const id of ['a', 'b']) {
      const core = graph.getNode(id)!.properties!.coreProfile as Record<string, number>;
      expect(Object.keys(core).sort()).toEqual([...CORE_CONTINUUM_IDS].sort());
      for (const v of Object.values(core)) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });

  it('skips the ascendant (Core is a mortal layer)', () => {
    graph.addNode({ id: ASCENDANT_ID, type: 'actor', name: 'god', properties: { actorType: 'individual' } });
    processCorePersonality(makeState(graph));
    expect(graph.getNode(ASCENDANT_ID)!.properties!.coreProfile).toBeUndefined();
  });

  it('is deterministic for the same world seed and idempotent across ticks', () => {
    makeActor(graph, 'a');
    processCorePersonality(makeState(graph, 1, 7));
    const first = { ...(graph.getNode('a')!.properties!.coreProfile as Record<string, number>) };
    // Second run must not re-seed.
    const res2 = processCorePersonality(makeState(graph, 2, 7));
    expect(res2.seeded).toBe(0);
    expect(graph.getNode('a')!.properties!.coreProfile).toEqual(first);

    // Same seed, fresh graph → same draw (determinism).
    const g2 = new WorldGraph();
    makeActor(g2, 'a');
    processCorePersonality(makeState(g2, 1, 7));
    expect(g2.getNode('a')!.properties!.coreProfile).toEqual(first);
  });

  it('does NOT touch axiologicalProfile or domainCapabilities (Core ≠ reach ≠ capability)', () => {
    makeActor(graph, 'a');
    const before = graph.getNode('a')!.properties!;
    const axBefore = JSON.stringify(before.axiologicalProfile);
    const capBefore = JSON.stringify(before.domainCapabilities);
    processCorePersonality(makeState(graph));
    const after = graph.getNode('a')!.properties!;
    expect(JSON.stringify(after.axiologicalProfile)).toBe(axBefore);
    expect(JSON.stringify(after.domainCapabilities)).toBe(capBefore);
    expect(after.coreProfile).toBeDefined();
  });

  it('emits a core_personality/seeded trace per agent', () => {
    enableTracing();
    makeActor(graph, 'a');
    processCorePersonality(makeState(graph));
    const seeded = getTraces().filter(
      (t) => t.category === 'core_personality' && (t.details as { kind?: string })?.kind === 'seeded',
    );
    expect(seeded).toHaveLength(1);
    disableTracing();
  });
});

describe('processCorePersonality — emergence hysteresis', () => {
  let graph: WorldGraph;
  beforeEach(() => {
    graph = new WorldGraph();
    clearTraces();
    enableTracing();
  });

  it('emits emerge on threshold crossing and flags coreEmergent, only once', () => {
    makeActor(graph, 'a', { coreProfile: { core_warmth: 0.95 } });
    processCorePersonality(makeState(graph));
    const emerged = getTraces().filter(
      (t) => t.category === 'core_personality' && (t.details as { kind?: string })?.kind === 'emerge',
    );
    expect(emerged.length).toBeGreaterThanOrEqual(1);
    expect(graph.getNode('a')!.properties!.coreEmergent).toContain('core_warmth:virtue');

    // Re-run at the same position → no new emerge trace (idempotent crossing).
    clearTraces();
    processCorePersonality(makeState(graph, 2));
    const again = getTraces().filter(
      (t) => t.category === 'core_personality' && (t.details as { kind?: string })?.kind === 'emerge',
    );
    expect(again).toHaveLength(0);
    disableTracing();
  });
});

describe('processCorePersonality — bend under low Quintessence', () => {
  let graph: WorldGraph;
  beforeEach(() => {
    graph = new WorldGraph();
    clearTraces();
    enableTracing();
  });

  it('emits bend traces only when normalized Quintessence is low', () => {
    // Strongly Warm + nearly-empty Quintessence → bend fires.
    makeActor(graph, 'low', {
      coreProfile: { core_warmth: 0.95 },
      quintessence: 1,
      quintessenceMax: 100,
    });
    // Same Core but full Quintessence → no bend.
    makeActor(graph, 'high', {
      coreProfile: { core_warmth: 0.95 },
      quintessence: 100,
      quintessenceMax: 100,
    });
    processCorePersonality(makeState(graph));
    const bends = getTraces().filter(
      (t) => t.category === 'core_personality' && (t.details as { kind?: string })?.kind === 'bend',
    );
    expect(bends.length).toBeGreaterThan(0);
    expect(bends.every((t) => (t as { actorId?: string }).actorId === 'low')).toBe(true);
    disableTracing();
  });
});
