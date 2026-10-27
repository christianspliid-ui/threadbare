/**
 * Bounty census — THR-2072 Done-when evidence (CLI / headless, THR-688 rule C).
 *
 * Landed from the design lane's `proto/thr-bounty-census` and extended to count what the
 * build adds. Runs real worlds (`initializeGameState` → `runTick`) and reads:
 *   - bounty duels spawned (`fight.trigger` with `source: 'bounty'` and no `skipped`),
 *     per 30 days — the plan's band is 3–25 on every seed;
 *   - bounties by status: `collected + lapsed + active = posted`;
 *   - the coin: escrow posted = escrow paid out + escrow refunded + escrow still held;
 *   - collections (the `collected` edges), and how many bounty-duel losers died.
 *
 * Each seed runs in its own child process: module state leaks across seeds run in one
 * process. Exit code 1 when a seed's duels fall outside the band, a ledger does not
 * balance, or fewer than two seeds collect a bounty.
 *
 * Usage:
 *   npm run census:bounties                          # seeds 42,99,7 × 360 ticks, medium
 *   npm run census:bounties -- --seeds 42 --ticks 120
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
import { BOUNTY_REWARD } from '../src/types/factionAction';

const DEFAULT_SEEDS: readonly number[] = [42, 99, 7];
const DEFAULT_TICKS = 360;
/** Ticks in a month: 30 days of 12 hours. */
const TICKS_PER_MONTH = 360;
const DUELS_PER_MONTH_MIN = 3;
const DUELS_PER_MONTH_MAX = 25;

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
  collected: number;
  lapsed: number;
  active: number;
  distinctTargets: number;
  bountyDuels: number;
  bountyDuelsPerMonth: number;
  bountyDuelEnds: number;
  bountyDuelDeaths: number;
  escrowPosted: number;
  escrowPaid: number;
  escrowRefunded: number;
  escrowHeld: number;
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
  let bountyDuels = 0;
  let bountyDuelEnds = 0;
  let bountyDuelDeaths = 0;
  const bountyDuelActions = new Set<string>();
  for (let t = 1; t <= ticks; t++) {
    state = runTick(state, [], runtime);
    for (const tr of getTraces() as unknown as Array<Record<string, unknown>>) {
      if (tr.category === 'fight.trigger' && tr.source === 'bounty' && !tr.skipped) {
        bountyDuels++;
        if (typeof tr.actionId === 'string') bountyDuelActions.add(tr.actionId);
      }
      if (tr.category === 'fight.ending' && bountyDuelActions.has(String(tr.actionId ?? ''))) {
        bountyDuelEnds++;
        if (tr.face === 'slain' || tr.opponentFace === 'slain') bountyDuelDeaths++;
      }
    }
    clearTraces();
  }

  const r: SeedResult = {
    seed, ticks, posted: 0, collected: 0, lapsed: 0, active: 0, distinctTargets: 0,
    bountyDuels, bountyDuelsPerMonth: +(bountyDuels * TICKS_PER_MONTH / ticks).toFixed(1),
    bountyDuelEnds, bountyDuelDeaths,
    escrowPosted: 0, escrowPaid: 0, escrowRefunded: 0, escrowHeld: 0, balanced: false,
  };
  const targets = new Set<string>();
  for (const node of state.graph.getNodesByType('event')) {
    const p = node.properties;
    if (p.eventType !== 'bounty') continue;
    r.posted++;
    targets.add(String(p.targetAgentId));
    r.escrowPosted += BOUNTY_REWARD;
    r.escrowPaid += num(p.escrowPaid);
    r.escrowRefunded += num(p.escrowRefunded);
    r.escrowHeld += num(p.escrow);
    if (p.status === 'collected') r.collected++;
    else if (p.status === 'lapsed') r.lapsed++;
    else r.active++;
  }
  r.distinctTargets = targets.size;
  // A bounty whose faction was gone at lapse refunds nothing; its escrow is then counted
  // in neither column, so the books balance only when no faction dissolved under one.
  r.balanced = r.collected + r.lapsed + r.active === r.posted
    && r.escrowPosted === r.escrowPaid + r.escrowRefunded + r.escrowHeld;
  return r;
}

if (seeds.length > 1) {
  let failed = false;
  let seedsCollecting = 0;
  for (const seed of seeds) {
    const child = spawnSync(process.execPath, [process.argv[1], '--seeds', String(seed), '--ticks', String(ticks), '--map', map], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'inherit'],
    });
    const line = (child.stdout ?? '').trim().split('\n').filter(l => l.startsWith('{')).pop();
    if (line) {
      console.log(line);
      if ((JSON.parse(line) as SeedResult).collected > 0) seedsCollecting++;
    }
    if (child.status !== 0) failed = true;
  }
  const minCollecting = Math.min(2, seeds.length);
  if (seedsCollecting < minCollecting) {
    console.error(`[census:bounties] only ${seedsCollecting} of ${seeds.length} seeds collected a bounty (need ${minCollecting})`);
    failed = true;
  }
  process.exit(failed ? 1 : 0);
} else {
  const r = runSeed(seeds[0]);
  console.log(JSON.stringify(r));
  const inBand = r.bountyDuelsPerMonth >= DUELS_PER_MONTH_MIN && r.bountyDuelsPerMonth <= DUELS_PER_MONTH_MAX;
  if (!inBand) console.error(`[census:bounties] seed ${r.seed}: ${r.bountyDuelsPerMonth} bounty duels a month (band ${DUELS_PER_MONTH_MIN}–${DUELS_PER_MONTH_MAX})`);
  if (!r.balanced) console.error(`[census:bounties] seed ${r.seed}: ledger does not balance`);
  process.exit(inBand && r.balanced ? 0 : 1);
}
