/**
 * Colocation census — THR-1576 Done-when evidence (CLI / headless, THR-688 rule C).
 *
 * Colocation detection used to multiply the *raw* Eye / Shadow capability (≈ 10–40
 * for a protagonist) by weights written for a 0–1 scale, so every pair's chance sat
 * at the floor (0.01) or the ceiling (0.95). THR-1576 moves it onto the reach share.
 *
 * This census walks the live world tick by tick and, for every co-located pair the
 * phase would roll, computes the chance on **both** formulas against the same graph:
 *
 *   before: clamp(base + rawEye × 0.15 − rawShadow × 0.15)
 *   after:  the shipped `detectionChance` (reach share, re-tuned weights)
 *
 * It reports the pinned fraction (chance at floor or ceiling), the chance spread, and
 * the expected detections per tick (sum of chances) — the colocation-encounter rate.
 * Both arms are computed in one run on the same pairs, so the comparison is exact.
 *
 * Usage:
 *   npm run census:colocation                      # seeds 42,99; ticks 1..60; medium
 *   npm run census:colocation -- --seeds 42 --ticks 30
 */

import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits';
import { computeRawScore } from '../src/engine/domainCapability';
import { detectionChance, getBaseChance } from '../src/engine/phaseColocationDetection';
import { DETECTION_CHANCE_FLOOR, DETECTION_CHANCE_CEILING } from '../src/data/colocation-content';
import type { GameState } from '../src/types/gameState';

/** The pre-THR-1576 weights, kept here so the before arm is exact. */
const LEGACY_WEIGHT = 0.15;

const argv = process.argv.slice(2);
function arg(name: string): string | undefined {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}
const seeds = (arg('--seeds') ?? '42,99').split(',').map(Number);
const ticks = Number(arg('--ticks') ?? 60);
const map = (arg('--map') ?? 'medium') as MapSizePreset;

interface Arm { pairs: number; floor: number; ceiling: number; sum: number; chances: number[] }
const newArm = (): Arm => ({ pairs: 0, floor: 0, ceiling: 0, sum: 0, chances: [] });

function record(arm: Arm, chance: number): void {
  arm.pairs++;
  arm.sum += chance;
  arm.chances.push(chance);
  if (chance <= DETECTION_CHANCE_FLOOR) arm.floor++;
  if (chance >= DETECTION_CHANCE_CEILING) arm.ceiling++;
}

function samplePairs(state: GameState, before: Arm, after: Arm, capBefore: Arm, capAfter: Arm): void {
  const graph = state.graph;
  const byLoc = new Map<string, string[]>();
  for (const a of graph.getNodesByType('actor')) {
    if (a.properties?.actorType !== 'individual') continue;
    const loc = graph.getOutgoingEdges(a.id, 'located_at')[0]?.target;
    if (!loc) continue;
    if (!byLoc.has(loc)) byLoc.set(loc, []);
    byLoc.get(loc)!.push(a.id);
  }
  for (const [locId, ids] of byLoc) {
    if (ids.length < 2) continue;
    const base = getBaseChance(graph.getNode(locId)?.properties?.locationType as string | undefined);
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const obs = graph.getNode(ids[i])!;
        const tgt = graph.getNode(ids[j])!;
        const rawEye = (obs.properties?.domainCapabilities as Record<string, number>)?.eye ?? 0;
        const rawShadow = (tgt.properties?.domainCapabilities as Record<string, number>)?.shadow ?? 0;
        const b = Math.max(DETECTION_CHANCE_FLOOR, Math.min(DETECTION_CHANCE_CEILING,
          base + rawEye * LEGACY_WEIGHT - rawShadow * LEGACY_WEIGHT));
        const a = detectionChance(graph, ids[i], ids[j], base);
        record(before, b);
        record(after, a);
        // Capable pairs: both carry a capability bag — the pairs the formula can move.
        if (obs.properties?.domainCapabilities && tgt.properties?.domainCapabilities) {
          record(capBefore, b);
          record(capAfter, a);
        }
      }
    }
  }
  // Keep computeRawScore referenced so a tree without the effective walk fails loud.
  void computeRawScore;
}

function pct(n: number, d: number): string {
  return d === 0 ? '—' : `${((n / d) * 100).toFixed(1)}%`;
}
function quantile(xs: number[], q: number): string {
  if (xs.length === 0) return '—';
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(q * s.length))].toFixed(3);
}
function distinct(xs: number[]): number {
  return new Set(xs.map(x => x.toFixed(3))).size;
}

for (const seed of seeds) {
  const preset = MAP_SIZE_PRESETS[map];
  resetEventCounter();
  resetReputationTraitInit();
  let { state } = initializeGameState(
    generateArchetypes(4, seed)[0], 'Census', createBalancedCosmology(), seed, preset.cols, preset.rows,
  );
  const runtime = createSimulationRuntime();
  const before = newArm();
  const after = newArm();
  const capBefore = newArm();
  const capAfter = newArm();
  while (state.tick < ticks) {
    state = runTick(state, [], runtime);
    samplePairs(state, before, after, capBefore, capAfter);
  }
  console.log(`\n=== seed ${seed} · ${map} · ticks 1..${ticks} · ${before.pairs} pair-rolls ===`);
  for (const [name, a] of [
    ['all pairs      before', before], ['all pairs      after ', after],
    ['capable pairs  before', capBefore], ['capable pairs  after ', capAfter],
  ] as const) {
    console.log(
      `${name}  pinned floor ${pct(a.floor, a.pairs)}  ceiling ${pct(a.ceiling, a.pairs)}  ` +
      `p10/p50/p90 ${quantile(a.chances, 0.1)}/${quantile(a.chances, 0.5)}/${quantile(a.chances, 0.9)}  ` +
      `distinct ${distinct(a.chances)}  expected detections/tick ${(a.sum / ticks).toFixed(2)}  ` +
      `mean chance ${(a.sum / Math.max(1, a.pairs)).toFixed(3)}`,
    );
  }
}
