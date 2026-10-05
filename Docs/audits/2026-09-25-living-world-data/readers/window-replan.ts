// THR-1740: the forecast-window re-plan's arms, measured side by side.
//
// Runs BOTH worlds per seed:
//   - unattended: the `gameplay-report` world (random archetype + balanced cosmology, medium map) —
//     the one the KPI table and THR-1689's audit quote;
//   - attended: the `?view=game&seeded&size=medium` world (`readers/attended.ts` setup — The First
//     bonded, the dev test package seeded), ticked with plain `runTick`, i.e. `__DEBUG.tick(n)` with no clicks.
// and reports `computeGameplayKpiReport`'s engagement gauge + branching-fire rate, plus branching fires
// whose actor is threaded to the ascendant (the population THR-452/465's exemption was written for).
//
// Arms are BUILD-TIME patches (`window-replan.build.mjs`), never shipped. This file changes nothing.
//
// Usage: node .cache/window-replan-<arm>.mjs <seeds> <ticks> [--modes attended,unattended] [--json <path>]
import * as fs from 'fs';
import { initializeGameState, initializeGameStateFromIdentity, devSeedTheFirst, devSeedAscendantTestPackage, DEV_ASCENDANT_IDENTITY, MAP_SIZE_PRESETS } from '../../../../src/engine/gameInit';
import { runTick, resetEventCounter, resetDecisionCache } from '../../../../src/engine/orchestrator';
import { createBalancedCosmology } from '../../../../src/engine/cosmology';
import { deriveCosmologyFromIdentity } from '../../../../src/engine/remembrance';
import { generateArchetypes } from '../../../../src/engine/ascendant';
import { createSimulationRuntime } from '../../../../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../../../../src/engine/phaseReputationTraits';
import { computeGameplayKpiReport, isBranchingTemplate } from '../../../../src/engine/kpi/gameplayKpi';

const argv = process.argv.slice(2);
const seeds = (argv[0] ?? '42,99,7').split(',').map(Number);
const TICKS = Number(argv[1] ?? 120);
const modes = (argv.includes('--modes') ? argv[argv.indexOf('--modes') + 1] : 'unattended,attended').split(',');
const jsonOut = argv.includes('--json') ? argv[argv.indexOf('--json') + 1] : undefined;
const ARM = (globalThis as any).__WINDOW_REPLAN_ARM ?? 'main';

function runSeed(seed: number, mode: string) {
  resetDecisionCache(); resetEventCounter(); resetReputationTraitInit();
  const runtime = createSimulationRuntime();
  let state: any;
  if (mode === 'attended') {
    const cosmology = deriveCosmologyFromIdentity({ sphereAlignment: DEV_ASCENDANT_IDENTITY.sphereAlignment, mortalTags: DEV_ASCENDANT_IDENTITY.mortalTags, hungerId: DEV_ASCENDANT_IDENTITY.hungerId });
    ({ state } = initializeGameStateFromIdentity(DEV_ASCENDANT_IDENTITY, seed, cosmology, 'medium'));
    devSeedTheFirst(state);
    devSeedAscendantTestPackage(state);
  } else {
    const preset = MAP_SIZE_PRESETS['medium'];
    ({ state } = initializeGameState(generateArchetypes(4, seed)[0], 'KpiReport', createBalancedCosmology(), seed, preset.cols, preset.rows));
  }
  // Branching fires by threaded actors: harvest each action once, before the resolved-action prune.
  const seen = new Set<string>();
  let threadedBranching = 0; let branchingAll = 0;
  const harvest = () => {
    const threaded = new Set<string>();
    if (state.ascendantId) for (const e of state.graph.getOutgoingEdges(state.ascendantId, 'thread')) threaded.add(e.target);
    for (const a of state.unifiedActions ?? []) {
      if (!a.resolved || seen.has(a.actionId)) continue;
      seen.add(a.actionId);
      if (!isBranchingTemplate(a.templateId)) continue;
      branchingAll++;
      if (threaded.has(a.actorId)) threadedBranching++;
    }
  };
  for (let i = 0; i < TICKS; i++) { state = runTick(state, [], runtime); harvest(); }
  const r = computeGameplayKpiReport(state, runtime);
  const e = r.engagement!;
  const band = (b: string) => e.bands.find(x => x.band === b);
  return {
    arm: ARM, mode, seed, ticks: TICKS,
    inWindow: e.inWindowShare, freeChoice: e.freeChoiceCommits, idle: e.idleRate,
    retry: e.retryAfterFailureRate, streakP95: e.maxFailureStreakP95,
    bands: Object.fromEntries(['novice', 'journeyman', 'expert', 'master'].map(b => [b, { n: band(b)?.engagements ?? 0, success: band(b)?.successRate ?? NaN, diff: band(b)?.meanAttemptedDifficulty ?? NaN }])),
    totalSuccess: r.outcomes.totalSuccessRate,
    branchingPer30: r.branchingFire.firesPerChunk, branchingTotal: r.branchingFire.totalFires,
    branchingHarvested: branchingAll, threadedBranching, threadedBranchingPer30: TICKS > 0 ? threadedBranching / TICKS * 30 : 0,
    topShare: r.templateConcentration.topShare, entropy: r.templateConcentration.entropy,
  };
}

const rows: any[] = [];
const f2 = (n: number) => Number.isFinite(n) ? n.toFixed(3) : '  -  ';
for (const mode of modes) for (const seed of seeds) {
  const row = runSeed(seed, mode);
  rows.push(row);
  const b = row.bands;
  console.log(`${ARM.padEnd(12)} ${mode.padEnd(10)} seed ${String(seed).padStart(3)}  inWin ${f2(row.inWindow)} (n=${row.freeChoice})  idle ${f2(row.idle)}  retry ${f2(row.retry)}  p95 ${row.streakP95}  ` +
    `succ nov ${f2(b.novice.success)}/${b.novice.n} jour ${f2(b.journeyman.success)}/${b.journeyman.n} exp ${f2(b.expert.success)}/${b.expert.n} mas ${f2(b.master.success)}/${b.master.n}  ` +
    `diff ${f2(b.novice.diff)} ${f2(b.journeyman.diff)} ${f2(b.expert.diff)} ${f2(b.master.diff)}  ` +
    `branch/30t ${f2(row.branchingPer30)} (threaded ${row.threadedBranching}, ${f2(row.threadedBranchingPer30)}/30t)  top ${f2(row.topShare)} ent ${f2(row.entropy)}`);
}
if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(rows, null, 1));
