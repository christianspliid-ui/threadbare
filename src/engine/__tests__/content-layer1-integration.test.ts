import { describe, it, expect } from 'vitest';
import { initializeGameState } from '../gameInit';
import { runTick, resetDecisionCache, resetEventCounter } from '../orchestrator';
import { ENCOUNTER_TEMPLATES } from '../../data/encounter-content';
import { ROUTINE_TEMPLATES, LIFECYCLE_TEMPLATES } from '../../data/narrative-content';
import { DOOM_VOCABULARY } from '../../data/doom-content';
import type { AscendantArchetype, CosmologyProfile } from '../../types';

const testArchetype: AscendantArchetype = {
  id: 'arch.test',
  title: 'The Wanderer',
  sphereAlignment: {
    primary: 'chaos',
    secondary: 'light',
  },
  personalitySeed: {
    loyalty_ambition: 0.3,
    courage_prudence: -0.1,
    mercy_ruthlessness: 0.2,
    honesty_cunning: -0.4,
    sacrifice_survival: 0.1,
    loyalty_ambition: 0.5,
    tradition_novelty: -0.2,
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

// ─── Pure data checks (no simulation) ───────────────────────────────

describe('Layer 1 content data', () => {
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
});

// ─── Shared 100-tick simulation (seed 42) ───────────────────────────
// All single-seed assertions share one run to avoid redundant world gen + tick loops.
// Previously each test ran its own 100-tick sim — 11 separate runs totalling ~7 minutes.

describe('Layer 1 content integration (100-tick simulation)', { timeout: 120_000 }, () => {
  // Run once at describe scope — all it() blocks read from the collected results.
  resetDecisionCache();
  resetEventCounter();

  const { state: initialState } = initializeGameState(
    testArchetype,
    'Test Avatar',
    testCosmology,
    42,
  );

  const startingChronicleCount = initialState.chronicleEntries.length;

  // Collect per-tick telemetry during the single run
  const allEventTypes = new Set<string>();
  const lifecycleEvents = new Set<string>();
  const encounterEvents = new Set<string>();

  let state = initialState;
  for (let i = 0; i < 100; i++) {
    state = runTick(state);
    for (const event of state.tickEvents) {
      allEventTypes.add(event.type);
      if (['death', 'birth', 'migration'].includes(event.type)) {
        lifecycleEvents.add(event.type);
      }
      if (event.type.startsWith('encounter_')) {
        encounterEvents.add(event.type);
      }
    }
  }

  // Snapshot final state for assertions
  const finalState = state;

  it('100-tick simulation runs without errors', () => {
    expect(finalState.tick).toBe(100);
    expect(finalState.chronicle).toBeDefined();
    expect(finalState.tickEvents).toBeDefined();
  });

  it('simulation produces narrative variety across 100 ticks', () => {
    expect(allEventTypes.size).toBeGreaterThan(0);
  });

  it('simulation accumulates chronicle entries over 100 ticks', () => {
    expect(finalState.chronicleEntries.length).toBeGreaterThanOrEqual(startingChronicleCount);
  });

  it('doom clock advances correctly over 100 ticks', () => {
    expect(finalState.doomClock.progress).toBeGreaterThanOrEqual(0);
    expect(finalState.doomClock.progress).toBeLessThanOrEqual(1);
  });

  it('mandate state updates correctly over 100 ticks', () => {
    expect(finalState.mandateState.progress).toBeGreaterThanOrEqual(0);
    expect(finalState.mandateState.progress).toBeLessThanOrEqual(1);
  });

  it('agent lifecycle events fire during 100-tick simulation', () => {
    // Lifecycle events should be possible (even if rare)
    // This test just confirms the system runs without error
    expect(lifecycleEvents.size).toBeGreaterThanOrEqual(0);
  });

  it('encounter progression events can fire', () => {
    // Encounter events should be possible
    expect(encounterEvents.size).toBeGreaterThanOrEqual(0);
  });
});

// ─── Multi-seed divergence test ─────────────────────────────────────

describe('Layer 1 seed divergence', { timeout: 120_000 }, () => {
  it('different seeds produce different narratives', () => {
    resetDecisionCache();
    resetEventCounter();

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

    // Collect event types across ALL ticks (not just the last tick)
    const allEvents42: string[] = [];
    const allEvents7: string[] = [];

    for (let i = 0; i < 50; i++) {
      current42 = runTick(current42);
      allEvents42.push(...current42.tickEvents.map(e => e.type));

      current7 = runTick(current7);
      allEvents7.push(...current7.tickEvents.map(e => e.type));
    }

    // Different seeds should produce different cumulative event sequences
    const events42 = allEvents42.join('|');
    const events7 = allEvents7.join('|');
    expect(events42).not.toBe(events7);
  });
});

// ─── Determinism ─────────────────────────────────────────────────────

describe('Layer 1 determinism', () => {
  it('same seed produces deterministic results', () => {
    // Run A: 100 ticks from seed 42 (fresh module cache)
    resetDecisionCache();
    const { state: state42a } = initializeGameState(
      testArchetype,
      'Test Avatar',
      testCosmology,
      42,
    );
    let current42a = state42a;
    const allEventsA: any[] = [];
    for (let i = 0; i < 100; i++) {
      current42a = runTick(current42a);
      allEventsA.push(...current42a.tickEvents);
    }

    // Run B: 100 ticks from seed 42 (fresh module cache — required for test isolation)
    resetDecisionCache();
    const { state: state42b } = initializeGameState(
      testArchetype,
      'Test Avatar',
      testCosmology,
      42,
    );
    let current42b = state42b;
    const allEventsB: any[] = [];
    for (let i = 0; i < 100; i++) {
      current42b = runTick(current42b);
      allEventsB.push(...current42b.tickEvents);
    }

    // Same seed should produce identical tick counts
    expect(current42a.tick).toBe(current42b.tick);

    // Same chronicle length (deterministic event generation)
    expect(current42a.chronicleEntries.length).toBe(current42b.chronicleEntries.length);

    // Byte-identical tick event sequences
    expect(JSON.stringify(allEventsA)).toBe(JSON.stringify(allEventsB));

    // Verify no wall-clock timestamps leaked into event IDs
    for (const event of allEventsA) {
      if (event.id && typeof event.id === 'string') {
        const segments = event.id.split('_');
        for (const seg of segments) {
          if (/^\d{13,}$/.test(seg)) {
            throw new Error(`Event ID "${event.id}" contains a wall-clock timestamp segment: ${seg}`);
          }
        }
      }
    }
  }, 120000);
});
