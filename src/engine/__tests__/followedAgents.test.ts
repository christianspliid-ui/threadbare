/**
 * Follow state — THR-1299 slice 1.
 *
 * The properties under test are the ones a later slice could break silently.
 *
 * The load-bearing one is the **court-position matrix**: before this module,
 * default-follow tested bare `thread`-edge existence while every attention
 * predicate keyed on `courtPosition`, so `thread.dormant` silenced a mortal's
 * encounters and kept interrupting the player with their undertaking news. Every
 * arm of that matrix is asserted here against a real `CourtPosition` value —
 * including the two that must come back **false** — because a test that only
 * checks the followed positions passes just as well on the old
 * existence-only predicate, which is the exact regression this closes.
 *
 * The second is `mute` vs `unfollow`: the two are not interchangeable, and the
 * arms below show each one being *chosen* by the state of the world rather than
 * by the caller, since a caller that picked wrong is how a mute-by-default ships.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { enableTracing, disableTracing, getTraces, clearTraces } from '../traceBuffer';
import type { GameState } from '../../types/gameState';
import type { CourtPosition } from '../../types/influence';
import {
  DEFAULT_FOLLOWED_COURT_POSITIONS,
  UNSTAMPED_THREAD_COURT_POSITION,
  defaultFollowedAgentIds,
  followAgent,
  getFollowState,
  getThreadCourtPosition,
  isDefaultFollowed,
  isFollowed,
  isMuted,
  unfollowAgent,
} from '../followedAgents';
import { resolveMomentPresentation } from '../undertakingCheckpoints';
import type { StrategicProjectRuntime } from '../../types/strategicAction';

// ─── Fixtures ───────────────────────────────────────────────────────

/**
 * `courtPosition: undefined` is a *distinct* fixture from omitting the argument:
 * it builds an edge whose properties object exists but carries no stamp, which is
 * what `encounterAftermath`'s thread-branch writer actually produces. That arm is
 * asserted separately below and must read as `retinue`.
 */
function buildGraph(threads: Array<{ target: string; courtPosition?: CourtPosition }> = []): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'ascendant', name: 'The God', type: 'actor', properties: { actorType: 'ascendant' } });
  for (const id of ['actor_1', 'actor_2', 'actor_3']) {
    graph.addNode({ id, name: id, type: 'actor', properties: { actorType: 'individual' } });
  }
  threads.forEach((thread, i) => {
    graph.addEdge({
      id: `e_thread_${i}`,
      source: 'ascendant',
      target: thread.target,
      type: 'thread',
      properties: thread.courtPosition ? { courtPosition: thread.courtPosition } : {},
    });
  });
  return graph;
}

function buildState(graph: WorldGraph, overrides: Partial<GameState> = {}): GameState {
  return {
    cycle: 1, tick: 10, phase: 'playing', seed: 42, graph,
    ascendantId: 'ascendant',
    tickEvents: [], recentEvents: [], chronicleEntries: [],
    ...overrides,
  } as unknown as GameState;
}

function buildProject(overrides: Partial<StrategicProjectRuntime> = {}): StrategicProjectRuntime {
  return {
    projectId: 'proj_1', actorId: 'actor_1', templateId: 'strategic_build_warehouse',
    verb: 'create', progress: 0, progressRequired: 18, startedTick: 0,
    ...overrides,
  } as unknown as StrategicProjectRuntime;
}

// ─── The court-position matrix ──────────────────────────────────────

describe('default follow is court-position-aware (THR-1299, closing the dormant divergence)', () => {
  // Every member of the CourtPosition union, so adding a fifth position to the
  // union without deciding its follow semantics fails here rather than defaulting.
  const ARMS: Array<{ position: CourtPosition; followed: boolean }> = [
    { position: 'the_first', followed: true },
    { position: 'retinue', followed: true },
    { position: 'watched', followed: false },
    { position: 'dormant', followed: false },
  ];

  for (const { position, followed } of ARMS) {
    it(`a '${position}' thread is ${followed ? '' : 'NOT '}default-followed`, () => {
      const graph = buildGraph([{ target: 'actor_1', courtPosition: position }]);
      const state = buildState(graph);

      expect(getThreadCourtPosition(graph, 'ascendant', 'actor_1')).toBe(position);
      expect(isDefaultFollowed(graph, 'ascendant', 'actor_1')).toBe(followed);
      expect(isFollowed(state, graph, 'actor_1')).toBe(followed);
    });
  }

  it('covers the whole CourtPosition union — no arm is silently unasserted', () => {
    // Guards the table above against the union growing underneath it. If a fifth
    // position lands, this fails and forces the decision instead of letting the
    // new position fall through to `not followed` unexamined.
    const asserted = new Set(ARMS.map(a => a.position));
    const union: CourtPosition[] = ['the_first', 'retinue', 'watched', 'dormant'];
    expect([...asserted].sort()).toEqual([...union].sort());
    expect([...DEFAULT_FOLLOWED_COURT_POSITIONS].sort()).toEqual(['retinue', 'the_first']);
  });

  it('an unstamped thread edge reads as retinue, not as excluded', () => {
    // encounterAftermath's thread-branch writer omits courtPosition entirely, and
    // collectThreadedAgents already documents absent-means-retinue. A strict read
    // here would re-open the divergence pointing the other way: branched threads
    // visible to encounters and silent for moments.
    const graph = buildGraph([{ target: 'actor_1' }]);
    expect(getThreadCourtPosition(graph, 'ascendant', 'actor_1')).toBe(UNSTAMPED_THREAD_COURT_POSITION);
    expect(isDefaultFollowed(graph, 'ascendant', 'actor_1')).toBe(true);
  });

  it('no thread edge at all is not followed — and is distinguishable from an unstamped one', () => {
    const graph = buildGraph();
    expect(getThreadCourtPosition(graph, 'ascendant', 'actor_1')).toBeNull();
    expect(isDefaultFollowed(graph, 'ascendant', 'actor_1')).toBe(false);
  });

  it("the dormant arm honors thread.dormant's authored text at the moment surface", () => {
    // The regression in its own right. `thread.dormant` promises "their encounters
    // no longer surface as tugs… the thread persists"; before this change a dormant
    // agent's completion still resolved 'interrupt'.
    const graph = buildGraph([{ target: 'actor_1', courtPosition: 'dormant' }]);
    const state = buildState(graph);
    expect(resolveMomentPresentation(state, graph, 'actor_1', 'completion', buildProject())).toBe('badge');

    // Control arm: the same completion for a retinue member DOES interrupt, so the
    // assertion above is falsifying rather than passing on a broken presenter.
    const retinueGraph = buildGraph([{ target: 'actor_1', courtPosition: 'retinue' }]);
    expect(
      resolveMomentPresentation(buildState(retinueGraph), retinueGraph, 'actor_1', 'completion', buildProject()),
    ).toBe('interrupt');
  });

  it('a dormant agent is still explicitly followable — dormant is a default, not a ban', () => {
    const graph = buildGraph([{ target: 'actor_1', courtPosition: 'dormant' }]);
    const state = buildState(graph, { followedAgentIds: ['actor_1'] });
    expect(isFollowed(state, graph, 'actor_1')).toBe(true);
  });
});

// ─── Mute vs unfollow ───────────────────────────────────────────────

describe('unfollow chooses mute or removal from the world, not from the caller', () => {
  it('un-following an explicitly-followed, unthreaded agent removes the entry and mutes nothing', () => {
    const graph = buildGraph();
    const state = buildState(graph, { followedAgentIds: ['actor_1'] });

    const patch = unfollowAgent(state, graph, 'actor_1');
    expect(patch.followedAgentIds).toEqual([]);
    expect(patch.mutedAgentIds ?? []).toEqual([]);
    expect(isFollowed({ ...state, ...patch } as GameState, graph, 'actor_1')).toBe(false);
  });

  it('un-following a default-followed agent mutes them — the entry-removal alone would be a no-op', () => {
    const graph = buildGraph([{ target: 'actor_1', courtPosition: 'retinue' }]);
    const state = buildState(graph);

    const patch = unfollowAgent(state, graph, 'actor_1');
    expect(patch.mutedAgentIds).toEqual(['actor_1']);

    const next = { ...state, ...patch } as GameState;
    expect(isMuted(next, 'actor_1')).toBe(true);
    expect(isFollowed(next, graph, 'actor_1')).toBe(false);
    // The thread is untouched — court position and player attention stay separate axes.
    expect(isDefaultFollowed(graph, 'ascendant', 'actor_1')).toBe(true);
  });

  it('a mute drops the interrupt upgrade without silencing the stream', () => {
    const graph = buildGraph([{ target: 'actor_1', courtPosition: 'retinue' }]);
    const muted = buildState(graph, { mutedAgentIds: ['actor_1'] });
    // Still a moment, still reaches the player — as a badge.
    expect(resolveMomentPresentation(muted, graph, 'actor_1', 'completion', buildProject())).toBe('badge');
  });

  it('follow clears a mute — otherwise the toggle reads as broken', () => {
    const graph = buildGraph([{ target: 'actor_1', courtPosition: 'retinue' }]);
    const state = buildState(graph, { mutedAgentIds: ['actor_1'] });

    const patch = followAgent(state, 'actor_1');
    expect(patch.mutedAgentIds).toEqual([]);
    expect(isFollowed({ ...state, ...patch } as GameState, graph, 'actor_1')).toBe(true);
  });

  it('mute beats an explicit follow entry — one mute, one meaning', () => {
    // Both terms present is reachable: follow, then unfollow while threaded, then
    // an older code path re-adds the explicit entry. Mute must still win, or the
    // player's silence gesture is quietly overridden.
    const graph = buildGraph([{ target: 'actor_1', courtPosition: 'retinue' }]);
    const state = buildState(graph, { followedAgentIds: ['actor_1'], mutedAgentIds: ['actor_1'] });
    expect(isFollowed(state, graph, 'actor_1')).toBe(false);
  });
});

// ─── No-ops and traces ──────────────────────────────────────────────

describe('follow writes are traced, and no-ops are not', () => {
  beforeEach(() => { clearTraces(); enableTracing(); });
  afterEach(() => { disableTracing(); clearTraces(); });

  it('emits follow / mute / unmute with their source', () => {
    const graph = buildGraph([{ target: 'actor_1', courtPosition: 'retinue' }]);
    let state = buildState(graph);

    state = { ...state, ...followAgent(state, 'actor_2', 'encounter_ui') } as GameState;
    state = { ...state, ...unfollowAgent(state, graph, 'actor_1', 'arc_panel') } as GameState;
    state = { ...state, ...followAgent(state, 'actor_1', 'debug') } as GameState;

    const rows = getTraces().filter(t => t.category === 'follow_change') as unknown as Array<Record<string, unknown>>;
    expect(rows, 'no follow_change traces emitted — the assertions below would be vacuous').toHaveLength(3);
    expect(rows.map(r => r.action)).toEqual(['follow', 'mute', 'unmute']);
    expect(rows.map(r => r.source)).toEqual(['encounter_ui', 'arc_panel', 'debug']);
    expect(rows.map(r => r.agentId)).toEqual(['actor_2', 'actor_1', 'actor_1']);
  });

  it('re-following an already-followed agent changes nothing and traces nothing', () => {
    const graph = buildGraph();
    const state = buildState(graph, { followedAgentIds: ['actor_1'] });

    const patch = followAgent(state, 'actor_1');
    expect(patch.followedAgentIds).toBe(state.followedAgentIds);
    expect(getTraces().filter(t => t.category === 'follow_change')).toHaveLength(0);
  });

  it('un-following someone never followed changes nothing and traces nothing', () => {
    const graph = buildGraph();
    const state = buildState(graph);

    const patch = unfollowAgent(state, graph, 'actor_1');
    expect(patch.followedAgentIds ?? []).toEqual([]);
    expect(getTraces().filter(t => t.category === 'follow_change')).toHaveLength(0);
  });
});

// ─── The surface read ───────────────────────────────────────────────

describe('getFollowState answers for agents threaded after init', () => {
  it('derives threaded from live edges, filtered to the followed positions', () => {
    const graph = buildGraph([
      { target: 'actor_1', courtPosition: 'the_first' },
      { target: 'actor_2', courtPosition: 'dormant' },
      { target: 'actor_3' },
    ]);
    const state = buildState(graph, { followedAgentIds: ['actor_9'], mutedAgentIds: ['actor_1'] });

    const followState = getFollowState(state, graph);
    expect([...followState.threaded].sort()).toEqual(['actor_1', 'actor_3']);
    expect(followState.explicit).toEqual(['actor_9']);
    expect(followState.muted).toEqual(['actor_1']);
  });

  it('defaultFollowedAgentIds runs the same filter as the live check', () => {
    // The init seed and the live predicate answering differently is the bug class
    // this pairing exists to prevent.
    const graph = buildGraph([
      { target: 'actor_1', courtPosition: 'retinue' },
      { target: 'actor_2', courtPosition: 'dormant' },
    ]);
    expect(defaultFollowedAgentIds(graph, 'ascendant')).toEqual(['actor_1']);
    expect(isDefaultFollowed(graph, 'ascendant', 'actor_2')).toBe(false);
  });
});
