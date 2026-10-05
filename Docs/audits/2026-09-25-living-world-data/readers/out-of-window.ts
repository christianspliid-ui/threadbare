// THR-1689: which out-of-window free choices do mortals make, and why does the board pick them?
//
// Runs the gameplay-report world (random archetype + balanced cosmology, medium map) so the
// in-window share it reproduces is the number the KPI table quotes. For every free-choice
// encounter commit it records the engine's own commit stamp (a recording Map swapped into
// `runtime.engagementLedger.stamps` — the ledger itself is untouched) and joins it to the same
// agent-tick's `engagement_decision` + `decision_board_comparison` traces. Built by
// `out-of-window.build.mjs` with `BOARD_TRACE_TOP_N` and the trace ring patched large, so the
// traces carry the WHOLE board, not its top 5. Both patches are trace-only; the `--no-trace` arm
// re-runs the same seeds untraced to prove the ledger is byte-identical (behaviour-neutral).
//
// Usage: node .cache/out-of-window.mjs <seeds> <ticks> [--no-trace] [--json <path>]
import * as fs from 'fs';
import { initializeGameState, MAP_SIZE_PRESETS } from '../../../../src/engine/gameInit';
import { runTick, resetEventCounter, resetDecisionCache } from '../../../../src/engine/orchestrator';
import { createBalancedCosmology } from '../../../../src/engine/cosmology';
import { generateArchetypes } from '../../../../src/engine/ascendant';
import { createSimulationRuntime } from '../../../../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../../../../src/engine/phaseReputationTraits';
import { enableTracing, disableTracing, clearTraces, getTraces, getTraceEmitCount } from '../../../../src/engine/traceBuffer';
import { computeEngagementKpiReport, windowFitBandFor, proficiencyBandFor } from '../../../../src/engine/kpi/engagementKpi';
import type { EngagementStamp } from '../../../../src/engine/kpi/engagementKpi';
import { ENGAGE_WINDOW_LOW, ENGAGE_WINDOW_HIGH, ENGAGE_TOO_EASY_AT, ENGAGE_REFUSE_BELOW } from '../../../../src/data/agent-behavior-constants';
import { getUnifiedTemplateById } from '../../../../src/data/unified-action-templates';

const args = process.argv.slice(2);
const seeds = (args[0] ?? '42,99,7').split(',').map(Number);
const TICKS = Number(args[1] ?? 120);
const TRACE = !args.includes('--no-trace');
const jsonAt = args.indexOf('--json');
const JSON_OUT = jsonAt >= 0 ? args[jsonAt + 1] : null;

type Zone = 'refused' | 'below' | 'in' | 'above' | 'certain';
interface BoardRow {
  family: 'encounter' | 'strategic_action'; id: string; score: number; evt: number; desire: number;
  temperament: number; fit: number; zone: Zone; forecast: number; arrival?: number; appt?: number; lead?: number;
}
interface Commit {
  seed: number; tick: number; agentId: string; templateId: string; encounterType: string;
  band: string; contentBand: string; forecast: number; inWindow: boolean;
  staticZone: 'below' | 'in' | 'above';
  windowLow?: number; windowHigh?: number; setbackShift?: number; courage?: number;
  inOwnWindow?: boolean; boardFound: boolean; boardSize?: number; winnerRank?: number;
  winnerArrival?: number; winnerAppt?: number;
  winnerFit?: number; winnerBoardZone?: Zone; winnerExempt?: boolean; winnerEvt?: number; winnerDesire?: number; quest?: boolean;
  inWinEncounters?: number; inWinUndertakings?: number;
  /** Over the scorer's FULL ranked list (the board sees only its top 5): scored size, in-window encounters, best in-window rank. */
  scoredSize?: number; inWinScored?: number; bestInWinScoredRank?: number;
  bestInWin?: BoardRow & { rank: number; ratio: number; evtRatio: number; desireRatio: number; fitRatio: number; otherRatio: number };
}

class RecordingMap<K, V> extends Map<K, V> {
  constructor(private readonly sink: V[]) { super(); }
  override set(k: K, v: V): this { this.sink.push(v); return super.set(k, v); }
}

const encTypeCache = new Map<string, string>();
const encType = (id: string): string => {
  let t = encTypeCache.get(id);
  if (t === undefined) {
    const tpl = getUnifiedTemplateById(id) as { encounterType?: string; steps?: object[]; scale?: never } | undefined;
    t = tpl?.encounterType ?? 'unknown';
    encTypeCache.set(id, t);
  }
  return t;
};
import { isActionStepBranch } from '../../../../src/types/unifiedAction';
const isQuest = (id: string): boolean => ((getUnifiedTemplateById(id) as { steps?: object[] } | undefined)?.steps ?? []).some(st => isActionStepBranch(st as never));
const contentBandOf = (id: string, demanded: number): string => Number.isFinite(demanded) ? windowFitBandFor(demanded) : 'unknown';

function runSeed(seed: number) {
  resetDecisionCache(); resetEventCounter(); resetReputationTraitInit();
  const runtime = createSimulationRuntime();
  const stamps: EngagementStamp[] = [];
  runtime.engagementLedger.stamps = new RecordingMap<string, EngagementStamp>(stamps);
  const preset = MAP_SIZE_PRESETS.medium;
  const archetype = generateArchetypes(4, seed)[0];
  let { state } = initializeGameState(archetype, 'KpiReport', createBalancedCosmology(), seed, preset.cols, preset.rows) as any;
  if (TRACE) { clearTraces(); enableTracing(); } else disableTracing();

  // agent|tick → the board for that decision
  const boards = new Map<string, { ed: any; bc: any }>();
  // agent|tick → the encounter scorer's full ranked list (last call wins; the decision phase can re-rank)
  const scoredLists = new Map<string, Array<{ id: string; f: number }>>();
  (globalThis as any).__OOW_SCORED = (agentId: string, tick: number, scored: any[]) => {
    scoredLists.set(`${agentId}|${tick}`, scored.map(s => ({ id: s.entry.templateId, f: s.engagementForecast })));
  };
  let dropped = 0;
  const undertakingWins: Record<string, number> = {};
  for (let i = 0; i < TICKS; i++) {
    const before = getTraceEmitCount();
    state = runTick(state, [], runtime);
    if (!TRACE) continue;
    const traces = getTraces() as any[];
    const emitted = getTraceEmitCount() - before;
    if (emitted > traces.length) dropped += emitted - traces.length;
    for (const t of traces) {
      if (t.category !== 'engagement_decision' && t.category !== 'decision_board_comparison') continue;
      const k = `${t.agentId}|${t.tick}`;
      const slot = boards.get(k) ?? { ed: null, bc: null };
      if (t.category === 'engagement_decision') slot.ed = t; else slot.bc = t;
      boards.set(k, slot);
    }
    clearTraces();
  }
  // Undertaking winners by zone (they never enter the in-window share — context only).
  for (const { ed, bc } of boards.values()) {
    if (!ed || !bc || !ed.chosenId) continue;
    const w = bc.boardTop?.[0];
    if (w?.family === 'strategic_action' && w.id === ed.chosenId) {
      const z = ed.candidates?.[0]?.zone ?? '?';
      undertakingWins[z] = (undertakingWins[z] ?? 0) + 1;
    }
  }

  const commits: Commit[] = [];
  for (const s of stamps) {
    if (!s.freeChoice) continue;
    const f = s.forecast;
    const inWindow = Number.isFinite(f) && f >= ENGAGE_WINDOW_LOW && f <= ENGAGE_WINDOW_HIGH;
    const c: Commit = {
      seed, tick: s.committedTick, agentId: s.agentId, templateId: s.templateId, encounterType: encType(s.templateId),
      band: s.band, contentBand: contentBandOf(s.templateId, s.attemptedDifficulty), forecast: f, inWindow,
      staticZone: f < ENGAGE_WINDOW_LOW ? 'below' : f > ENGAGE_WINDOW_HIGH ? 'above' : 'in',
      boardFound: false,
    };
    const b = boards.get(`${s.agentId}|${s.committedTick}`);
    if (b?.ed && b?.bc && b.ed.chosenId === s.templateId) {
      const cands = b.ed.candidates as any[];
      const top = b.bc.boardTop as any[];
      const rows: BoardRow[] = top.map((e, idx) => ({
        family: e.family, id: e.id, score: e.score, evt: e.evt, desire: e.desireMultiplier,
        temperament: e.temperamentWeight ?? 1, fit: e.forecastFit ?? 1, zone: (e.forecastZone ?? 'in') as Zone,
        forecast: cands[idx]?.forecast ?? NaN, arrival: e.arrivalCommitment, appt: e.appointmentDiscount, lead: e.leadPull,
      }));
      const winnerRank = rows.findIndex(r => r.family === 'encounter' && r.id === s.templateId);
      const w = rows[winnerRank];
      c.boardFound = true;
      c.boardSize = rows.length;
      c.winnerRank = winnerRank;
      c.windowLow = b.ed.windowLow; c.windowHigh = b.ed.windowHigh;
      c.setbackShift = b.ed.setbackShift; c.courage = b.ed.courageLean;
      c.inOwnWindow = f >= b.ed.windowLow && f <= b.ed.windowHigh;
      c.winnerArrival = w?.arrival; c.winnerAppt = w?.appt;
      c.winnerFit = w?.fit; c.winnerBoardZone = w?.zone; c.winnerEvt = w?.evt; c.winnerDesire = w?.desire;
      c.winnerExempt = cands[winnerRank]?.exempt === "too_easy";
      // "In-window" for an alternative = inside the static window the KPI judges.
      const inWin = rows.map((r, rank) => ({ r, rank }))
        .filter(({ r }) => Number.isFinite(r.forecast) && r.forecast >= ENGAGE_WINDOW_LOW && r.forecast <= ENGAGE_WINDOW_HIGH && r.id !== s.templateId);
      c.inWinEncounters = inWin.filter(x => x.r.family === 'encounter').length;
      c.inWinUndertakings = inWin.filter(x => x.r.family === 'strategic_action').length;
      const sl = scoredLists.get(`${s.agentId}|${s.committedTick}`);
      if (sl) {
        const ranks = sl.map((x, rank) => ({ x, rank }))
          .filter(({ x }) => x.id !== s.templateId && Number.isFinite(x.f) && x.f >= ENGAGE_WINDOW_LOW && x.f <= ENGAGE_WINDOW_HIGH);
        c.scoredSize = sl.length;
        c.inWinScored = ranks.length;
        c.bestInWinScoredRank = ranks.length ? ranks[0].rank : undefined;
      }
      const best = inWin.find(x => x.r.family === 'encounter');
      if (best && w) {
        const r = best.r;
        const ratio = w.score / Math.max(r.score, 1e-12);
        const evtRatio = w.evt / Math.max(r.evt, 1e-12);
        const desireRatio = w.desire / Math.max(r.desire, 1e-12);
        const fitRatio = w.fit / Math.max(r.fit, 1e-12);
        c.bestInWin = { ...r, rank: best.rank, ratio, evtRatio, desireRatio, fitRatio, otherRatio: ratio / (evtRatio * desireRatio * fitRatio) };
      }
    }
    commits.push(c);
  }
  const report = computeEngagementKpiReport(runtime.engagementLedger);
  // Forecast calibration over the resolved free-choice log.
  const calib: Record<string, { n: number; meanF: number; success: number }> = {};
  for (const e of runtime.engagementLedger.log) {
    if (!e.freeChoice || !Number.isFinite(e.forecast)) continue;
    const key = `${e.band}|${e.forecast < ENGAGE_REFUSE_BELOW ? '<0.30' : e.forecast < ENGAGE_WINDOW_LOW ? '0.30-0.50' : e.forecast <= ENGAGE_WINDOW_HIGH ? '0.50-0.65' : e.forecast < ENGAGE_TOO_EASY_AT ? '0.65-0.75' : '>=0.75'}`;
    const x = calib[key] ?? { n: 0, meanF: 0, success: 0 };
    x.n++; x.meanF += e.forecast; x.success += e.success ? 1 : 0;
    calib[key] = x;
  }
  return { seed, report, commits, dropped, boards: boards.size, undertakingWins, calib, compelled: stamps.filter(x => !x.freeChoice).length, stampsTotal: stamps.length };
}

const pct = (a: number, b: number) => b > 0 ? `${(100 * a / b).toFixed(1)}%` : '—';
const med = (xs: number[]) => { if (!xs.length) return NaN; const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const BANDS = ['novice', 'journeyman', 'expert', 'master'];
const results = seeds.map(runSeed);

for (const r of results) {
  const all = r.commits;
  const oow = all.filter(c => !c.inWindow);
  console.log(`\n=== seed ${r.seed} — ${TICKS} ticks, ${TRACE ? 'traced (whole board)' : 'UNTRACED arm'} ===`);
  console.log(`ledger: inWindowShare ${r.report.inWindowShare.toFixed(4)} over ${r.report.freeChoiceCommits} free-choice commits; reader recorded ${all.length} (${all.filter(c => c.inWindow).length} in window)`);
  console.log(`  idle rate ${r.report.idleRate.toFixed(4)} over ${r.report.boardDecisions} board decisions; retry-after-failure ${r.report.retryAfterFailureRate.toFixed(3)}; failure-streak p95 ${r.report.maxFailureStreakP95}; quest commits ${all.filter(c => isQuest(c.templateId)).length}; stamps ${r.stampsTotal} of which compelled (not free choice) ${r.compelled}`);
  for (const b of r.report.bands) console.log(`  band ${b.band.padEnd(10)} n=${String(b.engagements).padStart(4)} success ${b.successRate.toFixed(3)} meanDiff ${b.meanAttemptedDifficulty.toFixed(3)}`);
  if (!TRACE) continue;
  console.log(`traces dropped by the ring: ${r.dropped}; boards seen: ${r.boards}; joined to a board: ${pct(all.filter(c => c.boardFound).length, all.length)}`);
  console.log(`out-of-window free choices: ${oow.length} of ${all.length}`);
}

if (TRACE) {
  const all = results.flatMap(r => r.commits);
  const oow = all.filter(c => !c.inWindow);
  const joined = oow.filter(c => c.boardFound);
  console.log(`\n=== pooled seeds ${seeds.join(',')} ===`);
  console.log(`free choices ${all.length}, in window ${all.length - oow.length} (${pct(all.length - oow.length, all.length)}), out ${oow.length}; joined ${joined.length}`);

  console.log('\n-- A. by decider band × side of the static window --');
  console.log('band        free  in-win  below  above  | above: 0.65-0.75  >=0.75 | below: 0.30-0.50  <0.30');
  for (const b of BANDS) {
    const xs = all.filter(c => c.band === b);
    const below = xs.filter(c => c.staticZone === 'below');
    const above = xs.filter(c => c.staticZone === 'above');
    console.log(`${b.padEnd(10)} ${String(xs.length).padStart(5)} ${pct(xs.filter(c => c.inWindow).length, xs.length).padStart(7)} ${pct(below.length, xs.length).padStart(6)} ${pct(above.length, xs.length).padStart(6)}  | ${String(above.filter(c => c.forecast < ENGAGE_TOO_EASY_AT).length).padStart(16)} ${String(above.filter(c => c.forecast >= ENGAGE_TOO_EASY_AT).length).padStart(7)} | ${String(below.filter(c => c.forecast >= ENGAGE_REFUSE_BELOW).length).padStart(16)} ${String(below.filter(c => c.forecast < ENGAGE_REFUSE_BELOW).length).padStart(6)}`);
  }

  console.log('\n-- B. distance outside the static window (out-of-window only) --');
  const dist = (c: Commit) => c.staticZone === 'above' ? c.forecast - ENGAGE_WINDOW_HIGH : ENGAGE_WINDOW_LOW - c.forecast;
  for (const [lo, hi] of [[0, 0.02], [0.02, 0.05], [0.05, 0.10], [0.10, 0.20], [0.20, 1]]) {
    const n = oow.filter(c => dist(c) > lo && dist(c) <= hi).length;
    console.log(`  (${lo.toFixed(2)}, ${hi.toFixed(2)}]  ${String(n).padStart(5)}  ${pct(n, oow.length)}`);
  }
  console.log(`  median distance above: ${med(oow.filter(c => c.staticZone === 'above').map(dist)).toFixed(3)}; below: ${med(oow.filter(c => c.staticZone === 'below').map(dist)).toFixed(3)}`);

  console.log('\n-- C. inside the mortal\'s OWN (shifted) window, though outside the static one the KPI judges --');
  const own = joined.filter(c => c.inOwnWindow);
  console.log(`  ${own.length} of ${joined.length} joined out-of-window choices (${pct(own.length, joined.length)}); of those with a setback shift > 0: ${own.filter(c => (c.setbackShift ?? 0) > 0).length}`);
  const shifts = joined.map(c => c.setbackShift ?? 0);
  console.log(`  setback shift on out-of-window choices: 0 → ${shifts.filter(s => s === 0).length}, 0.05 → ${shifts.filter(s => Math.abs(s - 0.05) < 1e-9).length}, 0.10 → ${shifts.filter(s => Math.abs(s - 0.10) < 1e-9).length}, 0.15 → ${shifts.filter(s => Math.abs(s - 0.15) < 1e-9).length}`);

  console.log('\n-- D. was an in-window option on the board? (out-of-window, joined) --');
  console.log('band        oow   any-in-win-enc  any-in-win-undertaking  none');
  for (const b of BANDS) {
    const xs = joined.filter(c => c.band === b);
    const enc = xs.filter(c => (c.inWinEncounters ?? 0) > 0).length;
    const und = xs.filter(c => (c.inWinEncounters ?? 0) === 0 && (c.inWinUndertakings ?? 0) > 0).length;
    console.log(`${b.padEnd(10)} ${String(xs.length).padStart(5)}  ${pct(enc, xs.length).padStart(14)}  ${pct(und, xs.length).padStart(22)}  ${pct(xs.length - enc - und, xs.length).padStart(5)}`);
  }
  const lost = joined.filter(c => c.bestInWin);
  console.log(`\n  when an in-window encounter WAS on the board (${lost.length}): median rank of the best one ${med(lost.map(c => c.bestInWin!.rank))}, median winner÷it score ${med(lost.map(c => c.bestInWin!.ratio)).toFixed(2)}`);
  console.log(`  what the winner beat it on (median ratio, winner ÷ in-window): value/tick ${med(lost.map(c => c.bestInWin!.evtRatio)).toFixed(2)}, desire ${med(lost.map(c => c.bestInWin!.desireRatio)).toFixed(2)}, window fit ${med(lost.map(c => c.bestInWin!.fitRatio)).toFixed(2)}, arrival/appointment ${med(lost.map(c => c.bestInWin!.otherRatio)).toFixed(2)}`);
  const lead = (k: 'evtRatio' | 'desireRatio' | 'otherRatio') => lost.filter(c => {
    const x = c.bestInWin!; const terms = { evtRatio: x.evtRatio, desireRatio: x.desireRatio, otherRatio: x.otherRatio };
    return Object.entries(terms).sort((a, b) => b[1] - a[1])[0][0] === k;
  }).length;
  console.log(`  biggest single term in the winner's favour: value/tick ${lead('evtRatio')}, desire ${lead('desireRatio')}, arrival/appointment ${lead('otherRatio')}`);

  console.log('\n-- E. how the out-of-window winner got there --');
  const arrival = joined.filter(c => (c.winnerArrival ?? 1) > 1).length;
  const appt = joined.filter(c => c.winnerAppt !== undefined).length;
  console.log(`  arrival commitment on the winner (a journey's goal, chosen earlier): ${arrival} (${pct(arrival, joined.length)}); appointment discount: ${appt}`);
  const winnerZone: Record<string, number> = {};
  for (const c of joined) { const z = c.staticZone + (c.forecast >= ENGAGE_TOO_EASY_AT ? '(≥0.75)' : ''); winnerZone[z] = (winnerZone[z] ?? 0) + 1; }
  console.log(`  winner zone: ${JSON.stringify(winnerZone)}`);

  console.log('\n-- F. kind of work (encounterType) of out-of-window choices, top 12 --');
  const kinds: Record<string, { n: number; above: number; below: number; nearSure: number }> = {};
  for (const c of oow) {
    const k = kinds[c.encounterType] ?? { n: 0, above: 0, below: 0, nearSure: 0 };
    k.n++; if (c.staticZone === 'above') k.above++; else k.below++; if (c.forecast >= ENGAGE_TOO_EASY_AT) k.nearSure++;
    kinds[c.encounterType] = k;
  }
  const allKinds: Record<string, number> = {};
  for (const c of all) allKinds[c.encounterType] = (allKinds[c.encounterType] ?? 0) + 1;
  for (const [k, v] of Object.entries(kinds).sort((a, b) => b[1].n - a[1].n).slice(0, 12)) {
    console.log(`  ${k.padEnd(14)} oow ${String(v.n).padStart(4)} (above ${v.above}, below ${v.below}, ≥0.75 ${v.nearSure}) — out-of-window rate within kind ${pct(v.n, allKinds[k])}`);
  }
  const nearSure = oow.filter(c => c.forecast >= ENGAGE_TOO_EASY_AT).length;
  console.log(`  near-sure encounters (forecast ≥ ${ENGAGE_TOO_EASY_AT}, where the fit has bottomed out): ${nearSure} of ${oow.length} out-of-window (${pct(nearSure, oow.length)})`);
  const uw: Record<string, number> = {};
  for (const r of results) for (const [z, n] of Object.entries(r.undertakingWins)) uw[z] = (uw[z] ?? 0) + n;
  console.log(`  undertaking wins by zone (NOT in the share — the ledger stamps encounters only): ${JSON.stringify(uw)}`);

  console.log('\n-- G. content band chosen ← decider band (all free choices) --');
  console.log('decider     ' + ['novice', 'journeyman', 'expert', 'master', 'unknown'].map(s => s.padStart(11)).join(''));
  for (const b of BANDS) {
    const xs = all.filter(c => c.band === b);
    console.log(b.padEnd(12) + ['novice', 'journeyman', 'expert', 'master', 'unknown'].map(cb => pct(xs.filter(c => c.contentBand === cb).length, xs.length).padStart(11)).join(''));
  }

  console.log('\n-- H. forecast calibration (resolved free choices): mean forecast vs realised success --');
  const pooled: Record<string, { n: number; meanF: number; success: number }> = {};
  for (const r of results) for (const [k, v] of Object.entries(r.calib)) {
    const x = pooled[k] ?? { n: 0, meanF: 0, success: 0 }; x.n += v.n; x.meanF += v.meanF; x.success += v.success; pooled[k] = x;
  }
  for (const b of BANDS) for (const bucket of ['<0.30', '0.30-0.50', '0.50-0.65', '0.65-0.75', '>=0.75']) {
    const x = pooled[`${b}|${bucket}`]; if (!x || x.n < 5) continue;
    console.log(`  ${b.padEnd(10)} ${bucket.padEnd(10)} n=${String(x.n).padStart(4)} mean F ${(x.meanF / x.n).toFixed(3)} success ${(x.success / x.n).toFixed(3)}`);
  }
}

if (TRACE) {
  const oow = results.flatMap(r => r.commits).filter(c => !c.inWindow && c.boardFound);
  console.log("\n-- I. the out-of-window winner's own window fit (board zone uses the SHIFTED window) --");
  const fb: Record<string, number> = {};
  for (const c of oow) { const k = c.winnerExempt ? "exempt(quest)" : (c.winnerFit ?? 1) >= 0.999 ? "fit 1" : (c.winnerFit ?? 1) >= 0.5 ? "fit 0.5-1" : (c.winnerFit ?? 1) > 0.1001 ? "fit 0.1-0.5" : "fit 0.1 (floor)"; fb[k] = (fb[k] ?? 0) + 1; }
  console.log("  " + JSON.stringify(fb));
  const bz: Record<string, number> = {};
  for (const c of oow) bz[String(c.winnerBoardZone)] = (bz[String(c.winnerBoardZone)] ?? 0) + 1;
  console.log("  winner board zone: " + JSON.stringify(bz));
  const sure = oow.filter(c => c.forecast >= ENGAGE_TOO_EASY_AT);
  const byT: Record<string, { n: number; ex: number; fitSum: number; type: string }> = {};
  for (const c of sure) { const x = byT[c.templateId] ?? { n: 0, ex: 0, fitSum: 0, type: c.encounterType }; x.n++; if (c.winnerExempt) x.ex++; x.fitSum += c.winnerFit ?? 1; byT[c.templateId] = x; }
  console.log("  near-sure (F>=0.75) out-of-window winners by template, top 15 of " + Object.keys(byT).length + ":");
  for (const [id, x] of Object.entries(byT).sort((a, b) => b[1].n - a[1].n).slice(0, 15)) console.log("    " + String(x.n).padStart(4) + "  " + id + "  [" + x.type + "] quest-exempt " + x.ex + ", mean fit " + (x.fitSum / x.n).toFixed(2));

  console.log("\n-- J. no in-window encounter on the board: absent, or cut by the board's top-5 encounter slice? --");
  const none = oow.filter(c => (c.inWinEncounters ?? 0) === 0);
  const withList = none.filter(c => c.scoredSize !== undefined);
  const cut = withList.filter(c => (c.inWinScored ?? 0) > 0);
  const ranks = cut.map(c => c.bestInWinScoredRank as number).sort((a, b) => a - b);
  console.log(`  ${none.length} out-of-window choices had no in-window encounter on the board; scored list seen for ${withList.length}`);
  console.log(`  an in-window encounter WAS in the scorer's full list (cut at the top-5): ${cut.length} (${pct(cut.length, withList.length)}); best one's scorer rank median ${ranks[ranks.length >> 1] ?? "—"}, p25 ${ranks[Math.floor(ranks.length / 4)] ?? "—"}`);
  console.log(`  genuinely absent from the scored list: ${withList.length - cut.length}; scored-list size median ${med(withList.map(c => c.scoredSize as number))}`);
  for (const b of BANDS) {
    const xs = withList.filter(c => c.band === b);
    console.log(`    ${b.padEnd(10)} none-on-board ${String(xs.length).padStart(4)}  cut ${String(xs.filter(c => (c.inWinScored ?? 0) > 0).length).padStart(4)}  absent ${String(xs.filter(c => (c.inWinScored ?? 0) === 0).length).padStart(4)}`);
  }
  console.log("  (Section I's \"exempt(quest)\" reads the trace flag, set for any quest above the window whatever the arm — in the no-quest probe those quests WERE discounted.)");
}
if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify(results.map(r => ({ seed: r.seed, inWindowShare: r.report.inWindowShare, freeChoiceCommits: r.report.freeChoiceCommits, dropped: r.dropped, commits: r.commits })), null, 0));
// Silence unused-import lint in a throwaway reader.
void proficiencyBandFor;
