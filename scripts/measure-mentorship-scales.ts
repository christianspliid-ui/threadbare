/**
 * THR-1580 — mentorship: which capability scale should the mentor/apprentice tier gates read?
 *
 * One family, two modules, all `computeTier(capability)` = ceil(capability × 10):
 *   - `mentorshipUndertaking.findEligibleApprentices` — mentor tier ≥ MENTOR_MIN_TIER (6),
 *     apprentice tier in [APPRENTICE_MIN_TIER, APPRENTICE_MAX_TIER] (2–4), colocated;
 *   - `mentorshipOutcomes.resolveMentorship` — apprentice tier ≥ mentor tier +
 *     SURPASSING_TIER_DELTA (0) turns a graduation into a Surpassing.
 * They read the pre-refit curve (midpoint 10, k 0.4), which saturates at raw ~15.5 (tier 10).
 * This script measures, for every living individual, what each scale would give: who may
 * teach, who may learn, how many legal (mentor, apprentice, reach) pairs exist, how many
 * mentors have one, and how much raw an apprentice must gain before Surpassing fires.
 * With `--ticks N` it also counts the `mentors` edges the live run minted (run it on the
 * tree before and after the change for the behavioural before/after).
 *
 * Time: a few seconds per seed at --ticks 0 (world generation only); each tick adds ≈0.8 s
 *       per seed on medium.
 * Usage: npm run measure:mentorship-scales [-- --seeds 42,99,7 --ticks 0 --map medium]
 */

import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import {
  computeRawScore,
  computeTier,
  SIGMOID_MIDPOINT,
  SIGMOID_K,
  PRE_REFIT_SIGMOID_MIDPOINT,
  PRE_REFIT_SIGMOID_K,
} from '../src/engine/domainCapability';
import { rawToReachShare } from '../src/data/reach-share-constants';
import {
  MENTOR_MIN_TIER,
  APPRENTICE_MIN_TIER,
  APPRENTICE_MAX_TIER,
  SURPASSING_TIER_DELTA,
} from '../src/data/mentorship-constants';
import { REACH_DOMAINS, type ReachDomain } from '../src/types/traits';
import { getAgentLocationId } from '../src/engine/graphQueries';
import { resolveToParentLocation } from '../src/engine/sublocationShape';

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const SEEDS = (argValue('--seeds') ?? '42,99,7').split(',').map((s) => parseInt(s.trim(), 10));
const TICKS = parseInt(argValue('--ticks') ?? '0', 10);
const MAP: MapSizePreset = (argValue('--map') ?? 'medium') as MapSizePreset;

function initState(seed: number) {
  resetEventCounter();
  const archetypes = generateArchetypes(4, seed);
  const preset = MAP_SIZE_PRESETS[MAP];
  let { state } = initializeGameState(archetypes[0], 'MeasureBot', createBalancedCosmology(), seed, preset.cols, preset.rows);
  const runtime = createSimulationRuntime();
  for (let i = 0; i < TICKS; i++) state = runTick(state, [], runtime);
  return state;
}

const sigmoid = (x: number, mid = SIGMOID_MIDPOINT, k = SIGMOID_K) => 1 / (1 + Math.exp(-k * (x - mid)));
const SCALES: Record<string, (raw: number) => number> = {
  preRefit: (raw) => sigmoid(raw, PRE_REFIT_SIGMOID_MIDPOINT, PRE_REFIT_SIGMOID_K),
  dice: (raw) => sigmoid(raw),
  reachShare: rawToReachShare,
};
const tierOf = (curve: (raw: number) => number, raw: number) => computeTier(curve(Number.isFinite(raw) ? raw : 0));
const pct = (n: number, d: number) => (d === 0 ? '  n/a' : `${((100 * n) / d).toFixed(1).padStart(5)}%`);
const q = (s: number[], p: number) => (s.length === 0 ? 'n/a' : s[Math.min(s.length - 1, Math.floor(p * s.length))].toFixed(1));

/** Smallest raw (0.5 steps, to 80) whose tier clears `tier`; Infinity when none does. */
function rawToReach(curve: (raw: number) => number, tier: number): number {
  for (let r = 0; r <= 80; r += 0.5) if (tierOf(curve, r) >= tier) return r;
  return Infinity;
}

console.log(`THR-1580 mentorship scales — seeds=${SEEDS.join(',')} map=${MAP} ticks=${TICKS}`);

for (const seed of SEEDS) {
  const graph = initState(seed).graph;
  const people = graph
    .getNodesByType('actor')
    .filter((n) => n.properties.actorType === 'individual' && n.properties.deceased !== true);

  const raws = new Map<string, Record<ReachDomain, number>>();
  const place = new Map<string, string>();
  for (const p of people) {
    const r = {} as Record<ReachDomain, number>;
    for (const d of REACH_DOMAINS) r[d] = computeRawScore(graph, p.id, d);
    raws.set(p.id, r);
    const loc = getAgentLocationId(graph, p.id);
    if (loc) place.set(p.id, resolveToParentLocation(graph, graph.getNode(loc))?.id ?? loc);
  }
  const best = people.map((p) => Math.max(...REACH_DOMAINS.map((d) => raws.get(p.id)![d]))).sort((a, b) => a - b);
  const mentorEdges = graph.getAllEdges().filter((e) => e.type === 'mentors');

  console.log(`\nseed ${seed}: living individuals=${people.length}  mentors edges at t${TICKS}=${mentorEdges.length}` +
    `  (graduated ${mentorEdges.filter((e) => e.properties.phase === 'graduated').length})`);
  console.log(`  best-reach raw p50/p90/p99 = ${q(best, 0.5)}/${q(best, 0.9)}/${q(best, 0.99)}`);

  const byPlace = new Map<string, string[]>();
  for (const [id, loc] of place) byPlace.set(loc, [...(byPlace.get(loc) ?? []), id]);

  for (const [name, curve] of Object.entries(SCALES)) {
    let mentorPeople = 0;
    let learnerSlots = 0;
    let pairs = 0;
    let mentorsWithPick = 0;
    const gains: number[] = [];
    for (const p of people) {
      const r = raws.get(p.id)!;
      const teaches = REACH_DOMAINS.filter((d) => tierOf(curve, r[d]) >= MENTOR_MIN_TIER);
      if (teaches.length > 0) mentorPeople++;
      learnerSlots += REACH_DOMAINS.filter((d) => {
        const t = tierOf(curve, r[d]);
        return t >= APPRENTICE_MIN_TIER && t <= APPRENTICE_MAX_TIER;
      }).length;
      const loc = place.get(p.id);
      if (!loc || teaches.length === 0) continue;
      let mine = 0;
      for (const d of teaches) {
        const mentorTier = tierOf(curve, r[d]);
        const needRaw = rawToReach(curve, mentorTier + SURPASSING_TIER_DELTA);
        for (const c of byPlace.get(loc) ?? []) {
          if (c === p.id) continue;
          const t = tierOf(curve, raws.get(c)![d]);
          if (t < APPRENTICE_MIN_TIER || t > APPRENTICE_MAX_TIER) continue;
          mine++;
          gains.push(needRaw - raws.get(c)![d]);
        }
      }
      pairs += mine;
      if (mine > 0) mentorsWithPick++;
    }
    gains.sort((a, b) => a - b);
    console.log(
      `  ${name.padEnd(10)} mentor gate raw>=${String(rawToReach(curve, MENTOR_MIN_TIER)).padStart(4)}` +
        `  apprentice band raw ${rawToReach(curve, APPRENTICE_MIN_TIER)}–<${rawToReach(curve, APPRENTICE_MAX_TIER + 1)}` +
        `  can teach=${pct(mentorPeople, people.length)}  learner reach-slots=${pct(learnerSlots, people.length * REACH_DOMAINS.length)}` +
        `  legal pairs=${pairs}  mentors with a pick=${mentorsWithPick}/${mentorPeople}` +
        `  raw gain to surpass p10/p50/p90=${q(gains, 0.1)}/${q(gains, 0.5)}/${q(gains, 0.9)}`,
    );
  }
}
