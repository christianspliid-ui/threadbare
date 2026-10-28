/**
 * THR-2071 — the scorer's context reaches the mortal's own pick.
 *
 * A boom town, a haunted place, a reputation, a faction, a story's next step and what
 * the mortal knows used to scale only `finalScore` — the shortlist gate and God's Will —
 * which `scoreUnifiedBoard` never reads. These tests pin the board's context pull: its
 * proportion, its clamp, its fail-soft and its kill switch.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';

const weight = vi.hoisted(() => ({ value: undefined as number | undefined }));
vi.mock('../../data/agent-behavior-constants', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    get BOARD_CONTEXT_WEIGHT() { return weight.value ?? actual.BOARD_CONTEXT_WEIGHT; },
  };
});

import {
  boardContextPull,
  boardContextPulls,
  boardContextSum,
  boardContextTerms,
  scoreUnifiedBoard,
} from '../decisionBoard';
import { computeEconomicContextBonus } from '../economicContext';
import {
  BOARD_CONTEXT_PULL_MAX,
  BOARD_CONTEXT_PULL_MIN,
  BOARD_CONTEXT_WEIGHT,
} from '../../data/agent-behavior-constants';

const emptyGraph = { getNode: () => null, getOutgoingEdges: () => [] } as never;

const mk = (id: string, extra: Record<string, number> = {}) => ({
  entry: { templateId: id },
  valuePerTick: 0.4,
  desireMultiplier: 1,
  ...extra,
}) as never;

afterEach(() => { weight.value = undefined; });

describe('boardContextPull (THR-2071)', () => {
  it('keeps the scorer proportion: a term worth a quarter of base leans ×1.25', () => {
    expect(BOARD_CONTEXT_WEIGHT).toBe(1);
    expect(boardContextPull(0.4, 0.1)).toBeCloseTo(1.25, 10);
  });

  it('caps at BOARD_CONTEXT_PULL_MAX and floors at BOARD_CONTEXT_PULL_MIN', () => {
    expect(boardContextPull(0.1, 5)).toBe(BOARD_CONTEXT_PULL_MAX);
    expect(boardContextPull(0.1, -5)).toBe(BOARD_CONTEXT_PULL_MIN);
  });

  it('reads base ≤ 0, a non-finite base or a non-finite sum as no lean', () => {
    expect(boardContextPull(0, 0.2)).toBe(1);
    expect(boardContextPull(-0.3, 0.2)).toBe(1);
    expect(boardContextPull(Number.NaN, 0.2)).toBe(1);
    expect(boardContextPull(0.4, Number.NaN)).toBe(1);
    expect(boardContextPull(0.4, Number.POSITIVE_INFINITY)).toBe(1);
  });

  it('is 1 everywhere at weight 0 (the kill switch)', () => {
    weight.value = 0;
    expect(boardContextPull(0.4, 0.1)).toBe(1);
    expect(boardContextPull(0.1, -5)).toBe(1);
  });
});

describe('boardContextPulls (THR-2071)', () => {
  it('divides by the geometric mean, keeping every ratio', () => {
    const cs = [
      { valuePerTick: 0.4, desireMultiplier: 1, reputationBonus: 0.1 },
      { valuePerTick: 0.4, desireMultiplier: 1, reputationBonus: 0.2 },
      { valuePerTick: 0.4, desireMultiplier: 1 },
    ] as never[];
    const p = boardContextPulls(cs);
    expect(p[0] * p[1] * p[2]).toBeCloseTo(1, 10);
    expect(p[1] / p[2]).toBeCloseTo(boardContextPull(0.4, 0.2), 10);
    expect(p[0] / p[2]).toBeCloseTo(boardContextPull(0.4, 0.1), 10);
  });

  it('leaves scenes refused on their forecast (fit 0) out of the mean', () => {
    const cs = [
      { valuePerTick: 0.4, desireMultiplier: 1, engagementFit: 1 },
      { valuePerTick: 0.4, desireMultiplier: 1, engagementFit: 0, reputationBonus: 5 },
      { valuePerTick: 0.4, desireMultiplier: 1, engagementFit: 0, reputationBonus: 5 },
    ] as never[];
    expect(boardContextPulls(cs)[0]).toBe(1);
  });

  it('leaves scenes with no value (base ≤ 0) out of the mean', () => {
    const cs = [
      { valuePerTick: 0.3, desireMultiplier: 1, engagementFit: 1, reputationBonus: 0.15 },
      { valuePerTick: 0, desireMultiplier: 1, engagementFit: 1 },
    ] as never[];
    expect(boardContextPulls(cs)[0]).toBeCloseTo(1, 10);
  });

  it('holds the cap after normalizing a board of penalized scenes', () => {
    // Raw [2, 0.5, 0.5] → geometric mean ≈ 0.794 → the top scene would read ≈ 2.52.
    const cs = [
      { valuePerTick: 0.1, desireMultiplier: 1, reputationBonus: 5 },
      { valuePerTick: 0.1, desireMultiplier: 1, reputationBonus: -5 },
      { valuePerTick: 0.1, desireMultiplier: 1, reputationBonus: -5 },
    ] as never[];
    const p = boardContextPulls(cs);
    expect(Math.max(...p)).toBe(BOARD_CONTEXT_PULL_MAX);
    expect(Math.min(...p)).toBeGreaterThanOrEqual(BOARD_CONTEXT_PULL_MIN);
  });

  it('returns [] for an empty board and all-1 at weight 0', () => {
    expect(boardContextPulls([])).toEqual([]);
    weight.value = 0;
    const p = boardContextPulls([{ valuePerTick: 0.4, desireMultiplier: 1, reputationBonus: 0.3 }] as never[]);
    expect(p).toEqual([1]);
  });
});

describe('boardContextSum / boardContextTerms (THR-2071)', () => {
  it('sums the eight Board terms and names only the non-zero ones', () => {
    const c = {
      economicContextBonus: 0.1, locationTraitBonus: 0.05, resonance: 0, globalResonance: 0.01,
      reputationBonus: -0.02, factionScoringBoost: 0.03, chainBonus: 0.2, intelBonus: 0,
    };
    expect(boardContextSum(c)).toBeCloseTo(0.37, 10);
    expect(boardContextTerms(c)).toEqual({
      economic: 0.1, locationTrait: 0.05, globalResonance: 0.01,
      reputation: -0.02, faction: 0.03, chain: 0.2,
    });
  });

  it('ignores shortlist-only terms and reads missing or non-finite terms as 0', () => {
    const c = {
      economicContextBonus: Number.NaN, reputationBonus: 0.04,
      explorationBonus: 9, identityBiasBonus: 9, markRevealBonus: 9,
    } as never;
    expect(boardContextSum(c)).toBeCloseTo(0.04, 10);
    expect(boardContextTerms(c)).toEqual({ reputation: 0.04 });
  });
});

describe('scoreUnifiedBoard — context pull (THR-2071)', () => {
  // The ticket's predicate: a booming town's board ranks the festival above an
  // equal-value candidate with no economic row.
  const boom = computeEconomicContextBonus(100, 'encounter.market_day_festival');
  const board = () => scoreUnifiedBoard({
    graph: emptyGraph, agentId: 'a', tick: 1,
    encounterCandidates: [
      mk('encounter.plain_errand', { economicContextBonus: 0 }),
      mk('encounter.market_day_festival', { economicContextBonus: boom }),
    ],
    strategicCandidates: [],
  });

  it('ranks the festival above an equal-value candidate in a booming town', () => {
    expect(boom).toBeGreaterThan(0);
    const b = board();
    const raw = boardContextPull(0.4, boom);
    expect(raw).toBeGreaterThan(1);
    // Normalized by the board's geometric mean (sqrt(raw × 1)): the ratio between the
    // two is the scorer's proportion exactly, and the board's average encounter reads ×1.
    const festival = b.entries.find(e => e.id === 'encounter.market_day_festival')!;
    const plain = b.entries.find(e => e.id === 'encounter.plain_errand')!;
    expect(b.winner?.id).toBe('encounter.market_day_festival');
    expect(festival.score / plain.score).toBeCloseTo(raw, 10);
    expect(festival.contextPull! * plain.contextPull!).toBeCloseTo(1, 10);
    expect(festival.contextTerms).toEqual({ economic: boom });
    expect(plain.contextTerms).toBeUndefined();
  });

  it('ties the two at weight 0 — today\'s board', () => {
    weight.value = 0;
    const b = board();
    const [x, y] = b.entries;
    expect(x.score).toBeCloseTo(y.score, 12);
    expect(b.entries.every(e => e.contextPull === undefined)).toBe(true);
  });

  it('reads a lone encounter as ×1 — the lean is among scenes, not against undertakings', () => {
    const b = scoreUnifiedBoard({
      graph: emptyGraph, agentId: 'a', tick: 1,
      encounterCandidates: [mk('encounter.market_day_festival', { economicContextBonus: boom })],
      strategicCandidates: [],
    });
    expect(b.winner?.score).toBeCloseTo(0.4, 10);
    expect(b.winner?.contextPull).toBeUndefined();
    expect(b.winner?.contextTerms).toEqual({ economic: boom });
  });

  it('leaves a candidate scored before THR-2071 (no context fields) unchanged', () => {
    const b = scoreUnifiedBoard({
      graph: emptyGraph, agentId: 'a', tick: 1,
      encounterCandidates: [mk('legacy')],
      strategicCandidates: [],
    });
    expect(b.winner?.score).toBeCloseTo(0.4, 10);
    expect(b.winner?.contextPull).toBeUndefined();
  });
});
