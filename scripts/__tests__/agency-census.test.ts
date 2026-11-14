/**
 * The agency census verdict (THR-2213) — `agencyVerdict` is the whole judgment the census
 * makes, so it is pinned on hand-built arm results: identical arms give 0 headline
 * differences, and each headline outcome H1–H5 flipped alone gives exactly 1.
 */
import { describe, it, expect } from 'vitest';
import {
  agencyVerdict, agencyNotMeasured, agencyReport,
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
    expect(lines[lines.length - 1]).toMatch(/mattered on 1\/1 measured seeds \(1 not measured\)/);
  });
});
