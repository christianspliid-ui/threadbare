// @vitest-lane heavy — builds a medium world and drives it 300 ticks (THR-1384)
/**
 * THR-1456 — a numeric node property must never end up holding an object.
 *
 * `applyNodeChanges` understood two shapes for a `changes` entry: a relative change
 * written as a **string** (`'-25'`, parsed and added) and a direct replacement
 * (anything else, assigned verbatim). `monster-encounter-content.ts` authors its hits
 * in a third shape — the **object** `{ delta: -25 }` — which fell through to the
 * replacement branch, so `properties.prosperity` became the literal `{ delta: -25 }`.
 *
 * Two things went wrong and only one of them was visible. The raid stopped doing what
 * it was authored to do (every guarded reader sees a non-number as `0`, so a devastating
 * raid and a merely severe one become indistinguishable and the settlement can never
 * recover); and the one *unguarded* reader crashed the tick loop, which is how it
 * surfaced at all.
 *
 * The two arms below are deliberately different in kind, because either alone would
 * pass while saying nothing:
 *
 *  - **Arm A** drives the real executor with the real authored constants, so it cannot
 *    drift from the content it is protecting, and reverting the executor branch turns
 *    it red immediately.
 *  - **Arm B** is the arm that would actually have caught this. Arm A only proves the
 *    shape the *test* thought to write; the defect was found because a generated world
 *    was carrying corruption nobody had written a test for. So Arm B asks the world,
 *    not a fixture: 300 ticks of seed 42 on the medium preset, then a sweep of every
 *    Location. The measured red baseline on `origin/main` is **3 Locations carrying
 *    `{ delta: n }` in `properties.defense` at tick 300** — this file was written
 *    against that failure and confirmed to reproduce it before the fix landed.
 *
 * Arm B carries a population guard, because a world in which the monster content never
 * fired would report zero corruption for the wrong reason. The guard counts the numeric
 * hits as they are written during the run, so it holds whichever executor branch is in
 * play — it proves the content *ran*, independently of what the run produced.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { WorldGraph } from '../graph';
import { executeGraphOps } from '../graphOpExecutor';
import { getLocationNodes } from '../sublocationShape';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { runTick } from '../orchestrator';
import { createBalancedCosmology } from '../cosmology';
import { generateArchetypes } from '../ascendant';
import { createSimulationRuntime } from '../simulationRuntime';
import type { GameState } from '../../types/gameState';
import type { GraphOpContext } from '../../types/graphOp';

/** The property keys the defect corrupted, and the ones every economy reader treats as numbers. */
const NUMERIC_LOCATION_KEYS = ['prosperity', 'defense'] as const;

describe('THR-1456 arm A — the authored object shape applies as a number', () => {
  const ctx: GraphOpContext = { actorId: 'actor.test', targetId: 'loc.test', locationId: 'hex.test' };

  function makeGraph(): WorldGraph {
    const g = new WorldGraph();
    g.addNode({ id: 'actor.test', type: 'actor', name: 'Kael', properties: { actorType: 'individual', courage: 0.5 } });
    g.addNode({ id: 'loc.test', type: 'location', name: 'Ashford', properties: { prosperity: 40, defense: 30 } });
    return g;
  }

  it('subtracts a { delta: n } change instead of replacing the property with the object', () => {
    const graph = makeGraph();
    const result = executeGraphOps(graph, [{
      op: 'update_node',
      nodeId: '$target',
      changes: { prosperity: { delta: -25 } },
    }], ctx);
    expect(result.allSucceeded).toBe(true);

    const loc = graph.getNode('loc.test')!;
    // The whole point: a number, and the *right* number. Asserting only `typeof` would
    // pass against a branch that coerced the object to 0 and called it fixed.
    expect(typeof loc.properties.prosperity).toBe('number');
    expect(loc.properties.prosperity).toBeCloseTo(15, 10); // 40 - 25
  });

  it('adds a positive { delta: n } change', () => {
    const graph = makeGraph();
    executeGraphOps(graph, [{ op: 'update_node', nodeId: '$target', changes: { defense: { delta: 12 } } }], ctx);
    expect(graph.getNode('loc.test')!.properties.defense).toBeCloseTo(42, 10); // 30 + 12
  });

  it('treats a non-number current value as 0, the way the relative-string branch already does', () => {
    const graph = makeGraph();
    graph.updateNode('loc.test', { properties: { prosperity: { delta: -25 } as unknown as number } });
    executeGraphOps(graph, [{ op: 'update_node', nodeId: '$target', changes: { prosperity: { delta: -8 } } }], ctx);

    // Not a claim that the lost value is recovered — it is gone. The claim is that the
    // corruption does not persist as an object once any later delta touches the key.
    expect(graph.getNode('loc.test')!.properties.prosperity).toBeCloseTo(-8, 10);
  });

  it('still replaces verbatim for object shapes that are not a { delta: n } change', () => {
    const graph = makeGraph();
    executeGraphOps(graph, [{
      op: 'update_node',
      nodeId: '$target',
      changes: { banner: { sigil: 'wolf', tint: 'ash' } },
    }], ctx);
    // Replacement is still the rule for everything else — the branch is additive, and a
    // test that only checked the delta path would not notice it had eaten object writes.
    expect(graph.getNode('loc.test')!.properties.banner).toEqual({ sigil: 'wolf', tint: 'ash' });
  });

  it('warns rather than silently writing an object over a numeric property', () => {
    const graph = makeGraph();
    const lines: string[] = [];
    const realWarn = console.warn;
    console.warn = (...args: unknown[]) => { lines.push(args.map(String).join(' ')); };
    try {
      // A mis-shaped relative change: `delta` present but not a number. Before THR-1456 a
      // mis-shaped *string* warned and a mis-shaped *object* did not — that asymmetry is
      // the reason this sat on `main` unnoticed.
      executeGraphOps(graph, [{
        op: 'update_node',
        nodeId: '$target',
        changes: { prosperity: { delta: 'a lot' } },
      }], ctx);
    } finally {
      console.warn = realWarn;
    }
    expect(lines.join('\n')).toMatch(/prosperity/);
  });
});

describe('THR-1456 arm B — no Location carries a non-number economy property after a long run', () => {
  let state: GameState;
  /**
   * How many times the run wrote one of the swept keys onto a Location. The population
   * guard: zero means the monster content never fired and the sweep below proves nothing.
   */
  let numericKeyWrites: number;

  beforeAll(() => {
    const runtime = createSimulationRuntime();
    const archetype = generateArchetypes(4, 42)[0];
    const preset = MAP_SIZE_PRESETS.medium;
    const { state: init } = initializeGameState(
      archetype, 'SweepBot', createBalancedCosmology(), 42, preset.cols, preset.rows,
    );
    state = init;

    numericKeyWrites = 0;
    const graph = state.graph;
    const realUpdateNode = graph.updateNode.bind(graph);
    (graph as unknown as { updateNode: typeof graph.updateNode }).updateNode = (id, updates) => {
      const props = (updates as { properties?: Record<string, unknown> }).properties;
      if (props && NUMERIC_LOCATION_KEYS.some((k) => k in props)) numericKeyWrites += 1;
      return realUpdateNode(id, updates);
    };

    try {
      for (let t = 0; t < 300; t++) state = runTick(state, [], runtime);
    } finally {
      (graph as unknown as { updateNode: typeof graph.updateNode }).updateNode = realUpdateNode;
    }
  }, 1_200_000);

  it('drove a world that actually writes the swept properties', () => {
    // Vacuity guard. A world that never touched `prosperity`/`defense` would sweep clean
    // for a reason that has nothing to do with the fix.
    expect(state.tick).toBeGreaterThanOrEqual(300);
    expect(getLocationNodes(state.graph).length).toBeGreaterThan(50);
    expect(numericKeyWrites).toBeGreaterThan(0);
  });

  it('leaves every prosperity and defense value a number', () => {
    const offenders: string[] = [];
    for (const loc of getLocationNodes(state.graph)) {
      for (const key of NUMERIC_LOCATION_KEYS) {
        const value = loc.properties?.[key];
        if (value !== undefined && typeof value !== 'number') {
          offenders.push(`${loc.id}.${key} = ${JSON.stringify(value)}`);
        }
      }
    }
    // Red baseline on `origin/main`: 3 entries, all `defense = {"delta":-10}`.
    expect(offenders.slice(0, 20)).toEqual([]);
  });
});
