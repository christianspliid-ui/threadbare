import { describe, it, expect, beforeEach } from 'vitest';
import {
  evaluateMarkReveals,
  consumeMatchingMarks,
  REVEAL_PROBABILITY_MULT,
  MARK_DECAY_FLOOR,
} from '../hiddenMarks';
import { clearTraces, enableTracing, getTraces } from '../traceBuffer';
import type { GameState } from '../../types/gameState';
import type { HiddenMark } from '../../types/unifiedAction';

// ─── Fixtures ────────────────────────────────────────────────────

const MARK_INVESTIGATION: HiddenMark = {
  markId: 'mark-inv-001',
  category: 'betrayal',
  severity: 1.0,
  label: 'Betrayed the guild',
  sourceEncounterId: 'broker.quest.rival_shrine_betrayal',
  placedTick: 5,
  targetAgentId: 'agent-1',
  revealFamilies: ['investigation', 'brinewall'],
};

const MARK_LOW_SEVERITY: HiddenMark = {
  ...MARK_INVESTIGATION,
  markId: 'mark-inv-low',
  severity: 0.1,
};

const MARK_NO_FAMILIES: HiddenMark = {
  markId: 'mark-nofam-001',
  category: 'secret_knowledge',
  severity: 0.8,
  label: 'Knows the vault',
  sourceEncounterId: 'ruins.quest',
  placedTick: 5,
  targetAgentId: 'agent-1',
};

const MARK_OTHER_AGENT: HiddenMark = {
  ...MARK_INVESTIGATION,
  markId: 'mark-other-001',
  targetAgentId: 'agent-2',
};

function makeState(
  marks: HiddenMark[],
  seed = 42,
  tick = 20,
): GameState {
  return {
    hiddenMarks: marks,
    seed,
    tick,
    tickEvents: [],
    recentEvents: [],
  } as unknown as GameState;
}

beforeEach(() => { enableTracing(); clearTraces(); });

// ─── evaluateMarkReveals ─────────────────────────────────────────

describe('evaluateMarkReveals — GameState overload', () => {
  it('returns candidates matching by templateId prefix', () => {
    const state = makeState([MARK_INVESTIGATION]);
    const candidates = evaluateMarkReveals(state, 'agent-1', 'investigation.witness_account');
    expect(candidates).toHaveLength(1);
    expect(candidates[0].mark.markId).toBe('mark-inv-001');
  });

  it('returns empty for non-matching template prefix', () => {
    const state = makeState([MARK_INVESTIGATION]);
    expect(evaluateMarkReveals(state, 'agent-1', 'shadow.stealth')).toHaveLength(0);
  });

  it('returns empty for wrong agent', () => {
    const state = makeState([MARK_INVESTIGATION]);
    expect(evaluateMarkReveals(state, 'agent-2', 'investigation.audit')).toHaveLength(0);
  });

  it('returns empty for marks without revealFamilies', () => {
    const state = makeState([MARK_NO_FAMILIES]);
    expect(evaluateMarkReveals(state, 'agent-1', 'investigation.audit')).toHaveLength(0);
  });

  it('computes revealProbability = severity * REVEAL_PROBABILITY_MULT', () => {
    const state = makeState([MARK_INVESTIGATION]);
    const [candidate] = evaluateMarkReveals(state, 'agent-1', 'investigation.audit');
    expect(candidate.revealProbability).toBeCloseTo(1.0 * REVEAL_PROBABILITY_MULT);
  });

  it('clamps revealProbability to max 1.0', () => {
    const highSeverityMark: HiddenMark = { ...MARK_INVESTIGATION, severity: 2.0 };
    const state = makeState([highSeverityMark]);
    const [candidate] = evaluateMarkReveals(state, 'agent-1', 'investigation.audit');
    expect(candidate.revealProbability).toBe(1.0);
  });
});

describe('evaluateMarkReveals — marks-array overload', () => {
  it('accepts readonly HiddenMark[] directly', () => {
    const marks: readonly HiddenMark[] = [MARK_INVESTIGATION, MARK_OTHER_AGENT];
    const candidates = evaluateMarkReveals(marks, 'agent-1', 'investigation.audit');
    expect(candidates).toHaveLength(1);
    expect(candidates[0].mark.markId).toBe('mark-inv-001');
  });

  it('returns empty array for empty marks list', () => {
    expect(evaluateMarkReveals([], 'agent-1', 'investigation.audit')).toHaveLength(0);
  });
});

// ─── consumeMatchingMarks ────────────────────────────────────────

describe('consumeMatchingMarks — basic behavior', () => {
  it('returns state unchanged for undefined agentId', () => {
    const state = makeState([MARK_INVESTIGATION]);
    const result = consumeMatchingMarks(state, undefined, 'investigation.audit', 20);
    expect(result.nextState).toBe(state);
    expect(result.tracesToEmit).toHaveLength(0);
  });

  it('returns state unchanged for undefined templateId', () => {
    const state = makeState([MARK_INVESTIGATION]);
    const result = consumeMatchingMarks(state, 'agent-1', undefined, 20);
    expect(result.nextState).toBe(state);
    expect(result.tracesToEmit).toHaveLength(0);
  });

  it('returns state unchanged when no marks match', () => {
    const state = makeState([MARK_INVESTIGATION]);
    const result = consumeMatchingMarks(state, 'agent-1', 'shadow.stealth', 20);
    expect(result.nextState).toBe(state);
    expect(result.tracesToEmit).toHaveLength(0);
  });

  it('returns state unchanged for empty hiddenMarks', () => {
    const state = makeState([]);
    const result = consumeMatchingMarks(state, 'agent-1', 'investigation.audit', 20);
    expect(result.nextState).toBe(state);
    expect(result.tracesToEmit).toHaveLength(0);
  });
});

describe('consumeMatchingMarks — determinism', () => {
  it('produces the same result for the same seed + tick + markId', () => {
    const state = makeState([MARK_INVESTIGATION], 42, 20);
    const result1 = consumeMatchingMarks(state, 'agent-1', 'investigation.audit', 20);
    const result2 = consumeMatchingMarks(state, 'agent-1', 'investigation.audit', 20);
    // Both runs consumed or both did not — must be the same
    expect(result1.nextState.hiddenMarks?.length).toBe(result2.nextState.hiddenMarks?.length);
  });

  it('severity 1.0 with REVEAL_PROBABILITY_MULT=0.9 consumes mark in majority of seeded runs', () => {
    let consumed = 0;
    for (let seed = 0; seed < 50; seed++) {
      const state = makeState([MARK_INVESTIGATION], seed, 20);
      const result = consumeMatchingMarks(state, 'agent-1', 'investigation.audit', 20);
      if ((result.nextState.hiddenMarks?.length ?? 0) === 0) consumed++;
    }
    // At probability 0.9, expect close to 45/50 consumed
    expect(consumed).toBeGreaterThan(30);
  });

  it('severity 0.1 consumes mark in minority of seeded runs', () => {
    let consumed = 0;
    for (let seed = 0; seed < 50; seed++) {
      const state = makeState([MARK_LOW_SEVERITY], seed, 20);
      const result = consumeMatchingMarks(state, 'agent-1', 'investigation.audit', 20);
      if ((result.nextState.hiddenMarks?.length ?? 0) === 0) consumed++;
    }
    // At probability 0.09, expect few consumed
    expect(consumed).toBeLessThan(20);
  });
});

describe('consumeMatchingMarks — on consumption', () => {
  it('removes the consumed mark from state', () => {
    // Use seed where severity=1.0 at REVEAL_PROBABILITY_MULT=0.9 is nearly certain to consume
    let consumedState: GameState | null = null;
    for (let seed = 0; seed < 100; seed++) {
      const state = makeState([MARK_INVESTIGATION], seed, 20);
      const result = consumeMatchingMarks(state, 'agent-1', 'investigation.audit', 20);
      if ((result.nextState.hiddenMarks?.length ?? 1) === 0) {
        consumedState = result.nextState;
        break;
      }
    }
    expect(consumedState).not.toBeNull();
    expect(consumedState!.hiddenMarks).toHaveLength(0);
  });

  it('returns hidden_mark_revealed trace in tracesToEmit on consumption', () => {
    for (let seed = 0; seed < 100; seed++) {
      const state = makeState([MARK_INVESTIGATION], seed, 20);
      const result = consumeMatchingMarks(state, 'agent-1', 'investigation.audit', 20);
      if ((result.nextState.hiddenMarks?.length ?? 1) === 0) {
        expect(result.tracesToEmit).toHaveLength(1);
        expect(result.tracesToEmit[0].category).toBe('hidden_mark_revealed');
        expect((result.tracesToEmit[0] as any).revealedBy).toBe('investigation.audit');
        break;
      }
    }
  });

  it('appends a ripple_consequence chronicle event with enriched prose (THR-132)', () => {
    for (let seed = 0; seed < 100; seed++) {
      const state = makeState([MARK_INVESTIGATION], seed, 20);
      const result = consumeMatchingMarks(state, 'agent-1', 'investigation.audit', 20);
      if ((result.nextState.hiddenMarks?.length ?? 1) === 0) {
        const reveal = result.nextState.tickEvents.find(e => e.type === 'ripple_consequence');
        expect(reveal).toBeDefined();
        expect(reveal!.significance).toBe(0.7);
        // THR-132: message should NOT be the pre-prose debug string; it should
        // include the mark.label (via {mark_label} substitution) and the
        // minimal-context agent name "The marked one" (graph absent in fixture).
        expect(reveal!.message).not.toBe(`A buried truth surfaces: ${MARK_INVESTIGATION.label}`);
        expect(reveal!.message).toContain(MARK_INVESTIGATION.label);
        expect(reveal!.message).toContain('The marked one');
        // Placeholder syntax must not leak to the player
        expect(reveal!.message).not.toMatch(/\{[a-z_]+\}/);
        break;
      }
    }
  });

  it('does not consume mark that does not match templateId prefix', () => {
    const state = makeState([MARK_INVESTIGATION], 42, 20);
    const result = consumeMatchingMarks(state, 'agent-1', 'shadow.stealth', 20);
    expect(result.nextState.hiddenMarks).toHaveLength(1);
  });

  it('leaves other marks untouched when one is consumed', () => {
    const secondMark: HiddenMark = {
      markId: 'mark-inv-002',
      category: 'debt',
      severity: 0.5,
      label: 'Guild debt',
      sourceEncounterId: 'merchant.quest',
      placedTick: 5,
      targetAgentId: 'agent-1',
      revealFamilies: ['merchant'],
    };
    for (let seed = 0; seed < 100; seed++) {
      const state = makeState([MARK_INVESTIGATION, secondMark], seed, 20);
      const result = consumeMatchingMarks(state, 'agent-1', 'investigation.audit', 20);
      if ((result.nextState.hiddenMarks?.length ?? 2) === 1) {
        // Investigation mark consumed, merchant mark stays
        expect(result.nextState.hiddenMarks![0].markId).toBe('mark-inv-002');
        break;
      }
    }
  });
});

describe('consumeMatchingMarks — below decay floor severity', () => {
  it('correctly handles mark with severity below 1.0 * MARK_DECAY_FLOOR', () => {
    const tinyMark: HiddenMark = {
      ...MARK_INVESTIGATION,
      severity: MARK_DECAY_FLOOR / 2,
    };
    // revealProbability = (MARK_DECAY_FLOOR/2) * 0.9 — very low, rarely fires
    const state = makeState([tinyMark], 42, 20);
    const result = consumeMatchingMarks(state, 'agent-1', 'investigation.audit', 20);
    // Should not throw; may or may not consume — just verify no crash
    expect(result.nextState).toBeDefined();
    expect(Array.isArray(result.tracesToEmit)).toBe(true);
  });
});
