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
// Nothing is cast. Determinism (NFP 3) makes every difference between the arms the player's doing;
// run the same arm twice to confirm the zero-noise floor. The verdict (pure) is scripts/agency-verdict.ts.
//
// Usage (repo root):
//   npm run census:agency -- --all --out-dir .cache/agency
//        six arms (AGENCY_SEEDS × none/greedy), at most AGENCY_MAX_PARALLEL at once, no wall-clock
//        budget (an arm ends on ticks or the age's end, never on wall time), then the compare.
//        Each arm takes about 15 minutes: launch it in the background.
//   npm run census:agency -- --compare --out-dir .cache/agency
//   npm run census:agency -- --compare none.json greedy.json [none.json greedy.json …]   (pairs, in order)
//        reprints the verdict from written files; a missing file or an arm stopped on --budget-s
//        is "not measured".
//   npm run census:agency -- --seed 42 --arm greedy [--warm 300] [--ticks 800] [--budget-s 540] [--out f.json]
//        one arm; --budget-s is for hand-run single arms only.
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { agencyReport, AGENCY_COMPARE_TICK, type AgencyArmResult } from './agency-verdict';

/* eslint-disable @typescript-eslint/no-explicit-any */

const AGENCY_SEEDS = [42, 99, 7];
const AGENCY_ARMS = ['none', 'greedy'] as const;
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
const ARM = arg('--arm', 'none') as 'none' | 'greedy';
const WARM = Number(arg('--warm', String(AGENCY_DEFAULT_WARM)));
const TICKS = Number(arg('--ticks', String(AGENCY_DEFAULT_TICKS)));
const BUDGET_S = has('--budget-s') ? Number(arg('--budget-s', '0')) : 0; // 0 = no wall-clock budget
const OUT = arg('--out', '');
const OUT_DIR = arg('--out-dir', '.cache/agency');

const armFile = (dir: string, seed: number | string, arm: string) => path.join(dir, `agency-${seed}-${arm}.json`);
const readArm = (f: string): AgencyArmResult | null => {
  try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; }
};

function compareFromDir(dir: string): string[] {
  return agencyReport(AGENCY_SEEDS.map((seed) => ({
    seed, none: readArm(armFile(dir, seed, 'none')), played: readArm(armFile(dir, seed, 'greedy')),
  })));
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

// ─── Driver mode: six arms in child processes, then the compare ──────
if (has('--all')) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const self = process.argv[1];
  const jobs = AGENCY_SEEDS.flatMap((seed) => AGENCY_ARMS.map((arm) => ({ seed, arm })));
  const runChild = (job: { seed: number; arm: string }) => new Promise<void>((resolve) => {
    const out = armFile(OUT_DIR, job.seed, job.arm);
    const args = [self, '--seed', String(job.seed), '--arm', job.arm, '--warm', String(WARM), '--ticks', String(TICKS), '--out', out];
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
function handleHeldSteps(): void {
  for (const a0 of [...(state.unifiedActions ?? [])]) {
    const live = (state.unifiedActions ?? []).find((x: any) => x.actionId === a0.actionId);
    if (!live || live.resolved || !isPlayerHoldLive(live, state.graph, state.tick)) continue;
    heldSteps++;
    const played: string[] = [];
    let pool = state.essencePool;
    const template: any = getUnifiedTemplateById(live.templateId) ?? getAnyEncounterById(live.templateId);
    if (template) {
      const step = resolveStepDefinition(template, live.currentStep, live.choiceHistory);
      let phase: any;
      try { phase = buildNudgePhaseModel({ template, activeAction: live, step, graph: state.graph, gameState: state, allowEmptyHand: true } as any); } catch { phase = undefined; }
      const cards: any[] = phase?.cards ?? [];
      if (cards.length) heldWithCards++;
      if (ARM === 'greedy') {
        const budget = phase?.budgetSphere ?? primary;
        for (const c of cards) {
          const r: any = spendNudgeEssence(pool, [{ sphere: c.sphere ?? undefined, cost: Math.max(0, c.essenceCost ?? 0) }] as any, budget as any);
          if (r.ok) { pool = r.pool; played.push(c.id); essenceSpent += r.spent; }
        }
      }
    }
    cardsPlayed += played.length;
    const spendPatch = played.length ? withEssenceSpend(state, pool, 'spend_nudge' as any) : {};
    state = {
      ...state, ...spendPatch,
      unifiedActions: (state.unifiedActions ?? []).map((x: any) =>
        x.actionId === live.actionId ? { ...releasePlayerHold(x), activeNudges: [...played] } : x),
    };
  }
}

function snapshot() {
  const ff = (() => { try { return firstFate(state); } catch { return undefined; } })();
  const chapters: any[] = (state.chapterArchive ?? []).filter((c: any) => c.actorId === firstId);
  const bands: Record<string, number> = {};
  for (const c of chapters) { const b = String(c.outcome ?? 'none'); bands[b] = (bands[b] ?? 0) + 1; }
  const firstNode = firstId ? state.graph.getNode(firstId) : undefined;
  const thread = firstId ? state.graph.getOutgoingEdges(state.ascendantId, 'thread').find((e: any) => e.target === firstId) : undefined;
  return {
    tick: state.tick,
    phase: state.phase,
    doomStage: state.doomClock?.currentStage ?? null,
    doomProgress: Number((state.doomClock?.progress ?? 0).toFixed(3)),
    mandateStage: state.mandateState?.currentStage ?? null,
    mandateProgress: Number((state.mandateState?.progress ?? 0).toFixed(3)),
    mandateCompleted: !!state.mandateState?.completed,
    firstFate: (ff as any)?.fate ?? 'none',
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
  state = runTick(state, [], runtime);
  if (warming) state = unattended(state);
  else handleHeldSteps();
  if (state.tick % AGENCY_SNAP_EVERY === 0) snaps.push(snapshot());
  if (state.tick % AGENCY_PROGRESS_EVERY === 0) console.error(`[agency] t${state.tick} ${((Date.now() - t0) / 1000).toFixed(0)}s held=${heldSteps} played=${cardsPlayed}`);
  if (state.phase && state.phase !== 'playing') { stopReason = `phase=${state.phase}`; break; }
}
const end = snapshot();
const ms = Date.now() - t0;
const result = { seed: SEED, arm: ARM, warm: WARM, ranTo: state.tick, seconds: Math.round(ms / 1000), stopReason, heldSteps, heldWithCards, cardsPlayed, essenceSpent: Math.round(essenceSpent), end, snaps };
const { firstChapterIds, ...endShort } = end;
console.log(JSON.stringify({ ...result, end: endShort, snaps: undefined }));
console.log(`  first chapters: ${firstChapterIds.join(' · ')}`);
if (OUT) { fs.mkdirSync(path.dirname(OUT), { recursive: true }); fs.writeFileSync(OUT, JSON.stringify(result, null, 1)); }
