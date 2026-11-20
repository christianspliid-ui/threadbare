// Agency census — does the player's hand change how the age turns out?
// THR-2213 (promoted from proto/thr-2205-agency-census, as census:mandate was). Plan:
// Docs/plans/2026-11-13-thr-2205-measure-whether-the-player-matters.md.
// An offline product measure: no gate, no CI job, no weekly-review step.
//
// Two arms on the same seed and the same seeded route (`?view=game&seeded&size=medium&warm=<W>`,
// built headless exactly as scripts/essence-scarcity-census.ts builds it):
//   --arm none    hands-off: every held step is released with no card played (the mortal's own odds);
//   --arm greedy  played: every held step plays every card in hand order the pool can still pay for.
// Forks are left to the mortal in both arms (Law 11): a held choice step is released the same way.
// Journey visions are answered in both arms (THR-2229), or the First's journey never leaves its
// phase and no arm reaches the Ordeal: the played arm takes the costliest choice the pool can pay
// (paid from the primary pool, as the game charges it); the hands-off arm takes the "withdrawn"
// choice, as dismissing a vision does in the game. A choice-less vision (the Return) is closed.
// Nothing is cast in none/greedy. Determinism (NFP 3) makes every difference between the arms the
// player's doing; run the same arm twice to confirm the zero-noise floor. The verdict (pure) is
// scripts/agency-verdict.ts.
//
// THR-2243 — a third arm answers the clocks:
//   --arm answer  the greedy arm, plus: the god receives each gift beat the game offers it (as the
//                 player's Receive does; a selection beat takes its first option, an offering is let
//                 pass), casts Stay the Unmaking whenever it holds the card, can pay and is not
//                 already holding it back, and Rebukes each place a rival presses once, on the next
//                 tick it can pay. Casts go through preparePlayerCast → commitPlayerCast, the seam
//                 census:mandate's godloc arm uses; a refused cast costs that tick's attempt only.
//                 The cards are never granted by hand: an arm that never receives the gift reports
//                 stayHeld:false / rebukeHeld:false and where the gift was lost.
//
// THR-2248 (plan Docs/plans/2026-11-19-thr-2245-a-well-played-age-can-be-won.md) — a fourth arm
// plays the whole game, and held-step card spend now credits the Mandate as GameView does (THR-2208):
//   --arm full    the answer arm, plus, every tick after Stay's turn, the cheapest place card in each
//                 Mandate sphere still short of its target, when the purse can pay (placeAttempts /
//                 placeRefused count the purse's refusals). `--arms none,greedy,full --ticks 900`
//                 runs the win predicate (agencyWinPredicate), printed as one line naming each clause.
//
// Usage (repo root):
//   npm run census:agency -- --all --out-dir .cache/agency
//        nine arms (AGENCY_SEEDS × none/greedy/answer), at most AGENCY_MAX_PARALLEL at once, no
//        wall-clock budget (an arm ends on ticks or the age's end, never on wall time), then the
//        compare. Each arm takes about 15 minutes: launch it in the background.
//   npm run census:agency -- --compare --out-dir .cache/agency
//   npm run census:agency -- --compare none.json greedy.json [none.json greedy.json …]   (pairs, in order)
//        reprints the verdict from written files; a missing file or an arm stopped on --budget-s
//        is "not measured".
//   npm run census:agency -- --seed 42 --arm answer [--warm 300] [--ticks 800] [--budget-s 540] [--out f.json]
//        one arm; --budget-s is for hand-run single arms only.
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { agencyReport, agencyWinPredicate, agencyWinLine, lastStageLine, lastStagePredicate, AGENCY_COMPARE_TICK, AGENCY_WIN_TICKS, type AgencyArmResult } from './agency-verdict';

/* eslint-disable @typescript-eslint/no-explicit-any */

const AGENCY_SEEDS = [42, 99, 7];
const AGENCY_ARMS_ALL = ['none', 'greedy', 'answer', 'full'] as const;
const AGENCY_DEFAULT_ARMS = 'none,greedy,answer'; // the THR-2243 report; the win predicate wants none,greedy,full
const AGENCY_CAST_SEED_BASE = 2243; // seeds the answer arm's casts (census:mandate's godloc uses 2081)
const AGENCY_MAX_PARALLEL = 4;
const AGENCY_DEFAULT_WARM = 300;
const AGENCY_DEFAULT_TICKS = AGENCY_COMPARE_TICK; // run to the tick the headline is read at
const AGENCY_SNAP_EVERY = 100;
const AGENCY_PROGRESS_EVERY = 25;
const WARM_SETTLED_BEATS = ['beat.spine.the_seat', 'beat.spine.thing_left_behind', 'beat.spine.the_first_word'];

const argv = process.argv.slice(2);
const has = (k: string) => argv.includes(k);
const arg = (k: string, d: string) => { const i = argv.indexOf(k); return i >= 0 && i + 1 < argv.length ? argv[i + 1] : d; };
const SEED = Number(arg('--seed', '42'));
const ARM = arg('--arm', 'none') as 'none' | 'greedy' | 'answer' | 'full';
// THR-2248 — `full`: the answer arm plus the godloc place casts (cheapest place card in each
// Mandate sphere still short of its target, every tick the purse can pay, after Stay's turn).
// --arms picks the driver's arms; --snap-every sets the snapshot cadence (passed to child arms).
const AGENCY_ARMS = arg('--arms', AGENCY_DEFAULT_ARMS).split(',').filter((a) => (AGENCY_ARMS_ALL as readonly string[]).includes(a));
const SNAP_EVERY = Math.max(1, Number(arg('--snap-every', String(AGENCY_SNAP_EVERY))) || AGENCY_SNAP_EVERY);
const PLAYS = ARM === 'greedy' || ARM === 'answer' || ARM === 'full'; // answer and full are the greedy arm plus more
const WARM = Number(arg('--warm', String(AGENCY_DEFAULT_WARM)));
// THR-2248 — a run that includes the full arm reads the win predicate at the age's end.
const WANTS_WIN = ARM === 'full' || (has('--all') && AGENCY_ARMS.includes('full'));
const TICKS = Number(arg('--ticks', String(WANTS_WIN ? AGENCY_WIN_TICKS : AGENCY_DEFAULT_TICKS)));
const BUDGET_S = has('--budget-s') ? Number(arg('--budget-s', '0')) : 0; // 0 = no wall-clock budget
const OUT = arg('--out', '');
const OUT_DIR = arg('--out-dir', '.cache/agency');

const armFile = (dir: string, seed: number | string, arm: string) => path.join(dir, `agency-${seed}-${arm}.json`);
const readArm = (f: string): AgencyArmResult | null => {
  try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; }
};

function compareFromDir(dir: string): string[] {
  // An arm whose file was never written (not in this run's --arms) is left out of the report;
  // one that was written but cannot be read is "not measured".
  const opt = (seed: number, arm: string) => (fs.existsSync(armFile(dir, seed, arm)) ? readArm(armFile(dir, seed, arm)) : undefined);
  const lines = agencyReport(AGENCY_SEEDS.map((seed) => ({
    seed, none: readArm(armFile(dir, seed, 'none')), played: readArm(armFile(dir, seed, 'greedy')),
    ...(opt(seed, 'answer') !== undefined ? { answer: opt(seed, 'answer') } : {}),
  })));
  // THR-2248 — the win predicate, when the full arm ran.
  if (AGENCY_SEEDS.some((seed) => fs.existsSync(armFile(dir, seed, 'full')))) {
    lines.push(agencyWinLine(agencyWinPredicate(AGENCY_SEEDS.map((seed) => ({
      seed, none: readArm(armFile(dir, seed, 'none')), greedy: readArm(armFile(dir, seed, 'greedy')), full: readArm(armFile(dir, seed, 'full')),
    })))));
  }
  return lines;
}

// ─── Compare mode ────────────────────────────────────────────────────
if (has('--compare')) {
  const files = argv.slice(argv.indexOf('--compare') + 1).filter((f) => f.endsWith('.json'));
  let lines: string[];
  if (files.length) {
    const pairs = [];
    for (let i = 0; i < files.length; i += 2) {
      const none = readArm(files[i]);
      const played = i + 1 < files.length ? readArm(files[i + 1]) : null;
      pairs.push({ seed: none?.seed ?? played?.seed ?? files[i], none, played });
    }
    lines = agencyReport(pairs);
  } else {
    lines = compareFromDir(OUT_DIR);
  }
  for (const l of lines) console.log(l);
  process.exit(0);
}

// ─── Driver mode: nine arms in child processes, then the compare ─────
if (has('--all')) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const self = process.argv[1];
  const jobs = AGENCY_SEEDS.flatMap((seed) => AGENCY_ARMS.map((arm) => ({ seed, arm })));
  const runChild = (job: { seed: number; arm: string }) => new Promise<void>((resolve) => {
    const out = armFile(OUT_DIR, job.seed, job.arm);
    const args = [self, '--seed', String(job.seed), '--arm', job.arm, '--warm', String(WARM), '--ticks', String(TICKS), '--out', out, '--snap-every', String(SNAP_EVERY)];
    const child = spawn(process.execPath, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    child.stderr.on('data', (d) => {
      for (const l of String(d).split('\n')) if (l.startsWith('[agency]')) console.error(`[seed ${job.seed} ${job.arm}] ${l}`);
    });
    child.on('close', (code) => { console.error(`[agency] seed ${job.seed} ${job.arm} done (exit ${code}) → ${out}`); resolve(); });
  });
  let next = 0;
  const worker = async () => { while (next < jobs.length) { const j = jobs[next++]; await runChild(j); } };
  await Promise.all(Array.from({ length: Math.min(AGENCY_MAX_PARALLEL, jobs.length) }, worker));
  for (const l of compareFromDir(OUT_DIR)) console.log(l);
  process.exit(0);
}

// ─── Arm mode: one seed, one arm ─────────────────────────────────────
const [
  { initializeGameStateFromIdentity, devSeedTheFirst, devSeedAscendantTestPackage, DEV_ASCENDANT_IDENTITY },
  { runTick, resetEventCounter, resetDecisionCache },
  { deriveCosmologyFromIdentity },
  { createSimulationRuntime },
  { resetReputationTraitInit },
  { DEV_SHOWCASE_DOOM_ARCHETYPE },
  { offerArrivalSpineBeat, settleOpeningSpineBeats },
  { toggleAttentionMode },
  { resolveAttentionMode },
  { isPlayerHoldLive, releasePlayerHold, unattended },
  { resolveStepDefinition },
  { getUnifiedTemplateById },
  { getAnyEncounterById },
  { buildNudgePhaseModel },
  { spendNudgeEssence },
  { withEssenceSpend },
  { getFirstId },
  { firstFate },
  { SPHERE_NAMES },
  { recordJourneyChoice },
  { spendAuthoredChoiceEssence },
  { enableTracing, disableTracing, isTracingEnabled, getTraces, clearTraces },
  { readLuckState },
  { resolvePendingBeat, getBeatDefinitionById },
  { preparePlayerCast, commitPlayerCast },
  { findHeldNonStackingEffect, findPendingNonStackingCast },
  { rebukablePlaceIds, rebukeTargetFor, rebukeAnswerFor },
  { DOOM_STAY_TEMPLATE_ID },
  { RIVAL_REBUKE_TEMPLATE_ID },
  { MILESTONE_FIRST_STAGE_BEAT_ID, MILESTONE_FIRST_REBUKE_BEAT_ID },
  { UNIFIED_ACTION_TEMPLATES },
  { getPlaceNodes, getLocationNodes },
  { addMandateSphereSpend },
  { DOOM_FEED_ALERT_FROM_STAGE, LAST_STAGE_DECISION_SHARE },
  { TICKS_PER_DAY },
] = await Promise.all([
  import('../src/engine/gameInit'),
  import('../src/engine/orchestrator'),
  import('../src/engine/remembrance'),
  import('../src/engine/simulationRuntime'),
  import('../src/engine/phaseReputationTraits'),
  import('../src/engine/doomArchetypeSelection'),
  import('../src/engine/ascendantBeat'),
  import('../src/engine/encounterVisibility'),
  import('../src/engine/attentionCadence'),
  import('../src/engine/playerStepHold'),
  import('../src/engine/unifiedActionLifecycle'),
  import('../src/data/unified-action-templates'),
  import('../src/data/encounter-content'),
  import('../src/engine/views/stage/buildNudgePhaseModel'),
  import('../src/components/Game/encounter-stage/nudgeCommit'),
  import('../src/engine/essenceMovement'),
  import('../src/engine/meetingEncounter'),
  import('../src/engine/twilight'),
  import('../src/types/index'),
  import('../src/engine/journeyEngine'),
  import('../src/components/Game/encounter-stage/nudgeCommit'),
  import('../src/engine/traceBuffer'),
  import('../src/engine/luck'),
  import('../src/engine/ascendantBeat'),
  import('../src/engine/playerCastDispatch'),
  import('../src/engine/controlEffectSpawn'),
  import('../src/engine/rivalRebuke'),
  import('../src/data/doom-stay-content'),
  import('../src/data/rival-rebuke-content'),
  import('../src/data/player-progression'),
  import('../src/data/unified-action-templates'),
  import('../src/engine/sublocationShape'),
  import('../src/engine/mandateLedger'),
  import('../src/data/game-config'),
  import('../src/data/attention-constants'),
]);

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

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

const firstEdge = () => state.graph.getEdgesByType('thread').find((e: any) => e.properties?.courtPosition === 'the_first');
let toggledForWarm = false;
if (WARM > 0) {
  const r = settleOpeningSpineBeats(state, WARM_SETTLED_BEATS, state.tick);
  if (r.settled.length) state = { ...state, ...r.patch };
  const e = firstEdge();
  if (e && resolveAttentionMode(e.properties) === 'pause') {
    toggledForWarm = toggleAttentionMode(state.graph, e.id, state.ascendantId, state.tick).ok;
  }
}
const firstId: string | null = getFirstId(state.graph, state.ascendantId);

let heldSteps = 0; let heldWithCards = 0; let cardsPlayed = 0; let essenceSpent = 0;
// THR-2255 — the decisions the world offered the god (a held step with a hand, a vision with
// choices, a gift beat), the Doom's feedings and absorptions (from the doom.* traces), the
// last-stage alert days, and the doom Rebukes the answer arm cast.
const decisionTicks: number[] = [];
let doomPushTicks = 0; let doomPushAbsorbed = 0; let doomPushEvents = 0; let doomAbsorbEvents = 0;
let doomRebukesCast = 0;
const doomAlertDaySet = new Set<number>();
const doomRebukeDaySet = new Set<number>();
let lastStageFrom: number | null = null;
const beatSeen = new Set<string>();
const dayOf = (t: number) => Math.floor(t / TICKS_PER_DAY);
const apotheosisSteps: any[] = [];
function handleHeldSteps(): void {
  for (const a0 of [...(state.unifiedActions ?? [])]) {
    const live = (state.unifiedActions ?? []).find((x: any) => x.actionId === a0.actionId);
    if (!live || live.resolved || !isPlayerHoldLive(live, state.graph, state.tick)) continue;
    heldSteps++;
    const played: string[] = [];
    const bySphere: Record<string, number> = {}; // THR-2248 — credited to the Mandate as GameView records it (THR-2208)
    let pool = state.essencePool;
    const template: any = getUnifiedTemplateById(live.templateId) ?? getAnyEncounterById(live.templateId);
    if (template) {
      const step = resolveStepDefinition(template, live.currentStep, live.choiceHistory, live.climaxFit);
      let phase: any;
      try { phase = buildNudgePhaseModel({ template, activeAction: live, step, graph: state.graph, gameState: state, allowEmptyHand: true } as any); } catch { phase = undefined; }
      const cards: any[] = phase?.cards ?? [];
      if (cards.length) { heldWithCards++; decisionTicks.push(state.tick); } // THR-2255: a held step with a hand is a decision
      // THR-2227 — each held Apotheosis step: its hand size and the bare chance it opens on.
      if (/apotheosis/.test(String(live.templateId))) {
        apotheosisSteps.push({
          tick: state.tick, step: live.currentStep, cards: cards.length,
          playable: cards.filter((c: any) => c.state === "playable").length,
          bareChance: Number((phase?.baseForecast?.successProbability ?? phase?.baseForecast?.probability ?? NaN)),
          bareTier: phase?.baseForecast?.tier ?? null, climaxLine: phase?.climaxLine?.kind ?? null,
          earnedSlots: live.climaxFit?.earnedSlots ?? 0,
        });
      }
      if (PLAYS) {
        const budget = phase?.budgetSphere ?? primary;
        for (const c of cards) {
          const r: any = spendNudgeEssence(pool, [{ sphere: c.sphere ?? undefined, cost: Math.max(0, c.essenceCost ?? 0) }] as any, budget as any);
          if (r.ok) { pool = r.pool; played.push(c.id); essenceSpent += r.spent; for (const [k, v] of Object.entries(r.bySphere ?? {})) bySphere[k] = (bySphere[k] ?? 0) + (v as number); }
        }
      }
    }
    cardsPlayed += played.length;
    const spendPatch = played.length ? withEssenceSpend(state, pool, 'spend_nudge' as any) : {};
    state = {
      ...state, ...spendPatch,
      unifiedActions: (state.unifiedActions ?? []).map((x: any) =>
        x.actionId === live.actionId ? (() => { const m = addMandateSphereSpend(x.mandateSphereSpend, bySphere as any); return { ...releasePlayerHold(x), activeNudges: [...played], ...(m ? { mandateSphereSpend: m } : {}) }; })() : x),
    };
  }
}

// ─── THR-2229 — journey visions, answered in both arms ───────────────
let visionsAnswered = 0;
const visionChoices: string[] = [];
const ordealRolls: any[] = [];
function answerVisions(played: boolean): void {
  const pending: any[] = state.pendingVignettes ?? [];
  if (!pending.length) return;
  let pool = state.essencePool;
  let spent = false;
  for (const v of pending) {
    const data = v.data;
    const choices: any[] = data?.choices ?? [];
    let choice: any;
    if (played) {
      const affordable = choices.filter((c) => {
        const cost = c.effects?.essenceCost ?? 0;
        return cost <= 0 || spendAuthoredChoiceEssence(pool, cost, primary as any).ok;
      });
      choice = [...affordable].sort((a, b) => (b.effects?.essenceCost ?? 0) - (a.effects?.essenceCost ?? 0))[0];
    } else {
      choice = choices.find((c) => c.effects?.interventionType === 'withdrawn');
    }
    if (!choice) continue; // the Return (no choices) is closed below
    const cost = choice.effects?.essenceCost ?? 0;
    if (cost > 0) {
      const r: any = spendAuthoredChoiceEssence(pool, cost, primary as any);
      if (r.ok) { pool = r.pool; spent = true; essenceSpent += cost; }
    }
    const ordeal = !!data.isOrdeal;
    const was = isTracingEnabled();
    if (ordeal && !was) enableTracing();
    const bagBefore = ordeal ? readLuckState(state.graph.getNode(data.agentId)).bagDraws : undefined;
    recordJourneyChoice(state.graph, runtime, state.ascendantId, data, choice.id, state.tick, state.seed);
    if (ordeal) {
      const t: any = [...getTraces()].reverse().find((x: any) => x.category === 'journey.ordeal_roll' && x.actorId === data.agentId);
      if (!was) disableTracing();
      if (t) {
        const hit = (p: number) => t.roll <= Math.floor(p * 100);
        ordealRolls.push({
          tick: state.tick, choiceId: choice.id, band: t.band, outcome: t.outcome, lean: t.lean,
          chance: Number(t.chance.toFixed(3)), bareChance: Number(t.bareChance.toFixed(3)), roll: t.roll,
          luckDrawIndex: t.luckDrawIndex ?? bagBefore ?? null,
          // the lean decided the success line: the same roll at the bare chance lands on the other side
          leanDecisive: hit(t.chance) !== hit(t.bareChance),
        });
      }
    }
    visionChoices.push(`t${state.tick}:${data.templateId}:${choice.id}`);
    visionsAnswered++;
  }
  state = {
    ...state,
    ...(spent ? withEssenceSpend(state, pool, 'spend_nudge' as any) : {}),
    pendingVignettes: undefined,
  };
}

// ─── THR-2243 — the answer arm: receive the gifts, hold Stay, Rebuke ─
let stayCasts = 0; let rebukeCasts = 0; let stayHeldTicks = 0; let castAttempts = 0; let castsRefused = 0;
let stayHeldFrom: number | null = null; let rebukeHeldFrom: number | null = null;
// THR-2244 — how each Stay landed: clean (DOOM_STAY_RATE) or crooked (success_at_cost), by landing and by held tick.
let stayCleanLandings = 0; let stayCrookedLandings = 0; let stayCleanTicks = 0; let stayCrookedTicks = 0;
const stayEffectsSeen = new Set<string>();
const beatsReceived: string[] = [];
const rebuked = new Set<string>(); // `${rivalId}|${placeId}|${pressedAt}`: each pressing is answered once
const holds = (id: string) => (state.unlockedActionIds ?? []).includes(id);

/** Receive whatever gift beat is offered, as the player's Receive does (GameView's resolvePendingBeat call). */
function receiveGifts(): void {
  const pending = state.ascendantBeats?.pending;
  if (!pending) return;
  const def: any = getBeatDefinitionById(pending.beatId);
  // A selection beat takes its first option; an offering is let pass (it costs essence and is a choice).
  const chosenActionId = pending.kind === 'selection' ? def?.grantsActionIds?.[0] : undefined;
  try {
    const r: any = resolvePendingBeat(state, { ...(chosenActionId ? { chosenActionId } : {}), runtime, templateProvider: getUnifiedTemplateById },
      (id: string) => getUnifiedTemplateById(id) !== undefined);
    if (r.resolved || r.outcome === 'skipped') { state = r.state; beatsReceived.push(`t${state.tick}:${pending.beatId}:${r.outcome || 'received'}`); }
  } catch { /* fail-soft: an unresolvable beat stays pending */ }
}

/** Cast `templateId` on `targetId` through the player-cast seam, paid from the primary. */
function tryCast(templateId: string, targetId: string): boolean {
  const template: any = getUnifiedTemplateById(templateId);
  if (!template) return false;
  castAttempts++;
  try {
    const cast: any = preparePlayerCast({
      graph: state.graph, ascendantId: state.ascendantId, template, templateId, targetId, tick: state.tick,
      seed: AGENCY_CAST_SEED_BASE + castAttempts * 13, sphere: primary as any, runtime,
    });
    // commitPlayerCast clamps an overdraft to zero; the player's hand never offers an unaffordable card.
    if ((state.essencePool?.[primary] ?? 0) < cast.essenceCost) { castsRefused++; return false; }
    state = commitPlayerCast(state, { cast });
    return true;
  } catch { castsRefused++; return false; } // a refused cast costs this tick's attempt only
}

function answerClocks(): void {
  receiveGifts();
  const asc = state.ascendantId;
  if (holds(DOOM_STAY_TEMPLATE_ID)) {
    if (stayHeldFrom === null) stayHeldFrom = state.tick;
    const active = findHeldNonStackingEffect(state.controlEffects, DOOM_STAY_TEMPLATE_ID, asc, asc)
      ?? findPendingNonStackingCast(state.unifiedActions, DOOM_STAY_TEMPLATE_ID, asc, asc);
    if (active) {
      stayHeldTicks++;
      const held: any = findHeldNonStackingEffect(state.controlEffects, DOOM_STAY_TEMPLATE_ID, asc, asc);
      if (held) {
        const crookedValue = (getUnifiedTemplateById(DOOM_STAY_TEMPLATE_ID) as any)?.controlSpec?.ownerRuleOverride?.crookedValue;
        const crooked = held.ownerRuleOverride?.value === crookedValue;
        if (crooked) stayCrookedTicks++; else stayCleanTicks++;
        if (!stayEffectsSeen.has(held.effectId)) { stayEffectsSeen.add(held.effectId); if (crooked) stayCrookedLandings++; else stayCleanLandings++; }
      }
    }
    else if (tryCast(DOOM_STAY_TEMPLATE_ID, asc)) stayCasts++;
  }
  if (holds(RIVAL_REBUKE_TEMPLATE_ID)) {
    if (rebukeHeldFrom === null) rebukeHeldFrom = state.tick;
    for (const placeId of rebukablePlaceIds(state)) {
      const t: any = rebukeTargetFor(state, placeId);
      if (!t) continue;
      const key = `${t.rivalId}|${placeId}|${t.pressedAt}`;
      if (rebuked.has(key)) continue;
      if (tryCast(RIVAL_REBUKE_TEMPLATE_ID, placeId)) { rebukeCasts++; rebuked.add(key); }
    }
    // THR-2255 — and each place where the Doom fed, untended, once per feeding.
    for (const placeId of [...rebukablePlaceIds(state)].sort()) {
      const t: any = rebukeAnswerFor(state, placeId);
      if (!t || t.kind !== 'doom') continue;
      const key = `doom|${placeId}|${t.fedAt}`;
      if (rebuked.has(key)) continue;
      if (tryCast(RIVAL_REBUKE_TEMPLATE_ID, placeId)) { doomRebukesCast++; rebuked.add(key); doomRebukeDaySet.add(dayOf(state.tick)); }
    }
  }
}

// THR-2248 — the full player's place casts (census:mandate's godloc arm, on the agency route).
// placeAttempts counts each tick × short sphere with a place card; placeRefused counts the ones the
// purse could not pay — the predicate's purse-bite clause (plan THR-2245 Decision 5).
let placeCasts = 0; let placeEssence = 0; let placeEssP = 0; let placeEssS = 0;
let placeAttempts = 0; let placeRefused = 0;
const AGENCY_PLACE_CAST_SEED_BASE = 2245; // seeds the full arm's place casts
function cheapestPlaceCard(sphere: string): any | undefined {
  const pick = (cats: string[]) => (UNIFIED_ACTION_TEMPLATES as any[])
    .filter((t) => t.sphereAffinity === sphere && (t.essenceCost ?? 0) > 0 && (t.actorAffinities ?? []).includes('ascendant'))
    .filter((t) => (t.targetCategories ?? ['actor']).some((c: string) => cats.includes(c)))
    .sort((a, b) => a.essenceCost - b.essenceCost)[0];
  return pick(['location', 'sublocation']) ?? pick(['actor']);
}
function castPlaces(): void {
  const d = state.mandateDefinition; if (!d) return;
  // A careful player casts only in a sphere still short of its target (the Mandate's fill line
  // names the short sphere, THR-2236).
  const led = state.mandateState?.godLedger ?? { primary: 0, secondary: 0 };
  const short = (sp: string) => (sp === d.primarySphere
    ? led.primary < ((d as any).primaryTargetPoints ?? Infinity)
    : led.secondary < ((d as any).secondaryTargetPoints ?? Infinity));
  for (const sp of [d.primarySphere, d.secondarySphere].filter(short)) {
    const t = cheapestPlaceCard(sp); if (!t) continue;
    placeAttempts++;
    if ((state.essencePool?.[sp] ?? 0) < t.essenceCost) { placeRefused++; continue; }
    const cats: string[] = t.targetCategories ?? ['actor'];
    const pool = cats.includes('location') ? getPlaceNodes(state.graph)
      : cats.includes('sublocation') ? state.graph.getNodesByType('location').filter((n: any) => typeof n.properties?.parentLocationId === 'string')
      : state.graph.getNodesByType('actor').filter((n: any) => n.properties?.actorType === 'individual' && n.properties?.alive !== false);
    const subs: string[] = t.targetSubtypes ?? [];
    const req = Object.entries(t.requiredNodeProperties ?? {});
    const legal = (subs.length > 0 ? getLocationNodes(state.graph).filter((n: any) => subs.includes(n.properties?.locationSubtype ?? n.properties?.locationType)) : pool)
      .filter((n: any) => req.every(([k, v]) => (v === undefined ? n.properties?.[k] != null : n.properties?.[k] === v)));
    if (!legal.length) continue;
    const target = legal[(state.tick * 7919 + placeCasts) % legal.length];
    try {
      const cast: any = preparePlayerCast({ graph: state.graph, ascendantId: state.ascendantId, template: t, templateId: t.id, targetId: target.id, tick: state.tick, seed: AGENCY_PLACE_CAST_SEED_BASE + placeCasts * 13, sphere: sp, runtime });
      state = commitPlayerCast(state, { cast }); placeCasts++; placeEssence += cast.essenceCost ?? 0;
      if (sp === d.primarySphere) placeEssP += cast.essenceCost ?? 0; else placeEssS += cast.essenceCost ?? 0;
    } catch { /* a refused cast costs this tick's attempt only */ }
  }
}

/**
 * Where a gift that never reached the hand was lost: never enqueued (its trigger never held
 * on this route), or enqueued and left pending (no Receive). Null when the card is held.
 */
function giftLostAt(cardId: string, beatId: string): string | null {
  if (holds(cardId)) return null;
  const fired: string[] = state.graph.getNode(state.ascendantId)?.properties?.milestoneBeatsFired ?? [];
  const pending = state.ascendantBeats?.pending?.beatId ?? null;
  if (!fired.includes(beatId)) {
    // A milestone enqueues only into an empty beat slot (BEAT_MAX_PENDING = 1): a beat nobody
    // receives keeps the slot, and every later gift waits behind it.
    return pending
      ? `${beatId} never enqueued: the one beat slot held ${pending}, which nothing received`
      : `${beatId} never enqueued: its trigger never held on this route`;
  }
  if (pending === beatId) return `${beatId} enqueued but still pending at t${state.tick}: nothing received it`;
  return `${beatId} enqueued and resolved without granting the card`;
}

/** The Twilight's beat 2 as the ceremony would show it now (fate line, then the climax lines). */
function beat2(): string | null {
  try {
    const f: any = firstFate(state);
    return f ? [f.line, ...(f.lines ?? [])].join(' ') : null;
  } catch { return null; }
}

function snapshot() {
  const ff = (() => { try { return firstFate(state); } catch { return undefined; } })();
  const chapters: any[] = (state.chapterArchive ?? []).filter((c: any) => c.actorId === firstId);
  const bands: Record<string, number> = {};
  for (const c of chapters) { const b = String(c.outcome ?? 'none'); bands[b] = (bands[b] ?? 0) + 1; }
  const firstNode = firstId ? state.graph.getNode(firstId) : undefined;
  const thread = firstId ? state.graph.getOutgoingEdges(state.ascendantId, 'thread').find((e: any) => e.target === firstId) : undefined;
  const facts = (): any => {
    if (thread) return thread.properties;
    const note: any = state.graph.getNode(state.ascendantId)?.properties?.firstRemembered;
    return note && note.id === firstId ? note : undefined;
  };
  return {
    tick: state.tick,
    phase: state.phase,
    doomStage: state.doomClock?.currentStage ?? null,
    doomProgress: Number((state.doomClock?.progress ?? 0).toFixed(3)),
    mandateStage: state.mandateState?.currentStage ?? null,
    mandateProgress: Number((state.mandateState?.progress ?? 0).toFixed(3)),
    mandateCompleted: !!state.mandateState?.completed,
    ledgerP: Number((state.mandateState?.godLedger?.primary ?? 0).toFixed(1)),
    ledgerS: Number((state.mandateState?.godLedger?.secondary ?? 0).toFixed(1)),
    placeEssP: Math.round(placeEssP), placeEssS: Math.round(placeEssS), // THR-2248 — the full arm's place essence per sphere (fit projection input)
    firstFate: (ff as any)?.fate ?? 'none',
    // THR-2229 — the climax facts on the First's thread, and the Twilight beat 2 they read as.
    // A death sweeps the thread; the god's note on its First keeps the same facts.
    ordealOutcome: facts()?.ordealOutcome ?? null,
    ordealBand: facts()?.ordealBand ?? null,
    ordealLean: facts()?.ordealLean ?? null,
    apotheosisBand: facts()?.apotheosisBand ?? null,
    apotheosisGodPaid: facts()?.apotheosisGodPaid ?? null,
    returnEnding: facts()?.returnEnding ?? null,
    beat2: beat2(),
    firstAlive: !!firstNode && firstNode.properties?.deceased !== true,
    threadTier: thread?.properties?.tier ?? null,
    apotheosis: chapters.some((c: any) => /apotheosis/.test(String(c.templateId))),
    firstChapters: chapters.length,
    firstChapterIds: chapters.map((c: any) => `${c.templateId}:${c.outcome ?? '-'}`),
    bands,
    essenceTotal: Math.round(sum((SPHERE_NAMES as readonly string[]).map((s) => state.essencePool?.[s] ?? 0))),
  };
}

const t0 = Date.now();
let stopReason = 'ticks';
let restored = false;
const snaps: any[] = [];
for (let i = 0; i < TICKS; i++) {
  if (BUDGET_S > 0 && Date.now() - t0 > BUDGET_S * 1000) { stopReason = 'budget'; break; }
  const warming = state.tick < WARM;
  if (!warming && toggledForWarm && !restored) {
    const e = firstEdge();
    if (e) toggleAttentionMode(state.graph, e.id, state.ascendantId, state.tick);
    restored = true;
  }
  // THR-2255 — the doom.* traces of this tick only (read after it, cleared before the next).
  if (!warming && !isTracingEnabled()) enableTracing();
  clearTraces();
  state = runTick(state, [], runtime);
  if (!warming) {
    for (const tr of getTraces() as any[]) {
      if (tr.category === 'doom.fed') { doomPushTicks += tr.magnitude ?? 0; doomPushEvents++; }
      else if (tr.category === 'doom.feed_absorbed') { doomPushAbsorbed += tr.magnitude ?? 0; doomAbsorbEvents++; }
      else if (tr.category === 'doom.feed_alert') doomAlertDaySet.add(dayOf(tr.tick ?? state.tick));
    }
    if (lastStageFrom === null && (state.doomClock?.currentStage ?? 0) >= DOOM_FEED_ALERT_FROM_STAGE) lastStageFrom = state.tick;
    const pb: any = state.ascendantBeats?.pending;
    if (pb && !beatSeen.has(pb.beatId)) { beatSeen.add(pb.beatId); decisionTicks.push(state.tick); }
    for (const v of (state.pendingVignettes ?? []) as any[]) if ((v?.data?.choices ?? []).length) decisionTicks.push(state.tick);
  }
  if (warming) state = unattended(state);
  else handleHeldSteps();
  answerVisions(PLAYS && !warming);
  if ((ARM === 'answer' || ARM === 'full') && !warming) answerClocks();
  if (ARM === 'full' && !warming) castPlaces();
  if (state.tick % SNAP_EVERY === 0) snaps.push(snapshot());
  if (state.tick % AGENCY_PROGRESS_EVERY === 0) console.error(`[agency] t${state.tick} ${((Date.now() - t0) / 1000).toFixed(0)}s held=${heldSteps} played=${cardsPlayed}`);
  if (state.phase && state.phase !== 'playing') { stopReason = `phase=${state.phase}`; break; }
}
const end = snapshot();
const ms = Date.now() - t0;
// THR-2243 — every arm says whether it held the two clock verbs, and where a gift was lost.
const clockVerbs = {
  stayHeld: holds(DOOM_STAY_TEMPLATE_ID), rebukeHeld: holds(RIVAL_REBUKE_TEMPLATE_ID),
  stayHeldFrom, rebukeHeldFrom, stayCasts, rebukeCasts, stayHeldTicks, castsRefused, beatsReceived,
  stayCleanLandings, stayCrookedLandings, stayCleanTicks, stayCrookedTicks,
  stayGiftLostAt: giftLostAt(DOOM_STAY_TEMPLATE_ID, MILESTONE_FIRST_STAGE_BEAT_ID),
  rebukeGiftLostAt: giftLostAt(RIVAL_REBUKE_TEMPLATE_ID, MILESTONE_FIRST_REBUKE_BEAT_ID),
};
// THR-2255 — the last stage: decisions per in-game day before it and in it, the Doom's feedings.
const perDay = (from: number, to: number, extra = 0) => (to > from
  ? (decisionTicks.filter((t) => t >= from && t < to).length + extra) / ((to - from) / TICKS_PER_DAY) : null);
const lastEnd = state.tick + 1;
const alertDaysInLast = lastStageFrom === null ? 0 : [...doomAlertDaySet].filter((d) => d >= dayOf(lastStageFrom!)).length;
const lastStage = {
  lastStageFrom,
  decisionsPerDayBeforeLastStage: lastStageFrom === null ? null : perDay(WARM, lastStageFrom),
  decisionsPerDayLastStage: lastStageFrom === null ? null : perDay(lastStageFrom, lastEnd),
  decisionsPerDayLastStageWithAlerts: lastStageFrom === null ? null : perDay(lastStageFrom, lastEnd, alertDaysInLast),
  doomAlertDays: doomAlertDaySet.size,
  doomAlertDaysAnswered: [...doomAlertDaySet].filter((d) => doomRebukeDaySet.has(d)).length,
};
const lastStageVerdict = lastStagePredicate(lastStage, LAST_STAGE_DECISION_SHARE);
const doomFeeds = {
  doomPushTicks: Number(doomPushTicks.toFixed(2)), doomPushEvents, doomPushAbsorbed: Number(doomPushAbsorbed.toFixed(2)), doomAbsorbEvents,
  doomRebukesCast, ...lastStage, lastStageVerdict,
};
const result = { placeCasts, placeEssence: Math.round(placeEssence), placeAttempts, placeRefused, seed: SEED, arm: ARM, warm: WARM, ranTo: state.tick, seconds: Math.round(ms / 1000), stopReason, heldSteps, heldWithCards, cardsPlayed, essenceSpent: Math.round(essenceSpent), apotheosisSteps, visionsAnswered, visionChoices, ordealRolls, ...clockVerbs, ...doomFeeds, end, snaps };
const { firstChapterIds, ...endShort } = end;
console.log(JSON.stringify({ ...result, end: endShort, snaps: undefined }));
console.log(`  first chapters: ${firstChapterIds.join(' · ')}`);
console.log(`  doom feeds: pushed ${doomFeeds.doomPushTicks} clock ticks in ${doomPushEvents} feedings · absorbed ${doomFeeds.doomPushAbsorbed} in ${doomAbsorbEvents} · doom Rebukes cast ${doomRebukesCast}`);
console.log(`  ${lastStageLine(SEED, lastStage, lastStageVerdict, LAST_STAGE_DECISION_SHARE)}`);
if (OUT) { fs.mkdirSync(path.dirname(OUT), { recursive: true }); fs.writeFileSync(OUT, JSON.stringify(result, null, 1)); }
