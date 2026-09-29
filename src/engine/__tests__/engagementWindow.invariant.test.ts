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
// least `KPI_IN_WINDOW_MIN`. THR-1581 (S3 + S4) un-skips the novice band; THR-1627
// (local offset ruling) un-skips journeyman and expert level success; THR-1676 arms the
// rise's novice→journeyman rung. Master level success, the rest of the rise and the
// in-window share wait on content (THR-1677…THR-1681).
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
  // Second amendment 2026-09-26 (plan § Amendment (second), decision 1): the change
  // ships gating the band the dice control — novice — because the world holds almost
  // no content above it (234 novice / 41 journeyman / 1 expert / 1 master templates).
  // The whole-design kill criterion stays in force for this band.
  const reports = new Map<number, EngagementKpiReport>();
  const reportFor = (seed: number): EngagementKpiReport => {
    if (!reports.has(seed)) reports.set(seed, runWorld(seed, 120));
    return reports.get(seed)!;
  };

  it('the novice band succeeds level on the re-fitted dice (THR-1581)', () => {
    for (const seed of [42, 99]) {
      const novice = reportFor(seed).bands.find(b => b.band === 'novice')!;
      // Non-vacuity: an uncovered band would pass the range check by skipping it.
      expect(novice.covered, `seed ${seed} novice coverage (${novice.engagements} engagements)`).toBe(true);
      expect(novice.successRate, `seed ${seed} novice`).toBeGreaterThanOrEqual(KPI_BAND_SUCCESS_MIN - KPI_BAND_TOLERANCE);
      expect(novice.successRate, `seed ${seed} novice`).toBeLessThanOrEqual(KPI_BAND_SUCCESS_MAX + KPI_BAND_TOLERANCE);
    }
  }, 600_000);

  // THR-1627 (plan `Docs/plans/2026-09-29-thr-1627-content-above-novice.md` § Systems
  // design item 5): with local's offset at 0 the level-success clause runs live for
  // every band that is covered and inside the range on both seeds. Measured at the
  // ruling (seed 42 / 99): journeyman 0.59 / 0.64, expert 0.50 / 0.68 — live;
  // master 0.74 / 0.59 — seed 42 outside, so it stays skipped until its content lands.
  it.each(['journeyman', 'expert'] as const)('the %s band succeeds level (THR-1627)', (band) => {
    for (const seed of [42, 99]) {
      const b = reportFor(seed).bands.find(x => x.band === band)!;
      // Non-vacuity: an uncovered band would pass the range check by skipping it.
      expect(b.covered, `seed ${seed} ${band} coverage (${b.engagements} engagements)`).toBe(true);
      expect(b.successRate, `seed ${seed} ${band}`).toBeGreaterThanOrEqual(KPI_BAND_SUCCESS_MIN - KPI_BAND_TOLERANCE);
      expect(b.successRate, `seed ${seed} ${band}`).toBeLessThanOrEqual(KPI_BAND_SUCCESS_MAX + KPI_BAND_TOLERANCE);
    }
  }, 600_000);

  // TODO(THR-1681): un-skip when the master everyday batch lands — 0.74 on seed 42 at the ruling.
  it.skip('the master band succeeds level', () => {
    for (const seed of [42, 99]) {
      const b = reportFor(seed).bands.find(x => x.band === 'master')!;
      expect(b.covered, `seed ${seed} master coverage (${b.engagements} engagements)`).toBe(true);
      expect(b.successRate, `seed ${seed} master`).toBeGreaterThanOrEqual(KPI_BAND_SUCCESS_MIN - KPI_BAND_TOLERANCE);
      expect(b.successRate, `seed ${seed} master`).toBeLessThanOrEqual(KPI_BAND_SUCCESS_MAX + KPI_BAND_TOLERANCE);
    }
  }, 600_000);

  // THR-1676 (journeyman everyday batch 1) re-arms the rise's first rung: journeymen
  // attempt harder content than novices. Measured after the batch (seed 42 / 99):
  // novice 0.12 / 0.10, journeyman 0.17 / 0.18. Each later band batch adds its rung.
  it('journeymen attempt harder content than novices (THR-1676)', () => {
    for (const seed of [42, 99]) {
      const report = reportFor(seed);
      const novice = report.bands.find(b => b.band === 'novice')!;
      const journeyman = report.bands.find(b => b.band === 'journeyman')!;
      // Non-vacuity: an uncovered band would pass the comparison by skipping it.
      expect(novice.covered && journeyman.covered, `seed ${seed} coverage`).toBe(true);
      expect(journeyman.meanAttemptedDifficulty, `seed ${seed} novice→journeyman`)
        .toBeGreaterThan(novice.meanAttemptedDifficulty);
    }
  }, 600_000);

  // TODO(THR-1681): un-skip when the master everyday batch lands (plan § D4: S7 re-arms
  // the in-window clause). After THR-1676 on seed 42 the band means are 0.12 / 0.17 /
  // 0.11 / 0.14 (expert does not rise) and in-window is 0.47.
  it.skip('attempted difficulty rises with proficiency, and most choices are in-window', () => {
    for (const seed of [42, 99]) {
      const report = reportFor(seed);
      const covered = PROFICIENCY_BANDS
        .map(band => report.bands.find(b => b.band === band)!)
        .filter(b => b.covered);
      for (let i = 1; i < covered.length; i++) {
        expect(covered[i].meanAttemptedDifficulty, `seed ${seed} ${covered[i - 1].band}→${covered[i].band}`)
          .toBeGreaterThan(covered[i - 1].meanAttemptedDifficulty);
      }
      expect(report.inWindowShare, `seed ${seed}`).toBeGreaterThanOrEqual(KPI_IN_WINDOW_MIN);
    }
  }, 600_000);
});
