// THR-1687 D4 guard rail (readers/flip-guard.ts; build with readers/flip-guard.build.mjs) (Done-when 9, 10): honest start_local + planner-begun encounters, and
// strategic board wins, under whichever CAP_FILL_LOCAL_ORDER this bundle was built with.
// Run (repo root): node Docs/audits/2026-09-25-living-world-data/readers/flip-guard.build.mjs
//   then: node .cache/flip-guard-walk.mjs 42 200 ; node .cache/flip-guard-hash.mjs 42 200 (one process per arm per seed)
// Planner-begun = new non-seeded encounter./reputation. actions by an autonomous decider; strategic board share =
// live `decision_board_comparison` traces won by `strategic_action` ÷ those with an undertaking candidate present.
import { initializeGameState, MAP_SIZE_PRESETS } from '../../../../src/engine/gameInit';
import { runTick, resetEventCounter } from '../../../../src/engine/orchestrator';
import { createBalancedCosmology } from '../../../../src/engine/cosmology';
import { generateArchetypes } from '../../../../src/engine/ascendant';
import { createSimulationRuntime } from '../../../../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../../../../src/engine/phaseReputationTraits';
import { isAutonomousDecisionActor } from '../../../../src/engine/strategicKindReachability';
import { CAP_FILL_LOCAL_ORDER } from '../../../../src/data/agent-behavior-constants';
import { enableTracing, getTraces, clearTraces } from '../../../../src/engine/traceBuffer';

const seed = Number(process.argv[2] ?? 42);
const TICKS = Number(process.argv[3] ?? 200);
enableTracing();
resetEventCounter(); resetReputationTraitInit();
const runtime: any = createSimulationRuntime();
const preset = (MAP_SIZE_PRESETS as any)['medium'];
const archetype = generateArchetypes(4, seed)[0];
let { state } = initializeGameState(archetype, 'Reach', createBalancedCosmology(), seed, preset.cols, preset.rows) as any;
const seen = new Set<string>();
let plannerBegun = 0, seeded = 0, townRep = 0;
let contestsWithStrategic = 0, strategicWon = 0, contestsWithout = 0;
const t0 = Date.now();
for (let i = 1; i <= TICKS; i++) {
  clearTraces();
  state = runTick(state, [], runtime);
  for (const tr of getTraces() as any[]) {
    if (tr.category !== 'decision_board_comparison' || tr.mode !== 'live') continue;
    if (tr.undertakingCandidates > 0) { contestsWithStrategic++; if (tr.boardFamily === 'strategic_action') strategicWon++; }
    else contestsWithout++;
  }
  for (const a of state.unifiedActions ?? []) {
    if (seen.has(a.actionId)) continue;
    seen.add(a.actionId);
    if (a.spawnedFromSeedId) { seeded++; continue; }
    const actor = state.graph.getNode(a.actorId);
    if (!actor || !isAutonomousDecisionActor(actor)) continue;
    if (!String(a.templateId).startsWith('encounter.') && !String(a.templateId).startsWith('reputation.')) continue;
    plannerBegun++;
    if (/^(encounter\.town|reputation\.)/.test(a.templateId)) townRep++;
  }
}
const c = runtime.balanceTelemetry.counters;
console.log(JSON.stringify({
  order: CAP_FILL_LOCAL_ORDER, seed, ticks: TICKS, ms: Date.now() - t0,
  decisionCounts: c.encounterDecisionCounts,
  plannerBegunEncounters: plannerBegun, townRepBegun: townRep, seededActions: seeded,
  actionsAttempted: c.totalActionsAttempted,
  board: { contestsWithStrategic, strategicWon, share: +(strategicWon / Math.max(1, contestsWithStrategic)).toFixed(3), contestsWithout },
}));
