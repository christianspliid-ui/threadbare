/**
 * THR-1967 (undertakings S3) — the founding-starvation kill line, measured on real
 * seeded worlds. Plan: Docs/plans/2026-10-17-thr-1937-undertakings-in-the-economy.md
 * § Kill criteria / § Done when S3.
 *
 * One arm per bundle: `measure-founding-starvation.build.mjs` builds this file twice —
 * as shipped (founding costs off) and with `MEANS_CELL_COST_ENABLED` patched on — and
 * compares. Each run prints one JSON line per seed:
 *   - foundings: settlements standing at the end that did not exist at t0;
 *   - tradePaid / tradeRuns: Means paid by trade runs, and runs paid;
 *   - dominateCompleted: Dominate Regional Trade completions;
 *   - lanesHeld2: deciders holding at least two lanes at the end.
 *
 * Usage: npm run measure:founding-starvation [-- --seeds 42 --ticks 600 --map medium]
 */

import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { enableTracing, getTraces, clearTraces } from '../src/engine/traceBuffer';
import { isSettlement } from '../src/engine/factionPurse/income';
import { getLocationNodes } from '../src/engine/sublocationShape';
import { heldLaneIds } from '../src/engine/graphConditions';
import { MEANS_CELL_COST_ENABLED } from '../src/data/mortal-means-constants';

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const SEEDS = (argValue('--seeds') ?? '42').split(',').map(Number);
const TICKS = Number(argValue('--ticks') ?? 600);
const MAP = (argValue('--map') ?? 'medium') as MapSizePreset;

function runSeed(seed: number) {
  resetEventCounter();
  clearTraces();
  enableTracing();
  const runtime = createSimulationRuntime();
  const archetype = generateArchetypes(4, seed)[0];
  const preset = MAP_SIZE_PRESETS[MAP];
  let { state } = initializeGameState(archetype, 'FoundingStarvationMeasure', createBalancedCosmology(), seed, preset.cols, preset.rows);
  const atStart = new Set(getLocationNodes(state.graph).filter(isSettlement).map(n => n.id));

  let tradePaid = 0;
  let tradeRuns = 0;
  let tradeSkipped = 0;
  for (let i = 0; i < TICKS; i++) {
    state = runTick(state, [], runtime);
    // Drain each tick so the ring buffer never drops a pay row.
    for (const t of getTraces()) {
      if (t.category !== 'undertaking.economy.trade_pay') continue;
      const row = t as unknown as { paid: number; skipped: string | null };
      if (row.skipped) tradeSkipped++;
      else if (row.paid > 0) { tradePaid += row.paid; tradeRuns++; }
    }
    clearTraces();
  }
  const g = state.graph;
  const foundings = getLocationNodes(g).filter(n => isSettlement(n) && !atStart.has(n.id)).length;
  let dominateCompleted = 0;
  for (const e of g.getEdgesByType('pursues')) {
    if (e.properties?.status !== 'completed') continue;
    if (g.getNode(e.target)?.properties.templateId === 'ambition_dominate_trade') dominateCompleted++;
  }
  const lanesHeld2 = g.getNodesByType('actor')
    .filter(n => n.properties.actorType === 'individual' && heldLaneIds(g, n.id).size >= 2).length;
  return { seed, ticks: state.tick, costsOn: MEANS_CELL_COST_ENABLED, foundings, tradePaid, tradeRuns, tradeSkipped, dominateCompleted, lanesHeld2 };
}

for (const seed of SEEDS) console.log(JSON.stringify(runSeed(seed)));
