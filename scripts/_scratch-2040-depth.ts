/** PROTO (THR-2040) — never merged. hungerDays and glut depth on hungry / glutted town-days. */
import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits';
import { isHungryToday } from '../src/engine/unrestPressure/hunger';
const SETTLE = ['hamlet', 'town', 'city', 'capital'];
const hd: number[] = []; const gd: number[] = []; let hungrySrc: Record<string, number> = {};
for (const seed of [42, 99, 7]) {
  resetEventCounter(); resetReputationTraitInit();
  const runtime = createSimulationRuntime(); const preset = MAP_SIZE_PRESETS.medium;
  let { state } = initializeGameState(generateArchetypes(4, seed)[0], 'Depth', createBalancedCosmology(), seed, preset.cols, preset.rows);
  for (let t = 1; t <= 360; t++) {
    state = runTick(state, [], runtime);
    for (const n of state.graph.getNodesByType('location')) {
      if (!SETTLE.includes(n.properties.locationSubtype as string)) continue;
      const h = isHungryToday(n); const p = n.properties;
      if (h.hungry) { hd.push(Number(p.hungerDays) || 0); hungrySrc[h.source ?? 'none'] = (hungrySrc[h.source ?? 'none'] ?? 0) + 1; }
      else if ((Number(p.foodSurplusDays) || 0) >= 3 && (Number(p.foodBalance) || 0) >= 0.75) gd.push(((Number(p.foodBalance) || 0) - 0.75) / 0.25);
    }
  }
}
const q = (a: number[], f: number) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(f * (s.length - 1))] ?? 0; };
console.log('hungry town-days', hd.length, 'sources', JSON.stringify(hungrySrc), 'hungerDays p25/p50/p75/p90', q(hd, .25), q(hd, .5), q(hd, .75), q(hd, .9));
console.log('famine depth (min(1,max(1,d)/5)) mean', (hd.reduce((a, d) => a + Math.min(1, Math.max(1, d) / 5), 0) / Math.max(1, hd.length)).toFixed(2));
console.log('glut town-days', gd.length, 'glut depth p25/p50/p75/p90', q(gd, .25).toFixed(2), q(gd, .5).toFixed(2), q(gd, .75).toFixed(2), q(gd, .9).toFixed(2));
