/**
 * Crossroads AWAY-lean census — THR-2189 design-lane prototype (never merged).
 *
 * Like `crossroads-lean-census.ts`, but at every fresh reading with no lean held it
 * places an AWAY lean on the leader (the only road the row offers away on). Tallies
 * outcome and `leanTurned` (the lean changed the board winner — the counterfactual the
 * engine already computes) by forecast word, road family, and settledness at placement.
 *
 * "followed & !leanTurned" = the mortal would have set the road aside anyway.
 *
 * Usage: npm-less: esbuild bundle then node (see package.json census:crossroads-leans).
 *   node .cache/crossroads-away-census.mjs [--seeds 42,7] [--ticks 600] [--mortals 6] [--mode away|toward2]
 */

import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits';
import { enableTracing, disableTracing, getTraces, clearTraces } from '../src/engine/traceBuffer';
import { forecastLean, readCrossroadsSnapshot, readCrossroadsLean, settledness } from '../src/engine/crossroads';
import type { CrossroadsLean, LeanDirection } from '../src/engine/crossroads';
import { REACH_TO_SPHERE } from '../src/data/premonition-constants';

const argv = process.argv.slice(2);
const arg = (n: string): string | undefined => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
const seeds = (arg('--seeds') ?? '42,7').split(',').map(Number);
const ticks = Number(arg('--ticks') ?? 600);
const map = (arg('--map') ?? 'medium') as MapSizePreset;
const MORTALS = Number(arg('--mortals') ?? 6);
const mode = arg('--mode') ?? 'away';

interface Row { n: number; followed: number; resisted: number; lapsed: number; turned: number; heldSum: number }
const tables: Record<string, Map<string, Row>> = { word: new Map(), family: new Map(), settled: new Map(), ratio: new Map(), wordFamily: new Map() };
const bump = (t: string, k: string, outcome: string, turned: boolean, held: number): void => {
  const m = tables[t];
  const r = m.get(k) ?? { n: 0, followed: 0, resisted: 0, lapsed: 0, turned: 0, heldSum: 0 };
  r.n++; r.heldSum += held;
  if (outcome === 'followed') r.followed++; else if (outcome === 'resisted') r.resisted++; else r.lapsed++;
  if (turned) r.turned++;
  m.set(k, r);
};

for (const seed of seeds) {
  resetEventCounter();
  resetReputationTraitInit();
  enableTracing();
  try {
    const runtime = createSimulationRuntime();
    const preset = MAP_SIZE_PRESETS[map];
    const archetype = generateArchetypes(4, seed)[0];
    let { state } = initializeGameState(archetype, 'CrossroadsAwayCensus', createBalancedCosmology(), seed, preset.cols, preset.rows);
    const mortals = state.graph.getNodesByType('actor')
      .filter(n => n.properties.actorType === 'individual' && !n.properties.isDead && !n.properties.deceased && !n.id.startsWith('actor.past'))
      .sort((a, b) => a.id.localeCompare(b.id))
      .slice(0, MORTALS);
    if (mortals.length === 0 || !state.ascendantId) { console.log(`seed ${seed}: no mortal`); continue; }
    for (const m of mortals) {
      state.graph.addEdge({ id: `census_thread_${m.id}`, source: state.ascendantId, target: m.id, type: 'thread', properties: { courtPosition: 'retinue', bondReception: 'devotion' } });
    }
    const per = new Map(mortals.map(m => [m.id, { lastSnapTick: -1, placed: null as null | { word: string; family: string; settled: string; ratio: string } }]));
    for (let i = 0; i < ticks; i++) {
      clearTraces();
      state = runTick(state, [], runtime);
      const traces = getTraces() as unknown as Array<Record<string, unknown>>;
      for (const mortal of mortals) {
        const ps = per.get(mortal.id)!;
        const node = state.graph.getNode(mortal.id);
        if (!node || node.properties.deceased) continue;
        for (const t of traces) {
          if (t.agentId !== mortal.id || t.category !== 'crossroads_lean_outcome' || !ps.placed) continue;
          const o = String(t.outcome); const turned = t.leanTurned === true; const held = Number(t.heldTicks) || 0;
          bump('word', ps.placed.word, o, turned, held);
          bump('family', ps.placed.family, o, turned, held);
          bump('settled', ps.placed.settled, o, turned, held);
          bump('ratio', ps.placed.ratio, o, turned, held);
          bump('wordFamily', `${ps.placed.word} · ${ps.placed.family}`, o, turned, held);
          ps.placed = null;
        }
        if (readCrossroadsLean(node.properties.crossroadsLean)) continue;
        const snap = readCrossroadsSnapshot(node.properties.crossroads);
        if (!snap || snap.tick === ps.lastSnapTick || snap.options.length < 2) continue;
        ps.lastSnapTick = snap.tick;
        const idx = mode === 'away' ? 0 : 1;
        const direction: LeanDirection = mode === 'away' ? 'away' : 'toward';
        const o = snap.options[idx];
        const road = { family: o.family, templateId: o.templateId, targetId: o.targetId };
        const forecast = forecastLean(snap, { ...road, direction });
        const lean: CrossroadsLean = {
          ...road, direction, tick: state.tick, sphere: REACH_TO_SPHERE[o.reach],
          essencePaid: 0, rankWhenPlaced: idx, forecastAtPlacement: forecast,
        };
        node.properties.crossroadsLean = lean;
        const rr = snap.options[1].score / Math.max(1e-9, snap.options[0].score);
        const ratio = rr <= 0.5 ? 'a r<=0.50' : rr < 0.7 ? 'b 0.50-0.70' : rr < 0.85 ? 'c 0.70-0.85' : 'd >=0.85';
        ps.placed = { word: forecast, family: o.family, settled: String(settledness(snap) ?? 'none'), ratio };
      }
    }
  } finally {
    disableTracing();
  }
}

const pct = (n: number, d: number): string => `${(100 * n / Math.max(1, d)).toFixed(0)}%`;
console.log(`mode ${mode} · seeds ${seeds.join(',')} · ${ticks} ticks · ${map} · ${MORTALS} mortals`);
for (const [name, m] of Object.entries(tables)) {
  console.log(`\n### by ${name}\n| key | leans | followed | resisted | lapsed | lean turned the winner | followed anyway (no turn) | mean held ticks |\n|---|---|---|---|---|---|---|---|`);
  for (const [k, r] of [...m.entries()].sort()) {
    const anyway = r.followed - r.turned;
    console.log(`| ${k} | ${r.n} | ${r.followed} (${pct(r.followed, r.n)}) | ${r.resisted} | ${r.lapsed} | ${r.turned} (${pct(r.turned, r.n)}) | ${anyway} (${pct(anyway, r.n)}) | ${(r.heldSum / Math.max(1, r.n)).toFixed(1)} |`);
  }
}
