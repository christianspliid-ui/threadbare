/**
 * bless_company graph-op tests (THR-74 — Bless this Company).
 *
 * The op is the *writer* for a substrate whose consumers shipped in PR 1: it applies an
 * immediate cohesion boost and opens a dispute-suppression window (`blessedUntilTick`)
 * that `isGroupBlessed` reads in groupCohesion / groupDissolution / groupMovement. It
 * routes through `executeGraphOps` exactly as the action pipeline fires it. Assertions
 * read the mutated `cohesion` / `blessedUntilTick` properties directly.
 *
 * The load-bearing discrimination: armies share `actorType: 'group'`, so the op gates on
 * `isCompanyNode` (groupType present, no armyState) and fails soft on an army.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { executeGraphOps, resetOpCounter } from '../graphOpExecutor';
import type { GraphOpContext, GraphOp } from '../../types/graphOp';
import {
  BLESS_COMPANY_COHESION_DELTA,
  BLESS_COMPANY_DURATION_TICKS,
} from '../../data/group-constants';

const ascendantId = 'asc.player';
const companyId = 'group.watch';
const armyId = 'group.legion';
const TICK = 42;

const ctx: GraphOpContext = {
  actorId: ascendantId,
  targetId: companyId,
  locationId: companyId,
  tick: TICK,
};

function makeGraph(companyCohesion = 0.5): WorldGraph {
  const graph = new WorldGraph();
  resetOpCounter();
  graph.addNode({
    id: ascendantId,
    type: 'actor',
    name: 'The Warden',
    properties: { actorType: 'ascendant' },
  });
  graph.addNode({
    id: companyId,
    type: 'actor',
    name: 'The Watch of the Nameless Road',
    properties: { actorType: 'group', groupType: 'party', cohesion: companyCohesion },
  });
  // An army also lives as an actorType:'group' node — but carries armyState, no groupType.
  graph.addNode({
    id: armyId,
    type: 'actor',
    name: "The Iron Legion",
    properties: { actorType: 'group', armyState: { objective: 'march' } },
  });
  return graph;
}

const cohesionOf = (graph: WorldGraph, id = companyId): number | undefined =>
  graph.getNode(id)?.properties.cohesion as number | undefined;
const blessedUntilOf = (graph: WorldGraph, id = companyId): number | undefined =>
  graph.getNode(id)?.properties.blessedUntilTick as number | undefined;

const bless = (nodeId: string): GraphOp[] => [{ op: 'bless_company', nodeId }];

describe('bless_company op', () => {
  it('boosts cohesion and opens the dispute-suppression window on a company', () => {
    const graph = makeGraph(0.5);
    const result = executeGraphOps(graph, bless(companyId), ctx);

    expect(result.allSucceeded).toBe(true);
    expect(cohesionOf(graph)).toBeCloseTo(0.5 + BLESS_COMPANY_COHESION_DELTA, 6);
    expect(blessedUntilOf(graph)).toBe(TICK + BLESS_COMPANY_DURATION_TICKS);
  });

  it('clamps cohesion at 1.0 (never overshoots)', () => {
    const graph = makeGraph(0.95);
    executeGraphOps(graph, bless(companyId), ctx);
    expect(cohesionOf(graph)).toBeCloseTo(1.0, 6);
  });

  it('fails soft on an army (isCompanyNode gate) — no cohesion or window written', () => {
    const graph = makeGraph();
    const result = executeGraphOps(graph, bless(armyId), ctx);

    expect(result.allSucceeded).toBe(false);
    expect(blessedUntilOf(graph, armyId)).toBeUndefined();
  });

  it('fails soft on a missing target rather than throwing', () => {
    const graph = makeGraph();
    const result = executeGraphOps(graph, bless('group.ghost'), ctx);
    expect(result.allSucceeded).toBe(false);
  });
});
