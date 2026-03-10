import { describe, it, expect, beforeEach } from 'vitest';
import type { GameState, ActionInProgress } from '../../types/gameState';
import { initializeGameState } from '../gameInit';
import { phaseActionProgress } from '../orchestrator';
import type { AscendantArchetype } from '../../types/influence';
import { resetEventCounter } from '../orchestrator';

describe('phaseActionProgress', () => {
  let archetype: AscendantArchetype;

  beforeEach(() => {
    resetEventCounter();

    archetype = {
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
  });

  it('should increment progress on active actions', () => {
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

    // Create a mock action in progress (avoid graph edge creation issues for now)
    const action: ActionInProgress = {
      actionId: 'action_1',
      actorId: 'agent.1',
      templateId: 'action.iron.raise-force',
      targetId: 'loc.start',
      domain: 'iron',
      startTick: 0,
      duration: 3,
      progress: 0,
    };

    const stateWithAction: GameState = {
      ...state,
      actionsInProgress: [action],
    };

    const result = phaseActionProgress(stateWithAction);

    expect(result.actionsInProgress).toBeDefined();
    expect(result.actionsInProgress![0].progress).toBe(1);
  });

  it('should resolve completed actions and apply GraphOps', () => {
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

    // Create a mock action at final step (duration = 3, progress = 2)
    const action: ActionInProgress = {
      actionId: 'action_1',
      actorId: 'agent.1',
      templateId: 'action.iron.raise-force',
      targetId: 'loc.start',
      domain: 'iron',
      startTick: 0,
      duration: 3,
      progress: 2,
    };

    const stateWithAction: GameState = {
      ...state,
      actionsInProgress: [action],
    };

    const result = phaseActionProgress(stateWithAction);

    expect(result.actionsInProgress).toBeDefined();
    const completedAction = result.actionsInProgress![0];
    expect(completedAction.resolved).toBe(true);
    expect(completedAction.outcome).toBeDefined();
  });
});
