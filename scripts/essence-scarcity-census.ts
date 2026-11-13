// Essence-scarcity census — is essence ever scarce for a god who plays every card?
// THR-2201 (promoted from proto/thr-2201-essence-census). Plan:
// Docs/plans/2026-11-13-thr-2201-make-the-purse-bite.md § "The scarcity target".
//
//   npm run census:essence-scarcity                 — seeds 42, 99, 7: a played run and a
//                                                     --no-play run each, in parallel, then the
//                                                     P1–P3 verdict per seed (P4 = meeting tests)
//   npm run census:essence-scarcity -- --seeds 42   — fewer seeds
//   npm run census:essence-scarcity -- --seed 42 [--no-play]  — one run, full report
//
// P1 the purse bites:    full hand affordable at < ESSENCE_SCARCITY_FULL_HAND_MAX_SHARE of attended steps
// P2 never empty-handed: ≥1 card affordable at ≥ ESSENCE_SCARCITY_ANY_CARD_MIN_SHARE of attended steps
// P3 threads still keep: --no-play, upkeep paid in full on ≥ ESSENCE_SCARCITY_UPKEEP_PAID_MIN_SHARE of ticks
// All measured after the first season (t > TICKS_PER_SEASON), on steps with at least one card.
//
// Builds the `?view=game&seeded&size=medium&warm=<W>` world headless, the way the browser
// route does (App.tsx → useSimulation → useWarmStart):
//   initializeGameStateFromIdentity(DEV_ASCENDANT_IDENTITY, seed, deriveCosmologyFromIdentity(..),
//     'medium', DEV_SHOWCASE_DOOM_ARCHETYPE) → devSeedTheFirst → devSeedAscendantTestPackage →
//   offerArrivalSpineBeat → (warm) settleOpeningSpineBeats(seat, thing left behind, first word),
//   The First toggled to Lives on through toggleAttentionMode, W ticks of runTick, toggled back.
// The browser route always uses world seed 42; other seeds reuse the same identity on a
// different world seed (variation only — not a route a player can reach).
//
// Attended steps: after every tick, an unresolved unified action carrying a LIVE player hold
// (`isPlayerHoldLive`) is a step the UI would put in front of the player — the engine sets
// the hold itself when it posts a pause-tier beat for a step that offers cards
// (`holdStepsForPostedBeats`, orchestrator). For each, the hand is built by the stage's own
// builder (`buildNudgePhaseModel`, as `__DEBUG` does), and the GREEDY god plays every card
// in hand order it can still pay for, charged through `spendNudgeEssence` (the commit
// path's pure half) and written with `withEssenceSpend` + `activeNudges` + releasePlayerHold —
// what GameView.handleCommitNudges writes, minus the card-play tally and choiceHistory row.
// During the warm-up The First runs on Lives on, so no holds are set; `unattended()` also
// drops any stray hold then.
//
// Not modelled: divine casts, scry, premonition compulsions, beats/vignettes (the headless
// god never acts outside a held step), the UI's interrupt suppression.
//
// Usage (repo root):
//   npx esbuild scripts/essence-scarcity-census.ts --bundle --platform=node --format=esm \
//     --outfile=.cache/essence-scarcity-census.mjs --external:fs --external:path
//   node .cache/essence-scarcity-census.mjs --seed 42 --warm 300 --ticks 800 [--budget-s 540] [--out f.json]
//   node .cache/essence-scarcity-census.mjs --static      (card-cost census only)
import * as fs from 'fs';
import { spawn } from 'child_process';
import {
  initializeGameStateFromIdentity, devSeedTheFirst, devSeedAscendantTestPackage, DEV_ASCENDANT_IDENTITY,
} from '../src/engine/gameInit';
import { runTick, resetEventCounter, resetDecisionCache } from '../src/engine/orchestrator';
import { deriveCosmologyFromIdentity } from '../src/engine/remembrance';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits';
import { DEV_SHOWCASE_DOOM_ARCHETYPE } from '../src/engine/doomArchetypeSelection';
import { offerArrivalSpineBeat, settleOpeningSpineBeats } from '../src/engine/ascendantBeat';
import { toggleAttentionMode } from '../src/engine/encounterVisibility';
import { resolveAttentionMode } from '../src/engine/attentionCadence';
import { isPlayerHoldLive, releasePlayerHold, unattended } from '../src/engine/playerStepHold';
import { resolveStepDefinition } from '../src/engine/unifiedActionLifecycle';
import { getUnifiedTemplateById, UNIFIED_ACTION_TEMPLATES, LOCATION_BRANCHING_ENCOUNTER_TEMPLATES } from '../src/data/unified-action-templates';
import { getAnyEncounterById } from '../src/data/encounter-content';
import { buildNudgePhaseModel } from '../src/engine/views/stage/buildNudgePhaseModel';
import { spendNudgeEssence } from '../src/components/Game/encounter-stage/nudgeCommit';
import { withEssenceSpend } from '../src/engine/essenceMovement';
import { computeMaxEssence, computeEssenceGeneration } from '../src/engine/influence';
import { TIER_MAINTENANCE } from '../src/data/influence-content';
import { SPHERE_NAMES } from '../src/types/index';
import { TICKS_PER_SEASON } from '../src/types/temporal';
import { PLAY_PROFILES } from '../src/data/nudge-card-library';

/* eslint-disable @typescript-eslint/no-explicit-any */

/** WARM_START_SETTLED_SPINE_BEATS (useWarmStart.ts) — copied, that module imports React. */
const WARM_SETTLED_BEATS = ['beat.spine.the_seat', 'beat.spine.thing_left_behind', 'beat.spine.the_first_word'];

const argv = process.argv.slice(2);
const arg = (k: string, d: string) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const SEED = Number(arg('--seed', '42'));
const WARM = Number(arg('--warm', '300'));
const TICKS = Number(arg('--ticks', '800'));
const BUDGET_MS = Number(arg('--budget-s', '540')) * 1000;
const OUT = arg('--out', '');
const STATIC_ONLY = argv.includes('--static');
const NO_PLAY = argv.includes('--no-play');
const VERDICT_JSON = argv.includes('--verdict-json');

/** P1 — the full hand is affordable at fewer than this share of attended steps. */
const ESSENCE_SCARCITY_FULL_HAND_MAX_SHARE = 0.5;
/** P2 — at least one card is affordable at this share of attended steps or more. */
const ESSENCE_SCARCITY_ANY_CARD_MIN_SHARE = 0.9;
/** P3 — with the god playing nothing, thread upkeep is paid in full on this share of ticks or more. */
const ESSENCE_SCARCITY_UPKEEP_PAID_MIN_SHARE = 0.95;
const DEFAULT_SEEDS = '42,99,7';

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const median = (xs: number[]) => { if (!xs.length) return NaN; const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const f2 = (x: number) => (Number.isFinite(x) ? x.toFixed(2) : '—');
const pct = (a: number, b: number) => (b ? `${((100 * a) / b).toFixed(0)}%` : '—');
const hist = (xs: number[]) => { const m: Record<string, number> = {}; for (const x of xs) m[String(x)] = (m[String(x)] ?? 0) + 1; return Object.entries(m).sort((a, b) => Number(a[0]) - Number(b[0])).map(([k, v]) => `${k}:${v}`).join(' '); };

// ─── Static card-cost census ─────────────────────────────────────────
function stepsOf(t: any): any[] {
  const r: any[] = [];
  for (const s of t?.steps ?? []) {
    if (s?.variants) { for (const v of Object.values(s.variants)) r.push(v); if (s.fallback) r.push(s.fallback); } else r.push(s);
  }
  return r;
}
function staticCensus(): string[] {
  const lines: string[] = [];
  const seen = new Set<string>();
  const authored: number[] = []; let sphered = 0; let dealSteps = 0; let nudgeSteps = 0;
  for (const t of [...UNIFIED_ACTION_TEMPLATES, ...LOCATION_BRANCHING_ENCOUNTER_TEMPLATES] as any[]) {
    if (seen.has(t.id)) continue; seen.add(t.id);
    for (const s of stepsOf(t)) {
      if (s?.deal !== undefined) dealSteps++;
      if (!s?.nudges?.length) continue;
      nudgeSteps++;
      for (const n of s.nudges) { authored.push(Math.max(0, n.essenceCost ?? 0)); if (n.sphere) sphered++; }
    }
  }
  const lib = Object.values(PLAY_PROFILES).map((p: any) => Math.max(0, p.essenceCost ?? 0));
  lines.push(`static: ${seen.size} templates; ${nudgeSteps} steps author nudges, ${dealSteps} steps declare a deal`);
  lines.push(`static: authored step-nudge costs (n=${authored.length}, ${sphered} sphere-signed) cost:count ${hist(authored)}; mean ${f2(sum(authored) / (authored.length || 1))}`);
  lines.push(`static: library PLAY_PROFILES costs (n=${lib.length}) cost:count ${hist(lib)}; mean ${f2(sum(lib) / (lib.length || 1))}`);
  return lines;
}

if (STATIC_ONLY) { console.log(staticCensus().join('\n')); process.exit(0); }

// ─── Driver: several seeds × {played, --no-play}, in parallel child processes ──
if (!argv.includes('--seed')) {
  const seeds = arg('--seeds', DEFAULT_SEEDS).split(',').map((x) => x.trim()).filter(Boolean);
  const passThrough = ['--warm', String(WARM), '--ticks', String(TICKS), '--budget-s', String(BUDGET_MS / 1000)];
  const self = process.argv[1];
  const runChild = (seed: string, noPlay: boolean) => new Promise<any>((resolve) => {
    const args = [self, '--seed', seed, ...passThrough, '--verdict-json', ...(noPlay ? ['--no-play'] : [])];
    const child = spawn(process.execPath, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    child.stdout.on('data', (d) => { out += String(d); });
    child.stderr.on('data', () => { /* engine warnings — not the census */ });
    child.on('close', (code) => {
      const all = out.split('\n');
      const line = all.find((l) => l.startsWith('VERDICT_JSON '));
      const report = all.filter((l) => l.startsWith('seed ') || l.startsWith('  ')).join('\n');
      resolve({ seed, noPlay, code, report, verdict: line ? JSON.parse(line.slice('VERDICT_JSON '.length)) : null });
    });
  });
  const results = await Promise.all(seeds.flatMap((seed) => [runChild(seed, false), runChild(seed, true)]));
  for (const r of results.filter((x) => !x.noPlay)) console.log(r.report.trim());
  console.log('');
  console.log(`essence-scarcity verdict (after the first season, t>${TICKS_PER_SEASON}; warm ${WARM}; P4 = meetingNudgeConversion / meetingNudgeStage tests)`);
  let allPass = true;
  for (const seed of seeds) {
    const play = results.find((x) => x.seed === seed && !x.noPlay)?.verdict;
    const idle = results.find((x) => x.seed === seed && x.noPlay)?.verdict;
    if (!play || !idle || play.steps === 0) { console.log(`  seed ${seed}: not measured`); allPass = false; continue; }
    const p1 = play.fullHand / play.steps < ESSENCE_SCARCITY_FULL_HAND_MAX_SHARE;
    const p2 = play.anyCard / play.steps >= ESSENCE_SCARCITY_ANY_CARD_MIN_SHARE;
    const p3 = idle.ticks > 0 && idle.upkeepFull / idle.ticks >= ESSENCE_SCARCITY_UPKEEP_PAID_MIN_SHARE;
    allPass = allPass && p1 && p2 && p3;
    const v = (ok: boolean) => (ok ? 'PASS' : 'FAIL');
    console.log(`  seed ${seed} (t${play.firstTick}–t${play.lastTick}): P1 ${v(p1)} full hand ${play.fullHand}/${play.steps} (${pct(play.fullHand, play.steps)})`
      + ` · P2 ${v(p2)} any card ${play.anyCard}/${play.steps} (${pct(play.anyCard, play.steps)})`
      + ` · P3 ${v(p3)} upkeep paid, no play ${idle.upkeepFull}/${idle.ticks} (${pct(idle.upkeepFull, idle.ticks)})`
      + ` · upkeep paid, played ${pct(play.upkeepFull, play.ticks)}`);
  }
  console.log(`  overall P1–P3: ${allPass ? 'PASS' : 'FAIL'}`);
  process.exit(allPass ? 0 : 1);
}

// ─── World build (the seeded route) ──────────────────────────────────
resetEventCounter(); resetReputationTraitInit(); resetDecisionCache();
const runtime = createSimulationRuntime();
const identity = DEV_ASCENDANT_IDENTITY;
const cosmology = deriveCosmologyFromIdentity({ sphereAlignment: identity.sphereAlignment, mortalTags: identity.mortalTags, hungerId: identity.hungerId });
let state: any = initializeGameStateFromIdentity(identity, SEED, cosmology, 'medium', DEV_SHOWCASE_DOOM_ARCHETYPE).state;
devSeedTheFirst(state);
devSeedAscendantTestPackage(state);
const arrival = offerArrivalSpineBeat(state);
if (arrival.ascendantBeats) state = { ...state, ...arrival };
const primary = identity.sphereAlignment.primary as string;
const secondary = identity.sphereAlignment.secondary as string;

const firstEdge = () => state.graph.getEdgesByType('thread').find((e: any) => e.properties?.courtPosition === 'the_first');
let settled: string[] = [];
let toggledForWarm = false;
if (WARM > 0) {
  const r = settleOpeningSpineBeats(state, WARM_SETTLED_BEATS, state.tick);
  settled = r.settled;
  if (r.settled.length) state = { ...state, ...r.patch };
  const e = firstEdge();
  if (e && resolveAttentionMode(e.properties) === 'pause') {
    toggledForWarm = toggleAttentionMode(state.graph, e.id, state.ascendantId, state.tick).ok;
  }
}

// ─── Per-tick ledger ─────────────────────────────────────────────────
interface TickRow { upkeepFull: boolean; tick: number; cap: number; primary: number; secondary: number; total: number; minSphere: number; gross: number; grossPrimary: number; upkeep: number; netDelta: number; netDeltaPrimary: number; threads: number }
interface StepRow {
  tick: number; actionId: string; templateId: string; stepIndex: number; actor: string; court: string;
  cap: number; poolPrimary: number; poolTotal: number;
  hand: { id: string; cost: number; sphere: string | null; state: string }[];
  handCost: number; affordAll: boolean; affordAny: boolean; played: string[]; spent: number; withheld: number;
}
const ticks: TickRow[] = [];
const steps: StepRow[] = [];
const poolTotal = (p: any) => sum(SPHERE_NAMES.map(s => p?.[s] ?? 0));
const courtOf = (actorId: string) => {
  const e = state.graph.getOutgoingEdges(state.ascendantId, 'thread').find((x: any) => x.target === actorId);
  return e ? String(e.properties?.courtPosition ?? 'threaded') : 'unthreaded';
};

function playHeldSteps(): void {
  const actions: any[] = state.unifiedActions ?? [];
  for (const a0 of actions) {
    const live = (state.unifiedActions ?? []).find((x: any) => x.actionId === a0.actionId);
    if (!live || live.resolved || !isPlayerHoldLive(live, state.graph, state.tick)) continue;
    const template: any = getUnifiedTemplateById(live.templateId) ?? getAnyEncounterById(live.templateId);
    if (!template) continue;
    const step = resolveStepDefinition(template, live.currentStep, live.choiceHistory);
    let phase: any;
    try { phase = buildNudgePhaseModel({ template, activeAction: live, step, graph: state.graph, gameState: state, allowEmptyHand: true }); } catch { phase = undefined; }
    const cards: any[] = phase?.cards ?? [];
    const budget = phase?.budgetSphere ?? primary;
    // THR-2201 — the commit's reach for a sphere-less card (GameView passes the same field).
    const payable = phase?.payableSpheres;
    const hand = cards.map(c => ({ id: c.id, cost: Math.max(0, c.essenceCost ?? 0), sphere: c.sphere ?? null, state: c.state }));
    const handCost = sum(hand.map(h => h.cost));
    const charge = (p: any, hs: typeof hand) => spendNudgeEssence(p, hs.map(h => ({ sphere: h.sphere ?? undefined, cost: h.cost })) as any, budget as any, payable);
    const all = charge(state.essencePool, hand);
    const anyOk = hand.some(h => charge(state.essencePool, [h]).ok);
    // Greedy: every card, in hand order, that the pool can still pay for. --no-play: none.
    let pool = state.essencePool; const played: string[] = []; let spent = 0;
    for (const h of NO_PLAY ? [] : hand) {
      const r = charge(pool, [h]);
      if (r.ok) { pool = r.pool; played.push(h.id); spent += r.spent; }
    }
    steps.push({
      tick: state.tick, actionId: live.actionId, templateId: live.templateId, stepIndex: live.currentStep,
      actor: live.actorId, court: courtOf(live.actorId), cap: computeMaxEssence(state.graph, state.ascendantId),
      poolPrimary: state.essencePool[primary] ?? 0, poolTotal: poolTotal(state.essencePool),
      hand, handCost, affordAll: all.ok, affordAny: anyOk, played, spent, withheld: phase?.withheld?.length ?? 0,
    });
    const spendPatch = withEssenceSpend(state, pool, 'spend_nudge' as any);
    state = {
      ...state, ...spendPatch,
      unifiedActions: (state.unifiedActions ?? []).map((x: any) =>
        x.actionId === live.actionId ? { ...releasePlayerHold(x), activeNudges: [...played] } : x),
    };
  }
}

const t0 = Date.now();
let stopReason = 'ticks';
let restored = false;
for (let i = 0; i < TICKS; i++) {
  if (Date.now() - t0 > BUDGET_MS) { stopReason = 'budget'; break; }
  const warming = state.tick < WARM;
  if (!warming && toggledForWarm && !restored) {
    const e = firstEdge();
    if (e) toggleAttentionMode(state.graph, e.id, state.ascendantId, state.tick);
    restored = true;
  }
  const before = state.essencePool;
  const cap = computeMaxEssence(state.graph, state.ascendantId);
  let gen: any = {};
  try { gen = computeEssenceGeneration(state.graph, state.ascendantId, state.controlEffects); } catch { gen = {}; }
  const threadEdges = state.graph.getOutgoingEdges(state.ascendantId, 'thread');
  const upkeep = sum(threadEdges.map((e: any) => TIER_MAINTENANCE[(e.properties?.tier ?? 0) as 0] ?? 0));
  state = runTick(state, [], runtime);
  if (warming) state = unattended(state);
  const after = state.essencePool;
  // Tiered threads only: a thread edge with no `tier` (the seeded artifact thread)
  // can never be paid — TIER_MAINTENANCE[undefined] — whatever the pools hold, so it
  // says nothing about whether the retune starves upkeep.
  const upkeepFull = state.graph.getOutgoingEdges(state.ascendantId, 'thread')
    .filter((e: any) => typeof e.properties?.tier === 'number')
    .every((e: any) => e.properties?.maintenanceCurrent !== false);
  ticks.push({
    upkeepFull,
    tick: state.tick, cap, primary: after[primary] ?? 0, secondary: after[secondary] ?? 0, total: poolTotal(after),
    minSphere: Math.min(...SPHERE_NAMES.map(s => after[s] ?? 0)),
    gross: sum(SPHERE_NAMES.map(s => gen[s] ?? 0)), grossPrimary: gen[primary] ?? 0, upkeep,
    netDelta: poolTotal(after) - poolTotal(before), netDeltaPrimary: (after[primary] ?? 0) - (before[primary] ?? 0),
    threads: threadEdges.length,
  });
  if (!warming) playHeldSteps();
  if (state.phase && state.phase !== 'playing') { stopReason = `phase=${state.phase}`; break; }
}
const ms = Date.now() - t0;
// ─── Report ──────────────────────────────────────────────────────────
function block(label: string, tk: TickRow[], st: StepRow[]): string[] {
  const out: string[] = [];
  if (!tk.length) { out.push(`  ${label}: (no ticks)`); return out; }
  const fracP = tk.map(r => r.primary / r.cap);
  const fracMin = tk.map(r => r.minSphere / r.cap);
  const stepFrac = st.map(s => s.poolPrimary / s.cap);
  const gross = sum(tk.map(r => r.gross)); const grossP = sum(tk.map(r => r.grossPrimary));
  const upkeep = sum(tk.map(r => r.upkeep)); const net = sum(tk.map(r => r.netDelta)); const netP = sum(tk.map(r => r.netDeltaPrimary));
  const spent = sum(st.map(s => s.spent)); const handCost = sum(st.map(s => s.handCost));
  // Within 1 of the cap: upkeep is taken after the clamp, so a full pool reads cap − upkeep.
  const atCapTicks = tk.filter(r => r.primary >= r.cap - 1).length;
  out.push(`  ${label}: ticks t${tk[0].tick}–t${tk[tk.length - 1].tick} (${tk.length}); attended steps ${st.length}; with ≥1 card ${st.filter(s => s.hand.length > 0).length}`);
  out.push(`    primary(${primary}) pool/cap per tick: min ${f2(Math.min(...fracP))} median ${f2(median(fracP))}; ticks within 1 of cap ${pct(atCapTicks, tk.length)}; cap ${tk[0].cap}→${tk[tk.length - 1].cap}`);
  const fracS = tk.map(r => r.secondary / r.cap);
  out.push(`    secondary(${secondary}) pool/cap per tick: min ${f2(Math.min(...fracS))} median ${f2(median(fracS))}`);
  out.push(`    lowest sphere/cap per tick: min ${f2(Math.min(...fracMin))} median ${f2(median(fracMin))}`);
  if (st.length) {
    out.push(`    primary pool/cap at attended steps: min ${f2(Math.min(...stepFrac))} median ${f2(median(stepFrac))}`);
    out.push(`    full hand affordable: ${st.filter(s => s.affordAll).length}/${st.length} (${pct(st.filter(s => s.affordAll).length, st.length)}); greedy played every card: ${st.filter(s => s.played.length === s.hand.length).length}/${st.length}`);
    out.push(`    hand size median ${median(st.map(s => s.hand.length))}, hand cost median ${f2(median(st.map(s => s.handCost)))} max ${f2(Math.max(...st.map(s => s.handCost)))}; card costs ${hist(st.flatMap(s => s.hand.map(h => h.cost)))}`);
  }
  out.push(`    essence: gross income ${f2(gross)} (primary ${f2(grossP)}), thread upkeep ${f2(upkeep)}, greedy card spend ${f2(spent)} (offered ${f2(handCost)}), net pool Δ ${f2(net)} (primary ${f2(netP)})`);
  out.push(`    lost to the cap ≈ gross − upkeep − tick Δ = ${f2(gross - upkeep - net)} (tick Δ excludes card spend, which happens between ticks)`);
  out.push(`    ratio gross income / greedy spend = ${spent > 0 ? f2(gross / spent) : '∞'}; primary income / greedy spend = ${spent > 0 ? f2(grossP / spent) : '∞'}`);
  return out;
}
const attTicks = ticks.filter(r => r.tick > WARM);
const firstSeasonEnd = TICKS_PER_SEASON;
const lines: string[] = [];
lines.push(`seed ${SEED}${NO_PLAY ? ' (no play)' : ''} warm=${WARM} ran ${ticks.length} ticks to t${state.tick} in ${(ms / 1000).toFixed(0)} s (stop: ${stopReason}); opening settled [${settled.join(', ')}]; First toggled for warm ${toggledForWarm}`);
lines.push(`  identity ${primary}/${secondary}; threads at end ${ticks.at(-1)?.threads}; season = ${TICKS_PER_SEASON} ticks`);
lines.push(...block('whole run', ticks, steps));
if (WARM > 0) lines.push(...block(`attended (after warm t${WARM})`, attTicks, steps));
lines.push(...block(`first season (t≤${firstSeasonEnd})`, ticks.filter(r => r.tick <= firstSeasonEnd), steps.filter(s => s.tick <= firstSeasonEnd)));
lines.push(...block(`after first season (t>${firstSeasonEnd})`, ticks.filter(r => r.tick > firstSeasonEnd), steps.filter(s => s.tick > firstSeasonEnd)));
const byTpl: Record<string, number> = {}; for (const s of steps) byTpl[`${s.templateId}#${s.stepIndex}@${s.court}`] = (byTpl[`${s.templateId}#${s.stepIndex}@${s.court}`] ?? 0) + 1;
lines.push(`  attended steps by template#step@court: ${Object.entries(byTpl).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k}×${v}`).join(', ') || '(none)'}`);
const sample = [0, 0.25, 0.5, 0.75, 1].map(q => ticks[Math.min(ticks.length - 1, Math.floor(q * (ticks.length - 1)))]).filter(Boolean);
lines.push(`  pool samples (tick: ${primary}/${secondary}/total/cap): ${sample.map(r => `t${r.tick}: ${f2(r.primary)}/${f2(r.secondary)}/${f2(r.total)}/${r.cap}`).join(' · ')}`);
lines.push(...staticCensus().map(l => '  ' + l));
const postSeasonTicks = ticks.filter(r => r.tick > TICKS_PER_SEASON);
const postSeasonSteps = steps.filter(s => s.tick > TICKS_PER_SEASON && s.hand.length > 0);
const nFull = postSeasonSteps.filter(s => s.affordAll).length;
const nAny = postSeasonSteps.filter(s => s.affordAny).length;
const nUpkeep = postSeasonTicks.filter(r => r.upkeepFull).length;
lines.push(`  P-inputs (t>${TICKS_PER_SEASON}, steps with ≥1 card): full hand ${nFull}/${postSeasonSteps.length}; any card ${nAny}/${postSeasonSteps.length}; upkeep paid in full ${nUpkeep}/${postSeasonTicks.length} ticks`);
console.log(lines.join('\n'));
if (VERDICT_JSON) {
  console.log('VERDICT_JSON ' + JSON.stringify({
    seed: SEED, noPlay: NO_PLAY, steps: postSeasonSteps.length, fullHand: nFull, anyCard: nAny,
    ticks: postSeasonTicks.length, upkeepFull: nUpkeep,
    firstTick: postSeasonTicks[0]?.tick ?? 0, lastTick: postSeasonTicks.at(-1)?.tick ?? 0,
  }));
}
if (OUT) fs.writeFileSync(OUT, JSON.stringify({ seed: SEED, warm: WARM, ticks, steps }, null, 1));
