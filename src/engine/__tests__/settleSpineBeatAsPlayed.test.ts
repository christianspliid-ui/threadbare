/**
 * THR-1786 — a bonded First is never asked to "Reach Down" again.
 *
 * Beat 0 narrates the god threading The First. When The First is already bonded
 * on the Director's first run (`?seeded`, `?spawn=`, `?testavatar`, warm start),
 * the Director settles Beat 0 as already played — same grants, record and cursor
 * advance a clicked beat writes — instead of offering it. The unbonded path keeps
 * the THR-1716 arrival offer unchanged.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  createInitialAscendantBeatState,
  offerArrivalSpineBeat,
  phaseAscendantBeatDirector,
  settleSpineBeatAsPlayed,
} from '../ascendantBeat';
import { ASCENDANT_SPINE } from '../../data/ascendant-beat-content';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import type { GameState } from '../../types/gameState';
import type { AscendantBeatState } from '../../types/ascendantBeat';

const OPENING = 'beat.spine.opening';

function worldGraph(bonded: boolean, firstName = 'Kael'): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'asc-1', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'first-1', type: 'actor', name: firstName, properties: { actorType: 'individual' } });
  if (bonded) {
    graph.addEdge({
      id: 'thread-first', source: 'asc-1', target: 'first-1', type: 'thread',
      properties: { courtPosition: 'the_first', tier: 1 },
    });
  }
  return graph;
}

function stateWith(graph: WorldGraph, beats: AscendantBeatState, tick = 1): GameState {
  return {
    tick,
    seed: 42,
    ascendantId: 'asc-1',
    graph,
    ascendantBeats: beats,
    unlockedActionIds: [],
    essencePool: {},
    unifiedActions: [],
    tickEvents: [],
    recentEvents: [],
  } as unknown as GameState;
}

/** Run the Director once and merge its partial, as the orchestrator does. */
function directorTick(state: GameState): GameState {
  return { ...state, ...phaseAscendantBeatDirector(state, () => 0.5) };
}

describe('Beat 0 settles as already played for a bonded First (THR-1786)', () => {
  beforeEach(() => {
    enableTracing();
    clearTraces();
  });
  afterEach(() => {
    clearTraces();
    disableTracing();
  });

  it('is the beat the helper targets', () => {
    expect(ASCENDANT_SPINE[0].beatId).toBe(OPENING);
  });

  it('settles Beat 0 on the first Director tick of a pre-bonded world', () => {
    const after = directorTick(stateWith(worldGraph(true), createInitialAscendantBeatState()));
    const beats = after.ascendantBeats!;
    expect(beats.spineCursor).toBe(1);
    expect(beats.pending?.beatId).not.toBe(OPENING);
    expect(beats.pending).toBeNull();
    expect(after.unlockedActionIds).toEqual(expect.arrayContaining(['bind_thread_agent', 'observe_agent']));
    const records = beats.history.filter(r => r.beatId === OPENING);
    expect(records).toHaveLength(1);
    expect(records[0].resolvedTurn).toBe(1);
    // Spine pacing counts the settled beat as resolved at its tick (THR-1647 unchanged).
    expect(beats.lastSpineResolvedTick).toBe(1);

    const settled = getTraces().filter(t => t.category === 'beat.settled_as_played');
    expect(settled).toHaveLength(1);
    expect(settled[0]).toMatchObject({ beatId: OPENING, reason: 'first_already_bonded' });
  });

  it('writes one plain chronicle line naming The First', () => {
    const after = directorTick(stateWith(worldGraph(true, 'Mira'), createInitialAscendantBeatState()));
    const lines = after.recentEvents.filter(e => e.id.startsWith('beat_settled_'));
    expect(lines).toHaveLength(1);
    expect(lines[0].message).toBe('Your thread to Mira already holds. You can bind and watch other mortals now.');
    expect(lines[0].message).not.toMatch(/\d/);
    expect(after.tickEvents.filter(e => e.id.startsWith('beat_settled_'))).toHaveLength(1);
  });

  it('does not settle twice — the next tick offers nothing new for Beat 0', () => {
    const once = directorTick(stateWith(worldGraph(true), createInitialAscendantBeatState()));
    const twice = directorTick({ ...once, tick: 2 });
    expect(twice.ascendantBeats!.history.filter(r => r.beatId === OPENING)).toHaveLength(1);
    expect(getTraces().filter(t => t.category === 'beat.settled_as_played')).toHaveLength(1);
  });

  it('an unbonded world still gets the THR-1716 arrival offer of Beat 0, unchanged', () => {
    const fresh = stateWith(worldGraph(false), createInitialAscendantBeatState(), 0);
    const arrival = offerArrivalSpineBeat(fresh);
    expect(arrival.ascendantBeats?.pending?.beatId).toBe(OPENING);
    expect(arrival.ascendantBeats?.spineCursor).toBe(1);
    expect(arrival.ascendantBeats?.history).toEqual([]);
    // And the Director on an unbonded world offers (never settles) Beat 0.
    const viaDirector = phaseAscendantBeatDirector(fresh, () => 0.5);
    expect(viaDirector.ascendantBeats).toEqual(arrival.ascendantBeats);
    expect(getTraces().some(t => t.category === 'beat.settled_as_played')).toBe(false);
  });

  it('is deterministic — the same world run twice yields an identical post-tick-1 state', () => {
    const run = () => {
      const after = directorTick(stateWith(worldGraph(true), createInitialAscendantBeatState()));
      return {
        ascendantBeats: after.ascendantBeats,
        unlockedActionIds: after.unlockedActionIds,
        tickEvents: after.tickEvents,
        recentEvents: after.recentEvents,
      };
    };
    expect(run()).toEqual(run());
  });

  it('fails soft: a beat already pending or an unknown beat id settles nothing', () => {
    const beats = createInitialAscendantBeatState();
    const pending = { ...beats, pending: { beatId: 'x', kind: 'spine' as const, offeredTurn: 0, boundNodeIds: [], trigger: { kind: 'cadence' as const } } };
    expect(settleSpineBeatAsPlayed(stateWith(worldGraph(true), pending), OPENING, 1)).toEqual({});
    expect(settleSpineBeatAsPlayed(stateWith(worldGraph(true), beats), 'beat.nope', 1)).toEqual({});
  });

  it('falls back to a stand-in name for a nameless First', () => {
    const after = directorTick(stateWith(worldGraph(true, ''), createInitialAscendantBeatState()));
    const line = after.recentEvents.find(e => e.id.startsWith('beat_settled_'));
    expect(line?.message).toBe('Your thread to The First already holds. You can bind and watch other mortals now.');
  });
});
