// Reader (THR-1654, THR-1630 S2): one notable in every settlement, and local agendas.
// Read-only. One pass per seed, medium map, unattended (no player, no First).
// Usage: bundle with esbuild to .cache/notables.mjs, then:
//   node .cache/notables.mjs [seeds=42,99] [ticks=200] [arm=on|off]
// `off` zeroes NOTABLES_PER_SETTLEMENT before worldgen — the same-session baseline: no
// seeded notable, so the local roster is empty and the world is what it was before S2.
// Prints the S2 gate: settlements with no resident holding an ambition, quarrel, secret or
// favour at t0 (the audit's `alive.ts` predicate); notables vs settlements; the package's
// misses; then local agendas launched by t150, ms/tick t21..N, and deciders at tN.
import { initializeGameState, MAP_SIZE_PRESETS } from '../../../../src/engine/gameInit';
import { runTick, resetEventCounter } from '../../../../src/engine/orchestrator';
import { createBalancedCosmology } from '../../../../src/engine/cosmology';
import { generateArchetypes } from '../../../../src/engine/ascendant';
import { resetReputationTraitInit } from '../../../../src/engine/phaseReputationTraits';
import { enableTracing, getTraces, clearTraces } from '../../../../src/engine/traceBuffer';
import { isAutonomousDecisionActor } from '../../../../src/engine/decisionTier';
import { getLocationNodes, resolveToParentLocation } from '../../../../src/engine/sublocationShape';
import { locationClassOf } from '../../../../src/data/world-objects';
import { LIVING_WORLD_DEFAULTS } from '../../../../src/data/worldgen-living-constants';
import type { GameState } from '../../../../src/types/gameState';
import type { WorldGraph } from '../../../../src/engine/graph';

const seeds = (process.argv[2] ?? '42,99').split(',').map(Number);
const TICKS = Number(process.argv[3] ?? 200);
const ARM = process.argv[4] ?? 'on';
const LOCAL_BY = 150;

if (ARM === 'off') {
  (LIVING_WORLD_DEFAULTS as { NOTABLES_PER_SETTLEMENT: Record<string, number> }).NOTABLES_PER_SETTLEMENT = {};
}

/** The audit's predicate (`alive.ts`): no resident with an ambition, a quarrel, a secret or a favour. */
function storyless(g: WorldGraph): { settlements: number; storyless: string[]; notables: number; withNotable: number } {
  const residents = new Map<string, string[]>();
  for (const e of g.getEdgesByType('located_at')) {
    const actor = g.getNode(e.source);
    if (actor?.properties.actorType !== 'individual' || actor.properties.alive === false) continue;
    const outer = resolveToParentLocation(g, g.getNode(e.target));
    if (!outer) continue;
    const list = residents.get(outer.id) ?? [];
    list.push(e.source);
    residents.set(outer.id, list);
  }
  const has = (id: string, t: Parameters<WorldGraph['getOutgoingEdges']>[1], out = false) =>
    g.getOutgoingEdges(id, t).length > 0 || (!out && g.getIncomingEdges(id, t).length > 0);
  const settlements = getLocationNodes(g)
    .filter(n => locationClassOf(n.properties.locationSubtype as string) === 'settlement');
  const out: string[] = [];
  let withNotable = 0;
  for (const loc of settlements) {
    const r = residents.get(loc.id) ?? [];
    if (r.some(id => g.getNode(id)?.properties.spotlightTier === 'notable')) withNotable++;
    const story = r.some(id => has(id, 'pursues', true) || has(id, 'hostile_to')
      || has(id, 'knows_secret_of') || has(id, 'owes_favor'));
    if (!story) out.push(loc.id);
  }
  const notables = g.getNodesByType('actor').filter(n => n.properties.notableOrigin === 'worldgen').length;
  return { settlements: settlements.length, storyless: out, notables, withNotable };
}

for (const seed of seeds) {
  resetEventCounter(); resetReputationTraitInit(); clearTraces(); enableTracing();
  const pr = MAP_SIZE_PRESETS['medium'];
  let { state } = initializeGameState(generateArchetypes(4, seed)[0], 'C', createBalancedCosmology(), seed, pr.cols, pr.rows) as { state: GameState };

  const t0 = storyless(state.graph);
  const deciders0 = state.graph.getNodesByType('actor').filter(n => isAutonomousDecisionActor(n)).length;
  console.log(`seed ${seed} [${ARM}] t0: settlements ${t0.settlements} · seeded notables ${t0.notables}`
    + ` · settlements with a notable ${t0.withNotable} · storyless ${t0.storyless.length}`
    + `${t0.storyless.length ? ` (${t0.storyless.join(', ')})` : ''} · deciders ${deciders0}`);

  let totalMs = 0; let measured = 0;
  let localLaunches = 0; let localBy = 0; let firstLocal = -1;
  const families: Record<string, number> = {};
  const sources: Record<string, number> = {};
  for (let t = 1; t <= TICKS; t++) {
    const start = performance.now();
    state = runTick(state);
    const dt = performance.now() - start;
    if (t > 20) { totalMs += dt; measured++; }
    for (const tr of getTraces() as ReadonlyArray<Record<string, unknown>>) {
      if (tr.category !== 'notable.agenda_launched' || tr.local !== true) continue;
      localLaunches++;
      if (t <= LOCAL_BY) localBy++;
      if (firstLocal < 0) firstLocal = t;
      families[String(tr.family)] = (families[String(tr.family)] ?? 0) + 1;
      sources[String(tr.targetSource)] = (sources[String(tr.targetSource)] ?? 0) + 1;
    }
    clearTraces();
  }
  const deciders = state.graph.getNodesByType('actor').filter(n => isAutonomousDecisionActor(n)).length;
  console.log(`seed ${seed} [${ARM}] t${TICKS}: ms/tick t21..${TICKS} ${(totalMs / Math.max(measured, 1)).toFixed(1)}`
    + ` · deciders ${deciders} · local agendas launched ${localLaunches} (by t${LOCAL_BY}: ${localBy}, first t${firstLocal})`
    + ` · families ${JSON.stringify(families)} · targets ${JSON.stringify(sources)}`);
}
