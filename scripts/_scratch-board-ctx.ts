// Scratch on/off measurement for the THR-2071 design pass — never committed.
import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits';
import { enableTracing, disableTracing, getTraces, clearTraces } from '../src/engine/traceBuffer';

const argv = process.argv.slice(2);
const arg = (n: string) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
const seeds = (arg('--seeds') ?? '42,99,7').split(',').map(Number);
const ticks = Number(arg('--ticks') ?? 240);
const map = (arg('--map') ?? 'medium') as MapSizePreset;

let verdicts = 0, idle = 0, enc = 0, und = 0, encWithCtxOnShortlist = 0, winnerCtxPos = 0, winnerCtxNeg = 0, pullCapped = 0;
const winnerPulls: number[] = [];
const T=["econ","trait","rep","res","chain","intel","fac"]; const mixed:Record<string,number>={}, won:Record<string,number>={}, base:Record<string,number>={}; for(const k of T){mixed[k]=0;won[k]=0;base[k]=0;}
let festivalBoom = 0, festivalWins = 0;
for (const seed of seeds) {
  resetEventCounter(); resetReputationTraitInit(); enableTracing();
  const runtime = createSimulationRuntime();
  const preset = MAP_SIZE_PRESETS[map];
  const archetype = generateArchetypes(4, seed)[0];
  let { state } = initializeGameState(archetype, 'Scratch', createBalancedCosmology(), seed, preset.cols, preset.rows);
  for (let i = 0; i < ticks; i++) {
    clearTraces();
    state = runTick(state, [], runtime);
    for (const t of getTraces()) {
      const a = t as unknown as Record<string, any>;
      if (a.category !== 'decision_board_comparison') continue;
      verdicts++;
      const fam = String(a.boardFamily);
      if (fam === 'idle') { idle++; continue; }
      if (fam !== 'encounter') { und++; continue; }
      enc++;
      const top = (a.boardTop as any[]) ?? [];
      const encs = top.filter((e) => e.family === 'encounter');
      if (encs.some((e) => (e.__ctx ?? 0) > 0)) {
        encWithCtxOnShortlist++;
        if ((top[0]?.__ctx ?? 0) > 0) winnerCtxPos++;
      }
      if ((top[0]?.__ctx ?? 0) < 0) winnerCtxNeg++;
      if (top[0]?.__pull !== undefined) { winnerPulls.push(top[0].__pull); if (top[0].__pull >= 2 || top[0].__pull <= 0.5) pullCapped++; }
      for (const k of T) { const has = encs.filter((e) => (e.__terms?.[k] ?? 0) > 0).length; if (has > 0 && has < encs.length) { mixed[k]++; base[k] += has / encs.length; if ((top[0]?.__terms?.[k] ?? 0) > 0) won[k]++; } }
      if (encs.some((e) => e.id === 'encounter.market_day_festival')) { festivalBoom++; if (top[0]?.id === 'encounter.market_day_festival') festivalWins++; }
    }
  }
  disableTracing();
}
const q = (a: number[], p: number) => { if (!a.length) return NaN; const s = [...a].sort((x, y) => x - y); return s[Math.floor(p * (s.length - 1))]; };
console.log(`CTXW=${process.env.CTXW ?? 0} seeds ${seeds.join(',')} x ${ticks} ${map}`);
console.log(`verdicts=${verdicts} idle=${idle} encounter=${enc} undertaking=${und} undertakingShareNonIdle=${(100 * und / (enc + und)).toFixed(2)}%`);
console.log(`encounter verdicts with a positive-context candidate on the board: ${encWithCtxOnShortlist}; winner carried positive context: ${winnerCtxPos} (${(100 * winnerCtxPos / encWithCtxOnShortlist).toFixed(1)}%)`);
console.log(`winner with negative context: ${winnerCtxNeg}; winner pull p50=${q(winnerPulls, .5).toFixed(3)} p90=${q(winnerPulls, .9).toFixed(3)} capped=${pullCapped}`);
for (const k of T) console.log(`${k}: mixed boards ${mixed[k]}, winner carries it ${(100*won[k]/mixed[k]).toFixed(1)}% vs its share of the board ${(100*base[k]/mixed[k]).toFixed(1)}%`);
console.log(`market_day_festival on board ${festivalBoom}, won ${festivalWins}`);
