// PROTO — THR-2174 round-4 follow-up (design lane 2026-11-15b). Never merged.
// Which of The First's chapters, on the warm route, wait for the god and which play out alone?
// Built headless as scripts/agency-census.ts builds the warm world (no dev test package: THR-2230).
// Hands-off arm: every held step is released with no card, so the census counts offers, not plays.
//
// Usage: npx esbuild scripts/alone-chapter-census.ts --bundle --platform=node --format=esm \
//          --outfile=.cache/alone-census.mjs --external:fs --external:path && \
//        node .cache/alone-census.mjs --seed 42 --warm 300 --ticks 600 --out .cache/alone-42.json
import * as fs from 'fs';

/* eslint-disable @typescript-eslint/no-explicit-any */
const argv = process.argv.slice(2);
const arg = (k: string, d: string) => { const i = argv.indexOf(k); return i >= 0 && i + 1 < argv.length ? argv[i + 1] : d; };
const SEED = Number(arg('--seed', '42'));
const WARM = Number(arg('--warm', '300'));
const TICKS = Number(arg('--ticks', '600'));
const OUT = arg('--out', '');
const WARM_SETTLED_BEATS = ['beat.spine.the_seat', 'beat.spine.thing_left_behind', 'beat.spine.the_first_word'];

const [
  { initializeGameStateFromIdentity, devSeedTheFirst, DEV_ASCENDANT_IDENTITY },
  { runTick, resetEventCounter, resetDecisionCache },
  { deriveCosmologyFromIdentity },
  { createSimulationRuntime },
  { resetReputationTraitInit },
  { DEV_SHOWCASE_DOOM_ARCHETYPE },
  { offerArrivalSpineBeat, settleOpeningSpineBeats },
  { toggleAttentionMode },
  { resolveAttentionMode },
  { isPlayerHoldLive, releasePlayerHold, unattended, chapterOffersPlayerMove, stepOffersPlayerMove, chapterWaitWord },
  { getUnifiedTemplateById },
  { getAnyEncounterById },
  { getFirstId },
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
  import('../src/data/unified-action-templates'),
  import('../src/data/encounter-content'),
  import('../src/engine/meetingEncounter'),
]);

resetEventCounter(); resetReputationTraitInit(); resetDecisionCache();
const runtime = createSimulationRuntime();
const identity = DEV_ASCENDANT_IDENTITY;
const cosmology = deriveCosmologyFromIdentity({ sphereAlignment: identity.sphereAlignment, mortalTags: identity.mortalTags, hungerId: identity.hungerId });
let state: any = initializeGameStateFromIdentity(identity, SEED, cosmology, 'medium', DEV_SHOWCASE_DOOM_ARCHETYPE).state;
devSeedTheFirst(state);
const arrival = offerArrivalSpineBeat(state);
if (arrival.ascendantBeats) state = { ...state, ...arrival };
const firstEdge = () => state.graph.getEdgesByType('thread').find((e: any) => e.properties?.courtPosition === 'the_first');
let toggledForWarm = false;
if (WARM > 0) {
  const r = settleOpeningSpineBeats(state, WARM_SETTLED_BEATS, state.tick);
  if (r.settled.length) state = { ...state, ...r.patch };
  const e = firstEdge();
  if (e && resolveAttentionMode(e.properties) === 'pause') toggledForWarm = toggleAttentionMode(state.graph, e.id, state.ascendantId, state.tick).ok;
}
const firstId: string | null = getFirstId(state.graph, state.ascendantId);
const tpl = (id: string) => (getUnifiedTemplateById(id) ?? getAnyEncounterById(id)) as any;

const seen = new Map<string, any>(); // actionId → record
function observe(): void {
  for (const a of state.unifiedActions ?? []) {
    if (a.actorId !== firstId || state.tick < WARM) continue;
    const t = tpl(a.templateId);
    let rec = seen.get(a.actionId);
    if (!rec) {
      const steps = t?.steps?.length ?? 0;
      let stepsWithMove = 0;
      for (let i = 0; i < steps; i++) if (stepOffersPlayerMove(t, i)) stepsWithMove++;
      rec = {
        actionId: a.actionId, templateId: a.templateId, startTick: state.tick,
        routine: t?.routine === true, effectiveTier: a.effectiveTier ?? null,
        word: firstId ? chapterWaitWord(state.graph, firstId, t, a.choiceHistory, a.effectiveTier) ?? null : null,
        offersMove: chapterOffersPlayerMove(t), step0Move: stepOffersPlayerMove(t, 0), steps, stepsWithMove, held: 0,
      };
      seen.set(a.actionId, rec);
    }
  }
}
function observeFuses(): void {
  for (const n of state.encounterNotifications ?? []) {
    const rec = n.actionId ? seen.get(n.actionId) : undefined;
    if (rec && n.fatedFuse === true) rec.fused = (rec.fusedSteps ??= new Set<number>()).add(n.stepIndex ?? -1).size;
    if (rec && n.noPlayerMove === true) rec.noMoveSteps = (rec.noMoveSet ??= new Set<number>()).add(n.stepIndex ?? -1).size;
  }
}
function releaseHeld(): void {
  for (const a of [...(state.unifiedActions ?? [])]) {
    if (a.resolved || !isPlayerHoldLive(a, state.graph, state.tick)) continue;
    const rec = seen.get(a.actionId); if (rec) rec.held++;
    state = { ...state, unifiedActions: state.unifiedActions.map((x: any) => x.actionId === a.actionId ? releasePlayerHold(x) : x) };
  }
}

let restored = false;
for (let i = 0; i < TICKS; i++) {
  const warming = state.tick < WARM;
  if (!warming && toggledForWarm && !restored) { const e = firstEdge(); if (e) toggleAttentionMode(state.graph, e.id, state.ascendantId, state.tick); restored = true; }
  state = runTick(state, [], runtime);
  if (warming) state = unattended(state);
  else { observe(); observeFuses(); releaseHeld(); }
  if (state.tick % 50 === 0) console.error(`[alone] seed ${SEED} t${state.tick} chapters=${seen.size}`);
  if (state.phase && state.phase !== 'playing') break;
}
const recs = [...seen.values()].map(({ fusedSteps, noMoveSet, ...r }: any) => r);
const waitsNoHold = recs.filter((r) => !r.routine && r.offersMove && r.held === 0);
console.log(`waits-but-never-held ${waitsNoHold.length}: fused ${waitsNoHold.filter((r) => r.fused).length}, unknown ${waitsNoHold.filter((r) => !r.fused).length} → ${waitsNoHold.filter((r) => !r.fused).map((r) => `${r.templateId}@t${r.startTick}`).join(', ')}`);
const story = recs.filter((r) => !r.routine);
const byWord: Record<string, number> = {};
for (const r of story) byWord[String(r.word)] = (byWord[String(r.word)] ?? 0) + 1;
const tally = new Map<string, { n: number; offersMove: boolean; held: number }>();
for (const r of story) { const t = tally.get(r.templateId) ?? { n: 0, offersMove: r.offersMove, held: 0 }; t.n++; t.held += r.held; tally.set(r.templateId, t); }
const ranked = [...tally.entries()].sort((a, b) => b[1].n - a[1].n);
const out = {
  seed: SEED, warm: WARM, endTick: state.tick, firstId,
  firstChapters: recs.length, routine: recs.length - story.length, story: story.length,
  storyOffersMove: story.filter((r) => r.offersMove).length, storyHeld: story.filter((r) => r.held > 0).length,
  byWord, ranked: ranked.map(([id, v]) => ({ id, ...v })), recs,
};
const summary = `seed ${SEED}: ${story.length} story chapters for the First after t${WARM} (end t${state.tick}); ${out.storyOffersMove} offer a move, ${out.storyHeld} actually held; words ${JSON.stringify(byWord)}; routine ${out.routine}`;
console.log(summary);
for (const [id, v] of ranked.slice(0, 15)) console.log(`  ${v.n}× ${id} ${v.offersMove ? 'WAITS' : 'ALONE'} held=${v.held}`);
if (OUT) fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
