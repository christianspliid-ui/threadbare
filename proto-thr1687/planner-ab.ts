// design-lane 2026-10-04a proto — never merged. Where do start_local decisions go under the hash order?
// Run: npx esbuild proto-thr1687/planner-ab.ts --bundle --platform=node --format=esm --outfile=proto-thr1687/planner-ab.mjs --external:fs --external:path
//      node proto-thr1687/planner-ab.mjs <walk|template_hash> 42,99 200
const ORDER = process.argv[2] ?? 'walk';
(globalThis as any).__CAP_LOCAL_ORDER = ORDER; (globalThis as any).__STACKS = {};
const seeds = (process.argv[3] ?? '42').split(',').map(Number);
const TICKS = Number(process.argv[4] ?? 200);

const { initializeGameState, MAP_SIZE_PRESETS } = await import('../src/engine/gameInit');
const { runTick, resetEventCounter } = await import('../src/engine/orchestrator');
const { createBalancedCosmology } = await import('../src/engine/cosmology');
const { generateArchetypes } = await import('../src/engine/ascendant');
const { createSimulationRuntime } = await import('../src/engine/simulationRuntime');
const { resetReputationTraitInit } = await import('../src/engine/phaseReputationTraits');
const { isAutonomousDecisionActor } = await import('../src/engine/strategicKindReachability');
const { CAP_FILL_LOCAL_ORDER } = await import('../src/data/agent-behavior-constants');
const { getUnifiedTemplateById } = await import('../src/data/unified-action-templates');

const out: any = { order: ORDER, constantSeen: CAP_FILL_LOCAL_ORDER, ticks: TICKS, seeds: {} };
for (const seed of seeds) {
  resetEventCounter(); resetReputationTraitInit();
  const runtime: any = createSimulationRuntime();
  const preset = (MAP_SIZE_PRESETS as any)['medium'];
  const archetype = generateArchetypes(4, seed)[0];
  let { state } = initializeGameState(archetype, 'Reach', createBalancedCosmology(), seed, preset.cols, preset.rows) as any;
  let deciderTicks = 0, busyDeciderTicks = 0, aliveStart = 0, aliveEnd = 0;
  const seenActions = new Set<string>();
  const actionLen: number[] = [];       // resolved durations (ticks from start to end) of agent actions
  const startTick: Record<string, number> = {};
  const outcomes: Record<string, number> = {}; const srcCount: Record<string, number> = {}; const matchCount: Record<string, number> = {}; const samples: any[] = [];
  const countAlive = () => state.graph.getNodesByType('actor').filter((n: any) => n.properties.actorType === 'individual' && !n.properties.isDead && n.properties.status !== 'dead').length;
  aliveStart = countAlive();
  for (let i = 1; i <= TICKS; i++) {
    state = runTick(state, [], runtime);
    const busy = new Set<string>();
    for (const a of state.unifiedActions ?? []) {
      if (a.status === 'active' || a.status === 'in_progress' || !a.status) busy.add(a.actorId);
      if (!seenActions.has(a.actionId)) { seenActions.add(a.actionId); startTick[a.actionId] = state.tick; const actor = state.graph.getNode(a.actorId); const dec = actor && isAutonomousDecisionActor(actor) ? 'decider' : (actor ? String(actor.properties.actorType) : 'none'); const k = (a.spawnedFromSeedId ? 'seeded' : String(a.source ?? '?')) + '|' + dec + '|' + String(a.templateId).split('.').slice(0,2).join('.'); srcCount[k] = (srcCount[k] ?? 0) + 1; const ld = runtime.balanceTelemetry.latestEncounterDecisionByAgent.get(a.actorId); const m = !ld ? 'noDecisionEver' : (ld.tick === state.tick ? (ld.templateId === a.templateId ? 'sameTickMatch' : 'sameTickOther:' + ld.decisionType) : 'stale:' + ld.decisionType + ':' + (ld.templateId === a.templateId ? 'sameTpl' : 'otherTpl')); const fam = /encounter.town|reputation./.test(a.templateId) ? 'townrep' : 'other'; matchCount[fam + '|' + m] = (matchCount[fam + '|' + m] ?? 0) + 1; if (m.startsWith('stale') && fam==='townrep' && samples.length < 3) samples.push({ tick: state.tick, ld: { tick: ld.tick, t: ld.templateId, d: ld.decisionType }, a: Object.fromEntries(Object.entries(a).filter(([kk,v]) => typeof v !== 'object' || v === null)) }); }
    }
    for (const id of Object.keys(startTick)) {
      if (!(state.unifiedActions ?? []).some((a: any) => a.actionId === id)) { actionLen.push(state.tick - startTick[id]); delete startTick[id]; }
    }
    for (const n of state.graph.getNodesByType('actor')) {
      const p: any = n.properties;
      if (p.actorType !== 'individual' || p.isDead || p.status === 'dead') continue;
      if (!isAutonomousDecisionActor(n)) continue;
      deciderTicks++;
      if (busy.has(n.id)) busyDeciderTicks++;
    }
  }
  aliveEnd = countAlive();
  const c = runtime.balanceTelemetry.counters;
  const totalDecisions = Object.values(c.encounterDecisionCounts as Record<string, number>).reduce((s, v) => s + v, 0);
  // which templates were started locally, by step count
  const steps: Record<string, number> = {};
  for (const [tid, st] of Object.entries(c.decisionTemplateStats as Record<string, any>)) {
    const t: any = getUnifiedTemplateById(tid);
    const k = String(t?.steps?.length ?? '?');
    steps[k] = (steps[k] ?? 0) + st.startLocal;
  }
  actionLen.sort((a, b) => a - b);
  out.seeds[seed] = {
    totalDecisions,
    decisionCounts: c.encounterDecisionCounts,
    idleReasons: c.idleReasonCounts,
    actionsAttempted: c.totalActionsAttempted, actionsCompleted: c.totalActionsCompleted,
    stepsAttempted: c.totalStepsAttempted, stepsSucceeded: c.totalStepsSucceeded,
    deciderTicks, busyDeciderTicks, busyShare: +(busyDeciderTicks / Math.max(1, deciderTicks)).toFixed(3),
    aliveStart, aliveEnd,
    actionLenMedian: actionLen[Math.floor(actionLen.length / 2)] ?? null,
    actionLenMean: +(actionLen.reduce((s, v) => s + v, 0) / Math.max(1, actionLen.length)).toFixed(2),
    actionsEnded: actionLen.length,
    startLocalByStepCount: steps, matchCount, samples,
  };
}
out.stacks = (globalThis as any).__STACKS; console.log(JSON.stringify(out, null, 1));
