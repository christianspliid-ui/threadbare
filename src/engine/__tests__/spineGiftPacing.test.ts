/**
 * THR-1647 (plan `Docs/plans/2026-09-27-thr-1605-the-opening.md` S4) — the
 * opening gifts wait for the player.
 *
 * Spine gifts 1–4 are offered only when The First is bonded, `BEAT_MIN_GAP` has
 * run since the last gift resolved, and the player has acted since then — or
 * `SPINE_IDLE_FALLBACK_TICKS` have run, so an idle player is never starved.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  phaseAscendantBeatDirector,
  createInitialAscendantBeatState,
  resolvePendingBeat,
  spineGateBlockedBy,
} from '../ascendantBeat';
import {
  ASCENDANT_SPINE,
  BEAT_MIN_GAP,
  SPINE_IDLE_FALLBACK_TICKS,
  SPINE_PLAYER_ACTS_BETWEEN_GIFTS,
} from '../../data/ascendant-beat-content';
import { recordPlayerAct } from '../playerActs';
import { commitPlayerCast } from '../playerCastDispatch';
import { followAgent } from '../followedAgents';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import type { GameState } from '../../types/gameState';
import type { AscendantBeatState } from '../../types/ascendantBeat';
import type { PreparedPlayerCast } from '../playerCastDispatch';

const GIFT_1 = ASCENDANT_SPINE[1].beatId;

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

function stateAt(
  graph: WorldGraph,
  tick: number,
  beats: AscendantBeatState,
  playerActCount?: number,
): GameState {
  return {
    tick,
    seed: 42,
    ascendantId: 'asc-1',
    graph,
    ascendantBeats: beats,
    unlockedActionIds: [],
    essencePool: {},
    unifiedActions: [],
    recentEvents: [],
    ...(playerActCount === undefined ? {} : { playerActCount }),
  } as unknown as GameState;
}

/** Offer and resolve Beat 0 ("Reach Down") at `tick`, returning the beats after it. */
function resolveOpening(graph: WorldGraph, tick: number, acts = 0): AscendantBeatState {
  const offered = phaseAscendantBeatDirector(stateAt(graph, tick, createInitialAscendantBeatState(), acts), () => 0.5);
  expect(offered.ascendantBeats?.pending?.beatId).toBe(ASCENDANT_SPINE[0].beatId);
  const res = resolvePendingBeat(stateAt(graph, tick, offered.ascendantBeats!, acts));
  expect(res.resolved).toBe(true);
  return res.state.ascendantBeats!;
}

/** Tick the director from `from` until it offers something; the tick it offered at, or null. */
function firstOfferTick(
  graph: WorldGraph,
  beats: AscendantBeatState,
  from: number,
  to: number,
  acts: number,
): { tick: number | null; beats: AscendantBeatState } {
  let b = beats;
  for (let t = from; t <= to; t++) {
    const next = phaseAscendantBeatDirector(stateAt(graph, t, b, acts), () => 0.5).ascendantBeats;
    if (next) b = next;
    if (b.pending) return { tick: t, beats: b };
  }
  return { tick: null, beats: b };
}

describe('THR-1647 S4 — the opening gifts wait for the player', () => {
  beforeEach(() => {
    clearTraces();
    enableTracing();
  });
  afterEach(() => {
    clearTraces();
    disableTracing();
  });

  it('constants are the plan values', () => {
    expect(SPINE_PLAYER_ACTS_BETWEEN_GIFTS).toBe(1);
    expect(SPINE_IDLE_FALLBACK_TICKS).toBe(36);
    expect(BEAT_MIN_GAP).toBe(4);
  });

  it('with The First bonded and no act, gift 1 arrives only after the idle fallback', () => {
    const graph = worldGraph(true);
    const afterOpening = resolveOpening(graph, 0);
    expect(afterOpening.lastSpineResolvedTick).toBe(0);
    expect(afterOpening.playerActCountAtLastSpine).toBe(0);

    const { tick, beats } = firstOfferTick(graph, afterOpening, 1, SPINE_IDLE_FALLBACK_TICKS + 5, 0);
    expect(tick).toBe(SPINE_IDLE_FALLBACK_TICKS);
    expect(beats.pending?.beatId).toBe(GIFT_1);
  });

  it('after one cast, gift 1 arrives at the next gap', () => {
    const graph = worldGraph(true);
    const afterOpening = resolveOpening(graph, 0);

    // The player casts once, through the real commit path.
    const cast = { essenceCost: 0, sphere: null, action: { actionId: 'a1' } } as unknown as PreparedPlayerCast;
    const casted = commitPlayerCast(stateAt(graph, 1, afterOpening), { cast });
    expect(casted.playerActCount).toBe(1);

    const { tick, beats } = firstOfferTick(graph, afterOpening, 1, SPINE_IDLE_FALLBACK_TICKS, casted.playerActCount!);
    // Gift 1's own minTurn is 2; the gap from the opening's resolve at 0 is BEAT_MIN_GAP.
    expect(tick).toBe(Math.max(BEAT_MIN_GAP, ASCENDANT_SPINE[1].trigger.minTurn ?? 0));
    expect(beats.pending?.beatId).toBe(GIFT_1);
  });

  it('spineGateBlockedBy reads awaiting_player_act between gifts, then clears on an act', () => {
    const graph = worldGraph(true);
    const afterOpening = resolveOpening(graph, 0);
    expect(spineGateBlockedBy(stateAt(graph, 1, afterOpening, 0))).toBe('min_turn');
    expect(spineGateBlockedBy(stateAt(graph, 3, afterOpening, 0))).toBe('min_gap');
    expect(spineGateBlockedBy(stateAt(graph, BEAT_MIN_GAP, afterOpening, 0))).toBe('awaiting_player_act');
    expect(spineGateBlockedBy(stateAt(graph, BEAT_MIN_GAP, afterOpening, 1))).toBeNull();
    expect(spineGateBlockedBy(stateAt(graph, SPINE_IDLE_FALLBACK_TICKS, afterOpening, 0))).toBeNull();
  });

  it('acts taken before a gift resolved do not pay for the next one', () => {
    const graph = worldGraph(true);
    // Two acts happened before Reach Down resolved; the count is stamped at the resolve.
    const afterOpening = resolveOpening(graph, 0, 2);
    expect(afterOpening.playerActCountAtLastSpine).toBe(2);
    expect(spineGateBlockedBy(stateAt(graph, BEAT_MIN_GAP, afterOpening, 2))).toBe('awaiting_player_act');
    expect(spineGateBlockedBy(stateAt(graph, BEAT_MIN_GAP, afterOpening, 3))).toBeNull();
  });

  it('gifts 1–4 wait for the bond; Beat 0 does not', () => {
    const unbonded = worldGraph(false);
    const afterOpening = resolveOpening(unbonded, 0); // Beat 0 offers with no First
    expect(spineGateBlockedBy(stateAt(unbonded, 100, afterOpening, 5))).toBe('first_not_bonded');
    const { tick } = firstOfferTick(unbonded, afterOpening, 1, 100, 5);
    expect(tick).toBeNull();
  });

  it('beat.spine_deferred traces once per (beat, reason), not every tick', () => {
    const graph = worldGraph(true);
    const afterOpening = resolveOpening(graph, 0);
    clearTraces();
    firstOfferTick(graph, afterOpening, 1, 20, 0);
    const deferred = getTraces().filter(t => t.category === 'beat.spine_deferred') as unknown as Array<{ beatId: string; reason: string }>;
    expect(deferred.map(d => d.reason)).toEqual(['min_gap', 'awaiting_player_act']);
    expect(deferred.every(d => d.beatId === GIFT_1)).toBe(true);
  });

  it('a world with no playerActCount (old save) still gets its gifts through the idle fallback', () => {
    const graph = worldGraph(true);
    const afterOpening = resolveOpening(graph, 0);
    expect(spineGateBlockedBy(stateAt(graph, SPINE_IDLE_FALLBACK_TICKS, afterOpening))).toBeNull();
    // Beats state that predates the stamp: the last spine record in history spaces it.
    const legacy: AscendantBeatState = { ...afterOpening, lastSpineResolvedTick: undefined, playerActCountAtLastSpine: undefined };
    expect(spineGateBlockedBy(stateAt(graph, BEAT_MIN_GAP, legacy))).toBe('awaiting_player_act');
    expect(spineGateBlockedBy(stateAt(graph, SPINE_IDLE_FALLBACK_TICKS, legacy))).toBeNull();
  });

  it('player acts: a cast, a player Follow; not an init or debug follow', () => {
    expect(recordPlayerAct({}).playerActCount).toBe(1);
    expect(recordPlayerAct({ playerActCount: 4 }).playerActCount).toBe(5);
    const s = stateAt(worldGraph(true), 5, createInitialAscendantBeatState(), 2);
    expect(followAgent(s, 'first-1', 'arc_panel').playerActCount).toBe(3);
    expect(followAgent(s, 'first-1', 'encounter_ui').playerActCount).toBe(3);
    expect(followAgent(s, 'first-1', 'debug').playerActCount).toBeUndefined();
    expect(followAgent(s, 'first-1', 'init').playerActCount).toBeUndefined();
  });
});
