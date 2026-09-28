// Throwaway reader (THR-1636 S1): lane traffic A/B — `LANE_TRAFFIC_ENABLED` off vs on.
// Read-only. One pass per seed per arm, medium map, unattended (no player, no First).
// Usage: npx esbuild <this> --bundle --platform=node --format=esm --outfile=.cache/upkeep-ab.mjs
//          --external:fs --external:path && node .cache/upkeep-ab.mjs [seeds=42,99] [ticks=300] [out]
//
// Per arm: worldgen lanes at t0 and which still stand at the end; every dissolution with
// the state of its ends at death (the traced cause); lanes founded; lanes standing by
// t50; route-event scans that planted a seed after t36; settlement prosperity at the end.
import { writeFileSync } from 'fs';
import { initializeGameState, MAP_SIZE_PRESETS } from '../../../../src/engine/gameInit';
import { runTick, resetEventCounter } from '../../../../src/engine/orchestrator';
import { createBalancedCosmology } from '../../../../src/engine/cosmology';
import { generateArchetypes } from '../../../../src/engine/ascendant';
import { createSimulationRuntime } from '../../../../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../../../../src/engine/phaseReputationTraits';
import { enableTracing, getTraces, clearTraces } from '../../../../src/engine/traceBuffer';
import { setLaneTrafficEnabledOverride, laneTraffic } from '../../../../src/engine/tradeRoute';
import { getLocationNodes } from '../../../../src/engine/sublocationShape';
import type { GameState } from '../../../../src/types/gameState';

const seeds = (process.argv[2] ?? '42,99').split(',').map(Number);
const TICKS = Number(process.argv[3] ?? 300);
const out: Record<string, unknown> = {};

function runArm(seed: number, on: boolean) {
  setLaneTrafficEnabledOverride(on);
  resetEventCounter(); resetReputationTraitInit(); clearTraces(); enableTracing();
  const rt = createSimulationRuntime(); const pr = MAP_SIZE_PRESETS['medium'];
  let { state } = initializeGameState(generateArchetypes(4, seed)[0], 'C', createBalancedCosmology(), seed, pr.cols, pr.rows) as { state: GameState };
  const g = () => state.graph;
  const t0 = g().getEdgesByType('trades_with').map(e => e.id);
  const deaths: Array<Record<string, unknown>> = [];
  const standing: Record<number, number> = {};
  const upkeep: Record<string, number> = { carrying: 0, suspended: 0, idle: 0, steppedUp: 0, steppedDown: 0, traces: 0 };
  let founded = 0;
  let routeScansSeededAfter36 = 0;
  let routeSeedsAfter36 = 0;
  const started = Date.now();
  for (let t = 1; t <= TICKS; t++) {
    // Snapshot each lane's class + ends before the tick, so a death can name its cause.
    const before = new Map(g().getEdgesByType('trades_with').map(e => [e.id, {
      traffic: laneTraffic(g(), e, t),
      src: g().getNode(e.source)?.properties.locationSubtype, dst: g().getNode(e.target)?.properties.locationSubtype,
      by: e.properties.establishedBy ?? null,
    }]));
    state = runTick(state, [], rt);
    for (const tr of getTraces() as ReadonlyArray<Record<string, unknown>>) {
      const c = String(tr.category);
      if (c === 'trade_route_dissolved') deaths.push({ tick: t, edge: tr.edgeId, lived: tr.totalTicksActive, ...before.get(String(tr.edgeId)) });
      if (c === 'trade_route_volume_change' && tr.cause === 'established') founded++;
      if (c === 'route_event_scan' && t > 36 && Number(tr.seedsPlanted ?? 0) > 0) { routeScansSeededAfter36++; routeSeedsAfter36 += Number(tr.seedsPlanted); }
      if (c === 'trade_route_upkeep') {
        upkeep.traces++;
        for (const k of ['carrying', 'suspended', 'idle', 'steppedUp', 'steppedDown']) upkeep[k] += Number(tr[k] ?? 0);
      }
    }
    clearTraces();
    if (t % 50 === 0) standing[t] = g().getEdgesByType('trades_with').length;
  }
  const endIds = new Set(g().getEdgesByType('trades_with').map(e => e.id));
  const settlements = getLocationNodes(g()).filter(n => ['hamlet', 'town', 'city', 'capital'].includes(String(n.properties.locationSubtype)));
  const prosperity = settlements.map(n => Number(n.properties.prosperity ?? 0));
  const volumes = g().getEdgesByType('trades_with').map(e => Number(e.properties.volume ?? 0));
  return {
    worldgenLanes: t0.length,
    worldgenStandingAtEnd: t0.filter(id => endIds.has(id)).length,
    lanesStandingAtEnd: endIds.size,
    founded,
    standing,
    deaths,
    volumesAtEnd: volumes,
    upkeep,
    routeScansSeededAfter36, routeSeedsAfter36,
    settlements: settlements.length,
    prosperitySum: Number(prosperity.reduce((a, b) => a + b, 0).toFixed(1)),
    prosperityMean: Number((prosperity.reduce((a, b) => a + b, 0) / Math.max(1, prosperity.length)).toFixed(3)),
    prosperityMax: Number(Math.max(0, ...prosperity).toFixed(2)),
    wallMs: Date.now() - started,
  };
}

for (const seed of seeds) {
  const off = runArm(seed, false);
  const on = runArm(seed, true);
  out[seed] = { off, on };
  console.log(`seed ${seed} OFF:`, JSON.stringify({ ...off, deaths: off.deaths.length }));
  console.log(`seed ${seed} ON :`, JSON.stringify(on));
}
setLaneTrafficEnabledOverride(null);
const path = process.argv[4] ?? 'Docs/audits/2026-09-25-living-world-data/output/upkeep-ab-2026-09-28.json';
writeFileSync(path, JSON.stringify(out, null, 1));
console.log('wrote', path);
