/**
 * The agency census verdict (THR-2213) — `agencyVerdict` is the whole judgment the census
 * makes, so it is pinned on hand-built arm results: identical arms give 0 headline
 * differences, and each headline outcome H1–H5 flipped alone gives exactly 1.
 */
import { describe, it, expect } from 'vitest';
import {
  agencyVerdict, agencyNotMeasured, agencyReport, agencyEndingPredicate,
  AGENCY_COMPARE_TICK, AGENCY_MANDATE_DELTA, AGENCY_END_TICK_DELTA,
  type AgencyArmResult, type AgencySnapshot,
} from '../agency-verdict';

function snap(over: Partial<AgencySnapshot> = {}): AgencySnapshot {
  return {
    tick: AGENCY_COMPARE_TICK, phase: 'playing', doomStage: 1, mandateProgress: 0.3,
    mandateCompleted: false, firstFate: 'living', apotheosis: false,
    firstChapterIds: ['a:success', 'b:failure'], bands: { success: 1, failure: 1 }, essenceTotal: 10, ...over,
  };
}

function arm(armName: 'none' | 'greedy', over: Partial<AgencySnapshot> = {}, ranTo = AGENCY_COMPARE_TICK, stopReason = 'ticks'): AgencyArmResult {
  return { seed: 42, arm: armName, ranTo, stopReason, heldSteps: 5, cardsPlayed: armName === 'greedy' ? 3 : 0, end: snap({ tick: ranTo, ...over }), snaps: [] };
}

describe('agencyVerdict', () => {
  it('identical arms give 0 headline differences and full chapter overlap', () => {
    const v = agencyVerdict(arm('none'), arm('greedy'));
    expect(v.headlineDiffs).toBe(0);
    expect(v.mattered).toBe(false);
    expect(v.diagnostics.chapterTemplateOverlap).toBe(1);
  });

  it('H1 — a different clock ending the age counts once', () => {
    const ended = { phase: 'ended', mandateCompleted: true };
    const v = agencyVerdict(arm('none'), arm('greedy', ended));
    expect(v.headlineDiffs).toBe(1);
    expect(v.diffs[0]).toMatch(/^ending none→mandate/);
  });

  it('H1 — the same ending a season or more apart counts once', () => {
    const ended = { phase: 'ended' };
    const v = agencyVerdict(arm('none', ended, 500), arm('greedy', ended, 500 + AGENCY_END_TICK_DELTA));
    expect(v.headlineDiffs).toBe(1);
    expect(v.diffs[0]).toMatch(/^age end/);
  });

  it('H2 — the First\'s fate counts once', () => {
    const v = agencyVerdict(arm('none'), arm('greedy', { firstFate: 'dead' }));
    expect(v.headlineDiffs).toBe(1);
    expect(v.diffs[0]).toMatch(/^First/);
  });

  it('H3 — the Apotheosis counts once', () => {
    const v = agencyVerdict(arm('none'), arm('greedy', { apotheosis: true }));
    expect(v.headlineDiffs).toBe(1);
    expect(v.diffs[0]).toMatch(/^Apotheosis/);
  });

  it('H4 — Mandate progress at the delta counts once; below it does not', () => {
    const at = agencyVerdict(arm('none'), arm('greedy', { mandateProgress: 0.3 + AGENCY_MANDATE_DELTA + 0.001 }));
    expect(at.headlineDiffs).toBe(1);
    expect(at.diffs[0]).toMatch(/^Mandate/);
    const below = agencyVerdict(arm('none'), arm('greedy', { mandateProgress: 0.3 + AGENCY_MANDATE_DELTA / 2 }));
    expect(below.headlineDiffs).toBe(0);
  });

  it('H5 — the Doom stage counts once', () => {
    const v = agencyVerdict(arm('none'), arm('greedy', { doomStage: 2 }));
    expect(v.headlineDiffs).toBe(1);
    expect(v.diffs[0]).toMatch(/^Doom stage/);
  });

  it('reads the headline at the compare tick, not at a later end', () => {
    const none = arm('none', {}, AGENCY_COMPARE_TICK + 200);
    const played = arm('greedy', { doomStage: 3 }, AGENCY_COMPARE_TICK + 200);
    none.snaps = [snap()]; played.snaps = [snap()];
    expect(agencyVerdict(none, played).headlineDiffs).toBe(0);
  });
});

describe('agencyNotMeasured / agencyReport', () => {
  it('a missing arm or a budget stop is not measured', () => {
    expect(agencyNotMeasured(null, arm('greedy'))).toMatch(/missing/);
    expect(agencyNotMeasured(arm('none'), arm('greedy', {}, 300, 'budget'))).toMatch(/budget/);
    expect(agencyNotMeasured(arm('none'), arm('greedy'))).toBeNull();
  });

  it('the KPI line counts only measured seeds', () => {
    const lines = agencyReport([
      { seed: 42, none: arm('none'), played: arm('greedy', { apotheosis: true }) },
      { seed: 99, none: null, played: arm('greedy') },
    ]);
    expect(lines[1]).toMatch(/^seed 99: not measured/);
    expect(lines.find((l) => l.startsWith('agency (hands-off vs played):'))).toMatch(/mattered on 1\/1 measured seeds \(1 not measured\)/);
    // No answer key → no answer comparison (a two-arm --compare stays two-arm).
    expect(lines.some((l) => l.includes('vs answer'))).toBe(false);
  });
});

describe('THR-2243 — the answer arm', () => {
  function answerArm(over: Partial<AgencySnapshot> = {}, ranTo = AGENCY_COMPARE_TICK, extra: Record<string, unknown> = {}): AgencyArmResult {
    return { ...arm('greedy', over, ranTo), arm: 'answer', ...extra };
  }

  it('H1 — an answer arm whose only difference is the ending reports it', () => {
    const v = agencyVerdict(arm('none', { phase: 'ended' }, 700), answerArm({}, AGENCY_COMPARE_TICK));
    expect(v.headlineDiffs).toBe(1);
    expect(v.diffs).toEqual(['ending doom→none']);
    expect(v.mattered).toBe(true);
  });

  it('H5 — an answer arm whose only difference is the Doom stage reports it', () => {
    const v = agencyVerdict(arm('none', { doomStage: 5 }), answerArm({ doomStage: 4 }));
    expect(v.headlineDiffs).toBe(1);
    expect(v.diffs).toEqual(['Doom stage 5→4']);
  });

  it('the report compares hands-off vs played and hands-off vs answer, with a KPI line each', () => {
    const lines = agencyReport([{
      seed: 42, none: arm('none', { doomStage: 5, doomProgress: 0.95 }), played: arm('greedy', { doomStage: 5 }),
      answer: answerArm({ doomStage: 4, doomProgress: 0.81 }, AGENCY_COMPARE_TICK,
        { stayHeld: true, rebukeHeld: false, stayCasts: 2, rebukeCasts: 0, stayHeldTicks: 310, rebukeGiftLostAt: 'never enqueued' }),
    }]);
    expect(JSON.parse(lines[0])).toMatchObject({ vs: 'played', headlineDiffs: 0 });
    expect(JSON.parse(lines[1])).toMatchObject({ vs: 'answer', headlineDiffs: 1 });
    expect(lines.find((l) => l.startsWith('agency (hands-off vs played):'))).toMatch(/mattered on 0\/1/);
    expect(lines.find((l) => l.startsWith('agency (hands-off vs answer):'))).toMatch(/mattered on 1\/1/);
    expect(lines.find((l) => l.startsWith('seed 42 answer arm:'))).toBe(
      'seed 42 answer arm: stayHeld:true rebukeHeld:false Stay casts 2, Rebukes cast 0, ticks Stay held 310,'
      + ` Doom progress at t${AGENCY_COMPARE_TICK} 0.81 (hands-off 0.95); Rebuke gift lost: never enqueued`,
    );
  });

  it('a missing answer arm is not measured for that comparison only', () => {
    const lines = agencyReport([{ seed: 7, none: arm('none'), played: arm('greedy'), answer: null }]);
    expect(lines).toContain('seed 7 vs answer: not measured (answer arm missing)');
    expect(lines.find((l) => l.startsWith('agency (hands-off vs answer):'))).toMatch(/0\/0 measured seeds \(1 not measured\)/);
  });
});

describe('THR-2229 — H6, H7 and the ending predicate', () => {
  it('H6 — a different Ordeal outcome counts once', () => {
    const v = agencyVerdict(arm('none', { ordealOutcome: 'broken' }), arm('greedy', { ordealOutcome: 'triumph' }));
    expect(v.h6).toBe(true);
    expect(v.h7).toBe(false);
    expect(v.headlineDiffs).toBe(1);
    expect(v.diffs[0]).toBe('Ordeal broken→triumph');
  });

  it('H7 — a different Apotheosis band counts once', () => {
    const v = agencyVerdict(arm('none', { apotheosisBand: 'failure' }), arm('greedy', { apotheosisBand: 'success' }));
    expect(v.h7).toBe(true);
    expect(v.headlineDiffs).toBe(1);
  });

  it('beat 2 text is compared and quoted, but is not a headline', () => {
    const v = agencyVerdict(arm('none', { beat2: 'A. B.' }), arm('greedy', { beat2: 'A. C.' }));
    expect(v.beat2Differs).toBe(true);
    expect(v.beat2).toEqual({ none: 'A. B.', played: 'A. C.' });
    expect(v.headlineDiffs).toBe(0);
  });

  it('an H6 difference says what moved it: the lean, the bag, both or neither', () => {
    const rolls = (luckDrawIndex: number, leanDecisive: boolean) => [{ luckDrawIndex, leanDecisive }];
    const pair = (bagA: number, bagB: number, decisive: boolean) => {
      const none = { ...arm('none', { ordealOutcome: 'broken' }), ordealRolls: rolls(bagA, false) };
      const played = { ...arm('greedy', { ordealOutcome: 'triumph' }), ordealRolls: rolls(bagB, decisive) };
      return agencyVerdict(none, played).h6MovedBy;
    };
    expect(pair(3, 3, true)).toBe('lean');
    expect(pair(3, 4, false)).toBe('bag');
    expect(pair(3, 4, true)).toBe('lean+bag');
    expect(pair(3, 3, false)).toBe('neither');
    expect(agencyVerdict(arm('none'), arm('greedy')).h6MovedBy).toBeNull();
  });

  it('the predicate: beat 2 differs on 2 of 3 seeds and H6 or H7 on at least 1', () => {
    const diff = { beat2: 'x' }; const same = { beat2: 'y' };
    const holds = agencyEndingPredicate([
      agencyVerdict(arm('none', same), arm('greedy', { ...diff, ordealOutcome: 'triumph' })),
      agencyVerdict(arm('none', same), arm('greedy', diff)),
      agencyVerdict(arm('none', same), arm('greedy', same)),
    ]);
    expect(holds).toEqual({ beat2Differs: 2, outcomeDiffers: 1, holds: true });
    const textOnly = agencyEndingPredicate([
      agencyVerdict(arm('none', same), arm('greedy', diff)),
      agencyVerdict(arm('none', same), arm('greedy', diff)),
    ]);
    expect(textOnly.holds).toBe(false);
  });
});
