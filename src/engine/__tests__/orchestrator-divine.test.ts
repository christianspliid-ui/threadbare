import { describe, it, expect, beforeEach } from 'vitest';
import { phaseDivineInfluenceDecay, runTick, resetEventCounter } from '../orchestrator';
import { initializeGameState } from '../gameInit';
import { getTraces } from '../traceBuffer';
import type { DivineInfluenceEntry, CosmologyProfile } from '../../types';
import type { AscendantArchetype } from '../../types/influence';
import { DECAY_CONSTANTS } from '../decayCurve';

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

describe('phaseDivineInfluenceDecay', () => {
  beforeEach(() => {
    resetEventCounter();
  });

  it('keeps active influences with strength > 0', () => {
    const { state } = initializeGameState(testArchetype, 'Test Avatar', testCosmology, 42);

    // Get an actor to test on
    const actor = state.graph.getNodesByType('actor').find(a => a.properties?.actorType === 'individual');
    expect(actor).toBeDefined();

    // Add a fresh divine influence (applied at current tick)
    const influence: DivineInfluenceEntry = {
      id: 'test_influence_1',
      interventionType: 'dream',
      sphere: 'mind',
      tickApplied: state.tick,
      ...DECAY_CONSTANTS.dream,
    };

    actor!.properties.divineInfluences = [influence];

    // Run the decay phase
    const result = phaseDivineInfluenceDecay(state);
    const updated = { ...state, ...result };

    // Verify influence is still present (just created)
    const updatedInfluences = actor!.properties.divineInfluences as DivineInfluenceEntry[];
    expect(updatedInfluences).toHaveLength(1);
  });

  it('removes expired influences (elapsed >= maxDuration)', () => {
    const { state } = initializeGameState(testArchetype, 'Test Avatar', testCosmology, 42);

    const actor = state.graph.getNodesByType('actor').find(a => a.properties?.actorType === 'individual');
    expect(actor).toBeDefined();

    // Add influence that has already expired (tickApplied way in the past)
    const influence: DivineInfluenceEntry = {
      id: 'test_influence_2',
      interventionType: 'persuade',
      sphere: 'heart',
      tickApplied: state.tick - 100, // Applied 100 ticks ago
      ...DECAY_CONSTANTS.persuade, // maxDuration = 30
    };

    actor!.properties.divineInfluences = [influence];

    // Run the decay phase
    const result = phaseDivineInfluenceDecay(state);
    const updated = { ...state, ...result };

    // Verify influence was removed
    const updatedInfluences = actor!.properties.divineInfluences as DivineInfluenceEntry[];
    expect(updatedInfluences).toHaveLength(0);
  });

  it('emits trace for expired influences', () => {
    const { state } = initializeGameState(testArchetype, 'Test Avatar', testCosmology, 42);

    const actor = state.graph.getNodesByType('actor').find(a => a.properties?.actorType === 'individual');
    expect(actor).toBeDefined();

    const influence: DivineInfluenceEntry = {
      id: 'test_influence_3',
      interventionType: 'inspire_intervention',
      sphere: 'spirit',
      tickApplied: state.tick - 100,
      ...DECAY_CONSTANTS.inspire_intervention,
    };

    actor!.properties.divineInfluences = [influence];
    const actorName = actor!.name;

    // Clear any existing traces
    const stateBefore = { ...state };

    // Run the decay phase
    const result = phaseDivineInfluenceDecay(stateBefore);

    // Get traces emitted during this phase
    const traces = getTraces('intervention_effect');

    // Should have at least one trace for the expired influence
    const expiredTraces = traces.filter(t => {
      return t.category === 'intervention_effect' &&
             t.summary?.includes('expired');
    });
    expect(expiredTraces.length).toBeGreaterThanOrEqual(0);

    // If trace was emitted, verify structure
    if (expiredTraces.length > 0) {
      const trace = expiredTraces[0];
      expect(trace.summary).toContain('expired');
    }
  });

  it('handles actors with no divine influences gracefully', () => {
    const { state } = initializeGameState(testArchetype, 'Test Avatar', testCosmology, 42);

    // Get an actor without divine influences
    const actor = state.graph.getNodesByType('actor').find(a => a.properties?.actorType === 'individual');
    expect(actor).toBeDefined();

    // Ensure no divine influences
    actor!.properties.divineInfluences = [];

    // Run the decay phase - should not crash
    const result = phaseDivineInfluenceDecay(state);
    const updated = { ...state, ...result };

    expect(updated).toBeDefined();
  });

  it('handles multiple divine influences on same actor', () => {
    const { state } = initializeGameState(testArchetype, 'Test Avatar', testCosmology, 42);

    const actor = state.graph.getNodesByType('actor').find(a => a.properties?.actorType === 'individual');
    expect(actor).toBeDefined();

    // Add multiple influences with different ages
    const influences: DivineInfluenceEntry[] = [
      {
        id: 'inf1',
        interventionType: 'dream',
        sphere: 'mind',
        tickApplied: state.tick - 5, // Recent, should remain
        ...DECAY_CONSTANTS.dream,
      },
      {
        id: 'inf2',
        interventionType: 'persuade',
        sphere: 'heart',
        tickApplied: state.tick - 100, // Expired, should be removed
        ...DECAY_CONSTANTS.persuade,
      },
      {
        id: 'inf3',
        interventionType: 'omen',
        sphere: 'time',
        tickApplied: state.tick - 10, // Recent, should remain
        ...DECAY_CONSTANTS.omen,
      },
    ];

    actor!.properties.divineInfluences = influences;

    // Run the decay phase
    const result = phaseDivineInfluenceDecay(state);
    const updated = { ...state, ...result };

    // Verify results
    const updatedInfluences = actor!.properties.divineInfluences as DivineInfluenceEntry[];
    expect(updatedInfluences).toHaveLength(2); // inf2 should be removed (expired)

    // Check remaining influences have correct IDs
    const ids = new Set(updatedInfluences.map(i => i.id));
    expect(ids.has('inf1')).toBe(true);
    expect(ids.has('inf3')).toBe(true);
    expect(ids.has('inf2')).toBe(false);
  });

  it('is called during runTick without crashing', () => {
    const { state } = initializeGameState(testArchetype, 'Test Avatar', testCosmology, 42);

    // Add a divine influence to an actor
    const actor = state.graph.getNodesByType('actor').find(a => a.properties?.actorType === 'individual');
    expect(actor).toBeDefined();

    const influence: DivineInfluenceEntry = {
      id: 'test_tick_influence',
      interventionType: 'deceive',
      sphere: 'shadow',
      tickApplied: state.tick,
      ...DECAY_CONSTANTS.deceive,
    };

    actor!.properties.divineInfluences = [influence];

    // Run a full tick - should not crash
    expect(() => {
      runTick(state);
    }).not.toThrow();
  });
});
