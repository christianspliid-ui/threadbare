// THR-1668 — does a mortal who walks to an encounter start it when it gets there?
//
// Runs real worlds (initializeGameState → runTick, medium, unattended) and follows
// every encounter journey through the movement traces:
//
//   depart  — `phaseAgentDecision` queue_movement (carries the chosen encounterId)
//   arrive  — `phaseMovement` final step (carries movementState.targetEncounterId,
//             so a reroute's new target is what is measured, not the original)
//
// For each arrival that still names an encounter, the probe looks for a start of
// that template by that mortal within ARRIVAL_WINDOW ticks — a new unified action
// (`state.unifiedActions`, actorId + templateId) or a new branching encounter
// (`state.encounterProgress`, actorId + encounterId). What the mortal did instead is
// bucketed: started something else, departed elsewhere, or nothing in the window.
//
// Diagnosis carried alongside the headline share:
//   goal      — the first DECIDE after arrival: `journeyGoal: kept|dropped` (THR-1639)
//   boardGoal — the unified board's verdict on the committed goal (THR-1668): the
//               entry carrying `arrivalCommitment` won, or lost to which family
//   fate      — how each departure's walk ended: arrived on its target, arrived with
//               the target gone, rerouted (`agent_reroute` reason), or superseded
//   targetlessArrivalsByAgent — who arrives with no target, top 5 (one mortal looping
//               is a different defect from every journey leaking)
//
// Run (repo root):
//   npx esbuild Docs/audits/2026-09-25-living-world-data/readers/journeys.ts --bundle --platform=node --format=esm --outfile=.cache/journeys.mjs --external:fs --external:path && node .cache/journeys.mjs 42 200
// Set JOURNEYS_LIST=1 to include every judged arrival in the JSON.
import { initializeGameState, MAP_SIZE_PRESETS } from '../../../../src/engine/gameInit';
import { runTick, resetEventCounter } from '../../../../src/engine/orchestrator';
import { createBalancedCosmology } from '../../../../src/engine/cosmology';
import { generateArchetypes } from '../../../../src/engine/ascendant';
import { createSimulationRuntime } from '../../../../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../../../../src/engine/phaseReputationTraits';
import { enableTracing, getTraces, clearTraces } from '../../../../src/engine/traceBuffer';
import { getTimeline, clearTimelines } from '../../../../src/engine/encounterTimeline';

const seeds = (process.argv[2] ?? '42').split(',').map(Number);
const TICKS = Number(process.argv[3] ?? 200);
const ARRIVAL_WINDOW = 2;
const inc = (m: Record<string, number>, k: string, n = 1) => { m[k] = (m[k] ?? 0) + n; };
const isAnomaly = (id: string) => id.startsWith('encounter.anomaly.');

interface Arrival { agentId: string; templateId: string; tick: number; outcome?: string; startedInWindow?: string[] }

const out: any = {};
for (const seed of seeds) {
  resetEventCounter(); resetReputationTraitInit(); clearTraces(); enableTracing(); clearTimelines();
  const runtime: any = createSimulationRuntime();
  const preset = MAP_SIZE_PRESETS['medium'];
  const archetype = generateArchetypes(4, seed)[0];
  let { state } = initializeGameState(archetype, 'Reach', createBalancedCosmology(), seed, preset.cols, preset.rows) as any;

  const seenActions = new Set<string>();
  const seenProgress = new Set<string>();
  const starts = new Map<string, Array<{ tick: number; templateId: string }>>();
  const departs = new Map<string, number[]>();
  const arrivals: Arrival[] = [];
  const openJourney = new Map<string, { templateId: string; kind: string }>();
  const tally: Record<string, number> = {};
  const anomaly: Record<string, number> = {};
  const goal: Record<string, number> = {};
  const boardGoal: Record<string, number> = {};
  const fate: Record<string, number> = {};
  const targetless: Record<string, number> = {};

  const noteStart = (agentId: string, templateId: string, tick: number) => {
    if (!starts.has(agentId)) starts.set(agentId, []);
    starts.get(agentId)!.push({ tick, templateId });
  };
  for (const a of state.unifiedActions ?? []) seenActions.add(a.actionId);
  for (const p of state.encounterProgress ?? []) seenProgress.add(`${p.actorId}|${p.encounterId}|${p.startedTick}`);

  for (let t = 0; t < TICKS; t++) {
    state = runTick(state, [], runtime);
    const tick = state.tick;
    for (const tr of getTraces() as any[]) {
      if (tr.category === 'decision_board_comparison') {
        const g = (tr.boardTop ?? []).find((e: any) => e.arrivalCommitment !== undefined);
        if (g) inc(boardGoal, tr.boardTop[0]?.id === g.id ? 'goal_won_board' : `lost_to_${tr.boardTop[0]?.family}`);
        continue;
      }
      if (tr.category === 'agent_reroute') {
        const o = openJourney.get(tr.agentId);
        if (o) inc(fate, `${o.kind}:reroute_${tr.reason}`);
        continue;
      }
      if (tr.category !== 'movement') continue;
      const open = openJourney.get(tr.agentId);
      if (tr.event === 'depart' && tr.encounterId) {
        if (open) inc(fate, `${open.kind}:superseded_by_new_depart`);
        inc(tally, 'departs');
        if (isAnomaly(tr.encounterId)) inc(anomaly, 'departs');
        if (!departs.has(tr.agentId)) departs.set(tr.agentId, []);
        departs.get(tr.agentId)!.push(tr.tick);
        openJourney.set(tr.agentId, { templateId: tr.encounterId, kind: isAnomaly(tr.encounterId) ? 'anomaly' : 'other' });
      } else if (tr.event === 'reroute') {
        if (open) inc(fate, `${open.kind}:reroute_mid_path`);
      } else if (tr.event === 'arrive') {
        if (open) {
          inc(fate, `${open.kind}:${tr.encounterId === open.templateId ? 'arrived_on_target' : tr.encounterId ? 'arrived_other_target' : 'arrived_no_target'}`);
          if (!tr.encounterId) inc(targetless, tr.agentId);
          openJourney.delete(tr.agentId);
        }
        if (!tr.encounterId) { inc(tally, 'arrive_without_target'); continue; }
        arrivals.push({ agentId: tr.agentId, templateId: tr.encounterId, tick: tr.tick });
      }
    }
    clearTraces();
    for (const a of state.unifiedActions ?? []) {
      if (seenActions.has(a.actionId)) continue;
      seenActions.add(a.actionId);
      noteStart(a.actorId, a.templateId, a.startTick ?? tick);
    }
    for (const p of state.encounterProgress ?? []) {
      const k = `${p.actorId}|${p.encounterId}|${p.startedTick}`;
      if (seenProgress.has(k)) continue;
      seenProgress.add(k);
      noteStart(p.actorId, p.encounterId, p.startedTick ?? tick);
    }
  }

  // Only arrivals whose window has fully elapsed inside the run are judged.
  const judged = arrivals.filter(a => a.tick + ARRIVAL_WINDOW <= TICKS);
  for (const a of judged) {
    const inWindow = (starts.get(a.agentId) ?? []).filter(s => s.tick >= a.tick && s.tick <= a.tick + ARRIVAL_WINDOW);
    const departed = (departs.get(a.agentId) ?? []).some(d => d >= a.tick && d <= a.tick + ARRIVAL_WINDOW);
    a.startedInWindow = inWindow.map(s => s.templateId);
    if (inWindow.some(s => s.templateId === a.templateId)) a.outcome = 'started_target';
    else if (inWindow.length > 0) a.outcome = 'started_other';
    else if (departed) a.outcome = 'departed_elsewhere';
    else a.outcome = 'nothing';
    inc(tally, a.outcome);
    if (isAnomaly(a.templateId)) inc(anomaly, a.outcome);
    const decide = (getTimeline(a.agentId) as any[]).find(e => e.phase === 'DECIDE' && e.tick >= a.tick && e.tick <= a.tick + ARRIVAL_WINDOW);
    inc(goal, `${a.outcome}:${decide ? (decide.journeyGoal ?? 'no_goal_flag') : 'no_decide'}`);
  }
  const started = tally.started_target ?? 0;
  out[seed] = {
    ticks: TICKS,
    arrivalWindow: ARRIVAL_WINDOW,
    arrivalsJudged: judged.length,
    startedTargetShare: judged.length ? +(started / judged.length).toFixed(3) : null,
    tally,
    anomaly,
    goal,
    boardGoal,
    fate,
    targetlessArrivalsByAgent: Object.fromEntries(Object.entries(targetless).sort((x, y) => y[1] - x[1]).slice(0, 5)),
    ...(process.env.JOURNEYS_LIST ? { list: judged } : {}),
    firings: seenActions.size + seenProgress.size,
  };
  console.error(`[journeys] seed ${seed}: ${started}/${judged.length} arrivals started their target (${out[seed].startedTargetShare})`);
}
console.log(JSON.stringify(out, null, 2));
