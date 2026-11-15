// THR-2172 design-lane proto census (never merged): when does a rival land, does the
// Rebuke gift fire, is the landed place on the player's map, and how long is it rebukable?
import { initializeGameStateFromIdentity, devSeedTheFirst, DEV_ASCENDANT_IDENTITY } from '../src/engine/gameInit';
import { runTick, resetEventCounter, resetDecisionCache } from '../src/engine/orchestrator';
import { unattended } from '../src/engine/playerStepHold';
import { deriveCosmologyFromIdentity } from '../src/engine/remembrance';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits';
import { hexOfLocationId } from '../src/engine/regionalMonopoly';
import { rebukablePlaceIds } from '../src/engine/rivalRebuke';
import { resolveDoomWokeAtTick } from '../src/engine/doomClock';
import { MILESTONE_FIRST_REBUKE_BEAT_ID } from '../src/data/player-progression';
import { RIVAL_REBUKE_TEMPLATE_ID } from '../src/data/rival-rebuke-content';
import { resolvePendingBeat } from '../src/engine/ascendantBeat';

/* eslint-disable @typescript-eslint/no-explicit-any */
const TICKS = Number(process.argv[2] ?? 900);
const seeds = (process.argv[3] ?? '42,7,99,1234').split(',').map(Number);

for (const seed of seeds) {
  resetEventCounter(); resetReputationTraitInit(); resetDecisionCache();
  const rt = createSimulationRuntime();
  const c = deriveCosmologyFromIdentity({ sphereAlignment: DEV_ASCENDANT_IDENTITY.sphereAlignment, mortalTags: DEV_ASCENDANT_IDENTITY.mortalTags, hungerId: DEV_ASCENDANT_IDENTITY.hungerId } as any);
  let state: any = initializeGameStateFromIdentity(DEV_ASCENDANT_IDENTITY as any, seed, c, 'medium', 'breach').state;
  devSeedTheFirst(state);
  const seen = new Set<string>();
  let landings = 0, untendedLandings = 0, landedVisible = 0, landedUnexplored = 0, landedRemembered = 0;
  let firstLanding: number | null = null, giftTick: number | null = null, unlockTick: number | null = null, wokeTick: number | null = null;
  let rebukableTicks = 0, presses = 0, pressesUntended = 0;
  const pressSeen = new Set<string>();
  const received: string[] = [];
  const lines: string[] = [];
  for (let t = 0; t < TICKS; t++) {
    state = unattended(runTick(state, [], rt));
    // A player receives every offered beat (presses Receive), as the warm-up path does.
    for (let k = 0; k < 3 && state.ascendantBeats?.pending; k++) {
      const id = state.ascendantBeats.pending.beatId;
      let r = resolvePendingBeat(state);
      if (!r.resolved) r = resolvePendingBeat(state, { chosenActionId: 'divine.dream' });
      state = r.resolved ? r.state : { ...state, ascendantBeats: { ...state.ascendantBeats, pending: null } };
      received.push(`${id}@t${state.tick}`);
    }
    if (state.tick % 50 === 0) console.log(`  .. t${state.tick} landings=${landings} presses=${presses} rebukable=${rebukableTicks} gift=${giftTick} woke=${wokeTick}`);
    if (wokeTick === null && resolveDoomWokeAtTick(state.doomClock) !== null) wokeTick = state.tick;
    const asc = state.graph.getNode(state.ascendantId);
    const fired: string[] = asc?.properties?.milestoneBeatsFired ?? [];
    if (giftTick === null && fired.includes(MILESTONE_FIRST_REBUKE_BEAT_ID)) giftTick = state.tick;
    if (unlockTick === null && (state.unlockedActionIds ?? []).includes(RIVAL_REBUKE_TEMPLATE_ID)) unlockTick = state.tick;
    if (rebukablePlaceIds(state).size > 0) rebukableTicks++;
    for (const rs of state.rivalStates ?? []) {
      const lp = rs?.lastPressed; if (!lp) continue;
      const k = `${rs.rivalId ?? rs.id}:${lp.tick}`;
      if (!pressSeen.has(k)) { pressSeen.add(k); presses++; if (!lp.absorbed) pressesUntended++; }
    }
    for (const e of state.recentEvents ?? []) {
      if (e?.type !== 'rival_action' || seen.has(e.id)) continue;
      seen.add(e.id);
      const placeId = e.refs?.find((r: any) => r.kind === 'location')?.id;
      if (!placeId) continue;
      landings++;
      if (firstLanding === null) firstLanding = state.tick;
      const hex = hexOfLocationId(state.graph, placeId);
      const vis = hex ? state.visibilityMap.get(`${hex.col},${hex.row}`)?.state ?? 'unexplored' : 'nohex';
      if (vis === 'visible') landedVisible++; else if (vis === 'remembered') landedRemembered++; else landedUnexplored++;
      const absorbed = /holds|held|shrug/i.test(e.message);
      if (!absorbed) untendedLandings++;
      if (lines.length < 6) lines.push(`  t${state.tick} [${vis}] ${e.message}`);
    }
  }
  console.log(`\n## seed ${seed} (${TICKS} ticks, seeded First, unattended)`);
  console.log(`doomWoke=t${wokeTick} firstLanding=t${firstLanding} giftEnqueued=t${giftTick} rebukeUnlocked=t${unlockTick}`);
  console.log(`landings=${landings} (untended≈${untendedLandings}) placeOnMap: visible=${landedVisible} remembered=${landedRemembered} unexplored=${landedUnexplored}`);
  console.log(`lastPressed records=${presses} (unabsorbed=${pressesUntended})`);
  console.log(`ticks with a rebukable place=${rebukableTicks}/${TICKS}`);
  console.log(`beats received: ${received.join(', ')} spineCursor=${state.ascendantBeats?.spineCursor}`);
  console.log(lines.join('\n'));
}
