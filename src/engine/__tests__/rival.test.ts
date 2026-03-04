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
import { generateRivals, createRivalState, selectRivalAction, updateRivalState } from '../rival';
import type { CosmologyProfile } from '../../types/index';
import { SPHERE_NAMES } from '../../types/index';

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

describe('rival god generator', () => {
  const playerAlignment: CosmologyProfile = {
    force: 0.05, matter: 0.05, energy: 0.10, life: 0.35,
    mind: 0.10, spirit: 0.25, time: 0.05, entropy: 0.05,
  };

  it('generates 2-4 rivals for a given seed', () => {
    const rivals = generateRivals(playerAlignment, 42);
    expect(rivals.length).toBeGreaterThanOrEqual(2);
    expect(rivals.length).toBeLessThanOrEqual(4);
  });

  it('generates deterministically for the same seed', () => {
    const a = generateRivals(playerAlignment, 42);
    const b = generateRivals(playerAlignment, 42);
    expect(a.length).toBe(b.length);
    for (let i = 0; i < a.length; i++) {
      expect(a[i].name).toBe(b[i].name);
      expect(a[i].behavior).toBe(b[i].behavior);
    }
  });

  it('generates different rivals for different seeds', () => {
    const a = generateRivals(playerAlignment, 42);
    const b = generateRivals(playerAlignment, 999);
    const names_a = a.map(r => r.name).sort();
    const names_b = b.map(r => r.name).sort();
    expect(names_a).not.toEqual(names_b);
  });

  it('rival sphere alignment opposes or is orthogonal to player', () => {
    const rivals = generateRivals(playerAlignment, 42);
    for (const rival of rivals) {
      const playerTop = SPHERE_NAMES.reduce((a, b) =>
        playerAlignment[a] > playerAlignment[b] ? a : b
      );
      const rivalTop = SPHERE_NAMES.reduce((a, b) =>
        rival.sphereAlignment[a] > rival.sphereAlignment[b] ? a : b
      );
      expect(rivalTop).not.toBe(playerTop);
    }
  });

  it('createRivalState returns clean initial state', () => {
    const state = createRivalState('actor_rival_1');
    expect(state.active).toBe(true);
    expect(state.interventionCount).toBe(0);
    expect(state.hostilityToPlayer).toBeGreaterThan(0);
  });
});

describe('rival AI decision loop', () => {
  const rival: RivalDefinition = {
    id: 'actor_rival_1',
    name: 'The Iron Judge',
    sphereAlignment: { force: 0.35, matter: 0.25, energy: 0.10, life: 0.05, mind: 0.05, spirit: 0.05, time: 0.10, entropy: 0.05 },
    behavior: 'aggressive',
    oppositionStrength: 0.8,
    description: 'War god',
    primarySphere: 'force',
    secondarySphere: 'matter',
  };

  it('selectRivalAction returns an action based on behavior archetype', () => {
    const state: RivalState = {
      rivalId: 'actor_rival_1',
      active: true,
      interventionCount: 5,
      agentsControlled: 3,
      regionsInfluenced: ['loc_north'],
      hostilityToPlayer: 0.7,
      ticksSinceAction: 10,
    };
    const action = selectRivalAction(rival, state, 0.5);
    expect(action).toBeDefined();
    expect(action.type).toBeDefined();
    expect(['recruit', 'intervene', 'expand', 'attack', 'wait']).toContain(action.type);
  });

  it('aggressive rivals prefer attack/intervene actions', () => {
    const state: RivalState = {
      rivalId: 'actor_rival_1', active: true,
      interventionCount: 10, agentsControlled: 5,
      regionsInfluenced: ['loc_1', 'loc_2'],
      hostilityToPlayer: 0.9, ticksSinceAction: 5,
    };
    let aggressiveCount = 0;
    for (let i = 0; i < 10; i++) {
      const action = selectRivalAction(rival, state, i / 10);
      if (action.type === 'attack' || action.type === 'intervene') aggressiveCount++;
    }
    expect(aggressiveCount).toBeGreaterThanOrEqual(4);
  });

  it('updateRivalState increments counters', () => {
    let state: RivalState = {
      rivalId: 'actor_rival_1', active: true,
      interventionCount: 0, agentsControlled: 0,
      regionsInfluenced: [], hostilityToPlayer: 0.5,
      ticksSinceAction: 0,
    };
    state = updateRivalState(state, { type: 'intervene', target: 'actor_1' });
    expect(state.interventionCount).toBe(1);
    expect(state.ticksSinceAction).toBe(0);
  });
});
