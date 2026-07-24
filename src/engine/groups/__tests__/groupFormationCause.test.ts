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
import { runFormationScan, isUnderConvergencePull } from '../groupFormation';
import { getAllGroups } from '../groupQueries';

function makeState(graph: WorldGraph, tick = 10): GameState {
  return { graph, tick, seed: 42, tickEvents: [] } as unknown as GameState;
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

  it("attributes a company to 'systemic' when no member is under a pull", () => {
    const graph = new WorldGraph();
    twoColocatedMortals(graph); // no pull
    const state = makeState(graph, 10);
    const result = runFormationScan(state, () => 0);

    expect(result.formed.length).toBe(1);
    const group = getAllGroups(graph)[0];
    expect((group.properties.formationContext as { cause: string }).cause).toBe('systemic');
  });
});
