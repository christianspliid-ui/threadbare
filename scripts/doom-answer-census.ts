// PROTO — THR-2202 warm round-4 Doom follow-up (design lane 2026-11-15c). Never merged.
// On the warm route: when does each Doom stage notice fire, and does the god already hold
// Stay the Unmaking at that moment? When is the first-stage gift offered and received?
// Built headless as scripts/alone-chapter-census.ts (proto/thr-2174-alone-census) builds the warm world.
// After arrival the probe plays an attentive player: every pending beat is received the tick it is
// offered (a selection beat takes its first option), every held step is released with no card.
//
// Usage: npx esbuild scripts/doom-answer-census.ts --bundle --platform=node --format=esm \
//          --outfile=.cache/doom-census.mjs --external:fs --external:path && \
//        node .cache/doom-census.mjs --seed 42 --warm 300 --ticks 700
/* eslint-disable @typescript-eslint/no-explicit-any */
const argv = process.argv.slice(2);
const arg = (k: string, d: string) => { const i = argv.indexOf(k); return i >= 0 && i + 1 < argv.length ? argv[i + 1] : d; };
const SEED = Number(arg('--seed', '42'));
const WARM = Number(arg('--warm', '300'));
const TICKS = Number(arg('--ticks', '700'));
const WARM_SETTLED_BEATS = ['beat.spine.the_seat', 'beat.spine.thing_left_behind', 'beat.spine.the_first_word'];
const STAY = 'divine.self.stay_the_unmaking';
const GIFT = 'beat.milestone.the_first_stage';

const [
  { initializeGameStateFromIdentity, devSeedTheFirst, DEV_ASCENDANT_IDENTITY },
  { runTick, resetEventCounter, resetDecisionCache },
  { deriveCosmologyFromIdentity },
  { createSimulationRuntime },
  { resetReputationTraitInit },
  { DEV_SHOWCASE_DOOM_ARCHETYPE },
  { offerArrivalSpineBeat, settleOpeningSpineBeats, resolvePendingBeat, getBeatDefinitionById },
  { toggleAttentionMode },
  { resolveAttentionMode },
  { isPlayerHoldLive, releasePlayerHold, unattended },
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

const held = () => (state.unlockedActionIds ?? []).includes(STAY);
const log: string[] = [];
let giftOffered: number | null = null;
let giftReceived: number | null = null;
const pendingAtArrival: string[] = [];
let lastPending: string | null = null;
const beatsReceivedAfterArrival: string[] = [];
let restored = false;
for (let i = 0; i < TICKS; i++) {
  const warming = state.tick < WARM;
  if (!warming && toggledForWarm && !restored) { const e = firstEdge(); if (e) toggleAttentionMode(state.graph, e.id, state.ascendantId, state.tick); restored = true; }
  if (!warming && pendingAtArrival.length === 0) pendingAtArrival.push(state.ascendantBeats?.pending?.beatId ?? '(none)');
  state = runTick(state, [], runtime);
  if (warming) state = unattended(state);
  for (const ev of state.tickEvents ?? []) {
    if (ev.type === 'doom_escalation') {
      log.push(`t${state.tick} ${warming ? 'WARM-UP' : 'PLAY'} stage notice "${ev.notification?.popup?.title}" — Stay held: ${held() ? 'yes' : 'NO'}; pending beat: ${state.ascendantBeats?.pending?.beatId ?? '(none)'}`);
    }
  }
  const p = state.ascendantBeats?.pending?.beatId ?? null;
  if (p !== lastPending) { if (p === GIFT && giftOffered === null) giftOffered = state.tick; lastPending = p; }
  if (!warming && p) {
    const def = getBeatDefinitionById(p);
    const chosen = def?.kind === 'selection' ? def.grantsActionIds?.[0] : undefined;
    const r = resolvePendingBeat(state, chosen ? { chosenActionId: chosen } : {});
    if (r?.state) { state = r.state; beatsReceivedAfterArrival.push(`${p}@t${state.tick}`); if (p === GIFT) giftReceived = state.tick; lastPending = null; }
  }
  if (!warming) for (const a of [...(state.unifiedActions ?? [])]) {
    if (a.resolved || !isPlayerHoldLive(a, state.graph, state.tick)) continue;
    state = { ...state, unifiedActions: state.unifiedActions.map((x: any) => x.actionId === a.actionId ? releasePlayerHold(x) : x) };
  }
  if (state.phase && state.phase !== 'playing') break;
}
const doom = state.doomClock ?? {};
console.log(`seed ${SEED} warm ${WARM} end t${state.tick}; doom woke t${doom.wokeAtTick ?? '?'}, stage ${doom.currentStage}; pending at arrival: ${pendingAtArrival[0]}`);
for (const l of log) console.log('  ' + l);
console.log(`  first-stage gift offered t${giftOffered ?? '-'}, received t${giftReceived ?? '-'}; beats received after arrival: ${beatsReceivedAfterArrival.slice(0, 8).join(', ')}`);
