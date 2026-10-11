/**
 * THR-1580 — capability growth: which capability scale should `applyEncounterGrowth` read?
 *
 * One reader, two uses, both in `capabilityGrowth.applyEncounterGrowth`:
 *   - the diminishing-returns damping `max(1 − cap × DIMINISHING_RETURNS_FACTOR, 0.1)` on
 *     every successful step's growth;
 *   - `tierCrossed` = `computeTier(cap after) > computeTier(cap before)`, which fires
 *     `handleTierPromotion` (a named trait at even tiers, a `member_of.rank` bump for
 *     reach-aligned factions) and the `tier_promotion` event + calling recompute.
 * Both read the pre-refit curve (midpoint 10, k 0.4), which reads tier 10 from raw ~15.5 —
 * below most protagonists' worldgen roll (10 + rand(31)) — so for them growth is floored
 * and no tier ever turns over again.
 *
 * Model: successful steps (difficulty 50, not promotion-eligible) from a starting raw to
 * each next tier, per scale. Live (`--ticks N`): run the tree's real tick loop and count
 * `tier_promotion` events, promotion-trait edges, encounter experience accrued and the
 * `member_of.rank` written by promotions — run it on the tree before and after the change
 * for the behavioural before/after.
 *
 * Usage: npm run measure:capability-growth-scales [-- --seeds 42,99,7 --ticks 300 --map medium]
 */

import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import {
  computeTier,
  SIGMOID_MIDPOINT,
  SIGMOID_K,
  PRE_REFIT_SIGMOID_MIDPOINT,
  PRE_REFIT_SIGMOID_K,
} from '../src/engine/domainCapability';
import { computeGrowthAmount } from '../src/engine/capabilityGrowth';
import { rawToReachShare } from '../src/data/reach-share-constants';

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const SEEDS = (argValue('--seeds') ?? '42,99,7').split(',').map((s) => parseInt(s.trim(), 10));
const TICKS = parseInt(argValue('--ticks') ?? '300', 10);
const MAP: MapSizePreset = (argValue('--map') ?? 'medium') as MapSizePreset;

const sigmoid = (x: number, mid = SIGMOID_MIDPOINT, k = SIGMOID_K) => 1 / (1 + Math.exp(-k * (x - mid)));
const SCALES: Record<string, (raw: number) => number> = {
  preRefit: (raw) => sigmoid(raw, PRE_REFIT_SIGMOID_MIDPOINT, PRE_REFIT_SIGMOID_K),
  dice: (raw) => sigmoid(raw),
  reachShare: rawToReachShare,
};

// ─── Model ───────────────────────────────────────────────────────────────

const STARTS = [0, 5, 10, 15, 20, 25, 30, 35];
const CAP = 500;
console.log(`THR-1580 capability growth scales — model (successful steps, difficulty 50, not promotion-eligible)`);
console.log(` start raw → tier at start · growth per step at start · steps to the next tier crossing (cap ${CAP})`);
for (const [name, curve] of Object.entries(SCALES)) {
  const cells = STARTS.map((r0) => {
    const t0 = computeTier(curve(r0));
    const g0 = computeGrowthAmount(50, true, false, curve(r0));
    let raw = r0;
    let steps: number | null = null;
    for (let n = 1; n <= CAP; n++) {
      raw += computeGrowthAmount(50, true, false, curve(raw));
      if (computeTier(curve(raw)) > t0) { steps = n; break; }
    }
    return `r${r0}:t${t0}·${g0.toFixed(2)}·${steps ?? '—'}`;
  });
  console.log(`  ${name.padEnd(10)} ${cells.join('  ')}`);
}

// ─── Live ────────────────────────────────────────────────────────────────

if (TICKS > 0) {
  console.log(`\nLive (this tree's tick loop), ${TICKS} ticks, map=${MAP}:`);
  for (const seed of SEEDS) {
    resetEventCounter();
    const archetypes = generateArchetypes(4, seed);
    const preset = MAP_SIZE_PRESETS[MAP];
    let { state } = initializeGameState(archetypes[0], 'MeasureBot', createBalancedCosmology(), seed, preset.cols, preset.rows);
    const runtime = createSimulationRuntime();
    let promotionEvents = 0;
    const promotedAgents = new Set<string>();
    const byTier: Record<number, number> = {};
    for (let i = 0; i < TICKS; i++) {
      state = runTick(state, [], runtime);
      for (const e of state.tickEvents ?? []) {
        if (e.type === 'tier_promotion' && /tier \d+:/.test(e.message ?? '')) {
          promotionEvents++;
          if (e.actorId) promotedAgents.add(e.actorId);
          const t = parseInt(/tier (\d+):/.exec(e.message ?? '')?.[1] ?? '0', 10);
          byTier[t] = (byTier[t] ?? 0) + 1;
        }
      }
    }
    let promoTraitEdges = 0;
    let expEdges = 0;
    let expLevel = 0;
    let rankSum = 0;
    let rankedMembers = 0;
    for (const edge of state.graph.getAllEdges()) {
      if (edge.type === 'has_trait' && edge.properties.source === 'tier_promotion') promoTraitEdges++;
      if (edge.type === 'has_trait' && edge.properties.source === 'encounter_growth') {
        expEdges++;
        expLevel += (edge.properties.level as number) ?? 0;
      }
      if (edge.type === 'member_of') {
        const rank = typeof edge.properties.rank === 'number' ? edge.properties.rank : 0;
        if (rank > 0) rankedMembers++;
        rankSum += rank;
      }
    }
    console.log(
      `  seed ${seed}: tier_promotion events=${promotionEvents} (agents ${promotedAgents.size}; by tier ${Object.entries(byTier).map(([t, n]) => `t${t}×${n}`).join(' ')})` +
        ` · promotion-trait edges=${promoTraitEdges}` +
        ` · experience edges=${expEdges} total raw=${expLevel.toFixed(1)}` +
        ` · member_of rank>0=${rankedMembers} Σrank=${rankSum.toFixed(2)}`,
    );
  }
}
