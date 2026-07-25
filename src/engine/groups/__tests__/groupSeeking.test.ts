/**
 * Seeking Companions tests — THR-74.
 *
 * A threaded company's founding is an authored moment (eager / wary, chosen by
 * starting cohesion); an untethered — or divine-nudged — founding stays the silent
 * systemic line. Covers the pure variant selector, the compose logic, and the
 * phaseGroups integration that decides which founding the feed carries as a moment.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../../graph';
import type { GameState } from '../../../types/gameState';
import { selectSeekingVariant, composeSeekingMoment } from '../groupSeeking';
import { phaseGroups, resetGroupEventCounter } from '../phaseGroups';
import {
  GROUP_SEEKING_EAGER,
  GROUP_SEEKING_WARY,
} from '../../../data/group-formation-content';
import {
  GROUP_SEEKING_EVENT_SIGNIFICANCE,
  GROUP_SEEKING_EAGER_MIN_COHESION,
} from '../../../data/group-constants';

/** The untethered-founding significance (module-local `GROUP_EVENT_SIGNIFICANCE` in phaseGroups). */
const SYSTEMIC_FOUNDING_SIGNIFICANCE = 0.55;

// ─── Pure composer ───────────────────────────────────────────────────

describe('selectSeekingVariant', () => {
  it('is eager at or above the start-base split, wary below', () => {
    expect(selectSeekingVariant(GROUP_SEEKING_EAGER_MIN_COHESION)).toBe('eager');
    expect(selectSeekingVariant(GROUP_SEEKING_EAGER_MIN_COHESION + 0.1)).toBe('eager');
    expect(selectSeekingVariant(GROUP_SEEKING_EAGER_MIN_COHESION - 0.01)).toBe('wary');
  });
});

describe('composeSeekingMoment', () => {
  it('resolves the {company} token and carries the chosen variant', () => {
    const moment = composeSeekingMoment('The Gilded Vow', 0.7, () => 0);
    expect(moment.variant).toBe('eager');
    expect(moment.message).toContain('The Gilded Vow');
    expect(moment.message).not.toContain('{company}');
  });

  it('draws eager lines from the eager pool', () => {
    const moment = composeSeekingMoment('The Bright Company', 0.9, () => 0.2);
    const resolved = GROUP_SEEKING_EAGER.map(t => t.replace(/\{company\}/g, 'The Bright Company'));
    expect(resolved).toContain(moment.message);
  });

  it('draws wary lines from the wary pool', () => {
    const moment = composeSeekingMoment('The Wary Few', 0.3, () => 0.5); // below split → wary
    expect(moment.variant).toBe('wary');
    const resolved = GROUP_SEEKING_WARY.map(t => t.replace(/\{company\}/g, 'The Wary Few'));
    expect(resolved).toContain(moment.message);
  });

  it('is deterministic for the same rng sequence', () => {
    const seq = () => { let i = 0; const vals = [0.4, 0.7]; return () => vals[i++ % vals.length]; };
    const a = composeSeekingMoment('The Iron Vigil', 0.8, seq());
    const b = composeSeekingMoment('The Iron Vigil', 0.8, seq());
    expect(a).toEqual(b);
  });
});

// ─── phaseGroups integration ─────────────────────────────────────────

function makeState(graph: WorldGraph, tick: number, ascendantId = 'asc'): GameState {
  return { graph, tick, seed: 42, tickEvents: [], ascendantId } as unknown as GameState;
}

/** Two colocated, compatible, group-eligible mortals at a tavern (multiplies the roll). */
function twoAtTavern(graph: WorldGraph): void {
  graph.addNode({ id: 'asc', type: 'actor', name: 'The Witness', properties: { actorType: 'ascendant' } });
  graph.addNode({
    id: 'loc.tavern',
    type: 'location',
    name: 'The Sign of the Stag',
    properties: { locationType: 'settlement', sublocationType: 'tavern', hexCol: 5, hexRow: 5 },
  });
  const profile = { courage_prudence: 0 } as unknown as Record<string, number>;
  for (const id of ['a.one', 'a.two']) {
    graph.addNode({
      id,
      type: 'actor',
      name: id,
      properties: { actorType: 'individual', spotlightTier: 'spotlight', axiologicalProfile: profile },
    });
    graph.addEdge({ id: `at.${id}`, source: id, target: 'loc.tavern', type: 'located_at', properties: {} });
  }
}

function thread(g: WorldGraph, agentId: string): void {
  g.addEdge({ id: `e.thread.${agentId}`, source: 'asc', target: agentId, type: 'thread', properties: {} });
}

/** Advance phaseGroups tick-by-tick until a company forms; return the founding event. */
function runUntilFormed(graph: WorldGraph, ascendantId = 'asc') {
  for (let tick = 1; tick <= 300; tick++) {
    const state = makeState(graph, tick, ascendantId);
    const out = phaseGroups(state);
    const formed = (out.tickEvents ?? []).find(e => e.type === 'group_formed');
    if (formed) return formed;
  }
  return undefined;
}

describe('phaseGroups — Seeking Companions moment', () => {
  beforeEach(() => resetGroupEventCounter());

  it('tells a threaded founding an authored moment with band + raised significance', () => {
    const graph = new WorldGraph();
    twoAtTavern(graph);
    thread(graph, 'a.one');

    const evt = runUntilFormed(graph);
    expect(evt).toBeDefined();
    expect(['eager', 'wary']).toContain(evt!.band);
    expect(evt!.significance).toBeCloseTo(GROUP_SEEKING_EVENT_SIGNIFICANCE, 5);
    expect(evt!.message).not.toContain('{company}');
    expect(evt!.message.length).toBeGreaterThan(0);
  });

  it('leaves an untethered founding the silent systemic line (no band)', () => {
    const graph = new WorldGraph();
    twoAtTavern(graph); // nobody threaded

    const evt = runUntilFormed(graph);
    expect(evt).toBeDefined();
    expect(evt!.band).toBeUndefined();
    expect(evt!.significance).toBeCloseTo(SYSTEMIC_FOUNDING_SIGNIFICANCE, 5);
    expect(evt!.message).toContain('sets out together');
  });
});
