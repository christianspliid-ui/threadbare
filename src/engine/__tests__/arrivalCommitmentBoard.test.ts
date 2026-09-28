// @vitest-lane heavy — builds a medium world and drives it 100 ticks (THR-1384)
/**
 * A mortal who walks to an encounter starts it on arrival (THR-1668).
 *
 * THR-1639's arrival commitment scaled `finalScore`; the live unified board ranks
 * encounters on `valuePerTick × desire × fit` and never read it, so the commitment
 * was dead and 80% of journeys ended with the mortal choosing something else. This
 * pins the wiring on a real world: the committed goal reaches the board (the entry
 * carries `arrivalCommitment` on the `decision_board_comparison` trace) and wins
 * most of those decisions. The full measurement is `readers/journeys.ts`.
 */
import { describe, it, expect, afterAll } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { runTick, resetEventCounter } from '../orchestrator';
import { createBalancedCosmology } from '../cosmology';
import { generateArchetypes } from '../ascendant';
import { createSimulationRuntime } from '../simulationRuntime';
import { resetReputationTraitInit } from '../phaseReputationTraits';
import { enableTracing, disableTracing, getTraces, clearTraces } from '../traceBuffer';

/** Share of committed arrival decisions the goal must win (measured ~0.8 on seed 42). */
const MIN_GOAL_WIN_SHARE = 0.6;

describe('arrival commitment reaches the unified board (THR-1668)', () => {
  afterAll(() => { disableTracing(); clearTraces(); });

  it('a committed goal appears on the board and wins most arrivals — seed 42, 100 ticks', () => {
    resetEventCounter(); resetReputationTraitInit(); clearTraces(); enableTracing();
    const runtime = createSimulationRuntime();
    const preset = MAP_SIZE_PRESETS.medium;
    const archetype = generateArchetypes(4, 42)[0];
    let { state } = initializeGameState(archetype, 'Reach', createBalancedCosmology(), 42, preset.cols, preset.rows);

    let committed = 0;
    let won = 0;
    for (let t = 0; t < 100; t++) {
      state = runTick(state, [], runtime);
      for (const tr of getTraces() as ReadonlyArray<{ category: string; boardTop?: Array<{ id: string; arrivalCommitment?: number }> }>) {
        if (tr.category !== 'decision_board_comparison') continue;
        const goal = tr.boardTop?.find(e => e.arrivalCommitment !== undefined);
        if (!goal) continue;
        committed++;
        if (tr.boardTop![0].id === goal.id) won++;
      }
      clearTraces();
    }

    expect(committed).toBeGreaterThanOrEqual(10);
    expect(won / committed).toBeGreaterThanOrEqual(MIN_GOAL_WIN_SHARE);
  }, 240_000);
});
