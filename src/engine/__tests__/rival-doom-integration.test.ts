import { describe, it, expect } from 'vitest';
import { generateRivals, createRivalState, selectRivalAction, updateRivalState } from '../rival';
import { generateDoomClock, createDoomClockState, advanceDoomClock, accelerateDoomClock } from '../doomClock';
import type { CosmologyProfile } from '../../types/index';

describe('Rival + Doom Clock integration', () => {
  const playerAlignment: CosmologyProfile = {
    force: 0.05, matter: 0.05, energy: 0.10, life: 0.35,
    mind: 0.10, spirit: 0.25, time: 0.05, entropy: 0.05,
  };

  it('full run simulation: rivals act and doom clock advances', () => {
    // Generate rivals
    const rivals = generateRivals(playerAlignment, 42);
    expect(rivals.length).toBeGreaterThanOrEqual(2);

    // Generate doom clock
    const _doomDef = generateDoomClock('breach', 50, 42);
    let doomState = createDoomClockState('breach', 50);

    // Initialize rival states
    let rivalStates = rivals.map(r => createRivalState(r.id));

    // Simulate 50 ticks
    for (let tick = 0; tick < 50; tick++) {
      // Each rival acts
      for (let i = 0; i < rivals.length; i++) {
        const action = selectRivalAction(rivals[i], rivalStates[i], (tick * 7 + i * 13) % 100 / 100);
        rivalStates[i] = updateRivalState(rivalStates[i], action);

        // Aggressive rivals accelerate doom clock
        if (action.type === 'attack') {
          doomState = accelerateDoomClock(doomState, 0.02);
        }
      }

      // Advance doom clock
      doomState = advanceDoomClock(doomState);
    }

    // Doom clock should have expired (50 ticks, possibly accelerated)
    expect(doomState.expired).toBe(true);
    expect(doomState.currentStage).toBe(5);

    // Rivals should have accumulated activity
    for (const state of rivalStates) {
      expect(state.interventionCount + state.agentsControlled).toBeGreaterThan(0);
    }
  });
});
