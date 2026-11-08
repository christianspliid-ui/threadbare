/**
 * Crossroads lean census — THR-2188 (ported from the never-merged design-lane
 * prototype `proto/thr-2188-lean-waits-for-its-road`, without its env switches).
 *
 * Threads the first N individual mortals per seed (the god's `thread` edge), then at
 * every fresh reading with no lean held writes a lean exactly as `placeCrossroadsLean`
 * does (minus readability and the spend), rotating: toward road 2, away from road 1,
 * toward the last road. Tallies each outcome by forecast word (the Law 18 calibration
 * measure), counts waits, and prints the kill-criterion lines:
 *   - `likely` followed on ≥ 60% of ALL leans
 *   - lapses (both kinds) ≤ 5% of leans
 *
 * Deterministic: same seeds, same ticks, same tables.
 *
 * Usage: npm run census:crossroads-leans -- [--seeds 42,7] [--ticks 600] [--map medium] [--mortals 6]
 *
 * @see Docs/plans/2026-11-07-thr-2188-a-lean-waits-for-its-road.md § The measurement
 */

import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits';
import { enableTracing, disableTracing, getTraces, clearTraces } from '../src/engine/traceBuffer';
import { forecastLean, readCrossroadsSnapshot, readCrossroadsLean } from '../src/engine/crossroads';
import type { CrossroadsLean, LeanDirection } from '../src/engine/crossroads';
import { REACH_TO_SPHERE } from '../src/data/premonition-constants';

const argv = process.argv.slice(2);
const arg = (n: string): string | undefined => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
const seeds = (arg('--seeds') ?? '42,7').split(',').map(Number);
const ticks = Number(arg('--ticks') ?? 600);
const map = (arg('--map') ?? 'medium') as MapSizePreset;
const MORTALS = Number(arg('--mortals') ?? 6);
const NO_AWAY = argv.includes('--no-away');

/** Kill-criterion thresholds (plan § Kill criteria). */
const LIKELY_FOLLOWED_MIN = 0.6;
const LAPSE_SHARE_MAX = 0.05;

type Outcome = 'followed' | 'resisted' | 'lapsed_unavailable' | 'lapsed_expired';
const OUTCOMES: Outcome[] = ['followed', 'resisted', 'lapsed_unavailable', 'lapsed_expired'];
const table = new Map<string, Record<Outcome, number>>();
const bump = (k: string, o: Outcome): void => {
  const row = table.get(k) ?? { followed: 0, resisted: 0, lapsed_unavailable: 0, lapsed_expired: 0 };
  row[o] += 1;
  table.set(k, row);
};
let decisions = 0;
let torn = 0;
let waits = 0;

for (const seed of seeds) {
  resetEventCounter();
  resetReputationTraitInit();
  enableTracing();
  try {
    const runtime = createSimulationRuntime();
    const preset = MAP_SIZE_PRESETS[map];
    const archetype = generateArchetypes(4, seed)[0];
    let { state } = initializeGameState(archetype, 'CrossroadsCensus', createBalancedCosmology(), seed, preset.cols, preset.rows);
    const mortals = state.graph.getNodesByType('actor')
      .filter(n => n.properties.actorType === 'individual' && !n.properties.isDead && !n.properties.deceased && !n.id.startsWith('actor.past'))
      .sort((a, b) => a.id.localeCompare(b.id))
      .slice(0, MORTALS);
    if (mortals.length === 0 || !state.ascendantId) { console.log(`seed ${seed}: no mortal`); continue; }
    for (const m of mortals) {
      state.graph.addEdge({ id: `census_thread_${m.id}`, source: state.ascendantId, target: m.id, type: 'thread', properties: { courtPosition: 'retinue', bondReception: 'devotion' } });
    }
    const per = new Map(mortals.map(m => [m.id, { rotation: 0, lastSnapTick: -1, placed: false }]));
    for (let i = 0; i < ticks; i++) {
      clearTraces();
      state = runTick(state, [], runtime);
      const traces = getTraces() as unknown as Array<Record<string, unknown>>;
      for (const mortal of mortals) {
        const ps = per.get(mortal.id)!;
        const node = state.graph.getNode(mortal.id);
        if (!node || node.properties.deceased) continue;
        for (const t of traces) {
          if (t.agentId !== mortal.id) continue;
          if (t.category === 'crossroads_snapshot') { decisions++; if (t.settledness === 'torn') torn++; }
          if (t.category === 'crossroads_lean_waiting' && ps.placed) waits++;
          if (t.category !== 'crossroads_lean_outcome' || !ps.placed) continue;
          bump(`${String(t.direction)} · ${String(t.forecastAtPlacement)}`, t.outcome as Outcome);
          ps.placed = false;
        }
        if (readCrossroadsLean(node.properties.crossroadsLean)) continue;
        const snap = readCrossroadsSnapshot(node.properties.crossroads);
        if (!snap || snap.tick === ps.lastSnapTick || snap.options.length < 2) continue;
        ps.lastSnapTick = snap.tick;
        const r = ps.rotation++ % 3;
        const idx = r === 0 ? 1 : r === 1 ? 0 : snap.options.length - 1;
        const direction: LeanDirection = r === 1 ? 'away' : 'toward';
        // THR-2189 control arm: `--no-away` places nothing on the away slot, so the toward
        // rows are measured without the timing of held away leans (which now wait).
        if (NO_AWAY && direction === 'away') continue;
        const o = snap.options[idx];
        const road = { family: o.family, templateId: o.templateId, targetId: o.targetId };
        const forecast = forecastLean(snap, { ...road, direction });
        const lean: CrossroadsLean = {
          ...road, direction, tick: state.tick, sphere: REACH_TO_SPHERE[o.reach],
          essencePaid: 0, rankWhenPlaced: idx, forecastAtPlacement: forecast,
        };
        node.properties.crossroadsLean = lean;
        ps.placed = true;
      }
    }
  } finally {
    disableTracing();
  }
}

const pct = (n: number, d: number): string => `${(100 * n / Math.max(1, d)).toFixed(0)}%`;
console.log(`seeds ${seeds.join(',')} · ${ticks} ticks · ${map} · ${MORTALS} threaded mortals per seed`);
console.log(`decisions ${decisions}, torn ${torn} (${pct(torn, decisions)}), waits traced ${waits}`);
console.log('');
console.log('| Forecast | Followed | Resisted | Lapsed (unavailable) | Lapsed (expired) |');
console.log('|---|---|---|---|---|');
for (const [k, r] of [...table.entries()].sort()) {
  console.log(`| ${k} | ${OUTCOMES.map(o => r[o]).join(' | ')} |`);
}
let leans = 0;
let lapses = 0;
for (const r of table.values()) {
  leans += OUTCOMES.reduce((s, o) => s + r[o], 0);
  lapses += r.lapsed_unavailable + r.lapsed_expired;
}
console.log('');
let likelyShare = 0;
for (const w of ['likely', 'may', 'not_enough']) {
  let f = 0, d = 0, all = 0;
  for (const [k, r] of table) {
    if (!k.endsWith(w)) continue;
    f += r.followed; d += r.followed + r.resisted;
    all += OUTCOMES.reduce((s, o) => s + r[o], 0);
  }
  if (w === 'likely') likelyShare = f / Math.max(1, all);
  console.log(`${w}: followed ${f}/${d} decided (${pct(f, d)}), ${f}/${all} all (${pct(f, all)})`);
}
console.log(`leans ${leans}, lapsed ${lapses} (${pct(lapses, leans)})`);
const likelyOk = likelyShare >= LIKELY_FOLLOWED_MIN;
const lapseOk = lapses / Math.max(1, leans) <= LAPSE_SHARE_MAX;
console.log(`kill criterion — likely followed ≥ ${LIKELY_FOLLOWED_MIN * 100}% of all: ${likelyOk ? 'PASS' : 'FAIL'}; lapses ≤ ${LAPSE_SHARE_MAX * 100}%: ${lapseOk ? 'PASS' : 'FAIL'}`);
