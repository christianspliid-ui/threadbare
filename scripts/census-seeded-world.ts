/**
 * THR-1437 — the instrument for its Done-when: what the starting world holds.
 *
 * Ported from the THR-1402 prototype (`tfws-census-1402/scripts/proto-worldgen-census-1402.ts`).
 * Builds a world per seed, snapshots at tick 0 and after N ticks, and reports per
 * undertaking object type: objects, owned, owned by an individual, owned by a deciding
 * mortal. Extends the prototype's snapshot with the counts THR-1437's `seedLivingWorld`
 * passes are measured on: `spotlightMortals` (protagonists — actor nodes with
 * `actorType: 'individual'` and `spotlightTier: 'spotlight'`), `routeIdentityNodes`
 * (Location nodes carrying the trade-route identity subtype, `ROUTE_IDENTITY_SUBTYPE`),
 * `armies` (group-family actor nodes whose `getGroupKind` reads `'army'`), and raw edge
 * counts for `owns` · `possesses` · `hostile_to` · `knows_secret_of` · `trades_with` ·
 * `commanded_by` — the edges the trade phases, the motive gate, the holding income pass
 * and army supply all read on tick 1 and worldgen wrote none of before THR-1437.
 *
 * Prints a markdown table per seed (kind | objects | owned | by a deciding mortal) for
 * tick 0 — the tick THR-1437's Done-when is measured against — followed by one summary
 * line with the added counts; a second table + line for tick N is printed only when
 * `--ticks` is greater than 0. Writes the full snapshot (both ticks, every field) to
 * `--out`.
 *
 *   npm run census:seeded-world -- --seeds 42,99 --map medium [--ticks 0] [--out <file>]
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
import { ROUTE_IDENTITY_SUBTYPE } from '../src/data/strategic-action-constants';
import { isArmyGroupNode } from '../src/engine/groupShape';
import type { GameState } from '../src/types/gameState';
import type { EdgeType } from '../src/types/graph';

/** The edges THR-1437's seeded passes write and the systems on tick 1 read. */
const SEEDED_EDGE_TYPES: readonly EdgeType[] = ['owns', 'possesses', 'hostile_to', 'knows_secret_of', 'trades_with', 'commanded_by'];

function parseArgs() {
  const a = process.argv.slice(2);
  const get = (k: string, d: string) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d; };
  return {
    seeds: get('--seeds', '42,99').split(',').map(Number),
    ticks: Number(get('--ticks', '0')),
    map: get('--map', 'medium') as MapSizePreset,
    out: get('--out', '.cache/census-seeded-world.json'),
  };
}

interface SnapshotRow {
  objects: number;
  owned: number;
  ownedByDeciding: number;
  ownedByIndividual: number;
  sampleOwners: string[];
}

interface Snapshot {
  tick: number;
  deciding: number;
  individuals: number;
  rows: Record<string, SnapshotRow>;
  nodeTypes: Record<string, number>;
  /** THR-1437 additions below — the counts its Done-when is measured on. */
  spotlightMortals: number;
  routeIdentityNodes: number;
  armies: number;
  edgeCounts: Record<string, number>;
}

function snapshot(state: GameState): Snapshot {
  const g = state.graph;
  const deciding = new Set(g.getNodesByType('actor').filter(isAutonomousDecisionActor).map(n => n.id));
  const individuals = new Set(
    g.getNodesByType('actor').filter(n => (n.properties as Record<string, unknown>).actorType === 'individual').map(n => n.id),
  );
  const rows: Record<string, SnapshotRow> = {};
  for (const type of UNDERTAKING_OBJECT_TYPES) {
    const handles = enumerateObjectHandles(g, type);
    const row: SnapshotRow = { objects: handles.length, owned: 0, ownedByDeciding: 0, ownedByIndividual: 0, sampleOwners: [] };
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

  const spotlightMortals = g.getNodesByType('actor')
    .filter(n => (n.properties as Record<string, unknown>).actorType === 'individual'
      && (n.properties as Record<string, unknown>).spotlightTier === 'spotlight').length;
  const routeIdentityNodes = g.getNodesByType('location')
    .filter(n => (n.properties as Record<string, unknown>).locationSubtype === ROUTE_IDENTITY_SUBTYPE).length;
  const armies = g.getNodesByType('actor').filter(isArmyGroupNode).length;
  const edgeCounts: Record<string, number> = {};
  for (const t of SEEDED_EDGE_TYPES) edgeCounts[t] = g.getEdgesByType(t).length;

  return { tick: state.tick, deciding: deciding.size, individuals: individuals.size, rows, nodeTypes, spotlightMortals, routeIdentityNodes, armies, edgeCounts };
}

/** `kind | objects | owned | by a deciding mortal` — the reduced table THR-1437 reads. */
function printTable(snap: Snapshot): void {
  console.log('| kind | objects | owned | by a deciding mortal |');
  console.log('|---|---|---|---|');
  for (const id of Object.keys(snap.rows)) {
    const r = snap.rows[id];
    console.log(`| ${id} | ${r.objects} | ${r.owned} | ${r.ownedByDeciding} |`);
  }
}

/** The one summary line for the counts THR-1437 added on top of the ownership census. */
function printAddedCounts(snap: Snapshot): void {
  const e = snap.edgeCounts;
  console.log(
    `spotlightMortals ${snap.spotlightMortals} · routeIdentityNodes ${snap.routeIdentityNodes} · armies ${snap.armies}`
    + ` · owns ${e.owns} · possesses ${e.possesses} · hostile_to ${e.hostile_to}`
    + ` · knows_secret_of ${e.knows_secret_of} · trades_with ${e.trades_with} · commanded_by ${e.commanded_by}`,
  );
  console.log(`deciding ${snap.deciding} · individuals ${snap.individuals}`);
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

  console.log(`\nseed ${seed} — tick 0`);
  printTable(t0);
  printAddedCounts(t0);
  if (args.ticks > 0) {
    console.log(`\nseed ${seed} — tick ${args.ticks}`);
    printTable(tN);
    printAddedCounts(tN);
  }

  return { seed, ticks: args.ticks, t0, tN };
});
writeFileSync(args.out, JSON.stringify(out, null, 2));
console.log(`\nWrote ${args.out}`);
