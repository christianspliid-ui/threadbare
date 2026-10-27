// THR-2080 diagnosis (design lane, never merged): when does the ?seeded medium world leave `playing`,
// with and without devSeedAscendantTestPackage?
import { initializeGameStateFromIdentity, devSeedTheFirst, devSeedAscendantTestPackage, DEV_ASCENDANT_IDENTITY } from '../src/engine/gameInit';
import { runTick, resetEventCounter, resetDecisionCache } from '../src/engine/orchestrator';
import { unattended } from '../src/engine/playerStepHold';
import { deriveCosmologyFromIdentity } from '../src/engine/remembrance';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits';
import { computeSphereAggregate } from '../src/engine/phaseSphereAggregation';
import { initializeGameState } from '../src/engine/gameInit';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';

const ticks = Number(process.argv[2] ?? '80');
const seeds = (process.argv[3] ?? '42').split(',').map(Number);

function arm(seed: number, withPackage: boolean) {
  resetEventCounter(); resetReputationTraitInit(); resetDecisionCache();
  const runtime = createSimulationRuntime();
  const cosmology = deriveCosmologyFromIdentity({
    sphereAlignment: DEV_ASCENDANT_IDENTITY.sphereAlignment,
    mortalTags: DEV_ASCENDANT_IDENTITY.mortalTags,
    hungerId: DEV_ASCENDANT_IDENTITY.hungerId,
  });
  let { state } = initializeGameStateFromIdentity(DEV_ASCENDANT_IDENTITY, seed, cosmology, 'medium', 'breach');
  devSeedTheFirst(state);
  if (withPackage) devSeedAscendantTestPackage(state);
  const def: any = state.mandateDefinition;
  const fmt = (s: any) => s ? `stage=${s.currentStage} progress=${(s.progress ?? 0).toFixed(3)} completed=${s.completed} P=${(s.primaryCurrent ?? 0).toFixed(3)}/${(def?.primaryBaseline ?? 0).toFixed(3)} S=${(s.secondaryCurrent ?? 0).toFixed(3)}/${(def?.secondaryBaseline ?? 0).toFixed(3)}` : 'none';
  const agg0 = computeSphereAggregate(state.graph);
  const tot = Object.values(agg0.totalBySphere).reduce((a: number, b: any) => a + (b as number), 0);
  console.log(`post-init aggregate: entities=${agg0.entityCount} sumAllSpheres=${tot.toFixed(2)} primary(${def?.primarySphere})=${(agg0.totalBySphere as any)[def?.primarySphere]?.toFixed(3)} secondary(${def?.secondarySphere})=${(agg0.totalBySphere as any)[def?.secondarySphere]?.toFixed(3)} targets=${def?.primaryTargetDelta}/${def?.secondaryTargetDelta}`);
  console.log(`\n## seed ${seed} package=${withPackage} mandate="${def?.name}" kind=${def?.runtimeKind ?? 'legacy'} stages=${JSON.stringify(def?.stages?.map?.((x: any) => x.id ?? x.name) ?? null)}`);
  console.log(`t0 ${fmt(state.mandateState)}`);
  let last = '';
  for (let i = 0; i < ticks; i++) {
    state = unattended(runTick(state, [], runtime));
    const line = fmt(state.mandateState);
    if (line !== last) { console.log(`t${state.tick} ${line} phase=${state.phase}`); last = line; }
    if (state.phase !== 'playing') { console.log(`LEFT PLAYING at tick ${state.tick} phase=${state.phase}`); return state.tick; }
  }
  console.log(`still playing at tick ${state.tick}`);
  return null;
}

// Normal-play arm: the CLI's path (balanced cosmology, first archetype), no dev seeding.
function cliArm(seed: number) {
  resetEventCounter(); resetReputationTraitInit(); resetDecisionCache();
  const runtime = createSimulationRuntime();
  const cosmology = createBalancedCosmology();
  const archetype = generateArchetypes(4, seed)[0];
  let { state } = initializeGameState(archetype, 'Test', cosmology, seed, 32, 24);
  const def: any = state.mandateDefinition;
  console.log(`\n## CLI seed ${seed} mandate="${def?.name}" kind=${def?.runtimeKind ?? 'legacy'} P0=${state.mandateState?.primaryCurrent} base=${def?.primaryBaseline}`);
  let last = -1;
  for (let i = 0; i < ticks; i++) {
    state = unattended(runTick(state, [], runtime));
    const p = state.mandateState?.progress ?? 0;
    if (i < 5 || Math.floor(p * 10) !== Math.floor(last * 10)) { console.log(`t${state.tick} progress=${p.toFixed(3)} P=${state.mandateState?.primaryCurrent?.toFixed(3)} phase=${state.phase}`); last = p; }
    if (state.phase !== 'playing') { console.log(`LEFT PLAYING at tick ${state.tick}`); return; }
  }
  console.log(`still playing at tick ${state.tick}`);
}

const mode = process.argv[4] ?? 'seeded';
for (const seed of seeds) { if (mode === 'cli') cliArm(seed); else { arm(seed, true); arm(seed, false); } }
