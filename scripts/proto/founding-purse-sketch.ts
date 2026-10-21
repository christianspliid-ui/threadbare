/**
 * PROTO — THR-2006 (design lane 2026-10-21a). Never merged.
 *
 * Runs a seeded world as shipped (founding costs OFF) and, at every costed undertaking
 * start (`MEANS_CELL_COST` keys), records what the founder holds and what their
 * factions hold. Answers: with costs on, who could have paid — the mortal alone, or
 * the mortal's faction purse?
 *
 * Usage: esbuild bundle, then `node .cache/founding-purse-sketch.mjs --seed 42 --ticks 600`
 */

import { initializeGameState, MAP_SIZE_PRESETS } from '../../src/engine/gameInit';
import { runTick, resetEventCounter } from '../../src/engine/orchestrator';
import { createBalancedCosmology } from '../../src/engine/cosmology';
import { generateArchetypes } from '../../src/engine/ascendant';
import { createSimulationRuntime } from '../../src/engine/simulationRuntime';
import { enableTracing, getTraces, clearTraces } from '../../src/engine/traceBuffer';
import { getStrategicTemplate } from '../../src/engine/strategicActionCandidates';
import { MEANS_CELL_COST } from '../../src/data/mortal-means-constants';
import { isPurseFaction } from '../../src/engine/factionPurse/income';
import { readWealth } from '../../src/engine/wealth';

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const SEED = Number(argValue('--seed') ?? 42);
const TICKS = Number(argValue('--ticks') ?? 600);

resetEventCounter();
clearTraces();
enableTracing();
const runtime = createSimulationRuntime();
const archetype = generateArchetypes(4, SEED)[0];
const preset = MAP_SIZE_PRESETS.medium;
let { state } = initializeGameState(archetype, 'FoundingPurseSketch', createBalancedCosmology(), SEED, preset.cols, preset.rows);

interface Row { tick: number; key: string; cost: number; founderWealth: number; factionCount: number; bestTreasury: number; rulerTreasury: number | null }
const rows: Row[] = [];
const wealthSamples: number[][] = [];
const treasurySamples: number[][] = [];

for (let i = 0; i < TICKS; i++) {
  state = runTick(state, [], runtime);
  const g = state.graph;
  for (const t of getTraces()) {
    if (t.category !== 'strategic_action_started') continue;
    const tr = t as unknown as { agentId?: string; actorId?: string; templateId: string };
    const tpl = getStrategicTemplate(tr.templateId);
    if (!tpl?.cellVariant || !tpl.objectTypeId) continue;
    const key = `${tpl.cellVariant}×${tpl.objectTypeId}`;
    const cost = MEANS_CELL_COST[key];
    if (!cost) continue;
    const actorId = tr.agentId ?? tr.actorId ?? '';
    const actor = g.getNode(actorId);
    const founderWealth = readWealth((actor?.properties ?? {}) as Record<string, unknown>);
    const factions = g.getOutgoingEdges(actorId, 'member_of')
      .map(e => g.getNode(e.target)).filter(isPurseFaction);
    const treasuries = factions.map(f => readWealth(f.properties as Record<string, unknown>));
    rows.push({
      tick: state.tick, key, cost, founderWealth,
      factionCount: factions.length,
      bestTreasury: treasuries.length ? Math.max(...treasuries) : 0,
      rulerTreasury: null,
    });
  }
  clearTraces();
  if (state.tick % 100 === 0) {
    const deciders = g.getNodesByType('actor').filter(n => n.properties.actorType === 'individual' && typeof n.properties.wealth === 'number');
    wealthSamples.push(deciders.map(n => readWealth(n.properties as Record<string, unknown>)).sort((a, b) => a - b));
    const facs = g.getNodesByType('actor').filter(isPurseFaction);
    treasurySamples.push(facs.map(n => readWealth(n.properties as Record<string, unknown>)).sort((a, b) => a - b));
  }
}

const median = (xs: number[]) => xs.length ? xs[Math.floor(xs.length / 2)] : null;
const byKey = new Map<string, Row[]>();
for (const r of rows) byKey.set(r.key, [...(byKey.get(r.key) ?? []), r]);
const summary: Record<string, unknown> = {};
for (const [key, rs] of byKey) {
  summary[key] = {
    starts: rs.length,
    cost: rs[0].cost,
    founderCanPay: rs.filter(r => r.founderWealth >= r.cost).length,
    founderMedianWealth: median(rs.map(r => r.founderWealth).sort((a, b) => a - b)),
    hasPurseFaction: rs.filter(r => r.factionCount > 0).length,
    factionCanPay: rs.filter(r => r.bestTreasury >= r.cost).length,
    factionCanPayHalf: rs.filter(r => r.bestTreasury >= r.cost / 2).length,
    founderOrFactionCanPay: rs.filter(r => r.founderWealth >= r.cost || r.bestTreasury >= r.cost).length,
    splitHalfCanPay: rs.filter(r => r.founderWealth >= r.cost / 2 && r.bestTreasury >= r.cost / 2).length,
    factionMedianTreasury: median(rs.map(r => r.bestTreasury).sort((a, b) => a - b)),
  };
}
console.log(JSON.stringify({
  seed: SEED, ticks: TICKS, costedStarts: rows.length, byCell: summary,
  deciderWealthByCentury: wealthSamples.map(s => ({ n: s.length, median: median(s), atLeast40: s.filter(w => w >= 40).length })),
  factionTreasuryByCentury: treasurySamples.map(s => ({ n: s.length, median: median(s), min: s[0], max: s[s.length - 1] })),
}, null, 1));
