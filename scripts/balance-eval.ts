/**
 * Balance Evaluation Runner — headless multi-run balance measurement.
 *
 * Usage:
 *   npm run balance:smoke              # 3 seeds × 200 ticks
 *   npm run balance:cadence            # 5 seeds × 500 ticks
 *   npm run balance:journey            # 3 seeds × 300 ticks, tracks hero journey
 *   npm run balance:seed -- --seed 42  # single seed with defaults
 *
 * Flags:
 *   --seed N         Single seed override
 *   --seeds N,N,...  Comma-separated list of seeds
 *   --ticks N        Ticks per run
 *   --profile <name> smoke | cadence | journey
 *   --track-agent    Force agent journey tracking
 *   --out-dir <dir>  Output directory (default: Docs/playtests/balance)
 */

import * as fs from 'fs';
import * as path from 'path';

import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { setTrackedAgents, selectDefaultTrackedHero } from '../src/engine/balanceTelemetry';
import { buildBalanceRunSummary, buildBalanceAgentJourneySummary, buildBalanceCohortSummary } from '../src/engine/balanceSummary';
import { evaluateBalanceSummary, formatEvaluationReport } from '../src/engine/balanceEvaluator';
import { getDefaultBalanceTargets, BALANCE_TARGETS_VERSION } from '../src/engine/balanceTargets';
import type { BalanceRunSummary, BalanceEvalProfile } from '../src/types/balanceEval';

// ─── Profiles ────────────────────────────────────────────────────

const PROFILES: Record<string, BalanceEvalProfile> = {
  smoke: {
    name: 'smoke',
    description: 'Quick sanity check: 3 seeds × 200 ticks',
    seeds: [42, 137, 256],
    ticksPerRun: 200,
    trackAgent: false,
  },
  cadence: {
    name: 'cadence',
    description: 'Cadence measurement: 5 seeds × 500 ticks',
    seeds: [42, 137, 256, 512, 999],
    ticksPerRun: 500,
    trackAgent: false,
  },
  journey: {
    name: 'journey',
    description: 'Hero journey tracking: 3 seeds × 300 ticks with tracked hero',
    seeds: [42, 137, 256],
    ticksPerRun: 300,
    trackAgent: true,
  },
};

// ─── Arg Parsing ─────────────────────────────────────────────────

interface RunnerArgs {
  seeds: number[];
  ticksPerRun: number;
  profile: keyof typeof PROFILES;
  trackAgent: boolean;
  outDir: string;
  mapSize: MapSizePreset;
}

function parseArgs(): RunnerArgs {
  const argv = process.argv.slice(2);
  let profile: keyof typeof PROFILES = 'smoke';
  let seedOverride: number[] | null = null;
  let ticksOverride: number | null = null;
  let trackAgent = false;
  let outDir = 'Docs/playtests/balance';
  let mapSize: MapSizePreset = 'small';

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--profile' && i + 1 < argv.length) {
      const p = argv[++i];
      if (p in PROFILES) profile = p as keyof typeof PROFILES;
      else { console.error(`Unknown profile: ${p}. Valid: ${Object.keys(PROFILES).join(', ')}`); process.exit(1); }
    } else if (arg === '--seed' && i + 1 < argv.length) {
      const s = parseInt(argv[++i], 10);
      if (!isNaN(s)) seedOverride = [s];
    } else if (arg === '--seeds' && i + 1 < argv.length) {
      seedOverride = argv[++i].split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    } else if (arg === '--ticks' && i + 1 < argv.length) {
      const t = parseInt(argv[++i], 10);
      if (!isNaN(t)) ticksOverride = t;
    } else if (arg === '--track-agent') {
      trackAgent = true;
    } else if (arg === '--out-dir' && i + 1 < argv.length) {
      outDir = argv[++i];
    } else if (arg === '--map' && i + 1 < argv.length) {
      const m = argv[++i] as MapSizePreset;
      if (m in MAP_SIZE_PRESETS) mapSize = m;
    }
  }

  const base = PROFILES[profile];
  return {
    seeds: seedOverride ?? base.seeds,
    ticksPerRun: ticksOverride ?? base.ticksPerRun,
    profile,
    trackAgent: trackAgent || base.trackAgent,
    outDir,
    mapSize,
  };
}

// ─── Single run ───────────────────────────────────────────────────

function runOnce(seed: number, ticks: number, mapSize: MapSizePreset, trackAgent: boolean): {
  summary: BalanceRunSummary;
  heroId?: string;
} {
  resetEventCounter();
  const runtime = createSimulationRuntime();
  const cosmology = createBalancedCosmology();
  const preset = MAP_SIZE_PRESETS[mapSize];
  const archetypes = generateArchetypes(4, seed);
  const archetype = archetypes[0];

  const { state: initialState } = initializeGameState(
    archetype,
    'BalanceEval',
    cosmology,
    seed,
    preset.cols,
    preset.rows,
  );

  let state = initialState;

  // Set up hero tracking
  let heroId: string | undefined;
  if (trackAgent) {
    const actors = state.graph.getNodesByType('actor').filter(n => n.properties.actorType === 'individual');
    const candidate = selectDefaultTrackedHero(actors.map(n => n.id));
    if (candidate) {
      heroId = candidate;
      setTrackedAgents(runtime, [candidate]);
    }
  }

  for (let i = 0; i < ticks; i++) {
    state = runTick(state, [], runtime);
  }

  const summary = buildBalanceRunSummary(runtime, state.tick);
  if (!summary) throw new Error(`No summary produced for seed ${seed}`);

  return { summary, heroId };
}

// ─── Output ───────────────────────────────────────────────────────

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeFile(filepath: string, content: string): void {
  ensureDir(path.dirname(filepath));
  fs.writeFileSync(filepath, content, 'utf-8');
  console.log(`  Wrote: ${filepath}`);
}

// ─── Main ─────────────────────────────────────────────────────────

function main(): void {
  const args = parseArgs();
  const targets = getDefaultBalanceTargets();
  const profile = PROFILES[args.profile];

  const dateStr = new Date().toISOString().slice(0, 10);
  const outDir = args.outDir;

  console.log(`\nBalance Eval — profile: ${args.profile}  seeds: [${args.seeds.join(', ')}]  ticks: ${args.ticksPerRun}  map: ${args.mapSize}`);
  console.log(`Target version: ${BALANCE_TARGETS_VERSION}\n`);

  const perRunSummaries: BalanceRunSummary[] = [];

  for (const seed of args.seeds) {
    process.stdout.write(`  Running seed ${seed}... `);
    const start = Date.now();
    const { summary } = runOnce(seed, args.ticksPerRun, args.mapSize, args.trackAgent);
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    perRunSummaries.push(summary);

    const result = evaluateBalanceSummary(summary, targets);
    const countsStr = `pass:${result.counts.pass} warn:${result.counts.warning} fail:${result.counts.fail}`;
    console.log(`${result.overall.toUpperCase()} (${countsStr}) ${elapsed}s`);

    // Write per-run report
    const perRunReport = formatEvaluationReport(result, summary);
    writeFile(path.join(outDir, `${dateStr}-${args.profile}-seed${seed}.txt`), perRunReport);
  }

  // Write cohort summary
  const cohort = buildBalanceCohortSummary(perRunSummaries);
  const cohortResult = evaluateBalanceSummary(cohort.aggregated, targets);
  const cohortReport = [
    `# Cohort Balance Report — ${args.profile}`,
    `Date: ${dateStr}`,
    `Seeds: ${args.seeds.join(', ')}`,
    `Ticks per run: ${args.ticksPerRun}`,
    `Runs: ${cohort.runCount}`,
    '',
    formatEvaluationReport(cohortResult, cohort.aggregated),
  ].join('\n');

  writeFile(path.join(outDir, `${dateStr}-${args.profile}-cohort.txt`), cohortReport);

  // Write JSON snapshot (machine-readable)
  const jsonSnapshot = {
    date: dateStr,
    profile: args.profile,
    seeds: args.seeds,
    ticksPerRun: args.ticksPerRun,
    targetVersion: BALANCE_TARGETS_VERSION,
    cohortResult,
    cohortSummary: cohort.aggregated,
    perRunResults: perRunSummaries.map((s, i) => ({
      seed: args.seeds[i],
      summary: s,
      result: evaluateBalanceSummary(s, targets),
    })),
  };
  writeFile(
    path.join(outDir, `${dateStr}-${args.profile}-snapshot.json`),
    JSON.stringify(jsonSnapshot, null, 2),
  );

  console.log(`\nCohort overall: ${cohortResult.overall.toUpperCase()}`);
  console.log(`  pass: ${cohortResult.counts.pass}  warning: ${cohortResult.counts.warning}  fail: ${cohortResult.counts.fail}`);
  console.log(`\nOutputs written to: ${outDir}/`);
}

main();
