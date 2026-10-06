// THR-1742: why do masters skip master work? Absent from their board, cut before scoring, or
// present and outscored?
//
// Runs the gameplay-report world (random archetype + balanced cosmology, medium map) — the same
// world `engagementWindow.invariant.test.ts` and `out-of-window.ts` run — and, for every
// free-choice commit whose decider stamps as a MASTER (capability ≥ 0.85 in the chosen work's
// reach, exactly the band the KPI files it under), follows "master work" through the decision
// funnel the engine ran for that agent-tick:
//
//   pool      the nearby cache entries + dynamic entries handed to the filter pipeline
//   filtered  what survived runFilterPipeline (awareness, prerequisites, the cap's top-N…)
//   eligible  what survived cooldown + max-completions — the list scoreAndSelect scores
//   scored    scoreAndSelect's full ranked list
//   board     `decision.topCandidates` — the scorer's top five after the goal / appointment
//             re-ranks; the ONLY encounters the live decision board reads (phaseAgentDecision)
//
// "Master work" is judged two ways:
//   own-master  content band master (windowFitBandFor) AND its reach is one the decider is a
//               master in — the only work that, chosen, stamps as master and raises the
//               master band's mean attempted difficulty against expert's.
//   any-master  content band master, any reach.
//
// Built by `master-band.build.mjs`, which adds READ-ONLY hooks (they read and write nothing the
// engine reads): before scoreAndSelect and before scoreUnifiedBoard in phaseAgentDecision, after
// each filter-pipeline stage, and on scored in encounterScoring. The `--no-trace` arm re-runs the seeds without the reader's bookkeeping to
// prove the ledger is byte-identical (behaviour-neutral).
//
// Usage: node .cache/master-band.mjs <seeds> <ticks> [--no-trace]
//        node .cache/master-band-keep.mjs <seeds> <ticks> [--keep-p <p>]
//          (probe: the cap also keeps own-master work — all of it, or each template with chance p)
import { createHash } from 'crypto';
import { initializeGameState, MAP_SIZE_PRESETS } from '../../../../src/engine/gameInit';
import { runTick, resetEventCounter, resetDecisionCache } from '../../../../src/engine/orchestrator';
import { createBalancedCosmology } from '../../../../src/engine/cosmology';
import { generateArchetypes } from '../../../../src/engine/ascendant';
import { createSimulationRuntime } from '../../../../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../../../../src/engine/phaseReputationTraits';
import { computeCapability } from '../../../../src/engine/domainCapability';
import { computeEngagementKpiReport, windowFitBandFor, proficiencyBandFor, demandedDifficultyOf } from '../../../../src/engine/kpi/engagementKpi';
import type { EngagementStamp } from '../../../../src/engine/kpi/engagementKpi';
import { getUnifiedTemplateById } from '../../../../src/data/unified-action-templates';

const args = process.argv.slice(2);
const seeds = (args[0] ?? '42,99,7').split(',').map(Number);
const TICKS = Number(args[1] ?? 120);
const TRACE = !args.includes('--no-trace');
const keepAt = args.indexOf('--keep-p');
const KEEP_P = keepAt >= 0 ? Number(args[keepAt + 1]) : 1;

interface Entry { templateId: string; reachPrimary: string; locationId: string }
interface Scored { entry: Entry; finalScore: number; engagementForecast: number; engagementFit: number; valuePerTick: number; desireMultiplier: number; travelCost: number }

const bandCache = new Map<string, string>();
const contentBand = (id: string): string => {
  let b = bandCache.get(id);
  if (b === undefined) {
    const t = getUnifiedTemplateById(id) as { steps?: object[]; scale?: never } | undefined;
    const d = t ? demandedDifficultyOf(t.steps ?? [], t.scale) : NaN;
    b = Number.isFinite(d) ? windowFitBandFor(d) : 'unknown';
    bandCache.set(id, b);
  }
  return b;
};

type Stage = 'chosen' | 'outscored' | 'cut-top5' | 'cut-cooldown' | 'cut-filter' | 'absent-nearby' | 'absent-world';
interface MasterCommit {
  seed: number; tick: number; agentId: string; templateId: string; chosenBand: string; chosenReach: string;
  masterReaches: number;
  own: Stage; any: Stage;
  ownBest?: { rank: number; score: number; forecast: number; fit: number; vpt: number; desire: number; travel: number; id: string };
  winner?: { score: number; forecast: number; fit: number; vpt: number; desire: number; travel: number; band: string };
  ownCounts?: { pool: number; filtered: number; eligible: number; scored: number; board: number };
  /** For a filter cut: the first pipeline stage after which no own-master entry remained. */
  cutStage?: string;
  ownByStage?: Record<string, number>;
  capTemplates?: { ownBefore: number; ownAfter: number; allBefore: number };
}
const FSTAGES = ['awareness', 'visibility', 'prerequisites', 'reputation', 'outgrowth', 'story-breath', 'threat', 'cap'];

function runSeed(seed: number) {
  resetDecisionCache(); resetEventCounter(); resetReputationTraitInit();
  const runtime = createSimulationRuntime();
  const stamps: EngagementStamp[] = [];
  const realStamps = runtime.engagementLedger.stamps;
  const origSet = realStamps.set.bind(realStamps);
  realStamps.set = (k: string, v: EngagementStamp) => { stamps.push(v); return origSet(k, v); };
  const preset = MAP_SIZE_PRESETS.medium;
  const archetype = generateArchetypes(4, seed)[0];
  // Read only by the probe build's cap patch; the shipped build never calls it. With
  // `--keep-p <p>` each own-master template is kept with chance p per (agent, tick, template), a
  // deterministic hash, so the probe can sit at the board share K templates per reach would give.
  let tickNow = 0;
  (globalThis as any).__MB_KEEP = (agentId: string, graph: any, e: Entry) => {
    if (contentBand(e.templateId) !== 'master') return false;
    if (KEEP_P < 1) {
      let h = 2166136261;
      for (const ch of `${agentId}:${tickNow}:${e.templateId}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
      h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12;
      if ((h >>> 0) / 4294967296 >= KEEP_P) return false;
    }
    try { return proficiencyBandFor(computeCapability(graph, agentId, e.reachPrimary as never)) === 'master'; } catch { return false; }
  };
  let { state } = initializeGameState(archetype, 'KpiReport', createBalancedCosmology(), seed, preset.cols, preset.rows) as any;

  // agent|tick → the funnel for that decision, recorded only for agents who are master somewhere.
  const funnels = new Map<string, { masterReaches: Set<string>; pool: Entry[]; filtered: Entry[]; eligible: Entry[]; worldOwn: number; worldAny: number; fstages: Map<string, Entry[]> }>();
  let fstages = new Map<string, Entry[]>();
  (globalThis as any).__MB_FSTAGE = TRACE ? (stage: string, current: Entry[]) => {
    if (stage === 'awareness') fstages = new Map();
    fstages.set(stage, [...current]);
  } : undefined;
  const scoredLists = new Map<string, Scored[]>();
  const boardLists = new Map<string, Scored[]>();
  (globalThis as any).__MB_TOP = TRACE ? (agentId: string, tick: number, top: Scored[]) => {
    if (funnels.has(`${agentId}|${tick}`)) boardLists.set(`${agentId}|${tick}`, [...top]);
  } : undefined;
  const worldMasterTemplates = new Set<string>();
  let worldMasterInstances = 0;
  let worldSampled = false;
  (globalThis as any).__MB_STAGES = TRACE ? (agentId: string, tick: number, graph: any, cache: any, pool: Entry[], filtered: Entry[], eligible: Entry[]) => {
    const all = cache.getAllEntries() as Entry[];
    if (!worldSampled) {
      worldSampled = true;
      for (const e of all) if (contentBand(e.templateId) === 'master') { worldMasterTemplates.add(e.templateId); worldMasterInstances++; }
    }
    const reaches = new Set<string>([...pool, ...all].map(e => e.reachPrimary));
    const masterReaches = new Set<string>();
    for (const r of reaches) {
      let cap = 0;
      try { cap = computeCapability(graph, agentId, r as never); } catch { cap = 0; }
      if (proficiencyBandFor(cap) === 'master') masterReaches.add(r);
    }
    if (masterReaches.size === 0) return;
    const isOwn = (e: Entry) => contentBand(e.templateId) === 'master' && masterReaches.has(e.reachPrimary);
    const isAny = (e: Entry) => contentBand(e.templateId) === 'master';
    funnels.set(`${agentId}|${tick}`, {
      masterReaches, pool: [...pool], filtered: [...filtered], eligible: [...eligible],
      worldOwn: all.filter(isOwn).length, worldAny: all.filter(isAny).length, fstages,
    });
  } : undefined;
  (globalThis as any).__OOW_SCORED = TRACE ? (agentId: string, tick: number, scored: Scored[]) => {
    if (funnels.has(`${agentId}|${tick}`)) scoredLists.set(`${agentId}|${tick}`, [...scored]);
  } : undefined;

  for (let i = 0; i < TICKS; i++) { tickNow = state.tick; state = runTick(state, [], runtime); }

  const commits: MasterCommit[] = [];
  if (TRACE) for (const s of stamps) {
    if (!s.freeChoice || s.band !== 'master') continue;
    const k = `${s.agentId}|${s.committedTick}`;
    const f = funnels.get(k);
    const sl = scoredLists.get(k);
    const top = boardLists.get(k) ?? [];
    const tpl = getUnifiedTemplateById(s.templateId) as { reachPrimary?: string } | undefined;
    const c: MasterCommit = {
      seed, tick: s.committedTick, agentId: s.agentId, templateId: s.templateId,
      chosenBand: contentBand(s.templateId), chosenReach: tpl?.reachPrimary ?? '?',
      masterReaches: f?.masterReaches.size ?? 0, own: 'absent-world', any: 'absent-world',
    };
    if (!f || !sl) { commits.push(c); continue; }
    const classify = (pred: (e: Entry) => boolean, worldN: number): Stage => {
      if (pred({ templateId: s.templateId } as Entry) && (c.chosenBand === 'master')) return 'chosen';
      if (top.some(x => pred(x.entry))) return 'outscored';
      if (sl.some(x => pred(x.entry)) || f.eligible.some(pred)) return 'cut-top5';
      if (f.filtered.some(pred)) return 'cut-cooldown';
      if (f.pool.some(pred)) return 'cut-filter';
      return worldN > 0 ? 'absent-nearby' : 'absent-world';
    };
    const isOwn = (e: Entry) => contentBand(e.templateId) === 'master' && (e.reachPrimary === undefined || f.masterReaches.has(e.reachPrimary));
    const isAny = (e: Entry) => contentBand(e.templateId) === 'master';
    c.own = c.chosenBand === 'master' ? 'chosen' : classify(isOwn, f.worldOwn);
    c.any = c.chosenBand === 'master' ? 'chosen' : classify(isAny, f.worldAny);
    c.ownCounts = { pool: f.pool.filter(isOwn).length, filtered: f.filtered.filter(isOwn).length, eligible: f.eligible.filter(isOwn).length, scored: sl.filter(x => isOwn(x.entry)).length, board: top.filter(x => isOwn(x.entry)).length };
    // Carry a stage forward when its filter threw (the pipeline keeps the previous output).
    const byStage: Record<string, number> = {};
    let prev: Entry[] = f.pool;
    for (const st of FSTAGES) { prev = f.fstages.get(st) ?? prev; byStage[st] = prev.filter(isOwn).length; }
    c.ownByStage = byStage;
    // Per-TEMPLATE survival of the cap (its fill takes one entry per template first), and how
    // many distinct templates of any band the cap chose among — the projection's dilution term.
    const threatList = f.fstages.get('threat') ?? f.pool;
    const capList = f.fstages.get('cap') ?? threatList;
    c.capTemplates = {
      ownBefore: new Set(threatList.filter(isOwn).map(e => e.templateId)).size,
      ownAfter: new Set(capList.filter(isOwn).map(e => e.templateId)).size,
      allBefore: new Set(threatList.map(e => e.templateId)).size,
    };
    if (c.own === 'cut-filter') c.cutStage = FSTAGES.find(st => byStage[st] === 0) ?? '?';
    // The winner is what the mortal committed to (the live board can pick below the scorer's top).
    const w = top.find(x => x.entry.templateId === s.templateId) ?? sl.find(x => x.entry.templateId === s.templateId);
    if (w) c.winner = { score: w.finalScore, forecast: w.engagementForecast, fit: w.engagementFit, vpt: w.valuePerTick, desire: w.desireMultiplier, travel: w.travelCost, band: contentBand(w.entry.templateId) };
    const bi = top.findIndex(x => isOwn(x.entry));
    if (bi >= 0 && c.own === 'outscored') {
      const b = top[bi];
      c.ownBest = { rank: bi, score: b.finalScore, forecast: b.engagementForecast, fit: b.engagementFit, vpt: b.valuePerTick, desire: b.desireMultiplier, travel: b.travelCost, id: b.entry.templateId };
    }
    commits.push(c);
  }
  const report = computeEngagementKpiReport(runtime.engagementLedger);
  return { seed, report, commits, worldMasterTemplates: [...worldMasterTemplates].sort(), worldMasterInstances, ledger: JSON.stringify(runtime.engagementLedger.log) };
}

const pct = (a: number, b: number) => b > 0 ? `${(100 * a / b).toFixed(1)}%` : '—';
const med = (xs: number[]) => { if (!xs.length) return NaN; const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const STAGES: Stage[] = ['chosen', 'outscored', 'cut-top5', 'cut-cooldown', 'cut-filter', 'absent-nearby', 'absent-world'];
const results = seeds.map(runSeed);

for (const r of results) {
  console.log(`\n=== seed ${r.seed} — ${TICKS} ticks, ${TRACE ? 'traced' : 'UNTRACED arm'} ===`);
  console.log(`ledger sha1 ${createHash('sha1').update(r.ledger).digest('hex').slice(0, 12)}, inWindowShare ${r.report.inWindowShare.toFixed(4)}, freeChoiceCommits ${r.report.freeChoiceCommits}`);
  for (const b of r.report.bands) console.log(`  band ${b.band.padEnd(10)} n=${String(b.engagements).padStart(4)} covered ${b.covered} success ${b.successRate.toFixed(3)} meanDiff ${b.meanAttemptedDifficulty.toFixed(3)}`);
  if (!TRACE) continue;
  console.log(`  master-band templates instanced in the world at first decision: ${r.worldMasterTemplates.length} templates, ${r.worldMasterInstances} instances — ${r.worldMasterTemplates.join(', ')}`);
}

if (TRACE) {
  const all = results.flatMap(r => r.commits);
  console.log(`\n=== pooled seeds ${seeds.join(',')} — ${all.length} master free-choice commits ===`);
  console.log('\n-- M1. content band a master chose --');
  for (const b of ['novice', 'journeyman', 'expert', 'master', 'unknown']) console.log(`  ${b.padEnd(11)} ${pct(all.filter(c => c.chosenBand === b).length, all.length).padStart(6)}`);

  for (const [label, key] of [['own-master work (master band, in a reach the decider is a master in)', 'own'], ['any-master work (master band, any reach)', 'any']] as const) {
    console.log(`\n-- M2. where ${label} was, per master commit --`);
    for (const r of results) {
      const xs = r.commits;
      console.log(`  seed ${String(r.seed).padEnd(4)} n=${String(xs.length).padStart(4)}  ` + STAGES.map(s => `${s} ${pct(xs.filter(c => c[key] === s).length, xs.length)}`).join('  '));
    }
    console.log(`  pooled    n=${String(all.length).padStart(4)}  ` + STAGES.map(s => `${s} ${pct(all.filter(c => c[key] === s).length, all.length)}`).join('  '));
  }

  const lost = all.filter(c => c.own === 'outscored' && c.ownBest && c.winner);
  console.log(`\n-- M3. own-master work on the board and not chosen (${lost.length} of ${all.filter(c => c.own === 'outscored').length} with the committed entry found): committed winner vs best own-master (rank = place in the board's top list) --`);
  if (lost.length) {
    console.log(`  best own-master rank median ${med(lost.map(c => c.ownBest!.rank))}; winner÷it score median ${med(lost.map(c => c.winner!.score / Math.max(c.ownBest!.score, 1e-12))).toFixed(2)}`);
    console.log(`  forecast: winner median ${med(lost.map(c => c.winner!.forecast)).toFixed(3)}, own-master median ${med(lost.map(c => c.ownBest!.forecast)).toFixed(3)}`);
    console.log(`  window fit: winner median ${med(lost.map(c => c.winner!.fit)).toFixed(3)}, own-master median ${med(lost.map(c => c.ownBest!.fit)).toFixed(3)}`);
    console.log(`  value/tick ratio (winner÷own) median ${med(lost.map(c => c.winner!.vpt / Math.max(c.ownBest!.vpt, 1e-12))).toFixed(2)}; desire ratio median ${med(lost.map(c => c.winner!.desire / Math.max(c.ownBest!.desire, 1e-12))).toFixed(2)}; travel winner ${med(lost.map(c => c.winner!.travel)).toFixed(2)} vs own ${med(lost.map(c => c.ownBest!.travel)).toFixed(2)}`);
    const wb: Record<string, number> = {};
    for (const c of lost) wb[c.winner!.band] = (wb[c.winner!.band] ?? 0) + 1;
    console.log(`  winner content band: ${JSON.stringify(wb)}`);
    const ids: Record<string, number> = {};
    for (const c of lost) ids[c.ownBest!.id] = (ids[c.ownBest!.id] ?? 0) + 1;
    console.log(`  the outscored own-master templates: ${JSON.stringify(ids)}`);
  }

  console.log('\n-- M4. own-master work through the funnel (mean count per master commit) --');
  const withCounts = all.filter(c => c.ownCounts);
  const mean = (k: 'pool' | 'filtered' | 'eligible' | 'scored' | 'board') => (withCounts.reduce((s, c) => s + c.ownCounts![k], 0) / Math.max(withCounts.length, 1)).toFixed(2);
  console.log(`  pool ${mean('pool')} → filtered ${mean('filtered')} → eligible ${mean('eligible')} → scored ${mean('scored')} → board ${mean('board')} (n=${withCounts.length})`);
  console.log(`  commits with ≥1 own-master entry in pool: ${pct(withCounts.filter(c => c.ownCounts!.pool > 0).length, withCounts.length)}; in scored: ${pct(withCounts.filter(c => c.ownCounts!.scored > 0).length, withCounts.length)}; ON THE BOARD (top list): ${pct(withCounts.filter(c => c.ownCounts!.board > 0).length, withCounts.length)}`);
  console.log('  own-master entries surviving each filter stage (mean per commit): ' + FSTAGES.map(st => `${st} ${(withCounts.reduce((s, c) => s + (c.ownByStage?.[st] ?? 0), 0) / Math.max(withCounts.length, 1)).toFixed(2)}`).join(' → '));
  const cuts: Record<string, number> = {};
  for (const c of all) if (c.cutStage) cuts[c.cutStage] = (cuts[c.cutStage] ?? 0) + 1;
  console.log(`  filter cuts by the stage that removed the last own-master entry: ${JSON.stringify(cuts)}`);
  console.log(`  master reaches per master decider: median ${med(all.map(c => c.masterReaches))}`);

  // M5 — the projection the content brief needs. The cap's fill takes one entry per template
  // before repeats, so each distinct own-master template that reaches the cap survives it with
  // about the same chance q. With K own-master templates the chance at least one reaches the
  // board is 1 − (1 − q)^K; new templates also dilute q by allBefore / (allBefore + added).
  const ct = all.filter(c => c.capTemplates && c.capTemplates.ownBefore > 0);
  const before = ct.reduce((s, c) => s + c.capTemplates!.ownBefore, 0);
  const after = ct.reduce((s, c) => s + c.capTemplates!.ownAfter, 0);
  const q = before > 0 ? after / before : NaN;
  const allMed = med(ct.map(c => c.capTemplates!.allBefore));
  const ownMed = med(ct.map(c => c.capTemplates!.ownBefore));
  console.log('\n-- M5. per-template survival of the cap, and the per-reach count it implies --');
  console.log(`  own-master templates reaching the cap: ${before} over ${ct.length} commits (median ${ownMed} per commit); surviving it: ${after} → q = ${q.toFixed(3)}`);
  console.log(`  distinct templates of any band the cap chose among: median ${allMed}`);
  // The board then reads only the scorer's top list: t = P(on the board | scored), measured.
  const sc = withCounts.filter(c => c.ownCounts!.scored > 0);
  const t = sc.length ? sc.filter(c => c.ownCounts!.board > 0).length / sc.length : NaN;
  console.log(`  of commits with own-master work scored, it was also on the board (top list): t = ${t.toFixed(3)} (${sc.length})`);
  for (let k = 1; k <= 8; k++) {
    const added = (k - 1) * 8;
    const qk = q * allMed / (allMed + added);
    const scoredP = 1 - Math.pow(1 - qk, k * ownMed);
    console.log(`  K = ${k} per reach: P(scored) ≈ ${scoredP.toFixed(2)}, P(on the board) ≈ ${(scoredP * t).toFixed(2)} (q diluted to ${qk.toFixed(3)}; t held at the measured value)`);
  }
}
