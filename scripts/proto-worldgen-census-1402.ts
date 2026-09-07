/**
 * PROTO THR-1402 — what worldgen mints of each undertaking kind, and who owns it.
 * Counts every registry kind at tick 0 and after N ticks: objects, objects with any
 * owner, objects owned by a deciding mortal, objects owned by any individual.
 */
import { writeFileSync } from 'fs';
import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits';
import { isAutonomousDecisionActor } from '../src/engine/strategicKindReachability';
import { UNDERTAKING_OBJECT_TYPES, enumerateObjectHandles, resolveObjectOwners } from '../src/data/undertaking-objects';
import type { GameState } from '../src/types/gameState';

function parseArgs() {
  const a = process.argv.slice(2);
  const get = (k: string, d: string) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d; };
  return { seeds: get('--seeds', '42,99').split(',').map(Number), ticks: Number(get('--ticks', '150')), map: get('--map', 'medium') as MapSizePreset, out: get('--out', 'proto-worldgen.json') };
}

function snapshot(state: GameState) {
  const g = state.graph;
  const deciding = new Set(g.getNodesByType('actor').filter(isAutonomousDecisionActor).map(n => n.id));
  const individuals = new Set(g.getNodesByType('actor').filter(n => (n.properties as Record<string, unknown>).actorType === 'individual').map(n => n.id));
  const rows: Record<string, { objects: number; owned: number; ownedByDeciding: number; ownedByIndividual: number; sampleOwners: string[] }> = {};
  for (const type of UNDERTAKING_OBJECT_TYPES) {
    const handles = enumerateObjectHandles(g, type);
    const row = { objects: handles.length, owned: 0, ownedByDeciding: 0, ownedByIndividual: 0, sampleOwners: [] as string[] };
    for (const h of handles) {
      const owners = resolveObjectOwners(g, type, h);
      if (owners.length > 0) row.owned += 1;
      if (owners.some(o => deciding.has(o))) row.ownedByDeciding += 1;
      if (owners.some(o => individuals.has(o))) row.ownedByIndividual += 1;
      for (const o of owners) { const p = o.split(/[_.]/)[0]; if (!row.sampleOwners.includes(p)) row.sampleOwners.push(p); }
    }
    rows[type.id] = row;
  }
  const nodeTypes: Record<string, number> = {};
  for (const n of g.getAllNodes()) nodeTypes[n.type] = (nodeTypes[n.type] ?? 0) + 1;
  return { tick: state.tick, deciding: deciding.size, individuals: individuals.size, rows, nodeTypes };
}

const args = parseArgs();
const out = args.seeds.map(seed => {
  resetEventCounter(); resetReputationTraitInit();
  const runtime = createSimulationRuntime();
  const preset = MAP_SIZE_PRESETS[args.map];
  const archetype = generateArchetypes(4, seed)[0];
  let { state } = initializeGameState(archetype, 'Census', createBalancedCosmology(), seed, preset.cols, preset.rows);
  const t0 = snapshot(state);
  for (let i = 0; i < args.ticks; i++) state = runTick(state, [], runtime);
  const tN = snapshot(state);
  console.log(`seed ${seed}: tick0 vs tick${args.ticks}`);
  for (const id of Object.keys(t0.rows)) {
    const a = t0.rows[id], b = tN.rows[id];
    console.log(`  ${id.padEnd(10)} objects ${String(a.objects).padStart(4)} → ${String(b.objects).padStart(4)} | owned ${String(a.owned).padStart(4)} → ${String(b.owned).padStart(4)} | by individual ${String(a.ownedByIndividual).padStart(3)} → ${String(b.ownedByIndividual).padStart(3)} | by deciding ${String(a.ownedByDeciding).padStart(3)} → ${String(b.ownedByDeciding).padStart(3)} | owners: ${b.sampleOwners.join(',') || '-'}`);
  }
  console.log(`  deciding ${t0.deciding} → ${tN.deciding}; individuals ${t0.individuals} → ${tN.individuals}`);
  return { seed, t0, tN };
});
writeFileSync(args.out, JSON.stringify(out, null, 2));
