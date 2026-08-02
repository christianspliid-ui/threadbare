/**
 * THR-821 measurement — capability vs difficulty headroom for the nudge model.
 *
 * Answers the ticket's one distinguishing question: is the exemplar deliberately
 * brutal (content), or do seeded mortals genuinely lack capability so that every
 * step above `fair` floors for them (tuning/engine)?
 *
 * Measures, per seed:
 *   1. computeCapability(agent, reach) across every individual actor, bucketed by
 *      spotlightTier — because `ambient` npc_* nodes are seeded with NO
 *      domainCapabilities property at all, while worldSeed's ind_* nodes get all
 *      eight reaches at 10..40.
 *   2. The difficulty distribution of every shipped encounter step, which is the
 *      population WS5 converts to nudge points.
 *   3. Headroom = capability - difficulty, against PROBABILITY_FLOOR. A step is
 *      "nudge-reachable" for an actor when a plausible hand can lift the raw
 *      threshold above the floor and keep it there.
 *
 * Usage: npm run measure:nudge-headroom [-- --seeds 42,99 --ticks 0]
 */

import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { computeCapability } from '../src/engine/domainCapability';
import { PROBABILITY_FLOOR } from '../src/engine/resolutionService';
import { UNIFIED_ACTION_TEMPLATES } from '../src/data/unified-action-templates';
import { NUDGE_GOLDEN_EXEMPLAR } from '../src/data/__fixtures__/nudge-exemplar/swollen-ford-exemplar';
import { REACH_DOMAINS } from '../src/types/traits';
import type { ReachDomain } from '../src/types/traits';
import { NPC_CONSTANTS } from '../src/types/npc';

// ─── Args ────────────────────────────────────────────────────────

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const SEEDS = (argValue('--seeds') ?? '42,99').split(',').map((s) => parseInt(s.trim(), 10));
const TICKS = parseInt(argValue('--ticks') ?? '0', 10);
const MAP: MapSizePreset = (argValue('--map') ?? 'medium') as MapSizePreset;

// ─── Helpers ─────────────────────────────────────────────────────

function quantiles(values: number[]): { min: number; p25: number; p50: number; p75: number; max: number; mean: number } {
  if (values.length === 0) return { min: NaN, p25: NaN, p50: NaN, p75: NaN, max: NaN, mean: NaN };
  const s = [...values].sort((a, b) => a - b);
  const at = (q: number) => s[Math.min(s.length - 1, Math.floor(q * s.length))];
  return {
    min: s[0],
    p25: at(0.25),
    p50: at(0.5),
    p75: at(0.75),
    max: s[s.length - 1],
    mean: s.reduce((a, b) => a + b, 0) / s.length,
  };
}

const f2 = (n: number) => (Number.isFinite(n) ? n.toFixed(3) : '  n/a');

function initState(seed: number) {
  resetEventCounter();
  const archetypes = generateArchetypes(4, seed);
  const cosmology = createBalancedCosmology();
  const preset = MAP_SIZE_PRESETS[MAP];
  const { state } = initializeGameState(
    archetypes[0],
    'MeasureBot',
    cosmology,
    seed,
    preset.cols,
    preset.rows,
  );
  const runtime = createSimulationRuntime();
  for (let i = 0; i < TICKS; i++) runTick(state, runtime);
  return state;
}

// ─── Main ────────────────────────────────────────────────────────

console.log('THR-821 — nudge headroom measurement');
console.log(`seeds=${SEEDS.join(',')} map=${MAP} ticks=${TICKS} PROBABILITY_FLOOR=${PROBABILITY_FLOOR}`);
console.log('');

// ── Part 2 (seed-independent): shipped step difficulty distribution ──

const allStepDifficulties: number[] = [];
let stepsTotal = 0;
let stepsWithNudges = 0;
const byDifficultyBand = { gentle: 0, fair: 0, steep: 0, severe: 0 };

for (const tmpl of UNIFIED_ACTION_TEMPLATES) {
  for (const step of tmpl.steps ?? []) {
    stepsTotal++;
    if (step.nudges && step.nudges.length > 0) stepsWithNudges++;
    const d = step.difficulty ?? 0;
    allStepDifficulties.push(d);
    if (d >= 0.6) byDifficultyBand.severe++;
    else if (d >= 0.45) byDifficultyBand.steep++;
    else if (d >= 0.3) byDifficultyBand.fair++;
    else byDifficultyBand.gentle++;
  }
}

const dq = quantiles(allStepDifficulties);
console.log('=== Shipped encounter step difficulty (UNIFIED_ACTION_TEMPLATES) ===');
console.log(`templates=${UNIFIED_ACTION_TEMPLATES.length} steps=${stepsTotal} steps carrying nudges[]=${stepsWithNudges}`);
console.log(`difficulty  min=${f2(dq.min)} p25=${f2(dq.p25)} p50=${f2(dq.p50)} p75=${f2(dq.p75)} max=${f2(dq.max)} mean=${f2(dq.mean)}`);
console.log(`bands  gentle(<0.30)=${byDifficultyBand.gentle}  fair(0.30-0.45)=${byDifficultyBand.fair}  steep(0.45-0.60)=${byDifficultyBand.steep}  severe(>=0.60)=${byDifficultyBand.severe}`);
console.log('');
console.log('Exemplar step difficulties: ' + NUDGE_GOLDEN_EXEMPLAR.steps.map((s) => s.difficulty).join(', '));
console.log('');

// ── Part 1b: the notable tier, computed exactly from NPC_CONSTANTS ──
//
// A live seed carries no notable NPCs at tick 0 — the tier is reached by
// graduation (importance >= NOTABLE_THRESHOLD), which is the tier a mortal the
// player has just threaded lands in. Its capability is a uniform integer range
// through the sigmoid, so it can be enumerated exactly rather than sampled.

console.log('=== Notable tier capability (exact, from NPC_CONSTANTS) ===');
console.log('the tier a newly-threaded NPC lands in — NOTABLE_THRESHOLD=' +
  `${NPC_CONSTANTS.NOTABLE_THRESHOLD}, IMPORTANCE_PLAYER_ACTION=${NPC_CONSTANTS.IMPORTANCE_PLAYER_ACTION}`);

const SIGMOID_MIDPOINT = 10;
const SIGMOID_K = 0.4;
const sig = (x: number) => 1 / (1 + Math.exp(-SIGMOID_K * (x - SIGMOID_MIDPOINT)));

const notableRoles = [
  { label: 'primary  ', base: NPC_CONSTANTS.NOTABLE_PRIMARY_BASE, range: NPC_CONSTANTS.NOTABLE_PRIMARY_RANGE },
  { label: 'secondary', base: NPC_CONSTANTS.NOTABLE_SECONDARY_BASE, range: NPC_CONSTANTS.NOTABLE_SECONDARY_RANGE },
  { label: 'other    ', base: NPC_CONSTANTS.NOTABLE_OTHER_BASE, range: NPC_CONSTANTS.NOTABLE_OTHER_RANGE },
];

for (const role of notableRoles) {
  const caps: number[] = [];
  for (let raw = role.base; raw < role.base + role.range; raw++) caps.push(sig(raw));
  const q = quantiles(caps);
  console.log(
    `${role.label}  raw=${role.base}..${role.base + role.range - 1}` +
    `  capability min=${f2(q.min)} p50=${f2(q.p50)} max=${f2(q.max)}`,
  );
}
console.log('');

console.log('Notable-tier reachability — fraction above PROBABILITY_FLOOR:');
console.log('reach role   difficulty   unaided   +2 cards(0.22)  +cap(0.20)  +full hand(0.37)');
for (const d of [0.26, 0.45, 0.6]) {
  for (const role of notableRoles) {
    const caps: number[] = [];
    for (let raw = role.base; raw < role.base + role.range; raw++) caps.push(sig(raw));
    const above = (bonus: number) =>
      (caps.filter((c) => c - d + bonus > PROBABILITY_FLOOR).length / caps.length * 100).toFixed(0);
    console.log(
      `${role.label}    d=${f2(d)}   ${above(0).padStart(6)}%` +
      `        ${above(0.22).padStart(5)}%` +
      `      ${above(0.20).padStart(5)}%` +
      `           ${above(0.37).padStart(5)}%`,
    );
  }
}
console.log('');

// ── Part 1 + 3 (per seed): capability distribution and headroom ──

interface TierBucket {
  count: number;
  withCaps: number;
  capsAll: number[];             // every (agent, reach) capability
  perReach: Map<ReachDomain, number[]>;
}

function newBucket(): TierBucket {
  return { count: 0, withCaps: 0, capsAll: [], perReach: new Map(REACH_DOMAINS.map((r) => [r, [] as number[]])) };
}

for (const seed of SEEDS) {
  const state = initState(seed);
  const graph = state.graph;

  const buckets = new Map<string, TierBucket>();
  const getBucket = (k: string) => {
    let b = buckets.get(k);
    if (!b) { b = newBucket(); buckets.set(k, b); }
    return b;
  };

  for (const node of graph.getNodesByType('actor')) {
    if (node.properties.actorType !== 'individual') continue;
    const tier = (node.properties.spotlightTier as string | undefined) ?? '(none)';
    const b = getBucket(tier);
    b.count++;
    if (node.properties.domainCapabilities) b.withCaps++;
    for (const reach of REACH_DOMAINS) {
      const cap = computeCapability(graph, node.id, reach);
      b.capsAll.push(cap);
      b.perReach.get(reach)!.push(cap);
    }
  }

  console.log(`=== seed ${seed} — individual actors by spotlightTier ===`);
  for (const [tier, b] of [...buckets.entries()].sort()) {
    const q = quantiles(b.capsAll);
    console.log(
      `${tier.padEnd(10)} n=${String(b.count).padStart(5)}  withDomainCapabilities=${String(b.withCaps).padStart(5)}` +
      `  capability p25=${f2(q.p25)} p50=${f2(q.p50)} p75=${f2(q.p75)} max=${f2(q.max)}`,
    );
  }
  console.log('');

  // Headroom: for the exemplar's two step difficulties, and for the shipped p50,
  // how many (agent,reach) pairs sit above the floor unaided, and how many are
  // liftable by a hand of the exemplar's magnitude?
  const HAND_TWO_CARDS = 0.22;   // two typical exemplar cards (0.10 + 0.12)
  const HAND_FULL = 0.37;        // the ticket's measured full playable hand

  const probes = [
    { label: 'exemplar step 0 (eye)', difficulty: 0.45 },
    { label: 'exemplar step 1 (shadow)', difficulty: 0.6 },
    { label: 'shipped p50', difficulty: dq.p50 },
    { label: 'shipped p25', difficulty: dq.p25 },
  ];

  console.log(`=== seed ${seed} — headroom (fraction of (agent,reach) pairs above PROBABILITY_FLOOR) ===`);
  console.log('difficulty probe                 tier        unaided   +2 cards  +full hand');
  for (const probe of probes) {
    for (const [tier, b] of [...buckets.entries()].sort()) {
      const n = b.capsAll.length;
      if (n === 0) continue;
      const above = (bonus: number) =>
        (b.capsAll.filter((c) => c - probe.difficulty + bonus > PROBABILITY_FLOOR).length / n);
      console.log(
        `${probe.label.padEnd(24)} d=${f2(probe.difficulty)} ${tier.padEnd(10)}` +
        ` ${(above(0) * 100).toFixed(1).padStart(7)}%` +
        ` ${(above(HAND_TWO_CARDS) * 100).toFixed(1).padStart(9)}%` +
        ` ${(above(HAND_FULL) * 100).toFixed(1).padStart(10)}%`,
      );
    }
  }
  console.log('');
}
