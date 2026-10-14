/**
 * THR-1865 PROTOTYPE sketch — Means as a want and a cost. THROWAWAY (never merged).
 *
 *   npx esbuild scripts/proto/means-want-sketch.ts --bundle --platform=node --format=esm \
 *     --outfile=.cache/means-want-sketch.mjs --external:fs --external:path
 *   node .cache/means-want-sketch.mjs
 *
 * Seed 42, medium map, 300 ticks. The parent runs with the rule set on; it spawns
 * itself with `--disabled` for the unmodified baseline and compares.
 */

import { execFileSync } from 'child_process';
import { initializeGameState, MAP_SIZE_PRESETS } from '../../src/engine/gameInit';
import { runTick, resetEventCounter } from '../../src/engine/orchestrator';
import { createSimulationRuntime } from '../../src/engine/simulationRuntime';
import { createBalancedCosmology } from '../../src/engine/cosmology';
import { generateArchetypes } from '../../src/engine/ascendant';
import { enableTracing, clearTraces } from '../../src/engine/traceBuffer';
import { isAutonomousDecisionActor } from '../../src/engine/decisionTier';
import { getAgentLocationId } from '../../src/engine/graphQueries';
import { resolveToParentLocation } from '../../src/engine/sublocationShape';
import { scoreUnifiedBoard, type BoardInput } from '../../src/engine/decisionBoard';
import { getStrategicTemplate } from '../../src/engine/strategicActionCandidates';
import { meansCellKey, meansMultiplier, meansProtoCapture, meansProtoStats, freshStats } from '../../src/engine/meansWant';
import { meansWantRuntime, MEANS_CELL_COST, MEANS_COMFORT_LINE } from '../../src/data/means-want-constants';
import { getWealthTier, readWealth, type WealthTier } from '../../src/engine/wealth';
import type { GameState } from '../../src/types/gameState';
import type { GraphNode } from '../../src/types/graph';

const SEED = 42;
const TICKS = 300;
const POOR = 5;
const RICH = 85;
const TIERS: WealthTier[] = ['Destitute', 'Getting by', 'Comfortable', 'Wealthy', 'Magnate'];

const disabled = process.argv.includes('--disabled');
meansWantRuntime.enabled = !disabled;

const out = (s = ''): void => { process.stdout.write(s + '\n'); };
const realLog = console.log;
const realWarn = console.warn;
const realInfo = console.info;
function quiet(): void { console.log = () => {}; console.warn = () => {}; console.info = () => {}; }
function loud(): void { console.log = realLog; console.warn = realWarn; console.info = realInfo; }

function deciders(state: GameState): GraphNode[] {
  return state.graph.getNodesByType('actor')
    .filter(n => isAutonomousDecisionActor(n) && n.id !== state.ascendantId)
    .sort((a, b) => (a.id < b.id ? -1 : 1));
}

function wealthOf(n: GraphNode): number {
  return readWealth(n.properties as Record<string, unknown>);
}

function distribution(nodes: GraphNode[]): Record<string, number> {
  const d: Record<string, number> = {};
  for (const t of TIERS) d[t] = 0;
  for (const n of nodes) d[getWealthTier(wealthOf(n))]++;
  const ws = nodes.map(wealthOf).sort((a, b) => a - b);
  d.n = ws.length;
  d.median = ws.length ? ws[Math.floor(ws.length / 2)] : 0;
  d.mean = ws.length ? Math.round((ws.reduce((a, b) => a + b, 0) / ws.length) * 10) / 10 : 0;
  d.unset = nodes.filter(n => n.properties.wealth === undefined).length;
  return d;
}

function median(xs: number[]): number | null {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

// ── Run ─────────────────────────────────────────────────────────
quiet();
resetEventCounter();
clearTraces();
enableTracing();
const runtime = createSimulationRuntime();
const archetype = generateArchetypes(4, SEED)[0];
const preset = MAP_SIZE_PRESETS.medium;
let state = initializeGameState(archetype, 'MeansSketch', createBalancedCosmology(), SEED, preset.cols, preset.rows).state;

meansProtoStats.current = freshStats();
const lastBoard = new Map<string, { input: BoardInput; tick: number }>();
meansProtoCapture.onBoard = (input: unknown) => {
  const i = input as BoardInput;
  lastBoard.set(i.agentId, { input: i, tick: i.tick });
};

const t0Deciders = deciders(state);
const distT0 = distribution(t0Deciders);
const poorAtT0 = new Map<string, number>(); // id → t0 wealth, for wealth < 40
for (const n of t0Deciders) if (wealthOf(n) < MEANS_COMFORT_LINE) poorAtT0.set(n.id, wealthOf(n));
const reachedAt = new Map<string, number>();

for (let t = 0; t < TICKS; t++) {
  state = runTick(state, [], runtime);
  for (const id of poorAtT0.keys()) {
    if (reachedAt.has(id)) continue;
    const n = state.graph.getNode(id);
    if (n && wealthOf(n) >= MEANS_COMFORT_LINE) reachedAt.set(id, state.tick);
  }
  // Clear traces periodically to keep memory flat; nothing here reads them.
  if (t % 50 === 49) clearTraces();
}
loud();

const t300Deciders = deciders(state);
const distT300 = distribution(t300Deciders);
const stats = meansProtoStats.current;
const summary = {
  tick: state.tick,
  decisions: stats.decisions,
  earningDecisions: stats.earningDecisions,
  undertakingStarts: stats.undertakingStarts,
  cellStarts: stats.cellStarts,
  earningCellStarts: stats.earningCellStarts,
  costedCellStarts: stats.costedCellStarts,
  wealthCharged: stats.wealthCharged,
  dropEvents: stats.dropEvents,
  droppedPairs: stats.droppedPairs.size,
  unaffordedTopDesire: stats.unaffordedTopDesire,
  startsByCell: Object.fromEntries([...stats.startsByCell.entries()].sort((a, b) => b[1] - a[1])),
  distT0,
  distT300,
};

if (disabled) {
  out('@@JSON ' + JSON.stringify(summary));
  process.exit(0);
}

// ── (a) pick the mortal(s) ──────────────────────────────────────
meansProtoStats.counting = false;
const g = state.graph;
const settlementOf = (id: string): string | undefined => {
  const loc = getAgentLocationId(g, id);
  return loc ? (resolveToParentLocation(g, g.getNode(loc))?.id ?? loc) : undefined;
};
const withBoard = t300Deciders.filter(n => lastBoard.has(n.id) && lastBoard.get(n.id)!.input.strategicCandidates.length > 0);
let pair: [GraphNode, GraphNode] | null = null;
const bySettlement = new Map<string, GraphNode[]>();
for (const n of withBoard) {
  const s = settlementOf(n.id);
  if (!s) continue;
  bySettlement.set(s, [...(bySettlement.get(s) ?? []), n]);
}
for (const [, ns] of [...bySettlement.entries()].sort()) {
  if (ns.length >= 2) { pair = [ns[0], ns[1]]; break; }
}

function boardFor(node: GraphNode, forcedWealth: number, label: string): void {
  const cap = lastBoard.get(node.id)!;
  const props = node.properties as Record<string, unknown>;
  const saved = props.wealth;
  props.wealth = forcedWealth;
  const res = scoreUnifiedBoard({ ...cap.input, graph: g, tick: state.tick });
  props.wealth = saved;
  const w = res.meansWant;
  out(`  ${label}: ${node.name} (${node.id}) @ ${settlementOf(node.id)} — wealth forced ${forcedWealth} (actual ${typeof saved === 'number' ? saved : 'unset'}), board captured t${cap.tick}`);
  if (w) {
    out(`    want=${w.want.toFixed(3)} (poverty ${w.poverty.toFixed(2)}, greed ${w.greed.toFixed(2)}, generosity ${w.generosity.toFixed(2)}, unaffordedTop ${w.unafforded}) → earning ×${meansMultiplier(w.want).toFixed(3)}`);
  }
  out(`    dropped for cost: ${res.meansDropped && res.meansDropped.length ? res.meansDropped.join(', ') : 'none'}`);
  out(`    candidates: ${cap.input.encounterCandidates.length} encounter, ${cap.input.strategicCandidates.length} undertaking; board entries ${res.entries.length}`);
  res.entries.slice(0, 5).forEach((e, i) => {
    let label2: string;
    if (e.family === 'encounter') {
      const c = cap.input.encounterCandidates[e.candidateIndex];
      label2 = `enc  ${e.id} [${c?.entry.encounterType}]`;
    } else {
      const tpl = getStrategicTemplate(e.id);
      label2 = `cell ${e.id}${meansCellKey(tpl) ? ` [${meansCellKey(tpl)}]` : ''}`;
    }
    out(`    ${i + 1}. ${label2.padEnd(58)} score ${e.score.toFixed(4)}${e.meansEarning ? `  earning ×${(e.meansMultiplier ?? 1).toFixed(3)}` : ''}`);
  });
}

out('');
out(`=== THR-1865 means-want sketch — seed ${SEED}, medium, tick ${state.tick} ===`);
out('');
out('(a)+(b) Board top 5, poor vs rich');
if (pair) {
  out(`  Pair sharing settlement ${settlementOf(pair[0].id)}:`);
  boardFor(pair[0], POOR, 'POOR');
  boardFor(pair[1], RICH, 'RICH');
  out('  Same mortal, both cases (control):');
  boardFor(pair[0], RICH, 'RICH');
} else if (withBoard.length > 0) {
  out('  No co-located pair; one mortal evaluated twice:');
  boardFor(withBoard[0], POOR, 'POOR');
  boardFor(withBoard[0], RICH, 'RICH');
} else {
  out('  No decider had a captured board with undertaking candidates.');
}

// ── (c) census ─────────────────────────────────────────────────
const fmtDist = (d: Record<string, number>): string =>
  `${TIERS.map(t => `${t} ${d[t]}`).join(' | ')} || n ${d.n}, median ${d.median}, mean ${d.mean}, unset ${d.unset}`;
out('');
out('(c) Census (prototype ON)');
out(`  Wealth t0   : ${fmtDist(distT0)}`);
out(`  Wealth t300 : ${fmtDist(distT300)}`);
out('  Could afford at t300:');
for (const [cell, cost] of Object.entries(MEANS_CELL_COST)) {
  const n = t300Deciders.filter(x => wealthOf(x) >= cost).length;
  out(`    ${cell.padEnd(20)} cost ${String(cost).padStart(3)} : ${n}/${t300Deciders.length}`);
}
out(`  Undertakings started: ${stats.undertakingStarts}; cell starts ${stats.cellStarts} (earning cells ${stats.earningCellStarts}, costed cells ${stats.costedCellStarts}); wealth charged ${stats.wealthCharged}`);
out(`  Dropped for cost: ${stats.dropEvents} candidate-drops across decisions, ${stats.droppedPairs.size} distinct mortal×cell pairs; top-desired cell unaffordable on ${stats.unaffordedTopDesire} decisions`);
out(`  Cell starts by cell: ${JSON.stringify(summary.startsByCell)}`);
const reachTicks = [...reachedAt.values()];
const destitute = [...poorAtT0.entries()].filter(([, w]) => w < 20).map(([id]) => id);
const gettingBy = [...poorAtT0.entries()].filter(([, w]) => w >= 20).map(([id]) => id);
const medFor = (ids: string[]): string => {
  const ts = ids.filter(id => reachedAt.has(id)).map(id => reachedAt.get(id)!);
  return `${ts.length}/${ids.length} reached 40, median ${median(ts) ?? 'n/a'} ticks`;
};
out(`  Ticks to reach ${MEANS_COMFORT_LINE}: Destitute@t0 ${medFor(destitute)}; Getting-by@t0 ${medFor(gettingBy)}; all ${reachTicks.length}/${poorAtT0.size}`);

// ── (d) enabled vs disabled ────────────────────────────────────
out('');
out('(d) Enabled vs unmodified (MEANS_WANT_ENABLED=false, child process)');
let base: typeof summary | null = null;
try {
  const raw = execFileSync(process.execPath, [process.argv[1], '--disabled'], { encoding: 'utf8', maxBuffer: 1 << 28 });
  const line = raw.split('\n').find(l => l.startsWith('@@JSON '));
  base = line ? JSON.parse(line.slice(7)) : null;
} catch (err) {
  out(`  baseline run failed: ${(err as Error).message.slice(0, 300)}`);
}
if (base) {
  const share = (s: typeof summary): string => s.decisions ? `${((100 * s.earningDecisions) / s.decisions).toFixed(1)}%` : 'n/a';
  const row = (k: string, a: unknown, b: unknown): void => out(`  ${k.padEnd(34)} ${String(b).padStart(10)} ${String(a).padStart(10)}`);
  out(`  ${''.padEnd(34)} ${'OFF'.padStart(10)} ${'ON'.padStart(10)}`);
  row('board decisions (mortal, ≥floor)', summary.decisions, base.decisions);
  row('earning-work decisions', summary.earningDecisions, base.earningDecisions);
  row('earning-work share', share(summary), share(base));
  row('undertakings started', summary.undertakingStarts, base.undertakingStarts);
  row('cell starts', summary.cellStarts, base.cellStarts);
  row('earning cell starts', summary.earningCellStarts, base.earningCellStarts);
  row('costed cell starts', summary.costedCellStarts, base.costedCellStarts);
  row('wealth median t300', summary.distT300.median, base.distT300.median);
  out(`  OFF wealth t0   : ${fmtDist(base.distT0)}`);
  out(`  OFF wealth t300 : ${fmtDist(base.distT300)}`);
  out(`  OFF cell starts by cell: ${JSON.stringify(base.startsByCell)}`);
}
process.exit(0);
