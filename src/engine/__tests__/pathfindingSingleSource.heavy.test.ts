// @vitest-lane heavy
/**
 * THR-1389 — on a real seeded world the single-source map and the per-destination run
 * agree on every reachable destination (cost and path), and one single-source run is
 * cheap enough that a company's whole re-decision costs less than one old sweep.
 *
 * Heavy lane: builds seed 42 small and runs 60 ticks so roads and companies exist.
 */
import { describe, it, expect } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { runTick } from '../orchestrator';
import { createBalancedCosmology } from '../cosmology';
import { generateArchetypes } from '../ascendant';
import { createSimulationRuntime } from '../simulationRuntime';
import { findShortestPath, findAllShortestPaths } from '../pathfinding';
import { getLocationNodes } from '../sublocationShape';

const SEED = 42;
const TICKS = 60;
const STARTS = 8;
/** Worldgen + 60 ticks + 8 sweeps took 4.4 s alone; the default 5 s timed out under the full heavy lane. */
const TEST_TIMEOUT_MS = 120_000;
/**
 * One single-source run must beat the per-destination sweep it replaces by at least this
 * factor, measured in the same process so machine load cancels out (a wall-clock ceiling
 * failed under sibling contention — measured 0.44 ms alone, ~380× cheaper than the sweep).
 */
const MIN_SPEEDUP = 10;

describe('single-source shortest paths on a seeded world (THR-1389)', () => {
  it('agrees with the per-destination run on every reachable destination, and is cheap', () => {
    const runtime = createSimulationRuntime();
    const archetype = generateArchetypes(4, SEED)[0];
    const preset = MAP_SIZE_PRESETS.small;
    let { state } = initializeGameState(archetype, 'thr-1389', createBalancedCosmology(), SEED, preset.cols, preset.rows);
    for (let i = 0; i < TICKS; i++) state = runTick(state, [], runtime);
    const graph = state.graph;
    const place = getLocationNodes(graph).map(n => n.id).sort();
    const agentId = graph.getNodesByType('actor').find(n => (n.properties.actorType ?? 'individual') === 'individual')!.id;
    const starts = place.filter((_, i) => i % Math.max(1, Math.floor(place.length / STARTS)) === 0).slice(0, STARTS);
    expect(starts.length).toBeGreaterThan(0);

    let compared = 0;
    let singleSourceMs = 0;
    let sweepMs = 0;
    for (const startId of starts) {
      const t0 = performance.now();
      const all = findAllShortestPaths(graph, agentId, startId);
      singleSourceMs += performance.now() - t0;
      // an isolated start (no adjacent or road edge) legitimately prices nothing — the
      // reachability loop below still checks the per-destination run agrees it is isolated
      for (const [id, viaMap] of all) {
        const one = findShortestPath(graph, agentId, startId, id);
        expect(one, `${startId} → ${id}`).not.toBeNull();
        expect(viaMap.totalCost, `${startId} → ${id}`).toBeCloseTo(one!.totalCost, 9);
        expect(viaMap.path, `${startId} → ${id}`).toEqual(one!.path);
        compared++;
      }
      // and nothing the per-destination run can reach is missing from the map — this loop is
      // exactly the sweep generateMovementCandidates used to run, so it is also the timing arm
      const t1 = performance.now();
      const reachable = new Map<string, boolean>();
      for (const id of place) {
        if (id === startId) continue;
        reachable.set(id, findShortestPath(graph, agentId, startId, id) !== null);
      }
      sweepMs += performance.now() - t1;
      for (const [id, isReachable] of reachable) expect(all.has(id), `${startId} → ${id}`).toBe(isReachable);
    }
    expect(compared, 'at least one start must reach something').toBeGreaterThan(STARTS);
    expect(sweepMs / Math.max(singleSourceMs, 1e-6), `sweep ${sweepMs.toFixed(1)} ms vs single-source ${singleSourceMs.toFixed(2)} ms`).toBeGreaterThan(MIN_SPEEDUP);
  }, TEST_TIMEOUT_MS);
});
