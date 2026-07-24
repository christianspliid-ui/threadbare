/**
 * The Parting tests — THR-74.
 *
 * A threaded company's dissolution is told as an authored moment; an untethered
 * one's end stays the silent systemic line. Covers the pure variant/compose
 * logic, the `isGroupThreaded` gate, and the phaseGroups integration that decides
 * which line the event feed carries.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../../graph';
import type { GameState } from '../../../types/gameState';
import { createGroup } from '../groupFormation';
import { isGroupThreaded } from '../groupQueries';
import { selectPartingVariant, composePartingMoment } from '../groupParting';
import { phaseGroups, resetGroupEventCounter } from '../phaseGroups';
import {
  GROUP_PARTING_BITTERSWEET,
  GROUP_PARTING_BITTER,
} from '../../../data/group-parting-content';
import {
  GROUP_DISSOLUTION_THRESHOLD,
  GROUP_PARTING_EVENT_SIGNIFICANCE,
  GROUP_FRAY_THRESHOLD,
} from '../../../data/group-constants';

function makeState(graph: WorldGraph, tick = 10, ascendantId = 'asc'): GameState {
  return { graph, tick, seed: 42, tickEvents: [], ascendantId } as unknown as GameState;
}

function baseGraph(): WorldGraph {
  const g = new WorldGraph();
  g.addNode({ id: 'asc', type: 'actor', name: 'The Witness', properties: { actorType: 'ascendant' } });
  g.addNode({ id: 'loc.1', type: 'location', name: 'Ashford', properties: { locationType: 'settlement' } });
  for (const [id, name] of [['a1', 'Kael'], ['a2', 'Lyra'], ['a3', 'Vorn']] as const) {
    g.addNode({ id, type: 'actor', name, properties: { actorType: 'individual', spotlightTier: 'spotlight' } });
    g.addEdge({ id: `e.${id}.loc`, source: id, target: 'loc.1', type: 'located_at', properties: {} });
  }
  return g;
}

/** Thread the ascendant to `agentId` (the player considers them "theirs"). */
function thread(g: WorldGraph, agentId: string): void {
  g.addEdge({ id: `e.thread.${agentId}`, source: 'asc', target: agentId, type: 'thread', properties: {} });
}

function makeGroup(state: GameState, cohesion: number): string {
  return createGroup(state, {
    members: ['a1', 'a2', 'a3'].map(id => state.graph.getNode(id)!),
    leaderId: 'a1',
    locationId: 'loc.1',
    cause: 'systemic',
    groupType: 'party',
    startingCohesion: cohesion,
  })!.groupId;
}

let state: GameState;
beforeEach(() => {
  resetGroupEventCounter();
  state = makeState(baseGraph());
});

describe('selectPartingVariant', () => {
  it('tells a completed errand as bittersweet regardless of cohesion', () => {
    expect(selectPartingVariant('goal_complete', 0.1)).toBe('bittersweet');
    expect(selectPartingVariant('goal_complete', 0.9)).toBe('bittersweet');
  });

  it('tells a failed bond (cohesion floor / betrayal) as bitter', () => {
    expect(selectPartingVariant('cohesion_floor', 0.9)).toBe('bitter');
    expect(selectPartingVariant('betrayal', 0.9)).toBe('bitter');
  });

  it('splits the ambiguous reasons on the fray line', () => {
    expect(selectPartingVariant('undersize', GROUP_FRAY_THRESHOLD)).toBe('bittersweet');
    expect(selectPartingVariant('undersize', GROUP_FRAY_THRESHOLD - 0.01)).toBe('bitter');
    expect(selectPartingVariant('leader_death', GROUP_FRAY_THRESHOLD + 0.1)).toBe('bittersweet');
    expect(selectPartingVariant('leader_death', 0.05)).toBe('bitter');
  });
});

describe('composePartingMoment', () => {
  const rng = () => 0.4;

  it('resolves the {company} token and carries the chosen variant', () => {
    const moment = composePartingMoment('The Quiet Wardens', 'goal_complete', 0.6, rng);
    expect(moment.variant).toBe('bittersweet');
    expect(moment.message).toContain('The Quiet Wardens');
    expect(moment.message).not.toContain('{company}');
  });

  it('draws bitter lines from the bitter pool', () => {
    const moment = composePartingMoment('The Ashen Crows', 'cohesion_floor', 0.05, rng);
    expect(moment.variant).toBe('bitter');
    const resolved = GROUP_PARTING_BITTER.map(t => t.replace(/\{company\}/g, 'The Ashen Crows'));
    expect(resolved).toContain(moment.message);
  });

  it('draws bittersweet lines from the bittersweet pool', () => {
    const moment = composePartingMoment('The Long Roads', 'goal_complete', 0.6, rng);
    const resolved = GROUP_PARTING_BITTERSWEET.map(t => t.replace(/\{company\}/g, 'The Long Roads'));
    expect(resolved).toContain(moment.message);
  });

  it('is deterministic for the same rng sequence', () => {
    const a = composePartingMoment('The Iron Vigil', 'undersize', 0.1, () => 0.7);
    const b = composePartingMoment('The Iron Vigil', 'undersize', 0.1, () => 0.7);
    expect(a).toEqual(b);
  });
});

describe('isGroupThreaded', () => {
  it('is false when no member is threaded', () => {
    const id = makeGroup(state, 0.5);
    expect(isGroupThreaded(state.graph, id, 'asc')).toBe(false);
  });

  it('is true when any member is threaded', () => {
    const id = makeGroup(state, 0.5);
    thread(state.graph, 'a2');
    expect(isGroupThreaded(state.graph, id, 'asc')).toBe(true);
  });

  it('is false when there is no ascendant', () => {
    const id = makeGroup(state, 0.5);
    thread(state.graph, 'a2');
    expect(isGroupThreaded(state.graph, id, undefined)).toBe(false);
  });
});

describe('phaseGroups — dissolution moment', () => {
  function dissolvedEvent(s: GameState) {
    const out = phaseGroups(s);
    return (out.tickEvents ?? []).find(e => e.type === 'group_dissolved');
  }

  it('tells a threaded company an authored Parting with band + raised significance', () => {
    makeGroup(state, GROUP_DISSOLUTION_THRESHOLD - 0.02); // will dissolve: cohesion_floor
    thread(state.graph, 'a1');

    const evt = dissolvedEvent(state);
    expect(evt).toBeDefined();
    expect(evt!.band).toBe('bitter'); // cohesion_floor → bitter
    expect(evt!.significance).toBeCloseTo(GROUP_PARTING_EVENT_SIGNIFICANCE, 5);
    expect(evt!.message).not.toBe('goes its separate ways.');
    expect(evt!.message).not.toContain('{company}');
  });

  it('leaves an untethered company the silent systemic line', () => {
    makeGroup(state, GROUP_DISSOLUTION_THRESHOLD - 0.02); // dissolves, but nobody threaded

    const evt = dissolvedEvent(state);
    expect(evt).toBeDefined();
    expect(evt!.band).toBeUndefined();
    expect(evt!.message).toContain('goes its separate ways');
  });
});
