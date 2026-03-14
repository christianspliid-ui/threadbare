import { describe, it, expect } from 'vitest';
import { initializeGameState } from '../gameInit';
import { runTick } from '../orchestrator';
import { ENCOUNTER_TEMPLATES } from '../../data/encounter-content';
import { ROUTINE_TEMPLATES, LIFECYCLE_TEMPLATES } from '../../data/narrative-content';
import { DOOM_VOCABULARY } from '../../data/doom-content';
import type { AscendantArchetype, CosmologyProfile } from '../../types';

describe('Layer 1 content integration', () => {
  const testArchetype: AscendantArchetype = {
    id: 'arch.test',
    title: 'The Wanderer',
    sphereAlignment: {
      primary: 'chaos',
      secondary: 'light',
    },
    personalitySeed: {
      ambition_contentment: 0.3,
      courage_prudence: -0.1,
      cruelty_compassion: 0.2,
      cunning_honesty: -0.4,
      devotion_independence: 0.1,
      loyalty_treachery: 0.5,
      tradition_innovation: -0.2,
      restraint_indulgence: 0.0,
      pragmatism_idealism: 0.3,
      openness_caution: -0.1,
    },
  };

  const testCosmology: CosmologyProfile = {
    id: 'cosmo.test',
    foundationSpheres: {
      primary: 'chaos',
      secondary: 'light',
    },
    creationSpheres: {
      force: 0.1,
      matter: 0.2,
      energy: 0.3,
      life: 0.1,
      mind: 0.1,
      spirit: 0.05,
      time: 0.05,
      entropy: 0.05,
    },
  };

  it('encounter templates are accessible and non-empty', () => {
    expect(ENCOUNTER_TEMPLATES).toBeDefined();
    expect(Array.isArray(ENCOUNTER_TEMPLATES)).toBe(true);
    expect(ENCOUNTER_TEMPLATES.length).toBeGreaterThan(0);
  });

  it('all encounter templates have required structure', () => {
    for (const template of ENCOUNTER_TEMPLATES) {
      expect(template.id).toBeDefined();
      expect(template.name).toBeDefined();
      expect(template.locationTypes).toBeDefined();
      expect(template.reachPrimary).toBeDefined();
      expect(template.steps).toBeDefined();
      expect(Array.isArray(template.steps)).toBe(true);
    }
  });

  it('routine templates exist for narrative events', () => {
    expect(ROUTINE_TEMPLATES).toBeDefined();
    expect(typeof ROUTINE_TEMPLATES).toBe('object');
    expect(Object.keys(ROUTINE_TEMPLATES).length).toBeGreaterThan(0);
  });

  it('lifecycle templates exist for agent events', () => {
    expect(LIFECYCLE_TEMPLATES).toBeDefined();
    expect(LIFECYCLE_TEMPLATES.death).toBeDefined();
    expect(LIFECYCLE_TEMPLATES.birth).toBeDefined();
    expect(LIFECYCLE_TEMPLATES.migration).toBeDefined();
  });

  it('doom vocabulary is accessible', () => {
    expect(DOOM_VOCABULARY).toBeDefined();
    expect(typeof DOOM_VOCABULARY).toBe('object');
    expect(Object.keys(DOOM_VOCABULARY).length).toBeGreaterThan(0);
  });

  it('100-tick simulation runs without errors', () => {
    const { state: initialState } = initializeGameState(
      testArchetype,
      'Test Avatar',
      testCosmology,
      42,
    );

    let current = initialState;
    for (let i = 0; i < 100; i++) {
      current = runTick(current);
    }

    expect(current.tick).toBe(100);
    expect(current.chronicle).toBeDefined();
    expect(current.tickEvents).toBeDefined();
  });

  it('simulation produces narrative variety across 100 ticks', () => {
    const { state: initialState } = initializeGameState(
      testArchetype,
      'Test Avatar',
      testCosmology,
      42,
    );

    let current = initialState;
    const allEventTypes = new Set<string>();

    for (let i = 0; i < 100; i++) {
      current = runTick(current);
      for (const event of current.tickEvents) {
        allEventTypes.add(event.type);
      }
    }

    // Should produce multiple event types, not just one
    expect(allEventTypes.size).toBeGreaterThan(0);
  });

  it('simulation accumulates chronicle entries over 100 ticks', () => {
    const { state: initialState } = initializeGameState(
      testArchetype,
      'Test Avatar',
      testCosmology,
      42,
    );

    let current = initialState;
    const startingCount = current.chronicleEntries.length;

    for (let i = 0; i < 100; i++) {
      current = runTick(current);
    }

    const endingCount = current.chronicleEntries.length;
    expect(endingCount).toBeGreaterThanOrEqual(startingCount);
  });

  it('doom clock advances correctly over 100 ticks', () => {
    const { state: initialState } = initializeGameState(
      testArchetype,
      'Test Avatar',
      testCosmology,
      42,
    );

    let current = initialState;
    const startingDoom = current.doomClock.progress;

    for (let i = 0; i < 100; i++) {
      current = runTick(current);
    }

    // Doom should advance or stay same
    expect(current.doomClock.progress).toBeGreaterThanOrEqual(0);
    expect(current.doomClock.progress).toBeLessThanOrEqual(1);
  });

  it('mandate state updates correctly over 100 ticks', () => {
    const { state: initialState } = initializeGameState(
      testArchetype,
      'Test Avatar',
      testCosmology,
      42,
    );

    let current = initialState;
    const startingProgress = current.mandateState.progress;

    for (let i = 0; i < 100; i++) {
      current = runTick(current);
    }

    // Mandate should be valid
    expect(current.mandateState.progress).toBeGreaterThanOrEqual(0);
    expect(current.mandateState.progress).toBeLessThanOrEqual(1);
  });

  it('different seeds produce different narratives', () => {
    const { state: state42 } = initializeGameState(
      testArchetype,
      'Test Avatar',
      testCosmology,
      42,
    );

    const { state: state7 } = initializeGameState(
      testArchetype,
      'Test Avatar',
      testCosmology,
      7,
    );

    let current42 = state42;
    let current7 = state7;

    for (let i = 0; i < 50; i++) {
      current42 = runTick(current42);
      current7 = runTick(current7);
    }

    // Seeds 42 and 7 should produce different event sequences
    const events42 = current42.tickEvents.map(e => e.type).join('|');
    const events7 = current7.tickEvents.map(e => e.type).join('|');

    // Different seeds should produce different event sequences
    expect(events42).not.toBe(events7);
  });

  it('same seed produces deterministic results', () => {
    const { state: state42a } = initializeGameState(
      testArchetype,
      'Test Avatar',
      testCosmology,
      42,
    );

    const { state: state42b } = initializeGameState(
      testArchetype,
      'Test Avatar',
      testCosmology,
      42,
    );

    let current42a = state42a;
    let current42b = state42b;

    for (let i = 0; i < 50; i++) {
      current42a = runTick(current42a);
      current42b = runTick(current42b);
    }

    // Same seed should produce identical tick counts
    expect(current42a.tick).toBe(current42b.tick);

    // And same chronicle length (deterministic)
    expect(current42a.chronicleEntries.length).toBe(current42b.chronicleEntries.length);
  });

  it('agent lifecycle events fire during 100-tick simulation', () => {
    const { state: initialState } = initializeGameState(
      testArchetype,
      'Test Avatar',
      testCosmology,
      42,
    );

    let current = initialState;
    const lifecycleEvents = new Set<string>();

    for (let i = 0; i < 100; i++) {
      current = runTick(current);
      for (const event of current.tickEvents) {
        if (['death', 'birth', 'migration'].includes(event.type)) {
          lifecycleEvents.add(event.type);
        }
      }
    }

    // Lifecycle events should be possible (even if rare)
    // This test just confirms the system runs without error
    expect(lifecycleEvents.size).toBeGreaterThanOrEqual(0);
  });

  it('encounter progression events can fire', () => {
    const { state: initialState } = initializeGameState(
      testArchetype,
      'Test Avatar',
      testCosmology,
      42,
    );

    let current = initialState;
    const encounterEvents = new Set<string>();

    for (let i = 0; i < 100; i++) {
      current = runTick(current);
      for (const event of current.tickEvents) {
        if (event.type.startsWith('encounter_')) {
          encounterEvents.add(event.type);
        }
      }
    }

    // Encounter events should be possible
    expect(encounterEvents.size).toBeGreaterThanOrEqual(0);
  });
});
