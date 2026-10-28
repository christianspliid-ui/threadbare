/**
 * THR-2073 — the god's steering verbs and a mortal's movement leans reach the board.
 *
 * The scorer adds its late pulls (Mark the Ground, Draw Together, Whisper Intuition,
 * relocation, appointment, broken drift, ruins, anomaly) after its multipliers, into
 * `finalScore` only, which `scoreUnifiedBoard` never reads. These tests pin that they now
 * sum into the board's context lean, by name, and that `BOARD_LATE_PULL_WEIGHT` 0 restores
 * the old board.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';

const lateWeight = vi.hoisted(() => ({ value: undefined as number | undefined }));
vi.mock('../../data/agent-behavior-constants', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    get BOARD_LATE_PULL_WEIGHT() { return lateWeight.value ?? actual.BOARD_LATE_PULL_WEIGHT; },
  };
});

import { boardContextSum, boardContextTerms, scoreUnifiedBoard } from '../decisionBoard';
import { BOARD_LATE_PULL_WEIGHT } from '../../data/agent-behavior-constants';

const emptyGraph = { getNode: () => null, getOutgoingEdges: () => [] } as never;

const mk = (id: string, extra: Record<string, number> = {}) => ({
  entry: { templateId: id },
  valuePerTick: 0.4,
  desireMultiplier: 1,
  ...extra,
}) as never;

afterEach(() => { lateWeight.value = undefined; });

const LATE: ReadonlyArray<readonly [string, string]> = [
  ['attraction', 'attractionBonus'],
  ['convergence', 'convergenceBonus'],
  ['hunch', 'hunchBonus'],
  ['relocation', 'relocationBonus'],
  ['appointment', 'appointmentBonus'],
  ['brokenDrift', 'brokenDriftBonus'],
  ['ruins', 'ruinsBonus'],
  ['anomaly', 'anomalyBonus'],
];

describe('late pulls on the board context (THR-2073)', () => {
  it('ships at weight 1', () => {
    expect(BOARD_LATE_PULL_WEIGHT).toBe(1);
  });

  it.each(LATE)('names %s and sums it into the context', (name, field) => {
    const c = { [field]: 0.2 };
    expect(boardContextTerms(c)).toEqual({ [name]: 0.2 });
    expect(boardContextSum(c)).toBeCloseTo(0.2, 10);
  });

  it('scales the late pulls, and only them, by BOARD_LATE_PULL_WEIGHT', () => {
    const c = { reputationBonus: 0.1, attractionBonus: 0.2, hunchBonus: 0.4 };
    expect(boardContextSum(c)).toBeCloseTo(0.7, 10);
    lateWeight.value = 0.5;
    expect(boardContextSum(c)).toBeCloseTo(0.4, 10);
    lateWeight.value = 0;
    expect(boardContextSum(c)).toBeCloseTo(0.1, 10);
    // The terms still ride the trace at weight 0, so the census can measure the off arm.
    expect(boardContextTerms(c)).toEqual({ reputation: 0.1, attraction: 0.2, hunch: 0.4 });
  });

  it('a marked hex makes the mortal prefer its scene; weight 0 is the old tie', () => {
    const board = () => scoreUnifiedBoard({
      graph: emptyGraph, agentId: 'a', tick: 1,
      encounterCandidates: [mk('plain'), mk('marked', { attractionBonus: 0.175 })],
      strategicCandidates: [],
    });
    const on = board();
    expect(on.winner?.id).toBe('marked');
    const marked = on.entries.find(e => e.id === 'marked')!;
    const plain = on.entries.find(e => e.id === 'plain')!;
    expect(marked.score / plain.score).toBeCloseTo((0.4 + 0.175) / 0.4, 6);
    expect(marked.contextTerms).toEqual({ attraction: 0.175 });

    lateWeight.value = 0;
    const off = board();
    const offMarked = off.entries.find(e => e.id === 'marked')!;
    const offPlain = off.entries.find(e => e.id === 'plain')!;
    expect(offMarked.score).toBeCloseTo(offPlain.score, 10);
    expect(offMarked.contextPull).toBeUndefined();
  });
});
