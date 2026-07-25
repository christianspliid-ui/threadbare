/**
 * Reunite + Sunder — THR-732
 *
 * Covers the two verbs end to end at the seams that could silently rot:
 *
 *  - the graph-ops' validation, window writes, and the convergence stamp Reunite
 *    *reuses* from Draw Together (a parallel mechanism would pass a naive test);
 *  - the former-member lookup, which must read `member_of` edges rather than the
 *    node's `roster` — `dissolveGroup` clears the roster, so a roster-based
 *    implementation returns nobody on exactly the input Reunite takes;
 *  - the three Sunder read sites (dissent, leave rate, fray pool);
 *  - the cause-precedence rule that keeps a reunion from being told as an ordinary
 *    Draw Together gathering.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../../graph';
import { executeGraphOps } from '../../graphOpExecutor';
import type { GameState } from '../../../types/gameState';
import {
  isGroupSundered,
  isGroupReuniting,
  isGroupBlessed,
  getFormerGroupMembers,
  getReunitableMembers,
} from '../groupQueries';
import { applyCohesionEvent } from '../groupCohesion';
import { dissolveGroup } from '../groupDissolution';
import { findReunionTarget, reuniteCompatBonus } from '../groupFormation';
import { composeReunionMoment, reuniteWindowLapsed } from '../groupReunion';
import { generateGroupName } from '../groupNames';
import {
  REUNITE_DURATION_TICKS,
  REUNITE_COMPAT_BONUS,
  SUNDER_DURATION_TICKS,
  SUNDER_COHESION_DELTA,
  SUNDER_DISSENT_MULT,
  GROUP_DISSENT_COHESION_HIT,
} from '../../../data/group-constants';

const ASC = 'asc.1';
const GROUP = 'group.1';

/**
 * A company at one location with `n` members, plus the ascendant.
 * Members carry a `located_at` edge so the reunion anchor's hex resolves.
 */
function buildState(memberCount = 3, tick = 10): GameState {
  const graph = new WorldGraph();

  // The anchor's hex resolves off the location's own hexCol/hexRow — no separate
  // hex node is needed (and `hex` is not a NodeType).
  graph.addNode({
    id: 'loc.1', type: 'location', name: 'Ashford',
    properties: { hexCol: 5, hexRow: 5, locationSubtype: 'settlement' },
  });
  graph.addNode({
    id: ASC, type: 'actor', name: 'The Witness',
    properties: { actorType: 'ascendant', sphereAlignment: { primary: 'spirit' } },
  });

  graph.addNode({
    id: GROUP, type: 'actor', name: 'The Quiet Wardens',
    properties: {
      actorType: 'group', groupType: 'party', cohesion: 0.6, groupStatus: 'active',
      formedAtTick: 0, formationContext: { cause: 'systemic', locationId: 'loc.1' },
      roster: [],
    },
  });

  const memberIds: string[] = [];
  for (let i = 0; i < memberCount; i++) {
    const id = `agent.${i}`;
    memberIds.push(id);
    graph.addNode({
      id, type: 'actor', name: `Member ${i}`,
      properties: { actorType: 'individual', spotlightTier: 'spotlight' },
    });
    graph.addEdge({
      id: `e_loc_${id}`, source: id, target: 'loc.1', type: 'located_at', properties: {},
    });
    graph.addEdge({
      id: `e_member_${id}`, source: id, target: GROUP, type: 'member_of',
      properties: { role: i === 0 ? 'leader' : 'member', rank: 0, joinedTick: i },
    });
  }
  graph.addEdge({
    id: 'e_cmd', source: GROUP, target: memberIds[0], type: 'commanded_by',
    properties: { assignedTick: 0 },
  });
  graph.updateNode(GROUP, {
    properties: { ...graph.getNode(GROUP)!.properties, roster: memberIds },
  });

  return { graph, tick, seed: 42, ascendantId: ASC, tickEvents: [] } as unknown as GameState;
}

function run(state: GameState, op: string, targetId: string) {
  return executeGraphOps(
    state.graph,
    [{ op, nodeId: targetId } as never],
    { actorId: ASC, targetId, locationId: 'loc.1', tick: state.tick },
  );
}

describe('THR-732 — the cleared-roster trap', () => {
  it('dissolveGroup clears `roster`, so former members must come from the edges', () => {
    const state = buildState(3);
    dissolveGroup(state, state.graph.getNode(GROUP)!, 'cohesion_floor');

    // The premise: a roster-based lookup finds nobody here.
    const roster = (state.graph.getNode(GROUP)!.properties as Record<string, unknown>).roster;
    expect(roster).toEqual([]);

    // The edges survived dissolution carrying `leftAtTick` — that is the record.
    expect(getFormerGroupMembers(state.graph, GROUP).map(m => m.id))
      .toEqual(['agent.0', 'agent.1', 'agent.2']);
    expect(getReunitableMembers(state.graph, GROUP)).toHaveLength(3);
  });

  it('excludes the dead and the already-regrouped from a reunion', () => {
    const state = buildState(3);
    dissolveGroup(state, state.graph.getNode(GROUP)!, 'cohesion_floor');

    state.graph.updateNode('agent.1', {
      properties: { ...state.graph.getNode('agent.1')!.properties, deceased: true },
    });
    state.graph.addNode({
      id: 'group.2', type: 'actor', name: 'Other',
      properties: { actorType: 'group', groupType: 'party', cohesion: 0.6, groupStatus: 'active' },
    });
    state.graph.addEdge({
      id: 'e_m2', source: 'agent.2', target: 'group.2', type: 'member_of',
      properties: { role: 'member', rank: 0, joinedTick: 1 },
    });

    expect(getFormerGroupMembers(state.graph, GROUP)).toHaveLength(3);
    expect(getReunitableMembers(state.graph, GROUP).map(m => m.id)).toEqual(['agent.0']);
  });
});

describe('THR-732 — reunite_company graph-op', () => {
  it('opens the window and stamps Draw Together\'s convergence pull on former members', () => {
    const state = buildState(3);
    dissolveGroup(state, state.graph.getNode(GROUP)!, 'cohesion_floor');

    const res = run(state, 'reunite_company', GROUP);
    expect(res.results[0].success).toBe(true);

    const props = state.graph.getNode(GROUP)!.properties as Record<string, unknown>;
    expect(props.reuniteUntilTick).toBe(state.tick + REUNITE_DURATION_TICKS);
    expect(props.reuniteSphereFlavor).toBe('spirit');
    expect(isGroupReuniting(state.graph.getNode(GROUP), state.tick)).toBe(true);

    // The exact property names encounterScoring.computeConvergenceBonus reads —
    // a parallel mechanism under different keys would be inert.
    for (const id of ['agent.0', 'agent.1', 'agent.2']) {
      const p = state.graph.getNode(id)!.properties as Record<string, unknown>;
      expect(p.convergePullHexCol).toBe(5);
      expect(p.convergePullHexRow).toBe(5);
      expect(p.convergePullUntilTick).toBe(state.tick + REUNITE_DURATION_TICKS);
    }
  });

  it('refuses an active company, a non-company, and a too-thin roster (fail-soft)', () => {
    const active = buildState(3);
    expect(run(active, 'reunite_company', GROUP).results[0].error).toMatch(/not disbanded/);

    const missing = buildState(3);
    expect(run(missing, 'reunite_company', 'nope').results[0].error).toMatch(/not found/);

    const thin = buildState(1);
    dissolveGroup(thin, thin.graph.getNode(GROUP)!, 'undersize');
    const res = run(thin, 'reunite_company', GROUP).results[0];
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/gatherable former member/);
    // A refused cast must leave no window behind.
    expect(isGroupReuniting(thin.graph.getNode(GROUP), thin.tick)).toBe(false);
  });
});

describe('THR-732 — sunder_company graph-op', () => {
  it('applies the cohesion hit and opens the window', () => {
    const state = buildState(3);
    const before = (state.graph.getNode(GROUP)!.properties as Record<string, unknown>).cohesion as number;

    expect(run(state, 'sunder_company', GROUP).results[0].success).toBe(true);

    const props = state.graph.getNode(GROUP)!.properties as Record<string, unknown>;
    expect(props.cohesion).toBeCloseTo(before + SUNDER_COHESION_DELTA, 5);
    expect(props.sunderedUntilTick).toBe(state.tick + SUNDER_DURATION_TICKS);
    expect(isGroupSundered(state.graph.getNode(GROUP), state.tick)).toBe(true);
  });

  it('refuses a disbanded company', () => {
    const state = buildState(3);
    dissolveGroup(state, state.graph.getNode(GROUP)!, 'cohesion_floor');
    expect(run(state, 'sunder_company', GROUP).results[0].error).toMatch(/already disbanded/);
  });

  it('coexists with Bless rather than cancelling it', () => {
    const state = buildState(3);
    state.graph.updateNode(GROUP, {
      properties: {
        ...state.graph.getNode(GROUP)!.properties,
        blessedUntilTick: state.tick + 5,
      },
    });
    run(state, 'sunder_company', GROUP);

    const node = state.graph.getNode(GROUP);
    expect(isGroupBlessed(node, state.tick)).toBe(true);
    expect(isGroupSundered(node, state.tick)).toBe(true);
  });
});

describe('THR-732 — Sunder read sites', () => {
  it('doubles a dissent cohesion hit while the window is open', () => {
    const plain = buildState(3);
    const plainDelta = applyCohesionEvent(plain.graph, GROUP, 'dissent', plain.tick);
    expect(plainDelta).toBeCloseTo(GROUP_DISSENT_COHESION_HIT, 5);

    const sundered = buildState(3);
    run(sundered, 'sunder_company', GROUP);
    const delta = applyCohesionEvent(sundered.graph, GROUP, 'dissent', sundered.tick);
    expect(delta).toBeCloseTo(GROUP_DISSENT_COHESION_HIT * SUNDER_DISSENT_MULT, 5);
  });

  it('leaves non-dissent events untouched — a sundering does not worsen a death', () => {
    const state = buildState(3);
    run(state, 'sunder_company', GROUP);
    const before = (state.graph.getNode(GROUP)!.properties as Record<string, unknown>).cohesion as number;
    const delta = applyCohesionEvent(state.graph, GROUP, 'member_death', state.tick);
    // Clamping aside, the delta is the plain constant, not a multiplied one.
    expect(delta).toBeCloseTo(Math.max(0, before - 0.15) - before, 5);
  });

  it('a blessed-and-sundered company still suppresses dissent (bless is read first)', () => {
    const state = buildState(3);
    state.graph.updateNode(GROUP, {
      properties: {
        ...state.graph.getNode(GROUP)!.properties,
        blessedUntilTick: state.tick + 5,
        sunderedUntilTick: state.tick + 5,
      },
    });
    expect(applyCohesionEvent(state.graph, GROUP, 'dissent', state.tick)).toBe(0);
  });
});

describe('THR-732 — formation-side reunion detection', () => {
  let state: GameState;

  beforeEach(() => {
    state = buildState(3);
    dissolveGroup(state, state.graph.getNode(GROUP)!, 'cohesion_floor');
    run(state, 'reunite_company', GROUP);
  });

  it('scores a compat bonus for two former comrades, and nothing for a stranger', () => {
    expect(reuniteCompatBonus(state.graph, 'agent.0', 'agent.1', state.tick))
      .toBeCloseTo(REUNITE_COMPAT_BONUS, 5);

    state.graph.addNode({
      id: 'agent.stranger', type: 'actor', name: 'Stranger',
      properties: { actorType: 'individual', spotlightTier: 'spotlight' },
    });
    expect(reuniteCompatBonus(state.graph, 'agent.0', 'agent.stranger', state.tick)).toBe(0);
  });

  it('stops scoring once the window has closed', () => {
    const after = state.tick + REUNITE_DURATION_TICKS;
    expect(reuniteCompatBonus(state.graph, 'agent.0', 'agent.1', after)).toBe(0);
  });

  it('identifies the reunion target only when enough of the set shares it', () => {
    const nodes = ['agent.0', 'agent.1', 'agent.2'].map(id => state.graph.getNode(id)!);
    expect(findReunionTarget(state.graph, nodes, state.tick)?.id).toBe(GROUP);

    // One lone veteran is not a reunion.
    expect(findReunionTarget(state.graph, [nodes[0]], state.tick)).toBeUndefined();
  });
});

describe('THR-732 — reunion moments', () => {
  it('fires a lapse only once the window has expired', () => {
    expect(reuniteWindowLapsed(20, 19)).toBe(false);
    expect(reuniteWindowLapsed(20, 20)).toBe(true);
    expect(reuniteWindowLapsed(undefined, 99)).toBe(false);
  });

  it('resolves {company} in both registers', () => {
    const rng = () => 0.3;
    for (const kind of ['reunion', 'lapse'] as const) {
      const moment = composeReunionMoment('The Quiet Wardens', kind, rng);
      expect(moment.kind).toBe(kind);
      expect(moment.message).toContain('The Quiet Wardens');
      expect(moment.message).not.toContain('{company}');
    }
  });
});

describe('THR-732 — re-formed names', () => {
  it('builds a variant of the predecessor rather than a fresh name', () => {
    const name = generateGroupName({ groupId: 'group.new', cause: 'reunite', predecessorName: 'The Quiet Wardens' });
    expect(name).toContain('Quiet Wardens');
    expect(name).not.toBe('The Quiet Wardens');
  });

  it('never doubles an article', () => {
    // Every pattern, exercised by sweeping the rng across the pool.
    for (let i = 0; i < 20; i++) {
      const name = generateGroupName({
        groupId: `group.${i}`, cause: 'reunite', predecessorName: 'The Quiet Wardens',
      });
      expect(name).not.toMatch(/\bThe\s+The\b/i);
      expect(name).not.toMatch(/\{(old|bare|oldLower)\}/);
    }
  });

  it('falls back to the ordinary generator when the old name is unknown', () => {
    const name = generateGroupName({ groupId: 'group.x', cause: 'reunite', leaderName: 'Kael' });
    expect(name.length).toBeGreaterThan(0);
    expect(name).not.toMatch(/\{/);
  });
});
