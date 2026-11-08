/**
 * Crossroads AWAY-lean census — THR-2189 (ported from the design lane's never-merged
 * `proto/thr-2189-away-lean-waits` branch, without its env switch: the engine reads
 * `CROSSROADS_AWAY_WAITS_FOR_REACH` directly, so a "before" run flips that flag).
 *
 * Like `crossroads-lean-census.ts`, but at every fresh reading with no lean held it
 * places an AWAY lean on the leader — the only road the row offers away on — and, as
 * the row does since THR-2189, never on a work (counted as skipped instead). Tallies
 * outcome and `leanTurned` (the lean changed the board winner — the counterfactual the
 * engine already computes) by forecast word, road family, settledness and lead ratio.
 *
 * "followed anyway" = followed && !leanTurned: the mortal would have set the road aside
 * without the god's hand. "met the road" = followed + resisted (the lean resolved on a
 * decision, rather than fading at the hold limit).
 *
 * Usage: npm run census:crossroads-away-leans -- [--seeds 42,7] [--ticks 600] [--mortals 6]
 *
 * @see Docs/plans/2026-11-07-thr-2189-an-away-lean-waits-for-the-reach.md § Done when
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
import type { CrossroadsLean } from '../src/engine/crossroads';
import { REACH_TO_SPHERE, CROSSROADS_AWAY_WAITS_FOR_REACH } from '../src/data/premonition-constants';

const argv = process.argv.slice(2);
const arg = (n: string): string | undefined => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
const seeds = (arg('--seeds') ?? '42,7').split(',').map(Number);
const ticks = Number(arg('--ticks') ?? 600);
const map = (arg('--map') ?? 'medium') as MapSizePreset;
const MORTALS = Number(arg('--mortals') ?? 6);

/** Done-when thresholds (plan § Done when / § Kill criteria). */
const MIN_FOLLOWED_OF_MET = 0.65;
const KILL_FOLLOWED_OF_MET = 0.60;
const MAX_FADED_SHARE = 0.35;
const KILL_FADED_SHARE = 0.40;

interface Row { n: number; followed: number; resisted: number; lapsed: number; turned: number; heldSum: number }
const tables: Record<string, Map<string, Row>> = { word: new Map(), family: new Map(), settled: new Map(), ratio: new Map() };
const total: Row = { n: 0, followed: 0, resisted: 0, lapsed: 0, turned: 0, heldSum: 0 };
let skippedOnAWork = 0;
let placedOnAWork = 0;
const add = (r: Row, outcome: string, turned: boolean, held: number): void => {
  r.n++; r.heldSum += held;
  if (outcome === 'followed') r.followed++; else if (outcome === 'resisted') r.resisted++; else r.lapsed++;
  if (turned) r.turned++;
};
const bump = (t: string, k: string, outcome: string, turned: boolean, held: number): void => {
  const m = tables[t];
  const r = m.get(k) ?? { n: 0, followed: 0, resisted: 0, lapsed: 0, turned: 0, heldSum: 0 };
  add(r, outcome, turned, held);
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
          add(total, o, turned, held);
          bump('word', ps.placed.word, o, turned, held);
          bump('family', ps.placed.family, o, turned, held);
          bump('settled', ps.placed.settled, o, turned, held);
          bump('ratio', ps.placed.ratio, o, turned, held);
          ps.placed = null;
        }
        if (readCrossroadsLean(node.properties.crossroadsLean)) continue;
        const snap = readCrossroadsSnapshot(node.properties.crossroads);
        if (!snap || snap.tick === ps.lastSnapTick || snap.options.length < 2) continue;
        ps.lastSnapTick = snap.tick;
        const o = snap.options[0];
        // The row (and `placeCrossroadsLean`) offers no away on a work since THR-2189.
        if (CROSSROADS_AWAY_WAITS_FOR_REACH && o.family !== 'encounter') { skippedOnAWork++; continue; }
        if (o.family !== 'encounter') placedOnAWork++;
        const road = { family: o.family, templateId: o.templateId, targetId: o.targetId };
        const forecast = forecastLean(snap, { ...road, direction: 'away' });
        const lean: CrossroadsLean = {
          ...road, direction: 'away', tick: state.tick, sphere: REACH_TO_SPHERE[o.reach],
          essencePaid: 0, rankWhenPlaced: 0, forecastAtPlacement: forecast,
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
const header = '| key | leans | followed | resisted | faded | lean turned the winner | followed anyway | followed of met | mean held ticks |\n|---|---|---|---|---|---|---|---|---|';
const line = (k: string, r: Row): string => {
  const anyway = r.followed - r.turned;
  const met = r.followed + r.resisted;
  return `| ${k} | ${r.n} | ${r.followed} (${pct(r.followed, r.n)}) | ${r.resisted} | ${r.lapsed} (${pct(r.lapsed, r.n)}) | ${r.turned} (${pct(r.turned, r.n)}) | ${anyway} | ${r.followed}/${met} (${pct(r.followed, met)}) | ${(r.heldSum / Math.max(1, r.n)).toFixed(1)} |`;
};
console.log(`away census · CROSSROADS_AWAY_WAITS_FOR_REACH=${CROSSROADS_AWAY_WAITS_FOR_REACH} · seeds ${seeds.join(',')} · ${ticks} ticks · ${map} · ${MORTALS} mortals`);
console.log(`\n### total\n${header}\n${line('all', total)}`);
console.log(`\nwork leaders skipped (no away offer on a work): ${skippedOnAWork} · away leans placed on a work: ${placedOnAWork}`);
for (const [name, m] of Object.entries(tables)) {
  console.log(`\n### by ${name}\n${header}`);
  for (const [k, r] of [...m.entries()].sort()) console.log(line(k, r));
}

// ── Done-when / kill lines (meaningful with the flag on) ──
if (CROSSROADS_AWAY_WAITS_FOR_REACH) {
  const met = total.followed + total.resisted;
  const followedOfMet = total.followed / Math.max(1, met);
  const faded = total.lapsed / Math.max(1, total.n);
  const anyway = total.followed - total.turned;
  const check = (ok: boolean, label: string): void => console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
  console.log('\n### checks');
  check(anyway === 0, `every away followed has leanTurned (followed anyway = ${anyway})`);
  check(followedOfMet >= MIN_FOLLOWED_OF_MET, `away followed ${pct(total.followed, met)} of leans that met their road (>= ${MIN_FOLLOWED_OF_MET * 100}%)`);
  check(faded <= MAX_FADED_SHARE, `away faded ${pct(total.lapsed, total.n)} of away leans (<= ${MAX_FADED_SHARE * 100}%)`);
  check(placedOnAWork === 0, `no away lean placed on a work (${placedOnAWork})`);
  check(followedOfMet >= KILL_FOLLOWED_OF_MET, `kill: followed of met stays >= ${KILL_FOLLOWED_OF_MET * 100}% (else the word becomes "may")`);
  check(faded <= KILL_FADED_SHARE, `kill: faded stays <= ${KILL_FADED_SHARE * 100}%`);
}
