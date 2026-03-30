import { describe, it, expect } from 'vitest';
import type {
  EncounterStep,
  EncounterStep,
  EncounterOutcome,
  EncounterProgress,
} from '../encounter';
import {
  ENCOUNTER_MAX_STEPS,
  ENCOUNTER_BASE_DIFFICULTY,
  ENCOUNTER_DIFFICULTY_ESCALATION,
  ENCOUNTER_ABANDON_COOLDOWN,
} from '../encounter';

describe('Encounter types', () => {
  it('should export tunable constants', () => {
    expect(ENCOUNTER_MAX_STEPS).toBeGreaterThan(0);
    expect(ENCOUNTER_BASE_DIFFICULTY).toBeGreaterThan(0);
    expect(ENCOUNTER_DIFFICULTY_ESCALATION).toBeGreaterThan(0);
    expect(ENCOUNTER_ABANDON_COOLDOWN).toBeGreaterThan(0);
  });

  it('should allow constructing an EncounterStep', () => {
    const encounter: EncounterStep = {
      id: 'encounter.deep_descent',
      name: 'The Deep Descent',
      locationTypes: ['dungeon', 'cavern'],
      encounters: [],
      reachPrimary: 'iron',
      reachSecondary: 'shadow',
    };
    expect(encounter.id).toBe('encounter.deep_descent');
  });

  it('should allow constructing an EncounterProgress', () => {
    const progress: EncounterProgress = {
      encounterId: 'encounter.deep_descent',
      actorId: 'actor-1',
      currentEncounterIndex: 0,
      history: [],
      status: 'active',
      startedTick: 10,
    };
    expect(progress.status).toBe('active');
  });
});
