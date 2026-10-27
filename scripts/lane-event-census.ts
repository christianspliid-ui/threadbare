/**
 * Lane-event census — THR-2046 (`npm run census:lanes`).
 *
 * Landed from the design-lane proto (`proto/thr-2046-lane-census`) and extended for the
 * build's Done-when (Docs/plans/2026-10-25-thr-2046-encounter-lane-writes.md):
 *
 *   - `route_event_seeded` traces by kind, and whether today's busiest-lane guess at the
 *     target's town would have landed on the seeded lane (the plan's evidence);
 *   - every lane write (`economy.world.shift` with a lane quantity) made by an action that
 *     carried a seed's lane: did it write its own lane (`laneSource: 'seed'`, nodeId = the
 *     action's `laneEdgeId`)? The Done-when wants every one to;
 *   - encounter-set tolls and threats (`lane_toll`, `lane_threat` marks), the Done-when's
 *     "at least one of each on at least two seeds";
 *   - resolved actions by template and band, and the towns per prosperity tier at the end
 *     (the kill criteria's read).
 *
 * Usage: `npm run census:lanes -- --seeds 42,99,7 --ticks 360 [--map medium]`.
 */

import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits';
import { clearTraces, enableTracing, getTraces } from '../src/engine/traceBuffer';
import { busiestRouteAt } from '../src/engine/tradeRouteOps';
import { resolveSceneHere } from '../src/engine/sceneHere';
import { isLaneQuantity, resolveShiftSettlement } from '../src/engine/economyShift';
import { getProsperityTier } from '../src/engine/phaseProsperity';
import { getLocationNodes } from '../src/engine/sublocationShape';

const argv = process.argv.slice(2);
function arg(name: string): string | undefined {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}
const seeds = (arg('--seeds') ?? '42').split(',').map(Number);
const ticks = Number(arg('--ticks') ?? 360);
const map = (arg('--map') ?? 'medium') as MapSizePreset;

const WATCHED = new Set([
  'encounter_route_ambush', 'encounter_toll_dispute', 'encounter_route_embargo',
  'encounter.toll_bridge', 'encounter.pirate_raid', 'encounter.town.overdue_caravan', 'encounter.trade_caravan_escort',
]);

function bump(m: Map<string, number>, k: string): void { m.set(k, (m.get(k) ?? 0) + 1); }

interface SeedVerdict {
  seed: number;
  seededWrites: number;
  seededWrongLane: number;
  tolls: number;
  threats: number;
}

function runSeed(seed: number): SeedVerdict {
  resetEventCounter();
  resetReputationTraitInit();
  enableTracing();
  clearTraces();
  const runtime = createSimulationRuntime();
  const preset = MAP_SIZE_PRESETS[map];
  const archetype = generateArchetypes(4, seed)[0];
  let { state } = initializeGameState(archetype, 'LaneCensus', createBalancedCosmology(), seed, preset.cols, preset.rows);

  const seeded = new Map<string, number>();
  let busiestHits = 0;
  let busiestMisses = 0;
  let noTown = 0;
  const resolved = new Map<string, number>();
  const counted = new Set<string>();
  const writes = new Map<string, number>();
  let seededWrites = 0;
  let seededWrongLane = 0;
  let tolls = 0;
  let threats = 0;

  for (let i = 0; i < ticks; i++) {
    state = runTick(state, [], runtime);
    // The lanes this tick's resolutions carried, by actor + template (a world-shift trace
    // names both, not the action id).
    const carried = new Map<string, string>();
    for (const action of state.unifiedActions ?? []) {
      if (!action.resolved || counted.has(action.actionId) || !action.templateId) continue;
      counted.add(action.actionId);
      if (action.laneEdgeId) carried.set(`${action.actorId}|${action.templateId}`, action.laneEdgeId);
      if (WATCHED.has(action.templateId)) bump(resolved, `${action.templateId} ${action.outcome ?? 'none'}`);
    }
    for (const raw of getTraces()) {
      const t = raw as unknown as Record<string, unknown>;
      if (t.category === 'route_event_seeded') {
        bump(seeded, String(t.eventKind));
        const here = resolveSceneHere(state.graph, String(t.targetAgentId), 'location') ?? undefined;
        const town = resolveShiftSettlement(state.graph, here);
        if (!town) { noTown++; continue; }
        if (busiestRouteAt(state.graph, town.id)?.id === t.routeEdgeId) busiestHits++; else busiestMisses++;
        continue;
      }
      if (t.category !== 'economy.world.shift' || !isLaneQuantity(String(t.quantity))) continue;
      const q = String(t.quantity);
      bump(writes, `${q} ${t.laneSource ?? 'none'}`);
      if (q === 'lane_toll') tolls++;
      if (q === 'lane_threat' && Number(t.amount) > 0) threats++;
      const lane = carried.get(`${t.agentId}|${t.sourceTemplateId}`);
      if (lane) {
        seededWrites++;
        if (t.laneSource !== 'seed' || t.nodeId !== lane) seededWrongLane++;
      }
    }
    clearTraces();
  }

  const lanes = state.graph.getEdgesByType('trades_with');
  const tolled = lanes.filter(e => typeof e.properties.controlledBy === 'string').length;
  const threatened = lanes.filter(e => e.properties.threatened === true).length;
  const tiers = new Map<string, number>();
  for (const town of getLocationNodes(state.graph)) {
    const p = town.properties.prosperity;
    if (typeof p === 'number') bump(tiers, getProsperityTier(p));
  }
  console.log(`── seed ${seed}`);
  console.log(`  seeded by kind      ${[...seeded].map(([k, n]) => `${k} ${n}`).join('   ') || 'none'}`);
  console.log(`  busiest-lane guess  lands on the seeded lane ${busiestHits}   misses ${busiestMisses}   target not in a town ${noTown}`);
  console.log(`  lane writes         ${[...writes].sort().map(([k, n]) => `${k} ${n}`).join('   ') || 'none'}`);
  console.log(`  seeded-lane writes  ${seededWrites}   on another lane ${seededWrongLane}`);
  console.log(`  encounter tolls ${tolls}   encounter threats ${threats}`);
  console.log(`  lanes at end        ${lanes.length}   tolled ${tolled}   threatened ${threatened}`);
  console.log(`  towns by tier       ${[...tiers].sort().map(([k, n]) => `${k} ${n}`).join('   ')}`);
  console.log(`  resolved`);
  for (const [k, n] of [...resolved].sort()) console.log(`    ${k} ${n}`);
  return { seed, seededWrites, seededWrongLane, tolls, threats };
}

console.log(`\nlane-event-census — map ${map}, ${ticks} ticks, seeds ${seeds.join(',')}`);
const verdicts: SeedVerdict[] = [];
for (const seed of seeds) {
  const started = Date.now();
  verdicts.push(runSeed(seed));
  console.log(`  (${Math.round((Date.now() - started) / 1000)} s)`);
}
const allOwn = verdicts.every(v => v.seededWrongLane === 0);
const bothSeeds = verdicts.filter(v => v.tolls > 0 && v.threats > 0).length;
console.log(`\nverdict: seeded writes on their own lane on every seed: ${allOwn ? 'YES' : 'NO'}; seeds with a toll and a threat: ${bothSeeds} of ${verdicts.length}`);
