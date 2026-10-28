import { describe, it, expect } from 'vitest';
import {
  regenAttention,
  spendAttention,
  getAttentionVisualState,
  computeAttendCost,
} from '../attentionPool';
import type { AscendantAttentionState } from '../../types/attention';
import {
  ATTENTION_BASE_CAPACITY,
  ATTENTION_BASE_REGEN,
  ATTEND_COST_MODERATE,
  ATTEND_COST_HARD,
  ATTEND_COST_STORY_BEAT,
  COURT_COST_MULTIPLIER_FIRST,
  COURT_COST_MULTIPLIER_RETINUE,
  COURT_COST_MULTIPLIER_WATCHED,
} from '../../data/attention-constants';

function makePool(pool: number, capacity = ATTENTION_BASE_CAPACITY, regen = ATTENTION_BASE_REGEN): AscendantAttentionState {
  return { attentionPool: pool, attentionCapacity: capacity, attentionRegen: regen };
}

// ── regenAttention ─────────────────────────────────────────────────────────────

describe('regenAttention', () => {
  it('increases the pool by the regen amount', () => {
    const state = makePool(3, 6, 0.4);
    const next = regenAttention(state);
    expect(next.attentionPool).toBeCloseTo(3.4);
  });

  it('does not exceed capacity', () => {
    const state = makePool(5.9, 6, 0.4);
    const next = regenAttention(state);
    expect(next.attentionPool).toBe(6);
  });

  it('does not mutate the input', () => {
    const state = makePool(3, 6, 0.4);
    regenAttention(state);
    expect(state.attentionPool).toBe(3);
  });

  it('works when pool is already at capacity', () => {
    const state = makePool(6, 6, 0.4);
    const next = regenAttention(state);
    expect(next.attentionPool).toBe(6);
  });

  it('works when pool is empty', () => {
    const state = makePool(0, 6, 0.4);
    const next = regenAttention(state);
    expect(next.attentionPool).toBeCloseTo(0.4);
  });
});

// ── spendAttention ────────────────────────────────────────────────────────────

describe('spendAttention', () => {
  it('decreases the pool by the cost', () => {
    const state = makePool(4, 6, 0.4);
    const next = spendAttention(state, 1.5);
    expect(next.attentionPool).toBeCloseTo(2.5);
  });

  it('clamps at 0, never goes negative', () => {
    const state = makePool(1, 6, 0.4);
    const next = spendAttention(state, 5);
    expect(next.attentionPool).toBe(0);
  });

  it('does not mutate the input', () => {
    const state = makePool(4, 6, 0.4);
    spendAttention(state, 1);
    expect(state.attentionPool).toBe(4);
  });

  it('handles zero cost (no-op)', () => {
    const state = makePool(4, 6, 0.4);
    const next = spendAttention(state, 0);
    expect(next.attentionPool).toBe(4);
  });
});

// ── getAttentionVisualState ───────────────────────────────────────────────────

describe('getAttentionVisualState', () => {
  it('returns focused when pool is full', () => {
    expect(getAttentionVisualState(makePool(6, 6))).toBe('focused');
  });

  it('returns focused when ratio > 0.6', () => {
    expect(getAttentionVisualState(makePool(4.2, 6))).toBe('focused');
  });

  it('returns busy when ratio is between 0.3 and 0.6', () => {
    expect(getAttentionVisualState(makePool(2.4, 6))).toBe('busy');
    expect(getAttentionVisualState(makePool(3.5, 6))).toBe('busy');
  });

  it('returns strained when ratio is between 0.1 and 0.3', () => {
    expect(getAttentionVisualState(makePool(1.2, 6))).toBe('strained');
  });

  it('returns overwhelmed when ratio <= 0.1', () => {
    expect(getAttentionVisualState(makePool(0.5, 6))).toBe('overwhelmed');
    expect(getAttentionVisualState(makePool(0, 6))).toBe('overwhelmed');
  });

  it('returns overwhelmed when capacity is 0 (division guard)', () => {
    expect(getAttentionVisualState(makePool(0, 0))).toBe('overwhelmed');
  });
});

// ── computeAttendCost ─────────────────────────────────────────────────────────

describe('computeAttendCost', () => {
  it('applies court multiplier to base cost', () => {
    const cost = computeAttendCost('moderate', 'the_first');
    expect(cost).toBeCloseTo(ATTEND_COST_MODERATE * COURT_COST_MULTIPLIER_FIRST);
  });

  it('retinue at moderate threat matches expected constant product', () => {
    const cost = computeAttendCost('moderate', 'retinue');
    expect(cost).toBeCloseTo(ATTEND_COST_MODERATE * COURT_COST_MULTIPLIER_RETINUE);
  });

  it('watched at hard threat matches expected constant product', () => {
    const cost = computeAttendCost('hard', 'watched');
    expect(cost).toBeCloseTo(ATTEND_COST_HARD * COURT_COST_MULTIPLIER_WATCHED);
  });

  it('story beat uses story beat base cost', () => {
    const cost = computeAttendCost('story_beat', 'retinue');
    expect(cost).toBeCloseTo(ATTEND_COST_STORY_BEAT * COURT_COST_MULTIPLIER_RETINUE);
  });

  it('deadly shares the hard base cost', () => {
    const hard = computeAttendCost('hard', 'retinue');
    const deadly = computeAttendCost('deadly', 'retinue');
    expect(deadly).toBeCloseTo(hard);
  });

  it('the_first court position is cheaper than retinue (high discount)', () => {
    const first   = computeAttendCost('moderate', 'the_first');
    const retinue = computeAttendCost('moderate', 'retinue');
    expect(first).toBeLessThan(retinue);
  });

  it('watched is more expensive than retinue', () => {
    const retinue = computeAttendCost('moderate', 'retinue');
    const watched = computeAttendCost('moderate', 'watched');
    expect(watched).toBeGreaterThan(retinue);
  });
});

// ── THR-2062: tugAttendCost, attendThreadTug, attentionCanBeSpent ──────────────

import { tugAttendCost, attendThreadTug, attentionCanBeSpent } from '../attentionPool';
import { WorldGraph } from '../graph';
import type { ThreadTug } from '../../types/attention';
import { LIVELIHOOD_TUG_ATTEND_COST } from '../../data/attention-constants';

function tug(overrides: Partial<ThreadTug> = {}): ThreadTug {
  return {
    id: 'tug_1', agentId: 'mortal', encounterId: 'ua_1', actionId: 'ua_1',
    reachPrimary: 'iron', threatLevel: 'hard', courtPosition: 'retinue',
    createdTick: 10, expiresTick: 13, attended: false, curationScore: 1,
    ...overrides,
  } as ThreadTug;
}

function graphWithPool(pool: number, threads: Array<Record<string, unknown>> = []): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'asc', type: 'actor', name: 'Asc', properties: { actorType: 'ascendant', attentionPool: pool, attentionCapacity: 6, attentionRegen: 0.4 } });
  threads.forEach((props, i) => {
    graph.addNode({ id: `m${i}`, type: 'actor', name: `m${i}`, properties: { actorType: 'individual' } });
    graph.addEdge({ id: `t${i}`, type: 'thread', source: 'asc', target: `m${i}`, properties: props });
  });
  return graph;
}

describe('tugAttendCost', () => {
  it('prices a chapter tug by threat and court position', () => {
    expect(tugAttendCost(tug())).toBeCloseTo(computeAttendCost('hard', 'retinue'));
  });
  it('a livelihood tug costs LIVELIHOOD_TUG_ATTEND_COST', () => {
    expect(tugAttendCost(tug({ kind: 'livelihood' }))).toBe(LIVELIHOOD_TUG_ATTEND_COST);
  });
});

describe('attendThreadTug', () => {
  it('spends the price, writes the pool, and marks the tug attended', () => {
    const graph = graphWithPool(6);
    const result = attendThreadTug({ graph, ascendantId: 'asc', activeThreadTugs: [tug()], tick: 11 }, 'tug_1');
    const cost = computeAttendCost('hard', 'retinue');
    expect(result).not.toBeNull();
    expect(result!.cost).toBeCloseTo(cost);
    expect(result!.pool).toBeCloseTo(6 - cost);
    expect(graph.getNode('asc')!.properties.attentionPool).toBeCloseTo(6 - cost);
    expect(result!.activeThreadTugs[0].attended).toBe(true);
  });

  it('refuses when the pool cannot cover it, and spends nothing', () => {
    const graph = graphWithPool(0.1);
    expect(attendThreadTug({ graph, ascendantId: 'asc', activeThreadTugs: [tug()], tick: 11 }, 'tug_1')).toBeNull();
    expect(graph.getNode('asc')!.properties.attentionPool).toBe(0.1);
  });

  it('returns null for an unknown, attended or lapsed tug, or a missing ascendant', () => {
    const graph = graphWithPool(6);
    expect(attendThreadTug({ graph, ascendantId: 'asc', activeThreadTugs: [tug()], tick: 11 }, 'nope')).toBeNull();
    expect(attendThreadTug({ graph, ascendantId: 'asc', activeThreadTugs: [tug({ attended: true })], tick: 11 }, 'tug_1')).toBeNull();
    expect(attendThreadTug({ graph, ascendantId: 'asc', activeThreadTugs: [tug()], tick: 13 }, 'tug_1')).toBeNull();
    expect(attendThreadTug({ graph, ascendantId: 'ghost', activeThreadTugs: [tug()], tick: 11 }, 'tug_1')).toBeNull();
    expect(graph.getNode('asc')!.properties.attentionPool).toBe(6);
  });

  it('answers a free livelihood tug even with an empty pool', () => {
    const graph = graphWithPool(0);
    const result = attendThreadTug({ graph, ascendantId: 'asc', activeThreadTugs: [tug({ kind: 'livelihood' })], tick: 11 }, 'tug_1');
    expect(result?.cost).toBe(0);
    expect(graph.getNode('asc')!.properties.attentionPool).toBe(0);
  });
});

describe('attentionCanBeSpent', () => {
  it('false with The First alone on Asks you', () => {
    expect(attentionCanBeSpent(graphWithPool(6, [{ courtPosition: 'the_first' }]), 'asc')).toBe(false);
  });
  it('true once a mortal is on Lives on', () => {
    expect(attentionCanBeSpent(graphWithPool(6, [{ courtPosition: 'the_first' }, { courtPosition: 'retinue', attentionMode: 'auto_resolve' }]), 'asc')).toBe(true);
    expect(attentionCanBeSpent(graphWithPool(6, [{ courtPosition: 'the_first', attentionMode: 'auto_resolve' }]), 'asc')).toBe(true);
  });
  it('false for a dormant thread or no threads', () => {
    expect(attentionCanBeSpent(graphWithPool(6, [{ courtPosition: 'dormant', attentionMode: 'auto_resolve' }]), 'asc')).toBe(false);
    expect(attentionCanBeSpent(graphWithPool(6), 'asc')).toBe(false);
  });
});
