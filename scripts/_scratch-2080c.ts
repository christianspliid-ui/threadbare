// Rebaseline arm: take the Mandate's baseline after tick 2 (once tick-1 mints exist), run unattended.
import { initializeGameStateFromIdentity, devSeedTheFirst, DEV_ASCENDANT_IDENTITY, initializeGameState } from '../src/engine/gameInit';
import { runTick, resetEventCounter, resetDecisionCache } from '../src/engine/orchestrator';
import { unattended } from '../src/engine/playerStepHold';
import { deriveCosmologyFromIdentity } from '../src/engine/remembrance';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
const ticks = Number(process.argv[2] ?? '600');
function run(label: string, mk: () => any) {
  resetEventCounter(); resetReputationTraitInit(); resetDecisionCache();
  const rt = createSimulationRuntime(); let state = mk();
  for (let i = 0; i < 2; i++) state = unattended(runTick(state, [], rt));
  const agg = state.worldSoul.aggregate.totalBySphere; const d = state.mandateDefinition;
  state = { ...state, mandateDefinition: { ...d, primaryBaseline: agg[d.primarySphere], secondaryBaseline: agg[d.secondarySphere] } };
  let lastDecile = -1;
  for (let i = 2; i < ticks; i++) {
    state = unattended(runTick(state, [], rt));
    const p = state.mandateState?.progress ?? 0; const dec = Math.floor(p * 10);
    if (dec !== lastDecile) { console.log(`${label} t${state.tick} progress=${p.toFixed(3)} doom=${(state.doomClock.progress ?? 0).toFixed(3)}`); lastDecile = dec; }
    if (state.phase !== 'playing') { console.log(`${label} LEFT PLAYING t${state.tick} mandateCompleted=${state.mandateState?.completed} doomExpired=${state.doomClock.expired}`); return; }
  }
  console.log(`${label} still playing t${state.tick} progress=${(state.mandateState?.progress ?? 0).toFixed(3)} doom=${(state.doomClock.progress ?? 0).toFixed(3)}`);
}
const c = deriveCosmologyFromIdentity({ sphereAlignment: DEV_ASCENDANT_IDENTITY.sphereAlignment, mortalTags: DEV_ASCENDANT_IDENTITY.mortalTags, hungerId: DEV_ASCENDANT_IDENTITY.hungerId });
run('seeded42', () => { const s = initializeGameStateFromIdentity(DEV_ASCENDANT_IDENTITY, 42, c, 'medium', 'breach').state; devSeedTheFirst(s); return s; });
for (const seed of [42, 99, 7]) run(`cli${seed}`, () => { const cc = createBalancedCosmology(); return initializeGameState(generateArchetypes(4, seed)[0], 'T', cc, seed, 32, 24).state; });
