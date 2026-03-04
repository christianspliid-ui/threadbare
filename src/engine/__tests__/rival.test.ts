import { describe, it, expect } from 'vitest';
import type {
  RivalArchetype,
  RivalBehavior,
  RivalDefinition,
  RivalState,
} from '../../types/rival';
import type {
  DoomClockArchetype,
  DoomClockStage,
  DoomClockDefinition,
  DoomClockState,
  DoomEscalationEvent,
} from '../../types/doomClock';
import {
  DOOM_CLOCK_ARCHETYPES,
  DOOM_STAGE_NAMES,
} from '../../types/doomClock';

describe('rival god type definitions', () => {
  it('RivalDefinition has correct shape', () => {
    const rival: RivalDefinition = {
      id: 'actor_rival_1',
      name: 'The Iron Judge',
      sphereAlignment: { force: 0.4, matter: 0.3, energy: 0.1, life: 0.05, mind: 0.05, spirit: 0.05, time: 0.025, entropy: 0.025 },
      behavior: 'aggressive',
      oppositionStrength: 0.8,
      description: 'A war-god who values order through might',
    };
    expect(rival.behavior).toBe('aggressive');
  });

  it('RivalState tracks activity correctly', () => {
    const state: RivalState = {
      rivalId: 'actor_rival_1',
      active: true,
      interventionCount: 0,
      agentsControlled: 0,
      regionsInfluenced: [],
      hostilityToPlayer: 0.5,
    };
    expect(state.active).toBe(true);
  });
});

describe('doom clock type definitions', () => {
  it('exports all 7 doom clock archetypes', () => {
    expect(DOOM_CLOCK_ARCHETYPES.length).toBe(7);
    const expected: DoomClockArchetype[] = [
      'breach', 'convergence', 'changing', 'sundering',
      'failing', 'ascension', 'reckoning',
    ];
    expect(DOOM_CLOCK_ARCHETYPES).toEqual(expected);
  });

  it('exports 5 doom stage names', () => {
    expect(DOOM_STAGE_NAMES.length).toBe(5);
  });

  it('DoomClockDefinition has correct shape', () => {
    const clock: DoomClockDefinition = {
      archetype: 'breach',
      totalTicks: 120,
      stages: [
        { stage: 1, name: 'Whispers', tickThreshold: 0.2, events: [] },
        { stage: 2, name: 'Cracks', tickThreshold: 0.4, events: [] },
        { stage: 3, name: 'Tremors', tickThreshold: 0.6, events: [] },
        { stage: 4, name: 'Breaking', tickThreshold: 0.8, events: [] },
        { stage: 5, name: 'The Breach', tickThreshold: 1.0, events: [] },
      ],
    };
    expect(clock.stages.length).toBe(5);
  });
});
