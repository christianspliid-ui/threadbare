/**
 * Undertaking checkpoints — liveness in the real simulation (THR-1292 §2).
 *
 * The unit tests next door prove the mechanics: the band table is total, the fork
 * decides both ways, the gates defer. None of them can catch the failure this
 * slice actually hit — that the dice, correct in isolation, **almost never roll in
 * the world**.
 *
 * Measured before the §5 conversion default was corrected: of 736 checkpoints on a
 * 150-tick seed-42 run, 50 rolled and 686 deferred `actor_absent`, because nothing
 * moves an agent toward its stage yet. Every unit test stayed green throughout.
 * This is the guard that would have been red, so it runs the real
 * `initializeGameState → runTick` pipeline and asserts the population, not a
 * fixture.
 *
 * Deliberately one seed and a short horizon: it is a liveness canary, not a
 * balance measurement. The full two-seed 150-tick census belongs in the closeout
 * evidence, where it costs ~37s that the suite should not pay every run.
 */

import { describe, it, expect } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { runTick } from '../orchestrator';
import { createBalancedCosmology } from '../cosmology';
import { generateArchetypes } from '../ascendant';
import { createSimulationRuntime } from '../simulationRuntime';
import { enableTracing, clearTraces, getTraces } from '../traceBuffer';
import { MOMENT_QUEUE_MAX } from '../../data/strategic-action-constants';

const SEED = 42;
const TICKS = 60;

describe('undertaking checkpoints run in the live simulation', () => {
  it('rolls dice for the large majority of due checkpoints', () => {
    clearTraces();
    enableTracing();
    const runtime = createSimulationRuntime();
    const archetype = generateArchetypes(4, SEED)[0];
    const preset = MAP_SIZE_PRESETS.medium;
    let { state } = initializeGameState(
      archetype, 'liveness', createBalancedCosmology(), SEED, preset.cols, preset.rows,
    );

    // Drained per tick: the trace buffer is a ring, so an end-of-run read reports
    // only the tail — which is how the original census under-counted by 15×.
    const checkpoints: any[] = [];
    for (let i = 0; i < TICKS; i++) {
      clearTraces();
      state = runTick(state, [], runtime);
      for (const t of getTraces()) {
        if (t.category === 'undertaking_checkpoint') checkpoints.push(t);
      }
    }

    expect(checkpoints.length, 'no checkpoint ever fired — the phase is not wired').toBeGreaterThan(0);

    const rolled = checkpoints.filter(t => t.band);
    expect(rolled.length, 'checkpoints fired but none rolled — the dice are inert').toBeGreaterThan(0);

    // The specific regression: deferrals swamping the rolls. A bare
    // `rolled > 0` would have passed on the broken default (50 of 736 rolled).
    expect(rolled.length / checkpoints.length).toBeGreaterThan(0.5);

    // And the ladder is genuinely being exercised, not pinned to one band.
    expect(new Set(rolled.map(t => t.band)).size).toBeGreaterThan(1);

    // The moment queue (THR-1299 slice 2) is wired into the same run — the failure
    // this guards is a producer that builds records nobody merges into GameState,
    // which every unit test on `resolveUndertakingCheckpoint` would pass through.
    // A CLI world follows nobody, so the interrupt arm is unreachable here by
    // construction and asserted in the unit tests; what this proves is that the
    // records land, the cap holds, and nothing resolves louder than a badge.
    const queue = state.pendingUndertakingMoments ?? [];
    expect(queue.length, 'no moment ever queued — the phases do not merge the records').toBeGreaterThan(0);
    expect(queue.length).toBeLessThanOrEqual(MOMENT_QUEUE_MAX);
    expect(queue.every(m => m.presentation !== 'interrupt')).toBe(true);
    expect(queue.some(m => m.momentClass === 'started'), 'no founding queued — the dead started branch is still dead').toBe(true);
  }, 120_000);
});
