// Census reader (THR-1702 plan): where a `located` lead lands, and whether a delve can
// ever follow. One seed per process. Read-only. Medium map, unattended (no player, no First).
// Usage: npx esbuild <this> --bundle --platform=node --format=esm --outfile=.cache/lead-dead-ends.mjs
//          --external:fs --external:path && node .cache/lead-dead-ends.mjs <seed> [ticks=300] [out]
//
// Per seed:
// - sites: every ruin- and wonder-class Location at t0, by subtype, and how many a delve
//   could ever admit (the `isDelvableRuin` rule, copied below so the reader stays read-only);
// - located: every lead that reaches `located`, by target subtype and whether the target is
//   delvable now / ever / never;
// - resurveys: `cell.observe.location` undertakings started by a holder whose lead on that
//   target is already `located`, split by delvable-ever vs never;
// - visit refusals by reason, visits arranged by site, delves admitted.
import { writeFileSync } from 'fs';
import { initializeGameState, MAP_SIZE_PRESETS } from '../../../../src/engine/gameInit';
import { runTick, resetEventCounter } from '../../../../src/engine/orchestrator';
import { createBalancedCosmology } from '../../../../src/engine/cosmology';
import { generateArchetypes } from '../../../../src/engine/ascendant';
import { createSimulationRuntime } from '../../../../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../../../../src/engine/phaseReputationTraits';
import { enableTracing, getTraces, clearTraces } from '../../../../src/engine/traceBuffer';
import { getLocationNodes } from '../../../../src/engine/sublocationShape';
import { locationClassOf } from '../../../../src/data/world-objects';
import { RUINED_SETTLEMENT_DELVE_DECAY_TICKS } from '../../../../src/data/strategic-action-constants';
import type { GameState } from '../../../../src/types/gameState';
import type { GraphNode } from '../../../../src/types/graph';

const seed = Number(process.argv[2] ?? 42);
const TICKS = Number(process.argv[3] ?? 300);
const inc = (m: Record<string, number>, k: string, n = 1) => { m[k] = (m[k] ?? 0) + n; };

resetEventCounter(); resetReputationTraitInit(); clearTraces(); enableTracing();
const rt = createSimulationRuntime(); const pr = MAP_SIZE_PRESETS['medium'];
let { state } = initializeGameState(generateArchetypes(4, seed)[0], 'C', createBalancedCosmology(), seed, pr.cols, pr.rows) as { state: GameState };
const g = () => state.graph;

const subtypeOf = (n: GraphNode | undefined) => String(n?.properties.locationSubtype ?? n?.properties.locationType ?? '');
/** `delveVariant.ts` isDelvableRuin, copied. */
const delvableNow = (n: GraphNode | undefined, tick: number) => {
  if (!n) return false;
  const p = n.properties as Record<string, unknown>;
  if (p.locationType === 'elder_ruin') return true;
  return subtypeOf(n) === 'ruins' && typeof p.ruinedTick === 'number' && p.ruinedTick + RUINED_SETTLEMENT_DELVE_DECAY_TICKS <= tick;
};
/** Could a delve *ever* be admitted here: delvable now, or a mortal-ruined settlement still settling. */
const delvableEver = (n: GraphNode | undefined, tick: number) => {
  if (delvableNow(n, tick)) return true;
  const p = (n?.properties ?? {}) as Record<string, unknown>;
  return subtypeOf(n) === 'ruins' && typeof p.ruinedTick === 'number';
};
const tag = (n: GraphNode | undefined, tick: number) =>
  `${locationClassOf(subtypeOf(n)) ?? 'other'}:${subtypeOf(n)}:${delvableNow(n, tick) ? 'now' : delvableEver(n, tick) ? 'later' : 'never'}`;

const sites: Record<string, number> = {};
for (const n of getLocationNodes(g())) {
  const cls = locationClassOf(subtypeOf(n));
  if (cls !== 'ruin' && cls !== 'wonder') continue;
  inc(sites, tag(n, 0));
}

const located: Record<string, number> = {};
const resurveys: Record<string, number> = {};
const refusals: Record<string, number> = {};
const arrangedAt: Record<string, number> = {};
const counts: Record<string, number> = {};
const started = Date.now();

for (let t = 1; t <= TICKS; t++) {
  state = runTick(state, [], rt);
  for (const tr of getTraces() as ReadonlyArray<Record<string, unknown>>) {
    const c = String(tr.category);
    const reached = (c === 'ruins.clue_sharpened' && tr.to === 'located' && tr.from !== 'located')
      || (c === 'ruins.clue_discovered' && tr.precision === 'located');
    if (reached) {
      const target = g().getNode(String(tr.targetRuinId ?? ''));
      inc(located, target ? tag(target, t) : `unresolved:${Object.keys(tr).join(',')}`);
    }
    if (c === 'strategic_action_started' && tr.templateId === 'cell.observe.location' && tr.startedBy !== 'review_lever') {
      inc(counts, 'location_surveys');
      const actorId = String(tr.actorId ?? tr.agentId ?? '');
      const targetId = String(tr.targetNodeId ?? '');
      const lead = g().getOutgoingEdges(actorId, 'knows_clue_of')
        .find(e => e.target === targetId && e.properties?.consumed !== true);
      if (lead?.properties?.precision === 'located') inc(resurveys, tag(g().getNode(targetId), t));
    }
    if (c === 'appointment_planted' && tr.templateId === 'cell.observe.location') {
      inc(refusals, tr.refused ? `refused:${tr.refused}` : 'arranged');
      if (!tr.refused) inc(arrangedAt, tag(g().getNode(String(tr.locationId ?? '')), t));
    }
    if (c === 'ruins.delve_admitted') inc(counts, 'delve_admitted');
  }
  clearTraces();
}

// Live `located` leads at the end, by target.
const liveLocated: Record<string, number> = {};
for (const e of g().getEdgesByType('knows_clue_of')) {
  if (e.properties?.consumed === true || e.properties?.precision !== 'located') continue;
  inc(liveLocated, tag(g().getNode(e.target), TICKS));
}

const result = { seed, ticks: TICKS, sites, located, resurveys, liveLocated, visit: refusals, arrangedAt, counts, wallMs: Date.now() - started };
console.log(JSON.stringify(result));
if (process.argv[4]) writeFileSync(process.argv[4], JSON.stringify(result, null, 1));
