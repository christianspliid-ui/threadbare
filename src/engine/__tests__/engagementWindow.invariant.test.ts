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
// rise's novice→journeyman rung; THR-1681 un-skips master level success. THR-1687 ships
// the board fix behind CAP_FILL_LOCAL_ORDER (now 'template_hash', plan § D4) and splits the
// rest of the rise: journeyman→expert armed by that flip, expert→master on master content
// (THR-1688), the in-window share on the window (THR-1689). THR-1688's master content
// lifted the band but did not separate it from expert, so expert→master and master level
// success now wait on THR-1689 too.
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
  //
  // THR-1572 (recalibration, 2026-10-03): coverage stays per seed, but the level
  // clause reads the band's success **pooled across both seeds**. At ~70 engagements
  // the binomial standard error is ~0.055, wider than `KPI_BAND_TOLERANCE`, so a
  // per-seed reading flips on world drift alone. Measured over six seeds × 120 ticks,
  // the expert rate on main ran 0.554–0.708 (seed 13 already over the ceiling); with
  // generated spells it ran 0.598–0.718. Means: 0.622 on main, 0.648 with the change,
  // which is inside the noise. Seed 42's expert went from 0.621 to 0.718 as its world
  // re-rolled (its master band fell from 0.592 to 0.488 in the same run). Pooling
  // doubles n and keeps every bound.
  //
  // THR-1688 skips the expert row and keeps journeyman live. Adding the eight master
  // everyday encounters moved expert success pooled over 42 + 99 from ~0.60 to 0.712
  // (0.551 / 0.644 → 0.706 / 0.718), past the ceiling. The new content is not what
  // experts succeed on: they chose it 1 / 2 times on those seeds; the rise is all old
  // content (0.71 / 0.72), and masters chose the new work only 3 / 6 times in ~70. Over
  // seven seeds (42, 99, 7, 1, 2, 3, 11) pooled expert success went 0.649 → 0.701, on the
  // ceiling — the same drift-to-ceiling the master row showed (THR-1626), and THR-1689's
  // first lead (experts pick work they are too good for). Not tuned to pass.
  //
  // THR-1740 re-armed the expert row (below) with the window re-plan: quests face the
  // window for unthreaded mortals and sure things stop paying twice. Measured on the
  // branch, seeds 42 / 99: expert 0.607 / 0.570 (n 107 / 121), condition unchanged.
  it.each(['journeyman'] as const)('the %s band succeeds level (THR-1627)', (band) => {
    let engagements = 0;
    let successes = 0;
    for (const seed of [42, 99]) {
      const b = reportFor(seed).bands.find(x => x.band === band)!;
      // Non-vacuity: an uncovered band would pass the range check by skipping it.
      expect(b.covered, `seed ${seed} ${band} coverage (${b.engagements} engagements)`).toBe(true);
      engagements += b.engagements;
      successes += b.successRate * b.engagements;
    }
    const pooled = successes / engagements;
    expect(pooled, `${band} pooled over seeds 42 + 99`).toBeGreaterThanOrEqual(KPI_BAND_SUCCESS_MIN - KPI_BAND_TOLERANCE);
    expect(pooled, `${band} pooled over seeds 42 + 99`).toBeLessThanOrEqual(KPI_BAND_SUCCESS_MAX + KPI_BAND_TOLERANCE);
  }, 600_000);

  it('the expert band succeeds level (THR-1627)', () => {
    let engagements = 0;
    let successes = 0;
    for (const seed of [42, 99]) {
      const b = reportFor(seed).bands.find(x => x.band === 'expert')!;
      expect(b.covered, `seed ${seed} expert coverage (${b.engagements} engagements)`).toBe(true);
      engagements += b.engagements;
      successes += b.successRate * b.engagements;
    }
    const pooled = successes / engagements;
    expect(pooled, 'expert pooled over seeds 42 + 99').toBeGreaterThanOrEqual(KPI_BAND_SUCCESS_MIN - KPI_BAND_TOLERANCE);
    expect(pooled, 'expert pooled over seeds 42 + 99').toBeLessThanOrEqual(KPI_BAND_SUCCESS_MAX + KPI_BAND_TOLERANCE);
  }, 600_000);

  // THR-1681 (plan § D4, S7's re-arm): the master band runs live once it is covered and
  // inside the range on both seeds. Measured at THR-1681's pickup (seed 42 / 99 / 7, the
  // gameplay report): 0.59 / 0.67 / 0.61. Master mortals reach that level on content
  // below their band — no master-fit everyday template survives to their board yet —
  // so this clause pins *level success*, not a rise; the rise stays skipped below.
  //
  // Skipped again by THR-1626 — not because found rewards lift masters, but because the
  // clause sits on the ceiling on main. Measured 2026-10-03, seven seeds × 120 ticks,
  // found rewards off / on: 42 0.625/0.673 · 99 0.698/0.729 · 7 0.655/0.760 ·
  // 1 0.714/0.662 · 2 0.701/0.677 · 3 0.592/0.604 · 11 0.750/0.708 — means 0.676 / 0.688,
  // n ≈ 45–95 per cell (SE ≈ 0.06). Main is above the 0.70 ceiling on 3 of 7 seeds; the
  // clause held only because its two pinned seeds sat under it, and any change that moves
  // the world off its old path crosses it. Masters reach level on content below their
  // band, so their rate floats at the ceiling until master-fit content reaches their
  // board.
  //
  // THR-1688 shipped that content (8 master everyday encounters, one per reach, mean step
  // 0.77–0.79) and the clause still sits on the ceiling. Master success, seeds 42 / 99:
  // 0.740 / 0.691 → 0.690 / 0.750; seven-seed mean (42, 99, 7, 1, 2, 3, 11) 0.747 → 0.715.
  // Masters still attempt work far below their window (mean attempted 0.207 → 0.229
  // against authored 0.77), so the content reaches them and they mostly pass it over —
  // the out-of-window question, not a content gap (THR-1689).
  //
  // Heads-up for whoever flips CAP_FILL_LOCAL_ORDER to 'template_hash' (THR-1687): with
  // the hashed order, expert work reaches masters too and sits below their window —
  // master success measured 0.76 on seed 42 (ceiling 0.70), and 0.59 / 0.66 / 0.58 →
  // 0.76 / 0.76 / 0.74 in the gameplay report. Master-fit content (THR-1688) is the remedy
  // for both the ceiling drift above and the flip's push.
  //
  // THR-1740 re-armed it with the window re-plan, condition unchanged. Masters had been
  // padding their record with near-certain branching quests (THR-1689); with quests facing
  // the window and value odds-neutral above its midpoint, master success on seeds 42 / 99
  // reads 0.508 / 0.620 (n 63 / 50).
  it('the master band succeeds level (THR-1681)', () => {
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

  // THR-1687 split the old whole-rise-plus-window clause into three, so each rung arms on
  // its own evidence. The cap's own-hex pass fills in catalogue order and cuts expert
  // everyday templates on ~99% of the decisions that could see them.
  const bandOf = (report: EngagementKpiReport, band: (typeof PROFICIENCY_BANDS)[number]) =>
    report.bands.find(b => b.band === band)!;

  // Armed by THR-1687's flip (plan § D4): with CAP_FILL_LOCAL_ORDER = 'template_hash',
  // expert everyday content reaches expert deciders and their attempted difficulty rises
  // above journeymen's.
  //
  // THR-1737 skipped it on seed 99. A departing mortal now prices work at its longest roll,
  // so an expert with a meeting to reach drops long expert work it cannot finish. That is
  // the intended behaviour, and it shaves the rise. Expert vs journeyman, seven seeds
  // (42, 99, 7, 1, 2, 3, 11; seeds 1, 3, 42 identical in both arms):
  //   before 0.251/0.198 · 0.216/0.205 · 0.201/0.200 · 0.245/0.220 · 0.259/0.204 · 0.184/0.209 · 0.229/0.208
  //   after  0.251/0.198 · 0.203/0.213 · 0.207/0.208 · 0.245/0.220 · 0.253/0.198 · 0.184/0.209 · 0.215/0.203
  // Means 0.226 vs 0.206 → 0.223 vs 0.207: the rise holds pooled. Per seed it held on 6 of 7,
  // now on 5 of 7. Seed 99's gap was +0.011 before (a knife edge). THR-1689 found experts
  // mostly choosing near-certain branching quests below their window. Its re-plan's probe
  // (quest exemption off) took expert attempted difficulty 0.20–0.23 → 0.28–0.30, which is
  // what lifts this rung off the edge.
  //
  // THR-1740 re-armed it with the window re-plan, condition unchanged. Seeds 42 / 99:
  // expert 0.290 / 0.282 against journeyman 0.226 / 0.261.
  it('experts attempt harder content than journeymen', () => {
    for (const seed of [42, 99]) {
      const report = reportFor(seed);
      const journeyman = bandOf(report, 'journeyman');
      const expert = bandOf(report, 'expert');
      // Non-vacuity: an uncovered band would pass the comparison by skipping it.
      expect(journeyman.covered && expert.covered, `seed ${seed} coverage`).toBe(true);
      expect(expert.meanAttemptedDifficulty, `seed ${seed} journeyman→expert`)
        .toBeGreaterThan(journeyman.meanAttemptedDifficulty);
    }
  }, 600_000);

  // THR-1687 measured master 0.18 / 0.17 / 0.16 against expert 0.24 / 0.23 / 0.23 in the
  // prototype: masters had no everyday content of their own. THR-1688 authored it (one per
  // reach) and re-measured, seeds 42 / 99: master 0.216 / 0.253 against expert 0.251 /
  // 0.216 — harder on 99, not on 42. Over seven seeds masters out-attempt experts on 3
  // (99, 7, 3); means master 0.207 → 0.229, expert 0.218 → 0.226. The content rises the
  // band without separating it, so the clause stays skipped (never tuned to pass).
  // THR-1740's window re-plan did not separate them either: seeds 42 / 99 read master
  // 0.241 / 0.295 against expert 0.290 / 0.282 — harder on 99, not on 42. Masters still
  // choose master-band content under 9% of the time; that is content volume.
  // THR-1742 measured why (audit `Docs/audits/2026-10-06-thr-1742-master-band.md`): own-reach
  // master work is near every master and passes every gate, then the cap's fair draw keeps it
  // on 20.5% of master boards (one template per reach, q ≈ 0.215). A probe keeping it on ~76%
  // separates the rung on 42 / 99 / 7; 44–60% flips on noise.
  // TODO(THR-1757): un-skip once master work reaches masters' boards (content or cap route).
  it.skip('masters attempt harder content than experts', () => {
    for (const seed of [42, 99]) {
      const report = reportFor(seed);
      const expert = bandOf(report, 'expert');
      const master = bandOf(report, 'master');
      expect(expert.covered && master.covered, `seed ${seed} coverage`).toBe(true);
      expect(master.meanAttemptedDifficulty, `seed ${seed} expert→master`)
        .toBeGreaterThan(expert.meanAttemptedDifficulty);
    }
  }, 600_000);

  // THR-1740 (Decision 2) re-armed this on the mortal's **own** window — the edges the
  // scorer used after courage and setback shifts — against KPI_IN_WINDOW_MIN 0.50
  // ("most"; was 0.60 against the static window). Seeds 42 / 99: own 0.557 / 0.555,
  // static 0.521 / 0.529.
  it('most free choices are in-window', () => {
    for (const seed of [42, 99]) {
      expect(reportFor(seed).ownWindowShare, `seed ${seed}`).toBeGreaterThanOrEqual(KPI_IN_WINDOW_MIN);
    }
  }, 600_000);
});
