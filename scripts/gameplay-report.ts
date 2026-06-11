/**
 * Gameplay KPI Batch Report (THR-457).
 *
 * Runs the engine headlessly across multiple seeds and prints a KPI summary table.
 * Outputs JSON report to Docs/playtests/kpi/.
 *
 * Usage:
 *   npm run gameplay-report
 *   npm run gameplay-report -- --ticks 120 --seeds 42,99,7 --map medium
 *   npm run gameplay-report -- --json   # raw JSON to stdout
 */

import * as fs from 'fs';
import * as path from 'path';

import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits';
import { computeGameplayKpiReport } from '../src/engine/kpi/gameplayKpi';
import { KPI_REPORT_SEEDS, KPI_REPORT_TICKS } from '../src/engine/kpi/kpiConstants';
import type { GameplayKpiReport } from '../src/engine/kpi/gameplayKpi';

// ─── Args ─────────────────────────────────────────────────────────

interface Args {
  seeds: number[];
  ticks: number;
  mapSize: MapSizePreset;
  outDir: string;
  jsonOnly: boolean;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  let seeds: number[] | null = null;
  let ticks: number | null = null;
  let mapSize: MapSizePreset = 'medium';
  let outDir = 'Docs/playtests/kpi';
  let jsonOnly = false;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--seeds' && i + 1 < argv.length) {
      seeds = argv[++i].split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    } else if (a === '--seed' && i + 1 < argv.length) {
      const s = parseInt(argv[++i], 10);
      if (!isNaN(s)) seeds = [s];
    } else if (a === '--ticks' && i + 1 < argv.length) {
      const t = parseInt(argv[++i], 10);
      if (!isNaN(t)) ticks = t;
    } else if (a === '--map' && i + 1 < argv.length) {
      const m = argv[++i] as MapSizePreset;
      if (m in MAP_SIZE_PRESETS) mapSize = m;
    } else if (a === '--out-dir' && i + 1 < argv.length) {
      outDir = argv[++i];
    } else if (a === '--json') {
      jsonOnly = true;
    }
  }

  return {
    seeds: seeds ?? KPI_REPORT_SEEDS,
    ticks: ticks ?? KPI_REPORT_TICKS,
    mapSize,
    outDir,
    jsonOnly,
  };
}

// ─── Single run ───────────────────────────────────────────────────

function runOnce(seed: number, ticks: number, mapSize: MapSizePreset): GameplayKpiReport {
  resetEventCounter();
  resetReputationTraitInit();
  const runtime = createSimulationRuntime();
  const cosmology = createBalancedCosmology();
  const preset = MAP_SIZE_PRESETS[mapSize];
  const archetypes = generateArchetypes(4, seed);
  const archetype = archetypes[0];

  const { state: initialState } = initializeGameState(
    archetype,
    'KpiReport',
    cosmology,
    seed,
    preset.cols,
    preset.rows,
  );

  let state = initialState;
  for (let i = 0; i < ticks; i++) {
    state = runTick(state, [], runtime);
  }

  return computeGameplayKpiReport(state, runtime);
}

// ─── Output helpers ───────────────────────────────────────────────

const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

function statusColor(s: string): string {
  return s === 'green' ? GREEN : s === 'red' ? RED : YELLOW;
}

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function fix2(n: number): string {
  return n.toFixed(2);
}

function printReport(report: GameplayKpiReport): void {
  const o = report.outcomes;
  console.log(`\n  ${BOLD}Seed ${report.seed}  tick ${report.tick}${RESET}`);

  if (o.insufficientData) {
    console.log(`    ${YELLOW}⚠ low data (n=${o.total})${RESET}`);
  } else {
    console.log(`    failure:${pct(o.failureRate)}  critfail:${pct(o.critFailRate)}  clean_success:${pct(o.cleanSuccessRate)}`);
  }

  const tc = report.templateConcentration;
  console.log(`    top_share:${pct(tc.topShare)}  entropy:${fix2(tc.entropy)}  templates:${tc.byTemplate.length}`);
  console.log(`    branching_fires:${report.branchingFire.totalFires}  per30t:${fix2(report.branchingFire.firesPerChunk)}`);

  console.log(`    ${BOLD}Thresholds${RESET}`);
  for (const t of report.thresholds) {
    const col = statusColor(t.status);
    const mark = t.status === 'green' ? '✓' : t.status === 'red' ? '✗' : '~';
    console.log(`      ${col}${mark}${RESET} ${t.metric.padEnd(30)} ${fix2(t.value).padStart(6)}`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────

function main(): void {
  const args = parseArgs();
  const reports: GameplayKpiReport[] = [];

  if (!args.jsonOnly) {
    console.log(`\n${BOLD}Gameplay KPI Report${RESET}  seeds:[${args.seeds.join(',')}]  ticks:${args.ticks}  map:${args.mapSize}`);
  }

  for (const seed of args.seeds) {
    if (!args.jsonOnly) process.stdout.write(`  Running seed ${seed}... `);
    const start = Date.now();
    const report = runOnce(seed, args.ticks, args.mapSize);
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    reports.push(report);
    if (!args.jsonOnly) {
      const allGreen = report.thresholds.every(t => t.status === 'green');
      const hasRed = report.thresholds.some(t => t.status === 'red');
      const overall = hasRed ? `${RED}FAIL${RESET}` : allGreen ? `${GREEN}PASS${RESET}` : `${YELLOW}WARN${RESET}`;
      console.log(`${overall}  ${DIM}${elapsed}s${RESET}`);
    }
  }

  if (args.jsonOnly) {
    console.log(JSON.stringify(reports, null, 2));
    return;
  }

  for (const report of reports) {
    printReport(report);
  }

  // Write JSON output
  const dateStr = new Date().toISOString().slice(0, 10);
  const outFile = path.join(args.outDir, `${dateStr}-kpi-report.json`);
  if (!fs.existsSync(args.outDir)) fs.mkdirSync(args.outDir, { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify({ date: dateStr, seeds: args.seeds, ticks: args.ticks, reports }, null, 2), 'utf-8');
  console.log(`\n  Wrote: ${outFile}`);
}

main();
