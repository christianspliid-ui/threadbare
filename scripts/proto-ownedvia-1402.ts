/** PROTO THR-1402 — per kind: the edges the registry reads ownership through vs the edges the seeded world holds. */
import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits';
import { UNDERTAKING_OBJECT_TYPES, enumerateObjectHandles } from '../src/data/undertaking-objects';
import type { GameState } from '../src/types/gameState';

const seed = Number(process.argv[2] ?? 42); const ticks = Number(process.argv[3] ?? 150);
resetEventCounter(); resetReputationTraitInit();
const runtime = createSimulationRuntime(); const preset = MAP_SIZE_PRESETS.medium;
let { state } = initializeGameState(generateArchetypes(4, seed)[0], 'Census', createBalancedCosmology(), seed, preset.cols, preset.rows);

function report(s: GameState, label: string) {
  const g = s.graph;
  const edgeCounts: Record<string, number> = {};
  for (const e of g.getAllEdges()) edgeCounts[e.type] = (edgeCounts[e.type] ?? 0) + 1;
  console.log(`\n== ${label} (seed ${seed}) — edge types in the world: ${Object.keys(edgeCounts).length}`);
  for (const type of UNDERTAKING_OBJECT_TYPES) {
    const n = enumerateObjectHandles(g, type).length;
    const via = (type.ownedVia as readonly string[]).map(v => `${v}=${edgeCounts[v] ?? 0}`).join(' ');
    // Which edge types actually touch an object of this kind (incoming or outgoing), top 6.
    const touching: Record<string, number> = {};
    for (const h of enumerateObjectHandles(g, type).slice(0, 400)) {
      if (h.kind !== 'node') continue;
      for (const e of [...g.getIncomingEdges(h.nodeId), ...g.getOutgoingEdges(h.nodeId)]) touching[e.type] = (touching[e.type] ?? 0) + 1;
    }
    const top = Object.entries(touching).sort((a, b) => b[1] - a[1]).slice(0, 7).map(([k, v]) => `${k}:${v}`).join(' ');
    console.log(`  ${type.id.padEnd(10)} n=${String(n).padStart(4)}  ownedVia[${via}]  edges touching (first 400 objects): ${top || '-'}`);
  }
}
report(state, 'tick 0');
for (let i = 0; i < ticks; i++) state = runTick(state, [], runtime);
report(state, `tick ${ticks}`);
