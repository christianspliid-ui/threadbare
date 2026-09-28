// THR-1653 — the S3 gate: does graduation into the deciding tier hold the attention budget?
//
// Runs the reach.ts world (unattended, balanced cosmology, medium) for each seed and
// reports, at t0 and at the end: living deciders (`isAutonomousDecisionActor`, not
// deceased), the THR-1348 invariant's right-hand side (t0 deciders + overflow allowance
// + threaded + pulled), and the spotlight ledger split by door (ambition vs graduation),
// with graduation refusals by reason. Also ms/tick, so a flag-on and flag-off bundle can
// be compared in one session.
//
// Usage (repo root):
//   npx esbuild Docs/audits/2026-09-25-living-world-data/readers/graduation-budget.ts --bundle --platform=node --format=esm --outfile=.cache/grad.mjs --external:fs --external:path
//   node .cache/grad.mjs 42,99 200
import { initializeGameState, MAP_SIZE_PRESETS } from '../../../../src/engine/gameInit';
import { runTick, resetEventCounter } from '../../../../src/engine/orchestrator';
import { createBalancedCosmology } from '../../../../src/engine/cosmology';
import { generateArchetypes } from '../../../../src/engine/ascendant';
import { createSimulationRuntime } from '../../../../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../../../../src/engine/phaseReputationTraits';
import { isAutonomousDecisionActor } from '../../../../src/engine/decisionTier';
import { readSpotlightLedger, overflowAllowance } from '../../../../src/engine/spotlightPull';
import { NOTABLE_GRADUATION_BUDGETED } from '../../../../src/data/agent-behavior-constants';

const seeds = (process.argv[2] ?? '42,99').split(',').map(Number);
const TICKS = Number(process.argv[3] ?? 200);

function census(state: any) {
  const actors = state.graph.getNodesByType('actor');
  const deciders = actors.filter((n: any) => isAutonomousDecisionActor(n) && n.properties.deceased !== true);
  const threaded = deciders.filter((n: any) =>
    state.graph.getIncomingEdges(n.id, 'thread').some((e: any) => e.properties?.courtPosition !== 'dormant')).length;
  const notables = actors.filter((n: any) => n.properties.spotlightTier === 'notable').length;
  const ledger = readSpotlightLedger(state.graph);
  return { deciders: deciders.length, threaded, notables, ledger, allowance: overflowAllowance(state.graph) };
}

const out: any = { budgeted: NOTABLE_GRADUATION_BUDGETED, ticks: TICKS, seeds: {} };
for (const seed of seeds) {
  resetEventCounter(); resetReputationTraitInit();
  const runtime: any = createSimulationRuntime();
  const preset = MAP_SIZE_PRESETS['medium'];
  const archetype = generateArchetypes(4, seed)[0];
  let { state } = initializeGameState(archetype, 'Grad', createBalancedCosmology(), seed, preset.cols, preset.rows) as any;
  const t0 = census(state);
  const deciderCurve: number[] = [t0.deciders];
  let graduatedEvents = 0;
  const start = Date.now();
  for (let i = 1; i <= TICKS; i++) {
    state = runTick(state, [], runtime);
    graduatedEvents += (state.tickEvents ?? []).filter((e: any) => e.type === 'npc_graduated' && e.toTier === 'spotlight').length;
    if (i % 25 === 0) deciderCurve.push(census(state).deciders);
  }
  const msPerTick = (Date.now() - start) / TICKS;
  const tN = census(state);
  const pulledNow = tN.ledger.pulled.length;
  const bound = t0.deciders + tN.allowance + tN.threaded + pulledNow;
  const byDoor = (via: string) => tN.ledger.pulled.filter((p: any) => p.reason === via).length;
  const gradRefused: Record<string, number> = {};
  for (const r of tN.ledger.refused) if (r.via === 'graduation') gradRefused[r.reason] = (gradRefused[r.reason] ?? 0) + 1;
  out.seeds[seed] = {
    t0Deciders: t0.deciders, tNDeciders: tN.deciders, deciderCurveEvery25: deciderCurve,
    invariant: { bound, holds: tN.deciders <= bound, allowance: tN.allowance, threaded: tN.threaded, pulled: pulledNow },
    notablesT0: t0.notables, notablesTN: tN.notables,
    admissions: { ambition: byDoor('ambition'), graduation: byDoor('graduation') },
    graduationEventsToSpotlight: graduatedEvents,
    graduationRefusedStillOut: gradRefused,
    overflow: tN.ledger.overflow,
    msPerTick: Math.round(msPerTick * 10) / 10,
  };
}
console.log(JSON.stringify(out, null, 1));
