import { describe, it, expect, beforeEach } from 'vitest';
import { phaseHiddenMarkDecay } from '../phaseHiddenMarkDecay';
import { clearTraces, enableTracing, getTraces } from '../traceBuffer';
import {
  MARK_DECAY_GRACE_TICKS,
  MARK_DECAY_PER_TICK,
  MARK_DECAY_FLOOR,
  DECAY_EVENT_SIGNIFICANCE,
} from '../hiddenMarks';
import type { GameState } from '../../types/gameState';
import type { HiddenMark } from '../../types/unifiedAction';

function makeState(marks: HiddenMark[], tick: number): GameState {
  return { hiddenMarks: marks, tick, seed: 42, tickEvents: [], recentEvents: [] } as unknown as GameState;
}

function makeMark(overrides: Partial<HiddenMark> = {}): HiddenMark {
  return {
    markId: 'mark-001',
    category: 'betrayal',
    severity: 0.5,
    label: 'Test mark',
    sourceEncounterId: 'test.encounter',
    placedTick: 0,
    targetAgentId: 'agent-1',
    revealFamilies: ['investigation'],
    ...overrides,
  };
}

beforeEach(() => { enableTracing(); clearTraces(); });

describe('phaseHiddenMarkDecay — fast-path', () => {
  it('returns empty object for undefined hiddenMarks', () => {
    const state = { tick: 30 } as unknown as GameState;
    expect(phaseHiddenMarkDecay(state)).toEqual({});
  });

  it('returns empty object for empty hiddenMarks array', () => {
    const state = makeState([], 30);
    expect(phaseHiddenMarkDecay(state)).toEqual({});
  });

  it('returns empty object when no marks have changed', () => {
    // Mark within grace period — no change expected
    const mark = makeMark({ placedTick: 25 });
    const state = makeState([mark], 30); // age = 5, grace = 20
    expect(phaseHiddenMarkDecay(state)).toEqual({});
  });
});

describe('phaseHiddenMarkDecay — grace period', () => {
  it('does not decay marks within MARK_DECAY_GRACE_TICKS of placement', () => {
    const mark = makeMark({ placedTick: 10, severity: 0.5 });
    const state = makeState([mark], 10 + MARK_DECAY_GRACE_TICKS - 1);
    const result = phaseHiddenMarkDecay(state);
    // No change — grace not expired
    expect(result).toEqual({});
  });

  it('starts decaying at exactly MARK_DECAY_GRACE_TICKS ticks of age', () => {
    const mark = makeMark({ placedTick: 10, severity: 0.5 });
    const state = makeState([mark], 10 + MARK_DECAY_GRACE_TICKS);
    const result = phaseHiddenMarkDecay(state);
    expect(result.hiddenMarks).toBeDefined();
    const decayed = result.hiddenMarks![0];
    expect(decayed.severity).toBeCloseTo(0.5 * (1 - MARK_DECAY_PER_TICK));
  });
});

describe('phaseHiddenMarkDecay — severity reduction', () => {
  it('reduces severity by MARK_DECAY_PER_TICK fraction each tick past grace', () => {
    const mark = makeMark({ placedTick: 0, severity: 1.0 });
    const state = makeState([mark], MARK_DECAY_GRACE_TICKS);
    const result = phaseHiddenMarkDecay(state);
    expect(result.hiddenMarks![0].severity).toBeCloseTo(1.0 * (1 - MARK_DECAY_PER_TICK));
  });

  it('preserves markId and all other fields during decay', () => {
    const mark = makeMark({ placedTick: 0, severity: 0.5 });
    const state = makeState([mark], MARK_DECAY_GRACE_TICKS);
    const result = phaseHiddenMarkDecay(state);
    const decayed = result.hiddenMarks![0];
    expect(decayed.markId).toBe('mark-001');
    expect(decayed.category).toBe('betrayal');
    expect(decayed.targetAgentId).toBe('agent-1');
    expect(decayed.revealFamilies).toEqual(['investigation']);
  });
});

describe('phaseHiddenMarkDecay — floor removal', () => {
  it('removes mark when decayed severity falls below MARK_DECAY_FLOOR', () => {
    // severity just above floor but after one decay step it falls below
    const aboveFloor = MARK_DECAY_FLOOR * 1.005; // one step will drop it below
    const mark = makeMark({ placedTick: 0, severity: aboveFloor });
    const state = makeState([mark], MARK_DECAY_GRACE_TICKS);
    const result = phaseHiddenMarkDecay(state);
    expect(result.hiddenMarks).toHaveLength(0);
  });

  it('emits hidden_mark_revealed trace with revealedBy: decay:severity_floor', () => {
    const aboveFloor = MARK_DECAY_FLOOR * 1.005;
    const mark = makeMark({ placedTick: 0, severity: aboveFloor });
    const state = makeState([mark], MARK_DECAY_GRACE_TICKS);
    phaseHiddenMarkDecay(state);
    const traces = getTraces().filter(t => t.category === 'hidden_mark_revealed');
    expect(traces).toHaveLength(1);
    expect((traces[0] as any).revealedBy).toBe('decay:severity_floor');
  });

  it('does NOT emit trace when mark is still above floor', () => {
    const mark = makeMark({ placedTick: 0, severity: 0.5 });
    const state = makeState([mark], MARK_DECAY_GRACE_TICKS);
    phaseHiddenMarkDecay(state);
    const traces = getTraces().filter(t => t.category === 'hidden_mark_revealed');
    expect(traces).toHaveLength(0);
  });

  it('appends a chronicle event with DECAY_EVENT_SIGNIFICANCE when mark decays (THR-132)', () => {
    const aboveFloor = MARK_DECAY_FLOOR * 1.005;
    const mark = makeMark({ placedTick: 0, severity: aboveFloor, label: 'the old debt to the guild' });
    const state = makeState([mark], MARK_DECAY_GRACE_TICKS);
    const result = phaseHiddenMarkDecay(state);
    expect(result.tickEvents).toBeDefined();
    expect(result.tickEvents!.length).toBeGreaterThan(0);
    const decayEvent = result.tickEvents!.find(e => e.type === 'ripple_consequence');
    expect(decayEvent).toBeDefined();
    expect(decayEvent!.significance).toBe(DECAY_EVENT_SIGNIFICANCE);
    // Enriched prose — label present, no placeholder leaks.
    expect(decayEvent!.message).toContain('the old debt to the guild');
    expect(decayEvent!.message).not.toMatch(/\{[a-z_]+\}/);
  });

  it('decay chronicle message differs from encounter-reveal message for the same category', async () => {
    const { consumeMatchingMarks } = await import('../hiddenMarks');
    const aboveFloor = MARK_DECAY_FLOOR * 1.005;
    const mark = makeMark({ placedTick: 0, severity: aboveFloor, category: 'betrayal' });
    const decayState = makeState([mark], MARK_DECAY_GRACE_TICKS);
    const decayResult = phaseHiddenMarkDecay(decayState);
    const decayMsg = decayResult.tickEvents!.find(e => e.type === 'ripple_consequence')!.message;

    // Encounter-consume path: high-severity mark on matching template, loop seeds until consumed.
    const revealMark: HiddenMark = { ...mark, severity: 1.0, revealFamilies: ['investigation'] };
    let encounterMsg: string | null = null;
    for (let seed = 0; seed < 100; seed++) {
      const state = { hiddenMarks: [revealMark], tick: 20, seed, tickEvents: [], recentEvents: [] } as unknown as GameState;
      const result = consumeMatchingMarks(state, 'agent-1', 'investigation.audit', 20);
      if ((result.nextState.hiddenMarks?.length ?? 1) === 0) {
        encounterMsg = result.nextState.tickEvents.find(e => e.type === 'ripple_consequence')!.message;
        break;
      }
    }
    expect(encounterMsg).not.toBeNull();
    expect(encounterMsg).not.toBe(decayMsg);
  });
});

describe('phaseHiddenMarkDecay — multi-mark', () => {
  it('processes multiple marks independently', () => {
    const markInGrace = makeMark({ markId: 'mark-grace', placedTick: 100, severity: 0.8 });
    const markDecaying = makeMark({ markId: 'mark-decay', placedTick: 0, severity: 0.3 });
    const aboveFloor = MARK_DECAY_FLOOR * 1.005;
    const markExpiring = makeMark({ markId: 'mark-expire', placedTick: 0, severity: aboveFloor });

    const tick = MARK_DECAY_GRACE_TICKS + 5;
    const state = makeState([markInGrace, markDecaying, markExpiring], tick);
    const result = phaseHiddenMarkDecay(state);

    // markInGrace: age < grace → unchanged → still present at original severity
    // markDecaying: age >= grace → decayed
    // markExpiring: age >= grace → dropped
    expect(result.hiddenMarks?.length).toBe(2);
    const grace = result.hiddenMarks!.find(m => m.markId === 'mark-grace');
    const decaying = result.hiddenMarks!.find(m => m.markId === 'mark-decay');
    expect(grace?.severity).toBe(0.8); // unchanged
    expect(decaying?.severity).toBeCloseTo(0.3 * (1 - MARK_DECAY_PER_TICK));
  });

  it('returns empty object when all marks are in grace (no change)', () => {
    const m1 = makeMark({ markId: 'a', placedTick: 100 });
    const m2 = makeMark({ markId: 'b', placedTick: 110 });
    const state = makeState([m1, m2], 115);
    expect(phaseHiddenMarkDecay(state)).toEqual({});
  });
});
