/**
 * Shadow-board liveness (THR-1292 §4) — a canary, not a balance measurement.
 *
 * Every assertion in `decisionBoard.test.ts` is satisfiable by a board that runs
 * on a fixture and never once fires in the world. This test drives the real
 * `initializeGameState → runTick` pipeline and asserts the two shadow channels
 * actually carry a *varying* signal, because the failure mode a shadow period is
 * uniquely vulnerable to is being scored on a board that quietly returned the same
 * verdict every time. A frozen multiplier ranks nothing and looks perfectly
 * healthy on a trace.
 *
 * Deliberately one seed and 60 ticks (~10s). The two-seed 150-tick census that
 * evaluates the *cutover gate* is closeout evidence, not a test — it costs minutes
 * and its verdict is a judgement over two runs, which is not a thing CI should own.
 */

import { describe, it, expect } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { runTick } from '../orchestrator';
import { generateArchetypes } from '../ascendant';
import { createBalancedCosmology } from '../cosmology';
import { enableTracing, disableTracing, getTraces, clearTraces } from '../traceBuffer';
import { UNIFIED_DECISION_BOARD_MODE } from '../../data/strategic-action-constants';
import type { GameState } from '../../types/gameState';

const TICKS = 60;
const SEED = 42;

/**
 * One board entry, with its family kept alongside its multipliers.
 *
 * The family pairing is load-bearing rather than cosmetic. The first version of
 * this file pooled `desires` across both families into one array, and the
 * "not frozen" assertion below passed on a board whose *undertaking* desire
 * multiplier was a hard constant — because encounter desires span ~0.01–1.86 and
 * one varying half is enough to satisfy a pooled `distinct.size > 1`. A guard
 * over a mixed population only ever measures its loudest member (THR-1292 slice 6).
 */
interface BoardEntrySample {
  family: string;
  desire: number;
  temperament: number;
}

interface BoardSample {
  agreement: boolean;
  boardFamilies: string[];
  entries: BoardEntrySample[];
  advanceProbabilities: number[];
  encounterCandidates: number;
  undertakingCandidates: number;
}

function runAndCollect(): { samples: BoardSample[]; errors: number } {
  enableTracing();
  try {
    const archetype = generateArchetypes(4, SEED)[0];
    const preset = MAP_SIZE_PRESETS['medium'];
    let state: GameState = initializeGameState(
      archetype, 'LivenessBot', createBalancedCosmology(), SEED, preset.cols, preset.rows,
    ).state;

    const samples: BoardSample[] = [];
    let errors = 0;

    for (let i = 0; i < TICKS; i++) {
      state = runTick(state);
      // Drained per tick. The trace buffer is a ring and a multi-tick run overflows
      // it repeatedly — an end-of-run read under-reported by 15× in slice 3
      // (impediment #822) and got the *composition* wrong too, not just the count.
      for (const t of getTraces()) {
        const a = t as unknown as Record<string, unknown>;
        if (a.category === 'decision_board_error') errors++;
        if (a.category !== 'decision_board_comparison') continue;
        const top = (a.boardTop ?? []) as Array<Record<string, number | string | undefined>>;
        samples.push({
          agreement: a.agreement as boolean,
          boardFamilies: top.map(e => e.family as string),
          entries: top.map(e => ({
            family: e.family as string,
            desire: e.desireMultiplier as number,
            temperament: e.temperamentWeight as number,
          })),
          advanceProbabilities: top
            .map(e => e.advanceProbability as number | undefined)
            .filter((v): v is number => v !== undefined),
          encounterCandidates: a.encounterCandidates as number,
          undertakingCandidates: a.undertakingCandidates as number,
        });
      }
      clearTraces();
    }
    return { samples, errors };
  } finally {
    disableTracing();
  }
}

describe(`shadow board liveness (${TICKS} ticks, seed ${SEED}, medium)`, () => {
  const { samples, errors } = runAndCollect();

  it('ships in shadow — the board must not decide anything yet', () => {
    expect(UNIFIED_DECISION_BOARD_MODE).toBe('shadow');
  });

  it('emits a comparison on real decisions', () => {
    expect(samples.length).toBeGreaterThan(50);
  });

  it('never throws — a board error is a defect, not a tolerated degradation', () => {
    expect(errors).toBe(0);
  });

  it('ranks both families, not just the one the encounter path already had', () => {
    const families = new Set(samples.flatMap(s => s.boardFamilies));
    expect(families.has('encounter')).toBe(true);
    expect(families.has('strategic_action')).toBe(true);
  });

  it('diverges from legacy at least once — otherwise the shadow period measures nothing', () => {
    // Not a threshold on the divergence *rate*: that is what the cutover gate
    // reads, and pinning it here would make an intended retune fail as a test
    // regression. The identity is only that the board is a different scorer.
    const disagreements = samples.filter(s => !s.agreement).length;
    expect(disagreements).toBeGreaterThan(0);
    expect(disagreements).toBeLessThan(samples.length);
  });

  it('agrees with legacy at least once too — a board that never agrees is broken, not bold', () => {
    expect(samples.filter(s => s.agreement).length).toBeGreaterThan(0);
  });

  it('the encounter desire multiplier is not frozen', () => {
    const distinct = new Set(
      samples.flatMap(s => s.entries)
        .filter(e => e.family === 'encounter')
        .map(e => e.desire.toFixed(4)),
    );
    expect(distinct.size).toBeGreaterThan(1);
  });

  /**
   * The undertaking desire multiplier **was** a hard constant, and is not any more.
   *
   * `computeBoardDesireMultiplier` is
   * `max(axiological × PERSONALITY_SELECTION_WEIGHT + ambitionBoost, MINIMUM_DESIRE) ^ PERSONALITY_SCORE_EXPONENT`.
   * Until THR-1297 slice 5 **both** input terms were pinned: `ambitionBoost` is true
   * by construction (a strategic candidate exists only because an ambition generated
   * it), and `axiological` is `computeDesireScore(template.motivations, profile)` with
   * `motivations` unauthored on all 43 templates — so every undertaking scored
   * `EVT × constant` and the board ranked them with no personality signal at all.
   *
   * Slice 5 authored `motivations` on the T1 kinds' templates, which is exactly what
   * the emptiness pin here existed to announce. Measured at the swap: **51 distinct
   * desire values** on the same 60-tick seed-42 sample that previously produced one.
   *
   * Two things this assertion deliberately does *not* do. It does not assert a count —
   * 51 is a measurement, not a contract, and pinning it would break on any content
   * edit. And it does not assert *health* of the ranking, only that the term varies:
   * whether the new spread actually improves the cutover envelope is THR-1301's
   * measurement to make, not this test's.
   */
  it('the undertaking desire multiplier is not frozen', () => {
    const undertakingDesires = samples.flatMap(s => s.entries)
      .filter(e => e.family === 'strategic_action')
      .map(e => e.desire);

    // A vacuous pass would be an empty population (impediment #599 class): assert
    // the sample exists before asserting anything about its spread.
    expect(undertakingDesires.length).toBeGreaterThan(20);
    expect(new Set(undertakingDesires.map(d => d.toFixed(6))).size).toBeGreaterThan(1);
  });

  it('the temperament weight is not frozen', () => {
    // Encounters contribute a flat 1.0 by design, so a frozen *undertaking* term
    // would still leave two distinct values here. The assertion therefore excludes
    // the baseline and requires the undertaking side itself to move.
    const nonBaseline = new Set(
      samples.flatMap(s => s.entries)
        .filter(e => e.family === 'strategic_action')
        .map(e => e.temperament)
        .filter(w => w !== 1)
        .map(w => w.toFixed(4)),
    );
    expect(nonBaseline.size).toBeGreaterThan(1);
  });

  it('the advance forecast is not frozen', () => {
    // The term most at risk: below the regional scale floor it is genuinely
    // constant, so a world of incapable actors would freeze it without any code
    // being wrong. Measured capabilities run 0.79–1.00, well above that floor.
    const distinct = new Set(samples.flatMap(s => s.advanceProbabilities).map(p => p.toFixed(4)));
    expect(distinct.size).toBeGreaterThan(1);
  });

  it('scores boards that hold more than one candidate', () => {
    const multi = samples.filter(s => s.encounterCandidates + s.undertakingCandidates > 1);
    expect(multi.length).toBeGreaterThan(0);
  });
});
