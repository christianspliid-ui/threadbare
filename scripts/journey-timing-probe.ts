// Journey timing probe (THR-2232, design lane, not for main).
// When does each step of the First's journey land against the age's length?
// Built exactly as scripts/agency-census.ts builds an arm (seeded medium route, warm W), plus:
// every journey vision is answered (--arm none: the free "withdrawn" choice; --arm greedy:
// the costliest affordable choice, and every held step plays every affordable card).
// --kit keeps devSeedAscendantTestPackage (the census's setup); default skips it (THR-2230).
// Usage: node --experimental-strip-types scripts/journey-timing-probe.ts --seed 42 --arm none [--ticks 1100] [--out f.json]
import * as fs from 'fs';
import * as path from 'path';

/* eslint-disable @typescript-eslint/no-explicit-any */
const argv = process.argv.slice(2);
const has = (k: string) => argv.includes(k);
const arg = (k: string, d: string) => { const i = argv.indexOf(k); return i >= 0 && i + 1 < argv.length ? argv[i + 1] : d; };
const SEED = Number(arg('--seed', '42'));
const ARM = arg('--arm', 'none') as 'none' | 'greedy';
const WARM = Number(arg('--warm', '300'));
const TICKS = Number(arg('--ticks', '1100'));
const OUT = arg('--out', '');
const KIT = has('--kit');
const WARM_SETTLED_BEATS = ['beat.spine.the_seat', 'beat.spine.thing_left_behind', 'beat.spine.the_first_word'];

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
  { spendNudgeEssence, spendAuthoredChoiceEssence },
  { withEssenceSpend },
  { getFirstId },
  { firstFate },
  { recordJourneyChoice },
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
  import('../src/engine/journeyEngine'),
]);

resetEventCounter(); resetReputationTraitInit(); resetDecisionCache();
const runtime = createSimulationRuntime();
const identity = DEV_ASCENDANT_IDENTITY;
const cosmology = deriveCosmologyFromIdentity({ sphereAlignment: identity.sphereAlignment, mortalTags: identity.mortalTags, hungerId: identity.hungerId });
let state: any = initializeGameStateFromIdentity(identity, SEED, cosmology, 'medium', DEV_SHOWCASE_DOOM_ARCHETYPE).state;
devSeedTheFirst(state);
if (KIT) devSeedAscendantTestPackage(state);
const arrival = offerArrivalSpineBeat(state);
if (arrival.ascendantBeats) state = { ...state, ...arrival };
const primary = identity.sphereAlignment.primary as string;
const firstEdge = () => state.graph.getEdgesByType('thread').find((e: any) => e.properties?.courtPosition === 'the_first');
let toggledForWarm = false;
if (WARM > 0) {
  const r = settleOpeningSpineBeats(state, WARM_SETTLED_BEATS, state.tick);
  if (r.settled.length) state = { ...state, ...r.patch };
  const e = firstEdge();
  if (e && resolveAttentionMode(e.properties) === 'pause') toggledForWarm = toggleAttentionMode(state.graph, e.id, state.ascendantId, state.tick).ok;
}
const firstId: string | null = getFirstId(state.graph, state.ascendantId);

const log: any[] = [];
const dp = () => Number((state.doomClock?.progress ?? 0).toFixed(3));
const note = (kind: string, extra: any = {}) => log.push({ tick: state.tick, doom: dp(), doomStage: state.doomClock?.currentStage ?? null, kind, ...extra });

function handleHeldSteps(): void {
  for (const a0 of [...(state.unifiedActions ?? [])]) {
    const live = (state.unifiedActions ?? []).find((x: any) => x.actionId === a0.actionId);
    if (!live || live.resolved || !isPlayerHoldLive(live, state.graph, state.tick)) continue;
    const played: string[] = [];
    let pool = state.essencePool;
    const template: any = getUnifiedTemplateById(live.templateId) ?? getAnyEncounterById(live.templateId);
    if (template && ARM === 'greedy') {
      const step = resolveStepDefinition(template, live.currentStep, live.choiceHistory);
      let phase: any;
      try { phase = buildNudgePhaseModel({ template, activeAction: live, step, graph: state.graph, gameState: state, allowEmptyHand: true } as any); } catch { phase = undefined; }
      const budget = phase?.budgetSphere ?? primary;
      for (const c of phase?.cards ?? []) {
        const r: any = spendNudgeEssence(pool, [{ sphere: c.sphere ?? undefined, cost: Math.max(0, c.essenceCost ?? 0) }] as any, budget as any);
        if (r.ok) { pool = r.pool; played.push(c.id); }
      }
    }
    const spendPatch = played.length ? withEssenceSpend(state, pool, 'spend_nudge' as any) : {};
    state = { ...state, ...spendPatch, unifiedActions: (state.unifiedActions ?? []).map((x: any) => x.actionId === live.actionId ? { ...releasePlayerHold(x), activeNudges: [...played] } : x) };
  }
}

function answerVisions(): void {
  const pending: any[] = state.pendingVignettes ?? [];
  if (!pending.length) return;
  for (const v of pending) {
    const d = v.data;
    const choices: any[] = d.choices ?? [];
    let pick: any;
    if (ARM === 'greedy') {
      pick = [...choices].sort((a, b) => (b.effects?.essenceCost ?? 0) - (a.effects?.essenceCost ?? 0))
        .find((c) => (c.effects?.essenceCost ?? 0) === 0 || spendAuthoredChoiceEssence(state.essencePool, c.effects.essenceCost, primary as any).ok);
    } else {
      pick = choices.find((c) => c.effects?.interventionType === 'withdrawn') ?? choices.find((c) => !(c.effects?.essenceCost > 0)) ?? choices[0];
    }
    note('vision', { phase: d.phase, ordeal: !!d.isOrdeal, template: d.templateId ?? d.beatTemplateId, choice: pick?.id ?? '(none: closed)', choices: choices.length, queuedTick: v.queuedTick });
    if (pick) {
      const cost = pick.effects?.essenceCost ?? 0;
      recordJourneyChoice(state.graph, runtime, state.ascendantId, d, pick.id, state.tick);
      if (cost > 0) { const s = spendAuthoredChoiceEssence(state.essencePool, cost, primary as any); if (s.ok) state = { ...state, ...withEssenceSpend(state, s.pool, 'spend_nudge' as any) }; }
    }
  }
  state = { ...state, pendingVignettes: [] };
}

let lastStory: string | null = null; let lastApoOffer: number | null = null; let mandateDone = false; let firstGone = false; let doomExpired = false;
const apoSeen = new Set<string>();
function watch(): void {
  const e = firstEdge();
  const p = e?.properties ?? {};
  if (p.storyPhase !== lastStory) { note('storyPhase', { from: lastStory, to: p.storyPhase ?? null }); lastStory = p.storyPhase ?? null; }
  if (typeof p.apotheosisOfferedTick === 'number' && p.apotheosisOfferedTick !== lastApoOffer) { note('apotheosisOffered', { tier: p.tier }); lastApoOffer = p.apotheosisOfferedTick; }
  for (const a of state.unifiedActions ?? []) {
    if (/apotheosis/.test(String(a.templateId)) && !apoSeen.has(a.actionId)) { apoSeen.add(a.actionId); note('apotheosisStarted', { actor: a.actorId === firstId ? 'first' : a.actorId }); }
  }
  for (const c of (state.chapterArchive ?? [])) {
    const k = `arch:${c.templateId}:${c.tick ?? c.endedTick ?? ''}`;
    if (/apotheosis/.test(String(c.templateId)) && !apoSeen.has(k)) { apoSeen.add(k); note('apotheosisChapterDone', { outcome: c.outcome, actor: c.actorId === firstId ? 'first' : c.actorId }); }
  }
  const n = firstId ? state.graph.getNode(firstId) : undefined;
  if (!firstGone && (!n || n.properties?.deceased === true)) { firstGone = true; note('firstGone', { deceased: n?.properties?.deceased ?? 'missing' }); }
  if (!mandateDone && state.mandateState?.completed) { mandateDone = true; note('mandateCompleted'); }
  if (!doomExpired && state.doomClock?.expired) { doomExpired = true; note('doomExpired'); }
}

note('start', { totalTicks: state.doomClock?.totalTicks, woke: state.doomClock?.wokeAtTick ?? null });
let stopReason = 'ticks'; let restored = false; let lastStage: any = null;
const t0 = Date.now();
for (let i = 0; i < TICKS; i++) {
  const warming = state.tick < WARM;
  if (!warming && toggledForWarm && !restored) { const e = firstEdge(); if (e) toggleAttentionMode(state.graph, e.id, state.ascendantId, state.tick); restored = true; }
  state = runTick(state, [], runtime);
  if (warming) state = unattended(state); else handleHeldSteps();
  answerVisions();
  watch();
  if (state.doomClock?.currentStage !== lastStage) { note('doomStage', { stage: state.doomClock?.currentStage, mandate: Number((state.mandateState?.progress ?? 0).toFixed(3)) }); lastStage = state.doomClock?.currentStage; }
  if (state.tick % 50 === 0) console.error(`[jt ${SEED} ${ARM}] t${state.tick} doom=${dp()} story=${lastStory} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  if (state.phase && state.phase !== 'playing') { stopReason = `phase=${state.phase}`; break; }
}
const ff = (() => { try { return (firstFate(state) as any)?.fate; } catch { return 'err'; } })();
note('end', { stopReason, firstFate: ff, mandate: Number((state.mandateState?.progress ?? 0).toFixed(3)), mandateDone, totalTicks: state.doomClock?.totalTicks, woke: state.doomClock?.wokeAtTick ?? null });
const result = { seed: SEED, arm: ARM, kit: KIT, warm: WARM, seconds: Math.round((Date.now() - t0) / 1000), log };
for (const l of log) console.log(JSON.stringify(l));
if (OUT) { fs.mkdirSync(path.dirname(OUT), { recursive: true }); fs.writeFileSync(OUT, JSON.stringify(result, null, 1)); }
