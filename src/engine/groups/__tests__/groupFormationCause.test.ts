/**
 * Formation cause attribution for Draw Together (THR-74).
 *
 * The `draw_together` divine nudge stamps `convergePullUntilTick` on scattered threaded
 * mortals; when they colocate and the systemic formation scan binds them, the resulting
 * company must be attributed `cause: 'draw_together'` rather than `'systemic'`. This is the
 * writer for the `draw_together` cause the trace/name generator already accept. Also covers
 * the `isUnderConvergencePull` predicate the scan reads.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../graph';
import type { GameState } from '../../../types/gameState';
import type { GraphNode } from '../../../types/graph';
import {
  runFormationScan,
  isUnderConvergencePull,
  isAgentThreaded,
  convergencePullSphere,
} from '../groupFormation';
import { getAllGroups } from '../groupQueries';

function makeState(graph: WorldGraph, tick = 10, ascendantId?: string): GameState {
  return { graph, tick, seed: 42, tickEvents: [], ascendantId } as unknown as GameState;
}

/** Thread the ascendant to `agentId` (creating the ascendant node on first use). */
function thread(graph: WorldGraph, agentId: string, ascendantId = 'asc'): void {
  if (!graph.getNode(ascendantId)) {
    graph.addNode({ id: ascendantId, type: 'actor', name: 'The Witness', properties: { actorType: 'ascendant' } });
  }
  graph.addEdge({ id: `e.thread.${agentId}`, source: ascendantId, target: agentId, type: 'thread', properties: {} });
}

/** Two colocated, compatible, spotlight individuals — a formable set. */
function twoColocatedMortals(graph: WorldGraph, opts: { pullA?: number } = {}): void {
  graph.addNode({ id: 'loc.inn', type: 'location', name: 'The Inn', properties: { locationType: 'settlement', hexCol: 5, hexRow: 5 } });
  const profile = { courage_prudence: 0 } as unknown as Record<string, number>;
  for (const id of ['a.one', 'a.two']) {
    graph.addNode({
      id,
      type: 'actor',
      name: id,
      properties: {
        actorType: 'individual',
        // matching courage_prudence → compatibility 0.45, above the 0.35 admission floor
        axiologicalProfile: profile,
        ...(id === 'a.one' && opts.pullA !== undefined ? { convergePullUntilTick: opts.pullA, convergePullHexCol: 5, convergePullHexRow: 5 } : {}),
      },
    });
    graph.addEdge({ id: `at.${id}`, source: id, target: 'loc.inn', type: 'located_at', properties: {} });
  }
}

describe('isUnderConvergencePull', () => {
  const node = (until?: number): GraphNode => ({
    id: 'n', type: 'actor', name: 'n',
    properties: until === undefined ? {} : { convergePullUntilTick: until },
  });
  it('is true while the window is open', () => {
    expect(isUnderConvergencePull(node(50), 10)).toBe(true);
  });
  it('is false once expired or absent', () => {
    expect(isUnderConvergencePull(node(50), 50)).toBe(false);
    expect(isUnderConvergencePull(node(), 10)).toBe(false);
    expect(isUnderConvergencePull(undefined, 10)).toBe(false);
  });
});

describe('runFormationScan cause attribution', () => {
  it("attributes a company to 'draw_together' when a member is under an active pull", () => {
    const graph = new WorldGraph();
    twoColocatedMortals(graph, { pullA: 100 }); // a.one under a live pull at tick 10
    const state = makeState(graph, 10);
    // rng() === 0 makes the formation chance always pass and picks a deterministic anchor.
    const result = runFormationScan(state, () => 0);

    expect(result.formed.length).toBe(1);
    const group = getAllGroups(graph)[0];
    expect((group.properties.formationContext as { cause: string }).cause).toBe('draw_together');
  });

  it("attributes a company to 'systemic' when no member is threaded or pulled", () => {
    const graph = new WorldGraph();
    twoColocatedMortals(graph); // no pull, no ascendant/thread
    const state = makeState(graph, 10);
    const result = runFormationScan(state, () => 0);

    expect(result.formed.length).toBe(1);
    expect(result.formed[0].cause).toBe('systemic');
    const group = getAllGroups(graph)[0];
    expect((group.properties.formationContext as { cause: string }).cause).toBe('systemic');
  });

  it("attributes a threaded founding to 'seeking_companions' when no pull is active", () => {
    const graph = new WorldGraph();
    twoColocatedMortals(graph);
    thread(graph, 'a.one'); // one member is the ascendant's
    const state = makeState(graph, 10, 'asc');
    const result = runFormationScan(state, () => 0);

    expect(result.formed.length).toBe(1);
    expect(result.formed[0].cause).toBe('seeking_companions');
    const group = getAllGroups(graph)[0];
    expect((group.properties.formationContext as { cause: string }).cause).toBe('seeking_companions');
  });

  it("prefers 'draw_together' over 'seeking_companions' when a threaded member is also under a pull", () => {
    const graph = new WorldGraph();
    twoColocatedMortals(graph, { pullA: 100 });
    thread(graph, 'a.one'); // both threaded AND pulled → divine nudge wins
    const state = makeState(graph, 10, 'asc');
    const result = runFormationScan(state, () => 0);

    expect(result.formed.length).toBe(1);
    expect(result.formed[0].cause).toBe('draw_together');
  });
});

describe('isAgentThreaded', () => {
  it('is true only for an agent carrying a thread edge from the given ascendant', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'm', type: 'actor', name: 'm', properties: { actorType: 'individual' } });
    expect(isAgentThreaded(graph, 'm', 'asc')).toBe(false);
    thread(graph, 'm');
    expect(isAgentThreaded(graph, 'm', 'asc')).toBe(true);
  });

  it('is false with no ascendant, or a different ascendant', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'm', type: 'actor', name: 'm', properties: { actorType: 'individual' } });
    thread(graph, 'm', 'asc');
    expect(isAgentThreaded(graph, 'm', undefined)).toBe(false);
    expect(isAgentThreaded(graph, 'm', 'other')).toBe(false);
  });
});

/**
 * `convergencePullSphere` — the read half of THR-770's Draw Together flavor hook.
 *
 * The op stamps the caster's sphere on each pulled mortal; the scan reads it back off
 * whichever member it gathered and hands it to the name generator.
 */
describe('convergencePullSphere', () => {
  const member = (id: string, props: Record<string, unknown>): GraphNode =>
    ({ id, type: 'actor', name: id, properties: { actorType: 'individual', ...props } }) as GraphNode;

  it('reads the sphere off a member whose pull is still open', () => {
    const members = [member('a', { convergePullUntilTick: 20, convergePullSphere: 'light' })];
    expect(convergencePullSphere(members, 10)).toBe('light');
  });

  it('ignores a member whose pull has expired', () => {
    // A stale stamp from an earlier, lapsed pull did not gather this company, so it
    // must not colour the name — the same predicate that attributed the cause.
    const members = [member('a', { convergePullUntilTick: 5, convergePullSphere: 'light' })];
    expect(convergencePullSphere(members, 10)).toBeUndefined();
  });

  it('skips members with an open pull but no flavor, and finds a later one that has it', () => {
    const members = [
      member('a', { convergePullUntilTick: 20 }),
      member('b', { convergePullUntilTick: 20, convergePullSphere: 'entropy' }),
    ];
    expect(convergencePullSphere(members, 10)).toBe('entropy');
  });

  it('returns undefined for an unaligned caster rather than throwing', () => {
    expect(convergencePullSphere([member('a', { convergePullUntilTick: 20 })], 10)).toBeUndefined();
    expect(convergencePullSphere([], 10)).toBeUndefined();
  });
});
