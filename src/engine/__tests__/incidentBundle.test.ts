import { describe, it, expect, beforeEach, vi } from 'vitest';

import { buildIncidentBundle, serializeIncidentBundle, incidentBundleFilename } from '../incidentBundle';
import { createSimulationRuntime } from '../simulationRuntime';
import { recordTick } from '../incidentRecorder';
import { WorldGraph } from '../graph';
import * as tickHealthMonitor from '../tickHealthMonitor';
import { enableTracing, disableTracing, clearTraces, emitTrace } from '../traceBuffer';
import type { GameState } from '../../types/gameState';
import type { GraphNode } from '../../types/graph';

function node(id: string, name: string): GraphNode {
  return { id, type: 'actor', name, properties: { actorType: 'individual' } };
}

/**
 * A state carrying the two shapes that make a naive snapshot lie: a live
 * `WorldGraph` (whose internals are private and stringify to `{}`) and a
 * populated `Map` (which stringifies to `{}` full stop).
 */
function makeState(): GameState {
  const graph = new WorldGraph();
  graph.addNode(node('actor_a', 'Kael'));
  graph.addNode(node('actor_b', 'Mira'));
  // A real actor→actor edge type from EDGE_SCHEMA, not an invented one: a
  // fixture that defines its own shape can pass while the real graph would warn.
  graph.addEdge({
    id: 'e1',
    source: 'actor_a',
    target: 'actor_b',
    type: 'knows_secret_of',
    properties: {
      secretType: 'crime',
      magnitude: 0.4,
      discoveredTick: 3,
      source: 'witnessed',
      revealed: false,
    },
  });

  const visibilityMap = new Map<string, unknown>([
    ['3,4', { state: 'visible', lastSeenTick: 7 }],
    ['3,5', { state: 'remembered', lastSeenTick: 2 }],
  ]);

  return {
    tick: 12,
    cycle: 1,
    phase: 'play',
    seed: 42,
    graph,
    tiles: [],
    ascendantId: 'ascendant_1',
    ascendantIdentity: null,
    essencePool: { force: 3 },
    doomClock: { currentProgress: 0.1 },
    mandateState: null,
    visibilityMap,
    culturalInsightMap: new Map([['culture_1', 0.4]]),
    agentKnowledge: new Map(),
    tickEvents: [],
    recentEvents: [],
    chronicleEntries: [],
    unifiedActions: [],
    followedAgentIds: ['actor_b'],
  } as unknown as GameState;
}

describe('incidentBundle', () => {
  beforeEach(() => {
    tickHealthMonitor._resetForTests();
    vi.restoreAllMocks();
  });

  it('carries the run key that regenerates the world, and says the tiles are omitted', () => {
    const bundle = buildIncidentBundle(makeState(), createSimulationRuntime(), {
      mapSize: 'medium',
      mapCols: 32,
      mapRows: 24,
    });
    expect(bundle.run).toMatchObject({
      seed: 42,
      tick: 12,
      mapSize: 'medium',
      mapCols: 32,
      mapRows: 24,
      tilesOmitted: true,
    });
    expect(bundle.failedSections).toEqual([]);
  });

  /**
   * The trap this module exists to survive (THR-1134).
   *
   * Both halves are asserted against the *same* live objects, so neither side is
   * a fixture inventing the problem: `JSON.stringify` really does render a
   * populated `Map` and a live `WorldGraph` as empty, and the bundle really does
   * carry their contents. If `JSON.stringify` ever stopped losing them, the first
   * two assertions would fail and this test would be telling the truth about that
   * too.
   */
  it('round-trips a populated Map and the graph that naive stringify loses', () => {
    const state = makeState();

    const naive = JSON.parse(JSON.stringify(state));
    expect(naive.visibilityMap).toEqual({});
    expect(naive.graph.nodes ?? {}).toEqual({});

    const bundle = buildIncidentBundle(state, createSimulationRuntime(), { includeWorld: true });
    const parsed = JSON.parse(serializeIncidentBundle(bundle));

    expect(parsed.world.visibilityMap.__map).toEqual([
      ['3,4', { state: 'visible', lastSeenTick: 7 }],
      ['3,5', { state: 'remembered', lastSeenTick: 2 }],
    ]);
    expect(parsed.world.nodes.map((n: GraphNode) => n.id).sort()).toEqual(['actor_a', 'actor_b']);
    expect(parsed.world.edges).toHaveLength(1);
  });

  it('manifests every collection it walked and reports the bundle complete', () => {
    const bundle = buildIncidentBundle(makeState(), createSimulationRuntime(), { includeWorld: true });
    const parsed = JSON.parse(serializeIncidentBundle(bundle));

    const manifest = parsed.serialization;
    expect(manifest.walked).toBeGreaterThan(0);
    expect(manifest.rewritten).toBe(manifest.walked);
    expect(manifest.incomplete).toBe(false);
    expect(manifest.collections.map((c: { path: string }) => c.path))
      .toContain('world.visibilityMap');
    expect(manifest.sectionBytes.world).toBeGreaterThan(0);
  });

  /**
   * Per-section isolation. One section throwing must cost that section and
   * nothing else — a bundle missing one block is worth far more than no bundle.
   */
  it('isolates a throwing section as { error } and names it in failedSections', () => {
    vi.spyOn(tickHealthMonitor, 'exportDiagnostics').mockImplementation(() => {
      throw new Error('census exploded');
    });

    const bundle = buildIncidentBundle(makeState(), createSimulationRuntime(), {});

    expect(bundle.failedSections).toEqual(['census']);
    expect(bundle.census).toEqual({ error: 'census exploded' });
    // Every sibling still built.
    expect(bundle.run).not.toHaveProperty('error');
    expect(bundle.events).not.toHaveProperty('error');
    expect(bundle.focus).not.toHaveProperty('error');
    expect(() => serializeIncidentBundle(bundle)).not.toThrow();
  });

  /**
   * `traceBuffer`'s `enabled` flag is module scope, shared across every test file
   * in the worker — so both arms set it themselves rather than inheriting whatever
   * a sibling left behind. The disarmed arm is the load-bearing one: an empty
   * array would read as "nothing happened", which is a different and far more
   * misleading claim than "nobody was recording".
   */
  it('says recording was off rather than shipping an empty array that reads as nothing happened', () => {
    disableTracing();
    const bundle = buildIncidentBundle(makeState(), createSimulationRuntime(), {});
    expect(bundle.traces).toMatchObject({ armed: false });
    expect(bundle.traces).not.toHaveProperty('entries');
    expect((bundle.run as { tracingWasOn: boolean }).tracingWasOn).toBe(false);
  });

  it('carries the trace ring when recording was armed', () => {
    disableTracing();
    clearTraces();
    enableTracing();
    try {
      emitTrace({ category: 'engine_warning', tick: 12, summary: 'a thing happened' });
      const bundle = buildIncidentBundle(makeState(), createSimulationRuntime(), {});
      const traces = bundle.traces as { armed: boolean; entries: unknown[] };
      expect(traces.armed).toBe(true);
      // Confirms the arm actually perturbed something: a disarmed buffer would
      // have swallowed the emit above and left this at zero.
      expect(traces.entries.length).toBeGreaterThan(0);
      expect((bundle.run as { tracingWasOn: boolean }).tracingWasOn).toBe(true);
    } finally {
      disableTracing();
      clearTraces();
    }
  });

  it('carries the flight recorder rings through the census and events sections', () => {
    const runtime = createSimulationRuntime();
    const state = makeState();
    recordTick(runtime.incidentRecorder, state);

    const bundle = buildIncidentBundle(state, runtime, {});
    expect((bundle.census as { metrics: unknown[] }).metrics).toHaveLength(1);
    expect((bundle.census as { recorder: { misses: number } }).recorder.misses).toBe(0);
  });

  it('dumps the neighbourhood of the selection and of every followed mortal', () => {
    const bundle = buildIncidentBundle(makeState(), createSimulationRuntime(), {
      ui: {
        view: 'game',
        selectedAgentId: 'actor_a',
        selectedLocationId: null,
        selectedFactionId: null,
        selectedHex: null,
        openModals: [],
        actionDrawerOpen: false,
        scryActive: false,
        cameraFocusHex: null,
        simRunning: true,
      },
    });

    const focus = bundle.focus as { entities: { id: string; neighbours: GraphNode[]; missing: boolean }[] };
    expect(focus.entities.map(e => e.id)).toEqual(['actor_a', 'actor_b']);
    expect(focus.entities[0].neighbours.map(n => n.id)).toEqual(['actor_b']);
    expect(focus.entities[0].missing).toBe(false);
  });

  /** A selected id that resolves to nothing is a finding, not a row to drop. */
  it('marks a selection that resolves to no node rather than omitting it', () => {
    const bundle = buildIncidentBundle(makeState(), createSimulationRuntime(), {
      ui: {
        view: 'game',
        selectedAgentId: 'actor_ghost',
        selectedLocationId: null,
        selectedFactionId: null,
        selectedHex: null,
        openModals: [],
        actionDrawerOpen: false,
        scryActive: false,
        cameraFocusHex: null,
        simRunning: false,
      },
    });
    const focus = bundle.focus as { entities: { id: string; missing: boolean }[] };
    expect(focus.entities.find(e => e.id === 'actor_ghost')?.missing).toBe(true);
  });

  it('omits the world tier unless it is asked for', () => {
    const bundle = buildIncidentBundle(makeState(), createSimulationRuntime(), {});
    expect(bundle.world).toBeUndefined();
  });

  it('names the file after the build, the seed, and the tick', () => {
    const name = incidentBundleFilename(
      'threadbearer-snapshot',
      'a87e8f2400000000',
      42,
      120,
      new Date(2026, 8, 10, 14, 5),
    );
    expect(name).toBe('threadbearer-snapshot-a87e8f2-seed42-t120-20260910-1405.json');
  });
});
