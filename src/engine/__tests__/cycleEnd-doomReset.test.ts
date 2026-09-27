/**
 * THR-1642 — a new cycle must not inherit the expired doom clock.
 *
 * Cold playtest round 1: the world reached "The Unmaking", harvested, and cycle 2
 * ended seconds later. `transitionToNewCycle` spread `...state` without replacing
 * `doomClock`, so the next cycle began with `expired === true` and the first
 * `playing` tick's `phaseDoomExpiry` threw it straight back into twilight.
 */
import { describe, it, expect } from 'vitest';
import { transitionToNewCycle } from '../cycleEnd';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { runTick } from '../orchestrator';
import { createBalancedCosmology } from '../cosmology';
import { generateArchetypes } from '../ascendant';
import { createSimulationRuntime } from '../simulationRuntime';
import { DEFAULT_DOOM_TICKS } from '../../data/game-config';
import type { GameState } from '../../types/gameState';

const SEED = 42;

function expiredEndOfCycleState(): GameState {
  const archetype = generateArchetypes(4, SEED)[0];
  const preset = MAP_SIZE_PRESETS.small;
  const init = initializeGameState(
    archetype, 'doom-reset', createBalancedCosmology(), SEED, preset.cols, preset.rows,
  );
  const s = init.state;
  return {
    ...s,
    tick: 250,
    phase: 'harvest',
    doomClock: {
      ...s.doomClock,
      currentTick: s.doomClock.totalTicks,
      progress: 1,
      currentStage: 5,
      stageTransitions: [0, 50, 100, 150, 180],
      expired: true,
      tickModifier: 1.5,
      counterOmens: 2,
    },
    doomIdentityMatrix: s.doomIdentityMatrix
      ? {
          ...s.doomIdentityMatrix,
          identityMilestones: s.doomIdentityMatrix.identityMilestones.map(m => ({
            ...m,
            triggered: true,
          })),
        }
      : s.doomIdentityMatrix,
  };
}

describe('transitionToNewCycle resets the doom clock (THR-1642)', () => {
  it('starts the next cycle with a fresh, unexpired clock of the same archetype', () => {
    const ended = expiredEndOfCycleState();
    const next = transitionToNewCycle(ended, [], [], 'A somber age.');

    expect(next.cycle).toBe(ended.cycle + 1);
    expect(next.doomClock.expired).toBe(false);
    expect(next.doomClock.currentTick).toBe(0);
    expect(next.doomClock.progress).toBe(0);
    expect(next.doomClock.currentStage).toBe(1);
    expect(next.doomClock.tickModifier).toBe(1);
    expect(next.doomClock.totalTicks).toBe(DEFAULT_DOOM_TICKS);
    expect(next.doomClock.definitionArchetype).toBe(ended.doomDefinition.archetype);
    expect(next.doomDefinition.archetype).toBe(ended.doomDefinition.archetype);
    expect(next.doomDefinition.totalTicks).toBe(DEFAULT_DOOM_TICKS);
  });

  it('clears fired identity milestones without mutating the previous cycle', () => {
    const ended = expiredEndOfCycleState();
    const next = transitionToNewCycle(ended, [], [], 'A somber age.');

    const milestones = next.doomIdentityMatrix?.identityMilestones ?? [];
    expect(milestones.every(m => m.triggered === false)).toBe(true);
    // The ended state's flags are untouched — the reset copies, never mutates.
    const prior = ended.doomIdentityMatrix?.identityMilestones ?? [];
    expect(prior.every(m => m.triggered === true)).toBe(true);
  });

  it('a playing tick after the transition stays playing instead of re-entering twilight', () => {
    const ended = expiredEndOfCycleState();
    const next = transitionToNewCycle(ended, [], [], 'A somber age.');
    // Mirrors useSimulation.handleBeginNextCycle, which flips the phase to playing.
    const after = runTick({ ...next, phase: 'playing' }, [], createSimulationRuntime());

    expect(after.phase).toBe('playing');
    expect(after.doomClock.expired).toBe(false);
    expect(after.tickEvents.some(e => e.message === 'The Unmaking begins. The world trembles.'))
      .toBe(false);
  });
});
