/**
 * Company lifecycle tests — THR-74.
 *
 * Covers formation, cohesion events, dissolution, and the resolution hook, plus the
 * fail-soft rows that are easy to regress: dissolved companies must persist, and a
 * dissolution must never delete membership history.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../../graph';
import type { GameState } from '../../../types/gameState';
import { mulberry32 } from '../../../lib/prng';
import { createGroup, computeCompatibility } from '../groupFormation';
import { applyCohesionEvent, applyCohesionDelta, reconcileLostMembers } from '../groupCohesion';
import { runGroupUpkeep, dissolveGroup, removeMember } from '../groupDissolution';
import { resolveGroupStep } from '../groupResolution';
import { generateGroupName } from '../groupNames';
import { getAllGroups, getGroupMembers, getGroupCohesion, getGroupLeader, getGroupOf } from '../groupQueries';
import {
  GROUP_COHESION_SUCCESS_DELTA,
  GROUP_COHESION_DEATH_DELTA,
  GROUP_DISSOLUTION_THRESHOLD,
  GROUP_MIN_MEMBERS,
  GROUP_ASSIST_CAP,
} from '../../../data/group-constants';

function makeState(graph: WorldGraph, tick = 10): GameState {
  return { graph, tick, seed: 42, tickEvents: [] } as unknown as GameState;
}

function baseGraph(): WorldGraph {
  const g = new WorldGraph();
  g.addNode({ id: 'loc.1', type: 'location', name: 'Ashford', properties: { locationType: 'settlement' } });
  for (const [id, name] of [['a1', 'Kael'], ['a2', 'Lyra'], ['a3', 'Vorn']] as const) {
    g.addNode({ id, type: 'actor', name, properties: { actorType: 'individual', spotlightTier: 'spotlight' } });
    g.addEdge({ id: `e.${id}.loc`, source: id, target: 'loc.1', type: 'located_at', properties: {} });
  }
  return g;
}

let state: GameState;
beforeEach(() => {
  state = makeState(baseGraph());
});

describe('createGroup', () => {
  it('creates the node, commanded_by, and one member_of per member', () => {
    const created = createGroup(state, {
      members: ['a1', 'a2', 'a3'].map(id => state.graph.getNode(id)!),
      leaderId: 'a1',
      locationId: 'loc.1',
      cause: 'systemic',
      groupType: 'party',
    });

    expect(created).toBeDefined();
    const groups = getAllGroups(state.graph);
    expect(groups).toHaveLength(1);
    expect(getGroupMembers(state.graph, created!.groupId).map(m => m.id)).toEqual(['a1', 'a2', 'a3']);
    expect(getGroupLeader(state.graph, created!.groupId)?.id).toBe('a1');
  });

  it('never attaches a located_at edge to the company node', () => {
    const created = createGroup(state, {
      members: ['a1', 'a2'].map(id => state.graph.getNode(id)!),
      leaderId: 'a1',
      locationId: 'loc.1',
      cause: 'systemic',
      groupType: 'party',
    })!;
    expect(state.graph.getOutgoingEdges(created.groupId, 'located_at')).toHaveLength(0);
  });

  it('refuses to create a company below the minimum size', () => {
    expect(
      createGroup(state, {
        members: [state.graph.getNode('a1')!],
        leaderId: 'a1',
        locationId: 'loc.1',
        cause: 'systemic',
        groupType: 'party',
      }),
    ).toBeUndefined();
    expect(getAllGroups(state.graph)).toHaveLength(0);
  });

  it('gives the company a generated proper name, not an id', () => {
    const created = createGroup(state, {
      members: ['a1', 'a2'].map(id => state.graph.getNode(id)!),
      leaderId: 'a1',
      locationId: 'loc.1',
      cause: 'systemic',
      groupType: 'party',
    })!;
    expect(created.name.length).toBeGreaterThan(0);
    expect(created.name).not.toContain('group_');
    // "party" must never surface in player-facing text.
    expect(created.name.toLowerCase()).not.toContain('party');
  });
});

describe('generateGroupName determinism', () => {
  it('is stable for the same group id', () => {
    const a = generateGroupName({ groupId: 'group_x', cause: 'systemic', leaderName: 'Kael', locationName: 'Ashford' });
    const b = generateGroupName({ groupId: 'group_x', cause: 'systemic', leaderName: 'Kael', locationName: 'Ashford' });
    expect(a).toBe(b);
  });

  it('falls back rather than returning empty when every input is missing', () => {
    expect(generateGroupName({ groupId: 'group_y' }).length).toBeGreaterThan(0);
  });
});

describe('cohesion events', () => {
  function withGroup(cohesion = 0.5): string {
    const created = createGroup(state, {
      members: ['a1', 'a2', 'a3'].map(id => state.graph.getNode(id)!),
      leaderId: 'a1',
      locationId: 'loc.1',
      cause: 'systemic',
      groupType: 'party',
      startingCohesion: cohesion,
    })!;
    return created.groupId;
  }

  it('applies the named delta for an event', () => {
    const id = withGroup(0.5);
    const delta = applyCohesionEvent(state.graph, id, 'encounter_success', state.tick);
    expect(delta).toBeCloseTo(GROUP_COHESION_SUCCESS_DELTA, 5);
    expect(getGroupCohesion(state.graph.getNode(id))).toBeCloseTo(0.5 + GROUP_COHESION_SUCCESS_DELTA, 5);
  });

  it('clamps to [0,1]', () => {
    const id = withGroup(0.98);
    applyCohesionDelta(state.graph, id, 0.5);
    expect(getGroupCohesion(state.graph.getNode(id))).toBe(1);
    applyCohesionDelta(state.graph, id, -5);
    expect(getGroupCohesion(state.graph.getNode(id))).toBe(0);
  });

  it('a blessing suppresses dissent but not grief', () => {
    const id = withGroup(0.5);
    state.graph.updateNode(id, {
      properties: { ...state.graph.getNode(id)!.properties, blessedUntilTick: state.tick + 5 },
    });
    expect(applyCohesionEvent(state.graph, id, 'dissent', state.tick)).toBe(0);
    expect(applyCohesionEvent(state.graph, id, 'member_death', state.tick)).toBeCloseTo(GROUP_COHESION_DEATH_DELTA, 5);
  });

  it('reconciles a vanished member and charges the company', () => {
    const id = withGroup(0.8);
    state.graph.removeNode('a3');
    const applied = reconcileLostMembers(state.graph, state.graph.getNode(id)!, state.tick);
    expect(applied).toBe(1);
    expect(getGroupMembers(state.graph, id).map(m => m.id)).toEqual(['a1', 'a2']);
    expect(getGroupCohesion(state.graph.getNode(id))).toBeCloseTo(0.8 + GROUP_COHESION_DEATH_DELTA, 5);
  });
});

describe('dissolution', () => {
  function withGroup(cohesion = 0.5): string {
    return createGroup(state, {
      members: ['a1', 'a2', 'a3'].map(id => state.graph.getNode(id)!),
      leaderId: 'a1',
      locationId: 'loc.1',
      cause: 'systemic',
      groupType: 'party',
      startingCohesion: cohesion,
    })!.groupId;
  }

  it('marks the node disbanded instead of deleting it', () => {
    const id = withGroup();
    dissolveGroup(state, state.graph.getNode(id)!, 'cohesion_floor');

    const node = state.graph.getNode(id);
    expect(node).toBeDefined();
    expect(node!.properties.groupStatus).toBe('disbanded');
    expect(node!.properties.dissolutionReason).toBe('cohesion_floor');
    expect(node!.properties.disbandedAtTick).toBe(state.tick);
  });

  it('keeps membership edges as history, stamped with leftAtTick', () => {
    const id = withGroup();
    dissolveGroup(state, state.graph.getNode(id)!, 'goal_complete');

    const edges = state.graph.getIncomingEdges(id, 'member_of');
    expect(edges).toHaveLength(3); // nothing deleted
    expect(edges.every(e => e.properties.leftAtTick === state.tick)).toBe(true);
    expect(getGroupMembers(state.graph, id)).toHaveLength(0); // but none are current
    expect(getGroupOf(state.graph, 'a1')).toBeUndefined();
  });

  it('dissolves below the cohesion floor', () => {
    const id = withGroup(GROUP_DISSOLUTION_THRESHOLD - 0.01);
    const result = runGroupUpkeep(state, state.graph.getNode(id)!, mulberry32(1));
    expect(result.dissolved?.reason).toBe('cohesion_floor');
  });

  it('dissolves when it drops below the minimum size', () => {
    const id = withGroup(0.9);
    removeMember(state, state.graph.getNode(id)!, state.graph.getNode('a2')!, 'chose_to_leave');
    removeMember(state, state.graph.getNode(id)!, state.graph.getNode('a3')!, 'chose_to_leave');
    expect(getGroupMembers(state.graph, id).length).toBeLessThan(GROUP_MIN_MEMBERS);

    const result = runGroupUpkeep(state, state.graph.getNode(id)!, mulberry32(1));
    expect(result.dissolved?.reason).toBe('undersize');
  });

  it('promotes a new leader rather than dissolving when the leader dies', () => {
    const id = withGroup(0.9);
    state.graph.removeNode('a1');

    const result = runGroupUpkeep(state, state.graph.getNode(id)!, mulberry32(1));
    expect(result.dissolved).toBeUndefined();
    expect(getGroupLeader(state.graph, id)?.id).toBe('a2');
  });

  it('a healthy company never evaluates leave decisions', () => {
    const id = withGroup(0.9);
    const result = runGroupUpkeep(state, state.graph.getNode(id)!, mulberry32(1));
    expect(result.leaveDecisions).toBe(0);
  });
});

describe('resolveGroupStep', () => {
  it('caps the assist bonus regardless of member count', () => {
    const g = baseGraph();
    for (let i = 4; i <= 10; i++) {
      g.addNode({ id: `a${i}`, type: 'actor', name: `Extra${i}`, properties: { actorType: 'individual', spotlightTier: 'spotlight' } });
      g.addEdge({ id: `e.a${i}.loc`, source: `a${i}`, target: 'loc.1', type: 'located_at', properties: {} });
    }
    const s = makeState(g);
    const memberIds = Array.from({ length: 10 }, (_, i) => `a${i + 1}`);
    const created = createGroup(s, {
      members: memberIds.map(id => g.getNode(id)!),
      leaderId: 'a1',
      locationId: 'loc.1',
      cause: 'systemic',
      groupType: 'party',
    })!;

    const result = resolveGroupStep(g, created.groupId, 'iron', 'a1');
    expect(result).toBeDefined();
    expect(result!.assistBonus).toBeLessThanOrEqual(GROUP_ASSIST_CAP);
  });

  it('returns undefined for a company with no members, so callers resolve solo', () => {
    const id = createGroup(state, {
      members: ['a1', 'a2'].map(i => state.graph.getNode(i)!),
      leaderId: 'a1',
      locationId: 'loc.1',
      cause: 'systemic',
      groupType: 'party',
    })!.groupId;
    dissolveGroup(state, state.graph.getNode(id)!, 'undersize');
    expect(resolveGroupStep(state.graph, id, 'iron', 'a1')).toBeUndefined();
  });

  it('picks a member deterministically', () => {
    const id = createGroup(state, {
      members: ['a1', 'a2', 'a3'].map(i => state.graph.getNode(i)!),
      leaderId: 'a1',
      locationId: 'loc.1',
      cause: 'systemic',
      groupType: 'party',
    })!.groupId;
    const first = resolveGroupStep(state.graph, id, 'heart', 'a1');
    const second = resolveGroupStep(state.graph, id, 'heart', 'a1');
    expect(first!.actingMemberId).toBe(second!.actingMemberId);
    expect(['a1', 'a2', 'a3']).toContain(first!.actingMemberId);
  });
});

describe('computeCompatibility', () => {
  it('stays within 0–1 and rises with a positive bond', () => {
    const g = baseGraph();
    const bare = computeCompatibility(g, 'a1', 'a2');
    g.addEdge({
      id: 'e.bond',
      source: 'a1',
      target: 'a2',
      type: 'relates_to',
      properties: { sentiment: 0.9, trust: 0.8, basis: 'sworn_ally' },
    });
    const bonded = computeCompatibility(g, 'a1', 'a2');
    expect(bonded).toBeGreaterThan(bare);
    expect(bonded).toBeLessThanOrEqual(1);
    expect(bare).toBeGreaterThanOrEqual(0);
  });
});
