/**
 * census:ownership (THR-1436) — objects · owned · owned by a deciding mortal, per
 * undertaking object type, on a generated world.
 *
 * The number THR-1436 moves (six types read ownership through an edge the world never
 * wrote, or ignored the one it did) and the number THR-1437's seeding is measured on.
 * Reads the registry through the same `ownershipCensus` the CLI `objects` readout
 * uses, so the two never disagree.
 *
 *   npm run census:ownership -- [--seeds 42,99] [--map medium] [--ticks 0] [--json <file>]
 */
import { writeFileSync } from 'fs';
import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits';
import { isAutonomousDecisionActor } from '../src/engine/strategicKindReachability';
import {
  UNDERTAKING_OBJECT_TYPES,
  ownershipCensus,
  type OwnershipCensusRow,
} from '../src/data/undertaking-objects';

interface Args {
  seeds: number[];
  map: MapSizePreset;
  ticks: number;
  json: string | null;
}

function parseArgs(): Args {
  const a = process.argv.slice(2);
  const get = (k: string, d: string): string => {
    const i = a.indexOf(k);
    return i >= 0 && a[i + 1] !== undefined ? a[i + 1] : d;
  };
  return {
    seeds: get('--seeds', '42,99').split(',').map(Number).filter(n => Number.isFinite(n)),
    map: get('--map', 'medium') as MapSizePreset,
    ticks: Number(get('--ticks', '0')),
    json: a.includes('--json') ? get('--json', 'census-ownership.json') : null,
  };
}

interface SeedCensus {
  seed: number;
  map: MapSizePreset;
  ticks: number;
  rows: OwnershipCensusRow[];
}

function censusSeed(seed: number, map: MapSizePreset, ticks: number): SeedCensus {
  resetEventCounter();
  resetReputationTraitInit();
  const runtime = createSimulationRuntime();
  const preset = MAP_SIZE_PRESETS[map];
  const archetype = generateArchetypes(4, seed)[0];
  let { state } = initializeGameState(archetype, 'Census', createBalancedCosmology(), seed, preset.cols, preset.rows);
  for (let i = 0; i < ticks; i++) state = runTick(state, [], runtime);
  const rows = UNDERTAKING_OBJECT_TYPES.map(type => ownershipCensus(state.graph, type, isAutonomousDecisionActor));
  return { seed, map, ticks, rows };
}

function printTable(result: SeedCensus): void {
  console.log(`\nseed ${result.seed} · ${result.map} · tick ${result.ticks}`);
  console.log('| kind | objects | owned | owned by a deciding mortal |');
  console.log('|---|---:|---:|---:|');
  for (const row of result.rows) {
    console.log(`| ${row.objectTypeId} | ${row.objects} | ${row.owned} | ${row.ownedByDeciding} |`);
  }
}

const args = parseArgs();
const results: SeedCensus[] = [];
for (const seed of args.seeds) {
  const t0 = Date.now();
  const result = censusSeed(seed, args.map, args.ticks);
  results.push(result);
  printTable(result);
  console.log(`(${((Date.now() - t0) / 1000).toFixed(1)}s)`);
}
if (args.json) {
  writeFileSync(args.json, JSON.stringify(results, null, 2));
  console.log(`wrote ${args.json}`);
}
