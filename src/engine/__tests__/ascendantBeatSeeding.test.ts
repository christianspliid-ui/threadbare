import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { seedBeatGraph } from '../ascendantBeatSeeding';
import { resolvePendingBeat, forceOfferBeatById, createInitialAscendantBeatState } from '../ascendantBeat';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import type { GameState } from '../../types/gameState';
import type { BeatDefinition } from '../../types/ascendantBeat';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const ASC = 'asc-1';

/**
 * A graph with an ascendant (primary sphere `force`), one settlement, and — optionally —
 * The First bonded (thread edge `courtPosition: 'the_first'`) standing at that settlement.
 */
function buildGraph(opts: { withFirst?: boolean; withLocation?: boolean; withSphere?: boolean } = {}): WorldGraph {
  const { withFirst = true, withLocation = true, withSphere = true } = opts;
  const graph = new WorldGraph();
  // Ascendants are `actor` nodes (load-bearing decision — same entity type as agents).
  graph.addNode({
    id: ASC,
    type: 'actor',
    name: 'The Player-God',
    properties: {
      ...(withSphere ? { sphereAlignment: { primary: 'force', secondary: 'matter' } } : {}),
      domainAffinities: { iron: 0.8, stone: 0.4 },
    },
  });
  if (withLocation) {
    graph.addNode({
      id: 'loc-haven',
      type: 'location',
      name: 'Haven',
      properties: { locationType: 'city', locationSubtype: 'city' },
    });
  }
  if (withFirst) {
    graph.addNode({ id: 'first-1', type: 'actor', name: 'Kael', properties: { actorType: 'individual' } });
    graph.addEdge({
      id: 'thread.first',
      source: ASC,
      target: 'first-1',
      type: 'thread',
      properties: { courtPosition: 'the_first', tier: 2 },
    });
    if (withLocation) {
      graph.addEdge({
        id: 'first.located_at',
        source: 'first-1',
        target: 'loc-haven',
        type: 'located_at',
        properties: {},
      });
    }
  }
  return graph;
}

function stateWith(graph: WorldGraph, tick = 4): GameState {
  return { tick, seed: 42, ascendantId: ASC, graph } as unknown as GameState;
}

const SEAT_BEAT: BeatDefinition = {
  beatId: 'beat.spine.the_seat',
  kind: 'spine',
  trigger: { kind: 'turn' },
  seedsGraph: { kind: 'home_seat' },
};
const ARTIFACT_BEAT: BeatDefinition = {
  beatId: 'beat.spine.thing_left_behind',
  kind: 'spine',
  trigger: { kind: 'turn' },
  seedsGraph: { kind: 'threaded_artifact' },
};

describe('seedBeatGraph — home_seat (THR-520)', () => {
  beforeEach(() => { clearTraces(); enableTracing(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('seats the ascendant at The First’s settlement and begins seat income', () => {
    const graph = buildGraph();
    const result = seedBeatGraph(stateWith(graph), SEAT_BEAT, 4);

    expect(result.seededNodeIds).toEqual(['loc-haven']);
    const asc = graph.getNode(ASC);
    expect(asc?.properties.homeSeatLocationId).toBe('loc-haven');
    // a controls edge (ascendant → seat) is created and reported.
    const controlsId = `edge.seat.controls.${ASC}.loc-haven`;
    expect(graph.getEdge(controlsId)).toBeDefined();
    expect(result.seededEdgeIds).toContain(controlsId);

    const seeded = getTraces().find(t => t.category === 'ascendant.beat.seeded') as
      | { seed?: string; seededNodeIds?: string[] } | undefined;
    expect(seeded?.seed).toBe('home_seat');
    expect(seeded?.seededNodeIds).toEqual(['loc-haven']);
  });

  it('climbs from a sublocation to its parent settlement', () => {
    const graph = buildGraph({ withFirst: true, withLocation: true });
    // Re-point The First at a sublocation of Haven.
    graph.addNode({
      id: 'sub-tavern',
      type: 'location',
      name: 'The Tavern',
      properties: { locationType: 'sublocation', parentLocationId: 'loc-haven' },
    });
    graph.updateEdge('first.located_at', { target: 'sub-tavern' });

    const result = seedBeatGraph(stateWith(graph), SEAT_BEAT, 4);
    expect(result.seededNodeIds).toEqual(['loc-haven']);
    expect(graph.getNode(ASC)?.properties.homeSeatLocationId).toBe('loc-haven');
  });

  it('falls back to the deterministic default when no First is bonded', () => {
    const graph = buildGraph({ withFirst: false });
    const result = seedBeatGraph(stateWith(graph), SEAT_BEAT, 4);
    // setHomeSeat default prefers a city → Haven.
    expect(result.seededNodeIds).toEqual(['loc-haven']);
    expect(graph.getNode(ASC)?.properties.homeSeatLocationId).toBe('loc-haven');
  });

  it('fail-soft: no locations → empty seed + failSoft trace, no throw', () => {
    const graph = buildGraph({ withFirst: false, withLocation: false });
    const result = seedBeatGraph(stateWith(graph), SEAT_BEAT, 4);
    expect(result.seededNodeIds).toEqual([]);
    const seeded = getTraces().find(t => t.category === 'ascendant.beat.seeded') as
      | { failSoft?: string } | undefined;
    expect(seeded?.failSoft).toBeTruthy();
  });
});

describe('seedBeatGraph — threaded_artifact (THR-520)', () => {
  beforeEach(() => { clearTraces(); enableTracing(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('mints a sphere-flavored artifact, threads it, and gives it to The First', () => {
    const graph = buildGraph();
    const result = seedBeatGraph(stateWith(graph), ARTIFACT_BEAT, 4);

    expect(result.seededNodeIds).toHaveLength(1);
    const artifactId = result.seededNodeIds[0];
    const artifact = graph.getNode(artifactId);
    expect(artifact?.type).toBe('artifact');
    // `force` → a passive iron effect from SPHERE_EFFECT_TABLE.
    const effects = artifact?.properties.effects as Array<{ type: string; reach?: string }>;
    expect(effects).toHaveLength(1);
    expect(effects[0]).toMatchObject({ type: 'passive', reach: 'iron' });

    // thread edge ascendant → artifact, possesses edge First → artifact.
    const threadEdge = graph.getOutgoingEdges(ASC, 'thread').find(e => e.target === artifactId);
    expect(threadEdge).toBeDefined();
    const possess = graph.getOutgoingEdges('first-1', 'possesses').find(e => e.target === artifactId);
    expect(possess).toBeDefined();
    expect(result.seededEdgeIds).toEqual(expect.arrayContaining([threadEdge!.id, possess!.id]));
  });

  it('mints + threads the artifact even with no First, skipping the possesses edge', () => {
    const graph = buildGraph({ withFirst: false });
    const result = seedBeatGraph(stateWith(graph), ARTIFACT_BEAT, 4);
    expect(result.seededNodeIds).toHaveLength(1);
    const artifactId = result.seededNodeIds[0];
    expect(graph.getOutgoingEdges(ASC, 'thread').some(e => e.target === artifactId)).toBe(true);
    // no bearer → no possesses edge.
    expect(graph.getIncomingEdges(artifactId, 'possesses')).toHaveLength(0);
  });

  it('is deterministic: same seed + tick → identical artifact id', () => {
    const a = seedBeatGraph(stateWith(buildGraph(), 4), ARTIFACT_BEAT, 4);
    const b = seedBeatGraph(stateWith(buildGraph(), 4), ARTIFACT_BEAT, 4);
    expect(a.seededNodeIds).toEqual(b.seededNodeIds);
  });

  it('fail-soft: ascendant with no sphere alignment → empty seed', () => {
    const graph = buildGraph({ withSphere: false });
    const result = seedBeatGraph(stateWith(graph), ARTIFACT_BEAT, 4);
    expect(result.seededNodeIds).toEqual([]);
  });
});

describe('seedBeatGraph — guards', () => {
  beforeEach(() => { clearTraces(); enableTracing(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('no-ops for a beat without a seedsGraph tag', () => {
    const plain: BeatDefinition = { beatId: 'beat.spine.opening', kind: 'spine', trigger: { kind: 'turn' } };
    const result = seedBeatGraph(stateWith(buildGraph()), plain, 4);
    expect(result.seededNodeIds).toEqual([]);
    expect(result.seededEdgeIds).toEqual([]);
  });

  it('no-ops with a failSoft trace when there is no ascendant', () => {
    const graph = buildGraph();
    const noAsc = { tick: 4, seed: 42, graph } as unknown as GameState;
    const result = seedBeatGraph(noAsc, SEAT_BEAT, 4);
    expect(result.seededNodeIds).toEqual([]);
    const seeded = getTraces().find(t => t.category === 'ascendant.beat.seeded') as
      | { failSoft?: string } | undefined;
    expect(seeded?.failSoft).toBe('no_ascendant');
  });
});

describe('resolvePendingBeat — seeds graph on a seeding spine beat (THR-520)', () => {
  beforeEach(() => { clearTraces(); enableTracing(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('resolving Beat 1 (The Seat) sets the home seat and records seededNodeIds', () => {
    const graph = buildGraph();
    const offered = forceOfferBeatById(createInitialAscendantBeatState(), 'beat.spine.the_seat', 4)!.next;
    const state = { tick: 4, seed: 42, ascendantId: ASC, graph, unlockedActionIds: [] } as unknown as GameState;
    state.ascendantBeats = offered;

    const result = resolvePendingBeat(state);
    expect(result.resolved).toBe(true);
    expect(graph.getNode(ASC)?.properties.homeSeatLocationId).toBe('loc-haven');
    const record = result.state.ascendantBeats?.history[0];
    expect(record?.seededNodeIds).toEqual(['loc-haven']);
    // grant still applied (the THR-517 contract is preserved).
    expect(result.state.unlockedActionIds).toEqual(expect.arrayContaining(['bind_thread_location']));
  });
});
