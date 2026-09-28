// Throwaway reader (THR-1636): the inputs to trade-lane upkeep and the clue climb.
// Read-only. One pass per seed, medium map, unattended (no player, no First).
// Usage: npx esbuild <this> --bundle --platform=node --format=esm --outfile=.cache/upkeep.mjs
//          --external:fs --external:path && node .cache/upkeep.mjs [seeds=42,99] [ticks=300] [out]
//
// Lanes: at t0, each worldgen lane's cargo manifest, pair-balance score, hex length and
// whether its Route object is owned; over the run, every lane founded, raised, used,
// blockaded or dissolved, and how long it stood.
// Clues: every clue minted by source and precision; which holders are deciders; the
// survey reader's outcome per band, and how often a survey was refused because the
// surveyor already held a lesser lead ("clue_already_held"); located clues and delves.
import { writeFileSync } from 'fs';
import { initializeGameState, MAP_SIZE_PRESETS } from '../../../../src/engine/gameInit';
import { runTick, resetEventCounter } from '../../../../src/engine/orchestrator';
import { createBalancedCosmology } from '../../../../src/engine/cosmology';
import { generateArchetypes } from '../../../../src/engine/ascendant';
import { createSimulationRuntime } from '../../../../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../../../../src/engine/phaseReputationTraits';
import { enableTracing, getTraces, clearTraces } from '../../../../src/engine/traceBuffer';
import { buildRouteManifest, scoreRoutePairBalance } from '../../../../src/engine/tradeRoute';
import { isAutonomousDecisionActor } from '../../../../src/engine/decisionTier';
import { hexDistance } from '../../../../src/lib/hexMath';
import type { GameState } from '../../../../src/types/gameState';

const seeds = (process.argv[2] ?? '42,99').split(',').map(Number);
const TICKS = Number(process.argv[3] ?? 300);
const inc = (m: Record<string, number>, k: string, n = 1) => { m[k] = (m[k] ?? 0) + n; };
const out: Record<string, unknown> = {};

for (const seed of seeds) {
  resetEventCounter(); resetReputationTraitInit(); clearTraces(); enableTracing();
  const rt = createSimulationRuntime(); const pr = MAP_SIZE_PRESETS['medium'];
  let { state } = initializeGameState(generateArchetypes(4, seed)[0], 'C', createBalancedCosmology(), seed, pr.cols, pr.rows) as { state: GameState };
  const g = () => state.graph;
  const hexOf = (id: string) => { const n = g().getNode(id); return n ? { col: Number(n.properties.hexCol), row: Number(n.properties.hexRow) } : null; };

  // ── Lanes at t0 ──
  const lanesT0 = g().getEdgesByType('trades_with').map(e => {
    const s = g().getNode(e.source); const t = g().getNode(e.target);
    const a = hexOf(e.source); const b = hexOf(e.target);
    const identity = g().getNodesByType('location').find(n => n.properties.routeEdgeId === e.id);
    return {
      id: e.id, by: e.properties.establishedBy,
      goods: buildRouteManifest(s?.properties ?? {}, t?.properties ?? {}).goods,
      balance: Number(scoreRoutePairBalance(s?.properties ?? {}, t?.properties ?? {}).toFixed(3)),
      hexes: a && b ? hexDistance(a, b) : null,
      sourcePop: s?.properties.population ?? null, targetPop: t?.properties.population ?? null,
      identityOwned: identity ? g().getIncomingEdges(identity.id, 'owns').length > 0 : null,
    };
  });

  const laneEvents: Record<string, number> = {};
  const laneLifetimes: number[] = [];
  const clueMinted: Record<string, number> = {};
  const clueHolderTier: Record<string, number> = {};
  const surveyByBand: Record<string, number> = {};
  const surveyRefused: Record<string, number> = {};
  const delveTraces: Record<string, number> = {};
  const lanesStanding: Record<number, number> = {};
  let located = 0;
  let clueDecayed = 0;

  // Cargo once stock tiers have been derived (t12), for the same lanes.
  let lanesT12: Array<{ id: string; goods: string[]; balance: number }> = [];
  // Every undertaking trace that names a cell, by category and cell id (the observe cells in particular).
  const cellTraces: Record<string, number> = {};

  for (let t = 1; t <= TICKS; t++) {
    state = runTick(state, [], rt);
    if (t === 12) {
      lanesT12 = g().getEdgesByType('trades_with').map(e => {
        const s = g().getNode(e.source); const d = g().getNode(e.target);
        return { id: e.id, goods: buildRouteManifest(s?.properties ?? {}, d?.properties ?? {}).goods,
          balance: Number(scoreRoutePairBalance(s?.properties ?? {}, d?.properties ?? {}).toFixed(3)) };
      });
    }
    for (const tr of getTraces() as ReadonlyArray<Record<string, unknown>>) {
      const c = String(tr.category);
      const cell = String(tr.templateId ?? tr.cellId ?? '');
      if (cell.startsWith('cell.observe')) inc(cellTraces, `${c}:${cell}`);
      if (c === 'trade_route_volume_change') inc(laneEvents, `volume:${tr.cause}`);
      if (c === 'trade_route_dissolved') { inc(laneEvents, 'dissolved'); laneLifetimes.push(Number(tr.totalTicksActive)); }
      if (c === 'route_cargo_assigned') inc(laneEvents, 'founded_with_cargo');
      if (c === 'ruins.clue_discovered') {
        inc(clueMinted, `${tr.source}:${tr.precision}`);
        if (tr.precision === 'located') located++;
        const k = g().getNode(String(tr.knowerId));
        inc(clueHolderTier, k ? (isAutonomousDecisionActor(k) ? 'decider' : 'ambient') : 'gone');
      }
      if (c === 'ruins.clue_decayed') clueDecayed++;
      if (c === 'undertaking_reader' && tr.reader === 'clue') {
        inc(surveyByBand, String(tr.outcome ?? 'none'));
        if (tr.refused) inc(surveyRefused, String(tr.refused));
        if (!tr.refused && tr.productId) {
          const e = g().getEdge(String(tr.productId));
          if (e?.properties.precision === 'located') located++;
          inc(clueMinted, `undertaking_survey:${e?.properties.precision ?? '?'}`);
        }
      }
      if (/delve/.test(c)) inc(delveTraces, c);
    }
    clearTraces();
    if (t % 50 === 0) lanesStanding[t] = g().getEdgesByType('trades_with').length;
  }
  out[seed] = { lanesT0, lanesT12, cellTraces, laneEvents, laneLifetimes, lanesStanding, clueMinted, clueHolderTier, surveyByBand, surveyRefused, located, clueDecayed, delveTraces };
  console.log(`seed ${seed}:`, JSON.stringify(out[seed]));
}
const path = process.argv[4] ?? 'Docs/audits/2026-09-25-living-world-data/output/upkeep-2026-09-28.json';
writeFileSync(path, JSON.stringify(out, null, 1));
console.log('wrote', path);
