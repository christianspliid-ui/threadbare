/**
 * The Shared Spoils / Old Wounds tests — THR-74.
 *
 * A threaded company that crosses below the fray line earns an authored moment;
 * an untethered one's fray stays the silent systemic line, and no company re-fires
 * while it merely sits in `frayed`. Covers the pure crossing detector, the compose
 * logic, and the phaseGroups integration that decides which events the feed carries.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../../graph';
import type { GameState } from '../../../types/gameState';
import type { CohesionState } from '../groupQueries';
import { createGroup } from '../groupFormation';
import { crossedIntoFray, composeFrayMoment } from '../groupFray';
import { phaseGroups, resetGroupEventCounter } from '../phaseGroups';
import {
  GROUP_FRAY_SHARED_SPOILS,
  GROUP_FRAY_OLD_WOUNDS,
} from '../../../data/group-fray-content';
import { GROUP_FRAY_EVENT_SIGNIFICANCE } from '../../../data/group-constants';

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

/** A three-member company at `loc.1`, cohesion supplied, with an optional pre-seeded band. */
function makeGroup(state: GameState, cohesion: number, lastBand?: CohesionState): string {
  const id = createGroup(state, {
    members: ['a1', 'a2', 'a3'].map(mid => state.graph.getNode(mid)!),
    leaderId: 'a1',
    locationId: 'loc.1',
    cause: 'systemic',
    groupType: 'party',
    startingCohesion: cohesion,
  })!.groupId;
  if (lastBand !== undefined) {
    const node = state.graph.getNode(id)!;
    state.graph.updateNode(id, { properties: { ...node.properties, lastCohesionState: lastBand } });
  }
  return id;
}

function frayEvent(s: GameState) {
  const out = phaseGroups(s);
  return (out.tickEvents ?? []).find(e => e.type === 'group_frayed');
}

let state: GameState;
beforeEach(() => {
  resetGroupEventCounter();
  state = makeState(baseGraph());
});

describe('crossedIntoFray', () => {
  it('never counts a first observation (undefined prev) as a crossing', () => {
    expect(crossedIntoFray(undefined, 'frayed')).toBe(false);
    expect(crossedIntoFray(undefined, 'breaking')).toBe(false);
  });

  it('fires when a healthy band drops below the fray line', () => {
    expect(crossedIntoFray('holding', 'frayed')).toBe(true);
    expect(crossedIntoFray('bound', 'frayed')).toBe(true);
    expect(crossedIntoFray('holding', 'breaking')).toBe(true);
  });

  it('does not re-fire while the company merely stays frayed', () => {
    expect(crossedIntoFray('frayed', 'frayed')).toBe(false);
    expect(crossedIntoFray('breaking', 'breaking')).toBe(false);
  });

  it('does not fire on recovery or a healthy band change', () => {
    expect(crossedIntoFray('frayed', 'holding')).toBe(false);
    expect(crossedIntoFray('holding', 'bound')).toBe(false);
    expect(crossedIntoFray('bound', 'holding')).toBe(false);
  });
});

describe('composeFrayMoment', () => {
  it('resolves the {company} token and carries the chosen kind', () => {
    const moment = composeFrayMoment('The Quiet Wardens', () => 0.2); // < 0.5 → shared_spoils
    expect(moment.kind).toBe('shared_spoils');
    expect(moment.message).toContain('The Quiet Wardens');
    expect(moment.message).not.toContain('{company}');
  });

  it('draws shared-spoils lines from the shared-spoils pool', () => {
    const moment = composeFrayMoment('The Ashen Crows', () => 0.2);
    const resolved = GROUP_FRAY_SHARED_SPOILS.map(t => t.replace(/\{company\}/g, 'The Ashen Crows'));
    expect(resolved).toContain(moment.message);
  });

  it('draws old-wounds lines from the old-wounds pool', () => {
    const moment = composeFrayMoment('The Long Roads', () => 0.8); // >= 0.5 → old_wounds
    expect(moment.kind).toBe('old_wounds');
    const resolved = GROUP_FRAY_OLD_WOUNDS.map(t => t.replace(/\{company\}/g, 'The Long Roads'));
    expect(resolved).toContain(moment.message);
  });

  it('is deterministic for the same rng sequence', () => {
    const seq = () => { let i = 0; const vals = [0.3, 0.6]; return () => vals[i++ % vals.length]; };
    const a = composeFrayMoment('The Iron Vigil', seq());
    const b = composeFrayMoment('The Iron Vigil', seq());
    expect(a).toEqual(b);
  });
});

describe('phaseGroups — fray moment', () => {
  it('tells a threaded company an authored fray moment with band + raised significance', () => {
    // 0.39 sits just inside `frayed`; pre-seeded `holding` makes this tick the crossing.
    makeGroup(state, 0.39, 'holding');
    thread(state.graph, 'a1');

    const evt = frayEvent(state);
    expect(evt).toBeDefined();
    expect(['shared_spoils', 'old_wounds']).toContain(evt!.band);
    expect(evt!.significance).toBeCloseTo(GROUP_FRAY_EVENT_SIGNIFICANCE, 5);
    expect(evt!.message).not.toContain('{company}');
    expect(evt!.message.length).toBeGreaterThan(0);
  });

  it('leaves an untethered company the silent systemic line (no fray event)', () => {
    makeGroup(state, 0.39, 'holding'); // crosses, but nobody threaded

    expect(frayEvent(state)).toBeUndefined();
  });

  it('does not re-fire for a company already sitting frayed', () => {
    makeGroup(state, 0.39, 'frayed'); // already below the line last tick
    thread(state.graph, 'a1');

    expect(frayEvent(state)).toBeUndefined();
  });

  it('seeds the band silently on first observation without firing', () => {
    const id = makeGroup(state, 0.39); // no pre-seeded band
    thread(state.graph, 'a1');

    expect(frayEvent(state)).toBeUndefined();
    const stored = (state.graph.getNode(id)!.properties as Record<string, unknown>).lastCohesionState;
    expect(stored).toBe('frayed');
  });
});
