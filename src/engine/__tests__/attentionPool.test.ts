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
