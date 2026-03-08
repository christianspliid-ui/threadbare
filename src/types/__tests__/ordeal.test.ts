import { describe, it, expect } from 'vitest';
import type {
  OrdealDefinition,
  EncounterDefinition,
  EncounterOutcome,
  OrdealProgress,
} from '../ordeal';
import {
  ORDEAL_MAX_ENCOUNTERS,
  ORDEAL_BASE_DIFFICULTY,
  ORDEAL_DIFFICULTY_ESCALATION,
  ORDEAL_ABANDON_COOLDOWN,
} from '../ordeal';

describe('Ordeal types', () => {
  it('should export tunable constants', () => {
    expect(ORDEAL_MAX_ENCOUNTERS).toBeGreaterThan(0);
    expect(ORDEAL_BASE_DIFFICULTY).toBeGreaterThan(0);
    expect(ORDEAL_DIFFICULTY_ESCALATION).toBeGreaterThan(0);
    expect(ORDEAL_ABANDON_COOLDOWN).toBeGreaterThan(0);
  });

  it('should allow constructing an OrdealDefinition', () => {
    const ordeal: OrdealDefinition = {
      id: 'ordeal.deep_descent',
      name: 'The Deep Descent',
      locationTypes: ['dungeon', 'cavern'],
      encounters: [],
      reachPrimary: 'iron',
      reachSecondary: 'shadow',
    };
    expect(ordeal.id).toBe('ordeal.deep_descent');
  });

  it('should allow constructing an OrdealProgress', () => {
    const progress: OrdealProgress = {
      ordealId: 'ordeal.deep_descent',
      actorId: 'actor-1',
      currentEncounterIndex: 0,
      history: [],
      status: 'active',
      startedTick: 10,
    };
    expect(progress.status).toBe('active');
  });
});
