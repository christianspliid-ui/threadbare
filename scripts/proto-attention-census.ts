/**
 * PROTO (THR-2062 design lane, never merged to main): how often does a thread tug —
 * the only thing that spends Attention — appear in a `?seeded` world, and for whom?
 *
 *   npx tsx scripts/proto-attention-census.ts --seed 42 --ticks 240
 */
import { initializeGameState, MAP_SIZE_PRESETS, devSeedTheFirst } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { unattended } from '../src/engine/playerStepHold';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime, touchStructure } from '../src/engine/simulationRuntime';
import { computeAttendCost } from '../src/engine/attentionPool';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits';

const argv = process.argv.slice(2);
const arg = (n: string) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
const seed = Number(arg('--seed') ?? 42);
const ticks = Number(arg('--ticks') ?? 240);
const retinue = Number(arg('--retinue') ?? 0);
const greedy = argv.includes('--greedy');

resetEventCounter();
resetReputationTraitInit();
const runtime = createSimulationRuntime();
const preset = MAP_SIZE_PRESETS.medium;
const archetype = generateArchetypes(4, seed)[0];
let { state } = initializeGameState(archetype, 'ATTN', createBalancedCosmology(), seed, preset.cols, preset.rows);
const firstId = devSeedTheFirst(state);
{
  const picks = state.graph.getNodesByType('actor')
    .filter(n => n.id !== firstId && n.properties.actorType === 'individual' && n.properties.spotlightTier === 'spotlight')
    .slice(0, retinue);
  for (const n of picks) {
    state.graph.addEdge({ id: `edge_thread_proto_${n.id}`, source: state.ascendantId, target: n.id, type: 'thread',
      properties: { courtPosition: 'retinue', tier: 1, ticksAtCurrentTier: 0, establishedTick: 0, totalEssenceSpent: 0, maintenanceCurrent: true, awareness: 'faith', readBackstoryTier: 0, beatHistory: [] } } as never);
  }
}
touchStructure(runtime);
let spends = 0, spent = 0, unaffordableSeen = 0, ticksBelowHalf = 0;
const unaffordable = new Set<string>();

const seenTugs = new Set<string>();
const tugsByCourt: Record<string, number> = {};
const tugsByAgent: Record<string, number> = {};
const tierByFirst: Record<string, number> = {};
const seenActions = new Set<string>();
let ticksWithTug = 0;
let minPool = Infinity;

for (let i = 0; i < ticks; i++) {
  state = unattended(runTick(state, [], runtime));
  const tugs = state.activeThreadTugs ?? [];
  if (tugs.length > 0) ticksWithTug++;
  for (const t of tugs) {
    if (seenTugs.has(t.id)) continue;
    seenTugs.add(t.id);
    const kind = t.id.startsWith('livelihood') ? 'livelihood' : 'chapter';
    tugsByCourt[kind + ':' + t.courtPosition] = (tugsByCourt[kind + ':' + t.courtPosition] ?? 0) + 1;
    tugsByAgent[t.agentId === firstId ? 'the_first' : t.agentId] = (tugsByAgent[t.agentId === firstId ? 'the_first' : t.agentId] ?? 0) + 1;
  }
  for (const a of state.unifiedActions ?? []) {
    if (seenActions.has(a.actionId) || a.actorId !== firstId) continue;
    seenActions.add(a.actionId);
    tierByFirst[a.effectiveTier ?? 'none'] = (tierByFirst[a.effectiveTier ?? 'none'] ?? 0) + 1;
  }
  if (greedy) {
    const asc = state.graph.getNode(state.ascendantId)!;
    const tugsNow = state.activeThreadTugs ?? [];
    let changed = false;
    const next = tugsNow.map(t => {
      if (t.attended) return t;
      const cost = t.id.startsWith('livelihood') ? 0 : computeAttendCost(t.threatLevel === 'easy' ? 'moderate' : (t.threatLevel as never), t.courtPosition as never);
      const pool = (asc.properties.attentionPool as number) ?? 6;
      if (pool < cost) { if (!unaffordable.has(t.id)) { unaffordable.add(t.id); unaffordableSeen++; } return t; }
      asc.properties.attentionPool = pool - cost; spends++; spent += cost; changed = true;
      return { ...t, attended: true };
    });
    if (changed) state = { ...state, activeThreadTugs: next };
  }
  const pool = state.graph.getNode(state.ascendantId)?.properties.attentionPool as number | undefined;
  if (typeof pool === 'number') { minPool = Math.min(minPool, pool); if (pool < 3) ticksBelowHalf++; }
}

const threads = state.graph.getAllEdges().filter(e => e.type === 'thread' && e.source === state.ascendantId);
const courts: Record<string, number> = {};
for (const e of threads) {
  const c = String((e.properties as Record<string, unknown>).courtPosition ?? 'none');
  courts[c] = (courts[c] ?? 0) + 1;
}
console.log(JSON.stringify({
  seed, ticks,
  tugsTotal: seenTugs.size, ticksWithTug, tugsByCourt, tugsByAgent,
  firstActionsByTier: tierByFirst,
  threadsAtEnd: courts,
  minPoolSeen: minPool, retinue, greedy, spends, spent: +spent.toFixed(2), unaffordableTugs: unaffordableSeen, ticksBelowHalf,
}, null, 1));
