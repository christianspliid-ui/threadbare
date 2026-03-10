import { describe, it, expect } from 'vitest';
import type { AscendantArchetype } from '../../types/influence';
import { initializeGameState } from '../gameInit';

describe('GameState actionsInProgress', () => {
  it('initial game state should have empty actionsInProgress array', () => {
    const archetype: AscendantArchetype = {
      id: 'arch.test',
      name: 'Test',
      title: 'The Tester',
      description: 'A test archetype',
      sphereAlignment: { primary: 'force', secondary: 'matter' },
      startingDomainAffinities: {},
      personalitySeed: {
        courage: 0.5,
        prudence: 0.5,
        ambition: 0.5,
        contentment: 0.5,
        cunning: 0.5,
        honesty: 0.5,
        cruelty: 0.5,
        compassion: 0.5,
      },
      flavorText: 'Test flavor',
    };

    const { state } = initializeGameState(archetype, 'Test Avatar', {
      foundation: { chaos: 0.5, light: 0.5 },
      creation: {
        force: 0.1,
        matter: 0.1,
        energy: 0.1,
        life: 0.1,
        mind: 0.1,
        spirit: 0.1,
        time: 0.1,
        entropy: 0.2,
      },
    }, 42);
    expect(state.actionsInProgress).toEqual([]);
  });
});
