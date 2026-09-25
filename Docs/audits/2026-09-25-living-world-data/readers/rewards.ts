import { initializeGameState, MAP_SIZE_PRESETS } from '../../../../src/engine/gameInit';
import { runTick, resetEventCounter } from '../../../../src/engine/orchestrator';
import { createBalancedCosmology } from '../../../../src/engine/cosmology';
import { generateArchetypes } from '../../../../src/engine/ascendant';
import { createSimulationRuntime } from '../../../../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../../../../src/engine/phaseReputationTraits';
const out: any = {};
for (const seed of [42, 99]) {
  resetEventCounter(); resetReputationTraitInit();
  const runtime = createSimulationRuntime(); const p = MAP_SIZE_PRESETS['medium'];
  let { state } = initializeGameState(generateArchetypes(4, seed)[0], 'R', createBalancedCosmology(), seed, p.cols, p.rows);
  const seen = new Map<string, string>();
  const scan = () => { for (const n of (state as any).graph.getAllNodes()) { if (n.properties?.source === 'encounter_reward' && !seen.has(n.id)) { const tid = String(n.properties.templateId ?? n.properties.rewardTemplateId ?? n.id.replace(/^reward_.*?_\d+_/, '')); const mm = /(reward_(?!.*reward_).*|trait\..*|anomaly_.*|starter_.*|companion\..*|agreement\..*)$/.exec(tid); seen.set(n.id, `${n.type}:${mm ? mm[1] : tid}`); } } };
  for (let i = 0; i < 200; i++) { state = runTick(state, [], runtime); if (i % 5 === 4) scan(); }
  scan();
  const m: Record<string, number> = {}; for (const v of seen.values()) m[v] = (m[v] ?? 0) + 1;
  const e = Object.entries(m).sort((a, b) => b[1] - a[1]); const T = e.reduce((a, b) => a + b[1], 0);
  out[seed] = { granted: T, distinct: e.length, top10share: e.slice(0, 10).reduce((a, b) => a + b[1], 0) / T, top: e.slice(0, 12) };
}
console.log(JSON.stringify(out, null, 1));
