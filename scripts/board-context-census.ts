/**
 * Board-context census — THR-2071 Done-when evidence (CLI / headless, THR-688 rule C).
 *
 * THR-2071 carried the scorer's context terms (boom/bust, place traits, resonance,
 * reputation, faction, chain next-step, intel) onto the live decision board as one
 * capped `contextPull`. This tallies every `decision_board_comparison` verdict and
 * prints, pooled over the seeds:
 *   - the undertaking share of non-idle verdicts (kill criterion: moves ≤ 1 point);
 *   - for each term, on boards where some encounters carry it and some do not, how
 *     often the winner carries it against its share of the board (kill criterion: the
 *     economic term's winner share must rise above its board share by more than at
 *     weight 0);
 *   - the winner pull's spread and how many winners sit at the clamp.
 * Run once as shipped and once with `BOARD_CONTEXT_WEIGHT` set to 0 locally (the
 * pre-THR-2071 board). The weight is printed from the import, so the label cannot lie
 * about the build. `contextTerms` rides the trace at weight 0 too, so both arms see
 * the terms.
 *
 * Pool the seeds: per-seed counts of a few firings are noise (THR-2071 ticket).
 *
 * Usage:
 *   npm run census:board-context                         # seeds 42,99,7 × 240 ticks, medium
 *   npm run census:board-context -- --seeds 42 --ticks 120
 */

import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits';
import { enableTracing, disableTracing, getTraces, clearTraces } from '../src/engine/traceBuffer';
import {
  BOARD_CONTEXT_PULL_MAX,
  BOARD_CONTEXT_PULL_MIN,
  BOARD_CONTEXT_WEIGHT,
} from '../src/data/agent-behavior-constants';
import type { BoardContextTerm } from '../src/types/trace';

const argv = process.argv.slice(2);
function arg(name: string): string | undefined {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}
const seeds = (arg('--seeds') ?? '42,99,7').split(',').map(Number);
const ticks = Number(arg('--ticks') ?? 240);
const map = (arg('--map') ?? 'medium') as MapSizePreset;

const TERMS: readonly BoardContextTerm[] = [
  'economic', 'locationTrait', 'resonance', 'globalResonance',
  'reputation', 'faction', 'chain', 'intel',
];

interface TopEntry {
  family?: string;
  id?: string;
  contextPull?: number;
  contextTerms?: Partial<Record<BoardContextTerm, number>>;
}

let verdicts = 0;
let idle = 0;
let encounters = 0;
let undertakings = 0;
let capped = 0;
const winnerPulls: number[] = [];
const mixed: Record<string, number> = {};
const won: Record<string, number> = {};
const share: Record<string, number> = {};
for (const k of TERMS) { mixed[k] = 0; won[k] = 0; share[k] = 0; }

function carries(e: TopEntry | undefined, k: BoardContextTerm): boolean {
  return (e?.contextTerms?.[k] ?? 0) > 0;
}

for (const seed of seeds) {
  resetEventCounter();
  resetReputationTraitInit();
  enableTracing();
  try {
    const runtime = createSimulationRuntime();
    const preset = MAP_SIZE_PRESETS[map];
    const archetype = generateArchetypes(4, seed)[0];
    let { state } = initializeGameState(archetype, 'BoardContext', createBalancedCosmology(), seed, preset.cols, preset.rows);
    for (let i = 0; i < ticks; i++) {
      clearTraces();
      state = runTick(state, [], runtime);
      for (const t of getTraces()) {
        const a = t as unknown as Record<string, unknown>;
        if (a.category !== 'decision_board_comparison') continue;
        verdicts++;
        const fam = String(a.boardFamily);
        if (fam === 'idle') { idle++; continue; }
        if (fam !== 'encounter') { undertakings++; continue; }
        encounters++;
        const top = (a.boardTop as TopEntry[] | undefined) ?? [];
        const winner = top[0];
        const pull = winner?.contextPull ?? 1;
        winnerPulls.push(pull);
        if (pull >= BOARD_CONTEXT_PULL_MAX || pull <= BOARD_CONTEXT_PULL_MIN) capped++;
        const encs = top.filter(e => e.family === 'encounter');
        for (const k of TERMS) {
          const has = encs.filter(e => carries(e, k)).length;
          if (has === 0 || has === encs.length) continue;
          mixed[k]++;
          share[k] += has / encs.length;
          if (carries(winner, k)) won[k]++;
        }
      }
    }
  } finally {
    disableTracing();
  }
}

const pct = (n: number, d: number) => (d > 0 ? `${(100 * n / d).toFixed(1)}%` : 'n/a');
const quantile = (xs: number[], p: number) => {
  if (xs.length === 0) return Number.NaN;
  const s = [...xs].sort((x, y) => x - y);
  return s[Math.floor(p * (s.length - 1))];
};

console.log(`BOARD_CONTEXT_WEIGHT=${BOARD_CONTEXT_WEIGHT} (clamp ${BOARD_CONTEXT_PULL_MIN}–${BOARD_CONTEXT_PULL_MAX}) · seeds ${seeds.join(',')} × ${ticks} ticks · ${map} (pooled)`);
console.log(`verdicts=${verdicts} idle=${idle} encounter=${encounters} undertaking=${undertakings} undertakingShareNonIdle=${pct(undertakings, encounters + undertakings)}`);
console.log(`winner pull p50=${quantile(winnerPulls, 0.5).toFixed(3)} p90=${quantile(winnerPulls, 0.9).toFixed(3)} at clamp=${capped} of ${winnerPulls.length}`);
for (const k of TERMS) {
  console.log(`${k.padEnd(16)} mixed boards ${String(mixed[k]).padStart(5)} · winner carries it ${pct(won[k], mixed[k]).padStart(6)} vs board share ${pct(share[k], mixed[k]).padStart(6)}`);
}
