// Agency census — does the player's hand change how the age turns out? (design-lane prototype, never merged)
//
// Two arms on the same seed and the same seeded route (`?view=game&seeded&size=medium&warm=<W>`,
// built headless exactly as `proto/thr-2201-essence-census` builds it):
//   --arm none    hands-off: every held step is released with no card played (the mortal's own odds);
//   --arm greedy  played: every held step plays every card in hand order the pool can still pay for.
// Forks are left to the mortal in both arms (Law 11): a held choice step is released the same way.
// Determinism (NFP 3) makes every difference between the arms the player's doing; run the same arm
// twice (`--arm none` ×2) to confirm the zero-noise floor.
//
// Usage (repo root):
//   npx esbuild scripts/agency-census.ts --bundle --platform=node --format=esm \
//     --outfile=.cache/agency-census.mjs --external:fs --external:path
//   node .cache/agency-census.mjs --seed 42 --arm greedy --warm 300 --ticks 600 [--budget-s 540] [--out f.json]
import * as fs from 'fs';
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
import { getUnifiedTemplateById } from '../src/data/unified-action-templates';
import { getAnyEncounterById } from '../src/data/encounter-content';
import { buildNudgePhaseModel } from '../src/engine/views/stage/buildNudgePhaseModel';
import { spendNudgeEssence } from '../src/components/Game/encounter-stage/nudgeCommit';
import { withEssenceSpend } from '../src/engine/essenceMovement';
import { getFirstId } from '../src/engine/meetingEncounter';
import { firstFate } from '../src/engine/twilight';
import { SPHERE_NAMES } from '../src/types/index';

/* eslint-disable @typescript-eslint/no-explicit-any */

const WARM_SETTLED_BEATS = ['beat.spine.the_seat', 'beat.spine.thing_left_behind', 'beat.spine.the_first_word'];

const argv = process.argv.slice(2);
const arg = (k: string, d: string) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const SEED = Number(arg('--seed', '42'));
const ARM = arg('--arm', 'none') as 'none' | 'greedy';
const WARM = Number(arg('--warm', '300'));
const TICKS = Number(arg('--ticks', '600'));
const BUDGET_MS = Number(arg('--budget-s', '540')) * 1000;
const SNAP_EVERY = Number(arg('--snap', '100'));
const OUT = arg('--out', '');

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

// ─── Compare (pure) ──────────────────────────────────────────────────
const AGENCY_COMPARE_TICK = 800;          // the headline is read here (or at the age's end, if sooner)
const AGENCY_MANDATE_DELTA = 0.10;        // Mandate progress gap that counts as different
const AGENCY_END_TICK_DELTA = 90;         // one season: both ages ended, but this far apart
const AGENCY_MIN_HEADLINE_DIFFS = 1;      // headline differences for "the player mattered" on a seed
function readAt(r: any, t: number): any {
  const s = [...(r.snaps ?? []), r.end].filter(Boolean).filter((x: any) => x.tick <= t);
  return s.length ? s[s.length - 1] : r.end;
}
export function agencyVerdict(none: any, played: any) {
  const a = readAt(none, AGENCY_COMPARE_TICK); const b = readAt(played, AGENCY_COMPARE_TICK);
  const endKind = (r: any) => (r.end.phase !== 'playing' ? (r.end.mandateCompleted ? 'mandate' : 'doom') : 'none');
  const diffs: string[] = [];
  const ek = [endKind(none), endKind(played)];
  if (ek[0] !== ek[1]) diffs.push(`ending ${ek[0]}→${ek[1]}`);
  else if (ek[0] !== 'none' && Math.abs(none.ranTo - played.ranTo) >= AGENCY_END_TICK_DELTA) diffs.push(`age end t${none.ranTo}→t${played.ranTo}`);
  if (a.firstFate !== b.firstFate) diffs.push(`First ${a.firstFate}→${b.firstFate}`);
  if (a.apotheosis !== b.apotheosis) diffs.push(`Apotheosis ${a.apotheosis}→${b.apotheosis}`);
  if (Math.abs(a.mandateProgress - b.mandateProgress) >= AGENCY_MANDATE_DELTA) diffs.push(`Mandate ${a.mandateProgress}→${b.mandateProgress}`);
  if (a.doomStage !== b.doomStage) diffs.push(`Doom stage ${a.doomStage}→${b.doomStage}`);
  const ids = (r: any) => new Set<string>((r.end.firstChapterIds ?? []).map((x: string) => x.split(':')[0]));
  const ia = ids(none); const ib = ids(played);
  const inter = [...ia].filter(x => ib.has(x)).length; const uni = new Set([...ia, ...ib]).size;
  return {
    seed: none.seed, at: Math.min(a.tick, b.tick), headlineDiffs: diffs.length, diffs,
    mattered: diffs.length >= AGENCY_MIN_HEADLINE_DIFFS,
    diagnostics: { chapterTemplateOverlap: uni ? Number((inter / uni).toFixed(2)) : 1, cardsPlayed: played.cardsPlayed, heldSteps: [none.heldSteps, played.heldSteps], essenceLeft: [a.essenceTotal, b.essenceTotal], bands: [a.bands, b.bands] },
  };
}
if (argv.includes('--compare')) {
  // --compare none.json greedy.json [none.json greedy.json …] — pairs, in order
  const files = argv.slice(argv.indexOf('--compare') + 1).filter(f => f.endsWith('.json'));
  const rows = [];
  for (let i = 0; i + 1 < files.length; i += 2) rows.push(agencyVerdict(JSON.parse(fs.readFileSync(files[i], 'utf8')), JSON.parse(fs.readFileSync(files[i + 1], 'utf8'))));
  for (const r of rows) console.log(JSON.stringify(r));
  console.log(`agency: the player mattered on ${rows.filter(r => r.mattered).length}/${rows.length} seeds; headline differences ${rows.map(r => r.headlineDiffs).join(',')}`);
  process.exit(0);
}

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
    let played: string[] = [];
    let pool = state.essencePool;
    const template: any = getUnifiedTemplateById(live.templateId) ?? getAnyEncounterById(live.templateId);
    if (template) {
      const step = resolveStepDefinition(template, live.currentStep, live.choiceHistory);
      let phase: any;
      try { phase = buildNudgePhaseModel({ template, activeAction: live, step, graph: state.graph, gameState: state, allowEmptyHand: true }); } catch { phase = undefined; }
      const cards: any[] = phase?.cards ?? [];
      if (cards.length) heldWithCards++;
      if (ARM === 'greedy') {
        const budget = phase?.budgetSphere ?? primary;
        for (const c of cards) {
          const r = spendNudgeEssence(pool, [{ sphere: c.sphere ?? undefined, cost: Math.max(0, c.essenceCost ?? 0) }] as any, budget as any);
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
    firstFate: ff?.fate ?? 'none',
    firstAlive: !!firstNode && firstNode.properties?.deceased !== true,
    threadTier: thread?.properties?.tier ?? null,
    apotheosis: chapters.some((c: any) => /apotheosis/.test(String(c.templateId))),
    firstChapters: chapters.length,
    firstChapterIds: chapters.map((c: any) => `${c.templateId}:${c.outcome ?? '-'}`),
    bands,
    essenceTotal: Math.round(sum(SPHERE_NAMES.map(s => state.essencePool?.[s] ?? 0))),
  };
}

const t0 = Date.now();
let stopReason = 'ticks';
let restored = false;
const snaps: any[] = [];
for (let i = 0; i < TICKS; i++) {
  if (Date.now() - t0 > BUDGET_MS) { stopReason = 'budget'; break; }
  const warming = state.tick < WARM;
  if (!warming && toggledForWarm && !restored) {
    const e = firstEdge();
    if (e) toggleAttentionMode(state.graph, e.id, state.ascendantId, state.tick);
    restored = true;
  }
  state = runTick(state, [], runtime);
  if (warming) state = unattended(state);
  else handleHeldSteps();
  if (state.tick % SNAP_EVERY === 0) snaps.push(snapshot());
  if (state.tick % 25 === 0) console.error(`[agency] t${state.tick} ${((Date.now() - t0) / 1000).toFixed(0)}s held=${heldSteps} played=${cardsPlayed}`);
  if (state.phase && state.phase !== 'playing') { stopReason = `phase=${state.phase}`; break; }
}
const end = snapshot();
const ms = Date.now() - t0;
const result = { seed: SEED, arm: ARM, warm: WARM, ranTo: state.tick, seconds: Math.round(ms / 1000), stopReason, heldSteps, heldWithCards, cardsPlayed, essenceSpent: Math.round(essenceSpent), end, snaps };
const { firstChapterIds, ...endShort } = end;
console.log(JSON.stringify({ ...result, end: endShort, snaps: undefined }));
console.log(`  first chapters: ${firstChapterIds.join(' · ')}`);
if (OUT) fs.writeFileSync(OUT, JSON.stringify(result, null, 1));
