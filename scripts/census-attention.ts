/**
 * Attention census (THR-2062) — who raises Thread Tugs, what answering them costs,
 * and where the pool sits when a greedy player answers every tug it can afford.
 *
 *   npm run census:attention
 *   npm run census:attention -- --seeds 42,99,7 --ticks 360 --retinue 3
 *
 * Runs two worlds per seed on the medium map with The First pre-bonded
 * (`devSeedTheFirst`): The First alone, and The First plus `--retinue` spotlit
 * mortals on *Lives on*. The greedy player spends through the engine's single
 * writer (`attendThreadTug`), so the census measures the real spend.
 *
 * Kill criteria (Docs/plans/2026-10-27-thr-2062-attention-has-a-price.md):
 *   - any tug for a pause-mode thread;
 *   - more than one livelihood tug per mortal per crossing;
 *   - a First-alone world whose pool ever leaves full;
 *   - a retinue world that never drops below half (too loose), or sits below half
 *     on more than 95 % of ticks on every seed (too tight).
 * Exit code 1 when a criterion trips.
 */
import { initializeGameState, MAP_SIZE_PRESETS, devSeedTheFirst } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { unattended } from '../src/engine/playerStepHold';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime, touchStructure } from '../src/engine/simulationRuntime';
import { attendThreadTug } from '../src/engine/attentionPool';
import { resolveAttentionMode } from '../src/engine/attentionCadence';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits';
import type { ThreadEdgeProperties } from '../src/types/influence';
import type { GameState } from '../src/types/gameState';

const argv = process.argv.slice(2);
const arg = (n: string) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
const seeds = (arg('--seeds') ?? '42,99,7').split(',').map(Number);
const ticks = Number(arg('--ticks') ?? 360);
const retinueCount = Number(arg('--retinue') ?? 3);

/** "Below half" — the share of ticks the kill criteria bound. */
const HALF = 0.5;
/** Too tight: below half on more than this share of ticks, on every seed. */
const TOO_TIGHT_SHARE = 0.95;
/**
 * A livelihood tug for the same mortal, good and tier this soon after the last one is
 * a repeat inside one crossing. Before THR-2062 a lasting famine re-pulled every
 * `THREAD_TUG_LINGER` (3) ticks; a genuine re-crossing needs the good to go back to
 * adequate and out again, which takes longer than this window.
 */
const LIVELIHOOD_REPEAT_WINDOW = 6;

interface WorldResult {
  seed: number;
  world: 'first_alone' | 'retinue';
  chapterTugs: number;
  livelihoodTugs: number;
  pauseModeTugs: number;
  /** Livelihood tugs per `${agent}::${good}` beyond one per crossing. */
  livelihoodRepeats: number;
  spends: number;
  spent: number;
  unaffordable: number;
  minPool: number;
  belowHalfShare: number;
}

function runWorld(seed: number, retinue: number): WorldResult {
  resetEventCounter();
  resetReputationTraitInit();
  const runtime = createSimulationRuntime();
  const preset = MAP_SIZE_PRESETS.medium;
  const archetype = generateArchetypes(4, seed)[0];
  let { state } = initializeGameState(archetype, 'ATTN', createBalancedCosmology(), seed, preset.cols, preset.rows);
  const firstId = devSeedTheFirst(state);
  const picks = state.graph.getNodesByType('actor')
    .filter(n => n.id !== firstId && n.properties.actorType === 'individual' && n.properties.spotlightTier === 'spotlight')
    .slice(0, retinue);
  for (const n of picks) {
    state.graph.addEdge({
      id: `edge_thread_census_${n.id}`, source: state.ascendantId, target: n.id, type: 'thread',
      properties: {
        courtPosition: 'retinue', attentionMode: 'auto_resolve', tier: 1, ticksAtCurrentTier: 0,
        establishedTick: 0, totalEssenceSpent: 0, maintenanceCurrent: true, awareness: 'faith',
        readBackstoryTier: 0, beatHistory: [],
      },
    } as never);
  }
  touchStructure(runtime);

  const seen = new Set<string>();
  const unaffordable = new Set<string>();
  // The last livelihood tug per agent::good — its tier and tick — to count repeats.
  const lastLivelihood = new Map<string, { tier: string; tick: number }>();
  let chapterTugs = 0, livelihoodTugs = 0, pauseModeTugs = 0, livelihoodRepeats = 0;
  let spends = 0, spent = 0, belowHalf = 0, minPool = Infinity;

  const modeOf = (s: GameState, agentId: string): 'pause' | 'auto_resolve' | null => {
    const edge = s.graph.getOutgoingEdges(s.ascendantId, 'thread').find(e => e.target === agentId);
    return edge ? resolveAttentionMode(edge.properties as unknown as ThreadEdgeProperties) : null;
  };

  for (let i = 0; i < ticks; i++) {
    state = unattended(runTick(state, [], runtime));
    for (const t of state.activeThreadTugs ?? []) {
      if (seen.has(t.id)) continue;
      seen.add(t.id);
      if (t.kind === 'livelihood') {
        livelihoodTugs++;
        const key = t.livelihoodKey ?? `${t.agentId}::${t.livelihoodResourceId}`;
        const last = lastLivelihood.get(key);
        if (last && last.tier === t.livelihoodTier && t.createdTick - last.tick <= LIVELIHOOD_REPEAT_WINDOW) {
          livelihoodRepeats++;
        }
        lastLivelihood.set(key, { tier: t.livelihoodTier ?? '', tick: t.createdTick });
      } else {
        chapterTugs++;
        if (modeOf(state, t.agentId) === 'pause') pauseModeTugs++;
      }
    }
    // Greedy player: answer every tug the pool can cover, through the engine writer.
    for (const t of state.activeThreadTugs ?? []) {
      if (t.attended) continue;
      const result = attendThreadTug(state, t.id);
      if (!result) { unaffordable.add(t.id); continue; }
      state = { ...state, activeThreadTugs: result.activeThreadTugs };
      spends++;
      spent += result.cost;
    }

    const asc = state.graph.getNode(state.ascendantId)?.properties as Record<string, unknown> | undefined;
    const pool = asc?.attentionPool as number | undefined;
    const cap = (asc?.attentionCapacity as number | undefined) ?? 6;
    if (typeof pool === 'number') {
      minPool = Math.min(minPool, pool);
      if (pool < cap * HALF) belowHalf++;
    }
  }

  return {
    seed,
    world: retinue > 0 ? 'retinue' : 'first_alone',
    chapterTugs, livelihoodTugs, pauseModeTugs, livelihoodRepeats,
    spends, spent: +spent.toFixed(2), unaffordable: unaffordable.size,
    minPool: +minPool.toFixed(2), belowHalfShare: +(belowHalf / ticks).toFixed(3),
  };
}

const results: WorldResult[] = [];
for (const seed of seeds) {
  for (const r of [runWorld(seed, 0), runWorld(seed, retinueCount)]) {
    results.push(r);
    console.log(JSON.stringify(r)); // streamed, so a long run shows progress
  }
}

console.log(`Attention census — seeds ${seeds.join(', ')} × ${ticks} ticks, medium, retinue ${retinueCount}`);
console.table(results);

const failures: string[] = [];
for (const r of results) {
  if (r.pauseModeTugs > 0) failures.push(`seed ${r.seed} ${r.world}: ${r.pauseModeTugs} tug(s) for a pause-mode thread`);
  if (r.livelihoodRepeats > 0) failures.push(`seed ${r.seed} ${r.world}: ${r.livelihoodRepeats} livelihood repeat(s) inside one crossing`);
  if (r.world === 'first_alone' && r.spent > 0) failures.push(`seed ${r.seed} first_alone: pool left full (spent ${r.spent})`);
}
const retinueRuns = results.filter(r => r.world === 'retinue');
if (retinueRuns.length > 0 && retinueRuns.every(r => r.belowHalfShare === 0)) {
  failures.push('retinue worlds never drop below half on any seed (too loose)');
}
if (retinueRuns.length > 0 && retinueRuns.every(r => r.belowHalfShare > TOO_TIGHT_SHARE)) {
  failures.push(`retinue worlds sit below half on more than ${TOO_TIGHT_SHARE * 100} % of ticks on every seed (too tight)`);
}

if (failures.length > 0) {
  console.log('KILL CRITERIA TRIPPED:');
  for (const f of failures) console.log(`  - ${f}`);
  process.exitCode = 1;
} else {
  console.log('Kill criteria: all hold.');
}
