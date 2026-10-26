/**
 * Commission census — THR-2042 Done-when evidence (CLI / headless, THR-688 rule C).
 *
 * Runs real worlds (`initializeGameState` → `runTick`) and reads every faction commission
 * at the end of the run, plus the `economy.commission` traces harvested every tick:
 *   - postings by status: `taken + lapsed + open = posted`;
 *   - the coin balances: escrow posted = escrow paid out + escrow refunded + escrow still held;
 *   - at least one commission taken on every seed (the plan's kill criterion).
 *
 * Each seed runs in its own child process: module state leaks across seeds run in one
 * process (the design lane's seed 7 read 75 factions / 47 postings when run second).
 * Exit code 1 when a seed takes none or a ledger does not balance.
 *
 * Usage:
 *   npm run census:commissions                       # seeds 42,99,7 × 360 ticks, medium
 *   npm run census:commissions -- --seeds 42 --ticks 120
 */

import { spawnSync } from 'child_process';
import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits';
import { clearTraces, enableTracing, getTraces } from '../src/engine/traceBuffer';
import { COMMISSION_QUEST_COST } from '../src/types/factionAction';

const DEFAULT_SEEDS: readonly number[] = [42, 99, 7];
const DEFAULT_TICKS = 360;

const argv = process.argv.slice(2);
function arg(name: string): string | undefined {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}
const seeds = (arg('--seeds') ?? DEFAULT_SEEDS.join(',')).split(',').map(Number);
const ticks = Number(arg('--ticks') ?? DEFAULT_TICKS);
const map = (arg('--map') ?? 'medium') as MapSizePreset;

interface SeedResult {
  seed: number;
  ticks: number;
  posted: number;
  taken: number;
  lapsed: number;
  open: number;
  takers: number;
  escrowPosted: number;
  escrowPaid: number;
  escrowRefunded: number;
  escrowHeld: number;
  tracesTaken: number;
  tracesLapsed: number;
  balanced: boolean;
}

function num(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function runSeed(seed: number): SeedResult {
  resetEventCounter();
  resetReputationTraitInit();
  const runtime = createSimulationRuntime();
  const preset = MAP_SIZE_PRESETS[map];
  let { state } = initializeGameState(
    generateArchetypes(4, seed)[0], 'Census', createBalancedCosmology(), seed, preset.cols, preset.rows,
  );
  enableTracing();
  clearTraces();
  let tracesTaken = 0;
  let tracesLapsed = 0;
  for (let t = 1; t <= ticks; t++) {
    state = runTick(state, [], runtime);
    for (const tr of getTraces() as unknown as Array<Record<string, unknown>>) {
      if (tr.category !== 'economy.commission') continue;
      if (tr.action === 'taken') tracesTaken++;
      else if (tr.action === 'lapsed') tracesLapsed++;
    }
    clearTraces();
  }

  const r: SeedResult = {
    seed, ticks, posted: 0, taken: 0, lapsed: 0, open: 0, takers: 0,
    escrowPosted: 0, escrowPaid: 0, escrowRefunded: 0, escrowHeld: 0,
    tracesTaken, tracesLapsed, balanced: false,
  };
  const takers = new Set<string>();
  for (const node of state.graph.getNodesByType('event')) {
    const p = node.properties;
    if (p.eventType !== 'faction_quest') continue;
    r.posted++;
    r.escrowPosted += COMMISSION_QUEST_COST;
    r.escrowPaid += num(p.escrowPaid);
    r.escrowRefunded += num(p.escrowRefunded);
    r.escrowHeld += num(p.escrow);
    if (p.status === 'taken') r.taken++;
    else if (p.status === 'lapsed') r.lapsed++;
    else r.open++;
    for (const e of state.graph.getIncomingEdges(node.id, 'took_up')) takers.add(e.source);
  }
  r.takers = takers.size;
  // A posting whose faction was gone at lapse refunds nothing; its escrow is then counted
  // in neither column, so the books balance only when no faction dissolved under one.
  r.balanced = r.taken + r.lapsed + r.open === r.posted
    && r.escrowPosted === r.escrowPaid + r.escrowRefunded + r.escrowHeld;
  return r;
}

if (seeds.length > 1) {
  let failed = false;
  for (const seed of seeds) {
    const child = spawnSync(process.execPath, [process.argv[1], '--seeds', String(seed), '--ticks', String(ticks), '--map', map], {
      stdio: 'inherit',
    });
    if (child.status !== 0) failed = true;
  }
  process.exit(failed ? 1 : 0);
} else {
  const r = runSeed(seeds[0]);
  console.log(JSON.stringify(r));
  const ok = r.taken >= 1 && r.balanced;
  if (!ok) console.error(`[census:commissions] seed ${r.seed}: ${r.taken < 1 ? 'no commission taken' : 'ledger does not balance'}`);
  process.exit(ok ? 0 : 1);
}
