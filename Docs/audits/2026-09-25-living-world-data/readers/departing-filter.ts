// Census reader (THR-1736): does a departing mortal start encounters it cannot fit?
// Read-only. Medium map, unattended (no player, no First). One seed per process.
// Build both arms with `node Docs/audits/2026-09-25-living-world-data/readers/departing-filter.build.mjs`
// (priced = as shipped, proxy = APPOINTMENT_DEPARTING_PRICED_TRAVEL patched to false), then
//   node .cache/departing-filter-<arm>.mjs <seed> [ticks=200]
//
// Per seed, every appointment (not only lead visits): planted / kept / missed by reason,
// the regime path, encounter starts made while `departing` and how many of those overran
// the priced slack (the template's own ticks > dueTick − tick − travelTicks, from where
// the mortal stood after the tick), and how many `absent` misses followed such a start.
import { initializeGameState, MAP_SIZE_PRESETS } from '../../../../src/engine/gameInit';
import { runTick, resetEventCounter } from '../../../../src/engine/orchestrator';
import { createBalancedCosmology } from '../../../../src/engine/cosmology';
import { generateArchetypes } from '../../../../src/engine/ascendant';
import { createSimulationRuntime } from '../../../../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../../../../src/engine/phaseReputationTraits';
import { enableTracing, getTraces, clearTraces } from '../../../../src/engine/traceBuffer';
import { computeAppointmentSlack } from '../../../../src/engine/appointments';
import { computeTotalTickCostUnified } from '../../../../src/engine/encounterCache';
import { getUnifiedTemplateById } from '../../../../src/data/unified-action-templates';
import { APPOINTMENT_DEPARTING_PRICED_TRAVEL } from '../../../../src/data/movement-content';
import type { GameState } from '../../../../src/types/gameState';

const seed = Number(process.argv[2] ?? 42);
const TICKS = Number(process.argv[3] ?? 200);
const inc = (m: Record<string, number>, k: string, n = 1) => { m[k] = (m[k] ?? 0) + n; };

resetEventCounter(); resetReputationTraitInit(); clearTraces(); enableTracing();
const rt = createSimulationRuntime(); const pr = MAP_SIZE_PRESETS['medium'];
let { state } = initializeGameState(generateArchetypes(4, seed)[0], 'C', createBalancedCosmology(), seed, pr.cols, pr.rows) as { state: GameState };

const appt: Record<string, number> = {};
const regimeOf = new Map<string, { seedId: string; regime: string }>(); // agentId → current
const pathOf = new Map<string, string[]>(); // seedId → regimes
const overranBy = new Set<string>(); // seedIds whose holder started an overrunning encounter while departing
let departingStarts = 0;
let departingOverruns = 0;
let absentAfterOverrun = 0;
const started = Date.now();

for (let t = 1; t <= TICKS; t++) {
  state = runTick(state, [], rt);
  const chosen: Array<{ agentId: string; templateId: string }> = [];
  for (const tr of getTraces() as ReadonlyArray<Record<string, unknown>>) {
    const c = String(tr.category);
    if (c === 'appointment_planted' && !tr.refused) inc(appt, 'planted');
    if (c === 'appointment_regime' && !tr.heldBy) {
      regimeOf.set(String(tr.agentId), { seedId: String(tr.seedId), regime: String(tr.regime) });
      const p = pathOf.get(String(tr.seedId)) ?? [];
      if (p[p.length - 1] !== tr.regime) p.push(String(tr.regime));
      pathOf.set(String(tr.seedId), p);
    }
    if (c === 'appointment_kept') inc(appt, 'kept');
    if (c === 'appointment_missed') {
      inc(appt, `missed:${tr.reason}`);
      if (tr.reason === 'absent' && overranBy.has(String(tr.seedId))) absentAfterOverrun++;
    }
    if (c === 'engagement_decision' && tr.chosenId) chosen.push({ agentId: String(tr.agentId), templateId: String(tr.chosenId) });
  }
  for (const { agentId, templateId } of chosen) {
    const r = regimeOf.get(agentId);
    if (!r || r.regime !== 'departing') continue;
    const tmpl = getUnifiedTemplateById(templateId);
    if (!tmpl) continue; // an undertaking, not an encounter
    departingStarts++;
    const seedRow = state.pendingEncounterSeeds.find(s => s.seedId === r.seedId);
    if (!seedRow?.appointment) continue;
    const slack = computeAppointmentSlack(state.graph, agentId, seedRow.appointment, t);
    if (slack && computeTotalTickCostUnified(tmpl) > slack.slack) {
      departingOverruns++;
      overranBy.add(r.seedId);
    }
  }
  clearTraces();
}

const paths: Record<string, number> = {};
for (const p of pathOf.values()) inc(paths, p.join('>'));
console.log(JSON.stringify({
  seed, ticks: TICKS, arm: { APPOINTMENT_DEPARTING_PRICED_TRAVEL },
  appt, departingStarts, departingOverruns, absentAfterOverrun, paths,
  wallMs: Date.now() - started,
}));
