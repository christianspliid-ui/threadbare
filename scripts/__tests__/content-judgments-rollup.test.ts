/**
 * THR-1723 — the rollup over a fixture artifact: grids, the finding classes, the
 * new/resolved diff, the threshold rule, cache reuse and the calibration sample.
 */
import { describe, expect, it } from 'vitest';
import {
  buildGrid,
  buildReachAgreement,
  buildSphereColumn,
  calibrateThresholds,
  chooseChoiceThreshold,
  chooseNoulThreshold,
  computeFindings,
  diffFindings,
  errorRow,
  PLACEHOLDER_THRESHOLDS,
  readAxis,
  renderReport,
  reusableRow,
  reviewWorklist,
  rowFromAnswers,
  selectCalibrationSample,
  type CoverageThresholds,
  type EncounterCoverageArtifact,
  type EncounterJudgmentRow,
} from '../content-judgments/coverageRollup';
import type { JevAnswer } from '../content-judgments/jevClient';

const choice = (pick: string, confidence: number): JevAnswer => ({
  type: 'choice',
  choice: pick,
  probabilities: { [pick]: confidence, none: Number((1 - confidence).toFixed(3)) },
  confidence,
});
const noul = (n: number): JevAnswer => ({ type: 'noul', noul: n });

function row(
  id: string,
  declared: { reach: string; encounterType?: string | null; sphereAffinity?: string | null; familyTags?: string[] },
  a: { reach: string; reachRev?: string; activity: string; walk: string; conf?: number; sphereOrder?: number; tagfit?: Record<string, number> },
): EncounterJudgmentRow {
  const conf = a.conf ?? 0.9;
  const answers: Record<string, JevAnswer> = {
    reach: choice(a.reach, conf),
    reach_rev: choice(a.reachRev ?? a.reach, conf),
    activity: choice(a.activity, conf),
    activity_rev: choice(a.activity, conf),
    walk_of_life: choice(a.walk, conf),
    sphere_order: noul(a.sphereOrder ?? 0.1),
  };
  for (const [tag, n] of Object.entries(a.tagfit ?? {})) answers[`tagfit_${tag.slice(1)}`] = noul(n);
  return rowFromAnswers({
    id,
    contentHash: `h-${id}`,
    truncated: false,
    declared: {
      reach: declared.reach,
      encounterType: declared.encounterType ?? null,
      sphereAffinity: declared.sphereAffinity ?? null,
      familyTags: declared.familyTags ?? [],
    },
  }, answers);
}

const T: CoverageThresholds = { ...PLACEHOLDER_THRESHOLDS };

const rows: EncounterJudgmentRow[] = [
  row('a', { reach: 'iron', encounterType: 'duel' }, { reach: 'iron', activity: 'duel', walk: 'combat', sphereOrder: 0.9 }),
  row('b', { reach: 'gold', sphereAffinity: 'order' }, { reach: 'heart', activity: 'assist', walk: 'social' }),
  row('c', { reach: 'eye' }, { reach: 'eye', reachRev: 'veil', activity: 'explore', walk: 'knowledge' }),
  row('d', { reach: 'resolve', familyTags: ['#trade'] }, { reach: 'star', activity: 'none', walk: 'none', tagfit: { '#trade': 0.1 } }),
  row('e', { reach: 'stone' }, { reach: 'stone', activity: 'build', walk: 'craft', conf: 0.4 }),
  errorRow({ id: 'f', contentHash: 'h-f', truncated: false, declared: { reach: 'star', encounterType: null, sphereAffinity: null, familyTags: [] } }, 'HTTP 500'),
];

describe('coverage rollup (THR-1723)', () => {
  it('flags order sensitivity when the reversed twin disagrees', () => {
    expect(rows[2].orderSensitive).toEqual({ reach: true, activity: false });
    expect(readAxis(rows[0], 'reach')).toEqual({ choice: 'iron', confidence: 0.9, orderSensitive: false });
  });

  it('builds the Reach × Activity grid from confident answers only', () => {
    const g = buildGrid(rows, 'activity', T);
    expect(g.cells.iron.duel).toBe(1);
    expect(g.cells.heart.assist).toBe(1);
    expect(g.cells.star.none).toBe(1);
    // c is order-sensitive on reach, e is below the 0.6 placeholder, f errored (not counted).
    expect(g.review).toBe(2);
    const w = buildGrid(rows, 'walk_of_life', T);
    expect(w.cells.iron.combat).toBe(1);
    expect(w.cells.star.none).toBe(1);
  });

  it('counts judged and declared spheres side by side', () => {
    const order = buildSphereColumn(rows, T).find(s => s.sphere === 'order')!;
    expect(order).toEqual({ sphere: 'order', judged: 1, declared: 1 });
  });

  it('compares declared and judged Reach, with out-of-Eight under other', () => {
    const agr = buildReachAgreement(rows, T);
    expect(agr.compared).toBe(3);
    expect(agr.agreed).toBe(1);
    expect(agr.cells.other.star).toBe(1);
  });

  it('computes all five finding classes', () => {
    const f = computeFindings(rows, T);
    const keys = f.map(x => x.key).sort();
    expect(keys).toEqual([
      'activity_backfill|b|assist',
      'activity_backfill|c|explore',
      'out_of_eight_reach|d|resolve',
      'possible_missing_theme|d|walk_of_life',
      'reach_mislabel|b|heart',
      'unearned_tag|d|#trade',
    ]);
  });

  it('raises possible-missing-theme only at or above the no-match share', () => {
    const mostlyNamed = [...rows, ...Array.from({ length: 10 }, (_, i) =>
      row(`z${i}`, { reach: 'iron' }, { reach: 'iron', activity: 'duel', walk: 'combat' }))];
    expect(computeFindings(mostlyNamed, T).some(x => x.class === 'possible_missing_theme')).toBe(false);
  });

  it('routes nothing as confident on an uncalibrated axis', () => {
    const f = computeFindings(rows, { ...T, reach: null });
    expect(f.some(x => x.class === 'reach_mislabel')).toBe(false);
    expect(buildGrid(rows, 'activity', { ...T, reach: null }).review).toBe(5);
  });

  it('diffs findings into new and resolved', () => {
    const before = computeFindings(rows, T);
    const after = computeFindings(rows.filter(r => r.id !== 'b' && r.id !== 'c'), T);
    const { added, resolved } = diffFindings(before, after);
    expect(added).toEqual([]);
    expect(resolved.map(x => x.key).sort()).toEqual([
      'activity_backfill|b|assist', 'activity_backfill|c|explore', 'reach_mislabel|b|heart',
    ]);
  });

  it('orders the review worklist by confidence ascending', () => {
    const list = reviewWorklist(rows, T);
    expect(list[0].id).toBe('f');
    expect(list.map(x => x.id)).toEqual(['f', 'e', 'c']);
  });

  it('picks the lowest qualifying Choice threshold, or none', () => {
    const samples = [
      ...Array.from({ length: 6 }, () => ({ confidence: 0.9, orderSensitive: false, agrees: true })),
      { confidence: 0.3, orderSensitive: false, agrees: false },
      { confidence: 0.3, orderSensitive: false, agrees: false },
      { confidence: 0.95, orderSensitive: true, agrees: false },
      { confidence: 0.2, orderSensitive: false, agrees: true },
    ];
    const { threshold, table } = chooseChoiceThreshold(samples);
    // At c ≤ 0.2 admitted 9 (orderSensitive excluded) with 7/9 = 0.778; at 0.35 admitted 6/10, agreement 1.
    expect(threshold).toBe(0.35);
    expect(table[0]).toMatchObject({ c: 0, admitted: 9 });
    expect(chooseChoiceThreshold(samples.map(s => ({ ...s, agrees: false }))).threshold).toBeNull();
  });

  it('picks a Noul cut from 0.5 up, admitting confident answers either way', () => {
    const samples = [
      { noul: 0.95, label: true }, { noul: 0.9, label: true }, { noul: 0.05, label: false },
      { noul: 0.1, label: false }, { noul: 0.55, label: false }, { noul: 0.45, label: true },
    ];
    expect(chooseNoulThreshold(samples).threshold).toBe(0.6);
  });

  it('calibrates per axis from reader labels', () => {
    const labels = rows.filter(r => !r.error).map(r => ({
      id: r.id,
      reach: readAxis(r, 'reach').choice!,
      activity: readAxis(r, 'activity').choice!,
      walk_of_life: readAxis(r, 'walk_of_life').choice!,
      spheres: { order: (r.answers.sphere_order?.noul ?? 0) >= 0.5 },
    }));
    const { thresholds, tables } = calibrateThresholds(rows, labels, '2026-10-15T00:00:00.000Z');
    expect(thresholds.reach).toBe(0);
    expect(thresholds.sphereYes).toBe(0.5);
    expect(thresholds.tagFitNo).toBe(PLACEHOLDER_THRESHOLDS.tagFitNo);
    expect(thresholds.calibratedAt).toBe('2026-10-15T00:00:00.000Z');
    expect(Object.keys(tables).sort()).toEqual(['activity', 'reach', 'sphere', 'walk_of_life']);
  });

  it('selects the calibration sample deterministically per declared Reach', () => {
    const many = Array.from({ length: 30 }, (_, i) => ({ id: `x${i}`, declared: { reach: i % 2 ? 'iron' : 'gold' } }));
    const s1 = selectCalibrationSample(many, 4);
    expect(s1).toHaveLength(8);
    expect(selectCalibrationSample([...many].reverse(), 4)).toEqual(s1);
    expect(selectCalibrationSample([{ id: 'q', declared: { reach: 'resolve' } }], 4)).toEqual([]);
  });

  it('reuses a cached row only when content hash, question version and model all match', () => {
    const prev = { questionsVersion: 1, model: 'jev-1.13.0', rows } as unknown as EncounterCoverageArtifact;
    expect(reusableRow(prev, 'a', 'h-a', 1, 'jev-1.13.0')).toBe(rows[0]);
    expect(reusableRow(prev, 'a', 'h-CHANGED', 1, 'jev-1.13.0')).toBeNull();
    expect(reusableRow(prev, 'a', 'h-a', 2, 'jev-1.13.0')).toBeNull();
    expect(reusableRow(prev, 'a', 'h-a', 1, 'jev-1.14.0')).toBeNull();
    expect(reusableRow(prev, 'f', 'h-f', 1, 'jev-1.13.0')).toBeNull();
    expect(reusableRow(null, 'a', 'h-a', 1, 'jev-1.13.0')).toBeNull();
  });

  it('renders a report with the cost line, the grids and the findings', () => {
    const artifact: EncounterCoverageArtifact = {
      schema: 1, questionsVersion: 1, model: 'jev-1.13.0', doctrine: 'prose@2',
      ranAt: '2026-10-15T00:00:00.000Z', sourceCommit: 'abc', partial: false, coldStart: true,
      usage: { requests: 5, inputTokens: 12345, usdEstimate: 0.0005, wallSeconds: 3, reusedRows: 0 },
      thresholds: T, questions: {}, rows, calibration: null,
    };
    const md = renderReport(artifact, null);
    expect(md).toContain('5 requests · 0 reused rows · 12345 input tokens');
    expect(md).toContain('not a quota');
    expect(md).toContain('## Reach × Activity');
    expect(md).toContain('### reach_mislabel (1)');
    expect(md).toContain('pre-calibration placeholders');
    const again = renderReport({ ...artifact, coldStart: false }, artifact);
    expect(again).toContain('0 new, 0 resolved');
  });
});
