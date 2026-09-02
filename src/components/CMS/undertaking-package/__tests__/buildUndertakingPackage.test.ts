/**
 * The Undertaking Package View's model (THR-1300 slice 4).
 *
 * Three things the surface promises: every registry template has an index row and
 * builds without throwing; the kind block names the cell the template fills and the
 * row's other cells; and the board block is words — no numeral reaches the surface
 * (Law 13), asserted on every shipped template rather than one.
 */
import { describe, it, expect } from 'vitest';
import {
  buildUndertakingPackage,
  undertakingPackageIndex,
  undertakingTemplateById,
  payoffWord,
  durationWord,
  harmWord,
  CALLING_BY_FAMILY,
} from '../buildUndertakingPackage';
import { getAllStrategicTemplates } from '../../../../engine/strategicActionCandidates';
import { UNDERTAKING_TIER_PAYOFF_BANDS } from '../../../../data/content-eval/undertakingConstants';

const NUMERAL = /\d/;

describe('undertaking package index', () => {
  it('has one row per registry template, kind-sorted, with cell and tier where a row exists', () => {
    const index = undertakingPackageIndex();
    const all = getAllStrategicTemplates();
    expect(index.length).toBe(all.length);
    expect(new Set(index.map(r => r.templateId)).size).toBe(all.length);
    const warband = index.find(r => r.templateId === 'strategic_recruit_warband')!;
    expect(warband.kindId).toBe('warband');
    expect(warband.cell).toBe('create');
    expect(warband.tier).toBe(3);
  });
});

describe('buildUndertakingPackage', () => {
  it('builds every shipped template without throwing, with words on the board', () => {
    for (const t of getAllStrategicTemplates()) {
      const pkg = buildUndertakingPackage(t);
      expect(pkg.templateId).toBe(t.id);
      expect(pkg.board.difficulty, t.id).not.toMatch(NUMERAL);
      expect(pkg.board.payoff, t.id).not.toMatch(NUMERAL);
      expect(pkg.board.duration, t.id).not.toMatch(NUMERAL);
      if (pkg.harm) expect(pkg.harm.magnitude, t.id).not.toMatch(NUMERAL);
      expect(pkg.verdict.violations.length === 0).toBe(pkg.verdict.passed);
    }
  });

  it('names the kind cell the template fills and links the row’s other cells', () => {
    const pkg = buildUndertakingPackage(undertakingTemplateById('strategic_establish_trade_route')!);
    expect(pkg.kind?.row.kindId).toBe('trade_route');
    expect(pkg.kind?.cell).toBe('create');
    expect(pkg.kind?.siblings.create).not.toContain('strategic_establish_trade_route');
    expect(pkg.kind?.siblings.destroy.length).toBeGreaterThan(0);
    expect(pkg.mutation?.type).toBe('create_trade_route');
    expect(pkg.writeSet.empty).toBe(false);
    expect(pkg.calling).toBe(CALLING_BY_FAMILY['merchant-expansion']);
  });

  it('reports the retrofit ratchet on a pending template and a clean verdict on a passing one', () => {
    const pending = buildUndertakingPackage(undertakingTemplateById('strategic_chart_the_wilds')!);
    expect(pending.verdict.retrofitPending).toBe(true);
    const passing = getAllStrategicTemplates().map(buildUndertakingPackage).find(p => p.verdict.passed);
    expect(passing).toBeDefined();
    expect(passing!.verdict.failedBlocks).toEqual([]);
  });
});

describe('the words', () => {
  it('bands payoff against the tier and never emits the number', () => {
    const [lo, hi] = UNDERTAKING_TIER_PAYOFF_BANDS[2];
    expect(payoffWord(lo - 0.01, 2)).toBe('below the tier');
    expect(payoffWord(hi + 0.01, 2)).toBe('above the tier');
    expect(payoffWord(lo, 2)).toBe('modest for the tier');
    expect(payoffWord(hi, 2)).toBe('ample for the tier');
    expect(payoffWord(undefined, 2)).toBe('unset');
    expect(durationWord(3)).toBe('brief');
    expect(durationWord(20)).toBe('a great labour');
    expect(harmWord('not_a_class')).toBe('unknown');
  });
});
