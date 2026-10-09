/**
 * THR-1787 — the warm start arrives with the opening already played.
 *
 * Before the warm-up's first tick, the no-choice opening gifts (the seat, the
 * thing left behind, the first word) settle as already played through the same
 * writer a clicked beat uses, after Beat 0. "A Path Opens" is a real choice and
 * stays at the cursor for the player.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  createInitialAscendantBeatState,
  settleOpeningSpineBeats,
  spineGateBlockedBy,
} from '../ascendantBeat';
import { ASCENDANT_SPINE } from '../../data/ascendant-beat-content';
import { WARM_START_SETTLED_SPINE_BEATS } from '../../components/Game/hooks/useWarmStart';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import type { GameState } from '../../types/gameState';

const ASC = 'asc-1';
const FIRST = 'first-1';
const PATH_OPENS = 'beat.spine.a_path_opens';

/** Ascendant + a city + a sublocation inside it where The First stands, bonded or not. */
function buildGraph(bonded: boolean): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: ASC,
    type: 'actor',
    name: 'The Player-God',
    properties: { sphereAlignment: { primary: 'force', secondary: 'matter' }, domainAffinities: { iron: 0.8, stone: 0.4 } },
  });
  graph.addNode({ id: 'loc-haven', type: 'location', name: 'Haven', properties: { locationType: 'city', locationSubtype: 'city' } });
  graph.addNode({ id: 'loc-haven-market', type: 'location', name: 'Haven Market', properties: { parentLocationId: 'loc-haven' } });
  graph.addNode({ id: FIRST, type: 'actor', name: 'Kael', properties: { actorType: 'individual' } });
  graph.addEdge({ id: 'first.located_at', source: FIRST, target: 'loc-haven-market', type: 'located_at', properties: {} });
  if (bonded) {
    graph.addEdge({
      id: 'thread.first', source: ASC, target: FIRST, type: 'thread',
      properties: { courtPosition: 'the_first', tier: 2 },
    });
  }
  return graph;
}

function stateWith(graph: WorldGraph, tick = 0): GameState {
  return {
    tick,
    seed: 42,
    ascendantId: ASC,
    graph,
    ascendantBeats: createInitialAscendantBeatState(),
    unlockedActionIds: [],
    essencePool: {},
    unifiedActions: [],
    tickEvents: [],
    recentEvents: [],
    playerActCount: 0,
  } as unknown as GameState;
}

describe('settleOpeningSpineBeats (THR-1787)', () => {
  beforeEach(() => { enableTracing(); clearTraces(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('settles Beat 0 then the three gifts at tick 0, leaving "A Path Opens" at the cursor', () => {
    const graph = buildGraph(true);
    const state = stateWith(graph);
    const result = settleOpeningSpineBeats(state, WARM_START_SETTLED_SPINE_BEATS, 0);

    expect(result.failedBeatId).toBeNull();
    expect(result.settled).toEqual(['beat.spine.opening', ...WARM_START_SETTLED_SPINE_BEATS]);
    const beats = result.patch.ascendantBeats!;
    expect(beats.spineCursor).toBe(4);
    expect(ASCENDANT_SPINE[beats.spineCursor].beatId).toBe(PATH_OPENS);
    expect(beats.pending).toBeNull();

    // The seat: The First stands at a sublocation, so the seat climbs to its parent.
    expect(graph.getNode(ASC)?.properties.homeSeatLocationId).toBe('loc-haven');
    // The thing left behind: a threaded artifact The First bears.
    const borne = graph.getOutgoingEdges(FIRST, 'possesses').map(e => graph.getNode(e.target));
    const artifact = borne.find(n => n?.type === 'artifact');
    expect(artifact).toBeDefined();
    expect(graph.getOutgoingEdges(ASC, 'thread').some(e => e.target === artifact!.id)).toBe(true);
    // Grants from all three gifts.
    expect(result.patch.unlockedActionIds).toEqual(
      expect.arrayContaining(['bind_thread_location', 'action.imbue', 'divine.persuade']),
    );

    // One BeatRecord and one settled trace per gift, tagged warm_start.
    for (const id of WARM_START_SETTLED_SPINE_BEATS) {
      expect(beats.history.filter(r => r.beatId === id)).toHaveLength(1);
    }
    const settledTraces = getTraces().filter(t => t.category === 'beat.settled_as_played');
    const warm = settledTraces.filter(t => (t as { reason?: string }).reason === 'warm_start');
    expect(warm.map(t => (t as { beatId?: string }).beatId)).toEqual([...WARM_START_SETTLED_SPINE_BEATS]);
  });

  it('writes the "thread already holds" line once, for Beat 0 only', () => {
    const result = settleOpeningSpineBeats(stateWith(buildGraph(true)), WARM_START_SETTLED_SPINE_BEATS, 0);
    const lines = (result.patch.recentEvents ?? []).filter(e => e.id.startsWith('beat_settled_'));
    expect(lines).toHaveLength(1);
    expect(lines[0].id).toContain('beat.spine.opening');
  });

  it('"A Path Opens" is then held only by the authored pacing, never offered as settled', () => {
    const state = stateWith(buildGraph(true));
    const result = settleOpeningSpineBeats(state, WARM_START_SETTLED_SPINE_BEATS, 0);
    const after = { ...state, ...result.patch } as GameState;
    expect(after.ascendantBeats!.history.some(r => r.beatId === PATH_OPENS)).toBe(false);
    // Gift spacing runs from the last settle, so it is not due on the same tick.
    expect(spineGateBlockedBy(after)).not.toBeNull();
  });

  it('skips a gift already behind the cursor and settles the rest', () => {
    const state = stateWith(buildGraph(true));
    const first = settleOpeningSpineBeats(state, ['beat.spine.the_seat'], 0);
    const mid = { ...state, ...first.patch } as GameState;
    const rest = settleOpeningSpineBeats(mid, WARM_START_SETTLED_SPINE_BEATS, 0);
    expect(rest.settled).toEqual(['beat.spine.thing_left_behind', 'beat.spine.the_first_word']);
    expect(rest.patch.ascendantBeats!.history.filter(r => r.beatId === 'beat.spine.the_seat')).toHaveLength(1);
  });

  it('does nothing on an unbonded world (fail-soft: the gifts are offered normally)', () => {
    const graph = buildGraph(false);
    const result = settleOpeningSpineBeats(stateWith(graph), WARM_START_SETTLED_SPINE_BEATS, 0);
    expect(result.settled).toEqual([]);
    expect(result.patch).toEqual({});
    expect(result.failedBeatId).toBe('beat.spine.the_seat');
    expect(graph.getNode(ASC)?.properties.homeSeatLocationId).toBeUndefined();
  });

  it('stops at a beat out of cursor order and reports it', () => {
    const result = settleOpeningSpineBeats(stateWith(buildGraph(true)), ['beat.spine.the_first_word'], 0);
    expect(result.settled).toEqual(['beat.spine.opening']);
    expect(result.failedBeatId).toBe('beat.spine.the_first_word');
    expect(result.patch.ascendantBeats!.spineCursor).toBe(1);
  });

  it('is deterministic', () => {
    const run = () => {
      const r = settleOpeningSpineBeats(stateWith(buildGraph(true)), WARM_START_SETTLED_SPINE_BEATS, 0);
      return JSON.stringify({ beats: r.patch.ascendantBeats, unlocked: r.patch.unlockedActionIds });
    };
    expect(run()).toBe(run());
  });
});
