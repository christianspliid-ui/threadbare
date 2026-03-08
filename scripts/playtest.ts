/**
 * Playtest Runner — headless simulation with snapshot capture and trace collection.
 *
 * Usage:
 *   npm run playtest [--seed N] [--seeds N,M,P] [--ticks N] [--interval N] [--min-sig N]
 *
 * Examples:
 *   npm run playtest --seed 42
 *   npm run playtest --seeds 1,2,3 --ticks 100
 *   npm run playtest --seed 99 --ticks 50 --interval 5 --min-sig 0.5
 */

import * as fs from 'fs';
import * as path from 'path';

// Game engine imports
import { initializeGameState } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import {
  enableTracing,
  disableTracing,
  getTraces,
  clearTraces,
} from '../src/engine/traceBuffer';

// Types
import { SPHERE_NAMES } from '../src/types/index';
import type { GameState, TickEvent } from '../src/types/gameState';
import type { TraceEntry } from '../src/types/trace';

// Report formatter
import { formatFullReport } from './playtest-format';
import type { Snapshot, PlaytestReportData } from './playtest-format';

// ─── Constants ────────────────────────────────────────────────────

const DEFAULT_TICKS = 50;
const DEFAULT_INTERVAL = 10;
const DEFAULT_MIN_SIG = 0.3;

// ─── CLI Argument Parsing ─────────────────────────────────────────

interface PlaytestArgs {
  seeds: number[];
  ticks: number;
  interval: number;
  minSig: number;
}

function parseArgs(): PlaytestArgs {
  const args = process.argv.slice(2);
  const result: PlaytestArgs = {
    seeds: [],
    ticks: DEFAULT_TICKS,
    interval: DEFAULT_INTERVAL,
    minSig: DEFAULT_MIN_SIG,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--seed' && i + 1 < args.length) {
      const seed = parseInt(args[i + 1], 10);
      if (!isNaN(seed)) {
        result.seeds.push(seed);
      }
      i++;
    } else if (arg === '--seeds' && i + 1 < args.length) {
      const seedStr = args[i + 1];
      const seeds = seedStr.split(',').map((s) => parseInt(s, 10));
      result.seeds.push(...seeds.filter((s) => !isNaN(s)));
      i++;
    } else if (arg === '--ticks' && i + 1 < args.length) {
      const ticks = parseInt(args[i + 1], 10);
      if (!isNaN(ticks) && ticks > 0) {
        result.ticks = ticks;
      }
      i++;
    } else if (arg === '--interval' && i + 1 < args.length) {
      const interval = parseInt(args[i + 1], 10);
      if (!isNaN(interval) && interval > 0) {
        result.interval = interval;
      }
      i++;
    } else if (arg === '--min-sig' && i + 1 < args.length) {
      const sig = parseFloat(args[i + 1]);
      if (!isNaN(sig) && sig >= 0 && sig <= 1) {
        result.minSig = sig;
      }
      i++;
    }
  }

  // If no seeds specified, default to seed 42
  if (result.seeds.length === 0) {
    result.seeds.push(42);
  }

  return result;
}

// ─── Snapshot Capture ─────────────────────────────────────────────

function captureSnapshot(state: GameState, tick: number): Snapshot {
  // Count individual actors
  const actors = state.graph.getNodesByType('actor');
  const agentCount = actors.filter((n) => n.properties.actorType === 'individual').length;

  // Compute reputation stats
  const reputations: number[] = [];
  for (const actor of actors) {
    if (actor.properties.reputationScore !== undefined) {
      reputations.push(actor.properties.reputationScore);
    }
  }
  reputations.sort((a, b) => a - b);
  const reputationStats = {
    min: reputations.length > 0 ? reputations[0] : 0,
    median:
      reputations.length > 0
        ? reputations[Math.floor(reputations.length / 2)]
        : 0,
    max: reputations.length > 0 ? reputations[reputations.length - 1] : 0,
  };

  // Sum essence across all spheres
  const essenceTotal = SPHERE_NAMES.reduce(
    (sum, sphere) => sum + (state.essencePool[sphere] ?? 0),
    0
  );

  // Count unique cultures via belongs_to edges
  const cultureSet = new Set<string>();
  for (const actor of actors) {
    const edges = state.graph.getOutgoingEdges(actor.id, 'belongs_to');
    for (const edge of edges) {
      cultureSet.add(edge.target);
    }
  }
  const cultureCount = cultureSet.size;

  // Get doom stage
  const doomStage = state.doomClock.currentStage;

  // Get mandate progress
  const mandateProgress = state.mandateState?.progress ?? 0;

  return {
    tick,
    doomStage,
    agentCount,
    essenceTotal,
    mandateProgress,
    reputationStats,
    cultureCount,
  };
}

// ─── Single Playtest Run ──────────────────────────────────────────

function runPlaytest(seed: number, maxTicks: number, snapshotInterval: number): PlaytestReportData {
  // Setup
  resetEventCounter();
  clearTraces();
  enableTracing();

  // Generate archetype and cosmology
  const archetypes = generateArchetypes(4, seed);
  const archetype = archetypes[0];
  const cosmology = createBalancedCosmology();

  // Initialize game
  const { state: initialState } = initializeGameState(
    archetype,
    'Playtester',
    cosmology,
    seed
  );

  let state = initialState;
  const snapshots: Snapshot[] = [];
  const allEvents: TickEvent[] = [];

  // Capture initial snapshot
  snapshots.push(captureSnapshot(state, 0));

  // Run ticks
  let tickCount = 0;
  while (tickCount < maxTicks && state.phase !== 'harvest') {
    state = runTick(state);
    tickCount++;

    // Collect events
    allEvents.push(...state.tickEvents);

    // Capture snapshot at intervals
    if (tickCount % snapshotInterval === 0) {
      snapshots.push(captureSnapshot(state, tickCount));
    }

    // Stop early if entered twilight or harvest phase
    if (state.phase === 'twilight' || state.phase === 'harvest') {
      break;
    }
  }

  // Final snapshot
  if (tickCount % snapshotInterval !== 0) {
    snapshots.push(captureSnapshot(state, tickCount));
  }

  // Collect traces and cleanup
  const traces = [...getTraces()];
  disableTracing();

  return {
    seed,
    totalTicks: tickCount,
    snapshots,
    allEvents,
    chronicleEntries: state.chronicleEntries,
    traces,
  };
}

// ─── Main ─────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = parseArgs();

  // Ensure output directory exists
  const playtestDir = path.join(process.cwd(), 'Docs', 'playtests');
  if (!fs.existsSync(playtestDir)) {
    fs.mkdirSync(playtestDir, { recursive: true });
  }

  console.log(`Running ${args.seeds.length} playtest(s)...`);
  console.log(`  Ticks per run: ${args.ticks}`);
  console.log(`  Snapshot interval: ${args.interval}`);
  console.log(`  Min significance: ${args.minSig}`);
  console.log('');

  for (const seed of args.seeds) {
    const startTime = Date.now();
    console.log(`[${seed}] Starting playtest...`);

    try {
      const data = runPlaytest(seed, args.ticks, args.interval);

      // Format and write report
      const report = formatFullReport(data);

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${timestamp}-seed-${seed}.md`;
      const filepath = path.join(playtestDir, filename);

      fs.writeFileSync(filepath, report, 'utf-8');

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`[${seed}] ✓ Complete (${elapsed}s) — ${filename}`);
    } catch (err) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[${seed}] ✗ Failed (${elapsed}s) — ${message}`);
    }
  }

  console.log('');
  console.log('Playtests complete.');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
