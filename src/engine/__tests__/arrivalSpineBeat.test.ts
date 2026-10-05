/**
 * THR-1716 (plan `Docs/plans/2026-10-04-thr-1716-arrival-first-beat.md` E1) — the
 * opening beat is offered at arrival, before any tick.
 *
 * `offerArrivalSpineBeat` offers Beat 0 ("Reach Down") at tick 0 for an unbonded
 * world with fresh beat state, and is a no-op everywhere else: a bonded First (the
 * pre-bonded dev routes), missing beat state, a beat already pending, a cursor past 0.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  offerArrivalSpineBeat,
  createInitialAscendantBeatState,
  phaseAscendantBeatDirector,
} from '../ascendantBeat';
import { ASCENDANT_SPINE } from '../../data/ascendant-beat-content';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import type { GameState } from '../../types/gameState';
import type { AscendantBeatState } from '../../types/ascendantBeat';

const OPENING = ASCENDANT_SPINE[0].beatId;

function worldGraph(bonded: boolean): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'asc-1', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'first-1', type: 'actor', name: 'Kael', properties: { actorType: 'individual' } });
  if (bonded) {
    graph.addEdge({
      id: 'thread-first', source: 'asc-1', target: 'first-1', type: 'thread',
      properties: { courtPosition: 'the_first', tier: 1 },
    });
  }
  return graph;
}

function stateWith(graph: WorldGraph, beats: AscendantBeatState | undefined, tick = 0): GameState {
  return {
    tick,
    seed: 42,
    ascendantId: 'asc-1',
    graph,
    ...(beats ? { ascendantBeats: beats } : {}),
    unlockedActionIds: [],
    essencePool: {},
    unifiedActions: [],
    recentEvents: [],
  } as unknown as GameState;
}

describe('offerArrivalSpineBeat (THR-1716 E1)', () => {
  beforeEach(() => {
    enableTracing();
    clearTraces();
  });
  afterEach(() => {
    clearTraces();
    disableTracing();
  });

  it('offers the opening beat at tick 0 for an unbonded world with fresh beat state', () => {
    const out = offerArrivalSpineBeat(stateWith(worldGraph(false), createInitialAscendantBeatState()));
    expect(out.ascendantBeats?.pending?.beatId).toBe(OPENING);
    expect(out.ascendantBeats?.pending?.offeredTurn).toBe(0);
    // The cursor advances exactly as a natural Director offer would.
    expect(out.ascendantBeats?.spineCursor).toBe(1);
    const arrival = getTraces().filter(t => t.category === 'beat.arrival_offer');
    expect(arrival).toHaveLength(1);
  });

  it('matches what the Director would have offered on the first tick', () => {
    const graph = worldGraph(false);
    const viaArrival = offerArrivalSpineBeat(stateWith(graph, createInitialAscendantBeatState()));
    const viaDirector = phaseAscendantBeatDirector(stateWith(graph, createInitialAscendantBeatState()), () => 0.5);
    expect(viaArrival.ascendantBeats).toEqual(viaDirector.ascendantBeats);
  });

  it('is a no-op when The First is already bonded (pre-bonded dev routes)', () => {
    expect(offerArrivalSpineBeat(stateWith(worldGraph(true), createInitialAscendantBeatState()))).toEqual({});
    expect(getTraces().some(t => t.category === 'beat.arrival_offer')).toBe(false);
  });

  it('is a no-op when beat state is missing (old save, fixture)', () => {
    expect(offerArrivalSpineBeat(stateWith(worldGraph(false), undefined))).toEqual({});
  });

  it('is a no-op when a beat is already pending', () => {
    const offered = offerArrivalSpineBeat(stateWith(worldGraph(false), createInitialAscendantBeatState()));
    const pendingBeats = offered.ascendantBeats!;
    const again = { ...pendingBeats, spineCursor: 0 };
    expect(offerArrivalSpineBeat(stateWith(worldGraph(false), again))).toEqual({});
  });

  it('is a no-op when the spine cursor is past 0', () => {
    const beats = { ...createInitialAscendantBeatState(), spineCursor: 1 };
    expect(offerArrivalSpineBeat(stateWith(worldGraph(false), beats))).toEqual({});
  });

  it('takes no RNG — its signature has a single state parameter', () => {
    expect(offerArrivalSpineBeat.length).toBe(1);
  });

  it('fails soft: a graph that throws on read still returns a value, never throws', () => {
    const graph = worldGraph(false);
    const broken = stateWith(graph, createInitialAscendantBeatState());
    (broken as unknown as { graph: unknown }).graph = {
      getOutgoingEdges: () => { throw new Error('boom'); },
    };
    expect(() => offerArrivalSpineBeat(broken)).not.toThrow();
  });
});
