/**
 * Lane-event census — THR-2046 design evidence (proto, never merged).
 *
 * Runs real worlds (`initializeGameState` → `runTick`) and harvests every tick:
 *   - `route_event_seeded` traces by kind, and for each one whether today's
 *     busiest-lane write at the target's town would land on the seeded lane;
 *   - for toll-dispute seeds, how many of the lane's two ends have a controlling faction;
 *   - resolved actions by template and band for the lane events and the four
 *     lane-touching money encounters.
 *
 * Usage: esbuild-bundle, then `node .cache/lane-event-census.mjs --seeds 42 --ticks 360`.
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
import { resolveShiftSettlement } from '../src/engine/economyShift';

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

function runSeed(seed: number): void {
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
  const tollEnds = new Map<string, number>();
  const resolved = new Map<string, number>();
  const counted = new Set<string>();

  for (let i = 0; i < ticks; i++) {
    state = runTick(state, [], runtime);
    for (const raw of getTraces()) {
      const t = raw as unknown as Record<string, unknown>;
      if (t.category !== 'route_event_seeded') continue;
      bump(seeded, String(t.eventKind));
      const here = resolveSceneHere(state.graph, String(t.targetAgentId), 'location') ?? undefined;
      const town = resolveShiftSettlement(state.graph, here);
      if (!town) { noTown++; continue; }
      if (busiestRouteAt(state.graph, town.id)?.id === t.routeEdgeId) busiestHits++; else busiestMisses++;
      if (t.eventKind === 'toll') {
        const edge = state.graph.getEdge(String(t.routeEdgeId));
        if (edge) {
          const ends = [edge.source, edge.target].filter(id => state.graph.getIncomingEdges(id, 'controls').length > 0).length;
          bump(tollEnds, `${ends} ends controlled`);
        }
      }
    }
    clearTraces();
    for (const action of state.unifiedActions ?? []) {
      if (!action.resolved || counted.has(action.actionId) || !action.templateId || !WATCHED.has(action.templateId)) continue;
      counted.add(action.actionId);
      bump(resolved, `${action.templateId} ${action.outcome ?? 'none'}`);
    }
  }

  const lanes = state.graph.getEdgesByType('trades_with');
  const tolled = lanes.filter(e => typeof e.properties.controlledBy === 'string').length;
  const threatened = lanes.filter(e => e.properties.threatened === true).length;
  console.log(`── seed ${seed}`);
  console.log(`  seeded by kind      ${[...seeded].map(([k, n]) => `${k} ${n}`).join('   ') || 'none'}`);
  console.log(`  busiest-lane write  lands on the seeded lane ${busiestHits}   misses ${busiestMisses}   target not in a town ${noTown}`);
  console.log(`  toll seeds          ${[...tollEnds].map(([k, n]) => `${k}: ${n}`).join('   ') || 'none'}`);
  console.log(`  lanes at end        ${lanes.length}   tolled ${tolled}   threatened ${threatened}`);
  console.log(`  resolved`);
  for (const [k, n] of [...resolved].sort()) console.log(`    ${k} ${n}`);
}

console.log(`\nlane-event-census — map ${map}, ${ticks} ticks, seeds ${seeds.join(',')}`);
for (const seed of seeds) {
  const started = Date.now();
  runSeed(seed);
  console.log(`  (${Math.round((Date.now() - started) / 1000)} s)`);
}
