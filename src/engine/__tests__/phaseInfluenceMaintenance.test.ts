/**
 * THR-1652 — thread upkeep is charged by the tick loop, so the income readout
 * (`computeEssenceIncome`) and the pool's real per-tick change agree.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { createEmptyEssencePool } from '../influence';
import { computeEssenceIncome } from '../essenceIncome';
import { phaseEssence } from '../orchestrator';
import { phaseInfluenceMaintenance } from '../phaseInfluenceMaintenance';
import { applyEssenceEarned } from '../essenceEarned';
import type { GameState } from '../../types/gameState';
import type { EssencePool, SphereAlignment } from '../../types/influence';
import { TIER_MAINTENANCE } from '../../types/influence';
import { SPHERE_NAMES } from '../../types/index';

const ASC = 'asc.player';
const AGENT = 'agent.devoted';

function makeState(graph: WorldGraph, pool: EssencePool): GameState {
  return {
    graph,
    ascendantId: ASC,
    essencePool: pool,
    controlEffects: [],
    tick: 1,
    tickEvents: [],
  } as unknown as GameState;
}

/** phaseEssence then phaseInfluenceMaintenance — the tick loop's order. */
function runEconomyTick(state: GameState): GameState {
  let s = { ...state, ...phaseEssence(state) } as GameState;
  s = { ...s, ...phaseInfluenceMaintenance(s) } as GameState;
  return s;
}

describe('phaseInfluenceMaintenance (THR-1652)', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
    graph.addNode({
      id: ASC,
      type: 'actor',
      name: 'The Verdant One',
      properties: {
        actorType: 'ascendant',
        sphereAlignment: { primary: 'life', secondary: 'spirit' } as SphereAlignment,
      },
    });
    graph.addNode({ id: AGENT, type: 'actor', name: 'Devoted', properties: { actorType: 'individual' } });
    graph.addEdge({
      id: 'edge.thread.devoted',
      source: ASC,
      target: AGENT,
      type: 'thread',
      properties: {
        tier: 2,
        ticksAtCurrentTier: 0,
        establishedTick: 0,
        totalEssenceSpent: 0,
        maintenanceCurrent: true,
      },
    });
  });

  it('one tick with a tier-2 thread: every sphere delta equals computeEssenceIncome', () => {
    const pool = createEmptyEssencePool();
    for (const s of SPHERE_NAMES) pool[s] = 10; // headroom so upkeep is affordable
    const before = makeState(graph, pool);
    const readout = computeEssenceIncome(graph, ASC, []);

    const after = runEconomyTick(before);

    for (const s of SPHERE_NAMES) {
      expect(after.essencePool[s] - before.essencePool[s]).toBeCloseTo(readout[s], 10);
    }
    // The primary figure is net of upkeep — the thing that was never charged.
    expect(readout.life).toBeLessThan(computeGrossPrimary(graph));
  });

  it('advances ticksAtCurrentTier and keeps maintenanceCurrent when paid', () => {
    const pool = createEmptyEssencePool();
    pool.life = 10;
    const after = phaseInfluenceMaintenance(makeState(graph, pool));
    expect(after.essencePool!.life).toBeCloseTo(10 - TIER_MAINTENANCE[2], 10);
    const edge = graph.getOutgoingEdges(ASC, 'thread')[0];
    expect(edge.properties.ticksAtCurrentTier).toBe(1);
    expect(edge.properties.maintenanceCurrent).toBe(true);
  });

  it('marks the thread unpaid and leaves the pool untouched when the primary sphere cannot cover it', () => {
    const pool = createEmptyEssencePool();
    pool.life = TIER_MAINTENANCE[2] / 2;
    const after = phaseInfluenceMaintenance(makeState(graph, pool));
    expect(after.essencePool).toBeUndefined();
    const edge = graph.getOutgoingEdges(ASC, 'thread')[0];
    expect(edge.properties.maintenanceCurrent).toBe(false);
    expect(edge.properties.ticksAtCurrentTier).toBe(0);
  });

  it('fail-soft: no ascendant node or no threads is a no-op', () => {
    const pool = createEmptyEssencePool();
    const orphan = { ...makeState(graph, pool), ascendantId: 'missing' } as GameState;
    expect(phaseInfluenceMaintenance(orphan)).toEqual({});
    graph.removeEdge('edge.thread.devoted');
    expect(phaseInfluenceMaintenance(makeState(graph, pool))).toEqual({});
  });

  it('upkeep is a spend: the essence-earned counter still banks the gross income', () => {
    const pool = createEmptyEssencePool();
    for (const s of SPHERE_NAMES) pool[s] = 10;
    const s0 = makeState(graph, pool);
    const s1 = applyEssenceEarned(s0, { ...s0, ...phaseEssence(s0) } as GameState);
    const s2 = applyEssenceEarned(s1, { ...s1, ...phaseInfluenceMaintenance(s1) } as GameState);
    expect(s2.essenceEarnedBySphere?.life).toBeCloseTo(computeGrossPrimary(graph), 10);
  });
});

/** Gross primary-sphere generation (readout net + upkeep), for comparisons. */
function computeGrossPrimary(graph: WorldGraph): number {
  return computeEssenceIncome(graph, ASC, []).life + TIER_MAINTENANCE[2];
}
