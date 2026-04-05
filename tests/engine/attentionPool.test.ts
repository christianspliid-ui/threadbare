import { describe, it, expect } from 'vitest';
import { regenAttention, spendAttention, getAttentionVisualState, computeAttendCost } from '../../src/engine/attentionPool';
import type { AscendantAttentionState } from '../../src/types/attention';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeState(pool: number, capacity = 6, regen = 0.4): AscendantAttentionState {
  return { attentionPool: pool, attentionCapacity: capacity, attentionRegen: regen };
}

// ─── regenAttention ───────────────────────────────────────────────────────────

describe('regenAttention', () => {
  it('adds regen and caps at capacity (5.8 + 0.4 = 6.0, not 6.2)', () => {
    const result = regenAttention(makeState(5.8));
    expect(result.attentionPool).toBeCloseTo(6.0);
  });

  it('regens normally below cap (3.0 + 0.4 = 3.4)', () => {
    const result = regenAttention(makeState(3.0));
    expect(result.attentionPool).toBeCloseTo(3.4);
  });

  it('at capacity stays at capacity', () => {
    const result = regenAttention(makeState(6.0));
    expect(result.attentionPool).toBeCloseTo(6.0);
  });

  it('returns a new state object (immutable)', () => {
    const original = makeState(3.0);
    const result = regenAttention(original);
    expect(result).not.toBe(original);
    expect(original.attentionPool).toBe(3.0);
  });
});

// ─── spendAttention ───────────────────────────────────────────────────────────

describe('spendAttention', () => {
  it('deducts cost (5.0 - 1.5 = 3.5)', () => {
    const result = spendAttention(makeState(5.0), 1.5);
    expect(result.attentionPool).toBeCloseTo(3.5);
  });

  it('clamps at zero (0.5 - 2.0 = 0, not -1.5)', () => {
    const result = spendAttention(makeState(0.5), 2.0);
    expect(result.attentionPool).toBe(0);
  });

  it('returns a new state object (immutable)', () => {
    const original = makeState(5.0);
    const result = spendAttention(original, 1.5);
    expect(result).not.toBe(original);
    expect(original.attentionPool).toBe(5.0);
  });
});

// ─── getAttentionVisualState ──────────────────────────────────────────────────

describe('getAttentionVisualState', () => {
  it('4.0/6.0 = 67% → focused', () => {
    expect(getAttentionVisualState(makeState(4.0))).toBe('focused');
  });

  it('2.5/6.0 = 42% → busy', () => {
    expect(getAttentionVisualState(makeState(2.5))).toBe('busy');
  });

  it('1.0/6.0 = 17% → strained', () => {
    expect(getAttentionVisualState(makeState(1.0))).toBe('strained');
  });

  it('0.3/6.0 = 5% → overwhelmed', () => {
    expect(getAttentionVisualState(makeState(0.3))).toBe('overwhelmed');
  });

  it('exactly at focused threshold (0.6) → focused', () => {
    // ratio = 3.6/6.0 = 0.6 — boundary is > 0.6 so this should be busy
    expect(getAttentionVisualState(makeState(3.6))).toBe('busy');
  });

  it('exactly at busy threshold (0.3) → strained', () => {
    // ratio = 1.8/6.0 = 0.3 — boundary is > 0.3 so this should be strained
    expect(getAttentionVisualState(makeState(1.8))).toBe('strained');
  });

  it('exactly at strained threshold (0.1) → overwhelmed', () => {
    // ratio = 0.6/6.0 = 0.1 — boundary is > 0.1 so this should be overwhelmed
    expect(getAttentionVisualState(makeState(0.6))).toBe('overwhelmed');
  });
});

// ─── computeAttendCost ────────────────────────────────────────────────────────

describe('computeAttendCost', () => {
  it('moderate + the_first: 1.0 * 0.5 = 0.5', () => {
    expect(computeAttendCost('moderate', 'the_first')).toBeCloseTo(0.5);
  });

  it('hard + watched: 1.5 * 1.5 = 2.25', () => {
    expect(computeAttendCost('hard', 'watched')).toBeCloseTo(2.25);
  });

  it('moderate + retinue: 1.0 * 1.0 = 1.0', () => {
    expect(computeAttendCost('moderate', 'retinue')).toBeCloseTo(1.0);
  });

  it('story_beat + the_first: 2.0 * 0.5 = 1.0', () => {
    expect(computeAttendCost('story_beat', 'the_first')).toBeCloseTo(1.0);
  });

  it('deadly + retinue: 1.5 * 1.0 = 1.5 (deadly treated same as hard)', () => {
    expect(computeAttendCost('deadly', 'retinue')).toBeCloseTo(1.5);
  });
});
