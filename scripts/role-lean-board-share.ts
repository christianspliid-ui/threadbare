/**
 * Role-lean board share — THR-2067 Done-when evidence (CLI / headless, THR-688 rule C).
 *
 * THR-2067 carried the trade's lean (`roleAffinityMultiplier`) onto the live decision
 * board as `roleAffinityPull`. The lean raises encounter scores for every
 * role-holding mortal, so the question is whether undertakings lose ground on the
 * board. This tallies every `decision_board_comparison` verdict by board family and
 * prints the undertaking share of non-idle verdicts, plus how many board winners
 * carried a role pull. Run once as shipped and once with `ROLE_AFFINITY_BOARD_WEIGHT`
 * set to 0 locally (the pre-THR-2067 board); the weight is printed from the import,
 * so the label cannot lie about the build.
 *
 * Usage:
 *   npm run measure:role-lean                        # seed 42 × 600 ticks, medium
 *   npm run measure:role-lean -- --seeds 42,99 --ticks 300
 */

import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits';
import { enableTracing, disableTracing, getTraces, clearTraces } from '../src/engine/traceBuffer';
import { ROLE_AFFINITY_BOARD_WEIGHT } from '../src/data/agent-behavior-constants';

const argv = process.argv.slice(2);
function arg(name: string): string | undefined {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}
const seeds = (arg('--seeds') ?? '42').split(',').map(Number);
const ticks = Number(arg('--ticks') ?? 600);
const map = (arg('--map') ?? 'medium') as MapSizePreset;

interface SeedResult {
  seed: number;
  families: Map<string, number>;
  verdicts: number;
  winnersWithPull: number;
}

function runSeed(seed: number): SeedResult {
  resetEventCounter();
  resetReputationTraitInit();
  enableTracing();
  const families = new Map<string, number>();
  let verdicts = 0;
  let winnersWithPull = 0;
  try {
    const runtime = createSimulationRuntime();
    const preset = MAP_SIZE_PRESETS[map];
    const archetype = generateArchetypes(4, seed)[0];
    let { state } = initializeGameState(archetype, 'RoleLean', createBalancedCosmology(), seed, preset.cols, preset.rows);
    for (let i = 0; i < ticks; i++) {
      clearTraces();
      state = runTick(state, [], runtime);
      for (const t of getTraces()) {
        const a = t as unknown as Record<string, unknown>;
        if (a.category !== 'decision_board_comparison') continue;
        verdicts++;
        const fam = String(a.boardFamily);
        families.set(fam, (families.get(fam) ?? 0) + 1);
        const top = (a.boardTop as Array<{ roleAffinityPull?: number }> | undefined)?.[0];
        if (top?.roleAffinityPull !== undefined) winnersWithPull++;
      }
    }
  } finally {
    disableTracing();
  }
  return { seed, families, verdicts, winnersWithPull };
}

console.log(`role-lean board share — ROLE_AFFINITY_BOARD_WEIGHT=${ROLE_AFFINITY_BOARD_WEIGHT}, ${ticks} ticks, ${map}`);
for (const seed of seeds) {
  const r = runSeed(seed);
  const idle = r.families.get('idle') ?? 0;
  const active = r.verdicts - idle;
  const undertaking = r.verdicts - idle - (r.families.get('encounter') ?? 0);
  const share = active > 0 ? (100 * undertaking) / active : NaN;
  const fams = [...r.families.entries()].sort((x, y) => y[1] - x[1]).map(([k, v]) => `${k}=${v}`).join(' ');
  console.log(`seed ${seed}: verdicts=${r.verdicts} ${fams}`);
  console.log(`  undertaking share of non-idle verdicts: ${share.toFixed(1)}%  (board winners carrying a role pull: ${r.winnersWithPull})`);
}
