/**
 * THR-1926 — The Crossroads, pure layer. Each function is falsified at its own layer:
 * the snapshot drops the road just taken and secret cells; the multipliers hit only the
 * matching identity; the settledness boundaries; every forecast branch (and `not_enough`
 * in both directions on every `set` snapshot); every outcome row; the price; the
 * ratio ↔ multiplier pins; and the fail-soft readers.
 */
import { describe, it, expect } from 'vitest';
import {
  boardWinnerWithoutLean,
  buildCrossroadsSnapshotDetailed,
  crossroadsLeanMultiplier,
  forecastLean,
  leanBaseCost,
  readCrossroadsLean,
  readCrossroadsSnapshot,
  resolveLeanOutcome,
  settledness,
  type CrossroadsOption,
  type CrossroadsSnapshot,
} from '../crossroads';
import type { BoardEntry } from '../decisionBoard';
import {
  CROSSROADS_HOLD_MAX_TICKS,
  CROSSROADS_LEANING_RATIO,
  CROSSROADS_LEAN_AWAY_MULT,
  CROSSROADS_LEAN_TOWARD_MULT,
  CROSSROADS_TORN_RATIO,
  CROSSROADS_LEAN_COST_BASE,
  CROSSROADS_LEAN_COST_PER_RANK,
  CROSSROADS_LEAN_AWAY_COST,
  CROSSROADS_OPTION_COUNT,
} from '../../data/premonition-constants';

const enc = (templateId: string, locationId: string) => ({
  entry: { templateId, locationId, reachPrimary: 'iron' },
}) as never;
const und = (templateId: string, targetNodeId: string) => ({ templateId, targetNodeId }) as never;

const entry = (family: 'encounter' | 'strategic_action', id: string, candidateIndex: number, score: number, extra: Partial<BoardEntry> = {}): BoardEntry => ({
  family, id, candidateIndex, score, evt: score, desireMultiplier: 1, temperamentWeight: 1, ...extra,
});

const opt = (templateId: string, score: number, family: 'encounter' | 'strategic_action' = 'encounter'): CrossroadsOption => ({
  family, templateId, targetId: `${templateId}_at`, score, reach: 'iron',
});
const snap = (...scores: number[]): CrossroadsSnapshot => ({ tick: 1, options: scores.map((s, i) => opt(`r${i}`, s)) });

describe('crossroads — the ratio ↔ multiplier pins', () => {
  it('pins LEANING_RATIO × TOWARD_MULT to 1 and AWAY_MULT to LEANING_RATIO', () => {
    expect(CROSSROADS_LEANING_RATIO * CROSSROADS_LEAN_TOWARD_MULT).toBe(1);
    expect(CROSSROADS_LEAN_AWAY_MULT).toBe(CROSSROADS_LEANING_RATIO);
  });

  it('reads not_enough in both directions on every set snapshot (toward any non-leader, away from the leader, flag off)', () => {
    for (const r of [0.05, 0.2, 0.35, 0.49, 0.5]) {
      const s = snap(1, r, r * 0.9);
      expect(settledness(s)).toBe('set');
      expect(forecastLean(s, { ...s.options[1], direction: 'toward' })).toBe('not_enough');
      expect(forecastLean(s, { ...s.options[2], direction: 'toward' })).toBe('not_enough');
      expect(forecastLean(s, { ...s.options[0], direction: 'away' }, undefined, false)).toBe('not_enough');
    }
  });
});

describe('crossroads — the snapshot', () => {
  const encounters = [enc('duel', 'greyford'), enc('haggle', 'greyford'), enc('feast', 'ashby')];
  const strategic = [und('secret_cell.plot', 'n1'), und('survey', 'ruin_1')];
  const entries = [
    entry('encounter', 'duel', 0, 1.0),
    entry('strategic_action', 'secret_cell.plot', 0, 0.9),
    entry('encounter', 'haggle', 1, 0.8),
    entry('strategic_action', 'survey', 1, 0.7),
    entry('encounter', 'feast', 2, 0.6),
  ];

  it('drops the entry just taken and secret cells, keeps board order, cuts at OPTION_COUNT', () => {
    const built = buildCrossroadsSnapshotDetailed(
      entries, encounters, strategic, entries[0], id => id.startsWith('secret_cell'), 7,
    );
    expect(built.excludedTaken).toBe('duel');
    expect(built.excludedSecret).toBe(1);
    expect(built.snapshot.tick).toBe(7);
    expect(built.snapshot.options.map(o => o.templateId)).toEqual(['haggle', 'survey', 'feast']);
    expect(built.snapshot.options.length).toBe(CROSSROADS_OPTION_COUNT);
    expect(built.snapshot.options[0]).toMatchObject({ family: 'encounter', targetId: 'greyford', score: 0.8 });
    expect(built.snapshot.options[1]).toMatchObject({ family: 'strategic_action', targetId: 'ruin_1' });
  });

  it('an idle board (no winner) keeps its first entry', () => {
    const built = buildCrossroadsSnapshotDetailed(entries, encounters, strategic, null, () => false, 1);
    expect(built.snapshot.options[0].templateId).toBe('duel');
    expect(built.excludedTaken).toBeNull();
  });

  it('skips an entry whose candidate cannot be resolved (index drift)', () => {
    const built = buildCrossroadsSnapshotDetailed([entry('encounter', 'ghost', 9, 1)], encounters, strategic, null, () => false, 1);
    expect(built.snapshot.options).toEqual([]);
  });
});

describe('crossroads — the multiplier hits only the matching identity', () => {
  const lean = { family: 'encounter' as const, templateId: 'duel', targetId: 'greyford', direction: 'toward' as const };
  it('toward / away on the exact road', () => {
    expect(crossroadsLeanMultiplier({ family: 'encounter', templateId: 'duel', targetId: 'greyford' }, lean)).toBe(CROSSROADS_LEAN_TOWARD_MULT);
    expect(crossroadsLeanMultiplier({ family: 'encounter', templateId: 'duel', targetId: 'greyford' }, { ...lean, direction: 'away' })).toBe(CROSSROADS_LEAN_AWAY_MULT);
  });
  it('1 on another place, another family, another template, or no lean', () => {
    expect(crossroadsLeanMultiplier({ family: 'encounter', templateId: 'duel', targetId: 'ashby' }, lean)).toBe(1);
    expect(crossroadsLeanMultiplier({ family: 'strategic_action', templateId: 'duel', targetId: 'greyford' }, lean)).toBe(1);
    expect(crossroadsLeanMultiplier({ family: 'encounter', templateId: 'feast', targetId: 'greyford' }, lean)).toBe(1);
    expect(crossroadsLeanMultiplier({ family: 'encounter', templateId: 'duel', targetId: 'greyford' }, null)).toBe(1);
  });
});

describe('crossroads — settledness', () => {
  it('boundaries: exactly LEANING_RATIO reads set, just above reads leaning, TORN_RATIO reads torn', () => {
    expect(settledness(snap(1, CROSSROADS_LEANING_RATIO))).toBe('set');
    expect(settledness(snap(1, CROSSROADS_LEANING_RATIO + 1e-9))).toBe('leaning');
    expect(settledness(snap(1, CROSSROADS_TORN_RATIO - 1e-9))).toBe('leaning');
    expect(settledness(snap(1, CROSSROADS_TORN_RATIO))).toBe('torn');
    expect(settledness(snap(1, 1))).toBe('torn');
  });
  it('an idle board (first road below the floor) reads no word, and no toward lean is likely (review-gate round 2)', () => {
    const idle = snap(0, 0, 0);
    expect(settledness(idle)).toBeNull();
    expect(forecastLean(idle, { ...idle.options[0], direction: 'toward' })).toBe('not_enough');
    expect(forecastLean(idle, { ...idle.options[1], direction: 'toward' })).toBe('not_enough');
  });
  it('null under two options', () => {
    expect(settledness(snap(1))).toBeNull();
    expect(settledness(null)).toBeNull();
  });
});

describe('crossroads — forecast', () => {
  it('toward: likely with the margin, may without it, not_enough when still behind', () => {
    // 0.8 × 2 = 1.6 vs 1 → lead 1.6 ≥ 1.25 → likely
    expect(forecastLean(snap(1, 0.8), { ...snap(1, 0.8).options[1], direction: 'toward' })).toBe('likely');
    // 0.55 × 2 = 1.1 vs 1 → leads by less → may
    expect(forecastLean(snap(1, 0.55), { ...snap(1, 0.55).options[1], direction: 'toward' })).toBe('may');
    // 0.4 × 2 = 0.8 < 1 → not_enough
    expect(forecastLean(snap(1, 0.4), { ...snap(1, 0.4).options[1], direction: 'toward' })).toBe('not_enough');
  });
  it('away on the leader, flag off (THR-1926 arithmetic): likely / may / not_enough', () => {
    // 1 × 0.5 = 0.5 vs 0.9 → new leader by 1.8 → likely
    expect(forecastLean(snap(1, 0.9), { ...snap(1, 0.9).options[0], direction: 'away' }, undefined, false)).toBe('likely');
    // 1 × 0.5 = 0.5 vs 0.55 → leads by 1.1 → may
    expect(forecastLean(snap(1, 0.55), { ...snap(1, 0.55).options[0], direction: 'away' }, undefined, false)).toBe('may');
    expect(forecastLean(snap(1, 0.4), { ...snap(1, 0.4).options[0], direction: 'away' }, undefined, false)).toBe('not_enough');
  });
  it('THR-2189: away on the leader reads likely with the wait on (the default), whatever the lead', () => {
    for (const r of [0.9, 0.55, 0.4, 0.05]) {
      expect(forecastLean(snap(1, r), { ...snap(1, r).options[0], direction: 'away' })).toBe('likely');
      expect(forecastLean(snap(1, r), { ...snap(1, r).options[0], direction: 'away' }, undefined, true)).toBe('likely');
    }
    // toward is untouched by the flag
    expect(forecastLean(snap(1, 0.4), { ...snap(1, 0.4).options[1], direction: 'toward' }, undefined, true)).toBe('not_enough');
  });
  it('away on a non-leader is likely; a road not in the reading is not_enough', () => {
    expect(forecastLean(snap(1, 0.9), { ...snap(1, 0.9).options[1], direction: 'away' })).toBe('likely');
    expect(forecastLean(snap(1, 0.9), { family: 'encounter', templateId: 'nope', targetId: null, direction: 'toward' })).toBe('not_enough');
  });
});

describe('crossroads — outcome', () => {
  const lean = { family: 'encounter' as const, templateId: 'duel', targetId: 'g', direction: 'toward' as const, tick: 10 };
  const target = { family: 'encounter' as const, templateId: 'duel', targetId: 'g' };
  const other = { family: 'encounter' as const, templateId: 'feast', targetId: 'g' };
  it('every row', () => {
    expect(resolveLeanOutcome(lean, target, true, 10 + CROSSROADS_HOLD_MAX_TICKS + 1)).toBe('lapsed_expired');
    expect(resolveLeanOutcome(lean, target, false, 11)).toBe('lapsed_unavailable');
    expect(resolveLeanOutcome(lean, target, true, 11)).toBe('followed');
    expect(resolveLeanOutcome(lean, other, true, 11)).toBe('resisted');
    expect(resolveLeanOutcome(lean, null, true, 11)).toBe('resisted');
    expect(resolveLeanOutcome({ ...lean, direction: 'away' }, other, true, 11)).toBe('followed');
    expect(resolveLeanOutcome({ ...lean, direction: 'away' }, null, true, 11)).toBe('followed');
    expect(resolveLeanOutcome({ ...lean, direction: 'away' }, target, true, 11)).toBe('resisted');
  });
  it('the hold boundary itself still resolves', () => {
    expect(resolveLeanOutcome(lean, target, true, 10 + CROSSROADS_HOLD_MAX_TICKS)).toBe('followed');
  });
});

describe('crossroads — price', () => {
  it('toward climbs a step per rank; away is flat', () => {
    expect(leanBaseCost(0, 'toward')).toBe(CROSSROADS_LEAN_COST_BASE);
    expect(leanBaseCost(2, 'toward')).toBe(CROSSROADS_LEAN_COST_BASE + 2 * CROSSROADS_LEAN_COST_PER_RANK);
    expect(leanBaseCost(0, 'away')).toBe(CROSSROADS_LEAN_AWAY_COST);
  });
});

describe('crossroads — the unleaned winner', () => {
  it('divides the lean back out to find who would have won', () => {
    const entries = [
      entry('encounter', 'b', 1, 1.2, { crossroadsLean: 2 }), // 0.6 unleaned
      entry('encounter', 'a', 0, 1.0),
    ];
    expect(boardWinnerWithoutLean(entries, 0)?.id).toBe('a');
    expect(boardWinnerWithoutLean(entries, 2)).toBeNull();
  });
});

describe('crossroads — fail-soft readers', () => {
  it('a malformed value reads as absent', () => {
    expect(readCrossroadsLean({ family: 'encounter' })).toBeNull();
    expect(readCrossroadsLean('nonsense')).toBeNull();
    expect(readCrossroadsSnapshot({ tick: 'x' })).toBeNull();
  });
  it('a well-formed lean and snapshot round-trip', () => {
    const lean = { family: 'strategic_action', templateId: 't', targetId: null, direction: 'away', tick: 3, sphere: 'life', essencePaid: 2, rankWhenPlaced: 0, forecastAtPlacement: 'may' };
    expect(readCrossroadsLean(lean)).toEqual(lean);
    const s = snap(1, 0.5);
    expect(readCrossroadsSnapshot(JSON.parse(JSON.stringify(s)))).toEqual(s);
  });
});
