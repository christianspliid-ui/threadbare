// @vitest-lane heavy — real seeded medium worlds driven 30–120 ticks through runTick (THR-1578)
//
// THR-1578 (forecast-window S1) — the level-success invariant, written now so the
// principle cannot drift again, and the wiring proof for the gauge it reads.
//
// The invariant (plan `Docs/plans/2026-09-24-thr-1575-forecast-window.md` § Done
// when S4): on seeds 42/99 × 120 ticks, every proficiency band with at least
// `KPI_BAND_MIN_ENGAGEMENTS` resolved free-choice engagements succeeds within
// `[KPI_BAND_SUCCESS_MIN − tol, KPI_BAND_SUCCESS_MAX + tol]`, mean attempted
// difficulty rises strictly across those bands, and the in-window share is at
// least `KPI_IN_WINDOW_MIN`. Today's dice and choice rule do not meet it — that is
// the finding THR-1575 exists to fix — so it is skipped until the slice that makes
// it true un-skips it.
import { describe, it, expect } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { runTick, resetEventCounter, resetDecisionCache } from '../orchestrator';
import { createBalancedCosmology } from '../cosmology';
import { generateArchetypes } from '../ascendant';
import { createSimulationRuntime } from '../simulationRuntime';
import { resetReputationTraitInit } from '../phaseReputationTraits';
import { computeEngagementKpiReport, PROFICIENCY_BANDS } from '../kpi/engagementKpi';
import type { EngagementKpiReport } from '../kpi/engagementKpi';
import {
  KPI_BAND_SUCCESS_MIN,
  KPI_BAND_SUCCESS_MAX,
  KPI_BAND_TOLERANCE,
  KPI_IN_WINDOW_MIN,
} from '../kpi/kpiConstants';

function runWorld(seed: number, ticks: number): EngagementKpiReport {
  resetDecisionCache();
  resetEventCounter();
  resetReputationTraitInit();
  const preset = MAP_SIZE_PRESETS.medium;
  const archetypes = generateArchetypes(4, seed);
  let { state } = initializeGameState(archetypes[0], 'InvariantBot', createBalancedCosmology(), seed, preset.cols, preset.rows);
  const runtime = createSimulationRuntime();
  for (let i = 0; i < ticks; i++) state = runTick(state, [], runtime);
  return computeEngagementKpiReport(runtime.engagementLedger);
}

describe('engagement gauge wiring (THR-1578)', () => {
  it('stamps commits and folds resolutions on a real world', () => {
    const report = runWorld(42, 30);
    const stamped = report.bands.filter(b => b.band !== 'unknown').reduce((s, b) => s + b.engagements, 0);
    const unknown = report.bands.find(b => b.band === 'unknown')!.engagements;
    // The decision phase stamped, and the orchestrator folded, real engagements…
    expect(stamped).toBeGreaterThan(0);
    expect(report.freeChoiceCommits).toBeGreaterThan(0);
    expect(report.boardDecisions).toBeGreaterThan(0);
    // …and most resolved encounters carry a stamp (the rest came from seeded,
    // forced or legacy paths, which the gauge deliberately files as `unknown`).
    expect(stamped).toBeGreaterThan(unknown);
  }, 180_000);
});

describe('the level-success invariant (THR-1575)', () => {
  // TODO(THR-1582): un-skip when S4 lands the forecast window; S3 (THR-1581) re-fits the dice it rests on.
  it.skip('success is level across covered proficiency bands and attempted difficulty rises with proficiency', () => {
    for (const seed of [42, 99]) {
      const report = runWorld(seed, 120);
      const covered = PROFICIENCY_BANDS
        .map(band => report.bands.find(b => b.band === band)!)
        .filter(b => b.covered);
      for (const b of covered) {
        expect(b.successRate, `seed ${seed} ${b.band}`).toBeGreaterThanOrEqual(KPI_BAND_SUCCESS_MIN - KPI_BAND_TOLERANCE);
        expect(b.successRate, `seed ${seed} ${b.band}`).toBeLessThanOrEqual(KPI_BAND_SUCCESS_MAX + KPI_BAND_TOLERANCE);
      }
      for (let i = 1; i < covered.length; i++) {
        expect(covered[i].meanAttemptedDifficulty, `seed ${seed} ${covered[i - 1].band}→${covered[i].band}`)
          .toBeGreaterThan(covered[i - 1].meanAttemptedDifficulty);
      }
      expect(report.inWindowShare, `seed ${seed}`).toBeGreaterThanOrEqual(KPI_IN_WINDOW_MIN);
    }
  }, 600_000);
});
