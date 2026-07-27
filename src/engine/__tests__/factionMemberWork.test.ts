/**
 * Tests for THR-815 — off-screen guild work for ambient faction members.
 *
 * The defect this path closes was not a wrong number; it was a population that no code
 * path could reach. So the tests that matter here are the ones that pin *reachability*:
 *
 *   - ambient members gain reputation at all (the thing measured at exactly zero
 *     across a full live run in THR-810 and again, after two mechanical fixes, in THR-814)
 *   - spotlight members do **not** also gain here, so the two paths partition the
 *     membership set instead of double-paying it
 *   - the selection window rotates, so no member is unreachable by construction —
 *     the specific failure shape THR-814 found at the encounter cap stage, where
 *     per-agent entries sat at the tail of a list the fill loop never walked to
 *
 * Fixtures use the real `adventuring_guild` definition and real `ag.quest.*` templates
 * rather than mocks: the bug class in this area is authored data drifting from the code
 * that reads it (THR-814's `merchant_consortium` namespace), which a mock cannot catch.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  resolveFactionMemberWork,
  isOffLoopMember,
  selectWorkWindow,
  successProbabilityFor,
  workWindowSize,
} from '../factionMemberWork';
import {
  FACTION_MEMBER_WORK_INTERVAL,
  FACTION_MEMBER_WORK_MAX_PER_FACTION,
  FACTION_MEMBER_WORK_MIN_PER_FACTION,
  FACTION_MEMBER_WORK_MIN_SUCCESS,
  FACTION_MEMBER_WORK_TIER_PENALTY,
} from '../../data/faction-member-work-constants';
import { fillMemberWorkProse, pickMemberWorkProse } from '../../data/faction-member-work-content';
import type { GameState } from '../../types/gameState';
import type { MemberOfEdgeProperties } from '../../types/disposition';

// ─── Fixtures ───────────────────────────────────────────────────────────────

const GUILD_DEF_ID = 'adventuring_guild';
const FACTION_ID = 'faction_ag';

function makeState(graph: WorldGraph, tick: number): GameState {
  return {
    tick,
    graph,
    tickEvents: [],
    seed: 42,
    encounterProgress: [],
    unifiedActions: [],
    pendingEncounterSeeds: [],
    ascendantId: 'ascendant_1',
    recentEvents: [],
  } as unknown as GameState;
}

function addFaction(graph: WorldGraph): void {
  graph.addNode({
    id: FACTION_ID,
    type: 'actor',
    name: 'The Adventurers Guild',
    properties: { actorType: 'faction', factionDefId: GUILD_DEF_ID },
  });
}

/** Add a member. `tier` of `'spotlight'` puts them on the attended path instead. */
function addMember(
  graph: WorldGraph,
  id: string,
  tier: 'ambient' | 'notable' | 'spotlight',
  reputation = 0.2,
): void {
  graph.addNode({
    id,
    type: 'actor',
    name: `Member ${id}`,
    properties: { actorType: 'individual', spotlightTier: tier },
  });
  graph.addEdge({
    id: `e_member_${id}`,
    source: id,
    target: FACTION_ID,
    type: 'member_of',
    properties: {
      factionDefId: GUILD_DEF_ID,
      reputation,
      joinedTick: 0,
      role: 'journeyman',
      rank: 0,
    } as Partial<MemberOfEdgeProperties>,
  });
}

function reputationOf(graph: WorldGraph, agentId: string): number {
  const edge = graph.getOutgoingEdges(agentId, 'member_of')[0];
  return ((edge?.properties as Partial<MemberOfEdgeProperties>)?.reputation) ?? 0;
}

/** A tick that is an evaluation pass for this path. */
const PASS_TICK = FACTION_MEMBER_WORK_INTERVAL * 4;

// ─── isOffLoopMember ────────────────────────────────────────────────────────

describe('isOffLoopMember — which members need the faction-side path', () => {
  function node(props: Record<string, unknown>) {
    return { id: 'n', type: 'actor' as const, name: 'n', properties: props };
  }

  it('accepts ambient and notable individuals', () => {
    expect(isOffLoopMember(node({ actorType: 'individual', spotlightTier: 'ambient' }))).toBe(true);
    expect(isOffLoopMember(node({ actorType: 'individual', spotlightTier: 'notable' }))).toBe(true);
  });

  it('rejects spotlight individuals — they already reach phaseAgentDecision', () => {
    expect(isOffLoopMember(node({ actorType: 'individual', spotlightTier: 'spotlight' }))).toBe(false);
  });

  it('reads a missing tier as spotlight, matching phaseAgentDecision and agentValidation', () => {
    // Legacy nodes carry no spotlightTier. If this default ever diverged from the two
    // shipped readers, a member would fall through both paths or be paid by both.
    expect(isOffLoopMember(node({ actorType: 'individual' }))).toBe(false);
  });

  it('rejects armies and groups', () => {
    expect(isOffLoopMember(node({ actorType: 'individual', spotlightTier: 'ambient', armyState: {} }))).toBe(false);
    expect(isOffLoopMember(node({ actorType: 'group', spotlightTier: 'ambient' }))).toBe(false);
  });

  it('rejects missing nodes rather than throwing (fail-soft)', () => {
    expect(isOffLoopMember(null)).toBe(false);
    expect(isOffLoopMember(undefined)).toBe(false);
  });
});

// ─── selectWorkWindow ───────────────────────────────────────────────────────

describe('selectWorkWindow — no member unreachable by construction', () => {
  it('reaches every member across successive passes, including the tail', () => {
    // The THR-814 regression in miniature: a window that always filled from the head
    // would leave the tail of this list permanently unworked.
    const members = Array.from({ length: 11 }, (_, i) => `m${i}`);
    const seen = new Set<string>();
    for (let pass = 0; pass < 11; pass++) {
      const tick = pass * FACTION_MEMBER_WORK_INTERVAL;
      for (const m of selectWorkWindow(members, tick, 3)) seen.add(m);
    }
    expect(seen.size).toBe(members.length);
    expect(seen.has('m10')).toBe(true);
  });

  it('advances the window between consecutive passes', () => {
    const members = Array.from({ length: 9 }, (_, i) => `m${i}`);
    const first = selectWorkWindow(members, 0, 3);
    const second = selectWorkWindow(members, FACTION_MEMBER_WORK_INTERVAL, 3);
    expect(second).not.toEqual(first);
  });

  it('returns each member at most once per pass when the pool is smaller than the window', () => {
    const members = ['a', 'b'];
    const window = selectWorkWindow(members, 0, 5);
    expect(window).toHaveLength(2);
    expect(new Set(window).size).toBe(2);
  });

  it('is empty for an empty pool or a non-positive size', () => {
    expect(selectWorkWindow([], 0, 3)).toEqual([]);
    expect(selectWorkWindow(['a'], 0, 0)).toEqual([]);
  });
});

// ─── workWindowSize ─────────────────────────────────────────────────────────

describe('workWindowSize — cadence must not depend on guild size', () => {
  it('stays within the floor and the NFP #7 ceiling at every size', () => {
    for (const n of [1, 2, 3, 10, 45, 200, 5000]) {
      const w = workWindowSize(n);
      expect(w).toBeGreaterThanOrEqual(Math.min(FACTION_MEMBER_WORK_MIN_PER_FACTION, n));
      expect(w).toBeLessThanOrEqual(FACTION_MEMBER_WORK_MAX_PER_FACTION);
      expect(w).toBeLessThanOrEqual(n);
    }
  });

  it('holds per-member cadence roughly level between a small and a large guild', () => {
    // The regression this pins: with a flat cap of 3, the 45-member Merchant Consortium
    // gave each member a job every ~15 passes against ~1 for a 3-member guild, and its
    // apex tier was unreachable purely because the guild was large.
    const smallCadence = 3 / workWindowSize(3);
    const largeCadence = 45 / workWindowSize(45);
    expect(largeCadence / smallCadence).toBeLessThan(6);
  });

  it('is zero for an empty membership', () => {
    expect(workWindowSize(0)).toBe(0);
  });
});

// ─── successProbabilityFor ──────────────────────────────────────────────────

describe('successProbabilityFor', () => {
  it('falls monotonically as the authored tier rises', () => {
    const standard = successProbabilityFor('standard');
    const senior = successProbabilityFor('senior');
    const elite = successProbabilityFor('elite');
    expect(standard).toBeGreaterThan(senior);
    expect(senior).toBeGreaterThan(elite);
  });

  it('never drops below the floor, so no tier is unwinnable by construction', () => {
    for (const tier of Object.keys(FACTION_MEMBER_WORK_TIER_PENALTY) as Array<keyof typeof FACTION_MEMBER_WORK_TIER_PENALTY>) {
      expect(successProbabilityFor(tier)).toBeGreaterThanOrEqual(FACTION_MEMBER_WORK_MIN_SUCCESS);
    }
  });
});

// ─── Resolution pass ────────────────────────────────────────────────────────

describe('resolveFactionMemberWork — the gap THR-810/814 measured at zero', () => {
  it('pays reputation to ambient members, who previously could gain none', () => {
    const graph = new WorldGraph();
    addFaction(graph);
    const ids = ['m0', 'm1', 'm2', 'm3', 'm4'];
    for (const id of ids) addMember(graph, id, 'ambient');
    const before = ids.map(id => reputationOf(graph, id));

    // Several passes, so the rotating window covers the whole roster and the 55%
    // success rate is very unlikely to miss every draw.
    for (let pass = 0; pass < 6; pass++) {
      resolveFactionMemberWork(makeState(graph, pass * FACTION_MEMBER_WORK_INTERVAL));
    }

    const after = ids.map(id => reputationOf(graph, id));
    const totalGain = after.reduce((s, v, i) => s + (v - before[i]), 0);
    expect(totalGain).toBeGreaterThan(0);
  });

  it('leaves spotlight members alone — the attended path already pays them', () => {
    const graph = new WorldGraph();
    addFaction(graph);
    addMember(graph, 'spot', 'spotlight');
    const before = reputationOf(graph, 'spot');

    for (let pass = 0; pass < 8; pass++) {
      resolveFactionMemberWork(makeState(graph, pass * FACTION_MEMBER_WORK_INTERVAL));
    }

    expect(reputationOf(graph, 'spot')).toBe(before);
  });

  it('only runs on its own interval', () => {
    const graph = new WorldGraph();
    addFaction(graph);
    addMember(graph, 'm0', 'ambient');
    const before = reputationOf(graph, 'm0');

    // A tick that is deliberately not a multiple of the interval.
    resolveFactionMemberWork(makeState(graph, FACTION_MEMBER_WORK_INTERVAL + 1));
    expect(reputationOf(graph, 'm0')).toBe(before);
  });

  it('is deterministic for the same seed, tick and graph (NFP #3)', () => {
    const build = () => {
      const g = new WorldGraph();
      addFaction(g);
      for (const id of ['m0', 'm1', 'm2', 'm3']) addMember(g, id, 'ambient');
      return g;
    };
    const a = build();
    const b = build();
    resolveFactionMemberWork(makeState(a, PASS_TICK));
    resolveFactionMemberWork(makeState(b, PASS_TICK));

    for (const id of ['m0', 'm1', 'm2', 'm3']) {
      expect(reputationOf(a, id)).toBe(reputationOf(b, id));
    }
  });

  it('resolves no more than the window allows in one pass', () => {
    const graph = new WorldGraph();
    addFaction(graph);
    const ids = Array.from({ length: 12 }, (_, i) => `m${i}`);
    for (const id of ids) addMember(graph, id, 'ambient');
    const before = ids.map(id => reputationOf(graph, id));

    resolveFactionMemberWork(makeState(graph, PASS_TICK));

    const changed = ids.filter((id, i) => reputationOf(graph, id) !== before[i]);
    expect(changed.length).toBeLessThanOrEqual(workWindowSize(ids.length));
  });

  it('skips dissolved factions', () => {
    const graph = new WorldGraph();
    addFaction(graph);
    graph.updateNode(FACTION_ID, { properties: { dissolved: true } });
    addMember(graph, 'm0', 'ambient');
    const before = reputationOf(graph, 'm0');

    for (let pass = 0; pass < 6; pass++) {
      resolveFactionMemberWork(makeState(graph, pass * FACTION_MEMBER_WORK_INTERVAL));
    }
    expect(reputationOf(graph, 'm0')).toBe(before);
  });

  it('ignores memberships with no factionDefId (pre-faction economic guilds)', () => {
    const graph = new WorldGraph();
    addFaction(graph);
    graph.addNode({
      id: 'econ',
      type: 'actor',
      name: 'Econ Member',
      properties: { actorType: 'individual', spotlightTier: 'ambient' },
    });
    graph.addEdge({
      id: 'e_member_econ',
      source: 'econ',
      target: FACTION_ID,
      type: 'member_of',
      properties: { reputation: 0.3, joinedTick: 0 },
    });

    for (let pass = 0; pass < 6; pass++) {
      resolveFactionMemberWork(makeState(graph, pass * FACTION_MEMBER_WORK_INTERVAL));
    }
    expect(reputationOf(graph, 'econ')).toBe(0.3);
  });

  it('does not throw on a membership whose member node is gone (fail-soft, NFP #4)', () => {
    const graph = new WorldGraph();
    addFaction(graph);
    addMember(graph, 'm0', 'ambient');
    graph.removeNode('m0');

    expect(() => resolveFactionMemberWork(makeState(graph, PASS_TICK))).not.toThrow();
  });

  it('surfaces a promotion as a faction_rank_changed event with a collision-free id', () => {
    const graph = new WorldGraph();
    addFaction(graph);
    // Journeyman → Sergeant crosses at 0.30, so members seeded just under it are one
    // successful job away and the assertions below cannot go vacuous.
    for (const id of ['p0', 'p1', 'p2']) addMember(graph, id, 'ambient', 0.24);

    const events = [];
    for (let pass = 0; pass < 12; pass++) {
      events.push(...resolveFactionMemberWork(makeState(graph, pass * FACTION_MEMBER_WORK_INTERVAL)));
    }

    expect(events.length).toBeGreaterThan(0);
    for (const e of events) {
      expect(e.type).toBe('faction_rank_changed');
      // THR-781 is the open bug where a rank event id omits the faction and
      // collides for a mortal holding two memberships. Not repeating it.
      expect(e.id).toContain(FACTION_ID);
      expect(e.message.length).toBeGreaterThan(0);
      expect(e.message).not.toContain('{');
    }
    expect(new Set(events.map(e => e.id)).size).toBe(events.length);
  });
});

// ─── Prose helpers ──────────────────────────────────────────────────────────

describe('member work prose', () => {
  it('fills known placeholders and leaves unknown ones visible', () => {
    expect(fillMemberWorkProse('{a} and {b}', { a: 'x', b: 'y' })).toBe('x and y');
    // A visible {typo} is a bug that gets fixed; a silent '' is a bug that ships.
    expect(fillMemberWorkProse('{a} and {missing}', { a: 'x' })).toBe('x and {missing}');
  });

  it('picks deterministically and stays in range for any selector', () => {
    const pool = ['one', 'two', 'three'];
    expect(pickMemberWorkProse(pool, 4)).toBe(pickMemberWorkProse(pool, 4));
    expect(pool).toContain(pickMemberWorkProse(pool, -7));
    expect(pool).toContain(pickMemberWorkProse(pool, 1e9));
    expect(pickMemberWorkProse([], 3)).toBe('');
  });
});
