// Scratch measurement for the THR-2071 design pass — never committed.
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

const ADD = ['factionBoost', 'reputationBonus', 'economicContextBonus', 'locationTraitBonus', 'resonance', 'globalResonance',
  'explorationBonus', 'chainBonus', 'ruinsBonus', 'anomaly', 'attractionBonus', 'convergenceBonus', 'hunchBonus',
  'identityBiasBonus', 'markRevealBonus', 'intelBonus', 'appointmentBonus'];
const vals: Record<string, number[]> = Object.fromEntries(ADD.map((k) => [k, []]));
const ratios: Record<string, number[]> = Object.fromEntries(ADD.map((k) => [k, []]));
const bases: number[] = [];
let cands = 0, scorings = 0, boardEnc = 0, boardDisagree = 0, disagreeCtxTop1 = 0;
const flips: Record<string, number> = Object.fromEntries(ADD.map((k) => [k, 0]));

for (const seed of seeds) {
  resetEventCounter(); resetReputationTraitInit(); enableTracing();
  const runtime = createSimulationRuntime();
  const preset = MAP_SIZE_PRESETS[map];
  const archetype = generateArchetypes(4, seed)[0];
  let { state } = initializeGameState(archetype, 'Scratch', createBalancedCosmology(), seed, preset.cols, preset.rows);
  for (let i = 0; i < ticks; i++) {
    clearTraces();
    state = runTick(state, [], runtime);
    const lastScoring = new Map<string, Array<Record<string, number> & { templateId: string }>>();
    for (const t of getTraces()) {
      const a = t as unknown as Record<string, any>;
      if (a.category === 'encounter_scoring') {
        scorings++;
        const top = (a.topCandidates ?? []).map((c: any) => {
          const r = c.__raw ?? {};
          const row: any = { templateId: c.templateId, finalScore: c.finalScore };
          const base = r.valuePerTick * r.desireMultiplier;
          row.base = base;
          for (const k of ADD) row[k] = k === 'factionBoost' ? (r.__factionBoost ?? 0) : k === 'anomaly' ? (r.anomalyBonus ?? 0) : (r[k] ?? 0);
          return row;
        });
        lastScoring.set(a.agentId, top);
        for (const row of top) {
          cands++; bases.push(row.base);
          for (const k of ADD) { if (row[k] !== 0 && Number.isFinite(row[k])) { vals[k].push(row[k]); if (row.base > 0) ratios[k].push(Math.abs(row[k]) / row.base); } }
        }
      } else if (a.category === 'decision_board_comparison') {
        const top = lastScoring.get(a.agentId);
        if (!top || top.length === 0 || a.boardFamily !== 'encounter') continue;
        boardEnc++;
        const winner = (a.boardTop as any[])?.[0]?.id;
        if (winner && winner !== top[0].templateId) {
          boardDisagree++;
          // Was finalScore's top1 ahead of the board winner because of an additive term?
          const w = top.find((r) => r.templateId === winner);
          if (w) {
            let any = false;
            for (const k of ADD) if ((top[0][k] - w[k]) > 0 && (top[0].finalScore - w.finalScore) < (top[0][k] - w[k]) * 1.0) { flips[k]++; any = true; }
            if (any) disagreeCtxTop1++;
          }
        }
      }
    }
  }
  disableTracing();
}
const q = (a: number[], p: number) => { if (!a.length) return NaN; const s = [...a].sort((x, y) => x - y); return s[Math.floor(p * (s.length - 1))]; };
console.log(`seeds ${seeds.join(',')} x ${ticks} ticks ${map}: scorings=${scorings} top5 candidates=${cands}`);
console.log(`base (valuePerTick x desire): p25=${q(bases, .25).toFixed(3)} median=${q(bases, .5).toFixed(3)} p75=${q(bases, .75).toFixed(3)}`);
console.log(`board encounter verdicts=${boardEnc}, board winner != finalScore top1: ${boardDisagree} (${(100 * boardDisagree / boardEnc).toFixed(1)}%), of which an additive term alone would have kept top1 ahead: ${disagreeCtxTop1}`);
console.log('term | nonzero in top5 | median |v| | p90 |v| | median |v|/base | flips');
for (const k of ADD) {
  const v = vals[k].map(Math.abs);
  console.log(`${k} | ${(100 * vals[k].length / cands).toFixed(1)}% | ${q(v, .5).toFixed(3)} | ${q(v, .9).toFixed(3)} | ${q(ratios[k], .5).toFixed(2)} | ${flips[k]}`);
}
